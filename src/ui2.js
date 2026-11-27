"use strict";
/* ================= U4 Dispatches, U5 Minister's brief, U6 Objectives, guide, coach cards and explain sheets ================= */
/* Everything here reads the game and draws; the only stored state is G.disp (the inbox), G.dseq, G.dseen and G.obj (goal baselines). Old saves get defaults on first use. */

/* ---------- U4: the dispatch store ---------- */
const DK={event:["History","gold"],cong:["Crisis","red"],war:["War","red"],peace:["Peace","good"],works:["Works","blue"],dec:["Decision","gold"],union:["Unity","gold"],dipl:["Diplomacy","blue"],pol:["Politics","gold"],sci:["Research","good"],obj:["Goal","gold"],info:["News","muted"]};
const DCOL={gold:"var(--gold)",red:"var(--red)",good:"var(--turq)",blue:"var(--cobalt)",muted:"var(--muted)"};
const DFILT=[["all","All",null],["war","War and peace",["war","peace","cong"]],["world","The world",["event","union","dipl","pol"]],["work","Works and goals",["works","sci","dec","obj"]]];
const DACT={war:["tab",{t:"mil"},"Open Military"],peace:["tab",{t:"dip"},"Open the World page"],works:["tab",{t:"eco"},"Open Economy"],dec:["tab",{t:"pol"},"See the decisions"],union:["tab",{t:"dip"},"Open the World page"],dipl:["tab",{t:"dip"},"Open the World page"],pol:["tab",{t:"pol"},"Open Politics"],sci:["tab",{t:"tech"},"Choose research"],obj:["tab",{t:"over"},"See the goals"]};
const DL=()=>G.disp||(G.disp=[]);
function dispAdd(o){const L=DL();if(o.kk&&L.some(d=>d.kk===o.kk&&G.t-d.t<12))return null;const d=Object.assign({id:G.dseq=(G.dseq||0)+1,t:G.t,r:0},o);if(!d.a&&DACT[d.k]){const a=DACT[d.k];d.a=a[0];d.ad=a[1];d.al=a[2];}L.unshift(d);if(L.length>60)L.length=60;return d;}
const dispUnread=()=>(G.card?1:0)+DL().filter(d=>!d.r).length;
const WORKS_RE=/(is finished in|is modernized|completed in|factory opens in|Our investors open| completes |works are abandoned)/;
const HIST_RE=/^(Potato blight|1848:|The Taiping|The Southern states|The Union is restored|The Indian Mutiny|The Meiji|Japan |The Berlin Conference|Russia and Japan|The Balkan states|The Boxers|Russia presses|A plebiscite)/;
/* turn one line of news into a dispatch, or nothing: only what concerns us, or changes the world, is worth a letter */
function dispClassify(m,c){const t=m.txt,n=c.n;
 if(/^Battle of /.test(t)||/^A decision awaits/.test(t)||/^(A new general|General )/.test(t))return null;
 if(m.cat==="economy"){if(!WORKS_RE.test(t))return null;if(/ completes /.test(t)&&!t.includes(n))return null;return{k:"works",ti:/abandoned/.test(t)?"A work is lost":"Work completed",x:t};}
 if(m.cat==="science")return{k:"sci",ti:"Knowledge gained",x:t};
 if(/^Unification!/.test(t))return{k:"union",ti:"A nation is unified",x:t};
 const i=t.indexOf(" declares war on ");
 if(i>0){const att=t.slice(0,i),def=t.slice(i+17).split(" (")[0];if(def===n)return{k:"war",ti:"War is declared on us",x:t};if(att===n)return{k:"war",ti:"We are at war",x:t};return null;}
 if(/ make peace/.test(t))return t.includes(n)?{k:"peace",ti:"Peace is made",x:t}:null;
 const fm=t.match(/^(.+?)( is retaken| falls to )/);
 if(fm){const p=G.plist.find(q=>q.n===fm[1]&&q.o===c.tag);return p?{k:"war",ti:fm[2]===" falls to "?"A province falls":"A province is retaken",x:t,a:"goprov",ad:{p:p.id},al:"Show it on the map"}:null;}
 if(HIST_RE.test(t))return{k:"event",ti:t.split(/\.(\s|$)/)[0].slice(0,70),x:t};
 if(!(t.includes(n)||/\b[Oo]ur\b/.test(t)))return null;
 if(m.cat==="war")return{k:"war",ti:"News from the front",x:t};
 if(m.cat==="diplomacy")return{k:"dipl",ti:/coalition/i.test(t)?"A coalition":/guarantee/.test(t)?"A guarantee":/alliance/.test(t)?"An alliance":"Diplomacy",x:t};
 if(m.cat==="politics")return{k:"pol",ti:/votes/.test(t)?"The election":/rise in|take power/.test(t)?"Unrest":/constitution/.test(t)?"A constitution":"Politics",x:t};
 return null;}
/* after each month: news that concerns us, peace within reach, decisions newly open, goals reached */
function dispMonth(fresh, advanced=false){const c=me();if(!c||c.ai)return;
 for(const m of fresh.slice().reverse()){const d=dispClassify(m,c);if(d){d.t=m.t;dispAdd(d);}}
 const tag=c.tag;
 for(const w of G.wars){if(!w.att.includes(tag)&&!w.def.includes(tag))continue;const side=w.att.includes(tag)?1:2,ws=side===1?w.ws:-w.ws,need=WARGOALS[w.goal.k].ws;
  if(side===1&&w.att[0]===tag&&ws>=need)dispAdd({k:"peace",ti:"Peace is within reach",x:"War score "+Math.round(ws)+" meets the "+need+" our goal needs against "+w.def.map(nameOf).join(", ")+". We can force peace on our terms.",a:"dealopen",ad:{w:w.id},al:"Open the peace terms",kk:"pr"+w.id});}
 const seen=G.dseen,ok=DEC.filter(d=>decState(c,d)==="ok");
 if(!seen){G.dseen={};for(const d of ok)G.dseen[d.id]=1;if(ok.length)dispAdd({k:"dec",ti:"Decisions are open to us",x:ok.slice(0,4).map(d=>d.n).join("; ")+(ok.length>4?" and more":"")+". Each is a one-time choice."});}
 else{let n=0;for(const d of ok){if(seen[d.id]||n>=2)continue;seen[d.id]=1;n++;dispAdd({k:"dec",ti:"A decision is open to us",x:d.n+". "+d.d});}}
 if(advanced)objMonth();UI._dm=G.msgs[0];UI._dmOn=1;}
/* news made outside the month tick (a war we declare, a congress, a card's result) becomes a dispatch on the next draw */
function dispSweep(){if(!UI._dmOn||!G||!G.player)return;const c=me();if(!c||c.ai)return;const f=[];for(const m of G.msgs){if(m===UI._dm)break;f.push(m);if(f.length>30)break;}UI._dm=G.msgs[0];
 for(const m of f.reverse()){const d=dispClassify(m,c);if(d){d.t=m.t;d.kk=d.kk||("m"+m.t+d.ti+m.txt.slice(0,40));dispAdd(d);}}}
