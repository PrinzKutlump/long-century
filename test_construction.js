"use strict";
/* A2: the construction lifecycle. Every payer (public treasury, private investment pool, foreign sponsor) can spend only
 * what it holds; the funding limit does not depend on whether a ledger exists (the player's projects have the full ledger,
 * everyone else's none), so a human sponsor and an AI sponsor must see identical funding. Part-fund a railway, queue a
 * mill, exhaust the payer, restore funds, transfer ownership, extinguish an owner and reload; every payment reconciles with
 * the balances and no balance goes negative because of construction. Runs on the built game (real pack/unpack). */
const fs = require("node:fs");
const vm = require("node:vm");
const L = require("./tools/a0_lib");

let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e * Math.max(1, Math.abs(a), Math.abs(b));

const html = fs.readFileSync("dist/long-century.html", "utf8");
const SCENARIO = `(function(mode){
 const human=mode==="human",TAG="GBR";let c=G.c[TAG];
 const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e*Math.max(1,Math.abs(a),Math.abs(b));
 const out={mode,checks:[],num:{}};const ck=(ok,t)=>out.checks.push([!!ok,t]);
 const ends=[],qends=[];
 const oe=endProject,oq=queueEnd;
 endProject=function(...a){const r=oe(...a);ends.push(r);return r;};
 queueEnd=function(...a){const r=oq(...a);qends.push(r);return r;};
 const order=cmd=>human?applyCampaignCommand({...issueCampaignCommand(),...cmd}):aiOrder(c,cmd);
 const projects=()=>{const m={};for(const p of G.plist)for(const b of p.build)m[b.pid]={b,p};return m;};
 const balances=()=>{let s=0,min=1e18;const rows={};for(const t in G.c){const n=G.c[t];if(!n.alive)continue;s+=n.tr+n.inv;rows[t]=[n.tr,n.inv];min=Math.min(min,n.tr,n.inv);}return{s,min,rows};};
 /* one investment month with reconciliation: balances drop by exactly what the projects booked as paid */
 const month=()=>{
  const before=balances(),pb={};for(const k in projects())pb[k]=projects()[k].b.paid||0;
  const e0=ends.length;investMonth();
  const after=balances(),now=projects();let booked=0;
  for(const k in now)booked+=(now[k].b.paid||0)-(pb[k]||0);
  for(const r of ends.slice(e0))if(r.outcome==="completed")booked+=r.spent-(pb[r.pid]||0);
  let neg=0;for(const t in after.rows)for(let i=0;i<2;i++)if(after.rows[t][i]<0&&before.rows[t][i]>=0)neg++;
  return{drop:before.s-after.s,booked,neg,min:after.min};
 };
 let recon=0,negs=0,months=0,worst=0;
 const step=()=>{const r=month();months++;if(Math.abs(r.drop-r.booked)>1e-6*Math.max(1,r.drop))recon++;negs+=r.neg;worst=Math.min(worst,r.min);return r;};

 /* 1. a railway, part-funded */
 const prov=provsOf(TAG).find(p=>railCan(c,p).ok);
 ck(order({kind:"rail",province:prov.id}).ok,"railway ordered");
 const rail=prov.build.at(-1),pid=rail.pid;
 ck(typeof pid==="string"&&pid.length>0,"the project has a stable id at the start");
 const left0=Object.values(rail.left).reduce((s,x)=>s+x,0);
 c.tr=400;const r1=step();
 ck(c.tr>=0&&c.tr<1e-6,"part-funded: the treasury is spent to zero, not below");
 ck(near(rail.paid,400)&&r1.neg===0,"part-funded: exactly the treasury was paid");
 const left1=Object.values(rail.left).reduce((s,x)=>s+x,0);
 ck(left1<left0&&left1>0,"part-funded: some materials delivered, some still to come");
 out.num.paid1=rail.paid;out.num.left1=left1;
 /* 2. exhausted payer */
 c.tr=0;const r2=step();
 ck(near(rail.paid,400)&&c.tr===0&&near(Object.values(rail.left).reduce((s,x)=>s+x,0),left1),"exhausted payer: nothing is bought, nothing goes negative, the project waits");
 /* 3. a queued mill keeps its id when promoted */
 const bprov=provsOf(TAG).find(p=>Object.keys(BLD).some(k=>bldCan(c,p,k).ok)),bk=Object.keys(BLD).find(k=>bldCan(c,bprov,k).ok);
 c.tr=5e6;ck(order({kind:"queue",province:bprov.id,building:bk}).ok&&c.bq.length===1,"mill queued");
 const qid=c.bq[0].id;c.tr=0;
 bqMonth(c);ck(c.bq.length===0,"the queued mill is promoted");
 const mill=bprov.build.find(b=>b.k==="bld");
 ck(mill&&mill.pid===TAG+"/"+qid,"queue promotion keeps the project id ("+(mill&&mill.pid)+")");
 step();ck(mill.pid===TAG+"/"+qid&&mill.paid===0&&c.tr===0,"the mill waits unpaid while the treasury is empty");
 /* reload with the railway part-paid: continue both ways and compare */
 const text=pack();
 let c1=G.c[TAG];c1.tr=1e8;
 let n1=0;while(provsOf(TAG).some(p=>p.build.length)&&n1++<600){const r=month();months++;if(Math.abs(r.drop-r.booked)>1e-6*Math.max(1,r.drop))recon++;negs+=r.neg;}
 ck(n1<600,"restored funds: every project finishes");
 const doneA={rail:prov.rail,tr:G.c[TAG].tr,ends:ends.filter(r=>r.outcome==="completed").map(r=>r.pid+":"+Math.round(r.spent))};
 const railEnd=ends.find(r=>r.pid===pid),millEnd=ends.find(r=>r.pid===TAG+"/"+qid);
 ck(railEnd&&railEnd.outcome==="completed"&&millEnd&&millEnd.outcome==="completed","each project ends once, as completed, under the id it started with");
 ck(railEnd.unspent<=1&&millEnd.unspent<=1,"completed: the whole bill is spent, nothing unspent");
 ck(ends.filter(r=>r.pid===pid).length===1,"exactly one terminal record per project");
 if(human){const led=Object.values(G.constructionLedger||{}).find(l=>l.kind==="rail"&&l.province===prov.id);
  ck(led&&led.outcome==="completed"&&near(led.spent,railEnd.spent)&&led.status==="Completed","the player's ledger agrees with the terminal record");}
 /* reload and run the same restoration */
 unpack(text);c=G.c[TAG];const cc=c;
 const pr2=G.prov[prov.id],rail2=pr2.build.find(b=>b.k==="rail");
 ck(rail2&&rail2.pid===pid&&near(rail2.paid,400)&&near(Object.values(rail2.left).reduce((s,x)=>s+x,0),left1),"reload: the part-paid railway keeps its id, payments and remaining materials");
 ck(G.prov[bprov.id].build.some(b=>b.pid===TAG+"/"+qid),"reload: the promoted mill keeps its queue-derived id");
 ends.length=0;cc.tr=1e8;let n2=0;while(provsOf(TAG).some(p=>p.build.length)&&n2++<600)step();
 ck(G.prov[prov.id].rail===doneA.rail&&near(G.c[TAG].tr,doneA.tr)&&JSON.stringify(ends.filter(r=>r.outcome==="completed").map(r=>r.pid+":"+Math.round(r.spent)))===JSON.stringify(doneA.ends),
  "reload: finishing after a reload gives the same railway, the same treasury and the same payments as finishing without one");
 out.num.railSpent=railEnd.spent;out.num.millSpent=millEnd.spent;out.num.rail=doneA.rail;out.num.tr=doneA.tr;
 /* 4. a foreign sponsor with a small pool pays at most its pool */
 const fprov=provsOf("FRA").find(p=>p.ctl===p.o&&!p.build.length),fg=Object.keys(RECIPE)[0];
 const fb=startFactory(G.c.FRA,fprov,fg,false);fb.fo=TAG;
 const owner=G.c.FRA,spon=G.c[TAG];spon.inv=300;const ownerBefore=[owner.tr,owner.inv];const rf=step();
 ck(spon.inv>=0&&spon.inv<1e-6&&near(fb.paid,300)&&owner.inv===ownerBefore[1]&&owner.tr===ownerBefore[0],"foreign sponsor: pays only its pool, the owner nation pays nothing");
 spon.inv=0;step();ck(near(fb.paid,300)&&spon.inv===0,"foreign sponsor with an empty pool: the project waits");
 /* 5. transfer of ownership: spent is recorded, nothing is refunded */
 const trBefore=[spon.inv,owner.inv,owner.tr];const e1=ends.length;
 transferProv(fprov,"GBR");
 const te=ends.slice(e1);
 ck(te.length===1&&te[0].pid===fb.pid&&te[0].outcome==="canceled"&&near(te[0].spent,300)&&te[0].recoverable===0&&te[0].unspent>0,"transfer: the canceled project records spent 300, recoverable 0 and the unspent materials");
 ck(fprov.build.length===0&&spon.inv===trBefore[0]&&owner.inv===trBefore[1]&&owner.tr===trBefore[2],"transfer: the province carries no project and no balance moved (the existing no-refund policy)");
 /* 6. queue invalidation */
 const qprov=provsOf(TAG).find(p=>p.id!==prov.id&&Object.keys(BLD).some(k=>bldCan(c,p,k).ok)),qk=Object.keys(BLD).find(k=>bldCan(c,qprov,k).ok);
 c.tr=5e6;ck(order({kind:"queue",province:qprov.id,building:qk}).ok,"second mill queued");
 const dq=c.bq[0],q0=qends.length;transferProv(qprov,"FRA");bqMonth(c);
 ck(c.bq.length===0&&qends.length===q0+1&&qends[q0].pid===queuePid(c,dq)&&qends[q0].outcome==="queue ended"&&!qprov.build.length,"queue invalidation: the order for a lost province is dropped, recorded under its id, and starts nothing");
 /* 7. owner extinction */
 const small=Object.values(G.c).filter(n=>n.alive&&n.tag!==TAG&&n.tag!=="FRA"&&provsOf(n.tag).length>0&&provsOf(n.tag).length<=2).sort((a,b)=>provsOf(a.tag).length-provsOf(b.tag).length)[0];
 const sp=provsOf(small.tag),sb=startRail(small,sp[0]);sb.paid=50;small.bq=[{p:sp[0].id,b:bk,id:"q1"}];const e2=ends.length;
 for(const p of sp)transferProv(p,"GBR");
 ck(!small.alive&&small.bq.length===0&&ends.slice(e2).some(r=>r.pid===sb.pid&&r.outcome==="canceled"&&r.spent===50)&&sp.every(p=>p.build.length===0),"owner extinction: its projects end as canceled with spent recorded, its queue is cleared");
 out.num.recon=recon;out.num.negs=negs;out.num.months=months;out.num.worst=worst;
 ck(recon===0,"every investment month reconciles: balances fall by exactly the booked payments ("+months+" months)");
 ck(negs===0,"no balance that was non-negative went negative because of construction");
 return out;})`;

function runMode(mode) {
 const nodes = new Map();
 const context = vm.createContext({ console, performance, setInterval: () => 1, clearInterval: () => {}, window: { addEventListener() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild(n) { nodes.set("#" + n.id, n); } } } });
 vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1], context);
 vm.runInContext(`newGame(null,7);${mode === "human" ? 'G.player="GBR";G.c.GBR.ai=false;' : ""}`, context);
 return vm.runInContext(SCENARIO + `(${JSON.stringify(mode)})`, context);
}
const res = {};
for (const mode of ["human", "ai"]) {
 res[mode] = runMode(mode);
 for (const [ok, t] of res[mode].checks) check(ok, mode + " sponsor: " + t);
}
const h = res.human.num, a = res.ai.num;
check(["paid1", "left1", "railSpent", "millSpent", "rail", "tr", "recon", "negs"].every(k => near(h[k], a[k])),
 "a human and an AI sponsor are funded identically (ledger or no ledger): paid, remaining, spent, treasury");
if (failed) { console.log("FAIL test_construction: " + failed + " check(s) failed"); process.exit(1); }
console.log("test_construction: all checks passed");
