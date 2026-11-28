"use strict";
/* ================= ECONOMY ================= */
const RAILK=.05,TIER=["l","e","x"];
const GOOD_TECHS=Object.fromEntries(GK.filter(g=>GOODS[g].y)
 .map(g=>[g,TECHS.filter(tech=>tech.fx.good===g).map(tech=>tech.id)]));
function goodOK(c,g){
 if(!GOODS[g].y)return true;
 const unlocks=GOOD_TECHS[g];
 for(const id of unlocks)if(Object.hasOwn(c.tech,id))return true;
 return false;
}
function tierCost(c,s,T,bp){let v=0;const n=NEEDS[s][T];for(const g in n)if(goodOK(c,g))v+=n[g]*bp[g];return v;}
const IMPORT_POLICIES=["balanced","industry","essentials"];
function importOrderShare(country,good){
 const policy=country.importPolicy||"balanced";
 if(policy==="balanced")return 1;
 const priority=policy==="industry"?["machinery","iron","coal","steel","timber"]:["grain","livestock","fish","fruit","fabric"];
 const centres=Math.max(0,country._bx?.cust||0);
 return priority.includes(good)?1:Math.min(1,.35+centres);
}
function methodOperation(factory,fill){
 const method=factory.activeMethod??factory.m??0;
 if(factory.activeMethod==null||method===0)return 1;
 // Modern equipment depends on replacement parts. Conventional equipment does not.
 return .55+.45*clamp(fill.machinery??1,0,1);
}
function buyPrice(c,g){return G.price[g]*(1+c.tariff*((c.impSh&&c.impSh[g])||0));}
/* mobilized conscripts are prime-age men with their carts and horses: the harvest suffers about 3x their share of the headcount */
function mobLoss(c,p,w){const m=c.mob;if(!m||!m.st||m.st===3)return 1;const t=m.tk[p.id];if(!t)return 1;const k=(t[0]+t[1])/Math.max(1,w+t[0]+t[1]);return Math.max(.5,1-2.2*k);}
function counts(p){const n={};for(const k of PTK)n[k]=0;for(const q of p.pops)n[q.t]+=q.n;return n;}
function occMult(p){return p.ctl&&p.ctl!==p.o?.4:1;}
function rgoK(g){return(G.rgoK&&G.rgoK[g])||1;}
/* ---- one month of production, trade, incomes and spending for the whole world ---- */
function econMonth(warm){
 const territories=new Map();
 for(const p of G.plist){
  if(!territories.has(p.o))territories.set(p.o,[]);
  territories.get(p.o).push(p);
 }
 const provinces=tag=>territories.get(tag)||[];
 const yr=yearOf(G.t),S={},D={},GOV={};bxAgg();
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;S[tag]={};D[tag]={};GOV[tag]={};for(const g of GK){S[tag][g]=0;D[tag][g]=0;GOV[tag][g]=0;}
  c.bp={};for(const g of GK)c.bp[g]=buyPrice(c,g);c.tc=[0,1,2].map(s=>TIER.map(T=>tierCost(c,s,T,c.bp)));
  c.fx={rgo:techFx(c,"rgo")+(c.civ?.0025*(yr-1836):.0008*(yr-1836)),fac:techFx(c,"fac")};c.fill=c.fill||{};c.capPool=0;}
 const jobs=[],PE={};for(const g of GK)PE[g]=clamp(Math.pow(G.price[g]/GOODS[g].p,1),.45,1.5); // land and mines are worked harder when prices pay and left fallow when they do not
 /* A3: one rule for every nation. The household market runs in every owned province of every living nation (the observer seat and the Punjab pilot no longer choose who gets it). */
 const participants=warm?[]:Object.keys(G.c).filter(tag=>G.c[tag].alive);
 const pilot=participants.flatMap(provinces);
 const pilotSupply={},pilotDemand={};
 for(const p of pilot){
  pilotSupply[p.id]={grain:0,timber:0,fabric:0,clothes:0,livestock:0};
  pilotDemand[p.id]={grain:0,timber:0,fabric:0,clothes:0,livestock:0};
 }
 /* production */
 for(const p of G.plist){if(!p.o||!G.c[p.o].alive)continue;const c=G.c[p.o],s=S[p.o],n=counts(p),rail=RAILK*p.rail,om=occMult(p),un=1-p.un/200;p._n=n;
  const ps=pilotSupply[p.id],previous=ps&&{grain:s.grain,timber:s.timber,fabric:s.fabric,clothes:s.clothes,livestock:s.livestock};
  const farmW=n.FAR+n.SLA+(p.mine?0:n.LAB*.6),mineW=p.mine?n.LAB:0;p._out={};
  {
   const capacity=p.farm?Math.max(0,p.farmCap):0;
   const utilisation=Math.min(capacity,farmW);
   const subsistence=farmW?utilisation*n.FAR/farmW:0;
   p.landUse={capacity,subsistence,commercial:utilisation-subsistence,fallow:capacity-utilisation};
  }
  const mq=mobLoss(c,p,farmW+(p.mine?n.LAB:0));
  if(p.farm&&farmW>0){const q=RGO_OUT[p.farm]*rgoK(p.farm)*p.farmCap*Math.pow(farmW/p.farmCap,.7)*TERRAIN[p.t].farm*(1+.12*(p.irr||0))*(1+c.fx.rgo+rail)*om*un*mq*PE[p.farm];
   if(p.farm!=="grain"&&p.t!=="d"&&!warm){const rel=(G.price.grain/GOODS.grain.p)/(G.price[p.farm]/GOODS[p.farm].p),tgt=clamp((rel-1)*.6,0,.7);p.sw=(p.sw||0)+(tgt-(p.sw||0))*.08;}else p.sw=0;
   const sw=p.sw||0,qm=q*(1-sw),qg=q*sw*(RGO_OUT.grain*rgoK("grain"))/(RGO_OUT[p.farm]*rgoK(p.farm));s[p.farm]+=qm;p._out.farm=qm;if(qg>0){s.grain+=qg;p._out.grain=qg;}}
  if(p.mine&&mineW>0){const q=RGO_OUT[p.mine]*rgoK(p.mine)*p.mineCap*Math.pow(mineW/p.mineCap,.7)*(1+.15*(p.minew||0))*(1+c.fx.rgo+rail)*om*un*mq*PE[p.mine];s[p.mine]+=q;p._out.mine=q;}
  let reqC=0,reqK=0;for(const f of p.factories){reqC+=f.lv*FAC_WORK*.9;reqK+=f.lv*FAC_WORK*.1;}
  const staff=reqC?Math.min(1,n.CRA/reqC)*(.7+.3*Math.min(1,n.CLK/Math.max(.01,reqK))):0;p._staff=staff;p._craUn=reqC?Math.max(0,n.CRA-reqC)/Math.max(.01,n.CRA):1;
  for(const f of p.factories){
   if(f.lv<=0||!goodOK(c,f.g)){
    f._out=0;f._e=0;f._im=1;f._pr=0;f._limitingInput=null;f._inputFill=0;
    continue;
   }
   const r=RECIPE[f.g];let fi=1;f._limitingInput=null;
   for(const x in r.I){const fill=c.fill[x]??1;if(fill<fi){fi=fill;f._limitingInput=x;}}
   f._inputFill=fi;
   const e=staff*Math.max(.05,fi)*om*un,mult=1+c.fx.fac+rail*.5+(p.id===c.cap&&c.gwx&&c.gwx.capfac||0)+.08*bxl(p,"power");f._e=e;const method=f.activeMethod??f.m??0,mm=1+.2*method,im=mm*(1-.1*method);f._im=im;f._out=r.O*f.lv*e*mult*mm*methodOperation(f,c.fill);s[f.g]+=f._out;for(const x in r.I)D[p.o][x]+=r.I[x]*f.lv*e*im;}
  p._art={};if(n.ART>0){const W=p.artW||G.artW;for(const g in W){const w=W[g];if(w<=0||!goodOK(c,g))continue;const r=RECIPE[g],k=n.ART*w*G.artK/FAC_WORK*om;const o=r.O*k;p._art[g]=o;s[g]+=o;for(const x in r.I)D[p.o][x]+=r.I[x]*k*1.1;}}
  if(previous)for(const g of PILOT_GOODS)pilotSupply[p.id][g]=s[g]-previous[g];}
 /* demand: needs, bought with last month's money */
 G._popD={};for(const g of GK)G._popD[g]=0;
 for(const p of G.plist){if(!p.o||!G.c[p.o].alive)continue;const c=G.c[p.o],d=D[p.o];
  for(const q of p.pops){const s=PTYPES[q.t].s,tc=c.tc[s];let B=Math.max(0,q.cash)+Math.max(0,q.inc-(q._tax||0))*.85;q._a=[0,0,0];
   for(let i=0;i<3;i++){const cost=tc[i]*q.n;if(cost<=0){q._a[i]=1;continue;}let a=Math.min(1,B/cost);B-=a*cost;if(i===2&&s>0&&B>0&&a>=1){const ex=Math.min(s===2?3:1,B*.35/cost);a+=ex;B-=ex*cost;}q._a[i]=a;if(a<=0)continue;const nd=NEEDS[s][TIER[i]];for(const g in nd)if(goodOK(c,g)){const v=nd[g]*q.n*a;d[g]+=v;G._popD[g]+=v;if(pilotDemand[p.id]&&Object.hasOwn(pilotDemand[p.id],g))pilotDemand[p.id][g]+=v;}if(a<1)break;}}}
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;const gd=govDemand(c,provinces(tag));for(const g in gd){GOV[tag][g]+=gd[g];D[tag][g]+=gd[g];}}
 /* the market: home supply first, then the world */
 const SPH_CALL=1; // first call, not a monopoly: a sphere partner may draw up to this many times its pro-rata share of the other's surplus before the world market sees it
 /* sphere markets: a Great Power and the civilized states in its sphere (an unwesternized state keeps its markets closed) are one home market. Each side's surplus goes first to the other's shortfall, at no tariff, before anything reaches the world market. */
 const EXs={},IMs={};for(const tag in S){EXs[tag]={};IMs[tag]={};}
 {const SPM=[];for(const m of Object.values(G.c)){if(!m.alive||!m.sphere||!S[m.tag])continue;const L=G.c[m.sphere];if(L&&L.alive&&L.tag!==m.tag&&S[L.tag]&&!atWarWith(m,L)&&m.civ)SPM.push([L.tag,m.tag]);}
  if(SPM.length)for(const g of GK){let wd0=0;for(const t in S)wd0+=Math.max(0,D[t][g]-S[t][g]*(G.c[t].access==null?1:G.c[t].access));for(const[a,b]of SPM)for(const[x,y]of[[a,b],[b,a]]){const ax=G.c[x].access==null?1:G.c[x].access,ay=G.c[y].access==null?1:G.c[y].access;
   const sur=Math.max(0,S[x][g]*ax-D[x][g]-(EXs[x][g]||0)),def=Math.max(0,D[y][g]-S[y][g]*ay-(IMs[y][g]||0));if(sur<=1e-6||def<=1e-6)continue;
   const ship=Math.min(sur,def/Math.max(.05,ay),sur*SPH_CALL*def/Math.max(1,wd0));EXs[x][g]=(EXs[x][g]||0)+ship;IMs[y][g]=(IMs[y][g]||0)+ship*ay;}}}
 if(!warm)G.tradeReceipts=bilateralOrders(S,D,EXs,IMs);
 const WS={},WD={},TS={},TD={};
 for(const g of GK){WS[g]=0;WD[g]=0;TS[g]=0;TD[g]=0;for(const tag in S){const s=S[tag][g]*(G.c[tag].access==null?1:G.c[tag].access)-(EXs[tag][g]||0),d=D[tag][g]-(IMs[tag][g]||0);TS[g]+=S[tag][g];TD[g]+=d;if(s>d)WS[g]+=s-d;else WD[g]+=(d-s)*importOrderShare(G.c[tag],g);}}
 
 const wf={},ws={};for(const g of GK){wf[g]=WD[g]>0?Math.min(1,WS[g]/WD[g]):1;ws[g]=WS[g]>0?Math.min(1,WD[g]/WS[g]):1;}
 for(const tag in S){const c=G.c[tag];c.fill={};c.sold={};c.impSh={};c.home={};c.sphI={};if(tag===G.player){c._tIm={};c._tEx={};}let imp=0,exp=0,impS=0;const acc=c.access==null?1:c.access;
  for(const g of GK){const s=S[tag][g],sa=s*acc,d=D[tag][g],ex=EXs[tag][g]||0,im=IMs[tag][g]||0,home=Math.min(sa,d),got=home+im+Math.max(0,d-sa-im)*wf[g]*acc*importOrderShare(c,g);c.fill[g]=d>0?got/d:1;
   const soldQ=home+ex+Math.max(0,sa-d-ex)*ws[g];c.sold[g]=s>0?soldQ/s:1;c.home[g]=soldQ>0?home/soldQ:1;const mq=Math.max(0,got-home),xq=Math.max(0,soldQ-home);c.impSh[g]=d>0?Math.max(0,mq-im)/d:0;imp+=mq*G.price[g];impS+=im*G.price[g];exp+=xq*G.price[g];if(im>1e-6)c.sphI[g]=im;if(tag===G.player){if(mq>1e-6)(c._tIm=c._tIm||{})[g]=[mq,im];if(xq>1e-6)(c._tEx=c._tEx||{})[g]=[xq,ex];}}
  c.stat.imp=imp;c.exportValue=exp;c.stat.exp=exp;c.stat.impS=impS;c.stat.tariffs=(imp-impS)*c.tariff*c.eff.tax*(1+(c._bx?c._bx.cust:0))*modTradeX(c);}
 /* prices move toward balance */
 for(const g of GK){const s=TS[g],d=TD[g];G.pricePrev[g]=G.price[g];if(s+d<=0)continue;const ex=clamp((d-s)/Math.max(s,d),-1,1);let fl=GOODS[g].p*.2;const R=RECIPE[g];if(R){let ci=0;for(const x in R.I)ci+=R.I[x]*G.price[x];fl=Math.max(fl,1.02*ci/R.O);} // nobody sells below the cost of the inputs for long
  G.price[g]=clamp(G.price[g]*(1+.04*ex),fl,Math.max(fl,GOODS[g].p*5));if(!G.tight)G.tight={};G.tight[g]=(G.tight[g]||1)*.9+.1*(s>0?d/s:1);} // how short the world is of a good, smoothed: investors read it
 for(const tag of participants)allocateLocalHouseholds(G.c[tag],provinces(tag),pilotSupply,pilotDemand);
 for(const c of Object.values(G.c))if(c.alive){c.stat.dividendsIn=0;c.stat.dividendsOut=0;}
 /* incomes */
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;c._inc={};c._gdp=0;c._ari=0;c._cap=0;}
 for(const p of G.plist){if(!p.o||!G.c[p.o].alive)continue;const c=G.c[p.o],n=p._n,inc=k=>c._inc,give={};for(const k of PTK)give[k]=0;
  if(p._out.farm){const v=p._out.farm*G.price[p.farm]*c.sold[p.farm]+(p._out.grain?p._out.grain*G.price.grain*c.sold.grain:0),slv=n.SLA/(n.FAR+n.SLA+1e-9),rent=n.ARI>0?.2:0,sv=v*slv,fv=v-sv;
   give.ARI+=fv*rent+sv*.85;give.SLA+=sv*.15;const fw=n.FAR+(p.mine?0:n.LAB*.6),fr=fv*(1-rent);if(fw>0){give.FAR+=fr*n.FAR/fw;give.LAB+=p.mine?0:fr*n.LAB*.6/fw;}c._gdp+=v;}
  if(p._out.mine){const g=p.mine,raw=p._out.mine*G.price[g],mint=g==="gold"?raw*.5:0,v=(raw-mint)*c.sold[g]+mint;c.tr+=mint*.4;give.LAB+=v*.8-mint*.4;c._cap+=v*.2;c._gdp+=v;}
  const sp=g=>G.price[g]*(1+c.tariff*((c.impSh&&c.impSh[g])||0)*(c.home[g]==null?1:c.home[g]));let wC=0,wK=0;const capTo=(f,x)=>{const o=f.fo&&G.c[f.fo];if(o&&o.alive&&!atWarWith(c,o)){const remittance=x*.75;o._cap+=remittance;c._cap+=x-remittance;o.stat.dividendsIn+=remittance;c.stat.dividendsOut+=remittance;}else c._cap+=x;};for(const f of p.factories){f.employerAccount={revenue:0,inputs:0,wages:0,profit:0};if(!f._out){f._out=0;continue;}const r=RECIPE[f.g],rev=f._out*sp(f.g)*c.sold[f.g];let cost=0;for(const x in r.I)cost+=r.I[x]*f.lv*f._e*(f._im||1)*c.bp[x]*(c.fill[x]||1);
   const va=rev-cost,minW=(c.reforms.wage||0)*.1*c.tc[0][0]*f.lv*FAC_WORK*.9*f._e;let wages=Math.max(va*.7,minW);const prof=va-wages;f.employerAccount={revenue:rev,inputs:cost,wages,profit:prof};f._pr=prof;f.cash+=prof*.3;const fcap=FAC_IN*f.lv*2;if(f.cash>fcap){const x=f.cash-fcap;f.cash=fcap;if(f.own==="state")c.tr+=x;else capTo(f,x);}f.loss=prof<0?f.loss+1:Math.max(0,f.loss-1);
   wC+=wages*.78;wK+=wages*.22;if(prof>0){if(f.own==="state")c.tr+=prof*.7;else capTo(f,prof*.7);}else if(f.own==="state"||f.sub)c.tr+=prof;c._gdp+=va;
   if(f.loss>=8&&f.cash<0&&!(f.own==="state"||f.sub)){f.lv=Math.max(0,f.lv-.5);f.loss=4;f.cash=FAC_IN*.5;}
   f.low=(f._e<.4)?(f.low||0)+1:0;if(f.low>=24){f.lv=Math.max(0,f.lv-.5);f.low=12;}
   if(f.lv<=0)f._out=0;}
  give.CRA+=wC;give.CLK+=wK;
  if(n.ART>0&&p._art){let va=0;const W=p.artW||G.artW,mg={};for(const g in p._art){const r=RECIPE[g],k=p._art[g]/r.O;let cost=0;for(const x in r.I)cost+=r.I[x]*k*1.1*c.bp[x]*(c.fill[x]||1);const v=p._art[g]*G.price[g]*c.sold[g]-cost;va+=v;mg[g]=cost>0?v/cost:0;}give.ART+=Math.max(0,va);c._gdp+=Math.max(0,va);
   if(!warm&&G.t%3===p.id.charCodeAt(0)%3){const nw={};let tw=0;for(const g of ARTISAN_GOODS){if(!goodOK(c,g)){nw[g]=0;continue;}const w=(W[g]||.02)*Math.exp(clamp((mg[g]||0)*1.5,-.6,.6));nw[g]=Math.max(.02,w);tw+=nw[g];}for(const g in nw)nw[g]=Math.round(nw[g]/tw*1000)/1000;p.artW=nw;}}
  c._ari+=give.ARI;give.ARI=0;
  for(const q of p.pops){const tot=n[q.t];if(tot>0&&give[q.t])q._gross=give[q.t]*q.n/tot;else q._gross=0;}}
 /* rent and profits flow to each nation's owning classes; the state pays its servants */
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;let nA=0,nC=0,N={};for(const k of PTK)N[k]=0;
  for(const p of provinces(tag))for(const q of p.pops)N[q.t]+=q.n;
  const midCost=c.tc[1][0]+c.tc[1][1],poorCost=c.tc[0][0]+c.tc[0][1],sp=c.sp,pop=sum(PTK,k=>N[k]);
  const pay={CLE:sp.edu*midCost*1.1,BUR:sp.adm*midCost*1.2,OFF:sp.mil*midCost*1.5,SOL:sp.mil*poorCost*1.1};
  const capInc=c._cap+(N.CAP>0?0:0),ariInc=c._ari;c.stat.N=N;c.stat.pop=pop;const lastInc=Math.max(1,(c.stat.inc||0)),works=c.ai&&c.tr>lastInc*4?(c.tr-lastInc*4)*.15:0,poorN=N.FAR+N.LAB+N.CRA;c._works=works;
  const ur=c.reforms,soc=sp.soc*((ur.unemp||0)+(ur.pension||0)+(ur.health||0))/12;
  let govPay=0;
  const landAdministration=c.landRevenue?.enacted?landRevenueVote(c,c.landRevenue.amended).administration:0;
  for(const p of provinces(tag)){for(const q of p.pops){let g=q._gross||0;
    if(q.t==="ARI")g+=N.ARI>0?ariInc*q.n/N.ARI:0;if(q.t==="CAP")g+=N.CAP>0?capInc*q.n/N.CAP:0;
    if(pay[q.t]){const w=pay[q.t]*q.n;g+=w;govPay+=w;}
    if(PTYPES[q.t].s===0&&soc>0){const w=soc*c.tc[0][0]*q.n*((q.t==="CRA"?p._craUn:0)*2+.3);g+=w;govPay+=w;}
    if(works>0&&(q.t==="FAR"||q.t==="LAB"||q.t==="CRA")&&poorN>0){const w=works*q.n/poorN;g+=w;govPay+=w;}
    const s=PTYPES[q.t].s,tax=q.t==="SLA"?0:g*clamp(c.tax[s]+landRevenueRate(c,p,q,landAdministration),0,1)*c.eff.tax;q.inc=g;q._tax=tax;q.cash=Math.max(0,q.cash)+g-tax;}}
  if(N.CAP<=0)c.tr+=capInc*.5;if(N.ARI<=0)c.tr+=ariInc*.5;c._govPay=govPay;}
 /* people buy what the market could give them */
 for(const p of G.plist){if(!p.o||!G.c[p.o].alive)continue;const c=G.c[p.o];
  for(const q of p.pops){const s=PTYPES[q.t].s;let spent=0;const got=[0,0,0];
   for(let i=0;i<3;i++){
    const a=q._a?.[i]||0;if(a<=0)break;
    const nd=NEEDS[s][TIER[i]],orders=[];
    let full=0,filled=0,bill=0;
    for(const g in nd)if(goodOK(c,g)){
     const base=c.bp[g],market=pilotDemand[p.id]?p.localMarket?.[g]:null;
     const row=market?.month===G.t?market:null,fill=row?.fill??c.fill[g]??1;
     const quantity=nd[g]*q.n*a*fill;
     const remote=row?.received?row.delivered/row.received:0;
     const freight=base*(row?.freight||0)*remote;
     full+=nd[g]*base;filled+=nd[g]*base*fill;
     bill+=quantity*(base+freight);
     if(row)orders.push({row,quantity,base,freight});
    }
    const affordable=pilotDemand[p.id]&&bill>0?Math.min(1,Math.max(0,q.cash-spent)/bill):1;
    got[i]=Math.min(1,a)*(full>0?filled/full:1)*affordable;
    spent+=bill*affordable;
    for(const o of orders){
     const q=o.quantity*affordable;
     o.row.purchased+=q;
     o.row.basePaid+=q*o.base;
     o.row.freightPaid+=q*o.freight;
    }
   }
   if(pilotDemand[p.id])q._spent=spent;
   q.cash=Math.max(0,q.cash-spent);const keep=[1,3,6][s];if(q.cash>q.inc*keep+1){const x=q.cash-q.inc*keep;c.capPool+=x;q.cash=q.inc*keep;}
   q.ld=q.ld*.6+got[0]*.4;q.ed=q.ed*.6+got[1]*.4;q.xd=q.xd*.6+got[2]*.4;}}
 // Freight is a service supplied by the province's transport workers.
 for(const p of pilot){
  const receipts=sum(Object.values(p.localMarket||{}),r=>r.freightPaid||0);
  const carriers=p.pops.filter(q=>q.t==="LAB");
  const workers=sum(carriers,q=>q.n);
  if(workers>0)for(const q of carriers)q.cash+=receipts*q.n/workers;
  else G.c[p.o].tr+=receipts;
 }
 /* the treasury */
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;let taxes=0;for(const p of provinces(tag))for(const q of p.pops)taxes+=q._tax||0;
  let govCost=0,bld=0;const bd={};for(const p of provinces(tag)){for(const b of p.build)if(b.left)for(const x in b.left){const q=Math.min(b.left[x],monthlyConstructionOrder(b,x));bd[x]=(bd[x]||0)+q;}}
  for(const g in GOV[tag]){const v=GOV[tag][g]*c.bp[g]*(c.fill[g]||0),bv=(bd[g]||0)*c.bp[g]*(c.fill[g]||0);govCost+=v-bv;bld+=bv;}
  const relief=c.exportRelief?.until>G.t
  ? Math.min(Math.max(0,c.tr),taxes*(.01+.04*c.exportRelief.exposure)):0;
  if(relief>0){
   const households=provinces(tag).flatMap(p=>p.pops.filter(q=>PTYPES[q.t].s===0));
   const people=sum(households,q=>q.n);
   if(people>0)for(const q of households)q.cash+=relief*q.n/people;
  }
  const interest=c.debt*interestRate(c)/12,inc=taxes+c.stat.tariffs-(!warm&&tag==="GBR"&&typeof companyBudget==="function"?companyBudget(c):0),exp=relief+c._govPay+govCost+interest+(c._bx?c._bx.up:0);c.tr+=inc-exp;c.inv=(c.inv||0)+c.capPool*creditInvestmentFactor(c);c._cpAvg=(c._cpAvg||c.capPool)*.9+c.capPool*.1;
  const res=25000*(1+3*((c._bx?c._bx.inv:0)+(c.gwx&&c.gwx.inv||0)));if(c.inv>res){const back=(c.inv-res)*.5;c.inv-=back;let rich=0;for(const p of provinces(tag))for(const q of p.pops)if(PTYPES[q.t].s>0)rich+=q.n;if(rich>0)for(const p of provinces(tag))for(const q of p.pops)if(PTYPES[q.t].s>0)q.cash+=back*q.n/rich;}
  const openingDebt=c.debt;
  if(c.tr<0){const lim=Math.max(500,inc*CREDIT_MONTHS);if(G.t>=(c.noBorrow||0)&&c.debt<lim){const b=Math.min(lim-c.debt,-c.tr+inc);c.debt+=b;c.tr+=b;}
   if(c.tr<0){c.insol=(c.insol||0)+1;if(c.insol>=6&&!warm)defaultDebt(c,false);}else c.insol=0;}
  else{c.insol=0;if(c.debt>0&&c.tr>inc*(c.ai?3:6)){const r=Math.min(c.debt,c.tr-inc*(c.ai?3:6));c.debt-=r;c.tr-=r;}}
  Object.assign(c.stat,{taxes,inc,exp,gov:govCost,pay:c._govPay,interest,debtChange:c.debt-openingDebt,net:inc-exp,gdp:c._gdp});
  const admRatio=c.stat.N.BUR/Math.max(1,c.stat.pop)/.01;c.eff.tax=clamp((c.civ?.45:.25)+techFx(c,"tax")+(c.gwx&&c.gwx.tax||0)+.5*(c._bx?c._bx.admin:0)+.15*Math.min(1.3,admRatio*c.sp.adm),.15,1);c.eff.admin=clamp(.4+techFx(c,"admin")+(c.gwx&&c.gwx.admin||0)+(c._bx?c._bx.admin:0)+.4*Math.min(1.2,admRatio*c.sp.adm),.2,1.2);}
 moneyMonth(TS,warm);if(!warm)investMonth();}
