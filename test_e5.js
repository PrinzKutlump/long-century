/* E5: factory methods. usage: node test_e5.js [seed] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,provsOf,counts,sum,GOODS,RECIPE};');
const A=ctx.API,seed=+(process.argv[2]||7),R=Math.round;A.newGame(null,seed);let G=A.getG();
const T=["GBR","PRU","FRA","USA","RUS"];
for(let i=0;i<=768;i++){G=A.getG();if([288,408,528,648,768].includes(i)){const y=1836+i/12;
 console.log("== "+y+" | "+T.map(t=>{const c=G.c[t];if(!c||!c.alive)return t+":dead";const m=[0,0,0];let out=0,cra=0,lv=0;for(const p of A.provsOf(t)){const n=A.counts(p);cra+=n.CRA;for(const f of p.factories){m[f.m||0]+=f.lv;lv+=f.lv;if(f._out)out+=f._out*G.price[f.g]/A.GOODS[f.g].p;}}
  return t+" levels "+R(lv)+" (m0 "+R(m[0])+" m1 "+R(m[1])+" m2 "+R(m[2])+") "+R(100*(m[1]+m[2])/Math.max(1,lv))+"% modern; output/level "+R(out/Math.max(1,lv))+"; craftsmen "+R(cra)+"k";}).join(" | "));}
 A.monthTick();}
const c=G.c.GBR;let sh=0,tot=0;for(const p of A.provsOf("GBR"))for(const f of p.factories){tot+=f.lv;if((f.m||0)>0)sh+=f.lv;}
console.log("machinery price",(G.price.machinery/19).toFixed(2),"steel",(G.price.steel/11.5).toFixed(2));
