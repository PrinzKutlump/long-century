"use strict";
/* ================= B2 and B4: buildings, factories, and the Works page ================= */
Object.assign(ICON,{works:'<path d="M4 21h16M7 21V8l8-4v4M7 8h10M15 8v7M13 15h4v3h-4z"/>',
 fort:'<path d="M4 20V9h3V6h2v3h2V6h2v3h2V6h2v3h3v11zM10 20v-5h4v5"/>',port:'<circle cx="12" cy="5" r="2"/><path d="M12 7v13M6 12H4a8 8 0 0 0 16 0h-2M8 10h8"/>',uni:'<path d="M3 10l9-5 9 5M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',hosp:'<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
 irr:'<path d="M3 17c3-3 6 3 9 0s6 3 9 0M12 13V6M12 9c-3 0-4-2-4-4 3 0 4 2 4 4zM12 10c3 0 4-2 4-4-3 0-4 2-4 4z"/>',minew:'<path d="M4 20l9-9M8 5c4-2 9-1 12 3M14 5l5 5"/>',
 depot:'<path d="M3 17h18M5 17V9h14v8M9 9V6h6v3M7 20h2M15 20h2"/>',barracks:'<path d="M3 19L12 5l9 14zM12 19v-6"/>',arsenal:'<path d="M8 21V10l4-6 4 6v11zM8 14h8"/>',dock:'<path d="M3 15h18l-3 5H6zM12 15V5l5 6M12 7L8 12"/>',coal:'<path d="M6 20l-2-6 5-6 4 3 3-5 4 8-3 6z"/>',
 telegraph:'<path d="M12 3v18M6 7h12M8 11h8M9 21h6"/>',customs:'<path d="M4 8h16v12H4zM4 8l3-4h10l3 4M10 13h4"/>',bank:'<path d="M3 9l9-5 9 5zM5 9v9M9 9v9M15 9v9M19 9v9M3 20h18"/>',exchange:'<path d="M4 20V4M4 16l5-5 4 3 7-8M16 6h4v4"/>',
 school:'<path d="M3 20h18M5 20V10l7-5 7 5v10M10 20v-5h4v5M12 3v2"/>',college:'<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/>',silo:'<path d="M6 21V8a6 6 0 0 1 12 0v13zM6 12h12M6 16h12"/>',water:'<path d="M12 3c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9zM9 14a3 3 0 0 0 3 3"/>',
 power:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',police:'<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM12 8v5"/>',court:'<path d="M12 4v16M6 20h12M4 8h16M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/>',worship:'<path d="M5 20V12a7 7 0 0 1 14 0v8M3 20h18M12 3v2M10 20v-4a2 2 0 0 1 4 0v4"/>',
 theatre:'<path d="M4 5h16v3a8 8 0 0 1-16 0zM9 10v.1M15 10v.1M9 14c1 1 5 1 6 0"/>',press:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5"/>'});
/* ---------- the Buildings section of a province sheet: an icon grid with level pips ---------- */
function bldTile(c,p,k){const B=BLD[k],lv=B.lv(p),can=bldCan(c,p,k),off=!can.ok&&lv===0;
 return`<button class="mbtn bt${off?" off":""}${lv?" has":""}" ${DA("bldask",{p:p.id,b:k})} aria-label="${esc(B.n)}, level ${lv} of ${B.max}">${ic(k)}<span>${esc(B.n)}</span><i class="pips">${Array.from({length:B.max},(_,i)=>`<b class="${i<lv?"on":""}"></b>`).join("")}</i></button>`;}
function bldHTML(p){const c=me(),rc=railCan(c,p);let h=lr({t:"Railway",s:"level "+p.rail+" of "+railMax(c)+". Faster marches, more output. Costs "+costTxt(RAIL_COST)+".",btn:["Build","bld",{p:p.id,b:"rail"},"",!rc.ok,esc(rc.why||"")]});
 const show=[],lock=[];for(const k in BLD){const B=BLD[k],lv=B.lv(p);if(B.ok&&!B.ok(p)&&!lv)continue;const can=bldCan(c,p,k);if(lv||can.ok)show.push(k);else if(can.why!=="Only in provinces we hold.")lock.push([k,can.why]);}
 for(const g in BGRP){const L=show.filter(k=>BLD[k].grp===g);if(L.length)h+=`<h3>${BGRP[g]}</h3><div class="btg">${L.map(k=>bldTile(c,p,k)).join("")}</div>`;}
 if(lock.length)h+=sx("Not yet possible",lock.map(([k,w])=>lr({lead:ic(k),t:esc(BLD[k].n),s:esc(w)})).join(""),false,lock.length+"");
 return h+note("Tap a building to see what it does, what it costs and what it is worth. The state buys the materials as they are delivered.")+(bldActive(c)>=buildSlots(c)?note("All "+buildSlots(c)+" building slots are busy; new orders wait in the queue on the Works page."):"");}
function bldAsk(p,k){const c=me(),B=BLD[k],can=bldCan(c,p,k),y=bldPay(c,p,k),lv=B.lv(p),full=can.ok&&bldActive(c)>=buildSlots(c),q=(c.bq||[]).some(x=>x.p===p.id&&x.b===k);
 askSheet({ti:esc(B.n)+" in "+esc(p.n),lab:full?(q?"Already queued":"Add to the queue"):lv?"Raise it":"Begin the work",off:!can.ok||q,why:can.ok?"":esc(can.why),body:esc(B.d),
  rows:[["Level now",lv+" of "+B.max],["Materials",costTxt(y.C),"bad"],["Worth in pounds",money(y.cost)],["Time","about "+B.m+" months"],["Upkeep",B.upk?money(B.upk)+" a month":"none"],["Estimated return",money(y.val)+" a month: "+y.why,"good"],["Pays for itself",y.net>0?(y.yrs<1?"within a year":"in about "+Math.round(y.yrs)+" years"):"not in money terms"]],
  note:(full?"All "+buildSlots(c)+" building slots are busy, so this goes to the waiting list. ":"")+"The state buys the materials on the market as they are delivered, usually over "+B.m+" months. The return is an estimate.",go:[full?"bq":"bld2",{p:p.id,b:k,...issueCampaignCommand()}]});}
const _bld0=ACT.bld;
Object.assign(ACT,{bld:d=>d.b==="rail"?_bld0(d):bldAsk(P(d.p),d.b),bldask:d=>bldAsk(P(d.p),d.b),
 bld2:d=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"building",province:d.p,building:d.b,month:d.month==null?G.t:+d.month,serial:d.serial==null?(G.commandSerial||0)+1:+d.serial});toast(r.txt||r.why);openSheet(provHTML(P(d.p)));render();},
 bq:d=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"queue",province:d.p,building:d.b,month:d.month==null?G.t:+d.month,serial:d.serial==null?(G.commandSerial||0)+1:+d.serial});toast(r.txt||r.why);openSheet(provHTML(P(d.p)));},
 bqmv:d=>editWorksQueue(d,"queueMove"),
 bqdel:d=>editWorksQueue(d,"queueRemove"),
 worksbuild:d=>{
  const c=me(),kind=d.k==="rail"?"rail":d.k==="factory"?"factory":
   bldActive(c)>=buildSlots(c)?"queue":"building";
  const r=applyCampaignCommand({kind,province:d.p,building:d.b,good:d.b,month:+d.month,serial:+d.serial});
  toast(r.txt||r.why||(r.ok?"Construction started.":"This project could not be started."));
  if(r.ok){UI._br=null;autosave();}
  render();
 },
 wfil:d=>{UI.wf=d.f;render();}});
/* ---------- B2: factories the player sees, and what may be done with them ---------- */
const facOwner=(c,f)=>f.own==="state"?"the state":f.fo&&G.c[f.fo]?(G.c[f.fo].adj||G.c[f.fo].n)+" capital":"private capital";
function facList(p,fl){const c=me(),mine=p.o===G.player,eb=ECON[c.econ].build,mx=Math.max(4,...fl.map(x=>x.lv));
 let h=fl.map(f=>{const i=p.factories.indexOf(f),pr=f._pr;return lr({t:GOODS[f.g].n+(f.own==="state"?' <span class="tag">state</span>':"")+(f.fo&&G.c[f.fo]?' <span class="tag">'+esc(G.c[f.fo].adj||G.c[f.fo].n)+" capital</span>":"")+(f.sub?' <span class="tag">subsidised</span>':""),
   s:(f._e!=null?"staffed "+pct(clamp(f._e,0,1)):"")+((f.m||0)?(f._e!=null?" · ":"")+esc(methOf(f.g).n[f.m-1]):""),bar:f.lv/mx,v:"level "+r2(f.lv),vs:pr!=null?(pr<0?"loses ":"profit ")+money(Math.abs(pr))+" a month":"",vc:pr!=null&&pr<0?"bad":"",a:mine?"facinfo":null,d:{p:p.id,i}});}).join("");
 if(mine&&p.ctl===p.o&&eb<=0){const q=p.build.filter(b=>b.k==="fac"&&!b.state);h+=note("Under "+ECON[c.econ].n.toLowerCase()+" private capital decides what to build. "+(q.length?"Capitalists are now building here: "+q.map(b=>GOODS[b.g].n.toLowerCase()+" works").join(", ")+". ":"")+"We can only encourage it: tap a factory to subsidise it.");}
 return h||note("No factories yet.");}