/* ---- debt: lenders lend up to about five years of income; the rate rises with the debt and falls with the borrower's rank; a state that stays below zero for six months defaults ---- */
const CREDIT_MONTHS=60;
function creditLimit(c){return Math.max(500,(c.stat.inc||0)*CREDIT_MONTHS);}
function interestRate(c){const inc=Math.max(1,c.stat.inc||0),d=(c.debt||0)/(inc*12),rk=G.rank?G.rank.indexOf(c.tag):-1,base=rk>=0&&rk<8?.03:rk>=0&&rk<20?.045:.06;return base+.012*d+.004*d*d;}
/* default clears the debt, costs prestige, shuts the credit market for ten years and gives the Great Powers that held the paper a reason for war */
function defaultDebt(c,voluntary){const old=c.debt||0;c.insol=0;if(old<=0){c.tr=Math.max(0,c.tr);c.pres=Math.max(0,c.pres-.5);return;}
 c.debt=0;c.tr=Math.max(0,c.tr);c.noBorrow=G.t+120;c.pres=Math.max(0,c.pres-(voluntary?10:15));const cr=(G.gp||[]).filter(t=>t!==c.tag&&G.c[t]&&G.c[t].alive);c.dflt={t:G.t,cr,amt:old};
 for(const t of cr){c.rel[t]=(c.rel[t]||0)-30;G.c[t].rel[c.tag]=(G.c[t].rel[c.tag]||0)-30;}G.bankr=(G.bankr||0)+1;(G.defaults=G.defaults||[]).push({t:G.t,tag:c.tag,amt:old});if(G.defaults.length>60)G.defaults.shift();
 const txt=c.n+" defaults on its debts"+(cr.length?"; "+cr.map(t=>G.c[t].n).slice(0,3).join(", ")+" are furious":"")+".";msg("diplomacy",txt);G.log.unshift({t:G.t,txt});}
