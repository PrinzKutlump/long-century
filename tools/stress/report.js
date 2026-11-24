"use strict";
/* Summarise a folder of tools/stress/run.js JSON results as markdown.
 * Usage: node tools/stress/report.js <dir> [> report.md]
 * Reference: COW Inter-State War Data v4.0, wars by start decade 1836-1936 (derived counts only; Sarkees and Wayman 2010). */
const fs = require("node:fs");
const path = require("node:path");
const dir = process.argv[2] || "stress-out";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && !f.startsWith("ui-"));
const uiFiles = fs.readdirSync(dir).filter(f => f.startsWith("ui-") && f.endsWith(".json"));
const runs = files.map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return null; } }).filter(Boolean);
const COW_DECADE = { 1830: 0, 1840: 4, 1850: 5, 1860: 8, 1870: 4, 1880: 3, 1890: 3, 1900: 6, 1910: 10, 1920: 2, 1930: 4 };
const yearOf = t => 1836 + Math.floor(t / 12);
const dec = t => Math.min(1930, Math.floor(yearOf(t) / 10) * 10);
const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
const f1 = x => Number.isFinite(x) ? x.toFixed(1) : "-";
const pct = (n, d) => d ? Math.round(100 * n / d) + "%" : "-";
const L = [];
const P = s => L.push(s);

const done = runs.filter(r => r.ok && r.lastMonth >= 1200);
const full = done.filter(r => !r.fuzz); /* history and outcomes: unfuzzed runs only */
P(`# Stress report\n`);
P(`Runs: ${runs.length} (finished the century: ${done.length}; errors: ${runs.filter(r => !r.ok).length}). ` +
  `Seeds: ${new Set(runs.map(r => r.seed)).size}. Seats: ${[...new Set(runs.map(r => r.player))].sort().join(", ")}.\n`);

P(`## 1. Crashes`);
const errs = runs.filter(r => !r.ok);
if (!errs.length) P(`None.\n`);
else {
 const by = {};
 for (const r of errs) { const k = (r.error || "").split("\n")[0].slice(0, 140); (by[k] = by[k] || []).push(r); }
 P(`| Error (first line) | Runs | Example (seed, seat, month) |\n|---|---|---|`);
 for (const [k, rs] of Object.entries(by).sort((a, b) => b[1].length - a[1].length))
  P(`| ${k.replace(/\|/g, "/")} | ${rs.length} | ${rs[0].seed} ${rs[0].player} m${rs[0].lastMonth} |`);
 P(`\nFirst stack:\n\n\`\`\`\n${errs[0].error}\n\`\`\`\n`);
}

P(`## 2. Invariant violations`);
const vk = {};
for (const r of runs) for (const [k, n] of Object.entries(r.violations || {})) {
 const v = vk[k] = vk[k] || { runs: 0, total: 0, ex: null };
 v.runs++; v.total += n; if (!v.ex) v.ex = `seed ${r.seed} ${r.player}, ${r.firstViolation[k].month}: ${r.firstViolation[k].detail}`;
}
if (!Object.keys(vk).length) P(`None.\n`);
else {
 P(`| Check | Runs | Total | First example |\n|---|---|---|---|`);
 for (const [k, v] of Object.entries(vk).sort((a, b) => b[1].runs - a[1].runs)) P(`| ${k} | ${v.runs} | ${v.total} | ${v.ex.replace(/\|/g, "/").slice(0, 160)} |`);
 P("");
}

P(`## 3. Save and resume`);
const rs = runs.flatMap(r => (r.resume || []).map(x => Object.assign({ seed: r.seed, player: r.player }, x)));
const rf = rs.filter(x => !x.ok);
P(`Checks: ${rs.length}; failed: ${rf.length}.`);
if (rf.length) {
 P(`\n| Seed | Seat | Saved at | Diverged at | First differing keys |\n|---|---|---|---|---|`);
 for (const x of rf.slice(0, 25)) P(`| ${x.seed} | ${x.player} | ${x.at} | ${x.firstDiff?.month} | ${(x.firstDiff?.keys || []).slice(0, 6).join(", ")} |`);
}
P("");

