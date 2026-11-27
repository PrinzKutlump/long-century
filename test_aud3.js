"use strict";
/* AUD3 probes (audit tests only, no game code changed).
 * B1: same rules for every nation (same building order, same treasury).
 * B4: Punjab flag design presence and nations without a flag design.
 * B8: count of building kinds and great works.
 * B9: count of historical events and history dispatches.
 * B15: consumers of wool, rubber and canned goods before 1860.
 * Findings are printed as FINDING lines; the exit code is 0 unless the harness crashes. */
const L = require("./tools/a0_lib");
const LT = require("./load_test_engine");

const check = (ok, text) => { if (ok) console.log("ok   " + text); else console.log("FINDING " + text); };
const API_EXTRA = ";globalThis.API=globalThis.API||{};globalThis.API.Q={newGame,yearOf,dateStr,P,provsOf,getG:()=>G,execCommand,BLD,GW,EVENTS,HISTORY_DISPATCHES,CMD_KINDS,GOODS,NEEDS,RECIPE,RGO_OUT};";
const boot = () => LT(API_EXTRA).API.Q;

let A = null;
const fresh = () => { A = boot(); A.newGame(null, 7); return A; };

/* 1. B1 same rules for every nation */
try {
 fresh();
 const G = A.getG();
 const alive = Object.keys(G.c).filter(t => G.c[t].alive);
 const want = ["SWI", "FRA", "SIK"];
 const tags = want.filter(t => alive.includes(t)).concat(alive.filter(t => !want.includes(t))).slice(0, 3);
 console.log("info B1 nations tested: " + tags.join(", "));
 const verdicts = [];
 for (const tag of tags) {
  const c = G.c[tag];
  const prov = A.provsOf(tag).find(p => p.ctl === p.o && p.col) || A.provsOf(tag)[0];
  c.tr = 500000; /* equal treasury for every nation */
  const before = c.tr;
  const res = A.execCommand(tag, { kind: "building", province: prov.id, building: "fort" }, { auto: true });
  const verdict = res.ok ? "accepted" : "refused";
  verdicts.push(verdict);
  console.log("info B1 " + tag + ": " + verdict + (res.ok ? "" : " (" + res.why + ")") + ", treasury " + before + " -> " + c.tr);
 }
 check(new Set(verdicts).size === 1, "B1 same building order gives the same accept/refuse verdict for " + tags.length + " nations (" + verdicts.join(", ") + ")");
 const kinds = Object.keys(A.CMD_KINDS);
 check(!kinds.includes("tax"), "B1 tax change is not an execCommand kind (kinds: " + kinds.join(", ") + ")");
} catch (e) { console.log("FINDING B1 probe threw: " + e.message); }

/* 2. B4 Punjab flag */
try {
 fresh();
 const G = A.getG();
 const hits = [];
 const { readFileSync } = require("node:fs");
 const flagsSrc = readFileSync(__dirname + "/src/flags.js", "utf8");
 const punjab = Object.keys(G.c).filter(t => /pun|sik/i.test(t) || /punjab/i.test(String(G.c[t].n || "")));
 console.log("info B4 Punjab-like nation ids in G.c: " + (punjab.join(", ") || "none"));
 for (const t of punjab) hits.push(t + " in flags.js: " + flagsSrc.includes(t + ':[') );
 check(punjab.length > 0 && hits.every(h => h.endsWith("true")), "B4 Punjab flag design present (" + hits.join("; ") + ")");
 const missing = Object.keys(G.c).filter(t => !flagsSrc.includes(t + ':['));
 check(missing.length === 0, "B4 every nation has a flag design" + (missing.length ? " (missing: " + missing.join(", ") + ")" : ""));
} catch (e) { console.log("FINDING B4 probe threw: " + e.message); }

/* 3. B8 counts */
try {
 fresh();
 const bk = Object.keys(A.BLD);
 const gw = A.GW.map(g => g.id || g.n || "?");
 console.log("info B8 building kinds (" + bk.length + "): " + bk.join(", "));
 console.log("info B8 great works (" + A.GW.length + "): " + gw.join(", "));
 const plan = require("node:fs").readFileSync(__dirname + "/docs/MASTER_PLAN.md", "utf8");
 check(/great works/i.test(plan), "B8 docs/MASTER_PLAN.md states the great-works target (buildings " + bk.length + ", great works " + A.GW.length + ", target about +20 buildings and +12 great works; the baseline is in docs/LEDGER.md B8 only)");
} catch (e) { console.log("FINDING B8 probe threw: " + e.message); }

/* 4. B9 events */
try {
 fresh();
 const src = require("node:fs").readFileSync(__dirname + "/src/events.js", "utf8");
 const eventCount = A.EVENTS.length;
 console.log("info B9 EVENTS in events.js: " + eventCount + " (source lines " + src.split("\n").length + ")");
 console.log("info B9 HISTORY_DISPATCHES: " + A.HISTORY_DISPATCHES.length);
 check(eventCount >= 90, "B9 historical events " + eventCount + " against target about 90");
} catch (e) { console.log("FINDING B9 probe threw: " + e.message); }

/* 5. B15 early buyers: a good needs a consumer (NEEDS tier, RECIPE input) to have a buyer */
try {
 fresh();
 const goods = ["wool", "rubber", "canned"];
 const consumers = (g) => {
  const out = [];
  (A.NEEDS || []).forEach((ptype, i) => { for (const band of ["l", "e", "x"]) if (ptype && ptype[band] && g in ptype[band]) out.push("NEEDS[" + i + "]." + band); });
  for (const r in A.RECIPE) if (A.RECIPE[r].i && g in A.RECIPE[r].i) out.push("input of " + r + (A.GOODS[r] && A.GOODS[r].y ? " (from " + A.GOODS[r].y + ")" : ""));
  return out;
 };
 const none = [];
 for (const g of goods) {
  const c = consumers(g);
  console.log("info B15 " + g + " (" + (A.GOODS[g] && A.GOODS[g].y ? "from " + A.GOODS[g].y : "from start") + "): " + (c.join("; ") || "no consumer"));
  if (!c.length) none.push(g);
 }
 check(none.length === 0, "B15 every probed good has a consumer table (no consumer: " + (none.join(", ") || "none") + ")");
} catch (e) { console.log("FINDING B15 probe threw: " + e.message); }
