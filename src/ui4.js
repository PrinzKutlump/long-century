"use strict";
/* ================= U7 (part 2): World, nation pages, Ledger, Research, News, sheets, peace screen, war declaration ================= */
/* a modal that keeps its scroll position when it is drawn again */
function modalRe(h){const m=$("#modal"),o=m&&m.firstElementChild,sc=o?o.scrollTop:0;openModal(h);const n=m.firstElementChild;if(n)n.scrollTop=sc;}
/* ---------- the World page ---------- */
function crisisBanner(){const co=G.coal||{};let h="";
 if(G.card&&G.card.kind==="cong")h+=`<button class="al bad" data-a="cardshow">Crisis: ${esc(G.card.title)}. The powers are waiting for our answer. Tap to decide.</button>`;
 return h?`<div class="alerts">${h}</div>`:"";}
function warCard(w,c){const tag=c.tag,side=w.att.includes(tag)?1:2,ws=side===1?w.ws:-w.ws,need=WARGOALS[w.goal.k].ws,lead=w.att[0]===tag||w.def[0]===tag,foes=side===1?w.def:w.att,allies=(side===1?w.att:w.def).filter(t=>t!==tag),left=ws>=0?50:50+ws/2,wd=Math.abs(ws)/2;
 return`<div class="war"><div class="wh">${foes.slice(0,3).map(FL).join("")}<b class="t">${esc(foes.map(nameOf).join(", "))}</b></div><div class="small muted">${WARGOALS[w.goal.k].n}${w.goal.prov?": "+esc(P(w.goal.prov).n):""}${allies.length?"; with "+esc(allies.map(nameOf).join(", ")):""}; ${G.t-w.start} month${G.t-w.start===1?"":"s"} old</div>
  ${w.july?`<p class="small muted">${w.july.general?"Great War":"July Crisis war"} · War exhaustion ${Math.round(w.july.wear[tag]||0)} / 100</p>`:""}
  <div class="wscore" role="img" aria-label="War score ${Math.round(ws)}"><i class="${ws<0?"neg":""}" style="left:${left}%;width:${wd}%"></i><u style="left:50%"></u><s style="left:${clamp(50+need/2,0,100)}%"></s></div>
  <div class="small">War score <b class="${ws<0?"bad":"good"}">${Math.round(ws).toString().replace("-","−")}</b>; our goal needs <b>${need}</b>.</div>
  ${lead?`<div class="row"><button class="btn sm pri" data-a="dealopen" data-w="${w.id}">Peace terms</button><button class="btn sm" data-a="peaceask" data-w="${w.id}" data-k="white">White peace</button><button class="btn sm" data-a="peaceask" data-w="${w.id}" data-k="concede">Concede</button><button class="btn sm" data-a="why" data-k="ws" data-w="${w.id}">The score</button></div>`:`<p class="small muted">Only ${esc(nameOf(side===1?w.att[0]:w.def[0]))}, who leads our side, can make peace.</p>`}</div>`;}
function infamyBody(c){const co=G.coal||{},mine=co[c.tag],inf=c.infamy||0,others=Object.keys(co).filter(t=>t!==c.tag&&G.c[t]&&G.c[t].alive&&co[t].mem.length),lc=(G.congLog||[])[0];
 let h=gz("Our infamy",inf,COAL_AT*1.2,inf.toFixed(1)+" of "+COAL_AT,{c:inf>COAL_AT-6?"red":"",mk:COAL_AT/(COAL_AT*1.2),a:"why",d:{k:"inf"}})+(mine?`<div class="al bad" style="pointer-events:none">A coalition of ${mine.mem.length} states stands against us: ${mine.mem.map(t=>esc(nameOf(t))).join(", ")}.</div>`:"");
 if(others.length)h+=`<h3>Coalitions in the world</h3>`+others.slice(0,5).map(t=>lr({lead:FL(t),t:esc(G.c[t].n),s:"against it: "+esc(co[t].mem.slice(0,4).map(nameOf).join(", "))+(co[t].mem.length>4?" and others":""),v:Math.round(G.c[t].infamy),vs:"infamy",a:"dipnat",d:{t}})).join("");
 if(lc&&G.t-lc.t<=24){const wd={down:"one side backed down",comp:"a compromise was agreed",fight:"it ended in war"}[lc.out];h+=`<h3>Last congress</h3>`+note(dateStr(lc.t)+": "+esc(nameOf(lc.att))+" against "+esc(nameOf(lc.def))+": "+wd+".");}
 const out=[];for(const t in G.c){const o=G.c[t];if(!o.alive)continue;for(const x of o.owes||[]){if(t===c.tag)out.push(`We pay ${esc(nameOf(x.to))} a quarter of our income until ${dateStr(x.until)}.`);else if(x.to===c.tag)out.push(`${esc(nameOf(t))} pays us a quarter of its income until ${dateStr(x.until)}.`);}}
 if(out.length)h+=`<h3>Reparations</h3>`+out.map(s=>note(s)).join("");return h;}
