"use strict";
/* ================= U7: every page redesigned (Nation, Economy, Politics, Military) =================
   Shared parts first: page hero, jump chips, folding frames with an i button, tiles with sparklines,
   gauges, list rows, confirm sheets. Pages only read the game and draw. */
const VS=(b)=>`<svg class="vig" viewBox="0 0 160 92" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const PGV={
 nat:VS('<path d="M14 84h132M30 84c10-16 26-22 50-22s40 6 50 22" /><path d="M80 62V12"/><path d="M80 12c14-6 24 6 40 0v26c-16 6-26-6-40 0z" fill="var(--red)" stroke="none"/><circle cx="80" cy="10" r="2.6" fill="var(--gold)" stroke="none"/><path d="M42 84V72h8v12M104 84V70h10v14M54 84V76h6v8" stroke-width="1.6"/>'),
 eco:VS('<path d="M14 84h132"/><path d="M26 84V50l20 10V50l20 10V50l20 10V84z" fill="var(--gold-soft)"/><path d="M92 84V28h14v56M89 28h20" stroke-width="2.2"/><path d="M99 22c-6-4 4-8-1-13M110 16c-5-4 3-7-1-11" stroke-width="1.3" opacity=".6"/><circle cx="130" cy="70" r="12" fill="var(--gold-soft)"/><path d="M130 63v14M126 67h6a3 3 0 0 1 0 6h-6" stroke-width="1.6"/><path d="M36 74h6M52 74h6M68 74h6" stroke-width="1.6"/>'),
 pol:VS('<rect x="46" y="44" width="68" height="40" rx="3" fill="var(--gold-soft)"/><path d="M46 56h68M64 44V34h32v10"/><path d="M66 14h28v32H66z" fill="var(--panel)"/><path d="M72 22h16M72 28h16M72 34h10" stroke-width="1.4"/><circle cx="80" cy="70" r="3.5" fill="var(--red)" stroke="none"/><path d="M14 84h132"/>'),
 mil:VS('<path d="M14 84h132"/><path d="M40 84L64 44l24 40z" fill="var(--gold-soft)"/><path d="M64 44V84M54 84l10-24 10 24" stroke-width="1.5"/><path d="M104 84V16"/><path d="M104 16c10-4 16 4 28 0v20c-12 4-18-4-28 0z" fill="var(--red)" stroke="none"/><path d="M114 84h22M118 84v-8h14v8" stroke-width="1.6"/><circle cx="104" cy="13" r="2.4" fill="var(--gold)" stroke="none"/>'),
 dip:VS('<circle cx="80" cy="46" r="32" fill="var(--gold-soft)"/><path d="M48 46h64M80 14c14 12 14 52 0 64M80 14c-14 12-14 52 0 64M54 30c16 6 36 6 52 0M54 62c16-6 36-6 52 0" stroke-width="1.5"/><path d="M62 86h36M80 78v8" /><circle cx="80" cy="10" r="2.4" fill="var(--red)" stroke="none"/>'),
 tech:VS('<path d="M24 80c18-8 38-8 56 0 18-8 38-8 56 0V30c-18-8-38-8-56 0-18-8-38-8-56 0z" fill="var(--gold-soft)"/><path d="M80 30v50" /><path d="M36 42c12-3 24-3 34 2M36 54c12-3 24-3 34 2M90 44c10-5 22-5 34-2M90 56c10-5 22-5 34-2" stroke-width="1.3"/><path d="M80 6l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="var(--red)" stroke="none"/>'),
 chron:VS('<rect x="34" y="14" width="92" height="68" rx="2" fill="var(--panel)"/><path d="M44 28h72M44 36h30M44 44h30M44 52h30M44 60h30M82 36h34v26H82z" stroke-width="1.5"/><path d="M44 22h72" stroke-width="3"/><circle cx="99" cy="49" r="7" fill="var(--gold-soft)"/><path d="M126 30l12 6v46H34" stroke-width="1.5" opacity=".6"/>'),
 ledger:VS('<path d="M30 14h84a6 6 0 0 1 6 6v62H36a6 6 0 0 1-6-6z" fill="var(--panel)"/><path d="M30 76a6 6 0 0 1 6-6h84" /><path d="M46 62V44M60 62V34M74 62V50M88 62V28M102 62V40" stroke-width="5" stroke="var(--gold)"/><path d="M42 62h68" stroke-width="1.4"/><path d="M46 24h40" stroke-width="2"/><circle cx="102" cy="22" r="3" fill="var(--red)" stroke="none"/>'),
 peace:VS('<circle cx="80" cy="46" r="30" fill="var(--gold-soft)" opacity=".7"/><path d="M26 76c26-6 52-24 80-34" stroke-width="2.4"/><path d="M44 70c-8-10-4-18 4-20 2 10-2 14-4 20zM62 64c-8-10-4-18 4-20 2 10-2 14-4 20zM80 56c-8-10-4-18 4-20 2 10-2 14-4 20zM98 48c-8-10-4-18 4-20 2 10-2 14-4 20z" fill="var(--turq)" stroke="none"/><path d="M52 56c4-8 12-8 14 0-4 6-10 6-14 0zM70 48c4-8 12-8 14 0-4 6-10 6-14 0zM88 40c4-8 12-8 14 0-4 6-10 6-14 0z" fill="var(--turq)" stroke="none" opacity=".8"/><path d="M110 40c10-10 20-6 28-14-2 12-10 20-24 20z" fill="var(--panel)"/>'),
 war:VS('<path d="M40 14l60 60M120 14L60 74" stroke-width="3"/><path d="M96 70l12 12M64 70L52 82M36 10l8 0 0 8M124 10l-8 0 0 8" stroke-width="3"/><path d="M80 24c10 0 18 4 18 12 0 10-8 18-18 24-10-6-18-14-18-24 0-8 8-12 18-12z" fill="var(--red)" stroke="none"/><path d="M80 32v18M72 40h16" stroke="var(--panel)" stroke-width="2.4"/>'),
 prov:VS('<path d="M10 84h140"/><path d="M14 84c14-26 30-34 46-34s30 12 40 34M64 84c10-18 22-26 36-26s30 10 46 26" fill="var(--gold-soft)"/><path d="M92 58V40h22v18" fill="var(--panel)"/><path d="M92 40l11-9 11 9M103 31V20" /><path d="M103 20l9 3-9 3z" fill="var(--red)" stroke="none"/><path d="M26 74v-8M32 74v-10M38 74v-8" stroke="var(--turq)" stroke-width="3"/>')
};
/* a page opens with a vignette, a title, an italic line and the ornament */
const hero=(k,t,s)=>`<header class="headpiece">${PGV[k]||VIG}<h1>${t}</h1><div class="sub">${s}</div>${HEADORN}</header>`;
const DA=(a,d)=>`data-a="${a}"`+Object.keys(d||{}).map(k=>` data-${k}="${esc(d[k])}"`).join("");
/* the i button: long explanations live behind it */
const INFO=(ti,x)=>`<button class="inf" data-a="info" data-ti="${esc(ti)}" data-x="${esc(x)}" aria-label="What this means: ${esc(ti)}"><span>i</span></button>`;
/* a folding frame; o: {info:[title,text], sum:"short text shown beside the title", closed:1} */
function fr(pg,i,title,body,o){o=o||{};const key=pg+":"+title,F=FOLDS(),col=F[key]===undefined?!!o.closed:F[key]===true;
 return`<section class="frame${col?" collapsed":""}" data-si="${i}"><h2 class="foldh" data-a="fold" data-k="${esc(key)}" role="button" tabindex="0" aria-expanded="${!col}"><span class="ft">${esc(title)}</span>${o.sum?`<span class="fsum">${o.sum}</span>`:""}${o.info?INFO(o.info[0],o.info[1]):""}${CHEV}</h2>${body}</section>`;}
/* a whole page: hero, tips, optional lead block, jump chips, frames. secs: [chip, title, body, opts] */
function pageHTML(pg,vig,title,sub,secs,o){o=o||{};secs=secs.filter(s=>s);
 const nav=secs.length>2?`<nav class="jumpbar" aria-label="Sections on this page">${secs.map((s,i)=>`<button data-a="jumpsec" data-i="${i}">${s[0]}</button>`).join("")}</nav>`:"";
 return hero(vig,title,sub)+(o.pre||"")+coachHTML(pg)+nav+secs.map((s,i)=>fr(pg,i,s[1],s[2],s[3])).join("")+TAILORN;}
/* sparkline: values oldest first */
function spark(v,o){v=(v||[]).filter(x=>x!=null&&isFinite(x));if(v.length<3)return"";const lo=Math.min(...v),hi=Math.max(...v),W=72,H=24,n=v.length,X=i=>(2+i/(n-1)*(W-4)).toFixed(1),Y=x=>(hi-lo<1e-9?H/2:H-3-(x-lo)/(hi-lo)*(H-6)).toFixed(1);
 return`<svg class="sp${o&&o.bad?" bad":""}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${v.map((x,i)=>(i?"L":"M")+X(i)+" "+Y(x)).join("")}"/><circle cx="${X(n-1)}" cy="${Y(v[n-1])}" r="2.2"/></svg>`;}
const hv=(t,k,neg)=>{const h=G.hist&&G.hist.n[t];return h&&h[k]?h[k].filter(x=>x!=null).map(x=>neg?-x:x):[];};
/* a tile: o {bad, good, a, d, ex, sp} */
function tl(k,v,d,o){o=o||{};const a=o.ex?"why":o.a,dd=o.ex?{k:o.ex}:o.d,t=a?"button":"div";
 return`<${t} class="kpi${a?" tap":""}${o.ex?" ex":""}${o.bad?" bad":""}${o.good?" ok":""}"${a?" "+DA(a,dd):""}><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d||""}</span>${o.sp||""}</${t}>`;}
/* a gauge row: label, bar, right-aligned number. o {c: red|green|dim, mk: marker 0..1, a, d} */
function gz(l,v,mx,txt,o){o=o||{};const p=clamp(mx>0?v/mx:0,0,1),h=`<span class="gl">${l}</span><span class="meter ${o.c||""}"><i style="width:${(p*100).toFixed(0)}%"></i>${o.mk!=null?`<u style="left:${(clamp(o.mk,0,1)*100).toFixed(0)}%"></u>`:""}</span><em>${txt}</em>`;
 return o.a?`<button class="gz tap" ${DA(o.a,o.d)}>${h}</button>`:`<div class="gz">${h}</div>`;}
/* a list row: {lead, t, s, v, vs, vc, bar:[0..1], bc, a, d, btn:[label, act, data, class, disabled, why]} */
function lr(o){const inner=`${o.lead?`<span class="ll">${o.lead}</span>`:""}<span class="lm"><b>${o.t}</b>${o.s?`<small>${o.s}</small>`:""}${o.mid||""}${o.bar!=null?`<span class="meter ${o.bc||""}"><i style="width:${(clamp(o.bar,0,1)*100).toFixed(0)}%"></i></span>`:""}</span>${o.v!=null?`<span class="rv ${o.vc||""}">${o.v}${o.vs?`<small>${o.vs}</small>`:""}</span>`:""}`;
 const b=(o.btn?`<button class="btn sm ${o.btn[3]||""}" ${DA(o.btn[1],o.btn[2])}${o.btn[4]?" disabled":""}>${o.btn[0]}</button>`:"")+(o.btn2||[]).map(x=>`<button class="btn sm ${x[3]||""}" ${DA(x[1],x[2])}${x[4]?" disabled":""}${x[5]?` aria-label="${x[5]}"`:""}>${x[0]}</button>`).join("");
 return`<div class="lr${o.cls?" "+o.cls:""}">${o.a?`<button class="lrb" ${DA(o.a,o.d)}>${inner}</button>`:`<div class="lrb">${inner}</div>`}${b}</div>${o.btn&&o.btn[4]&&o.btn[5]?`<div class="why">${o.btn[5]}</div>`:""}`;}
const kr=(k,v,c)=>`<div class="kr"><span>${k}</span><b class="${c||""}">${v}</b></div>`;
const cta=(label,a,d,o)=>{o=o||{};return`<div class="cta"><button class="btn ${o.sec?"":o.dng?"dng":"pri"}" ${DA(a,d)}${o.off?" disabled":""}>${label}</button>${o.off&&o.why?`<small>${o.why}</small>`:""}</div>`;};
const note=t=>`<p class="small muted">${t}</p>`;
const FL=t=>`<span class="fl2">${flagOf(t)}</span>`;
const dot=c=>`<i class="dt2" style="background:${c}"></i>`;
/* confirm sheet for anything that cannot be undone: it says what it costs, and the red button does it */
function askSheet(o){const g=o.go||["close",{}];
 openModal(`<div class="msheet cf" tabindex="-1"><div class="sh-h"><h2>${o.ti}</h2><button class="x" data-a="close" aria-label="Close">×</button></div>${o.lead||""}${o.body?`<p>${o.body}</p>`:""}${o.rows?`<div class="exl">${o.rows.map(r=>exR(r[0],r[1],r[2])).join("")}</div>`:""}${o.note?`<p class="small muted">${o.note}</p>`:""}<div class="dfoot2"><button class="btn" data-a="close">${o.cancel||"Not now"}</button><button class="btn ${o.danger?"dng":"pri"}" ${DA("cf",Object.assign({go:g[0]},g[1]))}${o.off?" disabled":""}>${o.lab}</button></div>${o.off&&o.why?`<p class="small bad" style="text-align:center">${o.why}</p>`:""}</div>`);}
Object.assign(ACT,{cf:(d,el)=>{closeModal();const f=ACT[d.go];if(f)f(d,el);},
 info:d=>openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>${esc(d.ti)}</h2><button class="x" data-a="close" aria-label="Close">×</button></div>${String(d.x).split("|").map(x=>`<p>${esc(x)}</p>`).join("")}</div>`)});

