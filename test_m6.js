const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,provsOf,P,mobilize,demobilize,mobPlan,counts,landUnits,sum,get ADJ(){return ADJ},dateStr};');
const A=ctx.API,seed=+(process.argv[2]||7),yrs=+(process.argv[3]||60),R=x=>Math.round(x*100)/100;A.newGame(null,seed);let G=A.getG();
const T="PRU";const c=()=>G.c[T];c().ai=false;
for(let i=0;i<12;i++)A.monthTick();G=A.getG();
const grain=()=>{let s=0;for(const p of A.provsOf(T)){if(p._out){if(p.farm==="grain")s+=p._out.farm||0;s+=p._out.grain||0;}}return s;};
const farm=()=>A.sum(A.provsOf(T),p=>{const n=A.counts(p);return n.FAR+n.LAB;});
const mil=()=>{let a=0,b=0;for(const p of A.provsOf(T))for(const q of p.pops){a+=q.mil*q.n;b+=q.n;}return a/b;};
const nb=new Set();for(const p of A.provsOf(T))for(const v of A.ADJ[p.id]){const o=A.P(v).o;if(o&&o!==T)nb.add(o);}
const rel=()=>[...nb].map(t=>t+":"+R(G.c[t].rel[T]||0)).join(" ");
const field=()=>A.landUnits(c());
console.log("PRU",A.dateStr(G.t),"| pop",Math.round(c().stat.pop),"k | land units",field(),"| neighbours",rel());
const pl=A.mobPlan(c());console.log("plan: units",pl.units,"men",Math.round(pl.men),"k, cost",Math.round(pl.cost),"treasury",Math.round(c().tr),"share of workers",R(pl.share*100)+"%");
let g0=0,f0=0;for(let i=0;i<3;i++){A.monthTick();g0+=grain()/3;}f0=farm();const u0=field(),m0=mil(),r0=rel(),price0=G.price.grain;
console.log("before: grain/mo",R(g0),"workers",Math.round(f0),"units",u0,"militancy",R(m0),"grain price",R(price0));
console.log(JSON.stringify(A.mobilize(c())));console.log("after order, neighbours:",rel());
const SER=[];for(let i=1;i<=8;i++){A.monthTick();SER.push(grain());console.log(" mobilized month",i,"state",c().mob.st,"units",field(),"workers",Math.round(farm()),"grain/mo",R(grain()),"militancy",R(mil()),"price",R(G.price.grain));}
const uM=field();SER.push(...[]);console.log("army before/after:",u0,"->",uM,"(x"+R(uM/u0)+")");
console.log(JSON.stringify(A.demobilize(c())));
for(let i=1;i<=8;i++){A.monthTick();SER.push(grain());console.log(" after month",i,"state",c().mob.st,"units",field(),"workers",Math.round(farm()),"grain/mo",R(grain()),"militancy",R(mil()));}
// control run: same seed, never mobilized
{A.newGame(null,seed);G=A.getG();G.c[T].ai=false;for(let i=0;i<15;i++)A.monthTick();G=A.getG();const out=[];for(let i=0;i<16;i++){A.monthTick();out.push(grain());}
console.log("grain output vs control run (percent): "+SER.map((v,i)=>R((v/out[i]-1)*100)).join(" ")+"  [months 1-8 mobilized, 9-16 after demobilizing]");}
// 60-year AI run
A.newGame(null,seed);G=A.getG();const prev={};let ord=0,dem=0,viol=0,wars=0,mobMonths=0;const who={};const T0=G.t;
for(let m=0;m<yrs*12;m++){A.monthTick();G=A.getG();for(const t in G.c){const k=G.c[t];if(!k.alive)continue;const st=k.mob?k.mob.st:0,p=prev[t]||0;if(st===1&&p===0){ord++;who[t]=(who[t]||0)+1;}if(p&&!st)dem++;if(st){mobMonths++;if(!k.war.length&&G.t-k.mob.t0>4)viol++;}prev[t]=st;}}
console.log("AI run",yrs,"years: mobilizations",ord,"demobilizations",dem,"still mobilized at end",Object.values(G.c).filter(k=>k.alive&&k.mob&&k.mob.st).length,"| months mobilized while at peace beyond 4:",viol,"| by nation:",Object.entries(who).sort((a,b)=>b[1]-a[1]).slice(0,10).map(x=>x.join(":")).join(" "),"| grain price",R(G.price.grain));
