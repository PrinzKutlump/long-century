"use strict";
/* ================= MILITARY ================= */
const MEN=3;
function hostile(a,b){if(a===b)return false;if(a==="REB"||b==="REB")return true;const ca=G.c[a],cb=G.c[b];if(!ca||!cb)return false;return ca.war.some(w=>cb.war.includes(w)&&warSide(w,a)!==warSide(w,b));}
function warOf(id){return G.wars.find(w=>w.id===id);}
function warSide(wid,tag){const w=warOf(wid);if(!w)return 0;return w.att.includes(tag)?1:w.def.includes(tag)?2:0;}
function friendly(a,b){if(a===b)return true;const ca=G.c[a];if(!ca)return false;return ca.ally.includes(b)||ca.war.some(w=>warSide(w,a)===warSide(w,b)&&G.c[b]&&G.c[b].war.includes(w));}
function armyTag(a){return a.reb?"REB":a.o;}
function uStat(c,k){const u=UNITS[k],t=c?techFx(c,"atk"):0,d=c?techFx(c,"def"):0,n=c?techFx(c,"nav"):0,x=c?modUnitX(c,k):1;return u.land?{a:u.a*(1+t)*x,d:u.d*(1+d)*x}:{a:u.a*(1+n),d:u.d*(1+n)};}
function strength(a){const c=G.c[a.o];let s=0;for(const u of a.u){const st=uStat(c,u.k);s+=(st.a+st.d)*u.str*(.4+.6*u.org);}return s;}
function landUnits(c){let n=0;for(const a of G.armies)if(a.o===c.tag&&!a.naval&&!a.reb)n+=a.u.length;return n;}
/* what the armies eat and wear out, bought on the market by the state */
function milDemand(c){const d={},add=(g,q)=>{if(goodOK(c,g)&&q>0)d[g]=(d[g]||0)+q;};let men=0;
 for(const a of G.armies){if(a.o!==c.tag||a.reb)continue;const war=c.war.length>0;for(const u of a.u){const U=UNITS[u.k];for(const g in U.sup)add(g,U.sup[g]*(war?1.6:.6)*(.5+.5*c.sp.mil)*(U.land?12:6));if(U.land&&!u.mob)men+=MEN*u.str;if(u.str<1){for(const g in U.cost)add(g,U.cost[g]*Math.min(.15,1-u.str)*1.2);}}}
 for(const r of c.recq||[])for(const g in r.left)add(g,Math.min(r.left[g],UNITS[r.k].cost[g]*.6+.01)*12);
 c._men=men;const k=d;for(const g in k)k[g]/=12;return d;}
function recruit(c,k,pid){const U=UNITS[k];if(!U)return{ok:false,txt:"Unknown unit."};if(U.tech&&!c.tech[U.tech])return{ok:false,txt:"We lack the technology."};
 if(U.land){const sol=(c.stat.N&&c.stat.N.SOL)||0,men=(c._men||0)+MEN*((c.recq||[]).filter(r=>UNITS[r.k].land).length+1);if(sol<men*.85)return{ok:false,txt:"Not enough soldiers: the conscription pool is "+Math.round(sol)+"k men."};}
 else if(!P(pid).sea||P(pid).o!==c.tag)return{ok:false,txt:"Ships need a port of our own."};else if(["iron","cru","bb"].includes(k)&&(P(pid).port||0)<2)return{ok:false,txt:"This ship needs a naval base of level 2."};else if(k==="bb"&&bxl(P(pid),"dock")<1)return{ok:false,txt:"Dreadnoughts need a dry dock."};
 c.recq=c.recq||[];const ar=bxl(P(pid),"arsenal"),L=Object.assign({},U.cost);if(ar)for(const g in L)L[g]*=1-.1*ar;c.recq.push({k,pid,left:L,ar});return{ok:true,txt:U.n+" ordered at "+P(pid).n+"."};}
function recruitTick(c){if(!c.recq||!c.recq.length)return;for(const r of c.recq){let need=0;for(const g in r.left){const q=Math.min(r.left[g],UNITS[r.k].cost[g]*.6*(1+.2*(r.ar||0))+.01),got=q*((c.fill&&c.fill[g])==null?1:c.fill[g]);r.left[g]=Math.max(0,r.left[g]-got);need+=r.left[g];}
  if(need<.05){const U=UNITS[r.k],loc=P(r.pid).o===c.tag?r.pid:c.cap;let a=G.armies.find(x=>x.o===c.tag&&x.loc===loc&&!!x.naval===!U.land&&!x.path.length&&!x.reb);if(!a){a=mkArmy(c.tag,loc,{},!U.land);G.armies.push(a);}const nu={k:r.k,str:.6,org:.5};a.u.push(nu);thRecruitTo(c,a,nu,U);r.done=1;}}
 c.recq=c.recq.filter(r=>!r.done);}
/* paths: land borders cost a month or more by terrain; sea lanes need transports */
function canEnter(tag,pid,reb){const p=P(pid);if(p.waste)return false;if(reb)return p.o===reb;if(!p.o||p.o===tag)return true;const o=p.o;return friendly(tag,o)||hostile(tag,o)||(G.c[tag].access&&G.c[tag].mil&&false);}
function transports(tag){let cap=0;for(const a of G.armies)if(a.o===tag&&a.naval)for(const u of a.u)cap+=(UNITS[u.k].cap||0)*u.str;return cap;}
/* free transport capacity per departure port: ships standing in the port, minus what armies at sea have locked */
function portCaps(tag,skip){const f={};for(const b of G.armies)if(b.o===tag&&b.naval&&!b.path.length)for(const u of b.u){const k=UNITS[u.k].cap;if(k)f[b.loc]=(f[b.loc]||0)+k*u.str;}for(const b of G.armies)if(b.tr&&b!==skip&&b.o===tag)f[b.tr.p]=(f[b.tr.p]||0)-b.tr.n;return f;}
function depPort(a,p){let u=a.loc;for(const v of p){if(!ADJ[u].includes(v))return u;u=v;}return null;}
const opposed=a=>{const p=P(a.loc);return!!p.o&&hostile(a.o,p.ctl||p.o);};
/* a land army starting a sea leg locks room in the port; arriving on land releases it */
function leg(a){if(a.naval)return true;const v=a.path[0],sea=v!=null&&!ADJ[a.loc].includes(v);if(!sea){if(a.tr){a.tr=null;if(opposed(a))a.lnd=2;}return true;}if(a.tr)return true;
 const need=a.u.length,have=portCaps(a.o,a)[a.loc]||0;if(have<need-.01){a.path=[];a.dest=null;a.eta=0;if(a.o===G.player)msg("war","The army cannot sail from "+P(a.loc).n+": it needs room for "+need+" brigades and the transports there have room for "+Math.floor(have)+".");return false;}a.tr={p:a.loc,n:need};return true;}
