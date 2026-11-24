/* D0: Britain's factory levels in range, nations with mills research method techs, AI default path reachable. usage: node test_d0.js [seed] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,aiBudget};');
const A=ctx.API,seed=+(process.argv[2]||7);A.newGame(null,seed);for(let i=0;i<768;i++)A.monthTick();const G=A.getG();
const lv=t=>{let l=0;for(const p of G.plist)if(p.o===t)for(const f of p.factories)l+=f.lv;return l;};
const gb=lv("GBR"),ru=G.c.RUS,rt=["dynamo","chem","rail3","combust","electrify"].filter(x=>ru.tech[x]).length;
const c=Object.values(G.c).find(x=>x.alive&&x.ai&&!x.dflt);let d=0;for(let i=0;i<80&&!d;i++){c.debt=5000;c.stat.interest=900;c.stat.inc=1000;c.stat.net=-100;c.insol=1;A.aiBudget(c);if(c.dflt)d=1;}
console.log("GBR levels",gb,"| Russian method techs",rt,"of 5 | AI default reached:",!!d);console.log(gb>=100&&gb<=250&&rt>=3&&d?"ok":"FAIL");
