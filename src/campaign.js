"use strict";

const AGENDA_FOCUS={
 GBR:["fleet","Keep the fleet ready"], FRA:["universities","Build a centre of learning"],
 PRU:["rail","Connect the Prussian provinces"], SAR:["rail","Connect the Piedmontese economy"],
 AUS:["schools","Teach across the provinces"], RUS:["rail","Extend the imperial railways"],
 USA:["factories","Expand American manufacturing"], OTT:["schools","Train a new generation"],
 CHI:["research","Develop technical expertise"], JAP:["research","Study new technologies"],
 PUN:["reserve","Build a treasury reserve"], PER:["schools","Expand public education"],
 EGY:["irrigation","Improve irrigation"], ETH:["schools","Expand public education"],
 BRA:["irrigation","Improve agricultural output"], MEX:["reserve","Rebuild the treasury"],
 BEL:["factories","Expand Belgian manufacturing"], CHL:["reserve","Build a treasury reserve"],
 PEU:["irrigation","Develop agriculture"], SIA:["schools","Expand public education"]
};

const AGENDA_METRICS={
 rail:{label:"Railway levels",step:1,tab:"eco",why:"Railways support provincial output and movement.",value:(c,p)=>sum(p,x=>x.rail||0)},
 factories:{label:"Factory levels",step:1,tab:"eco",why:"A larger industrial base broadens the goods your country produces.",value:(c,p)=>sum(p,x=>sum(x.factories,f=>Math.floor(f.lv)))},
 schools:{label:"Schools",step:1,tab:"map",why:"Schools raise literacy, which supports skilled work and research.",value:(c,p)=>sum(p,x=>bxl(x,"school"))},
 universities:{label:"University levels",step:1,tab:"map",why:"Universities expand research capacity.",value:(c,p)=>sum(p,x=>x.uni||0)},
 irrigation:{label:"Irrigation levels",step:1,tab:"map",why:"Irrigation raises provincial farm output.",value:(c,p)=>sum(p,x=>x.irr||0)},
 research:{label:"Technologies learned",step:1,tab:"tech",why:"Choose a technology whose benefits fit your plans.",value:c=>Object.keys(c.tech).length},
 fleet:{label:"Warships at 80% strength",step:1,tab:"mil",why:"A ready fleet protects trade and gives you more options at sea.",value:c=>sum(G.armies.filter(a=>a.naval&&a.o===c.tag),a=>a.u.filter(u=>isWarship(u)&&u.str>=.8).length)},
 reserve:{label:"Treasury reserves",step:c=>Math.max(100,Math.round((c.stat.inc||1000)*.5)),tab:"nat",why:"Cash reserves help cover expensive reforms and bad months.",value:c=>Math.round(c.tr),format:v=>moneyS(v)},
 friendly:{label:"Friendly governments",step:1,tab:"dip",why:"Build a relationship with at least one additional government.",
  value:c=>Object.values(G.c).filter(other=>other.alive&&other.tag!==c.tag&&(c.rel[other.tag]||0)>=50).length},
 balanced:{label:"Months with a surplus",step:3,tab:"nat",why:"A monthly surplus lets you finance new projects.",value:()=>0},
 welfare:{label:"Basic needs met by poorer households",step:3,tab:"eco",why:"Better access to basic goods makes the population less vulnerable to shortages.",value:(c,p)=>{
  let met=0,people=0;
  for(const x of p)for(const q of x.pops)if(PTYPES[q.t].s===0){met+=q.n*q.ld;people+=q.n;}
  return Math.round(100*met/Math.max(1,people));
 },format:v=>v+"%"}
};