function mhPush(){const c=me();if(!c||c.ai)return;const h=G.mh=G.mh||[];if(h.length&&h[h.length-1][0]===G.t)return;h.push([G.t,Math.round(c.tr),Math.round((c.stat||{}).net||0),Math.round(c.pres)]);if(h.length>48)h.shift();}
/* ---------- U4: the decree sheet (a card that needs an answer) and the inbox page ---------- */
function drawCard(){let e=$("#card");const c=G&&G.card;if(!c||UI.cardHide){if(e)e.remove();return;}if(!e){e=document.createElement("div");e.id="card";document.body.appendChild(e);}
 const kd=DK[c.kind==="cong"?"cong":"event"],sel=UI.cardSel&&c.opts.some(o=>o.k===UI.cardSel)?UI.cardSel:null,old=e.firstElementChild,sc=old?old.scrollTop:0;
 e.className="";e.innerHTML=`<div class="box decree" role="dialog" aria-modal="true" aria-label="${esc(c.title)}"><div class="dh"><span class="tag" style="--cat:${DCOL[kd[1]]}">${kd[0]}</span><span class="dd">${dateStr(c.t)}</span><button class="x" data-a="cardhide" aria-label="Lay it aside for now">×</button></div>${WAX(c.kind==="cong"?"dip":"pol")}<h2>${esc(c.title)}</h2><p class="dtxt">${esc(c.txt)}</p>${c.history?`<p class="small muted"><b>Historical record</b> ${esc(c.history)}</p>`:""}<div class="olab">Your options</div>${c.opts.map((o,i)=>`<button class="opt${o.k===sel?" on":""}" role="radio" aria-checked="${o.k===sel}" data-a="cardpick" data-k="${esc(o.k)}"><i class="rad"></i><span><b>${String.fromCharCode(65+i)}. ${esc(o.label)}</b>${o.k===c.def&&!c.history?' <span class="tag gold">Suggested default</span>':""}<span class="small">${esc(o.txt)}</span></span></button>`).join("")}<div class="dfoot"><button class="btn" data-a="cardhide">Lay it aside</button><button class="btn pri" data-a="cardseal" ${sel?"":"disabled"}>${sel?"Seal the decree":"Choose an option"}</button></div></div>`;
 const nb=e.firstElementChild;if(nb)nb.scrollTop=sc;}
const WAX=k=>`<div class="waxw"><span class="waxs">${ic(k)}</span></div>`;
function dispCard(d,fresh){const k=DK[d.k]||DK.info,ad=d.ad||{};
 return`<article class="disp" style="--cat:${DCOL[k[1]]}"><span class="wax${fresh?"":" read"}" aria-hidden="true"></span><div class="dm"><span class="tag" style="--cat:${DCOL[k[1]]}">${k[0]}</span><span class="dd">${dateStr(d.t)}</span></div><h3 class="dt">${esc(d.ti)}</h3><p>${esc(d.x)}</p>${d.o?`<p class="chosen">You chose: <b>${esc(d.o)}</b>.${d.ot?` <span class="small muted">${esc(d.ot)}</span>`:""}</p>`:""}${d.history?`<p class="small muted"><b>Historical record</b> ${esc(d.history)}</p>`:""}${d.a?`<div class="row"><button class="btn sm" data-a="${d.a}"${Object.keys(ad).map(x=>` data-${x}="${esc(ad[x])}"`).join("")}>${esc(d.al||"Open")}</button></div>`:""}</article>`;}
function pgDisp2(){const L=DL(),fl=DFILT.find(f=>f[0]===(UI.df||"all"))||DFILT[0],fresh=new Set(L.filter(d=>!d.r).map(d=>d.id)),k=G.card,shown=fl[2]?L.filter(d=>fl[2].includes(d.k)):L;
 let h=`<header class="headpiece">${SCROLLV}<h1>Dispatches</h1><div class="sub">Letters awaiting your seal</div>${HEADORN}</header>`+coachHTML("news");
 if(k){h+=`<div class="card warn"><h2>Awaiting your seal</h2><article class="disp pend" style="--cat:var(--red)"><span class="wax" aria-hidden="true"></span><div class="dm"><span class="tag" style="--cat:var(--red)">${k.kind==="cong"?"Crisis":"History"}</span><span class="dd">${dateStr(k.t)}</span></div><h3 class="dt">${esc(k.title)}</h3><p>${esc(k.txt.length>170?k.txt.slice(0,170).replace(/\s+\S*$/,"")+"…":k.txt)}</p><p class="small muted">${k.opts.length} options. The game waits until you answer.</p><div class="row"><button class="btn pri" data-a="cardshow">Open the decree</button></div></article></div>`;}
 h+=briefCompact();
 h+=`<div class="card"><h2>Dispatches</h2><div class="dfil" role="group" aria-label="Show">${DFILT.map(f=>`<button class="pill${f[0]===fl[0]?" on":""}" data-a="dfil" data-f="${f[0]}">${f[1]}</button>`).join("")}</div>${shown.length?shown.map(d=>dispCard(d,fresh.has(d.id))).join(""):`<p class="calm">${L.length?"Nothing of this kind yet.":"No letters yet. News that concerns us arrives here."}</p>`}<div class="row"><button class="btn sm" data-a="tab" data-t="chron">All news and battles</button></div></div>${TAILORN}`;
 L.forEach(d=>{d.r=1;});setTimeout(drawTop,0);return h;}
const SCROLLV='<svg class="vig" viewBox="0 0 160 92" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M36 28h72a8 8 0 0 1 8 8v30a10 10 0 0 0 10 10H52a10 10 0 0 1-10-10V36a8 8 0 0 0-6-8z" opacity=".9"/><path d="M36 28a8 8 0 0 0-8 8 6 6 0 0 0 6 6h8" /><path d="M58 46h40M58 55h32M58 64h24"/><path d="M120 14c-14 6-24 22-30 40l8-6" stroke-width="2.4"/><circle cx="116" cy="70" r="7" fill="var(--red)" stroke="none"/></svg>';

/* ---------- U5: the minister's brief ---------- */
/* Every line comes from a calculation the AI governments also use: bestGood margins, warEV, guarEV, pickTech, canReform. Worked out once a month (and when asked), never saved. */
const BUILDC=()=>{let s=0;for(const g in BUILD_COST)s+=BUILD_COST[g]*G.price[g];return s*facPrem(me());};
const RAILC=()=>{let s=0;for(const g in RAIL_COST)s+=RAIL_COST[g]*G.price[g];return s;};
const gnm=g=>GOODS[g].n.toLowerCase(),art=w=>(/^[aeiou]/i.test(w)?"an ":"a ")+w;
function bestFac(c){if(!c.bp||!c.civ||!c.fill)return null;let best=null;
 for(const g in RECIPE){if(!goodOK(c,g)||c.bp[g]<GOODS[g].p*.8)continue;if(c.sold&&c.sold[g]<.9)continue;let low=1,bad=0;for(const x in RECIPE[g].I){const f=c.fill[x];if(f!=null){if(f<.85)bad=1;low=Math.min(low,f);}}if(bad)continue;
  const m=facMargin(c,g);if(m<.25)continue;const short=(c.impSh&&c.impSh[g])||0;let ip=1;for(const x in RECIPE[g].I)ip=Math.max(ip,G.price[x]/GOODS[x].p);
  const pi=G.price[g]/GOODS[g].p,tg=(G.tight&&G.tight[g])||1,pull=UPSTREAM.has(g)?1+Math.min(3,Math.max(0,pi-1.1)*3+Math.max(0,tg-1.02)*12):1,v=Math.min(2.5,m+short*.4)*pull*Math.min(1,1.5/ip)/(1+(PIPE[g]||0)/(2+(LVG[g]||0)*.15));
  if(!best||v>best.v)best={g,v,m,pi,tg,low};}
 return best;}
