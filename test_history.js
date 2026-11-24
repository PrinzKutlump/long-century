"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("dist/long-century.html", "utf8");
const source = html.match(/<script>([\s\S]*)<\/script>/)[1];
const nodes = new Map();
const context = vm.createContext({
 console, assert, performance, setInterval:()=>1, clearInterval:()=>{}, oldSave:fs.readFileSync("testdata/prev_build_save.txt","utf8").trim(),
 window:{addEventListener(){}}, document:{
  addEventListener(){},
  querySelector:selector=>nodes.get(selector),
  createElement:()=>({}),
  body:{appendChild(node){nodes.set("#"+node.id,node);}}
 }
});
vm.runInContext(source,context);
vm.runInContext(`
function onDate(y,m){G.t=(y-1836)*12+m-1;for(const e of EVENTS)if(e.date==null)G.ev[e.id]=true;}
function scenario(tag){newGame(tag,7);G.c[tag].ai=false;}
scenario("JAP");
assert.equal(HISTORY_DISPATCHES.length,79);
assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);
assert.equal(HISTORY_DISPATCHES.filter(d=>!G.c[d.tag]).length,0);

scenario("PRU");eventsMonth();assert.equal(G.card.id,"zollverein");
cardChoose("1");eventsMonth();assert.ok(!G.card);

scenario("JAP");onDate(1853,6);eventsMonth();assert.ok(!G.card);
onDate(1853,7);eventsMonth();assert.equal(G.card.id,"perry");
unpack(pack());assert.equal(G.card.id,"perry");drawCard();
assert.match(document.querySelector("#card").innerHTML,/Historical record/);
cardChoose("1");assert.equal(G.perryRefused,true);
unpack(pack());onDate(1854,2);eventsMonth();assert.equal(G.card.id,"perryReturn");
cardChoose("0");assert.equal(G.choices.length,2);
assert.match(G.choices[1].history,/1854/);
eventsMonth();assert.ok(!G.card);

scenario("USA");G.c.USA.reforms.slavery=2;onDate(1907,10);eventsMonth();assert.equal(G.card.id,"panic1907Relief");
assert.ok(Math.abs(creditInvestmentFactor(G.c.USA)-.8)<1e-8);
cardChoose("0");assert.ok(Math.abs(creditInvestmentFactor(G.c.USA)-.9)<1e-8);
assert.equal(creditInvestmentFactor(G.c.GBR),1);
unpack(pack());G.t=G.creditShock.until;
assert.equal(creditInvestmentFactor(G.c.USA),1);

scenario("GBR");onDate(1918,9);eventsMonth();
assert.ok(influenzaGrowthPenalty(P("LON"))>0);
P("LON").hosp=2;
assert.ok(influenzaGrowthPenalty(P("LON"))<.0014);
G.t=G.influenzaUntil;assert.equal(influenzaGrowthPenalty(P("LON")),0);

scenario("OTT");onDate(1875,10);G.c.OTT.debt=incOf(G.c.OTT)*10;
eventsMonth();assert.equal(G.card.id,"ottomanDebt");cardChoose("1");
assert.equal(G.c.OTT.debt,0);

scenario("SWE");onDate(1905,6);eventsMonth();assert.equal(G.card.id,"norway1905");
cardChoose("0");assert.ok(alive("NOR"));assert.equal(P("NOR").o,"NOR");

unpack(oldSave);
const ids=G.wars.map(w=>w.id);
const next=nextWarId();assert.ok(!ids.includes(next));
unpack(pack());assert.notEqual(nextWarId(),next);
scenario("JAP");assert.equal(nextWarId(),"w100");

console.log("PASS: deck integrity, Jan 1836, historical dates, Perry branching, card rendering, save migration, credit and influenza expiry, debt default, independence, and persisted war IDs.");
`,context);

