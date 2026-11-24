"use strict";
/* Print the stress runs for one shard, one per line: "<seed> <seat> <fuzz>".
 * node tools/stress/plan.js --shard 3 --of 24 [--seeds 12] [--seats AI,SWI,...] [--fuzz-seeds 4]
 * Every run also does save/resume checks at months 240, 720 and 1080 (tools/stress/run.js --resume). */
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const shard = +opt("shard", 0), of = +opt("of", 1), seeds = +opt("seeds", 16), fuzzSeeds = +opt("fuzz-seeds", 4);
const seats = (opt("seats", "") || "AI,SWI,GBR,FRA,PRU,AUS,RUS,OTT,USA,JAP,CHI,PUN,EGY,SAR,MEX,PER").split(",");
const runs = [];
for (let s = 1; s <= seeds; s++) for (const seat of seats) runs.push([s, seat, 0]);
for (let s = 101; s < 101 + fuzzSeeds; s++) for (const seat of seats) if (seat !== "AI") runs.push([s, seat, 6]);
/* Spread the slow runs: interleave by index so every shard gets a mix. */
runs.filter((_, i) => i % of === shard).forEach(r => console.log(r.join(" ")));
