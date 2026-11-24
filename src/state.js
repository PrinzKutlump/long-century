"use strict";
/* Economic model revision: separate from the save codec version. Bump when a change alters outcomes (see Long_Century_Engine_Plan.md R4). */
const MODEL_REV=5;
let G=null;
/* ---------- helpers ---------- */
const clamp=(v,a,b)=>v<a?a:v>b?b:v,sum=(a,f)=>a.reduce((s,x)=>s+(f?f(x):x),0),r2=x=>Math.round(x*100)/100;
function rng(){let s=G.seed>>>0;s^=s<<13;s^=s>>>17;s^=s<<5;G.seed=s>>>0;return(s>>>0)/4294967296;}
const pick=a=>a[Math.floor(rng()*a.length)];
const P=id=>G.prov[id],C=tag=>G.c[tag];
const yearOf=t=>1836+Math.floor(t/12),monthOf=t=>t%12;
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const dateStr=t=>MONTHS[monthOf(t)]+" "+yearOf(t);
const provsOf=tag=>G.plist.filter(p=>p.o===tag);
function popOf(tag){let s=0;for(const p of G.plist)if(p.o===tag)s+=p.pop;return s;}
const isCiv=tag=>!!C(tag).civ;
/* ---------- world adjacency ---------- */
let ADJ=null,SEAADJ=null;
function buildAdj(){ADJ={};SEAADJ={};for(const p of WORLD.provs){ADJ[p.id]=p.adj.slice();SEAADJ[p.id]=[];}for(const[a,b,m]of WORLD.sea){SEAADJ[a].push([b,m]);SEAADJ[b].push([a,m]);}fillLanes();}
/* the drawn sea lanes leave many ports unreachable: link every thinly connected port to its nearest ports, at the same speed as the drawn lanes */
function fillLanes(){const pv={};for(const p of WORLD.provs)pv[p.id]=p;const D=(a,b)=>Math.hypot(pv[a].x-pv[b].x,pv[a].y-pv[b].y),r=WORLD.sea.map(([a,b,m])=>D(a,b)/m).sort((x,y)=>x-y),K=r[r.length>>1]||60,ports=WORLD.provs.filter(p=>p.sea).map(p=>p.id);
 for(const a of ports){let need=3-SEAADJ[a].length;if(need<=0)continue;const near=ports.filter(b=>b!==a&&!SEAADJ[a].some(e=>e[0]===b)).sort((x,y)=>D(a,x)-D(a,y));for(const b of near){if(need<=0)break;const d=D(a,b);if(d>K*4.5)break;const m=Math.max(1,Math.round(d/K));SEAADJ[a].push([b,m]);SEAADJ[b].push([a,m]);need--;}}}
