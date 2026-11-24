"use strict";
/* ================= THE POWERS ================= */
/* industry is the value of what the mills make, at base prices (not how many mills stand) */
const IND_K=300;
function powerScore(c){const ind=sum(provsOf(c.tag),p=>sum(p.factories,f=>f._out==null?f.lv*550:f._out*GOODS[f.g].p))/IND_K,mil=sum(G.armies.filter(a=>a.o===c.tag&&!a.reb),a=>strength(a))/6;c.score={pres:Math.round(c.pres),ind:Math.round(ind),mil:Math.round(mil)};return c.pres+ind+mil;}
function rankPowers(){const L=Object.values(G.c).filter(c=>c.alive).map(c=>{powerScore(c);const s=c.score;return[c.tag,s.pres+s.ind*.2+s.mil*.2];}).sort((a,b)=>b[1]-a[1]);G.rank=L.map(x=>x[0]);G.gp=G.rank.filter(t=>G.c[t].civ).slice(0,8);G.sec=G.rank.filter(t=>G.c[t].civ&&!G.gp.includes(t)).slice(0,8);}
const isGP=tag=>G.gp&&G.gp.includes(tag);
/* ================= WAR ================= */
function nextWarId(){
 if(G.nextWarId==null)G.nextWarId=G.wars.reduce((next,w)=>Math.max(next,(Number(w.id.slice(1))||0)+1),100);
 return "w"+G.nextWarId++;
}
function warScore(win,lose,amt){if(win==="REB"||lose==="REB")return;for(const w of G.wars){const sw=w.att.includes(win)?1:w.def.includes(win)?2:0,sl=w.att.includes(lose)?1:w.def.includes(lose)?2:0;if(!sw||!sl||sw===sl)continue;w.ws=clamp(w.ws+(sw===1?amt:-amt),-100,100);}}
function joinWar(w,tag,side){const c=G.c[tag];if(!c||!c.alive||c.war.includes(w.id))return;(side===1?w.att:w.def).push(tag);c.war.push(w.id);}
function declareWar(att,def,goal){const A=G.c[att],D=G.c[def];if(!A||!D||A.war.some(x=>D.war.includes(x)))return null;if((A.truce[def]||0)>G.t)return null;
 if(!goal.hist&&!goal.cong&&goal.k!=="contain"&&crisisWorthy(A,D)&&rng()<CONG_P){const h=crisisOpen(A,D,goal);if(h)return h.w||null;}
 const w={id:nextWarId(),att:[],def:[],goal,ws:0,start:G.t};G.wars.push(w);joinWar(w,att,1);joinWar(w,def,2);
 if(!goal.managed){for(const t of D.ally)if(G.c[t]&&G.c[t].alive&&!(G.c[t].truce[att]>G.t)&&rng()<.85&&t!==att)joinWar(w,t,2);if(D.sphere&&G.c[D.sphere]&&D.sphere!==att)joinWar(w,D.sphere,2);
 for(const t of A.ally)if(G.c[t]&&G.c[t].alive&&!w.def.includes(t)&&A.rel[t]>40&&rng()<.6)joinWar(w,t,1);
 coalJoin(w,att,def,goal);}if(!goal.hist){A.guar=(A.guar||[]).filter(x=>x!==def);for(const g of guarantors(def)){const m=G.c[g];if(g===att||w.att.includes(g)||w.def.includes(g)||(m.truce[att]||0)>G.t)continue;if(rng()<.85)joinWar(w,g,2);else{m.rel[def]=(m.rel[def]||0)-30;m.pres=Math.max(0,m.pres-2);}}}const di=goal.hist?0:declInf(goal)*(goal.prov&&kinOf(A,P(goal.prov))?.6:1);A.infamy+=di;A.rel[def]=D.rel[att]=Math.min(A.rel[def],-80);for(const t in G.c)if(t!==att&&G.c[t].rel)G.c[t].rel[att]=(G.c[t].rel[att]||0)-di;
 const txt=A.n+" declares war on "+D.n+" ("+WARGOALS[goal.k].n.toLowerCase()+(goal.prov?": "+P(goal.prov).n:"")+").";msg("war",txt);G.log.unshift({t:G.t,txt});return w;}
function endWar(w,winner){if(!G.wars.includes(w))return;const A=G.c[w.att[0]],D=G.c[w.def[0]],g=w.goal;
 if(winner==="att"&&A&&D&&A.alive){const target=G.c[g.tag]||D;
  if((g.k==="conquer"||g.k==="colony")&&g.prov&&P(g.prov).o&&w.def.includes(P(g.prov).o))takeProv(P(g.prov),A.tag,w);
  else if(g.k==="puppet"&&target.alive){target.overlord=A.tag;target.sphere=A.tag;if(!g.hist)A.infamy+=conqInf(A,target,1,.6);}
  else if(g.k==="contain")containWin(A,target,w);
  else if(g.k==="humble"){A.pres+=8;target.pres=Math.max(0,target.pres-8);const pay=Math.min(target.tr,(target.stat.inc||0)*6);target.tr-=pay;A.tr+=pay;}
  else if(g.k==="free"&&g.cul){const d=DORMANT.find(x=>x[5]===g.cul);if(d){for(const p of provsOf(target.tag)){const sh=p.pops.filter(q=>q.c===g.cul).reduce((s,q)=>s+q.n,0)/Math.max(1,p.pop);if(sh>.4)p._free=1;}rebelWin(target,"N:"+g.cul);}}
  A.pres+=5;if(target)target.pres=Math.max(0,target.pres-5);}else if(winner==="def"&&A&&D){D.pres+=5;A.pres=Math.max(0,A.pres-5);}
 const all=w.att.concat(w.def);for(const p of G.plist)if(p.ctl&&p.ctl!==p.o&&all.includes(p.ctl)&&all.includes(p.o))p.ctl=p.o;
 for(const t of all){const c=G.c[t];if(!c)continue;c.war=c.war.filter(x=>x!==w.id);for(const u of(w.att.includes(t)?w.def:w.att))c.truce[u]=G.t+60;}
 G.wars=G.wars.filter(x=>x!==w);const txt=(A?A.n:"?")+" and "+(D?D.n:"?")+" make peace"+(winner==="att"?": "+(A?A.n:"")+" wins.":winner==="def"?": "+(D?D.n:"")+" holds.":", status quo.");msg("diplomacy",txt);G.log.unshift({t:G.t,txt});}
function peaceMonth(){for(const w of G.wars.slice()){const A=G.c[w.att[0]],D=G.c[w.def[0]];if(!A||!D||!A.alive||!D.alive){endWar(w,A&&A.alive?"att":"def");continue;}
  const need=WARGOALS[w.goal.k].ws,age=G.t-w.start,pl=humanSeat(w.att[0])||humanSeat(w.def[0]); /* A3: a human principal makes peace by hand; the AI makes it by rule */
  if(w.goal.prov&&P(w.goal.prov).ctl===A.tag&&P(w.goal.prov).o!==A.tag)w.ws=Math.min(100,w.ws+.8);
  if(w.july&&age<18)continue;
  if(age>=18&&Math.abs(w.ws)<20&&A.we>=70&&D.we>=70){
   if(w.lastStalemateMonth!==G.t){
    w.stalemate=(w.stalemate||0)+1;
    w.lastStalemateMonth=G.t;
   }
   if(w.stalemate>=6){endWar(w,"white");continue;}
  }else w.stalemate=0;
  if(pl)continue;if(w.ws>=need)aiPeace(w,1,w.ws-need);else if(w.ws<=-Math.max(25,need*.6)||(age>36&&w.ws<-10))aiPeace(w,2,-w.ws-Math.max(25,need*.6));else if(age>60&&Math.abs(w.ws)<20)endWar(w,"white");}}