vm.runInContext(`
function setup(tag, year, month){
 newGame(tag,7);
 G.t=(year-1836)*12+month-1;
 for(const e of EVENTS)if(e.date==null)G.ev[e.id]=true;
}
setup("PRU",1836,1);
const a=beginAgenda(me());
assert.equal(a.goals.length,3);
assert.equal(a.goals[0].key,"rail");
const openingRail=P("BER").rail;
G.cabinetBase=cabinetSnapshot(me());
P("BER").rail=openingRail+1;
for(let m=1;m<=12;m++){G.t=m;me().stat.net=500;agendaMonth(me());}
assert.equal(a.goals[0].done,1);
assert.equal(a.goals[2].done,3);
assert.equal(G.agendaLog.length,1);
assert.match(agendaHTML(me()),/Set the next agenda/);
assert.ok(cabinetYear(me()));
assert.equal(G.cabinetReports[0].year,1836);
assert.equal(G.cabinetReports[0].development.find(p=>p.id==="BER").changes.rail,1);
unpack(pack());
assert.equal(latestCabinetReport().year,1836);
assert.equal(beginAgenda(me()).ordinal,2);
assert.equal(advanceStop({t:10},{stop:null,newWars:[]},{t:13},{until:13}),"The selected number of months has passed.");
assert.equal(advanceStop({t:10},{stop:"A decree awaits",newWars:[]},{t:13},{until:13}),"A decree awaits");
assert.equal(advanceStop({t:10},{stop:null,newWars:[]},{t:11,defaultAt:10},{default:true}),"The government defaulted.");
assert.equal(advanceStop({t:10},{stop:null,newWars:[]},{t:11,projectDone:true},{projects:true}),"A project or agenda goal was completed.");
assert.equal(advanceStop({t:10},{stop:null,newWars:[]},{t:11,projectDone:true},{}),null);

setup("PUN",1846,3);
eventsMonth();assert.equal(G.card.id,"punjabTrade");
cardChoose("0");unpack(pack());G.t=(1849-1836)*12+2;
eventsMonth();assert.equal(G.card.id,"punjab1849");
const tariff=me().tariff;cardChoose("0");assert.equal(me().tariff,Math.max(0,tariff-.1));

setup("PUN",1846,3);
eventsMonth();cardChoose("1");G.t=(1849-1836)*12+2;
eventsMonth();assert.equal(G.card.id,"punjab1849Independent");
cardChoose("0");assert.ok(P("LAH").build.some(b=>b.b==="school"));

function julyFixture(player){
 setup(player,1914,7);
 G.c.AUS.ally=["PRU"];G.c.SER.ally=["RUS"];
 G.c.PRU.ally=["AUS"];G.c.RUS.ally=["SER"];
 G.c.FRA.ally=["RUS"];G.c.GBR.guar=["SER"];
 G.c.AUS.rel.SER=-60;
 G.gp=["AUS","PRU","RUS","FRA","GBR"];
}
julyFixture("AUS");
eventsMonth();
assert.equal(G.card.id,"july1914");
cardChoose("0");
assert.ok(!G.wars.some(w=>w.july));

julyFixture("GBR");
eventsMonth();
let w=G.wars.find(w=>w.july);
assert.ok(w);assert.equal(w.att.join(),"AUS");assert.equal(w.def.join(),"SER");
G.t++;julyMonth();assert.equal(G.card.id,"july-entry");
unpack(pack());cardChoose("neutral");w=G.wars.find(w=>w.july);
assert.equal(w.july.answers.GBR,"neutral");
G.t++;julyMonth();
assert.ok(w.july.general);
assert.ok(!w.def.includes("GBR"));
assert.ok(!w.att.some(t=>w.def.includes(t)));
assert.ok(w.july.wear.RUS>0);

julyFixture("RUS");eventsMonth();
w=G.wars.find(w=>w.july);
G.t++;julyMonth();assert.equal(G.card.id,"july-entry");
cardChoose("join");
assert.ok(w.def.includes("RUS"));
G.t++;julyMonth();
w.july.wear.RUS=50;
julyMonth();assert.ok(!G.card,"below the AI threshold (65) no card is asked: "+(G.card&&G.card.id)+" "+w.july.wear.RUS);
w.july.wear.RUS=66;
julyMonth();assert.equal(G.card.id,"july-exit");assert.equal(G.card.def,"exit","default = the AI policy for a non-leader");
cardChoose("exit");
assert.equal(w.july.answers.RUS,"withdrawn");
assert.ok(!w.def.includes("RUS")&&!me().war.includes(w.id));
assert.ok(me().truce.AUS>G.t);
G.player="AUS";G.c.AUS.ai=false;
endWar(w,"att");G.t++;julyConferences();
assert.equal(G.card.id,"july-conference");
cardChoose("reparations");
assert.ok(G.c.SER.owes.some(x=>x.to==="AUS"&&x.share===.04));
assert.equal(G.peaceConferences[0].resolved,"reparations");

console.log("PASS: agenda, annual report, multi-month stop rules, both Punjab branches, July mediation, neutrality, entry, separate peace and reparations.");
`,context);

