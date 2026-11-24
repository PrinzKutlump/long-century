"use strict";
/* A0 observer-neutral harness (shared by test_observer.js and tools/a0_*.js).
 * Loads independent copies of the engine through load_test_engine.js (or, for the counterfactual
 * runs only, a source-patched copy), advances them in lockstep from one seed and one command
 * list, and compares a material-state digest that ignores who is watching.
 * Nothing here changes engine behaviour. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const loadTestEngine = require("../load_test_engine");

const ROOT = path.join(__dirname, "..");
/* Keys that are not material state: UI selection, report caches, messages/dispatches, control flags.
 * Everything whose key starts with "_" is a per-month scratch value or cache and is ignored too. */
const EXCLUDE = [
 "msgs", "log", "player", "plist", "card", "ai", "agenda", "cabinetBase", "commandSerial", "actorSerial", "orderId", "cabinetTreaties",
 "completedWorks", "constructionLedger", "constructionSequence", "ledgerId", "lastProgress", "tradeReceipts",
 "landUse", "employerAccount", "localMarket", "hist", "grainFreight"
];

const API_SOURCE = `
;(function(){
 const EX=new Set(${JSON.stringify(EXCLUDE)});
 const rep=(k,v)=>{
  if(EX.has(k)||k.charCodeAt(0)===95)return undefined;
  if(!v||typeof v!=="object"||Array.isArray(v))return v;
  return Object.fromEntries(Object.keys(v).sort().map(key=>[key,v[key]]));
 };
 const nat=c=>({alive:c.alive,tr:c.tr,inv:c.inv,debt:c.debt,insol:c.insol,capPool:c.capPool});
 const eco=()=>{const n={};for(const t in G.c)n[t]=nat(G.c[t]);
  return JSON.stringify({t:G.t,seed:G.seed,price:G.price,pricePrev:G.pricePrev,tight:G.tight,nations:n,prov:G.prov},rep);};
 const full=()=>JSON.stringify(G,rep);
 const HOOK_NAMES=["purgeWars","allocateLocalHouseholds","moneyMonth","investMonth","econMonth","socMonth","researchMonth","polMonth","eventsMonth","gwMonth","decMonth","diploMonth","thMonth","armyMonth","aiMonth","roundHouseholdState"];
 let cb=null;
 const hook=(name,fn)=>function(...a){const r=fn.apply(this,a);if(cb)cb(name);return r;};
 purgeWars=hook("purgeWars",purgeWars);allocateLocalHouseholds=hook("allocateLocalHouseholds",allocateLocalHouseholds);
 moneyMonth=hook("moneyMonth",moneyMonth);investMonth=hook("investMonth",investMonth);econMonth=hook("econMonth",econMonth);
 socMonth=hook("socMonth",socMonth);researchMonth=hook("researchMonth",researchMonth);polMonth=hook("polMonth",polMonth);
 eventsMonth=hook("eventsMonth",eventsMonth);gwMonth=hook("gwMonth",gwMonth);decMonth=hook("decMonth",decMonth);
 diploMonth=hook("diploMonth",diploMonth);thMonth=hook("thMonth",thMonth);armyMonth=hook("armyMonth",armyMonth);
 aiMonth=hook("aiMonth",aiMonth);roundHouseholdState=hook("roundHouseholdState",roundHouseholdState);
 globalThis.API={RECIPE,newGame,monthTick,cardDefault,getG:()=>G,P,provsOf,railCan,startRail,facCan,startFactory,bldCan,startBld,dateStr,
  eco,full,onEvent:f=>{cb=f;},EX:[...EX]};
})();`;

/* ---- source patches, used ONLY by the counterfactual and measurement tools (never by test_observer.js) ----
 * Each hook defaults to the engine's own behaviour when globalThis.__CF has no override, so an unconfigured patched engine is
 * byte-identical in behaviour. Every patch must match exactly once. */
