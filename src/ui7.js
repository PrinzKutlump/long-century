"use strict";

function agendaHTML(c) {
 const a=G.agenda?.tag===c.tag?G.agenda:beginAgenda(c);
 const end=dateStr(a.end-1);
 const status=a.closed==null?"Open through "+end:(a.goals.every(g=>g.done!=null)? "Agenda completed in "+dateStr(a.closed-1):"Closed in "+dateStr(a.closed-1));
 const rows=a.goals.map(g=>{
  const m=AGENDA_METRICS[g.key],fmt=m.format||String;
  const progress=Math.round(clamp((g.now-g.base)/Math.max(1,g.target-g.base),0,1)*100);
  return `<article class="disp"><h3>${esc(g.title)}</h3><p class="small muted">${esc(m.why)}</p>
   <p><b>${esc(m.label)}</b> ${esc(fmt(g.now))} / ${esc(fmt(g.target))}${g.done!=null?" · Completed":""}</p>
   <div class="meter green" role="progressbar" aria-label="${esc(g.title)}" aria-valuenow="${g.done!=null?100:progress}"><i style="width:${g.done!=null?100:progress}%"></i></div>
   <div class="row"><button class="btn sm" data-a="tab" data-t="${m.tab}">View ${esc(m.label.toLowerCase())}</button></div></article>`;
 }).join("");
 return `<p class="small muted">${esc(status)} · Optional annual goals</p>${latestCabinetReport()?`<p><button class="btn sm" data-a="cabinetreport">Cabinet reports</button></p>`:""}${rows}${a.closed!=null?`<div class="row"><label>Choose the next priority <select id="agenda-priority">${agendaChoices(c).map(([key,title])=>`<option value="${key}">${esc(title)}</option>`).join("")}</select></label><button class="btn pri" data-a="agendarenew">Set the next agenda</button></div>`:""}`;
}
ACT.agendarenew=()=>{if(G.agenda?.closed!=null){beginAgenda(me(),$("#agenda-priority")?.value);autosave();render();}};

