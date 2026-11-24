"use strict";
/* ================= THEATRES (W1-W3): the player and the AI command theatres; armies are hidden machinery ================= */
const STANCES=[["attack","Attack","Push into enemy ground on the objective. Plainly hopeless attacks are refused unless the push is all-out."],["probe","Probe","Small attacks on weak spots only, with few losses."],["hold","Hold","Stay where the men are and fight off attacks."],["dig","Dig in","Hold, build trenches (about 15% better defence than a plain hold after a few months) and use less supply."],["fall","Fall back","Give ground slowly toward our hub or a line we name, rather than fight a stronger enemy."],["garr","Garrison","Keep watch over our land, hunt rebels, and return to the hub when there is nothing to do."]];
const STN={};STANCES.forEach(s=>STN[s[0]]=s);
const INT_N=["Cautious","Normal","All-out"],PRI_N=["Low","Normal","High"];
const thTypeOf=u=>u.k==="cav"?"cav":UNITS[u.k].sup2===1?"art":"inf";
function thGet(tag,reg,make){G.th=G.th||{};const T=G.th[tag]=G.th[tag]||{};let t=T[reg];if(!t&&make)t=T[reg]={st:"hold",ob:"",it:1,pr:1,t0:G.t};return t;}
/* every land army belongs to a theatre; old saves and new recruits are assigned by where they stand */
function thSync(){G.th=G.th||{};if(G.player&&G.c[G.player])navSync(G.player);for(const c of Object.values(G.c))for(const g of c.leaders||[])if(!g.id)g.id="g"+(G.gid=(G.gid||0)+1);for(const a of G.armies){if(a.gen&&!a.gen.id)a.gen.id="g"+(G.gid=(G.gid||0)+1);if(a.naval||a.reb)continue;if(a.xf&&!a.path.length)a.xf=null;if(a.th!=="res"&&!REGION[a.th])a.th=REG_OF[a.loc];}}
function thBrig(tag,reg){const r={inf:0,cav:0,art:0,con:0,n:0,mv:0};for(const a of G.armies)if(a.o===tag&&!a.naval&&!a.reb&&a.th===reg){for(const u of a.u){r[thTypeOf(u)]++;if(u.mob)r.con++;r.n++;if(a.xf)r.mv++;}}return r;}
/* the hub: our best province in the region, by railway, port, size and fortress */
function thHub(tag,reg){const R=REGION[reg],c=G.c[tag];let best=null,bv=-1;if(!R)return null;for(const id of R.p){const p=P(id);if(p.ctl!==tag||p.waste)continue;const v=p.rail*3+(p.sea?1.5:0)+p.pop/3000+p.fort+(id===c.cap?4:0);if(v>bv){bv=v;best=id;}}return best;}
/* regions where we hold land, have brigades, or face an enemy: the theatres we may command */
function thList(tag){const set=new Set(),c=G.c[tag];for(const p of G.plist)if(p.ctl===tag&&!p.waste)set.add(REG_OF[p.id]);for(const a of G.armies)if(a.o===tag&&!a.naval&&!a.reb&&REGION[a.th])set.add(a.th);return[...set];}
/* enemy ground in a region, and the regions that touch our theatre on land */
function thFoes(tag){const c=G.c[tag],e=new Set();for(const wid of c.war){const w=warOf(wid);if(w)(warSide(wid,tag)===1?w.def:w.att).forEach(t=>e.add(t));}return e;}
function thFronts(tag,reg){const e=thFoes(tag),out={};if(!e.size)return[];const R=REGION[reg];const mine=new Set(R.p.filter(id=>P(id).ctl===tag));for(const a of G.armies)if(a.o===tag&&!a.naval&&!a.reb&&a.th===reg)mine.add(a.loc);
 for(const id of mine)for(const v of ADJ[id]){const q=P(v);if(q.waste||!e.has(q.ctl))continue;const r=REG_OF[v];out[r]=(out[r]||0)+1;}return Object.keys(out).sort((a,b)=>out[b]-out[a]).map(r=>({r,n:out[r]}));}
/* what a theatre may be told to attack or fall back to: a short list */
function thObjs(tag,reg,st){const c=G.c[tag],e=thFoes(tag),L=[];const hub=thHub(tag,reg)||(REGION[reg].p[0]);
 if(st==="fall"){for(const id of REGION[reg].p){const p=P(id);if(p.ctl===tag&&!p.waste)L.push([id,p.n]);}return L.slice(0,8);}
 if(!e.size)return L;const seen={};for(const p of G.plist){if(!p.o||p.waste)continue;const own=p.o===tag;if(!(e.has(p.ctl)||(own&&p.ctl!==tag)))continue;const r=REG_OF[p.id];(seen[r]=seen[r]||{r,n:0,d:dist2(hub,REGION[r].p[0])})  .n++;}
 const rs=Object.values(seen).sort((a,b)=>a.d-b.d).slice(0,7);for(const x of rs)L.push([x.r,REGION[x.r].n+" ("+x.n+" province"+(x.n>1?"s":"")+")"]);
 for(const wid of c.war){const w=warOf(wid);if(w&&w.goal&&w.goal.prov&&!L.some(x=>x[0]===w.goal.prov))L.push([w.goal.prov,"War aim: "+P(w.goal.prov).n]);}return L;}