/* money follows output: gold strikes and bank credit when it runs short against what the world makes, and credit is called in when there is too much of it */
function moneyMonth(TS,warm){let R=0;for(const g of GK)R+=TS[g]*GOODS[g].p;let M=0;for(const p of G.plist){if(!p.o)continue;for(const q of p.pops)M+=q.cash;}for(const t in G.c)if(G.c[t].alive)M+=Math.max(0,G.c[t].inv||0);if(R<=0)return;const ratio=M/R;if(warm||!G.m0){G.m0=ratio;return;}
 if(ratio<G.m0*.9){const add=(G.m0*.95-ratio)*R*.12;let inc=0;for(const p of G.plist){if(!p.o)continue;for(const q of p.pops)inc+=Math.max(0,q.inc||0);}if(inc>0)for(const p of G.plist){if(!p.o)continue;for(const q of p.pops)q.cash+=add*Math.max(0,q.inc||0)/inc;}G.minted=(G.minted||0)+add;}
 else if(ratio>G.m0*1.15){const cut=(ratio-G.m0*1.1)*R*.04;let Mc=0;for(const p of G.plist){if(!p.o)continue;for(const q of p.pops)Mc+=Math.max(0,q.cash);}let Mi=0;for(const t in G.c)if(G.c[t].alive)Mi+=Math.max(0,G.c[t].inv||0);const tot=Mc+Mi,f=tot>0?Math.min(.3,cut/tot):0;
  if(f>0){for(const p of G.plist){if(!p.o)continue;for(const q of p.pops)if(q.cash>0)q.cash*=1-f;}for(const t in G.c)if(G.c[t].alive&&G.c[t].inv>0)G.c[t].inv*=1-f;G.minted=(G.minted||0)-f*tot;}}} // too much money chasing the same goods: the banks call in credit, pro rata, never below zero