function agendaChoices(c){
 const own=provsOf(c.tag);
 const focus=AGENDA_FOCUS[c.tag];
 const allowed=[
  ...(focus&&focus[0]!=="research"?[focus]:[]),
  ["research","Research a new technology"],
  ["reserve","Build a treasury reserve"],
  ["friendly","Improve a diplomatic relationship"],
  ["balanced","Record three months of surplus"]
 ];
 return allowed.filter(([key],i)=>{
  if(allowed.findIndex(([candidate])=>candidate===key)!==i)return false;
  if(key==="schools")return own.some(p=>bldCan(c,p,"school").ok);
  if(key==="rail")return own.some(p=>railCan(c,p).ok);
  if(key==="research")return TECHS.some(t=>techAvail(c,t));
  if(key==="friendly")return Object.values(G.c).some(other=>other.alive&&other.tag!==c.tag&&(c.rel[other.tag]||0)<50&&improveAsk(c,other.tag).ok);
  return true;
 });
}
function beginAgenda(c, priority) {
 const old=G.agenda,ordinal=old?.tag===c.tag?old.ordinal+1:1;
 const p=provsOf(c.tag);
 const focus=AGENDA_FOCUS[c.tag]||(c.civ?["rail","Connect the provinces"]:["research","Develop technical expertise"]);
 const first=ordinal%2===0?(focus[0]==="research"?["schools","Expand public education"]:["research","Research a new technology"]):focus;
 const support=first[0]==="welfare"?["reserve","Build a treasury reserve"]:["welfare","Improve access to basic goods"];
 const selected=agendaChoices(c).find(([key])=>key===priority);
 const specs=[];
 const primary=selected||(agendaChoices(c).some(([key])=>key===first[0])?first:agendaChoices(c)[0]);
 for(const candidate of [primary,support,["balanced","Record three months of surplus"],["reserve","Build a treasury reserve"],...agendaChoices(c)]){
  const [key]=candidate;
  if(!specs.some(([existing])=>existing===key)&&(key!=="welfare"||AGENDA_METRICS.welfare.value(c,p)<100))
   specs.push(candidate);
  if(specs.length===3)break;
 }
 const goals=specs.map(([key,title])=>{
  const metric=AGENDA_METRICS[key],base=metric.value(c,p),step=typeof metric.step==="function"?metric.step(c):metric.step;
  return {key,title,base,now:base,target:key==="welfare"?Math.min(100,base+step):base+step,done:null};
 });
 G.agenda={tag:c.tag,start:G.t,end:G.t+12,ordinal,goals};
 return G.agenda;
}

function agendaMonth(c) {
 const a=G.agenda;
 if(!a||a.tag!==c.tag||a.closed!=null)return;
 const p=provsOf(c.tag);
 for(const goal of a.goals){
  if(goal.done!=null)continue;
  if(goal.key==="balanced")goal.now+=c.stat.net>0?1:0;
  else goal.now=AGENDA_METRICS[goal.key].value(c,p);
  if(goal.now>=goal.target)goal.done=G.t;
 }
 if(G.t>=a.end||a.goals.every(g=>g.done!=null)){
  a.closed=G.t;
  (G.agendaLog||=[]).push({start:a.start,end:a.closed,ordinal:a.ordinal,goals:a.goals.map(g=>({title:g.title,done:g.done}))});
 }
}

function cabinetSnapshot(c){
 const provinces=provsOf(c.tag),st=c.stat||{},poor=AGENDA_METRICS.welfare.value(c,provinces);
 const development=provinces.map(p=>({
  id:p.id, rail:p.rail||0, factories:sum(p.factories,f=>f.lv), schools:bxl(p,"school"), hospitals:BLD.hosp.lv(p)
 }));
 const incomes={};
 for(const province of provinces)for(const cohort of province.pops){
  incomes[cohort.t]=(incomes[cohort.t]||0)+(cohort.inc||0);
 }
 return {incomes,landVote:c.landRevenue?{yes:c.landRevenue.yes,enacted:c.landRevenue.enacted}:null,tag:c.tag,t:G.t,tr:Math.round(c.tr),debt:Math.round(c.debt||0),poor,
  gdp:Math.round((st.gdp||0)*12),pop:Math.round(st.pop||0),
  rank:G.rank.indexOf(c.tag)+1,wars:c.war.length,development};
}