/* ---------- history helpers ---------- */
function slider(lbl,key,val,min,max,notes){return`<div class="sl"><div class="sl-h"><span>${lbl}</span>${notes?INFO(lbl,notes):""}<b>${Math.round(val*100)}%</b></div><input type="range" min="${min}" max="${max}" value="${Math.round(val*100)}" data-c="${key}" aria-label="${esc(lbl)}"></div>`;}
function histBody(c){const t=c.tag,L=(s,o)=>lineChart(natSeries(t,s[0],s[1]),o);
 return`<h3>People</h3>${L(["pop","People"],{fmt:(v,sp)=>v>=1e3?(v/1e3).toFixed(sp<8000?1:0)+"M":Math.round(v)+"k",label:"Population by year"})}<h3>National income</h3>${L(["inc","Income"],{fmt:v=>money(v),label:"National income by year"})}<h3>Factory levels</h3>${L(["fac","Levels"],{fmt:v=>String(Math.round(v)),zero:1,label:"Factory levels by year"})}<h3>Rank among nations</h3>${lineChart(natSeries(t,"rank","Rank").map(s=>({n:s.n,i:s.i,v:s.v.map(v=>v?-v:v)})),{fmt:v=>"#"+Math.round(-v),label:"Rank by year"})}`;}

/* ================= THE NATION ================= */
function pgNat(){const c=me(),st=c.stat||{},N=st.N||{},tag=c.tag,nf=natFig(c),net=st.net||0,rank=G.rank.indexOf(tag)+1,inc=(st.gdp||0)*12,cl=creditLimit(c),mh=(G.mh||[]),tx=st.taxes||0,tf=st.tariffs||0,tin=tx+tf,pay=st.pay||0,gov=st.gov||0,itr=st.interest||0,mx=Math.max(tin,pay+gov+itr,1),run=net<0&&c.tr>0?Math.floor(c.tr/-net):null,H=G.hist&&G.hist.n[tag]||{};
 const s0=`<div class="kgrid">${tl("Rank",ord(rank),isGP(tag)?"a Great Power":"among the nations",{ex:"rank",sp:spark(hv(tag,"rank",1))})}${tl("People",ppl(st.pop||0),"literacy "+pct(st.lit||0),{sp:spark(H.pop)})}${tl("National income",money(inc),"a year",{ex:"inc",sp:spark(H.inc)})}${tl("Factory levels",String(Math.round(sum(provsOf(tag),p=>sum(p.factories,f=>f.lv)))),"across the land",{a:"tab",d:{t:"eco"},sp:spark(H.fac)})}</div>
 <div class="facts">${kr("Government",esc(GOVS[c.gov].n))}${kr("Ruling party",esc(IDEOS[c.ideo].n))}${kr("Economy",esc(ECON[c.econ].n))}${kr("Trade policy",esc(TRADE[c.trade].n))}${kr("Status",c.civ?"Civilized":"Unrecognized",c.civ?"good":"bad")}</div>
 ${gz("Prestige",c.pres,Math.max(150,c.pres),Math.round(c.pres))}${gz("War exhaustion",c.we,100,Math.round(c.we)+" of 100",{c:c.we>=40?"red":"",mk:.5})}${gz("Infamy",c.infamy,COAL_AT*1.2,c.infamy.toFixed(1)+" of "+COAL_AT,{c:c.infamy>COAL_AT-6?"red":"",mk:COAL_AT/(COAL_AT*1.2)})}`;
 const lock=(c.noBorrow||0)>G.t?`<div class="al bad" style="pointer-events:none;margin:.4rem 0">Lenders have shut their doors on us until ${1836+Math.ceil(c.noBorrow/12)}.</div>`:"";
 const s1=`<div class="kgrid">${tl("Balance",(net>=0?"+":"−")+money(Math.abs(net)),net<0?(run!=null?"reserves last "+run+" month"+(run===1?"":"s"):"reserves are gone"):"a month, in the black",{ex:"net",bad:net<0,sp:spark(mh.map(x=>x[2]),{bad:net<0})})}${tl("Treasury",moneyS(c.tr),c.debt>0?"debt "+money(c.debt):"no debt",{ex:"net",bad:c.tr<0,sp:spark(mh.map(x=>x[1]),{bad:c.tr<0})})}</div>
 <h3>Coming in</h3>${gz("Taxes",tx,mx,money(tx),{c:"green"})}${gz("Tariffs",tf,mx,money(tf),{c:"green"})}<h3>Going out</h3>${gz("Pay",pay,mx,money(pay),{c:"red"})}${gz("Supplies and building",gov,mx,money(gov),{c:"red"})}${gz("Interest",itr,mx,money(itr),{c:"red"})}
 <h3>Credit</h3>${gz("Debt",c.debt,Math.max(cl,1),money(c.debt)+" of "+money(cl),{c:c.debt>.8*cl&&cl>0?"red":""})}${kr("Interest rate",pct(interestRate(c))+" a year")}${lock}
 ${net<0?cta("Adjust the taxes","jumpsec",{i:2}):""}${c.debt>0?cta("Default on the debt","dfltask",{},{sec:1}):""}`;
 const sl=(l,k,v,min,mxx,n)=>slider(l,k,v,min,mxx,n);
 const s2=`${sl("The poor","tax0",c.tax[0],0,100,"Farmers, labourers, craftsmen and soldiers. Heavy taxes here anger the most people but raise the least from each.")}${sl("The middle classes","tax1",c.tax[1],0,100,"Artisans, clerks, clergy, officials and officers. They pay well and notice it.")}${sl("The rich","tax2",c.tax[2],0,100,"Aristocrats and capitalists. They pay the most, and they invest what they keep.")}${sl("Tariff","tariff",c.tariff,0,Math.round(TRADE[c.trade].max*100),TRADE[c.trade].n+" allows up to "+pct(TRADE[c.trade].max)+". Tariffs raise money and protect home industry; they make imports dearer.")}${gz("Taxes collected",c.eff.tax,1,pct(c.eff.tax),{c:"green"})}`;
 const s3=`${sl("Education","edu",c.sp.edu,0,100,"Pays "+ppl(N.CLE||0)+" clergy and teachers. It raises literacy and research.")}${sl("Administration","adm",c.sp.adm,0,100,"Pays "+ppl(N.BUR||0)+" officials. It decides how well taxes are collected.")}${sl("Social spending","soc",c.sp.soc,0,100,"Relief, pensions and health care, if reforms allow. It calms the poor.")}${sl("Military","mil",c.sp.mil,0,100,"Pays "+ppl(N.SOL||0)+" soldiers and their officers. It buys supplies and morale.")}${gz("Administration at work",c.eff.admin,1,pct(c.eff.admin),{c:"green"})}`;
 return pageHTML("nat","nat",esc(c.n),esc(GOVS[c.gov].n)+", "+esc(IDEOS[c.ideo].n)+" rule",[
  ["State","The state of the nation",s0,{info:["Status and prestige","Prestige comes from industry, army and victories, and sets the rank.|Infamy rises when we take land. At "+COAL_AT+" our neighbours form a coalition against us.|Unrecognized nations become civilized by reaching literacy of 18% and ten technologies."]}],
  ["Budget","The budget",s1,{sum:moneyS(net),info:["Credit and default","The credit limit is about five years of income.|Defaulting wipes out the debt, but it costs prestige, closes the credit market for ten years and gives the Great Powers a reason for war. A treasury below zero for six months forces it."]}],
  ["Taxes","Taxes",s2,{info:["Taxes","Each class is taxed at its own rate. Higher rates bring in more money and anger the people taxed. The slider changes the rate at once; the effect shows next month."]}],
  ["Spending","Spending",s3,{info:["Spending","Each budget line pays a group of public servants. Cutting a line saves money now but weakens what it buys: schools, officials, relief or the army."]}],
  ["History","Over the years",histBody(c),{closed:1}]]);}

