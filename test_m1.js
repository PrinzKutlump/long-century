const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,declareWar,navalPower,provsOf,isWarship,P,warOf};');
const A=ctx.API,R=Math.round,seed=+(process.argv[2]||7),a1=process.argv[3]||"GBR",a2=process.argv[4]||"FRA";A.newGame(null,seed);let G=A.getG();
const fl=t=>G.armies.filter(a=>a.o===t&&a.naval&&a.u.some(A.isWarship));
console.log("start fleets:",[a1,a2].map(t=>t+" "+fl(t).reduce((s,a)=>s+a.u.length,0)+" ships ("+R(A.navalPower(t))+")").join(" | "));
for(let i=0;i<12;i++)A.monthTick();G=A.getG();const t0=G.c[a2].stat.tariffs,t0b=G.c[a1].stat.tariffs;
const w=A.declareWar(a1,a2,{k:"conquer",tag:a2,prov:A.provsOf(a2)[0].id});console.log("war declared:",!!w,"| "+a2+" tariffs before",R(t0),"| "+a1+" before",R(t0b));
let idleBad=0,maxShare=0,maxShare1=0,minAcc=1;
for(let i=1;i<=48;i++){A.monthTick();G=A.getG();if(!G.wars.length)break;const c2=G.c[a2],c1=G.c[a1];maxShare=Math.max(maxShare,c2.blk.share);maxShare1=Math.max(maxShare1,c1.blk.share);minAcc=Math.min(minAcc,c2.access);
 const p1=A.navalPower(a1),p2=A.navalPower(a2);const strong=p1>p2*1.15?a1:p2>p1*1.15?a2:null;if(strong&&G.c[strong].war.length){const idle=fl(strong).filter(a=>!a.path.length&&G.plist.find(p=>p.id===a.loc).o===strong&&!(strong===a1?G.armies.some(()=>false):false));idleBad+=idle.length>0&&fl(strong).every(a=>!a.path.length&&G.plist.find(p=>p.id===a.loc).o===strong)?1:0;}
 if(i%6===0)console.log("month",i,"| power",a1,R(p1),a2,R(p2),"| blockade of "+a2+":",(c2.blk.share*100).toFixed(0)+"% by "+c2.blk.by,"access",c2.access.toFixed(2),"tariffs",R(c2.stat.tariffs),"| of "+a1+":",(c1.blk.share*100).toFixed(0)+"%","| ws",G.wars[0]?R(G.wars[0].ws):"peace","| "+a1+" fleets at",fl(a1).map(a=>a.loc+(a.path.length?"->"+a.dest:"")).join(","));}
console.log("RESULT: max blockade share on "+a2+" "+(maxShare*100).toFixed(0)+"% on "+a1+" "+(maxShare1*100).toFixed(0)+"%, lowest access "+minAcc.toFixed(2)+", months with all of the superior side's fleets idle at home:",idleBad);
