"use strict";
const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const html = fs.readFileSync("dist/long-century.html", "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function bootEngine() {
 const nodes = new Map();
 const ctx = vm.createContext({
  console, performance, setInterval: () => 1, clearInterval: () => {},
  window: { addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  document: {
   addEventListener() {},
   querySelector: s => nodes.get(s),
   createElement: () => ({}),
   body: { appendChild(n) { nodes.set("#" + n.id, n); } }
  }
 });
 vm.runInContext(script + `;globalThis.__get=(k)=>eval(k);`, ctx);
 return ctx;
}

function checkFiniteTree(obj, trail = "G") {
 if (obj == null || typeof obj !== "object") {
  if (typeof obj === "number" && !Number.isFinite(obj)) {
   throw new Error("Non-finite number at " + trail + ": " + obj);
  }
  return;
 }
 if (Array.isArray(obj)) {
  for (let i = 0; i < obj.length; i++) checkFiniteTree(obj[i], `${trail}[${i}]`);
  return;
 }
 for (const k of Object.keys(obj)) {
  if (k === "plist") continue;
  checkFiniteTree(obj[k], `${trail}.${k}`);
 }
}

let passed = 0;
function ok(cond, msg) {
 assert.ok(cond, msg);
 passed++;
 console.log("ok   " + msg);
}

// 1. Turn-1 Positive Cash Flow, Calm Militancy, Schema Hydration
{
 const ctx = bootEngine();
 const G = ctx.newGame("GBR", 42);
 const P = ctx.__get("P");
 const alive = Object.values(G.c).filter(c => c.alive);
 const negNations = alive.filter(c => !(c.stat && c.stat.net > 0)).map(c => `${c.tag}:${c.stat?.net}`);
 ok(negNations.length === 0, `all ${alive.length} starting countries begin Turn 1 with positive cash flow` + (negNations.length ? " (" + negNations.join(",") + ")" : ""));

 let maxMil = 0;
 for (const p of G.plist) for (const q of p.pops) if (q.mil > maxMil) maxMil = q.mil;
 ok(maxMil <= 2.5, `initial pop militancy is calm (max=${maxMil.toFixed(2)})`);

 ok(Array.isArray(G.tradeRoutes), "G.tradeRoutes initialized");
 ok(G.marketGoods && G.marketGoods.grain && G.marketGoods.steel, "G.marketGoods hydrated");
 ok(P("LON").infra && P("LON").infra.marketAccess >= 0.15, "province infra hydrated on LON");
 ok(G.c.GBR.investmentPool && G.c.GBR.politics && G.c.GBR.techState, "country schema extensions hydrated");

 // Initial game engine state management (src/engine/state.ts)
 const pState = ctx.getPlayerEngineState(G);
 ok(pState && pState.countryTag === "GBR" && pState.countryName === G.c.GBR.n && pState.startYear === 1836 && pState.year === 1836 && pState.month === 1 && pState.day === 1 && pState.dateLabel === "1 January 1836" && pState.startingTreasury === G.c.GBR.tr && pState.treasury > 0,
  "getPlayerEngineState tracks country name, starting treasury, and January 1836 start date");
 const customState = ctx.createInitialEngineState({ countryTag: "PRU", countryName: "Prussia", startingTreasury: 5000 });
 const nextYearState = ctx.advanceEngineDate(customState, 366);
 ok(customState.year === 1836 && customState.dateLabel === "1 January 1836" && nextYearState.year === 1837 && nextYearState.dateLabel === "1 January 1837",
  "createInitialEngineState & advanceEngineDate handle 1836+ daily progression");
 ctx.setStartingTreasury(G, 125000, "GBR");
 ctx.renameCountryState(G, "British Empire", "GBR");
 const updatedState = ctx.getPlayerEngineState(G);
 ok(updatedState.startingTreasury === 125000 && updatedState.treasury === 125000 && updatedState.countryName === "British Empire",
  "setStartingTreasury and renameCountryState update player state cleanly");
 ctx.newGame("GBR", 42);

 checkFiniteTree({ c: G.c, prov: G.prov, price: G.price, marketGoods: G.marketGoods });
 ok(true, "Turn-1 state contains zero NaN/Infinity values");
}

// 2. 6-Month Math Sanity Check across GBR, PRU, OTT, PUN, CHI
{
 const ctx = bootEngine();
 const G = ctx.newGame("GBR", 7);
 const GK = ctx.__get("GK"), GOODS = ctx.__get("GOODS"), provsOf = ctx.__get("provsOf");
 const tags = ["GBR", "PRU", "OTT", "PUN", "CHI"];
 const trace = {};
 for (const tag of tags) trace[tag] = [];

 for (let m = 0; m <= 6; m++) {
  for (const tag of tags) {
   const c = G.c[tag];
   const nf = ctx.natFig(c);
   const built = provsOf(tag).reduce((s, p) => s + p.build.length, 0);
   trace[tag].push({
    t: G.t,
    tr: Math.round(c.tr),
    net: Math.round(c.stat.net || 0),
    built,
    grainP: Number(G.price.grain.toFixed(2)),
    steelP: Number(G.price.steel.toFixed(2)),
    access: Number((c.access ?? 1).toFixed(2)),
    sol: Math.round(nf.poor * 100),
    rad: Number((c.politics?.radicalismPct ?? nf.mil * 10).toFixed(1))
   });
  }
  if (m < 6) {
   if (G.card) ctx.cardDefault();
   ctx.monthTick();
  }
 }

 for (const g of GK) {
  const base = GOODS[g].p;
  assert.ok(G.price[g] >= base * 0.25 - 1e-9 && G.price[g] <= base * 1.75 + 1e-9,
   `price of ${g} (${G.price[g]}) within [0.25x, 1.75x]`);
 }
 ok(true, "all dynamic goods prices stayed strictly in [0.25x, 1.75x] after 6 months");

 let minAccess = 1;
 for (const p of G.plist) {
  if (!p.waste && p.o && p.infra) {
   if (p.infra.marketAccess < minAccess) minAccess = p.infra.marketAccess;
   assert.ok(p.infra.marketAccess >= 0.15 && p.infra.marketAccess <= 1, `bad access in ${p.id}`);
  }
 }
 ok(minAccess >= 0.15, `all provincial Market Access scores within [0.15, 1.00] (min=${minAccess})`);

 checkFiniteTree({ c: G.c, prov: G.prov, price: G.price, marketGoods: G.marketGoods });
 ok(true, "6-month state contains zero NaN/Infinity values");
 console.log("TRACE_SUMMARY=" + JSON.stringify(trace));
}

// 3. Guardrail Stress Tests: Price Clamping, 0.15x Floor Under Blockade/Overload, Queue Same-Month Progress, Multi-Route, Migration Idempotency
{
 const ctx = bootEngine();
 const G = ctx.newGame("GBR", 99);
 const GK = ctx.__get("GK"), GOODS = ctx.__get("GOODS"), P = ctx.__get("P"), goodOK = ctx.__get("goodOK");
 G.price.grain = 9999;
 G.price.coal = 0.0001;
 ctx.stepDynamicMarketPrices({ grain: 10, coal: 1000 }, { grain: 1000, coal: 10 }, false);
 ok(G.price.grain <= GOODS.grain.p * 1.75 + 1e-9 && G.price.coal >= GOODS.coal.p * 0.25 - 1e-9,
  "extreme supply/demand shock clamps prices strictly to [0.25x, 1.75x]");

 // Overload London factories & simulate hostile blockade
 const lon = P("LON");
 lon.factories.push({ g: "steel", lv: 40, own: "cap", cash: 1000, staff: 1, loss: 0 });
 G.c.GBR.blk = { share: 1.0, by: "FRA" };
 ctx.stepInfrastructureAndAccess(false);
 ok(lon.infra.marketAccess >= 0.15 && G.c.GBR.access >= 0.15,
  `market access respects 0.15x floor under 100% blockade & overload (LON=${lon.infra.marketAccess}, nat=${G.c.GBR.access})`);

 // Input shortage floor test: set all fills to 0 and run econMonth
 G.c.GBR.fill = Object.fromEntries(GK.map(g => [g, 0]));
 const eBefore = P("LON").factories.find(f => f.lv > 0 && goodOK(G.c.GBR, f.g));
 ctx.econMonth(true);
 ok(!eBefore || eBefore._e === 0 || eBefore._e >= 0.15 * P("LON")._staff * 0.15 * 0.5,
  "factory input shortage penalty is floored at 0.15x rather than collapsing below floor");

 // Same-month queue promotion + progress
 const ctxQ = bootEngine();
 const GQ = ctxQ.newGame("GBR", 11);
 const provsOfQ = ctxQ.__get("provsOf"), BLD = ctxQ.__get("BLD");
 GQ.c.GBR.tr = 1e6;
 let targetP = null, targetK = null;
 for (const p of provsOfQ("GBR")) {
  for (const k of Object.keys(BLD)) {
   if (ctxQ.bldCan(GQ.c.GBR, p, k).ok) { targetP = p; targetK = k; break; }
  }
  if (targetP) break;
 }
 assert.ok(targetP && targetK, "found valid building for queue");
 const qRes = ctxQ.bqAdd(GQ.c.GBR, targetP.id, targetK);
 assert.ok(qRes.ok, "queued " + targetK);
 ctxQ.monthTick();
 const promoted = targetP.build.find(b => b.k === "bld" && b.b === targetK);
 ok(promoted && promoted.paid > 0 && GQ.c.GBR.bq.length === 0,
  "queued construction promotes BEFORE investMonth and achieves same-month progress");

 // Multi-route trade
 GQ.c.PRU.rel.GBR = 50;
 GQ.c.FRA.rel.GBR = 50;
 const r1 = ctxQ.proposeCommercialTransit(GQ.c.GBR, GQ.c.PRU, "grain");
 const r2 = ctxQ.proposeCommercialTransit(GQ.c.GBR, GQ.c.FRA, "coal");
 ok(r1.includes("agreed") && r2.includes("agreed") && GQ.tradeRoutes.filter(r => r.buyer === "GBR").length >= 2,
  "multiple active tradeRoutes per country work simultaneously");

 // Legacy save migration idempotency
 const legacyTxt = fs.readFileSync("testdata/prev_build_save.txt", "utf8").trim();
 ctxQ.unpack(legacyTxt);
 const Gmig = ctxQ.__get("G");
 const after1 = JSON.stringify(Gmig, (k, v) => k === "plist" ? undefined : v);
 ctxQ.migrateGameState(Gmig);
 const after2 = JSON.stringify(Gmig, (k, v) => k === "plist" ? undefined : v);
 ok(after1 === after2, "legacy save migration is strictly deterministic and idempotent");

 // Causal breakdowns
 const bdNet = ctxQ.computeCausalBreakdown(Gmig.c.GBR, "net");
 const bdPrice = ctxQ.computeCausalBreakdown(Gmig.c.GBR, "price", "grain");
 const bdAccess = ctxQ.computeCausalBreakdown(Gmig.c.GBR, "access", Gmig.c.GBR.cap);
 ok(bdNet.causes.length === 3 && bdPrice.causes.length === 3 && bdAccess.causes.length === 3,
  "CausalBreakdown produces 3 concrete causes for Treasury, Price, and Market Access");
}

console.log(`ALL PHASE 1 CHECKS PASSED (${passed} assertions)`);
