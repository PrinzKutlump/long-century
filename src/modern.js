/* A6: the road to modernisation. c.modern (0-100) grows only through nine reforms paid in research points (execCommand kind "reform").
 * Same rules and the same evaluator for the player's advice and the AI. Constants marked A6 are the tuning knobs. */
const MOD_REFORMS=[
 {id:"a1",tr:"army",n:"Foreign drill instructors",cost:150,pr:10,fx:"+10% infantry quality",res:[["OFF",.5],["ARI",.5]]},
 {id:"a2",tr:"army",n:"Arsenal and artillery school",cost:250,pr:12,fx:"artillery as effective as a civilised state's; arsenal buildable",res:[["OFF",.5],["ARI",.5]]},
 {id:"a3",tr:"army",n:"General staff and conscription law",cost:350,pr:13,fx:"mobilisation pool +20%",res:[["OFF",1],["ARI",1],["FAR",.5]]},
 {id:"e1",tr:"economy",n:"Western merchants and treaty ports",cost:150,pr:10,fx:"+10% trade income; a port opens to foreign investment",res:[["ARI",.5]]},
 {id:"e2",tr:"economy",n:"State workshops and first mill",cost:250,pr:12,fx:"factories buildable at 1.5x cost",res:[["ARI",.5]]},
 {id:"e3",tr:"economy",n:"Railway concession",cost:350,pr:13,fx:"railways buildable before civilised status",res:[["ARI",.5]]},
 {id:"d1",tr:"administration",n:"Translation bureau and new schools",cost:150,pr:10,fx:"literacy growth +50%",res:[["CLE",1]]},
 {id:"d2",tr:"administration",n:"Land survey and tax reform",cost:250,pr:10,fx:"tax collection +10%",res:[["ARI",1]]},
 {id:"d3",tr:"administration",n:"Codified law and ministries",cost:350,pr:10,fx:"stability; unlocks constitutional reforms",res:[["ARI",.5],["CLE",.5]]}];
const MOD_BY=Object.fromEntries(MOD_REFORMS.map(r=>[r.id,r]));
const MOD_GAP=6,MOD_WEST_LIT=.25,MOD_WEST_ALT=80,MOD_DEFAULT=3;
const MOD_START={PUN:15,EGY:20,JAP:10,CHI:5,PER:8,SIA:8,ETH:5,BUK:2,AFG:3},MOD_FREE={PUN:["a1"],EGY:["a1","e1"]};
/* historical inclination: monthly chance an AI state that can afford its best reform takes it (A6 tuning knobs) */
const MOD_INCL={EGY:.08,JAP:.01,SIA:.06,PER:.03,CHI:.03,PUN:.06,BUK:.004,AFG:.01,ETH:.04};
const modInclOf=c=>c.tag==="JAP"&&yearOf(G.t)>=1853?(yearOf(G.t)>=1860?.05:.01):(MOD_INCL[c.tag]!=null?MOD_INCL[c.tag]:.02);
/* own deterministic roll so the shared RNG stream is untouched */
const modRoll=tag=>{let h=(G.seed|0)^(G.t*2654435761);for(let i=0;i<tag.length;i++)h=Math.imul(h^tag.charCodeAt(i),16777619);h^=h>>>15;h=Math.imul(h,2246822519);h^=h>>>13;return(h>>>0)/4294967296;};
const modStart=tag=>MOD_START[tag]!=null?MOD_START[tag]:MOD_DEFAULT;
const researchStatus=c=>c.civ?1:.5+.5*(c.modern||0)/100,costStatus=c=>c.civ?1:1.3-.3*(c.modern||0)/100;
const modHas=(c,id)=>!!(c.modRef&&c.modRef.includes(id));
/* A6 reform effects: one multiplier per effect, the same rule for every nation (A6 tuning knobs) */
const MOD_INF=.1,MOD_ART_PEN=.75,MOD_MOB=.2,MOD_TRADE=.1,MOD_FAC=1.5;
const modUnitX=(c,k)=>k==="inf"?(modHas(c,"a1")?1+MOD_INF:1):k==="art"?(c.civ||modHas(c,"a2")?1:MOD_ART_PEN):1;
const modMobX=c=>modHas(c,"a3")?1+MOD_MOB:1,modTradeX=c=>modHas(c,"e1")?1+MOD_TRADE:1,modFacX=c=>c.civ?1:MOD_FAC;
function modBump(c,list,amt,undo){const rec=[];for(const p of provsOf(c.tag))for(const q of p.pops)for(const[t,a]of list)if(q.t===t){const v=clamp(q.mil+a*amt,0,10);rec.push([q,q.mil]);q.mil=v;}return rec;}
function modEffect(c,id){if(id==="d2"){c.gwx=c.gwx||{};c.gwx.tax=(c.gwx.tax||0)+.1;}if(id==="d3")c.pres=(c.pres||0)+2;}
/* can c take reform id now? Every check before any change. */
function modCan(c,id){const r=MOD_BY[id];if(!r)return{ok:false,why:"Unknown reform."};if(c.civ)return{ok:false,why:"We are already a modern state."};
 if(modHas(c,id))return{ok:false,why:"Already enacted."};if((c.modLast!=null)&&G.t-c.modLast<MOD_GAP)return{ok:false,why:"One reform every "+MOD_GAP+" months; next in "+(MOD_GAP-(G.t-c.modLast))+"."};
 if(c.rp<r.cost)return{ok:false,why:"Needs "+r.cost+" research points; we hold "+Math.floor(c.rp)+"."};return{ok:true};}