vm.runInContext(`
newGame("JAP",7);
G.t=8;
let modalHtml="";
openModal=html=>{modalHtml=html;};
closeModal=()=>{};
closeSheet=()=>{};
render=()=>{};
drawTop=()=>{};
drawCard=()=>{};
toast=()=>{};
document.querySelector=selector=>selector==="#modal"?{firstElementChild:null}:null;
OPTS("sum",0);
OPTS("stopWar",0);
OPTS("stopDefault",0);
OPTS("stopProjects",0);
OPTS("stopReport",0);
ACT.play();
assert.match(modalHtml,/3 months/);
assert.match(modalHtml,/Pause on a sovereign default/);
ACT.opt({k:"stopProjects"});
assert.equal(OPT("stopProjects",0),1);
ACT.opt({k:"stopProjects"});
ACT.advance({n:"3"});
assert.equal(UI.advanceTo,11);
endMonth();assert.equal(UI.play,1);
endMonth();assert.equal(UI.play,1);
endMonth();assert.equal(UI.play,0);
assert.equal(G.t,11);
endMonth();
assert.equal(G.t,12);
assert.equal(latestCabinetReport().year,1836);
ACT.cabinetreport({});
assert.match(modalHtml,/Cabinet report · 1836/);
assert.match(modalHtml,/Basic needs/);
assert.match(modalHtml,/Provincial development/);
console.log("PASS: advance menu and toggles, actual three-turn cutoff, first report and report markup.");
`,context);

// Exercise the shipped script and the shared engine with the same opening state.
const engine = require("./engine-files.json")
 .map(file => fs.readFileSync("src/" + file, "utf8")).join("\n;\n");
const londonEstimates = `
 newGame("GBR", 7);
 JSON.stringify(["dock", "coal"].map(kind => {
  const country = G.c.GBR;
  return bldVal(country, P(country.cap), kind).v;
 }));
`;
const releaseEstimates = vm.runInContext(londonEstimates, context);
const engineEstimates = vm.runInNewContext(engine + "\n;\n" + londonEstimates);
assert.equal(releaseEstimates, engineEstimates);
assert.ok(JSON.parse(releaseEstimates).every(value => Number.isFinite(value) && value > 0));
vm.runInContext(`
 const britishShips = fleetOf("GBR"), frenchShips = fleetOf("FRA");
 assert.equal(britishShips, 74);
 assert.ok(frenchShips > 0);
 assert.ok(pgDipNation("FRA").includes(pbRow("Navy", britishShips, frenchShips)));
`, context);
console.log("PASS: London building estimates agree across release and engine, and diplomacy displays fleet counts.");

vm.runInContext(`
scenario("JAP");G.t=(1868-1836)*12;
for(const e of EVENTS)if(e.id!=="meiji"&&e.id!=="meijiChoice")G.ev[e.id]=true;
G.c.JAP.civ=0;eventsMonth();
assert.equal(G.card.id,"meiji");
cardChoose("old");unpack(pack());G.t++;
eventsMonth();
assert.equal(G.card,null);
assert.equal(takeDecision(me(),"meiji").ok,false);
assert.equal(me().hold-G.t,119);
G.t=me().hold;
assert.equal(takeDecision(me(),"meiji").ok,true);
assert.equal(takeDecision(me(),"meiji").ok,false);

scenario("PUN");
{
 const c=me(),p=P("LAH"),slots=buildSlots(c);
 for(let i=bldActive(c);i<slots;i++)p.build.push({k:"bld",b:"hosp",state:true,left:{cement:100}});
 c.bq=[];
 assert.equal(orderRegionalBuilding(c,p,"school").ok,true);
 assert.equal(bldActive(c),slots);
 assert.equal(c.bq[0].b,"school");
 assert.equal(orderRegionalBuilding(c,p,"school").ok,false);
 unpack(pack());
 assert.equal(me().bq.length,1);
}

scenario("GBR");
{
 const c=me(),o=objInit(c);
 const original=provsOf("GBR").find(p=>p.id!==c.cap),replacement=provsOf("FRA")[0];
 original.o="FRA";replacement.o="GBR";
 assert.equal(startingHoldings(c,o).ok,false);
 original.o="GBR";replacement.o="FRA";
 assert.equal(startingHoldings(c,o).ok,true);
}

scenario("PUN");
{
 const total=()=>sum(G.plist,p=>sum(p.pops,q=>q.n));
 for(const [,ids] of EMIG_DEST)for(const id of ids)P(id).o="PUN";
 const before=total();
 emigrate();
 assert.equal(total(),before);
}

scenario("ETH");G.regionalChoices={wichale:"unsigned"};
G.c.SAR.formed="ITA";
assert.equal(ev("adwa").cond(),false);
assert.equal(ev("ethiopianMissions").cond(),true);
G.regionalChoices.wichale="signed";
assert.equal(ev("adwa").cond(),true);
assert.equal(ev("ethiopianMissions").cond(),false);
`,context);
console.log("PASS: Meiji refusal and reload, construction queue, original holdings, migration conservation and Wichalē divergence.");