function peaceOffer(w,kind){const need=WARGOALS[w.goal.k].ws,me=G.player,side=w.att.includes(me)?1:2;
 if(kind==="enforce"&&side===1){if(w.ws>=need){endWar(w,"att");return{ok:true,txt:"They accept our terms."};}return{ok:false,txt:"They refuse: we need war score "+need+", we have "+Math.round(w.ws)+"."};}
 if(kind==="deal"){const keys=arguments[2]||[],v=dealVerdict(w,side,keys);if(!v.ok)return{ok:false,txt:v.why};const did=applyDeal(w,side,keys);return{ok:true,txt:"Peace is signed"+(did.length?": "+did.join(", "):"")+"."};}
 if(kind==="white"){const s=side===1?w.ws:-w.ws;if(s>-10||G.t-w.start>24){endWar(w,"white");return{ok:true,txt:"Peace is made on the old borders."};}return{ok:false,txt:"They think they are winning."};}
 if(kind==="concede"){endWar(w,side===1?"def":"att");return{ok:true,txt:"We concede."};}return{ok:false,txt:"?"};}
/* ================= INFAMY AND COALITIONS ================= */
/* A state that grabs land piles up infamy. Past COAL_AT its neighbours and the Great Powers band together against it; the band breaks up when infamy falls under COAL_OFF. Wars written into history (unification, the Civil War) cost no infamy and meet no coalition. */
const COAL_AT=25,COAL_OFF=15;
const declInf=goal=>WARGOALS[goal.k].inf*.4*(goal.fab?1.5:1);
/* land of our own people (a core, or where most people are of a culture we accept) is taken back, not conquered: it costs well under half */
function kinOf(A,p){if(!p||!A)return false;if(p.core.includes(A.tag))return true;const cs={};let m=null;for(const q of p.pops){cs[q.c]=(cs[q.c]||0)+q.n;if(!m||cs[q.c]>cs[m])m=q.c;}return m!=null&&(m===A.cul||(A.acc||[]).includes(m)||(A.formed&&(UNIFY_OF[A.tag]||[]).includes(m)));}
function conqInf(A,O,share,k,p){return(1.5+14*Math.min(1,share))*(O&&O.civ?1:.7)*(k==null?1:k)*(kinOf(A,p)?.4:1);}
/* what a war of this kind would cost us in infamy, all told */
function estInf(c,cb){const O=G.c[cb.t],g={k:cb.k,fab:cb.why==="A fabricated claim"};let x=declInf(g)*(cb.prov&&kinOf(c,P(cb.prov))?.6:1);if(!O)return x;
 if((cb.k==="conquer"||cb.k==="colony")&&cb.prov)x+=conqInf(c,O,P(cb.prov).pop/Math.max(1,popOf(cb.t)),cb.k==="colony"?.4:1,P(cb.prov));else if(cb.k==="annex")x+=conqInf(c,O,1,O.civ?2.2:1);else if(cb.k==="puppet")x+=conqInf(c,O,1,.6);return x;}
function noteGain(A,id,from){A.gains=A.gains||[];A.gains.push({id,from,t:G.t});if(A.gains.length>14)A.gains.shift();}
function takeProv(p,tag,w){const old=p.o,O=G.c[old],A=G.c[tag],share=p.pop/Math.max(1,O?popOf(old):1),kin=kinOf(A,p);if(O)O.lostLand=G.t;transferProv(p,tag);
 if(!A||!O||old===tag||(w&&(w.civil||(w.goal&&w.goal.hist))))return;A.infamy+=conqInf(A,O,share,(w&&w.goal&&w.goal.k==="colony"?.4:1)*(kin?.4:1));noteGain(A,p.id,old);}
/* a state brought back to life (or handed back its lands) when a coalition wins */
function restoreNation(tag,ids){const nc=G.c[tag];if(!nc||!ids.length)return false;if(!nc.alive){nc.alive=true;nc.war=[];nc.truce={};nc.ally=[];nc.sphere=null;nc.overlord=null;nc.infamy=0;nc.we=0;nc.fab=[];nc.pres=Math.max(nc.pres,8);nc.gains=[];}
 for(const id of ids)transferProv(P(id),tag);const mine=provsOf(tag);if(!mine.length){nc.alive=false;return false;}if(!mine.some(p=>p.id===nc.cap))nc.cap=mine[0].id;nc.tr=Math.max(nc.tr,3000);
 if(!G.armies.some(a=>a.o===tag&&!a.naval))G.armies.push(mkArmy(tag,nc.cap,{inf:3+mine.length}));for(const t in G.c){if(t===tag)continue;nc.rel[t]=nc.rel[t]||0;G.c[t].rel[tag]=G.c[t].rel[tag]||0;}msg("diplomacy",nc.n+" is restored to independence.");return true;}
function containWin(A,T,w){const back=(T.gains||[]).filter(x=>G.t-x.t<180&&P(x.id).o===T.tag),dead={};let n=0;
 for(const x of back){const o=G.c[x.from];if(o&&o.alive&&x.from!==T.tag){transferProv(P(x.id),x.from);n++;}else if(o&&x.from!==T.tag)(dead[x.from]=dead[x.from]||[]).push(x.id);}
 for(const t in dead)if(restoreNation(t,dead[t]))n+=dead[t].length;T.gains=(T.gains||[]).filter(x=>P(x.id).o===T.tag);T.infamy=Math.max(0,T.infamy*.5-5);G.contained=(G.contained||0)+1;
 const txt=T.n+" is forced to give up "+(n?n+" recent conquest"+(n>1?"s":""):"its ambitions")+"; its infamy falls.";msg("diplomacy",txt);G.log.unshift({t:G.t,txt});}
function inCoal(t,vs){const co=G.coal&&G.coal[vs];return!!co&&co.mem.includes(t);}
function coalJoin(w,att,def,goal){if(goal.hist)return;const A=G.c[att],cs=G.coal||{};
 if(cs[att])for(const t of cs[att].mem){const m=G.c[t];if(!m||!m.alive||t===def||w.att.includes(t)||w.def.includes(t)||m.war.length>=2||(m.truce[att]||0)>G.t)continue;if(rng()<.8)pullIn(w,t,2);}
 if(goal.k==="contain"&&cs[def])for(const t of cs[def].mem){const m=G.c[t];if(!m||!m.alive||w.att.includes(t)||w.def.includes(t)||m.war.length>=2||(m.truce[def]||0)>G.t)continue;if(rng()<.7)pullIn(w,t,1);}}
function coalMembers(T){const out=new Set();for(const p of provsOf(T.tag))for(const q of ADJ[p.id]){const o=P(q).o;if(o&&o!==T.tag)out.add(o);}for(const g of G.gp||[])out.add(g);
 return[...out].filter(t=>{const m=G.c[t];return m&&m.alive&&t!==T.tag&&(m.civ||isGP(t))&&!T.ally.includes(t)&&m.sphere!==T.tag&&m.overlord!==T.tag&&T.sphere!==t&&T.overlord!==t&&(m.rel[T.tag]||0)<50;});}
