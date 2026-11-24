"use strict";
/* ================= SOCIETY ================= */
const EMIG_DEST=[["USA",["NYC","CIN","STL","NEN","STL","CIN"]],["ARG",["BUE","BUE","COR"]],["BRA",["POA","RIO"]],["GBR",["SYD","TOR","CPT","NZL","WAU"]],["CHL",["SCL"]],["URU",["MVD"]]];
const FRONTIER_C=new Set(["USA","ARG","BRA","URU","CHL","TEX","CSA"]),FRONTIER_P=new Set(["SYD","TOR","QUE","CPT","NZL","WAU","OMS","IRK","ORE","PLN","ORG","RUP","PAT","SFO","CHH"]);
function accepted(c,cul){return cul===c.cul||c.acc.includes(cul);}
/* a state with a large minority must in time give it a place at court: once a culture is a sixteenth of the people of the connected home lands (overseas empire not counted) it is accepted, one a year; this also lets its provinces take part in industry */
function acceptCultures(){for(const tag in G.c){const c=G.c[tag];if(!c.alive||!c.civ||c.ai===false&&0)continue;const cs={};let tot=0;const seen=new Set([c.cap]),st=[c.cap];while(st.length){const id=st.pop();for(const v of ADJ[id]||[])if(!seen.has(v)&&P(v).o===tag){seen.add(v);st.push(v);}}for(const id of seen)if(P(id).o===tag)for(const q of P(id).pops){cs[q.c]=(cs[q.c]||0)+q.n;tot+=q.n;}if(tot<=0)continue;let best=null,bv=0;for(const k in cs){if(accepted(c,k))continue;const sh=cs[k]/tot;if(sh>=.06&&sh>bv){bv=sh;best=k;}}
 if(best){c.acc.push(best);if(tag===G.player)msg("politics","Your government now treats the "+best+" people as full citizens; they are a sizeable part of the nation.");}}}
function moveTo(p,q,t,amt){amt=Math.min(amt,q.n*.3);if(amt<.05)return 0;let d=p.pops.find(x=>x.t===t&&x.c===q.c);if(!d){d=mkPop(t,q.c,0,q.lit,Object.assign({},q.id));d.mil=q.mil;d.con=q.con;d.ld=q.ld;d.ed=q.ed;d.xd=q.xd;p.pops.push(d);}
 const w=amt/(d.n+amt);d.lit=d.lit*(1-w)+q.lit*w;d.mil=d.mil*(1-w)+q.mil*w;d.con=d.con*(1-w)+q.con*w;for(const k in d.id)d.id[k]=d.id[k]*(1-w)+(q.id[k]||0)*w;const share=amt/q.n,m=q.cash*share;d.cash+=m;q.cash-=m;
 for(const key of ["inc","_tax","_spent"]){
  const transferred=(q[key]||0)*share;
  d[key]=(d[key]||0)+transferred;
  q[key]=(q[key]||0)-transferred;
 }d.n+=amt;q.n-=amt;return amt;}
function shiftType(p,from,to,amt,needLit){if(amt<=0)return;const src=p.pops.filter(q=>q.t===from&&(!needLit||q.lit>=needLit));let tot=0;for(const q of src)tot+=q.n;if(tot<=0)return;amt=Math.min(amt,tot*.04);for(const q of src)moveTo(p,q,to,amt*q.n/tot);}
function perHead(p,t){let a=0,b=0;for(const q of p.pops)if(q.t===t){a+=q.inc;b+=q.n;}return b>0?a/b:0;}
function ideoTarget(c,q){const s=PTYPES[q.t].s,y=yearOf(G.t),acc=accepted(c,q.c),w={REA:.2,CON:.4,LIB:.15,SOC:0,ANL:0,COM:0,FAS:0};
 if(s===2){w.CON+=.3;w.REA+=.15;if(q.t==="CAP")w.LIB+=.4;}if(s===1){w.LIB+=.3*q.lit;w.CON+=.1;}if(s===0){w.REA+=(1-q.lit)*.3;w.CON+=.2;}
 if(!acc){w.LIB+=.3;w.CON-=.15;}if(c.ideo==="REA"&&q.con>4)w.LIB+=.2;
 const pain=(1-q.ld)+(1-q.ed)*.4;if(y>=1848){w.SOC+=(s===0?.25:.08)*(q.con/5)+(q.t==="CRA"?.2:0)+pain*.3*(s===0);w.ANL+=s===1?.05*(q.con/5):0;}
 if(y>=1875){w.COM+=s===0?(q.con/10)*(q.mil/6)*(q.t==="CRA"||q.t==="LAB"?.6:.25):0;}
 if(y>=1905){w.FAS+=(q.mil/10)*(s===1?.35:.15)+(c.we>40?.1:0);}
 if(c.civ===0&&y<1880){w.SOC*=.2;w.COM*=.1;w.LIB*=.5;}
 let t=0;for(const k of IK){w[k]=Math.max(0,w[k]);t+=w[k];}for(const k of IK)w[k]/=t;return w;}
