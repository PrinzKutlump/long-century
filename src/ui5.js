"use strict";
/* ================= U7 (title page), U8 (the map) and U9 (comfort) ================= */
/* ---------- options kept in the browser ---------- */
let OPT_=null;const OPT=(k,d)=>{if(!OPT_){try{OPT_=JSON.parse(localStorage.getItem("vic.opt")||"{}")||{};}catch(e){OPT_={};}}return OPT_[k]===undefined?d:OPT_[k];};
const OPTS=(k,v)=>{OPT(k);OPT_[k]=v;try{localStorage.setItem("vic.opt",JSON.stringify(OPT_));}catch(e){}};
/* ================= THE TITLE PAGE ================= */
const SITU={GBR:"The workshop of the world, with the strongest fleet afloat. Keep the empire fed and the new towns quiet.",FRA:"A liberal kingdom with a big army, a restless Paris and old quarrels with Britain.",RUS:"A vast empire with the largest army and hardly any industry: serfs, snow and distance.",AUS:"The old heart of Europe, a patchwork of peoples held together by the throne.",PRU:"A drilled and ambitious kingdom at the head of a customs union, and the likely maker of a united Germany.",USA:"A young republic with endless land and fast growth, and a quarrel over slavery that will not go away.",CHI:"The largest nation on earth: rich in people, poor in guns, and the foreign merchants are coming.",OTT:"A great empire in slow decline, pressed by Russia and by its own provinces. Reform or fall.",NED:"A rich trading kingdom with an eastern empire and a small army.",SPA:"An old empire in civil war and debt, with colonies still across the sea.",BEL:"A new, small, industrial kingdom: coal, iron, and a guarantee from the Powers.",EGY:"Muhammad Ali's strong, modernizing state, ready to quarrel with the Sultan.",SWE:"A quiet northern kingdom with a long coast, a thin purse and a wish to be left alone.",POR:"A faded seafaring kingdom with colonies in Africa and Asia and a weak home economy.",PUN:"The Sikh kingdom: a fine army, a rich land, and the British closing in.",SAR:"The Italian kingdom with the best army and a free spirit: the seed of unification.",BRA:"A vast young empire of coffee and slaves, ruled in a boy emperor's name.",JAP:"A closed island country under the shogun. Foreign ships will soon arrive.",DEN:"A small kingdom with an old empire and a quarrel with the Germans in the south.",SIC:"A large, poor southern kingdom with a harsh government, ripe for revolution.",PAP:"The Pope's own state, held up by foreign bayonets.",MEX:"A republic in turmoil, with Texas restless and the northern frontier undefended.",GRE:"A tiny new kingdom that dreams of gathering all the Greeks.",SWI:"A neutral league of cantons: no empire, but good defences and a free press.",TEX:"A frontier republic of settlers, newly independent and very small.",TRN:"Farmers on the high veld, outnumbered and free.",ETH:"A mountain empire of ancient faith, split among regional lords.",PER:"An old empire between Russia and Britain, weak at the centre.",KOR:"The hermit kingdom, closed to all but China.",DAI:"A strong southern empire with a proud army and a closed door.",SIA:"A balanced, clever kingdom between the British and the French.",TUS:"A mild, cultured grand duchy among the Italian states.",SER:"A principality on the Ottoman border, half free and half bound."};
const GERMAN=new Set(["BAV","WUR","SAX","HAN"]),LATIN=new Set(["CHL","ARG","PEU","CLM","UCA","VNZ","ECU","PRG","URU","BOL"]);
function situation(t){const c=G.c[t];if(SITU[t])return SITU[t];if(GERMAN.has(t))return"A German kingdom in the customs union, which Prussia and Austria both want to lead.";if(LATIN.has(t))return"A young republic, short of money and quarrelling over its borders.";if(!c.civ)return"Not yet recognized as civilized: modernize fast, or the Powers will carve it up.";const p=popOf(t);return p<3000?"A small state among larger neighbours: guard it with treaties and clever diplomacy.":"A middling state with room to grow: build industry and choose your friends with care.";}
const DIFFO={RUS:"Medium",AUS:"Medium",OTT:"Hard",CHI:"Hard",JAP:"Medium",EGY:"Hard"};
function difficulty(t){const i=G.rank.indexOf(t)+1,c=G.c[t];return DIFFO[t]||(i<=6?"Easy":i<=31&&(c.civ||i<=10)?"Medium":"Hard");}
function saveMeta(k){try{return JSON.parse(SAVES.get(k)||"null");}catch(e){return null;}}
function showStart(){setPlay(0);const old=$("#start");if(old)old.remove();newGame(null,Date.now()%100000);const d=document.createElement("div");d.id="start";
 const L=G.rank.filter(t=>G.c[t].alive),grp=[["The Great Powers",L.filter(isGP)],["Secondary powers",L.filter(t=>G.sec.includes(t))],["The rest of the world",L.filter(t=>!isGP(t)&&!G.sec.includes(t))]];
 const am=saveMeta("vic.autoM"),has=(()=>{try{return!!SAVES.get("vic.auto");}catch(e){return false;}})(),slots=[1,2,3].map(i=>[i,saveMeta("vic.s"+i+"m")]).filter(x=>x[1]);
 d.innerHTML=`<div class="band" aria-hidden="true"></div><div class="titlepage">${skyline()}<div class="tkicker">A chronicle of the long nineteenth century</div><h1>The Long Century</h1>
 ${typeof LC_BUILD_NUMBER !== "undefined" && LC_BUILD_NUMBER ? `<p class="tdates">Build ${LC_BUILD_NUMBER}</p>` : ""}<div class="tsub">A hundred years of change</div>${HEADORN}<p class="etext">January 1836. The railways are only beginning, the great empires are old, and the factory is a new thing. Within a century the world will be unrecognizable. Lead one of sixty-two nations through industry, reform and war, and try to leave yours stronger than you found it.</p><p class="small muted">Each month, read the dispatches, set your policy, and press End month.</p>
 ${has?`<div class="tbtns"><button class="btn pri" data-a="cont">Continue${am?": "+esc(am.n)+", "+esc(am.d):""}</button></div>`:""}${slots.length?`<h3 style="margin:.6rem 0 0">Saved games</h3>${slots.map(([i,m])=>`<div class="slot"><div class="lm"><b>Slot ${i}: ${esc(m.n)}</b><small>${esc(m.d)}</small></div><button class="btn sm" data-a="slotload" data-s="${i}">Load</button></div>`).join("")}`:""}
 <div class="scen">Choose your nation</div><div class="tdates">January 1836 to 1936</div>
 <div class="dfil chips" role="group" aria-label="Difficulty"><button class="pill on" data-a="tdif" data-f="all">All</button><button class="pill" data-a="tdif" data-f="Easy">Easy</button><button class="pill" data-a="tdif" data-f="Medium">Medium</button><button class="pill" data-a="tdif" data-f="Hard">Hard</button></div></div>
 <div class="natlist" id="natlist" data-f="all">`+grp.map(([h,ts])=>`<div class="sechead">${h}</div>`+ts.map(t=>{const c=G.c[t],df=difficulty(t),n=provsOf(t).length;
  return`<button class="ncard" data-a="pick" data-t="${t}" data-dif="${df}"><div class="nh">${flagSVG(t,"flag")}<div><b>${esc(c.n)}</b><small>${esc(GOVS[c.gov].n)}${c.civ?"":", unrecognized"}</small></div><span class="dif ${df.toLowerCase()}">${df}</span></div><div class="nm"><div><span>People</span><b>${ppl(popOf(t))}</b></div><div><span>Rank</span><b>${ord(G.rank.indexOf(t)+1)}</b></div><div><span>Lands</span><b>${n} province${n>1?"s":""}</b></div></div><p>${esc(situation(t))}</p></button>`;}).join("")).join("")+`</div>`;
 document.body.appendChild(d);}