function coalMonth(){G.coal=G.coal||{};
 for(const tag in G.c){const T=G.c[tag],co=G.coal[tag];if(!T.alive){if(co)delete G.coal[tag];continue;}
  if(co){if(T.infamy<COAL_OFF){delete G.coal[tag];const txt="The coalition against "+T.n+" breaks up.";msg("diplomacy",txt);G.log.unshift({t:G.t,txt});continue;}
   if(G.t%12===0)co.mem=coalMembers(T);co.mem=co.mem.filter(t=>G.c[t]&&G.c[t].alive);if(co.mem.length<2){delete G.coal[tag];continue;}
   if(G.t%2===0&&rng()<.3)containWar(T,co);continue;}
  if(T.infamy<=COAL_AT||(UNIFY_OF[tag]&&!T.formed))continue;
  const mem=coalMembers(T);if(mem.length<2)continue;G.coal[tag]={t0:G.t,mem};G.coalN=(G.coalN||0)+1;
  for(const a of mem)for(const b of mem){if(a!==b&&G.c[a].rel)G.c[a].rel[b]=Math.min(150,(G.c[a].rel[b]||0)+10);}for(const a of mem){G.c[a].rel[tag]=(G.c[a].rel[tag]||0)-20;T.rel[a]=(T.rel[a]||0)-20;}
  const txt="A coalition forms against "+T.n+" ("+mem.slice(0,5).map(t=>G.c[t].n).join(", ")+(mem.length>5?" and others":"")+").";msg("diplomacy",txt);G.log.unshift({t:G.t,txt});}}
function containWar(T,co){let best=null,bv=1.15;for(const t of co.mem){const m=G.c[t];if(!m.ai||!m.alive||m.war.length||(m.truce[T.tag]||0)>G.t||atWarWith(m,T)||!reachable(t,T.cap))continue;
  let ours=sideStrength(t,T.tag);for(const u of co.mem)if(u!==t&&G.c[u].war.length<2)ours+=sum(G.armies.filter(a=>a.o===u&&!a.naval&&!a.reb),strength)*.5;const r=ours/(sideStrength(T.tag,t)+1);if(r>bv){bv=r;best=t;}}
 if(best){const g=(T.gains||[]).filter(x=>P(x.id).o===T.tag).pop();if(declareWar(best,T.tag,{k:"contain",tag:T.tag,prov:g?g.id:null}))G.containWars=(G.containWars||0)+1;}}
/* ================= GUARANTEES AND THE BALANCE OF POWER ================= */
/* A guarantee is a promise to fight for a state that is attacked. Great Powers give them where a rival's gain from swallowing the state outweighs the cost of the war they might have to fight. */
const guarantors=t=>{const out=[];for(const g in G.c){const c=G.c[g];if(c.alive&&c.guar&&c.guar.includes(t))out.push(g);}return out;};
const maxGuar=c=>isGP(c.tag)?(c.pres>=75?3:2):1; /* a few promises each: one that is kept is worth more than ten that are not */
function guaranteeCan(c,t){const m=G.c[t];if(!m||!m.alive||t===c.tag)return{ok:false,why:"No such state."};if((c.guar||[]).includes(t))return{ok:false,why:"Already guaranteed."};
 if(isGP(t))return{ok:false,why:"A Great Power needs no guarantee."};if(m.overlord===c.tag||m.sphere&&m.sphere!==c.tag)return{ok:false,why:m.sphere&&m.sphere!==c.tag?"It is in another sphere.":"It is already ours."};
 if((m.rel[c.tag]||0)<-20)return{ok:false,why:m.n+" does not trust us."};if(c.war.length)return{ok:false,why:"Not while we are at war."};if((c.guar||[]).length>=maxGuar(c))return{ok:false,why:"We can stand behind only "+maxGuar(c)+" state"+(maxGuar(c)>1?"s":"")+"."};return{ok:true};}
function guarantee(c,t){const r=guaranteeCan(c,t);if(!r.ok)return{ok:false,txt:r.why};c.guar=c.guar||[];c.guar.push(t);const m=G.c[t];m.rel[c.tag]=Math.min(150,(m.rel[c.tag]||0)+15);for(const x of G.gp||[])if(x!==c.tag&&x!==t&&G.c[x].rel&&G.c[x].rel[t]<-10)G.c[x].rel[c.tag]=(G.c[x].rel[c.tag]||0)-5;
 const txt=c.n+" guarantees the independence of "+m.n+".";msg("diplomacy",txt);G.log.unshift({t:G.t,txt});return{ok:true,txt};}
function revokeGuar(c,t,quiet){c.guar=(c.guar||[]).filter(x=>x!==t);const m=G.c[t];if(m&&m.rel){m.rel[c.tag]=(m.rel[c.tag]||0)-(quiet?5:20);}if(!quiet&&m)msg("diplomacy",c.n+" withdraws its guarantee of "+m.n+".");}
const armyStr=t=>sum(G.armies.filter(a=>a.o===t&&!a.naval&&!a.reb),strength);
/* everyone who would stand with a state against another: allies, sphere master, guarantors, and any coalition against the attacker */
function backing(tag,vs){const c=G.c[tag];let s=sideStrength(tag,vs);const seen=new Set([tag,vs,...c.ally]);if(c.sphere)seen.add(c.sphere);
 for(const g of guarantors(tag)){if(seen.has(g)||!G.c[g].alive)continue;seen.add(g);s+=armyStr(g)*.6;}const co=G.coal&&G.coal[vs];if(co)for(const m of co.mem){if(seen.has(m)||!G.c[m].alive)continue;seen.add(m);s+=armyStr(m)*.5;}return s;}
/* expected value of a war: chance of winning x what we gain, less what a defeat costs, the cost of fighting and the infamy */
function warEV(c,cb){const ours=backing(c.tag,cb.t),theirs=(backing(cb.t,c.tag)+1)*(G.c[cb.t].civ?1:1+(G.c[cb.t].modern||0)/100*.6),kin=cb.why==="Our core"||cb.why==="Our people"||(UNIFY_OF[c.tag]||[]).includes(P(cb.prov||G.c[cb.t].cap).c);
 const r=ours/theirs*(kin?1.7:1),p=r*r/(1+r*r),O=G.c[cb.t],pp=cb.prov?P(cb.prov).pop:0;
 let gain=cb.k==="annex"?popOf(cb.t)/400+8:cb.k==="puppet"?popOf(cb.t)/500+6:cb.k==="colony"?pp/500+3:cb.k==="conquer"?pp/400+4:cb.k==="free"?5:6;if(kin)gain*=1.5;
 const inf=estInf(c,cb),cross=c.infamy+inf>COAL_AT?9:0,ev=p*gain-(1-p)*(10+ours/100)-theirs/150-inf*.5-cross;return{ev,p,r,gain,ours,theirs};}
