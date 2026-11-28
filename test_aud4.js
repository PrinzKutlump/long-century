"use strict";
/* AUD4 probes (audit tests only, no game code changed).
 * A6 factory and mine output over 24 months; A15 Red Sea to Mediterranean sea route; A19 randomness
 * in combat across seeds; A20 Ottoman reach to Syria, Egypt, Libya and Greece; B1 same rules for
 * every nation; B2 unit mix in combat; B13 century budgets (reads /tmp/lc_last_run.txt, written by
 * `node century.js 7 SWI --quiet`).
 * Findings are printed as FINDING lines; the exit code is 0 unless the harness crashes. */
const { readFileSync, readdirSync, existsSync } = require("node:fs");
const path = require("node:path");
const LT = require("./load_test_engine");

const check = (ok, text) => { if (ok) console.log("ok   " + text); else console.log("FINDING " + text); };
const API_EXTRA = ";globalThis.API=globalThis.API||{};globalThis.API.Q={newGame,monthTick,execCommand,P,provsOf,getG:()=>G,getSea:()=>SEAADJ,getAdj:()=>ADJ,CMD_KINDS,UNITS,REGION,SEAREG,REG_OF,WORLD,mkArmy,fight,declareWar};";
const A = LT(API_EXTRA).API.Q;

const sumNum = v => typeof v === "number" ? v : (v && typeof v === "object" ? Object.values(v).reduce((s, x) => s + sumNum(x), 0) : 0);
const aliveTags = () => Object.keys(A.getG().c).filter(t => A.getG().c[t].alive);
const bySize = tags => tags.slice().sort((a, b) => A.provsOf(b).length - A.provsOf(a).length);

/* A6. Factory and mine output */
try {
 A.newGame(null, 7);
 const alive = aliveTags();
 const pref = ["GBR", "FRA", "RUS"].filter(t => alive.includes(t));
 const big = pref.concat(bySize(alive).filter(t => !pref.includes(t))).slice(0, 3);
 const outNow = () => {
  let all = 0, mines = 0;
  for (const p of A.getG().plist) {
   if (!big.includes(p.o)) continue;
   const s = sumNum(p._out);
   all += s;
   if (p.mine) mines += s;
  }
  return { all, mines };
 };
 A.monthTick();
 const m1 = outNow();
 for (let i = 1; i < 24; i++) A.monthTick();
 const m24 = outNow();
 console.log("info A6 nations " + big.join(", ") + "; monthly output month 1 " + m1.all.toFixed(1) + ", month 24 " + m24.all.toFixed(1) + "; mine provinces month 24 " + m24.mines.toFixed(1));
 check(m24.all > 0, "A6 total output of the three nations is above zero after 24 months (" + m24.all.toFixed(1) + ")");
 check(m24.all > m1.all, "A6 total output grows from month 1 to month 24 (" + m1.all.toFixed(1) + " -> " + m24.all.toFixed(1) + ")");
} catch (e) { console.log("FINDING A6 probe threw: " + e.message); }

/* A15. Sea route Red Sea to the Mediterranean */
try {
 const srcDir = path.join(__dirname, "src");
 const hits = [];
 for (const f of readdirSync(srcDir).filter(f => f.endsWith(".js"))) {
  readFileSync(path.join(srcDir, f), "utf8").split("\n").forEach((line, i) => {
   if (/suez|canal|redsea|red sea/i.test(line)) hits.push(f + ":" + (i + 1) + " " + line.slice(0, 140));
  });
 }
 console.log("info A15 source lines mentioning Suez, canal or the Red Sea: " + hits.length);
 hits.slice(0, 6).forEach(h => console.log("info A15   " + h));
 A.newGame(null, 7);
 const G1 = A.getG(), SA = A.getSea(), AD = A.getAdj();
 const red = A.SEAREG.redg.p;
 const medRegs = Object.values(A.SEAREG).filter(r => /mediterranean|aegean|adriatic|levant|ionian/i.test(String(r.name || r.n || r.id)));
 console.log("info A15 Mediterranean sea regions: " + medRegs.map(r => r.id).join(", "));
 const med = new Set(medRegs.flatMap(r => r.p));
 const seaNb = u => (SA[u] || []).map(x => x[0]);
 const allNb = u => [...new Set([...(AD[u] || []), ...seaNb(u)])];
 const bfs = (starts, nbf, goal) => {
  const prev = new Map(starts.map(s => [s, null]));
  const q = starts.slice();
  while (q.length) {
   const u = q.shift();
   if (goal(u)) { const out = []; for (let v = u; v; v = prev.get(v)) out.unshift(v); return out; }
   for (const v of nbf(u)) if (!prev.has(v)) { prev.set(v, u); q.push(v); }
  }
  return null;
 };
 const seaRoute = bfs(red, seaNb, u => med.has(u));
 const anyRoute = bfs(red, allNb, u => med.has(u));
 const canalLanes = (G1.lanes || []).filter(l => (red.includes(l[0]) && med.has(l[1])) || (red.includes(l[1]) && med.has(l[0])));
 console.log("info A15 lanes at start: " + (G1.lanes || []).length + "; Red Sea to Mediterranean lanes: " + canalLanes.length);
 console.log("info A15 sea-only route: " + (seaRoute ? seaRoute.join(" > ") : "none") + "; any-edge route: " + (anyRoute ? anyRoute.join(" > ") : "none"));
 check(!!seaRoute, "A15 a naval army in the Red Sea can reach a Mediterranean province by sea at start (" + (seaRoute ? seaRoute.join(" > ") : "no sea route, canal lane needed") + ")");
} catch (e) { console.log("FINDING A15 probe threw: " + e.message); }