/* ================= THE ECONOMY ================= */
function ecoPriceChart(){const c=me(),H=G.hist,sel=(UI.cg||CG0).filter(g=>GOODS[g]);const chips=GK.filter(g=>goodOK(c,g)).map(g=>`<button class="pill${sel.includes(g)?" on":""}" data-a="chgood" data-g="${g}">${GOODS[g].n}</button>`).join("");
 const ser=H?sel.slice(0,6).map(g=>({n:GOODS[g].n,v:H.pr[g]||[],i:0})):[];
 return`<p class="small muted">Against the 1836 price. The dashed line is 1.0.</p>${lineChart(ser,{base:1,fmt:v=>v.toFixed(1),legend:1,label:"Price index by year"})}<div class="dfil chips">${chips}</div>`;}
function tradeRows(m,imp,c){const rows=Object.keys(m).map(g=>[g,m[g][0]*G.price[g],m[g][1]*G.price[g]]).sort((a,b)=>b[1]-a[1]).slice(0,7),mx=Math.max(1,...rows.map(r=>r[1]));
 return rows.length?rows.map(([g,v,sv])=>lr({t:GOODS[g].n,s:sv>v*.05?(imp?"from":"to")+" sphere partner, no tariff":"",bar:v/mx,bc:imp?"red":"green",v:money(v)})).join(""):note("None.");}
