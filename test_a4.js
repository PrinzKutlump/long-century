"use strict";
/* A4: MODEL_REV in saves, defaults at the real load path (src/ui.js unpack), deterministic ids for legacy live projects, missing
 * historic detail is unknown and never a refund. Loads testdata/prev_build_save.txt (a pre-schema build) and
 * testdata/seed7_{1840,1866,1934}.txt (saved by older model revisions), plus a fresh save with pending work. Each is
 * saved and restored twice and run a further 12 months: no duplicated completion, no lost commitment, no refund, no NaN, and the
 * run is identical to one that was never saved. Runs on the built game (dist/long-century.html). */
const fs = require("node:fs");
const zlib = require("node:zlib");
const { engine, nonFinite } = require("./tools/a4_lib");
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const MONTHS = +(process.env.LC_A4_MONTHS || 12);

/* instrument the project transitions of an engine: every end of a project or queue order is recorded */
function watch(E) {
 E.run(`globalThis.__ends=[];globalThis.__qends=[];globalThis.__completions=[];
  (function(){const oe=endProject,oq=queueEnd;
   endProject=function(...a){const r=oe(...a);__ends.push(r);return r;};
   queueEnd=function(...a){const r=oq(...a);__qends.push(r);return r;};})();`);
}
const live = E => E.run(`(()=>{const o=[];for(const p of G.plist)for(const b of p.build)o.push({pid:b.pid,prov:p.id,k:b.k,paid:b.paid==null?null:b.paid,unk:!!b.paidUnknown,tag:p.o});return o;})()`);
const queued = E => E.run(`(()=>{const o=[];for(const t in G.c)for(const q of G.c[t].bq||[])o.push({tag:t,id:q.id,pid:t+"/"+q.id});return o;})()`);
const treasuries = E => E.run(`(()=>{const o={};for(const t in G.c)if(G.c[t].alive)o[t]=[G.c[t].tr,G.c[t].inv];return o;})()`);

function audit(name, E, before, endsFrom) {
 const ends = JSON.parse(JSON.stringify(E.run("__ends"))), qends = JSON.parse(JSON.stringify(E.run("__qends")));
 const now = live(E), nowQ = queued(E);
 /* no duplicated asset: a project id is completed or canceled at most once, and never also still live */
 const endedPid = new Map();
 for (const r of ends) endedPid.set(r.pid, (endedPid.get(r.pid) || 0) + 1);
 check([...endedPid.values()].every(n => n === 1), name + ": no project ended twice (" + ends.length + " ends, " + ends.filter(r => r.outcome === "completed").length + " completed)");
 check(!now.some(b => endedPid.has(b.pid)), name + ": no project is both ended and still live");
 const pids = now.map(b => b.pid);
 check(new Set(pids).size === pids.length && pids.every(x => typeof x === "string" && x), name + ": live project ids are unique strings (" + pids.length + ")");
 /* no lost commitment: every project (and queue order) that existed at the load is still live, or ended exactly once, or was removed with a record */
 const lost = before.live.filter(b => !pids.includes(b.pid) && !endedPid.has(b.pid));
 check(lost.length === 0, name + ": every project live at the load is still live or has an end record (" + before.live.length + " at load" + (lost.length ? ", lost " + lost.map(b => b.pid) : "") + ")");
 const qlost = before.queued.filter(q => !nowQ.some(x => x.pid === q.pid) && !endedPid.has(q.pid) && !qends.some(r => r.pid === q.pid) && !now.some(b => b.pid === q.pid));
 check(qlost.length === 0, name + ": every queued order at the load is still queued, promoted or ended with a record (" + before.queued.length + " at load)");
 /* no refund: nothing returns money; every record says recoverable 0; canceled projects show spent and unspent, or null when unknown */
 check(ends.concat(qends).every(r => r.recoverable === 0), name + ": every disposition has recoverable 0 (no refund path)");
 const cancels = ends.filter(r => r.outcome !== "completed");
 check(cancels.every(r => r.spent === null ? !!r.paidSinceLoad || r.paidSinceLoad === 0 : Number.isFinite(r.spent)), name + ": canceled projects carry a finite spent figure or an explicit unknown (" + cancels.length + " canceled)");
 const bad = nonFinite(E);
 check(bad.length === 0, name + ": no NaN or Infinity anywhere in the state" + (bad.length ? ": " + bad.slice(0, 5) : ""));
 return { ends, qends };
}