function pgDip(){if(UI.dipT)return pgDipNation(UI.dipT);const c=me(),cbs=cbsOf(c),tag=c.tag;
 const wars=G.wars.filter(w=>w.att.includes(tag)||w.def.includes(tag)),R=G.rank.slice(0,10),busy=c.war.length&&!c.ai;
 const s1=wars.map(w=>warCard(w,c)).join("");
 const s3=cbs.length?cbs.slice(0,12).map(cb=>{const e=warEV(c,cb),inf=estInf(c,cb);return lr({lead:FL(cb.t),t:esc(nameOf(cb.t)),s:WARGOALS[cb.k].n+(cb.prov?": "+esc(P(cb.prov).n):"")+" · "+esc(cb.why),v:Math.round(e.p*100)+"%",vs:"to win · infamy +"+Math.round(inf),vc:e.p<.4?"bad":e.p>.65?"good":"",btn:["Declare","declareask",{t:cb.t,k:cb.k,p:cb.prov||"",c:cb.cul||""},"",busy,"Finish the war we are already fighting first."]});}).join("")+(cbs.length>12?note((cbs.length-12)+" more causes. Open a nation's page to see all of its causes."):""):`<p class="calm">We have no cause for war. Fabricate one: tap a neighbour's province on the map.</p>`;
 const s4=R.map((t,i)=>{const o=G.c[t],sc=o.score;return lr({lead:`<span class="rk">${i+1}</span>${FL(t)}`,t:esc(o.n),s:(isGP(t)?"Great Power · ":"")+(sc?"industry "+sc.ind+" · army "+sc.mil:""),v:Math.round(o.pres),vs:"prestige",cls:t===tag?"me":"",a:"dipnat",d:{t}});}).join("")+cta("Open the ledger of all nations","tab",{t:"ledger"},{sec:1});
 const rels=Object.keys(c.rel).filter(t=>G.c[t].alive).sort((a,b)=>(c.rel[b]||0)-(c.rel[a]||0)),near=rels.filter(t=>Math.abs(c.rel[t])>15||c.ally.includes(t)||G.c[t].sphere===tag).slice(0,16);
 const s5=near.map(t=>{const o=G.c[t],r=c.rel[t],gu=guarantors(t).filter(g=>g!==tag),tags=[c.ally.includes(t)?"ally":"",(c.guar||[]).includes(t)?"we guarantee":"",gu.length?"guaranteed by "+(gu.length>2?gu.length+" powers":gu.map(g=>G.c[g].adj).join(", ")):"",o.sphere===tag?"our sphere":o.sphere?G.c[o.sphere].adj+" sphere":""].filter(x=>x).join(" · ");
  return lr({lead:FL(t),t:esc(o.n),s:esc(tags),mid:`<span class="rel"><i class="${r<0?"neg":"pos"}" style="width:${Math.min(50,Math.abs(r)/4)}%;${r<0?"right":"left"}:50%"></i><u></u></span>`,v:Math.round(r),vc:r<0?"bad":"good",a:"dipnat",d:{t}});}).join("")+(isGP(tag)?note("Influence points: "+Math.round(c.infPts||0)+". At 60 influence and good relations a state joins our sphere."):"");
 return pageHTML("dip","dip","The world","Rivals, allies and the balance of power",[
  wars.length?["Wars","Wars",s1,{sum:wars.length+""}]:null,
  ["Infamy","Infamy and coalitions",infamyBody(c),{info:["Infamy","Taking land and annexing states raises infamy; it fades slowly. Above "+COAL_AT+" our neighbours and the Great Powers ally against us, join every war against us, and may attack to make us give our conquests back. The coalition ends when infamy falls under "+COAL_OFF+"."]}],
  ["Causes","Causes for war",s3,{info:["Causes for war","The chance is our estimate of winning, counting allies and guarantors on both sides. Infamy is what the war would add to ours. Fabricate a cause by tapping a neighbour's province on the map."]}],
  ["Powers","The powers",s4],
  ["Relations","Relations",s5,{closed:1,info:["Relations","The bar runs from −100 on the left to +100 on the right. Tap a nation for its page: what it would answer to each move, before you make it."]}]],{pre:crisisBanner()});}
