"use strict";
/* ================= ONE MONTH ================= */
function monthTick(){
 if(typeof runMonthlyTick==="function"){runMonthlyTick();return;}
 if(G.card&&(typeof UI==="undefined"||!G.player||G.c[G.player].ai))cardDefault(); /* nobody is there to answer: the default is taken, so headless runs never wait */
 purgeWars();econMonth(false);socMonth();researchMonth();modMonth();polMonth();eventsMonth();gwMonth();decMonth();diploMonth();
 if(G.c.GBR?.indiaConcessionUntil>G.t)for(const p of governedIndia(G.c.GBR))
  for(const group of p.pops)group.mil=Math.max(0,group.mil-.1);
 if(G.t%6===0)for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;let r=0;for(const t in c.rel)if(c.rel[t]<-30&&G.c[t].alive)r=Math.max(r,sum(G.armies.filter(a=>a.o===t&&!a.naval&&!a.reb),strength));c.rivalStr=r;}
 thMonth();
 for(const tag in G.c){const c=G.c[tag];if(c.alive&&c.ai){aiNavy(c);aiMob(c);if(G.t%2===0)aiRecruit(c);aiBld(c);}}
 armyMonth();aiMonth();progMonth();if(G.t%12===6)acceptCultures();if(G.t%12===0)histYear();
 roundHouseholdState();
 G.t++;
}

// Keep household precision consistent after both uninterrupted and restored turns.
function roundHouseholdState(){
 for(const province of G.plist){
  let people=0;
  for(const group of province.pops){
   group.n=householdPrecision(group.n);
   people+=group.n;
   group.cash=householdPrecision(group.cash);
   group.inc=householdPrecision(group.inc);
   group.lit=householdPrecision(group.lit);
   group.mil=householdPrecision(group.mil);
   group.con=householdPrecision(group.con);
   group.ld=householdPrecision(group.ld);
   group.ed=householdPrecision(group.ed);
   group.xd=householdPrecision(group.xd);
   group.job=householdPrecision(group.job);
   if(group._tax!=null)group._tax=householdPrecision(group._tax);
   if(group._spent!=null)group._spent=householdPrecision(group._spent);
  }
  if(province.pops.length)province.pop=people;
 }
}

function householdPrecision(value){
 if(Math.abs(value)<.00001||Math.abs(value)>1e9)return value;
 return Math.round(value*1e5)/1e5;
}


// Browser commands carry the month they were issued for. Replaying one cannot advance twice.
function advanceCampaign(expectedMonth){
 if(!G||G.t!==expectedMonth||G.card||!G.player||!G.c[G.player]?.alive)return null;
 const country=G.c[G.player];
 if(!G.agenda)beginAgenda(country);
 if(!G.cabinetBase||G.cabinetBase.tag!==country.tag)G.cabinetBase=cabinetSnapshot(country);
 punjabStandingOrders(country);
 monthTick();
 agendaMonth(country);
 punjabHistoricalOutcome(country);
 return {
  challengeEnded:punjabChallengeMonth(country),
  reportDone:cabinetYear(country)
 };
}

function campaignView(){
 if(!G?.player)return null;
 const country=G.c[G.player];
 const card=G.card;
 return Object.freeze({
  month:G.t, country:country.tag, name:country.n, treasury:country.tr,
  decision:card?Object.freeze({title:card.title,month:card.t}):null
 });
}

// Commands are ordered within a campaign and their high-water mark survives reload.
// A1: one actor-aware path. The human wrapper (issueCampaignCommand/applyCampaignCommand) keeps its signatures and
// serial (G.commandSerial); any other actor (scenario script, test, tool) has its own high-water mark in
// G.actorSerial[tag], created on first use so saves without such actors are unchanged. The AI issues orders from inside
// the month with auto:true: they are validated exactly like any other order but, being issued and executed in the same
// call, carry no serial (nothing durable to replay), so they leave no trace in the save.
function actorSerial(actor){
 return actor===G.player?(G.commandSerial||0):((G.actorSerial&&G.actorSerial[actor])||0);
}
function issueCampaignCommand(actor){
 const who=actor||G.player;
 return {month:G.t,serial:actorSerial(who)+1};
}
function commitActorSerial(actor,serial){
 if(actor===G.player)G.commandSerial=serial;
 else(G.actorSerial||(G.actorSerial={}))[actor]=serial;
}
const CMD_KINDS={queueRemove:"queueRemove",bqdel:"queueRemove",queueMove:"queueMove",bqmv:"queueMove",
 rail:"rail",factory:"factory",building:"building",queue:"queue",subject:"subject",research:"research",researchQueue:"researchQueue",reform:"reform",programme:"programme",repayall:"repayall"};