Object.assign(ACT,{tdif:d=>{const nl=$("#natlist");nl.dataset.f=d.f;document.querySelectorAll("#start .dfil .pill").forEach(b=>b.classList.toggle("on",b.dataset.f===d.f));let any=false;const hs=[...nl.children];hs.forEach((e,i)=>{if(e.classList.contains("sechead")){let v=false;for(let j=i+1;j<hs.length&&!hs[j].classList.contains("sechead");j++)if(d.f==="all"||hs[j].dataset.dif===d.f)v=true;e.style.display=v?"":"none";}else e.style.display=d.f==="all"||e.dataset.dif===d.f?"":"none";});}});

/* ================= THE MAP (U8) ================= */
const mapRect=()=>UI.mr=$("#map").getBoundingClientRect();
const MAPIC={idle:'<path d="M4 4l11 11M20 4L9 15M13 17l4 4M11 17l-4 4"/>',find:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',cap:'<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>'};
const mic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${MAPIC[k]}</svg>`;
function buildMap(){WP={};for(const w of WORLD.provs)WP[w.id]=w;UI._fl=null;UI._sc=0;UI._lbk="";UI._llk="";
 const s=[`<svg id="svg" viewBox="0 0 ${WORLD.w} ${WORLD.h}" preserveAspectRatio="xMidYMid meet"><defs id="fdefs"></defs><defs id="fdefs2"></defs><rect x="-2000" y="-2000" width="${WORLD.w+4000}" height="${WORLD.h+4000}" fill="var(--sea)"/><g id="pvs">`];
 for(const w of WORLD.provs)s.push(`<path class="pv" id="pv-${w.id}" data-p="${w.id}" d="${w.d}"/>`);s.push(`</g><g id="bmov"></g><g id="plbl"></g><g id="lbls"></g><g id="ths"></g><g id="fronts"></g><g id="arrows"></g><g id="bats"></g><g id="units"></g><g id="bmcr"></g></svg>`);
 $("#map").innerHTML=s.join("")+`<div id="mapbtns"><div id="zoom"><button class="btn" data-a="zoom" data-z="1" aria-label="Zoom in">+</button><button class="btn" data-a="zoom" data-z="-1" aria-label="Zoom out">−</button></div><button class="btn" data-a="capital" aria-label="Go to the capital">${mic("cap")}</button><button class="btn" data-a="nextth" aria-label="Next theatre needing orders">${mic("idle")}<span class="bdg" id="idlen" hidden></span></button><button class="btn" data-a="findprovince" aria-label="Find a province">${mic("find")}</button><button class="btn" id="bmbtn" data-a="bmopen" aria-label="Build: choose a project and select provinces">${ic("works")}</button></div><div id="bmstack"><div id="bmtop" hidden></div><div id="bmundo" role="status" hidden></div></div><div id="bmbot" hidden></div><div id="mapfoot"><div id="lens"><button class="btn lensb" id="lensb" data-a="lens" aria-haspopup="true" aria-expanded="false" aria-label="Map lens"><span class="lk">Lens</span><b id="lensn"></b>${CHEV}</button><div id="lenspop" role="menu" aria-label="Map lens" hidden>${Object.keys(MODES).map(k=>`<button class="btn" role="menuitem" data-a="mode" data-m="${k}">${MODES[k]}</button>`).join("")}</div></div><div id="legend" class="${OPT("lgmin",1)?"min":""}"></div></div>`;
 const c=me(),cap=P(c.cap),r=mapRect(),w0=r.width<700?380:900;UI.view={w:w0,h:w0*r.height/Math.max(1,r.width)};UI.view.x=cap.x-UI.view.w/2;UI.view.y=cap.y-UI.view.h*.4;applyView();bindMap();}
function applyView(){const v=UI.view,svg=$("#svg");if(!svg)return;const r=UI.mr&&UI.mr.width?UI.mr:mapRect(),asp=r.height/Math.max(1,r.width);v.w=clamp(v.w,140,WORLD.w*1.1);v.h=v.w*asp;v.x=clamp(v.x,-v.w*.5,WORLD.w-v.w*.5);v.y=clamp(v.y,-v.h*.5,WORLD.h-v.h*.5);svg.setAttribute("viewBox",`${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`);
 if($("#map").classList.contains("has-pixi"))window.LC_PIXIMAP?.syncView();
 const sc=r.width/v.w;if(Math.abs(sc-(UI._sc||0))>1e-4){UI._sc=sc;mapScale(sc);}}
/* things whose size on the screen should stay readable at every zoom */
function mapScale(sc){const u=$("#units"),sw=(3/sc).toFixed(2)+"px";if(u)u.style.setProperty("--kc",(1/sc).toFixed(4));{const bc=$("#bmcr");if(bc)bc.style.setProperty("--kc",(1/sc).toFixed(4));}for(const k of["#lbls","#plbl"]){const g=$(k);if(g)g.style.setProperty("--sw",sw);}
 if(G&&G.player)drawTheatres(0);placeLabels(sc);}
function centerOn(p,w,fy){const v=UI.view;if(w)v.w=w;applyView();v.x=p.x-v.w/2;v.y=p.y-v.h*(fy==null?.2:fy);applyView();}
function bindMap(){const el=$("#map");if(el._bound)return;el._bound=1;const pts=new Map();let start=null,moved=false,raf=0,lpT=0,lpDone=false;
 const flush=()=>{raf=0;applyView();},qv=()=>{if(!raf)raf=requestAnimationFrame(flush);};
 const at=(v,cx,cy)=>{const r=UI.mr,s=v.w/r.width;return[v.x+(cx-r.left)*s,v.y+(cy-r.top)*s];};
 el.addEventListener("pointerdown",e=>{if(e.target.closest("#pickc"))return;closeChooser();if(!e.target.closest("#lens"))closeLens();if(e.target.closest("button,#legend,#bmtop,#bmbot,#bmundo"))return;if(UI.hx)hdrX(false);mapRect();el.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1)moved=false;clearTimeout(lpT);lpDone=false;if(pts.size===1&&G.player&&UI.tab==="map"){const lx=e.clientX,ly=e.clientY;lpT=setTimeout(()=>{if(pts.size!==1||moved)return;const pe=document.elementsFromPoint(lx,ly).map(q=>q.closest("[data-p]")).find(Boolean);if(pe){lpDone=true;bmLong(pe.dataset.p);}},550);}start={v:Object.assign({},UI.view),pts:new Map(pts)};});
 el.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId)||!start)return;pts.set(e.pointerId,[e.clientX,e.clientY]);const P0=[...start.pts.values()],P1=[...pts.values()],r=UI.mr,sv=start.v;
  if(P1.length===1){const dx=P1[0][0]-P0[0][0],dy=P1[0][1]-P0[0][1];if(Math.hypot(dx,dy)>8){moved=true;clearTimeout(lpT);}if(!moved&&Math.hypot(dx,dy)<=8)return;const s=sv.w/r.width;UI.view.x=sv.x-dx*s;UI.view.y=sv.y-dy*s;qv();}
  else if(P1.length>=2&&P0.length>=2){moved=true;const d0=Math.hypot(P0[0][0]-P0[1][0],P0[0][1]-P0[1][1])||1,d1=Math.hypot(P1[0][0]-P1[1][0],P1[0][1]-P1[1][1])||1,k=clamp(d0/d1,.05,20),m0x=(P0[0][0]+P0[1][0])/2,m0y=(P0[0][1]+P0[1][1])/2,m1x=(P1[0][0]+P1[1][0])/2,m1y=(P1[0][1]+P1[1][1])/2,[sx,sy]=at(sv,m0x,m0y),nw=clamp(sv.w*k,140,WORLD.w*1.1),s=nw/r.width;
   UI.view.w=nw;UI.view.x=sx-(m1x-r.left)*s;UI.view.y=sy-(m1y-r.top)*s;qv();}});
 const up=e=>{const had=pts.delete(e.pointerId);if(!had)return;clearTimeout(lpT);if(lpDone){lpDone=false;if(!pts.size)return;}else if(!pts.size&&!moved)tapAt(e.clientX,e.clientY);if(pts.size)start={v:Object.assign({},UI.view),pts:new Map(pts)};};
 el.addEventListener("pointerup",up);el.addEventListener("pointercancel",e=>{pts.delete(e.pointerId);clearTimeout(lpT);});
 el.addEventListener("wheel",e=>{e.preventDefault();mapRect();const k=e.deltaY>0?1.18:1/1.18,[sx,sy]=at(UI.view,e.clientX,e.clientY),v=UI.view,nw=clamp(v.w*k,140,WORLD.w*1.1),s=nw/UI.mr.width;v.w=nw;v.x=sx-(e.clientX-UI.mr.left)*s;v.y=sy-(e.clientY-UI.mr.top)*s;qv();},{passive:false});
 window.addEventListener("resize",()=>{mapRect();applyView();UI._llk="";UI._lf=null;placeLabels(UI._sc);});}
function zoom(z){const v=UI.view,k=z>0?1/1.4:1.4,cx=v.x+v.w/2,cy=v.y+v.h/2;v.w*=k;applyView();v.x=cx-v.w/2;v.y=cy-v.h/2;applyView();}
/* ---------- V1.1 labels: one layout pass per zoom band, greedy on measured boxes ---------- */
/* nation anchors: area-weighted centre of each connected cluster (cached with the owners) */
function labelLayout(){const key=G.t+"|"+G.plist.map(p=>p.o||"").join("");if(UI._lbk===key)return UI._lbl;const items=[];
 for(const[t,L]of clusters()){const A=sum(L,p=>WP[p.id].a);if(A<300)continue;let cx=sum(L,p=>p.x*WP[p.id].a)/A,cy=sum(L,p=>p.y*WP[p.id].a)/A,x0=1e9,x1=-1e9,big=L[0],bd=1e18;
  for(const p of L){const h=Math.sqrt(WP[p.id].a)/2;x0=Math.min(x0,p.x-h);x1=Math.max(x1,p.x+h);const d=Math.hypot(p.x-cx,p.y-cy);if(d<bd)bd=d;if(WP[p.id].a>WP[big.id].a)big=p;}
  if(bd>Math.sqrt(WP[big.id].a)*.9){cx=big.x;cy=big.y;}
  items.push({t,nm:G.c[t].n.toUpperCase(),ab:t,pri:A,A,x:cx,y:cy,span:Math.max(40,x1-x0)*1.1,k:Math.sqrt(A)/9});}
 UI._lbk=key;return UI._lbl=items;}
function provLabelItems(){const caps=new Set(),me_=G.player;for(const t in G.c)if(G.c[t].alive&&G.c[t].cap)caps.add(G.c[t].cap);const my=me_&&G.c[me_]?G.c[me_].cap:"";
 return G.plist.filter(p=>!p.waste).map(p=>{const a=WP[p.id].a,w1=p.n.split(/ (?:&|and) /)[0].split(" ")[0];return{nm:p.n,ab:w1.length>5?w1.slice(0,4)+".":w1,pri:a*(p.id===my?60:caps.has(p.id)?6:1),x:p.x,y:p.y,span:Math.sqrt(a)*1.2,k:10};});}
/* text widths from the real font, measured once per string */
function lblFont(kind){const L=UI._lf=UI._lf||{};if(L[kind])return L[kind];const g=$(kind==="n"?"#lbls":"#plbl");g.insertAdjacentHTML("beforeend",`<text class="${kind==="n"?"lbl":"plbl"}" font-size="100">M</text>`);const t=g.lastChild;const cs=getComputedStyle(t),f={font:cs.fontWeight+" 100px "+cs.fontFamily,ls:(parseFloat(cs.letterSpacing)||0)/100,m:{}};g.removeChild(t);return L[kind]=f;}
function lblW(f,txt,px){let w=f.m[txt];if(w==null){const c=UI._lc=UI._lc||document.createElement("canvas").getContext("2d");c.font=f.font;w=f.m[txt]=c.measureText(txt).width/100+f.ls*txt.length;}return w*px;}
/* one or two lines: split at the space that leaves the two halves most even */
function lblSplit(f,nm,px){let b=null,bw=1e9;for(let i=1;i<nm.length-1;i++){if(nm[i]!==" ")continue;const a=nm.slice(0,i),c=nm.slice(i+1),w=Math.max(lblW(f,a,px),lblW(f,c,px));if(w<bw){bw=w;b=[a,c];}}return b;}
const LBL_PAD=4,LBL_LH=1.22;
function lblPass(items,kind,sc,avoid){const f=lblFont(kind),pl=(avoid||[]).slice(),out=[];items.sort((a,b)=>b.pri-a.pri);
 for(const it of items){const px=clamp(sc*it.k,11,16),cap=Math.max(kind==="n"?40:44,it.span*sc*(kind==="n"?1.5:1.9)),sp=lblSplit(f,it.nm,px);
  const cand=[];cand.push([it.nm]);if(sp)cand.push(sp);cand.push([it.ab]);
  let done=false;
  for(let vi=0;vi<cand.length&&!done;vi++){const ln=cand[vi],w=Math.max(...ln.map(s=>lblW(f,s,px))),h=ln.length*px*LBL_LH;if(vi<cand.length-1&&w>cap)continue;
   for(const dy of[0,-h*.55,h*.55]){const cx=it.x*sc,cy=it.y*sc+dy,x0=cx-w/2-LBL_PAD,x1=cx+w/2+LBL_PAD,y0=cy-h/2-LBL_PAD,y1=cy+h/2+LBL_PAD;
    if(pl.some(q=>x0<q[2]&&x1>q[0]&&y0<q[3]&&y1>q[1]))continue;pl.push([x0,y0,x1,y1]);out.push({ln,x:it.x,y:it.y+dy/sc,px,t:it.t});done=true;break;}}}
 return out;}
function placeLabels(sc){const l=$("#lbls"),pg=$("#plbl");if(!l||!pg||!G||!G.plist||!UI.view||!sc)return;const nat=UI.view.w>=600,bk=Math.round(Math.log(sc)/Math.log(1.1)),
 key=(nat?"n|"+G.t+"|"+labelLayout().length+UI._lbk:"p|"+(G.player||"")+"|"+(G.player&&G.c[G.player]?G.c[G.player].cap:""))+"|"+bk+"|"+(UI._mkk||"");
 if(UI._llk!==key){UI._llk=key;UI._lsc=sc;const items=nat?labelLayout().map(o=>Object.assign({},o)):provLabelItems(),out=lblPass(items,nat?"n":"p",sc,(UI._mkb||[]).map(m=>[m[0]*sc-m[2]/2-3,m[1]*sc-m[3]/2-3,m[0]*sc+m[2]/2+3,m[1]*sc+m[3]/2+3])),on=nat?l:pg,off=nat?pg:l;if(off.firstChild)off.textContent="";
  on.innerHTML=out.map(o=>{const n=o.ln.length;return`<text class="${nat?"lbl":"plbl"}" x="${o.x.toFixed(1)}" y="${o.y.toFixed(1)}" data-px="${o.px.toFixed(2)}">`+o.ln.map((s,i)=>`<tspan x="${o.x.toFixed(1)}" dy="${i?LBL_LH+"em":(.35-(n-1)*LBL_LH/2).toFixed(3)+"em"}">${esc(s)}</tspan>`).join("")+`</text>`;}).join("");}
 const on=nat?l:pg;on.style.display="";(nat?pg:l).style.display="none";
 for(const t of on.children)t.setAttribute("font-size",(t.dataset.px/sc).toFixed(3));
 if(Math.abs(sc/UI._lsc-1)>.002){clearTimeout(UI._lt);UI._lt=setTimeout(()=>{UI._llk="";UI._lf=null;if(UI._sc)placeLabels(UI._sc);},140);}}
function legendHTML(){const m=UI.mode,c=me(),sw=(col,l)=>`<span><i class="sw" style="background:${col}"></i>${l}</span>`,H=heat;
 const S={pol:[sw(c.col,"Our land"),sw(hexMix(c.col,"#ffffff",.35),"A colony"),sw(hexMix(c.col,"#c0413a",.5),"Occupied"),sw("#ece4cf","Unclaimed")],dip:[sw("#5e9b5e","Us"),sw("#4f7fbf","Allies"),sw("#8fb8de","Our sphere"),sw("#c0413a","At war with us"),sw("#b9d4b0","Friendly"),sw("#e4b2a6","Cool")],pop:[sw(H(.15),"Few people"),sw(H(.9),"Crowded")],mil:[sw(H(.05),"Calm"),sw(H(.9),"Angry")],ind:[sw("#f0e2c0","No factories"),sw("#5a3d1e","Many factories")],rail:[sw("#f0e2c0","No railway"),sw("#24476b","Best railway")],ter:Object.keys(TERRAIN).map(k=>sw(TERC[k]||"#ccc",TERRAIN[k].n))};
 return`<button class="lgh" data-a="lg" aria-expanded="${!UI.lgmin}"><span>Key</span>${CHEV}</button><div class="lgb">${(S[m]||[]).join("")}<span class="muted">${esc(LEG[m])}</span></div>`;}
function ensureFlags(tags){const k=[...tags].sort().join();if(UI._fl===k)return;UI._fl=k;setH($("#fdefs"),[...tags].map(t=>{const m=flagSVG(t,"").match(/<svg[^>]*>([\s\S]*)<\/svg>/);return m?`<symbol id="fl-${t}" viewBox="0 0 30 20" preserveAspectRatio="none">${m[1]}</symbol>`:"";}).join(""));}
const atlasPixiBindings = {
 get G(){return G;}, get ADJ(){return ADJ;}, get SEAR_OF(){return SEAR_OF;},
 UI, WORLD, ACT, P, seenSet, friendly, navSheet, provColor,
 get bmOn(){return bmOn;},
 labelLayout, provLabelItems,
 get provPts(){return provPts;}, get bbOf(){return bbOf;}, get edgeDist(){return edgeDist;}
};
function syncPixiAtlas(){
 const pixi=window.LC_PIXIMAP, host=$("#map");
 if(!pixi||!host)return;
 if(!OPT("pixiAtlas",0)){pixi.unmount();return;}
 if(pixi.isActive()){pixi.redrawGeometry();return;}
 pixi.mount(host,atlasPixiBindings).then(active=>{
  if(!OPT("pixiAtlas",0)||!host.isConnected)return;
  if(active){host.classList.add("has-pixi");return;}
  throw new Error("Pixi renderer unavailable");
 }).catch(()=>{
  pixi.unmount();OPTS("pixiAtlas",0);toast("Experimental Atlas unavailable. The classic map is active.");
  if($("#modal [data-k=pixiAtlas]"))openSettings();
 });
}
function drawMap(){for(const p of G.plist){const e=document.getElementById("pv-"+p.id);if(e){const f=provColor(p);if(e._f!==f){e.setAttribute("fill",f);e._f=f;}e.classList.toggle("sel",UI.sel===p.id);e.classList.toggle("occupied",!!p.ctl&&p.ctl!==p.o);e.classList.toggle("restive",UI.mode==="mil"&&p.un>=25&&p.ctl===p.o);}}
 const mv=mapMoves();setH($("#arrows"),"");setH($("#bats"),mv.bats);
 drawTheatres(1);
 const lg=$("#legend");if(lg){const h=legendHTML()+UI.lgmin;if(lg._h!==h){lg.innerHTML=legendHTML();lg._h=h;}lg.classList.toggle("min",!!UI.lgmin);}
 const ib=$("#idlen");if(ib){const n=G.player?thNeeds(me()).length:0;ib.textContent=n;ib.hidden=!n;}
 bmDraw();lensSync();applyView();UI._sc=0;applyView();syncPixiAtlas();}
UI.lgmin=OPT("lgmin",1);
/* after a new game or a load the header has its Atlas shape only once render has run, so the first view is set afterwards */
function atlasHome(){UI.mr=null;mapRect();const c=me();centerOn(P(c.cap),UI.view.w,.4);}
/* a tap on the map: show the province, with a link to the orders of its theatre */
function pickProv(id){if(bmOn()){closeChooser();return bmTap(id);}closeChooser();closeLens();UI.thsheet=null;UI.nsheet=null;UI.sel=id;drawMap();openSheet(provHTML(P(id))+thProvLink(id));}
/* ---------- V1.2 taps from geometry: marker, province under the finger, else the nearest within reach ---------- */
function provPts(w){if(w._pp)return w._pp;const out=[];for(const m of w.d.match(/M[^MZ]*/g)||[]){const n=m.match(/-?\d+(?:\.\d+)?/g).map(Number),pts=[];for(let i=0;i+1<n.length;i+=2)pts.push([n[i],n[i+1]]);if(pts.length>1)out.push(pts);}return w._pp=out;}
function edgeDist(w,x,y){let best=1e18;for(const pts of provPts(w))for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy,t=L?clamp(((x-a[0])*dx+(y-a[1])*dy)/L,0,1):0,d=Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);if(d<best)best=d;}return best;}
function closeChooser(){const c=$("#pickc");if(c)c.remove();}
/* a marker answers a tap on its body (and 6 px around it); the rest of its 44 px zone only joins the chooser, so a small province under a token stays reachable */
const rectDist=(r,x,y)=>Math.hypot(Math.max(r.left-x,0,x-r.right),Math.max(r.top-y,0,y-r.bottom));
function markerAt(cx,cy){if(UI.bm&&UI.bm.on)return{hard:null,soft:null};let best=null,bd=1e9,soft=null,sd=1e9;for(const g of document.querySelectorAll("#units [data-th],#units [data-ns]")){const arrow=g.classList.contains("farw"),v=g.querySelector(arrow?"path":".cb,.tb");if(!v)continue;const dv=rectDist(v.getBoundingClientRect(),cx,cy);if(dv<=(arrow?10:6)){if(dv<bd){bd=dv;best=g;}}else if(!arrow){const h=g.querySelector(".hit");if(h&&rectDist(h.getBoundingClientRect(),cx,cy)<=1&&dv<sd){sd=dv;soft=g;}}}return{hard:best,soft};}
function tapAt(cx,cy){{const cr=bmCraneAt(cx,cy);if(cr)return bmCrane(cr);}const mk=markerAt(cx,cy),m=mk.hard;
 const r=UI.mr,v=UI.view,sc=UI._sc||r.width/v.w,wx=v.x+(cx-r.left)/sc,wy=v.y+(cy-r.top)/sc,R=24/sc,pe=document.elementsFromPoint(cx,cy).map(q=>q.closest("[data-p]")).find(Boolean),hit=pe?pe.dataset.p:"";let C=[];
 const openMk=q=>q.dataset.th?ACT.thsheet({r:q.dataset.th}):navSheet(q.dataset.ns);
 for(const w of WORLD.provs){const b=bbOf(w.id);if(wx<b[0]-R||wx>b[2]+R||wy<b[1]-R||wy>b[3]+R)continue;const d=edgeDist(w,wx,wy)*sc;if(w.id===hit){if(d>=12&&!mk.soft&&!m)return pickProv(hit);C.push([w.id,-1,b]);}else if(d<=24)C.push([w.id,d,b]);}
 C.sort((a,b)=>a[1]-b[1]);
 /* a token sits on its theatre's hub: a small province under its body would be unreachable, so it joins the chooser (V1.2 fix, Zurich) */
 if(m){const bd=m.querySelector(".cb,.tb"),br=bd&&!m.classList.contains("farw")?bd.getBoundingClientRect():null;
  C=C.filter(q=>{if(q[1]>12||!br)return false;const b=q[2],x0=r.left+(b[0]-v.x)*sc,x1=r.left+(b[2]-v.x)*sc,y0=r.top+(b[1]-v.y)*sc,y1=r.top+(b[3]-v.y)*sc,ov=Math.max(0,Math.min(x1,br.right)-Math.max(x0,br.left))*Math.max(0,Math.min(y1,br.bottom)-Math.max(y0,br.top));return ov>=.08*Math.max(1,(x1-x0)*(y1-y0));});if(!C.length)return openMk(m);}
 const sm=m||mk.soft;if(!C.length||(!hit&&C[0][1]>22&&!m)){if(sm)return openMk(sm);if($("#sheet").classList.contains("open"))closeSheet();return;}if(C.length===1&&!sm)return pickProv(C[0][0]);
 closeChooser();const el=document.createElement("div");el.id="pickc";el.setAttribute("role","group");el.setAttribute("aria-label","Which province?");
 el.innerHTML=`<button class="btn bk" data-a="chooserx" aria-label="Back: close this list">‹</button>`+C.slice(0,sm?2:3).map(([id])=>{const p=P(id);return`<button class="btn" data-a="pickprov" data-p="${id}"><b>${esc(p.n)}</b>${p.o?`<small>${esc(G.c[p.o].n)}</small>`:""}</button>`;}).join("")+(sm?`<button class="btn" data-a="${sm.dataset.th?"thopen":"nsopen"}" data-r="${sm.dataset.th||sm.dataset.ns}"><b>${sm.dataset.th?"Orders for "+esc(tNm(REGION[sm.dataset.th].n)):"Fleet orders: "+esc(SEAREG[sm.dataset.ns].n)}</b></button>`:"");
 $("#map").appendChild(el);const mw=el.offsetWidth,mh=el.offsetHeight,x=clamp(cx-r.left-mw/2,4,r.width-mw-4),yy=cy-r.top-mh-14;el.style.left=x.toFixed(0)+"px";el.style.top=clamp(yy<4?cy-r.top+14:yy,4,r.height-mh-4).toFixed(0)+"px";}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeChooser();});
ACT.thopen=d=>{closeChooser();ACT.thsheet(d);};
ACT.nsopen=d=>{closeChooser();navSheet(d.r);};
ACT.pickprov=d=>{closeChooser();pickProv(d.p);};
Object.assign(ACT,{
 lg:()=>{if(UI.lgmin)closeLens();UI.lgmin=!UI.lgmin;OPTS("lgmin",UI.lgmin?1:0);const lg=$("#legend");lg.classList.toggle("min",UI.lgmin);lg.firstElementChild.setAttribute("aria-expanded",String(!UI.lgmin));},
 capital:()=>{const p=P(me().cap);if(UI.tab!=="map"){UI.tab="map";render();}centerOn(p,Math.min(UI.view.w,260));if(bmOn())return;pickProv(p.id);},
 mode:d=>{UI.mode=d.m;closeLens();drawMap();},
 lens:()=>{const pop=$("#lenspop");if(!pop)return;const o=pop.hidden;pop.hidden=!o;$("#mapfoot").classList.toggle("lo",o);$("#lensb").setAttribute("aria-expanded",String(o));},
 chooserx:()=>closeChooser()});
function closeLens(){const pop=$("#lenspop");if(pop&&!pop.hidden){pop.hidden=true;$("#mapfoot").classList.remove("lo");$("#lensb").setAttribute("aria-expanded","false");}}
function lensSync(){const n=$("#lensn");if(n)n.textContent=MODES[UI.mode];document.querySelectorAll("#lenspop .btn").forEach(b=>{b.classList.toggle("on",b.dataset.m===UI.mode);b.setAttribute("aria-checked",String(b.dataset.m===UI.mode));});}
/* the goprov action centres on the province, with room for the sheet below it */
ACT.goprov=d=>{const p=P(d.p);closeModal();UI.tab="map";closeSheet();render();centerOn(p,Math.min(UI.view.w,300));pickProv(d.p);};

/* ================= COMFORT (U9) ================= */
/* saves: the autosave, three slots, a file out and a file in */
const dnm=()=>{const c=me();return{n:c.n,d:dateStr(G.t),t:G.t,tag:c.tag};};
/* SV1: saves live in IndexedDB. A copy in memory keeps reads synchronous; writes report failure. */
const SAVES=(()=>{const m={};let db=null;
 const open=()=>new Promise(res=>{try{const r=indexedDB.open("vic",1);r.onupgradeneeded=()=>r.result.createObjectStore("s");r.onsuccess=()=>{db=r.result;res(db);};r.onerror=r.onblocked=()=>res(null);}catch(e){res(null);}});
 const tx=(mode,f)=>new Promise((ok,no)=>{if(!db)return no(new Error("no store"));try{const t=db.transaction("s",mode);f(t.objectStore("s"));t.oncomplete=()=>ok();t.onerror=t.onabort=()=>no(t.error||new Error("write failed"));}catch(e){no(e);}});
 const legacy=()=>{try{const o={};for(const k of["vic.auto","vic.autoM","vic.slot","vic.s1","vic.s2","vic.s3","vic.s1m","vic.s2m","vic.s3m"]){const v=localStorage.getItem(k);if(v!=null)o[k]=v;}
  if(!Object.keys(o).length)return;
  if(o["vic.auto"]||o["vic.slot"]||o["vic.s1"]||o["vic.s2"]||o["vic.s3"]){let yes=false;try{yes=confirm("Saves from an older version are stored in this browser and will be removed. Download them as a file first?");}catch(e){}
   if(yes)saveFile("long-century-old-saves.json",JSON.stringify(o));}
  for(const k in o)localStorage.removeItem(k);}catch(e){}};
 return{m,
  async init(){await open();
   if(db)await new Promise(res=>{const q=db.transaction("s").objectStore("s").openCursor();
    q.onsuccess=()=>{const c=q.result;if(c){m[c.key]=c.value;c.continue();}else res();};q.onerror=()=>res();});
   try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
   legacy();},
  get:k=>m[k]===undefined?null:m[k],
  set(k,v){const old=m[k];m[k]=v;return tx("readwrite",s=>s.put(v,k)).catch(e=>{if(old===undefined)delete m[k];else m[k]=old;throw e;});},
  del(k){delete m[k];return tx("readwrite",s=>s.delete(k)).catch(()=>{});}};})();
function saveFile(name,text){try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}catch(e){toast("The file could not be made.");}}
/* Compression runs in a Worker built from the page's own codec text, so a save does not freeze the screen. */
let SAVE_WORKER=null;
function packAsync(){
 const json=saveJSON();
 return new Promise(res=>{
  try{
   if(!SAVE_WORKER){const el=document.getElementById("codec-src");if(!el||typeof Worker!=="function")throw 0;
    SAVE_WORKER=new Worker(URL.createObjectURL(new Blob([el.textContent+";const LZC="+JSON.stringify(LZC)+";"+encodeSaveBytes.toString()+";onmessage=e=>postMessage('V2:'+encodeSaveBytes(SAVE_COMPRESSION.deflate(e.data,{level:2})));"],{type:"text/javascript"})));}
   const w=SAVE_WORKER;w.onmessage=e=>res(e.data);w.onerror=()=>{SAVE_WORKER=null;res(compressSave(json));};w.postMessage(json);
  }catch(e){res(compressSave(json));}
 });
}
let pendingAutosave=null;
function writeAutosave(request,text){
 if(pendingAutosave!==request||G!==request.game)return;
 pendingAutosave=null;
 const prev=UI.lastAutosave;
 UI.autosaveFailed=false;
 UI.lastAutosave=request.meta.t;
 return SAVES.set("vic.auto",text).then(
  ()=>{SAVES.set("vic.autoM",JSON.stringify(request.meta)).catch(()=>{});},
  ()=>{UI.autosaveFailed=true;if(UI.lastAutosave===request.meta.t)UI.lastAutosave=prev;});
}
function flushAutosave(request){
 if(!request||pendingAutosave!==request||G!==request.game)return;
 try{
  if(request.json===null){request.meta=dnm();request.json=saveJSON();}
  writeAutosave(request,compressSave(request.json));
 }
 catch{pendingAutosave=null;UI.autosaveFailed=true;}
}
function autosave(){
 const request={game:G,meta:dnm(),json:null};
 pendingAutosave=request;
 try{
  request.json=saveJSON();
  if(typeof CompressionStream==="function"){
   const stream=new Blob([request.json]).stream().pipeThrough(new CompressionStream("deflate"));
   return new Response(stream).arrayBuffer().then(
    buffer=>writeAutosave(request,"V2:"+encodeSaveBytes(new Uint8Array(buffer))),
    ()=>flushAutosave(request)
   );
  }
 }catch{
  if(request.json===null){
   pendingAutosave=null;
   UI.autosaveFailed=true;
   return;
  }
 }
 flushAutosave(request);
}
/* End month paints first and serializes the autosave after that frame, which takes
   about 40 ms off the tap in a late campaign. Hiding or leaving the page writes it at once. */
function autosaveSoon(){
 if(typeof setTimeout!=="function")return autosave();
 const request={game:G,meta:null,json:null};
 pendingAutosave=request;
 const run=()=>{if(pendingAutosave===request&&G===request.game)autosave();};
 if(typeof requestAnimationFrame==="function"&&!document.hidden)requestAnimationFrame(()=>setTimeout(run,0));
 else setTimeout(run,0);
}
window.addEventListener("pagehide",()=>flushAutosave(pendingAutosave));
document.addEventListener("visibilitychange",()=>{if(document.hidden)flushAutosave(pendingAutosave);});
function autosaveStatus(){
 const last=UI.lastAutosave;
 const saved=last==null?"":"Last autosave: "+dateStr(last)+".";
 return UI.autosaveFailed
  ? `<p role="status" class="note">Autosave failed. ${esc(saved)} Copy your current save below.</p>`
  : saved?`<p class="small muted">${esc(saved)}</p>`:"";
}
function afterLoad(){pendingAutosave=null;UI.resumedAt=G.t;UI.previousTabs=[];UI.lastAutosave=null;UI.autosaveFailed=false;UI.lastProvince=null;setPlay(0);thSync();UI.tab="over";UI.thsheet=null;UI.nsheet=null;UI.sel=null;UI.dipT=null;UI.rtp=null;UI._br=null;UI.deal=null;UI.cardHide=0;UI.cardSel=null;UI.readM=G.msgs[0];UI._dm=G.msgs[0];UI._dmOn=1;closeModal();closeSheet();const s=$("#start");if(s)s.remove();buildMap();UI.tab="map";bmRestore();render();atlasHome();}
function loadText(z,what){try{unpack(z);}catch(e){toast("That save could not be read.");return false;}afterLoad();toast((what||"Loaded")+": "+me().n+", "+dateStr(G.t)+".");return true;}
function slotSave(i){return packAsync().then(z=>SAVES.set("vic.s"+i,z)).then(()=>SAVES.set("vic.s"+i+"m",JSON.stringify(dnm()))).then(()=>{toast("Saved in slot "+i+".");openSettings();},()=>toast("This browser has no room to save. Try another slot or export a file."));}
function slotLoad(i){let z=null;try{z=SAVES.get("vic.s"+i)||(i===1?SAVES.get("vic.slot"):null);}catch(e){}if(!z){toast("Slot "+i+" is empty.");return;}loadText(z,"Loaded slot "+i);}
function slotRow(i){let hasSave=false;try{hasSave=!!(SAVES.get("vic.s"+i)||(i===1&&SAVES.get("vic.slot")));}catch{}let m=saveMeta("vic.s"+i+"m");if(!m){try{if(i===1&&SAVES.get("vic.slot"))m={n:"An older save",d:"saved with an earlier version"};}catch(e){}}
 return`<div class="slot"><div class="lm"><b>Slot ${i}${m?": "+esc(m.n):""}</b><small>${hasSave?(m?esc(m.d):"Saved campaign"):"Empty"}</small></div><button class="btn sm" data-a="slotsave" data-s="${i}">Save</button><button class="btn sm" data-a="slotload" data-s="${i}"${hasSave?"":" disabled"}>Load</button></div>`;}
const swHTML=(k,l,on)=>`<button class="switch" role="switch" aria-checked="${on}" data-a="opt" data-k="${k}"><span class="tr"></span><span>${l}</span></button>`;
function openSettings(){const dark=(document.documentElement.dataset.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"))==="dark",tz=UI.tz||1;
 openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Settings</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 <h3>Saved games</h3>${autosaveStatus()}<p class="small muted">The game saves itself every month. Use a slot to keep a game you can come back to.</p>${[1,2,3].map(slotRow).join("")}<div class="setrow"><button class="btn sm pri" data-a="savefile">Save to file</button><button class="btn sm" data-a="copysave">Copy save</button><button class="btn sm" data-a="import">Load pasted save</button></div><textarea id="svtxt" class="svtxt" rows="3" spellcheck="false" aria-label="Save text" placeholder="Press Copy save and the text appears here. To load a save, paste its text here and press Load pasted save."></textarea><div class="setrow"><button class="btn sm" data-a="importfile">Import a file</button></div><p class="small muted">Some sites block downloads, so copying the text is the sure way. Keep it in a note on your phone.</p><input type="file" id="impf" accept=".txt,text/plain" hidden>
 <h3>Play</h3>${swHTML("sum","Show a summary after each month",OPT("sum",1)!==0)}<p class="small muted" style="margin:0 0 .3rem">Fast-forward stops by itself for a decree that needs an answer, a war declared on us, or a lost province.</p>${sndRow()}
 <h3>Look</h3>${window.LC_PIXIMAP?swHTML("pixiAtlas","Experimental PixiJS Atlas",!!OPT("pixiAtlas",0)):""}
<div class="setrow"><div class="seg">${[["Light",0],["Dark",1]].map(([l,v])=>`<button class="btn sm ${dark===!!v?"on":""}" data-a="theme" data-v="${v?"dark":"light"}">${l}</button>`).join("")}</div></div><div class="setrow"><span class="small" style="align-self:center">Text size</span><div class="seg">${[["Small",.9],["Medium",1],["Large",1.12],["Largest",1.25]].map(([l,v])=>`<button class="btn sm ${tz===v?"on":""}" data-a="tz" data-v="${v}">${l}</button>`).join("")}</div></div>
 <h3>The game</h3><div class="setrow"><button class="btn sm" data-a="chronicle">The chronicle so far</button><button class="btn sm" data-a="cabinetreport">Cabinet reports</button><button class="btn sm" data-a="newgame">New game</button></div>
 <h3>Cheats</h3><div class="setrow"><button class="btn sm" data-a="cheat">Add £100 million to the treasury</button></div><p class="small muted">${G.cheat?"Used "+G.cheat+" time"+(G.cheat>1?"s":"")+": £"+G.cheat*100+" million added.":"Each press adds £100 million."}</p></div>`);}
