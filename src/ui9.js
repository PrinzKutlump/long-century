"use strict";
/* ================= V2c: the Works board =================
   Build by plan: every building in every province on one screen, one basket shared with the map's Build mode,
   one review and one confirm (both live in ui8.js: bmPlan, bmReviewHTML, bmConfirm). Nothing here spends money:
   ticks and bulk tools only fill the basket. The rules (bldCan, bldPay, railCan) stay the engine's own, and every
   order still goes through applyCampaignCommand. The basket lives in localStorage, never in the save, and is cleared
   on confirm, on a new game and on every load. */
UI.wb={view:OPT("wbv","bld"),cur:OPT("wbc",null),sort:OPT("wbs","pay"),can:!!OPT("wbf",0),reg:"",grp:OPT("wbg","mil"),tgt:2,cap:"",msg:"",open:{},more:!!OPT("wbm",0),cs:null,bk:[],ver:0,ev:null,evN:0,page:0,bw:0};
const WB_KEY="vic.wb";
const WB_VIEWS=[["bld","By building"],["prov","By province"],["grid","Grid"],["ord","Orders"]];
const WB_GRPS=[["mil","Military"],["eco","Economy"],["soc","People"],["cul","Culture"],["rail","Railway"]];
const WB_SORTS=[["pay","Payback"],["cost","Cost"],["lv","Level"],["name","Name"]];
const wbKeys=g=>g==="rail"?["rail"]:Object.keys(BLD).filter(k=>BLD[k].grp===g);
const wbAllKeys=()=>["rail",...Object.keys(BLD)];
const wbMax=(c,k)=>k==="rail"?railMax(c):BLD[k].max;

/* ---------- the basket ---------- */
function wbStore(){try{localStorage.setItem(WB_KEY,JSON.stringify(UI.wb.bk.map(x=>x.why?[x.k,x.p,x.why]:[x.k,x.p])));}catch(e){}}
const wbHas=(k,p)=>UI.wb.bk.some(x=>x.k===k&&x.p===p);
const wbIds=k=>UI.wb.bk.filter(x=>x.k===k).map(x=>x.p);
function wbAdd(k,p,why){if(wbHas(k,p))return false;UI.wb.bk.push({k,p,why:why||""});UI.wb.ver++;wbStore();return true;}
function wbDel(k,p){const i=UI.wb.bk.findIndex(x=>x.k===k&&x.p===p);if(i<0)return false;UI.wb.bk.splice(i,1);UI.wb.ver++;wbStore();return true;}
function wbClear(){UI.wb.bk=[];UI.wb.ver++;UI.wb.msg="";wbStore();}
function wbToggle(k,p){return wbHas(k,p)?(wbDel(k,p),false):wbAdd(k,p);}
const wbWhy=(k,p)=>{const x=UI.wb.bk.find(y=>y.k===k&&y.p===p);return x?x.why:"";};

/* ---------- the evaluation of every building in every province, cached until the month or an order changes ---------- */
function wbCell(c,p,k,qpos){
 const cell={k,pid:p.id,lv:0,max:wbMax(c,k),st:"need",txt:"",pct:0,qn:0,cost:0,C:null,val:null,net:null,yrs:null,why:""};
 if(k==="rail"){const b=p.build.find(x=>x.k==="rail");cell.lv=p.rail;cell.C=RAIL_COST;cell.cost=bldMoney(RAIL_COST);
  if(b){cell.st="building";cell.pct=projProgress(b);cell.txt="building "+pct(cell.pct);}
  else if(!heldBy(c,p)){cell.txt=bmCan(c,p,"rail").why;}
  else{const r=railCan(c,p);if(r.ok){cell.st="can";cell.txt="can build";}else if(cell.max>0&&p.rail>=cell.max){cell.st="max";cell.txt="at maximum";}else cell.txt=r.why;}
  return cell;}
 const B=BLD[k],lv=B.lv(p);cell.lv=lv;
 if(B.ok&&!B.ok(p)&&!lv){cell.st="na";cell.txt=B.okw||"Not possible here.";return cell;}
 const bj=p.build.find(x=>x.k==="bld"&&x.b===k);
 if(bj){cell.st="building";cell.pct=projProgress(bj);cell.txt="building "+pct(cell.pct);return cell;}
 if(qpos[p.id+"|"+k]){cell.st="queued";cell.qn=qpos[p.id+"|"+k];cell.txt="queued #"+cell.qn;return cell;}
 if(lv>=B.max){cell.st="max";cell.txt="at maximum";return cell;}
 const can=bmCan(c,p,k);cell.C=bldCost(p,k);cell.cost=bldMoney(cell.C);
 if(can.ok){const y=bldPay(c,p,k);cell.st="can";cell.txt="can build";cell.val=y.val;cell.net=y.net;cell.yrs=y.net>0?y.yrs:null;cell.why=y.why;}
 else cell.txt=can.why;
 return cell;}
