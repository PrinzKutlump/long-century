"use strict";
/* C1: Tanzimat on the C0 programme engine. One template, tanzimatDef(opts), builds the six-phase reform chain; it is registered for the Ottoman
 * Empire and reused for Egypt and Persia with their own dates, group sizes and patrons. Costs are money (tr) and research points (rp) only.
 * Same rules for every nation: the AI runs the C0 evaluator over these cards, the player picks the same cards; success is rolled, never scripted.
 * Groups (c.prog[id].support) are each group's backing for reform, 0-100. The debt trap and the "weak empire" secession rule are in this file too. */
const TANZ_SECESSION_NEED=2;
const tzSup=(s,g)=>s.support[g]==null?50:s.support[g];
const tzAvg=(s,gs)=>gs.length?gs.reduce((a,g)=>a+tzSup(s,g),0)/gs.length:50;
const tzNon=c=>(q=>!accepted(c,q.c)); /* test for pops of communities the state does not accept */
const tzRel=(c,t,d)=>{if(t&&G.c[t]&&G.c[t].alive&&t!==c.tag){c.rel[t]=(c.rel[t]||0)+d;G.c[t].rel[c.tag]=(G.c[t].rel[c.tag]||0)+d;}};
const tzMod=(c,n)=>{if(!c.civ)c.modern=Math.min(100,(c.modern||0)+n);};
const tzUn=(c,d)=>{for(const p of provsOf(c.tag))p.un=clamp((p.un||0)+d,0,100);};
/* odds of a card: a base chance moved by the backers against the resisters, by momentum, by earlier stalls and by foreign loans already taken */
const tzOdds=(base,pro,con)=>(c,s)=>clamp(base+.05+(tzAvg(s,pro)-tzAvg(s,con))/250+(s.momentum-50)/250-.05*s.stall+(s.flags.loan?.05:0),.08,.92);
/* ---- the "weak empire" rule (owner decision 2): a community breaks away only if the state is weak: at least two of five tests ---- */
function stateWeakness(c,cul,patron){
 const r=[],inc=Math.max(1,c.stat.inc||1);
 if(c.lostLand!=null&&G.t-c.lostLand<=60)r.push("lost land in a war within five years");
 const un=provsOf(c.tag).reduce((a,p)=>a+(p.un||0),0)/Math.max(1,provsOf(c.tag).length);
 if((c.we||0)>50||un>=25)r.push("war exhaustion or unrest is high");
 if(c.dflt&&G.t-c.dflt.t<=120)r.push("defaulted on its debt");
 if(patron&&G.c[patron]&&G.c[patron].alive&&armyStr(c.tag)<.5*armyStr(patron))r.push("army under half the patron's");
 const pr=c.prog&&c.prog[TANZ_ID[c.tag]],gs=(pr&&pr.flags.guar)||{};
 if(patron&&gs[cul]===patron)r.push("a Great Power stands behind the community");
 return r;}
const TANZ_ID={OTT:"tanzimat",EGY:"tanzimat_egy",PER:"tanzimat_per"};
const TANZ_ORTHODOX=["greek","bulgarian","southslav","armenian","serbian"];
/* a revolt that wins on the field only breaks the state away when it is weak; otherwise it is put down. Used by the rebel-victory path in mil.js. */
function secessionBlocked(c,cul){
 const pa=(TANZ_PATRON[c.tag]||{})[cul]||(TANZ_ORTHODOX.includes(cul)?"RUS":null);
 return stateWeakness(c,cul,pa).length<TANZ_SECESSION_NEED;}