/* ---- capital builds factories where they pay ---- */
const BUILD_COST={timber:3000,cement:500,machinery:150},RAIL_COST={timber:2400,cement:300,steel:250},BUILD_RATE=.1;
const costOf=b=>b.k==="upg"?b.cost:b.k==="rail"?RAIL_COST:b.k==="bld"?(b.cost||BLD[b.b].cost):BUILD_COST;
function monthlyConstructionOrder(project,good){
 const rate=project.k==="bld"?1/(BLD[project.b].m||10):BUILD_RATE;
 return costOf(project)[good]*rate;
}

/* ---- factory methods: 0 old, 1 and 2 need the technologies below for the industry group; each step gives +20% output per worker and uses 10% less input per unit made ---- */
const METHG={steel:"h",cement:"h",machinery:"h",arms:"h",ammo:"h",ships:"h",fuel:"a",electric:"a",cars:"a"};
const METH={l:{t:["dynamo","chem"],n:["Electric drive","Chemical process control"]},h:{t:["rail3","combust"],n:["Steel-age process","Gas-engine plant"]},a:{t:["dynamo","electrify"],n:["Dynamo drive","Electrified line"]}};
const METH_TECH=new Set(["dynamo","chem","rail3","combust","electrify"]);
const methOf=g=>METH[METHG[g]||"l"];
function methMax(c,g){const M=methOf(g);let m=0;for(const id of M.t){if(c.tech[id])m++;else break;}return m;}
function upgCost(f){const k=Math.max(.5,f.lv);return{machinery:100*k,cement:70*k};}
function upgCan(c,p,f){const m=f.m||0;if(f.lv<=0)return{ok:false,why:"Nothing to upgrade."};if(m>=2)return{ok:false,why:"Already the best method."};if(m>=methMax(c,f.g))return{ok:false,why:"Needs "+(TF[methOf(f.g).t[m]]?tNm(TF[methOf(f.g).t[m]].n):"the next")+" technology."};
 if(p.build.some(b=>b.k==="upg"&&b.g===f.g&&(b.fo||null)===(f.fo||null)))return{ok:false,why:"Already being modernized."};return{ok:true};}