function pgEco(){const c=me(),st=c.stat||{},N=st.N||{},tag=c.tag,H=G.hist&&G.hist.n[tag]||{},nf=natFig(c);let ef=0,nn=0;for(const p of provsOf(tag))for(const q of p.pops)if(PTYPES[q.t].s===0){ef+=q.ed*q.n;nn+=q.n;}
 const inc=(st.gdp||0)*12,L=[];for(const p of provsOf(tag))for(const b of p.build)L.push([p,b]);
 const fac={};for(const p of provsOf(tag))for(const f of p.factories)if(f.lv>0)fac[f.g]=(fac[f.g]||0)+f.lv;
 const lead=c.sphere&&G.c[c.sphere]?G.c[c.sphere]:null,isl=Object.keys(G.c).filter(t=>G.c[t].alive&&G.c[t].sphere===tag).length;
 const workforce=provsOf(tag).map(p=>{
  const h=provincialHouseholds(p);
  const local=p.localMarket?Object.entries(p.localMarket).map(([g,r])=>
   kr(gnm(g),pct(r.fill)+" allocated · "+money((r.basePaid+r.freightPaid)/Math.max(r.purchased,1e-9))+" average paid · "+money(r.freightPaid)+" freight")
  ).join(""):"";
  const land=p.landUse;
  const employers=p.factories.filter(f=>f.employerAccount).map(f=>{
   const a=f.employerAccount;
   return `<h4>${esc(gnm(f.g))}</h4>${kr("Sales",money(a.revenue))}
    ${kr("Input costs",money(a.inputs))}${kr("Wages",money(a.wages))}${kr("Operating profit",money(a.profit))}`;
  }).join("");
  const landRows=land?`<h4>Farm capacity in labour units</h4>${kr("Subsistence use",ppl(land.subsistence))}
   ${kr("Commercial use",ppl(land.commercial))}${kr("Unused capacity",ppl(land.fallow))}`:"";
  return `<section><h3>${esc(p.n)}</h3>${kr("Subsistence population",ppl(h.subsistence))}
   ${kr("Craft workers",ppl(h.craft))}${kr("Clerks",ppl(h.clerks))}
   ${kr("Craft vacancies",ppl(h.craftVacancies))}${kr("Clerk vacancies",ppl(h.clerkVacancies))}
   ${kr("Qualified artisans available for clerical work",ppl(h.qualifiedArtisans))}
   ${kr("Household income",money(h.income))}${kr("Household taxes",money(h.tax))}
   ${kr("Household purchases",money(h.spending))}${landRows}${employers}${local?`<h4>Local household markets</h4>${local}`:""}</section>`;
 }).join("");
 const company=c.companyBudget,companyAccounts=tag==="GBR"&&company?
  `<section><h3>India administration accounts</h3>${kr("District tax collections",money(company.taxes))}
   ${kr("Revenue retained by the Company",money(company.retained))}${kr("Remitted to Britain",money(company.remitted))}
   ${kr("Company payroll",money(company.spent))}${kr("Company reserve",money(company.reserve))}
   ${company.transferred?kr("Reserve transferred to Crown",money(company.transferred)):""}</section>`:"";
 const activeRoutes=(G.tradeRoutes||[]).filter(r=>r.buyer===tag&&r.until>G.t);
 const tradePolicy=`<section><h3>Import policy</h3>
  ${activeRoutes.length?activeRoutes.map(r=>`<p>Transit from ${esc(nameOf(r.seller))} · ${esc(GOODS[r.good].n)} · ends ${dateStr(r.until)}</p>`).join("")+(c.commercialRoute?.until>G.t?`<button class="btn sm" data-a="renewroute">Request renewal</button>`:""):""}
  <label>Commercial partner <select id="route-seller">${Object.values(G.c).filter(x=>x.alive&&x!==c).map(x=>`<option value="${x.tag}">${esc(x.n)}</option>`).join("")}</select></label>
  <label>Good <select id="route-good">${GK.map(g=>`<option value="${g}">${esc(GOODS[g].n)}</option>`).join("")}</select></label>
  <button class="btn sm" data-a="commercialroute">Offer transit</button><p class="small muted">A controlled freight depot is required to receive shipments. Multiple routes are supported.</p>
  ${(G.tradeReceipts||[]).filter(r=>r.buyer===tag||r.seller===tag).map(r=>kr(GOODS[r.good].n,Math.round(r.quantity)+" units · "+money(r.value)+" goods"+(r.fee!=null?" · "+money(r.fee)+" treasury fee":""))).join("")}
  <p>Customs offices preserve more access to non-priority imports.</p>
  ${IMPORT_POLICIES.map(policy=>`<button class="btn sm" data-a="importpolicy" data-policy="${policy}" aria-pressed="${(c.importPolicy||"balanced")===policy}">${({balanced:"Balanced",industry:"Industry first",essentials:"Essentials first"})[policy]}</button>`).join("")}
  ${kr("Interest paid",money(st.interest||0))}${kr("Net change in debt",money(st.debtChange||0))}${(c.debt||0)>0?`<div class="cta"><button class="btn pri" data-a="repayall">Repay all loans</button></div>`:""}
  ${kr("Foreign dividends received",money(st.dividendsIn||0))}${kr("Dividends remitted abroad",money(st.dividendsOut||0))}</section>`;
 const pool=c.investmentPool||{balance:c.inv||0,monthlyContribution:0,monthlySpent:0};
 const s0=`<div class="kgrid">${tl("National income",money(inc),"a year",{ex:"inc",sp:spark(H.inc)})}${tl("Investment pool",money(pool.balance),"+"+money(pool.monthlyContribution)+" in · "+money(pool.monthlySpent)+" built")}${tl("Market access",pct(c.access??1),c.blk&&c.blk.share>.02?pct(c.blk.share)+" blockaded":"network throughput",{ex:"access",bad:(c.access??1)<.7})}${tl("Trade balance",money(st.exp||0),"vs "+money(st.imp||0)+" imports",{a:"jumpsec",d:{i:4}})}</div>
  ${gz("Life needs of the poor",nf.poor,1,pct(nf.poor),{c:nf.poor<.6?"red":"green",mk:.6})}${gz("Everyday needs of the poor",nn?ef/nn:0,1,pct(nn?ef/nn:0),{c:"green"})}${kr("Factory workers",ppl(N.CRA||0))}${kr("Immigrants",ppl(st.immig||0))}${workforce?`<details><summary>Provincial markets and households</summary>${workforce}</details>`:""}${tradePolicy}${companyAccounts}`;
 const mn=BR().all.find(r=>r.id==="fac"),slots=Math.max(2,Math.min(10,2+Math.floor(provsOf(tag).filter(p=>p.ctl===p.o&&p.col).length/4)));
 const gwst=GW.map(w=>[w,gwState(c,w),c.gw&&c.gw[w.id]]);
 const s1=`${L.length?L.map(([p,b])=>lr({t:projName(b),s:"in "+esc(p.n),bar:projProgress(b),v:pct(projProgress(b))})).join(""):`<p class="calm">Nothing is being built.</p>`}${gz("Works under way",L.length,slots,L.length+" of "+slots+" at a time")}
  ${mn?cta("Build "+gnm(mn.d.g)+" in "+esc(P(mn.d.p).n),"facmenu",{p:mn.d.p}):cta("Choose a province on the map","tab",{t:"map"},{sec:1})}
  <h3>Buildings and great works</h3>${cta("Open Works: what to build next","tab",{t:"works"},{sec:1})}`;
 const fk=Object.keys(fac).sort((a,b)=>fac[b]-fac[a]),fm=Math.max(1,...fk.map(g=>fac[g]));
 const s2=fk.length?fk.map(g=>{const m=facMargin(c,g);return lr({t:GOODS[g].n,s:r2(fac[g])+" levels",bar:fac[g]/fm,v:pct(m),vs:"margin",vc:m<.1?"bad":""});}).join("")+(modernLine(c)?note(modernLine(c)):""):`<p class="calm">No factories yet.</p>`;
 const mk=GK.filter(g=>goodOK(c,g)).map(g=>{const r=G.price[g]/GOODS[g].p;return lr({a:"why",d:{k:"price",g},t:GOODS[g].n,s:[(c.impSh&&c.impSh[g]>.05)?"import "+pct(c.impSh[g]):"",c.fill&&c.fill[g]<.95?'<span class="bad">short</span>':""].filter(x=>x).join(" · "),v:"£"+G.price[g].toFixed(2),vs:`<span class="${r>1.15?"bad":r<.85?"good":""}">${r>=1?"+":""}${Math.round((r-1)*100)}% on 1836</span>`});}).join("");
 const s4=`<div class="kgrid">${tl("Imports",money(st.imp||0),"a month")}${tl("Exports",money(st.exp||0),"a month")}</div><h3>Bought from abroad</h3>${c._tIm?tradeRows(c._tIm,1,c):note("Trade figures appear after the next month.")}<h3>Sold abroad</h3>${c._tEx?tradeRows(c._tEx,0,c):""}`;
 return pageHTML("eco","eco","The economy","Mills, markets, prices and trade",[
  ["Summary","Summary",s0],
  ["Building","Building",s1,{sum:L.length?L.length+" under way":"idle"}],
  ["Industry","Industry",s2,{info:["Industry",(ECON[c.econ].build?"The state may build factories: tap a province, then Build a factory.":"Under laissez-faire, capitalists mostly build factories. The state may still order one at a 50% premium.")+"|Capitalists invest in the goods with the best margins. A margin is what a factory earns over what its inputs cost.|Modernizing a factory (tap its province) raises output per worker."]}],
  ["Prices","Prices over the years",ecoPriceChart(),{closed:1}],
  ["Trade","Trade",s4,{info:["Trade","A month's flow, by value. "+(lead?"We are in the sphere of "+lead.n+": its goods reach us first and pay no tariff.":isl?"We lead a sphere of "+isl+" state"+(isl>1?"s":"")+": goods pass between us without tariffs.":"Spheres of the Great Powers trade among themselves without tariffs.")]}],
  ["Market","World market",`<p class="small muted">Prices against their 1836 level.</p>${mk}`,{closed:1}]]);}