vm.runInContext(`
scenario("PUN");
let failAutosave=false;
const storage=new Map();
globalThis.localStorage={
 getItem:key=>storage.get(key)||null,
 setItem(key,value){if(failAutosave)throw Error("Storage full");storage.set(key,value);}
};
autosave();
const originalAutosave=localStorage.getItem("vic.auto");
G.t++; me().tr+=100;
failAutosave=true;
autosave();
assert.equal(localStorage.getItem("vic.auto"),originalAutosave);
assert.match(autosaveStatus(),/Autosave failed/);
assert.equal(UI.lastAutosave,0);
const currentCash=me().tr;
unpack(pack());
assert.ok(Math.abs(me().tr-currentCash)<.0001);

scenario("PUN");
assert.equal(beginPunjabChallenge(me(),"schools"),true);
P("LAH").bx={school:G.punjabChallenge.target};
G.t=PUNJAB_CHALLENGE_MONTHS;
assert.equal(punjabChallengeMonth(me()),true);
assert.equal(G.punjabChallenge.result,"won");
unpack(pack());
assert.equal(G.punjabChallenge.result,"won");

scenario("GBR");
{
 const c=me(),province=P(c.cap);
 G.c.ETH.overlord=c.tag;
 G.c.ETH.rel.GBR=30;
 assert.match(proposeSubjectAgreement(c,G.c.ETH,"release"),/agree to independence/);
 assert.equal(G.c.ETH.overlord,null);
 assert.equal(G.c.ETH.truce.GBR,G.t+24);
 G.c.FRA.rel.GBR=30;
 const peace={chair:"GBR",other:"FRA"};
 const funds=c.tr;
 resolveConference(peace,"rebuild");
 assert.ok(c.tr<funds);
 const paid=c.tr;
 resolveConference(peace,"rebuild");
 assert.equal(c.tr,paid);
 assert.equal(c.truce.FRA,G.t+72);
}
`,context);
console.log("PASS: failed autosave preserves the last save, Punjab challenge persists, and agreements apply once.");

vm.runInContext(`
scenario("PRU");
const beforeBadImport=G;
assert.throws(()=>unpack('{"prov":{},"c":{}}'));
assert.equal(G,beforeBadImport);
assert.equal(G.player,"PRU");
eventsMonth();
const pending=G.card;
assert.equal(cardChoose("invalid"),null);
assert.equal(G.card,pending);
monthTick();
dispMonth([],true);
const held=G.obj.h.h_hold;
cardChoose(G.card.opts[0].k);
dispMonth([]);
assert.equal(G.obj.h.h_hold,held);

for(const tag of ["PUN","CHL","MEX"]){
 scenario(tag);
 const keys=agendaChoices(me()).map(([key])=>key);
 assert.equal(new Set(keys).size,keys.length);
}
const slotData=new Map();
globalThis.localStorage={
 getItem:k=>slotData.get(k),
 setItem:(k,v)=>{if(k.endsWith("m"))throw Error("Quota");slotData.set(k,v);}
};
slotSave(2);
assert.ok(localStorage.getItem("vic.s2"));
assert.match(slotRow(2),/Saved campaign/);
assert.doesNotMatch(slotRow(2),/disabled/);

function replay(roundTrip){
 scenario("PUN");
 for(let i=0;i<12;i++){
  if(G.card)cardChoose(G.card.opts[0].k);
  monthTick();
  if(i===5&&roundTrip)unpack(pack());
 }
 return JSON.parse(readSaveJSON(pack()));
}
const reference=replay(false);
assert.ok(JSON.stringify(replay(false))===JSON.stringify(reference),"restart diverged");
const restored=replay(true);
for(const key of Object.keys(reference))assert.ok(JSON.stringify(restored[key])===JSON.stringify(reference[key]),"reload diverged at "+key);
console.log("PASS: rejected import and decree, monthly credit, manual slot recovery, unique agendas, deterministic restart and reload.");
`,context);

