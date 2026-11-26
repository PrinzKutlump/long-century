"use strict";
/* Stress run: one full century on the built game with invariant checks, outcome records,
 * optional command fuzzing for the played nation and optional save/resume checks.
 * Usage: node tools/stress/run.js --seed 7 --player SWI [--fuzz N] [--resume 120,480] [--span 24] [--out f.json]
 * --player AI runs with no human seat. Reads dist/long-century.html (python3 build.py first).
 * Test tooling only: it reads game state and issues orders through execCommand; it changes no game code. */
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const { performance } = require("node:perf_hooks");

const argv = process.argv.slice(2);
const opt = (name, dflt) => { const i = argv.indexOf("--" + name); return i < 0 ? dflt : argv[i + 1]; };
const SEED = +opt("seed", 7), PLAYER = opt("player", "SWI") === "AI" ? null : opt("player", "SWI");
const FUZZ = +opt("fuzz", 0), SPAN = +opt("span", 24), END = +opt("months", 1200);
const RESUME = (opt("resume", "") || "").split(",").filter(Boolean).map(Number);
const OUT = opt("out", null);
const BUILD = opt("build", __dirname + "/../../dist/long-century.html");
const SRC = fs.readFileSync(BUILD, "utf8").match(/<script>([\s\S]*)<\/script>/)[1];

/* Keys that are not material state (same list as tools/a0_lib.js EXCLUDE) plus "_" scratch keys. */
const { EXCLUDE } = require("../a0_lib");

const INSTR = `
const __EX=new Set(__X);
const __rep=(k,v)=>{
 if(__EX.has(k)||k.charCodeAt(0)===95)return undefined;
 if(!v||typeof v!=="object"||Array.isArray(v))return v;
 return Object.fromEntries(Object.keys(v).sort().map(key=>[key,v[key]]));
};
const __M={endWar:{},defaults:[],spawned:[],rebelWins:[],formed:[],restored:[]};
{const f=endWar;endWar=function(w,winner){if(w&&G.wars.includes(w))__M.endWar[w.id]={t:G.t,winner};return f.apply(this,arguments);};}
{const f=defaultDebt;defaultDebt=function(c,v){__M.defaults.push({t:G.t,tag:c.tag,voluntary:!!v,debt:Math.round(c.debt||0)});return f.apply(this,arguments);};}
{const f=spawnNation;spawnNation=function(tag,n,a,b,c2,d,e,provs,from){const r=f.apply(this,arguments);__M.spawned.push({t:G.t,tag,from});return r;};}
{const f=rebelWin;rebelWin=function(c,key){__M.rebelWins.push({t:G.t,tag:c.tag,key});return f.apply(this,arguments);};}
{const f=restoreNation;restoreNation=function(tag){const r=f.apply(this,arguments);if(r)__M.restored.push({t:G.t,tag});return r;};}
{const f=formNation;formNation=function(c,tag){const r=f.apply(this,arguments);if(c.formed===tag&&!__M.formed.some(x=>x.tag===tag))__M.formed.push({t:G.t,tag,by:c.tag});return r;};}
return {
 newGame,monthTick,advanceCampaign,cardDefault,pack,unpack,execCommand,issueCampaignCommand,
 G:()=>G,P,formedAlive,provsOf,popOf,isGP,yearOf,dateStr,armyStr:typeof armyStr==="function"?armyStr:null,
 BLD,RECIPE,TF,MOD_BY,PROGRAMMES,__M,
 full:()=>JSON.stringify(G,__rep),
 facLvl:typeof facLvl==="function"?facLvl:null,
 setUID:v=>{UID=v;},getUID:()=>UID
};`;

function engine() {
 const nodes = new Map();
 const b = {
  console: { log() {}, warn() {}, error() {}, info() {} }, performance,
  window: { addEventListener() {} }, setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}),
   body: { appendChild(n) { nodes.set("#" + n.id, n); } } },
  __X: EXCLUDE
 };
 return vm.compileFunction(SRC + "\n;\n" + INSTR, Object.keys(b))(...Object.values(b));
}