const recK=(o)=>Object.assign({tier:3,v:0,cost:"free",odds:"certain",oP:1},o);
const BRQ=x=>x==null?"—":x>=.75?"likely":x>=.4?"uncertain":"unlikely";
function briefCalc(c){const t0=performance.now(),tag=c.tag,st=c.stat||{},inc=Math.max(1,st.inc||0),net=st.net||0,nf=natFig(c),R=[],mine=provsOf(tag);
 /* 1. the budget */
 const run=net<0?(c.tr>0?Math.floor(c.tr/-net):0):null;
 if(c.tr<0||(net<0&&run<8))R.push(recK({id:"budget",tier:0,v:150-(run||0),head:c.tr<0?"Pull the treasury out of the red":"Close the budget gap of "+money(-net)+" a month",sh:"Fix the budget",why:c.tr<0?"The treasury is "+moneyS(c.tr)+": pay falls into arrears and credit dries up.":"At this rate the reserves of "+moneyS(c.tr)+" last "+run+" month"+(run===1?"":"s")+".",pay:"Stops a drain of "+money(Math.max(0,-net))+" a month",cost:"higher taxes anger people",odds:"you set the rates",a:"tab",d:{t:"nat"},lab:"Open the budget"}));
 /* 2. peace and war we are already in */
 for(const w of G.wars){if(!w.att.includes(tag)&&!w.def.includes(tag))continue;const side=w.att.includes(tag)?1:2,ws=side===1?w.ws:-w.ws,need=WARGOALS[w.goal.k].ws,lead=w.att[0]===tag||w.def[0]===tag,foes=(side===1?w.def:w.att).map(nameOf).join(", ");
  if(lead&&side===1&&ws>=need)R.push(recK({id:"peace"+w.id,tier:0,v:200,head:"Make peace and take our prize",sh:"Make peace",why:"War score "+Math.round(ws)+" against "+foes+" meets the "+need+" our goal needs. Waiting only risks the lead.",pay:"Win: "+WARGOALS[w.goal.k].n.toLowerCase()+(w.goal.prov?" ("+P(w.goal.prov).n+")":""),cost:"free",odds:"100%",oP:1,a:"dealopen",d:{w:w.id},lab:"Peace terms"}));
  else if(lead&&ws<=-need*.6)R.push(recK({id:"sue"+w.id,tier:0,v:140,head:"Seek peace: the war is going badly",sh:"Seek peace",why:"War score is "+Math.round(ws).toString().replace("-","−")+" against "+foes+". Each month adds exhaustion ("+Math.round(c.we)+" of 100).",pay:"Ends the losses; we may pay",cost:"concessions",odds:"they may refuse",oP:null,a:"dealopen",d:{w:w.id},lab:"Peace terms"}));}
 /* 2b. theatres: the course the minister likes best where it differs from the present orders */
 if(c.war.length){const X=thCtx(c);let bt=null;for(const r of thRows(c)){if(r==="res"||!thFronts(tag,r).length)continue;const T=thGet(tag,r,1),A=thAdvice(X,r);if(!A)continue;const b=A.rows.reduce((q,x)=>!q||x.ev>q.ev?x:q,null);if(b.st===T.st&&(b.st!=="attack"||b.ob===T.ob))continue;const cur=A.rows.find(x=>x.st===T.st&&(x.st!=="attack"||x.ob===T.ob)),gain=b.ev-(cur?cur.ev:b.ev-5);if(!bt||gain>bt.gain)bt={r,b,gain,fog:A.fog};}
  if(bt){const b=bt.b,nm=REGION[bt.r].n,verb=b.st==="attack"?"attack "+tNm(REGION[b.ob].n):b.st==="dig"?"dig in":"fall back";R.push(recK({id:"th"+bt.r,tier:0,v:110+Math.min(40,bt.gain),head:nm+": "+verb,sh:nm.slice(0,18)+": "+verb.split(" ")[0],why:b.txt+". Enemy numbers are estimates, within "+Math.round(bt.fog*100)+"%.",pay:b.st==="fall"?"saves men":"enemy losses about "+thN1(b.lt)+" brigades",cost:"our losses about "+thN1(b.lo)+" brigades",odds:b.odds==null?"gives ground":Math.round(b.odds*100)+"%",oP:b.odds==null?null:b.odds,a:"thsheet",d:{r:bt.r},lab:"Open the theatre"}));}}
 /* 3. mills: the best good and the best place for it, as bestGood and bestSite would pick them */
 const bc=BUILDC(),busy=sum(mine,p=>p.build.length),idle=c.tr>inc*5,bf=c.civ&&c.tr>=bc*1.05?bestFac(c):null;
 if(bf){const site=bestSite(c,bf.g);if(site){let ci=0;for(const x in RECIPE[bf.g].I)ci+=RECIPE[bf.g].I[x]*c.bp[x];const va=bf.m*1.225*ci,ret=12*.21*va/bc,stf=site._staff==null||!site.factories.length?1:site._staff,oP=Math.min(.97,(.6+.45*Math.min(bf.m,.8))*Math.min(1,bf.low)*Math.min(1,stf+.15));
  const reason=bf.tg>1.06?gnm(bf.g)+" is short in the world market":bf.pi>1.1?"the price of "+gnm(bf.g)+" stands "+Math.round((bf.pi-1)*100)+"% above its 1836 level":"it earns "+Math.round(bf.m*100)+"% over what its inputs cost";
  R.push(recK({id:"fac",tier:idle?1:2,v:50+ret*300,head:"Build "+art(gnm(bf.g))+" factory in "+site.n,sh:"Build "+gnm(bf.g),why:"Because "+reason+", and the inputs are in stock.",pay:"about "+Math.round(ret*100)+"% a year, plus jobs",cost:money(bc),odds:BRQ(oP),oP,a:"build",d:{p:site.id,g:bf.g},lab:"Build it",run:()=>{startFactory(me(),site,bf.g,true);toast("Work begins on a "+gnm(bf.g)+" factory in "+site.n+".");}}));}}
 /* 4. railways, scored as aiBuild scores them */
 if(c.tr>=RAILC()*1.1){const rm=railMax(c);let rb=null,rv=0;for(const p of mine){if(p.ctl!==p.o||p.rail>=rm||p.build.some(b=>b.k==="rail")||!railCan(c,p).ok)continue;const v=(p.pop/1000+sum(p.factories,f=>f.lv)*2+(p.mine?3:0))/(1+p.rail);if(v>rv){rv=v;rb=p;}}
  if(rb)R.push(recK({id:"rail",tier:idle&&!bf?1:2,v:30+Math.min(40,rv*2),head:"Lay a railway in "+rb.n,sh:"Railway",why:"It is our busiest province without the best line ("+ppl(rb.pop)+" people, railway level "+rb.rail+" of "+rm+"). Trains lift trade and the supply limit.",pay:"supply limit +3 there; output up",cost:money(RAILC()),odds:"95%",oP:.95,a:"bld",d:{p:rb.id,b:"rail"},lab:"Lay it",run:()=>{startRail(me(),rb);toast("Railway works begin in "+rb.n+".");}}));}
 /* 5. a war worth fighting, and one to avoid: warEV as the AI weighs it */
 if(!c.war.length&&c.we<=10&&mine.length){const L=cbsOf(c).filter(cb=>{const o=G.c[cb.t];return o&&reachable(tag,cb.prov||o.cap)&&!(c.truce[cb.t]>G.t)&&o.sphere!==tag&&o.overlord!==tag;}).slice(0,40);let best=null,worst=null;
  for(const cb of L){const e=warEV(c,cb);if(e.ev>EV_MARGIN&&e.p>=.6&&(!best||e.ev>best[1].ev))best=[cb,e];const o=G.c[cb.t],bk=[...guarantors(cb.t),...(o.sphere&&o.sphere!==tag?[o.sphere]:[])].filter(x=>x!==tag&&G.c[x]&&G.c[x].alive);if(bk.length&&e.p<.5&&e.ev<0&&(!worst||e.gain>worst[1].gain))worst=[cb,e,bk];}
  if(best&&c.infamy<COAL_AT-8){const[cb,e]=best,inf=estInf(c,cb),what=cb.prov?P(cb.prov).n:"concessions";R.push(recK({id:"war",tier:2,v:30+e.ev,head:"Strike "+nameOf(cb.t)+" for "+what,sh:"War: "+nameOf(cb.t),why:"We field "+Math.round(e.ours)+" against their "+Math.round(e.theirs)+". A win is worth +"+Math.round(e.gain)+", a defeat costs about −"+Math.round(10+e.ours/100)+", and infamy rises "+inf.toFixed(0)+".",pay:"expected value +"+Math.round(e.ev),cost:"infamy +"+inf.toFixed(0),odds:BRQ(e.p),oP:e.p,a:"dipnat",d:{t:cb.t},lab:"Look at the case"}));}
  if(worst){const[cb,e,bk]=worst,what=cb.prov?P(cb.prov).n:"them";R.push(recK({id:"hold",tier:3,v:20+e.gain,head:"Do not attack "+nameOf(cb.t)+" now",sh:"Not "+nameOf(cb.t),why:bk.slice(0,3).map(nameOf).join(" and ")+" stand"+(bk.length===1?"s":"")+" behind them: their side fields "+Math.round(e.theirs)+" against our "+Math.round(e.ours)+".",pay:"avoids a loss worth −"+Math.round(-e.ev),cost:"nothing",odds:BRQ(e.p)+" to win",oP:e.p,a:"dipnat",d:{t:cb.t},lab:"See the nation"}));}}
 /* 6. scholars, decisions, reforms */
 if(!c.res||c.tech[c.res]){const id=pickTech(c);if(id){const T=TF[id],cost=techCost(c,T),rp=Math.max(.1,rpOf(c)||st.rp||1);R.push(recK({id:"res",tier:1,v:70,head:"Put the scholars to work on "+tNm(T.n),sh:"Research",why:"They are idle. This is the cheapest useful study: "+cost+" points, about "+Math.ceil(cost/rp)+" months at "+rp.toFixed(1)+" a month.",pay:"unlocks "+tNm(T.n),cost:cost+" points",odds:"100%",oP:1,a:"research",d:{id},lab:"Start it"}));}}
 const dec=DEC.filter(d=>AI_DEC[d.id]>0&&decState(c,d)==="ok").sort((a,b)=>(AI_DEC[b.id]||0)-(AI_DEC[a.id]||0))[0];
 if(dec)R.push(recK({id:"dec",tier:1,v:80,head:"Enact: "+dec.n,sh:dec.n.slice(0,22),why:dec.d,pay:"a one-time historical choice",cost:"see the page",odds:"100%",oP:1,a:"dec",d:{id:dec.id},lab:"Enact"}));
 if(nf.mil>=2.5){let rb=null,rv=0;for(const r of REFORMS){if(!canReform(c,r).ok)continue;let a=0,n=0;for(const p of mine)for(const q of p.pops){const want=r.k==="p"?(q.id.LIB+q.id.SOC+q.id.ANL):(q.id.SOC+q.id.COM);a+=(want*1.5-q.id.REA*.8)*q.n;n+=q.n;}const rel=n?a/n:0;if(rel>rv){rv=rel;rb=r;}}
  if(rb&&rv>.15){const l=c.reforms[rb.id]||0,sp=reformSupport(c,rb.k);R.push(recK({id:"ref",tier:nf.mil>=4?1:2,v:60+rv*20,head:"Pass a reform: "+rb.lv[l+1].toLowerCase(),sh:rb.n,why:"Militancy is "+nf.mil.toFixed(1)+" of 10. This reform soothes the people who want it.",pay:"militancy about −"+rv.toFixed(1)+" at once",cost:"a year's wait for the next",odds:BRQ(Math.min(1,sp+.3)),oP:Math.min(1,sp+.3),a:"tab",d:{t:"pol"},lab:"Open Politics"}));}}
 /* 7. diplomacy for a Great Power, colonies */
 const warT=new Set(R.filter(r=>r.id==="war"||r.id==="hold").map(r=>r.d.t));
 if(isGP(tag)&&!c.war.length){let gb=null,gw=0;for(const t in G.c){const o=G.c[t];if(!o.alive||t===tag||isGP(t)||warT.has(t)||!guaranteeCan(c,t).ok)continue;const w=guarWorth(c,t);if(w>gw){gw=w;gb=t;}}
  if(gb&&gw>28){const m=G.c[gb],riv=(G.gp||[]).filter(x=>x!==tag&&G.c[x].rel&&(G.c[x].rel[gb]||0)<-10),R0=G.c[riv[0]||G.gp[0]],near=mine.some(p=>ADJ[p.id].some(q=>P(q).o===gb)),pa=(near?.12:.04)+(R0&&(R0.rel[gb]||0)<-20?.12:0);
   R.push(recK({id:"guar",tier:3,v:gw,head:"Guarantee "+m.n,sh:"Guarantee "+m.n.slice(0,12),why:"It is worth "+Math.round(gw)+" to us"+(near?", next to our border":"")+(riv.length?"; "+riv.slice(0,2).map(nameOf).join(" and ")+" eye it":"")+".",pay:"relations +15; rivals held back",cost:"war if it is attacked",odds:BRQ(1-pa)+" no war",oP:1-pa,a:"dipnat",d:{t:gb},lab:"See the nation"}));}}
 if(c.civ&&!c.war.length){let cp=null;for(const p of G.plist){if(p.o||p.waste||p.colz||!canColonize(c,p))continue;if(!cp||p.pop>cp.pop)cp=p;}
  if(cp&&c.tr>3000+cp.pop*.5+inc)R.push(recK({id:"col",tier:3,v:25+cp.pop/400,head:"Claim "+cp.n+" as a colony",sh:"Colony: "+cp.n.slice(0,12),why:ppl(cp.pop)+" people live there. Settlers take 18 months and nobody has to fight.",pay:"a new province, +2 prestige",cost:money(3000+cp.pop*.5),odds:"rivals may beat us",oP:null,a:"goprov",d:{p:cp.id},lab:"See it on the map",run:null}));}
 if(!c.civ){const t=Object.keys(c.tech).length,lit=st.lit||0;R.push(recK({id:"west",tier:2,v:45,head:"Work toward westernization",sh:"Westernize",why:"We are not yet counted among the civilized nations. Automatic modernization usually needs literacy above 18% (now "+pct(lit)+") and 10 technologies (now "+t+"). The manual Westernize decision requires five technologies. Japan also has a Restoration route.",pay:"opens mills, colonies and full trade",cost:"schools and study",odds:BRQ(Math.min(1,(clamp01(lit/.18)+clamp01(t/10))/2)),oP:null,a:"tab",d:{t:"pol"},lab:"Open national decisions"}));}
 /* a filler so there are always three lines */
 if(R.length<3){let nb=null,nr=-1e9;for(const t in c.rel){const o=G.c[t];if(!o||!o.alive||atWarWith(c,o)||!improveAsk(c,t).ok)continue;const r=c.rel[t]||0;if(r<80&&r>nr&&r>-60){nr=r;nb=t;}}
  if(nb)R.push(recK({id:"imp",tier:3,v:10,head:"Improve relations with "+nameOf(nb),sh:"Courting "+nameOf(nb).slice(0,12),why:"They rate us at "+Math.round(nr)+". Friends join alliances and refuse to join coalitions.",pay:"relations +15",cost:money(IMPROVE_COST),odds:"100%",oP:1,a:"improve",d:{t:nb},lab:"Send gifts"}));}
 R.sort((a,b)=>a.tier-b.tier||b.v-a.v);
 const out={t:G.t,g:G,tag,all:R,list:R.slice(0,5),ms:performance.now()-t0};return out;}