/* Repay all loans at once: pay the smaller of the debt and the treasury. Refuses when nothing is owed or nothing can be paid.
 * Shared by the player (applyCampaignCommand) and the AI (aiOrder), so both follow the same rule. */
function repayAllLoans(country){
 const owed=country.debt||0;
 if(owed<=0)return {ok:false,why:"We owe nothing to our creditors."};
 const pay=Math.min(owed,Math.max(0,country.tr));
 if(pay<=0)return {ok:false,why:"The treasury is empty, so nothing can be paid toward the debt."};
 country.debt=owed-pay;country.tr-=pay;
 return {ok:true,paid:pay,left:country.debt,txt:"We repaid £"+Math.round(pay)+" of our debt"+(country.debt>0?"; £"+Math.round(country.debt)+" remains.":".")};
}
/* The first month's materials bill at the nation's base prices: a project may not be started that the treasury
 * cannot pay for in its first month. Computed from the same functions investMonth uses, mutating nothing. */
function commandFunds(country,kind,province,command){
 let probe;
 if(kind==="rail")probe={k:"rail",left:Object.assign({},RAIL_COST)};
 else if(kind==="factory"){probe={k:"fac",left:Object.assign({},BUILD_COST)};const pm=facPrem(country);
  if(pm!==1)for(const x in probe.left)probe.left[x]=Math.round(probe.left[x]*pm);}
 else{const cost=bldCost(province,command.building);probe={k:"bld",b:command.building,cost,left:Object.assign({},cost)};}
 let bill=0;
 for(const g in costOf(probe))bill+=Math.min(probe.left[g],monthlyConstructionOrder(probe,g))*(country.bp[g]||0);
 return bill;
}
/* A2: the AI obeys facCan exactly as the player does (A1 had kept a waiver for "one already being built here" and "machine parts too scarce"). */
const COMMAND_STALE={ok:false,why:"This order has expired or already been used."};
/* execCommand(actor, command[, options]) -> {ok,txt|why}. Every check runs before the first mutation. */
function execCommand(actor,command,options){
 const auto=!!(options&&options.auto);
 const country=actor&&G?.c?G.c[actor]:null;
 if(!country||!country.alive||!command||typeof command!=="object")return {...COMMAND_STALE};
 if(!auto&&(command.month!==G.t||command.serial!==actorSerial(actor)+1))return {...COMMAND_STALE};
 const kind=Object.hasOwn(CMD_KINDS,command.kind)?CMD_KINDS[command.kind]:null;
 if(!kind)return {ok:false,why:"Unknown campaign order."};
 const commit=()=>{if(!auto)commitActorSerial(actor,command.serial);};
 if(kind==="queueRemove"||kind==="queueMove"){
  const queue=country.bq||[];
  const index=queue.findIndex(order=>order.id===command.id);
  const next=index+command.direction;
  if(index<0)return {ok:false,why:"That project is no longer waiting."};
  if(kind==="queueMove"){
   if(![-1,1].includes(command.direction)||next<0||next>=queue.length)
    return {ok:false,why:"The project cannot move farther."};
   [queue[index],queue[next]]=[queue[next],queue[index]];
  }else queueEnd(country,queue.splice(index,1)[0],"removed by order");
  commit();
  return {ok:true,txt:kind==="queueMove"?"Queue order updated.":"Project removed from the queue."};
 }
 if(kind==="research"||kind==="researchQueue"){
  const r=researchOrder(country,kind,command);
  if(r.ok)commit();
  return r;
 }
 if(kind==="reform"){const r=modReformOrder(country,command.reform);if(r.ok)commit();return r;}
 if(kind==="programme"){
  const r=progCommand(country,command);
  if(r.ok)commit();
  return r;
 }
 if(kind==="subject"){
  const partner=G.c[command.target];
  if(!partner||!["compact","release"].includes(command.term))return {ok:false,why:"Unknown treaty terms."};
  commit();
  return {ok:true,txt:proposeSubjectAgreement(country,partner,command.term)};
 }
 if(kind==="repayall"){const r=repayAllLoans(country);if(r.ok)commit();return r;}
 const province=P(command.province);
 if(!province||province.o!==country.tag||province.ctl!==country.tag)return {ok:false,why:"We do not control this province."};
 let result;
 if(kind==="rail")result=railCan(country,province);
 else if(kind==="factory"){
  if(!Object.hasOwn(RECIPE,command.good))return {ok:false,why:"Unknown factory type."};
  result=facCan(country,province,command.good);
 }else{
  if(!Object.hasOwn(BLD,command.building))return {ok:false,why:"Unknown building."};
  result=bldCan(country,province,command.building);
 }
 if(!result.ok)return result;
 if(kind!=="queue"){
  const bill=commandFunds(country,kind,province,command);
  if(!(country.tr>=bill))return {ok:false,why:"The treasury cannot pay the first month's materials (£"+Math.round(bill)+")."};
 }
 if(kind==="rail"){startRail(country,province);result={ok:true};}
 else if(kind==="factory"){startFactory(country,province,command.good,true);result={ok:true};}
 else result=kind==="queue"?bqAdd(country,province.id,command.building):startBld(country,province,command.building);
 if(result.ok){
  commit();
  if(!auto){
   if(kind==="queue")country.bq.at(-1).orderId=command.serial;
   else province.build.at(-1).orderId=command.serial;
  }
 }
 return result;
}
/* A4+: research orders (every nation, same validation). research = start a study now (banked points are kept); researchQueue op add | remove | move.
   Every check runs before the first mutation; a double tap is stale by serial and, independently, a duplicate by content. */