function wbEval(){
 const c=me();let nb=0;for(const p of provsOf(c.tag))nb+=p.build.length;
 const key=G.t+"|"+(G.commandSerial||0)+"|"+c.tag+"|"+(c.bq||[]).length+"|"+nb+"|"+bldActive(c);
 const o=UI.wb.ev;if(o&&o.g===G&&o.key===key)return o;
 const ev={key,g:G,provs:[],by:{},cnt:{},n:++UI.wb.evN},qpos={};
 (c.bq||[]).forEach((x,i)=>{qpos[x.p+"|"+x.b]=i+1;});
 const keys=wbAllKeys();for(const k of keys)ev.cnt[k]=0;
 ev.provs=provsOf(c.tag).filter(p=>!p.waste).sort((a,b)=>a.n<b.n?-1:a.n>b.n?1:0);
 for(const p of ev.provs){const row=ev.by[p.id]={};for(const k of keys){const cell=row[k]=wbCell(c,p,k,qpos);if(cell.st==="can")ev.cnt[k]++;}}
 return UI.wb.ev=ev;}
function wbCurKey(){const k=UI.wb.cur;if(k&&(k==="rail"||BLD[k]))return k;const b=bldBestAll(me(),1)[0];return UI.wb.cur=b?b.k:"school";}

/* ---------- small pieces of text ---------- */
const wbPay=cell=>cell.st!=="can"?"":cell.k==="rail"?"not priced":cell.yrs==null?"no money return":cell.yrs<1?"pays back in under a year":"pays back in about "+Math.round(cell.yrs)+(Math.round(cell.yrs)===1?" yr":" yrs");
const wbPips=cell=>`<i class="pips" aria-hidden="true">${Array.from({length:Math.max(1,cell.max)},(_,i)=>`<b class="${i<cell.lv?"on":""}"></b>`).join("")}</i>`;
const wbReason=(p,k,cell)=>{const nm=bmNm(k)+" in "+p.n,pay=cell.yrs==null?"it has no money return":cell.yrs<1?"it pays for itself within a year":"it pays for itself in about "+Math.round(cell.yrs)+(Math.round(cell.yrs)===1?" year":" years");return nm+": "+pay+" ("+cell.why+"), about "+money(cell.net)+" a month after upkeep.";};
function wbParseMoney(s){s=String(s||"").toLowerCase().replace(/[£,\s]/g,"");const m=/^(\d+(?:\.\d+)?)(k|m)?$/.exec(s);return m?+m[1]*(m[2]==="k"?1e3:m[2]==="m"?1e6:1):NaN;}
function wbSpend(c){let sp=0;for(const p of provsOf(c.tag))for(const b of p.build){const C=costOf(b);for(const g in b.left||{}){if(C[g]==null)continue;sp+=Math.min(Math.max(0,b.left[g]),monthlyConstructionOrder(b,g))*G.price[g];}}return sp;}

/* ---------- status strip ---------- */
function wbStripHTML(c){
 const slots=buildSlots(c),act=bldActive(c),q=(c.bq||[]).length,free=Math.max(0,slots-act),sp=wbSpend(c);
 return`<button class="wb-strip" data-a="wbstrip" aria-label="Works status: treasury ${esc(moneyS(c.tr))}, about ${esc(money(sp))} of construction this month, ${act} of ${slots} slots used, ${q} waiting. Tap for detail.">`
  +`<span><small>Treasury</small><b>${esc(moneyS(c.tr))}</b></span><span><small>Spend, month</small><b>~${esc(money(sp))}</b></span><span><small>Slots used</small><b>${act}/${slots}</b><small>${free} free</small></span><span><small>Queue</small><b>${q}</b></span></button>`;}