function facInfo(p,i){const c=me(),f=p.factories[i];if(!f)return"";const eb=ECON[c.econ].build,pr=f._pr,can=facCan(c,p,f.g),up=upgCan(c,p,f),st=f.own==="state",ours=!f.fo;
 const input=f._limitingInput;
 const constraint=input&&f._inputFill<(p._staff??1)
  ? GOODS[input].n+" supply · "+pct(f._inputFill)+" available. Check the market for a more reliable supply."
  : p._staff<.99?"Skilled labor · "+pct(p._staff)+" available. Check provincial literacy and schools."
  : "Inputs and staffing are sufficient.";
 const rows=[kr("Main constraint",esc(constraint)),kr("Utilization",f._e==null?"—":pct(clamp(f._e,0,1))),kr("Owner",esc(facOwner(c,f))),kr("Level",r2(f.lv)),kr("Method",(f.activeMethod??f.m)?esc(methOf(f.g).n[(f.activeMethod??f.m)-1]):"Conventional"),kr("Staffing",f._e!=null?pct(clamp(f._e,0,1)):"—",f._e!=null&&f._e<.6?"bad":""),kr("Output a month",f._out?Math.round(f._out)+" "+esc(GOODS[f.g].n.toLowerCase()):"—"),kr("Profit a month",pr!=null?moneyS(pr):"—",pr!=null&&pr<0?"bad":"good"),kr("Months losing money",f.loss||0,f.loss>3?"bad":"")].join("");
 const acts=[
  ...(ours&&p.o===c.tag&&p.ctl===c.tag&&f.m?[0,f.m].map(method=>lr({
   t:method?esc(methOf(f.g).n[method-1]):"Conventional",
   s:method?"Higher capacity, with output reduced when machine parts are scarce.":"Runs without replacement machine parts.",
   btn:["Use","facmethod",{p:p.id,i,method},"",(f.activeMethod??f.m)===method&&(!method||f.activeMethod!=null)]
  })):[]),
  ...(input&&f._inputFill<(p._staff??1)?[lr({t:"Review the input market",s:"Compare prices and supply before expanding.",btn:["Open Economy","tab",{t:"eco"},""]})]:p._staff<.99&&p.o===c.tag?[lr({t:"Review a school",s:"Education can expand the skilled workforce over time. Review materials and upkeep before ordering.",btn:["School costs","bldask",{p:p.id,b:"school"},"",!bldCan(c,p,"school").ok]})]:[]),
  lr({t:"Expand by one level",s:"Costs "+costTxt(Object.fromEntries(Object.keys(BUILD_COST).map(x=>[x,BUILD_COST[x]*facPrem(c)])))+"; about "+money(BUILDC())+(facPrem(c)>1?" (50% premium under "+ECON[c.econ].n.toLowerCase()+")":"")+".",btn:["Expand","facexpask",{p:p.id,i},"pri",!can.ok||!ours,esc(ours?can.why:"Foreign capital owns this mill.")]}),
  lr({t:"Modernize",s:"New methods raise output per worker.",btn:["Modernize","upgask",{p:p.id,i},"",!up.ok||!ours,esc(up.why||"")]}),
  lr({t:f.sub?"Stop the subsidy":"Subsidise it",s:f.sub?"The treasury now covers its losses, so it never closes.":"The treasury covers its losses, so it cannot close. Under laissez-faire this is our only way to help.",btn:[f.sub?"Stop":"Subsidise","facsub",{p:p.id,i},"",st,st?"A state mill is always paid for by the state.":""]}),
  lr({t:"Close a level",s:"The workers are let go. Only the state's own mills may be closed.",btn:["Close","facclosask",{p:p.id,i},"dng",!(st&&eb>=1),st?"Only under state capitalism or a planned economy.":"Only the owners may close a private mill."]})].join("");
 return`<div class="ph"><div class="phm"><h2>${GOODS[f.g].n} works in ${esc(p.n)}</h2><div class="small muted">${esc(facOwner(c,f))}</div></div><button class="x" data-a="close" aria-label="Close">×</button></div>${rows}<h3>What we can do</h3>${acts}<div class="sfoot"><button class="btn" data-a="provsheet" data-p="${p.id}">Back to ${esc(p.n)}</button><button class="btn" data-a="close">Close</button></div>`;}
function facSheet(p){const c=me(),eb=ECON[c.econ].build,L=Object.keys(RECIPE).filter(g=>goodOK(c,g)).map(g=>[g,facMargin(c,g),facCan(c,p,g)]).sort((a,b)=>(b[2].ok-a[2].ok)||(b[1]-a[1]));
 return`<div class="ph"><div class="phm"><h2>A factory in ${esc(p.n)}</h2><div class="small muted">${eb>0?"The state pays for timber, cement and machine parts as they are delivered: about "+money(BUILDC())+" in all.":"Under "+esc(ECON[c.econ].n.toLowerCase())+" private capital normally builds. The state may still order one, at a 50% premium: about "+money(BUILDC())+" in all."}</div></div><button class="x" data-a="close" aria-label="Close">×</button></div>${L.map(([g,m,can])=>lr({t:GOODS[g].n,s:"needs "+Object.keys(RECIPE[g].i).map(x=>GOODS[x].n.toLowerCase()).join(", "),v:pct(m),vs:"margin",vc:m<.1?"bad":m>.4?"good":"",bar:clamp(m,0,1),btn:["Build","facbuildask",{p:p.id,g},"pri",!can.ok,esc(can.why||"")]})).join("")}<div class="sfoot"><button class="btn" data-a="close">Close</button></div>`;}
function facAsk(p,g,exp){const c=me();askSheet({ti:(exp?"Expand the ":"Build a ")+GOODS[g].n.toLowerCase()+(exp?" works":" factory")+" in "+esc(p.n)+"?",lab:exp?"Expand":"Begin the work",body:"The state pays for the materials as they are delivered, over about ten months. A mill needs literate craftsmen and its inputs to earn."+(facPrem(c)>1?" Under "+ECON[c.econ].n.toLowerCase()+" the state is not meant to build, so the order costs 50% more.":""),rows:[["Materials",costTxt(Object.fromEntries(Object.keys(BUILD_COST).map(x=>[x,BUILD_COST[x]*facPrem(c)]))),"bad"],["Worth in pounds",money(BUILDC())],["Margin now",pct(facMargin(c,g)),facMargin(c,g)<.1?"bad":"good"]],go:["build",{p:p.id,g}]});}
Object.assign(ACT,{
 facmenu:d=>openSheet(facSheet(P(d.p))),
 facbuildask:d=>facAsk(P(d.p),d.g,0),
 build:d=>{const c=me(),p=P(d.p),r=facCan(c,p,d.g);if(!r.ok){toast(r.why);return;}const order=applyCampaignCommand({...issueCampaignCommand(),kind:"factory",province:p.id,good:d.g});if(!order.ok){toast(order.why);return;}toast("Work begins on a "+GOODS[d.g].n.toLowerCase()+" factory in "+p.n+".");openSheet(provHTML(p));},
 facinfo:d=>openSheet(facInfo(P(d.p),+d.i)),
 provsheet:d=>openSheet(provHTML(P(d.p))),
 facexpask:d=>{const p=P(d.p),f=p.factories[+d.i];if(f)facAsk(p,f.g,1);},
 facsub:d=>{const p=P(d.p),f=p.factories[+d.i];if(!f)return;f.sub=!f.sub;toast(f.sub?"The "+GOODS[f.g].n.toLowerCase()+" works is now subsidised.":"The subsidy is withdrawn.");openSheet(facInfo(p,+d.i));},
 facclosask:d=>{const p=P(d.p),f=p.factories[+d.i];if(!f)return;askSheet({ti:"Close a level of the "+GOODS[f.g].n.toLowerCase()+" works?",danger:1,lab:"Close it",body:"One level of the works shuts and its workers are laid off. Closing it cannot be undone; building it again takes months.",rows:[["Now","level "+r2(f.lv)],["After","level "+r2(Math.max(0,f.lv-1))],["Workers laid off","about "+Math.round(FAC_WORK*1000)+"",  "bad"]],go:["facclos",{p:p.id,i:d.i}]});},
 facclos:d=>{const p=P(d.p),f=p.factories[+d.i];if(!f)return;f.lv=Math.max(0,f.lv-1);toast("A level of the "+GOODS[f.g].n.toLowerCase()+" works is closed.");openSheet(provHTML(p));render();}});
/* ---------- B4: the national Works page ---------- */
const WFIL=[["all","All"],["mil","Military"],["eco","Economy"],["soc","People"],["cul","Culture"],["gw","Great works"]];
function gwRow(c,w){const s=gwState(c,w),g=c.gw&&c.gw[w.id],why=s==="cond"?(w.why?w.why(c):"We do not meet the conditions."):s==="date"?"Not before "+w.y+".":"";
 return lr({t:esc(w.n)+(w.uniq?' <span class="tag">first</span>':w.first?' <span class="tag">first bonus</span>':""),s:esc(w.d),bar:g?1-g.left/w.m:null,v:s==="done"?"built":g?g.left+" months left":money(w.cost),vs:s==="done"||g?(s==="done"&&G.gwDone[w.id]?esc(nameOf(G.gwDone[w.id][0])):""):"over "+w.m+" months",vc:s==="done"?"good":"",btn:s==="done"||g?null:["Begin","gwask",{id:w.id},s==="ok"?"pri":"",s!=="ok",esc(why)]});}