/* why can or can't this army reach a province: for the army panel */
function seaCheck(a,to){const p=findPath(a,to),d=p?depPort(a,p):null;if(p&&!d)return{ok:1,path:p};const need=a.u.length;if(p)return{ok:1,path:p,sea:1,port:d,need,have:portCaps(a.o,a)[d]||0};
 const q=findPath(a,to,1),e=q&&depPort(a,q);if(!q||!e)return{ok:0,txt:"No way through: the road is blocked by wasteland or foreign land."};const have=portCaps(a.o,a)[e]||0;return{ok:0,port:e,need,have,txt:"Crossing water from "+P(e).n+" needs room for "+need+" brigades; the transports there have room for "+Math.floor(have)+". Build transports in that port."};}
/* supply: each province feeds a limited number of units; an army cut off from our side's land is starved of organisation */
const supLim=p=>(TERRAIN[p.t].sup||6)+p.rail*3+p.fort*2+bxl(p,"depot")*2,railK=p=>1+.15*p.rail+.06*bxl(p,"depot");
let _SL={landAt:{},navAt:{},navP:{},c:{}};
const foeOf=t=>{const c=G.c[t];if(!c)return null;for(const wid of c.war){const w=warOf(wid);if(!w)continue;const L=(warSide(wid,t)===1?w.def:w.att).filter(x=>G.c[x]&&G.c[x].alive);if(L.length)return L[0];}return null;};
function seaOpen(tag){const S=_SL;let mine=0,foe=0;for(const t in S.navP){if(friendly(tag,t))mine+=S.navP[t];else if(hostile(tag,t))foe+=S.navP[t];}return foe<=mine*2.5+10;}
/* is the army in touch with territory our side holds, by land or open sea? hops = how far from it */
function supplyLine(a){const tag=a.o,k=tag+a.loc,S=_SL;if(S.c[k])return S.c[k];const seen={[a.loc]:0},Q=[a.loc];let hops=null,coast=null;
 for(let i=0;i<Q.length;i++){const u=Q[i],pu=P(u),d=seen[u];if(pu.ctl&&(pu.ctl===tag||friendly(tag,pu.ctl))){hops=d;break;}
  if(coast==null&&pu.sea&&SEAADJ[u].length&&!(S.navAt[u]||[]).some(o=>hostile(tag,o)))coast=d;
  for(const v of ADJ[u]){if(seen[v]!=null)continue;const q=P(v);if(q.waste||!canEnter(tag,v)||(S.landAt[v]||[]).some(o=>hostile(tag,o)))continue;seen[v]=d+1;Q.push(v);}}
 return S.c[k]=hops!=null?{ok:1,hops}:coast!=null&&seaOpen(tag)?{ok:1,hops:coast+3}:{ok:0,hops:9};}
function findPath(a,to,any){const tag=a.o,naval=a.naval,reb=a.reb&&a.reb.vs,start=a.loc;if(start===to)return[];const dist={},prev={},seen=new Set(),Q=[[0,start]];dist[start]=0;const cap=naval?null:portCaps(tag,a),need=a.u.length-.01;
 while(Q.length){Q.sort((x,y)=>x[0]-y[0]);const[d,u]=Q.shift();if(seen.has(u))continue;seen.add(u);if(u===to)break;
  const edges=[];if(!naval)for(const v of ADJ[u])edges.push([v,TERRAIN[P(v).t].move/railK(P(v))+(v!==to&&a.u.length>supLim(P(v))*1.5?1.5:0)]);if((naval||any||a.tr||(cap[u]||0)>=need)&&P(u).sea)for(const[v,m]of SEAADJ[u])edges.push([v,m*(naval?.8:1.2)]);
  for(const[v,w]of edges){if(seen.has(v))continue;if(!naval&&!canEnter(tag,v,reb))continue;if(naval&&!P(v).sea)continue;const nd=d+w;if(dist[v]==null||nd<dist[v]){dist[v]=nd;prev[v]=u;Q.push([nd,v]);}}}
 if(dist[to]==null)return null;const path=[];let x=to;while(x!==start){path.unshift(x);x=prev[x];}return path;}
function orderMove(a,to){const p=findPath(a,to);if(!p)return false;a.path=p;a.dest=to;if(!leg(a))return false;a.eta=edgeTime(a,a.loc,p[0]);return true;}
function edgeTime(a,u,v){const sea=!ADJ[u].includes(v);if(sea){const e=SEAADJ[u].find(x=>x[0]===v),n=a.path[1],pv=P(v);return(e?e[1]:1)+(!a.naval&&pv.o&&(n==null||ADJ[v].includes(n))&&hostile(a.o,pv.ctl||pv.o)?1:0);}const c=G.c[a.o],sp=Math.min(...a.u.map(x=>UNITS[x.k].sp))*(1+(c?techFx(c,"move"):0))*(1+.1*((a.gen&&a.gen.mv)||0))*(1+.12*((a.it==null?1:a.it)-1));return Math.max(1,Math.round(TERRAIN[P(v).t].move/railK(P(v))/sp));}
function moveTick(){for(const a of G.armies){if(!a.path.length||a._fought)continue;if(a.hold>0){a.hold--;continue;}a.dig=0;if(a.naval&&a.u.length){const key=a.loc+">"+a.path[0];if(a._ic!==key){a._ic=key;if(laneIntercept(a)){a._fought=1;continue;}}}a.eta--;if(a.eta>0)continue;const nx=a.path.shift();a.loc=nx;a.siege=0;a._mv=1;if(a.path.length){if(leg(a))a.eta=edgeTime(a,nx,a.path[0]);}else{leg(a);a.dest=null;a._ic=null;}
  if(a.path.length&&G.armies.some(b=>b.loc===nx&&!b.naval===!a.naval&&hostile(armyTag(a),armyTag(b))&&b.u.length))a.path=[];}}