/* ---------- controls ---------- */
const WB_SHORT={fort:"Fort",port:"Naval",depot:"Depot",barracks:"Barrack",arsenal:"Arsenal",dock:"Dock",coal:"Coal",irr:"Irrigat",minew:"Mines",telegraph:"Telegr.",customs:"Customs",bank:"Bank",exchange:"Exch.",power:"Power",uni:"Univ.",hosp:"Hosp.",school:"School",college:"College",silo:"Silo",water:"Water",police:"Police",court:"Court",worship:"Worship",theatre:"Opera",press:"Press",rail:"Railway"};
const wbSeg=(L,cur,a,cls)=>`<div class="wb-seg ${cls||""}" role="group">${L.map(([v,l])=>`<button class="btn sm${v===cur?" on":""}" aria-pressed="${v===cur}" data-a="${a}" data-v="${v}">${esc(l)}</button>`).join("")}</div>`;
function wbToolsHTML(c,ev,k){
 const n=ev.cnt[k]||0,mx=wbMax(c,k),slots=buildSlots(c),free=Math.max(0,slots-bldActive(c)),tg=clamp(UI.wb.tgt,1,Math.max(1,mx)),bld=UI.wb.view==="bld",more=!bld||UI.wb.more;
 const sel=bld?"":`<label class="wb-f">Building<select data-wb="cur" aria-label="Building for the bulk tools">${[["mil","Military"],["eco","Economy"],["soc","People"],["cul","Culture"],["rail","Railway"]].map(([g,l])=>`<optgroup label="${l}">${wbKeys(g).map(x=>`<option value="${x}"${x===k?" selected":""}>${esc(bmNm(x))}</option>`).join("")}</optgroup>`).join("")}</select></label>`;
 const top=bld?`<div class="wb-tr wb-tr1"><button class="btn pri" data-a="wball"${n?"":" disabled"}>Select all eligible (${n})</button><button class="btn" data-a="wbmore" aria-expanded="${!!UI.wb.more}" aria-controls="wbmore">More tools${bld&&(UI.wb.can||UI.wb.reg)?" ●":""}${CHEV}</button></div>`
  :`<div class="wb-tr"><button class="btn" data-a="wball"${n?"":" disabled"}>Select all eligible: ${esc(bmNm(k))} (${n})</button></div>`;
 const rest=more?`<div id="wbmore" class="wb-more">${bld?wbFilHTML(ev):""}
 <div class="wb-tr"><label class="wb-f">Raise to level<select data-wb="tgt" aria-label="Target level">${Array.from({length:Math.max(1,mx)},(_,i)=>`<option value="${i+1}"${i+1===tg?" selected":""}>${i+1}</option>`).join("")}</select></label><button class="btn" data-a="wbraise"${n?"":" disabled"}>Raise every ${esc(bmNm(k).toLowerCase())} to level ${tg}</button></div>
 <div class="wb-tr"><label class="wb-f">Best value within £<input data-wb="cap" type="text" inputmode="decimal" autocomplete="off" placeholder="20000 or 20k" value="${esc(UI.wb.cap)}" aria-label="Amount to spend, in pounds"></label><button class="btn" data-a="wbbest">Best value within the amount</button></div>
 <div class="wb-tr"><button class="btn" data-a="wbfill">Fill free slots (${free} free)</button></div></div>`:"";
 const msg=UI.wb.msg||(more?"These tools only tick boxes. Nothing is bought until you review and confirm.":"");
 return`<div class="wb-tools${bld?" wb-tc":""}" role="group" aria-label="Bulk tools: they only tick boxes, nothing is bought">${sel}${top}${rest}${msg?`<p class="wb-msg small muted" role="status">${esc(msg)}</p>`:""}</div>`;}

/* ---------- view 1: by building ---------- */
function wbChips(c,ev,k){
 const G5=[["mil","Military"],["eco","Economy"],["soc","People"],["cul","Culture"],["rail","Railway"]];
 return`<div class="wb-chiprow" role="group" aria-label="Buildings, swipe sideways" tabindex="-1">`+G5.map(([g,l])=>`<span class="wb-gl" aria-hidden="true">${l}</span>`+wbKeys(g).map(x=>{const n=ev.cnt[x]||0,t=wbIds(x).length;
   return`<button class="wb-chip${x===k?" on":""}" aria-pressed="${x===k}" data-a="wbcur" data-k="${x}" aria-label="${esc(bmNm(x))}, ${l}, ${n} province${n===1?"":"s"} can build${t?", "+t+" ticked":""}">${ic(x)}<span>${esc(bmNm(x))}</span><i class="wb-n${n?"":" none"}">${t?t+"/":""}${n}</i></button>`;}).join("")).join("")+`</div>`;}
function wbRowHTML(cell,p){
 const on=wbHas(cell.k,p.id),can=cell.st==="can",why=on?wbWhy(cell.k,p.id):"";
 const st=cell.st==="building"?"building "+pct(cell.pct):cell.txt;
 return`<button class="wb-row st-${cell.st}${on?" on":""}" role="checkbox" aria-checked="${on}" data-a="wbtick" data-k="${cell.k}" data-p="${p.id}"${can?"":" disabled"}><span class="wb-tk" aria-hidden="true">${on?"✓":""}</span><span class="wb-rm"><b>${esc(p.n)}</b><span class="wb-rs">${wbPips(cell)}<em>${esc(st)}</em></span>${why?`<span class="wb-why">${esc(why)}</span>`:""}</span><span class="wb-rn">${cell.st==="na"?"":esc(money(cell.cost))}<small>${esc(wbPay(cell))}</small></span></button>`;}