function socMonth(){const yr=yearOf(G.t);
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;const N=c.stat.N||{};const pop=Math.max(1,c.stat.pop||1),rf=c.reforms;
  const cleShare=(N.CLE||0)/pop,burShare=(N.BUR||0)/pop,lit0=litOf(c);c.stat.lit=lit0;
  const grow=(c.civ?.0003:.00012)+techFx(c,"growth")+(rf.health||0)*.00004,milRef=techFx(c,"mil");
  const satisfy=(rf.vote+rf.press+rf.meet+rf.unions+rf.parties)*.12+((rf.wage||0)+(rf.hours||0)+(rf.safety||0)+(rf.unemp||0)+(rf.pension||0)+(rf.health||0))*.06;
  for(const p of G.plist){if(p.o!==tag)continue;const bx=p.bx||{};if(bx.court&&p.un>0)p.un=Math.max(0,p.un-2*bx.court);const flu=influenzaGrowthPenalty(p),u=p.un/100,pn=counts(p),lc=(pn.CLE||0)/Math.max(1,p.pop),bsl=bx.silo||0,bwa=bx.water||0,bpo=bx.police||0,bwo=bx.worship||0,bpr=bx.press||0;
   const litT=clamp(c.lit+(c.sp.edu-.5)*.15+(rf.school||0)*.1+techFx(c,"lit")*.45+Math.min(1.3,lc/.02)*.08+(p.uni||0)*.05+(bx.school||0)*.03,0,.97)/.9;
   const fr=FRONTIER_C.has(tag)||FRONTIER_P.has(p.id);if(fr){p._pop0=p._pop0||p.pop;if(p.pop<p._pop0*8){p.farmCap*=1.0016;}}
   for(const q of p.pops){const s=PTYPES[q.t].s,acc=accepted(c,q.c)?0:1;
    const ld=bsl&&q.ld<.8?Math.min(.8,q.ld+.12*bsl):q.ld;let g=grow+(p.hosp||0)*.00015+bwa*.0002+(ld-.85)*.002-(ld<.6?(.6-ld)*.01:0)+((FRONTIER_C.has(tag)||FRONTIER_P.has(p.id))&&p.pop<(p._pop0||p.pop)*8?.0014:0);g-=flu;if(q.t==="SLA")g-=.0003;q.n*=1+clamp(g,-.006,.0025);
    const lt=Math.min(.98,litT*LITM[q.t]*(acc?.7:1));q.lit+=(lt-q.lit)*.004*(modHas(c,"d1")?1.5:1);
    const ct=clamp(q.lit*6+(rf.press===2?1:rf.press===0?-.5:0)+(1-q.ed)*1.5*(s>0)+acc*1.5+(c.we>30?1:0)+bpr*.6+bpo*.1,0,10);q.con+=(ct-q.con)*.03;
    const ruling=c.ideo,mis=1-(q.id[ruling]||0),mt=clamp((1-ld)*7+(1-q.ed)*(s===0?.8:1.6)+c.we/25+acc*(c.cit==="culture"?2.5:c.cit==="limited"?1.2:.4)+mis*1.2+q.con*.15-satisfy+milRef*3+u*2+(q.t==="SLA"?2:0)-(p.hosp||0)*.4-bwa*.2-bpo*.35-bwo*(acc?.15:.3),0,10);
    q.mil+=(mt-q.mil)*.04;
    if((G.t+p.id.charCodeAt(1))%4===0){const it=ideoTarget(c,q);for(const k of IK)q.id[k]=householdPrecision(q.id[k]*.94+it[k]*.06);}}
   jobsMonth(c,p);}
  if(rf.slavery>=2)for(const p of provsOf(tag))for(const q of p.pops.filter(x=>x.t==="SLA"))moveTo(p,q,"FAR",q.n*.3);
  if(G.t%3===0)migrateIn(c);}
 if(G.t%3===0)emigrate();
 for(const p of G.plist){p.pops=p.pops.filter(q=>q.n>=.05);let s=0;for(const q of p.pops)s+=q.n;p.pop=s;}}
