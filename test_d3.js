/* A2: the fixture wars carry hist:1 so that a declaration cannot open a crisis congress by chance (30% between powers; declareWar then returns null). */
/* D3: itemised peace deals: prices in war score, AI acceptance, released nations, reparations, sphere end, AI uses extras. usage: node test_d3.js [seed] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,declareWar,endWar,dealMenu,dealVerdict,applyDeal,peaceOffer,releaseOptions,provsOf,popOf,DORMANT};');
const A=ctx.API,seed=+(process.argv[2]||7);A.newGame(null,seed);let G=A.getG();const ok=[];const chk=(n,v)=>{ok.push(v);console.log((v?"ok   ":"FAIL ")+n);};
for(let i=0;i<12;i++)A.monthTick();G=A.getG();
const clear=()=>{for(const t in G.c){G.c[t].war=[];G.c[t].truce={};}G.wars=[];};clear();
// a war: Russia v Ottomans; Russia occupies two Ottoman provinces
G.player="RUS";const w=A.declareWar("RUS","OTT",{k:"conquer",tag:"OTT",prov:A.provsOf("OTT")[0].id,hist:1});
const occ=A.provsOf("OTT").filter(p=>p.id!==w.goal.prov).slice(0,2);for(const p of occ)p.ctl="RUS";
let m=A.dealMenu(w,1);chk("menu has goal, provinces, reparations, humiliation ("+m.map(i=>i.k).join(",")+")",["goal","prov","reps","hum"].every(k=>m.some(i=>i.k===k)));
w.ws=10;let v=A.dealVerdict(w,1,["goal"]);chk("goal costs more than 10 war score: refused ("+v.why+")",!v.ok);
w.ws=60;w.start=G.t-30;G.c.OTT.we=30;v=A.dealVerdict(w,1,["goal","reps"]);chk("goal and reparations at 60 war score: price "+v.cost+", they accept up to "+Math.round(v.lim),v.ok);
const big=A.dealVerdict(w,1,["goal","prov"+occ[0].id,"prov"+occ[1].id,"reps","hum"]);chk("too many terms: refused ("+big.why+")",!big.ok);
// apply
const r0=G.c.RUS.tr,L=G.c.OTT,n0=A.provsOf("RUS").length;w.ws=95;w.start=G.t-48;G.c.OTT.we=60;const res=A.peaceOffer(w,"deal",["goal","prov"+occ[0].id,"reps"]);
chk("deal signed: "+res.txt,res.ok&&!G.wars.includes(w));chk("provinces changed hands ("+(A.provsOf("RUS").length-n0)+")",A.provsOf("RUS").length-n0>=2);
chk("reparations recorded",(L.owes||[]).length===1);let t0=G.c.RUS.tr;for(let i=0;i<3;i++)A.monthTick();G=A.getG();chk("reparations flow to the winner",(G.c.RUS.tr-t0)!==0&&(G.c.OTT.owes||[]).length===1);
// release a nation
clear();G.player="RUS";let rel=null;for(const t in G.c){const c=G.c[t];if(!c.alive||t==="RUS")continue;const o=A.releaseOptions([t]);if(o.length){rel={t,o:o[0]};break;}}
if(rel){/* A2: without hist a declaration can open a crisis congress by chance (30%, declareWar returns null); the fixture needs the war */const w2=A.declareWar("RUS",rel.t,{k:"humble",tag:rel.t,hist:1});w2.ws=80;w2.start=G.t-36;G.c[rel.t].we=40;const m2=A.dealMenu(w2,1),it=m2.find(i=>i.k==="release");chk("release option offered: "+it.n+" (cost "+it.cost+")",!!it);const rs=A.peaceOffer(w2,"deal",[it.key]);const d=A.DORMANT.find(x=>x[5]===rel.o.cul&&!x[6]);chk("released nation is alive: "+d[1]+" ("+rs.txt+")",rs.ok&&G.c[d[0]]&&G.c[d[0]].alive);}else chk("a release option exists somewhere",false);
// defender can also demand
clear();const w3=A.declareWar("OTT","RUS",{k:"humble",tag:"RUS",hist:1});w3.ws=-50;w3.start=G.t-20;G.player="RUS";const m3=A.dealMenu(w3,2);chk("the defender's menu has no goal item",!m3.some(i=>i.k==="goal")&&m3.some(i=>i.k==="hum"));
// AI uses extras over a long run (fresh game)
A.newGame(null,seed);G=A.getG();for(let i=0;i<480;i++)A.monthTick();G=A.getG();chk("AI peace deals with extras were made ("+(G.dealsN||0)+")",(G.dealsN||0)>=3);
console.log(ok.every(Boolean)?"ok":"FAIL");