function wbFilHTML(ev){
 const by=UI.wb.sort,regs=new Map();for(const p of ev.provs)if(REG_OF[p.id]&&REGION[REG_OF[p.id]])regs.set(REG_OF[p.id],REGION[REG_OF[p.id]].n);
 return`<div class="wb-fil"><label class="wb-f">Sort by<select data-wb="sort" aria-label="Sort by">${WB_SORTS.map(([v,l])=>`<option value="${v}"${v===by?" selected":""}>${l}</option>`).join("")}</select></label><label class="wb-f">Region<select data-wb="reg" aria-label="Region"><option value="">All regions</option>${[...regs].sort((a,b)=>a[1]<b[1]?-1:1).map(([id,n])=>`<option value="${id}"${id===UI.wb.reg?" selected":""}>${esc(n)}</option>`).join("")}</select></label><button class="btn sm${UI.wb.can?" on":""}" aria-pressed="${UI.wb.can}" data-a="wbcan">Can build now</button></div>`;}
function wbListHTML(c,ev,k){
 let L=ev.provs.map(p=>[p,ev.by[p.id][k]]);
 if(UI.wb.reg)L=L.filter(([p])=>REG_OF[p.id]===UI.wb.reg);
 if(UI.wb.can)L=L.filter(([p,x])=>x.st==="can");
 const by=UI.wb.sort,nm=(a,b)=>a[0].n<b[0].n?-1:a[0].n>b[0].n?1:0,can=x=>x[1].st==="can"?0:x[1].st==="na"?2:1;
 L.sort((a,b)=>by==="cost"?(can(a)-can(b))||(a[1].cost-b[1].cost)||nm(a,b):by==="lv"?(a[1].lv-b[1].lv)||nm(a,b):by==="name"?nm(a,b):(can(a)-can(b))||((a[1].yrs==null?1e9:a[1].yrs)-(b[1].yrs==null?1e9:b[1].yrs))||(a[1].cost-b[1].cost)||nm(a,b));
 return (L.length?`<div class="wb-list">${L.map(([p,x])=>wbRowHTML(x,p)).join("")}</div>`:note("No province matches. Clear a filter."));}
function wbByBuilding(c,ev){const k=wbCurKey();
 return wbChips(c,ev,k)+`<p class="wb-desc"><b>${esc(bmNm(k))}.</b> ${esc(bmOne(k))}</p>`+wbToolsHTML(c,ev,k)+wbListHTML(c,ev,k);}

/* ---------- view 2: by province ---------- */
function wbTile(cell,p){
 const on=wbHas(cell.k,p.id),can=cell.st==="can";
 return`<button class="wb-tile st-${cell.st}${on?" on":""}" role="checkbox" aria-checked="${on}" data-a="wbtick" data-k="${cell.k}" data-p="${p.id}"${can?"":" disabled"}>${ic(cell.k)}<span class="wb-tn">${esc(bmNm(cell.k))}</span>${wbPips(cell)}<small>${on?"ticked":esc(cell.st==="building"?"building "+pct(cell.pct):cell.st==="can"?(cell.cost?money(cell.cost):"can build"):cell.txt)}</small></button>`;}
function wbByProvince(c,ev){
 const k=wbCurKey(),open=UI.wb.open;
 return wbToolsHTML(c,ev,k)+ev.provs.map(p=>{const row=ev.by[p.id],ks=wbAllKeys().filter(x=>row[x].st!=="na"),t=ks.filter(x=>wbHas(x,p.id)).length,n=ks.filter(x=>row[x].st==="can").length,o=open[p.id]===undefined?p.id===c.cap&&!Object.keys(open).length:open[p.id];
  return`<section class="wb-card"><button class="wb-ch" data-a="wbfold" data-p="${p.id}" aria-expanded="${!!o}"><span class="wb-cn"><b>${esc(p.n)}</b><small>${t?t+" ticked, ":""}${n} can build</small></span>${t?`<i class="wb-n">${t}</i>`:""}${CHEV}</button>${o?`<div class="wb-tiles">${ks.map(x=>wbTile(row[x],p)).join("")}</div>`:""}</section>`;}).join("");}

