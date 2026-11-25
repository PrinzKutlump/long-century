"use strict";
/* AUD2 probes (audit tests only, no game code changed).
 * 1. B13: Germany must not form before 1860 (history: 1871). Seeds 7, 3, 11 run month by month to January 1875.
 * 2. A10/A20: provinces named for Egypt, Libya, Greece, Crimea, the Balkans and the Caucasus are listed as found or
 *    missing. Missing names are findings for the ledger, not failures of this test: they are printed as FAIL lines
 *    but do not change the exit code. Only check 1 sets the exit code. */
const L = require("./tools/a0_lib");

let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FINDING " + text); } };
const API_EXTRA = ";globalThis.API.Q={newGame,yearOf,formedAlive,monthTick,dateStr,P,provsOf,getG:()=>G};";

/* 1. Germany formation timing */
const SEEDS = [7, 3, 11];
for (const seed of SEEDS) {
 const A = L.loadEngine(API_EXTRA).Q;
 A.newGame(null, seed);
 const G = A.getG();
 let formedAt = null;
 let guard = 0;
 while (A.yearOf(G.t) < 1875 && guard++ < 1000) {
  A.monthTick();
  if (A.formedAlive("GER")) formedAt = A.dateStr(G.t - 1);
  if (formedAt !== null) break;
 }
 const year = formedAt === null ? null : +formedAt.split(" ").pop();
 console.log(`info seed ${seed}: Germany ${formedAt === null ? "not formed before the stop (January 1875 or after formation check)" : "formed in " + formedAt}`);
 check(formedAt === null || year >= 1860, `B13 seed ${seed}: Germany formed no earlier than 1860 (formed: ${formedAt || "never by 1875"})`);
}

/* 2. Province presence (one newGame is enough: the province list is fixed WORLD data) */
const A = L.loadEngine(API_EXTRA).Q;
A.newGame(null, 7);
const provs = Object.values(A.getG().prov);
const names = provs.map(p => ({ id: p.id, n: p.n }));
const GROUPS = [
 ["Egypt: Alexandria", ["Alexandria"]], ["Egypt: Cairo", ["Cairo"]], ["Egypt: Suez", ["Suez"]],
 ["Libya: Tripoli", ["Tripoli"]], ["Libya: Benghazi", ["Benghazi"]],
 ["Greece", ["Greece", "Athens", "Morea", "Attica"]],
 ["Crimea", ["Crimea", "Sevastopol", "Simferopol"]],
 ["Bulgaria", ["Bulgaria"]], ["Serbia", ["Serbia"]], ["Romania", ["Romania", "Wallachia", "Moldavia"]],
 ["Caucasus: Tiflis", ["Tiflis"]], ["Caucasus: Baku", ["Baku"]]
];
for (const [label, keys] of GROUPS) {
 const hit = names.find(p => keys.some(k => String(p.n).toLowerCase().includes(k.toLowerCase())));
 if (hit) console.log(`ok   found ${label} -> ${hit.n} [${hit.id}]`);
 else console.log(`FINDING missing ${label} (no province name contains ${keys.join(" / ")})`);
}

if (failed) console.log(`${failed} FINDING line(s)`);
process.exitCode = failed ? 1 : 0;
