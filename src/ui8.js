"use strict";
/* ================= V2: Build mode =================
   Choose a project once, tap provinces on the Atlas, review once, confirm once. No tap spends money:
   only Confirm issues orders, each through applyCampaignCommand (kinds building, queue and rail).
   Everything here reads the game and draws; the rules (bldCan, bldCost, bldPay, railCan, startRail) are the engine's own.
   Railway routes use their own breadth-first search over adjacent land provinces we hold and control. */
Object.assign(ICON,{rail:'<path d="M7 3l-3 18M17 3l3 18M5.3 9h13.4M4.5 15h15"/>'});
UI.bm={on:false,proj:null,rail:{a:null,b:null},msg:"",rev:null,batches:[],last:null,undo:null,pend:null};
/* V2c: the selection of the chosen project is a view of the one basket shared with the Works board (ui9.js) */
Object.defineProperty(UI.bm,"sel",{configurable:true,enumerable:true,get(){return UI.bm.proj&&UI.bm.proj!=="rail"?wbIds(UI.bm.proj):[];},set(v){if(UI.bm.proj&&UI.bm.proj!=="rail"){for(const id of wbIds(UI.bm.proj))if(!v.includes(id))wbDel(UI.bm.proj,id);for(const id of v)wbAdd(UI.bm.proj,id);}else if(!v.length)wbClear();}});
const BM_GROUPS=[["eco","Economy"],["mil","Military"],["civic","Civic"]];
const bmGrp=k=>k==="rail"?"eco":BLD[k].grp==="soc"||BLD[k].grp==="cul"?"civic":BLD[k].grp;
const bmNm=k=>k==="rail"?"Railway":BLD[k].n;
const bmOne=k=>k==="rail"?"Faster marches and more output from the province it runs through.":BLD[k].d.split(/\.\s/)[0].replace(/\.$/,"")+".";
const bmOn=()=>!!(UI.bm.on&&UI.bm.proj&&G&&G.player);
const bmValid=k=>k==="rail"||!!(k&&BLD[k]);
function bmSave(){OPTS("bm",{p:UI.bm.proj,on:UI.bm.on?1:0});}
/* after a load or Continue: the chosen project comes back with the campaign */
function bmRestore(){const s=OPT("bm",null),b=UI.bm;wbClear();b.rail={a:null,b:null};b.msg="";b.rev=null;b.undo=null;b.pend=null;b.last=null;
 if(s&&bmValid(s.p)&&s.on){b.proj=s.p;b.on=true;}else{b.proj=null;b.on=false;}}
const heldBy=(c,p)=>!!p&&p.o===c.tag&&p.ctl===p.o&&!p.waste;

/* ---------- who can take the project ---------- */
function bmCan(c,p,k){
 if(k==="rail"){if(!heldBy(c,p))return{ok:false,why:p.waste?"Nothing can be built here.":p.o===c.tag?"An enemy holds this province.":"Only in provinces we hold."};return{ok:true};}
 if(p.waste)return{ok:false,why:"Nothing can be built here."};
 if(p.o!==c.tag)return{ok:false,why:p.o?"Not ours: only provinces we hold can be built in.":"Nobody holds this land yet."};
 if(p.ctl!==p.o)return{ok:false,why:"An enemy holds this province."};
 if((c.bq||[]).some(x=>x.p===p.id&&x.b===k))return{ok:false,why:"Already waiting in the queue."};
 return bldCan(c,p,k);}
function bmEligible(c,k){const s=new Set();for(const p of provsOf(c.tag))if(bmCan(c,p,k).ok)s.add(p.id);return s;}