/* ---------- view 3: grid ---------- */
const wbCols=()=>{const w=UI.wb.bw||Math.min(window.innerWidth,560)-40;return clamp(Math.floor((w-114)/44),2,5);};
const WB_SYM={can:"+",need:"–",building:"…",queued:"#",max:"●",na:""};
function wbCellBtn(cell,p){
 const on=wbHas(cell.k,p.id),can=cell.st==="can",lab=bmNm(cell.k)+", "+p.n+": level "+cell.lv+" of "+cell.max+", "+(cell.st==="building"?"building "+pct(cell.pct):cell.txt)+(on?", ticked":"");
 return`<button class="wb-cell st-${cell.st}${on?" on":""}" role="checkbox" aria-checked="${on}" aria-label="${esc(lab)}" data-a="wbtick" data-k="${cell.k}" data-p="${p.id}"${can?"":" disabled"}><b>${cell.st==="na"?"":cell.lv}</b><i>${on?"✓":WB_SYM[cell.st]}</i></button>`;}
function wbGrid(c,ev){
 const g=UI.wb.grp,keys=wbKeys(g),cols=wbCols(),pages=[];for(let i=0;i<keys.length;i+=cols)pages.push(keys.slice(i,i+cols));
 const pg=clamp(UI.wb.page,0,pages.length-1);
 const body=pages.map(ks=>`<div class="wb-gp" style="grid-template-columns:110px repeat(${ks.length},44px)"><div class="wb-gh0">Province</div>${ks.map(k=>`<div class="wb-gh1" title="${esc(bmNm(k))}">${ic(k)}<span>${esc(WB_SHORT[k]||bmNm(k))}</span></div>`).join("")}${ev.provs.map(p=>`<div class="wb-gn">${esc(p.n)}</div>`+ks.map(k=>wbCellBtn(ev.by[p.id][k],p)).join("")).join("")}</div>`).join("");
 return wbSeg(WB_GRPS.map(([v,l])=>[v,l+" "+wbKeys(v).length]),g,"wbgrp","wb-seg5")
  +`<p class="small muted">Each cell shows the level now. + can build, – blocked, … building, # queued, ● at maximum, ✓ ticked. Swipe sideways for the next page.</p>`
  +`<div class="wb-gscroll" tabindex="0" aria-label="Grid of provinces and buildings" data-pg="${pg}">${body}</div>`
  +(pages.length>1?`<div class="wb-dots" role="group" aria-label="Grid pages">${pages.map((ks,i)=>`<button class="btn sm${i===pg?" on":""}" aria-pressed="${i===pg}" data-a="wbpage" data-i="${i}" aria-label="Page ${i+1} of ${pages.length}: ${esc(ks.map(bmNm).join(", "))}">${i+1}</button>`).join("")}</div>`:"")
  +wbToolsHTML(c,ev,wbCurKey());}

/* ---------- view 4: the orders ---------- */
function wbOrdersData(c){
 const led=G.constructionLedger||{},out={going:[],wait:[],done:[]};
 for(const p of provsOf(c.tag))for(const b of p.build){if(b.k==="upg")continue;
  const lg=b.ledgerId!=null?led[b.ledgerId]:null,pr=projProgress(b),rate=b.k==="bld"?1/(BLD[b.b].m||10):BUILD_RATE;
  out.going.push({st:"building",o:b.orderId,k:b.k==="bld"?b.b:b.k==="rail"?"rail":"works",nm:projName(b),p:p.id,pr,left:Math.max(1,Math.ceil((1-pr)/rate-1e-9)),paid:lg?lg.paid:(b.paid||0),late:!!(b.lastProgress&&b.lastProgress.delayed)});}
 out.going.sort((a,b)=>(a.o==null?1e9:a.o)-(b.o==null?1e9:b.o));
 (c.bq||[]).forEach((x,i)=>out.wait.push({st:"queued",o:x.orderId,k:x.b,nm:BLD[x.b].n,p:x.p,id:x.id,i,n:(c.bq||[]).length,paid:0}));
 for(const w of (c.completedWorks||[]).filter(w=>w.t>=G.t-12).slice().reverse()){const lg=Object.values(led).find(a=>a.orderId!=null&&a.orderId===w.orderId&&a.province===w.province&&a.owner===c.tag&&a.status==="Completed");
  out.done.push({st:"done",o:w.orderId,k:BLD[w.kind]?w.kind:w.kind==="rail"?"rail":"works",nm:BLD[w.kind]?BLD[w.kind].n:w.kind==="rail"?"Railway":w.good&&GOODS[w.good]?GOODS[w.good].n+" works":"Project",p:w.province,paid:lg?lg.paid:(w.paid||0),t:w.t});}
 return out;}