/* ---------- a nation's own page ---------- */
function actRow(title,a,act,d,label){return`<div class="act"><div><b>${esc(title)}</b><div class="small ${a.ok?"good":"muted"}">${esc(a.why||"")}</div></div><button class="btn sm ${a.ok?"pri":""}" ${DA(act,d)} ${a.ok?"":"disabled"}>${esc(label||title)}</button></div>`;}
function pgDipNation(t){const c=me(),o=G.c[t];if(!o||!o.alive){UI.dipT=null;return pgDip();}const f=dipFacts(c,t),isGPo=isGP(t),cbs=cbsOf(c).filter(cb=>cb.t===t),sc=x=>x.score||{ind:0,mil:0};
 const tg=(x,cl)=>`<span class="tag ${cl||""}">${x}</span>`,tags=[isGPo?tg("Great Power"):"",f.ally?tg("allied","good"):"",f.weGuar?tg("we guarantee"):"",f.theyGuarUs?tg("guarantees us"):"",f.sphere===c.tag?tg("our sphere"):f.sphere?tg(esc(G.c[f.sphere].adj)+" sphere"):"",f.truce?tg("truce","good"):"",f.atWar?tg("at war","bad"):""].join(" ");
 const hereWar=G.wars.find(w=>(w.att.includes(c.tag)&&w.def.includes(t))||(w.def.includes(c.tag)&&w.att.includes(t)));
 const last=f.last?`${dateStr(f.last.t)}: ${f.last.res==="won"?"we won":f.last.res==="lost"?"we lost":"it ended in a draw"}`:"None on record";
 const acts=[actRow("Improve relations",improveAsk(c,t),"improve",{t},"Improve")];
 acts.push(f.ally?`<div class="act"><div><b>Alliance</b><div class="small muted">Allied. Breaking it costs 25 relations on both sides.</div></div><button class="btn sm" data-a="unallyask" data-t="${t}">Break it</button></div>`:actRow("Alliance",allyAsk(c,t),"ally",{t},"Propose"));
 if(!isGPo)acts.push(f.weGuar?`<div class="act"><div><b>Guarantee</b><div class="small muted">We guarantee them. Withdrawing costs 20 relations.</div></div><button class="btn sm" data-a="unguar" data-t="${t}">Withdraw</button></div>`:actRow("Guarantee independence",guarAsk(c,t),"guar",{t},"Guarantee"));
 if(isGP(c.tag)&&!isGPo)acts.push(actRow("Build influence",influenceAsk(c,t),"influence",{t},"Spend 10"));
 const busy=c.war.length&&!c.ai;
 const wars=cbs.map(cb=>{const e=warEV(c,cb),back=[...new Set([...guarantors(t),...(o.sphere&&o.sphere!==c.tag?[o.sphere]:[]),...o.ally])].filter(x=>x!==c.tag&&G.c[x]&&G.c[x].alive).map(nameOf),inf=estInf(c,cb),cong=crisisWorthy(c,o)&&!c.war.length;
  return lr({t:WARGOALS[cb.k].n+(cb.prov?": "+esc(P(cb.prov).n):""),s:esc(cb.why)+". Infamy +"+Math.round(inf)+(c.infamy+inf>COAL_AT?' <b class="bad">(a coalition would form)</b>':"")+(back.length?". Backing them: "+esc(back.slice(0,4).join(", ")):"")+(cong?". Three times in ten the powers meet in congress first":"")+".",v:Math.round(e.p*100)+"%",vs:"to win",vc:e.p<.4?"bad":e.p>.65?"good":"",btn:["Declare","declareask",{t,k:cb.k,p:cb.prov||"",c:cb.cul||""},"",busy,"Finish the war we are already fighting first."]});}).join("");
 const subject=c.overlord===o.tag?c:o.overlord===c.tag?o:null;
 const autonomy=subject?`<div class="row"><button class="btn" data-a="subjectterms" data-t="${esc(t)}">Negotiate subject status</button></div>`:"";
 const s0=autonomy+`<div class="kgrid">${tl("They rate us",f.relBack,f.relBack<0?"cool":"warm",{bad:f.relBack<-40})}${tl("We rate them",f.rel,f.rel<0?"cool":"warm",{bad:f.rel<-40})}</div>${gz("Their infamy",f.infamy,COAL_AT*1.2,Math.round(f.infamy)+" of "+COAL_AT,{c:f.infamy>COAL_AT-6?"red":"",mk:COAL_AT/(COAL_AT*1.2)})}<div class="pblegend"><span><i style="background:var(--red)"></i>${esc(c.n)}</span><span><i style="background:var(--line2)"></i>${esc(o.n)}</span></div>${pbRow("Army",Math.round(armyStr(c.tag)),Math.round(armyStr(t)))}${pbRow("Industry",sc(c).ind||0,sc(o).ind||0)}${pbRow("Navy",fleetOf(c.tag),fleetOf(t))}${pbRow("Prestige",Math.round(c.pres),Math.round(o.pres))}${f.coal.length?note(f.coal.length+" states stand against them in a coalition."):""}`;
 const s1=`<div class="facts">${kr("Alliance",f.ally?"allied":"none")}${kr("Their allies",f.allies.length?esc(f.allies.map(nameOf).join(", ")):"none")}${kr("Guarantees",[f.weGuar?"we guarantee them":"",f.guarBy.length?"also by "+esc(f.guarBy.map(nameOf).join(", ")):"",f.theyGuarUs?"they guarantee us":""].filter(x=>x).join("; ")||"none")}${kr("Sphere",f.sphere===c.tag?"in our sphere":f.sphere?"in the "+esc(G.c[f.sphere].adj)+" sphere":f.overlord?"vassal of "+esc(nameOf(f.overlord)):"independent")}${kr("Truce",f.truce?"until "+dateStr(f.truce):"none")}${kr("Last war with us",last)}</div>`;
 const sW=hereWar?`${warCard(hereWar,c)}`:"";
 return`<div class="row" style="margin-bottom:.2rem"><button class="btn sm" data-a="dipback">← The world</button></div><header class="headpiece natpg"><div class="bigflag">${flagOf(t)}</div><h1>${esc(o.n)}</h1><div class="sub">${esc(GOVS[o.gov].n)} · ${ppl(popOf(t))} · ${provsOf(t).length} province${provsOf(t).length>1?"s":""} · rank ${G.rank.indexOf(t)+1}</div>${HEADORN}<p class="tags">${tags}</p></header>`+
  (()=>{const secs=[["Standing","Where we stand",s0],["Ties","Treaties and ties",s1],hereWar?["War","We are at war",sW]:null,["Actions","What we can do",`<p class="small muted">The answer is shown before you commit.</p>${acts.join("")}`],["Going","Going to war",wars||'<p class="small muted">We have no cause for war against them. Fabricate one by tapping their province next to ours on the map.</p>']].filter(x=>x);
   return`<nav class="jumpbar">${secs.map((s,i)=>`<button data-a="jumpsec" data-i="${i}">${s[0]}</button>`).join("")}</nav>`+secs.map((s,i)=>fr("nation",i,s[1],s[2])).join("");})()+TAILORN;}
/* ---------- the ledger of all nations ---------- */
const LCOL2={rank:["Rank",v=>v+""],pop:["People",ppl],inc:["Income",v=>money(v)],ind:["Mills",v=>Math.round(v)+""],army:["Army",v=>v+""],navy:["Navy",v=>v+""],lit:["Literacy",v=>Math.round(v*100)+"%"]};
function pgLedger(){const lv={};for(const p of G.plist)if(p.o&&p.factories.length)lv[p.o]=(lv[p.o]||0)+sum(p.factories,f=>f.lv);const au={},nu={};for(const a of G.armies){if(a.reb)continue;const n=a.u.length;if(a.naval)nu[a.o]=(nu[a.o]||0)+n;else au[a.o]=(au[a.o]||0)+n;}
 const rows=Object.values(G.c).filter(c=>c.alive).map(c=>({t:c.tag,n:c.n,rank:G.rank.indexOf(c.tag)+1,pop:c.stat.pop||0,inc:(c.stat.gdp||0)*12,ind:lv[c.tag]||0,army:au[c.tag]||0,navy:nu[c.tag]||0,lit:c.stat.lit||0}));
 const k=UI.lk||"rank",d=UI.ld||1;rows.sort((a,b)=>(a[k]-b[k])*d||a.rank-b.rank);const mx=Math.max(1e-9,...rows.map(r=>r[k])),shown=UI.lall?rows:rows.slice(0,20),me_=rows.find(r=>r.t===G.player),pos=rows.indexOf(me_)+1,F=LCOL2[k][1];
 const chips=Object.keys(LCOL2).map(x=>`<button class="pill${k===x?" on":""}" data-a="lsort" data-k="${x}">${LCOL2[x][0]}</button>`).join("");
 const list=shown.map((r,i)=>lr({lead:`<span class="rk">${k==="rank"&&d>0?r.rank:i+1}</span>${FL(r.t)}`,t:esc(r.n),s:k==="rank"?"people "+ppl(r.pop)+" · income "+fmt(r.inc):"rank "+r.rank,bar:k==="rank"?null:r[k]/mx,bc:r.t===G.player?"red":"dim",v:k==="rank"?r.rank+"":F(r[k]),vs:k==="rank"?"":LCOL2[k][0].toLowerCase(),cls:r.t===G.player?"me":"",a:"dipnat",d:{t:r.t}})).join("");
 const s0=`<div class="kgrid">${tl("Our place",ord(pos),"by "+LCOL2[k][0].toLowerCase()+" of "+rows.length)}${tl("The leader",F(rows[0][k]),esc(rows[0].n))}</div><div class="dfil chips" role="group" aria-label="Sort by">${chips}</div><div class="row sp"><span class="small muted">${d>0?"Low to high":"High to low"}</span><button class="btn sm" data-a="lsort" data-k="${k}">Reverse</button></div>${list}${rows.length>20?`<div class="row"><button class="btn sm" data-a="lall">${UI.lall?"Show the top 20":"Show all "+rows.length+" nations"}</button></div>`:""}`;
 return pageHTML("ledger","ledger","The ledger","Every nation, side by side",[["All","All nations",s0,{info:["The ledger","Tap a chip to sort the nations by that figure; tap again to reverse. Mills are factory levels; army and navy count units. Tap a nation for its page."]}]]);}