function guarEV(c,m,R){const near=provsOf(R.tag).some(p=>ADJ[p.id].some(q=>P(q).o===m.tag)),sc=(m.score?m.score.pres+m.score.ind*.2+m.score.mil*.2:15)+popOf(m.tag)/1500,gain=sc*(near?1:.5),pa=(near?.12:.04)+((R.rel[m.tag]||0)<-20?.12:0),cost=5+backing(R.tag,c.tag)/12;return gain-cost*pa;}
/* what a promise to one state is worth to its giver: the weight of the state, more where it sits next to us and where few others already stand behind it */
function guarWorth(c,t){const m=G.c[t];if(!m||!m.alive)return -1;const near=provsOf(c.tag).some(p=>ADJ[p.id].some(q=>P(q).o===t));return(m.score?m.score.pres+m.score.ind*.2+m.score.mil*.2:15)+popOf(t)/1500+(near?20:0)+Math.min(20,Math.max(0,(m.rel[c.tag]||0))/5)-15*guarantors(t).filter(x=>x!==c.tag).length;}
function aiGuarantees(){if(G.t%12===3)for(const t in G.c){const c=G.c[t];if(c.alive&&c.ai&&!isGP(t)&&(c.guar||[]).length)for(const x of c.guar.slice())revokeGuar(c,x,true);} /* a state that has fallen out of the first rank can no longer back its promises */
for(const g of G.gp||[]){const c=G.c[g];if(!c||!c.alive||!c.ai||c.war.length)continue;
  if(G.t%12===3)for(const t of(c.guar||[]).slice()){const m=G.c[t];if(!m||!m.alive||(m.rel[g]||0)<-60||(m.sphere&&m.sphere!==g)||isGP(t))revokeGuar(c,t,true);
   {let L=(c.guar||[]).slice().sort((a,b)=>guarWorth(c,b)-guarWorth(c,a));for(const t of L.slice(maxGuar(c)))revokeGuar(c,t,true);for(const t of(c.guar||[]).slice())if(guarantors(t).length>2&&guarWorth(c,t)<guarWorth(G.c[guarantors(t).filter(x=>x!==g)[0]],t))revokeGuar(c,t,true);}}
  if((c.guar||[]).length>=maxGuar(c)||rng()>.5)continue;const rivals=(G.gp||[]).filter(x=>x!==g&&G.c[x].alive&&(c.rel[x]||0)<25&&!c.ally.includes(x));if(!rivals.length)continue;let best=null,bv=3;
  for(const t in G.c){const m=G.c[t];if(!m.alive||isGP(t)||!m.civ||!guaranteeCan(c,t).ok||dist2(c.cap,m.cap)>700||guarantors(t).length>=2)continue;for(const x of rivals){const R=G.c[x];if(R.sphere===g||m.overlord===x)continue;
    if(sideStrength(g,x)<sideStrength(x,g)*.6)continue;const v=guarEV(c,m,R);if(v>bv){bv=v;best=t;}}}
  if(best)guarantee(c,best);}}
const EV_MARGIN=5;
/* ================= PEACE DEALS ================= */
/* Every term has a price in war score. The winner may spend what it has; the loser agrees when the price is within what its losses, tiredness and the length of the war make it swallow. */
const REPS_SHARE=.25,REPS_YEARS=5;
const goalName=w=>WARGOALS[w.goal.k].n.toLowerCase()+(w.goal.prov?": "+P(w.goal.prov).n:"");
function releaseOptions(them){const out=[];for(const t of them){const L=G.c[t];if(!L||!L.alive)continue;const tot=Math.max(1,popOf(t)),cs={};for(const p of provsOf(t))for(const q of p.pops)if(q.c!==L.cul&&!(L.acc||[]).includes(q.c))cs[q.c]=1;
  for(const cul in cs){const d=DORMANT.find(x=>x[5]===cul&&!x[6]);if(!d||(G.c[d[0]]&&G.c[d[0]].alive))continue;let pop=0,n=0;for(const p of provsOf(t)){const sh=p.pops.filter(q=>q.c===cul).reduce((a,q)=>a+q.n,0)/Math.max(1,p.pop);if(sh>.4){pop+=p.pop;n++;}}if(n)out.push({from:t,cul,name:d[1],pop,n,share:pop/tot});}}
 return out;}
function dealMenu(w,side){const me=side===1?w.att:w.def,them=side===1?w.def:w.att,out=[];
 if(side===1)out.push({key:"goal",k:"goal",cost:WARGOALS[w.goal.k].ws,n:"The war goal: "+goalName(w)});
 const occ=G.plist.filter(p=>p.o&&them.includes(p.o)&&me.includes(p.ctl)&&!(side===1&&w.goal.prov===p.id&&(w.goal.k==="conquer"||w.goal.k==="colony"))).sort((a,b)=>b.pop-a.pop);
 for(const p of occ)out.push({key:"prov"+p.id,k:"prov",id:p.id,cost:Math.round(15+p.pop/Math.max(1,popOf(p.o))*60),n:"Take "+p.n});
 for(const r of releaseOptions(them))out.push({key:"rel"+r.cul,k:"release",cul:r.cul,from:r.from,cost:Math.round(25+r.share*30),n:"Release "+r.name});
 out.push({key:"reps",k:"reps",cost:18,n:"Reparations: a quarter of their income for "+REPS_YEARS+" years"});
 out.push({key:"hum",k:"hum",cost:12,n:"Humiliate them: prestige changes hands"});
 if(them.some(t=>Object.values(G.c).some(m=>m.alive&&m.sphere===t&&m.tag!==t)))out.push({key:"sphere",k:"sphere",cost:20,n:"End their sphere: the states they lead go free"});
 return out;}
function dealVerdict(w,side,keys){const items=dealMenu(w,side).filter(i=>keys.includes(i.key)),cost=sum(items,i=>i.cost),sc=side===1?w.ws:-w.ws,foe=G.c[(side===1?w.def:w.att)[0]],lim=Math.max(0,sc)*.7+((foe&&foe.we)||0)*.4+Math.min(15,(G.t-w.start)/4);
 const r={cost,sc,lim,n:items.length};if(!items.length)return Object.assign(r,{ok:false,why:"Choose at least one term."});
 if(cost>sc)return Object.assign(r,{ok:false,why:"We have "+Math.round(Math.max(0,sc))+" war score; these terms cost "+cost+"."});
 if(cost>lim)return Object.assign(r,{ok:false,why:(foe?foe.n:"They")+" will not accept more than about "+Math.round(lim)+" in terms."});return Object.assign(r,{ok:true,why:(foe?foe.n:"They")+" would accept."});}
function applyDeal(w,side,keys){const items=dealMenu(w,side).filter(i=>keys.includes(i.key)),win=(side===1?w.att:w.def)[0],lose=(side===1?w.def:w.att)[0],Wn=G.c[win],L=G.c[lose],them=side===1?w.def:w.att,did=[];
 for(const it of items){if(it.k==="prov"){const p=P(it.id);if(p.o&&p.o!==win){takeProv(p,win,w);did.push(p.n+" taken");}}
  else if(it.k==="release"){const F=G.c[it.from];if(F&&F.alive){rebelWin(F,"N:"+it.cul);const d=DORMANT.find(x=>x[5]===it.cul&&!x[6]),nc=d&&G.c[d[0]];if(nc&&nc.alive){nc.rel[win]=(nc.rel[win]||0)+40;Wn.rel[nc.tag]=(Wn.rel[nc.tag]||0)+40;did.push(nc.n+" freed");}}}
  else if(it.k==="reps"){L.owes=(L.owes||[]).concat([{to:win,share:REPS_SHARE,until:G.t+REPS_YEARS*12}]);did.push("reparations");}
  else if(it.k==="hum"){Wn.pres+=8;L.pres=Math.max(0,L.pres-8);did.push("humiliation");}
  else if(it.k==="sphere"){for(const m of Object.values(G.c))if(m.alive&&them.includes(m.sphere)){m.sphere=null;m.overlord=null;}did.push("sphere ended");}}
 G.dealsN=(G.dealsN||0)+1;const goal=items.some(i=>i.k==="goal");endWar(w,side===1?(goal?"att":"white"):"def");return did;}