function wbOrderRow(r){
 const pn=P(r.p).n,name=`<button class="wb-pn" data-a="wbmap" data-p="${r.p}" aria-label="Show ${esc(pn)} on the map">${esc(pn)}</button>`;
 const paid=`<span class="wb-paid" data-paid="${(+r.paid).toFixed(2)}">${esc(money(r.paid))} paid</span>`;
 let s,btns="",bar="";
 if(r.st==="building"){s=`Building ${pct(r.pr)} · about ${r.left} month${r.left===1?"":"s"} left · ${paid}${r.late?" · short of funds":""}`;bar=`<span class="meter"><i style="width:${(clamp(r.pr,0,1)*100).toFixed(0)}%"></i></span>`;}
 else if(r.st==="queued"){s=`Waiting, place ${r.i+1} of ${r.n} · starts when a slot is free · ${paid}`;
  btns=`<span class="wb-ob"><button class="btn sm" ${DA("bqmv",{id:r.id,d:-1,...issueCampaignCommand()})}${r.i?"":" disabled"} aria-label="Move ${esc(r.nm)} in ${esc(pn)} up">Up</button><button class="btn sm" ${DA("bqmv",{id:r.id,d:1,...issueCampaignCommand()})}${r.i<r.n-1?"":" disabled"} aria-label="Move ${esc(r.nm)} in ${esc(pn)} down">Down</button><button class="btn sm dng" ${DA("bqdel",{id:r.id,...issueCampaignCommand()})} aria-label="Remove ${esc(r.nm)} in ${esc(pn)} from the queue">Remove</button></span>`;}
 else s=`Finished ${dateStr(r.t)} · ${paid}`;
 return`<div class="wb-or st-${r.st}" data-order="${r.o==null?"":r.o}" data-st="${r.st}" data-prov="${r.p}"><span class="wb-oi">${ic(r.k)}</span><div class="wb-om"><b>${esc(r.nm)} in ${name}</b><small>${s}</small>${bar}${btns}</div></div>`;}
function wbOrders(c){
 const o=wbOrdersData(c),sec=(t,L,e)=>`<h3 class="wb-gt">${t}<small>${L.length}</small></h3>`+(L.length?L.map(wbOrderRow).join(""):note(e));
 return sec("Under way",o.going,"Nothing is being built.")+sec("Waiting in the queue",o.wait,"Nothing is waiting.")+sec("Finished in the last 12 months",o.done,"Nothing finished in the last 12 months.")
  +note("Paid so far comes from the construction ledger. Work that has started cannot be cancelled; waiting orders can be moved or removed. Tap a province to see it on the map.");}

/* ---------- the basket bar and the whole board ---------- */
function wbBarHTML(){
 const n=UI.wb.bk.length,kinds=new Set(UI.wb.bk.map(x=>x.k)).size,pl=n?bmPlan():null;
 return`<div class="wb-bar${n?"":" empty"}" role="region" aria-label="Basket"><div class="wb-bt" role="status"><b>${n} order${n===1?"":"s"}</b> · ${kinds} kind${kinds===1?"":"s"} · estimated ${money(pl?pl.est:0)} at today's prices</div><div class="wb-bb"><button class="btn" data-a="wbclear"${n?"":" disabled"}>Clear</button><button class="btn pri" data-a="wbreview"${n?"":" disabled"}>Review${n?" ("+n+")":""}</button></div></div>`;}
function wbInner(c){
 const ev=wbEval(),v=UI.wb.view;
 return wbStripHTML(c)+wbSeg(WB_VIEWS,v,"wbview")
  +`<div class="wb-body">${v==="prov"?wbByProvince(c,ev):v==="grid"?wbGrid(c,ev):v==="ord"?wbOrders(c):wbByBuilding(c,ev)}</div>`+wbBarHTML();}
const wbHTML=c=>`<div id="wbboard" class="wb">${wbInner(c)}</div>`;
function wbRefresh(){
 const el=$("#wbboard");if(!el||UI.tab!=="works"||!G||!G.player)return;
 const f=document.activeElement,fk=f&&el.contains(f)?{a:f.dataset.a,k:f.dataset.k,p:f.dataset.p,v:f.dataset.v,i:f.dataset.i,w:f.dataset.wb}:null,gs=el.querySelector(".wb-gscroll"),sl=gs?gs.scrollLeft:0;
 el.innerHTML=wbInner(me());wbPost(sl,fk);}