/* battles: friendly tags fight as one side; a land battle runs three rounds a month and goes on until one side cannot hold its front (at most four months). Battles in progress are plain data in G.bt */
function battleTick(){G.bt=G.bt||[];
 for(const p of G.plist){const here=G.armies.filter(a=>a.loc===p.id&&a.u.length);if(here.length<2)continue;
  for(const naval of[false,true]){const H=here.filter(a=>!!a.naval===naval);if(H.length<2)continue;const by={};for(const a of H)(by[armyTag(a)]=by[armyTag(a)]||[]).push(a);const tags=Object.keys(by);if(tags.length<2)continue;
   const cl=[];for(const t of tags){const k=cl.find(c=>c.every(x=>friendly(t,x)&&!hostile(t,x)));if(k)k.push(t);else cl.push([t]);}
   for(let i=0;i<cl.length;i++)for(let j=i+1;j<cl.length;j++){const X=cl[i],Y=cl[j];if(!X.some(x=>Y.some(y=>hostile(x,y))))continue;
    const live=a=>a.loc===p.id&&a.u.length,ax=X.flatMap(t=>by[t]).filter(a=>live(a)&&Y.some(y=>hostile(armyTag(a),y))),ay=Y.flatMap(t=>by[t]).filter(a=>live(a)&&X.some(x=>hostile(armyTag(a),x)));if(!ax.length||!ay.length)continue;
    let rec=G.bt.find(r=>r.p===p.id&&r.nv===+naval&&((r.a.some(t=>X.includes(t))&&r.d.some(t=>Y.includes(t)))||(r.a.some(t=>Y.includes(t))&&r.d.some(t=>X.includes(t)))));
    let A=ax,D=ay,aT=X,dT=Y;
    if(rec){if(rec.a.some(t=>Y.includes(t))){A=ay;D=ax;aT=Y;dT=X;}}
    else{const hold=p.ctl||p.o,own=T=>T.some(t=>t===hold||t===p.o||(hold&&friendly(t,hold)));if(own(X)){A=ay;D=ax;aT=Y;dT=X;}rec={p:p.id,nv:+naval,a:aT.slice(),d:dT.slice(),m:0,la:0,ld:0,t0:G.t};G.bt.push(rec);}
    rec.tm=G.t;if(fight(p,A,D,naval,rec))rec.end=1;}}}
 G.bt=G.bt.filter(r=>r.tm===G.t&&!r.end);}
/* the side whose general counts: that of the biggest army; each point is 8% */
function genFx(arr){let b=null;for(const a of arr)if(!b||a.u.length>b.u.length)b=a;const g=b&&b.gen;return g?{atk:1+.08*(g.atk||0),def:1+.08*(g.def||0)}:{atk:1,def:1};}
const leadTag=arr=>armyTag(arr.reduce((b,a)=>a.u.length>b.u.length?a:b));
function fight(p,A,D,naval,rec){if(naval)return seaFight(p,A,D);if(rec)return landFight(p,A,D,rec);const r={m:0,la:0,ld:0,a:[],d:[]};while(!landFight(p,A,D,r));return true;}
/* a fleet action is settled in one go */
function seaFight(p,A,D){const width=Math.max(2,Math.round(10*TERRAIN[p.t].width));let lossA=0,lossD=0;
 const fire=(arms,target)=>{const us=arms.flatMap(a=>a.u.map(u=>[a,u])),front=us.filter(([,u])=>UNITS[u.k].sup2!==1).slice(0,width),back=us.filter(([,u])=>UNITS[u.k].sup2===1).slice(0,width);
  let dmg=0;for(const[a,u]of front.concat(back)){const st=uStat(G.c[a.o],u.k);dmg+=(a.lnd?.75:1)*st.a*u.str*(.5+.5*u.org)*(UNITS[u.k].sup2===1&&front.length?1:.8);}
  const tu=target.flatMap(a=>a.u),avgD=tu.length?tu.reduce((s,u)=>s+uStat(G.c[target[0].o],u.k).d,0)/tu.length:1;dmg*=(1+Math.floor(rng()*6))/3.5*.03*2/(2+avgD*.25);
  const front2=tu.slice(0,width);let lost=0;for(const u of front2){const d=dmg/front2.length;const ls=Math.min(u.str,d*.11);u.str-=ls;lost+=ls;u.org=Math.max(0,u.org-d*.32);}return lost;};
 for(let r=0;r<6;r++){lossD+=fire(A,D);lossA+=fire(D,A);const oA=avgOrg(A),oD=avgOrg(D);if(oA<.25||oD<.25)break;}
 settle(p,A,D,avgOrg(D)<avgOrg(A),true,lossA,lossD,{m:0,la:0,ld:0});return true;}