/* A19. Randomness in combat across five seeds */
try {
 const seeds = [7, 11, 13, 17, 23];
 const battle = seed => {
  A.newGame(null, seed);
  const p = A.P("LON");
  p.fort = 0;
  const att = A.mkArmy("GBR", p.id, { inf: 6, cav: 2 });
  const def = A.mkArmy("FRA", p.id, { inf: 6, cav: 2 });
  A.fight(p, [att], [def], false, undefined);
  const left = a => a.u.reduce((s, u) => s + u.str, 0);
  return { att: left(att), def: left(def) };
 };
 const res = seeds.map(battle);
 res.forEach((r, i) => console.log("info A19 seed " + seeds[i] + ": attacker left " + r.att.toFixed(3) + ", defender left " + r.def.toFixed(3)));
 const dv = res.map(r => r.def), spread = Math.max(...dv) - Math.min(...dv);
 check(spread > 0 && spread <= 2, "A19 defender strength spread over five seeds is small but non-zero (" + spread.toFixed(3) + " of 8)");
 check(battle(7).def === res[0].def, "A19 the same seed gives the same battle result");
} catch (e) { console.log("FINDING A19 probe threw: " + e.message); }

/* A20. Ottoman reach to Syria, Egypt, Libya and Greece */
try {
 A.newGame(null, 7);
 const G4 = A.getG();
 const own = id => A.P(id).ctl || A.P(id).o;
 const spots = { DAM: "Syria and Palestine", CAI: "Lower Egypt", TRP: "Tripolitania (Libya)", ATH: "Greece" };
 for (const id in spots) console.log("info A20 " + id + " (" + spots[id] + "): owner " + own(id) + ", region " + A.REG_OF[id]);
 const thr = A.WORLD.provs.find(p => /thrace|edirne|istanbul|constantinople|adrianople/i.test(p.n));
 console.log("info A20 Thrace province: " + (thr ? thr.id + " (" + thr.n + "), region " + A.REG_OF[thr.id] : "none found by name"));
 check(!!(G4.c.OTT && G4.c.OTT.alive), "A20 Ottoman tag OTT is alive at start");
 for (const id of ["CAI", "TRP", "ATH"]) {
  const t = own(id);
  if (t === "OTT") { console.log("info A20 " + id + " is already OTT-owned"); continue; }
  A.newGame(null, 7);
  let r = null;
  try { r = A.declareWar("OTT", t, { k: "conquest", p: id }); } catch (e) { console.log("FINDING A20 declareWar on " + t + " threw: " + e.message); continue; }
  check(!!r, "A20 OTT can declare war on " + t + " (owner of " + id + ")");
 }
 A.newGame(null, 7);
 const AD = A.getAdj();
 const landPath = (a, b) => {
  const prev = new Map([[a, null]]);
  const q = [a];
  while (q.length) {
   const u = q.shift();
   if (u === b) { const out = []; for (let v = u; v; v = prev.get(v)) out.unshift(v); return out; }
   for (const v of AD[u] || []) if (!prev.has(v)) { prev.set(v, u); q.push(v); }
  }
  return null;
 };
 const pairs = [["DAM", "CAI", "Syria/Palestine to Egypt"], ["DAM", "TRP", "Syria/Palestine to Libya"], ["CAI", "TRP", "Egypt to Libya"]];
 if (thr) pairs.push([thr.id, "ATH", "Thrace to Greece"]);
 for (const [a, b, label] of pairs) {
  const r = landPath(a, b);
  check(r !== null, "A20 land path " + label + ": " + (r ? r.join(" > ") : "none"));
 }
} catch (e) { console.log("FINDING A20 probe threw: " + e.message); }

