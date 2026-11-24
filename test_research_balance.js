"use strict";
/* A5 research balance: the rp formula terms, the same rule for every nation, and the naval bias read from nation data. */
const { engine } = require("./tools/a4_lib");
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const E = engine();
E.A.newGame("SWI", 7);
const R = s => E.run(s);
const RP_W = R("RP_W");
check(RP_W.fac === 1.6 && RP_W.uni === 3 && RP_W.sch === 1 && RP_W.lit === 6 && RP_W.clergy === 4 && RP_W.pop === 8, "weights: lit 6, clergy 4, pop 8, factories 1.6, university 3, school 1");
R(`G.t=12*40;globalThis.__mult=c=>researchStatus(c)*(1+techFx(c,"research")+(c.gwx&&c.gwx.research||0))*(c.reforms.press===2?1.08:1);
 globalThis.__own=t=>G.plist.filter(p=>p.o===t);`);
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
for (const tag of ["GBR", "PRU", "FRA", "CHI"]) {
 const m = R(`__mult(G.c.${tag})`), base = R(`rpOf(G.c.${tag})`);
 const lvl = R(`__own("${tag}").reduce((s,p)=>s+p.factories.reduce((a,f)=>a+f.lv,0),0)`);
 const p = R(`__own("${tag}")[0].id`);
 R(`P("${p}").factories.push({g:"iron",lv:3,own:"cap",cash:0,staff:1,loss:0})`);
 const up = R(`rpOf(G.c.${tag})`);
 check(near(up - base, RP_W.fac * (Math.sqrt(lvl + 3) - Math.sqrt(lvl)) * m), tag + ": factories add 1.2*sqrt(levels) before multipliers");
 R(`P("${p}").factories.pop()`);
 R(`P("${p}").uni=(P("${p}").uni||0)+1`);
 check(near(R(`rpOf(G.c.${tag})`) - base, RP_W.uni * m), tag + ": a university level adds RP_W.uni points before multipliers");
 R(`P("${p}").uni-=1`);
 const lit = R(`G.c.${tag}.stat.lit||G.c.${tag}.lit`);
 R(`(P("${p}").bx=P("${p}").bx||{}).school=((P("${p}").bx.school)||0)+2`);
 check(near(R(`rpOf(G.c.${tag})`) - base, 2 * lit * m), tag + ": a school level adds 1*lit before multipliers");
 R(`P("${p}").bx.school-=2`);
 check(near(R(`rpOf(G.c.${tag})`), base), tag + ": undoing the changes restores rp");
}
/* the same formula for all: the civilised flag only changes the status multiplier */
R(`globalThis.__u=G.c.CHI;`);
check(R(`researchStatus(G.c.CHI)`) === 0.5 + 0.5 * 0.05 && R(`researchStatus(G.c.GBR)`) === 1 && R(`costStatus(G.c.CHI)`) === 1.3 - 0.3 * 0.05, "A6: researchStatus = 0.5+0.5*modern/100, costStatus = 1.3-0.3*modern/100");
const t = R(`TECHS.find(t=>t.y>yearOf(G.t))`);
check(R(`techCost(G.c.GBR,TF["${t.id}"])`) === Math.round(t.c * (1 + (t.y - 1876) * .25)), "techCost = base*(1+0.25*yearsAhead)*costStatus");
/* the bias comes from nation data, with no tag in pickTech */
check(!/["']GBR["']/.test(R("pickTech.toString()")), "pickTech names no nation");
check(R(`G.c.GBR.aiResearchBias`).navy === 1.3 && R(`G.c.FRA.aiResearchBias`) === null, "Britain's naval bias is a data field; others have none");
const pick = tag => R(`(()=>{const c=G.c.${tag};c.res=null;return pickTech(c);})()`);
const fieldOf = id => R(`TF["${id}"].f`);
for (const tag of ["FRA", "RUS"]) {
 R(`G.c.${tag}.aiResearchBias=null`);
 const before = pick(tag);
 R(`G.c.${tag}.aiResearchBias={navy:1000}`);
 check(fieldOf(pick(tag)) === "navy", tag + ": a bias set in data steers its picks to that field (was " + fieldOf(before) + ")");
}
R(`G.c.GBR.aiResearchBias=null`);
const noBias = pick("GBR");
R(`G.c.GBR.aiResearchBias={navy:1000}`);
check(fieldOf(pick("GBR")) === "navy" && noBias != null, "the same rule applies to Britain");
console.log(failed ? failed + " failed" : "all passed");
process.exit(failed ? 1 : 0);