/* ---------- research ---------- */
function techFxTxt(t){return Object.keys(t.fx).map(k=>k==="unit"?"unlocks "+UNITS[t.fx.unit].n.toLowerCase():k==="good"?"unlocks "+GOODS[t.fx.good].n.toLowerCase():k==="rail"?"railways to level "+t.fx.rail:k+" "+(t.fx[k]>0?"+":"")+(Math.abs(t.fx[k])<.01?t.fx[k]*1e4/100+"%":Math.round(t.fx[k]*100)+"%")).join(", ");}
function pgTech(){const c=me(),y=yearOf(G.t),rp=c.stat.rp||0,cur=c.res?TF[c.res]:null,cost=cur?techCost(c,cur):0,pk=pickTech(c),eta=cur&&rp>0?Math.ceil(Math.max(0,cost-c.rp)/rp):null,Q=c.resQ||[];
 const full=Q.length>=RES_QMAX;
 const qrows=Q.map((id,i)=>{const t=TF[id];return lr({lead:`<span class="ck">${i+1}</span>`,t:esc(t.n),s:esc(techFxTxt(t))+" · "+techCost(c,t)+" points",btn:["Remove","rqdel",{id},""],btn2:[["↑","rqmv",{id,dir:-1},"",i===0,"Move up"],["↓","rqmv",{id,dir:1},"",i===Q.length-1,"Move down"]]});}).join("");
 const qbox=`<p class="small muted">Queue (${Q.length} of ${RES_QMAX}): the next study starts by itself when the current one is finished.${full?" Queue full ("+RES_QMAX+").":""}</p>${qrows}`;
 const s0=`<div class="kgrid">${tl("Research points",rp.toFixed(1),"a month",{sp:""})}${tl("Banked",Math.floor(c.rp)+"","points in hand")}${tl("Known",Object.keys(c.tech).length+"",`of ${TECHS.length} studies`)}</div>${cur?`<div class="curres"><b>${esc(cur.n)}</b><span class="small muted">${esc(techFxTxt(cur))}</span>${gz("Progress",c.rp,cost,Math.floor(c.rp)+" of "+cost,{c:"green"})}${eta!=null?note(eta===0?"Done next month.":"About "+eta+" month"+(eta===1?"":"s")+" at this pace."):""}</div>`:`<p class="calm">The scholars sit idle; points are kept for the next study. Choose a study below.</p>${pk?cta("Start "+esc(tNm(TF[pk].n)),"research",{id:pk}):""}`}${qbox}`;
 const adoption=provsOf(c.tag).flatMap(p=>p.ctl===c.tag?p.factories.map((f,i)=>({p,f,i})):[])
  .filter(({p,f})=>f.own==="state"&&ECON[c.econ].build>0&&upgCan(c,p,f).ok)
  .slice(0,6);
 const adoptionRows=adoption.map(({p,f,i})=>lr({
  t:esc(GOODS[f.g].n+" in "+p.n),
  s:esc(methOf(f.g).n[f.m||0])+" · "+esc(costTxt(upgCost(f)))+" · "+pct(.2/(1+.2*(f.m||0)))+" more theoretical output",
  btn:["Review adoption","upgask",{p:p.id,i},""]
 })).join("");
 const F=Object.keys(FIELDS).map((f,i)=>{const L=TECHS.filter(t=>t.f===f),kn=L.filter(t=>c.tech[t.id]!=null).length;
  const rows=L.map(t=>{const known=c.tech[t.id]!=null,av=techAvail(c,t);return lr({lead:`<span class="ck${known?" on":""}">${known?"✓":""}</span>`,t:esc(t.n)+(pk===t.id?' <span class="tag gold">minister’s pick</span>':""),s:esc(techFxTxt(t))+" · "+t.y,v:known?"known":c.res===t.id?"under way":av?techCost(c,t):(t.y>y+4?"from "+(t.y-4):"later"),vs:av&&!known&&c.res!==t.id?"points":"",vc:known?"good":"",btn:av&&!known&&c.res!==t.id?["Study","research",{id:t.id},pk===t.id?"pri":""]:null,btn2:av&&!known&&c.res!==t.id?[Q.includes(t.id)?["Queued","rqadd",{id:t.id},"",true,"Already queued"]:full?["Queue full (5)","rqadd",{id:t.id},"",true,"Queue full"]:["Queue","rqadd",{id:t.id},""]]:null});}).join("");
  return[FIELDS[f],FIELDS[f],rows,{sum:kn+" of "+L.length,closed:i>0&&!L.some(t=>techAvail(c,t))}];});
 return pageHTML("tech","tech","Research","Studies, discoveries and the march of knowledge",[["Now","The scholars",s0,{info:["Research","Scholars master one technology at a time. Points come from literacy, education spending and the learned classes. Studies a few years ahead of their date cost more."]}],["Adoption","Factory adoption",adoptionRows||note("No state-owned works can adopt a new method at present.")]].concat(F));}