/* ================= POLITICS ================= */
function stackBar(o){return`<div class="stack">${IK.filter(k=>o[k]>.01).map(k=>`<i style="width:${o[k]*100}%;background:${IDEOS[k].c}" title="${IDEOS[k].n}"></i>`).join("")}</div><div class="legp">${IK.filter(k=>o[k]>.02).sort((a,b)=>o[b]-o[a]).map(k=>`<span>${dot(IDEOS[k].c)}${IDEOS[k].n}<b>${pct(o[k])}</b></span>`).join("")}</div>`;}
function reformRow(c,r){const l=c.reforms[r.id]||0,can=canReform(c,r),n=r.lv.length-1,pips=Array.from({length:n},(_,i)=>`<i class="${i<l?"on":""}"></i>`).join("");
 return lr({t:esc(r.n),s:esc(r.lv[l]),cls:"reform",bar:null,v:`<span class="pips" aria-label="level ${l} of ${n}">${pips}</span>`,btn:l<n?[esc(r.lv[l+1]),"reformask",{id:r.id},can.ok?"pri":"",!can.ok&&r.id!=="vote",esc(can.why||"")]:null})+(l>=n?"":"");}
function pgPol(){const c=me(),uh=c.uh||upperHouse(c),lv=c.lastVote,mv=movements(c).slice(0,6),el=GOVS[c.gov].elect,sh=uh[c.ideo]||0,tag=c.tag,nf=natFig(c);
 const bill=c.landRevenue;
 const revenueBill=tag==="PUN"?`<section class="card"><h3>Land revenue bill</h3>
  ${bill?.enacted?`<p>Enacted ${bill.amended?"with the landholder amendment":"as introduced"}.</p>`:
  `<p>Transfer part of the tax burden from cultivators to landholders. An amendment reduces that transfer to win more landholder support.</p>
  <p>Support as introduced ${pct(landRevenueVote(c,false).yes)} · with amendment ${pct(landRevenueVote(c,true).yes)}</p>
  ${bill?.movement?`<p>Reform movement ${pct(bill.movement)} · the campaign survives defeat.</p>`:""}
  <button class="btn" data-a="landvote" data-amended="0" ${bill?.month===G.t?"disabled":""}>A. Vote on original bill</button>
  <button class="btn" data-a="landvote" data-amended="1" ${bill?.month===G.t?"disabled":""}>B. Vote with amendment</button>`}
  <p>Administrative reach ${pct(landRevenueVote(c,!!bill?.amended).administration)}</p>
  <h3>Standing school order</h3>${c.schoolOrder?
   `<p>${esc(P(c.schoolOrder.province).n)} · ${c.schoolOrder.queuedAt==null?"Waiting for the funding and control requirements":"Queued"}</p>`:
   `<p>Queue one school when the treasury holds two months of revenue.</p>
   ${provsOf(tag).filter(p=>p.ctl===tag&&bldCan(c,p,"school").ok).map(p=>
    `<button class="btn" data-a="schoolorder" data-p="${esc(p.id)}">${esc(p.n)}</button>`).join("")}`}
  </section>`:"";
 const s0=`<div class="kgrid">${tl("Government",esc(GOVS[c.gov].n),el?"elected":"appointed")}${tl("In power",esc(IDEOS[c.ideo].n)+"s","")}${tl("Next election",el?c.elect+" months":"none",el?"the voters decide":"the sovereign decides")}${tl("Citizenship",esc(CITIZEN[c.cit].n),"who counts as a citizen")}</div>
  ${gz("Support in the chamber",sh,1,pct(sh),{c:sh<.3?"red":"green",mk:.5})}${gz("Popular anger",nf.mil,10,nf.mil.toFixed(1)+" of 10",{c:nf.mil>=4?"red":"",mk:.4,a:"why",d:{k:"mil"}})}
  ${revenueBill}
 <h3>Upper house</h3>${stackBar(uh)}${lv?`<h3>Last election</h3>${stackBar(lv)}`:""}
  ${!c.ai?`<h3>Choose the government ${INFO("Choosing the government",el?"Under this constitution, the voters decide.":"The monarch appoints the government. Pick the party you want in power.")}</h3><div class="seg">${IK.filter(ideoOK).map(k=>`<button class="btn sm ${c.ideo===k?"on":""}" data-a="party" data-k="${k}" ${el?"disabled":""}>${IDEOS[k].n}</button>`).join("")}</div>`:""}`;
 const decs=DEC.map(d=>[d,decState(c,d)]).filter(([,s])=>s!==null&&s!=="done"),taken=(G.decDone&&G.decDone[tag]||[]);
 const s1=decs.length?decs.map(([d,s])=>lr({t:"<b>"+esc(d.n)+"</b>",s:esc(d.d)+(s==="date"?" From "+d.y+".":s==="cond"&&d.why?" "+esc(d.why(c)):""),btn:["Enact","decask",{id:d.id},s==="ok"?"pri":"",s!=="ok"]})).join("")+(taken.length?note("Taken: "+taken.map(id=>DEC.find(d=>d.id===id).n).join("; ")+"."):""):`<p class="calm">No decisions are open to us now.</p>`+(taken.length?note("Taken: "+taken.map(id=>DEC.find(d=>d.id===id).n).join("; ")+"."):"");
 const rf=k=>gz("Upper house support",reformSupport(c,k),1,pct(reformSupport(c,k)),{mk:.5,c:reformSupport(c,k)>=.5?"green":""})+gz("Popular pressure",reformPressure(c,k),2,reformPressure(c,k).toFixed(2),{mk:.6,c:reformPressure(c,k)>=1.2?"green":""})+REFORMS.filter(r=>r.k===k).map(r=>reformRow(c,r)).join("");
 const s4=mv.length?mv.map(m=>lr({t:esc(rebelName(m.key)),bar:Math.min(1,m.n/Math.max(1,(c.stat.pop||1)*.1)),bc:"red",v:ppl(m.n)})).join(""):`<p class="calm">No movement threatens the state.</p>`;
 return pageHTML("pol","pol","Politics","Parties, reforms and the mood of the people",[
  ["Government","The government",s0],
  ...(c.civ?[]:[["Modern","Modernisation",modBody(c),{sum:Math.round(c.modern||0)+"%",info:["Modernisation","Nine reforms in three tracks, paid in research points. Each raises research, lowers study costs and stirs resistance. Every card shows the five-year payoffs and the chance of revolt."]}]]),
  ["Decisions","Decisions",s1,{sum:decs.filter(x=>x[1]==="ok").length?decs.filter(x=>x[1]==="ok").length+" open":"",info:["Decisions","Each decision is a one-time choice, offered when its conditions are met."]}],
  ["Political","Political reforms",rf("p"),{info:["Reforms","A reform passes when the upper house supports it (half or more), or when popular pressure is 1.2 or higher. After one reform the government waits a year before the next."]}],
  ["Social","Social reforms",rf("s")],
  ["Movements","Movements",s4,{info:["Movements","People with militancy above 5 gather into movements; large ones rise in arms."]}]]);}