/* a winning AI spends what is left of its war score on extra terms, the way a player would */
function aiPeace(w,side,left){const keys=side===1?["goal"]:[];if(!w.goal.hist&&left>=12&&rng()<.7){const menu=dealMenu(w,side).filter(i=>i.k!=="goal"),pick=[];let b=left*.9;
  for(const k of["prov","reps","hum","sphere","release"])for(const i of menu.filter(x=>x.k===k)){if(k==="release"&&side===1)continue;if(i.cost<=b&&(k!=="prov"||rng()<.6)){b-=i.cost;pick.push(i.key);if(k!=="prov")break;}}keys.push(...pick);}
 if(!keys.length)return endWar(w,side===1?"att":"def");applyDeal(w,side,keys);}
function owesMonth(){
 for(const subject of Object.values(G.c)){
  const agreement=subject.subjectAgreement;
  if(!agreement||!subject.alive||agreement.until<=G.t||subject.overlord!==agreement.ruler)continue;
  const ruler=G.c[agreement.ruler];
  if(!ruler?.alive)continue;
  const amount=Math.min(Math.max(0,ruler.tr),(ruler.stat.inc||0)*agreement.share);
  ruler.tr-=amount;
  subject.tr+=amount;
 }
 for(const t in G.c){const c=G.c[t];if(!c.alive||!c.owes||!c.owes.length)continue;c.owes=c.owes.filter(o=>o.until>G.t&&G.c[o.to]&&G.c[o.to].alive);for(const o of c.owes){const pay=Math.min(Math.max(0,c.tr),(c.stat.inc||0)*o.share);c.tr-=pay;G.c[o.to].tr+=pay;}}}
/* causes for war */
function cbsOf(c){const out=[],seen=new Set(),add=(t,k,prov,why,cul)=>{const key=t+k+prov;if(seen.has(key)||t===c.tag||!G.c[t]||!G.c[t].alive)return;seen.add(key);out.push({t,k,prov,why,cul});};
 for(const p of G.plist){if(!p.o||p.o===c.tag)continue;if(p.core.includes(c.tag))add(p.o,"conquer",p.id,"Our core");else if(((p.c===c.cul||(c.formed&&p.c===DORMANT.find(d=>d[0]===c.formed)[5]))&&G.c[p.o].cul!==p.c)||(UNIFY_OF[c.tag]||[]).includes(p.c))add(p.o,"conquer",p.id,"Our people");}
 if(c.civ){const mine=provsOf(c.tag);for(const p of G.plist){if(!p.o||G.c[p.o].civ||p.o===c.tag)continue;const near=mine.some(m=>ADJ[m.id].includes(p.id)||(m.sea&&p.sea&&SEAADJ[m.id].some(x=>x[0]===p.id)));if(near)add(p.o,"conquer",p.id,"A civilizing mission");}}
 if(isGP(c.tag))for(const d of DORMANT){if(d[6]||(G.c[d[0]]&&G.c[d[0]].alive))continue;const p=P(d[4]);if(p.o&&p.o!==c.tag&&c.rel[p.o]<-20)add(p.o,"free",p.id,"Freedom for the "+d[2],d[5]);}
 for(const f of c.fab||[])if(f.left<=0)add(f.t,"conquer",f.prov,"A fabricated claim");
 for(const t in G.c){const o=G.c[t];if(t!==c.tag&&o.alive&&o.dflt&&o.dflt.cr.includes(c.tag)&&G.t-o.dflt.t<120)add(t,"humble",null,"Unpaid debts");}
 for(const t in G.c)if(t!==c.tag&&c.rel[t]<-100&&isGP(c.tag))add(t,"humble",null,"Old grievances");return out;}
function fabricate(c,t,prov){c.fab=c.fab||[];if(c.fab.some(f=>f.prov===prov))return{ok:false,txt:"Already in hand."};c.fab.push({t,prov,left:10});return{ok:true,txt:"Our agents begin to build a claim on "+P(prov).n+"."};}
/* ================= INFLUENCE AND ALLIANCES ================= */
function diploMonth(){if(G.t%6===0)rankPowers();
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;for(const t in c.rel){const r=c.rel[t];c.rel[t]=r*.995;}
  for(const f of c.fab||[]){f.left--;if(f.left===5&&rng()<.15){c.infamy+=2;if(G.c[f.t])G.c[f.t].rel[tag]-=30;}}c.fab=(c.fab||[]).filter(f=>f.left>-60&&G.c[f.t]&&P(f.prov).o===f.t);
  c.infamy=Math.max(0,c.infamy-.025);if(c.infamy>25)for(const g of G.gp||[])if(g!==tag)G.c[g].rel[tag]=(G.c[g].rel[tag]||0)-.4;
  if(isGP(tag))c.pres+=.02;c.pres=c.pres*.999+.01;
  if(c.overlord&&(!G.c[c.overlord]||!G.c[c.overlord].alive))c.overlord=null;}
 for(const g of G.gp||[]){const c=G.c[g];const pts=1.5+c.pres/40;if(!c.ai){c.infPts=(c.infPts||0)+pts;continue;}
  const targets=Object.values(G.c).filter(m=>m.alive&&!isGP(m.tag)&&m.tag!==g&&!m.overlord&&(!m.sphere||m.sphere===g||((m.inf||{})[m.sphere]||0)<((m.inf||{})[g]||0)+30)).map(m=>[m,(popOf(m.tag)/2000+10)/(1+dist2(c.cap,m.cap)/300)*(m.cul===c.cul||(UNIFY_OF[g]||[]).includes(m.cul)?4:1)+(m.sphere===g?5:0)]).sort((a,b)=>b[1]-a[1]).slice(0,3);
  for(const[m]of targets){m.inf=m.inf||{};m.inf[g]=(m.inf[g]||0)+pts/targets.length;if(!m.sphere&&m.inf[g]>=60&&(m.rel[g]||0)>=10){m.sphere=g;msg("diplomacy",m.n+" enters the sphere of "+c.n+".");}
   if(m.sphere&&m.sphere!==g&&m.inf[g]>(m.inf[m.sphere]||0)+40){const old=m.sphere;m.sphere=g;msg("diplomacy",m.n+" leaves the sphere of "+G.c[old].n+" for that of "+c.n+".");}m.rel[g]=Math.min(150,(m.rel[g]||0)+.3);c.rel[m.tag]=Math.min(150,(c.rel[m.tag]||0)+.3);}}
 for(const tag in G.c){const m=G.c[tag];if(m.inf)for(const k in m.inf)m.inf[k]=Math.max(0,m.inf[k]-.15);}
 if(G.t%12===0)for(const a in G.c){const A=G.c[a];if(!A.alive||!A.ai)continue;A.ally=A.ally.filter(b=>G.c[b]&&G.c[b].alive&&A.rel[b]>0);for(const b of A.ally)if(!G.c[b].ally.includes(a))G.c[b].ally.push(a);
  if(A.ally.length>=3)continue;for(const b in G.c){const B=G.c[b];if(b===a||!B.alive||A.ally.includes(b)||B.ally.length>=3||A.rel[b]<70||B.rel[a]<60)continue;A.ally.push(b);B.ally.push(a);msg("diplomacy",A.n+" and "+B.n+" sign an alliance.");break;}}
 colonizeMonth();owesMonth();coalMonth();if(G.t%6===3)aiGuarantees();peaceMonth();if(G.t%3===0)aiWarMonth();}