/* a coast to land on, in a region where we hold nothing: enemy ground in a war, or land nobody owns */
function thLand(tag,reg){const e=thFoes(tag);let b=null;for(const id of REGION[reg].p){const p=P(id);if(!p.sea||p.waste)continue;if(e.has(p.ctl)||!p.o){if(!b||(e.has(p.ctl)&&!e.has(P(b).ctl)))b=id;}}return b;}
function thEta(a,path){const q={o:a.o,loc:a.loc,u:a.u,naval:!!a.naval,path:[],gen:a.gen};let eta=0,u=a.loc;for(let i=0;i<path.length;i++){q.path=path.slice(i);eta+=edgeTime(q,u,path[i]);u=path[i];}return eta;}
/* move brigades between theatres: want = {inf,cav,art}; dry run only reports. To "res" means the capital. */
function thTransfer(tag,from,to,want,dry,destP){const c=G.c[tag];if(from===to&&!destP)return{ok:0,txt:"They are already there."};
 const dest=destP||(to==="res"?c.cap:thHub(tag,to)||thLand(tag,to));if(!dest)return{ok:0,txt:"We hold no ground in "+REGION[to].n+" and have no enemy or unclaimed coast to land on."};
 const pool=G.armies.filter(a=>a.o===tag&&!a.naval&&!a.reb&&a.th===from&&!a.bt&&a.u.length&&!(a.path.length&&a.dest===dest)&&!(a.loc===dest&&from===to)).sort((x,y)=>(x.path.length?1:0)-(y.path.length?1:0)||dist2(x.loc,dest)-dist2(y.loc,dest));
 const take=new Map(),left=Object.assign({inf:0,cav:0,art:0},want);let got=0;
 for(const a of pool){const ix=[];a.u.forEach((u,i)=>{const t=thTypeOf(u);if(left[t]>0){left[t]--;ix.push(i);}});if(ix.length){take.set(a,ix);got+=ix.length;}}
 if(!got)return{ok:0,txt:"There are no brigades of that kind free to move."};
 let eta=0,fail=0,fb=0,sent=0;const moves=[];
 for(const[a,ix]of take){const whole=ix.length===a.u.length;let b;if(whole)b=a;else{b=mkArmy(tag,a.loc,{},false);b.u=ix.map(i=>a.u[i]);b.th=from;}
  const pth=b.loc===dest?[]:findPath(b,dest);if(!pth){fail++;fb+=ix.length;continue;}eta=Math.max(eta,pth.length?thEta(b,pth):0);if(dry)continue;moves.push([a,b,ix,whole,pth]);}
 if(dry)return{ok:got-fb>0?1:0,n:got-fb,eta,txt:got-fb>0?"":"No way through."};
 for(const[a,b,ix,whole]of moves){const keep=!whole;if(keep){const set=new Set(ix);a.u=a.u.filter((u,i)=>!set.has(i));G.armies.push(b);}
  const ph=b.th;if(b.loc===dest){b.path=[];b.dest=null;b.th=to;b.xf=null;sent+=b.u.length;continue;}b.th=to;b.xf={to:dest,t:G.t};if(!orderMove(b,dest)){b.xf=null;b.th=ph;if(keep){a.u.push(...b.u);b.u=[];G.armies=G.armies.filter(x=>x!==b);}fail++;continue;}sent+=b.u.length;}
 return{ok:sent>0?1:0,n:sent,eta,txt:sent?"":"The brigades cannot sail or march there now (see the war messages)."};}
/* per-nation context built once a month: foes, our armies, their strength by province, and every province worth attacking or relieving */
function thCtx(c){const tag=c.tag,enemies=thFoes(tag),all=[],load={},def={},defL={},ea=[];
 for(const a of G.armies){if(!a.u.length)continue;if(a.o===tag&&!a.reb&&!a.naval){all.push(a);const k=a.path.length?a.path[a.path.length-1]:a.loc;load[k]=(load[k]||0)+a.u.length;}else if(enemies.size&&hostile(tag,armyTag(a))){const s=strength(a);def[a.loc]=(def[a.loc]||0)+s;if(!a.naval&&!a.reb){defL[a.loc]=1;ea.push(a);}}}
 const tg=[],tgs=new Set();if(enemies.size){for(const p of G.plist){if(!p.o||p.waste)continue;const own=p.o===tag;if(enemies.has(p.ctl)||(own&&p.ctl!==tag)){tg.push({p,own,def:def[p.id]||0,ch:0});tgs.add(p.id);}}
  for(const id in defL)if(!tgs.has(id)){const p=P(id);if(!p.waste)tg.push({p,own:false,def:def[id]||0,ch:1});}}
 const goal=new Set();for(const wid of c.war){const w=warOf(wid);if(w&&w.goal&&w.goal.prov)goal.add(w.goal.prov);}
 return{c,tag,enemies,all,load,def,tg,goal,ea,rebels:G.armies.filter(a=>a.reb&&a.reb.vs===tag),rebProv:G.plist.filter(p=>p.o===tag&&p.ctl==="REB")};}