const ELIG=.1,BRK=.3,KO=10,KS=3;
/* land battle: only as many units as the ground allows fight at once, the rest wait in reserve and step in as the front breaks; guns need two foot soldiers in front of each */
function landFight(p,A,D,rec){const width=Math.max(2,Math.round(10*TERRAIN[p.t].width)),terr=TERRAIN[p.t].def+p.fort*.5,ok=u=>u.org>=ELIG;rec.sA=rec.sA||{inf:0,cav:0,art:0};rec.sD=rec.sD||{inf:0,cav:0,art:0};
 const dg=arr=>{let n=0,d=0;for(const a of arr){n+=a.u.length;d+=(a.dig||0)*a.u.length;}return n?d/n:0;},dgA=dg(A),dgD=dg(D),gA=genFx(A),gD=genFx(D),itOf=arr=>{let s=0,n=0;for(const a of arr){s+=(a.it==null?1:a.it)*a.u.length;n+=a.u.length;}return n?s/n:1};let lossA=0,lossD=0;
 const fire=(arms,tg,def,tdig,g,gt,S)=>{const us=arms.flatMap(a=>a.u.map(u=>[a,u])),fr=us.filter(([,u])=>UNITS[u.k].sup2!==1),el=fr.filter(([,u])=>ok(u)),front=(el.length?el:fr).slice(0,width),guns=us.filter(([,u])=>UNITS[u.k].sup2===1&&ok(u)).slice(0,width);
  const foot=front.filter(([,u])=>u.k==="inf"||u.k==="mg"||u.k==="eng").length,cover=guns.length?Math.min(1,foot/(2*guns.length)):1;let dmg=0;
  for(const[a,u]of front)dmg+=(a.lnd?.75:1)*uStat(G.c[a.o],u.k).a*u.str*(.5+.5*u.org)*.8;for(const[a,u]of guns)dmg+=(a.lnd?.75:1)*uStat(G.c[a.o],u.k).a*u.str*(.5+.5*u.org)*(.3+.7*cover)*.6;
  const tu=tg.flatMap(a=>a.u),tfr=tu.filter(u=>UNITS[u.k].sup2!==1),tel=tfr.filter(ok),tf=(tel.length>=width?tel:tel.concat(tu.filter(u=>UNITS[u.k].sup2===1&&ok(u)))).slice(0,width),avgD=tu.length?tu.reduce((s,u)=>s+uStat(G.c[tg[0].o],u.k).d,0)/tu.length:1;
  const br=def?Math.min(.7,guns.length/Math.max(1,front.length+guns.length)*2.2):0,rc=Math.min(.12,front.filter(([,u])=>u.k==="cav").length/Math.max(1,front.length)*.6);if(def){rec.br=Math.max(rec.br||0,br);rec.tdg=tdig;rec.ter=terr;}rec[def?"rcA":"rcD"]=rc;
  dmg*=(1+Math.floor(rng()*6))/3.5*.06/(2+avgD*.25+(def?terr*1.2*(1-br*.5):0))/((1+.1*tdig*(1-br))*gt.def)*g.atk*(1+(itOf(arms)-1)*.1)*(1+rc);
  const d=dmg/Math.max(1,tf.length),lf=1+(itOf(tg)-1)*.18;let lost=0;for(const u of tf){const ls=Math.min(u.str,d*.11*KS*lf);u.str-=ls;lost+=ls;S[thTypeOf(u)]+=ls;u.org=Math.max(0,u.org-d*KO);}return lost;};
 const share=arr=>{let n=0,e=0;for(const a of arr)for(const u of a.u){n++;if(ok(u))e++;}return n?e/n:0;};let brk=false;
 for(let r=0;r<3&&!brk;r++){if(rng()<.5){lossD+=fire(A,D,true,dgD,gA,gD,rec.sD);lossA+=fire(D,A,false,dgA,gD,gA,rec.sA);}else{lossA+=fire(D,A,false,dgA,gD,gA,rec.sA);lossD+=fire(A,D,true,dgD,gA,gD,rec.sD);}if(share(A)<=BRK||share(D)<=BRK)brk=true;}
 rec.m++;rec.la+=lossA;rec.ld+=lossD;const sA=share(A),sD=share(D);
 if(!brk&&rec.m<4){for(const arr of[A,D])for(const a of arr){a._fought=1;a.bt=1;a.lnd=0;}
  casualty2(A,lossA*MEN);casualty2(D,lossD*MEN);const inv=A.concat(D).some(a=>a.o===G.player);
  if(inv){const me=A.some(a=>a.o===G.player)?A:D,fo=me===A?D:A,n1=me.reduce((s,a)=>s+a.u.length,0),n2=fo.reduce((s,a)=>s+a.u.length,0);msg("war","Battle of "+p.n+", month "+rec.m+": "+n1+" of our brigades against "+n2+" of "+nameOf(leadTag(fo))+(p.ctl===leadTag(me)||p.o===leadTag(me)?", holding the ground":", attacking")+". Losses so far: "+Math.round((me===A?rec.la:rec.ld)*MEN)+"k ours, "+Math.round((me===A?rec.ld:rec.la)*MEN)+"k theirs.");}
  return false;}
 const attWin=brk?(sD<=BRK&&(sA>BRK||sA>sD)):avgOrg(D)<avgOrg(A);
 const win=attWin?A:D,lose=attWin?D:A,cav=win.reduce((s,a)=>s+a.u.filter(u=>u.k==="cav").length,0),ln=lose.reduce((s,a)=>s+a.u.length,0),lc=lose.reduce((s,a)=>s+a.u.filter(u=>u.k==="cav").length,0),pur=Math.min(.25,cav/Math.max(1,ln)*.12)*(1-Math.min(.5,lc/Math.max(1,ln)*1.5));let pl=0;const sk=attWin?rec.sD:rec.sA;
 if(pur>0)for(const a of lose)for(const u of a.u){const l=u.str*pur*(.5+rng()*.5);u.str-=l;pl+=l;sk[thTypeOf(u)]+=l;}rec.pl=pl;rec.pc=cav;if(attWin)rec.ld+=pl;else rec.la+=pl;casualty2(A,(lossA+(attWin?0:pl))*MEN);casualty2(D,(lossD+(attWin?pl:0))*MEN);
 const G0=G.bs=G.bs||{n:0,m:0};G0.n++;G0.m+=rec.m;
 settle(p,A,D,attWin,false,rec.la,rec.ld,rec);return true;}
function casualty2(arr,men){const n=arr.reduce((s,a)=>s+a.u.length,0)||1;for(const a of arr)casualty(armyTag(a),men*a.u.length/n);}
/* end of a battle: the loser falls back, scores and news */
function settle(p,A,D,attWin,naval,lossA,lossD,rec){const win=attWin?A:D,lose=attWin?D:A,wt=leadTag(win),lt=leadTag(lose),brA=A.reduce((s,a)=>s+a.u.length,0),brD=D.reduce((s,a)=>s+a.u.length,0);
 for(const a of lose){a.path=[];a._lost=1;a.dig=0;a.bt=0;const back=retreatTo(a,p.id);if(back)a.loc=back;else a.u.forEach(u=>u.str*=.3);}for(const arr of[A,D])for(const a of arr){a._fought=1;a.lnd=0;a.bt=0;}
 for(const a of A.concat(D))if(a.gen&&rng()<(lose.includes(a)?.1:.03)){if(a.o===G.player)msg("war","General "+a.gen.n+" is killed at the battle of "+p.n+".");a.gen=null;}
 if(!naval&&rec.sA)thNoteBattle(p,A,D,attWin,rec,brA,brD);const menA=lossA*MEN,menD=lossD*MEN,big=menA+menD>=20;if(naval){casualty2(A,menA);casualty2(D,menD);}
 const ws=clamp((attWin?menD:menA)/Math.max(10,(attWin?brD:brA)*MEN)*30+(big?3:1),1,15);warScore(wt,lt,ws);
 const nm=(naval?"Naval battle":"Battle")+" of "+p.n;G.battles=G.battles||[];G.battles.unshift({t:G.t,p:p.id,n:nm,w:wt,l:lt,la:Math.round(menA),ld:Math.round(menD),m:rec.m||1});if(G.battles.length>60)G.battles.length=60;
 if((A.concat(D).some(a=>a.o===G.player)&&(!naval||big))||menA+menD>60)msg("war",nm+": "+nameOf(wt)+" defeats "+nameOf(lt)+(rec.m>1?" after "+rec.m+" months":"")+" ("+Math.round(menA)+"k against "+Math.round(menD)+"k lost).");}