/* ================= COLONIES ================= */
const UNIFY_OF={PRU:["german"],SAR:["italian"]};
const EARLY_COL=["GBR","FRA","POR","NED","SPA","USA","RUS"],AFRICA=new Set(["SEN","GLD","LAG","CGO","KEN","MOG"]);
function canColonize(c,p){if(p.o||p.waste||!p.f.includes("U")||p.colz)return false;if(!c.civ||(!EARLY_COL.includes(c.tag)&&!c.tech.colonial))return false;if(AFRICA.has(p.id)&&(!c.tech.colonial||yearOf(G.t)<1875))return false;const mine=provsOf(c.tag);
 const land=mine.some(m=>ADJ[m.id].includes(p.id)),sea=p.sea&&mine.some(m=>m.sea&&SEAADJ[m.id].some(x=>x[0]===p.id));return land||(sea&&(c.tech.colonial||yearOf(G.t)<1870&&EARLY_COL.includes(c.tag)));}
function colonize(c,p){if(!canColonize(c,p))return{ok:false,txt:"We cannot reach it."};const cost=3000+p.pop*.5;if(c.tr<cost)return{ok:false,txt:"It costs "+Math.round(cost)+"."};c.tr-=cost;p.colz={tag:c.tag,left:18};return{ok:true,txt:"Settlers set out for "+p.n+"."};}
function colonizeMonth(){for(const p of G.plist){if(!p.colz)continue;if(--p.colz.left>0)continue;const tag=p.colz.tag;p.colz=null;if(p.o||!G.c[tag]||!G.c[tag].alive)continue;p.o=tag;p.ctl=tag;p.core=[];p.col=0;G.c[tag].pres+=2;
  for(const q of p.pops)q.cash=1;msg("diplomacy",G.c[tag].n+" claims "+p.n+" as a colony.");}
 if(G.t%4===0)for(const tag in G.c){const c=G.c[tag];if(!c.ai||!c.alive||c.tr<(c.stat.inc||0)*3+6000||rng()<.96)continue;const L=G.plist.filter(p=>canColonize(c,p));if(!L.length)continue;L.sort((a,b)=>b.pop-a.pop);colonize(c,L[0]);}}
/* ================= AI FOREIGN POLICY ================= */
function sideStrength(tag,vs){const c=G.c[tag];let s=sum(G.armies.filter(a=>a.o===tag&&!a.naval&&!a.reb),strength);for(const a of c.ally)if(G.c[a]&&G.c[a].alive&&a!==vs)s+=sum(G.armies.filter(x=>x.o===a&&!x.naval),strength)*.6;if(c.sphere&&c.sphere!==vs)s+=sum(G.armies.filter(x=>x.o===c.sphere&&!x.naval),strength)*.7;return s;}
function reachable(att,prov){const mine=provsOf(att);return mine.some(m=>ADJ[m.id].includes(prov))||(transports(att)>4&&P(prov).sea);}
function aiWarMonth(){for(const tag in G.c){const c=G.c[tag];if(!c.alive||!c.ai||c.war.length||c.we>10||c.infamy>COAL_AT-5||rng()>.035)continue;
  const L=cbsOf(c).filter(cb=>reachable(tag,cb.prov||G.c[cb.t].cap)&&!(c.truce[cb.t]>G.t)&&G.c[cb.t].sphere!==tag&&G.c[cb.t].overlord!==tag&&(cb.why!=="A civilizing mission"||yearOf(G.t)>=1850||provsOf(tag).some(m=>ADJ[m.id].includes(cb.prov))));let best=null,bv=EV_MARGIN;
  for(const cb of L){const e=warEV(c,cb);if(e.r<(isGP(cb.t)?1.8:1.2))continue; /* a war with a Great Power is never started without a clear edge: both sides bleed */
  let v=e.ev;if(c.infamy+estInf(c,cb)>COAL_AT&&e.r>3&&rng()<.2)v+=15;if(v>bv){bv=v;best=cb;}}
  if(best){declareWar(tag,best.t,{k:best.k,tag:best.t,prov:best.prov,cul:best.cul,fab:best.why==="A fabricated claim"});continue;}
  if(c.civ&&(c.fab||[]).length===0&&c.infamy<10&&rng()<.2){const rivals=Object.keys(c.rel).filter(t=>c.rel[t]<-40&&G.c[t].alive&&!isGP(t));for(const t of rivals){const p=provsOf(t).find(p=>provsOf(tag).some(m=>ADJ[m.id].includes(p.id)));if(p){fabricate(c,t,p.id);break;}}}}}

/* ================= CRISES AND CONGRESSES ================= */
/* When a Great Power moves against another, or against a state a Great Power guarantees or holds in its sphere, three times in ten the powers meet first. Each other Great Power backs the side it likes; the side with the weaker backing must give way a little or fight. */
const CONG_P=.3;
function crisisWorthy(A,D){return isGP(A.tag)&&!G.card&&(isGP(D.tag)||guarantors(D.tag).some(g=>g!==A.tag)||(D.sphere&&D.sphere!==A.tag&&isGP(D.sphere)));}
function crisisSides(A,D,goal){const att=[],def=[],co=G.coal&&G.coal[A.tag];let sA=backing(A.tag,D.tag),sD=backing(D.tag,A.tag)+1;
 for(const x of G.gp||[]){if(x===A.tag||x===D.tag)continue;const X=G.c[x];if(!X||!X.alive)continue;
  const inA=A.ally.includes(x)||A.sphere===x,inD=D.ally.includes(x)||D.sphere===x||guarantors(D.tag).includes(x)||(co&&co.mem.includes(x));
  const la=(X.rel[A.tag]||0)+(inA?50:0)-((X.rel[D.tag]||0)>30?10:0),ld=(X.rel[D.tag]||0)+(inD?50:0)+(guarantors(D.tag).includes(x)?30:0)+(D.sphere===x?40:0)+(co&&co.mem.includes(x)?30:0)+((X.rel[A.tag]||0)<-30?15:0)+(A.infamy>COAL_AT?20:0);
  if(la-ld>15){att.push(x);if(!inA)sA+=armyStr(x)*.6;}else if(ld-la>15){def.push(x);if(!inD)sD+=armyStr(x)*.6;}}
 const kin=goal.prov&&kinOf(A,P(goal.prov)),r=sA/sD*(kin?1.4:1),p=r*r/(1+r*r);return{att,def,sA,sD,p};}
