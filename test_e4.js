/* E4: sphere members buy from their leader first and pay no tariff on it. usage: node test_e4.js [seed] [years] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,dateStr,GOODS};'+'\n'+'{const _e=econMonth;econMonth=function(w){const rates=Object.fromEntries(Object.values(G.c).map(c=>[c.tag,c.eff.tax]));_e(w);globalThis.CHECK?.(rates);};}');
const A=ctx.API,seed=+(process.argv[2]||7),yrs=+(process.argv[3]||12);A.newGame(null,seed);let G=A.getG(),ex=null,bad=0,n=0;
ctx.CHECK=function(rates){G=A.getG();
 for(const m of Object.values(G.c)){if(!m.alive||!m.sphere||!G.c[m.sphere]||!G.c[m.sphere].alive||!m.sphI)continue;const k=Object.keys(m.sphI);if(!k.length)continue;n++;
  const rate=m.tariff*rates[m.tag]*(1+(m._bx?.cust||0));const want=(m.stat.imp-m.stat.impS)*rate;if(Math.abs(want-m.stat.tariffs)>1e-6)bad++;
  if(!ex&&m.stat.impS>0){const g=k.sort((a,b)=>m.sphI[b]-m.sphI[a])[0];ex={when:A.dateStr(G.t),member:m.n,leader:G.c[m.sphere].n,good:A.GOODS[g].n,qty:Math.round(m.sphI[g]),sphereImports:Math.round(m.stat.impS),allImports:Math.round(m.stat.imp),tariff:m.tariff,tariffIncome:Math.round(m.stat.tariffs),tariffIfCharged:Math.round(m.stat.imp*rate)};}}};
for(let i=0;i<yrs*12;i++)A.monthTick();
console.log("sphere member-months with sphere imports:",n,"| tariff charged on sphere imports in any of them:",bad);
console.log("example:",JSON.stringify(ex));
console.log(ex&&bad===0?"ok":"FAIL");