const sha = s => crypto.createHash("sha1").update(s).digest("hex");
const fin = x => typeof x === "number" && Number.isFinite(x);
/* Fuzzer randomness: its own generator, never the game's rng(). */
let fz = (SEED * 2654435761) >>> 0 || 1;
const frand = () => { fz ^= fz << 13; fz >>>= 0; fz ^= fz >>> 17; fz ^= fz << 5; fz >>>= 0; return fz / 4294967296; };
const fpick = a => a[Math.floor(frand() * a.length)];

const out = {
 seed: SEED, player: PLAYER || "AI", fuzz: FUZZ, ok: true, error: null, lastMonth: 0,
 violations: {}, firstViolation: {}, decades: [], wars: [], destroyed: [], westernised: [], gp: {},
 armyTop: {}, factories1900: {}, literacy1900: {}, negTreasury: {}, minTreasury: {}, debtMax: {},
 fuzzStats: { issued: 0, ok: 0, refused: 0, stale: 0, doubleSpend: 0, refusedMutated: 0, negAfterOk: 0, errors: 0, kinds: {} },
 resume: [], timing: {}, formations: {}
};
const violate = (kind, month, detail) => {
 out.violations[kind] = (out.violations[kind] || 0) + 1;
 if (!out.firstViolation[kind]) out.firstViolation[kind] = { month, detail: String(detail).slice(0, 300) };
};

function checkInvariants(A, month) {
 const G = A.G();
 for (const tag in G.c) {
  const c = G.c[tag];
  if (!c.alive) continue;
  for (const k of ["tr", "debt", "pres", "rp", "infamy", "we", "lit"]) if (c[k] !== undefined && !fin(c[k])) violate("nonFinite." + k, month, tag + "=" + c[k]);
  if (c.tr < 0) { out.negTreasury[tag] = (out.negTreasury[tag] || 0) + 1; }
  if (fin(c.tr)) out.minTreasury[tag] = Math.min(out.minTreasury[tag] ?? Infinity, Math.round(c.tr));
  if (fin(c.debt)) out.debtMax[tag] = Math.max(out.debtMax[tag] || 0, Math.round(c.debt));
  if (!A.provsOf(tag).length) violate("aliveWithoutProvinces", month, tag);
 }
 for (const p of G.plist) {
  if (p.o && (!G.c[p.o] || !G.c[p.o].alive)) violate("provinceOwnedByDeadNation", month, p.id + " o=" + p.o);
  if (p.ctl && p.ctl !== "REB" && !G.c[p.ctl]) violate("provinceControllerUnknown", month, p.id + " ctl=" + p.ctl);
  if (!fin(p.pop) || p.pop < 0) violate("provincePop", month, p.id + " pop=" + p.pop);
  for (const k of ["rail", "fort", "port"]) if (p[k] !== undefined && (!fin(p[k]) || p[k] < 0)) violate("provinceLevel." + k, month, p.id + "=" + p[k]);
  for (const x of p.pops || []) {
   if (!fin(x.n) || x.n < 0) { violate("popSize", month, p.id + " " + x.t + " n=" + x.n); break; }
   if (x.cash !== undefined && !fin(x.cash)) { violate("popCash", month, p.id + " " + x.t + " cash=" + x.cash); break; }
   if (x.mil !== undefined && !fin(x.mil)) { violate("popMilitancy", month, p.id + " " + x.t); break; }
  }
 }
 for (const g in G.price) if (!fin(G.price[g]) || G.price[g] <= 0) violate("price", month, g + "=" + G.price[g]);
 for (const a of G.armies) {
  if (a.o === "REB") { /* rebel armies have the pseudo-owner REB */ }
  else if (!G.c[a.o]) violate("armyUnknownOwner", month, a.id + " o=" + a.o);
  else if (!G.c[a.o].alive) violate("armyDeadOwner", month, a.id + " o=" + a.o);
  if (a.loc && !A.P(a.loc)) violate("armyBadLocation", month, a.id + " loc=" + a.loc);
  for (const u of a.u || []) if (!fin(u.str) || u.str < 0 || !fin(u.org)) { violate("unitStrength", month, a.id + " " + u.k + " str=" + u.str); break; }
 }
 for (const w of G.wars) {
  if (!w.att?.length || !w.def?.length) violate("warEmptySide", month, "war " + w.id);
  for (const t of [...(w.att || []), ...(w.def || [])]) if (t !== "REB" && !G.c[t]) violate("warUnknownParticipant", month, "war " + w.id + " " + t);
  if (w.att?.some(t => w.def?.includes(t))) violate("warBothSides", month, "war " + w.id);
 }
}