function quickSites(c,k){
 const ev=wbEval();
 if(k.startsWith("factory/")){
  const g=k.slice(8);
  return ECON[c.econ].build>0?ev.provs.filter(p=>heldBy(c,p)&&facCan(c,p,g).ok):[];
 }
 return ev.provs.filter(p=>ev.by[p.id][k]?.st==="can");
}
function quickName(k){return k.startsWith("factory/")?GOODS[k.slice(8)].n+" factory":bmNm(k);}
ACT.quickworks=d=>{
 const p=$("#quick-site").value,k=d.k,c=me();
 if(!p)return;
 UI.quickSite=p;
 const sites=d.all?quickSites(c,k):[P(p)];
 let placed=0,why="";
 for(const site of sites){
  const kind=k.startsWith("factory/")?"factory":k==="rail"?"rail":bldActive(c)>=buildSlots(c)?"queue":"building";
  const r=applyCampaignCommand({...issueCampaignCommand(),kind,province:site.id,building:k,good:k.slice(8)});
  if(r.ok)placed++;else why=r.why||r.txt;
 }
 if(placed){UI._br=null;autosave();}
 render();toast(placed+" of "+sites.length+" orders placed."+(why?" "+why:""));
};
document.addEventListener("change",event=>{
 if(event.target.dataset.works==="quick"){UI.quickKind=event.target.value;render();}
});
function projectShortage(country, project){
 const shortages=Object.keys(project.left||{}).filter(g=>project.left[g]>1&&(country.fill[g]??1)<.9);
 if(shortages.length&&projProgress(project)>=.995)return " · local workshops finish the last fittings at double the missing materials’ price";
 if(shortages.length)return " · short of "+shortages.map(g=>GOODS[g].n.toLowerCase()).join(", ");
 return "";
}
function editWorksQueue(d,kind){
 const result=applyCampaignCommand({kind,id:d.id,direction:+d.d,month:+d.month,serial:+d.serial});
 toast(result.txt||result.why);
 if(result.ok)autosave();
 render();
}
document.addEventListener("change",event=>{
 const field=event.target.dataset.works;
 if(UI.tab!=="works"||!["province","category"].includes(field))return;
 if(field==="province")UI.worksProvince=event.target.value;
 else UI.worksCategory=event.target.value;
 render();
});
function worksPlanner(c){
 const provinces=provsOf(c.tag).filter(p=>p.ctl===c.tag&&!p.waste);
 if(!provinces.length)return note("No controlled provinces are available for construction.");
 const p=provinces.find(p=>p.id===UI.worksProvince)||provinces.find(p=>p.id===c.cap)||provinces[0];
 const categories=[["all","All buildings"],...Object.entries(BGRP),["factory","Factories"]];
 const category=UI.worksCategory||"all",full=bldActive(c)>=buildSlots(c);
 const option=(value,label,selected)=>`<option value="${esc(value)}"${value===selected?" selected":""}>${esc(label)}</option>`;
 const row=(name,b,k,cost,eligibility,description,label)=>{
  const button=eligibility.ok?[label,"worksbuild",{p:p.id,b,k,...issueCampaignCommand()},"pri"]:null;
  return lr({t:esc(name),s:esc(eligibility.ok?description:eligibility.why),v:money(cost),vs:"est. materials",btn:button});
 };
 let rows="";
 if(category==="factory"){
  rows=Object.keys(RECIPE).filter(g=>goodOK(c,g)).map(g=>{
   const can=ECON[c.econ].build>0?facCan(c,p,g):{ok:false,why:"Your economic policy leaves factory construction to private investors."};
   return row(GOODS[g].n,g,"factory",bldMoney(BUILD_COST)*facPrem(c),can,"New factory","Build");
  }).join("");
 }else{
  if(category==="all")rows=row("Railway","rail","rail",bldMoney(RAIL_COST),railCan(c,p),"Level "+p.rail+" of "+railMax(c),"Build");
  for(const [k,b] of Object.entries(BLD)){
   if(category!=="all"&&category!==b.grp)continue;
   if(!b.lv(p)&&b.ok&&!b.ok(p))continue;
   const queued=(c.bq||[]).some(order=>order.p===p.id&&order.b===k);
   const can=queued?{ok:false,why:"Already waiting in the queue."}:bldCan(c,p,k);
   rows+=row(b.n,k,"building",bldMoney(bldCost(p,k)),can,"Level "+b.lv(p)+" of "+b.max,full?"Queue":"Build");
  }
 }
 return `<div class="works-pickers"><label>Province<select data-works="province">${provinces.map(v=>option(v.id,v.n,p.id)).join("")}</select></label><label>Project type<select data-works="category">${categories.map(([key,label])=>option(key,label,category)).join("")}</select></label></div>`
  +note("Tap Build to start. Provincial buildings can join the queue when their slots are full. Materials are paid for as delivered.")
  +(rows||note("No projects in this category are available yet."));
}
/* every order the player has issued (building, queued or done), newest first: the one place to find a batch again after a reload */
function worksOrders(c){
 const rows=new Map(),nm=(kind,good)=>BLD[kind]?BLD[kind].n:kind==="rail"?"Railway":good&&GOODS[good]?GOODS[good].n+" works":"Project",ik=kind=>BLD[kind]||kind==="rail"?kind:"works",q=c.bq||[];
 q.forEach((x,i)=>{if(x.orderId!=null)rows.set(x.orderId,{o:x.orderId,k:x.b,t:nm(x.b),p:x.p,st:"queued",s:"Waiting list, place "+(i+1)+" of "+q.length,v:"Queued"});});
 for(const p of provsOf(c.tag))for(const b of p.build)if(b.orderId!=null&&b.k!=="upg"&&!rows.has(b.orderId))rows.set(b.orderId,{o:b.orderId,k:b.b||b.k,t:nm(b.b||b.k,b.g),p:p.id,st:"building",s:"Building"+(b.lastProgress?.delayed?", short of funds":""),bar:projProgress(b),v:buildPercent(projProgress(b))});
 for(const a of Object.values(G.constructionLedger||{}))if(a.orderId!=null&&!rows.has(a.orderId)&&a.owner===c.tag&&P(a.province)){const done=a.status==="Completed";rows.set(a.orderId,{o:a.orderId,k:a.kind,t:nm(a.kind,a.good),p:a.province,st:done?"done":/Cancel/.test(a.status)?"ended":"building",s:done?"Done":a.status,v:done?"Done":"",bar:done?1:null});}
 const L=[...rows.values()].sort((a,b)=>b.o-a.o).slice(0,40);
 return L.length?L.map(r=>lr({lead:ic(ik(r.k)),t:esc(r.t)+" in "+esc(P(r.p).n),s:esc(r.s),bar:r.bar,v:r.v,cls:"ord ord-"+r.st})).join("")+note("Every order from the map and the planner, newest first. Work that has started cannot be cancelled."):note("No orders yet. Choose Build on the Atlas, pick a project and tap provinces.");}
function pgWorks(){const c=me(),tag=c.tag,slots=buildSlots(c),act=bldActive(c),F=UI.wf||"all",yr=yearOf(G.t),bx=c._bx||{up:0};
 const projs=[];for(const p of provsOf(tag))for(const b of p.build)projs.push([p,b]);
 let lv=0;const held={};for(const p of provsOf(tag))for(const k in BLD){const l=BLD[k].lv(p);if(l){lv+=l;held[k]=(held[k]||0)+l;}}
 const gws=GW.filter(w=>{const s=gwState(c,w);return s==="done"?false:w.fair?w.y<=Math.floor(yr/10)*10:s!=="date"||w.y<=yr+15;});
 const doneN=GW.filter(w=>G.gwDone&&G.gwDone[w.id]&&G.gwDone[w.id].includes(tag)).length;
 const chips=`<div class="seg" role="group" aria-label="Filter by type">${WFIL.map(([k,l])=>`<button class="btn sm ${F===k?"on":""}" data-a="wfil" data-f="${k}">${l}</button>`).join("")}</div>`;
 const best=F==="gw"?[]:bldBestAll(c).filter(b=>F==="all"||BLD[b.k].grp===F).slice(0,F==="all"?8:10);
 const top=best[0];
 const s0=`<div class="kgrid">${tl("Building slots",act+" of "+slots,"projects at once")}${tl("Upkeep",money(bx.up||0),"a month")}${tl("Buildings",lv+"","levels in our provinces")}${tl("Great works",doneN+"","built by us")}</div>${gz("Slots in use",act,slots,act+" of "+slots,{c:act>=slots?"red":"green"})}`;
 const q=c.bq||[];
 const s1=(projs.length?projs.map(([p,b])=>lr({t:projName(b),s:"in "+esc(p.n)+(b.paid==null?"":" · "+money(b.paid)+" paid")+(b.lastProgress?.delayed?" · Short of funds":"")+projectShortage(c,b),bar:projProgress(b),v:buildPercent(projProgress(b))})).join(""):`<p class="calm">Nothing is being built.</p>`)
  +(Object.keys(c.gw||{}).length?Object.keys(c.gw).map(id=>{const w=GW.find(x=>x.id===id),g=c.gw[id];return lr({lead:ic("works"),t:esc(w.n),s:"a great work",bar:1-g.left/w.m,v:g.left+" months"});}).join(""):"")
  +`<h3>Waiting list ${INFO("Waiting list","When every building slot is busy, new orders wait here. The first on the list starts as soon as a slot is free. Use the arrows to change the order.")}</h3>`
  +(q.length?q.map((x,i)=>{const B=BLD[x.b],p=P(x.p);return lr({lead:ic(x.b),t:esc(B.n),s:"in "+esc(p.n)+" · place "+(i+1),mid:`<span class="qbtns"><button class="btn sm" ${DA("bqmv",{id:x.id,d:-1,...issueCampaignCommand()})}${i?"":" disabled"} aria-label="Move up">Up</button><button class="btn sm" ${DA("bqmv",{id:x.id,d:1,...issueCampaignCommand()})}${i<q.length-1?"":" disabled"} aria-label="Move down">Down</button><button class="btn sm dng" ${DA("bqdel",{id:x.id,...issueCampaignCommand()})}>Remove</button></span>`});}).join(""):note("The waiting list is empty. When the slots are full, tap Queue in the construction planner and it joins the list."));
 const accounts=Object.values(G.constructionLedger||{}).filter(a=>a.owner===tag||a.payments.some(p=>p.payer===tag)).reverse();
 const funding=accounts.length?accounts.map(a=>lr({
  t:esc(BLD[a.kind]?.n||(a.good?GOODS[a.good].n+" works":"Railway")),
  s:esc(P(a.province).n)+" · "+esc(a.status),
  v:money(a.paid),vs:"paid",a:"fundingdetail",d:{id:a.id}
 })).join(""):note("Payment records appear after the next construction turn.");
 const sug=best.length?(top&&F!=="gw"?cta("Build "+esc(BLD[top.k].n.toLowerCase())+" in "+esc(top.p.n),"bldask",{p:top.p.id,b:top.k}):"")+best.map(b=>{const B=BLD[b.k],y=b.y;return lr({lead:ic(b.k),t:esc(B.n)+" in "+esc(b.p.n),s:esc(y.why)+" · "+costTxt(y.C),v:money(y.net),vs:"a month · "+(y.yrs<1?"under a year":"back in "+Math.round(y.yrs)+" yrs"),vc:"good",btn:["Build","bldask",{p:b.p.id,b:b.k},"pri"]});}).join("")+note("The estimate is what the building should add or save each month, less its upkeep. The AI ranks its own building by the same figure."):(F==="gw"?note("Great works are listed below."):note("Nothing worth building in this group right now."));
 const gwh=(F==="all"||F==="gw")?gws.map(w=>gwRow(c,w)).join("")+(G.gwDone?note("Built in the world: "+Object.keys(G.gwDone).map(id=>{const w=GW.find(x=>x.id===id);return w?esc(w.n)+(w.uniq?" ("+esc(nameOf(G.gwDone[id][0]))+")":""):"";}).filter(x=>x).join("; ")+"."):""):"";
 const cat=Object.keys(BLD).filter(k=>F==="all"||F==="gw"||BLD[k].grp===F).map(k=>{const B=BLD[k];return lr({lead:ic(k),t:esc(B.n),s:esc(B.d),v:held[k]?held[k]+" levels":"none",vs:B.upk?"upkeep "+money(B.upk):"",vc:held[k]?"good":""});}).join("");
 return pageHTML("works","works","Works","Buildings, great works and what to build next",[
  ["Plan","Build in a province",worksPlanner(c)],["Summary","Summary",s0],["Now","Under way",s1,{sum:act+" of "+slots}],["Orders","Your orders",worksOrders(c),{sum:(c.bq||[]).length+" waiting"}],["Funding","Funding ledger",funding,{closed:1}],
  F==="gw"?null:["Best","Where to build next",chips+sug,{closed:1}],F==="gw"?["Filter","Filter",chips]:null,
  gwh?["Great works","Great works",gwh,{info:["Great works","Paid for month by month from the treasury. Works marked first are unique: whoever finishes first wins them."]}]:null,
  ["All","All kinds of building",cat,{closed:1}]]);}