function litOf(c){let a=0,b=0;for(const p of G.plist)if(p.o===c.tag)for(const q of p.pops){a+=q.lit*q.n;b+=q.n;}return b?a/b:0;}
/* who does what work */
function jobsMonth(c,p){const n=counts(p),pop=Math.max(1,p.pop),inc=t=>perHead(p,t);
 let reqC=0,reqK=0;for(const f of p.factories){reqC+=f.lv*FAC_WORK*.9;reqK+=f.lv*FAC_WORK*.1;}
 if(p.ctl===p.o){
  provincialIndustryJobs(p,n,reqC,reqK);
 }else{
 if(n.CRA<reqC*.98){const gap=reqC-n.CRA;shiftType(p,"FAR",n.CRA<reqC?"CRA":"CRA",gap*.08);if(inc("ART")<inc("CRA"))shiftType(p,"ART","CRA",gap*.04);}else if(n.CRA>reqC*1.08)shiftType(p,"CRA",p.mine?"LAB":"FAR",(n.CRA-reqC)*.05);
 if(n.CLK<reqK)shiftType(p,"ART","CLK",(reqK-n.CLK)*.08,.2);else if(n.CLK>reqK*1.2)shiftType(p,"CLK","ART",(n.CLK-reqK)*.05);
 }
 if(p.mine){const fl=inc("FAR"),ll=inc("LAB"),pm=G.price[p.mine]/GOODS[p.mine].p; // men go down the pit only while the mineral sells well; a glutted mine lays men off and its workings fall into disuse
  if(ll>fl*1.12&&pm>.85)shiftType(p,"FAR","LAB",n.FAR*.008);else if(fl>ll*1.12||pm<.7)shiftType(p,"LAB","FAR",n.LAB*(pm<.7?.012:.003));if(n.LAB>p.mineCap)p.mineCap+=(n.LAB-p.mineCap)*.02;else if(n.LAB<p.mineCap*.9)p.mineCap-=(p.mineCap-n.LAB)*.01;}else if(n.LAB>pop*.03)shiftType(p,"LAB","FAR",n.LAB*.01);
 const ai=inc("ART"),fi=inc("FAR");if(ai>fi*2.2&&n.ART<pop*.12)shiftType(p,"FAR","ART",n.FAR*.0008);else if(ai<fi*1.1)shiftType(p,"ART","FAR",n.ART*.006);
 const cleT=pop*(c.civ?.02:.012)*(.5+.5*c.sp.edu);if(n.CLE<cleT)shiftType(p,"FAR","CLE",(cleT-n.CLE)*.01,.15);else if(n.CLE>cleT*1.15)shiftType(p,"CLE","ART",(n.CLE-cleT)*.02);
 const burT=pop*(c.civ?.011:.007)*(.5+.5*c.sp.adm);if(n.BUR<burT)shiftType(p,"ART","BUR",(burT-n.BUR)*.01,.25);else if(n.BUR>burT*1.15)shiftType(p,"BUR","ART",(n.BUR-burT)*.02);
 const capT=pop*(c.civ?.004+facLvl(p)*.0004:.001);if(n.CAP<capT&&ECON[c.econ].cap>0)shiftType(p,"ART","CAP",(capT-n.CAP)*.01,.3);
 const solT=soldiersWanted(c,p),offT=solT*.06;if(n.SOL<solT)shiftType(p,"FAR","SOL",(solT-n.SOL)*.2);else if(n.SOL>solT*1.1)shiftType(p,"SOL","FAR",(n.SOL-solT)*.2);
 if(n.OFF<offT)shiftType(p,"ART","OFF",(offT-n.OFF)*.05,.2);}
