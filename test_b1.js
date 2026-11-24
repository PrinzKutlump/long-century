"use strict";
/* B1: grain freight graph. One coastal supplier, two competing destinations, one shared link. Quantities, freight and tariff receipts reconcile;
 * closing the link changes deliveries and price exposure, including the inland buyer. Same matching rules for any nation. Uses the engine without the UI. */
const loadTestEngine = require("./load_test_engine");
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e * Math.max(1, Math.abs(a), Math.abs(b));

const scope = loadTestEngine(`globalThis.API={newGame,getG:()=>G,P,freightGraph,freightFrame,freightEdge,freightTree,freightPath,freightMatch,freightTotals,freightMonth,monthTick};`);
const A = scope.API;
A.newGame(null, 7);
const G = A.getG();
const fresh = () => { for (const p of G.plist) { p.ctl = p.o; } G.freightClosed = {}; for (const t in G.c) G.c[t].war = []; };
fresh();

/* find a coastal supplier S, a first link E out of S, and two buyers (one inland) whose cheapest routes both cross E */
const F0 = A.freightFrame({});
const { edges } = A.freightGraph();
let pick = null;
for (const s of G.plist.filter(p => p.sea && p.o).sort((a, b) => a.id < b.id ? -1 : 1)) {
 const t = A.freightTree(s.id, s.o, F0), byFirst = {};
 for (const q of G.plist) {
  if (q.id === s.id || !q.o || t.dist(q.id) == null) continue;
  const path = A.freightPath(t, q.id); if (path.length < 2 || path.length > 4) continue;
  (byFirst[path[0][0]] = byFirst[path[0][0]] || []).push(q);
 }
 for (const e in byFirst) {
  const inl = byFirst[e].filter(q => !q.sea && q.o !== s.o), cst = byFirst[e].filter(q => q.o !== s.o && q.id !== (inl[0] || {}).id);
  if (inl.length && cst.length) { pick = { s, e, b1: inl[0], b2: cst[0] }; break; }
 }
 if (pick) break;
}
check(!!pick, "found a supplier with two buyers behind one shared first link");
const { s, e, b1, b2 } = pick;
console.log(`     supplier ${s.id} (${s.o}) link ${e} buyers ${b1.id} (${b1.o}, inland) and ${b2.id} (${b2.o})`);
G.c[b1.o].tariff = .2; G.c[b2.o].tariff = .1; G.c[s.o].sphere = null;
const price = 10, sellers = [{ id: s.id, tag: s.o, qty: 5000 }], buyers = [{ id: b1.id, tag: b1.o, qty: 300 }, { id: b2.id, tag: b2.o, qty: 300 }];
/* the supplier's only outlet is the shared link: its other edges are shut (the real map has alternatives, which the monthly path uses) */
const others = {}; for (const id of A.freightGraph().nb[s.id]) if (id !== e) others[id] = 1;
const run = closed => A.freightMatch(sellers, buyers, [], { price, exposure: true, closed: { ...others, ...closed } });
const open = run({});
const cap = A.freightEdge(edges[e]).cap;
const T = A.freightTotals(open.receipts);
const total = open.receipts.reduce((a, r) => a + r.qty, 0);
check(near(open.used[e], cap), `the shared link is exhausted (${open.used[e].toFixed(1)} of ${cap})`);
check(total <= cap + 1e-6 && total > 0 && open.unmet[b1.id] + open.unmet[b2.id] > 0, `competing buyers cannot both be filled (${total.toFixed(1)} delivered, ${(open.unmet[b1.id] + open.unmet[b2.id]).toFixed(1)} unmet)`);
check(open.receipts.every(r => r.path.includes(e)), "every delivery crossed the shared link");
check(near(total, open.delivered[b1.id] + open.delivered[b2.id]), "deliveries by buyer add up to receipts");
check(near(open.unsold[s.id], 5000 - total), "the supplier's unsold grain is what was not shipped");
/* capacity is applied once: no edge carries more than its capacity */
check(Object.keys(open.used).every(id => open.used[id] <= A.freightEdge(edges[id]).cap + 1e-6), "no edge exceeds its capacity");
/* reconciliation: buyers paid = seller base + controllers' freight + buyer treasuries' tariff */
check(near(T.base, price * total), "seller receipts equal quantity times price");
check(near(Object.values(T.byController).reduce((a, b) => a + b, 0), T.freight), "freight booked to controllers equals freight charged");
check(near(T.tariff, open.receipts.reduce((a, r) => a + r.base * (G.c[r.buyer].tariff), 0)), "tariff receipts equal base value times each buyer's rate, once per delivery");
check(open.receipts.every(r => r.tariff === 0 || near(r.tariff, r.base * G.c[r.buyer].tariff)), "tariff is not charged per edge");
check(near(T.paid, T.base + T.freight + T.tariff), "total paid reconciles");
/* the exempt route: same nation or sphere pays no tariff */
const home = A.freightMatch([{ id: s.id, tag: b1.o, qty: 50 }], [{ id: b1.id, tag: b1.o, qty: 50 }], [], { price });
check(home.receipts.length && home.receipts.every(r => r.tariff === 0 && r.exempt), "a home delivery is exempt from tariff");
/* commitments run before residual exchange: a treaty quantity is served first, tariff-exempt */
const cm = A.freightMatch(sellers, buyers, [{ seller: s.o, buyer: b2.o, qty: 20 }], { price, closed: others });
const cr = cm.receipts.filter(r => r.pass === "commit");
check(cr.length === 1 && near(cr[0].qty, 20) && cr[0].tariff === 0 && cr[0].to === b2.id, "a treaty commitment is delivered first, in full and tariff-exempt");
check(cm.receipts[0].pass === "commit", "pass order: commitments before residual exchange");
/* closing the link changes deliveries and price exposure, including the inland buyer */
const shut = run({ [e]: 1 });
const tot2 = shut.receipts.reduce((a, r) => a + r.qty, 0);
check(tot2 === 0 && total > 0, `closing the link changes deliveries (${total.toFixed(1)} -> ${tot2.toFixed(1)})`);
check(open.delivered[b1.id] + open.delivered[b2.id] > 0 && shut.delivered[b1.id] === 0 && shut.delivered[b2.id] === 0, `both buyers' deliveries change (${open.delivered[b1.id].toFixed(1)}/${open.delivered[b2.id].toFixed(1)} -> 0/0)`);
check(shut.used[e] === 0, "nothing crosses a closed link");
check(open.exposureOpen[b1.id] > 0 && shut.exposureOpen[b1.id] == null && open.exposure[b1.id] == null, `the inland buyer's landed price exposure changes (${open.exposureOpen[b1.id].toFixed(2)} -> cut off); once the link is full the open case is also exhausted`);
check(open.exposureOpen[b1.id] > price * 1.2, 'the inland buyer pays freight and tariff over the world price');
/* identical inputs give identical outputs */
check(JSON.stringify(run({})) === JSON.stringify(open), "deterministic");
/* war: an enemy-held province blocks the shipper, a friendly one does not */
fresh();
const mid = A.freightPath(A.freightTree(s.id, s.o, F0), b1.id).map(x => x[2]).filter(x => x !== b1.id && x !== s.id);
if (mid.length) {
 const other = Object.keys(G.c).find(t => G.c[t].alive && t !== s.o && t !== b1.o);
 G.wars = [{ id: 999, att: [s.o], def: [other], goal: { k: "x" } }]; G.c[s.o].war = [999]; G.c[other].war = [999]; A.P(mid[0]).ctl = other;
 const blocked = A.freightMatch(sellers, buyers, [], { price, closed: others });
 check(blocked.receipts.every(r => !r.path.some(id => id.split("|").includes(mid[0]))), "an enemy-held province carries none of the shipper's grain (" + mid[0] + ")");
 G.wars = [];
 fresh();
}
/* monthly path: the record exists, is finite, and the economy still runs a year */
for (let i = 0; i < 12; i++) A.monthTick();
const f = G.grainFreight;
check(f && f.good === "grain" && [f.qty, f.base, f.freight, f.tariff, f.unmet].every(Number.isFinite), "monthly grain receipts recorded and finite");
check(f.base >= 0 && f.freight >= 0 && f.tariff >= 0, "receipt totals are non-negative");
console.log(failed ? "FAILED " + failed : "all ok");
process.exit(failed ? 1 : 0);
