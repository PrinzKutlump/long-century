"use strict";
/* A1: one actor-aware command path (execCommand). Human (through the applyCampaignCommand wrapper), AI (aiOrder) and
 * scenario (execCommand with an explicit actor and serial) actors must get the same outcome for the same authorised order;
 * rejected, stale, duplicate and replayed orders must change nothing. Material state is compared with the A0 digest
 * (tools/a0_lib.js: treasuries, pools, pops, factories, projects, prices, wars, ownership, RNG word). */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const L = require("./tools/a0_lib");

let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };

const TAGS = ["GBR", "PUN", "SWI"];
const API_EXTRA = `;globalThis.API.X={execCommand,aiOrder,applyCampaignCommand,issueCampaignCommand,commandFunds,BLD,RECIPE,bldActive,buildSlots,G:()=>G};`;
const fresh = (seat, seed = 7) => { const A = L.loadEngine(API_EXTRA); A.newGame(null, seed); A.getG().player = seat || null; return A; }; /* as the A0 harness: one initial world, only the seat differs */

/* choose, once, an authorised order of each kind for each tag (engines are deterministic, so it holds in every copy) */
function authorised(A, tag, kind) {
 const c = A.getG().c[tag];
 for (const p of A.provsOf(tag)) {
  if (kind === "rail" && A.railCan(c, p).ok) return { kind, province: p.id };
  if (kind === "factory") for (const g of Object.keys(A.X.RECIPE)) if (A.facCan(c, p, g).ok) return { kind, province: p.id, good: g };
  if (kind === "building" || kind === "queue") for (const b of Object.keys(A.X.BLD)) if (A.bldCan(c, p, b).ok) return { kind, province: p.id, building: b };
 }
 return null;
}
const digest = A => L.sha(A.full());
const projects = A => A.getG().plist.reduce((n, p) => n + p.build.length, 0) + A.provsOf("GBR").length * 0;
const queueLen = (A, tag) => (A.getG().c[tag].bq || []).length;

/* 1. same authorised order from human, AI and scenario actors: same material outcome */
for (const kind of ["rail", "factory", "building", "queue"]) {
 let used = 0;
 for (const tag of TAGS) {
  const probe = fresh(tag), cmd = authorised(probe, tag, kind);
  if (!cmd) continue;
  used++;
  const human = fresh(tag), ai = fresh(null), scenario = fresh("GBR" === tag ? "PUN" : "GBR");
  const base = digest(human);
  const rh = human.X.applyCampaignCommand({ ...human.X.issueCampaignCommand(), ...cmd });
  const ra = ai.X.aiOrder(ai.getG().c[tag], cmd);
  const rs = scenario.X.execCommand(tag, { ...scenario.X.issueCampaignCommand(tag), ...cmd });
  check(rh.ok && ra.ok && rs.ok, kind + " " + tag + ": accepted by human, AI and scenario (" + (cmd.building || cmd.good || cmd.province) + ")");
  check(digest(human) !== base, kind + " " + tag + ": the order changed material state");
  check(digest(human) === digest(ai) && digest(ai) === digest(scenario), kind + " " + tag + ": identical material state afterwards");
  check(human.getG().commandSerial === 1 && scenario.getG().actorSerial[tag] === 1 && scenario.getG().commandSerial === undefined,
   kind + " " + tag + ": human serial is G.commandSerial, other actors use G.actorSerial[tag], AI leaves no serial");
 }
 check(used > 0, kind + ": at least one authorised order found to test");
}

