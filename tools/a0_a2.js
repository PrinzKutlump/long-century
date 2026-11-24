"use strict";
/* A0 item 2: how many non-player payers go below zero because of construction in investMonth (the A2 defect).
 * Instruments the single `payer[balance]-=cost` line (read-only hook; state unchanged) and runs the century.js
 * loop for seed 7 with the same player (SWI) so the final stateHash can be compared with the baseline. */
const fs = require("node:fs");
const path = require("node:path");
const { runDist } = require("./a0_dist");
const seed = +(process.argv[2] || 7), player = process.argv[3] || "SWI";
const stats = {
 charges: 0, chargesNonPlayer: 0, afterNegative: 0, crossedZero: 0, alreadyNegative: 0, overdrawTotal: 0,
 worst: { value: 0 }, nationMonths: new Set(), byBalance: { tr: 0, inv: 0 }, byPayerKind: { domestic: 0, foreign: 0 },
 byTag: {}, byDecade: {}, firstEvent: null, worstOverdraw: { amount: 0 }
};
const cf = {
 onPay(payer, balance, cost, bill, before, tag, p, b, fraction) {
  stats.charges++;
  const G = globalThis.__G();
  if (payer.tag === G.player || tag === G.player) return;
  stats.chargesNonPlayer++;
  if (cost <= 0) return;
  const after = before - cost;
  if (after >= 0) return;
  const overdraw = cost - Math.max(0, before);
  stats.afterNegative++;
  if (before >= 0) stats.crossedZero++; else stats.alreadyNegative++;
  stats.overdrawTotal += overdraw;
  stats.byBalance[balance]++;
  stats.byPayerKind[b.fo && G.c[b.fo] ? "foreign" : "domestic"]++;
  stats.nationMonths.add(payer.tag + "|" + balance + "|" + G.t);
  const decade = String(Math.floor((1836 + Math.floor(G.t / 12)) / 10) * 10);
  stats.byDecade[decade] = (stats.byDecade[decade] || 0) + 1;
  const row = stats.byTag[payer.tag] || (stats.byTag[payer.tag] = { events: 0, overdraw: 0, worst: 0 });
  row.events++; row.overdraw += overdraw; row.worst = Math.min(row.worst, after);
  const date = (1836 + Math.floor(G.t / 12)) + "-" + String(1 + G.t % 12).padStart(2, "0");
  if (after < stats.worst.value) stats.worst = { value: after, tag: payer.tag, balance, month: G.t, date, project: (b.k + ":" + (b.g || b.b || "")), province: p.id, before, cost, bill, foreign: !!(b.fo && G.c[b.fo]) };
  if (overdraw > stats.worstOverdraw.amount) stats.worstOverdraw = { amount: overdraw, tag: payer.tag, balance, date, province: p.id, before, cost };
  if (!stats.firstEvent) stats.firstEvent = { date, tag: payer.tag, balance, before, cost, province: p.id, project: b.k + ":" + (b.g || b.b || "") };
 }
};
const harness = `
 globalThis.__G=()=>G;
 newGame(args.player, args.seed);
 const monthEnd={trNeg:new Set(),invNeg:new Set(),trWorst:0,invWorst:0,trNationMonths:0,invNationMonths:0};
 let saved;
 while(G.t<1200){
  const month=G.t;
  if(G.card)cardDefault();
  if(args.player&&G.c[args.player].alive)advanceCampaign(month);else monthTick();
  for(const tag in G.c){const c=G.c[tag];if(!c.alive||tag===G.player)continue;
   if(c.tr<0){monthEnd.trNationMonths++;monthEnd.trNeg.add(tag);monthEnd.trWorst=Math.min(monthEnd.trWorst,c.tr);}
   if(c.inv<0){monthEnd.invNationMonths++;monthEnd.invNeg.add(tag);monthEnd.invWorst=Math.min(monthEnd.invWorst,c.inv);}}
 }
 saved=pack();
 return {stateHash:digest(saved),monthEnd:{trNationMonths:monthEnd.trNationMonths,invNationMonths:monthEnd.invNationMonths,trNations:[...monthEnd.trNeg],invNations:[...monthEnd.invNeg],trWorst:monthEnd.trWorst,invWorst:monthEnd.invWorst}};
`;
const t0 = Date.now();
const res = runDist({ seed, player, patches: ["pay"], cf, harness });
const top = Object.entries(stats.byTag).sort((a, b) => b[1].overdraw - a[1].overdraw).slice(0, 12).map(([tag, r]) => ({ tag, ...r, overdraw: Math.round(r.overdraw), worst: Math.round(r.worst) }));
const out = {
 seed, player, years: "1836-1936", seconds: +((Date.now() - t0) / 1000).toFixed(1), stateHash: res.stateHash,
 definition: "A charge counts when a non-player payer's treasury (tr, state projects) or investment pool (inv, private and foreign projects) is below zero after investMonth books a construction bill. 'overdraw' = the part of the bill above the payer's positive balance, i.e. what the funding fraction would have withheld. crossedZero: balance was >= 0 before the charge; alreadyNegative: it was already below zero.",
 constructionChargesAll: stats.charges, constructionChargesNonPlayer: stats.chargesNonPlayer,
 chargesLeavingBalanceBelowZero: stats.afterNegative, crossedZero: stats.crossedZero, alreadyNegative: stats.alreadyNegative,
 nationMonths: stats.nationMonths.size, byBalance: stats.byBalance, byPayerKind: stats.byPayerKind,
 overdrawTotalPounds: Math.round(stats.overdrawTotal), worstBalanceAfterCharge: stats.worst, worstOverdrawSingleCharge: stats.worstOverdraw,
 firstEvent: stats.firstEvent, byDecade: stats.byDecade, topPayersByOverdraw: top,
 allCausesMonthEnd: res.monthEnd,
 note: "allCausesMonthEnd counts every nation-month ending with tr or inv below zero for any reason (non-player nations), for context; the construction-attributed counts are above."
};
const dir = path.join(__dirname, "..", "validation/results/engine");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `a0-a2-negative-balances-seed${seed}.json`), JSON.stringify(out, null, 1));
const lines = [
 `A0 item 2: construction overdraw by non-player payers, seed ${seed}, player ${player}, 1836-1936 (${out.seconds}s)`,
 `stateHash of the instrumented run: ${out.stateHash}`,
 `construction charges booked: ${out.constructionChargesAll} (non-player payers ${out.constructionChargesNonPlayer})`,
 `charges leaving the payer below zero: ${out.chargesLeavingBalanceBelowZero} (crossed zero ${out.crossedZero}, already negative ${out.alreadyNegative})`,
 `nation-months (payer, balance, month): ${out.nationMonths}; by balance ${JSON.stringify(out.byBalance)}; by payer ${JSON.stringify(out.byPayerKind)}`,
 `total overdraw (bill above positive balance): ${out.overdrawTotalPounds} pounds`,
 `worst balance after a construction charge: ${JSON.stringify(out.worstBalanceAfterCharge)}`,
 `largest single overdraw: ${JSON.stringify(out.worstOverdrawSingleCharge)}`,
 `first event: ${JSON.stringify(out.firstEvent)}`,
 `by decade: ${JSON.stringify(out.byDecade)}`,
 `top payers: ${JSON.stringify(out.topPayersByOverdraw)}`,
 `all causes, month-end nation-months below zero (non-player): tr ${out.allCausesMonthEnd.trNationMonths}, inv ${out.allCausesMonthEnd.invNationMonths}; worst tr ${Math.round(out.allCausesMonthEnd.trWorst)}, worst inv ${Math.round(out.allCausesMonthEnd.invWorst)}`
];
fs.writeFileSync(path.join(dir, `a0-a2-negative-balances-seed${seed}.txt`), lines.join("\n") + "\n");
console.log(lines.join("\n"));