function BR(force){const b=UI._br;if(!force&&b&&b.t===G.t&&b.g===G&&b.tag===G.player)return b;return UI._br=briefCalc(me());}
function briefTable(L){const T=L.slice(0,3);if(T.length<2)return"";return`<h3>The top options compared</h3><table class="brt"><thead><tr><th>Option</th><th>Cost</th><th>Payoff</th><th>Odds</th></tr></thead><tbody>${T.map(r=>`<tr><td>${esc(r.sh)}</td><td>${esc(r.cost)}</td><td>${esc(r.pay)}</td><td>${esc(r.odds)}</td></tr>`).join("")}</tbody></table>`;}
function recHTML(r,i,compact){return`<li class="rec"><span class="rk">${i+1}</span><div class="rb"><b>${esc(r.head)}</b><div class="small">${esc(r.why)}</div><div class="chips"><span class="tag good">Payoff: ${esc(r.pay)}</span><span class="tag">Odds: ${esc(r.odds)}</span>${compact?"":`<span class="tag">Cost: ${esc(r.cost)}</span>`}</div></div><button class="btn sm${i===0?" pri":""}" data-a="brief" data-i="${i}">${esc(r.lab)}</button></li>`;}
function briefFrame(){const b=BR();return`<p class="small muted">Worked out from the same sums the rival governments use, for ${dateStr(G.t)}. Payoffs are expected, not promised; likelihood estimates reflect current conditions.</p>${b.list.length?`<ol class="brief">${b.list.map((r,i)=>recHTML(r,i)).join("")}</ol>${briefTable(b.list)}`:`<p class="calm">The ministers have nothing to add. Press End month.</p>`}<div class="row"><button class="btn sm" data-a="briefnew">Work it out again</button></div>`;}
function briefCompact(){const b=BR();if(!b.list.length)return"";return`<div class="card"><h2>The minister's brief</h2><ol class="brief">${b.list.slice(0,2).map((r,i)=>recHTML(r,i,1)).join("")}</ol><div class="row"><button class="btn sm" data-a="tab" data-t="over">All of the brief, on the Overview</button></div></div>`;}