/* V2c: on the Works tab the board comes first: a one-line title, no hero, no jump chips, and the tip folded to the foot */
PAGES.works=()=>{let h=pgWorks();const co=(/<aside class="coach"[\s\S]*?<\/aside>/.exec(h)||[""])[0];
 h=h.replace(/<header class="headpiece">[\s\S]*?<\/header>/,"").replace(/<aside class="coach"[\s\S]*?<\/aside>/,"").replace(/<nav class="jumpbar"[\s\S]*?<\/nav>/,"");
 return `<h1 class="wb-ttl">Works board</h1>`+wbHTML(me())+h+co;};
function quickWorksHTML(c){
 const k=UI.quickKind||wbCurKey();
 const eligible=quickSites(c,k);
 const keys=[...wbAllKeys(),...Object.keys(RECIPE).filter(g=>goodOK(c,g)).map(g=>"factory/"+g)];
 const choices=keys.map(key=>`<option value="${key}"${key===k?" selected":""}>${esc(quickName(key))}</option>`).join("");
 const sites=eligible.map(p=>`<option value="${esc(p.id)}"${p.id===UI.quickSite?" selected":""}>${esc(p.n)}</option>`).join("");
 const site=eligible.find(p=>p.id===UI.quickSite)||eligible[0];
 const action=k.startsWith("factory/")||k==="rail"||bldActive(c)<buildSlots(c)?"Build":"Queue";
 const quick=`<div class="works-pickers"><label>Project<select data-works="quick">${choices}</select></label>
 <label>Province<select id="quick-site">${sites||"<option>No eligible province</option>"}</select></label>
 <button class="btn pri" data-a="quickworks" data-k="${k}" ${site?"":"disabled"}>${action} ${esc(quickName(k))}</button>
 ${eligible.length>1?`<button class="btn" data-a="quickworks" data-all="1" data-k="${k}">Order in all ${eligible.length} eligible provinces</button>`:""}</div>`;
 return `<section aria-label="Quick orders"><h3>Quick orders</h3>${quick}${nationalOrders()}</section>`;
}

COACH.works=["Works","Every project in one place. The best places to build are ranked by what they should earn or save; tap Build to see the cost and the return before you commit."];

/* ================= THEATRES (W1-W4, W6): the Military page and the theatre sheet ================= */
const thName=r=>r==="res"?"The reserve":REGION[r].n;
function thUX(){const k=G.t+"|"+G.player;if(UI._thx&&UI._thx.k===k&&UI._thx.g===G)return UI._thx.X;const X=thCtx(me());UI._thx={k,g:G,X};return X;}
function thRows(c){thSync();const tag=c.tag,war=thFoes(tag).size>0,L=[];for(const r of thList(tag)){const b=thBrig(tag,r);if(b.n>0||(war&&thFronts(tag,r).length))L.push(r);}
 L.sort((x,y)=>(thFronts(tag,y).length>0)-(thFronts(tag,x).length>0)||thBrig(tag,y).n-thBrig(tag,x).n);if(thBrig(tag,"res").n>0)L.push("res");return L;}
/* theatres at war that have a front and that nobody has given orders to yet */
function thNeeds(c){const L=[];if(!thFoes(c.tag).size)return L;for(const r of thRows(c)){if(r==="res")continue;const T=thGet(c.tag,r,1);if(!T.set&&thFronts(c.tag,r).length&&thBrig(c.tag,r).n>0)L.push(r);}return L;}
const thPills=b=>`<span class="pills"><span title="infantry">Inf ${b.inf}</span><span title="cavalry">Cav ${b.cav}</span><span title="artillery">Art ${b.art}</span></span>`;
const INT_TXT=["Cautious: attacks go in only at 1.8 to 1 or better; we deal 10% less damage and take 18% fewer losses.","Normal: attacks go in at 1.25 to 1 or better; damage and losses as usual.","All-out: attacks go in even when outnumbered 1.6 to 1; we deal 10% more damage and take 18% more losses."];
const PRI_TXT=["Low: supply 8 points below the national level; hurt brigades recover at 60% of the usual rate.","Normal: supply as the nation can provide; usual recovery.","High: supply 8 points above the national level; hurt brigades recover at 150% of the usual rate."];
const thN0=x=>String(Math.round(x));
function thSupply(c,r){const gk=["arms","ammo","canned"].filter(g=>goodOK(c,g)),s0=c.fill&&gk.length?Math.min(1,...gk.map(g=>c.fill[g]==null?1:c.fill[g])):.7;let n=0,cut=0,org=0,dg=0,sv=0;const at={};
 for(const a of G.armies)if(a.o===c.tag&&!a.naval&&!a.reb&&a.th===r){const k=a.u.length;n+=k;at[a.loc]=(at[a.loc]||0)+k;dg+=(a.dig||0)*k;for(const u of a.u)org+=u.org;const sl=supplyLine(a);let s=1-(1-s0)*Math.min(1,(sl.hops||0)/4);if(!sl.ok){s=Math.min(s,.3);cut+=k;}if(a.pri!=null&&a.pri!==1)s=clamp(s+(a.pri-1)*.08,0,1);sv+=s*k;}
 let over=0;for(const l in at)over+=Math.max(0,at[l]-supLim(P(l)));return{v:n?clamp(sv/n*(1-.6*over/n),0,1):1,cut,over,n,org:n?org/n:0,dig:n?dg/n:0};}
const thTypes=o=>[["infantry",o.inf],["cavalry",o.cav],["artillery",o.art]].filter(x=>x[1]>.04).map(x=>thN1(x[1])+" "+x[0]).join(", ")||"none";
function thFrTxt(F){const out=[];if(F.b)out.push(F.b+" battle"+(F.b>1?"s":"")+", "+F.w+" won");if(F.taken.length)out.push("took "+F.taken.slice(0,3).join(", "));if(F.lostP.length)out.push("lost "+F.lostP.slice(0,3).join(", "));
 const lo=F.lost.inf+F.lost.cav+F.lost.art,kl=F.kill.inf+F.kill.cav+F.kill.art;if(F.b||lo>.04)out.push("our losses "+thN1(lo)+" brigades ("+thTypes(F.lost)+"), theirs "+thN1(kl));
 let s=out.join("; ");s=s?s.charAt(0).toUpperCase()+s.slice(1)+".":"";if(F.why)s+=" Why: "+F.why+".";return s;}
function thResult(tag,r,E){const R=G.thr&&G.thr[tag]&&G.thr[tag][r];if(!R||R.t<G.t-6)return null;const F=E==null?null:R.fr[E];return{R,F,when:R.t===G.t-1?"Last month":"In "+dateStr(R.t)};}
function thLastMonth(tag,r,fr){const T=thGet(tag,r),res=thResult(tag,r,null);let h="";const shown=new Set();
 for(const f of fr.slice(0,3)){const rr=thResult(tag,r,f.r),F=rr&&rr.F;shown.add(f.r);h+=`<div class="thf"><b>${esc(tNm(REGION[f.r].n))}</b>${thFrNums(tag,r,f.r)}<small>${F&&(F.b||F.taken.length||F.lostP.length)?esc(rr.when+": "+thFrTxt(F)):esc(thQuiet(tag,r,T))}</small></div>`;}
 if(res&&res.R)for(const E in res.R.fr){if(shown.has(E))continue;const F=res.R.fr[E];if(!(F.b||F.taken.length||F.lostP.length))continue;h+=`<div class="thf"><b>${esc(tNm(REGION[E]?REGION[E].n:E))}</b><small>${esc(res.when+": "+thFrTxt(F))}</small></div>`;}
 return h||`<p class="small muted">No front: no enemy ground touches this theatre.</p>`;}
