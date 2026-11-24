/* D2: guarantees bring the guarantor into a defensive war; AI Great Powers give guarantees by game theory; the AI weighs the target's backers before it attacks. usage: node test_d2.js [seed] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,declareWar,endWar,guarantee,guaranteeCan,revokeGuar,guarantors,warEV,provsOf,backing};');
const A=ctx.API,seed=+(process.argv[2]||7);A.newGame(null,seed);let G=A.getG();const ok=[];const chk=(n,v)=>{ok.push(v);console.log((v?"ok   ":"FAIL ")+n);};
for(let i=0;i<12;i++)A.monthTick();G=A.getG();
// manual guarantee and defensive war
const gb=G.c.GBR;gb.war=[];const r=A.guarantee(gb,"DEN");chk("guarantee issued: "+r.txt,r.ok&&A.guarantors("DEN").includes("GBR"));
chk("a Great Power cannot be guaranteed",!A.guaranteeCan(gb,"FRA").ok);
let joined=0,tries=0;for(;tries<40;tries++){for(const t in G.c){G.c[t].war=[];G.c[t].truce={};}G.wars=[];const w=A.declareWar("PRU","DEN",{k:"conquer",tag:"DEN",prov:A.provsOf("DEN")[0].id,cong:1});if(w&&w.def.includes("GBR"))joined++;A.endWar(w,"white");gb.guar=["DEN"];}
chk("the guarantor joins most defensive wars ("+joined+" of "+tries+")",joined>=tries*.6);
// guarantee voided if guarantor attacks the guaranteed
for(const t in G.c){G.c[t].war=[];G.c[t].truce={};}G.wars=[];gb.guar=["DEN"];const w2=A.declareWar("GBR","DEN",{k:"conquer",tag:"DEN",prov:A.provsOf("DEN")[0].id,cong:1});chk("attacking a state we guarantee voids the guarantee",!gb.guar.includes("DEN"));if(w2)A.endWar(w2,"white");
// EV: a guarded, strong target is a worse bet than the same target alone
for(const t in G.c){G.c[t].war=[];G.c[t].truce={};}G.wars=[];gb.guar=[];const cb={k:"conquer",t:"DEN",prov:A.provsOf("DEN")[0].id,why:"A civilizing mission"};const e0=A.warEV(G.c.PRU,cb);gb.guar=["DEN"];const e1=A.warEV(G.c.PRU,cb);
chk("a guarantee lowers the expected value of attacking ("+e0.ev.toFixed(1)+" -> "+e1.ev.toFixed(1)+", odds "+e0.p.toFixed(2)+" -> "+e1.p.toFixed(2)+")",e1.ev<e0.ev&&e1.p<e0.p);
// AI gives guarantees on its own over 30 years
A.newGame(null,seed);G=A.getG();let n=0,mx=0;for(let i=0;i<360;i++){A.monthTick();G=A.getG();n=0;for(const t in G.c)n+=(G.c[t].guar||[]).length;mx=Math.max(mx,n);}
chk("AI Great Powers issue guarantees by themselves (peak "+mx+")",mx>=1);
G=A.getG();delete G.c.GBR.guar;let e=null;try{for(let i=0;i<6;i++)A.monthTick();}catch(x){e=x;}chk("old save without guar runs",!e);
console.log(ok.every(Boolean)?"ok":"FAIL");
