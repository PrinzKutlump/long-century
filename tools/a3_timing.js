"use strict";
/* A3: interleaved Node timing of two builds on the same machine.
 * node tools/a3_timing.js <seed> <fromMonth> <months> <buildA.html> <buildB.html> [player]
 * Each build runs its own game (same seed, player SWI by default, century.js stepping) to <fromMonth> in this one process, then the two
 * are advanced alternately one month at a time (order flipped every month) so both see the same load, GC state and JIT warmth.
 * Prints mean, median, p95 and the paired difference B-A with its standard error. */
const fs = require("node:fs");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");
const [seed = "7", from = "1080", months = "60", fa, fb, player = "SWI"] = process.argv.slice(2);
function load(file) {
 const nodes = new Map();
 const b = { console, performance, args: { seed: +seed, player: player === "AI" ? null : player }, window: { addEventListener() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild: n => nodes.set("#" + n.id, n) } } };
 const src = fs.readFileSync(file, "utf8").match(/<script>([\s\S]*)<\/script>/)[1];
 const harness = `
  newGame(args.player, args.seed);
  const orig = monthTick;
  return { step() { if (G.card) cardDefault(); const m = G.t; if (args.player && G.c[args.player].alive) advanceCampaign(m); else orig(); if (G.t !== m + 1) throw new Error("no advance"); return m; },
   t: () => G.t, rev: () => typeof MODEL_REV === "undefined" ? null : MODEL_REV, bytes: () => pack().length };`;
 return vm.compileFunction(src + "\n" + harness, Object.keys(b))(...Object.values(b));
}
const A = load(fa), B = load(fb);
console.log("MODEL_REV A=" + A.rev() + " B=" + B.rev() + ", seed " + seed + ", player " + player + ", node " + process.version);
while (A.t() < +from) { A.step(); B.step(); }
const ta = [], tb = [];
for (let i = 0; i < +months; i++) {
 const order = i % 2 ? [[A, ta], [B, tb]] : [[B, tb], [A, ta]];
 for (const [x, arr] of order) { const s = performance.now(); x.step(); arr.push(performance.now() - s); }
}
const st = a => { const s = [...a].sort((x, y) => x - y), n = a.length, m = a.reduce((p, c) => p + c, 0) / n; return { mean: m, median: s[n >> 1], p95: s[Math.floor(n * .95)], max: s[n - 1] }; };
const d = ta.map((x, i) => tb[i] - x), dm = d.reduce((p, c) => p + c, 0) / d.length, sd = Math.sqrt(d.reduce((p, c) => p + (c - dm) ** 2, 0) / (d.length - 1));
const f = o => Object.entries(o).map(([k, v]) => k + " " + v.toFixed(1)).join(", ");
console.log("months " + from + ".." + (+from + +months) + " (" + A.t() + "): A " + f(st(ta)) + " ms");
console.log("                       B " + f(st(tb)) + " ms");
console.log("paired difference B-A: mean " + dm.toFixed(1) + " ms, se " + (sd / Math.sqrt(d.length)).toFixed(1) + ", median " + st(d).median.toFixed(1) + " ms");
console.log("save bytes at that point: A " + A.bytes() + ", B " + B.bytes());