/* after a draw: keep the grid page, keep the focus, and fit the grid to the real width */
function wbPost(sl,fk){
 const el=$("#wbboard");if(!el)return;
 if(el.clientWidth&&el.clientWidth!==UI.wb.bw){const was=wbCols();UI.wb.bw=el.clientWidth;if(UI.wb.view==="grid"&&wbCols()!==was){el.innerHTML=wbInner(me());}}
 const cr=el.querySelector(".wb-chiprow");
 if(cr){const on=cr.querySelector(".wb-chip.on");
  if(UI.wb.cs!=null)cr.scrollLeft=UI.wb.cs;
  if(on){const l=on.offsetLeft-cr.offsetLeft,r=l+on.offsetWidth;if(UI.wb.cs==null||l<cr.scrollLeft||r>cr.scrollLeft+cr.clientWidth)cr.scrollLeft=Math.max(0,l-(cr.clientWidth-on.offsetWidth)/2);}
  UI.wb.cs=cr.scrollLeft;
  if(!cr._b){cr._b=1;cr.addEventListener("scroll",()=>{UI.wb.cs=cr.scrollLeft;},{passive:true});}}
 const gs=el.querySelector(".wb-gscroll");
 if(gs){const pg=+gs.dataset.pg||0;gs.scrollLeft=sl!=null&&sl>0?sl:pg*gs.clientWidth;if(!gs._b){gs._b=1;gs.addEventListener("scroll",()=>{const w=gs.clientWidth||1,i=Math.round(gs.scrollLeft/w);if(i!==UI.wb.page){UI.wb.page=i;el.querySelectorAll(".wb-dots .btn").forEach((b,j)=>{b.classList.toggle("on",j===i);b.setAttribute("aria-pressed",String(j===i));});}},{passive:true});}}
 if(fk){const sel=[fk.a?`[data-a="${fk.a}"]`:"",fk.k?`[data-k="${fk.k}"]`:"",fk.p?`[data-p="${fk.p}"]`:"",fk.v?`[data-v="${fk.v}"]`:"",fk.i?`[data-i="${fk.i}"]`:"",fk.w?`[data-wb="${fk.w}"]`:""].join("");if(sel){const n=el.querySelector(sel);if(n&&!n.disabled&&n!==document.activeElement)try{n.focus({preventScroll:true});}catch(e){}}}}
const _wbRender=render;
render=function(){_wbRender();if(UI.tab==="works")wbPost();};
/* the map's Build bar and the board show the same basket */
function wbSync(){wbRefresh();if(UI.tab==="map"&&bmOn())drawMap();}

/* ---------- the tools: they only tick ---------- */
function wbPickList(c,ev,free){
 const L=[];for(const p of ev.provs)for(const k of Object.keys(BLD)){const x=ev.by[p.id][k];if(x.st==="can"&&x.net!=null&&x.net>0&&!wbHas(k,p.id))L.push({p,k,x});}
 L.sort((a,b)=>(a.x.yrs-b.x.yrs)||(a.x.cost-b.x.cost)||(a.p.n<b.p.n?-1:1));return L;}
function wbBulk(kind){
 const c=me(),ev=wbEval(),b=UI.wb;let msg="";
 const have=()=>bmPlan(),slots=buildSlots(c),free=Math.max(0,slots-bldActive(c));
 if(kind==="all"||kind==="raise"){
  const k=wbCurKey(),tg=clamp(b.tgt,1,Math.max(1,wbMax(c,k)));let n=0,skip=0;
  for(const p of ev.provs){const x=ev.by[p.id][k];if(x.st!=="can"){continue;}if(kind==="raise"&&x.lv>=tg){skip++;continue;}if(wbAdd(k,p.id))n++;}
  msg=kind==="all"?(n?"Ticked "+n+" "+bmNm(k).toLowerCase()+" order"+(n===1?"":"s")+" in every province that can build one.":"Every eligible province is already ticked."):
   (n?"Ticked "+n+" province"+(n===1?"":"s")+" below level "+tg+". Each order adds one level, so a province at level 0 needs a second order once the first is done.":"No province below level "+tg+" can take "+bmNm(k).toLowerCase()+" now.");}
 else if(kind==="best"||kind==="fill"){
  const L=wbPickList(c,ev),pl=have(),inBasket=pl.rows.filter(r=>r.state!=="skip"&&r.k!=="rail").length;let est=pl.est,n=0,cost=0;
  if(kind==="best"){const X=wbParseMoney(b.cap);
   if(!(X>0)){b.msg="Type an amount first, for example 20000 or 20k.";return wbSync();}
   const room=free+10-inBasket;
   for(const r of L){if(n>=room)break;if(est+r.x.cost>X+1e-6)continue;if(wbAdd(r.k,r.p.id,wbReason(r.p,r.k,r.x))){est+=r.x.cost;cost+=r.x.cost;n++;}}
   msg=n?"Ticked the "+n+" best-value project"+(n===1?"":"s")+" by payback, adding "+money(cost)+"; the basket is now estimated at "+money(est)+", within "+money(X)+".":"Nothing more fits within "+money(X)+" (the basket is estimated at "+money(est)+").";}
  else{let room=free-inBasket;
   for(const r of L){if(room<=0)break;if(wbAdd(r.k,r.p.id,wbReason(r.p,r.k,r.x))){room--;n++;cost+=r.x.cost;}}
   msg=n?"Ticked "+n+" project"+(n===1?"":"s")+" for the free slots, best payback first, adding "+money(cost)+".":free-inBasket<=0?"No free slots are left once the basket's projects start.":"No project with a money return can use a free slot.";}}
 b.msg=msg;wbSync();}

