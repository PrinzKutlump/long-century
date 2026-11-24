"use strict";
// Calibration harness (read-only): replays century.js's loop for an AI-only world and writes per-war and
// per-snapshot data as JSON. It does not change the engine. Usage: node tools/cal_harness.js <seed> <out.json>
const fs = require("node:fs"), vm = require("node:vm"), path = require("node:path");
const seed = +(process.argv[2] || 7), out = process.argv[3] || `/tmp/cal_seed_${seed}.json`;
const build = process.env.LC_BUILD || path.join(__dirname, "..", "dist", "long-century.html");
const source = fs.readFileSync(build, "utf8").match(/<script>([\s\S]*)<\/script>/)[1];
const nodes = new Map();
const context = {
 console: { log() {} }, performance, digest: () => "", memory: () => 0, writeSave() {}, saveAt: new Set(), emit: json => fs.writeFileSync(out, json),
 args: { seed, player: null }, window: { addEventListener() {} },
 document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild: n => nodes.set("#" + n.id, n) } }
};
const harness = `
 newGame(null, args.seed);
 const calRec = { seed: args.seed, wars: [], destroyed: [], formed: [], renamed: [], snaps: {}, gpByYear: {} };
 const CAL_SNAP = { 168: 1850, 528: 1880, 936: 1914 };
 const calLive = () => Object.keys(G.c).filter(t => G.c[t].alive);
 let calKnown = new Set(calLive());
 const calNames = Object.fromEntries(calLive().map(t => [t, G.c[t].n]));
 const calOrig = declareWar, calWars = [];
 declareWar = function (...a) {
  const before = G.wars.length, w = calOrig(...a);
  if (w && G.wars.length > before) calWars.push({ w, t: G.t, att: a[0], def: a[1], gp: (G.gp || []).slice(), goal: w.goal && w.goal.k });
  return w;
 };
 const calSnap = () => {
  const o = {};
  for (const tag of calLive()) {
   const c = G.c[tag], ps = provsOf(tag);
   let units = 0, steel = 0, iron = 0;
   for (const a of G.armies) if (a.o === tag && !a.naval && !a.reb) units += a.u.length;
   for (const p of ps) { for (const f of p.factories || []) if (f.g === "steel") steel += f._out || 0; if (p.mine === "iron") iron += (p._out && p._out.mine) || 0; }
   o[tag] = { n: c.n, civ: !!c.civ, units, steel: steel * 12, iron: iron * 12, pop: popOf(tag) };
  }
  return o;
 };
 while (G.t < 1200) {
  const before = new Set(calLive());
  monthTick();
  const now = new Set(calLive());
  for (const t of before) if (!now.has(t)) calRec.destroyed.push({ t: G.t, tag: t });
  for (const t of now) if (!calKnown.has(t)) { calRec.formed.push({ t: G.t, tag: t }); calKnown.add(t); }
  for (const t of calLive()) { if (calNames[t] && calNames[t] !== G.c[t].n) calRec.renamed.push({ t: G.t, tag: t, from: calNames[t], to: G.c[t].n }); calNames[t] = G.c[t].n; }
  if (CAL_SNAP[G.t]) calRec.snaps[CAL_SNAP[G.t]] = calSnap();
  if (G.t % 12 === 0) calRec.gpByYear[yearOf(G.t)] = (G.gp || []).slice();
 }
 calRec.wars = calWars.map(x => ({ t: x.t, att: x.att, def: x.def, goal: x.goal, gp: x.gp, sideA: x.w.att.slice(), sideD: x.w.def.slice() }));
 calRec.formedFlags = Object.values(G.c).filter(c => c.formed).map(c => ({ tag: c.tag, formed: c.formed, alive: c.alive }));
 emit(JSON.stringify(calRec));
`;
const bindings = context;
vm.compileFunction(source + "\n" + harness, Object.keys(bindings))(...Object.values(bindings));
