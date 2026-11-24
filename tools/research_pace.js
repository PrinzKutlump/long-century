"use strict";
/* Research pace: node tools/research_pace.js <seed> [root]  (root = a checkout with a built dist; default this one)
 * Runs the century (player SWI, century.js stepping) and reports the month each nation first knows 3 "key" techs, the median year for the
 * great powers of 1936, their techs known in 1936, and the outcome hash (sha256 of the save JSON without modelRev). Key techs = the techs that
 * unlock factory methods (METH_TECH), counting only techs learned in play. */
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { createHash } = require("node:crypto");
const [seed = "7", root = path.join(__dirname, "..")] = process.argv.slice(2);
const nodes = new Map();
const b = { console, performance, digest: t => createHash("sha256").update(t).digest("hex"), args: { seed: +seed }, window: { addEventListener() {} },
 document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild: n => nodes.set("#" + n.id, n) } } };
const src = fs.readFileSync(path.join(root, "dist/long-century.html"), "utf8").match(/<script>([\s\S]*)<\/script>/)[1];
const harness = `
 newGame("SWI", args.seed);
 const first = {};
 while (G.t < 1200) {
  if (G.card) cardDefault();
  const m = G.t;
  if (G.c.SWI.alive) advanceCampaign(m); else monthTick();
  for (const t in G.c) { const c = G.c[t]; if (!c.alive || first[t] != null) continue; let n = 0; for (const id of METH_TECH) if (c.tech[id] > 1) n++; if (n >= 3) first[t] = G.t; }
 }
 const gp = G.gp.slice();
 const yrs = gp.map(t => first[t] == null ? null : 1836 + Math.floor(first[t] / 12));
 const done = yrs.filter(x => x != null).sort((a, b) => a - b);
 const median = done.length ? (done[(done.length - 1) >> 1] + done[done.length >> 1]) / 2 : null;
 const known = gp.map(t => Object.keys(G.c[t].tech).length);
 return { seed: args.seed, gp, yearsToThree: yrs, medianYear: median, reached: done.length, techsKnown1936: known, meanKnown: known.reduce((s, x) => s + x, 0) / known.length,
  hash: digest(saveJSON().replace(/"modelRev":[0-9]+,/, "")), size: pack().length };`;
console.log(JSON.stringify(vm.compileFunction(src + "\n" + harness, Object.keys(b))(...Object.values(b))));
