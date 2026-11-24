"use strict";
const fs = require("node:fs");
const { createHash } = require("node:crypto");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");
/* --quiet (or LC_QUIET=1): one summary line; every record goes to /tmp/lc_last_run.txt */
const quiet = process.argv.includes("--quiet") || process.env.LC_QUIET === "1";
const [seed = "7", player = "SWI"] = process.argv.slice(2).filter(arg => arg !== "--quiet");
if (!Number.isInteger(+seed) || +seed <= 0) throw new Error("Use a positive integer seed.");
const nodes = new Map();
const lines = [];
const context = {
 console: quiet ? { log: (...parts) => lines.push(parts.join(" ")) } : console, performance, digest: text => createHash("sha256").update(text).digest("hex"),
 memory: () => process.memoryUsage().heapUsed,
 // LC_SAVES=dir writes the packed save at each month listed in LC_SAVE_AT (default 600,1176,1200).
 writeSave: (month, text) => {
  if (!process.env.LC_SAVES) return;
  fs.mkdirSync(process.env.LC_SAVES, { recursive: true });
  fs.writeFileSync(`${process.env.LC_SAVES}/seed-${seed}-t${month}.txt`, text);
 },
 saveAt: new Set((process.env.LC_SAVE_AT || "600,1176,1200").split(",").map(Number)),
 args: { seed: +seed, player: player === "AI" ? null : player },
 window: { addEventListener() {} },
 document: {
  addEventListener() {}, querySelector: selector => nodes.get(selector),
  createElement: () => ({}),
  body: { appendChild: node => nodes.set("#" + node.id, node) }
 }
};
const source = fs.readFileSync(process.env.LC_BUILD || __dirname + "/dist/long-century.html", "utf8")
 .match(/<script>([\s\S]*)<\/script>/)[1];