/* ---------- people ---------- */
function mkPop(t,c,n,lit,ideo){return{t,c,n,lit,mil:1,con:clamp(lit*4,0,10),cash:0,inc:0,ld:1,ed:.5,xd:.1,job:1,id:ideo};}
function baseIdeo(cn,stratum){const r=cn.ideo,w={REA:.25,CON:.45,LIB:.2,SOC:0,ANL:0,COM:0,FAS:0};w[r]+=.25;if(stratum===2){w.REA+=.1;w.CON+=.1;}if(stratum===1&&cn.civ)w.LIB+=.1;if(!cn.civ){w.REA+=.3;w.LIB*=.3;}const t=sum(IK,k=>w[k]);for(const k of IK)w[k]=r2(w[k]/t);return w;}
const LITM={ARI:2,CAP:2.2,CLE:3,BUR:2.6,OFF:2.4,ART:1.3,CLK:2.4,CRA:.9,FAR:.75,LAB:.7,SOL:.8,SLA:.05};
function genPops(p,cn){const civ=cn.civ,fac=WORLD.fac[p.id]||{},lv=sum(Object.values(fac)),mine=!!p.mine;
 const sh={ARI:civ?.011:.015,CAP:civ?.003+lv*.0006:.001,CLE:civ?.012:.014,BUR:civ?.008:.006,OFF:.002,ART:civ?.06:.05,LAB:mine?(civ?.08:.05):.03,SOL:.01};
 const cra=Math.min(p.pop*.3,lv*FAC_WORK*.9),clk=Math.min(p.pop*.04,lv*FAC_WORK*.1);
 let s=0;for(const k in sh)s+=sh[k];const far=Math.max(.1,1-s-(cra+clk)/Math.max(1,p.pop));
 const groups=[[p.c,1-p.mp]];if(p.mc)groups.push([p.mc,p.mp]);
 const slave=p.f.includes("S")&&cn.reforms.slavery===0;p.pops=[];
 for(const[cul,frac]of groups){const isSlaveCul=slave&&cul!==p.c&&/afro/.test(cul);const add=(t,n)=>{if(n>=.5)p.pops.push(mkPop(t,cul,n,clamp(cn.lit*LITM[t]*(cul===cn.cul||cn.acc.includes(cul)?1:.6),0,.98),baseIdeo(cn,PTYPES[t].s)));};
  if(isSlaveCul){add("SLA",p.pop*frac*.9);add("FAR",p.pop*frac*.1);continue;}
  for(const k in sh)add(k,p.pop*frac*sh[k]);add("CRA",cra*frac);add("CLK",clk*frac);add("FAR",p.pop*frac*far);}
 p.factories=Object.entries(fac).map(([g,l])=>({g,lv:l,own:"cap",cash:FAC_IN*l*2,staff:1,loss:0}));
 let f=0,l=0;for(const q of p.pops){if(q.t==="FAR"||q.t==="SLA")f+=q.n;if(q.t==="LAB")l+=q.n;}p.farmCap=Math.max(1,f)*1.05;p.mineCap=Math.max(1,l)*1.1;}
/* ---------- nations ---------- */
function mkNation(n){const civ=!!n.civ,ref={};for(const r of REFORMS)ref[r.id]=0;
 if(n.gov==="const"||n.gov==="dem"){ref.press=1;ref.parties=1;ref.meet=1;}if(n.gov==="dem"){ref.vote=2;ref.press=2;ref.parties=3;ref.system=1;}
 if(["GBR","FRA","NED","BEL","SWE","DEN","SWI","SAR","POR","SPA","PRU","AUS","RUS","OTT","GRE","MEX","CHL","ARG","URU","PEU","BOL","CLM","VNZ","ECU","UCA","HAI","PRG"].includes(n.tag))ref.slavery=n.tag==="GBR"||n.tag==="FRA"?2:ref.slavery;
 if(["GBR","MEX","CHL","UCA","CLM","VNZ","ECU","PEU","BOL","ARG","URU","HAI"].includes(n.tag))ref.slavery=2;
 const known={};["army","navy","com","cul","ind"].forEach((f,i)=>{TECHS.filter(t=>t.f===f).sort((a,b)=>a.y-b.y).slice(0,n.tech[i]).forEach(t=>known[t.id]=1);});
 const party=PARTY_OF[n.ideo];
 return{tag:n.tag,modern:civ?100:modStart(n.tag),modRef:civ?[]:(MOD_FREE[n.tag]||[]).slice(),aiResearchBias:n.aiResearchBias||null,n:n.n,adj:n.adj,col:n.col,cap:n.cap,gov:n.gov,ideo:n.ideo,cul:n.cul,acc:n.acc.slice(),lit:n.lit,civ,pres:n.pres,
  tr:0,debt:0,tax:[.35,.3,.25],tariff:civ?.2:.1,sp:{edu:.6,adm:.7,soc:0,mil:.6},econ:party.econ,trade:party.trade,cit:party.cit,reforms:ref,tech:known,rp:0,res:null,resQ:[],
  elect:GOVS[n.gov].elect?24+Math.floor(rng()*36):0,rel:{},ally:[],war:[],truce:{},inf:{},sphere:null,infamy:0,we:0,ai:true,alive:true,
  eff:{tax:.6,admin:.6},stat:{N:{},pop:0},prog:{},hist:[],bp:Object.assign({},(G&&G.price)||{}),fill:{},sold:{},impSh:{}};}