Object.assign(ACT,{
 slotsave:d=>slotSave(+d.s),savefile:()=>{packAsync().then(z=>{saveFile("long-century-"+dateStr(G.t).replace(/\W+/g,"-")+".txt",z);toast("Saved to a file.");});},slotload:d=>slotLoad(+d.s),save:()=>slotSave(1),load:()=>slotLoad(1),

 copysave:()=>{const z=pack(),ta=$("#svtxt"),n=Math.round(z.length/1024)+" KB";if(ta){ta.value=z;ta.scrollTop=0;}const fb=()=>{try{if(ta){ta.focus();ta.select();ta.setSelectionRange(0,z.length);}const ok=document.execCommand&&document.execCommand("copy");toast(ok?"Copied the save ("+n+").":"The save is selected: press and hold, then Copy.");}catch(e){toast("The save is in the box: select it all and copy.");}};try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(z).then(()=>toast("Copied the save ("+n+")."),fb);else fb();}catch(e){fb();}},
 importfile:()=>{const f=$("#impf");if(!f)return;f.onchange=()=>{const r=new FileReader();r.onload=()=>loadText(String(r.result).trim(),"Imported");r.readAsText(f.files[0]);};f.click();},
 import:()=>{const ta=$("#svtxt");let z=ta&&ta.value.trim();if(!z){try{z=prompt("Paste a save:");}catch(e){}}if(!z){toast("Paste the save text into the box first.");return;}if(loadText(z.trim(),"Imported"))closeModal();},
 cont:()=>{let z=null;try{z=SAVES.get("vic.auto");}catch(e){}if(!z){toast("There is no autosave.");return;}if(loadText(z,"Continued")){UI.lastAutosave=G.t;drawTop();}},
 opt:d=>{
  if(d.k==="pixiAtlas"){OPTS(d.k,OPT(d.k,0)?0:1);syncPixiAtlas();}
  else OPTS(d.k,OPT(d.k,1)===0?1:0);
  openSettings();
 },
 chronicle:()=>{closeModal();showChronicle(false);},
 newgame:()=>{closeModal();askSheet({ti:"Start a new game?",danger:1,lab:"New game",body:"You return to the title page. The autosave is replaced when you begin again; saves in the slots are kept.",go:["newgo",{}]});},
 newgo:()=>showStart(),
 theme:d=>{const r=document.documentElement,cur=r.dataset.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),nx=d.v||(cur==="dark"?"light":"dark");r.dataset.theme=nx;try{localStorage.setItem("vic.theme",nx);}catch(e){}openSettings();}});
