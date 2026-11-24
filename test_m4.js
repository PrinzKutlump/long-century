// M4 acceptance: node test_m4.js [seed] [trials]
const ctx=require("./load_test_engine")('\n;globalThis.API={UNITS,newGame,monthTick,getG:()=>G,declareWar,provsOf,P,mkArmy,battleTick,armyMonth,get ADJ(){return ADJ}};');
const A=ctx.API;const UNITS_=()=>A.UNITS,seed=+(process.argv[2]||7),N=+(process.argv[3]||200);A.newGame(null,seed);let G=A.getG();const P=A.P;
G.c.GBR.ai=false;G.c.FRA.ai=false;A.declareWar("GBR","FRA",{k:"conquer",tag:"FRA",prov:"PAR"});
G.c.GBR.tech=Object.assign({},G.c.FRA.tech);const prov=P("PAR"),terr0=prov.t,fort0=prov.fort;
// quiet: remove all other armies so nothing else interferes
G.armies=[];
function duel(terr,dSize,aSize,dig,opts){opts=opts||{};prov.t=terr;prov.fort=opts.fort||0;G.armies=[];G.bt=[];const mix=n=>({inf:Math.round(n*.7),cav:Math.round(n*.18),art:Math.max(1,n-Math.round(n*.7)-Math.round(n*.18))});
 const d=A.mkArmy("FRA","PAR",mix(dSize),false),a=A.mkArmy("GBR","PAR",mix(aSize),false);d.dig=dig;if(opts.gen)a.gen=opts.gen;if(opts.dgen)d.gen=opts.dgen;if(opts.noCav){}G.armies.push(d,a);
 let m=0;for(;m<10;m++){for(const x of G.armies){x._fought=0;x._lost=0;}A.battleTick();if(!G.bt.length)break;}
 return{defWins:!!a._lost&&!d._lost,months:m+1};}
function batch(label,terr,dS,aS,dig,opts){let w=0,mo=0;for(let i=0;i<N;i++){const r=duel(terr,dS,aS,dig,opts);if(r.defWins)w++;mo+=r.months;}console.log(label.padEnd(58),"defender wins",(w/N*100).toFixed(0)+"%","| avg battle months",(mo/N).toFixed(2));return w/N;}
console.log("seed",seed,"trials",N,"(20 brigades dug in at 3 against 30 attacking)");
batch("mountains, dug in (3), 20 vs 30","m",20,30,3);
batch("plains, dug in (3), 20 vs 30","p",20,30,3);
batch("mountains, not dug in, 20 vs 30","m",20,30,0);
batch("plains, no dig-in, 20 vs 30","p",20,30,0);
batch("plains, equal 25 vs 25, no dig-in (should be ~50%)","p",25,25,0);
batch("hills, dug in (3), 20 vs 30","h",20,30,3);
batch("jungle, dug in (3), 20 vs 30","j",20,30,3);
console.log("-- frontage: same armies 40 v 40, months by terrain");
for(const t of["p","h","m"])batch("   "+t+" 40 v 40 no dig-in",t,40,40,0);
// combined arms: guns with and without foot soldiers
function arms(label,dComp,aComp){let w=0;for(let i=0;i<N;i++){prov.t="p";prov.fort=0;G.armies=[];G.bt=[];const d=A.mkArmy("FRA","PAR",dComp,false),a=A.mkArmy("GBR","PAR",aComp,false);G.armies.push(d,a);for(let m=0;m<10;m++){for(const x of G.armies){x._fought=0;x._lost=0;}A.battleTick();if(!G.bt.length)break;}if(a._lost&&!d._lost)w++;}console.log(label.padEnd(58),"defender wins",(w/N*100).toFixed(0)+"%");}
console.log("-- combined arms (plains, 20 brigades each)");
arms("12 inf + 8 art defending vs 12 inf + 8 cav",{inf:12,art:8},{inf:12,cav:8});
arms("12 inf + 8 art defending vs 20 inf",{inf:12,art:8},{inf:20});
arms("4 inf + 8 art (no cover) vs 12 inf",{inf:4,art:8},{inf:12});
// pursuit: cavalry given infantry stats, so only the chase differs; defender 14 inf is beaten by 14 inf + 6 X; strength left in the beaten force
{const cav0=Object.assign({},UNITS_().cav),res={};for(const k of["inf","cav"]){UNITS_().cav.a=2;UNITS_().cav.d=4;UNITS_().cav.sp=1;let tot=0,n=0;for(let i=0;i<N;i++){prov.t="p";prov.fort=0;G.armies=[];G.bt=[];const d=A.mkArmy("FRA","PAR",{inf:14},false),a=A.mkArmy("GBR","PAR",k==="inf"?{inf:20}:{inf:14,cav:6},false);G.armies.push(d,a);for(let m=0;m<10;m++){for(const x of G.armies){x._fought=0;x._lost=0;}A.battleTick();if(!G.bt.length)break;}if(d._lost){tot+=d.u.reduce((s,u)=>s+u.str,0);n++;}}res[k]=tot/Math.max(1,n);}
 Object.assign(UNITS_().cav,cav0);
 console.log("cavalry pursuit: strength left in a beaten 14-brigade force, 20 inf chasing:",res.inf.toFixed(2),"| 14 inf + 6 cav (same stats) chasing:",res.cav.toFixed(2));}
prov.t=terr0;prov.fort=fort0;
// 60 years
A.newGame(null,seed);G=A.getG();let bn=0,bm=0,maxm=0,lens={};for(let i=0;i<720;i++){A.monthTick();G=A.getG();}
const bs=G.bs||{n:0,m:0};console.log("60-year run (seed "+seed+"): land battles settled",bs.n,"average length",(bs.m/Math.max(1,bs.n)).toFixed(2),"months | battles in progress at end",(G.bt||[]).length);
// save round trip with a battle in progress
{const z=JSON.stringify(G);const H=JSON.parse(z);console.log("battle records survive JSON:",Array.isArray(H.bt),JSON.stringify((H.bt||[])[0]||null));}