const LEGACY = ["prev_build_save.txt", "seed7_1840.txt", "seed7_1866.txt", "seed7_1934.txt"];

/* 1. MODEL_REV is its own field */
{
 const E = engine();
 E.A.newGame("SWI", 7);
 const json = E.json(), rev = +E.run("MODEL_REV"), schema = +E.run("SAVE_SCHEMA");
 const o = JSON.parse(json);
 check(o.modelRev === rev && o.saveSchema === schema && "modelRev" in o && "saveSchema" in o, "MODEL_REV " + rev + " and the codec version " + schema + " are separate fields of the save");
 const info = E.unpack(E.pack());
 check(info.savedRev === rev && info.modelRev === rev, "a save written by this build reports its revision on load (" + info.savedRev + ")");
 check(E.run("typeof G.modelRev") === "undefined" && E.run("typeof G.saveSchema") === "undefined", "the revision and the codec version are not left in the game state");
 const newer = JSON.parse(json); newer.modelRev = rev + 1;
 let refused = false; try { E.unpack("V2:" + E.run("encodeSaveBytes(SAVE_COMPRESSION.deflate(" + JSON.stringify(JSON.stringify(newer)) + ",{level:2}))")); } catch (e) { refused = /newer/.test(e.message); }
 check(refused, "a save from a newer model revision is refused");
 const legacy = JSON.parse(json); delete legacy.modelRev;
 const li = E.unpack(JSON.stringify(legacy));
 check(li.savedRev === null, "a save without modelRev (before A4) loads with an unknown revision, not a guessed one");
}

/* 2. every legacy file and a fresh save with pending work */
function fresh() {
 const E = engine();
 E.A.newGame("GBR", 7);
 const G = E.A.getG();
 E.run(`(()=>{const c=G.c.GBR;c.tr=6e6;const o=cmd=>applyCampaignCommand({...issueCampaignCommand(),...cmd});
  const rp=provsOf("GBR").find(p=>railCan(c,p).ok);if(rp)o({kind:"rail",province:rp.id});
  const fp=provsOf("GBR").find(p=>facCan(c,p,"fabric").ok);if(fp)o({kind:"factory",province:fp.id,good:"fabric"});
  let n=0;for(const p of provsOf("GBR")){for(const k of Object.keys(BLD)){if(n<3&&bldCan(c,p,k).ok){o({kind:"queue",province:p.id,building:k});n++;}}}
  })()`);
 E.advance(8);
 /* a part-funded project: the treasury runs dry while work remains; then more orders are queued and left waiting */
 E.run(`G.c.GBR.tr=300`); E.advance(2);
 E.run(`(()=>{const c=G.c.GBR;c.tr=6e6;const o=cmd=>applyCampaignCommand({...issueCampaignCommand(),...cmd});let n=0;
  for(const p of provsOf("GBR"))for(const k of Object.keys(BLD))if(n<4&&bldCan(c,p,k).ok){const r=o({kind:"queue",province:p.id,building:k});if(r.ok)n++;}
  c.tr=0;})()`);
 return E;
}
const SOURCES = LEGACY.map(f => ({ name: f, load: E => E.unpack(fs.readFileSync("testdata/" + f, "utf8").trim()) }))
 .concat([{ name: "fresh save with pending work (GBR, month 10)", fresh: true }]);