/* ---------- railway routes: our own search, over land we hold and control ---------- */
function bmRoute(c,a,b){
 const ok=id=>heldBy(c,P(id));
 if(!ok(a))return{ok:false,why:"The line must start in a province we hold.",path:[],gap:[],segs:[]};
 const prev={[a]:null},q=[a];let found=a===b;
 for(let i=0;i<q.length&&!found;i++){const x=q[i];for(const n of ADJ[x]){if(n in prev||!ok(n))continue;prev[n]=x;if(n===b){found=true;break;}q.push(n);}}
 if(found){const path=[];for(let x=b;x!==null;x=prev[x])path.push(x);path.reverse();return{ok:true,path,gap:[],segs:path.map(id=>bmSeg(c,P(id)))};}
 /* no all-land route we control: find the shortest land line at all, to show where it breaks */
 const dist={[a]:0},pv2={[a]:null},todo=[a];
 while(todo.length){let bi=0;for(let i=1;i<todo.length;i++)if(dist[todo[i]]<dist[todo[bi]])bi=i;const x=todo.splice(bi,1)[0];if(x===b)break;
  for(const n of ADJ[x]){const pn=P(n);if(pn.waste)continue;const d=dist[x]+(ok(n)?.01:1);if(!(n in dist)||d<dist[n]-1e-9){dist[n]=d;pv2[n]=x;if(!todo.includes(n))todo.push(n);}}}
 if(!(b in dist))return{ok:false,why:"These provinces are not joined by land, and railways do not cross the sea.",path:[],gap:[],segs:[]};
 const path=[];for(let x=b;x!==null;x=pv2[x])path.push(x);path.reverse();
 const gap=path.filter(id=>!ok(id)),first=P(gap[0]);
 const holder=first.o?(first.o===c.tag?"occupied by an enemy":"held by "+G.c[first.o].n):"held by nobody";
 return{ok:false,why:"No all-land route through provinces we control. The line breaks at "+first.n+" ("+holder+").",path,gap,segs:path.filter(ok).map(id=>bmSeg(c,P(id)))};}
/* one province on the line: already railed (by level), can start now, or blocked with the reason. Railways have no waiting list, so none "joins a queue". */
function bmSeg(c,p){
 if(p.rail>=1)return{p,state:"built",lv:p.rail,why:"Railway level "+p.rail};
 if(p.build.some(b=>b.k==="rail"))return{p,state:"block",lv:0,why:"Already under construction."};
 const r=railCan(c,p);
 return r.ok?{p,state:"start",lv:0,why:""}:{p,state:"block",lv:0,why:r.why};}

/* ---------- the plan for the basket: what Review shows and Confirm issues (one basket, many buildings) ---------- */
function bmPlan(){
 const c=me(),b=UI.bm,rows=[],built=[],items=UI.wb.bk.map(x=>({k:x.k,p:x.p,why:x.why||""}));let route=null;const pre=[];
 if(b.proj==="rail"&&b.rail.a&&b.rail.b){route=bmRoute(c,b.rail.a,b.rail.b);
  for(const s of route.segs){if(s.state==="built")built.push(s);
   else if(s.state==="start"){if(!items.some(x=>x.k==="rail"&&x.p===s.p.id))items.push({k:"rail",p:s.p.id,why:""});}
   else pre.push({p:s.p,k:"rail",state:"skip",why:s.why});}}
 const order=[];for(const x of items)if(!order.includes(x.k))order.push(x.k);if(pre.length&&!order.includes("rail"))order.push("rail");
 let free=Math.max(0,buildSlots(c)-bldActive(c));
 for(const k of order){
  for(const x of items){if(x.k!==k)continue;const p=P(x.p);if(!p)continue;
   if(k==="rail"){const can=heldBy(c,p)?railCan(c,p):bmCan(c,p,"rail");
    if(!can.ok){rows.push({p,k,state:"skip",why:can.why});continue;}
    rows.push({p,k,lv:p.rail,next:p.rail+1,C:Object.assign({},RAIL_COST),cost:bldMoney(RAIL_COST),months:Math.round(1/BUILD_RATE),val:null,upk:0,state:"start",pick:x.why});continue;}
   const can=bmCan(c,p,k);
   if(!can.ok){rows.push({p,k,state:"skip",why:can.why});continue;}
   const y=bldPay(c,p,k),lv=BLD[k].lv(p),st=free>0?"start":"queue";if(free>0)free--;
   rows.push({p,k,lv,next:lv+1,C:y.C,cost:y.cost,months:BLD[k].m,val:y.val,upk:BLD[k].upk||0,why:y.why,state:st,pick:x.why});}
  if(k==="rail")for(const r of pre)rows.push(r);}
 const live=rows.filter(r=>r.state!=="skip"),mats={};
 for(const r of live)for(const g in r.C)mats[g]=(mats[g]||0)+r.C[g];
 const est=sum(live,r=>r.cost),first=sum(live.filter(r=>r.state==="start"),r=>r.cost/Math.max(1,r.months)),c0=Math.max(0,c.tr),kinds=[...new Set(rows.map(r=>r.k))];
 const pl={t:G.t,k:kinds.length===1?kinds[0]:kinds.length?"mixed":b.proj,kinds,rows,built,route,mats,est,first,val:sum(live,r=>r.val||0),upk:sum(live,r=>r.upk||0),
  started:live.filter(r=>r.state==="start").length,queued:live.filter(r=>r.state==="queue").length,skipped:rows.length-live.length,
  tr:c.tr,after:c.tr-first,warn:est>0&&est>.25*c0};
 pl.sig=rows.map(r=>r.k+":"+r.p.id+":"+r.state).join("|");
 return pl;}

