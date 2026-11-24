"use strict";
/* C0: the shared programme engine. A programme is a chain of phases (Tanzimat, Meiji, unification routes come later as data).
 * State per nation: c.prog[id]={phase,start,momentum 0-100,support{group:0-100},flags,stall,done,hist}. done is ""|"complete"|"failed".
 * Phases open by conditions; a year only sets the earliest window. Every order goes through execCommand (kind "programme"), for player and AI alike.
 * Content registers definitions with progRegister; the engine itself ships none. */
const PROGRAMMES={};
const PROG_EV_MARGIN=5,PROG_EVERY=3,PROG_MONEY_W=2; /* AI looks every 3 months; a month of income costs PROG_MONEY_W points of payoff */
/* def: {id,n,ok(c)->bool,auto:0|1,groups:{name:start},lean:{TAG:points},phases:[phase],tick(c,st)}
 * phase: {id,n,from:year,cond(c,st)->""|why,choices:[choice]}
 * choice: {id,n,cost:{tr,rp},odds(c,st)->0..1,gain,loss,mom,sup:{group:delta},win(c,st),fail(c,st),stalls:1}  */
function progRegister(def){
 if(!def||!def.id||!Array.isArray(def.phases)||!def.phases.length)throw new Error("bad programme definition");
 PROGRAMMES[def.id]=def;return def;}
function progUnregister(id){delete PROGRAMMES[id];}
function progEnsure(c){if(!c.prog||typeof c.prog!=="object"||Array.isArray(c.prog))c.prog={};return c.prog;}
const progNum=(v,lo,hi,d)=>Number.isFinite(v)?clamp(v,lo,hi):d;
/* save defaults: a save from before C0 has no c.prog; a damaged entry is repaired, never trusted */
function progSanitize(c){
 const pr=progEnsure(c);let fixed=0;
 for(const id of Object.keys(pr)){const s=pr[id];
  if(!s||typeof s!=="object"||Array.isArray(s)){delete pr[id];fixed++;continue;}
  s.phase=Number.isSafeInteger(s.phase)&&s.phase>=0?s.phase:0;s.start=progNum(s.start,0,1e6,0);s.momentum=progNum(s.momentum,0,100,50);
  s.stall=Number.isSafeInteger(s.stall)&&s.stall>=0?s.stall:0;s.done=s.done==="complete"||s.done==="failed"?s.done:"";
  if(!s.support||typeof s.support!=="object"||Array.isArray(s.support))s.support={};
  for(const k of Object.keys(s.support))s.support[k]=progNum(s.support[k],0,100,50);
  if(!s.flags||typeof s.flags!=="object"||Array.isArray(s.flags))s.flags={};
  if(!Array.isArray(s.hist))s.hist=[];s.hist=s.hist.slice(-12);}
 return fixed;}
function progStart(c,id){
 const d=PROGRAMMES[id];if(!d)return{ok:false,why:"Unknown programme."};
 const pr=progEnsure(c);if(pr[id])return{ok:false,why:"Already begun."};
 if(d.ok&&!d.ok(c))return{ok:false,why:"This nation cannot begin it."};
 const sup={};for(const g of Object.keys(d.groups||{}))sup[g]=d.groups[g];
 pr[id]={phase:0,start:G.t,momentum:50,support:sup,flags:{},stall:0,done:"",hist:[]};return{ok:true};}
function progPhase(c,id){const d=PROGRAMMES[id],s=c.prog&&c.prog[id];return d&&s&&!s.done?d.phases[s.phase]||null:null;}
function progCost(ch){const k=ch.cost||{};return{tr:k.tr||0,rp:k.rp||0};}
function progAfford(c,ch){const k=progCost(ch);return c.tr>=k.tr&&(c.rp||0)>=k.rp;}
/* the open phase of a programme for a nation: why not, or the choices with their payoff (the same table for every nation) */
function progOpenPhase(c,id){
 const d=PROGRAMMES[id],s=c.prog&&c.prog[id];
 if(!d||!s)return{ok:false,why:"Not begun."};
 if(s.done)return{ok:false,why:s.done==="complete"?"Finished.":"Failed."};
 const ph=d.phases[s.phase];if(!ph)return{ok:false,why:"No phase."};
 if(ph.from&&yearOf(G.t)<ph.from)return{ok:false,why:"Not before "+ph.from+"."};
 const why=ph.cond?ph.cond(c,s):"";if(why)return{ok:false,why};
 return{ok:true,ph,st:s,choices:(ph.choices||[]).map(ch=>({ch,ev:progEV(c,s,ch),pay:progAfford(c,ch)}))};}