function latestCabinetReport(){
 const items=G.cabinetReports||[];
 return items[items.length-1];
}
function showCabinetReport(offset=0){
 const items=G.cabinetReports||[],index=items.length-1-offset,r=items[index];
 if(!r){toast("The first cabinet report will appear at the next year-end.");return;}
 const a=r.from,b=r.to;
 const row=(title,value,detail,tab)=>`<div class="sumr"><span><b>${esc(title)} · ${esc(value)}</b><br><span class="small muted">${esc(detail)}</span></span><button class="btn sm" data-a="cfgo" data-t="${tab}">Open</button></div>`;
 const signed=(n,fmt=String)=>(n<0?"−":n>0?"+":"")+fmt(Math.abs(n));
 const development=r.development.map(p=>{
  const desc=p.acquired?"Newly acquired province":Object.entries(p.changes).filter(([,v])=>v!==0).map(([k,v])=>signed(v)+" "+k).join(", ");
  return `<div class="sumr"><span>${esc(desc)}</span><button class="btn sm" data-a="goprov" data-p="${esc(p.id)}">${esc(P(p.id).n)}</button></div>`;
 }).join("");
 const closed=G.agendaLog?.filter(x=>x.end>r.from.t&&x.end<=r.to.t)||[];
 openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Cabinet report · ${r.year}</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 <p class="small muted">${esc(dateStr(a.t))} through ${esc(dateStr(b.t-1))}</p>
 ${row("Treasury",moneyS(b.tr),signed(b.tr-a.tr,money)+" since the previous report. Debt "+money(b.debt)+".","nat")}
 ${row("National income",money(b.gdp),signed(b.gdp-a.gdp,money)+" in annualized output.","eco")}
 ${row("Basic needs",b.poor+"%",signed(b.poor-a.poor)+" percentage points of poorer households' basic needs met.","eco")}
 ${row("Diplomacy","Rank "+b.rank,signed(a.rank-b.rank)+" places. Active wars "+a.wars+" → "+b.wars+".","dip")}
 ${a.incomes&&b.incomes?`<h3>Household income by occupation</h3>${Object.entries(b.incomes).map(([type,total])=>
 row(PTYPES[type].n,money(total),signed(total-(a.incomes[type]||0),money)+" since the previous report.","eco")).join("")}`:""}
 ${b.landVote?`<p>Land revenue vote · ${pct(b.landVote.yes)} support · ${b.landVote.enacted?"Enacted":"Defeated"}</p>`:""}
 <h3>Provincial development</h3>${development||note("Railway, factory, school and hospital totals held steady in provinces retained.")}
 ${r.works?.length?`<h3>Project outcomes</h3>${r.works.map(w=>`<div class="sumr"><span>${esc(BLD[w.kind]?.n||(w.good?GOODS[w.good].n+" factory":"Railway"))} · ${w.paid==null?"Payment total unavailable":money(w.paid)+" paid"}${w.canceled?" · Canceled: "+esc(w.canceled):" · Completed"}</span><button class="btn sm" data-a="goprov" data-p="${esc(w.province)}">${esc(P(w.province).n)}</button></div>`).join("")}`:""}
 ${closed.length?`<h3>Cabinet agendas</h3>${closed.map(x=>`<p class="small">Agenda ${x.ordinal} closed with ${x.goals.filter(g=>g.done!=null).length} of 3 goals met.</p>`).join("")}`:""}
 ${r.diplomacy?.length?`<h3>Agreements</h3>${r.diplomacy.map(x=>`<p class="small">${esc(x.txt)}</p>`).join("")}`:""}
 ${r.decisions.length?`<h3>Decisions</h3>${r.decisions.map(x=>`<p class="small">${esc(x.title)} · ${esc(x.label)}</p>`).join("")}`:""}
 <div class="dfoot2">
 ${index>0?`<button class="btn" data-a="cabinetreport" data-o="${offset+1}">Earlier year</button>`:""}
 ${offset>0?`<button class="btn" data-a="cabinetreport" data-o="${offset-1}">Later year</button>`:""}
 </div></div>`);
}

function showAdvance(){
 openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Advance time</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 <div class="row">${[3,6,12,0].map(n=>`<button class="btn sm" data-a="advance" data-n="${n}">${n?n+" months":"Until interrupted"}</button>`).join("")}</div>
 <p class="small muted">Always pauses for decisions, attacks on your country, and lost or occupied provinces.</p>
 ${swHTML("stopWar","Pause when joining a war",OPT("stopWar",1)!==0)}
 ${swHTML("stopDefault","Pause on a sovereign default",OPT("stopDefault",1)!==0)}
 ${swHTML("stopProjects","Pause on project or agenda completion",OPT("stopProjects",0)!==0)}
 ${swHTML("stopReport","Open annual cabinet reports and pause auto-advance",OPT("stopReport",0)!==0)}</div>`);
}

Object.assign(ACT,{
 cabinetreport:d=>showCabinetReport(Number(d.o)||0),
 play:()=>{if(UI.play)setPlay(0);else showAdvance();},
 advance:d=>{closeModal();UI.advanceTo=Number(d.n)?G.t+Number(d.n):null;setPlay(1);}
});

const previousCampaignOption=ACT.opt;
ACT.opt=d=>{
 if(!["stopWar","stopDefault","stopProjects","stopReport"].includes(d.k))return previousCampaignOption(d);
 const fallback=d.k==="stopWar"||d.k==="stopDefault"?1:0;
 OPTS(d.k,OPT(d.k,fallback)===0?1:0);
 showAdvance();
};

function punjabChallengeHTML(c){
 if(c.tag!=="PUN")return "";
 const challenge=G.punjabChallenge;
 if(!challenge){
  if(G.t!==0)return "";
  return `<section class="card"><h2>Punjab’s first 15 years</h2>
 <p>Remain independent throughout the challenge and choose a development goal. You can continue the same campaign afterward.</p>
 <div class="row"><button class="btn" data-a="punjabchallenge" data-goal="schools">Build two schools</button>
 <button class="btn" data-a="punjabchallenge" data-goal="welfare">Improve basic needs by up to 5 points</button></div></section>`;
 }
 const metric=AGENDA_METRICS[challenge.goal],format=metric.format||String;
 return `<section class="card"><h2>Punjab’s first 15 years</h2>
 <p>${challenge.sovereign?"Independence maintained":"Independence lost during the challenge"} · ${esc(metric.label)} ${esc(format(challenge.current))} / ${esc(format(challenge.target))}</p>
 <p>${challenge.result?(challenge.result==="won"?"Challenge won.":"Challenge ended with goals outstanding."):"Review in "+dateStr(challenge.end)+ "."}</p></section>`;
}
ACT.punjabchallenge=d=>{
 if(beginPunjabChallenge(me(),d.goal)){autosave();render();}
};

