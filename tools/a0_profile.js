"use strict";
/* A0 item 3: cost of the provincial-economy path and the projection for all nations (input to A3).
 *
 * Method. One live seed-7 century is run with nobody human. The configuration of the provincial economy is rotated every
 * month (round robin), so every configuration sees the same calendar, the same warm caches and the same GC pressure,
 * and monthly timings are averaged over many months. (An earlier design that restored a packed state for every trial was
 * rejected: a freshly parsed state is cold for the optimiser and its trial-to-trial noise, +-10 ms, was larger than the effect.)
 *   base        no household economy anywhere (participants [])
 *   player_SWI  A4: the real rule (household economy for every nation) with a small player seat
 *   player_GBR  the real rule with a large player seat (A3: identical outcomes to player_SWI)
 *   all         the real rule, nobody human
 *   all_ledger  as all, and every payer has a construction ledger (A2 'compact ledger for AI' upper bound)
 * The patched hooks only choose the participant list, the eligibility test and the ledger test; they cost nothing when unset.
 * The rotation perturbs the trajectory a little (a nation is provincial in some months and not in others); costs, not
 * outcomes, are what this tool reports. Outcomes of the unperturbed game are checked separately (century.js hash). */
const fs = require("node:fs");
const path = require("node:path");
const { runDist } = require("./a0_dist");
const seed = +(process.argv[2] || 7);
const FROM = +(process.env.LC_FROM || 600);
const harness = `
 const CONFIGS=["base","player_SWI","player_GBR","all","all_ledger"];
 const T={};const timed=(k,f)=>(...a)=>{const s=performance.now();try{return f(...a);}finally{T[k]=(T[k]||0)+performance.now()-s;}};
 econMonth=timed("econ",econMonth);socMonth=timed("soc",socMonth);
 allocateLocalHouseholds=timed("alloc",allocateLocalHouseholds);moneyMonth=timed("money",moneyMonth);investMonth=timed("invest",investMonth);bilateralOrders=timed("bilateral",bilateralOrders);
 const living=()=>Object.keys(G.c).filter(t=>G.c[t].alive);
 const setup=(name)=>{const cf=globalThis.__CF;cf.parts=null;cf.ledger=null;G.player=null;
  if(name==="base"){cf.parts=()=>[];cf.ledger=()=>false;}
  else if(name==="player_SWI"){G.player="SWI";}
  else if(name==="player_GBR"){G.player="GBR";}
  else if(name==="all_ledger"){cf.ledger=()=>true;}
  else{cf.ledger=()=>false;}};
 newGame(null,args.seed);
 const rows=[];
 while(G.t<1200){
  const name=CONFIGS[G.t%CONFIGS.length];setup(name);
  if(G.card)cardDefault();
  for(const k in T)delete T[k];
  const month=G.t;
  const tags=name==="base"?[]:living();
  const provinces=G.plist.filter(p=>p.o&&tags.includes(p.o)).length;
  monthTick();
  rows.push([month,CONFIGS.indexOf(name),+T.econ.toFixed(3),+T.soc.toFixed(3),+(T.alloc||0).toFixed(3),+(T.money||0).toFixed(3),+(T.invest||0).toFixed(3),+(T.bilateral||0).toFixed(3),provinces,G.plist.filter(p=>p.o&&G.c[p.o]&&G.c[p.o].alive&&!p.waste&&p.pop>0).length,G.plist.filter(p=>p.o&&G.c[p.o]&&G.c[p.o].alive).reduce((s,p)=>s+p.pops.length,0)]);
 }
 G.player=null;globalThis.__CF.parts=null;globalThis.__CF.ledger=null;
 return {configs:CONFIGS,rows};
`;
const t0 = Date.now();
const { configs, rows } = runDist({ seed, player: null, patches: ["parts", "ledger"], cf: {}, harness });
const dir = path.join(__dirname, "..", "validation/results/engine");
fs.mkdirSync(dir, { recursive: true });
const r2 = x => +x.toFixed(2), r3 = x => +x.toFixed(3);
const stat = a => { const n = a.length, m = a.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1)); return { n, mean: m, se: sd / Math.sqrt(n) }; };
const lines = [], say = t => { console.log(t); lines.push(t); };
say(`A0 item 3: provincial-economy path cost, seed ${seed}, nobody human, node ${process.version}, wall ${((Date.now() - t0) / 1000).toFixed(0)} s`);
say("Method: one live century, configuration rotated every month (base, player_SWI, player_GBR, all, all_ledger); monthly timings of econMonth and socMonth with its sub-phases; means over months from " + (1836 + Math.floor(FROM / 12)) + ".");
const cols = { econ: 2, soc: 3, alloc: 4, money: 5, invest: 6, bilateral: 7 };
const pick = (cfgIdx, from, to) => rows.filter(r => r[1] === cfgIdx && r[0] >= from && r[0] < to);
const meanOf = (rs, c) => stat(rs.map(r => r[c]));
const periods = [[FROM, 1200, (1836 + Math.floor(FROM / 12)) + "-1936"], [1080, 1200, "1926-1936"]];
const out = { seed, node: process.version, from: FROM, periods: {} };
for (const [from, to, label] of periods) {
 say("");
 say(`== ${label}: mean ms per month by configuration (n = months, +- standard error of the mean)`);
 const tab = {};
 for (let i = 0; i < configs.length; i++) {
  const rs = pick(i, from, to);
  const e = meanOf(rs, 2), s = meanOf(rs, 3);
  tab[configs[i]] = {
   months: rs.length, econMs: r2(e.mean), socMs: r2(s.mean), econPlusSocMs: r2(e.mean + s.mean), se: r2(Math.hypot(e.se, s.se)),
   allocMs: r3(meanOf(rs, 4).mean), moneyMs: r3(meanOf(rs, 5).mean), investMs: r2(meanOf(rs, 6).mean), bilateralMs: r3(meanOf(rs, 7).mean),
   participantProvinces: r2(meanOf(rs, 8).mean), qualifyingProvinces: r2(meanOf(rs, 9).mean), populationGroups: r2(meanOf(rs, 10).mean)
  };
  tab[configs[i]].econRestMs = r2(tab[configs[i]].econMs - tab[configs[i]].allocMs - tab[configs[i]].moneyMs - tab[configs[i]].investMs - tab[configs[i]].bilateralMs);
  say(`   ${configs[i].padEnd(11)} ${String(rs.length).padStart(3)} mo: econMonth ${String(tab[configs[i]].econMs).padStart(6)} (alloc ${tab[configs[i]].allocMs}, money ${tab[configs[i]].moneyMs}, invest ${tab[configs[i]].investMs}, bilateral ${tab[configs[i]].bilateralMs}, rest ${tab[configs[i]].econRestMs}), socMonth ${tab[configs[i]].socMs}; econ+soc ${tab[configs[i]].econPlusSocMs} +-${tab[configs[i]].se}; participant provinces ${tab[configs[i]].participantProvinces}`);
 }
 const base = tab.base, d = key => r2(tab[key].econPlusSocMs - base.econPlusSocMs);
 const q = tab.all.qualifyingProvinces, g = tab.all.populationGroups;
 const perProvAll = (tab.all.econPlusSocMs - base.econPlusSocMs) / q, perGroupAll = (tab.all.econPlusSocMs - base.econPlusSocMs) / g;
 const proj = {
  extraMsVsBase: { player_SWI: d("player_SWI"), player_GBR: d("player_GBR"), all: d("all"), all_ledger: d("all_ledger") },
  allocMsPerParticipantProvince: { all: r3(tab.all.allocMs / Math.max(1, tab.all.participantProvinces)) },
  perQualifyingProvinceMsAll: r3(perProvAll), perPopulationGroupMsAll: +perGroupAll.toFixed(4),
  qualifyingProvinces: q, populationGroups: g,
  extraInEngineMonthAllNationsMs: d("all"), seatSpreadMs: r2(Math.abs(tab.player_SWI.econPlusSocMs - tab.player_GBR.econPlusSocMs))
 };
 out.periods[label] = { table: tab, projection: proj };
 say(`   extra over base (econ+soc ms/month): player_SWI ${proj.extraMsVsBase.player_SWI}, player_GBR ${proj.extraMsVsBase.player_GBR}, all ${proj.extraMsVsBase.all}, all_ledger ${proj.extraMsVsBase.all_ledger}`);
 say(`   per-province rate: ${proj.perQualifyingProvinceMsAll} ms per qualifying province (${q} provinces, ${g} groups => ${proj.perPopulationGroupMsAll} ms per group); alloc ${proj.allocMsPerParticipantProvince.all} ms per participant province`);
 say(`   A4 (post A3, one rule for every seat): the household economy for all nations costs +${proj.extraInEngineMonthAllNationsMs} ms per month over a world with none; the two seats differ by ${proj.seatSpreadMs} ms (noise).`);
}
out.rows = { columns: ["month", "config", "econMs", "socMs", "allocMs", "moneyMs", "investMs", "bilateralMs", "participantProvinces", "qualifyingProvinces", "populationGroups"], configs, data: rows };
fs.writeFileSync(path.join(dir, `a4-profile-seed${seed}.json`), JSON.stringify(out));
fs.writeFileSync(path.join(dir, `a4-profile-seed${seed}.txt`), lines.join("\n") + "\n");