const TANZ_PATRON={OTT:{greek:"RUS",bulgarian:"RUS",southslav:"RUS",armenian:"RUS",albanian:"AUS",arab:"GBR",maghrebi:"FRA"},EGY:{sudanese:"GBR",arab:"GBR"},PER:{azeri:"RUS"}};
/* ---- the template ---- */
function tanzimatDef(o){
 const comm=Object.keys(o.comm),k=o.k,id=o.id,cs=v=>{const m={};for(const g of comm)m[g]=v;return m;};
 const merge=(a,b)=>Object.assign({},a,b),cm=comm;
 const phase=(i,n,d,cond,choices)=>({id:"p"+(i+1),n,d,from:o.from[i],choices,cond:(c,s)=>{const h=s.hist[s.hist.length-1];if(h&&!h.win&&G.t-h.t<12)return"The court needs a year after the last failed attempt.";return cond(c,s);}});
 const peace=c=>c.war.length?"Not in the middle of a war.":(c.we||0)>40?"The army and treasury are too worn out.":"";
 return{id,n:o.n,auto:1,ok:c=>o.tags.includes(c.tag)&&c.alive,groups:merge({ulema:60,ayan:35,army:45,bureaucrats:65},o.groups),lean:o.lean,stallMax:4,template:1,patrons:o.comm,
 phases:[
 phase(0,o.p1,"Legal equality and fixed taxes. Winners: officials and the communities. Losers: tax-farmers and notables. Gain: administration, calmer minorities.",peace,[
  {id:"full",n:"Proclaim the edict in full",cost:{tr:12000*k,rp:60},odds:tzOdds(.5,["bureaucrats","army"],["ayan","ulema"]),gain:45,loss:12,mom:10,
   sup:merge({bureaucrats:10,ayan:-12,ulema:-5},cs(8)),win:c=>{c.gwx=c.gwx||{};c.gwx.admin=(c.gwx.admin||0)+.1;progMilitancy(c,-1.5,tzNon(c));tzMod(c,3);},fail:c=>{progMilitancy(c,.5,tzNon(c));}},
  {id:"slow",n:"Phase it in, province by province",cost:{tr:6000*k,rp:30},odds:tzOdds(.62,["bureaucrats"],["ayan"]),gain:28,loss:6,mom:6,
   sup:merge({bureaucrats:5,ayan:-5},cs(4)),win:c=>{c.gwx=c.gwx||{};c.gwx.admin=(c.gwx.admin||0)+.05;progMilitancy(c,-.8,tzNon(c));},fail:()=>{}}]),
 phase(1,o.p2,"A conscript army after the old corps. The notables resent local levies. Feeds the modernisation Army track.",peace,[
  {id:"conscript",n:"Conscription and a standing army",cost:{tr:40000*k,rp:80},odds:tzOdds(.45,["army","bureaucrats"],["ayan","ulema"]),gain:50,loss:18,mom:10,
   sup:{army:12,ayan:-15,ulema:-5},win:c=>{c.gwx=c.gwx||{};c.gwx.mil=(c.gwx.mil||0)+.05;progMilitancy(c,.4,q=>accepted(c,q.c)&&q.t==="FAR");tzMod(c,4);},fail:c=>{tzUn(c,3);}},
  {id:"levy",n:"Levies raised through the notables",cost:{tr:15000*k,rp:30},odds:tzOdds(.6,["army","ayan"],[]),gain:25,loss:5,mom:6,
   sup:{army:4,ayan:5},win:c=>{tzMod(c,2);},fail:()=>{}}]),
 phase(2,o.p3,"Salaried collectors replace tax-farming. Revenue dips for two or three years, then rises.",c=>c.war.length?"Not in the middle of a war.":"",[
  {id:"centralise",n:"Centralise now",cost:{tr:50000*k,rp:60},odds:tzOdds(.4,["bureaucrats","army"],["ayan"]),gain:55,loss:25,mom:10,
   sup:{ayan:-25,bureaucrats:10},win:(c,s)=>{s.flags.dip={until:G.t+30,rate:.06};s.flags.taxGain=.08;tzMod(c,4);},fail:c=>{progMilitancy(c,.8,()=>true);tzUn(c,4);}},
  {id:"notables",n:"Deal with the notables first",cost:{tr:20000*k,rp:40},odds:tzOdds(.6,["ayan"],["bureaucrats"]),gain:30,loss:6,mom:6,
   sup:{ayan:10,bureaucrats:-3},win:(c,s)=>{s.flags.dip={until:G.t+12,rate:.03};s.flags.taxGain=.04;tzMod(c,2);},fail:()=>{}}]),
 phase(3,o.p4,"Equality of non-Muslims, pressed by the Great Powers after the Crimean settlement. Gain: Great Power goodwill and less pretext for intervention. Cost: the clergy.",c=>c.war.length?"Not in the middle of a war.":"",[
  {id:"equal",n:"Declare full equality",cost:{tr:20000*k,rp:80},odds:tzOdds(.5,["bureaucrats",...cm],["ulema"]),gain:50,loss:15,mom:10,
   sup:merge({ulema:-20},cs(12)),win:c=>{progMilitancy(c,-2,tzNon(c));progMilitancy(c,.5,q=>accepted(c,q.c));for(const t of ["GBR","FRA","RUS"])tzRel(c,t,10);tzMod(c,3);},fail:c=>{progMilitancy(c,.5,()=>true);}},
  {id:"limited",n:"Equality on paper, enforced locally",cost:{tr:8000*k,rp:30},odds:tzOdds(.62,["bureaucrats"],["ulema"]),gain:25,loss:5,mom:6,
   sup:merge({ulema:-5},cs(4)),win:c=>{progMilitancy(c,-.7,tzNon(c));for(const t of ["GBR","FRA","RUS"])tzRel(c,t,4);},fail:()=>{}}]),
 phase(4,o.p5,"Loans and the Bank. Borrowing speeds reform but every loan adds debt service; a default lets the creditors take a share of customs. The treasury route is slower and safe.",()=>"",[
  {id:"borrow",n:"Borrow abroad to fund the reforms",cost:{tr:0,rp:40},odds:(c,s)=>{const inc=Math.max(1,c.stat.inc||1);if(c.tr>inc*6)return .1;return clamp(.75-1.2*(c.debt||0)/(inc*12)+(s.momentum-50)/250,.1,.85);},gain:40,loss:8,mom:15,
   sup:{bureaucrats:5},win:(c,s)=>{const L=Math.round(Math.max(1,c.stat.inc||1)*18);c.debt=(c.debt||0)+L;c.tr+=L;s.flags.loan=(s.flags.loan||0)+L;s.flags.loanT=G.t;for(const t of ["GBR","FRA"])tzRel(c,t,6);},fail:c=>{tzRel(c,"GBR",-3);}},
  {id:"treasury",n:"Fund the reforms from the treasury and customs",cost:{tr:25000*k,rp:20},odds:tzOdds(.7,["bureaucrats"],[]),gain:25,loss:4,mom:6,
   sup:{bureaucrats:3},win:()=>{},fail:()=>{}}]),
 phase(5,o.p6,"A constitution. Parliament brings long-run legitimacy and the risk of a nationalist split; autocratic reform keeps control but the minorities' and liberals' militancy persists.",peace,[
  {id:"parliament",n:"Parliament",cost:{tr:30000*k,rp:100},odds:tzOdds(.45,["bureaucrats","army",...cm],["ulema","ayan"]),gain:60,loss:20,mom:10,
   sup:merge({ulema:-10,ayan:-8,bureaucrats:5},cs(8)),win:c=>{if(c.gov==="abs"){c.gov="const";}c.reforms.parties=Math.max(2,c.reforms.parties||0);progMilitancy(c,-2,tzNon(c));progMilitancy(c,1,q=>!accepted(c,q.c)&&q.mil>=4);tzUn(c,-4);},fail:c=>{tzUn(c,4);}},
  {id:"autocratic",n:"Autocratic reform, no parliament",cost:{tr:15000*k,rp:40},odds:tzOdds(.6,["army","bureaucrats"],[]),gain:30,loss:5,mom:6,
   sup:{army:4},win:c=>{c.gwx=c.gwx||{};c.gwx.admin=(c.gwx.admin||0)+.05;tzUn(c,-3);},fail:()=>{}}])],
 /* monthly: the revenue dip then rise of the vilayet reform, and the creditors' share of customs after a default that followed a Tanzimat loan */
 tick:(c,s)=>{const f=s.flags;
  /* a Great Power patron takes up a community's cause when its movement is broad and the patron is hostile to us; it lets go once the community is calm */
  f.guar=f.guar||{};for(const g of comm){const pa=o.comm[g];if(!pa||!G.c[pa]||!G.c[pa].alive||!(G.gp||[]).includes(pa))continue;let m=0;for(const p of provsOf(c.tag))for(const q of p.pops)if(q.c===g&&q.mil>m)m=q.mil;
   if(!f.guar[g]&&m>=7&&(G.c[pa].rel[c.tag]||0)<-20){f.guar[g]=pa;msg("diplomacy",G.c[pa].n+" takes up the cause of the "+g+" community in "+c.n+".");}else if(f.guar[g]&&m<4)delete f.guar[g];}
  if(f.dip){if(G.t<f.dip.until){c.tr-=Math.min(Math.max(0,c.tr),f.dip.rate*Math.max(0,c.stat.inc||0));}else{c.gwx=c.gwx||{};c.gwx.tax=(c.gwx.tax||0)+(f.taxGain||0);f.dip=0;f.taxGain=0;}}
  if(f.loanT!=null&&!f.admin&&c.dflt&&c.dflt.t>=f.loanT){f.admin=G.t;msg("diplomacy","Creditors take a share of "+c.n+"'s customs: a debt administration is set up.");}
  if(f.admin&&G.t-f.admin<240)c.tr-=Math.min(Math.max(0,c.tr),.3*Math.max(0,c.stat.tariffs||0));}};}