/* ---------- U6: objectives and score ---------- */
const OBJ_END=1200;
function objInit(c){if(G.obj&&G.obj.tag===c.tag)return G.obj;const L=provsOf(c.tag);return G.obj={tag:c.tag,r0:G.rank.indexOf(c.tag)+1,l0:Math.round((c.stat.lit||0)*1e4)/1e4,i0:(c.score&&c.score.ind)||0,pop0:Math.round(c.stat.pop||1),initialProvinces:L.map(p=>p.id),n0:L.length||1,p0:Math.round(natFig(c).poor*1e4)/1e4,rail0:sum(L,p=>p.rail),civ0:c.civ?1:0,gp0:isGP(c.tag)?1:0,t0:G.t,h:{},d:{}};}
const clamp01=x=>x<0?0:x>1?1:x;
/* [id, title, now text, goal text, progress 0..1, weight, tab] */
function startingHoldings(country, objective){
 if(!objective.initialProvinces&&objective.t0===0){
  const starting=WORLD.provs.filter(province=>province.o===country.tag);
  if(starting.length===objective.n0) objective.initialProvinces=starting.map(province=>province.id);
 }
 const ids=objective.initialProvinces;
 if(!ids) return {ok:false,label:"Original holdings unavailable for this save"};
 const retained=ids.filter(id=>P(id)?.o===country.tag).length;
 return {ok:retained===ids.length,label:retained+" of "+ids.length};
}
function objList(c){const o=objInit(c),tag=c.tag,st=c.stat||{},L=provsOf(tag),rank=G.rank.indexOf(tag)+1,nf=natFig(c),A=[],add=(id,t,now,goal,p,w,tab)=>A.push({id,t,now,goal,p:clamp01(p),w,tab:tab||"over"}),hold=id=>(o.h[id]||0)/Math.max(1,OBJ_END-o.t0),holdT=id=>{const y=Math.floor((o.h[id]||0)/12);return"held "+y+" of "+Math.round((OBJ_END-o.t0)/12)+" years";};
 /* generic */
 if(o.gp0){add("g_gp","Stay a Great Power to 1936",(isGP(tag)?"a Great Power now, ":"not a Great Power now, ")+holdT("g_gp"),"to 1936",hold("g_gp"),22,"dip");}
 else if(o.r0>8||!o.gp0){const T=8;add("g_gp","Become a Great Power",isGP(tag)?"a Great Power":"rank "+rank,"rank 8 or better",isGP(tag)?1:(o.r0-rank)/Math.max(1,o.r0-T),22,"dip");}
 const rT=o.r0<=3?1:Math.max(1,Math.round(o.r0*.45));
 if(o.r0===1)add("g_top","Stay in first place",ord(rank)+" now, "+holdT("g_top"),"to 1936",hold("g_top"),14,"dip");else if(o.r0<=3)add("g_top","Reach first place",ord(rank)+" now","1st",(o.r0-rank)/(o.r0-1),14,"dip");else add("g_rank","Climb to rank "+rT,"rank "+rank,"rank "+rT,(o.r0-rank)/Math.max(1,o.r0-rT),14,"dip");
 const lT=Math.min(.92,Math.max(.6,o.l0+.3));add("g_lit","Teach the people to read",pct(st.lit||0),pct(lT),((st.lit||0)-o.l0)/Math.max(.05,lT-o.l0),12,"nat");
 const iT=Math.max(150,Math.round(o.i0*8));add("g_ind","Build industry",(c.score&&c.score.ind||0)+" points","goal "+iT,((c.score&&c.score.ind||0)-o.i0)/Math.max(1,iT-o.i0),14,"eco");
 const fT=Math.min(.97,Math.max(.7,(o.p0||0)+.12));add("g_fed","Feed the poor",pct(nf.poor)+" of needs met",pct(fT),(nf.poor-(o.p0||0))/Math.max(.05,fT-(o.p0||0)),10,"eco");
 const pT=Math.round(o.pop0*1.7);add("g_pop","Grow the people",ppl(st.pop||0),ppl(pT),((st.pop||0)-o.pop0)/Math.max(1,pT-o.pop0),8,"nat");
 /* historical, by nation */
 const un=(id,t,key)=>{const U=UNIFY[key],own=U.need.filter(i=>P(i).o===tag).length,fo=c.formed===key;add(id,t,fo?"proclaimed":own+" of "+U.need.length+" lands held","all "+U.min+" or more",fo?1:own/U.min*.9,26,"dip");};
 if(tag==="PRU")un("h_ger","Unify Germany","GER");
 if(tag==="SAR")un("h_ita","Unify Italy","ITA");
 if(tag==="USA"){add("h_sla","Abolish slavery",(c.reforms.slavery||0)>=2?"abolished":"still legal","abolished",(c.reforms.slavery||0)/2,18,"pol");}
 if(["AUS","OTT","CHI","RUS","SPA","GBR","USA"].includes(tag)){add("h_hold","Hold every province we began with",startingHoldings(c,o).label+", "+holdT("h_hold"),"to 1936",hold("h_hold"),tag==="GBR"?10:14,"map");}
 if(tag==="GBR"){let mx=1;for(const t in G.c)if(t!==tag&&G.c[t].alive)mx=Math.max(mx,fleetOf(t));add("h_navy","Rule the waves",fleetOf(tag)+" ships against "+mx+", "+holdT("h_navy"),"largest fleet to 1936",hold("h_navy"),14,"mil");A.navyOk=fleetOf(tag)>=mx;}
 if(tag==="FRA"||tag==="RUS"||tag==="JAP"){const g=Math.max(3,Math.round(o.n0*.5)),n=L.length-o.n0;add("h_exp","Win new lands",(n>=0?"+":"")+n+" provinces","+"+g,n/g,14,"map");}
 if(tag==="RUS"){const r=sum(L,p=>p.rail),T=o.rail0+30;add("h_rail","Lay the great railways",r+" levels","goal "+T,(r-o.rail0)/30,12,"eco");}
 if(!o.civ0){const t=Object.keys(c.tech).length,p=c.civ?1:(clamp01((st.lit||0)/.18)+clamp01(t/10))/2*.95;add("h_civ","Westernize",c.civ?"civilized":"literacy "+pct(st.lit||0)+", "+t+" of 10 techs","manual: 5 techs · automatic: over 18% literacy and 10 techs",p,18,"tech");}
 if(!A.some(x=>x.id==="h_hold"))add("h_hold","Hold every province we began with",startingHoldings(c,o).label+", "+holdT("h_hold"),"to 1936",hold("h_hold"),10,"map");
 if(c.civ&&!A.some(x=>x.id==="h_exp")&&!A.some(x=>/^h_(ger|ita|sla)$/.test(x.id))){const g=Math.max(2,Math.round(o.n0*.5)),n=L.length-o.n0;add("h_exp","Win new lands",(n>=0?"+":"")+n+" provinces","+"+g,n/g,10,"map");}
 const HOLDS={g_gp:()=>o.gp0&&isGP(tag),g_top:()=>o.r0===1&&rank===1,h_hold:()=>startingHoldings(c,o).ok,h_navy:()=>tag==="GBR"&&A.navyOk};
 for(const a of A){const f=HOLDS[a.id];if(f&&(a.id==="h_hold"||a.id==="h_navy"||(a.id==="g_gp"&&o.gp0)||(a.id==="g_top"&&o.r0===1))){a.hold=1;a.ok=!!f();a.yrs=Math.floor((o.h[a.id]||0)/12);}}
 return A;}
