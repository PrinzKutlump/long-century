// W5: ships are posted to seas with a mission. Blockade by station: Britain shuts at least 30% of the French coast; patrol covers; transfers sail.
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('dist/long-century.html','utf8').split('<script>')[1].split('</script>')[0];
const src=source+'\n;globalThis.A={newGame,monthTick,G:()=>G,declareWar,nsGet,nsTransfer,navFleets,SEAR_OF,SEAREG,P,navalPower};';
let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log("FAIL",m);}else console.log("pass",m);};
function run(seed){const ctx={window:{addEventListener(){}},document:{addEventListener(){}},console,Math,JSON,Object,Array,Number,String,Date,Set,Map,isFinite};vm.createContext(ctx);vm.runInContext(src,ctx);const A=ctx.A;A.newGame("GBR",seed);let G=A.G();
 const c=G.c.GBR;c.ai=false;G.c.FRA.ai=true;
 const n0=A.navFleets("GBR").reduce((s,a)=>s+a.u.length,0);
 for(const a of G.armies)if(a.o==="FRA"&&a.naval)a.u=a.u.slice(0,Math.max(1,Math.floor(a.u.length/3)));
 for(const t in G.c){G.c[t].truce={};}
 const w=A.declareWar("GBR","FRA",{k:"conquer",tag:"FRA",prov:"BDX"});if(!w)throw new Error("no war");
 // station orders: the channel and the bay of Biscay blockade France; ships sent from the home sea
 A.nsGet("GBR","nort",1).m="blockade";A.nsGet("GBR","nort",1).tg="FRA";A.nsGet("GBR","bisc",1).m="blockade";A.nsGet("GBR","bisc",1).tg="FRA";
 const here=A.navFleets("GBR").filter(a=>a.sr==="nort"||!a.sr).reduce((s,a)=>s+a.u.length,0);
 const dry=A.nsTransfer("GBR","nort","bisc",Math.floor(n0/2),true);const go=A.nsTransfer("GBR","nort","bisc",Math.floor(n0/2));
 let best=0,by=null;for(let i=0;i<10;i++){A.monthTick();G=A.G();G.c.GBR.ai=false;const k=G.c.FRA;if(k.blk&&k.blk.share>best){best=k.blk.share;by=k.blk.by;}}
 const st=A.navFleets("GBR").map(a=>a.sr);const inB=A.navFleets("GBR").filter(a=>a.sr==="bisc").length;
 return{n0,best:+best.toFixed(2),by,dry:dry.ok&&dry.n,go:go.ok&&go.n,eta:go.eta,inB,mine:A.navalPower("GBR")>A.navalPower("FRA")};}
const R=[7,3,11].map(run);console.log(JSON.stringify(R));
ok(R.every(r=>r.dry>0&&r.go>0),"ships can be sent from one sea to another (dry run agrees)");
ok(R.filter(r=>r.best>=.3&&r.by==="GBR").length>=2,"blockade by station shuts at least 30% of the French coast (2 of 3 seeds)");
ok(R.every(r=>r.inB>0),"the ships posted to a new sea take that station");
console.log(bad?"FAILED":"ok");process.exit(bad?1:0);