/* ---------- the map: highlight, dim, selection, route preview, crane badges ---------- */
const bmMk=(x,y,txt,cls)=>`<g class="mk ${cls}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="us"><circle r="10"/><text y="4">${txt}</text></g></g>`;
function bmCraneHTML(c){
 const bq=c.bq||[],qn={};for(const x of bq)qn[x.p]=(qn[x.p]||0)+1;let h="";
 for(const p of provsOf(c.tag)){const w=p.build,q=qn[p.id]||0;if(!w.length&&!q)continue;
  const pr=w.length?sum(w,projProgress)/w.length:0,n=w.length+q;
  h+=`<g class="cr${w.length?"":" qd"}" data-cr="${p.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})"><g class="us"><circle class="hit" cx="18" cy="-18" r="22"/><circle class="cb" cx="18" cy="-18" r="12.5"/><circle class="crt" cx="18" cy="-18" r="11" pathLength="100"/><circle class="crp" cx="18" cy="-18" r="11" pathLength="100" stroke-dasharray="${w.length?Math.max(2,Math.round(pr*100)):0} 100" transform="rotate(-90 18 -18)"/><g class="cri" transform="translate(11 -25) scale(.58)">${ICON.works}</g>${n>1?`<text class="crn" x="27" y="-6">${n}</text>`:""}</g></g>`;}
 return h;}