function startUpgrade(c,p,f,state){const b={k:"upg",g:f.g,to:(f.m||0)+1,cost:upgCost(f),state:!!state,pid:newPid()};b.left=Object.assign({},b.cost);if(f.fo)b.fo=f.fo;p.build.push(b);return b;}
/* capitalists put money into the best-earning old mill before they raise a new one; not while machine parts are scarce */
function tryUpgrade(c,lv){if(G.t%3||!c.civ||ECON[c.econ].cap<=0)return 0;if((c.fill.machinery!=null&&c.fill.machinery<.9)||((G.tight&&G.tight.machinery)||1)>1.08)return 0;
 let nu=0,best=null,bv=0;for(const p of provsOf(c.tag))for(const b of p.build)if(b.k==="upg")nu++;if(nu>=1+Math.floor(lv/80))return 0;
 for(const p of provsOf(c.tag)){if(p.ctl!==p.o)continue;for(const f of p.factories){if(f.own==="state"||f.loss>0||!upgCan(c,p,f).ok)continue;const o=f.fo&&G.c[f.fo]&&G.c[f.fo].alive?G.c[f.fo]:c;if(o.inv<12000)continue;const m=facMargin(c,f.g);if(m<.1)continue;const v=f.lv*(1+m)/(1+(f.m||0));if(v>bv){bv=v;best=[p,f];}}}
 if(!best)return 0;startUpgrade(c,best[0],best[1],false);return 1;}
function facMargin(c,g){if(!c.bp)return 0;const r=RECIPE[g];let ci=0;for(const x in r.I)ci+=r.I[x]*c.bp[x];return(r.O*Math.max(G.price[g],c.bp[g]*.97)-ci)/ci;}
let PIPE={},LVG={};const UPSTREAM=new Set();for(const g in RECIPE)for(const x in RECIPE[g].I)if(RECIPE[x])UPSTREAM.add(x);
/* ---- A2: the life of a construction project, one set of transitions for every owner and payer ----
 * A project is started (startRail/startFactory/startBld/startUpgrade, directly or by promotion from the queue; its pid is
 * assigned then and never changes), paid every month by projectPayer within that payer's balance (investMonth), and ends
 * exactly once through endProject: completed, canceled on transfer of the province (conquest, cession, unification) or
 * dropped from the queue. The existing cancellation policy stands: a canceled project's payments are spent and not refunded;
 * the record says so explicitly (spent, recoverable 0, unspent = materials still to be bought). */