const PATCHES = {
 /* A4: the A0 patches "parts" (participant list ["PUN",G.player]) and "hpe" (hasProvincialEconomy) patched code that A3 removed. "parts" now
  * targets the single household-market participant list so a tool can switch the household economy off (base cost) or restrict it. */
 parts: ['const participants=warm?[]:Object.keys(G.c).filter(tag=>G.c[tag].alive);',
  'const participants=warm?[]:(globalThis.__CF&&globalThis.__CF.parts?globalThis.__CF.parts():Object.keys(G.c).filter(tag=>G.c[tag].alive));'],
 ledger: ['const ledger=tag===G.player||payer.tag===G.player?constructionAccount(p,b):null;',
  'const ledger=(globalThis.__CF&&globalThis.__CF.ledger?globalThis.__CF.ledger(tag,payer.tag):(tag===G.player||payer.tag===G.player))?constructionAccount(p,b):null;'],
 pay: ['payer[balance]-=cost;', 'const __before=payer[balance];payer[balance]-=cost;if(globalThis.__CF&&globalThis.__CF.onPay)globalThis.__CF.onPay(payer,balance,cost,bill,__before,tag,p,b,fraction);']
};
function patchSource(source, names) {
 let out = source;
 for (const n of names) {
  const [from, to] = PATCHES[n];
  const hits = out.split(from).length - 1;
  if (hits !== 1) throw new Error("patch " + n + " matched " + hits + " times");
  out = out.replace(from, () => to);
 }
 return out;
}
function loadPatched(names, cf) {
 const { compileFunction } = require("node:vm");
 const files = require("../engine-files.json");
 const src = files.map(f => fs.readFileSync(path.join(ROOT, "src", f), "utf8")).join("\n;\n");
 const fn = compileFunction(patchSource(src, names) + "\n;\n" + API_SOURCE, ["globalThis"]);
 const scope = { __CF: cf || {} };
 fn(scope);
 return scope.API;
}

function loadEngine(extraSource) {
 const scope = loadTestEngine(API_SOURCE + (extraSource || ""));
 return scope.API;
}

/* ---- the fixed campaign: same commands, same months, whoever is watching ---- */
const ACTORS = ["PUN", "GBR", "SWI"];

function planCommands(A, tags = ACTORS, fixture = true) {
 const G = A.getG(), plan = [];
 for (const tag of tags) {
  const c = G.c[tag], provs = A.provsOf(tag).filter(p => !p.waste && p.pop > 0).sort((a, b) => b.pop - a.pop || (a.id < b.id ? -1 : 1));
  if (!provs.length) continue;
  const at = (i) => provs[i % provs.length].id;
  plan.push({ m: 1, tag, kind: "factory", prov: at(0), good: "fabric" });
  plan.push({ m: 2, tag, kind: "bld", prov: at(0), b: "school" });
  plan.push({ m: 3, tag, kind: "factory", prov: at(0), good: "furniture" });
  plan.push({ m: 4, tag, kind: "bld", prov: at(provs.length > 1 ? 1 : 0), b: "hosp" });
  /* fixture: the payer's treasury runs dry for four months (five months of income below zero, borrowing shut), same rule for every seat */
  if (fixture) plan.push({ m: 5, tag, kind: "exhaust" });
  plan.push({ m: 9, tag, kind: "factory", prov: at(0), good: "machinery" });
  if (fixture) plan.push({ m: 12, tag, kind: "restore", tr: 4000, inv: 4000 });
 }
 return plan;
}

function applyCommands(A, plan, month) {
 const G = A.getG(), applied = [];
 for (const cmd of plan) {
  if (cmd.m !== month) continue;
  const c = G.c[cmd.tag];
  if (!c || !c.alive) continue;
  const p = cmd.prov ? A.P(cmd.prov) : null;
  let ok = false;
  if (cmd.kind === "rail" && p && A.railCan(c, p).ok) { A.startRail(c, p); ok = true; }
  else if (cmd.kind === "factory" && p && A.facCan(c, p, cmd.good).ok) { A.startFactory(c, p, cmd.good, true); ok = true; }
  else if (cmd.kind === "bld" && p && A.bldCan(c, p, cmd.b).ok) { ok = !!A.startBld(c, p, cmd.b, true).ok; }
  else if (cmd.kind === "exhaust") { c.tr = -5 * Math.max(1000, c.stat.inc || 0); c.inv = 0; c.noBorrow = G.t + 4; ok = true; }
  else if (cmd.kind === "restore") { c.tr = Math.max(c.tr, cmd.tr); c.inv = Math.max(c.inv, cmd.inv); ok = true; }
  applied.push({ ...cmd, ok });
 }
 return applied;
}