const harness = `
 newGame(args.player, args.seed);
 if (args.player && !G.c[args.player]?.alive) throw new Error("Unknown playable nation: " + args.player);
 const formations = {};
 let wars = G.wars.length, destroyed = 0;
 const originalDeclareWar = declareWar;
 declareWar = function (...args) {
  const war = originalDeclareWar(...args);
  if (war) wars++;
  return war;
 };
 const originalMonthTick = monthTick;
 const timings = {};
 if (PROFILE) {
  const timed = (name, system) => (...args) => {
   const start = performance.now();
   try { return system(...args); }
   finally { timings[name] = (timings[name] || 0) + performance.now() - start; }
  };
  econMonth = timed("econMonth", econMonth);
  socMonth = timed("socMonth", socMonth);
  researchMonth = timed("researchMonth", researchMonth);
  polMonth = timed("polMonth", polMonth);
  eventsMonth = timed("eventsMonth", eventsMonth);
  gwMonth = timed("gwMonth", gwMonth);
  decMonth = timed("decMonth", decMonth);
  diploMonth = timed("diploMonth", diploMonth);
  thMonth = timed("thMonth", thMonth);
  armyMonth = timed("armyMonth", armyMonth);
  aiMonth = timed("aiMonth", aiMonth);
  histYear = timed("histYear", histYear);
  // A0: sub-phases of econMonth, timed from inside (they nest in "econMonth"). Read-only wrappers: no state is touched.
  allocateLocalHouseholds = timed("econ.alloc", allocateLocalHouseholds);
  moneyMonth = timed("econ.money", moneyMonth);
  investMonth = timed("econ.invest", investMonth);
  bilateralOrders = timed("econ.bilateral", bilateralOrders);
 }
 let spent = 0;
 let seceded = [];
 console.log(JSON.stringify(args));
 while (G.t < 1200) {
  const living = Object.keys(G.c).filter(tag => G.c[tag].alive);
  const at = performance.now();
  if (G.card) cardDefault();
  const month = G.t;
  if (args.player && G.c[args.player].alive) advanceCampaign(month);
  else originalMonthTick();
  if (G.t !== month + 1) throw new Error("Month did not advance: " + dateStr(month));
  spent += performance.now() - at;
  if (saveAt.has(G.t) && G.t % 120 !== 0) writeSave(G.t, pack());
  for (const tag of living) if (!G.c[tag].alive) destroyed++;
  for (const tag of ["GER","ITA","CSA"]) {
   if (!formations[tag] && (G.c[tag]?.alive || formedAlive(tag))) {
    formations[tag] = dateStr(G.t);
    if (tag === "CSA") seceded = provsOf(tag).map(p => p.id);
   }
  }
  if (!formations.union && seceded.length && !G.c.CSA.alive &&
      seceded.every(id => P(id).o === "USA")) formations.union = dateStr(G.t);
  if (G.t % 120 === 0) {
   const saving = performance.now();
   const saved = pack();
   const bytes = saved.length;
   const saveMs = performance.now() - saving;
   if (saveAt.has(G.t)) writeSave(G.t, saved);
   const record = { year: yearOf(G.t), msPerMonth: +(spent / 120).toFixed(1),
    saveMs: +saveMs.toFixed(1), saveBytes: bytes, fourSaveBytes: bytes * 4, heapBytes: memory(), wars, destroyed, greatPowers: G.gp,
    prices: Object.fromEntries(["grain","iron","steel","machinery"].map(key =>
     [key, G.price[key] / GOODS[key]?.p])) };
   if (PROFILE) {
    record.systemMs = Object.fromEntries(Object.entries(timings)
     .map(([key, ms]) => [key, +(ms / 120).toFixed(1)]));
    // A0: the provincial pilot path is the participants' allocation plus inline branches; the inline part is measured by tools/a0_profile.js
    const sub = ["econ.alloc", "econ.money", "econ.invest", "econ.bilateral"];
    record.systemMs["econ.rest"] = +(((timings.econMonth || 0) - sub.reduce((s, k) => s + (timings[k] || 0), 0)) / 120).toFixed(1);
    const participants = [...new Set(["PUN", G.player])].filter(tag => tag && G.c[tag]?.alive);
    const pilotProvinces = participants.reduce((n, tag) => n + provsOf(tag).length, 0);
    record.provincialPath = { participants, provinces: pilotProvinces, allocMsPerMonth: +((timings["econ.alloc"] || 0) / 120).toFixed(2),
     allocMsPerProvince: pilotProvinces ? +((timings["econ.alloc"] || 0) / 120 / pilotProvinces).toFixed(3) : 0,
     totalProvincesOwned: G.plist.filter(p => p.o && G.c[p.o].alive).length };
   }
   if (G.t===1200) { record.stateHash = digest(saved); record.stateJsonHash = digest(saveJSON().replace(/"modelRev":[0-9]+,/, "")); } // A4: stateHash (compressed text) changes with any new save field; stateJsonHash is the outcome hash, independent of modelRev and of the codec
   console.log(JSON.stringify(record));
   spent = 0;
   for (const key in timings) delete timings[key];
  }
 }
 console.log(JSON.stringify({ formations }));
`;
const bindings = { ...context, PROFILE: Boolean(process.env.LC_PROFILE) };
if (!quiet) {
 vm.compileFunction(source + "\n" + harness, Object.keys(bindings))(...Object.values(bindings));
} else {
 let error = null;
 try {
  vm.compileFunction(source + "\n" + harness, Object.keys(bindings))(...Object.values(bindings));
 } catch (caught) {
  error = caught;
 }
 const records = lines.filter(line => line.startsWith("{")).map(line => { try { return JSON.parse(line); } catch { return {}; } });
 const last = records.filter(record => record.year !== undefined).at(-1) || {};
 const worstMs = Math.max(0, ...records.map(record => record.msPerMonth || 0));
 const largestSave = Math.max(0, ...records.map(record => record.saveBytes || 0));
 fs.writeFileSync("/tmp/lc_last_run.txt", [...lines, error ? "ERROR " + (error.stack || error) : ""].join("\n") + "\n");
 const status = error ? "FAILED " + String(error.message || error).split("\n")[0] : "OK";
 console.log(`century ${seed} ${player}: ${status}; last year=${last.year || "-"}; ` +
  `worst ms/month=${worstMs}; largest save=${largestSave} B; stateHash=${last.stateHash || "-"}; full output /tmp/lc_last_run.txt`);
 process.exitCode = error ? 1 : 0;
}