function newPid(){return"p"+(G.projectSeq=(G.projectSeq||0)+1);}
const queuePid=(c,it)=>c.tag+"/"+it.id;
function projectPayer(c,b){return b.state?c:b.fo&&G.c[b.fo]?.alive?G.c[b.fo]:c;}
function endProject(p,b,outcome,note){
 const unspent=Object.values(b.left||{}).reduce((s,x)=>s+Math.max(0,x),0);
 const rec={t:G.t,pid:b.pid,province:p.id,kind:b.b||b.k,good:b.g,orderId:b.orderId,outcome,spent:b.paidUnknown?null:b.paid||0,recoverable:0,unspent};
 if(b.paidUnknown)rec.paidSinceLoad=b.paid||0; /* A4: a project from an older save: what was paid before the load is unknown, not zero */
 if(note)rec.note=note;
 b.done=1;
 const ledger=b.ledgerId!=null&&G.constructionLedger?G.constructionLedger[b.ledgerId]:null;
 if(ledger){ledger.outcome=outcome;ledger.spent=rec.spent;ledger.recoverable=0;ledger.unspent=unspent;if(outcome!=="completed")ledger.status="Canceled after transfer";}
 return rec;
}
function queueEnd(c,it,why){return{t:G.t,pid:queuePid(c,it),province:it.p,kind:it.b,outcome:"queue ended",note:why,spent:0,recoverable:0,unspent:0};}
function completeProject(c,p,b,payer){
 const rec=endProject(p,b,"completed");const tag=c.tag;
 if(tag===G.player&&(b.k==="bld"||b.orderId!=null))(c.completedWorks||=[]).push({t:G.t,province:p.id,kind:b.b||b.k,good:b.g,orderId:b.orderId,owner:payer.tag,paid:b.paid});
 c.projectDoneAt=G.t;if(b.fo&&G.c[b.fo])G.c[b.fo].projectDoneAt=G.t;
 if(b.k==="rail"){p.rail+=1;if(tag===G.player)msg("economy","A railway is finished in "+p.n+".");}
 else if(b.k==="upg"){const f=p.factories.find(f=>f.g===b.g&&(f.fo||null)===(b.fo||null));if(f)f.m=Math.max(f.m||0,b.to);if(tag===G.player)msg("economy","The "+GOODS[b.g].n.toLowerCase()+" works in "+p.n+" is modernized: "+methOf(b.g).n[b.to-1]+".");}
 else if(b.k==="bld"){BLD[b.b].up(p);if(tag===G.player)msg("economy",BLD[b.b].n+" completed in "+p.n+".");}
 else{const f=p.factories.find(f=>f.g===b.g&&(f.fo||null)===(b.fo||null));if(f)f.lv+=1;else p.factories.push(Object.assign({g:b.g,lv:1,own:b.state?"state":"cap",cash:FAC_IN,staff:1,loss:0},b.fo?{fo:b.fo}:{}));
  if(tag===G.player)msg("economy","A "+GOODS[b.g].n.toLowerCase()+" factory opens in "+p.n+(b.fo?", built with capital from "+G.c[b.fo].n:"")+".");else if(b.fo===G.player)msg("economy","Our investors open a "+GOODS[b.g].n.toLowerCase()+" factory in "+p.n+" ("+c.n+").");}
 return rec;}
function investMonth(){PIPE={};LVG={};for(const p of G.plist)if(p.o){for(const f of p.factories)LVG[f.g]=(LVG[f.g]||0)+f.lv;for(const b of p.build)if(b.k==="fac")PIPE[b.g]=(PIPE[b.g]||0)+1;}
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;
  for(const p of provsOf(tag))for(const b of p.build){if(b.k!=="fac"&&b.k!=="rail"&&b.k!=="bld"&&b.k!=="upg")continue;const materials=Object.keys(costOf(b)).map(g=>{
    const quantity=Math.min(b.left[g],monthlyConstructionOrder(b,g))*(c.fill[g]??1);
    return {g,quantity,value:quantity*c.bp[g]};
   });
   const payer=projectPayer(c,b);
   const balance=b.state?"tr":"inv";
   const bill=sum(materials,m=>m.value);
   /* A2: every payer, whoever it is and whether or not a ledger exists, can spend only what it holds this month */
   const funds=Math.max(0,payer[balance]);
   const fraction=bill>0?Math.min(1,funds/bill):1;
   const cost=fraction<1?funds:bill;
   if(b.pid==null)b.pid=newPid();
   for(const m of materials)b.left[m.g]-=m.quantity*fraction;
   const need=sum(Object.values(b.left),x=>x);
   payer[balance]-=cost;
   b.paid=(b.paid||0)+cost;
   const ledger=tag===G.player||payer.tag===G.player?constructionAccount(p,b):null;
   if(ledger){
    b.lastProgress={month:G.t,paid:cost,payer:payer.tag,delayed:fraction<1};
    ledger.paid=b.paid;
    ledger.remaining=need;
    ledger.status=need<=1?"Completed":fraction<1?"Funding delayed":cost===0?"Awaiting materials":"Under construction";
    if(cost>0)recordConstructionPayment(ledger,payer.tag,balance,cost,materials,fraction);
   }
   if(need<=1)completeProject(c,p,b,payer);}
  for(const p of provsOf(tag))p.build=p.build.filter(b=>!b.done);if(!c.civ)continue;
  const lv=sum(provsOf(tag),p=>sum(p.factories,f=>f.lv)),busy=sum(provsOf(tag),p=>p.build.filter(b=>b.k==="fac"&&!b.fo).length),slots=Math.min(7,1+Math.floor(Math.sqrt(lv)/1.8)),FC=17000;
  let home=0;const upgd=tryUpgrade(c,lv);if(!upgd&&busy<slots&&(civRamp(c)>=1||rng()<civRamp(c))&&c.inv>FC*1.2*(1+clamp((.4-(c.stat.lit||0))*2.5,0,1))&&ECON[c.econ].cap>0){const g=bestGood(c);if(g&&(busy<slots||(UPSTREAM.has(g)&&((G.tight&&G.tight[g])||1)>1.06))){const pr=bestSite(c,g);if(pr){startFactory(c,pr,g,false);home=1;}}}
  if(c.inv>FC*(home?8:4))foreignInvest(c);}}
/* a nation that has just westernized lacks the engineers, the law of contract and the habit of investing: its mills come slowly for about seventy years (nations that were civilized from the start have no civT and no ramp) */
function civRamp(c){if(c.civT==null)return 1;return clamp(Math.pow((G.t-c.civT)/840,3),.02,1);}
function bestGood(c,state){if(!c.bp)return null;const L=[],bv=state?.3:.15;let worst=null;for(const g in RECIPE){if(!goodOK(c,g))continue;if(c.bp[g]<GOODS[g].p*.8)continue;if(c.sold&&c.sold[g]<.9)continue;let sc=0;for(const x in RECIPE[g].I)if(c.fill[x]!=null&&c.fill[x]<.85)sc=1;if(sc)continue;const m=facMargin(c,g),short=(c.impSh&&c.impSh[g])||0;let ip=1;for(const x in RECIPE[g].I)ip=Math.max(ip,G.price[x]/GOODS[x].p);const pi=G.price[g]/GOODS[g].p,pull=UPSTREAM.has(g)?1+Math.min(3,Math.max(0,pi-1.1)*3+Math.max(0,((G.tight&&G.tight[g])||1)-1.02)*12):1;const v=Math.min(2.5,m+short*.4)*pull*Math.min(1,1.5/ip)/(1+(PIPE[g]||0)/(2+(LVG[g]||0)*.15)); // goods that other mills eat are worth more when they run short // a plant is worth less when its own inputs are scarce: build the inputs first
  if(v>bv){L.push([g,v]);const tg=(G.tight&&G.tight[g])||1;if(tg>1.06&&UPSTREAM.has(g)&&(PIPE[g]||0)<1+(LVG[g]||0)*.08&&(!worst||tg>worst[1]))worst=[g,tg];}}if(!L.length)return null;if(worst&&rng()<Math.min(.8,(worst[1]-1.04)*4))return worst[0]; // a good the whole world is short of jumps the queue
 let tw=0;for(const x of L)tw+=x[1]*x[1];let r=rng()*tw;for(const x of L){r-=x[1]*x[1];if(r<=0)return x[0];}return L[L.length-1][0];}