/* ---------- news: the chronicle of the world ---------- */
const NF=[["all","All",null],["us","About us",1],["war","War",["war"]],["dip","Diplomacy",["diplomacy"]],["pol","Politics",["politics"]],["eco","Economy",["economy","science"]]];
function pgNews(){const f=NF.find(x=>x[0]===(UI.nf||"all"))||NF[0],n=me().n,all=G.msgs.slice(0,80),m=(f[2]===1?all.filter(x=>x.txt.includes(n)):f[2]?all.filter(x=>f[2].includes(x.cat)):all).slice(0,50),b=(G.battles||[]).slice(0,20);
 const CC={war:"var(--red)",diplomacy:"var(--cobalt)",politics:"var(--gold)",economy:"var(--turq)",science:"var(--turq)"};
 const s0=`<div class="dfil chips" role="group" aria-label="Show">${NF.map(x=>`<button class="pill${x[0]===f[0]?" on":""}" data-a="nfil" data-f="${x[0]}">${x[1]}</button>`).join("")}</div>`+(m.length?m.map(x=>`<div class="nw" style="--cat:${CC[x.cat]||"var(--muted)"}"><span class="nd">${dateStr(x.t)}</span><span class="nt">${esc(x.txt)}</span></div>`).join(""):`<p class="calm">Nothing of this kind yet.</p>`);
 const s1=b.length?b.map(x=>lr({lead:FL(x.w),t:esc(x.n),s:esc(nameOf(x.w))+" defeats "+esc(nameOf(x.l))+(x.m>1?" after "+x.m+" months":""),v:x.la+"k / "+x.ld+"k",vs:"losses",cls:"nb"})).join(""):`<p class="calm">No battles yet.</p>`;
 return pageHTML("chron","chron","The chronicle","What has happened, month by month",[["News","News",s0,{info:["The chronicle","The last 80 reports. Letters that need you are in Dispatches."]}],["Battles","Battles",s1]]);}

/* ---------- the province sheet ---------- */
const CULC=["var(--red)","var(--gold)","var(--turq)","var(--cobalt)","#8a5aa8","var(--muted)"];
function sx(title,body,open,sum){return`<details class="sx"${open?" open":""}><summary><span>${title}</span>${sum?`<em>${sum}</em>`:""}${CHEV}</summary>${body}</details>`;}
function provHTML(p){const c=p.o&&G.c[p.o],pl=me(),mine=p.o===G.player,n=p.pops.length?counts(p):null,cul={};for(const q of p.pops)cul[q.c]=(cul[q.c]||0)+q.n;
 let mil=0,lit=0,tot=0;for(const q of p.pops){mil+=q.mil*q.n;lit+=q.lit*q.n;tot+=q.n;}
 const armies=G.armies.filter(a=>a.loc===p.id&&a.u.length),ctlOther=p.ctl&&p.ctl!==p.o;
 let h=`<div class="ph" data-pid="${p.id}">${p.o?`<span class="phf">${flagOf(p.o)}</span>`:`<span class="phf none"></span>`}<div class="phm"><h2>${esc(p.n)}</h2><div class="small muted">${c?esc(c.n)+(p.col===0?" colony":""):p.waste?"Wasteland":"Unclaimed land"}${ctlOther?", occupied by "+esc(nameOf(p.ctl)):""} · ${TERRAIN[p.t].n}${p.sea?" · coastal":""}</div></div><button class="x" data-a="close" aria-label="Close">×</button></div>`;
 const sceneMeta=!p.waste&&window.LC_ASSET_FN?.getProvinceSceneMeta?window.LC_ASSET_FN.getProvinceSceneMeta(p,c):null;
 if(sceneMeta){h+=`<div class="lc-scene-banner" style="background:${sceneMeta.fallbackGradient}">${sceneMeta.src?`<img src="${sceneMeta.src}" alt="${esc(sceneMeta.alt)}" onerror="this.style.display='none'">`:""}<div class="lc-scene-cap">${esc(sceneMeta.caption||p.n)}</div></div>`;}
 const administrator=indiaAdministrator(p);
 if(administrator)h+=kr("Administration",esc(administrator));
 if(!p.waste){const inf=p.infra,macc=inf?inf.marketAccess:1,neti=inf?inf.netInfra:0;
  h+=`<div class="mini"><div><span>People</span><b>${ppl(p.pop)}</b></div><div class="${tot&&mil/tot>=5?"bad":""}"><span>Militancy</span><b>${tot?(mil/tot).toFixed(1):"—"}</b></div><div><span>Literacy</span><b>${tot?pct(lit/tot):"—"}</b></div><button class="mini-tap ex${macc<.7?" bad":""}" data-a="why" data-k="access" data-p="${p.id}"><span>Access</span><b>${pct(macc)}</b></button></div>
  <div class="chipset"><span>Farms <b>${p.farm?GOODS[p.farm].n:"none"}</b></span><span>Mines <b>${p.mine?GOODS[p.mine].n:"none"}</b></span><span>Railway <b>${p.rail}</b></span><span>Infra <b>${neti>=0?"+":"−"}${Math.abs(Math.round(neti))}</b></span><span>Fort <b>${p.fort}</b></span></div>`;
  if(tot&&tot>0){const cs=Object.keys(cul).sort((a,b)=>cul[b]-cul[a]).slice(0,5);h+=sx("Peoples",`<div class="stack">${cs.map((k,i)=>`<i style="width:${cul[k]/tot*100}%;background:${CULC[i]}"></i>`).join("")}</div><div class="legp">${cs.map((k,i)=>`<span>${dot(CULC[i])}${esc(k[0].toUpperCase()+k.slice(1))}<b>${pct(cul[k]/tot)}</b></span>`).join("")}</div><p class="small muted">${PTK.filter(k=>n[k]>.5).sort((a,b)=>n[b]-n[a]).slice(0,6).map(k=>PTYPES[k].n+" "+ppl(n[k])).join(" · ")}</p>`,false,cs[0]?esc(cs[0][0].toUpperCase()+cs[0].slice(1)):"");}}
 if(p.emigrantFlow||p.immigrantFlow)h+=note("Recorded migration abroad: "+ppl(p.immigrantFlow||0)+" arrivals · "+ppl(p.emigrantFlow||0)+" departures.");
 const fl=p.factories.filter(f=>f.lv>0);
 if(fl.length||(mine&&p.ctl===p.o))h+=sx("Factories",facList(p,fl),true,fl.length+"");
 if(p.build.length)h+=sx("Under construction",p.build.map(b=>lr({t:projName(b),bar:projProgress(b),v:pct(projProgress(b))})).join(""),true,p.build.length+"");
 if(mine)h+=sx("Buildings",bldHTML(p),false);
 if(armies.length)h+=sx("Forces here",armies.map(a=>lr({lead:`<span class="ctr" style="background:${a.reb?"#222":G.c[a.o].col}">${a.u.length}</span>`,t:(a.reb?"Rebels":esc(G.c[a.o].adj))+" "+(a.naval?"fleet":"army"),s:"power "+Math.round(strength(a))})).join(""),true,armies.length+"");
 let foot="";
 if(mine&&p.ctl===p.o)foot+=`<button class="btn pri" data-a="facmenu" data-p="${p.id}">Build a factory</button><button class="btn" data-a="recmenu" data-p="${p.id}">Recruit</button>`;
 if(!p.o&&!p.waste)foot+=`<button class="btn pri" data-a="colonize" data-p="${p.id}" ${canColonize(pl,p)?"":"disabled"}>${p.colz?"Being settled by "+esc(G.c[p.colz.tag].n):"Colonize"}</button>`;if(!p.o&&!p.waste&&!p.colz&&!canColonize(pl,p))foot+=`<span class="hint">We can settle it only by land from a province of ours or from a port, and only with colonial technology.</span>`;
 if(p.o&&p.o!==G.player&&provsOf(G.player).some(m=>ADJ[m.id].includes(p.id)))foot+=`<button class="btn" data-a="fabask" data-p="${p.id}">Fabricate a claim</button>`;
 if(p.o&&p.o!==G.player)foot+=`<button class="btn" data-a="dipnat" data-t="${p.o}">${esc(c.adj||c.n)} page</button>`;
 return h+`<div class="sfoot">${foot}<button class="btn" data-a="close">Close</button></div>`;}