function crisisCtx(A,D,goal){const s=crisisSides(A,D,goal),pl=humanSeat(A.tag)?1:humanSeat(D.tag)?2:0,pw=pl===1?s.p:1-s.p;
 return{att:A.tag,def:D.tag,goal:{k:goal.k,tag:goal.tag,prov:goal.prov||null,cul:goal.cul||null,fab:!!goal.fab},backA:s.att,backD:s.def,p:s.p,pl,acc:clamp(pl===1?.25+.6*s.p:.8-.6*s.p,.1,.88)};}
function crisisOpen(A,D,goal){const x=crisisCtx(A,D,goal);x.pl=humanSeat(A.tag)?1:humanSeat(D.tag)?2:0;
 if(x.pl){const nm=t=>nameOf(t),L=l=>l.length?l.map(nm).join(", "):"no one",pw=x.pl===1?x.p:1-x.p,them=nm(x.pl===1?x.def:x.att),what=goal.prov?WARGOALS[goal.k].n.toLowerCase()+": "+P(goal.prov).n:WARGOALS[goal.k].n.toLowerCase();
  const o=x.pl===1?[{k:"down",label:"Back down",txt:"No war. We lose 4 prestige and cannot press this claim for two years."},{k:"comp",label:"Propose a compromise",txt:"We ask only for payment: "+them+" pays us a share of its income for two years and loses a little face. "+Math.round(x.acc*100)+"% chance they accept; if not, war."},{k:"fight",label:"Fight",txt:"War begins. Odds of winning about "+Math.round(pw*100)+"%. Powers backing us join in most cases."}]
   :[{k:"down",label:"Give way",txt:"No war. "+(goal.prov?"We hand over "+P(goal.prov).n+".":"We pay a share of income for three years.")+" We lose 6 prestige."},{k:"comp",label:"Offer a compromise",txt:"We pay a share of income for two years and lose 3 prestige. "+Math.round(x.acc*100)+"% chance "+them+" accepts; if not, war."},{k:"fight",label:"Fight",txt:"War begins. Odds of winning about "+Math.round(pw*100)+"%. Powers backing us join in most cases."}];
  const ok=cardOpen({kind:"cong",title:"Crisis: "+nm(x.att)+" and "+nm(x.def),txt:nm(x.att)+" is ready to go to war against "+nm(x.def)+" ("+what+"). The Great Powers call a congress first. Backing "+nm(x.att)+": "+L(x.backA)+". Backing "+nm(x.def)+": "+L(x.backD)+". Estimated odds that "+nm(x.att)+" wins a war: "+Math.round(x.p*100)+"%.",opts:o,def:"fight",ctx:x});
  if(ok){G.congN=(G.congN||0)+1;return{w:null};}return null;}
 G.congN=(G.congN||0)+1;/* two computers at the table: the weaker side gives way with a chance that grows as its odds shrink */
 const weakA=x.p<.5,pw=weakA?x.p:1-x.p;let ch="fight";if(rng()<.75-pw){const r=rng();ch=weakA?(r<.7?"down":"comp"):(r<.4?"down":"comp");}else if(pw>.35&&rng()<.25)ch="comp";
 return crisisResolve(x,ch,weakA?1:2);}
/* who: which side is giving way (1 attacker, 2 defender); the other side may refuse a compromise */
function crisisResolve(x,ch,who){const A=G.c[x.att],D=G.c[x.def];if(!A||!D||!A.alive||!D.alive)return{w:null};who=who||x.pl||1;const g=x.goal,nm=t=>nameOf(t);let line="",w=null;
 if(ch==="comp"){const acc=who===1?clamp(.25+.6*x.p,.1,.88):clamp(.8-.6*x.p,.1,.85);if(x.pl&&rng()>=x.acc)ch="fight";else if(!x.pl&&rng()>=acc)ch="fight";}
 const rec=(o)=>{G.congLog=(G.congLog||[]);G.congLog.unshift({t:G.t,att:x.att,def:x.def,out:o});if(G.congLog.length>12)G.congLog.length=12;};
 if(ch==="down"){G.congDown=(G.congDown||0)+1;
  if(who===1){A.pres=Math.max(0,A.pres-4);D.pres+=2;A.truce[D.tag]=G.t+24;line="A congress meets. "+nm(x.att)+" backs down from its demands on "+nm(x.def)+".";}
  else{D.pres=Math.max(0,D.pres-6);A.pres+=4;if(g.prov&&P(g.prov).o===D.tag){takeProv(P(g.prov),A.tag,null);line="A congress meets. "+nm(x.def)+" gives up "+P(g.prov).n+" to "+nm(x.att)+" without a war.";}else{D.owes=(D.owes||[]).concat([{to:A.tag,share:REPS_SHARE*.6,until:G.t+36}]);line="A congress meets. "+nm(x.def)+" bows to "+nm(x.att)+" and agrees to pay reparations.";}A.truce[D.tag]=G.t+24;}
  A.rel[D.tag]=Math.min(A.rel[D.tag]||0,-20);msg("war",line);G.log.unshift({t:G.t,txt:line});rec("down");return{w:null};}
 if(ch==="comp"){D.owes=(D.owes||[]).concat([{to:A.tag,share:REPS_SHARE*.6,until:G.t+24}]);D.pres=Math.max(0,D.pres-3);A.pres+=2;A.truce[D.tag]=G.t+24;A.rel[D.tag]=Math.min(A.rel[D.tag]||0,-30);line="A congress meets. "+nm(x.def)+" and "+nm(x.att)+" settle: "+nm(x.def)+" pays reparations for two years.";msg("war",line);G.log.unshift({t:G.t,txt:line});rec("comp");return{w:null};}
 /* fight: the war begins and the powers that took sides mostly join */
 line="The congress breaks up without agreement; "+nm(x.att)+" and "+nm(x.def)+" go to war.";msg("war",line);rec("fight");w=declareWar(x.att,x.def,Object.assign({},g,{cong:1}));
 if(w){for(const t of x.backA)if(G.c[t].alive&&!w.def.includes(t)&&!w.att.includes(t)&&!((G.c[t].truce[x.def]||0)>G.t)&&rng()<.7)pullIn(w,t,1);for(const t of x.backD)if(G.c[t].alive&&!w.def.includes(t)&&!w.att.includes(t)&&!((G.c[t].truce[x.att]||0)>G.t)&&rng()<.7)pullIn(w,t,2);}
 return{w};}