P(`## 4. Command fuzzing`);
const fr = runs.filter(r => r.fuzz > 0);
if (!fr.length) P(`No fuzz runs.\n`);
else {
 const S = { issued: 0, ok: 0, refused: 0, stale: 0, doubleSpend: 0, refusedMutated: 0, negAfterOk: 0, errors: 0 };
 for (const r of fr) for (const k in S) S[k] += r.fuzzStats[k] || 0;
 P(`Runs ${fr.length}; orders ${S.issued}; accepted ${S.ok}; refused ${S.refused} (stale ${S.stale}); exceptions ${S.errors}; ` +
   `double-tap accepted ${S.doubleSpend}; refused order changed state ${S.refusedMutated}; treasury pushed below zero by an accepted order ${S.negAfterOk}.\n`);
}

P(`## 5. Performance (Node, CI runner)`);
const perf = runs.filter(r => r.decades?.length);
const last = r => r.decades.at(-1);
const ms36 = done.map(r => last(r).msPerMonth), worstM = perf.map(r => Math.max(...r.decades.map(d => d.worstMonthMs)));
const save = perf.map(r => Math.max(...r.decades.map(d => d.saveBytes))), heap = perf.map(r => Math.max(...r.decades.map(d => d.heapMB)));
P(`| Measure | Median | p95 | Max | Budget |\n|---|---|---|---|---|`);
P(`| ms/month, 1926-36 | ${f1(q(ms36, .5))} | ${f1(q(ms36, .95))} | ${f1(Math.max(...ms36))} | 130 (browser) |`);
P(`| Slowest single month, ms | ${f1(q(worstM, .5))} | ${f1(q(worstM, .95))} | ${f1(Math.max(...worstM))} | - |`);
P(`| Largest save, bytes | ${q(save, .5)} | ${q(save, .95)} | ${Math.max(...save)} | 1,000,000 |`);
P(`| Heap, MB | ${q(heap, .5)} | ${q(heap, .95)} | ${Math.max(...heap)} | - |`);
const overSave = perf.filter(r => Math.max(...r.decades.map(d => d.saveBytes)) > 1e6);
P(`\nRuns over the 1 MB save budget: ${overSave.length} of ${perf.length}` + (overSave.length ? ` (e.g. ${overSave.slice(0, 6).map(r => r.seed + " " + r.player).join("; ")})` : "") + `.`);
const slow = [...done].sort((a, b) => last(b).msPerMonth - last(a).msPerMonth).slice(0, 5);
P(`Slowest seats at 1936: ${slow.map(r => `${r.player} seed ${r.seed} ${last(r).msPerMonth} ms`).join("; ")}.\n`);

P(`## 6. History plausibility (finished runs)`);
const N = full.length;
const warsAll = full.map(r => r.wars.length);
const kinds = {};
for (const r of full) for (const w of r.wars) { const k = w.civil ? "civil" : (w.k || "?"); kinds[k] = (kinds[k] || 0) + 1; }
P(`Wars per century: mean ${f1(mean(warsAll))}, range ${Math.min(...warsAll)}-${Math.max(...warsAll)} (COW inter-state 49; old target 30-45).`);
P(`By war goal (mean per run): ${Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + " " + f1(n / N)).join(", ")}.\n`);
const isInter = w => !w.civil && w.k !== "colony" && w.k !== "rebel" && w.att !== "REB" && w.def !== "REB";
P(`| Decade | COW inter-state | Game, non-civil non-colonial (mean) | Game, all wars (mean) |\n|---|---|---|---|`);
for (const d of Object.keys(COW_DECADE).map(Number)) {
 const a = mean(full.map(r => r.wars.filter(w => dec(w.start) === d && isInter(w)).length));
 const b = mean(full.map(r => r.wars.filter(w => dec(w.start) === d).length));
 P(`| ${d}s | ${COW_DECADE[d]} | ${f1(a)} | ${f1(b)} |`);
}
const dur = full.flatMap(r => r.wars.filter(w => w.end !== undefined).map(w => w.end - w.start));
P(`\nWar length, months: median ${q(dur, .5)}, p90 ${q(dur, .9)}, max ${Math.max(...dur)} (old target mean 12-24).`);
const destroyed = full.map(r => r.destroyed.length);
P(`States destroyed per century: mean ${f1(mean(destroyed))}, range ${Math.min(...destroyed)}-${Math.max(...destroyed)} (old target 8-15).`);
const killed = {};
for (const r of full) for (const d of r.destroyed) killed[d.tag] = (killed[d.tag] || 0) + 1;
P(`Most often destroyed (times per run; a restored state can fall twice): ${Object.entries(killed).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t, n]) => t + " " + (n / N).toFixed(2)).join(", ")}.\n`);
const leaders = {};
for (const r of full) for (const f of r.metrics?.formed || []) leaders[f.tag + " by " + f.by] = (leaders[f.tag + " by " + f.by] || 0) + 1;
P(`Unification leaders: ${Object.entries(leaders).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + " " + pct(n, N)).join(", ") || "none"}.\n`);