function cabinetYear(c){
 if(G.t%12!==0||!G.cabinetBase||G.cabinetBase.t>=G.t)return false;
 const from=G.cabinetBase,to=cabinetSnapshot(c),prev=new Map(from.development.map(p=>[p.id,p]));
 const development=[];
 for(const p of to.development){
  const old=prev.get(p.id);
  if(!old){development.push({id:p.id,acquired:true});continue;}
  const changes={rail:p.rail-old.rail,factories:Math.round((p.factories-old.factories)*10)/10,schools:p.schools-old.schools};
  if(old.hospitals!=null)changes.hospitals=p.hospitals-old.hospitals;
  if(Object.values(changes).some(Boolean))development.push({id:p.id,changes});
 }
 const stats=({development,...other})=>other;
 const decisions=(G.choices||[]).filter(x=>x.t>=from.t&&x.t<G.t);
 (G.cabinetReports||=[]).push({year:yearOf(G.t-1),from:stats(from),to:stats(to),development,decisions,diplomacy:(c.cabinetTreaties||[]).filter(x=>x.t>=from.t&&x.t<G.t),works:(c.completedWorks||[]).filter(x=>x.t>=from.t&&x.t<G.t)});
 c.completedWorks=[];
 c.cabinetTreaties=[];
 G.cabinetBase=to;
 return true;
}

function advanceStop(s,d,state,settings){
 if(d.stop)return d.stop;
 if(settings.war && d.newWars.length)return "Your country entered a war.";
 if(settings.default && (state.defaultAt??-1)>=(s.t)&&state.defaultAt!==s.defaultAt)return "The government defaulted.";
 if(settings.projects && state.projectDone)return "A project or agenda goal was completed.";
 if(settings.report && state.reportDone)return "The annual cabinet report is ready.";
 if(settings.until!=null&&state.t>=settings.until)return "The selected number of months has passed.";
 return null;
}

const PUNJAB_CHALLENGE_MONTHS=15*12;
function beginPunjabChallenge(country, goal){
 if(country.tag!=="PUN"||G.t!==0||G.punjabChallenge||!["schools","welfare"].includes(goal))return false;
 const base=AGENDA_METRICS[goal].value(country,provsOf(country.tag));
 const target=goal==="schools"?base+2:Math.min(100,base+5);
 if(target<=base)return false;
 G.punjabChallenge={goal,base,target,current:base,sovereign:true,end:PUNJAB_CHALLENGE_MONTHS};
 return true;
}
function punjabChallengeMonth(country){
 const challenge=G.punjabChallenge;
 if(country.tag!=="PUN"||!challenge||challenge.result)return false;
 challenge.sovereign&&=country.alive&&!country.overlord;
 challenge.current=AGENDA_METRICS[challenge.goal].value(country,provsOf(country.tag));
 if(G.t<challenge.end&&country.alive)return false;
 challenge.result=challenge.sovereign&&challenge.current>=challenge.target?"won":"ended";
 return true;
}

function punjabStandingOrders(country){
 if(country.tag!=="PUN"||!country.schoolOrder)return;
 const order=country.schoolOrder;
 if(order.queuedAt!=null)return;
 const province=P(order.province);
 if(!province||province.o!==country.tag||province.ctl!==country.tag)return;
 if(country.tr<Math.max(0,country.stat.inc||0)*2)return;
 if(!bldCan(country,province,"school").ok)return;
 if(bqAdd(country,province.id,"school").ok)order.queuedAt=G.t;
}


function punjabHistoricalOutcome(country){
 if(country.tag!=="PUN"||country.historicalOutcome)return;
 if(G.t<180&&country.alive)return;
 const provinces=provsOf(country.tag);
 country.historicalOutcome={
  month:G.t,
  status:!country.alive?"Defeated":country.overlord?"Subject":country.commercialRoute?.until>G.t?"Independent with transit agreement":"Independent",
  welfare:AGENDA_METRICS.welfare.value(country,provinces),
  schools:AGENDA_METRICS.schools.value(country,provinces)
 };
}