/* Tech effects are summed once per tech object. Research clears the entry when it adds a tech; events and new states replace the object. */
const TECH_FX=new WeakMap();
function techFx(c,k){let fx=TECH_FX.get(c.tech);if(!fx){fx={};TECH_FX.set(c.tech,fx);}
 if(k in fx)return fx[k];let s=0;for(const id in c.tech){const t=TF[id];if(t&&t.fx[k])s+=t.fx[k];}return fx[k]=s;}
function railMax(c){let m=c.civ||modHas(c,"e3")?1:0;for(const id in c.tech){const t=TF[id];if(t&&t.fx.rail)m=Math.max(m,t.fx.rail);}return m;}
/* ---------- armies and fleets ---------- */
let UID=1;
function mkArmy(tag,loc,comp,naval){const u=[];for(const k in comp)for(let i=0;i<comp[k];i++)u.push({k,str:1,org:1});return{id:"a"+(UID++),o:tag,loc,u,naval:!!naval,dest:null,path:[],eta:0,siege:0,gen:null};}
function startForces(c){const pop=popOf(c.tag),cap=c.cap,b=Math.max(1,Math.round(pop*(c.civ?.0045:.0022)/3));
 const big=["GBR","FRA","RUS","AUS","PRU","OTT","USA","SPA","NED","CHI","EGY","SAR","SWE","DEN","JAP","POR","BRA","MEX"].includes(c.tag);
 const nb=Math.min(b,c.civ?60:40),inf=Math.max(1,Math.round(nb*.7)),cav=Math.round(nb*.18),art=Math.max(0,nb-inf-cav);
 G.armies.push(mkArmy(c.tag,cap,{inf,cav,art}));
 const nav={GBR:{mow:24,frig:30,clip:20},FRA:{mow:12,frig:16,clip:10},RUS:{mow:10,frig:10,clip:6},USA:{mow:4,frig:10,clip:8},SPA:{mow:4,frig:8,clip:6},NED:{mow:3,frig:8,clip:8},OTT:{mow:6,frig:8,clip:4},
  EGY:{mow:4,frig:6,clip:3},SWE:{mow:3,frig:4,clip:2},DEN:{mow:3,frig:4,clip:2},AUS:{mow:2,frig:4,clip:2},SAR:{mow:2,frig:4,clip:2},POR:{mow:1,frig:4,clip:3},BRA:{mow:1,frig:4,clip:2},PRU:{frig:3,clip:2},SIC:{mow:1,frig:3,clip:2},GRE:{frig:2,clip:1},MEX:{frig:2,clip:1},CHL:{frig:2,clip:1},ARG:{frig:2,clip:1},JAP:{frig:1,clip:1},CHI:{frig:2,clip:2}}[c.tag];
 if(nav&&P(cap).sea)G.armies.push(mkArmy(c.tag,cap,nav,true));
 if(big&&c.tag==="GBR"){G.armies.push(mkArmy("GBR","CAL",{inf:12,cav:3,art:2}));G.armies.push(mkArmy("GBR","QUE",{inf:2}));G.armies.push(mkArmy("GBR","CPT",{inf:1}));}
 if(c.tag==="RUS")G.armies.push(mkArmy("RUS","WAR",{inf:8,cav:3,art:2}),mkArmy("RUS","TIF",{inf:5,cav:2}));
 if(c.tag==="FRA")G.armies.push(mkArmy("FRA","ALG",{inf:4,cav:1}));if(c.tag==="OTT")G.armies.push(mkArmy("OTT","SOF",{inf:5,cav:2,art:1}),mkArmy("OTT","BAG",{inf:2,cav:1}));
 if(c.tag==="AUS")G.armies.push(mkArmy("AUS","LOM",{inf:6,cav:2,art:2}));if(c.tag==="NED")G.armies.push(mkArmy("NED","JAV",{inf:3}));if(c.tag==="SPA")G.armies.push(mkArmy("SPA","HAV",{inf:2}),mkArmy("SPA","MNL",{inf:1}));}