function bestSite(c,g){let best=null,bv=-1e9;let L=0,E=0;for(const p of provsOf(c.tag))for(const f of p.factories){L+=f.lv;E+=f.lv*(p._staff==null?1:p._staff);}if(L>0&&E/L<.65)return null;for(const p of provsOf(c.tag)){if(p.ctl!==p.o||p.col===0)continue;const n=p._n||counts(p),lv=sum(p.factories,f=>f.lv)+p.build.filter(b=>b.k==="fac").length;if(lv>=litCap(p)*ruleShare(c,p))continue;const free=n.CRA-lv*FAC_WORK*.9+(n.FAR+n.LAB)*.012;if(free<FAC_WORK*.6)continue;const v=free/100+p.rail*3+(p.factories.some(f=>f.g===g)?2:0)-p.un/10;if(v>bv){bv=v;best=p;}}return best;}
/* mills need men who can read a gauge: a province can staff levels for about 4% of its literate people (less where few can read, because skilled hands are scarcer still); beyond 12 million people a province's labor market is too sprawling to staff in proportion */
const FAC_LIT=.04;
/* mills need a local business class: where most people are of a culture the state does not accept (colonies, subject lands), capital comes in at less than half the pace */
function ruleShare(c,p){let a=0,n=0;for(const q of p.pops){n+=q.n;if(accepted(c,q.c))a+=q.n;}return n>0?.4+.6*a/n:1;}
function litCap(p){let l=0,n=0;for(const q of p.pops){l+=q.lit*q.n;n+=q.n;}return n>0?(n>12000?12000*Math.sqrt(n/12000):n)*(l/n)*Math.sqrt(l/n/.7)*FAC_LIT/FAC_WORK:0;}
function atWarWith(a,b){return a.war.some(w=>b.war.includes(w));}
/* idle capital goes abroad: a nation whose savings cannot find a use at home builds mills in a friendly, capital-poor country; its sphere first. The investor keeps 75% of the profit. */
function foreignInvest(c){if(!c.civ||G.t%3)return;const FC=17000;let best=null,bv=0,oi=0;for(const p of provsOf(c.tag))for(const f of p.factories)if(!f.fo)oi+=f.lv;if(oi<30)return;
 for(const tag in G.c){const t=G.c[tag];if(tag===c.tag||!t.alive||!t.civ||!t.bp||ECON[t.econ].cap<=0||atWarWith(c,t))continue;if(civRamp(t)<1&&rng()>civRamp(t))continue;const rel=t.rel[c.tag]||0,sph=t.sphere===c.tag;if(!sph&&rel<-10)continue;if(t.sphere&&t.sphere!==c.tag)continue;
  let own=0,fl=0,bf=0;for(const p of provsOf(tag)){for(const f of p.factories){if(f.fo)fl+=f.lv;else own+=f.lv;}for(const b of p.build)if(b.k==="fac"){bf++;if(b.fo)fl+=1;}}
  if(own>oi*.5||fl>10+own*1.2||bf>=1+Math.floor(own/25))continue;const v=(sph?1.5:0)+(rel>20?.3:0)+(t.inv<FC?.6:0)+Math.min(1,(t.stat.lit||0)*2)+Math.min(1,(t.stat.pop||0)/60000);if(v>bv){bv=v;best=t;}}
 if(!best)return;const g=bestGood(best);if(!g)return;const pr=bestSite(best,g);if(!pr)return;const b=startFactory(best,pr,g,false);b.fo=c.tag;}
const facPrem=c=>(ECON[c.econ].build>0?1:1.5)*modFacX(c);
function startFactory(c,p,g,state){const b={k:"fac",g,left:Object.assign({},BUILD_COST),state:!!state,pid:newPid()};const pm=facPrem(c);if(pm!==1)for(const x in b.left)b.left[x]=Math.round(b.left[x]*pm);p.build.push(b);return b;}
function startRail(c,p){const b={k:"rail",left:Object.assign({},RAIL_COST),state:true,pid:newPid()};p.build.push(b);return b;}
function msg(cat,txt){G.msgs.unshift({t:G.t,cat,txt});if(G.msgs.length>80)G.msgs.length=80;}
function govDemand(c,provinces=provsOf(c.tag)){const d=typeof milDemand==="function"?milDemand(c):{};for(const p of provinces){for(const b of p.build){if(!b.left)continue;for(const x in b.left){const q=Math.min(b.left[x],monthlyConstructionOrder(b,x));if(q>0)d[x]=(d[x]||0)+q;}}}return d;}
/* what people would buy at an 1836 standard of living: poor fed, a little more for the middle and the rich */
const A_TARGET=[[1,.25,.03],[1,.7,.15],[1,1,.6]];
function targetDemand(){const T={};for(const g of GK)T[g]=0;for(const p of G.plist){if(!p.o)continue;const c=G.c[p.o];for(const q of p.pops){const s=PTYPES[q.t].s;for(let i=0;i<3;i++){const nd=NEEDS[s][TIER[i]];for(const g in nd)if(goodOK(c,g))T[g]+=nd[g]*q.n*A_TARGET[s][i];}}}return T;}
function seedCash(){for(const p of G.plist){if(!p.o)continue;const c=G.c[p.o];for(const g of GK)c.bp=c.bp||{};const bp={};for(const g of GK)bp[g]=G.price[g];for(const q of p.pops){const s=PTYPES[q.t].s;let v=0;for(let i=0;i<3;i++)v+=tierCost(c,s,TIER[i],bp)*A_TARGET[s][i];q.cash=v*q.n*2;q.inc=v*q.n;}}}
/* the 1836 world in balance: artisans cover the handmade shortfall, the land feeds people and workshops */
function calibrate(){const T=targetDemand(),Sf={},Df={};for(const g of GK){Sf[g]=0;Df[g]=0;}let A=0;
 for(const p of G.plist){if(!p.o)continue;for(const f of p.factories){const r=RECIPE[f.g];Sf[f.g]+=r.O*f.lv;for(const x in r.I)Df[x]+=r.I[x]*f.lv;}for(const q of p.pops)if(q.t==="ART")A+=q.n;}
 const need={};for(const g of ARTISAN_GOODS)need[g]=Math.max(0,T[g]+Df[g]-Sf[g]);
 const chain=(g,x)=>RECIPE[g].I[x]?RECIPE[g].I[x]/RECIPE[g].O*1.1:0;need.fabric+=need.clothes*chain("clothes","fabric")+need.luxuries*chain("luxuries","fabric");
 const req={};let R=0;for(const g of ARTISAN_GOODS){req[g]=need[g]/(RECIPE[g].O/FAC_WORK);R+=req[g];}
 G.artK=A>0?R/A:.3;G.artW={};for(const g of ARTISAN_GOODS)G.artW[g]=R>0?Math.round(req[g]/R*1000)/1000:1/ARTISAN_GOODS.length;
 const rawD={};for(const g in RGO_OUT)rawD[g]=T[g]+Df[g];for(const g of ARTISAN_GOODS)for(const x in RECIPE[g].I)if(rawD[x]!=null)rawD[x]+=req[g]*RECIPE[g].I[x]/FAC_WORK*1.1;
 const S1={};for(const g in RGO_OUT)S1[g]=0;
 for(const p of G.plist){if(!p.o)continue;const c=G.c[p.o],n=counts(p),fx=1+techFx(c,"rgo")+RAILK*p.rail;const fw=n.FAR+n.SLA+(p.mine?0:n.LAB*.6);
  if(p.farm&&fw>0)S1[p.farm]+=RGO_OUT[p.farm]*p.farmCap*Math.pow(fw/p.farmCap,.7)*TERRAIN[p.t].farm*fx;if(p.mine&&n.LAB>0)S1[p.mine]+=RGO_OUT[p.mine]*p.mineCap*Math.pow(n.LAB/p.mineCap,.7)*fx;}
 G.rgoK={};for(const g in RGO_OUT)G.rgoK[g]=S1[g]>0&&rawD[g]>0?clamp(rawD[g]/S1[g],MINE_GOODS.has(g)?.6:.3,8):1;
 for(const p of G.plist)p.artW=Object.assign({},G.artW);}