/* the worth of a target to one army: the old rule of the generals, now shared by the player's theatres and the AI */
const thWorth=(X,a,t,s,gs)=>{const p=t.p;return(t.own?30:0)+(X.goal.has(p.id)?25:0)+(p.id===(G.c[p.o]&&G.c[p.o].cap)?15:0)+(t.ch?10:0)+p.pop/1000-dist2(a.loc,p.id)/60-t.def/Math.max(1,Math.max(s,gs))*10;};
/* theatreOrders: turns a theatre's stance and objective into army orders for this month. Player and AI use this and nothing else. */
function theatreOrders(tag,reg,X){const c=G.c[tag],T=thGet(tag,reg);if(!T||!c)return;X=X||thCtx(c);
 const mine=X.all.filter(a=>a.th===reg&&!a.xf),st=T.st||"hold",it=T.it==null?1:T.it,ob=T.ob||"";
 for(const a of mine){a.it=st==="probe"?0:it;a.pri=T.pr==null?1:T.pr;a.dc=st==="dig"?5:3;}
 const live=mine.filter(a=>!a.path.length&&!a.bt);if(!live.length)return;
 const{enemies,rebels,rebProv,load,def}=X,cap=id=>Math.floor(supLim(P(id))*1.2);
 const att=st==="attack"||st==="probe",hunt=att||st==="garr";
 const send=(a,n,t)=>{let b=a;if(n<a.u.length){b=mkArmy(a.o,a.loc,{},false);b.u=a.u.splice(0,n);b.th=a.th;b.it=a.it;b.pri=a.pri;b.dc=a.dc;G.armies.push(b);}if(orderMove(b,t)){load[a.loc]-=n;load[t]=(load[t]||0)+n;return true;}if(b!==a){a.u.push(...b.u);b.u=[];}return false;};
 const idleAt={};for(const b of live)(idleAt[b.loc]=idleAt[b.loc]||[]).push(b);
 const grpOf=t=>{const g=[];for(const v of ADJ[t])for(const b of idleAt[v]||[])if(b.u.length&&!b.path.length)g.push(b);return g;};
 const rally=t=>{const g=grpOf(t).filter(b=>{const q=findPath(b,t);return q&&q.length===1&&ADJ[b.loc].includes(t);});if(g.length<2)return false;const et=g.map(b=>edgeTime(b,b.loc,t)),Tm=Math.max(...et);let ok=0;g.forEach((b,i)=>{const n=b.u.length,from=b.loc;if(orderMove(b,t)){b.hold=Tm-et[i];ok++;load[from]-=n;load[t]=(load[t]||0)+n;}});return ok>0;};
 /* the ground this theatre may reach: its objective, or else its own region and the regions beside its men */
 const near=new Set([reg]);for(const a of mine){near.add(REG_OF[a.loc]);for(const v of ADJ[a.loc])near.add(REG_OF[v]);}
 const inScope=t=>ob?(ob===t.p.id||ob===REG_OF[t.p.id]||(t.own&&near.has(REG_OF[t.p.id]))):near.has(REG_OF[t.p.id]);
 const hub=thHub(tag,reg),line=ob&&!REGION[ob]&&P(ob)&&P(ob).ctl===tag?ob:hub;
 const thr=st==="probe"?.4:it===0?.55:it===2?1.6:.8;
 for(const a of live){if(a.path.length||a.bt)continue;const s=strength(a),cand=[];
  if(st==="fall"){if(line&&a.loc!==line&&ADJ[a.loc].some(v=>def[v]>0||def[a.loc]>0)){if(send(a,a.u.length,line))continue;}}
  if(hunt){for(const r of rebels){const v=s/(strength(r)+1)*10-dist2(a.loc,r.loc)/100;if(s>strength(r)*1.2)cand.push([v,r.loc]);}for(const p of rebProv)cand.push([5-dist2(a.loc,p.id)/100,p.id]);}
  if(att){for(const t of X.tg){if(!inScope(t))continue;const p=t.p,gs=ADJ[p.id].includes(a.loc)?sum(grpOf(p.id),strength):s,big=Math.max(s,gs);if(t.def>big*thr){T.skip=G.t;T.skr=t.def/Math.max(1,big);continue;}cand.push([thWorth(X,a,t,s,gs),p.id,t.def>s*thr]);}}
  if(st==="garr"&&!cand.length&&hub&&a.loc!==hub&&P(a.loc).ctl===tag)cand.push([0,hub]);
  cand.sort((x,y)=>y[0]-x[0]);let sent=0;
  /* a stack facing the enemy on our own ground leaves a fifth behind as a reserve line */
  const front=P(a.loc).ctl===tag&&a.u.length>=4&&ADJ[a.loc].some(v=>def[v]>0),keep=front?Math.ceil(a.u.length*.2):0;
  for(const[,t,rl]of cand.slice(0,4)){if(t===a.loc){sent=1;break;}if(rl){if(rally(t)){sent=1;break;}continue;}const avail=a.u.length-(P(t).ctl===tag?0:keep),n=Math.min(avail,cap(t)-(load[t]||0));if(n<Math.min(3,avail))continue;if(send(a,n,t)){sent=1;break;}if(!a.path.length&&!(a.u.length))break;}
  if(sent&&a.path.length)continue;
  const ex=(load[a.loc]||0)-cap(a.loc);if(ex>0&&a.u.length&&!a.path.length){const L=[],n=Math.min(ex,a.u.length);for(const p of G.plist){if(p.o!==tag||p.ctl!==tag||p.waste||p.id===a.loc)continue;const room=cap(p.id)-(load[p.id]||0);if(room<Math.min(3,n))continue;L.push([Math.min(room,n)*2-dist2(a.loc,p.id)/40,p.id]);}L.sort((x,y)=>y[0]-x[0]);for(const[,id]of L.slice(0,4))if(send(a,Math.min(n,cap(id)-(load[id]||0)),id))break;}}}