const summary = [];
for (const src of SOURCES) {
 const name = src.name;
 let z0, info = null;
 if (src.fresh) { const E0 = fresh(); z0 = E0.pack(); check(live(E0).length + queued(E0).length >= 2, name + ": the fixture really has pending work (" + live(E0).length + " live projects, " + queued(E0).length + " queued)"); }
 else z0 = fs.readFileSync("testdata/" + src.name, "utf8").trim();
 /* reference: load, run MONTHS months */
 const R = engine(); info = R.unpack(z0); watch(R);
 const before = { live: live(R), queued: queued(R), tr: treasuries(R) };
 const t0 = R.A.getG().t;
 if (!src.fresh) check(info.savedRev === null || info.savedRev < +R.run("MODEL_REV"), name + ": an older save reports its revision as " + (info.savedRev === null ? "unknown" : info.savedRev));
 check(before.live.every(b => typeof b.pid === "string" && b.pid) && new Set(before.live.map(b => b.pid)).size === before.live.length, name + ": every live project has a unique id after the load (" + before.live.length + ", " + JSON.stringify(info.defaults) + ")");
 const R2 = engine(); R2.unpack(z0);
 check(JSON.stringify(live(R).map(b => b.pid)) === JSON.stringify(live(R2).map(b => b.pid)), name + ": the ids given to legacy projects are the same on every load (deterministic)");
 const jsonAfterLoad = R.json();
 R.advance(MONTHS);
 const dRef = R.digest();
 audit(name, R, before);
 /* save, restore twice (text -> state -> text -> state), no months in between: the text is stable */
 const E1 = engine(); E1.unpack(z0); const z1 = E1.pack();
 const E2 = engine(); E2.unpack(z1); const z2 = E2.pack();
 const E3 = engine(); E3.unpack(z2);
 check(E1.json() === E2.json() && E2.json() === E3.json(), name + ": save, restore, save, restore gives byte-identical save text (defaults are idempotent)");
 check(E3.json() === jsonAfterLoad, name + ": the restored state equals the state of the first load");
 watch(E3);
 const before3 = { live: live(E3), queued: queued(E3) };
 E3.advance(MONTHS);
 check(E3.digest().full === dRef.full && E3.digest().eco === dRef.eco, name + ": restored twice then run " + MONTHS + " months equals the run that was never re-saved (digest " + dRef.full.slice(0, 10) + ")");
 audit(name + " (restored twice)", E3, before3);
 /* save in the middle of the run and resume in a fresh engine */
 const M = engine(); M.unpack(z0); M.advance(MONTHS >> 1);
 const zm = M.pack();
 const M2 = engine(); M2.unpack(zm); watch(M2);
 const beforeM = { live: live(M2), queued: queued(M2) };
 M2.advance(MONTHS - (MONTHS >> 1));
 check(M2.digest().full === dRef.full && M2.digest().eco === dRef.eco, name + ": saved after " + (MONTHS >> 1) + " months, resumed in a fresh engine, equals the uninterrupted run");
 audit(name + " (mid-run resume)", M2, beforeM);
 summary.push({ name, t0, rev: info.savedRev, ids: before.live.length, queued: before.queued.length, defaults: info.defaults, digest: dRef.full.slice(0, 12), bytes: z0.length });
}

/* 3. a legacy project that is canceled after the load: nothing is refunded, and what is unknown stays unknown */
{
 const E = engine(); E.unpack(fs.readFileSync("testdata/seed7_1866.txt", "utf8").trim()); watch(E);
 const target = E.run(`(()=>{for(const p of G.plist){if(!p.o||!p.build.length)continue;const b=p.build.find(x=>x.paidUnknown);if(b)return{id:p.id,o:p.o,pid:b.pid};}return null;})()`);
 check(!!target, "legacy project available to cancel: " + JSON.stringify(target));
 if (target) {
  const other = E.run(`Object.keys(G.c).find(t=>G.c[t].alive&&t!==${JSON.stringify(target.o)}&&provsOf(t).length)`);
  const tr0 = E.run(`[G.c[${JSON.stringify(target.o)}].tr,G.c[${JSON.stringify(target.o)}].inv,G.c[${JSON.stringify(other)}].tr]`);
  E.run(`transferProv(P(${JSON.stringify(target.id)}),${JSON.stringify(other)})`);
  const rec = JSON.parse(JSON.stringify(E.run("__ends")))[0];
  const tr1 = E.run(`[G.c[${JSON.stringify(target.o)}].tr,G.c[${JSON.stringify(target.o)}].inv,G.c[${JSON.stringify(other)}].tr]`);
  check(rec && rec.pid === target.pid && rec.outcome === "canceled" && rec.recoverable === 0, "canceled legacy project: one record, recoverable 0");
  check(rec && rec.spent === null && rec.paidSinceLoad === 0, "canceled legacy project: the amount paid before the load is unknown (spent null), not zero");
  check(tr1[0] <= tr0[0] && tr1[1] <= tr0[1] && tr1[2] <= tr0[2], "canceled legacy project: no treasury or pool received money");
 }
}
console.log(JSON.stringify(summary));
process.exitCode = failed ? 1 : 0;