/* ================= V1.4 the sheet: peek, half and full ================= */
const SHK=["peek","half","full"],SH_BACK='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
UI.shH=SHK.includes(OPT("shh","peek"))?OPT("shh","peek"):"peek";UI.shSx=UI.shSx||{};
/* the three numbers that matter for the current lens, and one main action */
function peekHTML(p){const c=p.o&&G.c[p.o],pl=me();let mil=0,lit=0,tot=0;for(const q of p.pops){mil+=q.mil*q.n;lit+=q.lit*q.n;tot+=q.n;}
 const N=(l,v,bad)=>`<span${bad?' class="bad"':""}><i>${l}</i><b>${v}</b></span>`,mi=tot?mil/tot:0,fac=p.factories.reduce((a,f)=>a+f.lv,0),ppn=N("People",ppl(p.pop)),
  mN=N("Militancy",tot?mi.toFixed(1):"—",mi>=5),lN=N("Literacy",tot?pct(lit/tot):"—"),uN=N("Unrest",Math.round(p.un),p.un>=25);
 const T={pol:[ppn,mN,lN],pop:[ppn,lN,uN],mil:[mN,uN,N("Fort",p.fort)],ind:[N("Factories",fac),N("Railway",p.rail),ppn],rail:[N("Railway",p.rail),N("Factories",fac),N("Fort",p.fort)],
  dip:c?[N("Owner rank",ord(G.rank.indexOf(p.o)+1)),N("Prestige",Math.round(c.pres)),ppn]:[N("Owner","none"),ppn,N("Terrain",TERRAIN[p.t].n)],
  ter:[N("Terrain",TERRAIN[p.t].n),N("Farms",p.farm?GOODS[p.farm].n:"none"),N("Mines",p.mine?GOODS[p.mine].n:"none")]};
 let act;if(p.o===G.player&&p.ctl===p.o)act=`<button class="btn pri sm" data-a="facmenu" data-p="${p.id}" aria-label="Build a factory here">Build</button>`;
 else if(!p.o&&!p.waste&&canColonize(pl,p))act=`<button class="btn pri sm" data-a="colonize" data-p="${p.id}">Colonize</button>`;
 else if(p.o&&p.o!==G.player&&provsOf(G.player).some(m=>ADJ[m.id].includes(p.id)))act=`<button class="btn sm" data-a="fabask" data-p="${p.id}" aria-label="Fabricate a claim">Claim</button>`;
 else act=`<button class="btn sm" data-a="shsize" data-k="half">Details</button>`;
 return`<div class="pkr"><button class="shb" data-a="shclose" aria-label="Back: close the sheet">${SH_BACK}</button><span class="phf${p.o?"":" none"}">${p.o?flagOf(p.o):""}</span><b class="pkn">${esc(p.n)}</b>${act}</div><div class="pkn3" aria-label="${esc(MODES[UI.mode])} lens">${(T[UI.mode]||T.pol).join("")}</div>`;}
function shPx(k){const s=$("#sheet"),M=$("main").clientHeight;if(k==="full")return Math.round(M*.9);if(k==="half")return Math.round(M*.5);const pk=s.querySelector(".shpeek");return Math.max(96,pk?pk.offsetHeight+10:96);}
function shSet(k,keep){const s=$("#sheet");if(!s)return;s._k=k;s.dataset.k=k;s._px=shPx(k);s.style.height=s._px+"px";if(!keep&&(s._peekable||k!=="peek")){UI.shH=k;OPTS("shh",k);}shReveal();}
function openSheet(h,o){const s=$("#sheet"),was=s.classList.contains("open"),m=/^<div class="ph" data-pid="([^"]+)"/.exec(h),pk=m&&P(m[1])?peekHTML(P(m[1])):(o&&o.peek)||null,old=was&&s.querySelector(".shbody"),st=old?old.scrollTop:0;
 s._peekable=!!pk;let k=was?s._k:UI.shH;if(k==="peek"&&!pk)k="half";
 s.innerHTML=`<div class="shbar"><button class="shb" data-a="shclose" aria-label="Back: close the sheet">${SH_BACK}</button><div class="grab" aria-hidden="true"></div><button class="shb tog" data-a="shsize" aria-label="Make the sheet taller or shorter">${CHEV}</button></div>`+(pk?`<div class="shpeek">${pk}</div>`:"")+`<div class="shbody">${h}</div>`;
 s.querySelectorAll("details.sx").forEach(d=>{const t=d.querySelector("summary span"),v=t&&UI.shSx[t.textContent];if(v!=null)d.open=v;});
 s.classList.add("open");if(!was)s.classList.add("drag");shSet(k,1);if(!was){void s.offsetHeight;s.classList.remove("drag");}
 const b=s.querySelector(".shbody");if(b&&st)b.scrollTop=st;}