/* A6: Modernisation panel (uncivilised nations): progress, nine reforms in three tracks, payoff table per reform */
function modTbl(c,id){const t=modTable(c,id);return`<table class="modt" style="width:100%;font-size:.78em;border-collapse:collapse"><tr><th></th><th>Research</th><th>Tax</th><th>Attack</th><th>Revolt</th></tr>${t.rows.map(r=>`<tr><td>${r.l}</td><td>${r.res>=0?"+":""}${r.res}</td><td>${r.tax>=0?"+":""}${r.tax}</td><td>${r.atk}%</td><td>${r.rev}%</td></tr>`).join("")}</table><small>${t.pick===id?"Minister's pick. ":""}5 years: research points, tax pounds, a Great Power's chance to win a war, revolt within 24 months. ${esc(t.assume)}</small>`;}
function modBody(c){const m=Math.round(c.modern||0),tr={army:"Army",economy:"Economy",administration:"Administration"};let h=`<div class="kgrid">${tl("Modernisation",m+"%","of 100")}${tl("Research points",String(Math.floor(c.rp)),"shared with studies")}</div>${gz("Progress",(c.modern||0)/100,1,m+"%",{mk:.8})}${note("Westernise at 100%, or at 80% with 25% literacy. One reform every 6 months.")}`;
 for(const k of Object.keys(tr)){h+=`<h3>${tr[k]}</h3>`+MOD_REFORMS.filter(r=>r.tr===k).map(r=>{const d=modHas(c,r.id),can=modCan(c,r.id);return lr({t:esc(r.n),s:esc(r.fx)+" +"+r.pr+"%, "+r.cost+" points"+(d?". Done.":""),mid:d?"":modTbl(c,r.id),btn:d?null:["Enact","modreform",{id:r.id},can.ok?"pri":"",!can.ok],})+(d||can.ok?"":note(esc(can.why)));}).join("");}
 return h;}
