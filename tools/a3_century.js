"use strict";
/* A3: long-window observer-neutrality and finiteness check.
 * node tools/a3_century.js <seed> <months> <seat|-> ...   ("-" = nobody)
 * Runs every seat in lockstep from one seed (all nations AI-run, same command list, card defaults), compares the material digests every
 * 12 months and at the end, and scans the first run's whole state for NaN/Infinity every 12 months. Exit code 1 on any divergence or non-finite number. */
const L = require("./a0_lib");
const seed = +(process.argv[2] || 7), months = +(process.argv[3] || 1200);
const seats = process.argv.slice(4).map(s => s === "-" ? null : s);
if (!seats.length) seats.push(null);
const runs = seats.map(s => L.createRun(s, seed));
let bad = 0;
const nonFinite = G => {
 const seen = new Set(), out = [];
 const walk = (x, p) => {
  if (out.length >= 5) return;
  if (typeof x === "number") { if (!Number.isFinite(x)) out.push(p + "=" + x); return; }
  if (!x || typeof x !== "object" || seen.has(x)) return;
  seen.add(x);
  for (const k of Object.keys(x)) { if (k === "plist") continue; walk(x[k], p ? p + "." + k : k); }
 };
 walk(G, "");
 return out;
};
for (let m = 1; m <= months; m++) {
 for (const r of runs) L.stepRun(r);
 if (m % 12 === 0 || m === months) {
  const d = runs.map(L.digestRow);
  for (let i = 1; i < d.length; i++) if (d[i].eco !== d[0].eco || d[i].full !== d[0].full) {
   bad++; console.log("DIVERGE month " + m + " (" + runs[0].A.dateStr(m - 1) + "): seat " + (seats[i] || "none") + " vs " + (seats[0] || "none") + (d[i].eco !== d[0].eco ? " economy" : " full-only"));
  }
  const nf = nonFinite(runs[0].A.getG());
  if (nf.length) { bad++; console.log("NONFINITE month " + m + ": " + nf.join(", ")); }
  if (bad) break;
 }
}
const G0 = runs[0].A.getG();
console.log((bad ? "FAIL" : "ok") + " seed " + seed + " " + months + " months seats " + seats.map(s => s || "none").join("/") + " wars " + G0.wars.length + " finalMonth " + G0.t);
process.exitCode = bad ? 1 : 0;
