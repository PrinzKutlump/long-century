"use strict";
/* A3: section T table from century.js outputs. node tools/a3_table.js <prefix> <seed>... (files validation/results/engine/<prefix>-seed-N.jsonl) */
const fs = require("node:fs");
const [prefix, ...seeds] = process.argv.slice(2);
const rows = [];
for (const s of seeds) {
 const file = `validation/results/engine/${prefix}-seed-${s}.jsonl`;
 const L = fs.readFileSync(file, "utf8").trim().split("\n").map(l => JSON.parse(l));
 const years = L.filter(x => x.year), last = years[years.length - 1], f = L[L.length - 1].formations || {};
 const p = last.prices;
 rows.push({ seed: s, wars: last.wars, destroyed: last.destroyed, GER: f.GER || "none", ITA: f.ITA || "none", union: f.union || "none", prices: ["grain", "iron", "steel", "machinery"].map(k => p[k].toFixed(2)).join("/"),
  ms: last.msPerMonth, kb: Math.round(last.saveBytes / 1024), minmax: (() => { let lo = 9, hi = 0; for (const y of years) for (const k in y.prices) { lo = Math.min(lo, y.prices[k]); hi = Math.max(hi, y.prices[k]); } return lo.toFixed(2) + "-" + hi.toFixed(2); })(), hash: last.stateHash });
}
console.log("| Seed | wars | destroyed | GER | ITA | Union | grain/iron/steel/machinery 1936 | price range all years | ms/month 1926-36 | save KB |\n|---|---|---|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.seed} | ${r.wars} | ${r.destroyed} | ${r.GER} | ${r.ITA} | ${r.union} | ${r.prices} | ${r.minmax} | ${r.ms} | ${r.kb} |`);