/* the AI chooses stances, objectives and transfers; it works from the same facts the player is shown */
/* ================= W4: what happened on each front, and the odds ================= */
const TERR_IN={p:"on the plains",h:"in the hills",m:"in the mountains",f:"in the forest",j:"in the jungle",d:"in the desert",s:"on the steppe"};
const hash01=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}h^=h>>>13;h=Math.imul(h,1274126177);h^=h>>>16;return(h>>>0)/4294967296;};
const thZero=()=>({inf:0,cav:0,art:0});
/* G.thr[tag][theatre]: this month's record, with last month's kept beside it; fr[enemy region] is one front */
function thRec(tag,reg,E){G.thr=G.thr||{};const A=G.thr[tag]=G.thr[tag]||{};let R=A[reg];if(!R)R=A[reg]={t:G.t,fr:{}};if(R.t!==G.t){if(Object.keys(R.fr).length)R.pv={t:R.t,fr:R.fr};R.t=G.t;R.fr={};}
 return R.fr[E]||(R.fr[E]={b:0,w:0,l:0,lost:thZero(),kill:thZero(),taken:[],lostP:[],why:"",wt:0,sg:0});}
function thWhy(p,att,won,n1,n2,rec,rcM,rcF){const tn=TERR_IN[p.t]||"",dg=rec.tdg||0,br=rec.br||0,pl=rec.pl||0;let s;
 if(!won&&n2>=n1*1.3)s="outnumbered "+(n2/Math.max(1,n1)).toFixed(1)+" to 1 "+tn;
 else if(!won&&att&&dg>=2&&br<.2)s="attacked dug-in men "+tn+" with too few guns";
 else if(won&&att&&br>=.2&&dg>=1)s="our guns broke their trenches "+tn;
 else if(won&&!att&&dg>=2)s="our trenches held "+tn;
 else if(won&&n1>=n2*1.3)s="outnumbered them "+(n1/Math.max(1,n2)).toFixed(1)+" to 1 "+tn;
 else s=(won?"won":"lost")+" a close fight "+tn+", "+n1+" brigades against "+n2;
 if(pl>.05&&(rec.pc||0)>0)s+=won?"; our cavalry ran down the beaten":"; their cavalry hunted our retreat";
 if(won&&rcM>=.05&&rcM>rcF)s+="; our scouts found the weak point";
 return s;}
function thNoteBattle(p,A,D,attWin,rec,brA,brD){const big=arr=>arr.reduce((b,a)=>a.u.length>b.u.length?a:b,arr[0]),sides=[[A,D,rec.sA,rec.sD,brA,brD,attWin,1,rec.rcA||0,rec.rcD||0],[D,A,rec.sD,rec.sA,brD,brA,!attWin,0,rec.rcD||0,rec.rcA||0]];
 for(const[me,fo,mine,theirs,n1,n2,won,att,rcM,rcF]of sides){const fl=big(fo);
  for(const tag of new Set(me.filter(a=>!a.reb).map(armyTag))){if(!G.c[tag])continue;const mm=me.filter(a=>armyTag(a)===tag),b=big(mm),f=mm.reduce((s,a)=>s+a.u.length,0)/Math.max(1,n1),reg=REGION[b.th]?b.th:REG_OF[p.id],E=att?REG_OF[p.id]:(REGION[fl.th]?fl.th:REG_OF[p.id]),F=thRec(tag,reg,E);
   F.b++;if(won)F.w++;else F.l++;for(const k in F.lost){F.lost[k]+=mine[k]*f;F.kill[k]+=theirs[k]*f;}
   if(n1+n2>=F.wt){F.wt=n1+n2;F.why=thWhy(p,att,won,n1,n2,rec,rcM,rcF);}}}}
function thNoteTake(a,p,prevH,art){const tag=armyTag(a);if(a.reb||!G.c[tag])return;const reg=REGION[a.th]?a.th:REG_OF[p.id],E=REG_OF[p.id];
 const F=thRec(tag,reg,E);F.taken.push(p.n);if(art>=2){F.sg++;if(!F.why)F.why="our guns shortened the siege of "+p.n;}
 if(prevH&&prevH!==tag&&G.c[prevH]){const F2=thRec(prevH,E,REGION[a.th]?a.th:REG_OF[a.loc]);F2.lostP.push(p.n);}}
