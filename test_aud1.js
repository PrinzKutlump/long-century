"use strict";
/* AUD1 audit probes (tests only, no src change): A22 forts, A23 taxes, A24 great works.
 * Each block prints ok or FAIL with a reason. A crash in one block is reported and the other blocks still run.
 * A FAIL here is a finding for the PR body, not a reason to change src. */
const L = require("./tools/a0_lib");

let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const info = text => console.log("info " + text);
const guard = (name, fn) => { try { fn(); } catch (e) { failed++; console.log("FAIL " + name + " crashed: " + String(e && e.message || e).slice(0, 160)); } };

const API_EXTRA = `;globalThis.API.X={G:()=>G,P,provsOf,bldCan,startBld,bqAdd,BLD,GW,gwState,startGW,names:n=>n.map(x=>{try{return eval("typeof "+x);}catch(e){return "none";}})};`;
const fresh = (seat, seed = 7) => { const A = L.loadEngine(API_EXTRA); A.newGame(null, seed); A.getG().player = seat || null; return A; };
/* a province the GBR holds where a fort can be started at level 0 (same choice in every copy, engines are deterministic) */
const fortSite = (X, c) => X.provsOf("GBR").find(q => { q.fort = 0; return X.bldCan(c, q, "fort").ok; });

/* 1. A22 forts: max 5, counting queued levels, and a queued fort at max leaves the queue */
guard("A22 forts", () => {
  const A = fresh("GBR"), X = A.X, c = X.G().c.GBR;
  check(X.BLD.fort.max === 5, "A22 BLD.fort.max is " + X.BLD.fort.max + " (expected 5)");
  const p = fortSite(X, c);
  if (!p) return check(false, "A22 no GBR province can take a fort at level 0 (probe not possible)");
  p.fort = 5;
  check(!X.bldCan(c, p, "fort").ok, "A22 bldCan refuses a fort at level 5");
  p.fort = 4;
  c.tr = Math.max(c.tr, 1e9);
  const first = X.startBld(c, p, "fort", true);
  check(first.ok, "A22 first fort at level 4 started" + (first.ok ? "" : ": " + first.why));
  /* force skips the slot count only; bldCan sees level 4 (< 5), not the queued level, so the second is judged on level alone */
  const second = X.startBld(c, p, "fort", true);
  check(!second.ok, "A22 second fort while one builds at level 4 (4 + 2 queued would be 6 > 5): " + (second.ok ? "ACCEPTED" : "refused, reason: " + second.why));
  for (let m = 0; m < 30; m++) A.monthTick();
  check(p.fort <= 5, "A22 fort level after the builds finish is " + p.fort + " (max 5)");

  const B = fresh("GBR"), bx = B.X, bc = bx.G().c.GBR, bp = fortSite(bx, bc);
  if (!bp) return check(false, "A22 no site for the queued-fort probe");
  info("A22 bqAdd of a fort at level 5 returns " + JSON.stringify(bx.bqAdd(bc, bp.id, "fort")).slice(0, 120) + " (bqAdd does not call bldCan)");
  bp.fort = 5;
  const r = bx.startBld(bc, bp, "fort", false);
  check(!r.ok, "A22 startBld refuses a fort at level 5: " + r.why);
  B.monthTick();
  const left = (bc.bq || []).filter(x => x.b === "fort").length;
  check(left === 0, "A22 queued fort at max leaves the queue after one month (still queued: " + left + ")");
});

/* 2. A23 taxes: change one rate, then one monthTick, and compare monthly tax income */
guard("A23 taxes", () => {
  const A = fresh("GBR"), ca = A.X.G().c.GBR;
  info("A23 rates on GBR: c.tax = " + JSON.stringify(ca.tax) + ", c.eff.tax = " + ca.eff.tax + " (tax[0] is 'The poor' in ui3.js:72)");
  const B = fresh("GBR"), cb = B.X.G().c.GBR;
  cb.tax[0] = cb.tax[0] > 0.5 ? cb.tax[0] - 0.2 : cb.tax[0] + 0.2;
  A.monthTick();
  B.monthTick();
  const ta = A.X.G().c.GBR.stat.taxes, tb = B.X.G().c.GBR.stat.taxes;
  check(Math.abs(ta - tb) > 1e-9, "A23 changing tax[0] to " + cb.tax[0].toFixed(2) + " moves monthly taxes: " + ta.toFixed(2) + " -> " + tb.toFixed(2));
  check(Math.abs(A.X.G().c.GBR.stat.inc - B.X.G().c.GBR.stat.inc) > 1e-9, "A23 monthly income (stat.inc) moves with the same change");
});

/* 3. A24 great works: count them, look for renovate or rebuild paths, and check a built work cannot be rebuilt */
guard("A24 great works", () => {
  const A = fresh("GBR"), X = A.X, G = X.G(), c = G.c.GBR;
  const fairs = X.GW.filter(w => w.fair).length;
  check(X.GW.length > 0, "A24 " + X.GW.length + " great works defined (" + fairs + " world fairs, " + (X.GW.length - fairs) + " others)");
  const names = ["renovateGW", "repairGW", "rebuildGW", "gwRepair", "gwRenovate", "gwRebuild", "gwDamage", "damageGW", "destroyGW"];
  const kinds = X.names(names);
  info("A24 renovate/rebuild/damage functions present: " + (names.filter((_, i) => kinds[i] !== "undefined").join(", ") || "none"));
  info("A24 fields on a great work: " + Object.keys(X.GW[0]).join(", ") + " (no damage field)");
  const w = X.GW[0];
  G.gwDone = G.gwDone || {};
  G.gwDone[w.id] = ["GBR"];
  const r = X.startGW(c, w.id);
  check(!r.ok && /Already built/.test(r.txt), "A24 a built work (" + w.id + ") cannot be started again: " + r.txt);
});

console.log(failed ? failed + " check(s) reported FAIL; see the lines above" : "all AUD1 checks ok");