/* starting armies are spread over the nation's own land so no stack starts above what its province can feed (capital first, then big, well-supplied, central or border provinces) */
function spreadForces(c){const mine=G.armies.filter(a=>a.o===c.tag&&!a.naval&&!a.reb&&a.u.length);if(!mine.length)return;const cap=c.cap,pool=[],room={};
 const prs=G.plist.filter(p=>p.o===c.tag&&p.ctl===c.tag&&!p.waste).map(p=>({p,l:supLim(p),sc:(p.id===cap?1e6:0)+supLim(p)*4+p.pop/800-dist2(cap,p.id)/40+(ADJ[p.id].some(v=>P(v).o&&P(v).o!==c.tag)?3:0)})).sort((x,y)=>y.sc-x.sc);if(!prs.length)return;
 for(const{p,l}of prs)room[p.id]=l;
 for(const a of mine){if(a.loc===cap||!room[a.loc]){pool.push(...a.u);a.u=[];}else{const keep=Math.min(a.u.length,room[a.loc]);pool.push(...a.u.splice(keep));room[a.loc]-=keep;}}
 const kc={};for(const u of pool)kc[u.k]=(kc[u.k]||0)+1;const seen={};const key=u=>{seen[u.k]=(seen[u.k]||0)+1;return seen[u.k]/kc[u.k];};
 const ord=pool.map(u=>[key(u),u]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);let free=0;for(const{p}of prs)free+=room[p.id];
 const quota={};let left=ord.length;if(left<=free){for(const{p}of prs){const n=Math.min(room[p.id],left);quota[p.id]=n;left-=n;}}
 else{let tot=0;for(const{p}of prs){const full=supLim(p);quota[p.id]=Math.floor(ord.length*full/prs.reduce((s,x)=>s+x.l,0));tot+=quota[p.id];}for(const{p}of prs){if(tot>=ord.length)break;quota[p.id]++;tot++;}for(const{p}of prs){const k=(G.armies.find(a=>a.o===c.tag&&a.loc===p.id&&!a.naval&&a.u.length)||{u:[]}).u.length;quota[p.id]=Math.max(0,quota[p.id]-k);}}
 let i=0;for(const{p}of prs){const n=quota[p.id]||0;if(n<=0)continue;let a=G.armies.find(x=>x.o===c.tag&&x.loc===p.id&&!x.naval&&!x.reb);if(!a){a=mkArmy(c.tag,p.id,{},false);G.armies.push(a);}a.u.push(...ord.slice(i,i+n));i+=n;}
 if(i<ord.length){let a=G.armies.find(x=>x.o===c.tag&&x.loc===prs[0].p.id&&!x.naval&&!x.reb);if(!a){a=mkArmy(c.tag,prs[0].p.id,{},false);G.armies.push(a);}a.u.push(...ord.slice(i));}
 G.armies=G.armies.filter(a=>a.u.length);}