const avgOrg=arr=>{let a=0,b=0;for(const x of arr)for(const u of x.u){a+=u.org*u.str;b+=u.str;}return b?a/b:0;};
const nameOf=t=>t==="REB"?"the rebels":G.c[t]?G.c[t].n:t;
function retreatTo(a,from){const tag=armyTag(a);let best=null,bv=-1e9;if(a.naval){for(const[v]of SEAADJ[from]){const p=P(v);if(!p.sea||p.waste)continue;const own=p.ctl===tag||friendly(tag,p.ctl||"");const enemy=G.armies.some(b=>b.loc===v&&b.naval&&b.u.length&&hostile(tag,armyTag(b)));const s=(own?20:0)+(enemy?-60:0)+(p.port||0)*3+rng();if(s>bv){bv=s;best=v;}}return best;}for(const v of ADJ[from]){const p=P(v);if(p.waste)continue;const own=a.reb?p.ctl==="REB":(p.ctl===tag||friendly(tag,p.ctl||""));if(!own)continue;const enemy=G.armies.some(b=>b.loc===v&&hostile(tag,armyTag(b)));const s=(enemy?-50:0)+(p.ctl===tag?10:0)+rng();if(s>bv){bv=s;best=v;}}return best;}
function casualty(tag,men){if(tag==="REB"||!G.c[tag]||men<=0)return;const c=G.c[tag];c.we=Math.min(100,c.we+men/Math.max(100,(c.stat.pop||1)*.004)*2);
 let pool=0;const L=[];for(const p of provsOf(tag))for(const q of p.pops)if(q.t==="SOL"){pool+=q.n;L.push(q);}if(pool>0)for(const q of L)q.n=Math.max(0,q.n-men*q.n/pool);}
/* sieges and occupation */
function siegeTick(){for(const a of G.armies){if(a.naval||!a.u.length||a.path.length)continue;const p=P(a.loc),tag=armyTag(a);if(!p.o)continue;
  const holder=p.ctl||p.o,mine=a.reb?holder==="REB":holder===tag;if(mine)continue;const enemyOwner=a.reb?p.o===a.reb.vs:hostile(tag,holder)||(holder==="REB"&&p.o===tag)||(holder!==p.o&&p.o===tag);if(!enemyOwner)continue;
  if(G.armies.some(b=>b.loc===p.id&&b.u.length&&hostile(tag,armyTag(b))))continue;
  const art=a.u.filter(u=>u.k==="art"||u.k==="eng").length;a.siege+=(a.u.length+art*2)/(4+p.fort*5)*.5*(.5+rng());
  if(a.siege>=1){a.siege=0;const prevH=p.ctl||p.o;p.ctl=a.reb?"REB":(p.o===tag?tag:tag);if(p.o===tag)p.ctl=p.o;p.un=Math.min(100,p.un+10);if(!a.reb)thNoteTake(a,p,prevH,art);if(!a.reb&&p.o!==tag){const w=p.o;warScore(tag,w,Math.min(25,p.pop/Math.max(1,popOf(w))*100+2));}
   if(tag===G.player||p.o===G.player)msg("war",p.n+(p.ctl===p.o?" is retaken.":" falls to "+nameOf(p.ctl)+"."));}}}
/* armies in the field */
const STEAMW=["iron","cru","bb"];
/* sea zones where steam warships can coal: any friendly port, a level-2 naval base and its neighbours, a coaling station and the zones two or three away */
function coalZones(tag){const S=_SL.cz=_SL.cz||{};if(S[tag])return S[tag];const z={};for(const p of G.plist){if(!p.sea||!p.o||(p.ctl!==tag&&!friendly(tag,p.ctl||"")))continue;const l=bxl(p,"coal"),rad=l?1+l:(p.port||0)>=2?1:0;z[p.id]=1;let fr=[p.id];for(let h=1;h<=rad;h++){const nx=[];for(const id of fr)for(const[v]of SEAADJ[id])if(z[v]==null){z[v]=1;nx.push(v);}fr=nx;}}return S[tag]=z;}
function armyMonth(){for(const a of G.armies){a._fought=0;a._lost=0;a.bt=0;}moveTick();battleTick();siegeTick();blockadeMonth();for(const a of G.armies){if(a.tr&&!a.path.length)a.tr=null;if(a.lnd>0)a.lnd--;if(!a.naval)a.dig=a.path.length||a._mv||a._lost?0:Math.min(a.dc||3,(a.dig||0)+1);a._mv=0;}
 const ld={},landAt={},navAt={},navP={};for(const a of G.armies)if(a.u.length&&!a.reb){if(a.naval){if(a.u.some(isWarship)&&!a.path.length)(navAt[a.loc]=navAt[a.loc]||[]).push(a.o);if(!(a.o in navP))navP[a.o]=navalPower(a.o);}else{const k=a.o+a.loc;ld[k]=(ld[k]||0)+a.u.length;(landAt[a.loc]=landAt[a.loc]||[]).push(a.o);}}
 _SL={landAt,navAt,navP,c:{}};
 for(const a of G.armies){if(!a.u.length)continue;const c=G.c[a.o],p=P(a.loc),land=!a.naval,gk=a.naval?["timber"]:["arms","ammo","canned"].filter(g=>c&&goodOK(c,g)),sup0=c&&c.fill?Math.min(1,...gk.map(g=>c.fill[g]==null?1:c.fill[g])):.7;let sup=sup0;
  if(land&&!a.reb&&c){const sl=supplyLine(a);sup=1-(1-sup0)*Math.min(1,sl.hops/4);if(sl.ok)a.cut=0;else a.cut=(a.cut||0)+1;}
  if(land&&!a.reb&&a.pri!=null&&a.pri!==1)sup=clamp(sup+(a.pri-1)*.08,0,1);const n=land?ld[a.o+a.loc]||0:0,over=(land?Math.max(0,n-supLim(p))/Math.max(1,n):0)*(a.dc>3?.6:1);
  const hf=a.naval&&!a.reb&&c&&a.u.some(u=>STEAMW.includes(u.k))&&!coalZones(a.o)[a.loc];for(const u of a.u){if(!a._fought&&!a.cut){u.org=Math.min(1,u.org+.12*(.4+.6*sup)*(c?(.5+.5*c.sp.mil):.8)*(hf&&STEAMW.includes(u.k)?.5:1));}if(c&&!a.reb&&!a.cut&&!a._fought&&p.ctl===a.o)u.str=Math.min(1,u.str+(.05+(a.naval?.06*bxl(p,"dock"):0))*sup*(a.naval||a.pri==null?1:PRI_REC[a.pri]));if(over>0)u.str-=.1*over;if(a.reb)u.str-=.01;if(a.cut)u.org=Math.min(u.org,Math.max(0,1-a.cut/3));}
  if(a.cut>3){const foe=foeOf(a.o);if(foe)warScore(foe,a.o,clamp(a.u.length*.6,1,8));if(a.o===G.player||foe===G.player)msg("war",(a.o===G.player?"Our army at "+P(a.loc).n+" is cut off and surrenders.":nameOf(a.o)+" army at "+P(a.loc).n+" is cut off and surrenders to us."));a.u=[];}
  a.u=a.u.filter(u=>u.str>.08);}
 const bylocs={};for(const a of G.armies)if(!a.u.length&&a.gen){const c=G.c[a.o];if(c&&c.alive)(c.leaders=c.leaders||[]).push(a.gen);a.gen=null;}G.armies=G.armies.filter(a=>a.u.length);for(const a of G.armies){if(a.path.length||a.reb)continue;const k=a.o+a.loc+(a.naval?(a.u.every(u=>!isWarship(u))?2:1):0)+"|"+(a.th||"")+(a.xf?"x":"");if(bylocs[k]){const m=bylocs[k];m.dig=((m.dig||0)*m.u.length+(a.dig||0)*a.u.length)/(m.u.length+a.u.length);m.u.push(...a.u);a.u=[];if(a.gen){const c=G.c[a.o];if(!m.gen||gscore(a.gen)>gscore(m.gen)){if(m.gen&&c)(c.leaders=c.leaders||[]).push(m.gen);m.gen=a.gen;}else if(c)(c.leaders=c.leaders||[]).push(a.gen);a.gen=null;}}else bylocs[k]=a;}G.armies=G.armies.filter(a=>a.u.length);
 rebelCheck();for(const tag in G.c){const c=G.c[tag];if(c.alive){recruitTick(c);genMonth(c);mobMonth(c);}if(!c.war.length)c.we=Math.max(0,c.we-.6);
 else {
  const shortage=1-clamp(c.fill.arms??1,0,1);
  const disruption=1-clamp(c.access??1,0,1);
  c.we=clamp(c.we+shortage*.6+disruption*.8-(shortage<.1&&disruption<.1?.25:0),0,100);
 }}}