vm.runInContext(`
scenario("PUN");
const oldView=campaignView();
assert.ok(Object.isFrozen(oldView));
const result=advanceCampaign(oldView.month);
assert.ok(result);
assert.equal(G.t,oldView.month+1);
assert.equal(advanceCampaign(oldView.month),null);
const current=G;
const incompatible=JSON.parse(readSaveJSON(pack()));
incompatible.saveSchema=999;
assert.throws(()=>unpack(JSON.stringify(incompatible)),/unsupported/);
assert.equal(G,current);
assert.equal(campaignView().month,oldView.month+1);
`,context);

vm.runInContext(`
scenario("PUN");
{
 const province=provsOf("PUN")[0];
 const total=sum(province.pops,q=>q.n);
 for(const q of province.pops)if(q.t==="ART")q.lit=.1;
 const before=counts(province);
 provincialIndustryJobs(province,before,before.CRA+10,before.CLK+10);
 assert.ok(counts(province).CRA>before.CRA);
 assert.equal(counts(province).CLK,before.CLK);
 for(const q of province.pops)if(q.t==="ART")q.lit=.5;
 const after=counts(province);
 provincialIndustryJobs(province,after,after.CRA,after.CLK+10);
 assert.ok(counts(province).CLK>before.CLK);
 assert.ok(Math.abs(sum(province.pops,q=>q.n)-total)<1e-7);
 monthTick();
 assert.ok(provincialHouseholds(province).spending>0);
}
`,context);
console.log("PASS: Punjab hiring conserves population, respects qualifications and records household spending.");

vm.runInContext(`
scenario("PUN");
{
 const province=provsOf("PUN")[0];
 const command={...issueCampaignCommand(),kind:"queue",province:province.id,building:"school"};
 assert.ok(applyCampaignCommand(command).ok);
 assert.equal(me().bq[0].orderId,command.serial);
 unpack(pack());
 assert.equal(applyCampaignCommand(command).ok,false);
 bqMonth(me());
 assert.equal(P(province.id).build.at(-1).orderId,command.serial);
 P(province.id).factories.push({g:"fabric",lv:1,cash:1000,loss:0,own:"state"});
 monthTick();
 for(const p of provsOf("PUN")){
  const l=p.landUse;
  assert.ok(Math.abs(l.capacity-l.subsistence-l.commercial-l.fallow)<1e-7);
  for(const f of p.factories){
   const a=f.employerAccount;
   assert.ok(Number.isFinite(a.profit));
   assert.ok(Math.abs(a.revenue-a.inputs-a.wages-a.profit)<1e-7);
  }
 }
}
`,context);
console.log("PASS: project commands survive save/reload, queue IDs persist and Punjab accounts reconcile.");

vm.runInContext(`
{
 const row={id:"test",supply:20,demand:100,capacity:50,freight:.1};
 const blocked=settleLocalGood([{...row,capacity:0}],60,10,0)[0];
 const open=settleLocalGood([row],60,10,0)[0];
 const tariff=settleLocalGood([row],60,10,.3)[0];
 assert.equal(blocked.received,20);
 assert.equal(blocked.delivered,0);
 assert.ok(open.received>blocked.received&&open.received<=60);
 assert.ok(tariff.received<open.received&&tariff.landed>open.landed);
}
scenario("PUN");
monthTick();
for(const good of PILOT_GOODS){
 const rows=provsOf("PUN").map(p=>p.localMarket[good]);
 assert.ok(Math.abs(sum(rows,r=>r.received)+rows[0].unallocated-rows[0].available)<1e-7);
 assert.ok(rows.every(r=>r.fill>=0&&r.fill<=1));
}
`,context);
console.log("PASS: Punjab household freight, tariff sensitivity and allocation limits.");