/* ---------- a new game ---------- */
function newGame(player,seed){buildAdj();G={v:1,t:0,seed:seed||12345,player:player||null,c:{},prov:{},plist:[],armies:[],wars:[],price:{},pricePrev:{},log:[],msgs:[],cbs:[],ev:{},gp:[],stats:{}};UID=1;
 _SL={landAt:{},navAt:{},navP:{},c:{}};PIPE={};LVG={};
 for(const n of WORLD.nats)G.c[n.tag]=mkNation(n);
 for(const w of WORLD.provs){const p={id:w.id,n:w.n,o:w.o,ctl:w.o,x:w.x,y:w.y,t:w.t,farm:w.farm,mine:w.mine,pop:w.pop,c:w.c,mc:w.mc,mp:w.mp,f:w.f,sea:w.sea,rail:0,fort:0,port:w.sea?1:0,core:w.o?[w.o]:[],un:0,occ:0,build:[],rebels:0,col:w.f.includes("U")?0:1,waste:w.f.includes("W")};
  G.prov[p.id]=p;G.plist.push(p);if(p.o)genPops(p,G.c[p.o]);else{p.pops=[];if(!p.waste&&p.pop>0){p.pops.push(mkPop("FAR",p.c,p.pop*.93,.02,{REA:.6,CON:.4,LIB:0,SOC:0,ANL:0,COM:0,FAS:0}));p.pops.push(mkPop("LAB",p.c,p.pop*.05,.02,{REA:.6,CON:.4,LIB:0,SOC:0,ANL:0,COM:0,FAS:0}));p.pops.push(mkPop("ARI",p.c,p.pop*.02,.05,{REA:.7,CON:.3,LIB:0,SOC:0,ANL:0,COM:0,FAS:0}));}p.factories=[];p.farmCap=p.pop;p.mineCap=p.pop*.05;}}
 for(const p of G.plist){if(p.o&&C(p.o).civ&&(WORLD.fac[p.id]||p.pop>4000))p.rail=WORLD.fac[p.id]?1:0;if(p.o==="GBR"&&["LON","MID","SCO"].includes(p.id))p.rail=1;p.fort=p.id===(p.o&&C(p.o).cap)?2:p.t==="m"?1:0;}
 for(const g of GK){G.price[g]=GOODS[g].p;G.pricePrev[g]=GOODS[g].p;}
 for(const a in G.c){const ca=G.c[a];for(const b in G.c)if(a!==b)ca.rel[b]=0;startForces(ca);}
 for(const a in G.c)spreadForces(G.c[a]);
 for(const a in G.c)startLeaders(G.c[a]);
 const hist={GBR:{FRA:30,AUS:20,PRU:20,POR:80,RUS:-30,USA:10},FRA:{GBR:30,SPA:30,BEL:50,RUS:-10,PRU:-20},RUS:{PRU:60,AUS:50,OTT:-80,GBR:-30,PER:-40},AUS:{PRU:30,RUS:50,SAR:-40,PAP:60,SIC:50,TUS:60},PRU:{RUS:60,AUS:30,HAN:20,SAX:20,BAV:20,WUR:20,DEN:-20},
  OTT:{RUS:-80,EGY:-90,GRE:-60,PER:-30,GBR:20},EGY:{OTT:-90},USA:{MEX:-60,GBR:10,TEX:50},MEX:{TEX:-150,USA:-60},PER:{RUS:-40,AFG:-30},CHI:{GBR:-20,JAP:-10},BRA:{ARG:-30,URU:-20},ARG:{BRA:-30,URU:-20}};
 for(const a in hist)for(const b in hist[a])if(G.c[a]&&G.c[b]){G.c[a].rel[b]=hist[a][b];G.c[b].rel[a]=hist[a][b];}
 const allies=[["AUS","RUS"],["AUS","PRU"],["RUS","PRU"],["GBR","POR"],["AUS","SIC"],["AUS","TUS"],["AUS","PAP"]];for(const[a,b]of allies){C(a).ally.push(b);C(b).ally.push(a);}
 G.wars.push({id:"w1",att:["MEX"],def:["TEX"],goal:{k:"conquer",tag:"TEX",prov:"TEX"},ws:0,start:0});C("MEX").war.push("w1");C("TEX").war.push("w1");
 if(player){C(player).ai=false;}
 const base=()=>{for(const g of GK){G.price[g]=GOODS[g].p;G.pricePrev[g]=GOODS[g].p;}};
 calibrate();seedCash();for(let k=0;k<4;k++)econMonth(true);base();
 for(let r=0;r<3;r++){econMonth(true);for(const tag in G.c){const c=G.c[tag],st=c.stat,inc=(st.taxes||0)+(st.tariffs||0),out=(st.pay||0)+(st.gov||0);if(inc>0){const k=clamp(out*1.03/inc,.2,3);c.tax=c.tax.map(x=>clamp(x*k,.02,.8));}}}
 for(let i=0;i<2;i++)econMonth(true);for(const tag in G.c){const c=G.c[tag];c.tr=Math.max(50,(c.stat.taxes||0)*3);c.inv=0;c.debt=0;}
 for(const tag in G.c){const c=G.c[tag];if(typeof litOf==="function")c.stat.lit=litOf(c);}if(typeof rankPowers==="function")rankPowers();return G;}