function thQuiet(tag,r,T){if(T.st==="attack"&&T.skip===G.t-1)return"Last month: no attack went in. They field "+T.skr.toFixed(1)+" to our 1 near the front, more than "+INT_N[T.it==null?1:T.it]+" intensity allows (it needs about "+["1.8 to 1 in our favour","1.25 to 1 in our favour","1 to 1.6 against us"][T.it==null?1:T.it]+").";
 return T.st==="dig"||T.st==="hold"?"Last month: no fighting; the men held the line.":T.st==="fall"?"Last month: no fighting; the men fell back toward the hub.":"Last month: no fighting on this front.";}
/* our brigades against the enemy's estimate: what we can see of them is blurred by the fog */
function thFrNums(tag,r,E){const X=thUX(),F=thMine(X,r),Q=thTheirs(X,E),fog=thFog(F),est=Q.b*(1+(hash01(tag+r+E+G.t)*2-1)*fog),lo=Math.max(0,Math.round(est*(1-fog))),hi=Math.round(est*(1+fog)),n=F.k.inf+F.k.cav+F.k.art;
 return`<span class="thr" title="Our brigades in this theatre against the enemy's estimated brigades in ${esc(REGION[E].n)}">${n} : ${Q.b>.05?"about "+Math.round(est)+" ("+lo+" to "+hi+")":"none seen"}</span>`;}
function thMinister(tag,r,T){const X=thUX(),A=thAdvice(X,r);if(!A)return`<p class="small muted">The minister has nothing to add: no enemy is in reach.</p>`;
 const b=A.rows.reduce((q,x)=>!q||x.ev>q.ev?x:q,null),cur=T.st;
 const rows=A.rows.map(x=>`<li${x===b?' class="best"':""}>${esc(x.txt)}.</li>`).join("");
 return`<div class="thm"><b>The minister advises</b><p class="small">${b.st===cur&&(b.st!=="attack"||b.ob===T.ob)?"Keep the present orders: ":"Best course: "}${esc(b.txt)}.</p><ul>${rows}</ul><small class="muted">Enemy numbers are estimates, within ${Math.round(A.fog*100)}%. Odds count the ground, trenches, guns, scouts and generals on each side.</small>${b.st===cur&&(b.st!=="attack"||b.ob===T.ob)?"":`<div class="thacts"><button class="btn sm pri" data-a="thadv" data-r="${r}" data-s="${b.st}" data-o="${b.ob||""}">Follow this advice</button></div>`}</div>`;}
function thGenOpts(c,r){const T=thGet(c.tag,r,1),seen=new Set(),L=[];const add=(g,where)=>{if(!g||!g.id||seen.has(g.id))return;seen.add(g.id);L.push([g,where]);};
 for(const a of G.armies)if(a.o===c.tag&&!a.naval&&!a.reb&&a.gen){const rr=a.th,fx=rr!==r&&G.th&&G.th[c.tag]&&G.th[c.tag][rr]&&G.th[c.tag][rr].gen===a.gen.id;if(!fx)add(a.gen,rr===r?"here":rr==="res"?"reserve":REGION[rr]?REGION[rr].n:"");}
 for(const g of c.leaders||[])add(g,"free");return L;}
function thCard(c,r,sh){const tag=c.tag,b=thBrig(tag,r),X=thUX();
 if(r==="res"){const dopt=[["","Where they are raised (the capital)"],["res","The reserve"]].concat(thList(tag).filter(x=>thHub(tag,x)).map(x=>[x,REGION[x].n]));
  return`<div class="thc"><div class="thh"><b>The reserve</b>${thPills(b)}</div><small class="muted">Brigades held back at the capital with no orders. ${b.mv?b.mv+" on the way. ":""}Send them to a theatre when it needs them.</small><div class="thacts"><button class="btn sm" data-a="thmove" data-r="res">Move brigades</button></div></div>`;}
 if(b.n===0){const R0=REGION[r],fr0=thFronts(tag,r),E1=fr0.length?fr0[0].r:null,Q1=E1?thTheirs(X,E1):null;return`<div class="thc empty" id="th-${r}">${sh?"":`<div class="thh"><b>${esc(R0.n)}</b>${fr0.length?`<span class="tag bad">No brigades</span>`:""}</div>`}<small class="muted">No brigades here. ${Q1&&Q1.b>.05?"The enemy has about "+Math.round(Q1.b)+" in "+esc(tNm(REGION[E1].n))+", as we estimate it.":"Nothing of ours is in this region."}</small><div class="thacts"><button class="btn sm" data-a="thfrom" data-r="${r}">Send brigades here</button></div></div>`;}
 const T=thGet(tag,r,1),R=REGION[r],fr=thFronts(tag,r),hub=thHub(tag,r),st=T.st||"hold",it=T.it==null?1:T.it,pr=T.pr==null?1:T.pr,war=X.enemies.size>0,needs=war&&fr.length&&!T.set,F=thMine(X,r),S=thSupply(c,r),ga=G.armies.find(a=>a.o===tag&&a.th===r&&a.gen&&!a.naval);
 const E0=fr.length?fr[0].r:null,Q=E0?thTheirs(X,E0):null,fog=thFog(F),nzk=k=>1+(hash01(tag+r+E0+k+G.t)*2-1)*fog;
 const srow=(lab,k,tr)=>{const ours=F.k[k],th=Q?tr*nzk(k):0;return gz(lab,ours,Math.max(ours,th,1),ours+(Q?" : about "+Math.round(th):""),{c:Q&&th>ours*1.25?"red":""});};
 const chips=STANCES.map(s=>`<button class="btn sm ${st===s[0]?"on":""}" data-a="thst" data-r="${r}" data-s="${s[0]}" title="${esc(s[2])}" aria-pressed="${st===s[0]}">${s[1]}</button>`).join("");
 const useOb=st==="attack"||st==="probe"||st==="fall",objs=useOb?thObjs(tag,r,st):[];if(useOb&&T.ob&&!objs.some(x=>x[0]===T.ob))objs.push([T.ob,REGION[T.ob]?REGION[T.ob].n:P(T.ob).n]);
 const ev=useOb&&st!=="fall"&&war?thEval(X,r):null,od=o=>{const a=ev&&ev.att.find(x=>x.ob===o);return a?", odds "+Math.round(a.odds*100)+"%":"";};
 const obH=useOb?`<select data-sel="thob" data-r="${r}" aria-label="Objective"><option value="">${st==="fall"?"Our hub"+(hub?" ("+esc(P(hub).n)+")":""):"Nearest enemy ground (automatic)"}</option>${objs.map(([v,t])=>`<option value="${v}"${T.ob===v?" selected":""}>${esc(t+od(v))}</option>`).join("")}</select>`:`<select disabled aria-label="Objective"><option>No objective for this stance</option></select>`;
 const sel=(k,N,v,lab)=>`<select data-sel="${k}" data-r="${r}" aria-label="${lab}">${N.map((n,i)=>`<option value="${i}"${v===i?" selected":""}>${n}</option>`).join("")}</select>`;
 const go=thGenOpts(c,r),gH=`<select data-sel="thgen" data-r="${r}" aria-label="General"><option value="">${ga?"Automatic: "+esc(ga.gen.n):"Automatic (best available)"}</option>${go.map(([g,w])=>`<option value="${g.id}"${T.gen===g.id?" selected":""}>${esc(g.n)}: attack ${g.atk}, defence ${g.def}, marching ${g.mv}${w?" ("+esc(w)+")":""}</option>`).join("")}</select>`;
 const fight=(G.bt||[]).some(x=>REG_OF[x.p]===r&&(x.a.concat(x.d)).includes(tag)),tagH=needs?`<span class="tag bad">Needs orders</span>`:fight?`<span class="tag gold">Fighting</span>`:fr.length?`<span class="tag">At the front</span>`:"";
 const maxd=st==="dig"?5:3;
 const P1=`<div class="thc${fr.length?" hot":""}" id="th-${r}"><div class="thh">${sh?"":`<b>${esc(R.n)}</b>`}${tagH}</div><div class="thh2">${thPills(b)}</div>
 <small class="muted">${fr.length?"Facing "+fr.slice(0,3).map(f=>esc(tNm(REGION[f.r].n))).join(", "):"No enemy border"} · hub ${hub?esc(P(hub).n):"none held"}${b.con?" · "+b.con+" conscripts":""}${b.mv?" · "+b.mv+" on the way":""}</small>
`,PS=` <div class="ths">${srow("Infantry","inf",Q?Q.k.inf:0)}${srow("Cavalry","cav",Q?Q.k.cav:0)}${srow("Artillery","art",Q?Q.k.art:0)}<small class="muted">${Q?"Brigades: ours, then the enemy in "+esc(tNm(REGION[E0].n))+" as we estimate it, within "+Math.round(fog*100)+"%. "+(fog>.15?"Cavalry scouting sharpens it (6% of the force: 14%; 12%: 8%).":"Our cavalry scouts sharpen the estimate."):"No enemy in sight."}</small></div>
 <div class="ths">${gz("Supply",S.v,1,pct(S.v),{c:S.v<.5?"red":S.v<.75?"":"green"})}${gz("Dug in",S.dig,maxd,S.dig.toFixed(1)+" of "+maxd,{c:"green"})}${gz("Morale",S.org,1,pct(S.org),{c:S.org<.4?"red":""})}<small class="muted">${S.cut?S.cut+" brigades are cut off from supply. ":""}${S.over?S.over+" brigades stand over a province's supply limit and lose strength. ":""}Each point of trench adds 10% to defence; Hold reaches 3, Dig in 5.</small></div>
`,PO=` <div class="seg thst" role="group" aria-label="Stance">${chips}</div><small class="thd">${esc(STN[st][2])}</small>
 <div class="thsel"><label>Objective${obH}</label><label>Intensity${sel("thit",INT_N,it,"Intensity")}</label><label>Priority${sel("thpr",PRI_N,pr,"Priority")}</label><label>General${gH}</label></div>
 <small class="thd">${st==="probe"?"Probe: attacks only at 2.5 to 1 or better, with little loss; intensity does not apply.":esc(INT_TXT[it])}</small><small class="thd">${esc(PRI_TXT[pr])}</small>
`,PL=` <div class="thl"><b>Fronts and last month</b>${thLastMonth(tag,r,fr)}</div>`,PM=war?thMinister(tag,r,T):"",PA=` <div class="thacts"><button class="btn sm" data-a="thmove" data-r="${r}">Move brigades</button></div>`;

 return P1+(sh?PO+PM+PS+PL:PS+PO+PL+PM)+PA+"</div>";}
