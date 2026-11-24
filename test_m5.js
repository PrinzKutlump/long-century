const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,declareWar,provsOf,P,mkArmy,armyMonth,supLim,supplyLine,get ADJ(){return ADJ}};');
const A=ctx.API,seed=+(process.argv[2]||7),months=+(process.argv[3]||240),R=x=>Math.round(x*100)/100;A.newGame(null,seed);let G=A.getG();const P=A.P;
const avg=(a,f)=>a.u.reduce((s,u)=>s+u[f],0)/a.u.length;
// 1. 40 units in desert
let dp=G.plist.find(p=>p.o&&p.t==="d"&&p.ctl===p.o)||(()=>{const p=A.provsOf("GBR")[0];p.t="d";return p;})();const own=dp.o;G.c[own].ai=false;
G.armies.filter(a=>a.o===own&&a.loc===dp.id&&!a.naval).forEach(a=>a.u=[]);const st=A.mkArmy(own,dp.id,{inf:40},false);G.armies.push(st);const here=()=>G.armies.filter(a=>a.o===own&&a.loc===dp.id&&!a.naval).flatMap(a=>a.u);
console.log("1) 40 units in desert province",dp.n,"owner",own,"| limit",A.supLim(dp),"(terrain "+3+", rail "+dp.rail+", fort "+dp.fort+")");
for(let m=1;m<=6;m++){A.monthTick();{const h=here();console.log("   month",m,"units",h.length,"avg strength",R(h.reduce((s,u)=>s+u.str,0)/h.length));}}
const pl=A.mkArmy(own,dp.id,{inf:10},false);G.armies.push(pl);const q=[];
// 2. cut-off
G=A.getG();const a1="GBR",a2="FRA";G.c[a1].ai=false;G.c[a2].ai=false;
const tgt=A.provsOf(a2).find(p=>!p.sea)||A.provsOf(a2)[0];A.declareWar(a1,a2,{k:"conquer",tag:a2,prov:tgt.id});
tgt.fort=5;const cut=A.mkArmy(a1,tgt.id,{inf:8},false);G.armies.push(cut);
console.log("2) GBR army of 8 in "+tgt.n+" inside France; open sea (navies balanced): supply line",JSON.stringify(A.supplyLine(cut)));
for(const a of G.armies)if(a.o===a2&&!a.naval)a.u=[];for(const a of G.armies)if(a.o===a2&&a.naval)for(let i=0;i<40;i++)a.u.push({k:"bb",str:1,org:1});
for(const a of G.armies)if(a.o===a1&&a.naval)a.u=[];
for(let m=1;m<=5;m++){cut.siege=0;A.monthTick();G=A.getG();const alive=G.armies.includes(cut);console.log("   month",m,"French fleet dominates: cut counter",cut.cut||0,"avg org",alive?R(avg(cut,"org")):"-","army",alive?"alive":"SURRENDERED");if(!alive)break;}
// 3. distance-scaled shortage
G=A.getG();const c1=G.c.RUS;c1.fill={arms:.3,ammo:.3,canned:.3};G.c.RUS.ai=false;let nb=null;for(const t of new Set(G.plist.filter(p=>p.o&&p.o!=="RUS"&&A.ADJ[p.id].some(n=>P(n).o==="RUS")&&G.c[p.o].alive).map(p=>p.o))){if(A.declareWar("RUS",t,{k:"conquer",tag:t,prov:A.provsOf(t)[0].id})){nb=t;}}G.c[nb].ai=false;for(const a of G.armies)if(a.o===nb||a.o==="RUS"&&!a.naval)a.u=[];let fp=G.plist.filter(p=>p.o&&p.o!=="RUS"&&G.c[p.o].war.some(w=>G.c.RUS.war.includes(w))).map(p=>[A.supplyLine({o:"RUS",loc:p.id}).hops,p.id]).sort((x,y)=>(y[0]<9)*y[0]-(x[0]<9)*x[0])[0][1];for(const a of G.armies)if(a.o!=="RUS"&&!a.naval)a.u=[];const near=A.mkArmy("RUS",c1.cap,{inf:2},false),farp=A.provsOf("RUS").map(p=>p.id).find(id=>id!==c1.cap&&!A.ADJ[c1.cap].includes(id)),far=A.mkArmy("RUS",fp,{inf:2},false);
G.c.RUS.ai=false;far.o="RUS";
G.armies.push(near,far);const L=A.supplyLine(far);near.u.forEach(u=>u.org=.3);far.u.forEach(u=>u.org=.3);near._fought=far._fought=0;
// run one army month with fill held (armyMonth does not recompute fill)
console.log("   test3 setup: enemy",nb,"province",fp,"owner",P(fp).o,"ctl",P(fp).ctl,"wars",G.wars.length);const g0=avg(near,"org");A.armyMonth();console.log("3) goods fill 30%: org gain at home (hops 0)",R(avg(near,"org")-.3),"| army "+L.hops+" provinces from our land (hops "+L.hops+")",R(avg(far,"org")-.3),"| with full supply home gain would be",R(.12*(.4+.6)*(.5+.5*G.c.RUS.sp.mil)));
// 4. AI stacks
A.newGame(null,seed);G=A.getG();const rows=[];
for(let i=1;i<=months;i++){A.monthTick();G=A.getG();if(i%12===0){const k={};for(const a of G.armies)if(!a.naval&&!a.reb&&a.u.length&&!a.path.length){const key=a.o+a.loc;k[key]=(k[key]||0)+a.u.length;}let units=0,over=0,worst=0,ws="",sw=0,n=0,excess=0;for(const key in k){const p=P(key.slice(3));const lim=A.supLim(p),r=k[key]/lim;units+=k[key];sw+=r*k[key];n++;excess+=Math.max(0,k[key]-lim);if(k[key]>lim*1.2)over+=k[key]-lim*1.2;if(r>worst){worst=r;ws=key+" "+k[key]+"/"+lim;}}
 rows.push({y:1836+i/12|0,stacks:n,units,wavg:sw/units,exc:excess/units,over:over/units,worst:ws});}}
console.log("4) AI stacks (stationary, all nations), yearly samples: units | unit-weighted stack/limit | share of units above limit | share above limit+20% | worst");
for(const r of rows.filter((_,i)=>i%3===2))console.log("  ",r.y,r.units,R(r.wavg),R(r.exc),R(r.over),r.worst);
console.log("   mean over all samples: weighted stack/limit",R(rows.reduce((s,r)=>s+r.wavg,0)/rows.length),"| excess share",R(rows.reduce((s,r)=>s+r.exc,0)/rows.length));
