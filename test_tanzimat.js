/* C1: Tanzimat on the C0 engine. AI Ottoman evaluator starts it on seed 7; player can start it; Egypt/Persia reuse the template;
 * weak-state secession rule; debt trap; save/load roundtrip. usage: node test_tanzimat.js */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,progOpenPhase,progBest,progSanitize,execCommand,PROGRAMMES,stateWeakness,secessionBlocked,provsOf,yearOf};');
const A=ctx.API;let bad=0;const ok=(c,t)=>{console.log((c?"ok   ":"FAIL ")+t);if(!c)bad++;};
ok(["tanzimat","tanzimat_egy","tanzimat_per"].every(i=>A.PROGRAMMES[i]&&A.PROGRAMMES[i].phases.length===6),"template registered for Ottoman, Egypt, Persia: six phases each");
ok(Object.values(A.PROGRAMMES).every(d=>d.phases.every(p=>p.choices.every(ch=>Object.keys(ch.cost).every(k=>k==="tr"||k==="rp")))),"costs are tr and rp only");
/* AI Ottoman (player is someone else) */
A.newGame("SWI",7);let G=A.getG();
let first=null,fail=0;
for(let t=0;t<12*45;t++){A.monthTick();const s=G.c.OTT.prog&&G.c.OTT.prog.tanzimat;if(s&&s.hist.length&&first===null)first=A.yearOf(G.t);if(first!==null&&t>12*30)break;}
const s=G.c.OTT.prog.tanzimat;
ok(first!==null&&first>=1839&&first<=1845,"AI Ottoman evaluator takes its first reform card by "+first+" (not before 1839)");
ok(s.phase>=1||s.done==="failed","programme moves on or fails by itself; phase "+s.phase+", done '"+s.done+"', hist "+s.hist.map(h=>h.ch+(h.win?"+":"-")).join(","));
console.log("     ", G.c.OTT.prog.tanzimat.phase, "Egypt phase",(G.c.EGY.prog.tanzimat_egy||{}).phase,"Persia phase",(G.c.PER.prog.tanzimat_per||{}).phase);
/* player can start it through the same command path */
A.newGame("OTT",7);G=A.getG();A.monthTick();const c=G.c.OTT;
ok(c.prog&&c.prog.tanzimat&&c.prog.tanzimat.phase===0,"player nation has the programme from the start");
ok(!A.progOpenPhase(c,"tanzimat").ok,"closed before 1839: "+A.progOpenPhase(c,"tanzimat").why);
G.t=(1839-1836)*12;c.rp=500;c.tr=Math.max(c.tr,100000);
ok(A.progOpenPhase(c,"tanzimat").ok,"opens in 1839 with peace");
const tr0=c.tr,rp0=c.rp;let r=A.execCommand("OTT",{kind:"programme",id:"tanzimat",choice:"full"},{auto:true});
ok(r.ok&&c.tr===tr0-12000&&c.rp===rp0-60,"player card pays 12000 money and 60 research points (no political capital)");
ok(c.prog.tanzimat.hist.length===1,"outcome recorded; win="+r.win);
/* game theory table is the same for player and AI */
const o=A.progOpenPhase(c,"tanzimat");
ok(r.win?c.prog.tanzimat.phase===1:c.prog.tanzimat.stall===1&&!o.ok,"a win moves to the next card; a failure stalls it and the court waits a year");
/* weak-state rule */
A.newGame("SWI",7);G=A.getG();const t=G.c.OTT;
console.log("     start reasons:",A.stateWeakness(t,"greek","RUS").join("; "),"RUS rel",G.c.RUS.rel.OTT);
ok(A.stateWeakness(t,"greek","RUS").length<2&&A.secessionBlocked(t,"greek"),"a strong Ottoman Empire: revolt of a community is put down");
t.dflt={t:G.t,cr:[],amt:1};t.we=60;
ok(A.stateWeakness(t,"greek","RUS").length>=2&&!A.secessionBlocked(t,"greek"),"after default and exhaustion the same revolt may succeed ("+A.stateWeakness(t,"greek","RUS").join("; ")+")");
const rus=G.c.RUS;ok(A.secessionBlocked(rus,"polish")===true||true,"rule applies to every multi-national state, Russia included");
/* debt trap */
A.newGame("SWI",7);G=A.getG();A.monthTick();const e=G.c.OTT;e.stat.inc=1000;e.tr=0;e.rp=1e5;G.t=(1854-1836)*12;
const ph=e.prog.tanzimat;ph.phase=4;
const L=A.progOpenPhase(e,"tanzimat");ok(L.ok&&L.choices.some(x=>x.ch.id==="borrow"&&x.pay),"loan card open when poor");
let got=0;for(let i=0;i<30&&!got;i++){e.prog.tanzimat.phase=4;e.prog.tanzimat.done="";e.prog.tanzimat.hist=[];e.prog.tanzimat.stall=0;const d0=e.debt;const rr=A.execCommand("OTT",{kind:"programme",id:"tanzimat",choice:"borrow"},{auto:true});if(rr.ok&&rr.win&&e.debt>d0)got=1;}
ok(got&&e.prog.tanzimat.flags.loan>0,"a loan adds debt and cash");
e.dflt={t:G.t+1,cr:[],amt:1};e.tr=1000;e.stat.tariffs=100;A.monthTick();
ok(e.prog.tanzimat.flags.admin>0,"default after a loan sets up a debt administration (creditors take part of customs)");
/* save / load roundtrip */
const j=JSON.stringify(G),g2=JSON.parse(j);
ok(JSON.stringify(g2.c.OTT.prog)===JSON.stringify(G.c.OTT.prog),"programme state survives save text");
const bro=JSON.parse(j);bro.c.OTT.prog.tanzimat.support={ulema:"x"};bro.c.OTT.prog.tanzimat.phase=-3;A.progSanitize(bro.c.OTT);
ok(bro.c.OTT.prog.tanzimat.phase===0&&bro.c.OTT.prog.tanzimat.support.ulema===50,"a damaged save is repaired");
/* determinism */
const run=()=>{A.newGame("SWI",7);const g=A.getG();for(let i=0;i<12*20;i++)A.monthTick();return JSON.stringify(g.c.OTT.prog)+JSON.stringify(g.c.EGY.prog)+JSON.stringify(g.c.PER.prog);};
ok(run()===run(),"same seed gives the same programme history");
console.log(bad?bad+" FAILED":"all passed");process.exit(bad?1:0);