/* ---- odds: one calculation for the minister, the map chips and the AI. Expected losses are in full-strength brigades. ---- */
const newF=()=>({b:0,s:0,cav:0,art:0,inf:0,dg:0,n:0,big:null,k:{inf:0,cav:0,art:0},org:0});
function addF(o,a){o.s+=strength(a);for(const u of a.u){o.b+=u.str;const t=thTypeOf(u);o.k[t]++;o.org+=u.org*u.str;if(t==="cav")o.cav+=u.str;else if(t==="art")o.art+=u.str;else o.inf+=u.str;}o.dg+=(a.dig||0)*a.u.length;o.n+=a.u.length;if(!o.big||a.u.length>o.big.u.length)o.big=a;}
function finF(o){o.dg=o.n?o.dg/o.n:0;o.gen=o.big&&o.big.gen||null;return o;}
function thMine(X,reg){X.mc=X.mc||{};if(X.mc[reg])return X.mc[reg];const o=newF();for(const a of X.all)if(a.th===reg)addF(o,a);return X.mc[reg]=finF(o);}
function thTheirs(X,E){X.qc=X.qc||{};if(X.qc[E])return X.qc[E];const o=newF();for(const a of X.ea)if(REG_OF[a.loc]===E)addF(o,a);return X.qc[E]=finF(o);}
/* how well we see them: cavalry out scouting sharpens the estimate (plus or minus 20%, 14% or 8%) */
const thFog=F=>{const f=F.b?F.cav/F.b:0;return f>=.12?.08:f>=.06?.14:.2;};
const thTerrP=id=>TERRAIN[P(id).t].def+P(id).fort*.5;
function thTerrAt(X,E){const ids=[...new Set(X.ea.filter(a=>REG_OF[a.loc]===E).map(a=>a.loc))];if(!ids.length)for(const id of REGION[E].p){const p=P(id);if(X.enemies.has(p.ctl)||(p.o===X.tag&&p.ctl!==X.tag))ids.push(id);}return ids.length?sum(ids,thTerrP)/ids.length:0;}
function thTerrOwn(X,reg){const ids=[...new Set(X.all.filter(a=>a.th===reg).map(a=>a.loc))];return ids.length?sum(ids,thTerrP)/ids.length:0;}
const thVal=(p,X)=>p.pop/1000+3+((p.o===X.tag&&p.ctl!==X.tag)?30:0)+(X.goal.has(p.id)?25:0)+(p.id===(G.c[p.o]&&G.c[p.o].cap)?15:0);
/* mode att: we attack into region E with a share of the theatre; mode def: they come at us from E; dgx: trenches we may have dug by then */
function thCalc(X,reg,E,mode,T,share,dgx){const tag=X.tag,F=thMine(X,reg),Q=thTheirs(X,E),it=T&&T.it!=null?T.it:1,fog=thFog(F),est=1+(hash01(tag+reg+E+G.t)*2-1)*fog,Qs=Q.s*est,Qb=Q.b*est,gA=g=>1+.08*(g?g.atk:0),gD=g=>1+.08*(g?g.def:0),cv=o=>1+Math.min(.12,o.cav/Math.max(1,o.b)*.6);let ratio,terr;
 /* fitted to the battle engine: the attacker needs about 1.1 to 1 on plains, 1.3 in hills, 1.5 in mountains; guns cut the value of ground and trenches */
 if(mode==="att"){terr=thTerrAt(X,E);const br=Math.min(.7,F.art/Math.max(1,F.b)*2.2);ratio=F.s*share*gA(F.gen)*cv(F)*(1+(it-1)*.1)/Math.max(.01,Qs*1.08*(1+.22*terr*(1-br*.5))*(1+.1*Q.dg*(1-br))*gD(Q.gen));}
 else{terr=thTerrOwn(X,reg);const br=Math.min(.7,Q.art/Math.max(1,Q.b)*2.2);ratio=F.s*share*1.08*(1+.22*terr*(1-br*.5))*(1+.1*Math.max(F.dg,dgx||0)*(1-br))*gD(F.gen)*(1+(it-1)*.1)/Math.max(.01,Qs*gA(Q.gen)*cv(Q));}
 ratio=clamp(ratio,.05,40);const odds=clamp(1/(1+Math.pow(ratio,-6)),.03,.97),m=Math.min(F.b*share,Qb),nb=2+m/8,sq=Math.sqrt(Math.max(.2,m/8)),lf=1+(it-1)*.18;
 return{E,mode,odds,ratio,lo:nb*(.12+.2*(1-odds))*sq*lf*(mode==="att"?1:.85),lt:nb*(.12+.2*odds)*sq,terr,fog,ours:F.b,theirs:Qb,seen:Q.b>.05};}
/* the options for a theatre, valued: the gain from ground won or held, minus our losses, plus theirs */
function thEval(X,reg){const tag=X.tag,T=thGet(tag,reg)||{it:1},R=REGION[reg],en=X.enemies,mineP=R.p.filter(id=>P(id).ctl===tag&&!P(id).waste),mset=new Set(mineP);for(const a of X.all)if(a.th===reg)mset.add(a.loc);
 const hl=new Set(X.ea.map(a=>a.loc)),Vh={};
 for(const id of mineP){let t=hl.has(id)?reg:null;for(const v of ADJ[id]){const q=P(v);if(!q.waste&&(hl.has(v)||en.has(q.ctl)))t=t||REG_OF[v];}if(t)Vh[t]=(Vh[t]||0)+thVal(P(id),X);}
 const Ds=Object.keys(Vh),W=sum(Ds,j=>thTheirs(X,j).s+.5)||1,wt=j=>(thTheirs(X,j).s+.5)/W,totH=sum(Ds,j=>Vh[j]);
 const defAll=dgx=>{let ev=0,lo=0,lt=0,pw=0;for(const j of Ds){const r=thCalc(X,reg,j,"def",T,wt(j),dgx);ev-=(1-r.odds)*Vh[j];lo+=r.lo;lt+=r.lt;pw+=r.odds*Vh[j];}return{ev:ev-lo*2+lt,lo,lt,odds:totH?pw/totH:1};};
 const dig=defAll(3),hold=defAll(0),fall={ev:-.55*totH-dig.lo*.8+dig.lt*.5,lo:dig.lo*.4,lt:dig.lt*.5,odds:0};
 const cand=new Set(Ds);for(const o of thObjs(tag,reg,"attack")){const r=REGION[o[0]]?o[0]:REG_OF[o[0]];if(r)cand.add(r);if(cand.size>=5)break;}
 const hub=thHub(tag,reg)||R.p[0],att=[];
 for(const E of cand){const L=REGION[E].p.map(P).filter(q=>!q.waste&&(en.has(q.ctl)||(q.o===tag&&q.ctl!==tag)));if(!L.length)continue;let adj=L.filter(q=>ADJ[q.id].some(v=>mset.has(v)));if(!adj.length)adj=L.sort((a,b)=>dist2(hub,a.id)-dist2(hub,b.id)).slice(0,2);
  const Va=adj.map(q=>thVal(q,X)).sort((a,b)=>b-a).slice(0,3).reduce((s,v)=>s+v,0),a=thCalc(X,reg,E,"att",T,Ds.length?.8:1,0);let rest=0,lr=0;
  for(const j of Ds)if(j!==E){const r=thCalc(X,reg,j,"def",T,.2*wt(j),0);rest-=(1-r.odds)*Vh[j];lr+=r.lo;}
  att.push(Object.assign(a,{st:"attack",ob:E,Va,ev:a.odds*Va-(1-a.odds)*.6*Va-a.lo*2+a.lt+rest-lr*2}));}
 att.sort((x,y)=>y.ev-x.ev);const opts=att.slice(0,3).concat([Object.assign(dig,{st:"dig",ob:""}),Object.assign(fall,{st:"fall",ob:""})]);
 let best=null;for(const o of opts)if(!best||o.ev>best.ev+(o.st==="attack"?-.01:.01))best=o;
 if(!att.length&&!Ds.length)best=null;
 return{att,dig,hold,fall,best,Ds,Vh,totH};}