function rebelCheck(){const by={};for(const p of G.plist)if(p.ctl==="REB"&&p.o){(by[p.o]=by[p.o]||[]).push(p);}
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;const held=by[tag]||[],armies=G.armies.filter(a=>a.reb&&a.reb.vs===tag);
  if(!armies.length&&held.length){for(const p of held)p.ctl=p.o;continue;}if(!held.length)continue;const share=sum(held,p=>p.pop)/Math.max(1,popOf(tag)),capHeld=held.some(p=>p.id===c.cap);
  c._rebM=(share>.3||capHeld)?(c._rebM||0)+1:0;if(c._rebM>=3){const key=armies[0].reb.key;G.armies=G.armies.filter(a=>!(a.reb&&a.reb.vs===tag));for(const p of held)p.ctl=p.o;c._rebM=0;if(key.startsWith("N:")&&secessionBlocked(c,key.slice(2))){for(const p of provsOf(tag))for(const q of p.pops)if(q.c===key.slice(2))q.mil=Math.max(0,q.mil-2);msg("war","The revolt of the "+key.slice(2)+" is put down in "+c.n+": the state is still strong enough.");}else rebelWin(c,key);}}}
/* ================= AI GENERALS ================= */
const dist2=(u,v)=>{const a=P(u),b=P(v);return Math.hypot(a.x-b.x,a.y-b.y);};
function aiRecruit(c){const pop=c.stat.pop||1,inc=c.stat.inc||1,men=c._men||0,war=c.war.length>0,threat=c.rivalStr||0,want=Math.min(pop*(c.civ?.006:.003)*(war?1.8:1),Math.max(pop*.002,threat*1.1/12))*(.6+.6*c.sp.mil);
 if((c.recq||[]).length>=3||c.tr<inc*(war?.5:2))return;
 if(c.civ){const tw=c.trWant,gp=G.gp&&G.gp.includes(c.tag),b=tw?tw.p:gp&&P(c.cap).sea?bestBase(c):null,n=tw?tw.n:12;c.trWant=null;if(b&&P(b).o===c.tag&&P(b).sea&&(portCaps(c.tag)[b]||0)+(c.recq||[]).filter(r=>UNITS[r.k].cap&&r.pid===b).length*3<n&&(tw||rng()<.3)){recruit(c,c.tech.steamer?"steam":"clip",b);return;}}
 if(men+MEN<want&&landUnits(c)<provsOf(c.tag).reduce((x,p)=>x+supLim(p),0)*.85){const k=c.tech.breech&&rng()<.25?"art":rng()<.15?"cav":c.tech.mg&&rng()<.2?"mg":"inf";recruit(c,k,c.cap);}
 if(c.civ&&P(c.cap).sea&&!war&&rng()<.04){const nav=G.armies.filter(a=>a.o===c.tag&&a.naval).reduce((s,a)=>s+a.u.length,0),wantN=["GBR"].includes(c.tag)?60:G.gp&&G.gp.includes(c.tag)?20:4;if(nav<wantN){const k=c.tech.dread&&bxl(P(c.cap),"dock")>0?"bb":c.tech.cruiser?"cru":c.tech.ironclad?"iron":rng()<.7?"frig":"clip";recruit(c,k,c.cap);}}}

/* ================= NAVAL WAR ================= */
const isWarship=u=>(UNITS[u.k].a||0)>0;
function navalPower(tag){let s=0;for(const a of G.armies)if(a.o===tag&&a.naval&&!a.reb)for(const u of a.u)if(isWarship(u)){const st=uStat(G.c[tag],u.k);s+=(st.a+st.d)*u.str*(.4+.6*u.org);}return s;}
/* a fleet starting a voyage may be caught by hostile fleets at either end of the lane, or meet one coming the other way */
function laneIntercept(a){const u=a.loc,v=a.path[0],tag=armyTag(a);
 for(const X of[v,u]){const H=G.armies.filter(b=>b!==a&&b.naval&&!b.reb&&b.u.length&&b.loc===X&&!b.path.length&&b.u.some(isWarship)&&hostile(tag,armyTag(b)));if(!H.length||rng()>(H.some(b=>b.ms==="patrol"||b.ms==="seek")?.75:.6))continue;
  fight(P(X),[a].concat(G.armies.filter(b=>b!==a&&b.naval&&!b.reb&&b.u.length&&b.loc===X&&!b.path.length&&(b.ms==="patrol"||b.ms==="landing")&&b.o===a.o&&b.u.some(isWarship))),H,true);if(a._lost){a._lost=0;if(a.u.length){a.loc=u;a.path=[];a.dest=null;a._ic=null;}}return true;}
 for(const b of G.armies){if(b===a||!b.naval||b.reb||!b.u.length||!b.path.length||!b.u.some(isWarship)||!hostile(tag,armyTag(b)))continue;
  if(b.loc===v&&b.path[0]===u&&rng()<.7){fight(P(u),[a],[b],true);for(const x of[a,b])if(x._lost){x._lost=0;x.path=[];x.dest=null;x._ic=null;}return true;}}
 return false;}