function thHTML(c){const L=thRows(c),war=thFoes(c.tag).size>0;if(!L.length)return`<p class="calm">No brigades in the field. Raise some below; they join the reserve or the theatre you choose.</p>`;
 let h="";const nd=thNeeds(c);if(nd.length)h+=`<div class="al warn" style="pointer-events:none">We are at war and ${nd.length===1?"one theatre has":nd.length+" theatres have"} no orders: ${nd.slice(0,3).map(r=>esc(REGION[r].n)).join(", ")}. Choose a stance for each.</div>`;
 else if(war&&!L.some(r=>{const s=thGet(c.tag,r,1).st;return r!=="res"&&(s==="attack"||s==="probe")&&thBrig(c.tag,r).n>0;}))h+=`<div class="al warn" style="pointer-events:none">We are at war but no theatre is ordered to attack. Pick Attack on a theatre, then choose its objective.</div>`;
 const full=L.filter(r=>r==="res"||thBrig(c.tag,r).n>0),emp=L.filter(r=>!full.includes(r)),X=thUX();
 h+=full.map(r=>thCard(c,r)).join("");
 if(emp.length)h+=`<div class="thc empty"><div class="thh"><b>Fronts with no brigades</b></div>${emp.map(r=>{const fr=thFronts(c.tag,r),E1=fr.length?fr[0].r:null,Q1=E1?thTheirs(X,E1):null;return`<div class="thf"><b>${esc(REGION[r].n)}</b><small>${Q1&&Q1.b>.05?"The enemy has about "+Math.round(Q1.b)+" in "+esc(tNm(REGION[E1].n))+", as we estimate it.":"No enemy force in sight."}</small><div class="thacts"><button class="btn sm" data-a="thfrom" data-r="${r}">Send brigades here</button></div></div>`;}).join("")}</div>`;
 return h;}
function thMoveHTML(){const m=UI.mv,c=me(),tag=c.tag,b=thBrig(tag,m.f),from=m.f==="res"?"the reserve":REGION[m.f].n;
 const mine=thList(tag).filter(r=>r!==m.f&&thHub(tag,r)),land=Object.keys(REGION).filter(r=>r!==m.f&&!mine.includes(r)&&thLand(tag,r));
 const opts=(m.f!=="res"?[["res","Reserve at the capital"]]:[]).concat(mine.map(r=>[r,REGION[r].n])).concat(land.map(r=>[r,"Land in "+REGION[r].n+" (enemy or unclaimed coast)"]));
 if(!opts.some(o=>o[0]===m.t))m.t=opts.length?opts[0][0]:"";
 const want={inf:m.inf,cav:m.cav,art:m.art},tot=m.inf+m.cav+m.art,e=m.t&&tot?thTransfer(tag,m.f,m.t,want,true):null;
 const row=(k,n)=>`<div class="mvr"><span>${n}<small> ${b[k]} here</small></span><span class="mvs"><button class="btn sm" data-a="thn" data-k="${k}" data-d="-1"${m[k]<=0?" disabled":""} aria-label="Fewer">−</button><b>${m[k]}</b><button class="btn sm" data-a="thn" data-k="${k}" data-d="1"${m[k]>=b[k]?" disabled":""} aria-label="More">+</button></span></div>`;
 const msg=!tot?"Choose how many brigades to send.":!m.t?"There is nowhere to send them.":e&&e.ok?(e.eta>0?"Arrives in about "+e.eta+" month"+(e.eta>1?"s":"")+".":"They are already there: the change is at once."):(e&&e.txt)||"No way through.";
 return`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Move brigades from ${esc(from)}</h2><button class="x" data-a="close" aria-label="Close">×</button></div><label class="mvto">Send to<select data-sel="thto" aria-label="Destination">${opts.map(o=>`<option value="${o[0]}"${m.t===o[0]?" selected":""}>${esc(o[1])}</option>`).join("")}</select></label>${row("inf","Infantry")}${row("cav","Cavalry")}${row("art","Artillery")}<p class="small ${e&&e.ok?"":"muted"}">${msg}</p><div class="dfoot2"><button class="btn" data-a="close">Cancel</button><button class="btn pri" data-a="thgo"${e&&e.ok?"":" disabled"}>Send</button></div></div>`;}
/* the sheet on the map shows one theatre's card */
function thSheetHTML(r){const c=me();return`<div class="ph"><div class="phm"><h2>${esc(thName(r))}</h2><div class="small muted">Orders for this theatre</div></div><button class="x" data-a="shclose" aria-label="Close">×</button></div>`+thCard(c,r,1);}
function thAfter(){UI._thx=null;UI._br=null;if(UI.tab==="map"){if(UI.thsheet&&$("#sheet").classList.contains("open"))openSheet(thSheetHTML(UI.thsheet));drawMap();}else render();}
const thSet=(r,f)=>{const T=thGet(G.player,r,1);f(T);T.set=1;thAfter();};
const THSEL={thob:(d,v)=>thSet(d.r,T=>{T.ob=v;}),thit:(d,v)=>thSet(d.r,T=>{T.it=+v;}),thpr:(d,v)=>thSet(d.r,T=>{T.pr=+v;}),thto:(d,v)=>{UI.mv.t=v;openModal(thMoveHTML());},
 thgen:(d,v)=>{const T0=G.th[G.player];for(const k in T0)if(v&&T0[k].gen===v)T0[k].gen="";thGet(G.player,d.r,1).gen=v;const c=me();thSync();thGens(c,thCtx(c));thAfter();},
 rdest:(d,v)=>{me().rdest=v;},nsm:(d,v)=>{UI.nm.t=v;openModal(nsMoveHTML());},nstg:(d,v)=>{nsGet(G.player,d.r,1).tg=v;navAfter();}};
document.addEventListener("change",e=>{const k=e.target.dataset&&e.target.dataset.sel;if(k&&THSEL[k]&&G.player)THSEL[k](e.target.dataset,e.target.value);});
Object.assign(ACT,{
 thst:d=>thSet(d.r,T=>{if(d.s==="fall"||T.st==="fall")T.ob="";T.st=d.s;}),
 thadv:d=>thSet(d.r,T=>{T.st=d.s;T.ob=d.o||"";}),
 thfrom:d=>{const tag=G.player,src=thRows(me()).filter(x=>x!==d.r).sort((x,y)=>thBrig(tag,y).n-thBrig(tag,x).n)[0];if(!src||!thBrig(tag,src).n){toast("We have no brigades to send.");return;}UI.mv={f:src,t:d.r,inf:0,cav:0,art:0};openModal(thMoveHTML());},
 thmove:d=>{UI.mv={f:d.r,t:"",inf:0,cav:0,art:0};openModal(thMoveHTML());},
 thn:d=>{const m=UI.mv,b=thBrig(G.player,m.f);m[d.k]=clamp(m[d.k]+(+d.d),0,b[d.k]);openModal(thMoveHTML());},
 thgo:()=>{const m=UI.mv,r=thTransfer(G.player,m.f,m.t,{inf:m.inf,cav:m.cav,art:m.art});closeModal();toast(r.ok?r.n+" brigade"+(r.n>1?"s":"")+" on the way"+(r.eta>0?", arriving in about "+r.eta+" month"+(r.eta>1?"s":""):"")+".":r.txt);thAfter();},
 thsheet:d=>{closeModal();UI.thsheet=d.r;if(UI.tab!=="map"){UI.tab="map";render();}const R=REGION[d.r],hub=d.r==="res"?P(me().cap):P(thHub(G.player,d.r)||R.p[0]);centerOn(hub,Math.min(UI.view.w,420));UI.sel=null;openSheet(thSheetHTML(d.r));drawMap();},
 shclose:()=>closeSheet(),
 nextth:()=>{const L=thNeeds(me());if(!L.length){toast(thFoes(G.player).size?"Every theatre has its orders.":"No war: no theatre needs orders.");return;}const i=Math.max(0,L.indexOf(UI.thlast)+1)%L.length;UI.thlast=L[i];ACT.thsheet({r:L[i]});}});
/* ================= THE NAVY BY STATION (W5, W6) ================= */
function navRows(c){const tag=c.tag,set=new Set(),en=thFoes(tag);for(const a of navFleets(tag))set.add(a.sr||SEAR_OF[a.loc]);const S=G.ns&&G.ns[tag];if(S)for(const k in S)if(S[k].m!=="port")set.add(k);
 if(en.size)for(const p of G.plist)if(p.sea&&p.o&&en.has(p.o)&&p.ctl===p.o&&SEAADJ[p.id].length)set.add(SEAR_OF[p.id]);
 const n=sr=>sum(navFleets(tag).filter(a=>a.sr===sr),a=>a.u.length);return[...set].filter(x=>SEAREG[x]).sort((a,b)=>n(b)-n(a)||SEAREG[a].n.localeCompare(SEAREG[b].n));}
