/* E6: an AI nation driven into deficit borrows, pays interest and defaults; nobody stays below zero. usage: node test_e6.js [seed] [tag] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,cbsOf,creditLimit,interestRate,dateStr};');
const A=ctx.API,seed=+(process.argv[2]||7),T=process.argv[3]||"OTT",R=Math.round;A.newGame(null,seed);let G=A.getG();
for(let i=0;i<24;i++)A.monthTick();G=A.getG();const c=G.c[T];const pres0=c.pres;let maxD=0,maxRate=0,intPaid=0,def=null,neg=0,worst=0;const rows=[];
for(let i=0;i<120;i++){G=A.getG();if(i<40)c.tr-=(c.stat.inc||1000)*6;A.monthTick();G=A.getG();
 maxD=Math.max(maxD,c.debt/Math.max(1,(c.stat.inc||1)*12));maxRate=Math.max(maxRate,A.interestRate(c));intPaid+=c.stat.interest||0;if(i>=40){if(c.tr<0)neg++;else neg=0;worst=Math.max(worst,neg);}
 if(!def&&c.dflt){def={when:A.dateStr(G.t),amount:R(c.dflt.amt),creditors:c.dflt.cr.join(","),debtAfter:R(c.debt),prestigeBefore:R(pres0),prestigeAfter:R(c.pres)};}
 if(i%10===0)rows.push((i)+": debt "+R(c.debt)+" ("+(c.debt/Math.max(1,(c.stat.inc||1)*12)).toFixed(1)+" yrs of income) rate "+(A.interestRate(c)*100).toFixed(1)+"% treasury "+R(c.tr)+" income "+R(c.stat.inc||0));}
console.log(rows.join("\n"));
const gp=def&&def.creditors.split(",")[0],cb=gp?A.cbsOf(G.c[gp]).filter(x=>x.t===T&&x.why==="Unpaid debts").length:0;
console.log("highest debt "+maxD.toFixed(1)+" years of income, highest rate "+(maxRate*100).toFixed(1)+"%, interest paid "+R(intPaid)+", longest run below zero after the shock ended "+worst+" months");
console.log("default:",JSON.stringify(def),"| casus belli for "+gp+": "+cb,"| borrowing blocked until month",c.noBorrow,"now",G.t);
const stuck=Object.values(G.c).filter(x=>x.alive&&x.tr<0).map(x=>x.tag);
console.log("nations below zero now:",stuck.join(" ")||"none");
console.log(def&&def.debtAfter===0&&worst<=8&&cb>0&&maxD>1&&intPaid>0?"ok":"FAIL");