/* blockade: a port is blockaded when a hostile war fleet sits in it and none of ours does */
function blockadeMonth(){const at={};for(const a of G.armies)if(a.naval&&!a.reb&&a.u.length&&!a.path.length&&a.u.some(isWarship))(at[a.loc]=at[a.loc]||[]).push(a);
 const by={};for(const p of G.plist){if(!p.sea||!p.o||p.waste)continue;const e=by[p.o]=by[p.o]||{tot:0,blk:0,who:{}};e.tot+=p.pop;if(p.ctl!==p.o)continue;const F=at[p.id];if(!F||F.some(a=>friendly(p.o,a.o)))continue;const foes=F.filter(a=>hostile(p.o,a.o));if(!foes.length)continue;e.blk+=p.pop;for(const a of foes)e.who[a.o]=(e.who[a.o]||0)+strength(a);}
 for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;const e=by[tag],share=e&&e.tot>0?e.blk/e.tot:0;let who=null,bs=0;if(e)for(const t in e.who)if(e.who[t]>bs){bs=e.who[t];who=t;}
  const was=c.blk?c.blk.share:0;c.blk={share,by:who};c.access=share>0?Math.max(.15,1-share*.85):Math.max(.15,c.access??1);
  if(share>0&&who){warScore(who,tag,share);G.c[who].blkIn=(G.c[who].blkIn||0)+share;}
  if(tag===G.player){if(share>=.2&&was<.2)msg("war","Our ports are blockaded by "+nameOf(who)+": trade is strangled.");else if(share<.05&&was>=.2)msg("war","The blockade of our ports is lifted.");}
  else if(who===G.player&&share>=.2&&was<.2)msg("war","Our fleet now blockades "+c.n+".");}}
function bestBase(c,S,sr){let best=null,bv=-1e9;for(const p of G.plist)if(p.sea&&p.o===c.tag&&p.ctl===c.tag&&SEAADJ[p.id].length&&(!sr||SEAR_OF[p.id]===sr)){if(S&&G.armies.some(b=>b.loc===p.id&&b.naval&&b.u.length&&hostile(c.tag,armyTag(b))&&b.u.some(isWarship)&&strength(b)>S*.6))continue;const v=(p.port||0)*40-dist2(p.id,c.cap)/6+(p.id===c.cap?60:0);if(v>bv){bv=v;best=p.id;}}return best;}

/* ================= GENERALS ================= */
const GEN_AT=60,gscore=g=>g.atk+g.def+g.mv*.5,gdesc=g=>"attack "+g.atk+", defense "+g.def+", marching "+g.mv;
function rollGen(c){const st=()=>Math.floor((rng()+rng())*2.5),sn=SURN[CULG[c.cul]]||SURN.x,sur=sn[Math.floor(rng()*sn.length)];return{id:"g"+(G.gid=(G.gid||0)+1),n:String.fromCharCode(65+Math.floor(rng()*26))+". "+sur.replace(/-/g," "),atk:st(),def:st(),mv:st(),age:28+Math.floor(rng()*20)};}
const genCap=c=>Math.min(10,1+Math.ceil(landUnits(c)/10));
/* a few generals at the start, in proportion to the army */
function startLeaders(c){c.leaders=[];c.lead=rng()*GEN_AT*.5;const u=landUnits(c);if(!u)return;for(let i=0;i<Math.min(6,Math.max(1,Math.round(u/18)));i++)c.leaders.push(rollGen(c));}
/* each month: leadership grows with the officer corps and military spending; at the threshold a general appears; the old die */
function genMonth(c){const L=c.leaders=c.leaders||[],asg=G.armies.filter(a=>a.o===c.tag&&a.gen&&!a.reb),N=c.stat.N||{};
 c.lead=Math.min(GEN_AT,(c.lead||0)+Math.sqrt(N.OFF||0)*(.3+c.sp.mil)*.25);
 if(c.lead>=GEN_AT&&L.length+asg.length<genCap(c)){c.lead-=GEN_AT;const g=rollGen(c);L.push(g);if(c.tag===G.player)msg("war","A new general has risen in our army: "+g.n+" ("+gdesc(g)+").");}
 for(const g of L.concat(asg.map(a=>a.gen)))g.age+=1/12;
 for(const g of L.slice())if(g.age>58&&rng()<(g.age-58)*.004){L.splice(L.indexOf(g),1);if(c.tag===G.player)msg("war","General "+g.n+" has died of old age.");}
 for(const a of asg)if(a.gen.age>58&&rng()<(a.gen.age-58)*.004){if(c.tag===G.player)msg("war","General "+a.gen.n+" has died of old age.");a.gen=null;}}
/* AI: the best general commands the largest army, the next best the next army, and a better one in the pool replaces a poor one */
function aiGens(c,mine){const L=c.leaders=c.leaders||[];if(!L.length)return;const bs=mine.filter(a=>!a.bt).sort((a,b)=>b.u.length-a.u.length);
 for(const a of bs){if(!L.length)break;if(a.u.length<3&&a!==bs[0])continue;const best=L.reduce((b,g)=>gscore(g)>gscore(b)?g:b,L[0]);if(!a.gen||gscore(best)>gscore(a.gen)+1.5){if(a.gen)L.push(a.gen);a.gen=L.splice(L.indexOf(best),1)[0];}}}

/* ================= MOBILIZATION ================= */
// c.mob = {st:0 none|1 mobilizing|2 mobilized|3 demobilizing, t0, ph, tg:{pid:units wanted}, tk:{pid:[farmers,labourers taken,units raised]}, cost}; conscripts are infantry units flagged mob:1 with their home province h
const mobOf=c=>c.mob||(c.mob={st:0,tg:{},tk:{}});
const mobRate=c=>.012*(1+2*techFx(c,"mob"))*modMobX(c);
function landRoom(c){const at={};for(const a of G.armies)if(a.o===c.tag&&!a.naval&&!a.reb)at[a.loc]=(at[a.loc]||0)+a.u.length;return at;}
/* what mobilizing would do right now: conscripts per province (within supply limits), workers taken, price */
function mobPlan(c){const at=landRoom(c),tg={};let units=0,men=0,work=0,far=0;
 for(const p of provsOf(c.tag)){if(p.waste||p.ctl!==c.tag)continue;const n=counts(p),w=n.FAR+n.LAB;work+=w;far+=n.FAR+(p.mine?0:n.LAB*.6);const x=w*mobRate(c)/MEN*(1+.25*bxl(p,"barracks")),k=Math.floor(x)+(x%1>.5?1:0),room=Math.max(0,supLim(p)-(at[p.id]||0)),m=Math.min(k,room);if(m>0){tg[p.id]=m;units+=m;}}
 men=units*MEN;let cost=0;for(const g in UNITS.inf.cost)cost+=UNITS.inf.cost[g]*(G.price[g]||GOODS[g].p)*units*.5;
 return{tg,units,men,cost,work,share:work?men/work:0,now:landUnits(c)};}