function objScore(A){let w=0,s=0;for(const a of A){w+=a.w;s+=a.w*a.p;}return w?Math.round(s/w*100):0;}
const SCORE_T=s=>s>=80?"Architect of the nation":s>=60?"Statesman":s>=35?"Administrator":"Apprentice";
/* once a month: count the months a hold-goal stays true, and write a dispatch when a goal is reached */
function objMonth(){const c=me();if(!c||c.ai)return;const o=objInit(c);const hs=[["g_gp",isGP(c.tag)],["g_top",G.rank[0]===c.tag],["h_hold",startingHoldings(c,o).ok]];if(c.tag==="GBR"){let mx=0;for(const t in G.c)if(t!==c.tag&&G.c[t].alive)mx=Math.max(mx,fleetOf(t));hs.push(["h_navy",fleetOf(c.tag)>=mx]);}for(const[id,ok]of hs)if(ok)o.h[id]=(o.h[id]||0)+1;
 for(const a of objList(c)){if(a.p>=1&&!o.d[a.id]){o.d[a.id]=G.t;if(G.t>o.t0+1)dispAdd({k:"obj",ti:"Goal reached",x:a.t+". "+a.now+".",kk:"ob"+a.id});}}}
function objHTML(){const c=me(),A=objList(c),o=G.obj,sc=objScore(A);
 return`<div class="objsc"><div><span class="k">Score</span><b>${sc}</b><span class="d">of 100</span></div><div class="objt">${SCORE_T(sc)}<span class="small muted">Each goal counts by its weight; partial progress counts too.</span></div></div><div class="meter green" role="img" aria-label="Score ${sc} of 100"><i style="width:${sc}%"></i></div>
 <div class="objl">${A.map(a=>`<button class="obj${a.p>=1?" done":""}" data-a="tab" data-t="${a.tab}"><span class="ot"><b>${esc(a.t)}</b>${a.p>=1?`<span class="tag good">${o.d[a.id]!=null?"done "+dateStr(o.d[a.id]):"done"}</span>`:`${a.hold?`<span class="tag ${a.ok?"good":"bad"}">${a.ok?"On track":"Slipping"}</span>`:`<span class="op">${Math.round(a.p*100)}%</span>`}`}</span><span class="meter ${a.p>=1?"green":""}"><i style="width:${Math.round(a.p*100)}%"></i></span><span class="small muted">${esc(a.now)} → ${esc(a.goal)}</span></button>`).join("")}</div>`;}

/* ---------- U6: tap-to-explain sheets ---------- */
const exR=(l,v,cls)=>`<div class="exr"><span>${l}</span><b class="${cls||""}">${v}</b></div>`;
const sgn=(v,f)=>Math.abs(v)<.5?(f||money)(0):(v<0?"−":"+")+(f||money)(Math.abs(v));
function exSheet(title,intro,rows,note,go){return`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>${esc(title)}</h2><button class="x" data-a="close" aria-label="Close">×</button></div><p class="small">${intro}</p><div class="exl">${rows}</div>${note?`<p class="small muted">${note}</p>`:""}${go?`<div class="row"><button class="btn sm pri" data-a="tab" data-t="${go[0]}">${go[1]}</button></div>`:""}</div>`;}
function whyNet(c){const st=c.stat||{},net=st.net||0,inc=(st.taxes||0)+(st.tariffs||0),r=net-(inc-(st.pay||0)-(st.gov||0)-(st.interest||0));
 return exSheet("Treasury change","What comes in and goes out of the treasury in one month, at today's rates.",exR("Taxes",sgn(st.taxes||0),"good")+exR("Tariffs",sgn(st.tariffs||0),"good")+exR("Pay and public spending",sgn(-(st.pay||0)),"bad")+exR("Supplies and building",sgn(-(st.gov||0)),"bad")+exR("Interest on debt",sgn(-(st.interest||0)),"bad")+(Math.abs(r)>1?exR("Other",sgn(r)):"")+exR("<b>Change a month</b>",sgn(net),net<0?"bad":"good")+exR("Treasury now",moneyS(c.tr))+exR("Debt",money(c.debt||0)),
  "Spending levels: education "+pct(c.sp.edu)+", administration "+pct(c.sp.adm)+", social "+pct(c.sp.soc)+", army "+pct(c.sp.mil)+". Change them, or the tax rates, on the Nation page.",["nat","Open the budget"]);}
function whyMil(c){const rf=c.reforms,sat=(rf.vote+rf.press+rf.meet+rf.unions+rf.parties)*.12+((rf.wage||0)+(rf.hours||0)+(rf.safety||0)+(rf.unemp||0)+(rf.pension||0)+(rf.health||0))*.06,mr=techFx(c,"mil"),a={hun:0,sch:0,cul:0,gov:0,awa:0,une:0,hos:0,act:0};let n=0;
 for(const p of provsOf(c.tag)){const u=p.un/100;for(const q of p.pops){const w=q.n,s=PTYPES[q.t].s,acc=accepted(c,q.c)?0:1;n+=w;a.hun+=(1-q.ld)*7*w;a.sch+=(1-q.ed)*(s===0?.8:1.6)*w;a.cul+=acc*(c.cit==="culture"?2.5:c.cit==="limited"?1.2:.4)*w;a.gov+=(1-(q.id[c.ideo]||0))*1.2*w;a.awa+=q.con*.15*w;a.une+=u*2*w;a.hos+=(p.hosp||0)*.4*w;a.act+=q.mil*w;}}
 n=n||1;const nf=natFig(c),rows=[["Hunger and hardship",a.hun/n],["Poor schooling",a.sch/n],["War weariness",c.we/25],["Peoples we do not accept",a.cul/n],["Disliking the ruling party",a.gov/n],["Awareness from literacy",a.awa/n],["Unemployment",a.une/n],["Reforms already won",-sat],["Hospitals",-a.hos/n],["Modern army reforms",-mr*3]].filter(r=>Math.abs(r[1])>=.05).sort((x,y)=>y[1]-x[1]);
 return exSheet("Militancy","How angry the people are, from 0 to 10, averaged over everyone. Each month it moves 4% of the way toward the pressures below. Above 5, people gather into movements; far above, they rise.",exR("<b>Militancy now</b>",nf.mil.toFixed(1)+" of 10",nf.mil>=4?"bad":"")+rows.map(r=>exR(esc(r[0]),(r[1]<0?"−":"+")+Math.abs(r[1]).toFixed(1),r[1]<0?"good":"")).join("")+exR("Pull toward",Math.max(0,Math.min(10,rows.reduce((s,r)=>s+r[1],0))).toFixed(1)),"Pressures are approximate: they are weighed per person, so a province of angry people counts for more. The best cures are food, schools, jobs and reforms.",["pol","Open Politics"]);}