/* One fuzz order for the player: mostly plausible, some deliberately wrong or stale. */
function fuzzOrder(A) {
 const G = A.G(), me = G.c[G.player];
 const mine = A.provsOf(G.player), any = G.plist;
 const kinds = ["building", "building", "queue", "rail", "factory", "research", "researchQueue", "reform", "programme",
  "queueRemove", "queueMove", "subject", "nonsense"];
 const kind = fpick(kinds);
 const cmd = Object.assign(A.issueCampaignCommand(G.player), { kind });
 const prov = (frand() < 0.85 && mine.length ? fpick(mine) : fpick(any)).id;
 if (["building", "queue"].includes(kind)) { cmd.province = prov; cmd.building = frand() < 0.95 ? fpick(Object.keys(A.BLD)) : "nope"; }
 if (kind === "rail") cmd.province = prov;
 if (kind === "factory") { cmd.province = prov; cmd.good = frand() < 0.95 ? fpick(Object.keys(A.RECIPE)) : "nope"; }
 if (kind === "research" || kind === "researchQueue") cmd.tech = frand() < 0.95 ? fpick(Object.keys(A.TF)) : "nope";
 if (kind === "reform") cmd.reform = fpick(Object.keys(A.MOD_BY));
 if (kind === "programme") { const ids = Object.keys(A.PROGRAMMES); cmd.id = ids.length ? fpick(ids) : "x"; cmd.choice = fpick(["a", "b", "c", "reform", "wait", "x"]); }
 if (kind === "queueRemove" || kind === "queueMove") { const q = me.bq || []; cmd.id = q.length && frand() < 0.8 ? fpick(q).id : "none"; cmd.direction = fpick([-1, 1, 2]); }
 if (kind === "subject") { cmd.target = fpick(Object.keys(G.c)); cmd.term = fpick(["compact", "release", "bad"]); }
 if (frand() < 0.05) cmd.month = G.t - 1;          /* stale month */
 if (frand() < 0.05) cmd.serial += 5;             /* wrong serial */
 return cmd;
}

function fuzzMonth(A) {
 const G = A.G();
 if (!G.player || !G.c[G.player]?.alive) return;
 const S = out.fuzzStats;
 for (let i = 0; i < FUZZ; i++) {
  const cmd = fuzzOrder(A), me = G.c[G.player];
  const prov = cmd.province ? A.P(cmd.province) : null;
  const before = JSON.stringify([me.tr, me.rp, me.res, me.resQ, me.bq, me.modRef, prov && prov.build, prov && prov.factories, prov && prov.rail]);
  const trBefore = me.tr;
  let r;
  try { r = A.execCommand(G.player, cmd); } catch (e) { S.errors++; violate("fuzzException." + cmd.kind, G.t, e.stack || e); continue; }
  S.issued++; S.kinds[cmd.kind] = (S.kinds[cmd.kind] || 0) + 1;
  if (r && r.ok) {
   S.ok++;
   if (trBefore >= 0 && me.tr < 0 && cmd.kind !== "programme") { S.negAfterOk++; violate("fuzzTreasuryNegativeAfterOrder." + cmd.kind, G.t, me.tr); }
   let r2; try { r2 = A.execCommand(G.player, cmd); } catch (e) { r2 = { ok: true }; }
   if (r2 && r2.ok) { S.doubleSpend++; violate("fuzzDoubleTapAccepted." + cmd.kind, G.t, JSON.stringify(cmd)); }
  } else {
   S.refused++;
   if (r && /expired|already been used/.test(r.why || "")) S.stale++;
   const after = JSON.stringify([me.tr, me.rp, me.res, me.resQ, me.bq, me.modRef, prov && prov.build, prov && prov.factories, prov && prov.rail]);
   if (after !== before) { S.refusedMutated++; violate("fuzzRefusedButMutated." + cmd.kind, G.t, (r && r.why) + " " + JSON.stringify(cmd)); }
  }
 }
}