/* B1. Same rules for every nation: same treasury, same three orders */
try {
 A.newGame(null, 7);
 const tags = bySize(aliveTags()).slice(0, 5);
 const kinds = Object.keys(A.CMD_KINDS);
 const recK = kinds.find(k => /recruit/i.test(k)) || "recruit";
 const orders = [
  ["building", o => ({ kind: "building", province: o.pid, building: "fort" })],
  ["recruitment", o => ({ kind: recK, province: o.pid, unit: "inf", count: 1 })],
  ["programme", o => ({ kind: "programme", province: o.pid })],
 ];
 console.log("info B1 nations: " + tags.join(", ") + "; command kinds in CMD_KINDS: " + kinds.join(", "));
 for (const [label, make] of orders) {
  const verdicts = tags.map(tag => {
   const G3 = A.getG();
   const c = G3.c[tag];
   const prov = A.provsOf(tag).find(p => p.ctl === p.o && p.col) || A.provsOf(tag)[0];
   c.tr = 500000;
   const before = c.tr;
   const res = A.execCommand(tag, make({ pid: prov.id }), { auto: true });
   const verdict = res.ok ? "accepted" : "refused";
   console.log("info B1 " + label + " " + tag + ": " + verdict + (res.ok ? "" : " (" + res.why + ")") + ", treasury " + before + " -> " + c.tr);
   return verdict;
  });
  check(new Set(verdicts).size === 1, "B1 " + label + " order gets the same accept or refuse verdict for " + tags.length + " nations (" + verdicts.join(", ") + ")");
 }
} catch (e) { console.log("FINDING B1 probe threw: " + e.message); }

/* B2. Unit mix in combat, same seed */
try {
 const artK = Object.keys(A.UNITS).find(k => /art|gun/i.test(k) || A.UNITS[k].sup2 === 1) || "art";
 console.log("info B2 unit keys: " + Object.keys(A.UNITS).join(", ") + "; artillery key used: " + artK);
 const mixes = [
  ["infantry only", { inf: 8 }],
  ["infantry plus cavalry", { inf: 8, cav: 4 }],
  ["infantry plus cavalry plus artillery", { inf: 8, cav: 4, [artK]: 3 }],
 ];
 const str = a => a.u.reduce((s, u) => s + u.str, 0);
 const defLeft = [];
 for (const [label, comp] of mixes) {
  A.newGame(null, 7);
  const p = A.P("LON");
  p.fort = 0;
  const att = A.mkArmy("GBR", p.id, comp);
  const def = A.mkArmy("FRA", p.id, { inf: 8 });
  const n0 = att.u.length, d0 = def.u.length;
  A.fight(p, [att], [def], false, undefined);
  defLeft.push(str(def));
  console.log("info B2 " + label + ": attacker " + n0 + " -> " + att.u.length + " units (str " + str(att).toFixed(2) + "), defender " + d0 + " -> " + def.u.length + " (str " + str(def).toFixed(2) + ")");
 }
 check(defLeft[1] < defLeft[0] && defLeft[2] < defLeft[1], "B2 adding cavalry then artillery lowers the defender's remaining strength (" + defLeft.map(x => x.toFixed(2)).join(" > ") + ")");
} catch (e) { console.log("FINDING B2 probe threw: " + e.message); }

/* B13. Century budgets from the last century.js --quiet record */
try {
 const f = "/tmp/lc_last_run.txt";
 if (!existsSync(f)) {
  console.log("FINDING B13 no century record at " + f + " (run node century.js 7 SWI --quiet first)");
 } else {
  const txt = readFileSync(f, "utf8");
  const ms = [...txt.matchAll(/"?msPerMonth"?\s*[:=]\s*([\d.]+)/g)].map(m => +m[1]);
  const bytes = [...txt.matchAll(/"?saveBytes"?\s*[:=]\s*(\d+)/g)].map(m => +m[1]);
  if (!ms.length || !bytes.length) {
   console.log("FINDING B13 record has no msPerMonth or saveBytes fields; first 200 chars: " + txt.slice(0, 200));
  } else {
   const worstMs = Math.max(...ms), largest = Math.max(...bytes);
   console.log("info B13 worst msPerMonth " + worstMs + " (budget 130); largest saveBytes " + largest + " (budget 1000000)");
   check(worstMs <= 130, "B13 worst ms per month is within 130 ms (" + worstMs + ")");
   check(largest <= 1000000, "B13 largest save is within 1 MB (" + largest + " bytes)");
  }
 }
} catch (e) { console.log("FINDING B13 probe threw: " + e.message); }