/* the minister's view of one sea: which enemy coast a blockade here would shut, and the odds of holding it */
function navAdvice(c,sr){const tag=c.tag,en=thFoes(tag);if(!en.size)return null;let best=null;
 for(const t of en){const k=G.c[t];if(!k||!k.alive)continue;let tot=0,here=0;for(const p of G.plist){if(!p.sea||p.o!==t||p.ctl!==t||!SEAADJ[p.id].length)continue;tot+=p.pop;if(SEAR_OF[p.id]===sr)here+=p.pop;}if(!here||!tot)continue;
  const share=here/tot,mine=navalPower(tag),theirs=navalPower(t)*(1+(hash01(tag+sr+t+G.t)*2-1)*.2),odds=clamp(1/(1+Math.pow(mine/Math.max(1,theirs),-3)),.03,.97),v=share*odds;if(!best||v>best.v)best={t,share,odds,v,ours:Math.round(mine),theirs:Math.round(theirs)};}
 return best;}
function navCard(c,sr){const tag=c.tag,T=nsGet(tag,sr,1),R=SEAREG[sr],F=navFleets(tag).filter(a=>a.sr===sr),here=F.filter(a=>!a.path.length),sail=F.filter(a=>a.path.length),nh=sum(here,a=>a.u.length),ns=sum(sail,a=>a.u.length),en=thFoes(tag);
 const pw=sum(here,strength),fo=G.armies.filter(a=>a.naval&&!a.reb&&a.u.length&&!a.path.length&&a.u.some(isWarship)&&SEAR_OF[a.loc]===sr&&hostile(tag,armyTag(a))),fs=sum(fo,a=>a.u.length),fp=sum(fo,strength),fog=.2,fe=fs*(1+(hash01(tag+sr+G.t)*2-1)*fog);
 const chips=MISSIONS.map(m=>`<button class="btn sm ${T.m===m[0]?"on":""}" data-a="nsmis" data-r="${sr}" data-m="${m[0]}" title="${esc(m[2])}" aria-pressed="${T.m===m[0]}">${m[1]}</button>`).join("");
 const foes=[...en].filter(t=>G.plist.some(p=>p.sea&&p.o===t&&p.ctl===t&&SEAR_OF[p.id]===sr&&SEAADJ[p.id].length)),
  lands=Object.keys(REGION).filter(r=>REGION[r].p.some(id=>P(id).sea&&SEAR_OF[id]===sr));
 const tgH=T.m==="blockade"?`<select data-sel="nstg" data-r="${sr}" aria-label="Blockade target"><option value="">Any enemy with a port here (automatic)</option>${foes.map(t=>`<option value="${t}"${T.tg===t?" selected":""}>${esc(G.c[t].n)}</option>`).join("")}</select>`:T.m==="landing"?`<select data-sel="nstg" data-r="${sr}" aria-label="Landing coast"><option value="">Choose the coast to cover</option>${lands.map(r=>`<option value="${r}"${T.tg===r?" selected":""}>${esc(REGION[r].n)}</option>`).join("")}</select>`:`<select disabled aria-label="Target"><option>No target for this mission</option></select>`;
 const sit=here.filter(a=>P(a.loc).o&&hostile(tag,P(a.loc).o)&&P(a.loc).ctl===P(a.loc).o).map(a=>P(a.loc).n),shut=[...new Set(sit)];
 const bl=Object.values(G.c).filter(k=>k.alive&&k.blk&&k.blk.by===tag&&k.blk.share>.02&&G.plist.some(p=>p.o===k.tag&&p.sea&&SEAR_OF[p.id]===sr));
 const adv=navAdvice(c,sr),other=navRows(c).filter(x=>x!==sr);
 return`<div class="thc${fo.length?" hot":""}"><div class="thh"><b>${esc(R.n)}</b>${T.m!=="port"?`<span class="tag gold">${esc(MIS[T.m][1])}</span>`:""}</div><div class="thh2"><span class="pills"><span>${nh} ship${nh===1?"":"s"} here</span>${ns?`<span>${ns} sailing here</span>`:""}</span></div>
 <div class="ths">${gz("Our ships",nh,Math.max(nh,fe,1),nh+(fs?" : about "+Math.round(fe):""),{c:fs&&fe>nh*1.25?"red":"green"})}<small class="muted">${fs?"Ships here: ours, then the enemy's as we estimate it, within "+Math.round(fog*100)+"%. Their fleet power is about "+Math.round(fp)+" against our "+Math.round(pw)+".":"No enemy warships seen in this sea."}</small></div>
 <div class="seg thst" role="group" aria-label="Mission">${chips}</div><small class="thd">${esc(MIS[T.m][2])}</small>
 <div class="thsel"><label>${T.m==="landing"?"Coast":"Target"}${tgH}</label></div>
 ${shut.length?`<p class="small">Our ships sit off ${esc(shut.slice(0,4).join(", "))}.${bl.length?" "+bl.map(k=>esc(k.n)+": "+Math.round(k.blk.share*100)+"% of the coast shut, trade at "+Math.round(k.access*100)+"%").join("; ")+".":""}</p>`:""}
 ${adv?`<div class="thm"><b>The minister advises</b><p class="small">Blockade ${esc(G.c[adv.t].n)} here: odds ${Math.round(adv.odds*100)}% (our fleet power ${adv.ours} against about ${adv.theirs}); it would shut about ${Math.round(adv.share*100)}% of their coast.${nh?"":" Send ships here first."}</p>${T.m==="blockade"&&(T.tg===adv.t||!T.tg)?"":`<div class="thacts"><button class="btn sm pri" data-a="nsadv" data-r="${sr}" data-t="${adv.t}">Set this mission</button></div>`}</div>`:""}
 <div class="thacts"><button class="btn sm" data-a="nsmove" data-r="${sr}"${nh&&other.length?"":" disabled"}>Send ships</button></div>${!nh?`<small class="muted">${other.length?"No ships are free here.":"We have no other sea to send them to."}</small>`:""}</div>`;}
function navHTML(c){const L=navRows(c);const fl=navFleets(c.tag);if(!fl.length&&!L.length)return`<p class="calm">We have no ships. Raise them at a port below.</p>`;return`<p class="small muted">Ships are posted to seas, not moved one by one. Each sea has one mission; the ships sail there by themselves.</p>`+(L.length?L.map(sr=>navCard(c,sr)).join(""):`<p class="calm">Our ships have no station yet.</p>`);}
function nsMoveHTML(){const m=UI.nm,c=me(),tag=c.tag,F=navFleets(tag).filter(a=>a.sr===m.f&&!a.path.length),have=sum(F,a=>a.u.length),opts=navRows(c).filter(x=>x!==m.f).concat(Object.keys(SEAREG).filter(x=>x!==m.f&&!navRows(c).includes(x)&&bestBase(c,0,x)));
 if(!opts.some(o=>o===m.t))m.t=opts[0]||"";m.n=clamp(m.n,0,have);const e=m.t&&m.n?nsTransfer(tag,m.f,m.t,m.n,true):null;
 const msg=!m.n?"Choose how many ships to send.":!m.t?"There is nowhere to send them.":e&&e.ok?(e.eta>0?"They reach "+SEAREG[m.t].n+" in about "+e.eta+" month"+(e.eta>1?"s":"")+".":"They are there at once."):(e&&e.txt)||"No sea route.";
 return`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Send ships from ${esc(SEAREG[m.f].n)}</h2><button class="x" data-a="close" aria-label="Close">×</button></div><label class="mvto">Send to<select data-sel="nsm" aria-label="Destination">${opts.map(o=>`<option value="${o}"${m.t===o?" selected":""}>${esc(SEAREG[o].n+" ("+MIS[nsGet(tag,o,1).m][1].toLowerCase()+")")}</option>`).join("")}</select></label>
 <div class="mvr"><span>Ships<small> ${have} free here</small></span><span class="mvs"><button class="btn sm" data-a="nsn" data-d="-1"${m.n<=0?" disabled":""} aria-label="Fewer">−</button><b>${m.n}</b><button class="btn sm" data-a="nsn" data-d="1"${m.n>=have?" disabled":""} aria-label="More">+</button></span></div><p class="small ${e&&e.ok?"":"muted"}">${msg}</p><div class="dfoot2"><button class="btn" data-a="close">Cancel</button><button class="btn pri" data-a="nsgo"${e&&e.ok?"":" disabled"}>Send</button></div></div>`;}
function navSheetHTML(sr){return`<div class="ph"><div class="phm"><h2>${esc(SEAREG[sr].n)}</h2><div class="small muted">Orders for this sea</div></div><button class="x" data-a="shclose" aria-label="Close">×</button></div>`+navCard(me(),sr);}
function navSheet(sr){UI.thsheet=null;UI.nsheet=sr;UI.sel=null;openSheet(navSheetHTML(sr));drawMap();}
function navAfter(){UI._br=null;if(UI.tab==="map"){if(UI.nsheet&&$("#sheet").classList.contains("open"))openSheet(navSheetHTML(UI.nsheet));drawMap();}else render();}
Object.assign(ACT,{
 nsmis:d=>{const T=nsGet(G.player,d.r,1);T.m=d.m;if(d.m==="blockade"){if(!G.c[T.tg])T.tg="";}else if(d.m==="landing"){if(!REGION[T.tg])T.tg="";}else T.tg="";navAfter();},
 nsadv:d=>{const T=nsGet(G.player,d.r,1);T.m="blockade";T.tg=d.t;navAfter();},
 nsmove:d=>{UI.nm={f:d.r,t:"",n:1};openModal(nsMoveHTML());},
 nsn:d=>{UI.nm.n+=+d.d;openModal(nsMoveHTML());},
 nsgo:()=>{const m=UI.nm,r=nsTransfer(G.player,m.f,m.t,m.n);closeModal();toast(r.ok?r.n+" ship"+(r.n>1?"s":"")+" sail"+(r.n>1?"":"s")+(r.eta>0?", arriving in about "+r.eta+" month"+(r.eta>1?"s":""):"")+".":r.txt);navAfter();}});