/* ---------- the army sheet ---------- */
function batHTML(a){if(a.naval)return"";const t=armyTag(a),r=(G.bt||[]).find(x=>x.p===a.loc&&!x.nv&&(x.a.includes(t)||x.d.includes(t))),dg=Math.floor(a.dig||0),w=Math.max(2,Math.round(10*TERRAIN[P(a.loc).t].width));
 return(r?`<div class="al bad" style="pointer-events:none">Battle in progress, ${r.m} month${r.m>1?"s":""} fought.</div>`:"")+gz("Dug in",dg,3,"level "+dg+" of 3",{c:"green"})+`<p class="small muted">The front here is ${w} brigades wide; the rest wait in reserve. A battle ends when one side cannot hold its front (four months at most). An army that stays put gains a level each month, up to 3, each making it 10% harder to hit; marching loses them.</p>`;}
function genHTML(a){if(a.naval||a.reb)return"";const c=G.c[a.o],g=a.gen,mine=a.o===G.player,L=c.leaders||[];
 let h=g?lr({t:esc(g.n),s:"General, age "+Math.floor(g.age),v:GEN_PILL(g),btn:mine&&!a.bt?["Relieve","ungen",{}]:null}):lr({t:"No general",s:"The army fights without a commander."});
 if(!mine||g||a.bt)return a.bt&&mine?h+note("Generals cannot be changed while a battle is being fought."):h;
 return h+(L.length?L.map(x=>lr({t:esc(x.n),s:"age "+Math.floor(x.age),v:GEN_PILL(x),btn:["Assign","setgen",{g:x.id}]})).join(""):note("No general is free. Leadership grows with our officers and military spending: "+Math.floor((c.lead||0)/GEN_AT*100)+"% of the way to the next one."));}
/* ---------- the peace screen ---------- */
function dealHTML(){const d=UI.deal,w=d&&G.wars.find(x=>x.id===d.w);if(!w)return`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Peace terms</h2><button class="x" data-a="close" aria-label="Close">×</button></div><p class="calm">That war is over.</p></div>`;
 const c=me(),side=w.att.includes(c.tag)?1:2,menu=dealMenu(w,side),v=dealVerdict(w,side,d.sel),foes=side===1?w.def:w.att,mine=side===1?w.att:w.def;
 const rows=menu.map(i=>{const on=d.sel.includes(i.key);return lr({cls:on?"on":"",t:esc(i.n),s:"costs "+i.cost+" war score",v:i.cost,vs:"score",btn:[on?"✓ Included":"Add","dealtog",{k:i.key},on?"pri":""]});}).join("");
 return`<div class="msheet peace" tabindex="-1"><div class="sh-h"><h2>Peace terms</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 ${PGV.peace}<div class="sides"><span>${mine.slice(0,2).map(FL).join("")}<b>${esc(nameOf(mine[0]))}</b></span><i>against</i><span>${foes.slice(0,2).map(FL).join("")}<b>${esc(nameOf(foes[0]))}</b></span></div>
 ${gz("Terms cost",v.cost,Math.max(1,v.sc),Math.round(v.cost)+" of "+Math.round(Math.max(0,v.sc))+" held",{c:v.cost>v.sc?"red":"green",mk:v.lim>0?clamp(v.lim/Math.max(1,v.sc),0,1):null})}
 <div class="verdict ${v.ok?"yes":"no"}">${esc(v.why)}</div>
 <div class="list2">${rows}</div>${note("War score is what we have won on the field. Each term costs some of it. "+esc(nameOf(foes[0]))+" accepts only what it thinks it must: the tick on the bar shows its limit.")}
 <div class="dfoot2"><button class="btn" data-a="close">Cancel</button><button class="btn pri" data-a="dealgo"${v.ok?"":" disabled"}>Propose peace</button></div></div>`;}