function modReformOrder(c,id){const k=modCan(c,id);if(!k.ok)return k;const r=MOD_BY[id];c.rp-=r.cost;c.modRef=(c.modRef||[]).concat(id);c.modern=Math.min(100,(c.modern||0)+r.pr);c.modLast=G.t;
 for(const[t,a]of r.res)modBump(c,[[t,a]],1);modEffect(c,id);const txt=c.n+" enacts: "+r.n+" (modernisation "+Math.round(c.modern)+"%).";
 if(c.tag===G.player)msg("politics",txt);else if(G.log)G.log.unshift({t:G.t,txt});return{ok:true,txt:r.n+"."};}
/* ---- the evaluator: one function for the card's table, the minister's pick and the AI. Horizon 5 years. ---- */
function modPower(c){let best=null,bd=1e9;for(const t of G.gp||[]){const g=G.c[t];if(!g||!g.alive||t===c.tag||!g.civ)continue;const a=P(c.cap),b=P(g.cap),d=Math.hypot(a.x-b.x,a.y-b.y);if(d<bd){bd=d;best=t;}}return best;}
/* chance a colonial power wins a war against c if modernised to level m: warEV's own ratio, with our side scaled by modernisation */
function modAttackP(c,m){const pw=modPower(c);if(!pw)return 0;const ours=(backing(c.tag,pw)+1)*(1+m/100*.6),theirs=backing(pw,c.tag)+1,r=ours/theirs;return 1/(1+r*r);}
function modRevolt24(c){const mv=movements(c),need=Math.max(80,(c.stat.pop||0)*.004);if(!mv.length||mv[0].n<need)return 0;const pq=.08+Math.min(.3,mv[0].n/need*.05);return 1-Math.pow(1-pq,8);}
function modRevoltIf(c,id){const rec=[];for(const[t,a]of MOD_BY[id].res)rec.push(...modBump(c,[[t,a]],1));const p=modRevolt24(c);for(let i=rec.length-1;i>=0;i--)rec[i][0].mil=rec[i][1];return p;}
function modEval(c,id){const r=MOD_BY[id],m=c.modern||0,m2=Math.min(100,m+r.pr),rp0=rpOf(c);
 const dRes=rp0*(researchStatus({modern:m2})/researchStatus({modern:m})-1)*60+(m2-m)*.3/100*rp0*60*0;
 const dTax=id==="d2"?(c.stat.inc||0)*.1*60:0,dDef=modAttackP(c,m)-modAttackP(c,m2),p0=modRevolt24(c),p1=modRevoltIf(c,id);
 const score=dRes/100+dTax/(c.stat.inc||1)/12+dDef*30-(p1-p0)*20-r.cost/100+r.pr/10;
 return{id,dRes,dTax,dDef,p0,p1,score};}
function modPlan(c){const L=MOD_REFORMS.filter(r=>!modHas(c,r.id)).map(r=>modEval(c,r.id));L.sort((a,b)=>b.score-a.score||(a.id<b.id?-1:1));return L;}
/* payoff rows for a card: reform now, wait, and the best reform of another track; plus the minister's pick */
function modTable(c,id){const e=modEval(c,id),r=MOD_BY[id],alt=modPlan(c).find(x=>MOD_BY[x.id].tr!==r.tr),m=c.modern||0,pw=modPower(c);
 const row=(l,x)=>x?{l,res:Math.round(x.dRes),tax:Math.round(x.dTax),atk:Math.round(modAttackP(c,m+MOD_BY[x.id].pr)*100),rev:Math.round(x.p1*100)}:{l,res:0,tax:0,atk:Math.round(modAttackP(c,m)*100),rev:Math.round(modRevolt24(c)*100)};
 const best=modPlan(c)[0];return{rows:[row("Reform",e),row("Wait",null),row("Other track",alt)],pw,pick:best?best.id:null,assume:"Assumes the nearest Great Power ("+(pw||"none")+") keeps its present strength and no war breaks out."};}
/* ---- westernising: at 100%, or 80% with 25% literacy ---- */
const modWestOk=c=>!c.civ&&!(c.tag==="JAP"&&c.hold>G.t)&&((c.modern||0)>=100||((c.modern||0)>=MOD_WEST_ALT&&(c.stat.lit||c.lit||0)>=MOD_WEST_LIT));
function modWestDo(tag){const c=G.c[tag];if(!c||!c.alive||c.civ)return false;c.civ=1;c.civT=G.t;c.modern=100;shiftMil(c,"REA",3,"LIB",-1);c.pres+=10;msg("politics",c.n+" proclaims modernisation: it is now counted among the civilised nations.");return true;}
function modMonth(){for(const tag in G.c){const c=G.c[tag];if(!c.alive||c.civ)continue;
  if(modWestOk(c)&&(c.westWait||0)<=G.t){if(humanSeat(tag)){c.westWait=G.t+12;cardOpen({kind:"dec",ctx:{a:"westernise",t:tag},title:"Proclaim the modern state?",txt:"Our reforms are complete. Proclaim civilised status now (+10 prestige, the reactionaries rise), or wait."+((c.modRev||0)?" Revolts against us so far: "+c.modRev+".":""),def:"yes",opts:[{k:"yes",label:"Proclaim it now",txt:"Civilised status, +10 prestige; the reactionaries rise."},{k:"no",label:"Wait",txt:"Keep the current rules. We may ask again in a year."}]});}else modWestDo(tag);continue;}
  if(!c.ai||(c.modLast!=null&&G.t-c.modLast<MOD_GAP))continue;const L=modPlan(c).filter(x=>modCan(c,x.id).ok);if(!L.length)continue;
  if(modRoll(tag)<modInclOf(c)*(L[0].score>0?1:.4))execCommand(tag,{kind:"reform",reform:L[0].id},{auto:true});}}