vm.runInContext(`
scenario("PUN");
{
 const opening=pack();
 const play=amended=>{
  unpack(opening);
  const country=me(),province=provsOf(country.tag).find(p=>bldCan(country,p,"school").ok);
  country.schoolOrder={province:province.id};
  country.tr=Math.max(country.tr,(country.stat.inc||0)*4);
  const vote=voteOnLandRevenue(country,amended);
  assert.ok(vote&&vote.yes>=0&&vote.yes<=1);
  for(let t=0;t<24;t++){
   if(G.card)cardChoose(G.card.opts[0].k);
   assert.ok(advanceCampaign(t));
  }
  assert.equal(G.cabinetReports.length,2);
  assert.ok(country.schoolOrder.queuedAt!=null);
  for(const p of provsOf(country.tag))for(const row of Object.values(p.localMarket)){
   assert.ok(row.purchased<=row.received+1e-7);
   assert.ok(row.freightPaid>=0&&Number.isFinite(row.basePaid));
  }
  return vote.yes;
 };
 assert.notEqual(play(false),play(true));
}
`,context);
console.log("PASS: both Punjab bill paths run for 24 months with recorded school order, market receipts and two annual reports.");

vm.runInContext(`
{
 const importer={importPolicy:"industry",_bx:{cust:0}};
 assert.equal(importOrderShare(importer,"machinery"),1);
 assert.ok(importOrderShare(importer,"grain")<1);
 importer._bx.cust=.2;
 assert.ok(importOrderShare(importer,"grain")>.35);
 assert.equal(methodOperation({m:1,activeMethod:0},{machinery:0}),1);
 assert.ok(1.2*methodOperation({m:1,activeMethod:1},{machinery:0})<1);
 assert.equal(methodOperation({m:1,activeMethod:1},{machinery:1}),1);
 scenario("GBR");
 me().importPolicy="industry";
 monthTick();
 assert.ok(Number.isFinite(me().stat.debtChange));
 assert.ok(Math.abs(sum(Object.values(G.c),c=>c.stat.dividendsIn||0)-sum(Object.values(G.c),c=>c.stat.dividendsOut||0))<1e-7);
 unpack(pack());
 assert.equal(me().importPolicy,"industry");
}
`,context);
console.log("PASS: import priorities, customs capacity, method trade-off, financial fields and policy save/load.");

vm.runInContext(`
{
 scenario("PUN");
 const buyer=me(),seller=G.c.GBR;
 seller.rel.PUN=20;
 const province=provsOf("PUN")[0];
 bxUp(province,"depot");
 assert.match(proposeCommercialTransit(buyer,seller,"grain"),/agreed/);
 assert.deepEqual(buyer.commercialRoute.rights,["trade"]);
 const exports={GBR:{},PUN:{}},imports={GBR:{},PUN:{}};
 const buyerCash=buyer.tr,sellerCash=seller.tr;
 const receipts=bilateralOrders({GBR:{grain:100},PUN:{grain:0}},
  {GBR:{grain:0},PUN:{grain:100}},exports,imports);
 assert.ok(receipts[0].quantity>0);
 assert.equal(exports.GBR.grain,imports.PUN.grain);
 assert.ok(receipts[0].fee>0);
 assert.ok(Math.abs(buyerCash-buyer.tr-receipts[0].fee)<1e-7);
 assert.ok(Math.abs(seller.tr-sellerCash-receipts[0].fee)<1e-7);
 G.t=180;
 punjabHistoricalOutcome(buyer);
 assert.equal(buyer.historicalOutcome.status,"Independent");

 scenario("GBR");
 monthTick();
 assert.ok(provsOf("GBR").some(p=>p.localMarket?.grain));
}
`,context);
console.log("PASS: bilateral depot clearing, commercial rights, Punjab milestone and Britain market rollout.");