/* ---- history: one point a year for every living nation and every good, for the charts ---- */
function histYear(){const H=G.hist=G.hist||{y:[],n:{},pr:{}};const y=yearOf(G.t);if(H.y.length&&H.y[H.y.length-1]===y)return;const i=H.y.length;H.y.push(y);
 const lv={};for(const p of G.plist)if(p.o&&p.factories.length){let l=0;for(const f of p.factories)l+=f.lv;lv[p.o]=(lv[p.o]||0)+l;}
 for(const t in G.c){const c=G.c[t];if(!c.alive)continue;const rk=G.rank?G.rank.indexOf(t):-1;if(t!==G.player&&!(rk>=0&&rk<12))continue; /* the player's nation and the twelve leading ones */ const h=H.n[t]=H.n[t]||{i,pop:[],inc:[],fac:[],rank:[]};while(h.i+h.pop.length<i){h.pop.push(null);h.inc.push(null);h.fac.push(null);h.rank.push(null);}h.pop.push(Math.round(c.stat.pop||0));h.inc.push(Math.round((c.stat.gdp||0)*12));h.fac.push(Math.round((lv[t]||0)*10)/10);h.rank.push((G.rank?G.rank.indexOf(t):-1)+1);}
 for(const g of GK)(H.pr[g]=H.pr[g]||[]).push(Math.round(G.price[g]/GOODS[g].p*1000)/1000);}

function creditInvestmentFactor(c) {
 const s = G.creditShock;
 if (!s || G.t >= s.until || (!s.worldwide && c.tag !== "USA")) return 1;
 const cushioned = (G.decDone?.[c.tag] || []).includes("bank") || c.creditRelief>G.t;
 return 1 - s.rate * (cushioned ? .5 : 1);
}

// Pilot household allocation. The national market still clears factory and state orders.
const PILOT_GOODS=["grain","timber","fabric","clothes","livestock"];
function settleLocalGood(rows,available,worldPrice,tariff){
 const pool=Math.max(0,available);
 const localTotal=sum(rows,r=>Math.min(r.supply,r.demand));
 const localRatio=localTotal?Math.min(1,pool/localTotal):0;
 const orders=rows.map(r=>{
  const local=Math.min(r.supply,r.demand)*localRatio;
  const landed=worldPrice*(1+tariff+r.freight);
  return {...r,local,landed,wanted:Math.min(r.demand-local,r.capacity)/(1+tariff+r.freight)};
 });
 const requested=sum(orders,r=>r.wanted);
 const ratio=requested?Math.min(1,Math.max(0,pool-localTotal*localRatio)/requested):0;
 return orders.map(r=>{
  const delivered=r.wanted*ratio;
  return {...r,delivered,received:r.local+delivered,fill:r.demand?(r.local+delivered)/r.demand:1};
 });
}
function allocateLocalHouseholds(country,provinces,supply,demand){
 for(const good of PILOT_GOODS){
  const rows=provinces.map(p=>({
   id:p.id,supply:supply[p.id][good],demand:demand[p.id][good],
   /* A3 (measured, see validation/results/engine/A3.md): the Punjab pilot capped what a province could bring in from the nation's pool at about 3% of its farm capacity plus 4% per railway level. Applied to every province that cap was about 4% of the typical deficit (14k of 465k grain units in the first year), grain fill fell to 56% and the world's population halved by 1936. Inside the nation's own controlled territory the pool is now delivered up to the province's demand and the freight COST (below) and tariffs still apply; an occupied province still receives nothing. B1 reintroduces capacity from the freight graph. */
   capacity:p.ctl===p.o?demand[p.id][good]:0,
   freight:.12/(1+p.rail)
  }));
  const available=sum(rows,r=>r.demand)*(country.fill[good]??1);
  const duties=country.tariff*(country.impSh[good]||0);
  const result=settleLocalGood(rows,available,G.pricePrev[good],duties);
  const unallocated=Math.max(0,available-sum(result,r=>r.received));
  for(const r of result){
   const province=P(r.id);
   const nationalPrice=country.bp[good];
   r.landed=nationalPrice*(1+r.freight);
   (province.localMarket||={})[good]={...r,available,unallocated,month:G.t,purchased:0,basePaid:0,freightPaid:0};
  }
 }
}

// A commercial agreement reserves part of a seller's surplus before pool clearing.
function bilateralOrders(supply,demand,exports,imports){
 const receipts=[];
 for(const buyer of Object.values(G.c)){
  const route=buyer.commercialRoute;
  const seller=route&&G.c[route.seller];
  if(!buyer.alive||!seller?.alive||!supply[buyer.tag]||!supply[seller.tag]||route.until<=G.t||atWarWith(buyer,seller))continue;
  const depots=sum(provsOf(buyer.tag),p=>p.ctl===buyer.tag?bxl(p,"depot"):0);
  if(!depots)continue;
  const g=route.good,a=seller.tag,b=buyer.tag;
  const surplus=Math.max(0,supply[a][g]*(seller.access??1)-demand[a][g]-(exports[a][g]||0));
  const shortage=Math.max(0,demand[b][g]-supply[b][g]*(buyer.access??1)-(imports[b][g]||0));
  const price=G.price[g],serviceRate=price*.05;
  const quantity=Math.min(surplus,shortage,20*depots*(buyer.access??1),
   Math.max(0,buyer.tr)/Math.max(serviceRate,1e-9));
  if(quantity<=0)continue;
  exports[a][g]=(exports[a][g]||0)+quantity;
  imports[b][g]=(imports[b][g]||0)+quantity;
  const fee=quantity*serviceRate;
  buyer.tr-=fee;
  seller.tr+=fee;
  receipts.push({seller:a,buyer:b,good:g,quantity,value:quantity*price,fee});
 }
 return receipts;
}


function constructionAccount(province,project){
 if(project.ledgerId==null)project.ledgerId=G.constructionSequence=(G.constructionSequence||0)+1;
 const accounts=G.constructionLedger||={};
 return accounts[project.ledgerId]||=( {
  id:project.ledgerId,province:province.id,kind:project.b||project.k,good:project.g,
  orderId:project.orderId,owner:province.o,opened:G.t,openingPaid:project.paid||0,
  paid:project.paid||0,remaining:sum(Object.values(project.left||{}),n=>n),
  status:"Under construction",payments:[]
 });
}

function recordConstructionPayment(ledger,payer,account,amount,materials,fraction){
 const year=yearOf(G.t);
 let row=ledger.payments.find(payment=>payment.year===year&&payment.payer===payer&&payment.account===account);
 if(!row){
  row={year,payer,account,amount:0,materials:{}};
  ledger.payments.push(row);
 }
 row.amount+=amount;
 for(const {g,quantity} of materials)row.materials[g]=(row.materials[g]||0)+quantity*fraction;
}