const TANZ_OTT=tanzimatDef({id:"tanzimat",n:"The Tanzimat",tags:["OTT"],k:1,lean:{OTT:10},from:[1839,1841,1845,1856,1854,1876],
 comm:{greek:"RUS",bulgarian:"RUS",southslav:"RUS",armenian:"RUS",albanian:"AUS",arab:"GBR",maghrebi:"FRA"},
 groups:{greek:50,bulgarian:40,southslav:40,armenian:55,albanian:35,arab:40,maghrebi:40},
 p1:"Gulhane Edict",p2:"New army and conscription",p3:"Provincial reform (vilayet law)",p4:"Reform Edict",p5:"Loans and the Bank",p6:"Constitution"});
const TANZ_EGY=tanzimatDef({id:"tanzimat_egy",n:"Egyptian reform",tags:["EGY"],k:.35,lean:{EGY:6},from:[1840,1842,1850,1856,1860,1876],
 comm:{sudanese:"GBR"},groups:{sudanese:30,ulema:55,army:60},
 p1:"Fixed taxes and equal justice",p2:"Conscript army",p3:"Provincial reform",p4:"Equality edict",p5:"Loans and the Bank",p6:"Constitution"});
const TANZ_PER=tanzimatDef({id:"tanzimat_per",n:"Persian reform",tags:["PER"],k:.15,lean:{PER:3},from:[1848,1850,1858,1870,1872,1906],
 comm:{azeri:"RUS"},groups:{azeri:45,ulema:70,ayan:45,army:40},
 p1:"Reform of the court and taxes",p2:"New army",p3:"Provincial reform",p4:"Equality edict",p5:"Loans and the Bank",p6:"Constitution"});
for(const d of [TANZ_OTT,TANZ_EGY,TANZ_PER])progRegister(d);
