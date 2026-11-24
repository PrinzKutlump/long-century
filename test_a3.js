"use strict";
/* A3: the human decision points that replaced seat exclusions. italy3 and germany4 fire for every seat; a human party gets the renewal
 * as a card whose default has exactly the AI's result; a human third party that history calls into a war is asked (default: joins, like the AI);
 * 'no' leaves the world as the old human exclusion did. Uses the engine without the UI. */
const loadTestEngine = require("./load_test_engine");
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };

const API = `globalThis.API={newGame,getG:()=>G,EVENTS,eventsMonth,cardDefault,cardChoose,ev,pullIn,humanSeat,declareWar,P,alive,toAnnex,plebiscite};`;
function world(seat, setup) {
 const scope = loadTestEngine(API), A = scope.API;
 A.newGame(null, 7);
 const G = A.getG();
 G.player = seat; if (seat) G.c[seat].ai = false; /* a real human: control flag off */
 setup(A, G);
 return { A, G };
}
const warsOf = G => G.wars.map(w => [w.att.join(","), w.def.join(","), w.goal.k, w.goal.prov || "", w.ws].join("|")).sort().join(";");
const state = G => warsOf(G) + "#" + G.seed + "#" + JSON.stringify(G.evWait || {}) + "#" + JSON.stringify(G.ev);
const only = (A, ...ids) => { const es = ids.map(id => A.ev(id)); A.EVENTS.length = 0; A.EVENTS.push(...es); };
function resolve(A, G) { A.eventsMonth(); const asked = G.card ? { kind: G.card.kind, id: G.card.id, def: G.card.def, opts: G.card.opts.map(o => o.k) } : null; while (G.card) A.cardDefault(); return asked; }

function italySetup(A, G) {
 only(A, "italy3", "italy1");
 G.t = (1866 - 1836) * 12; G.ev = { italy1: 1 }; G.wars = [];
 for (const t in G.c) { G.c[t].war = []; G.c[t].truce = {}; }
 G.c.SAR.civ = 1; G.unif = {};
 G.plist.find(p => p.id === "LOM").o = "AUS";
}
function germanySetup(A, G) {
 only(A, "germany4", "germany2");
 G.t = (1872 - 1836) * 12; G.ev = { germany2: 1 }; G.wars = []; G.unif = {};
 for (const t in G.c) { G.c[t].war = []; G.c[t].truce = {}; }
}
for (const [name, setup, parties] of [["italy3", italySetup, ["SAR", "AUS"]], ["germany4", germanySetup, ["PRU", "AUS"]]]) {
 const base = world(null, setup); const asked0 = resolve(base.A, base.G); const ref = state(base.G);
 check(base.G.wars.length >= 1 && base.G.wars.some(w => w.att[0] === parties[0] && w.def[0] === parties[1]), name + ": the AI renews the war (nobody is human)");
 check(asked0 === null, name + ": nobody is asked when nobody is human");
 const observer = world("GBR", setup); observer.G.c.GBR.ai = true; resolve(observer.A, observer.G);
 check(state(observer.G) === ref, name + ": an observer seat that is not a party gives the identical result");
 for (const seat of parties) {
  const w = world(seat, setup); const asked = resolve(w.A, w.G);
  check(asked && asked.id === name && asked.def && asked.opts.length >= 2, name + ": human " + seat + " gets a card (" + (asked && asked.opts.join("/")) + ", default " + (asked && asked.def) + ")");
  check(state(w.G) === ref, name + ": human " + seat + " taking the default gives the identical wars, RNG word and event record as the AI");
 }
}
/* a human who declines: the AI path never does this, the world is as the old exclusion left it (no war) and the event is postponed */
{
 const w = world("SAR", italySetup); w.A.eventsMonth();
 w.A.cardChoose("wait");
 check(w.G.wars.length === 0 && w.G.evWait && w.G.evWait.italy3 > w.G.t, "italy3: SAR choosing to wait starts no war and postpones the event");
}
/* a human third party called into a war is asked; the default joins, exactly as the AI does */
for (const seat of [null, "FRA"]) {
 const w = world(seat, (A, G) => { G.wars = []; for (const t in G.c) { G.c[t].war = []; G.c[t].truce = {}; } });
 const G = w.G, war = w.A.declareWar("SAR", "AUS", { k: "conquer", tag: "AUS", prov: "LOM", hist: 1 });
 w.A.pullIn(war, "FRA", 1);
 const asked = !!G.card;
 check(asked === (seat === "FRA"), "pullIn: " + (seat ? "human FRA is asked" : "nobody is asked"));
 while (G.card) w.A.cardDefault();
 check(war.att.includes("FRA"), "pullIn: FRA is in the war on side 1 after the default (" + (seat || "AI") + ")");
}
{
 const w = world("FRA", (A, G) => { G.wars = []; for (const t in G.c) { G.c[t].war = []; G.c[t].truce = {}; } });
 const war = w.A.declareWar("SAR", "AUS", { k: "conquer", tag: "AUS", prov: "LOM", hist: 1 });
 w.A.pullIn(war, "FRA", 1); w.A.cardChoose("no");
 check(!war.att.includes("FRA") && !w.G.c.FRA.war.includes(war.id), "pullIn: a human who stays out stays out");
}
/* annexation of a human nation asks first */
{
 const w = world("BAV", () => {});
 w.A.toAnnex("PRU", "BAV");
 check(!!w.G.card && w.A.alive("BAV"), "toAnnex: a human state is asked and not yet annexed");
 w.A.cardChoose("no"); check(w.A.alive("BAV") && w.G.c.BAV.alive, "toAnnex: refusing keeps the state");
 const a = world(null, () => {}); a.A.toAnnex("PRU", "BAV");
 check(!a.G.c.BAV.alive || a.A.getG().plist.filter(p => p.o === "BAV").length === 0, "toAnnex: an AI state is annexed at once");
}
process.exitCode = failed ? 1 : 0;
