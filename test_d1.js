/* D1: infamy from conquest, coalitions form above 25, join wars against the aggressor, contain wars, dissolve below 15; history wars cost nothing. usage: node test_d1.js [seed] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,declareWar,endWar,estInf,coalMonth,takeProv,provsOf,popOf,COAL_AT,COAL_OFF};');
const A=ctx.API,seed=+(process.argv[2]||7);A.newGame(null,seed);let G=A.getG();const ok=[];const chk=(n,v)=>{ok.push(v);console.log((v?"ok   ":"FAIL ")+n);};
delete G.coal;for(let i=0;i<24;i++)A.monthTick();G=A.getG();
// conquest infamy scales with the share taken
const T=G.c.TUR&&G.c.TUR.alive?G.c.TUR:G.c.OTT,AU=G.c.AUS;
const big=A.provsOf("OTT").sort((a,b)=>b.pop-a.pop)[0],small=A.provsOf("OTT").sort((a,b)=>a.pop-b.pop)[0];
const x1=A.estInf(G.c.RUS,{k:"conquer",t:"OTT",prov:small.id,why:""}),x2=A.estInf(G.c.RUS,{k:"conquer",t:"OTT",prov:big.id,why:""}),xa=A.estInf(G.c.RUS,{k:"annex",t:"FRA",why:""}),xb=A.estInf(G.c.RUS,{k:"annex",t:"PER",why:""});
chk("bigger share costs more infamy ("+x1.toFixed(1)+" < "+x2.toFixed(1)+")",x2>x1);chk("annexing a civilized nation costs far more ("+xa.toFixed(1)+" vs "+xb.toFixed(1)+")",xa>xb*2&&xa>A.COAL_AT);
// a coalition forms
const T0="RUS",R=G.c[T0];R.infamy=40;A.coalMonth();const co=G.coal[T0];chk("coalition forms above "+A.COAL_AT+" ("+(co?co.mem.join(","):"none")+")",!!co&&co.mem.length>=2&&!co.mem.includes(T0));
// members join a defensive war
let joined=0;const victim=Object.keys(G.c).find(t=>G.c[t].alive&&t!==T0&&!co.mem.includes(t)&&G.c[t].civ===false&&!G.c[t].war.length&&G.c[t].ai);
for(const t of co.mem){G.c[t].war=G.c[t].war.slice(0,1);}
const w=A.declareWar(T0,victim,{k:"conquer",tag:victim,prov:A.provsOf(victim)[0].id});if(w)joined=w.def.length-1-(G.c[victim].ally.length?0:0);
chk("coalition members join the war against the aggressor (defenders: "+(w?w.def.join(","):"-")+")",!!w&&w.def.filter(t=>co.mem.includes(t)).length>=1);
if(w)A.endWar(w,"white");
// contain war
for(const t in G.c){G.c[t].war=[];G.c[t].truce={};}G.wars=[];let made=0;for(let i=0;i<200&&!made;i++){R.infamy=40;A.coalMonth();made=G.wars.some(x=>x.goal.k==="contain"&&x.def.includes(T0));}
chk("a member declares a contain war",made);
const cw=G.wars.find(x=>x.goal.k==="contain");if(cw){R.infamy=40;const before=R.infamy;A.endWar(cw,"att");chk("winning a contain war cuts infamy ("+before+" -> "+R.infamy.toFixed(1)+")",R.infamy<before*.6);}
// dissolve
R.infamy=10;A.coalMonth();chk("coalition dissolves under "+A.COAL_OFF,!G.coal[T0]);
// history wars cost nothing
const S=G.c.SAR,i0=S.infamy;const hw=A.declareWar("SAR","AUS",{k:"conquer",tag:"AUS",prov:"LOM",hist:1});if(hw)A.endWar(hw,"att");chk("scripted war costs no infamy ("+i0+" -> "+S.infamy+")",!hw||S.infamy===i0);
// saves: G.coal missing is fine
const g=A.getG();delete g.coal;let e=null;try{for(let i=0;i<6;i++)A.monthTick();}catch(x){e=x;}chk("old save without G.coal runs",!e);
console.log(ok.every(Boolean)?"ok":"FAIL");