/* ================= WHAT THE OTHER SIDE WOULD SAY ================= */
/* Every diplomatic move the player can make asks here first: the answer and its reasons are shown before the button is pressed, and the same function decides what happens when it is. */
const IMPROVE_COST=1000;
function improveAsk(c,t){const o=G.c[t],r=Math.round(c.rel[t]||0);if(c.tr<IMPROVE_COST)return{ok:false,why:"We cannot spare "+IMPROVE_COST+" for gifts and embassies."};if(atWarWith(c,o))return{ok:false,why:"We are at war with them."};if(r>=190)return{ok:false,why:"Relations are as good as they get."};return{ok:true,why:"Would accept: relations "+r+" to "+Math.min(200,r+15)+" (costs "+IMPROVE_COST+")."};}
function improveDo(c,t){const a=improveAsk(c,t);if(!a.ok)return a;c.tr-=IMPROVE_COST;c.rel[t]=Math.min(200,(c.rel[t]||0)+15);G.c[t].rel[c.tag]=Math.min(200,(G.c[t].rel[c.tag]||0)+15);return{ok:true,txt:"Relations with "+G.c[t].n+" improve."};}
function allyAsk(c,t){const o=G.c[t],r=Math.round(o.rel[c.tag]||0);if(c.ally.includes(t))return{ok:false,why:"Already allied."};if(atWarWith(c,o))return{ok:false,why:"We are at war with them."};if(r<60)return{ok:false,why:"Would refuse: they rate us at "+r+" and want 60 for an alliance."};if(o.ally.length>=3)return{ok:false,why:"Would refuse: they already have 3 allies."};if(c.ally.length>=3)return{ok:false,why:"We already have 3 allies."};
 const share=Object.keys(c.rel).filter(x=>x!==t&&G.c[x]&&G.c[x].alive&&(c.rel[x]||0)<-30&&(o.rel[x]||0)<-30).map(nameOf);return{ok:true,why:"Would accept: they rate us at "+r+"."+(share.length?" Shared rivals: "+share.slice(0,3).join(", ")+".":"")+" Allies join each other's wars most of the time."};}
function allyDo(c,t){const a=allyAsk(c,t);if(!a.ok)return a;const o=G.c[t];c.ally.push(t);o.ally.push(c.tag);msg("diplomacy",c.n+" and "+o.n+" sign an alliance.");return{ok:true,txt:"An alliance with "+o.n+"."};}
function unallyDo(c,t){const o=G.c[t];c.ally=c.ally.filter(x=>x!==t);o.ally=o.ally.filter(x=>x!==c.tag);c.rel[t]=(c.rel[t]||0)-25;o.rel[c.tag]=(o.rel[c.tag]||0)-25;msg("diplomacy",c.n+" ends its alliance with "+o.n+".");return{ok:true,txt:"The alliance is over."};}
function guarAsk(c,t){const r=guaranteeCan(c,t);if(!r.ok)return{ok:false,why:r.why};const m=G.c[t],rivals=(G.gp||[]).filter(x=>x!==c.tag&&x!==t&&G.c[x].rel&&(G.c[x].rel[t]||0)<-10).map(nameOf);return{ok:true,why:"Would accept gladly: relations with them +15. "+(rivals.length?"Rivals who eye them ("+rivals.slice(0,3).join(", ")+") think less of us. ":"")+"If it is attacked we go to war."};}
function influenceAsk(c,t){const o=G.c[t];if(!isGP(c.tag))return{ok:false,why:"Only Great Powers build influence."};if((c.infPts||0)<10)return{ok:false,why:"It costs 10 influence points; we have "+Math.round(c.infPts||0)+"."};if(o.sphere&&o.sphere!==c.tag)return{ok:false,why:"It is in the "+G.c[o.sphere].adj+" sphere."};const cur=Math.round((o.inf&&o.inf[c.tag])||0),rel=Math.round(o.rel[c.tag]||0);return{ok:true,why:"Influence "+cur+" to "+(cur+10)+" of 60 for a sphere"+(cur+10>=60&&rel<10?"; they must also rate us at 10 or more (now "+rel+")":"")+"."};}
function influenceDo(c,t){const a=influenceAsk(c,t);if(!a.ok)return a;const o=G.c[t];c.infPts-=10;o.inf=o.inf||{};o.inf[c.tag]=(o.inf[c.tag]||0)+10;if(!o.sphere&&o.inf[c.tag]>=60&&(o.rel[c.tag]||0)>=10){o.sphere=c.tag;return{ok:true,txt:o.n+" joins our sphere."};}return{ok:true,txt:"Our influence in "+o.n+" grows."};}
/* the facts of a relationship, for the nation page */
function dipFacts(c,t){const o=G.c[t],out={};out.rel=Math.round(c.rel[t]||0);out.relBack=Math.round(o.rel[c.tag]||0);out.ally=c.ally.includes(t);out.weGuar=(c.guar||[]).includes(t);out.guarBy=guarantors(t).filter(x=>x!==c.tag);out.theyGuarUs=(o.guar||[]).includes(c.tag);out.sphere=o.sphere||null;out.overlord=o.overlord||null;out.truce=(c.truce[t]||0)>G.t?c.truce[t]:0;out.last=c.lastWar&&c.lastWar[t]||null;out.infamy=o.infamy||0;out.coal=G.coal&&G.coal[t]?G.coal[t].mem.slice():[];out.atWar=atWarWith(c,o);out.allies=o.ally.filter(x=>G.c[x]&&G.c[x].alive);out.wars=G.wars.filter(w=>w.att.includes(t)||w.def.includes(t));return out;}

function proposeSubjectAgreement(proposer, partner, term){
 const subject=proposer.overlord===partner.tag?proposer:partner.overlord===proposer.tag?partner:null;
 if(!subject||!subject.alive||!partner.alive||!proposer.alive)return "There is no active subject relationship.";
 const ruler=G.c[subject.overlord];
 if(subject.subjectAgreement?.until>G.t)return "A fiscal agreement is already in effect.";
 if(subject.war.length||ruler.war.length)return "Both governments must be at peace.";
 const receiver=proposer===subject?ruler:subject;
 const accepts=receiver===ruler
  ? (ruler.rel[subject.tag]||0)>=(term==="release"?65:10)&&ruler.tr>=incOf(ruler)*2
  : (subject.rel[ruler.tag]||0)>=-10&&subject.tr>=0;
 if(!accepts)return receiver.n+" refuses the proposal.";
 if(term==="release"){
  subject.overlord=null;
  if(subject.sphere===ruler.tag)subject.sphere=null;
  ruler.guar=(ruler.guar||[]).filter(tag=>tag!==subject.tag);
  ruler.truce[subject.tag]=Math.max(ruler.truce[subject.tag]||0,G.t+24);
  subject.truce[ruler.tag]=Math.max(subject.truce[ruler.tag]||0,G.t+24);
 }else{
  subject.subjectAgreement={ruler:ruler.tag,until:G.t+24,share:.02};
 }
 const result=term==="release"
  ? subject.n+" and "+ruler.n+" agree to independence with a two-year truce."
  : subject.n+" and "+ruler.n+" agree to a two-year fiscal compact. The ruler contributes up to 2% of monthly income.";
 for(const party of [subject,ruler])if(party.tag===G.player)(party.cabinetTreaties||=[]).push({t:G.t,txt:result});
 msg("diplomacy",result);
 G.log.unshift({t:G.t,txt:result});
 return result;
}

function proposeCommercialTransit(buyer,seller,good,renew=false){
 if(!buyer?.alive||!seller?.alive||buyer===seller||!GK.includes(good))return "Invalid commercial offer.";
 if(atWarWith(buyer,seller)||(seller.rel[buyer.tag]||0)<0)return "The partner refuses commercial transit.";
 const active=buyer.commercialRoute;
 if(active?.until>G.t&&(!renew||active.seller!==seller.tag||active.good!==good))
  return "An active route already exists.";
 if(renew&&active?.until>G.t+12)return "Renewal opens in the last year of the agreement.";
 buyer.commercialRoute={seller:seller.tag,good,until:G.t+24,rights:["trade"]};
 return "Commercial transit agreed for 24 months.";
}
