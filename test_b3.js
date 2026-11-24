// every new great work can be begun and finished, its province exists, and its effect lands
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,GW,startGW,gwMonth,gwState,P,provsOf,BLD};');
const A=ctx.API;A.newGame(null,7);const G=A.getG();
const NEED={mtcenis:["PIE","LYO"],ring:["VIE"],tokyo:["EDO"],india:["CAL","DEL","BOM"],brooklyn:["NYC"],liberty:["NYC"],cpr:["TOR","RUP","ORG"],aswan:["ASW"],nobel:["STO"],hejaz:["DAM","MEC"],cape:["CPT","TRV","KEN","KHA","ASW","CAI"],austral:["SYD","WAU"],natbank:[],fair1860:[]};
let fail=0;
for(const id in NEED){const w=A.GW.find(x=>x.id===id);if(!w){console.log("FAIL missing",id);fail++;continue;}
 G.t=100*12;const c=G.c.GBR;c.civ=1;for(const t of["rail1","rail2","rail3","bessemer","darwin","central","realism"])c.tech[t]=1;
 for(const pid of NEED[id]){const p=A.P(pid);if(!p){console.log("FAIL no province",pid);fail++;continue;}p.o=c.tag;p.ctl=c.tag;}
 const before=A.provsOf("GBR").reduce((s,p)=>s+p.rail+(p.irr||0),0),pres=c.pres;
 const r=A.startGW(c,id);if(!r.ok){console.log("FAIL begin",id,r.txt,w.why&&w.why(c));fail++;continue;}
 for(let i=0;i<w.m+1;i++){c.tr=1e9;A.gwMonth();}
 const ok=G.gwDone&&G.gwDone[id]&&G.gwDone[id].includes("GBR"),after=A.provsOf("GBR").reduce((s,p)=>s+p.rail+(p.irr||0),0);
 console.log((ok?"ok   ":"FAIL ")+id+" months "+w.m+" prestige +"+Math.round(c.pres-pres)+" rail/irrigation levels +"+(after-before));if(!ok)fail++;}
{const c=G.c.GBR,r=A.startGW(c,"fair1900");console.log((r.ok?"FAIL ":"ok   ")+"a capital cannot host two fairs: "+r.txt);if(r.ok)fail++;}
console.log(fail?"FAILED":"ok");
