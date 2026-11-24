// M3 acceptance: node test_m3.js [seed] [trials]
const ctx=require("./load_test_engine")('\n;globalThis.API={WORLD,newGame,monthTick,getG:()=>G,setG:g=>{G=g;buildAdj();},declareWar,provsOf,P,mkArmy,battleTick,edgeTime,findPath,landUnits,genMonth,rollGen,get ADJ(){return ADJ}};');
const A=ctx.API,seed=+(process.argv[2]||7),N=+(process.argv[3]||200);A.newGame(null,seed);let G=A.getG();const P=A.P;
G.c.GBR.ai=false;G.c.FRA.ai=false;G.c.GBR.tech=Object.assign({},G.c.FRA.tech);A.declareWar("GBR","FRA",{k:"conquer",tag:"FRA",prov:"PAR"});const prov=P("PAR");prov.t="p";prov.fort=0;
const mix=n=>({inf:Math.round(n*.7),cav:Math.round(n*.18),art:Math.max(1,n-Math.round(n*.7)-Math.round(n*.18))});
function duel(ag,dg,t){prov.t=t||"p";G.armies=[];G.bt=[];const d=A.mkArmy("FRA","PAR",mix(20),false),a=A.mkArmy("GBR","PAR",mix(20),false);a.gen=ag?Object.assign({},ag):null;d.gen=dg?Object.assign({},dg):null;G.armies.push(d,a);
 for(let m=0;m<10;m++){for(const x of G.armies){x._fought=0;x._lost=0;}A.battleTick();if(!G.bt.length)break;}return{attWins:!!d._lost&&!a._lost};}
function rate(label,ag,dg,t){let w=0;for(let i=0;i<N;i++)if(duel(ag,dg,t).attWins)w++;console.log(label.padEnd(66),"attacker wins",(w/N*100).toFixed(0)+"% of",N);return w/N;}
console.log("seed",seed,"-- 20 v 20 equal brigades, equal technology (GBR attacks FRA's PAR; the defender holds the ground)");
// remove the random death in these runs by giving the general no chance to die: deaths only matter after the fight
const g=(atk,def,mv)=>({id:"x",n:"X. Test",atk,def,mv:mv||0,age:40});
const base=rate("no generals",null,null);
const w4=rate("attacker has a 4-attack general",g(4,0),null);
rate("attacker has a 2-attack general",g(2,0),null);
rate("attacker has a 4-defence general only (fewer own losses)",g(0,4),null);
rate("defender has a 4-defence general",null,g(0,4));
rate("attacker 4 attack vs defender 4 defence",g(4,0),g(0,4));
console.log("difference with the 4-attack general:","+"+((w4-base)*100).toFixed(0)+" points");
// march speed
{const a=A.mkArmy("GBR","LON",{inf:4},false);const p=A.findPath(a,"MID")||A.findPath(a,P("LON").o&&A.ADJ["LON"][0]);let t0=0,t4=0;const tgt=A.ADJ["LON"].find(v=>P(v).t==="m"||P(v).t==="h")||A.ADJ["LON"][0];
 const mt=(mv)=>{a.gen=mv?{id:"y",n:"Y. Test",atk:0,def:0,mv,age:40}:null;let tot=0;for(const v of A.ADJ["LON"].concat(A.ADJ[A.ADJ["LON"][0]]).slice(0,6)){if(A.ADJ["LON"].includes(v))tot+=A.edgeTime(a,"LON",v);}return tot;};
 console.log("march: total edgeTime to the neighbours of LON with no general",mt(0),"| with 4-movement general",mt(4),"(hill/mountain legs shorten by rounding; see sim below)");
 const b=A.mkArmy("GBR","LON",{inf:4},false);let sum0=0,sum4=0,n=0;for(const q of A.provsOf("GBR").concat(A.provsOf("FRA"),A.provsOf("RUS"))){if(q.waste)continue;for(const v of A.ADJ[q.id]){if(P(v).waste)continue;b.gen=null;sum0+=A.edgeTime(b,q.id,v);b.gen={atk:0,def:0,mv:4};sum4+=A.edgeTime(b,q.id,v);n++;}}
 console.log("march: average months per province leg over",n,"legs: no general",(sum0/n).toFixed(2),"| 4-movement general",(sum4/n).toFixed(2));}