function whyInf(c){const inf=c.infamy||0,g=(c.gains||[]).slice(-6).reverse(),co=G.coal&&G.coal[c.tag];
 return exSheet("Infamy","How much the world fears our appetite. It rises when we declare war and when we take or annex land; it fades by 0.025 a month.",exR("<b>Our infamy</b>",inf.toFixed(1),inf>COAL_AT-6?"bad":"")+exR("A coalition forms at",String(COAL_AT))+exR("A coalition breaks up below",String(COAL_OFF))+exR("Right now",co&&co.mem&&co.mem.length?"a coalition of "+co.mem.length+" stands against us":"no coalition","bad")+(g.length?"<h3>Recent gains that count</h3>"+g.map(x=>exR(esc(P(x.id).n),dateStr(x.t))).join(""):"<p class=\"small muted\">No recent conquests.</p>"),"At "+COAL_AT+" the other powers may band together; they can force us to give back recent conquests. Wars with a just cause and land of our own people cost less.",["dip","Open the World page"]);}
function whyRank(c){const rk=G.rank.indexOf(c.tag)+1,sc=c.score||{pres:0,ind:0,mil:0},tot=x=>x.pres+x.ind*.2+x.mil*.2,mine=tot(sc),up=G.rank[rk-2],dn=G.rank[rk];
 const ln=(t)=>{const o=G.c[t];if(!o||!o.score)return"";const s=tot(o.score);return exR(esc(o.n)+" ("+ord(G.rank.indexOf(t)+1)+")",Math.round(s)+" ("+(s>=mine?"+":"−")+Math.round(Math.abs(s-mine))+")");};
 return exSheet("Rank score","Nations are ranked by one score: prestige, plus a fifth of industry, plus a fifth of army strength.",exR("Prestige",Math.round(sc.pres))+exR("Industry points × 0.2",Math.round(sc.ind*.2)+" ("+sc.ind+")")+exR("Army points × 0.2",Math.round(sc.mil*.2)+" ("+sc.mil+")")+exR("<b>Our score</b>",Math.round(mine)+" — "+ord(rk))+(up?"<h3>The nations beside us</h3>"+ln(up):"<h3>The nations beside us</h3>")+(dn?ln(dn):""),"Prestige comes from winning wars, great works and a few events. Industry comes from factories. Army points come from the strength of our brigades.",["dip","Open the World page"]);}
function whyInc(c){const st=c.stat||{};let farm=0,mine=0;for(const p of provsOf(c.tag)){const o=p._out;if(!o)continue;const sd=(c.sold&&c.sold[p.farm])||1;if(o.farm)farm+=o.farm*G.price[p.farm]*sd+(o.grain?o.grain*G.price.grain*((c.sold&&c.sold.grain)||1):0);if(o.mine)mine+=o.mine*G.price[p.mine]*((c.sold&&c.sold[p.mine])||1);}
 const gdp=st.gdp||0,rest=Math.max(0,gdp-farm-mine);return exSheet("National income","Everything the nation makes in a year, valued at market prices (twelve times this month's output).",exR("Farms and grazing",money(farm*12))+exR("Mines",money(mine*12))+exR("Factories and craftsmen",money(rest*12))+exR("<b>National income</b>",money(gdp*12)+" a year")+exR("The state takes in taxes",money((st.taxes||0)*12)+" ("+Math.round((st.taxes||0)/Math.max(1,gdp)*100)+"%)")+exR("and tariffs",money((st.tariffs||0)*12)),"Output rises with people at work, better methods, railways and good prices. The state's share is set by tax rates and how well they are collected.",["eco","Open Economy"]);}
function whySup(c){const by=new Map();for(const a of G.armies)if(a.o===c.tag&&!a.naval&&!a.reb&&a.u.length)by.set(a.loc,(by.get(a.loc)||0)+a.u.length);
 const rows=[...by].map(([loc,n])=>{const p=P(loc),t=TERRAIN[p.t].sup||6,lim=supLim(p);return[p,n,lim,t];}).sort((x,y)=>(y[1]-y[2])-(x[1]-x[2]));
 return exSheet("Supply limit","How many brigades one province can feed. Terrain gives a base, each railway level adds 3 and each fort level adds 2. Units above the limit lose strength every month.",rows.length?rows.map(([p,n,lim,t])=>exR(esc(p.n)+'<br><span class="small muted">'+esc(TERRAIN[p.t].n)+" "+t+" + railway "+p.rail*3+" + forts "+p.fort*2+"</span>",n+" of "+lim,n>lim?"bad":"good")).join(""):"<p class=\"small muted\">We have no land armies in the field.</p>","Brigades over the limit lose strength. Move some to a theatre with more room, or lay railways. Soldiers in all: "+ppl((c.stat.N||{}).SOL||0)+".",["mil","Open Military"]);}
function whyWs(c,wid){const w=G.wars.find(x=>x.id===wid)||G.wars.find(x=>x.att.includes(c.tag)||x.def.includes(c.tag));if(!w)return exSheet("War score","We are at peace, so there is no score.","","",["dip","Open the World page"]);
 const side=w.att.includes(c.tag)?1:2,ws=side===1?w.ws:-w.ws,need=WARGOALS[w.goal.k].ws,foes=side===1?w.def:w.att,en=new Set(foes),lost=G.plist.filter(p=>p.o===c.tag&&p.ctl&&p.ctl!==p.o&&en.has(p.ctl)).length,won=G.plist.filter(p=>p.ctl===c.tag&&p.o!==c.tag&&en.has(p.o)).length;
 return exSheet("War score","A running total, from −100 to +100, of who is winning "+(side===1?"our war against ":"the war against us by ")+esc(foes.map(nameOf).join(", "))+". Positive is good for us.",exR("<b>War score</b>",Math.round(ws).toString().replace("-","−"),ws<0?"bad":"good")+exR("Our goal ("+WARGOALS[w.goal.k].n.toLowerCase()+") needs",String(need))+exR("Enemy provinces we hold",String(won))+exR("Our provinces they hold",String(lost),lost?"bad":"")+exR("Months at war",String(G.t-w.start))+exR("War exhaustion here",Math.round(c.we)+" of 100"),"The score moves when a battle is won (by the size of the losses), when a province is occupied (by its share of the enemy's people, up to 25), when an army is cut off and surrenders, and when a blockade bites. Only the lead nation can sign peace.",["dip","The war in full"]);}
const WHY={net:whyNet,mil:whyMil,inf:whyInf,rank:whyRank,inc:whyInc,sup:whySup};