const thN1=x=>{const v=Math.round(x*10)/10;return String(v>=10?Math.round(v):v);},thBr=x=>{const v=thN1(x);return v+(v==="1"?" brigade":" brigades");};
/* the minister's words for one theatre, with the odds behind them */
function thAdvice(X,reg){const E=thEval(X,reg);if(!E.best)return null;const rows=[],nm=r=>REGION[r].n,pc=o=>Math.round(o*100)+"%";
 E.att.slice(0,2).forEach(a=>rows.push({st:"attack",ob:a.ob,odds:a.odds,lo:a.lo,lt:a.lt,txt:"Attack in "+tNm(nm(a.ob))+": odds of taking ground "+pc(a.odds)+", expected losses "+thBr(a.lo)+" over three months (theirs "+thN1(a.lt)+")",ev:a.ev}));
 if(E.Ds.length){rows.push({st:"dig",odds:E.dig.odds,lo:E.dig.lo,lt:E.dig.lt,txt:"Dig in: odds of holding "+pc(E.dig.odds)+", expected losses "+thBr(E.dig.lo)+" over three months (theirs "+thN1(E.dig.lt)+")",ev:E.dig.ev});rows.push({st:"fall",odds:null,lo:E.fall.lo,lt:E.fall.lt,txt:"Fall back: gives up ground, but losses fall to about "+thBr(E.fall.lo),ev:E.fall.ev});}
 const b=E.best,fog=E.att[0]?E.att[0].fog:thCalc(X,reg,E.Ds[0],"def",null,1,0).fog;return{best:b,rows,fog,E};}
/* ---- the general of a theatre: automatic unless the player names one ---- */
function thGens(c,X){const fx=new Set(),L=c.leaders=c.leaders||[],T0=G.th&&G.th[c.tag]||{};
 for(const r in T0){const T=T0[r];if(!T.gen)continue;const mine=X.all.filter(a=>a.th===r&&!a.bt&&a.u.length);if(!mine.length)continue;let g=L.find(x=>x.id===T.gen),src=null;
  if(!g)for(const a of X.all)if(a.gen&&a.gen.id===T.gen){src=a;g=a.gen;break;}if(!g){T.gen="";continue;}fx.add(r);
  const big=mine.reduce((b,a)=>a.u.length>b.u.length?a:b);if(big.gen&&big.gen.id===T.gen)continue;
  if(src)src.gen=null;else L.splice(L.indexOf(g),1);if(big.gen)L.push(big.gen);big.gen=g;}
 return fx;}
/* ---- the AI chooses stances and objectives by expected value over the fronts of each theatre, with the same odds the player is shown ---- */
function aiStances(c,X){const tag=c.tag,war=X.enemies.size>0,home=REG_OF[c.cap],regs=new Set();for(const a of X.all)if(REGION[a.th])regs.add(a.th);
 if(!war){const rb=X.rebels.length||X.rebProv.length;for(const r of regs){const T=thGet(tag,r,1);T.st=rb?"garr":"hold";T.ob="";T.it=1;}
  if(!rb&&P(c.cap).o===tag&&P(c.cap).ctl===tag)for(const r of regs)if(r!==home){const need=X.all.filter(a=>a.th===r&&!a.xf&&a.loc!==c.cap&&!a.bt);if(need.length)thTransfer(tag,r,home,{inf:99,cav:99,art:99},false,c.cap);}return;}
 const info={};for(const r of regs){const T=thGet(tag,r,1);if(!X.all.some(a=>a.th===r&&!a.xf))continue;const E=thEval(X,r);info[r]=E;const b=E.best;if(!b){T.st="hold";T.ob="";}else{T.st=b.st;T.ob=b.ob||"";}T.it=1;T.pr=E.totH>0?2:1;}
 if(G.t%3===0){const needs=Object.keys(info).map(r=>[r,info[r].totH*(1-info[r].dig.odds)]).sort((a,b)=>b[1]-a[1]);
  for(const r in info){if(info[r].Ds.length||info[r].att.length&&info[r].best&&info[r].best.st==="attack")continue;const to=needs.find(x=>x[0]!==r&&x[1]>2&&thHub(tag,x[0]));if(!to)break;const B=thBrig(tag,r);if(B.n-B.mv<3)continue;thTransfer(tag,r,to[0],{inf:Math.floor((B.inf-B.mv)*.75),cav:Math.floor(B.cav*.75),art:Math.floor(B.art*.75)});}}}