/* Germany and Italy form by renaming their leader (formNation), so read the formNation record; CSA appears as a new tag. */
const formedAt = (r, tag) => { const f = (r.metrics?.formed || []).find(x => x.tag === tag); return f ? f.t : r.formations?.[tag]; };
const form = (tag, lo, hi) => {
 const ys = full.map(r => formedAt(r, tag)).filter(x => x !== undefined).map(yearOf);
 const inW = ys.filter(y => y >= lo && y <= hi).length;
 return `${tag}: forms in ${pct(ys.length, N)} of runs, ${lo}-${hi} in ${pct(inW, N)}; years ${ys.length ? Math.min(...ys) + "-" + Math.max(...ys) + ", median " + q(ys, .5) : "-"}`;
};
P(`- ${form("GER", 1866, 1875)} (target 6 of 8 in window)`);
P(`- ${form("ITA", 1859, 1872)} (target 6 of 8)`);
P(`- ${form("CSA", 1860, 1865)}`);
const jap = full.map(r => (r.westernised || []).find(w => w.tag === "JAP")).filter(Boolean).map(w => yearOf(w.t));
P(`- Japan westernises in ${pct(jap.length, N)} of runs; 1866-1885 in ${pct(jap.filter(y => y >= 1866 && y <= 1885).length, N)} (target 6 of 8); years ${jap.length ? Math.min(...jap) + "-" + Math.max(...jap) : "-"}`);
const w14 = full.map(r => (r.westernised || []).filter(w => yearOf(w.t) <= 1914 && w.tag !== "JAP").length);
P(`- Other states westernised by 1914: mean ${f1(mean(w14))} (target 2-6).`);
const dfl = full.map(r => (r.metrics?.defaults || []).filter(d => d.debt > 0).length);
const ott = full.filter(r => (r.metrics?.defaults || []).some(d => d.tag === "OTT" && d.debt > 0)).length;
P(`- Sovereign defaults with debt per century: mean ${f1(mean(dfl))} (target 2-6); Ottoman defaults in ${pct(ott, N)} of runs (target 1-3 of 8).`);
const sp = full.map(r => (r.metrics?.spawned || []).length + (r.metrics?.restored || []).length);
P(`- New or restored states per century: mean ${f1(mean(sp))} (COW: about 55 states joined the system 1836-1936).`);
const rw = full.map(r => (r.metrics?.rebelWins || []).length);
P(`- Successful rebellions per century: mean ${f1(mean(rw))}.`);
const gpc = {};
for (const r of full) for (const t of r.gp?.[1900] || []) gpc[t] = (gpc[t] || 0) + 1;
P(`- Great Powers in 1900 (share of runs): ${Object.entries(gpc).sort((a, b) => b[1] - a[1]).map(([t, n]) => t + " " + pct(n, N)).join(", ")}.`);
const gp14 = {};
for (const r of full) for (const [t] of (r.armyTop?.[1914] || []).slice(0, 8)) gp14[t] = (gp14[t] || 0) + 1;
P(`- Top-8 armies in 1914 (share of runs): ${Object.entries(gp14).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, n]) => t + " " + pct(n, N)).join(", ")} (COW 1914 top 8: RUS, GER, FRA, AUS, GBR, ITA, USA/JAP, OTT).`);
const lit = {};
for (const r of full) for (const [t, v] of Object.entries(r.literacy1900 || {})) (lit[t] = lit[t] || []).push(v);
P(`- Literacy 1900, Great Powers (median %): ${Object.entries(lit).map(([t, v]) => t + " " + q(v, .5)).join(", ")}.\n`);