function bmDraw(){
 const app=$("#app"),map=$("#map");if(!app||!map||!G||!G.player||!$("#bmcr"))return;
 const c=me(),on=bmOn(),b=UI.bm,k=b.proj,top=$("#bmtop"),bot=$("#bmbot"),ov=$("#bmov"),cr=$("#bmcr");
 app.classList.toggle("bm",on);
 const bb=$("#bmbtn");if(bb)bb.classList.toggle("on",on);
 let lit=new Set(),marks="",ovh="";
 if(on){
  const sel=new Set(b.sel);
  if(k==="rail"){
   for(const p of provsOf(c.tag))if(heldBy(c,p))lit.add(p.id);
   const r=b.rail,pl=r.a&&r.b?bmPlan():null,route=pl&&pl.route;
   for(const id of lit)ovh+=`<path class="bmok" d="${WP[id].d}"/>`;
   if(route){
    const seg=new Map(route.segs.map(s=>[s.p.id,s]));
    for(const id of route.path){const s=seg.get(id);lit.add(id);
     if(!s){ovh+=`<path class="bmrg" d="${WP[id].d}"/>`;marks+=bmMk(P(id).x,P(id).y,"×","gap");}
     else{ovh+=`<path class="bmr${s.state==="built"?"b":s.state==="start"?"s":"x"}" d="${WP[id].d}"/>`;marks+=bmMk(P(id).x,P(id).y,s.state==="built"?"L"+s.lv:s.state==="start"?"+":"×",s.state);}}}
   for(const id of[r.a,r.b])if(id){lit.add(id);ovh+=`<path class="bmra" d="${WP[id].d}"/>`;}
   if(r.a&&!r.b)marks+=bmMk(P(r.a).x,P(r.a).y,"A","start");
  }else{
   lit=bmEligible(c,k);
   for(const id of lit)if(!sel.has(id))ovh+=`<path class="bmok" d="${WP[id].d}"/>`;
   for(const id of b.sel){if(!WP[id])continue;ovh+=`<path class="bmsel" d="${WP[id].d}"/>`;marks+=bmMk(P(id).x,P(id).y,"✓","sel");}}
 }
 for(const p of G.plist){const e=document.getElementById("pv-"+p.id);if(!e)continue;const d=on&&!lit.has(p.id);if(e._bd!==d){e.classList.toggle("bm-dim",d);e._bd=d;}}
 setH(ov,ovh);setH(cr,bmCraneHTML(c)+marks);
 top.hidden=bot.hidden=!on;
 if(on){const pl=bmPlan(),n=k==="rail"?(b.rail.a&&b.rail.b&&pl&&pl.route?pl.route.path.length:0):b.sel.length;
  const tot=UI.wb.bk.length,oth=tot-(k==="rail"?0:n),cnt=(k==="rail"?(b.rail.a?(b.rail.b?n+" province"+(n===1?"":"s")+" on the line":"Start chosen"):"No start yet"):n+" selected")+(oth>0?" · "+tot+" in basket":"");
  setH(top,`<div class="bmh"><button class="bmproj" data-a="bmpicker" aria-label="Project: ${esc(bmNm(k))}. Tap to choose another.">${ic(k)}<b>${esc(bmNm(k))}</b>${CHEV}</button><span class="bmn">${cnt}</span><button class="bmx" data-a="bmleave" aria-label="Leave Build mode">×</button></div><div class="bmt">Estimated total at today's prices: <b>${money(pl?pl.est:0)}</b></div><div class="bmm" role="status">${esc(b.msg||bmHint(k,n))}</div>`);
  const none=!pl||(pl.rows.length===0);const nrev=pl?pl.rows.length:0;
  setH(bot,k==="rail"?`<button class="btn" data-a="bmclear">Clear route</button><button class="btn pri" data-a="bmreview"${b.rail.a&&b.rail.b?"":" disabled"}>Review route</button>`
   :`<button class="btn" data-a="bmall" aria-label="Select all eligible in view">Select all eligible in view</button><button class="btn" data-a="bmclear"${n?"":" disabled"}>Clear</button><button class="btn pri" data-a="bmreview"${none?" disabled":""}>Review${nrev?" ("+nrev+")":""}</button>`);}
}
const bmHint=(k,n)=>k==="rail"?"Tap the start of the line, then its end. Nothing is bought until you confirm.":n?"Tap a province to add or remove it. Nothing is bought until you confirm.":"Tap the highlighted provinces to add them. The others are dimmed; tap one to see why.";