// 60 years, all AI
A.newGame(null,seed);G=A.getG();const stat={born:0,sampled:0,big:0,withGen:0};let rows=[];
for(let i=1;i<=720;i++){A.monthTick();G=A.getG();if(i%12===0){let big=0,wg=0,tot=0,pool=0;for(const t in G.c){const c=G.c[t];if(!c.alive||!c.ai)continue;pool+=(c.leaders||[]).length;const ar=G.armies.filter(a=>a.o===t&&!a.naval&&!a.reb&&a.u.length).sort((a,b)=>b.u.length-a.u.length);if(ar.length&&ar[0].u.length>=4){big++;if(ar[0].gen)wg++;}for(const a of ar)if(a.gen)tot++;}rows.push({y:1836+i/12,big,wg,tot,pool});}}
console.log("-- 60 years, all AI. Each January: AI nations whose largest army has 4+ brigades | of those with a general | generals in the field | generals waiting in pools");
for(const r of rows.filter((_,i)=>i%6===5))console.log("  ",r.y,r.big,r.wg,r.tot,r.pool);
console.log("   share of AI largest armies with a general, all years:",(rows.reduce((s,r)=>s+r.wg,0)/Math.max(1,rows.reduce((s,r)=>s+r.big,0))*100).toFixed(0)+"%");
const dead=(G.msgs.concat(G.log)).filter(m=>/killed at|died of old age|has risen/.test(m.txt)).length;console.log("   general events in the news/log (player only is shown in messages):",dead,"| generals total ever made:",G.gid);
const best=G.armies.filter(a=>a.gen&&!a.reb).sort((a,b)=>b.u.length-a.u.length).slice(0,3).map(a=>a.o+" "+a.u.length+" brigades, "+a.gen.n+" ("+a.gen.atk+"/"+a.gen.def+"/"+a.gen.mv+", age "+Math.floor(a.gen.age)+")");console.log("   largest armies with generals now:",best.join(" | "));
// save/load with a battle in progress
{A.newGame(null,seed);G=A.getG();G.c.GBR.ai=false;G.c.FRA.ai=false;A.declareWar("GBR","FRA",{k:"conquer",tag:"FRA",prov:"PAR"});const pr=P("PAR");pr.t="m";G.armies=[];const d=A.mkArmy("FRA","PAR",mix(40),false),a=A.mkArmy("GBR","PAR",mix(40),false);d.gen=g(1,3,2);a.gen=g(4,1,1);G.c.GBR.leaders=[A.rollGen(G.c.GBR)];G.armies.push(d,a);
 A.battleTick();const inProg=G.bt.length;const z=JSON.stringify(G,(k,v)=>k[0]==="_"||k==="plist"||k==="pricePrev"?undefined:v);const h=JSON.parse(z);h.plist=A.WORLD.provs.map(w=>h.prov[w.id]);h.pricePrev=Object.assign({},h.price);A.setG(h);G=A.getG();
 console.log("-- save and load mid-battle: battles in progress before",inProg,"after load",G.bt.length,JSON.stringify(G.bt[0]),"| generals kept:",G.armies.filter(x=>x.gen).map(x=>x.o+":"+x.gen.n+" "+x.gen.atk+"/"+x.gen.def+"/"+x.gen.mv).join(", "),"| pool GBR",G.c.GBR.leaders.length);
 let m=0;while(G.bt.length&&m<8){A.monthTick();G=A.getG();m++;}console.log("   after the load the battle ran on for",m,"more month(s); in progress now:",G.bt.filter(r=>r.p==="PAR").length,"| battle record in news:",JSON.stringify((G.battles||[])[0]));}