/* seat null = nobody is human. All nations stay under AI control in every run; only G.player differs. */
function createRun(seat, seed, opts = {}) {
 const A = (opts.loader || loadEngine)();
 if (opts.realInit) A.newGame(seat || null, seed); else A.newGame(null, seed);
 const G = A.getG();
 G.player = seat || null;
 if (opts.realInit && seat) G.c[seat].ai = true; /* control flag neutralised: every nation is AI-run in every run */
 const plan = planCommands(A, ACTORS, opts.fixture !== false);
 return { A, seat: seat || null, plan, hashes: [] };
}

const sha = s => crypto.createHash("sha1").update(s).digest("hex");

function stepRun(run, applied) {
 const A = run.A;
 const G = A.getG();
 const month = G.t;
 const cmds = applyCommands(A, run.plan, month);
 if (applied) applied.push(...cmds);
 if (G.card) A.cardDefault(); /* pending-card policy: every actor takes the default option */
 A.monthTick();
 if (A.getG().t !== month + 1) throw new Error("month did not advance");
}

function digestRow(run) {
 const eco = run.A.eco(), full = run.A.full();
 return { eco: sha(eco), full: sha(full) };
}

/* ---- comparing two JSON material states ---- */
function generalise(p) {
 return p.replace(/^(c|prov)\.[A-Za-z0-9_]+/, "$1.*").replace(/^nations\.[A-Za-z0-9_]+/, "nations.*")
  .replace(/^prov\.[A-Za-z0-9_]+/, "prov.*").replace(/\[\d+\]/g, "[*]");
}
function diffPaths(a, b, limit = 40) {
 const out = []; let total = 0; const groups = {};
 const note = p => { total++; const g = generalise(p); groups[g] = (groups[g] || 0) + 1; if (out.length < limit) out.push(p); };
 const walk = (x, y, p) => {
  if (x === y) return;
  if (typeof x !== "object" || typeof y !== "object" || x === null || y === null || Array.isArray(x) !== Array.isArray(y)) { note(p); return; }
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  for (const k of keys) {
   const q = Array.isArray(x) ? p + "[" + k + "]" : p ? p + "." + k : k;
   if (!(k in x) || !(k in y)) note(q); else walk(x[k], y[k], q);
  }
 };
 walk(a, b, "");
 return { paths: out, total, groups };
}
function getPath(obj, p) {
 let cur = obj;
 for (const part of p.replace(/\[(\d+)\]/g, ".$1").split(".")) { if (cur == null) return undefined; cur = cur[part]; }
 return cur;
}

const total = list => list.reduce((s, x) => s + x, 0);
const projectSummary = (p) => (p.build || []).map(b => ({
 prov: p.id, owner: p.o, k: b.k, g: b.g || b.b, payer: b.fo || (b.state ? "state" : "capital"), state: !!b.state,
 paid: +(b.paid || 0).toFixed(2), leftUnits: +total(Object.values(b.left || {})).toFixed(2)
}));