/* ================= MILITARY ================= */
const GEN_PILL=g=>`<span class="pills"><span title="attack">A ${g.atk}</span><span title="defense">D ${g.def}</span><span title="marching">M ${g.mv}</span></span>`;
function mobBody(c){const m=c.mob||{st:0},pl=mobPlan(c);
 if(!m.st){const bad=mobCan(c,pl);return`<div class="kgrid">${tl("Standing army",String(pl.now),"brigades")}${tl("Could be raised",String(pl.units),"more brigades, "+ppl(pl.men)+" men")}</div>${cta("Mobilize","mobask",{},{off:!!bad,why:bad?esc(bad):""})}`;}
 let n=0;for(const a of G.armies)if(a.o===c.tag&&!a.naval)for(const u of a.u)if(u.mob)n++;let away=0;for(const k in m.tk)away+=m.tk[k][0]+m.tk[k][1];
 return`<div class="al ${m.st===3?"good":"warn"}" style="pointer-events:none">${m.st===1?"Mobilizing, month "+Math.min(2,m.ph+1)+" of 2":m.st===2?"Mobilized since "+dateStr(m.t0):"Demobilizing: the men go home at the start of next month"}.</div><div class="kgrid">${tl("Conscripts",String(n),"brigades under arms")}${tl("Away from work",ppl(away),"in the fields and mines")}</div>${m.st===3?"":cta("Demobilize","demask",{},{})}`;}