const facLvl=p=>sum(p.factories,f=>f.lv);
function soldiersWanted(c,p){const need=(c._men||0)*1.08,pop=Math.max(1,c.stat.pop||1);return need*p.pop/pop;}
/* within a country: toward better pay */
function migrateIn(c){const ps=provsOf(c.tag).filter(p=>p.pops.length&&p.ctl===p.o);for(const p of ps){const ph=perHead(p,"FAR")+perHead(p,"CRA")*.5;let best=null,bv=ph*1.25;
  for(const id of ADJ[p.id]){const o=G.prov[id];if(!o||o.o!==c.tag||!o.pops.length)continue;const v=perHead(o,"FAR")+perHead(o,"CRA")*.5+(facLvl(o)*FAC_WORK>counts(o).CRA?bv*.2:0);if(v>bv){bv=v;best=o;}}
  if(!best)continue;for(const q of p.pops){if(PTYPES[q.t].s!==0||q.t==="SOL"||q.t==="SLA")continue;const amt=q.n*.002;if(amt<.05)continue;const dt=q.t==="LAB"&&!best.mine?"FAR":q.t;
   let d=best.pops.find(x=>x.t===dt&&x.c===q.c);if(!d){d=mkPop(dt,q.c,0,q.lit,Object.assign({},q.id));best.pops.push(d);}d.n+=amt;q.n-=amt;}}}
/* abroad: the hungry and the persecuted leave for the Americas and the settler colonies */
function emigrate(){const dests=EMIG_DEST.filter(([t])=>G.c[t]&&G.c[t].alive).flatMap(([t,ps])=>ps.filter(id=>P(id).o===t).map(id=>P(id)));if(!dests.length)return;if(G.gwDone&&G.gwDone.liberty&&P("NYC").o)for(let i=0;i<4;i++)dests.push(P("NYC"));
 const out=[];for(const p of G.plist){if(!p.o)continue;const c=G.c[p.o];if(EMIG_DEST.some(([t])=>t===p.o))continue;
  for(const q of p.pops){if(PTYPES[q.t].s!==0||q.t==="SOL"||q.t==="SLA")continue;const push=(q.ld<.75?(.75-q.ld)*2:0)+(q.ed<.35?(.35-q.ed)*1.2:0)+(accepted(c,q.c)?0:.3)+q.mil/20;if(push<.15)continue;const rate=.0009*push*(c.civ?1:.25)*(yearOf(G.t)>1880?1.6:1),amt=q.n*rate;if(amt<.1)continue;q.n-=amt;out.push([p,q,amt]);}}
 if(!out.length)return;
 for(const[p,q,amt]of out){const d=dests[Math.floor(rng()*dests.length)],t=d.factories.length&&rng()<.4?"CRA":"FAR";let x=d.pops.find(z=>z.t===t&&z.c===q.c);if(!x){x=mkPop(t,q.c,0,q.lit,Object.assign({},q.id));d.pops.push(x);}x.n+=amt;p.emigrantFlow=(p.emigrantFlow||0)+amt;d.immigrantFlow=(d.immigrantFlow||0)+amt;G.c[d.o].stat.immig=(G.c[d.o].stat.immig||0)+amt;}}
/* ================= RESEARCH ================= */
/* A5: research weights (grid-searched); researchStatus/costStatus are flat for now and A6 replaces them. */
const RP_W={lit:6,clergy:4,pop:8,fac:1.6,uni:3,sch:1,ucap:4,utail:.35};
function rpOf(c){const N=c.stat.N||{},pop=Math.max(1,c.stat.pop||1),cle=Math.min(1,(N.CLE||0)/pop/.02),lit=c.stat.lit||c.lit;
 let uni=0,fl=0,sch=0;for(const p of G.plist)if(p.o===c.tag){uni+=p.uni||0;sch+=bxl(p,"school");for(const f of p.factories)fl+=f.lv;}
 return(3+RP_W.lit*lit+RP_W.clergy*cle*lit+Math.log10(1+pop/1000)*RP_W.pop+RP_W.fac*Math.sqrt(fl)+(Math.min(uni,RP_W.ucap)+RP_W.utail*Math.max(0,uni-RP_W.ucap))*RP_W.uni+sch*RP_W.sch*lit+(c._bx?c._bx.rp:0))*researchStatus(c)*(1+techFx(c,"research")+(c.gwx&&c.gwx.research||0))*(c.reforms.press===2?1.08:1);}
function techCost(c,t){const ahead=Math.max(0,t.y-yearOf(G.t));return Math.round(t.c*(1+ahead*.25)*costStatus(c));}
function techAvail(c,t){return!c.tech[t.id]&&t.y<=yearOf(G.t)+4;}
function pickTech(c){const L=TECHS.filter(t=>techAvail(c,t));if(!L.length)return null;const w={army:1,navy:.7,com:1,cul:1,ind:1.3};let lv=0;for(const p of G.plist)if(p.o===c.tag)for(const f of p.factories)lv+=f.lv;Object.assign(w,c.aiResearchBias);const mt=lv>=5?METH_TECH:null; /* a nation with mills wants the techs that let them be modernized */
 L.sort((a,b)=>techCost(c,a)/(w[a.f]*(mt&&mt.has(a.id)?4:1))-techCost(c,b)/(w[b.f]*(mt&&mt.has(b.id)?4:1)));return L[0].id;}