function thRun(c){thSync();const X=thCtx(c);if(!X.all.length)return;const fx=thGens(c,X);aiGens(c,X.all.filter(a=>!fx.has(a.th)));if(c.ai)aiStances(c,X);const regs=new Set();for(const a of X.all)if(REGION[a.th])regs.add(a.th);for(const r of regs){thGet(c.tag,r,1);theatreOrders(c.tag,r,X);}}
/* ================= W5: the navy by station ================= */
const MISSIONS=[["port","Fleet in port","Stays in harbour, repairs, and keeps our ports from being blockaded."],["blockade","Blockade","Sits in the target's biggest open ports in this sea. Their trade falls and our war score rises with the share of their coast shut."],["patrol","Patrol and escort","Covers our transports and convoys. In a fight on a lane, patrol ships join our side, and enemy fleets are 25% more likely to be caught here."],["seek","Seek battle","Goes for the strongest enemy fleet in this sea and fights where it finds it, if we are not far weaker."],["landing","Support landing","Sails to the coast we are landing on and covers the transports."]];
const MIS={};MISSIONS.forEach(m=>MIS[m[0]]=m);
function nsGet(tag,sr,make){G.ns=G.ns||{};const T=G.ns[tag]=G.ns[tag]||{};let t=T[sr];if(!t&&make)t=T[sr]={m:"port",tg:""};return t;}
const navFleets=tag=>G.armies.filter(a=>a.o===tag&&a.naval&&!a.reb&&a.u.length&&a.u.some(isWarship));
function navSync(tag){const F=navFleets(tag);for(const a of F){if(!SEAREG[a.sr])a.sr=SEAR_OF[a.loc]||"nort";}return F;}
function navSplit(c){for(const a of G.armies.slice())if(a.o===c.tag&&a.naval&&!a.reb&&!a.path.length&&a.u.some(isWarship)&&a.u.some(u=>!isWarship(u))){const b=mkArmy(a.o,a.loc,{},true);b.u=a.u.filter(u=>!isWarship(u));a.u=a.u.filter(isWarship);G.armies.push(b);}}
/* a port to base on in a sea region: our own, else a friend's, else the biggest port there */
function navDest(c,sr,S){let b=bestBase(c,S||0,sr);if(b)return b;let bv=-1;for(const p of G.plist){if(!p.sea||SEAR_OF[p.id]!==sr||!SEAADJ[p.id].length)continue;const v=(p.ctl===c.tag||friendly(c.tag,p.ctl||"")?1e6:0)+p.pop;if(v>bv){bv=v;b=p.id;}}return b;}
function navOrders(c,sr,F){const tag=c.tag,T=nsGet(tag,sr,1),en=thFoes(tag),mine=F.filter(a=>a.sr===sr);for(const a of mine)a.ms=T.m;
 const idle=mine.filter(a=>!a.path.length&&a.u.length&&!a.bt);if(!idle.length)return;
 const nf={};for(const b of G.armies)if(b.naval&&!b.reb&&b.u.length&&!b.path.length&&b.u.some(isWarship)&&hostile(tag,armyTag(b)))nf[b.loc]=(nf[b.loc]||0)+strength(b);
 const home=a=>{const b=bestBase(c,strength(a),sr);if(b&&a.loc!==b)orderMove(a,b);},taken=new Set();for(const a of mine)if(a.path.length)taken.add(a.dest);
 if(T.m==="blockade"&&en.size){const tg=T.tg&&en.has(T.tg)?new Set([T.tg]):en,targets=G.plist.filter(p=>p.sea&&p.o&&tg.has(p.o)&&p.ctl===p.o&&SEAR_OF[p.id]===sr&&SEAADJ[p.id].length).sort((a,b)=>b.pop-a.pop),tid=new Set(targets.map(p=>p.id));
  for(const a of mine)if(!a.path.length&&tid.has(a.loc))taken.add(a.loc);
  for(const a of idle.filter(a=>!tid.has(a.loc))){const open=targets.filter(p=>!taken.has(p.id)&&(nf[p.id]||0)<strength(a)*.8);if(!open.length){home(a);continue;}
   open.sort((x,y)=>(dist2(a.loc,x.id)/90-x.pop/400)-(dist2(a.loc,y.id)/90-y.pop/400));const first=open[0];
   if(a.u.length>=6&&open.length>1){const b=mkArmy(a.o,a.loc,{},true);b.u=a.u.splice(Math.floor(a.u.length/2));b.sr=sr;b.ms=T.m;G.armies.push(b);idle.push(b);}
   if(orderMove(a,first.id))taken.add(first.id);else home(a);}return;}
 if(T.m==="patrol"||T.m==="landing"){const reg=T.m==="landing"&&REGION[T.tg]?T.tg:null;
  for(const l of G.armies){if(l.o!==tag||l.naval||l.reb||!l.path.length||ADJ[l.loc].includes(l.path[0]))continue;const d=l.path[0];if(SEAR_OF[d]!==sr||taken.has(d))continue;if(reg&&REG_OF[l.path[l.path.length-1]]!==reg&&REG_OF[d]!==reg)continue;const a=idle.find(x=>!x.path.length&&x.loc!==d);if(!a)break;if(orderMove(a,d))taken.add(d);}
  if(reg){let dest=null;for(const id of REGION[reg].p){const p=P(id);if(!p.sea||SEAR_OF[id]!==sr||p.waste||!SEAADJ[id].length)continue;if(!dest||(en.has(p.ctl)&&!en.has(P(dest).ctl)))dest=id;}if(dest)for(const a of idle)if(!a.path.length&&a.loc!==dest&&(nf[dest]||0)<strength(a)*.8)orderMove(a,dest);}
  for(const a of idle)if(!a.path.length&&!taken.has(a.loc)&&!(reg&&SEAR_OF[a.loc]===sr&&P(a.loc).sea&&REG_OF[a.loc]===reg))home(a);return;}
 if(T.m==="seek"&&en.size){let best=null,bv=0;for(const id in nf)if(SEAR_OF[id]===sr&&nf[id]>bv){bv=nf[id];best=id;}
  for(const a of idle){if(best&&a.loc!==best&&strength(a)>=bv*.7){if(orderMove(a,best))continue;}if(!best||a.loc!==best)home(a);}return;}
 for(const a of idle)home(a);}