function pgMil(){thSync();const c=me(),A=G.armies.filter(a=>a.o===c.tag&&a.u.length),N=c.stat.N||{},tag=c.tag,land=A.filter(a=>!a.naval),sea=A.filter(a=>a.naval),leaders=c.leaders||[],gen=A.filter(a=>a.gen);
 const ty={inf:0,cav:0,art:0,con:0};for(const a of land)for(const u of a.u){ty[thTypeOf(u)]++;if(u.mob)ty.con++;}
 const wars=G.wars.filter(w=>w.att.includes(tag)||w.def.includes(tag)),inf=Object.values(G.c).filter(k=>k.alive&&k.blk&&k.blk.by===tag&&k.blk.share>.02),blk=c.blk&&c.blk.share>.02;
 const warBar=wars.length?wars.map(w=>{const side=w.att.includes(tag)?1:2,ws=side===1?w.ws:-w.ws,foes=(side===1?w.def:w.att).map(nameOf).join(", ");return`<div class="al ${ws<-20?"bad":"warn"}" style="pointer-events:none">At war with ${esc(foes)}: score ${Math.round(ws).toString().replace("-","−")}.</div>`;}).join(""):"";
 const s0=`${blk?`<div class="al bad" style="pointer-events:none">Our ports are blockaded by ${esc(nameOf(c.blk.by))}: ${Math.round(c.blk.share*100)}% of our coast. Trade is at ${Math.round(c.access*100)}%. Send a stronger fleet to the port to break it.</div>`:""}${warBar}
  <div class="kgrid">${tl("Infantry",String(ty.inf),ty.con?ty.con+" are conscripts":"brigades")}${tl("Cavalry",String(ty.cav),"scouts and pursuit")}${tl("Artillery",String(ty.art),"breaks trenches and forts")}${tl("Reserve",String(thBrig(tag,"res").n),"brigades at the capital")}${tl("Soldiers",ppl(N.SOL||0),"the conscription pool",{ex:"sup"})}${tl("Being raised",String((c.recq||[]).length),"in the barracks")}</div>${gz("War exhaustion",c.we,100,Math.round(c.we)+" of 100",{c:c.we>=40?"red":"",mk:.5})}${wars.length?cta("Peace terms","dealopen",{w:wars[0].id},{sec:1}):""}`;
 const mobInfo=["Mobilization",mobFx(c,mobPlan(c))];
 const s2=thHTML(c),thn=thRows(c).length;
 const s3=A.filter(a=>a.gen).map(a=>lr({t:esc(a.gen.n),s:"leads "+a.u.length+" "+(a.naval?"ships":"brigades")+(a.naval?" at "+esc(P(a.loc).n):" in "+esc(thName(a.th)))+", age "+Math.floor(a.gen.age),v:GEN_PILL(a.gen)})).join("")+leaders.map(g=>lr({t:esc(g.n),s:"no army, age "+Math.floor(g.age),v:GEN_PILL(g),vs:"free"})).join("")||`<p class="calm">We have no generals yet.</p>`;
 const navImg=window.LC_ASSETS?.pictures?.navalFleet;
 const navBanner=navImg?`<div class="lc-scene-banner" style="background:${navImg.fallbackGradient}">${navImg.src?`<img src="${navImg.src}" alt="${esc(navImg.alt)}" loading="lazy" onerror="this.style.display='none'">`:""}<div class="lc-scene-cap">Admiralty Fleet Command</div></div>`:"";
 const s4=`${navBanner}<div class="kgrid">${tl("Warships",String(sum(navFleets(tag),a=>a.u.length)),"in "+navRows(c).filter(x=>navFleets(tag).some(a=>a.sr===x)).length+" sea"+(navRows(c).filter(x=>navFleets(tag).some(a=>a.sr===x)).length===1?"":"s"))}${tl("Transports",String(sum(sea.filter(a=>!a.u.some(isWarship)),a=>a.u.length)),"carry armies")}${tl("Our blockades",String(inf.length),inf.length?"nations shut in":"none")}${tl("Blockade on us",blk?Math.round(c.blk.share*100)+"%":"none",blk?esc(nameOf(c.blk.by)):"",{bad:blk})}</div>${inf.length?inf.map(k=>lr({lead:FL(k.tag),t:esc(k.n),s:"our blockade",bar:k.blk.share,bc:"green",v:Math.round(k.blk.share*100)+"%",vs:"of its coast"})).join(""):""}${navHTML(c)}`;
 const s5=Object.keys(UNITS).filter(k=>!UNITS[k].tech||c.tech[UNITS[k].tech]).map(k=>{const U=UNITS[k],st=uStat(c,k);return lr({t:U.n,s:"costs "+Object.keys(U.cost).map(g=>U.cost[g]+" "+GOODS[g].n.toLowerCase()).join(", "),v:`<span class="pills"><span>A ${st.a.toFixed(1)}</span><span>D ${st.d.toFixed(1)}</span></span>`,btn:["Raise","recruit",{k,p:c.cap},"pri"]});}).join("")+`<label class="mvto rdest">New brigades join<select data-sel="rdest" aria-label="Where new brigades join"><option value="">Where they are raised (the capital)</option><option value="res"${c.rdest==="res"?" selected":""}>The reserve</option>${thList(tag).filter(r=>thHub(tag,r)).map(r=>`<option value="${r}"${c.rdest===r?" selected":""}>${esc(REGION[r].n)}</option>`).join("")}</select></label>`+note("Raised at the capital, then sent where you choose. Ships are raised at a port: tap the province, then Recruit.");
 return pageHTML("mil","mil","The army","Armies, fleets and commanders",[
  ["Strength","Men and supply",s0,{info:["War exhaustion","War exhaustion rises with every month of war and every defeat. At 50 the people want peace; at 100 the government may fall."]}],
  ["Mobilize","Mobilization",mobBody(c),{info:mobInfo,sum:c.mob&&c.mob.st?"under way":""}],
  ["Armies","Theatres",s2,{sum:thn?thn+"":"",info:["Theatres","The map is split into regions. Our brigades in a region form a theatre. Give each theatre a stance and, for an attack, an objective; its general does the marching. Move brigades between theatres with the Move button. Infantry holds the line, cavalry scouts and runs down a beaten enemy, and artillery cuts trenches and forts. Brigades above a province's supply limit lose strength every month."]}],
  ["Navy","Navy by station",s4,{sum:sea.length?sum(sea,a=>a.u.length)+" ships":"",info:["Navy by station","Ships are posted to a sea, not moved one by one. Each sea has a mission: Blockade, Patrol and escort, Seek battle, Support landing or Fleet in port. The ships sail to the right port by themselves each month. Send ships from one sea to another with the Send ships button."]}],
  ["Generals","Commanders",s3,{info:["Generals","Each point of attack or defense is worth 8% in battle; each point of marching makes an army 10% faster. Leadership grows with our officers and military spending: "+Math.floor((c.lead||0)/GEN_AT*100)+"% of the way to the next general. Generals are given to the biggest armies of each theatre automatically."]}],
  ["Raise","Raise forces",s5]]);}


ACT.repayall=()=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"repayall"});toast(r.txt||r.why);render();};
ACT.landvote=d=>{
 if(G.player!=="PUN")return;
 const result=voteOnLandRevenue(me(),d.amended==="1");
 if(!result)return;
 autosave();
 render();
 toast(result.enacted?"The land revenue bill passed.":"The bill failed. The reform movement remains active.");
};


ACT.schoolorder=d=>{
 const c=me(),province=P(d.p);
 if(c.tag!=="PUN"||c.schoolOrder||!province||!bldCan(c,province,"school").ok)return;
 c.schoolOrder={province:province.id};
 autosave();
 render();
 toast("Standing school order recorded.");
};


ACT.importpolicy=d=>{
 if(!IMPORT_POLICIES.includes(d.policy))return;
 me().importPolicy=d.policy;
 autosave();
 render();
};


ACT.commercialroute=()=>{
 const result=proposeCommercialTransit(me(),G.c[$("#route-seller")?.value],$("#route-good")?.value);
 autosave();
 render();
 toast(result);
};


ACT.renewroute=()=>{
 const route=me().commercialRoute,seller=route&&G.c[route.seller];
 if(!seller)return;
 const result=proposeCommercialTransit(me(),seller,route.good,true);
 autosave();render();toast(result);
};