const showDeal=()=>modalRe(dealHTML());
/* ---------- the war declaration sheet ---------- */
function declareSheet(d){const c=me(),o=G.c[d.t];if(!o)return;const cb=cbsOf(c).find(x=>x.t===d.t&&x.k===d.k&&String(x.prov||"")===String(d.p||""))||{t:d.t,k:d.k,prov:d.p||null,why:"",cul:d.c||null},e=warEV(c,cb),inf=estInf(c,cb),back=[...new Set([...guarantors(d.t),...(o.sphere&&o.sphere!==c.tag?[o.sphere]:[]),...o.ally])].filter(x=>x!==c.tag&&G.c[x]&&G.c[x].alive),cong=crisisWorthy(c,o)&&!c.war.length,after=c.infamy+inf,sc=x=>x.score||{ind:0,mil:0};
 const busy=c.war.length&&!c.ai,truce=(c.truce[d.t]||0)>G.t;
 openModal(`<div class="msheet cf declare" tabindex="-1"><div class="sh-h"><h2>Declare war?</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 ${PGV.war}<div class="sides"><span>${FL(c.tag)}<b>${esc(c.n)}</b></span><i>against</i><span>${FL(d.t)}<b>${esc(o.n)}</b></span></div>
 <p class="goal"><b>${WARGOALS[d.k].n}${d.p?": "+esc(P(d.p).n):""}</b>${cb.why?" · "+esc(cb.why):""}</p>
 ${gz("Chance of winning",e.p,1,Math.round(e.p*100)+"%",{c:e.p<.4?"red":e.p>.6?"green":"",mk:.5})}
 <div class="pblegend"><span><i style="background:var(--red)"></i>${esc(c.n)}</span><span><i style="background:var(--line2)"></i>${esc(o.n)}</span></div>${pbRow("Army",Math.round(armyStr(c.tag)),Math.round(armyStr(d.t)))}${pbRow("Industry",sc(c).ind||0,sc(o).ind||0)}${pbRow("Navy",fleetOf(c.tag),fleetOf(d.t))}
 ${gz("Infamy after the war",after,COAL_AT*1.2,Math.round(c.infamy)+" → "+Math.round(after),{c:after>COAL_AT?"red":"",mk:COAL_AT/(COAL_AT*1.2)})}${after>COAL_AT&&c.infamy<=COAL_AT?`<div class="al bad" style="pointer-events:none">Above ${COAL_AT} our neighbours and the Great Powers will form a coalition against us.</div>`:""}
 <div class="exl">${exR("Backing "+esc(o.n),back.length?esc(back.slice(0,4).map(nameOf).join(", "))+(back.length>4?" and "+(back.length-4)+" more":""):"none")}${exR("Relations with "+esc(o.n),"fall to −80","bad")}${exR("Other nations' regard","falls by about "+Math.round(inf>0?declInf({k:d.k}):0),"bad")}${cong?exR("A congress first","3 times in 10"):""}${exR("After peace","a truce of five years")}</div>
 ${note("A war costs lives and money every month and cannot be undone. Only the war's leader can make peace.")}
 <div class="dfoot2"><button class="btn" data-a="close">Not now</button><button class="btn dng" ${DA("cf",{go:"declare",t:d.t,k:d.k,p:d.p||"",c:d.c||""})}${busy||truce?" disabled":""}>Declare war</button></div>${busy?`<p class="small bad" style="text-align:center">Finish the war we are already fighting first.</p>`:truce?`<p class="small bad" style="text-align:center">A truce holds until ${dateStr(c.truce[d.t])}.</p>`:""}</div>`);}