function step(A) {
 const G = A.G(), month = G.t;
 if (G.card) A.cardDefault();
 if (G.player && G.c[G.player]?.alive) { const r = A.advanceCampaign(month); if (r === null && G.t === month) A.monthTick(); }
 else A.monthTick();
 if (A.G().t !== month + 1) throw new Error("Month did not advance at " + month);
}

function diffTop(a, b) {
 const x = JSON.parse(a), y = JSON.parse(b), keys = [];
 const walk = (p, u, v, depth) => {
  if (keys.length > 12) return;
  if (JSON.stringify(u) === JSON.stringify(v)) return;
  if (depth > 3 || typeof u !== "object" || typeof v !== "object" || !u || !v) { keys.push(p); return; }
  for (const k of new Set([...Object.keys(u), ...Object.keys(v)])) walk(p + "." + k, u[k], v[k], depth + 1);
 };
 walk("G", x, y, 0);
 return keys;
}

function resumeCheck(A, at) {
 /* A is at month `at`. Pack, load into a fresh engine, run both SPAN months, compare material state every 12. */
 const text = A.pack();
 const B = engine();
 let rec = { at, span: SPAN, ok: true, firstDiff: null, bytes: text.length };
 try { B.unpack(text); } catch (e) { rec.ok = false; rec.firstDiff = { month: at, keys: ["unpack failed: " + e.message] }; return rec; }
 const a0 = A.full(), b0 = B.full();
 if (a0 !== b0) { rec.ok = false; rec.firstDiff = { month: at, keys: diffTop(a0, b0) }; return rec; }
 for (let m = 1; m <= SPAN; m++) {
  step(A); step(B);
  if (m % 12 === 0 || m === SPAN) {
   const a = A.full(), b = B.full();
   if (a !== b) { rec.ok = false; rec.firstDiff = { month: A.G().t, keys: diffTop(a, b) }; break; }
  }
 }
 return rec;
}

function yearly(A) {
 const G = A.G(), y = A.yearOf(G.t);
 if ([1850, 1870, 1890, 1900, 1914, 1936].includes(y)) out.gp[y] = [...(G.gp || [])];
 if (y === 1914 && A.armyStr) {
  const s = Object.keys(G.c).filter(t => G.c[t].alive).map(t => [t, Math.round(A.armyStr(t) || 0)]).sort((a, b) => b[1] - a[1]).slice(0, 10);
  out.armyTop[1914] = s;
 }
 if (y === 1900) {
  for (const t of G.gp || []) {
   const c = G.c[t]; if (!c) continue;
   out.literacy1900[t] = Math.round((c.lit || 0) * 100);
   out.factories1900[t] = A.provsOf(t).reduce((s, p) => s + (p.factories || []).reduce((q, f) => q + (f.lv || f.l || 1), 0), 0);
  }
 }
}