/* ---------- taps ---------- */
function bmTap(id){
 const c=me(),b=UI.bm,k=b.proj,p=P(id);if(!p)return;
 if(b.rev||$("#sheet").classList.contains("open"))closeSheet();
 if(k==="rail"){const r=b.rail;
  if(!r.a||r.b){if(heldBy(c,p)){r.a=id;r.b=null;b.msg=p.n+" is the start. Now tap the end of the line.";}else b.msg=p.n+": "+bmCan(c,p,"rail").why;}
  else if(id===r.a){r.a=null;b.msg="Start cleared.";}
  else{r.b=id;const pl=bmPlan(),rt=pl.route;
   b.msg=rt.ok?p.n+" is the end. "+rt.path.length+" provinces on the line"+(pl.skipped?"; "+pl.skipped+" blocked":"")+".":rt.why;}
  drawMap();return;}
 const i=wbIds(k).indexOf(id),can=bmCan(c,p,k);
 if(i>=0){wbDel(k,id);b.msg=p.n+" removed.";}
 else if(!can.ok)b.msg=p.n+": "+can.why;
 else{wbAdd(k,id);b.msg=p.n+" added.";}
 drawMap();}
/* long-press from the ordinary map starts the same thing (V2.2) */
function bmLong(id){if(!P(id)||!G.player)return;if(bmOn())return bmTap(id);if(UI.bm.proj&&bmValid(UI.bm.proj)){bmEnter(UI.bm.proj);return bmTap(id);}UI.bm.pend=id;bmPicker();}

/* ---------- the picker ---------- */
function bmPicker(){
 const c=me(),cur=UI.bm.proj,keys=["rail",...Object.keys(BLD)];
 const row=k=>{const n=k==="rail"?provsOf(c.tag).filter(p=>heldBy(c,p)&&railCan(c,p).ok).length:bmEligible(c,k).size;
  return`<button class="bmp${k===cur?" on":""}" data-a="bmpick" data-k="${k}" aria-pressed="${k===cur}">${ic(k)}<span class="bmpt"><b>${esc(bmNm(k))}</b><small>${esc(bmOne(k))}</small></span><i class="bmpc${n?"":" none"}">${n?n+" can build":"none yet"}</i></button>`;};
 const h=`<div class="ph"><div class="phm"><h2>Build</h2><div class="small muted">Choose a project once, then tap provinces on the map.</div></div><button class="x" data-a="shclose" aria-label="Close">×</button></div>`
  +`<div class="wb-where" role="group" aria-label="Where to build"><button class="btn sm on" aria-pressed="true" data-a="bmpicker">On the map</button><button class="btn sm" aria-pressed="false" data-a="wbopen">Works board: plan every province</button></div>`
  +BM_GROUPS.map(([g,l])=>`<h3>${l}</h3><div class="bmpl">${keys.filter(k=>bmGrp(k)===g).map(row).join("")}</div>`).join("")
  +note("Nothing is bought when you choose a project or tap a province. You will see an estimate and confirm once.");
 openSheet(h);shSet("full",1);}
function bmEnter(k){const b=UI.bm;if(b.proj!==k){b.rail={a:null,b:null};b.msg="";}b.proj=k;b.on=true;b.rev=null;bmSave();hdrX(false);
 if($("#sheet").classList.contains("open"))closeSheet();drawMap();}
function bmLeave(){const b=UI.bm;b.on=false;b.proj=null;b.rail={a:null,b:null};b.msg="";b.rev=null;b.pend=null;bmSave();if($("#sheet").classList.contains("open"))closeSheet();bmUndoHide();drawMap();}