/* the AI picks a mission for each sea; the same station orders then run for it as for the player */
function aiStations(c,F){const tag=c.tag,en=thFoes(tag),S=G.ns&&G.ns[tag];if(S)for(const sr in S){S[sr].m="port";S[sr].tg="";}
 const homeOf=a=>{const b=bestBase(c,strength(a));return b?SEAR_OF[b]:a.sr;},home=()=>{for(const a of F)a.sr=homeOf(a);};
 if(!en.size){home();return;}
 let foe=0;for(const t of en)if(G.c[t])foe+=navalPower(t);const mine=navalPower(tag);if(mine<foe*1.15){home();return;}
 const val={};for(const p of G.plist){if(!p.sea||!p.o||!en.has(p.o)||p.ctl!==p.o||!SEAADJ[p.id].length)continue;const sr=SEAR_OF[p.id],e=val[sr]||(val[sr]={n:0,pop:0,top:p,who:{}});e.n++;e.pop+=p.pop;if(p.pop>e.top.pop)e.top=p;e.who[p.o]=(e.who[p.o]||0)+p.pop;}
 const left=F.filter(a=>!a.path.length||true).sort((a,b)=>strength(b)-strength(a)),got={};
 for(const a of left){let best=null,bv=-1e9;for(const sr in val){if((got[sr]||0)>=val[sr].n)continue;const v=val[sr].top.pop/400-dist2(a.loc,val[sr].top.id)/90;if(v>bv){bv=v;best=sr;}}
  if(best){a.sr=best;got[best]=(got[best]||0)+Math.max(1,Math.ceil(a.u.length/6));const T=nsGet(tag,best,1);T.m="blockade";let w=null,wv=0;for(const t in val[best].who)if(val[best].who[t]>wv){wv=val[best].who[t];w=t;}T.tg=w||"";}
  else a.sr=homeOf(a);}
 for(const l of G.armies){if(l.o!==tag||l.naval||l.reb||!l.path.length||ADJ[l.loc].includes(l.path[0]))continue;const sr=SEAR_OF[l.path[0]],T=nsGet(tag,sr,1);if(T.m==="port"){const a=F.find(x=>!got[x.sr]&&!x.path.length&&x.sr!==sr);if(a){a.sr=sr;T.m="patrol";}else if(F.some(x=>x.sr===sr))T.m="patrol";}}
}
function navRun(c){navSplit(c);const F=navSync(c.tag);if(!F.length)return;if(c.ai)aiStations(c,F);const regs=new Set(F.map(a=>a.sr));for(const sr of regs)navOrders(c,sr,F);}
function aiNavy(c){navRun(c);}
/* send n warships from one station to another; dry run reports the time */
function nsTransfer(tag,from,to,n,dry){const c=G.c[tag];navSync(tag);if(from===to)return{ok:0,txt:"They are already there."};const F=navFleets(tag).filter(a=>a.sr===from&&!a.path.length&&!a.bt&&a.u.length);if(!F.length)return{ok:0,txt:"No ships are free to sail from there."};
 const dest=navDest(c,to);if(!dest)return{ok:0,txt:"There is no port in "+SEAREG[to].n+" to sail to."};F.sort((x,y)=>dist2(x.loc,dest)-dist2(y.loc,dest));
 let left=n,eta=0,sent=0;
 for(const a of F){if(left<=0)break;const k=Math.min(left,a.u.length),split=k<a.u.length;let b=a;
  if(dry){const pth=a.loc===dest?[]:findPath(a,dest);if(!pth)continue;eta=Math.max(eta,pth.length?thEta(a,pth):0);left-=k;sent+=k;continue;}
  if(split){b=mkArmy(tag,a.loc,{},true);b.u=a.u.slice(0,k);a.u=a.u.slice(k);G.armies.push(b);}
  const ph=b.sr;b.sr=to;if(b.loc!==dest){const pth=findPath(b,dest);if(!pth||!orderMove(b,dest)){b.sr=ph;if(split){a.u=b.u.concat(a.u);b.u=[];G.armies=G.armies.filter(x=>x!==b);}continue;}eta=Math.max(eta,thEta(b,b.path));}
  left-=k;sent+=k;}
 return{ok:sent>0?1:0,n:sent,eta,txt:sent?"":"No sea route from there."};}
function thMonth(){for(const tag in G.c){const c=G.c[tag];if(c.alive)thRun(c);}if(G.thr)for(const tg in G.thr)for(const r in G.thr[tg])if(G.thr[tg][r].t<G.t-24)delete G.thr[tg][r];for(const tag in G.c){const c=G.c[tag];if(c.alive&&!c.ai)navRun(c);}}
/* new brigades of the player go where he asked: the reserve or a theatre (c.rdest); the AI keeps them where they are raised */
function thRecruitTo(c,a,u,U){const d=c.rdest;if(!d||c.ai||!U.land||a.naval)return;if(d==="res"){if(a.th==="res")return;}else if(!REGION[d])return;
 const dest=d==="res"?c.cap:thHub(c.tag,d);if(!dest)return;a.u.splice(a.u.indexOf(u),1);const b=mkArmy(c.tag,a.loc,{},false);b.u=[u];b.th=d;G.armies.push(b);if(a.loc!==dest){if(orderMove(b,dest))b.xf={to:dest,t:G.t};else b.th=REGION[a.th]?a.th:REG_OF[a.loc];}}