ACT.findprovince=()=>{
 openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>Find a province</h2><button class="x" data-a="close" aria-label="Close">×</button></div>
 <label>Province name <input id="findprovince-query" type="search"></label><div id="findprovince-results"></div></div>`);
 const query=$("#findprovince-query");
 const results=$("#findprovince-results");
 query.addEventListener("input",()=>{
  const name=query.value.trim().toLowerCase();
  results.innerHTML=name?G.plist.filter(p=>p.n.toLowerCase().includes(name)).slice(0,15).map(p=>
   `<div><button class="btn" data-a="goprov" data-p="${esc(p.id)}">${esc(p.n)}</button></div>`).join("")||"<p>No matching provinces.</p>":"";
 });
 query.focus();
};
/* ---------- the month's summary and the stop rules for fast-forward ---------- */
function snap(){const c=me(),tag=c.tag;return{t:G.t,tr:c.tr,net:(c.stat||{}).net||0,pop:(c.stat||{}).pop||0,rank:G.rank.indexOf(tag)+1,pres:c.pres,inf:c.infamy,own:new Set(G.plist.filter(p=>p.o===tag).map(p=>p.id)),occ:new Set(G.plist.filter(p=>p.o===tag&&p.ctl&&p.ctl!==p.o).map(p=>p.id)),wars:new Map(G.wars.filter(w=>w.att.includes(tag)||w.def.includes(tag)).map(w=>[w.id,w])),dmax:G.dseq||0};}
function monthDiff(s){const c=me(),tag=c.tag,d={lost:[],gained:[],occ:[],newWars:[],ended:[],onUs:[],stop:null};
 for(const id of s.own)if(P(id).o!==tag)d.lost.push(P(id).n);
 for(const p of G.plist){if(p.o===tag&&!s.own.has(p.id))d.gained.push(p.n);if(p.o===tag&&p.ctl&&p.ctl!==p.o&&!s.occ.has(p.id))d.occ.push(p.n);}
 const now=G.wars.filter(w=>w.att.includes(tag)||w.def.includes(tag));for(const w of now)if(!s.wars.has(w.id)){d.newWars.push(w);if(w.def.includes(tag)&&w.att[0]!==tag)d.onUs.push(w);}for(const[id,w]of s.wars)if(!now.some(x=>x.id===id))d.ended.push(w);
 d.disp=DL().filter(x=>x.id>s.dmax);
 if(G.card)d.stop="A decree awaits your seal.";else if(d.onUs.length)d.stop=nameOf(d.onUs[0].att[0])+" has declared war on us.";else if(d.lost.length||d.occ.length)d.stop=(d.lost[0]||d.occ[0])+(d.lost.length?" is lost.":" has fallen to the enemy.");
 return d;}
function showSummary(s,d,why){const c=me(),st=c.stat||{},rank=G.rank.indexOf(c.tag)+1,dr=s.rank-rank,dt=c.tr-s.tr,dp=(st.pop||0)-s.pop;
 const row=(ic,t)=>`<div class="sumr"><span class="d">${ic}</span><span>${t}</span></div>`,rows=[];
 for(const w of d.newWars)rows.push(row("⚔",(w.def.includes(c.tag)&&w.att[0]!==c.tag?esc(nameOf(w.att[0]))+" declares war on us.":"We are at war with "+esc((w.att.includes(c.tag)?w.def:w.att).map(nameOf).join(", "))+".")));
 for(const w of d.ended)rows.push(row("☮","The war with "+esc((w.att.includes(c.tag)?w.def:w.att).map(nameOf).join(", "))+" is over."));
 if(d.lost.length)rows.push(row("▼","Lost: "+esc(d.lost.join(", "))+"."));if(d.occ.length)rows.push(row("▼","Occupied by the enemy: "+esc(d.occ.join(", "))+"."));if(d.gained.length)rows.push(row("▲","Gained: "+esc(d.gained.join(", "))+"."));
 for(const x of d.disp.slice(0,4))if(!(x.k==="war"&&/declares war|at war/i.test(x.x)&&d.newWars.length))rows.push(row("✉",esc(x.ti)+(x.k==="obj"?"":": "+esc(x.x.length>90?x.x.slice(0,88)+"…":x.x))));
 const al=overAlerts().filter(a=>a.sev==="bad");
 openModal(`<div class="msheet sum" tabindex="-1"><div class="sh-h"><h2>${esc(MONTHS[monthOf(G.t-1)])} ${yearOf(G.t-1)} ends</h2><button class="x" data-a="close" aria-label="Close">×</button></div>${why?`<div class="al warn" style="pointer-events:none">Fast-forward stopped: ${esc(why)}</div>`:""}
 <div class="sumg">${tl("Treasury",moneyS(c.tr),sgn(dt)+" this month",{bad:c.tr<0})}${tl("Balance",(st.net>=0?"+":"−")+money(Math.abs(st.net||0)),"a month",{bad:(st.net||0)<0})}${tl("Rank",ord(rank),dr>0?"up "+dr:dr<0?"down "+(-dr):"unchanged",{bad:dr<0})}${tl("People",ppl(st.pop||0),(dp>=0?"+":"−")+ppl(Math.abs(dp))+" this month")}</div>
 ${rows.length?rows.join(""):`<p class="calm">A quiet month. Nothing changed hands.</p>`}${al.length?`<div class="al bad" style="margin-top:.4rem" data-a="cfgo" data-t="over">${al.length} matter${al.length>1?"s":""} need${al.length>1?"":"s"} attention: ${esc(al[0].txt)}</div>`:""}
 <div class="dfoot2"><button class="btn" data-a="sumoff">Stop showing this</button><button class="btn pri" data-a="close">Carry on</button></div></div>`);}
ACT.sumoff=()=>{OPTS("sum",0);closeModal();toast("The summary is off. Settings can turn it back on.");};
ACT.cfgo=d=>{closeModal();ACT.tab({t:d.t});};
function endMonth(expectedMonth=G.t){if(G.card){setPlay(0);UI.cardHide=0;drawCard();toast("A decree awaits your seal.");return;}
 if(expectedMonth!==G.t||!G.player||!me()?.alive)return;
 dispSweep();const sn=snap(),before=G.msgs.length?G.msgs[0]:null,was=UI.play,until=UI.advanceTo,defaultAt=me().dflt?.t;
 const {challengeEnded,reportDone}=advanceCampaign(expectedMonth);
 {const f0=[];for(const m of G.msgs){if(m===before||m.t<G.t-1)break;f0.push(m);}dispMonth(f0,true);}UI._br=null;
 if(G.card){setPlay(0);UI.cardHide=0;UI.cardSel=null;if(UI.tab!=="news"){UI.tab="news";UI.dipT=null;closeSheet();}}
 mhPush();autosaveSoon();render();if(UI.tab==="map"&&UI.sel&&$("#sheet").classList.contains("open")){const p=P(UI.sel);if(p)openSheet(provHTML(p)+thProvLink(UI.sel));}if(UI.tab==="map"&&UI.thsheet&&$("#sheet").classList.contains("open"))openSheet(thSheetHTML(UI.thsheet));if(UI.tab==="map"&&UI.nsheet&&$("#sheet").classList.contains("open"))openSheet(navSheetHTML(UI.nsheet));
 const fresh=[];for(const m of G.msgs){if(m===before)break;fresh.push(m);}const mine=fresh.filter(m=>/war|politics/.test(m.cat)&&m.txt.includes(me().n));if(fresh.length)toast((mine[0]||fresh[0]).txt);
 const d=monthDiff(sn);
 const projectDone=G.agenda.goals.some(g=>g.done===G.t)||me().projectDoneAt===G.t-1;
 d.stop=advanceStop({...sn,defaultAt},d,{t:G.t,defaultAt:me().dflt?.t,projectDone,reportDone},{
  until,war:OPT("stopWar",1)!==0,default:OPT("stopDefault",1)!==0,projects:OPT("stopProjects",0)!==0,report:OPT("stopReport",0)!==0
 });
 if(!G.fin&&(G.t>=OBJ_END||!me().alive)){G.fin={t:G.t,r:me().alive?"end":"fall"};setPlay(0);autosave();showChronicle(true);return;}
 if(challengeEnded&&me().alive&&!G.card){
  setPlay(0);
  openModal(`<div class="msheet" tabindex="-1">${punjabChallengeHTML(me())}<button class="btn pri" data-a="close">Continue campaign</button></div>`);
  return;
 }
 if(was&&d.stop){setPlay(0);toast(d.stop);if(reportDone&&OPT("stopReport",0)!==0&&!G.card)showCabinetReport();else if(!G.card&&OPT("sum",1)!==0)showSummary(sn,d,d.stop);}
 else if(!was&&!G.card&&reportDone&&OPT("stopReport",0)!==0)showCabinetReport();
 else if(!was&&!G.card&&d.stop)toast(d.stop);
 if(!was&&!G.card&&OPT("sum",1)!==0&&!$("#modal").firstElementChild)showSummary(sn,d,null);}
/* ---------- the chronicle at the end (or any time) ---------- */
function showChronicle(final){const c=me(),A=objList(c),sc=objScore(A),rk=G.rank.indexOf(c.tag)+1,H=G.hist&&G.hist.n[c.tag],o=G.obj||{},fall=!c.alive,key=(G.chron||[]).slice(-14).reverse();
 const rs=H?natSeries(c.tag,"rank","Rank").map(s=>({n:"Rank",i:s.i,v:s.v.map(v=>v?-v:v)})):[],ss=(o.sh||[]);
 const head=fall?"The fall of "+esc(c.n):final?"The year 1936":"The chronicle so far";
 openModal(`<div class="msheet final" tabindex="-1"><div class="sh-h"><h2>${head}</h2><button class="x" data-a="close" aria-label="Close">×</button></div>${hero("chron",esc(c.n),fall?"Its story ends here":final?"A hundred years are told":dateStr(G.t))}
 <div class="score"><b>${sc}</b><div><div class="grade">${SCORE_T(sc)}</div><div class="small muted">score of 100 · ${ord(rk)} among ${G.rank.length} nations</div></div></div><div class="meter green"><i style="width:${sc}%"></i></div>
 <h3>Rank over the years</h3>${rs.length?lineChart(rs,{fmt:v=>"#"+Math.round(-v),label:"Rank by year"}):note("The chart fills in as the years pass.")}
 ${ss.length>2?`<h3>Score over the years</h3>${lineChart([{n:"Score",i:0,v:ss.map(x=>x[1])}].map(s=>({n:s.n,i:(H&&H.i)||0,v:s.v})),{fmt:v=>String(Math.round(v)),zero:1,label:"Score by year"})}`:""}
 <h3>Goals</h3>${A.map(a=>lr({t:esc(a.t),s:esc(a.now),bar:a.p,bc:a.p>=1?"green":"",v:a.hold?(a.ok?"on track":"slipping"):Math.round(a.p*100)+"%",vc:a.p>=1||a.ok?"good":""})).join("")}
 ${G.choices?.length?`<h3>Decisions of the reign</h3>${G.choices.slice().reverse().map(choice=>`<div class="sumr"><span><b>${esc(dateStr(choice.t))} · ${esc(choice.title)}</b><br>${esc(choice.label)}${choice.history?`<br><span class="small muted">${esc(choice.history)}</span>`:""}</span></div>`).join("")}`:""}
 <h3>Key events</h3>${key.length?key.map(x=>`<div class="sumr"><span class="d" style="width:3.4rem;font-size:.85rem;color:var(--muted)">${yearOf(x[0])}</span><span>${esc(x[2])}</span></div>`).join(""):note("Events are recorded here as they happen.")}
 <div class="dfoot2">${final?`<button class="btn" data-a="close">Keep playing</button>`:`<button class="btn" data-a="close">Close</button>`}<button class="btn pri" data-a="newgame">New game</button></div></div>`);}
/* record the yearly score and the key events as they come */
{const f=mhPush;mhPush=function(){f();const c=me();if(c&&!c.ai&&G.t%12===0&&G.obj&&G.obj.tag===c.tag){const o=G.obj;o.sh=o.sh||[];if(!o.sh.length||o.sh[o.sh.length-1][0]!==yearOf(G.t))o.sh.push([yearOf(G.t),objScore(objList(c))]);}};}
{const f=dispAdd;dispAdd=function(o){const d=f(o);if(d&&/^(war|peace|union|event|obj|cong)$/.test(d.k)){const L=G.chron=G.chron||[];L.push([d.t,d.k,d.ti+(d.k==="obj"?"":": "+d.x.slice(0,70))]);if(L.length>90)L.shift();}return d;};}