/* ---------- review once ---------- */
const bmArrow=r=>r.k==="rail"?"Railway level "+r.lv+" → "+r.next:"Level "+r.lv+" → "+r.next;
const ST={start:["Starts now","start"],queue:["Joins the queue","queue"],skip:["Skipped","skip"]};
function bmReviewHTML(pl,note0){
 const nm=pl.k==="mixed"?"Orders":bmNm(pl.k),n=pl.started+pl.queued;
 const title=pl.k==="mixed"?n+" orders in "+pl.kinds.length+" kinds":pl.k==="rail"?"Railway route":nm+(n===1?"":"s");
 const rowH=r=>{const[l,c]=ST[r.state];
  return`<div class="bmr ${c}"><div class="bmr1"><b>${esc(r.p.n)}</b><span class="bmst ${c}">${l}</span></div>`+(r.state==="skip"?`<div class="bmr2">${esc(r.why)}</div>`
   :`<div class="bmr2">${bmArrow(r)} · about ${r.months} months</div><div class="bmr2">Estimated ${money(r.cost)} · ${r.val==null?"return not priced: faster marches, more output":"return "+money(r.val)+" a month"+(r.why?": "+esc(r.why):"")}</div>`+(r.pick?`<div class="bmr2 wb-pick">Minister: ${esc(r.pick)}</div>`:""))+`</div>`;};
 const groups=[];for(const r of pl.rows){let g=groups.find(x=>x.k===r.k);if(!g)groups.push(g={k:r.k,rows:[]});g.rows.push(r);}
 const rows=groups.map(g=>{const live=g.rows.filter(r=>r.state!=="skip");
  return`<h3 class="wb-gh">${ic(g.k)}<span>${esc(bmNm(g.k))}</span><small>${live.length} order${live.length===1?"":"s"}${g.rows.length-live.length?", "+(g.rows.length-live.length)+" skipped":""} · estimated ${money(sum(live,r=>r.cost))}</small></h3>`+g.rows.map(rowH).join("");}).join("");
 const built=pl.built.length?`<p class="small muted">Already railed, so no order: ${pl.built.map(s=>esc(s.p.n)+" (level "+s.lv+")").join(", ")}.</p>`:"";
 const left=n?"":`<p class="small bad">Nothing here can be ordered, so there is nothing to confirm.</p>`;
 const rail=pl.k==="rail",tot=`<div class="exl bmtot">${kr("Estimated total at today's prices",money(pl.est),"")}${kr("Materials",esc(costTxt(pl.mats)||"none"),"")}${rail?kr("Return a month","not priced",""):kr("Return a month","+"+money(pl.val)+(pl.upk?", less upkeep "+money(pl.upk):""),"good")}${kr("Treasury after the first month",moneyS(pl.after),pl.after<0?"bad":"")}</div>`;
 const warn=pl.warn?`<div class="bmw" role="alert">Large order: the estimate of ${money(pl.est)} is ${pl.tr>0?Math.round(100*pl.est/pl.tr)+"% of the treasury ("+money(pl.tr)+")":"more than the treasury holds"}. The whole batch is counted, not each order.</div>`:"";
 return`<div class="ph"><div class="phm"><h2>Review: ${esc(title)}</h2><div class="small muted">${pl.started} start, ${pl.queued} queue, ${pl.skipped} skipped</div></div><button class="x" data-a="bmback" aria-label="Back">×</button></div>`
  +(note0?`<p class="bmw" role="alert">${esc(note0)}</p>`:"")+tot
  +note("Estimated total at today's prices; materials are bought as they are delivered, so the final bill follows the market. Returns are estimates.")
  +rows+built+left
  +`<div class="sfoot bmfoot">${warn}<button class="btn" data-a="bmback">Back</button><button class="btn pri" data-a="bmconfirm"${n?"":" disabled"}>Confirm ${n} order${n===1?"":"s"}</button></div>`;}
function bmReview(note0){
 const pl=bmPlan();if(!pl||!pl.rows.length){UI.bm.msg=UI.bm.proj==="rail"?"Tap a start and an end first.":"Select at least one province first.";if(UI.tab==="map")drawMap();else toast(UI.bm.msg);return;}
 UI.bm.rev={t:pl.t,sig:pl.sig};openSheet(bmReviewHTML(pl,note0));shSet("half",1);}