function mobCan(c,pl){const m=mobOf(c);if(m.st)return m.st===3?"Demobilization is still under way.":"Already mobilized.";if(c.mobT&&G.t-c.mobT<3)return"The army has only just gone home; wait a few months.";pl=pl||mobPlan(c);if(pl.units<1)return"No province has room to feed more troops.";if(c.tr<pl.cost)return"We cannot afford the uniforms and rifles: £"+Math.round(pl.cost).toLocaleString("en-US")+" needed.";return"";}
function mobilize(c){const pl=mobPlan(c),bad=mobCan(c,pl);if(bad)return{ok:false,txt:bad};
 c.tr-=pl.cost;c.mob={st:1,t0:G.t,ph:0,tg:pl.tg,tk:{},cost:pl.cost,n:pl.units};
 msg("war",c.n+" is mobilizing its army.");const nb={};for(const p of provsOf(c.tag))for(const v of ADJ[p.id]){const o=P(v).o;if(o&&o!==c.tag)nb[o]=1;}
 for(const t in G.c){const o=G.c[t];if(t===c.tag||!o.alive||!o.rel)continue;o.rel[c.tag]=(o.rel[c.tag]||0)-(nb[t]?8:1);}
 return{ok:true,txt:"Mobilization ordered: "+pl.units+" brigades will be raised over two months."};}
function demobilize(c){const m=mobOf(c);if(m.st===0||m.st===3)return{ok:false,txt:"We are not mobilized."};m.st=3;return{ok:true,txt:"Demobilizing: the men go home next month."};}
function mobRaise(c,m){const at=landRoom(c);for(const pid in m.tg){const p=P(pid);if(p.ctl!==c.tag)continue;const tk=m.tk[pid]=m.tk[pid]||[0,0,0];const want=m.ph<2?Math.ceil(m.tg[pid]/2):m.tg[pid];let k=Math.min(want-tk[2],Math.max(0,supLim(p)-(at[pid]||0)));if(k<=0)continue;
  const F=p.pops.filter(q=>q.t==="FAR"),L=p.pops.filter(q=>q.t==="LAB"),nF=sum(F,q=>q.n),nL=sum(L,q=>q.n);k=Math.min(k,Math.floor((nF+nL)*.9/MEN));if(k<=0)continue;const take=k*MEN,tF=take*nF/(nF+nL),tL=take-tF;
  for(const q of F)q.n-=tF*q.n/nF;for(const q of L)q.n-=tL*q.n/nL;tk[0]+=tF;tk[1]+=tL;tk[2]+=k;
  let a=G.armies.find(x=>x.o===c.tag&&x.loc===pid&&!x.naval&&!x.path.length&&!x.reb);if(!a){a=mkArmy(c.tag,pid,{},false);G.armies.push(a);}for(let i=0;i<k;i++)a.u.push({k:"inf",str:.7,org:.35,mob:1,h:pid});}}
function mobMonth(c){const m=c.mob;if(!m||!m.st)return;
 if(m.st===3){const back={};for(const a of G.armies)if(a.o===c.tag&&!a.naval&&!a.reb){let n=0;for(const u of a.u)if(u.mob){back[u.h]=(back[u.h]||0)+u.str*MEN;n++;}if(n){a.u=a.u.filter(u=>!u.mob);if(!a.u.length&&a.gen){(c.leaders=c.leaders||[]).push(a.gen);a.gen=null;}}}
  G.armies=G.armies.filter(a=>a.u.length);
  for(const pid in back){const p=P(pid),tk=m.tk[pid]||[1,0,1],f=tk[0]/Math.max(.01,tk[0]+tk[1]),mk=(t)=>{let q=p.pops.filter(x=>x.t===t).sort((a,b)=>b.n-a.n)[0];if(!q){const o=p.pops.find(x=>x.t==="FAR")||p.pops[0];q=mkPop(t,o?o.c:p.c,0,o?o.lit:.1,o?Object.assign({},o.id):{REA:.6,CON:.4,LIB:0,SOC:0,ANL:0,COM:0,FAS:0});p.pops.push(q);}return q;};
   mk("FAR").n+=back[pid]*f;if(back[pid]*(1-f)>0)mk("LAB").n+=back[pid]*(1-f);}
  c.mob={st:0,tg:{},tk:{},last:{t0:m.t0,t1:G.t,n:m.n}};c.mobT=G.t;if(c.tag===G.player)msg("war","Our army is demobilized; the survivors are back at work.");return;}
 m.ph++;if(m.st===1){mobRaise(c,m);if(m.ph>=2){m.st=2;if(c.tag===G.player)msg("war","Mobilization is complete.");}}
 for(const pid in m.tk){const p=P(pid);if(p.o===c.tag)for(const q of p.pops)if(q.mil<5)q.mil=Math.min(5,q.mil+.08);}}
/* AI: mobilize when a foe has at least 70% of our land strength, go home at peace */
function aiMob(c){const m=mobOf(c);if(m.st===3)return;if(!c.war.length){if(m.st&&G.t-m.t0>=2)demobilize(c);return;}
 if(m.st||G.t%2||(c.mobT&&G.t-c.mobT<6))return;const by={};for(const a of G.armies)if(!a.naval&&!a.reb&&a.u.length)by[a.o]=(by[a.o]||0)+strength(a);const own=by[c.tag]||0;let foe=0;
 for(const wid of c.war){const w=warOf(wid);if(!w)continue;for(const t of(warSide(wid,c.tag)===1?w.def:w.att))foe=Math.max(foe,by[t]||0);}
 if(foe>0&&foe>=.7*own)mobilize(c);}
/* a war whose side has no living nation is over (a dead nation cannot sign peace) */
function purgeWars(){let gone=0;for(const w of G.wars.slice()){w.att=w.att.filter(t=>G.c[t]&&G.c[t].alive);w.def=w.def.filter(t=>G.c[t]&&G.c[t].alive);if(!w.att.length||!w.def.length){G.wars=G.wars.filter(x=>x!==w);gone=1;}}
 if(gone)for(const t in G.c){const c=G.c[t];if(c.war.length)c.war=c.war.filter(id=>G.wars.some(w=>w.id===id));}}
