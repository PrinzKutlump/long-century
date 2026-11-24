"use strict";
/* A3: measure the cause of a price or population difference between two builds (no tuning). 
 * node tools/a3_probe.js <seed> <buildA.html> <buildB.html> [player]
 * Both builds run the same seed to 1936; every 20 years it prints world population, population-weighted living standards
 * (ld/ed/xd), the grain price, the smoothed world shortage G.tight.grain, farmers and craftsmen, and the share of households
 * whose local grain fill is below the national fill. */
const fs = require("node:fs");
const vm = require("node:vm");
const [seed = "7", fa, fb, player = "SWI"] = process.argv.slice(2);
function load(file) {
 const nodes = new Map();
 const b = { console, performance, args: { seed: +seed, player: player === "AI" ? null : player }, window: { addEventListener() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild: n => nodes.set("#" + n.id, n) } } };
 const src = fs.readFileSync(file, "utf8").match(/<script>([\s\S]*)<\/script>/)[1];
 const harness = `
  newGame(args.player, args.seed);
  return { step() { if (G.card) cardDefault(); const m = G.t; if (args.player && G.c[args.player].alive) advanceCampaign(m); else monthTick(); return m; }, t: () => G.t,
   stat() { let pop = 0, ld = 0, ed = 0, xd = 0, far = 0, cra = 0, art = 0, lab = 0, sla = 0, farmCap = 0, grainOut = 0, local = 0, nat = 0, rows = 0;
    for (const p of G.plist) { if (!p.o || !G.c[p.o].alive) continue; farmCap += p.farm ? p.farmCap : 0; for (const q of p.pops) { pop += q.n; ld += q.ld * q.n; ed += q.ed * q.n; xd += q.xd * q.n; if (q.t === "FAR") far += q.n; if (q.t === "CRA") cra += q.n; if (q.t === "ART") art += q.n; if (q.t === "LAB") lab += q.n; if (q.t === "SLA") sla += q.n; }
     const r = p.localMarket && p.localMarket.grain; if (r && r.demand > 0) { rows++; local += r.fill; nat += G.c[p.o].fill.grain == null ? 1 : G.c[p.o].fill.grain; } }
    return { year: 1836 + Math.floor(G.t / 12), pop: Math.round(pop / 1000), ld: +(ld / pop).toFixed(3), ed: +(ed / pop).toFixed(3), xd: +(xd / pop).toFixed(3), far: Math.round(far / 1000), cra: Math.round(cra / 1000), art: Math.round(art / 1000), lab: Math.round(lab / 1000), sla: Math.round(sla / 1000), farmCap: Math.round(farmCap), grainPrice: +(G.price.grain / GOODS.grain.p).toFixed(2), tightGrain: +((G.tight && G.tight.grain) || 0).toFixed(2), localFill: rows ? +(local / rows).toFixed(3) : null, nationalFill: rows ? +(nat / rows).toFixed(3) : null, wars: G.wars.length }; } };`;
 return vm.compileFunction(src + "\n" + harness, Object.keys(b))(...Object.values(b));
}
const A = load(fa), B = load(fb);
const keys = ["year", "pop", "ld", "ed", "xd", "far", "cra", "art", "lab", "sla", "farmCap", "grainPrice", "tightGrain", "localFill", "nationalFill", "wars"];
console.log("build\t" + keys.join("\t"));
while (A.t() < 1200) {
 A.step(); B.step();
 if (A.t() % 240 === 0 || A.t() === 1) for (const [n, x] of [["A", A], ["B", B]]) { const s = x.stat(); console.log(n + "\t" + keys.map(k => s[k]).join("\t")); }
}