vm.runInContext(`
{
 for(const tag of ["JAP","PER","KOR","ETH","CHL","USA"]){
  scenario(tag);
  monthTick();
  assert.ok(provsOf(tag).some(p=>p.localMarket?.grain),tag);
 }
 scenario("MEX");
 const war=G.wars.find(w=>w.att.includes("MEX")||w.def.includes("MEX"));
 if(war){
  G.t=war.start+24;
  war.ws=0;
  G.c[war.att[0]].we=90;
  G.c[war.def[0]].we=90;
  const owners=G.plist.map(p=>p.o);
  for(let i=0;i<6;i++,G.t++)peaceMonth();
  assert.ok(!G.wars.includes(war));
  assert.deepEqual(G.plist.map(p=>p.o),owners);
  endWar(war,"att");
  assert.deepEqual(G.plist.map(p=>p.o),owners);
 }
}
`,context);
console.log("PASS: regional market starts and exhaustion-driven peace preserve legal ownership.");

vm.runInContext(`
scenario("PUN");
{
 const country=me(),p=provsOf("PUN")[0];
 const build=startBld(country,p,"school",true);
 assert.ok(build.ok);
 const project=p.build.at(-1);
 const ledger=constructionAccount(p,project);
 country.tr=0;
 investMonth();
 assert.equal(ledger.status,"Funding delayed");
 assert.equal(ledger.paid,0);
 country.tr=1e6;
 investMonth();
 assert.ok(ledger.paid>0);
 assert.equal(ledger.paid,sum(ledger.payments,x=>x.amount));
 unpack(pack());
 assert.equal(G.constructionLedger[ledger.id].paid,ledger.paid);
 const old=JSON.parse(readSaveJSON(pack()));
 old.saveSchema=2;
 old.constructionLedger[ledger.id].payments=[
  {month:0,payer:"PUN",account:"tr",amount:2,materials:{paper:3}},
  {month:1,payer:"PUN",account:"tr",amount:4,materials:{paper:5}},
  {month:12,payer:"PUN",account:"tr",amount:7,materials:{paper:11}}
 ];
 unpack(JSON.stringify(old));
 const rows=G.constructionLedger[ledger.id].payments;
 assert.equal(rows.length,2);
 assert.equal(rows[0].year,1836);
 assert.equal(rows[0].amount,6);
 assert.equal(rows[0].materials.paper,8);
 assert.equal(rows[1].year,1837);

}
`,context);
console.log("PASS: construction funding delays, payments and ledger persistence.");


vm.runInContext(`
scenario("GBR");
{
 const c=me(),p=P("DEL");
 assert.equal(indiaAdministrator(p),"East India Company");
 const budget=companyBudget(c);
 assert.ok(Math.abs(c.companyBudget.taxes-c.companyBudget.remitted-budget)<1e-7);
 G.t=COMPANY_TRANSFER;
 assert.equal(indiaAdministrator(p),"Crown administration");
 assert.equal(companyBudget(c),-c.companyBudget.transferred);
 assert.equal(c.companyBudget.reserve,0);
 assert.equal(p.o,"GBR");
 G.t=(1846-1836)*12+2;
 const punjab=G.c.PUN;
 punjab.rel.GBR=20;
 const priorTariff=punjab.tariff,priorOwner=P("LAH").o;
 EVENTS.find(event=>event.id==="companyLahore").ch.build("GBR").opts[0].run();
 assert.equal(c.commercialRoute.seller,"PUN");
 assert.deepEqual(c.commercialRoute.rights,["trade"]);
 assert.equal(P("LAH").o,priorOwner);
 assert.equal(punjab.tariff,priorTariff);
}
`,context);
console.log("PASS: Company revenue, Crown reserve transfer and unchanged province ownership.");


vm.runInContext(`
{
 for(const tag of ["FRA","PRU","AUS","SAR","RUS","SPA","OTT","EGY","BRA","MEX"]){
  scenario(tag);
  monthTick();
  const provinces=provsOf(tag);
  assert.ok(provinces.length);
  assert.ok(provinces.every(p=>p.localMarket?.grain&&p.landUse),tag);
  for(const good of PILOT_GOODS){
   const rows=provinces.map(p=>p.localMarket[good]);
   assert.ok(Math.abs(sum(rows,r=>r.received)+rows[0].unallocated-rows[0].available)<1e-7,tag);
  }
 }
 unpack(pack());
 assert.ok(provsOf("MEX").some(p=>p.localMarket?.grain));
 assert.match(pgEco(),/Provincial markets and households/);
}
`,context);
console.log("PASS: wider rollout across ten additional starts, allocation totals, save and Economy display.");