/* ---------- choosing a factory and units: rows with figures ---------- */
function recSheet(p){const c=me();return`<div class="ph"><div class="phm"><h2>Raise forces at ${esc(p.n)}</h2><div class="small muted">Units are paid for in goods, at once.</div></div><button class="x" data-a="close" aria-label="Close">×</button></div>${Object.keys(UNITS).filter(k=>(!UNITS[k].tech||c.tech[UNITS[k].tech])&&(UNITS[k].land||p.sea)).map(k=>lr({t:UNITS[k].n,s:"costs "+Object.keys(UNITS[k].cost).map(g=>UNITS[k].cost[g]+" "+GOODS[g].n.toLowerCase()).join(", "),btn:["Raise","recruit",{k,p:p.id},"pri"]})).join("")}<div class="sfoot"><button class="btn" data-a="close">Close</button></div>`;}
/* ---------- the actions that ask first, and the ones restyled ---------- */
Object.assign(ACT,{
 nfil:d=>{UI.nf=d.f;render();},
 dfltask:()=>{const c=me();if(c.debt<=0)return;askSheet({ti:"Default on the debt?",danger:1,lab:"Default",body:"We stop paying what we owe. The debt of "+money(c.debt)+" is wiped out, and the lenders never forget.",rows:[["Debt wiped out",money(c.debt),"good"],["Prestige","falls","bad"],["Credit market","closed for ten years","bad"],["The Great Powers","gain a reason for war","bad"]],go:["dflt",{}]});},
 unallyask:d=>{askSheet({ti:"Break the alliance?",danger:1,lab:"Break it",body:"We end our alliance with "+esc(nameOf(d.t))+". They will remember it.",rows:[["Relations with "+esc(nameOf(d.t)),"−25","bad"],["Their regard for us","−25","bad"]],go:["unally",{t:d.t}]});},
 peaceask:d=>{const w=G.wars.find(x=>x.id===d.w);if(!w)return;const c=me(),side=w.att.includes(c.tag)?1:2,s=side===1?w.ws:-w.ws,foe=nameOf((side===1?w.def:w.att)[0]);
  if(d.k==="white")askSheet({ti:"Offer white peace?",lab:"Offer peace",body:"We offer to end the war on the old borders, with nothing won or lost.",rows:[["War score now",Math.round(s).toString().replace("-","−"),s<0?"bad":"good"],["Accepted if",s>-10?"they are not winning, or the war is 24 months old":"the war is 24 months old"],["Afterwards","a truce of five years"]],go:["peace",{w:w.id,k:"white"}]});
  else askSheet({ti:"Concede the war?",danger:1,lab:"Concede",body:side===1?"We give up. "+esc(foe)+" holds, and its prestige rises.":"We give up, and "+esc(foe)+" takes what it fought for: "+WARGOALS[w.goal.k].n.toLowerCase()+(w.goal.prov?" ("+esc(P(w.goal.prov).n)+")":"")+".",rows:[["Prestige",side===1?"−5":"−5, and "+esc(foe)+" gains 5","bad"],["The war","ends at once"],["Afterwards","a truce of five years"]],go:["peace",{w:w.id,k:"concede"}]});},
 gwask:d=>{const w=GW.find(x=>x.id===d.id);if(!w)return;askSheet({ti:"Begin "+esc(w.n)+"?",lab:"Begin the work",body:esc(w.d),rows:[["Total cost",money(w.cost),"bad"],["Paid each month",money(w.cost/w.m)],["Time",w.m+" months"]].concat(w.uniq?[["Unique","whoever finishes first wins it"]]:[]),note:"The money leaves the treasury a little each month. The work cannot be cancelled.",go:["gw",{id:w.id}]});},
 decask:d=>{const x=DEC.find(y=>y.id===d.id);if(!x)return;askSheet({ti:esc(x.n),lab:"Enact",body:esc(x.d),note:"A decision is taken once and cannot be undone.",go:["dec",{id:x.id}]});},
 reformask:d=>{const r=REFORMS.find(x=>x.id===d.id),c=me(),l=c.reforms[r.id]||0,can=canReform(c,r);if(!r)return;
 const vote=r.id==="vote"?franchiseConcession(c):null;
 const bargain=vote&&!can.ok&&canReform(c,r,true).ok;
 askSheet({ti:esc(r.n),lab:bargain?"Fund transition and pass":"Pass the reform",body:esc(r.lv[l])+" becomes "+esc(r.lv[l+1])+".",rows:[["How it passes",bargain?"Moderates accept a transition grant of "+money(vote.cost):esc(can.how||can.why||"")],...(vote?[["Supporters",pct(vote.supporters)+" · extend the franchise"],["Undecided",pct(vote.undecided)+" · seek transition funds"],["Opponents",pct(vote.opponents)+" · retain restrictions"]]:[]),["Afterwards","no other reform for a year"]],note:"Reforms calm some of the people and anger others. They cannot be taken back.",off:!can.ok&&!bargain,why:esc(can.why||""),go:["reform",{id:r.id,concession:bargain?"1":"0"}]});},
 upgask:d=>{const c=me(),p=P(d.p),f=p.factories[+d.i];if(!f)return;const C=upgCost(f);askSheet({ti:"Modernize the "+GOODS[f.g].n.toLowerCase()+" works?",lab:"Modernize",body:"New methods raise output per worker in "+esc(p.n)+".",rows:[["Materials",costTxt(C),"bad"]],note:"The state buys the machinery and cement on the market as it is delivered.",go:["upg",{p:p.id,i:d.i}]});},
 fabask:d=>{const p=P(d.p);askSheet({ti:"Fabricate a claim on "+esc(p.n)+"?",lab:"Begin",body:"Our agents build a claim on the province, which becomes a cause for war.",rows:[["Time","10 months"],["Risk","a small chance of scandal: infamy +2 and relations −30"]],go:["fab",{p:p.id}]});},
 mobask:()=>{const c=me(),pl=mobPlan(c),bad=mobCan(c,pl);askSheet({ti:"Mobilize the army?",danger:1,lab:"Mobilize now",body:mobFx(c,pl),note:"The troops stay under arms until we demobilize.",off:!!bad,why:bad?esc(bad):"",go:["mobgo",{}]});},
 demask:()=>{const c=me();let n=0;for(const a of G.armies)if(a.o===c.tag&&!a.naval)for(const u of a.u)if(u.mob)n++;askSheet({ti:"Demobilize?",lab:"Demobilize",body:n+" conscript brigades are disbanded at the start of next month. The survivors go back to the farms and mines of the provinces they came from, so output recovers.",rows:[["Brigades lost in battle","do not return"],["Mobilizing again","not for three months"]],go:["demgo",{}]});},
 declareask:d=>declareSheet(d),
 declare:d=>{const c=me();if(c.war.length){toast("Finish the war we are already fighting first.");return;}const w=declareWar(c.tag,d.t,{k:d.k,tag:d.t,prov:d.p||null,cul:d.c||null,fab:false});toast(w?"War is declared.":G.card?"The Great Powers call a congress first.":"We cannot declare war on them now.");render();},
 facmenu:d=>openSheet(facSheet(P(d.p))),recmenu:d=>openSheet(recSheet(P(d.p))),
 dealopen:d=>{const w=G.wars.find(x=>x.id===d.w);if(!w)return;closeSheet();UI.deal={w:w.id,sel:w.att.includes(me().tag)?["goal"]:[]};showDeal();},
 dealtog:d=>{const s=UI.deal.sel,i=s.indexOf(d.k);if(i<0)s.push(d.k);else s.splice(i,1);showDeal();},
 dealgo:()=>{const w=G.wars.find(x=>x.id===UI.deal.w);if(!w)return;const r=peaceOffer(w,"deal",UI.deal.sel);toast(r.txt);if(r.ok){closeModal();render();}else showDeal();},
 dflt:()=>{const c=me();if(c.debt<=0)return;defaultDebt(c,true);toast("We have defaulted on our debts.");render();},
 unally:d=>{toast(unallyDo(me(),d.t).txt);render();}
});
/* old calls that went to the sheet or to confirm(): kept as thin routes */
ACT.ledger=()=>{closeModal();UI.tab="ledger";UI.dipT=null;closeSheet();render();const pg=$("#page");if(pg)pg.scrollTop=0;};
PAGES.nat=pgNat;PAGES.eco=pgEco;PAGES.pol=pgPol;PAGES.mil=pgMil;PAGES.dip=pgDip;PAGES.tech=pgTech;PAGES.chron=pgNews;PAGES.ledger=pgLedger;

ACT.subjectterms=d=>{
 const country=G.c[d.t];
 if(!country?.alive)return;
 openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Terms with ${esc(country.n)}</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 <p>Fiscal compact: the ruler pays up to 2% of income to the subject for two years.</p>
 <button class="btn" data-a="subjectoffer" data-month="${G.t}" data-serial="${issueCampaignCommand().serial}" data-t="${esc(d.t)}" data-term="compact">Offer fiscal compact</button>
 <p>Independence: the subject keeps its territory and assets. Both governments agree to a two-year truce.</p>
 <button class="btn" data-a="subjectoffer" data-month="${G.t}" data-serial="${issueCampaignCommand().serial}" data-t="${esc(d.t)}" data-term="release">Offer independence</button></div>`);
};
ACT.subjectoffer=d=>{
 const partner=G.c[d.t];
 if(!partner)return;
 const result=applyCampaignCommand({month:+d.month,serial:+d.serial,kind:"subject",target:partner.tag,term:d.term});
 closeModal();
 autosave();
 render();
 toast(result.txt||result.why);
};