/* ---------- U6: the guide and the coach cards ---------- */
const GUIDE=[["The Overview","Alerts come first: red needs you now, gold soon. Tap one to go where it can be fixed. Below are the minister's brief, the nation's vital figures, rivals, wars, the budget and your goals. Tap any figure marked i to see what makes it up.","over","Go to the Overview"],
["Economy","Mills turn raw goods into dearer ones. Build where a good is short and its price is above its 1836 level. Railways lift output and the supply limit. Keep the treasury positive: raise taxes before you cut education. The Economy page shows prices, trade and works under way.","eco","Open Economy"],
["War","Pick a cause on the World page and weigh the odds before you declare. Then open the Military page: your brigades form one theatre in each region. Give every theatre a stance (Attack, Probe, Hold, Dig in, Fall back or Garrison), an objective, an intensity and a priority; its general does the marching. The minister's advice on each card shows the odds and the expected losses. Infantry holds the line, cavalry scouts and runs down a beaten enemy, artillery cuts trenches and forts. Each battle, siege and cut-off force moves the war score. When it reaches your goal, force peace. Wars raise infamy and war exhaustion.","mil","Open Military"],
["Navy and blockades","Ships are posted to seas, not moved one by one. Give each sea a mission: blockade an enemy, patrol and escort, seek battle, cover a landing, or stay in port. A blockade strangles trade and moves the war score. Troops need transports with room for every brigade, and a patrol keeps the lanes safer.","mil","Open Military"],
["Diplomacy","Relations decide who will ally, guarantee or fight. Guarantee weak states to hold rivals back, but you must fight if they are attacked. Infamy above 25 can unite the powers against you. A congress may settle a crisis without war.","dip","Open the World page"],
["Politics","People gather into movements when militancy passes 5. Reforms calm them but anger the old guard. Elections shift power between parties; the ruling party shapes laws. Education and food lower militancy over time. Decisions are one-time historical choices.","pol","Open Politics"],
["Research","Scholars master one technology at a time. Methods for mills, better guns and ships, and trade tools all come from here. Choose studies that match your needs: a nation with mills wants modern methods; one at war wants arms.","tech","Open Research"],
["Dispatches and goals","Dispatches collects letters that matter: events that need your seal, wars, peace, finished works and open decisions. Goals on the Overview score your reign: some are historical, some are for any nation.","news","Open Dispatches"]];
const COACH={over:["Start here","Red and gold strips are warnings; tap one to fix it. The minister's brief below suggests what to do next, with odds. Press End month when you are ready."],
 news:["Your letters","Anything that needs an answer appears here as a sealed decree. The game waits until you decide. Other news, such as wars and finished works, is filed below."],
 nat:["Keep the books","Watch the Balance. If it is negative, raise taxes on the rich first, or trim spending. Tap the figures marked i to see what makes them up."],
 eco:["Build to earn","Build where a good is scarce and dear: the brief names the best place. Factories need people who can read, and railways make every province richer."],
 mil:["Give each theatre its orders","Your brigades form one theatre in each region. At war, choose a stance for every theatre; the minister's advice on its card gives the odds and the losses to expect. The button on the map finds the next theatre that needs orders."],
 dip:["Weigh the odds","Pick a cause for war, then read the odds and what rivals will do before declaring. Every land grab raises infamy; at 25 the powers may band together."]};
let COACH_=null;const coachS=()=>{if(COACH_)return COACH_;try{COACH_=JSON.parse(localStorage.getItem("vic.coach")||"{}")||{};}catch(e){COACH_={};}return COACH_;};
const coachSave=()=>{try{localStorage.setItem("vic.coach",JSON.stringify(COACH_||{}));}catch(e){}};
function coachHTML(k){const s=coachS(),c=COACH[k];if(!c||s._all||s[k]||!G||(G.t>36&&!UI.coachForce))return"";return`<aside class="coach" role="note"><b>${c[0]}</b><p class="small">${c[1]}</p><div class="row"><button class="btn sm" data-a="coachx" data-k="${k}">Got it</button><button class="btn sm" data-a="coachoff">Hide all tips</button></div></aside>`;}
function pgGuide(){return`<header class="headpiece">${VIG}<h1>The Guide</h1><div class="sub">One short page for each part of the game</div>${HEADORN}</header>${GUIDE.map(g=>`<div class="card"><h2>${g[0]}</h2><p>${g[1]}</p><div class="row"><button class="btn sm" data-a="tab" data-t="${g[2]}">${g[3]}</button></div></div>`).join("")}<div class="card"><h2>Tips</h2><p class="small">The first-game tips appear on the pages they belong to, until you dismiss them.</p><div class="row"><button class="btn sm" data-a="coachreset">Show the tips again</button></div></div>${TAILORN}`;}

/* ---------- U6: two more alerts ---------- */
function extraAlerts(c,add){const st=c.stat||{},inc=Math.max(1,st.inc||0),tag=c.tag,L=provsOf(tag),busy=sum(L,p=>p.build.length),slots=Math.max(2,Math.min(10,2+Math.floor(L.filter(p=>p.ctl===p.o&&p.col).length/4))),bc=BUILDC();
 if(c.civ&&busy<slots&&c.tr>=bc*1.5&&c.tr>inc*2){const f=BR().all.find(r=>r.id==="fac");add("warn",busy?"Empty build slot: "+busy+" of "+slots+" works under way, and the treasury holds "+money(c.tr)+".":"Idle capital: "+money(c.tr)+" sits in the treasury and nothing is being built.",f?"facmenu":"tab",f?{p:f.d.p}:{t:"eco"});}
 const by=new Map();for(const a of G.armies)if(a.o===tag&&!a.naval&&!a.reb&&a.u.length){const e=by.get(a.loc)||[0,a];e[0]+=a.u.length;if(a.u.length>e[1].u.length)e[1]=a;by.set(a.loc,e);}
 let w=null;for(const[loc,[n,a]]of by){const lim=supLim(P(loc)),ov=n-lim;if(ov>0&&(!w||ov>w[0]))w=[ov,n,lim,a,loc];}
 if(w)add("warn",w[1]+" brigades at "+P(w[4]).n+" exceed the supply limit of "+w[2]+": they lose strength every month. Move some to another theatre.","tab",{t:"mil"});}

/* ---------- actions ---------- */
Object.assign(ACT,{
 cardpick:d=>{UI.cardSel=d.k;drawCard();},
 cardseal:()=>{if(UI.cardSel)ACT.card({k:UI.cardSel});},
 card:d=>{const c=G.card;if(!c)return;const o=c.opts.find(x=>x.k===d.k);if(!o)return;const b=G.msgs[0],rec={k:c.kind==="cong"?"cong":"event",ti:c.title,x:c.txt,o:o.label,ot:o.txt,history:c.history,t:c.t};
  cardChoose(o.k);UI.cardHide=0;UI.cardSel=null;const fresh=[];for(const m of G.msgs){if(m===b)break;fresh.push(m);}
  const dd=dispAdd(Object.assign(rec,{r:1}));if(dd){dd.a=null;delete dd.ad;delete dd.al;}dispMonth(fresh);UI._br=null;autosave();render();toast("Decision taken: "+o.label+".");},
 dfil:d=>{UI.df=d.f;render();},
 brief:d=>{const b=BR(),r=b.list[+d.i];if(!r)return;if(r.run){r.run();UI._br=null;render();return;}const f=ACT[r.a];if(f){f(r.d||{});}UI._br=null;},
 briefnew:()=>{BR(true);render();toast("The brief is worked out again.");},
 why:(d)=>{const c=me();if(d.k==="ws"){openModal(whyWs(c,d.w));return;}const f=WHY[d.k];if(f)openModal(f(c));},
 coachx:d=>{coachS()[d.k]=1;coachSave();render();},coachoff:()=>{coachS()._all=1;coachSave();render();toast("Tips are hidden. The Guide can bring them back.");},
 coachreset:()=>{COACH_={};coachSave();render();toast("The tips will appear again.");},
 guide:()=>{closeModal();UI.tab="guide";UI.dipT=null;closeSheet();render();const pg=$("#page");if(pg)pg.scrollTop=0;}});
{const f=ACT.pick;ACT.pick=(d,el)=>{f(d,el);if(G&&G.player){objInit(me());dispAdd({k:"pol",ti:"Your reign begins",x:"You lead "+me().n+" in "+dateStr(G.t)+". Read the Overview, then press End month. Letters that need you will arrive here.",a:"tab",ad:{t:"over"},al:"Go to the Overview"});drawTop();}};}
PAGES.news=pgDisp2;PAGES.chron=pgNews;PAGES.guide=pgGuide;
const EXK={Treasury:"net",Rank:"rank",Militancy:"mil",Army:"sup",Infamy:"inf",War:"ws"};
function exTile(k,t,bad){const ek=EXK[k]&&!(k==="War"&&!me().war.length)?EXK[k]:null;return`<button class="rc${bad?" neg":""}${ek?" ex":""}" data-a="${ek?"why":"tab"}" data-t="${t}"${ek?` data-k="${ek}"`:""}>`;}