Object.assign(ACT,{
 wbopen:()=>{closeSheet();closeLens();hdrX(false);if(UI.tab==="works")render();else ACT.tab({t:"works"});},
 wbview:d=>{UI.wb.view=d.v;OPTS("wbv",d.v);wbRefresh();},
 wbmore:()=>{UI.wb.more=!UI.wb.more;OPTS("wbm",UI.wb.more?1:0);wbRefresh();},
 wbcur:d=>{UI.wb.cur=d.k;OPTS("wbc",d.k);UI.wb.msg="";wbRefresh();},
 wbsort:d=>{UI.wb.sort=d.v;OPTS("wbs",d.v);wbRefresh();},
 wbcan:()=>{UI.wb.can=!UI.wb.can;OPTS("wbf",UI.wb.can?1:0);wbRefresh();},
 wbgrp:d=>{UI.wb.grp=d.v;UI.wb.page=0;OPTS("wbg",d.v);wbRefresh();},
 wbpage:d=>{const gs=$("#wbboard .wb-gscroll");UI.wb.page=+d.i;if(gs)gs.scrollTo({left:+d.i*gs.clientWidth,behavior:"smooth"});},
 wbfold:d=>{const o=UI.wb.open,c=me(),cur=o[d.p]===undefined?(d.p===c.cap&&!Object.keys(o).length):o[d.p];o[d.p]=!cur;wbRefresh();},
 wbtick:d=>{wbToggle(d.k,d.p);UI.wb.msg="";wbSync();},
 wball:()=>wbBulk("all"),wbraise:()=>wbBulk("raise"),wbbest:()=>wbBulk("best"),wbfill:()=>wbBulk("fill"),
 wbclear:()=>{wbClear();wbSync();},
 wbreview:()=>bmReview(),
 wbstrip:()=>{const c=me(),slots=buildSlots(c),act=bldActive(c),q=(c.bq||[]).length,sp=wbSpend(c);
  openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Works status</h2><button class="x" data-a="close" aria-label="Close">×</button></div><div class="exl">${kr("Treasury",esc(moneyS(c.tr)),c.tr<0?"bad":"")}${kr("Construction this month, about",esc(money(sp)))}${kr("Building slots",act+" of "+slots+" used, "+Math.max(0,slots-act)+" free")}${kr("Waiting in the queue",String(q))}</div>${note("The spend is an estimate: the state buys materials as they are delivered at the market price, so the real bill follows the market. When every slot is busy, new orders wait in the queue and start in turn.")}<div class="dfoot2"><button class="btn pri" data-a="close">Close</button></div></div>`);},
 wbmap:d=>{ACT.tab({t:"map"});const p=P(d.p);if(!p)return;centerOn(p,260,.3);pickProv(d.p);}});
document.addEventListener("change",e=>{const f=e.target&&e.target.dataset&&e.target.dataset.wb;if(!f||UI.tab!=="works")return;const v=e.target.value,b=UI.wb;
 if(f==="cap"){b.cap=v;return;}
 if(f==="tgt"){b.tgt=+v;wbRefresh();return;}
 if(f==="sort"){b.sort=v;OPTS("wbs",v);}else if(f==="reg")b.reg=v;else if(f==="cur"){b.cur=v;OPTS("wbc",v);b.msg="";}
 wbRefresh();});
document.addEventListener("input",e=>{if(e.target&&e.target.dataset&&e.target.dataset.wb==="cap")UI.wb.cap=e.target.value;});

/* the Works entry on the bar: one tap from every tab */
{const _pick=ACT.pick;ACT.pick=(d,el)=>{_pick(d,el);wbClear();};}
if(typeof window!=="undefined"){
 Object.defineProperty(window,"G",{get:()=>G,set:v=>{G=v;},configurable:true});
 Object.defineProperty(window,"UI",{get:()=>UI,configurable:true});
 Object.assign(window,{
  WORLD,ADJ,SEAADJ,SEAR_OF,REG_OF,REGION,ACT,P,me,friendly,bmOn,
  provPts,provColor,seenSet,labelLayout,provLabelItems,bbOf,edgeDist,
  navSheet,pickProv,returnCampaignView,dateStr,advanceCampaign
 });
}
if(typeof _startLC==="function"){
 if(typeof document!=="undefined"&&document.readyState==="complete")_startLC();
 else if(typeof window!=="undefined")window.addEventListener("load",_startLC);
}