function bmConfirm(){
 const b=UI.bm,rev=b.rev;if(!rev)return;
 const c=me(),pl=bmPlan();
 if(!pl||rev.t!==G.t||rev.sig!==pl.sig){bmReview("Things changed since you looked, so here is a fresh estimate. Nothing was ordered.");return;}
 b.rev=null;
 let started=0,queued=0;const skipped=pl.rows.filter(r=>r.state==="skip").map(r=>[r.p.n,r.why]),qids=[],orders=[];
 for(const r of pl.rows){if(r.state==="skip")continue;
  let res,kind=r.k==="rail"?"rail":r.state==="start"?"building":"queue";
  const go=kd=>applyCampaignCommand({...issueCampaignCommand(),kind:kd,province:r.p.id,building:r.k==="rail"?undefined:r.k});
  res=go(kind);
  if(!res.ok&&res.full&&kind==="building"){kind="queue";res=go(kind);}
  if(!res.ok){skipped.push([r.p.n,res.why||res.txt||"It could not be ordered."]);continue;}
  if(kind==="queue"){queued++;qids.push(c.bq.at(-1).id);}else started++;
  orders.push({p:r.p.id,k:r.k,kind,C:r.C,orderId:G.commandSerial});}
 const last={t:G.t,proj:pl.k,started,queued,skipped:skipped.length,reasons:skipped,qids,orders,est:pl.est,mats:pl.mats};
 b.last=last;b.batches.push(last);wbClear();b.rail={a:null,b:null};b.msg="";
 try{autosave();}catch(e){}
 openSheet(bmResultHTML(last));shSet("half",1);drawMap();if(UI.tab!=="map")render();
 if(qids.length)bmUndoShow(qids);}
function bmResultHTML(l){
 return`<div class="ph"><div class="phm"><h2>${esc(l.proj==="mixed"?"Orders":bmNm(l.proj))}: done</h2></div><button class="x" data-a="shclose" aria-label="Close">×</button></div>`
  +`<p class="bmres" role="status"><b>Started ${l.started}, queued ${l.queued}, skipped ${l.skipped}</b></p>`
  +(l.reasons.length?`<div class="exl">${l.reasons.map(([n,w])=>kr(esc(n),esc(w),"bad")).join("")}</div>`:"")
  +note("Estimated total at today's prices: "+money(l.est)+". Materials are bought month by month as they arrive, so the final bill follows the market. Work that has started cannot be cancelled; queued orders can be removed on the Works page or from the crane badge on the map.")
  +`<div class="sfoot">${l.qids.length?`<button class="btn" data-a="bmundo">Undo all queued (${l.qids.length})</button>`:""}<button class="btn" data-a="shclose">Keep building</button><button class="btn pri" data-a="bmworks">${UI.tab==="works"?"Back to the Works board":"Open the Works page"}</button></div>`;}
/* a six-second chance to take back what only joined the queue */
function bmUndoShow(ids){const b=UI.bm,u=$("#bmundo");if(!u)return;clearTimeout(b._ut);b.undo=ids.slice();u.innerHTML=`<span>${ids.length} order${ids.length===1?"":"s"} queued.</span><button class="btn sm" data-a="bmundo">Undo all queued</button>`;u.hidden=false;b._ut=setTimeout(bmUndoHide,6000);}
function bmUndoHide(){const b=UI.bm,u=$("#bmundo");clearTimeout(b._ut);b.undo=null;if(u){u.hidden=true;u.innerHTML="";}}
function bmUndo(){const b=UI.bm,ids=b.undo||(b.last&&b.last.qids)||[];bmUndoHide();const c=me();let n=0;
 for(const id of ids){if(!(c.bq||[]).some(x=>x.id===id))continue;ACT.bqdel({id,...issueCampaignCommand()});n++;}
 if(b.last)b.last.qids=[];const ub=document.querySelector("#sheet [data-a=bmundo]");if(ub){ub.disabled=true;ub.textContent="Queued orders removed";}
 toast(n?"Removed "+n+" queued order"+(n===1?"":"s")+". Work already started carries on.":"Nothing left in the queue to remove.");
}

