const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,declareWar,provsOf,P,findPath,orderMove,seaCheck,portCaps,mkArmy,edgeTime,fight,get ADJ(){return ADJ},get SEAADJ(){return SEAADJ},UNITS};');
const A=ctx.API,seed=+(process.argv[2]||7),yrs=+(process.argv[3]||60);A.newGame(null,seed);let G=A.getG();const P=A.P;
// ---- part 1: manual crossing GBR -> a French coastal province, no transports then with transports
for(const a of G.armies)if(a.o==="GBR"&&a.naval)a.u=a.u.filter(u=>!A.UNITS[u.k].cap);
const home=A.provsOf("GBR").find(p=>p.sea&&A.SEAADJ[p.id].length&&G.armies.some(a=>a.o==="GBR"&&a.loc===p.id&&!a.naval))||A.provsOf("GBR").find(p=>p.sea&&A.SEAADJ[p.id].length);
const tgt=A.provsOf("FRA").find(p=>p.sea&&A.SEAADJ[p.id].length&&!A.ADJ[home.id].includes(p.id));
const army=A.mkArmy("GBR",home.id,{inf:4},false);G.armies.push(army);
const w=A.declareWar("GBR","FRA",{k:"conquer",tag:"FRA",prov:tgt.id});tgt.ctl="FRA";
console.log("departure",home.n,"target",tgt.n,"| capacity in port",A.portCaps("GBR")[home.id]||0);
let sc=A.seaCheck(army,tgt.id);console.log("no transports: path",sc.ok?"yes":"NO","|",sc.txt);
const fl=A.mkArmy("GBR",home.id,{clip:1,steam:1},true);G.armies.push(fl);
console.log("clip(3)+steam(6) at str 1 -> capacity",A.portCaps("GBR")[home.id]);
sc=A.seaCheck(army,tgt.id);console.log("with transports: path",sc.ok?"yes":"NO","need",sc.need,"have",sc.have);
const army2=A.mkArmy("GBR",home.id,{inf:6},false);G.armies.push(army2);sc=A.seaCheck(army2,tgt.id);console.log("second army of 6 while 9 free: ok",sc.ok);
console.log("order move:",A.orderMove(army,tgt.id),"| locked",JSON.stringify(army.tr),"| free in port now",A.portCaps("GBR")[home.id],"| 6-unit army can sail:",A.seaCheck(army2,tgt.id).ok?"yes":"NO ("+A.seaCheck(army2,tgt.id).txt+")");
// enemy-held landing
const army3=A.mkArmy("GBR",home.id,{inf:2},false);G.armies.push(army3);
const e0=A.edgeTime(army3,home.id,A.findPath(army3,tgt.id)[0]);
army3.path=A.findPath(army3,tgt.id);army3.path.length=Math.min(army3.path.length,1);
let tot=0,u=home.id,pp=A.findPath(army,tgt.id);for(const v of pp){tot+=A.edgeTime(army,u,v);u=v;}
console.log("voyage months, hostile landing:",tot);tgt.ctl="GBR";let t2=0;u=home.id;for(const v of pp){t2+=A.edgeTime(army,u,v);u=v;}console.log("same voyage, landing in a province we hold:",t2);
// run the voyage
tgt.ctl="FRA";let m=0;while(army.path.length&&m<30){A.monthTick();m++;}
console.log("after",m,"months: army at",army.loc,"| tr",JSON.stringify(army.tr||null),"| lnd",army.lnd||0,"| free capacity in port",A.portCaps("GBR")[home.id]);
// landing penalty in fight: same forces, lnd on/off
function duel(l){let wins=0;for(let i=0;i<300;i++){const p=P(tgt.id),X=A.mkArmy("GBR",p.id,{inf:6},false),Y=A.mkArmy("FRA",p.id,{inf:6},false);X.lnd=l;const mx=X.u.map(()=>0);A.fight(p,[X],[Y],false);if(X._lost!==1)wins++;}return wins;}
console.log("attacker wins of 300 even fights: normal",duel(0),"| first battle after landing (-25% attack)",duel(2));
// ---- part 2: AI landings over a long run
G=A.getG();const seen=new Set(),by={};let fresh=0;
for(let i=0;i<yrs*12;i++){A.monthTick();G=A.getG();for(const a of G.armies)if(a.tr&&!seen.has(a.id)){seen.add(a.id);by[a.o]=(by[a.o]||0)+1;}}
console.log("AI sea embarkations in "+yrs+" years:",seen.size,JSON.stringify(by),"| GPs now",G.gp.join(","));