/* ================= THE MAP: theatres, fronts, battles and fleet stations (W6) ================= */
function bbOf(id){const w=WP[id];if(w._bb)return w._bb;const n=w.d.match(/-?\d+(?:\.\d+)?/g)||[];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(let i=0;i+1<n.length;i+=2){const x=+n[i],y=+n[i+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}return w._bb=[x0,y0,x1,y1];}
const STW={attack:"Attack",probe:"Probe",hold:"Hold",dig:"Dig in",fall:"Fall back",garr:"Garrison"};
function drawTheatres(force){const gT=$("#ths"),gF=$("#fronts"),gU=$("#units");if(!gT||!gF||!gU||!G.player||!UI.view)return;const sc=UI._sc||(UI.mr&&UI.mr.width?UI.mr.width/UI.view.w:1),bk=Math.round(Math.log(Math.max(.05,sc))/Math.log(1.3));if(!force&&UI._thb===bk)return;UI._thb=bk;
 const c=me(),tag=c.tag,rows=thRows(c).filter(r=>r!=="res"),X=thUX(),en=X.enemies;let defs="",ol="",ln="",arw="";const nd=new Set(thNeeds(c)),items=[],placed=[];
 const fit=(x,y,w,h)=>{for(const[dx,dy]of[[0,0],[0,-h-3],[0,h+3],[w*.6,0],[-w*.6,0],[0,-2*h-6],[0,2*h+6]]){const bx=x*sc+dx-w/2,by=y*sc+dy-h/2;if(!placed.some(q=>bx<q[2]&&bx+w>q[0]&&by<q[3]&&by+h>q[1])){placed.push([bx,by,bx+w,by+h]);return[x+dx/sc,y+dy/sc];}}return null;};
 for(const r of rows){const ids=REGION[r].p.filter(id=>{const p=P(id);return p.ctl===tag&&!p.waste;});if(!ids.length)continue;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const id of ids){const b=bbOf(id);x0=Math.min(x0,b[0]);y0=Math.min(y0,b[1]);x1=Math.max(x1,b[2]);y1=Math.max(y1,b[3]);}
  const pd=ids.map(id=>`<path d="${WP[id].d}"/>`).join(""),bx=`x="${(x0-30).toFixed(0)}" y="${(y0-30).toFixed(0)}" width="${(x1-x0+60).toFixed(0)}" height="${(y1-y0+60).toFixed(0)}"`;
  defs+=`<mask id="thm-${r}" maskUnits="userSpaceOnUse" ${bx}><rect ${bx} fill="#000"/><g fill="#fff" stroke="#fff" stroke-width="7" stroke-linejoin="round">${pd.replace(/<path /g,'<path vector-effect="non-scaling-stroke" ')}</g><g fill="#000" stroke="none">${pd}</g></mask>`;
  ol+=`<g class="thg"><rect ${bx} class="tho${nd.has(r)?" need":""}" fill="${c.col}" mask="url(#thm-${r})"/></g>`;}
 /* fronts: a short coloured segment across every border where our theatre faces enemy ground; an arrow shows who is attacking; a chip gives ours : theirs */
 if(en.size)for(const r of rows){const T=thGet(tag,r,1),mine=new Set(REGION[r].p.filter(id=>P(id).ctl===tag&&!P(id).waste));for(const a of X.all)if(a.th===r)mine.add(a.loc);const byE={};
  for(const u of mine)for(const v of ADJ[u]){const q=P(v);if(q.waste||!en.has(q.ctl))continue;(byE[REG_OF[v]]=byE[REG_OF[v]]||[]).push([u,v,q.ctl]);}
  for(const E in byE){const pr=byE[E],ours=T.st==="attack"||T.st==="probe",et=pr[0][2],Te=G.th&&G.th[et]&&G.th[et][E],theirs=!ours&&Te&&(Te.st==="attack"||Te.st==="probe"),cls=ours?"us":theirs?"them":"quiet",M=[];let sx=0,sy=0,best=null,bd=1e9;
   for(const[u,v]of pr){const a=P(u),b=P(v),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy)||1,h=Math.min(L*.32,22),px=-dy/L*h,py=dx/L*h;sx+=mx;sy+=my;ln+=`<line class="fln ${cls}" x1="${(mx-px).toFixed(0)}" y1="${(my-py).toFixed(0)}" x2="${(mx+px).toFixed(0)}" y2="${(my+py).toFixed(0)}" vector-effect="non-scaling-stroke"/>`;M.push([mx,my,dx/L,dy/L]);}
   const cx=sx/pr.length,cy=sy/pr.length;for(const m of M){const d=Math.hypot(m[0]-cx,m[1]-cy);if(d<bd){bd=d;best=m;}}
   if(cls!=="quiet"&&best){const sg=ours?1:-1,ang=Math.atan2(best[3]*sg,best[2]*sg)*180/Math.PI;arw+=`<g transform="translate(${best[0].toFixed(0)},${best[1].toFixed(0)}) rotate(${ang.toFixed(0)})" class="farw ${cls}" data-th="${r}"><g class="us"><rect class="hit" x="-22" y="-23" width="44" height="46" fill="transparent" pointer-events="none"/><path d="M-20 0H6"/><polygon points="14,0 4,-6 4,6"/></g></g>`;}
   const Fm=thMine(X,r),Q=thTheirs(X,E),fog=thFog(Fm),est=Q.b*(1+(hash01(tag+r+E+G.t)*2-1)*fog),n=Fm.k.inf+Fm.k.cav+Fm.k.art;if(!n)continue;
   items.push({pri:cls==="quiet"?2:0,x:cx,y:cy-12/sc,w:50,h:16,s:p=>`<g class="fchip ${cls}" data-th="${r}" transform="translate(${p[0].toFixed(0)},${p[1].toFixed(0)})"><g class="us"><rect class="hit" x="-30" y="-23" width="60" height="46" fill="transparent"/><rect class="cb" x="-25" y="-8" width="50" height="16" rx="8"/><text x="0" y="3.3">${n} : ${Q.b>.05?"~"+Math.round(est):"0"}</text></g></g>`});}}
 for(const r of rows){const hub=thHub(tag,r);if(!hub)continue;const p=P(hub),T=thGet(tag,r,1),nm=REGION[r].n.replace(/^The /,"").split(" and ")[0],txt=nm+": "+(STW[T.st]||"Hold"),w=Math.min(150,12+txt.length*5.2);
  items.push({pri:nd.has(r)?1:3,x:p.x,y:p.y,w,h:16,s:q=>`<g class="tlab${nd.has(r)?" need":""}" data-th="${r}" transform="translate(${q[0].toFixed(0)},${q[1].toFixed(0)})"><g class="us"><rect class="hit" x="${(-Math.max(w,38)/2-3).toFixed(0)}" y="-23" width="${(Math.max(w,38)+6).toFixed(0)}" height="46" fill="transparent"/><rect class="tb" x="${(-w/2).toFixed(0)}" y="-8" width="${w.toFixed(0)}" height="16" rx="3"/><text x="0" y="3.2">${esc(txt)}</text></g></g>`});}
 const st={};for(const a of navFleets(tag)){const s=st[a.sr]=st[a.sr]||{n:0,loc:a.loc,b:0};s.n+=a.u.length;if(a.u.length>s.b){s.b=a.u.length;s.loc=a.loc;}}
 for(const sr in st){const p=P(st[sr].loc),T=nsGet(tag,sr),m=T?T.m:"port",lab=st[sr].n+" "+(m==="port"?"in port":m==="blockade"?"blockade":m==="patrol"?"patrol":m==="seek"?"seek":"cover");
  items.push({pri:4,x:p.x,y:p.y+10/sc,w:78,h:18,s:q=>`<g class="fanch${m==="port"?" idle":""}" data-ns="${sr}" transform="translate(${q[0].toFixed(0)},${q[1].toFixed(0)})"><g class="us"><rect class="hit" x="-42" y="-23" width="84" height="46" fill="transparent"/><rect class="tb" x="-39" y="-8.5" width="78" height="17" rx="8.5"/><circle class="ac" r="7.5" cx="-30" cy="0"/><path d="M-30 -3.6v7M-33 -1.2h6M-34 1.4a4 4 0 0 0 8 0"/><text x="-18" y="3.1">${esc(lab)}</text></g></g>`});}
 items.sort((a,b)=>a.pri-b.pri);let chips="";const mk=[];for(const it of items){const p=fit(it.x,it.y,it.w,it.h);if(p){chips+=it.s(p);mk.push([+p[0].toFixed(1),+p[1].toFixed(1),it.w,it.h]);}}
 /* V2c.8: the province names keep clear of these boxes (labels are laid out after the markers) */
 const mkk=mk.map(m=>m.join(":")).join(",");if(UI._mkk!==mkk){UI._mkk=mkk;UI._mkb=mk;UI._llk="";}
 setH($("#fdefs2"),defs);setH(gT,ol);setH(gF,ln);setH(gU,arw+chips);}
function thProvLink(id){const c=me(),r=REG_OF[id];return thRows(c).includes(r)&&r!=="res"?`<div class="cta"><button class="btn sm" data-a="thsheet" data-r="${r}">Orders for ${esc(tNm(REGION[r].n))}</button></div>`:"";}


ACT.facmethod=d=>{
 const p=P(d.p),factory=p?.factories[+d.i],method=Number(d.method);
 if(!factory||factory.fo||p.o!==G.player||p.ctl!==G.player||!(factory.m>0)||![0,factory.m].includes(method))return;
 factory.activeMethod=method;
 autosave();
 openSheet(facInfo(p,+d.i));
};


ACT.fundingdetail=d=>{
 const a=G.constructionLedger?.[d.id];
 if(!a)return;
 openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Construction payments</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 ${kr("Province",esc(P(a.province).n))}${kr("Status",esc(a.status))}
 ${kr("Previously paid",money(a.openingPaid))}${kr("Total paid",money(a.paid))}
 ${a.payments.map(p=>lr({t:esc(p.year??dateStr(p.month)),s:esc(nameOf(p.payer))+" · "+(p.account==="tr"?"Treasury":"Private investment"),v:money(p.amount)})).join("")}</div>`);
};