P(`## 7. Treasury discipline`);
const neg = {};
for (const r of full) for (const [t, n] of Object.entries(r.negTreasury || {})) { const x = neg[t] = neg[t] || { runs: 0, months: 0, min: 0 }; x.runs++; x.months += n; x.min = Math.min(x.min, r.minTreasury?.[t] ?? 0); }
const negList = Object.entries(neg).sort((a, b) => b[1].months - a[1].months);
P(`Nations with a negative treasury in any month: ${negList.length}. Worst: ${negList.slice(0, 12).map(([t, x]) => `${t} (${x.runs} runs, ${Math.round(x.months / Math.max(1, x.runs))} months/run, low ${x.min})`).join("; ") || "none"}.\n`);

P(`## 8. Played nation outcomes`);
const seats = {};
for (const r of full.filter(r => r.player !== "AI")) { const x = seats[r.player] = seats[r.player] || { n: 0, alive: 0, provs: [] }; x.n++; if (r.final?.playerAlive) x.alive++; x.provs.push(r.final?.playerProvinces || 0); }
P(`| Seat | Runs | Survives to 1936 | Provinces at end (median) |\n|---|---|---|---|`);
for (const [t, x] of Object.entries(seats).sort()) P(`| ${t} | ${x.n} | ${pct(x.alive, x.n)} | ${q(x.provs, .5)} |`);
P("");
if (uiFiles.length) {
 const nat = {};
 for (const f of uiFiles) Object.assign(nat, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).nations || {});
 const tags = Object.keys(nat).sort();
 P(`## 9. Interface sweep (every nation, every page, one year of play)`);
 const pe = tags.filter(t => nat[t].pageErrors.length || nat[t].playErrors.length);
 P(`Nations swept: ${tags.length}. With page or play errors: ${pe.length}.`);
 for (const t of pe.slice(0, 20)) P(`- ${t}: ${[...nat[t].pageErrors, ...nat[t].playErrors].slice(0, 2).join(" / ").replace(/\n/g, " ").slice(0, 300)}`);
 const stuck = tags.filter(t => nat[t].stuck !== null && nat[t].stuck !== undefined);
 if (stuck.length) P(`- End month did not advance for: ${stuck.join(", ")}.`);
 const scr = {};
 for (const t of tags) for (const [k, s] of Object.entries(nat[t].screens)) {
  const page = k.split(":")[1], x = scr[page] = scr[page] || { nations: 0, total: 0, kinds: {}, side: 0, err: 0, ex: null };
  if (s.error) x.err++;
  if (s.pageScrollsSideways) x.side++;
  if (s.count) { x.nations++; x.total += s.count; for (const [kk, n] of Object.entries(s.kinds || {})) x.kinds[kk] = (x.kinds[kk] || 0) + n; if (!x.ex) x.ex = t + " " + (s.examples || [])[0]; }
 }
 P(`\n| Page | Screens with violations | Violations | By kind | Page scrolls sideways | Render errors | Example |\n|---|---|---|---|---|---|---|`);
 for (const [k, x] of Object.entries(scr).sort((a, b) => b[1].total - a[1].total))
  P(`| ${k} | ${x.nations} | ${x.total} | ${Object.entries(x.kinds).map(([a, b]) => a + " " + b).join("; ")} | ${x.side} | ${x.err} | ${(x.ex || "").replace(/\|/g, "/").slice(0, 140)} |`);
 P("");
}
process.stdout.write(L.join("\n") + "\n");