/* 2. rejected orders change nothing (including the serial) */
{
 const A = fresh("GBR"), G = A.getG(), c = G.c.GBR, X = A.X;
 const ok = authorised(A, "GBR", "rail"), other = A.provsOf("FRA")[0];
 const bad = {
  "province of another nation": { ...X.issueCampaignCommand(), kind: "rail", province: other.id },
  "unknown province": { ...X.issueCampaignCommand(), kind: "rail", province: "NOPE" },
  "unknown kind": { ...X.issueCampaignCommand(), kind: "nothing", province: ok.province },
  "unknown factory type": { ...X.issueCampaignCommand(), kind: "factory", province: ok.province, good: "__proto__" },
  "unknown building": { ...X.issueCampaignCommand(), kind: "building", province: ok.province, building: "constructor" },
  "missing queue item": { ...X.issueCampaignCommand(), kind: "queueRemove", id: "q999" },
  "stale month": { ...X.issueCampaignCommand(), month: G.t - 1, kind: "rail", province: ok.province },
  "future serial": { ...X.issueCampaignCommand(), serial: 5, kind: "rail", province: ok.province },
  "non-object": null
 };
 for (const [name, cmd] of Object.entries(bad)) {
  const before = digest(A), serial = G.commandSerial || 0, n = projects(A);
  const r = X.applyCampaignCommand(cmd);
  check(r.ok === false && digest(A) === before && (G.commandSerial || 0) === serial && projects(A) === n, "rejected (" + name + "): nothing changed");
 }
 /* a foreign actor cannot order in our province, and an unknown or dead actor cannot order at all */
 const before = digest(A);
 check(X.execCommand("FRA", { ...X.issueCampaignCommand("FRA"), kind: "rail", province: ok.province }).ok === false &&
  X.execCommand("ZZZ", { month: G.t, serial: 1, kind: "rail", province: ok.province }).ok === false && digest(A) === before &&
  G.actorSerial === undefined, "rejected (foreign actor, unknown actor): nothing changed, no serial created");
 /* an unauthorised AI order is refused too */
 check(X.aiOrder(G.c.FRA, { kind: "rail", province: ok.province }).ok === false && digest(A) === before, "rejected (AI ordering in a province it does not hold): nothing changed");
 /* insufficient funds are rejected before any mutation, and the bill is the boundary */
 const cmd = { kind: "rail", province: ok.province };
 const bill = X.commandFunds(c, "rail", A.P(ok.province), cmd);
 check(bill > 0, "the first month's bill for a railway is positive (" + Math.round(bill) + ")");
 c.tr = bill - 1;
 const b2 = digest(A), s2 = G.commandSerial || 0;
 const r2 = X.applyCampaignCommand({ ...X.issueCampaignCommand(), ...cmd });
 check(r2.ok === false && /treasury/.test(r2.why) && digest(A) === b2 && (G.commandSerial || 0) === s2, "insufficient funds: railway rejected before mutation, serial not consumed");
 const fcmd = authorised(A, "GBR", "factory"), bq = X.aiOrder(c, { kind: "rail", province: ok.province });
 check(bq.ok === false && digest(A) === b2, "insufficient funds: the same holds for an AI order");
 c.tr = 0;
 const b3 = digest(A);
 check(X.applyCampaignCommand({ ...X.issueCampaignCommand(), kind: "building", province: ok.province, building: authorised(A, "GBR", "building").building }).ok === false && digest(A) === b3,
  "insufficient funds: building rejected with an empty treasury");
 c.tr = bill;
 const r3 = X.applyCampaignCommand({ ...X.issueCampaignCommand(), ...cmd });
 check(r3.ok && G.commandSerial === s2 + 1, "exactly the first month's bill is enough");
 if (fcmd) { c.tr = 0; const b4 = digest(A); check(X.applyCampaignCommand({ ...X.issueCampaignCommand(), ...fcmd }).ok === false && digest(A) === b4, "insufficient funds: factory rejected with an empty treasury"); }
 /* queueing spends nothing, so an empty treasury may still queue */
 const q = authorised(A, "GBR", "queue");
 check(q && X.applyCampaignCommand({ ...X.issueCampaignCommand(), ...q }).ok && queueLen(A, "GBR") === 1, "queueing needs no funds");
}

/* 3. duplicate, double-tapped and replayed orders do not spend twice */
{
 const A = fresh("GBR"), G = A.getG(), X = A.X, c = G.c.GBR;
 const cmd = { ...X.issueCampaignCommand(), ...authorised(A, "GBR", "rail") };
 const n0 = projects(A), r1 = X.applyCampaignCommand(cmd);
 const after1 = digest(A), n1 = projects(A);
 const r2 = X.applyCampaignCommand(cmd), r3 = X.applyCampaignCommand({ ...cmd });
 check(r1.ok && !r2.ok && !r3.ok && n1 === n0 + 1 && projects(A) === n1 && digest(A) === after1, "double-tapped order (same month and serial) starts one project and changes nothing the second time");
 /* the next order, with the next serial, is a new order */
 const next = authorised(A, "GBR", "building");
 check(X.applyCampaignCommand({ ...X.issueCampaignCommand(), ...next }).ok && G.commandSerial === 2, "the next serial is accepted");
 /* scenario actor: duplicate serial */
 const S = fresh(null), SX = S.X, SG = S.getG();
 const sc = { ...SX.issueCampaignCommand("GBR"), ...authorised(S, "GBR", "rail") };
 const s1 = SX.execCommand("GBR", sc), sd = digest(S), s2 = SX.execCommand("GBR", sc);
 check(s1.ok && !s2.ok && digest(S) === sd && SG.actorSerial.GBR === 1, "scenario actor: duplicate serial rejected, serial high-water mark kept");
 /* stale month: an order built this month is dead next month */
 const stale = { ...SX.issueCampaignCommand("PUN"), ...authorised(S, "PUN", "rail") };
 S.monthTick();
 const sb = digest(S);
 check(SX.execCommand("PUN", stale).ok === false && digest(S) === sb, "stale month: order issued before the month closed is rejected and changes nothing");
 /* month order is also required of the scenario serial */
 check(SX.execCommand("GBR", { ...SX.issueCampaignCommand("GBR"), serial: 5, kind: "rail", province: authorised(S, "GBR", "rail").province }).ok === false, "scenario actor: serial gap rejected");
}