/* payoff: chance of success times gain, less chance of failure times loss, less the money spent (in months of income) */
function progEV(c,s,ch){
 const p=clamp(ch.odds?ch.odds(c,s):.5,0,1),k=progCost(ch),inc=Math.max(1,c.stat&&c.stat.inc||1);
 const spent=(k.tr/inc)*PROG_MONEY_W+k.rp/Math.max(1,c.rp||1)*PROG_MONEY_W;
 return{p,ev:p*(ch.gain||0)-(1-p)*(ch.loss||0)-spent};}
function progBest(c,id){
 const o=progOpenPhase(c,id);if(!o.ok)return null;const lean=((PROGRAMMES[id].lean||{})[c.tag]||0);
 let best=null;for(const x of o.choices)if(x.pay&&x.ev.ev>PROG_EV_MARGIN-lean&&(!best||x.ev.ev>best.ev.ev))best=x;
 return best;}
function progSupportMean(s){const v=Object.values(s.support);return v.length?v.reduce((a,b)=>a+b,0)/v.length:50;}
function progAdvance(c,id,s,ph){const d=PROGRAMMES[id];s.phase++;s.stall=0;if(s.phase>=d.phases.length){s.done="complete";if(c.tag===G.player||c.stat.pop>20000)msg("politics",c.n+": "+d.n+" is complete.");}}
/* one order. Success is rolled from odds(c,st); there is no scripted outcome. Failure applies fail(), costs momentum, and may stall the programme for good. */
function progCommand(c,command){
 const id=command.id,o=progOpenPhase(c,id);if(!o.ok)return{ok:false,why:o.why};
 const x=o.choices.find(y=>y.ch.id===command.choice);if(!x)return{ok:false,why:"Unknown choice."};
 if(!x.pay)return{ok:false,why:"We cannot pay for that."};
 const ch=x.ch,s=o.st,k=progCost(ch),d=PROGRAMMES[id];
 c.tr-=k.tr;c.rp=(c.rp||0)-k.rp;
 const win=rng()<x.ev.p;
 for(const g of Object.keys(ch.sup||{}))s.support[g]=clamp((s.support[g]||0)+(win?ch.sup[g]:Math.round(ch.sup[g]/2)),0,100);
 s.hist.push({t:G.t,ph:o.ph.id,ch:ch.id,win:win?1:0});if(s.hist.length>12)s.hist.shift();
 if(win){s.momentum=clamp(s.momentum+(ch.mom||5),0,100);if(ch.win)ch.win(c,s);progAdvance(c,id,s,o.ph);}
 else{s.momentum=clamp(s.momentum-(ch.mom||5),0,100);if(ch.fail)ch.fail(c,s);s.stall++;
  if(s.stall>=(d.stallMax||3)||s.momentum<=0)s.done="failed";if(c.tag===G.player||c.stat.pop>20000)msg("politics",c.n+": "+o.ph.n+" fails.");}
 return{ok:true,win,txt:win?o.ph.n+": "+ch.n+" succeeds.":o.ph.n+": "+ch.n+" fails."};}
/* raise or lower militancy of pops matching a test: the one link content uses to calm or enrage a community (q.mil runs 0-10; 5.5 starts movements) */
function progMilitancy(c,delta,test){let n=0;for(const p of provsOf(c.tag))for(const q of p.pops)if(!test||test(q,p)){q.mil=clamp(q.mil+delta,0,10);n++;}return n;}
/* monthly: programmes that open by themselves, content tick hooks, and the AI's evaluator */
function progMonth(){
 const ids=Object.keys(PROGRAMMES);if(!ids.length)return;
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;progEnsure(c);
  for(const id of ids){const d=PROGRAMMES[id];if(!c.prog[id]&&d.auto&&(!d.ok||d.ok(c)))progStart(c,id);
   const s=c.prog[id];if(!s||s.done)continue;if(d.tick)d.tick(c,s);
   if(c.ai&&G.t%PROG_EVERY===0){const b=progBest(c,id);if(b)execCommand(tag,{kind:"programme",id,choice:b.ch.id},{auto:true});}}}}