/* Re-run one month from scratch for two seats with a state digest after every phase. */
function localise(seatA, seatB, month, seed, opts = {}) {
 const mk = seat => {
  const run = createRun(seat, seed, opts);
  while (run.A.getG().t < month) stepRun(run);
  return run;
 };
 const ra = mk(seatA), rb = mk(seatB);
 const opening = tag => {
  const out = {};
  for (const [name, run] of [["a", ra], ["b", rb]]) {
   const G = run.A.getG(), c = G.c[tag];
   out[name] = c ? { tr: c.tr, inv: c.inv, debt: c.debt } : null;
  }
  return out;
 };
 const tags = ACTORS.concat(["PUN"]).filter((t, i, a) => a.indexOf(t) === i);
 const before = {};
 for (const t of tags) before[t] = opening(t);
 const record = run => {
  const ev = [];
  const G = run.A.getG();
  run.A.onEvent(name => ev.push({ name, eco: run.A.eco(), full: run.A.full() }));
  stepRun(run);
  run.A.onEvent(null);
  return ev;
 };
 const ea = record(ra), eb = record(rb);
 const result = { month, date: ra.A.dateStr(month), seatA: seatA, seatB: seatB, openingBalances: before, eventsA: ea.map(e => e.name), eventsB: eb.map(e => e.name) };
 /* allocateLocalHouseholds runs once per provincial-economy participant, so its call count is itself a seat-dependent fact:
  * compare the other phases pairwise and report the call counts separately. */
 const allocA = ea.filter(e => e.name === "allocateLocalHouseholds").length, allocB = eb.filter(e => e.name === "allocateLocalHouseholds").length;
 result.allocateLocalHouseholdsCalls = { a: allocA, b: allocB };
 const fa = ea.filter(e => e.name !== "allocateLocalHouseholds"), fb = eb.filter(e => e.name !== "allocateLocalHouseholds");
 let idx = -1;
 for (let i = 0; i < Math.min(fa.length, fb.length); i++) if (fa[i].eco !== fb[i].eco || fa[i].full !== fb[i].full) { idx = i; break; }
 if (idx < 0) { result.firstEvent = null; return result; }
 const x = fa[idx], y = fb[idx];
 result.firstEvent = { index: idx, afterPhase: x.name };
 const kind = x.eco !== y.eco ? "eco" : "full";
 result.firstEvent.digest = kind;
 const d = diffPaths(JSON.parse(x[kind]), JSON.parse(y[kind]));
 result.firstEvent.differentPaths = d.total;
 result.firstEvent.firstPaths = d.paths.slice(0, 12);
 result.firstEvent.groups = d.groups;
 /* the first divergent material field, preferring economic fields of a nation or province over the RNG word */
 const pref = d.paths.find(p => p !== "seed" && p !== "t") || d.paths[0];
 result.firstField = pref;
 /* earliest differing field that belongs to the seat's own nation (its pool, or its provinces) */
 const seat = seatB || seatA, Gx = ra.A.getG();
 if (seat) {
  const all = diffPaths(JSON.parse(x[kind]), JSON.parse(y[kind]), 1e9).paths;
  const mine = q => { const a = /^(?:nations|c)\.([A-Z0-9]+)/.exec(q), b = /^prov\.([A-Za-z0-9_]+)/.exec(q); return a ? a[1] === seat : b ? Gx.prov[b[1]].o === seat : false; };
  result.firstSeatField = all.find(mine) || null;
 }
 const ja = JSON.parse(x[kind]), jb = JSON.parse(y[kind]);
 result.firstFieldValues = { a: getPath(ja, pref), b: getPath(jb, pref) };
 /* nation and partial projects involved */
 const focus = result.firstSeatField || pref;
 const m = /^(?:nations|c)\.([A-Z0-9]+)/.exec(focus);
 const pm = /^prov\.([A-Za-z0-9_]+)/.exec(focus);
 const owner = m ? m[1] : pm ? ra.A.P(pm[1]).o : null;
 result.involvedNation = owner;
 result.actorProjects = Object.fromEntries(ACTORS.map(t => [t, { a: ra.A.provsOf(t).flatMap(projectSummary), b: rb.A.provsOf(t).flatMap(projectSummary) }]));
 if (owner) {
  const sum = run => run.A.provsOf(owner).flatMap(projectSummary);
  result.projectsA = sum(ra); result.projectsB = sum(rb);
  const Ga = ra.A.getG(), Gb = rb.A.getG();
  result.balancesAfter = { a: { tr: Ga.c[owner].tr, inv: Ga.c[owner].inv, debt: Ga.c[owner].debt }, b: { tr: Gb.c[owner].tr, inv: Gb.c[owner].inv, debt: Gb.c[owner].debt } };
 }
 return result;
}

/* Lockstep run of several seats; returns per-pair first divergent month (null when identical). */
function observerRuns(seats, months, seed, opts = {}) {
 const runs = seats.map(s => createRun(s, seed, opts));
 const rows = runs.map(r => [digestRow(r)]); /* index 0 = opening state */
 for (let m = 0; m < months; m++) {
  runs.forEach((r, i) => { stepRun(r); rows[i].push(digestRow(r)); });
 }
 const pairs = [];
 for (let i = 0; i < seats.length; i++) for (let j = i + 1; j < seats.length; j++) {
  const firstOf = kind => { for (let k = 0; k <= months; k++) if (rows[i][k][kind] !== rows[j][k][kind]) return k; return null; };
  pairs.push({ a: seats[i], b: seats[j], eco: firstOf("eco"), full: firstOf("full") });
 }
 return { seats, months, seed, pairs, rows };
}

const label = s => s || "none";
module.exports = { PATCHES, patchSource, loadPatched, ACTORS, ROOT, EXCLUDE, loadEngine, createRun, stepRun, observerRuns, localise, diffPaths, planCommands, applyCommands, digestRow, label, sha, API_SOURCE, projectSummary };