/* ---- research: one rule for every nation. Points always bank (c.rp), whether or not a study is under way. A study that is finished,
 * or has become invalid (already known, no longer in the window), is replaced by the next valid entry of the nation's queue c.resQ
 * (up to RES_QMAX techs); an idle AI picks with pickTech. Leftover points carry over, so banked points that cover the next study complete
 * it the same month, cascading no further than the queue length (bounded loop). A human's invalid queue entries are reported. ---- */
const RES_QMAX=5;
/* may tech t be studied by c, given the studies already ahead of it (the current one and earlier queue entries)? The only prerequisite
   the tech data has is its date window; a `pre` list, if a tech ever gets one, is satisfied by known techs or earlier entries. */
function techReady(c,id,ahead){const t=TF[id];return!!t&&!c.tech[id]&&!ahead.includes(id)&&t.y<=yearOf(G.t)+4&&(t.pre||[]).every(x=>c.tech[x]||ahead.includes(x));}
/* the queue as a chain: every entry valid after the ones before it */
function resChainOk(c,cur,list){const ahead=cur?[cur]:[];for(const id of list){if(!techReady(c,id,ahead))return false;ahead.push(id);}return true;}
function researchMonth(){for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;c.stat.rp=rpOf(c);c.rp+=c.stat.rp;
  const q=c.resQ||(c.resQ=[]);
  for(let n=0;n<=RES_QMAX;n++){
   if(c.res&&c.tech[c.res])c.res=null;
   while(!c.res&&q.length){const id=q.shift();if(techReady(c,id,[]))c.res=id;else if(tag===G.player)msg("science","The queued study "+tNm((TF[id]||{n:String(id)}).n)+" can no longer be started and is dropped from the queue.");}
   if(!c.res&&c.ai)c.res=pickTech(c);
   if(!c.res)break;
   const t=TF[c.res],cost=techCost(c,t);if(c.rp<cost)break;
   c.rp-=cost;c.tech[t.id]=Math.max(1,G.t);TECH_FX.delete(c.tech);if(t.fx.unit)c.units=(c.units||[]).concat(t.fx.unit);if(tag===G.player)msg("science","Our scholars master "+tNm(t.n)+".");c.res=null;}}}

function influenzaGrowthPenalty(p) {
 return G.t < (G.influenzaUntil || 0) ? .0014 / (1 + .35*(p.hosp||0)) : 0;
}


// Player countries use the detailed provincial economy. Punjab also uses it in AI simulations.

const CLERK_LITERACY=.25;
function provincialIndustryJobs(p,workforce,craftJobs,clerkJobs){
 const craftVacancies=craftJobs-workforce.CRA;
 const clerkVacancies=clerkJobs-workforce.CLK;
 if(craftVacancies>0){
  shiftType(p,"FAR","CRA",craftVacancies*.08);
  const remaining=craftJobs-counts(p).CRA;
  if(perHead(p,"ART")<perHead(p,"CRA"))shiftType(p,"ART","CRA",remaining*.04);
 }else shiftType(p,"CRA",p.mine?"LAB":"FAR",-craftVacancies*.05);
 if(clerkVacancies>0)shiftType(p,"ART","CLK",clerkVacancies*.08,CLERK_LITERACY);
 else shiftType(p,"CLK","ART",-clerkVacancies*.05);
}
function provincialHouseholds(p){
 const workforce=counts(p),capacity=facLvl(p)*FAC_WORK;
 return {
  population:sum(p.pops,q=>q.n),
  subsistence:workforce.FAR,
  craft:workforce.CRA,
  clerks:workforce.CLK,
  craftVacancies:Math.max(0,capacity*.9-workforce.CRA),
  clerkVacancies:Math.max(0,capacity*.1-workforce.CLK),
  qualifiedArtisans:sum(p.pops,q=>q.t==="ART"&&q.lit>=CLERK_LITERACY?q.n:0),
  income:sum(p.pops,q=>q.inc||0),
  tax:sum(p.pops,q=>q._tax||0),
  spending:sum(p.pops,q=>q._spent||0)
 };
}
