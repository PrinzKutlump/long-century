"use strict";
/* A6 modernisation: same rules for all nations, old-save load, reform cost/progress, westernise gate, determinism. */
const { engine } = require("./tools/a4_lib");
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const mk = seed => { const E = engine(); E.A.newGame("SWI", seed); return E; };
const E = mk(7), R = s => E.run(s);
check(R("MOD_REFORMS.reduce((s,r)=>s+r.pr,0)") === 100 && R("MOD_REFORMS.length") === 9, "nine reforms, progress adds to 100");
check(R("G.c.PUN.modern") === 15 && R("G.c.EGY.modern") === 20 && R("G.c.JAP.modern") === 10 && R("G.c.CHI.modern") === 5 && R("G.c.GBR.modern") === 100, "historical start values");
check(R("researchStatus(G.c.PUN)") === 0.5 + 0.5 * 0.15 && Math.abs(R("costStatus(G.c.PUN)") - (1.3 - 0.3 * 0.15)) < 1e-12 && R("researchStatus(G.c.GBR)") === 1, "status formulas");
const x = (t, c) => R(`execCommand("${t}",${JSON.stringify(c)},{auto:true})`);
R("G.c.CHI.rp=100;G.t=100");
check(!x("CHI", { kind: "reform", reform: "a1" }).ok && R("G.c.CHI.modern") === 5 && R("G.c.CHI.rp") === 100, "refused when points are short, nothing spent");
R("G.c.CHI.rp=1000");
const rs0 = R("researchStatus(G.c.CHI)"), r1 = x("CHI", { kind: "reform", reform: "a1" });
check(r1.ok && R("G.c.CHI.rp") === 850 && R("G.c.CHI.modern") === 15 && R("researchStatus(G.c.CHI)") > rs0, "reform spends 150 once, adds 10%, research status rises");
check(!x("CHI", { kind: "reform", reform: "a1" }).ok, "not twice");
check(!x("CHI", { kind: "reform", reform: "a2" }).ok && R("G.c.CHI.rp") === 850, "one reform per 6 months");
R("G.t+=6");
check(x("CHI", { kind: "reform", reform: "d2" }).ok && R("G.c.CHI.rp") === 600 && R("G.c.CHI.gwx.tax") === 0.1, "second reform after 6 months; tax +10%");
check(!x("GBR", { kind: "reform", reform: "a1" }).ok && !x("CHI", { kind: "reform", reform: "zz" }).ok, "civilised nation and unknown id refused");
check(R("execCommand('CHI',{kind:'reform',reform:'a2',month:G.t,serial:1})").ok === false, "player path needs a serial like every order");
/* westernise gate */
R("G.c.SIA.modern=79;G.c.SIA.stat.lit=.5");
check(!R("modWestOk(G.c.SIA)"), "79% is not enough");
R("G.c.SIA.modern=80;G.c.SIA.stat.lit=.2");
check(!R("modWestOk(G.c.SIA)"), "80% needs 25% literacy");
R("G.c.SIA.stat.lit=.25");
check(R("modWestOk(G.c.SIA)"), "80% with 25% literacy opens the gate");
R("G.c.SIA.modern=100;G.c.SIA.stat.lit=0");
check(R("modWestOk(G.c.SIA)"), "100% opens the gate");
R("G.c.SIA.westWait=0;modMonth()");
check(R("G.c.SIA.civ") === 1 && R("G.c.SIA.modern") === 100, "an AI state proclaims at once, same default");
/* human seat gets a card; Wait keeps the rules */
R("G.player='EGY';G.c.EGY.ai=false;G.c.EGY.modern=100;G.c.EGY.westWait=0;modMonth()");
check(R("G.card&&G.card.ctx.a")==="westernise"&&!R("G.c.EGY.civ"), "a human gets a decision card, not an automatic switch");
R("cardChoose('no')");
check(!R("G.c.EGY.civ")&&R("G.c.EGY.westWait")>R("G.t"), "Wait keeps the current rules");
R("modMonth()");
check(R("G.card")===null, "no repeat card within the year");
R("G.c.EGY.westWait=0;modMonth();cardChoose('yes')");
check(R("G.c.EGY.civ")===1, "Proclaim makes it civilised");
/* old saves */
{
 const F = mk(3); F.advance(12);
 F.run("for(const c of Object.values(G.c)){delete c.modern;delete c.modRef;delete c.modLast;}");
 const z = F.pack();
 const E2 = engine(); E2.unpack(z);
 check(E2.run("G.c.GBR.modern") === 100 && E2.run("G.c.GBR.modRef.length") === 0, "old save: civilised = 100");
 const techs = E2.run("Object.keys(G.c.PUN.tech).length");
 check(E2.run("G.c.PUN.modern") === Math.min(95, 15 + 5 * techs) && E2.run("G.c.PUN.modRef.join()") === "a1", "old save: start value + 5% a tech, free reforms restored");
 F.run("for(const c of Object.values(G.c)){c.modern=c.civ?100:15;c.modRef=[]}");
 const sz = F.pack().length;
 check(sz < 1e6, "save under 1 MB at month 12 (" + sz + ")");
}
/* A6b: reform effects, one multiplier each, same rule for every nation */
{
 const F = mk(7), Q = s => F.run(s);
 Q("G.t=100;for(const t of['SIA','PER']){G.c[t].modRef=[];G.c[t].mob=null;}");
 const inf0 = Q("uStat(G.c.SIA,'inf').a"), art0 = Q("uStat(G.c.SIA,'art').a"), civArt = Q("uStat(G.c.GBR,'art').a/(1+techFx(G.c.GBR,'atk'))");
 Q("G.c.SIA.modRef=['a1']");
 check(Math.abs(Q("uStat(G.c.SIA,'inf').a") / inf0 - 1.1) < 1e-9 && Q("uStat(G.c.SIA,'art').a") === art0, "a1: infantry +10%, artillery untouched");
 check(art0 < Q("UNITS.art.a*(1+techFx(G.c.SIA,'atk'))"), "uncivilised artillery is weaker before the arsenal");
 Q("G.c.SIA.modRef=['a2']");
 check(Math.abs(Q("uStat(G.c.SIA,'art').a") - Q("UNITS.art.a*(1+techFx(G.c.SIA,'atk'))")) < 1e-9 && civArt === 4, "a2: artillery at civilised parity");
 const m0 = Q("mobRate(G.c.PER)"); Q("G.c.PER.modRef=['a3']");
 check(Math.abs(Q("mobRate(G.c.PER)") / m0 - 1.2) < 1e-9, "a3: mobilisation +20%");
 check(Q("modTradeX(G.c.PER)") === 1 && (Q("G.c.PER.modRef=['e1']"), Math.abs(Q("modTradeX(G.c.PER)") - 1.1) < 1e-9), "e1: trade income x1.1");
 Q("G.c.PER.modRef=[]");
 const west = Q("G.c.PER.modRef=[];const prov=provsOf('PER')[0];facCan(G.c.PER,prov,'cloth').ok");
 check(west === false && Q("facCan(G.c.PER,provsOf('PER')[0],'cloth').why").includes("workshops"), "factories need e2 before westernising");
 check(Q("facPrem(G.c.PER)/(ECON[G.c.PER.econ].build>0?1:1.5)") === 1.5 && Q("facPrem(G.c.GBR)/(ECON[G.c.GBR.econ].build>0?1:1.5)") === 1, "factory cost x1.5 uncivilised, x1 civilised");
 Q("G.c.PER.war=[];G.c.PER.modRev=0;for(const p of provsOf('PER'))for(const q of p.pops){q.mil=10;q.id={REA:0,CON:0,LIB:1,SOC:0,ANL:0,COM:0,FAS:0};q.n=Math.max(q.n,50000);}for(let i=0;i<80&&!G.c.PER.modRev;i++)uprisings(G.c.PER)");
 check(Q("G.c.PER.modRev") >= 1, "an uprising counts toward the westernise card");
}
/* determinism: same seed, same reforms */
const run = () => { const D = mk(11); D.advance(240); return D.run(`Object.values(G.c).filter(c=>!c.civ||c.civT).map(c=>c.tag+c.modern+(c.modRef||[]).join("")+c.civ).join("|")`); };
const a = run(), b = run();
check(a === b && a.length > 20, "deterministic over 20 years");
check(mk(11).run("MODEL_REV") === 5, "MODEL_REV is 5");
console.log(failed ? failed + " FAILED" : "all ok"); process.exit(failed ? 1 : 0);