function researchOrder(c,kind,command){
 const id=command.tech,q=c.resQ||(c.resQ=[]);
 if(typeof id!=="string"||!Object.hasOwn(TF,id))return {ok:false,why:"Unknown study."};
 if(c.tech[id])return {ok:false,why:"That study is already complete."};
 if(kind==="research"){
  if(c.res===id)return {ok:false,why:"The scholars are already working on that."};
  const rest=q.filter(x=>x!==id);
  if(!techReady(c,id,[]))return {ok:false,why:"That study cannot be started yet."};
  if(!resChainOk(c,id,rest))return {ok:false,why:"The queue would no longer be possible; remove the dependent studies first."};
  c.res=id;c.resQ=rest;
  return {ok:true,txt:"The scholars begin "+tNm(TF[id].n)+"."};
 }
 const op=command.op;
 if(op==="add"){
  if(q.length>=RES_QMAX)return {ok:false,why:"Queue full ("+RES_QMAX+")."};
  if(c.res===id||q.includes(id))return {ok:false,why:"That study is already under way or queued."};
  if(!resChainOk(c,c.res,q.concat(id)))return {ok:false,why:"That study cannot be queued yet."};
  q.push(id);
  return {ok:true,txt:tNm(TF[id].n)+" is queued."};
 }
 const i=q.indexOf(id);
 if(i<0)return {ok:false,why:"That study is not in the queue."};
 if(op==="remove"){
  const rest=q.filter(x=>x!==id);
  if(!resChainOk(c,c.res,rest))return {ok:false,why:"Later studies depend on it."};
  c.resQ=rest;
  return {ok:true,txt:"Removed from the queue."};
 }
 if(op==="move"){
  const j=i+command.direction;
  if(![-1,1].includes(command.direction)||j<0||j>=q.length)return {ok:false,why:"It cannot move farther."};
  const next=q.slice();[next[i],next[j]]=[next[j],next[i]];
  if(!resChainOk(c,c.res,next))return {ok:false,why:"Another study depends on that order."};
  c.resQ=next;
  return {ok:true,txt:"Queue updated."};
 }
 return {ok:false,why:"Unknown research order."};
}
/* the AI's way to order works: same validation, no serial */
function aiOrder(country,command){return execCommand(country.tag,command,{auto:true});}

function applyCampaignCommand(command){
 if(!G?.player||!G.c[G.player]?.alive)return {...COMMAND_STALE};
 return execCommand(G.player,command);
}