function closeSheet(){const s=$("#sheet");s.classList.remove("open");UI.sel=null;UI.crane=null;if(UI.bm)UI.bm.rev=null;UI.rtp=null;UI.thsheet=null;UI.nsheet=null;closeChooser();if(UI.tab==="map"&&$("#svg"))drawMap();}
/* when a province is selected the map moves so that it sits in the part of the map the sheet leaves free */
function shReveal(){if(UI.tab!=="map"||!UI.sel||!UI.view||!P(UI.sel))return;const s=$("#sheet");if(!s.classList.contains("open"))return;const p=P(UI.sel),M=$("main").getBoundingClientRect(),r=mapRect(),top=r.top,bot=Math.min(r.bottom,M.bottom-(s._px||0));
 if(bot-top<90)return;const v=UI.view,sc=r.width/v.w,sx=r.left+(p.x-v.x)*sc,sy=top+(p.y-v.y)*sc,mg=30;
 if(sx>r.left+mg&&sx<r.right-mg&&sy>top+mg&&sy<bot-mg)return;v.x=p.x-r.width/2/sc;v.y=p.y-((top+bot)/2-r.top)/sc;applyView();}
Object.assign(ACT,{shsize:d=>{const s=$("#sheet");if(!s.classList.contains("open"))return;const k=d.k||(s._k==="full"?"half":"full");shSet(k);},shclose:()=>closeSheet()});
/* swipe on the bar or the peek: follow the finger, then snap; down from the smallest height closes */
{let g=null;const s=()=>$("#sheet");
 document.addEventListener("pointerdown",e=>{const sh=s(),z=e.target.closest&&e.target.closest("#sheet .shbar,#sheet .shpeek");if(!z||e.target.closest("button")||!sh.classList.contains("open"))return;g={y:e.clientY,id:e.pointerId,h:sh.offsetHeight,moved:false,z};});
 window.addEventListener("pointermove",e=>{if(!g||e.pointerId!==g.id)return;const sh=s(),dy=g.y-e.clientY;if(Math.abs(dy)>8)g.moved=true;if(!g.moved)return;sh.classList.add("drag");const lo=(sh._peekable?96:shPx("half"))*.6;sh.style.height=Math.max(lo,Math.min(shPx("full"),g.h+dy))+"px";});
 const end=e=>{if(!g||e.pointerId!==g.id)return;const sh=s(),dy=g.y-e.clientY,d=g;g=null;sh.classList.remove("drag");
  if(!d.moved){if(d.z.classList.contains("shpeek"))shSet("half");else ACT.shsize({});return;}
  const ks=sh._peekable?SHK:SHK.slice(1),i=ks.indexOf(sh._k);let j=i;if(dy>=40)j=Math.min(ks.length-1,i+1);else if(dy<=-40){if(i===0)return closeSheet();j=i-1;}else{const h=sh.offsetHeight;let bd=1e9;ks.forEach((k,n)=>{const q=Math.abs(shPx(k)-h);if(q<bd){bd=q;j=n;}});}
  shSet(ks[j]);};
 window.addEventListener("pointerup",end);window.addEventListener("pointercancel",e=>{if(g&&e.pointerId===g.id){g=null;const sh=s();sh.classList.remove("drag");if(sh._k)sh.style.height=sh._px+"px";}});
 document.addEventListener("toggle",e=>{const d=e.target;if(d.matches&&d.matches("#sheet details.sx")){const t=d.querySelector("summary span");if(t)UI.shSx[t.textContent]=d.open;}},true);
 window.addEventListener("resize",()=>{const sh=s();if(sh&&sh.classList.contains("open")&&sh._k){sh.classList.add("drag");sh._px=shPx(sh._k);sh.style.height=sh._px+"px";void sh.offsetHeight;sh.classList.remove("drag");}});}