/* 4. replay after save/load (the built game, real pack/unpack) */
{
 const html = fs.readFileSync("dist/long-century.html", "utf8");
 const nodes = new Map();
 const context = vm.createContext({ console, performance, setInterval: () => 1, clearInterval: () => {}, window: { addEventListener() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild(n) { nodes.set("#" + n.id, n); } } } });
 vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1], context);
 vm.runInContext(L.API_SOURCE + API_EXTRA, context);
 const run = s => vm.runInContext(s, context);
 run(`newGame("GBR",7);G.c.GBR.ai=false;`);
 const out = run(`(()=>{
  const A=globalThis.API,X=A.X,c=G.c.GBR;
  const p=provsOf("GBR").find(p=>railCan(c,p).ok),q=provsOf("GBR").find(p=>p.id!==p.id);
  const cmd={...X.issueCampaignCommand(),kind:"rail",province:p.id};
  const r1=X.applyCampaignCommand(cmd);
  const text=pack();
  unpack(text);
  const c2=G.c.GBR,n=provsOf("GBR").reduce((n,p)=>n+p.build.length,0),tr=c2.tr,serial=G.commandSerial,before=A.full();
  const r2=X.applyCampaignCommand(cmd);
  const same=A.full()===before,n2=provsOf("GBR").reduce((n,p)=>n+p.build.length,0);
  /* scenario actor survives the same boundary */
  const st=["PUN","SWI","FRA","RUS"].find(t=>provsOf(t).some(p=>railCan(G.c[t],p).ok));
  const sc={...X.issueCampaignCommand(st),kind:"rail",province:provsOf(st).find(p=>railCan(G.c[st],p).ok).id};
  const s1=X.execCommand(st,sc);unpack(pack());const sb=A.full();const s2=X.execCommand(st,sc);
  /* a save from before A1 has no actorSerial: the first accepted order after reload still works (G.commandSerial path) */
  
  return {r1:r1.ok,r2:r2.ok,same,n,n2,tr,serial,trAfter:G.c.GBR.tr,s1:s1.ok,s2:s2.ok,sameS:A.full()===sb,actor:G.actorSerial&&G.actorSerial[st],
   next:X.applyCampaignCommand({...X.issueCampaignCommand(),kind:"building",province:p.id,building:Object.keys(BLD).find(b=>bldCan(G.c.GBR,p,b).ok)||"x"}).ok||"nobuild"};
 })()`);
 check(out.r1 && !out.r2 && out.same && out.n === out.n2 && out.serial === 1 && out.tr === out.trAfter, "replaying the last accepted order after save and load is rejected and harmless");
 check(out.s1 && !out.s2 && out.sameS && out.actor === 1, "a scenario actor's serial survives save and load, and its replay is rejected");
 /* old saves carry no actorSerial: they load with defaults and accept orders (human serial continues from commandSerial) */
 context.oldSave = fs.readFileSync("testdata/prev_build_save.txt", "utf8").trim();
 const legacy = run(`(()=>{unpack(oldSave);const X=globalThis.API.X;const hv=G.player&&G.c[G.player];const other=Object.keys(G.c).find(t=>G.c[t].alive&&t!==G.player);
  return {noMap:G.actorSerial===undefined,human:X.issueCampaignCommand().serial===(G.commandSerial||0)+1,actor:X.issueCampaignCommand(other).serial===1,month:X.issueCampaignCommand().month===G.t};})()`);
 check(legacy.noMap && legacy.human && legacy.actor && legacy.month, "legacy save (no actorSerial) loads with defaults: serials continue, actors start at 1");
 check(out.next === true || out.next === "nobuild", "the next order after reload is accepted");
}

if (failed) { console.log("FAIL test_commands: " + failed + " check(s) failed"); process.exit(1); }
console.log("test_commands: all checks passed");
