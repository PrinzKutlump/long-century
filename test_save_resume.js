"use strict";
/* A4 follow-up 1: save/resume determinism.
 * A3 stopped saving employerAccount and saved localMarket/landUse only for the played nation. This test proves that the
 * material state does not depend on that: an uninterrupted run and the same run saved (real pack) at month 60 and resumed in
 * a FRESH engine (real unpack, the page's own load path) give identical material digests (tools/a0_lib.js digest: economy and
 * full) at every 12th month up to month 120, for seats SWI, GBR and nobody, and the resumed digest does not depend on the seat.
 * Runs on the built game (dist/long-century.html). LC_SR_MONTHS / LC_SR_SPLIT override the window (default 120 / 60). */
const fs = require("node:fs");
const vm = require("node:vm");
const L = require("./tools/a0_lib");

const MONTHS = +(process.env.LC_SR_MONTHS || 120), SPLIT = +(process.env.LC_SR_SPLIT || 60), SEED = 7;
const html = fs.readFileSync("dist/long-century.html", "utf8");
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };

function engine() {
 const nodes = new Map();
 const ctx = vm.createContext({ console, performance, setInterval: () => 1, clearInterval: () => {}, window: { addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild(n) { nodes.set("#" + n.id, n); } } } });
 vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1], ctx);
 vm.runInContext(L.API_SOURCE, ctx);
 return { ctx, A: ctx.API, pack: () => vm.runInContext("pack()", ctx), unpack: z => { ctx.__z = z; vm.runInContext("unpack(__z)", ctx); } };
}
function fresh(seat) {
 const E = engine();
 E.A.newGame(null, SEED);
 E.A.getG().player = seat || null;
 return { A: E.A, E, seat, plan: L.planCommands(E.A, L.ACTORS, true) };
}
const digests = run => L.digestRow(run);
function advance(run, to, rows) {
 while (run.A.getG().t < to) {
  L.stepRun(run);
  const t = run.A.getG().t;
  if (t % 12 === 0 && rows) rows[t] = digests(run);
 }
}
const seats = ["SWI", "GBR", null];
const out = {};
for (const seat of seats) {
 const label = L.label(seat);
 const u = fresh(seat), rowsU = {};
 advance(u, MONTHS, rowsU);
 const r = fresh(seat), rowsR = {};
 advance(r, SPLIT, rowsR);
 const z = r.E.pack();
 /* resume in a fresh engine: nothing but the save text carries over */
 const E2 = engine();
 E2.unpack(z);
 const resumed = { A: E2.A, E: E2, seat, plan: r.plan };
 const preU = rowsU[SPLIT], preR = rowsR[SPLIT];
 check(preU.eco === preR.eco && preU.full === preR.full, label + ": before the save the two runs agree (month " + SPLIT + ")");
 const afterLoad = digests(resumed);
 check(afterLoad.eco === preR.eco && afterLoad.full === preR.full, label + ": the digest right after the reload equals the digest before the save");
 advance(resumed, MONTHS, rowsR);
 let firstBad = null;
 for (let t = SPLIT; t <= MONTHS; t += 12) if (rowsU[t] && (rowsU[t].eco !== rowsR[t].eco || rowsU[t].full !== rowsR[t].full)) { firstBad = firstBad ?? t; }
 check(firstBad === null, label + ": uninterrupted and save+resume at month " + SPLIT + " identical at every 12th month to " + MONTHS + (firstBad !== null ? " (first difference month " + firstBad + ")" : ""));
 out[label] = { u: rowsU[MONTHS], r: rowsR[MONTHS], bytes: z.length };
 console.log("  " + label + ": month " + MONTHS + " eco " + rowsU[MONTHS].eco.slice(0, 12) + " full " + rowsU[MONTHS].full.slice(0, 12) + ", save " + z.length + " chars");
}
const labels = Object.keys(out);
check(labels.every(l => out[l].r.eco === out[labels[0]].r.eco && out[l].r.full === out[labels[0]].r.full), "after the reload the digest does not depend on which nation is the player (" + labels.join("/") + ")");
process.exitCode = failed ? 1 : 0;