/* ---------- crane badges: the queue of one province ---------- */
function bmCraneAt(cx,cy){for(const g of document.querySelectorAll("#bmcr g.cr")){const h=g.querySelector(".hit");if(!h)continue;const r=h.getBoundingClientRect();if(r.width&&Math.hypot(cx-(r.left+r.right)/2,cy-(r.top+r.bottom)/2)<=r.width/2)return g.dataset.cr;}return null;}
function bmCrane(id,keep){
 const c=me(),p=P(id);if(!p)return;UI.crane=id;if(!keep)UI.sel=null;
 const q=c.bq||[],mine=q.map((x,i)=>[x,i]).filter(([x])=>x.p===id);
 const works=p.build.map(b=>lr({lead:ic(b.k==="bld"?b.b:b.k==="rail"?"rail":"works"),t:esc(projName(b)),s:(b.paid==null?"under way":money(b.paid)+" paid")+(b.lastProgress?.delayed?" · short of funds":"")+projectShortage(c,b),bar:projProgress(b),v:pct(projProgress(b))})).join("");
 const wait=mine.map(([x,i])=>lr({lead:ic(x.b),t:esc(BLD[x.b].n),s:"waiting list, place "+(i+1)+" of "+q.length,mid:`<span class="qbtns"><button class="btn sm" ${DA("bqmv",{id:x.id,d:-1,...issueCampaignCommand()})}${i?"":" disabled"} aria-label="Move up">Up</button><button class="btn sm" ${DA("bqmv",{id:x.id,d:1,...issueCampaignCommand()})}${i<q.length-1?"":" disabled"} aria-label="Move down">Down</button><button class="btn sm dng" ${DA("bqdel",{id:x.id,...issueCampaignCommand()})}>Remove</button></span>`})).join("");
 const h=`<div class="ph"><div class="phm"><h2>Works in ${esc(p.n)}</h2><div class="small muted">${p.build.length} under way, ${mine.length} waiting</div></div><button class="x" data-a="shclose" aria-label="Close">×</button></div>`
  +(works?`<h3>Under way</h3>${works}`:"")+(wait?`<h3>Waiting list</h3>${wait}`:"")+(works||wait?"":note("Nothing is being built here now."))
  +note("Work that has started cannot be cancelled. Waiting orders can be moved or removed.")
  +`<div class="sfoot"><button class="btn" data-a="bmworks">Open the Works page</button><button class="btn" data-a="shclose">Close</button></div>`;
 openSheet(h);shSet("half",1);UI.crane=id;}
/* a queue edit changes the serial numbers in the buttons, so the open crane sheet is drawn again */
for(const k of["bqmv","bqdel"]){const f=ACT[k];ACT[k]=(d,el)=>{f(d,el);if(UI.crane&&P(UI.crane)&&$("#sheet").classList.contains("open"))bmCrane(UI.crane,true);};}

Object.assign(ACT,{
 bmopen:()=>{closeLens();hdrX(false);UI.bm.pend=null;bmPicker();},
 bmpicker:()=>bmPicker(),
 bmpick:d=>{const pend=UI.bm.pend;UI.bm.pend=null;bmEnter(d.k);if(pend&&UI.bm.proj!=="rail")bmTap(pend);},
 bmleave:()=>bmLeave(),
 bmclear:()=>{const b=UI.bm;if(b.proj==="rail")b.rail={a:null,b:null};else b.sel=[];b.msg="Cleared.";drawMap();},
 bmall:()=>{const c=me(),b=UI.bm,v=UI.view,el=bmEligible(c,b.proj);let n=0;
  for(const id of el){const p=P(id);if(p.x<v.x||p.x>v.x+v.w||p.y<v.y||p.y>v.y+v.h)continue;if(wbAdd(b.proj,id))n++;}
  b.msg=n?n+" eligible province"+(n===1?"":"s")+" in view added.":"No more eligible provinces in view. Pan or zoom out to see others.";drawMap();},
 bmreview:()=>bmReview(),
 bmback:()=>closeSheet(),
 bmconfirm:()=>bmConfirm(),
 bmundo:()=>bmUndo(),
 bmworks:()=>{closeSheet();if(UI.tab==="works")render();else ACT.tab({t:"works"});}});