function main() {
 const A = engine();
 A.newGame(PLAYER, SEED);
 const G0 = A.G();
 if (PLAYER && !G0.c[PLAYER]?.alive) throw new Error("Unknown playable nation " + PLAYER);
 let alive = new Set(Object.keys(G0.c).filter(t => G0.c[t].alive));
 let civ = new Set(Object.keys(G0.c).filter(t => G0.c[t].civ));
 const seen = new Map(G0.wars.map(w => [w.id, w]));
 const warRec = w => ({ id: w.id, start: w.start, att: w.att?.[0], def: w.def?.[0], k: w.goal?.k || null, hist: !!w.goal?.hist,
  civil: !!w.civil, n: (w.att?.length || 0) + (w.def?.length || 0) });
 for (const w of G0.wars) out.wars.push(warRec(w));
 let spent = 0, worst = 0, tDec = performance.now();
 const resumeAt = new Set(RESUME);
 while (A.G().t < END) {
  const G = A.G();
  if (resumeAt.delete(G.t)) { out.resume.push(resumeCheck(A, G.t)); continue; }
  if (FUZZ) fuzzMonth(A);
  const t0 = performance.now();
  step(A);
  const dt = performance.now() - t0; spent += dt; worst = Math.max(worst, dt);
  const G2 = A.G(), month = G2.t;
  out.lastMonth = month;
  checkInvariants(A, month);
  for (const w of G2.wars) if (!seen.has(w.id)) { seen.set(w.id, w); out.wars.push(warRec(w)); }
  const live = new Set(G2.wars.map(w => w.id));
  for (const rec of out.wars) if (rec.end === undefined && !live.has(rec.id)) {
   rec.end = month; const e = A.__M.endWar[rec.id]; rec.winner = e ? e.winner : null;
  }
  for (const t of alive) if (!G2.c[t]?.alive) out.destroyed.push({ t: month, tag: t });
  alive = new Set(Object.keys(G2.c).filter(t => G2.c[t].alive));
  for (const t of Object.keys(G2.c)) if (G2.c[t].civ && !civ.has(t)) { civ.add(t); out.westernised.push({ t: month, tag: t }); }
  for (const tag of ["GER", "ITA", "CSA"]) if (!out.formations[tag] && (G2.c[tag]?.alive || A.formedAlive(tag))) out.formations[tag] = month;
  if (month % 12 === 0) yearly(A);
  if (month % 120 === 0) {
   const text = A.pack();
   out.decades.push({ year: A.yearOf(month), msPerMonth: +(spent / 120).toFixed(1), worstMonthMs: +worst.toFixed(1),
    wallS: +((performance.now() - tDec) / 1000).toFixed(1), saveBytes: text.length, heapMB: Math.round(process.memoryUsage().heapUsed / 1048576),
    alive: alive.size, wars: G2.wars.length });
   spent = 0; worst = 0; tDec = performance.now();
  }
 }
 const G = A.G();
 out.metrics = Object.assign({}, A.__M); delete out.metrics.endWar;
 out.final = { year: A.yearOf(G.t), alive: alive.size, gp: G.gp, playerAlive: PLAYER ? !!G.c[PLAYER]?.alive : null,
  playerProvinces: PLAYER ? A.provsOf(PLAYER).length : null, hash: sha(A.full()) };
}

try { main(); }
catch (e) { out.ok = false; out.error = String(e.stack || e).split("\n").slice(0, 6).join("\n"); }
const json = JSON.stringify(out);
if (OUT) fs.writeFileSync(OUT, json);
const vio = Object.entries(out.violations).map(([k, v]) => k + ":" + v).join(" ") || "none";
const resumeFailed = out.resume.some(result => !result.ok);
const status = !out.ok ? "ERROR " + out.error.split("\n")[0] : resumeFailed ? "RESUME FAILED" : "OK";
const rs = out.resume.map(r => r.at + (r.ok ? "ok" : "FAIL")).join(",") || "-";
console.log(`stress seed=${SEED} player=${out.player} fuzz=${FUZZ}: ${status}; month=${out.lastMonth};` +
 ` wars=${out.wars.length}; destroyed=${out.destroyed.length}; violations=${vio}; resume=${rs}`);
process.exitCode = out.ok && !resumeFailed ? 0 : 1;
