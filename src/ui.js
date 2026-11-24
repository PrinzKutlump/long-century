"use strict";
/* ================= INTERFACE ================= */
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const UI={tab:"map",mode:"pol",sel:null,army:null,view:null,play:0,timer:null};
const fmt=v=>{const a=Math.abs(v),s=v<0?"−":"";return a>=1e6?s+(a/1e6).toFixed(a>=1e7?0:1)+"M":a>=1e4?s+Math.round(a/1e3)+"k":a>=1e3?s+(a/1e3).toFixed(1)+"k":s+Math.round(a);};
const money=v=>"£"+fmt(v),pct=v=>Math.round(v*100)+"%",ppl=k=>k>=1e6?(k/1e6).toFixed(2)+"bn":k>=1e3?(k/1e3).toFixed(k>=1e4?0:1)+"M":Math.round(k)+"k";
const me=()=>G.c[G.player];
const ICON={map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',nat:'<path d="M5 21V4h11l-2 4 2 4H5"/>',eco:'<path d="M4 20h16M7 16V9M12 16V5M17 16v-4"/>',pol:'<path d="M3 21h18M5 21V10h14v11M4 10l8-6 8 6"/><path d="M9 14v4M12 14v4M15 14v4"/>',
 mil:'<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',dip:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',tech:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z"/>',news:'<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/>'};
const ic=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
const TABS=[["map","Map"],["nat","Nation"],["eco","Economy"],["pol","Politics"],["mil","Military"],["dip","World"],["tech","Research"],["news","News"]];
/* ---------- the map ---------- */
const MODES={pol:"Political",dip:"Diplomacy",pop:"Population",mil:"Unrest",ind:"Industry",rail:"Railways",ter:"Terrain"};
function hexMix(a,b,t){const p=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)),A=p(a),B=p(b);return"#"+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,"0")).join("");}
function heat(t){t=clamp(t,0,1);return t<.5?hexMix("#e8e3c8","#e0a54a",t*2):hexMix("#e0a54a","#a8322a",(t-.5)*2);}
const TERC={p:"#c9d6a0",h:"#b7b07a",m:"#9a8f7e",f:"#6f9a64",j:"#4f8a55",d:"#e3d29a",s:"#d1c98d"};
function provColor(p){const m=UI.mode;if(p.waste)return"#d9d2bf";if(m==="ter")return TERC[p.t];
 if(m==="pol"){if(!p.o)return p.colz?"#d8cdb0":"#ece4cf";const c=G.c[p.o];let col=c.col;if(p.col===0)col=hexMix(col,"#ffffff",.35);if(p.ctl&&p.ctl!==p.o)col=hexMix(col,p.ctl==="REB"?"#222222":G.c[p.ctl].col,.5);return col;}
 if(!p.o)return"#ece4cf";
 if(m==="dip"){const pl=me(),o=p.o;if(o===pl.tag)return"#5e9b5e";if(hostile(pl.tag,o))return"#c0413a";if(pl.ally.includes(o))return"#4f7fbf";if(G.c[o].sphere===pl.tag)return"#8fb8de";const r=pl.rel[o]||0;return r>40?"#b9d4b0":r<-40?"#e4b2a6":"#e8e1cf";}
 if(m==="pop")return heat(Math.log10(1+p.pop/Math.max(1,WP[p.id].a)*40)/2.2);
 if(m==="mil"){let a=0,b=0;for(const q of p.pops){a+=q.mil*q.n;b+=q.n;}return heat((b?a/b:0)/6);}
 if(m==="ind"){const l=sum(p.factories,f=>f.lv);return l?hexMix("#f0e2c0","#5a3d1e",Math.min(1,l/12)):"#ece4cf";}
 if(m==="rail")return p.rail?hexMix("#f0e2c0","#24476b",p.rail/5):"#ece4cf";return"#ccc";}
let CL_=null,CLK_="";
function clusters(){const k=G.t+"|"+G.plist.map(p=>p.o||"").join("");if(k===CLK_)return CL_;const seen=new Set(),out=[];for(const p of G.plist){if(!p.o||seen.has(p.id))continue;const L=[],st=[p];seen.add(p.id);while(st.length){const x=st.pop();L.push(x);for(const id of ADJ[x.id]){const y=P(id);if(y.o===p.o&&!seen.has(id)){seen.add(id);st.push(y);}}}out.push([p.o,L]);}CL_=out;CLK_=k;return out;}
const LEG={pol:"Nations; lighter shades are colonies, mixed shades are occupied.",dip:"Green: us. Blue: allies and our sphere. Red: at war with us.",pop:"Darker: more crowded.",mil:"Darker red: angrier people.",ind:"Darker: more factories.",rail:"Darker blue: better railways.",ter:"Plains, hills, mountains, forest, jungle, desert, steppe."};
let WP={};
const setH=(el,s)=>{if(el._h!==s){el.innerHTML=s;el._h=s;}};
/* provinces the player and friends can see: ours, theirs and every neighbor of them */
function seenSet(){const s=new Set(),me=G.player;for(const p of G.plist)if(p.ctl&&(p.ctl===me||friendly(me,p.ctl))){s.add(p.id);for(const v of ADJ[p.id])s.add(v);}return s;}
/* arrows for marching armies we can see, crossed swords where a battle is on */
function mapMoves(){const seen=seenSet(),me=G.player,out=[];
 for(const a of G.armies){if(!a.u.length||!a.path.length)continue;if(!(a.o===me||(G.c[a.o]&&friendly(me,a.o))||seen.has(a.loc)))continue;
  const pts=[a.loc].concat(a.path.slice(0,6)).map(id=>P(id)),n=pts.length,e=pts[n-1],q=pts[n-2],dx=e.x-q.x,dy=e.y-q.y,L=Math.hypot(dx,dy)||1,pb=Math.min(11,L*.3),tx=e.x-dx/L*pb,ty=e.y-dy/L*pb,an=Math.atan2(dy,dx),col=a.reb?"#202020":G.c[a.o]?G.c[a.o].col:"#888",
   d0=pts[1],l0=Math.hypot(d0.x-pts[0].x,d0.y-pts[0].y)||1,s0=Math.min(10,l0*.3),sx=pts[0].x+(d0.x-pts[0].x)/l0*s0,sy=pts[0].y+(d0.y-pts[0].y)/l0*s0,
   d="M"+sx.toFixed(0)+" "+sy.toFixed(0)+pts.slice(1,n-1).map(p=>"L"+p.x.toFixed(0)+" "+p.y.toFixed(0)).join("")+"L"+tx.toFixed(0)+" "+ty.toFixed(0),h=[0,-2.6,2.6].map((o,i)=>(i?(tx-Math.cos(an+o)*11):tx+Math.cos(an)*5).toFixed(1)+","+(i?(ty-Math.sin(an+o)*11):ty+Math.sin(an)*5).toFixed(1)).join(" ");
  out.push(`<path class="arw h" d="${d}"/><path class="arw${a.naval?" sea":""}" d="${d}" stroke="${col}"/><polygon class="ahd" points="${h}" fill="${col}"/>`);}
 const bt=(G.bt||[]).map(r=>[r.p,1,r.m]),done=(G.battles||[]).filter(b=>b.t===G.t-1&&!bt.some(x=>x[0]===b.p)&&(seen.has(b.p)||b.w===me||b.l===me)).map(b=>[b.p,0,b.m]);
 return{arrows:out.join(""),bats:bt.concat(done).map(([id,on,m])=>{const p=P(id);return`<g class="bat${on?"":" done"}" data-p="${id}" transform="translate(${p.x},${p.y-26})"><circle r="8.5"/><path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5M-5.5 -2.5L-2.5 -5.5M5.5 -2.5L2.5 -5.5"/></g>`;}).join("")};}
/* ---------- sheets ---------- */
/* openSheet and closeSheet live in ui7.js (V1.4: peek, half and full) */
/* ---------- pages ---------- */
/* ---------- charts, ledger and trade (E7) ---------- */
const NOTHING=`<p class="small muted">The chart fills in as the years pass.</p>`;
/* series: [{n:name, v:[...], i:index of the first value in G.hist.y}] */
function lineChart(series,o){o=o||{};const H=G.hist;if(!H||H.y.length<2)return NOTHING;const W=360,HH=o.h||150,L=o.left||40,R=8,T=8,B=20,last=H.y.length-1;
 let lo=Infinity,hi=-Infinity,x0=last;for(const s of series)s.v.forEach((v,k)=>{if(v==null)return;lo=Math.min(lo,v);hi=Math.max(hi,v);x0=Math.min(x0,s.i+k);});
 if(!isFinite(lo)||x0>=last)return NOTHING;if(o.base!=null){lo=Math.min(lo,o.base);hi=Math.max(hi,o.base);}if(o.zero)lo=Math.min(lo,0);if(hi-lo<1e-9){hi+=1;lo-=1;}const pad=(hi-lo)*.06;lo-=o.zero?0:pad;hi+=pad;
 const X=k=>L+(W-L-R)*(k-x0)/Math.max(1,last-x0),Y=v=>T+(HH-T-B)*(1-(v-lo)/(hi-lo)),f=v=>(o.fmt||fmt)(v,hi-lo);
 let g="";for(let k=0;k<3;k++){const v=lo+(hi-lo)*k/2,y=Y(v);g+=`<line class="gr" x1="${L}" x2="${W-R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text class="ax" x="${L-4}" y="${(y+3).toFixed(1)}" text-anchor="end">${f(v)}</text>`;}
 const y0=H.y[x0],y1=H.y[last];g+=`<text class="ax" x="${L}" y="${HH-5}" text-anchor="start">${y0}</text><text class="ax" x="${W-R}" y="${HH-5}" text-anchor="end">${y1}</text>`;if(last-x0>=40)g+=`<text class="ax" x="${(L+(W-R))/2}" y="${HH-5}" text-anchor="middle">${Math.round((y0+y1)/2)}</text>`;
 if(o.base!=null)g+=`<line class="bs" x1="${L}" x2="${W-R}" y1="${Y(o.base).toFixed(1)}" y2="${Y(o.base).toFixed(1)}"/>`;
 series.forEach((s,j)=>{let d="",pen=0;s.v.forEach((v,k)=>{if(v==null){pen=0;return;}d+=(pen?"L":"M")+X(s.i+k).toFixed(1)+" "+Y(v).toFixed(1);pen=1;});g+=`<path class="ln l${j%6}" d="${d}"/>`;});
 return`<svg class="chart" viewBox="0 0 ${W} ${HH}" role="img" aria-label="${esc(o.label||"Chart")}">${g}</svg>`+(series.length>1||o.legend?`<div class="leg">${series.map((s,j)=>`<span><i class="c${j%6}"></i>${esc(s.n)}</span>`).join("")}</div>`:"");}
const natSeries=(t,k,n)=>{const h=G.hist&&G.hist.n[t];return h?[{n,v:h[k],i:h.i}]:[];};
const CG0=["grain","coal","iron","steel","machinery","clothes"];
function modernLine(c){let t=0,m=0;for(const p of provsOf(c.tag))for(const f of p.factories){t+=f.lv;if((f.m||0)>0)m+=f.lv;}return t>0?"Modern methods in "+pct(m/t)+" of our factory levels. Tap a province, then Modernize beside a factory, to order an upgrade; capitalists modernize their own mills when they can afford it.":"";}
const mobFx=(c,pl)=>`${pl.units} more brigades (${ppl(pl.men)} men) are raised over two months, on top of the ${pl.now} we have. They are taken from the farmers and laborers of each province, ${(pl.share*100).toFixed(2)}% of all our workers, so food and ore output fall by about ${(pl.share*70).toFixed(1)}% until they are home again. Rifles and uniforms cost ${money(pl.cost)}, paid now. Militancy rises a little every month it lasts. Every nation hears of it: neighbors like us 8 points less, the rest 1 point less.`;
/* ---------- the world page: crisis and coalition banners, and a page for each nation ---------- */
const projName=b=>b.k==="upg"?GOODS[b.g].n+" works: "+methOf(b.g).n[b.to-1].toLowerCase():b.k==="rail"?"Railway":b.k==="bld"?BLD[b.b].n:GOODS[b.g].n+" factory";
function costTxt(C){return Object.keys(C).map(x=>Math.round(C[x])+" "+GOODS[x].n.toLowerCase()).join(", ");}
const PAGES={};
/* ---------- decision cards: the game waits here ---------- */
function render(){if(UI.tab!=="map"){const f=document.getElementById("tkf");if(f)f.hidden=true;}armCampaignBack();dispSweep();drawTop();drawCard();if(UI.tab==="map"){$("#page").classList.remove("open");drawMap();}else{const pg=$("#page"),y=pg.scrollTop;pg.innerHTML=(PAGES[UI.tab]||PAGES.over)();enhance(pg);pg.classList.add("open");pg.scrollTop=y;}}
/* ---------- turns ---------- */
function setPlay(v){if(v&&G&&G.card){UI.cardHide=0;drawCard();toast("A decree awaits your seal.");v=0;}UI.play=v;if(!v)UI.advanceTo=null;clearInterval(UI.timer);if(v)UI.timer=setInterval(()=>{if(document.hidden)return;endMonth();},700);if(G&&G.player)drawTop();}
/* ---------- saves ---------- */
// These values are produced and consumed within the economy pass.
const SKIP=new Set(["plist","_n","_craUn","_a","_gross","_art","_im","_inc",
 "_ari","_cap","_gdp","_govPay","_works",
 /* A3: the household market runs in every province, so its per-month report rows are rebuilt each month. They are saved only for the
    provinces of the nation being played (the Economy page shows them straight after a load); everyone else's are not saved. */
 "employerAccount"]);
const SAVE_OWN_ONLY=new Set(["localMarket","landUse"]);
const SAVE_SCHEMA=3;
const SAVE_RULESET="classic";
/* A4: SAVE_SCHEMA is the codec (how the text is written); MODEL_REV (src/state.js) is the revision of the rules that produced the state.
   They change independently: a schema change never alters outcomes, a model revision never alters the text format. A save that carries no
   modelRev was written before A4 and its revision is unknown (LOADED_REV null); a save from a newer revision is refused. */
let LOADED_REV=MODEL_REV;
function saveJSON(){
 return JSON.stringify({...G,nextArmyId:UID,saveSchema:SAVE_SCHEMA,modelRev:MODEL_REV,ruleset:SAVE_RULESET},
  function(key,value){return SKIP.has(key)||(SAVE_OWN_ONLY.has(key)&&this.o!==G.player)?undefined:value;});
}
function compressSave(json){
 return "V2:"+encodeSaveBytes(SAVE_COMPRESSION.deflate(json,{level:2}));
}
function pack(){return compressSave(saveJSON());}
function readSaveJSON(text){
 if(text.startsWith("V2:"))return SAVE_COMPRESSION.inflate(decodeSaveBytes(text.slice(3)),{to:"string"});
 if(text.startsWith("V1:"))return lzDec(text.slice(3));
 return text;
}
let LAST_LOAD=null;
function unpack(z){
 const g=JSON.parse(readSaveJSON(z));
 if(!g?.prov||!g.c||!Number.isInteger(g.t)||g.t<0||!g.price||
    (g.player!=null&&!g.c[g.player])||
    !["armies","msgs","wars","rank"].every(k=>Array.isArray(g[k])))throw new Error("bad save");
 g.plist=WORLD.provs.map(w=>g.prov[w.id]);
 if(g.plist.some(p=>!p||!Array.isArray(p.pops)||!Array.isArray(p.build)||!Array.isArray(p.factories)))
  throw new Error("bad provinces");
 if(g.saveSchema!==undefined&&(![2,SAVE_SCHEMA].includes(g.saveSchema)||g.ruleset!==SAVE_RULESET))
  throw new Error("unsupported save rules");
 if(g.modelRev!==undefined&&(!Number.isSafeInteger(g.modelRev)||g.modelRev<1||g.modelRev>MODEL_REV))throw new Error("save from a newer model revision");
 const savedRev=g.modelRev===undefined?null:g.modelRev;
 delete g.saveSchema;
 delete g.modelRev;
 delete g.ruleset;
 const lanes=g.lanes||[];
 if(!Array.isArray(lanes)||lanes.some(l=>!Array.isArray(l)||!g.plist.some(p=>p.id===l[0])||!g.plist.some(p=>p.id===l[1])||!Number.isFinite(l[2])))
  throw new Error("bad lanes");
 const next=1+Math.max(0,...g.armies.map(a=>+a.id.slice(1)||0));
 g.pricePrev=g.pricePrev||{...g.price};
 buildAdj();
 for(const [a,b,m] of lanes)if(!SEAADJ[a].some(x=>x[0]===b)){SEAADJ[a].push([b,m]);SEAADJ[b].push([a,m]);}
 UID=Number.isSafeInteger(g.nextArmyId)?Math.max(next,g.nextArmyId):next;
 delete g.nextArmyId;
 _SL={landAt:{},navAt:{},navP:{},c:{}};
 if(g.constructionLedger){
  for(const ledger of Object.values(g.constructionLedger)){
   if(!ledger.payments.some(row=>row.month!=null))continue;
   const years=new Map();
   for(const row of ledger.payments){
    const year=row.year??yearOf(row.month);
    const key=year+"|"+row.payer+"|"+row.account;
    if(!years.has(key))years.set(key,{year,payer:row.payer,account:row.account,amount:0,materials:{}});
    const entry=years.get(key);
    entry.amount+=row.amount;
    for(const [good,quantity] of Object.entries(row.materials||{}))
     entry.materials[good]=(entry.materials[good]||0)+quantity;
   }
   ledger.payments=[...years.values()];
  }
 }
 const defaults=applySaveDefaults(g);
 G=g;
 LOADED_REV=savedRev;
 LAST_LOAD={savedRev,modelRev:MODEL_REV,defaults};
 UI._dm=g.msgs[0];UI._dmOn=1;
}
const LZC="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function encodeSaveBytes(bytes){
 if(bytes.toBase64)return bytes.toBase64({alphabet:"base64url",omitPadding:true});
 const chunks=[];
 let part="",i=0;
 for(;i+2<bytes.length;i+=3){
  const word=(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2];
  part+=LZC[word>>>18]+LZC[(word>>>12)&63]+LZC[(word>>>6)&63]+LZC[word&63];
  if(part.length>=8192){chunks.push(part);part="";}
 }
 if(i<bytes.length){
  const word=(bytes[i]<<16)|((bytes[i+1]||0)<<8);
  part+=LZC[word>>>18]+LZC[(word>>>12)&63];
  if(i+1<bytes.length)part+=LZC[(word>>>6)&63];
 }
 chunks.push(part);
 return chunks.join("");
}
function decodeSaveBytes(text){
 const lookup=new Int8Array(128).fill(-1);
 for(let i=0;i<LZC.length;i++)lookup[LZC.charCodeAt(i)]=i;
 if(text.length%4===1)throw new Error("bad save encoding");
 const bytes=new Uint8Array(Math.floor(text.length*6/8));
 let buffer=0,bits=0,offset=0;
 for(let i=0;i<text.length;i++){
  const value=lookup[text.charCodeAt(i)];
  if(value===undefined||value<0)throw new Error("bad save encoding");
  buffer=(buffer<<6)|value;
  bits+=6;
  if(bits>=8){bits-=8;bytes[offset++]=buffer>>>bits;}
 }
 return bytes;
}
function lzDec(z){const idx={};for(let i=0;i<64;i++)idx[LZC[i]]=i;const d=[];let next=256,bits=9,buf=0,nb=0,pos=0;
 const read=()=>{while(nb<bits&&pos<z.length){buf|=idx[z[pos++]]<<nb;nb+=6;}if(nb<bits)return-1;const c=buf&((1<<bits)-1);buf>>>=bits;nb-=bits;return c;};
 const str=c=>c<256?String.fromCharCode(c):d[c-256];let c=read();if(c<0)return"";let w=str(c);const out=[w];
 for(;;){if(next<65535){next++;if(next>(1<<bits)&&bits<16)bits++;}else if(next===65535)next=65536;c=read();if(c<0)break;let e;if(c<256||d[c-256]!==undefined)e=str(c);else e=w+w[0];out.push(e);if(d.length<65535-256)d.push(w+e[0]);w=e;}
 return out.join("");}

/* ---------- A4: defaults for every field the A1-A3 engine tickets added, applied once at the load path ----------
 * Rule: add only what is needed for old data to behave and never invent history. A missing fact is "unknown" (null or an explicit
 * flag), never a guess, and nothing here can credit a treasury. Fields that the engine creates lazily and that a fresh game does not
 * have (G.actorSerial, G.unif, G.projectSeq before the first project, row caches) are left absent so a saved fresh game restores byte for byte.
 * Idempotent: running it on its own output changes nothing.
 *   A1  G.commandSerial / G.actorSerial   serials are non-negative integers; an invalid value is dropped (counts from 0, as the engine reads it)
 *   A2  project pid, G.projectSeq         every live project gets a stable id, in province-list order (deterministic); the sequence continues
 *                                         above every id in the save; duplicate ids are re-issued; queue ids are unique per nation
 *   A2  endProject dispositions           completed-works rows and ledgers of canceled projects get recoverable 0; spent/unspent that the old
 *                                         save did not record stay null ("unknown") and the row says so
 *   A2  construction ledger ids           constructionSequence continues above every ledger id in the save
 *   A3  household rows (localMarket, landUse, employerAccount)  not read before the month's own pass rewrites them; absent is valid (the
 *                                         Economy page tolerates it); no default is written
 *   R   c.resQ (research queue)           missing or malformed -> [] (a fresh nation has [] too); unknown or duplicate ids dropped, at most 5
 *   A3  G.unif, G.ev markers, decision cards   read with a guard; absent means "not happened"; a pending card is plain data and still resolves */
const PID_NUM=/^p(\d+)$/;
function applySaveDefaults(g){
 const report={pidsAssigned:0,pidsReissued:0,queueIdsFixed:0,dispositionsMarked:0,serialsDropped:0};
 const okSerial=v=>Number.isSafeInteger(v)&&v>=0;
 if(g.commandSerial!==undefined&&!okSerial(g.commandSerial)){delete g.commandSerial;report.serialsDropped++;}
 if(g.actorSerial!==undefined){
  if(!g.actorSerial||typeof g.actorSerial!=="object"||Array.isArray(g.actorSerial)){delete g.actorSerial;report.serialsDropped++;}
  else for(const k of Object.keys(g.actorSerial))if(!okSerial(g.actorSerial[k])){delete g.actorSerial[k];report.serialsDropped++;}
 }
 /* project ids */
 let seq=okSerial(g.projectSeq)?g.projectSeq:0;
 const seen=new Set(),live=[];
 for(const p of g.plist)for(const b of p.build){
  live.push(b);
  const m=typeof b.pid==="string"?PID_NUM.exec(b.pid):null;
  if(m)seq=Math.max(seq,+m[1]);
 }
 for(const b of live){
  if(typeof b.pid==="string"&&b.pid&&!seen.has(b.pid)){seen.add(b.pid);continue;}
  if(b.pid==null||b.pid==="")report.pidsAssigned++;else report.pidsReissued++;
  do{b.pid="p"+(++seq);}while(seen.has(b.pid));
  seen.add(b.pid);
  /* what was already paid on a project of an older save is not recorded: say so, do not guess */
  if(b.paid==null)b.paidUnknown=1;
 }
 if(seq>0&&(g.projectSeq!==undefined||live.length))g.projectSeq=seq;
 /* queue orders: unique ids within a nation */
 for(const country of Object.values(g.c)){
  if(!Array.isArray(country.bq))continue;
  const ids=new Set();
  for(const [index,order] of country.bq.entries()){
   if(order.id==null||ids.has(order.id)){order.id=order.id==null?"legacy-"+index:"legacy-"+index+"-"+ids.size;report.queueIdsFixed++;}
   ids.add(order.id);
  }
 }
 /* A6: modernisation progress and reforms taken (older saves: civilised = 100, else the start value plus 5% a tech) */
 for(const country of Object.values(g.c)){
  if(!Array.isArray(country.modRef))country.modRef=country.civ?[]:(MOD_FREE[country.tag]||[]).slice();
  country.modRef=country.modRef.filter((id,i,a)=>Object.hasOwn(MOD_BY,id)&&a.indexOf(id)===i);
  if(!Number.isFinite(country.modern))country.modern=country.civ?100:Math.min(95,modStart(country.tag)+5*Object.keys(country.tech||{}).length);
 }
 /* C0: programme state per nation */
 for(const country of Object.values(g.c))progSanitize(country);
 /* research queue: an array of known, distinct tech ids, at most RES_QMAX (nations of older saves have none) */
 for(const country of Object.values(g.c)){
  const q=Array.isArray(country.resQ)?country.resQ:[],seenT=new Set();
  country.resQ=q.filter(id=>typeof id==="string"&&Object.hasOwn(TF,id)&&!seenT.has(id)&&seenT.add(id)).slice(0,RES_QMAX);
 }
 /* construction ledger sequence */
 if(g.constructionLedger){
  let top=okSerial(g.constructionSequence)?g.constructionSequence:0;
  for(const l of Object.values(g.constructionLedger))if(Number.isSafeInteger(l.id))top=Math.max(top,l.id);
  for(const b of live)if(Number.isSafeInteger(b.ledgerId))top=Math.max(top,b.ledgerId);
  g.constructionSequence=top;
  for(const l of Object.values(g.constructionLedger)){
   if(l.status==="Canceled after transfer"||(l.outcome&&l.outcome!=="completed")){
    if(l.recoverable==null){l.recoverable=0;report.dispositionsMarked++;}
    if(l.spent===undefined)l.spent=null;
    if(l.unspent===undefined)l.unspent=null;
   }
  }
 }
 /* completed-works rows of canceled projects */
 for(const country of Object.values(g.c)){
  for(const w of country.completedWorks||[]){
   if(!w.canceled)continue;
   if(w.recoverable==null){w.recoverable=0;report.dispositionsMarked++;}
   if(w.spent===undefined)w.spent=w.paid==null?null:w.paid;
   if(w.unspent===undefined)w.unspent=null;
  }
 }
 return report;
}

/* ---------- actions ---------- */
const ACT={
 tab:d=>{if($("#modal")&&!$("#modal").hidden)closeModal();if(UI.tab!==d.t&&!UI.returning)(UI.previousTabs=[...(UI.previousTabs||[]).slice(-19),UI.tab]);if(UI.tab==="map"&&d.t!=="map")UI.lastProvince=UI.sel;UI.tab=d.t;UI.dipT=null;closeSheet();render();if(d.t==="map"&&UI.lastProvince&&P(UI.lastProvince))pickProv(UI.lastProvince);},mode:d=>{UI.mode=d.m;drawMap();},zoom:d=>zoom(+d.z),close:()=>{const modal=$("#modal");if(modal&&!modal.hidden)closeModal();else closeSheet();},end:d=>endMonth(d?.month===undefined?G.t:Number(d.month)),card:d=>{cardChoose(d.k);UI.cardHide=0;autosave();render();toast("Decision taken.");},cardhide:()=>{UI.cardHide=1;drawCard();},cardshow:()=>{UI.cardHide=0;drawCard();},play:()=>setPlay(UI.play?0:1),
 
 mobask:()=>{const c=me(),pl=mobPlan(c),bad=mobCan(c,pl);if(bad){toast(bad);return;}openSheet(`<h2>Mobilize the army?</h2><p>${mobFx(c,pl)}</p><p class="small muted">The troops stay under arms until we demobilize.</p><div class="row"><button class="btn pri" data-a="mobgo">Mobilize now</button><button class="btn" data-a="close">Cancel</button></div>`);},
 mobgo:()=>{const r=mobilize(me());closeSheet();toast(r.txt);render();},
 demask:()=>{const c=me();let n=0;for(const a of G.armies)if(a.o===c.tag&&!a.naval)for(const u of a.u)if(u.mob)n++;openSheet(`<h2>Demobilize?</h2><p>${n} conscript brigades are disbanded at the start of next month. The survivors go back to the farms and mines of the provinces they came from, so output recovers. Brigades already lost do not return, and we cannot mobilize again for three months.</p><div class="row"><button class="btn pri" data-a="demgo">Demobilize</button><button class="btn" data-a="close">Cancel</button></div>`);},
 demgo:()=>{const r=demobilize(me());closeSheet();toast(r.txt);render();},
 rail:d=>{const c=me(),p=P(d.p);const r=applyCampaignCommand({...issueCampaignCommand(),kind:"rail",province:p.id});toast(r.ok?"Railway works begin in "+p.n+".":r.why);openSheet(provHTML(p));},
 facmenu:d=>{const c=me(),p=P(d.p);openSheet(`<h2>A factory in ${esc(p.n)}</h2><p class="small muted">The state pays for timber, cement and machine parts as they are delivered, about £17k in all.</p><div class="list">${Object.keys(RECIPE).filter(g=>goodOK(c,g)).map(g=>`<div><span>${GOODS[g].n}<br><span class="small muted">margin ${pct(facMargin(c,g))}; needs ${Object.keys(RECIPE[g].i).map(x=>GOODS[x].n.toLowerCase()).join(", ")}</span></span><button class="btn sm" data-a="build" data-p="${p.id}" data-g="${g}">Build</button></div>`).join("")}</div>`);},
 chgood:d=>{const cur=(UI.cg||CG0).slice(),i=cur.indexOf(d.g);if(i>=0)cur.splice(i,1);else{if(cur.length>=6)cur.shift();cur.push(d.g);}UI.cg=cur;render();},
 lsort:d=>{if((UI.lk||"rank")===d.k)UI.ld=-(UI.ld||1);else{UI.lk=d.k;UI.ld=d.k==="rank"?1:-1;}render();},lall:()=>{UI.lall=!UI.lall;render();},
 dflt:()=>{const c=me();if(c.debt<=0)return;if(!confirm("Default on "+money(c.debt)+" of debt? Creditors will be furious and no one will lend to us for ten years."))return;defaultDebt(c,true);toast("We have defaulted on our debts.");render();},
 upg:d=>{const c=me(),p=P(d.p),f=p.factories[+d.i];if(!f||p.o!==c.tag)return;const ok=upgCan(c,p,f);if(!ok.ok){toast(ok.why);return;}const C=upgCost(f);startUpgrade(c,p,f,true);toast("Work begins to modernize the "+GOODS[f.g].n.toLowerCase()+" works ("+costTxt(C)+").");openSheet(provHTML(p));},
 build:d=>{startFactory(me(),P(d.p),d.g,true);toast("Work begins on a "+GOODS[d.g].n.toLowerCase()+" factory.");openSheet(provHTML(P(d.p)));},
 recmenu:d=>{const c=me(),p=P(d.p);openSheet(`<h2>Raise forces at ${esc(p.n)}</h2><div class="list">${Object.keys(UNITS).filter(k=>(!UNITS[k].tech||c.tech[UNITS[k].tech])&&(UNITS[k].land||p.sea)).map(k=>`<div><span>${UNITS[k].n}</span><button class="btn sm" data-a="recruit" data-k="${k}" data-p="${p.id}">Raise</button></div>`).join("")}</div>`);},
 recruit:d=>{const r=recruit(me(),d.k,d.p);toast(r.txt);if(UI.tab!=="map")render();},
 colonize:d=>{const r=colonize(me(),P(d.p));toast(r.txt);openSheet(provHTML(P(d.p)));},
 fab:d=>{const p=P(d.p),r=fabricate(me(),p.o,p.id);toast(r.txt);},
 reform:d=>{const r=passReform(me(),d.id,d.concession==="1");toast(r.ok?"The reform is passed.":r.why);render();},
 party:d=>{setRuling(me(),d.k);render();},research:d=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"research",tech:d.id});toast(r.txt||r.why);render();},
 modreform:d=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"reform",reform:d.id});toast(r.txt||r.why);render();},
 rqadd:d=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"researchQueue",op:"add",tech:d.id});toast(r.txt||r.why);render();},
 rqdel:d=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"researchQueue",op:"remove",tech:d.id});toast(r.txt||r.why);render();},
 rqmv:d=>{const r=applyCampaignCommand({...issueCampaignCommand(),kind:"researchQueue",op:"move",tech:d.id,direction:+d.dir});toast(r.txt||r.why);render();},
 declare:d=>{const c=me();if(c.war.length){toast("Finish the war we are already fighting first.");return;}const ei=estInf(c,{k:d.k,t:d.t,prov:d.p||null,why:""});if(c.infamy<=COAL_AT&&c.infamy+ei>COAL_AT&&!confirm("This war would raise our infamy by about "+Math.round(ei)+", from "+Math.round(c.infamy)+" to "+Math.round(c.infamy+ei)+". Above "+COAL_AT+" our neighbours and the Great Powers will form a coalition against us. Declare war anyway?"))return;const w=declareWar(c.tag,d.t,{k:d.k,tag:d.t,prov:d.p||null,cul:d.c||null,fab:false});toast(w?"War is declared.":G.card?"The Great Powers call a congress first.":"We cannot declare war on them now.");render();},
 dealopen:d=>{const w=G.wars.find(x=>x.id===d.w);if(!w)return;UI.deal={w:w.id,sel:w.att.includes(me().tag)?["goal"]:[]};openSheet(dealHTML());},
 dealtog:d=>{const s=UI.deal.sel,i=s.indexOf(d.k);if(i<0)s.push(d.k);else s.splice(i,1);openSheet(dealHTML());},
 dealgo:()=>{const w=G.wars.find(x=>x.id===UI.deal.w);if(!w)return;const r=peaceOffer(w,"deal",UI.deal.sel);toast(r.txt);if(r.ok){closeSheet();render();}else openSheet(dealHTML());},
 peace:d=>{const w=G.wars.find(x=>x.id===d.w);if(!w)return;const r=peaceOffer(w,d.k);toast(r.txt);render();},
 guar:d=>{const r=guarantee(me(),d.t);toast(r.ok?r.txt+" If it is attacked, we go to war.":r.txt);render();},unguar:d=>{revokeGuar(me(),d.t);toast("The guarantee is withdrawn.");render();},dipnat:d=>{UI.dipT=d.t;if(UI.tab!=="dip"){UI.tab="dip";closeSheet();}render();$("#page").scrollTop=0;},dipback:()=>{UI.dipT=null;render();$("#page").scrollTop=0;},unally:d=>{if(confirm("Break the alliance? Relations with them fall by 25."))toast(unallyDo(me(),d.t).txt);render();},
improve:d=>{const r=improveDo(me(),d.t);toast(r.txt||r.why);render();},
ally:d=>{const r=allyDo(me(),d.t);toast(r.txt||r.why);render();},
influence:d=>{const r=influenceDo(me(),d.t);toast(r.txt||r.why);render();},
 cheat:()=>{me().tr+=1e8;G.cheat=(G.cheat||0)+1;toast("£100 million added to the treasury.");render();},
 bld:d=>{const p=P(d.p),r=d.b==="rail"?(railCan(me(),p).ok?(startRail(me(),p),{ok:true,txt:"Railway works begin in "+p.n+"."}):{ok:false,txt:railCan(me(),p).why}):startBld(me(),p,d.b);toast(r.txt||r.why);openSheet(provHTML(p));},
 gw:d=>{const r=startGW(me(),d.id);toast(r.txt);render();},dec:d=>{const r=takeDecision(me(),d.id);toast(r.txt);if(r.ok&&window.AUD)AUD.sfx&&AUD.sfx("seal");render();},
 save:()=>{try{localStorage.setItem("vic.slot",pack());toast("Saved.");}catch(e){toast("This browser will not let us save.");}},load:()=>{let z=null;try{z=localStorage.getItem("vic.slot");}catch(e){}if(!z){toast("No save.");return;}try{unpack(z);buildMap();render();toast("Loaded.");}catch(e){toast("That save could not be read.");}},
 export:()=>{const z=pack();navigator.clipboard&&navigator.clipboard.writeText(z).then(()=>toast("Copied the save to the clipboard ("+Math.round(z.length/1024)+" KB)."),()=>prompt("Copy this save:",z));},
 import:()=>{const z=prompt("Paste a save:");if(!z)return;try{unpack(z.trim());buildMap();render();toast("Loaded.");}catch(e){toast("That save could not be read.");}},
 theme:()=>{const r=document.documentElement,cur=r.dataset.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");r.dataset.theme=cur==="dark"?"light":"dark";try{localStorage.setItem("vic.theme",r.dataset.theme);}catch(e){}},
 newgame:()=>{if(confirm("Start a new game? The autosave will be replaced."))showStart();},
 pick:d=>{G.player=d.t;if(typeof bmLeave==="function"){UI.bm.on=false;UI.bm.proj=null;UI.bm.sel=[];bmSave();}for(const t in G.c)G.c[t].ai=t!==d.t;$("#start").remove();UI.tab="map";UI.readM=G.msgs[0];UI._dm=G.msgs[0];UI._dmOn=1;buildMap();render();atlasHome();autosave();toast("You lead "+me().n+". "+dateStr(G.t)+".");},
 cont:()=>{try{unpack(localStorage.getItem("vic.auto"));$("#start").remove();buildMap();render();}catch(e){toast("The autosave could not be read.");}}};
/* ================= THE NEW SHELL: header, ticker, navigation, Overview, sheets ================= */
Object.assign(ICON,{over:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',disp:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
 ledger:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h6"/>',guide:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7v.5"/><path d="M12 17h.01"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'});
const moneyS=v=>v<0?"−"+money(-v):money(v);
const ord=n=>n+(n%100>=11&&n%100<=13?"th":["th","st","nd","rd"][n%10]||"th");
const CHEV='<svg class="chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const HEADORN='<svg class="headorn" viewBox="0 0 300 22" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M4 11 H118 M182 11 H296" stroke-width="1"/><path d="M8 15 H112 M188 15 H292" stroke-width=".6" opacity=".6"/><path d="M118 11 q8 -9 16 0 q-8 9 -16 0z M182 11 q-8 -9 -16 0 q8 9 16 0z" stroke-width="1.2" fill="var(--gold-soft)"/><path d="M150 3 l8 8 -8 8 -8 -8z" fill="var(--red)" stroke="none"/><circle cx="134" cy="11" r="1.6" fill="var(--gold)" stroke="none"/><circle cx="166" cy="11" r="1.6" fill="var(--gold)" stroke="none"/></svg>';
const TAILORN='<svg class="tailorn" viewBox="0 0 120 18" aria-hidden="true" fill="none" stroke="currentColor"><path d="M10 9 H48 M72 9 H110" stroke-width=".9"/><path d="M60 2 C66 9 66 9 60 16 C54 9 54 9 60 2z" fill="var(--red)" stroke="none"/><circle cx="52" cy="9" r="1.6" fill="var(--gold)" stroke="none"/><circle cx="68" cy="9" r="1.6" fill="var(--gold)" stroke="none"/></svg>';
const VIG='<svg class="vig" viewBox="0 0 160 92" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M30 84h100M34 78h92M40 72h80" stroke-width="1.8"/><path d="M48 72V44M60 72V44M72 72V44M88 72V44M100 72V44M112 72V44" stroke-width="2.2"/><path d="M42 44h76l-38-14z" stroke-width="1.8" fill="var(--gold-soft)"/><path d="M58 30 a22 18 0 0 1 44 0" stroke-width="1.8"/><path d="M80 12V2" stroke-width="1.4"/><path d="M80 2l11 3.5L80 9z" fill="var(--red)" stroke="none"/><circle cx="80" cy="12" r="2.2" fill="var(--gold)" stroke="none"/></svg>';
const HEAD_TITLE={abs:"the Sovereign",const:"the Prime Minister",dem:"the Prime Minister",pres:"the President",prol:"the Chairman",fasc:"the Leader"};
const headTitle=c=>/^(USA|CSA|MEX|BRA|CHL|TEX|ARG|COL|PER|VEN)$/.test(c.tag)&&c.gov!=="abs"?"the President":(HEAD_TITLE[c.gov]||"the government");
/* national figures, worked out once per month and kept in underscore fields (never saved) */
function milOf(p){let a=0,b=0;for(const q of p.pops){a+=q.mil*q.n;b+=q.n;}return b?a/b:0;}
function natFig(c){if(c._nf&&c._nf.t===G.t)return c._nf;let a=0,b=0,lf=0,nn=0;for(const p of provsOf(c.tag))for(const q of p.pops){a+=q.mil*q.n;b+=q.n;if(PTYPES[q.t].s===0){lf+=q.ld*q.n;nn+=q.n;}}
 return c._nf={t:G.t,mil:b?a/b:0,poor:nn?lf/nn:1};}
function fleetOf(t){let n=0;for(const x of G.armies)if(x.o===t&&x.naval&&!x.reb)n+=x.u.length;return n;}
/* the ticker replaces the toast: one line under the header, never over the page */
function toast(t){const e=$("#ticker");if(!e)return;UI.tk=t;e.className="flash";e.innerHTML="<i></i><span></span>";e.lastChild.textContent=t;
 /* on the Atlas the ticker is folded into the header: the message drops below it for a few seconds, and stays at the foot of the unfolded figures */
 if(UI.tab==="map"&&$("#app").classList.contains("atlas")){let f=$("#tkf");if(!f){f=document.createElement("div");f.id="tkf";f.setAttribute("role","status");$("header.top").appendChild(f);}f.textContent=t;f.hidden=false;clearTimeout(UI._tkt);UI._tkt=setTimeout(()=>{f.hidden=true;},4500);const l=$("#stats .tkl");if(l)l.textContent=t;}}
function hdrX(v){UI.hx=v;if(v){const f=$("#tkf");if(f)f.hidden=true;}const a=$("#app");if(a)a.classList.toggle("hx",!!v);const b=$("#hdr .xp");if(b)b.setAttribute("aria-expanded",String(!!v));}
ACT.hdrx=()=>hdrX(!UI.hx);
function unreadN(){if(UI.readM===undefined)return 0;let n=0;for(const m of G.msgs){if(m===UI.readM)break;if(m.txt.includes(me().n)&&++n>=9)break;}return n;}
function drawTop(){const c=me(),st=c.stat,war=c.war.length,rank=G.rank.indexOf(c.tag)+1,N=st.N||{},nf=natFig(c),net=st.net||0,atlas=UI.tab==="map",app=$("#app");
 if(app.classList.contains("atlas")!==atlas){app.classList.toggle("atlas",atlas);UI.mr=null;}if(!atlas&&UI.hx)UI.hx=false;app.classList.toggle("hx",!!UI.hx);
 if(atlas)$("#hdr").innerHTML=`<span class="crest">${flagSVG(c.formed||c.tag,"cf")}</span><button class="when xp" data-a="hdrx" aria-expanded="${!!UI.hx}" aria-label="National figures: treasury ${esc(moneyS(c.tr))}${war?", at war":""}. Tap to ${UI.hx?"fold":"unfold"}."><span class="month">${MONTHS[monthOf(G.t)].slice(0,3)} ${yearOf(G.t)}</span><span class="hsum"><span class="st">${esc(moneyS(c.tr))}</span>${war?'<span class="wr">at war</span>':""}${CHEV}</span></button><div class="acts"><button class="hb ${UI.play?"on":""}" data-a="play" aria-label="${UI.play?"Pause":"Advance time"}">${UI.play?"❚❚":"»"}</button><button class="hb" data-a="more" aria-label="More pages and settings">${ic("disp")}${UI.autosaveFailed?'<span class="bdg" aria-label="Autosave failed">!</span>':""}</button><button class="end" data-a="end" data-month="${G.t}">End month</button></div>`;
 else $("#hdr").innerHTML=`<span class="crest">${flagSVG(c.formed||c.tag,"cf")}</span><div class="when"><div class="month">${dateStr(G.t)}</div><div class="rumi">${esc(GOVS[c.gov].n)}, month ${G.t+1}</div></div><div class="acts"><button class="hb" data-a="more" aria-label="Campaign pages">${ic("disp")}</button><button class="hb" data-a="settings" aria-label="Settings and saves">${ic("gear")}${UI.autosaveFailed?'<span class="bdg" aria-label="Autosave failed">!</span>':""}</button><button class="hb ${UI.play?"on":""}" data-a="play" aria-label="${UI.play?"Pause":"Advance time"}">${UI.play?"❚❚":"»"}</button><button class="end" data-a="end" data-month="${G.t}">End month</button></div>`;
 const tiles=[["nat","Treasury",moneyS(c.tr),(net>=0?"+":"−")+money(Math.abs(net))+" a month",c.tr<0||(net<0&&c.tr<-net*6),net<0],["dip","Rank",ord(rank),isGP(c.tag)?"Great Power":"",0,0],["dip","Prestige",Math.round(c.pres),"",0,0],["pol","Militancy",nf.mil.toFixed(1),"of 10",nf.mil>=4,0],["mil","Army",ppl(N.SOL||0),"men",0,0],["dip","Infamy",c.infamy.toFixed(1),"limit "+COAL_AT,c.infamy>COAL_AT-6,0],["mil","War",war?war+" war"+(war>1?"s":""):"Peace","exhaustion "+Math.round(c.we),c.we>=40,0]];
 const sc=$("#stats"),sl=sc.scrollLeft;sc.innerHTML=tiles.map(([t,k,v,s,bad,sneg])=>`${exTile(k,t,bad)}<span>${k}</span><b>${esc(v)}</b>${s?`<small class="${sneg?"neg":""}">${esc(s)}</small>`:""}</button>`).join("");sc.scrollLeft=sl;if(atlas)sc.insertAdjacentHTML("beforeend",`<button class="rc" data-a="settings"><span>Game</span><b>Settings and saves</b></button>`+(UI.tk?`<p class="tkl">${esc(UI.tk)}</p>`:""));
 {const sm=$("#hdr .hsum"),w=sm&&sm.querySelector(".wr");if(w&&sm.scrollWidth>sm.clientWidth+1)w.remove();}
 const bd=dispUnread();
 const current=["over","map","eco","pol","works"].includes(UI.tab)?UI.tab:UI.tab==="news"?"over":"pol";
 const month=$("#hdr .month");
 if(month&&month.scrollWidth>month.clientWidth+1)month.textContent=MONTHS[monthOf(G.t)].slice(0,3)+" "+yearOf(G.t);
 $(".bnav").innerHTML=[["over","Cabinet"],["map","Atlas"],["eco","Economy"],["works","Works"],["pol","Government"]].map(([key,label])=>
  `<button class="bn" ${current===key?'aria-current="page"':""} data-a="tab" data-t="${key}">${ic(key)}<span class="l">${label}</span>${key==="over"&&bd?`<span class="badge">${bd}</span>`:""}</button>`
 ).join("");}

/* ---------- alerts: each one plain sentence, tap to go where it is fixed ---------- */
function overAlerts(){const c=me(),st=c.stat||{},A=[],tag=c.tag,net=st.net||0,add=(sev,txt,a,o)=>A.push(Object.assign({sev,txt,a},o||{}));
 if(UI.autosaveFailed)add("bad","Autosave failed. Open Settings to copy your save.","settings");
 if(G.card)add("bad","A decision awaits: "+G.card.title+".","cardshow");
 const falling=new Set();for(const a of G.armies){if(a.naval||!a.u.length||a.path.length||!(a.siege>.55))continue;const p=P(a.loc),t=a.reb?"REB":armyTag(a);if(p.o===tag&&t!==tag&&(a.reb||hostile(tag,t))&&!falling.has(p.id)){falling.add(p.id);add("bad",p.n+" is about to fall.","goprov",{p:p.id});}}
 const occ=G.plist.filter(p=>p.o===tag&&p.ctl&&p.ctl!==p.o&&p.ctl!=="REB"&&!falling.has(p.id));
 if(occ.length>2)add("bad",occ.length+" of our provinces are held by the enemy.","tab",{t:"mil"});else occ.forEach(p=>add("bad",p.n+" is held by "+nameOf(p.ctl)+". Retake it or make peace.","goprov",{p:p.id}));
 if(c.tr<0)add("bad","The treasury is empty ("+moneyS(c.tr)+"). Pay is in arrears: borrow, pause projects or cut spending.","tab",{t:"nat"});
 else if(net<0&&c.tr/-net<12){const m=Math.max(1,Math.floor(c.tr/-net));add(m<=4?"bad":"warn","At this rate the treasury runs dry in about "+m+" month"+(m===1?"":"s")+".","tab",{t:"nat"});}
 const cl=creditLimit(c);if(c.debt>0&&cl>0&&c.debt>.8*cl)add("warn","Debt is "+Math.round(c.debt/cl*100)+"% of what lenders will allow.","tab",{t:"nat"});
 const co=G.coal&&G.coal[tag];if(co&&co.mem&&co.mem.length)add("bad","A coalition of "+co.mem.length+" states stands against us.","tab",{t:"dip"});else if(c.infamy>=COAL_AT-6)add("warn","Infamy is "+Math.round(c.infamy)+". At "+COAL_AT+" our neighbours form a coalition against us.","tab",{t:"dip"});
 const hot=provsOf(tag).map(p=>[p,milOf(p)]).filter(x=>x[1]>=5).sort((a,b)=>b[1]-a[1]);hot.slice(0,2).forEach(([p,m])=>add(m>=7?"bad":"warn",p.n+" is restless: militancy "+m.toFixed(1)+" of 10.","goprov",{p:p.id}));
 const rb=G.armies.filter(a=>a.reb&&a.u.length&&P(a.loc).o===tag).length;if(rb)add("bad",rb+" rebel band"+(rb>1?"s are":" is")+" loose in our land.","tab",{t:"mil"});
 if(c.blk&&c.blk.share>.02)add("bad","Our ports are blockaded: trade is down to "+Math.round(c.access*100)+"%.","tab",{t:"mil"});
 if(G.famine&&G.famine.p&&P(G.famine.p).o===tag)add("bad","Famine grips "+P(G.famine.p).n+".","goprov",{p:G.famine.p});
 const cut=G.armies.find(a=>a.o===tag&&!a.naval&&!a.reb&&a.u.length&&(a.cut||0)>=2);if(cut)add("warn","The "+thName(cut.th)+" theatre has men cut off from supplies near "+P(cut.loc).n+".","thsheet",{r:REGION[cut.th]?cut.th:REG_OF[cut.loc]});
 G.wars.filter(w=>w.att.includes(tag)||w.def.includes(tag)).forEach(w=>{const side=w.att.includes(tag)?1:2,ws=side===1?w.ws:-w.ws,need=WARGOALS[w.goal.k].ws,foe=nameOf((side===1?w.def:w.att)[0]),lead=w.att[0]===tag||w.def[0]===tag;
  if(lead&&side===1&&ws>=need)add("good","We can force peace on our terms: war score "+Math.round(ws)+" meets the "+need+" needed.","dealopen",{w:w.id});else if(ws<=-25)add("warn","The war with "+foe+" goes badly (score "+Math.round(ws).toString().replace("-","−")+"). Think about peace.","tab",{t:"dip"});});
 if(c.we>=50)add("warn","War exhaustion is "+Math.round(c.we)+" of 100: the people want peace.","tab",{t:"mil"});
 if(c.civ&&!c.res)add("warn","No research is under way: our scholars sit idle.","tab",{t:"tech"});
 extraAlerts(c,add);
 const o={bad:0,warn:1,good:2};return A.map((x,i)=>[x,i]).sort((a,b)=>o[a[0].sev]-o[b[0].sev]||a[1]-b[1]).map(x=>x[0]);}
const alData=x=>`data-a="${x.a}"`+(x.t?` data-t="${x.t}"`:"")+(x.p?` data-p="${x.p}"`:"")+(x.w?` data-w="${x.w}"`:"")+(x.id?` data-id="${x.id}"`:"");
function alertsHTML(){const L=overAlerts();if(!L.length)return`<div class="alerts"><div class="al good" style="pointer-events:none">All is quiet. Nothing needs your attention this month.</div></div>`;
 const N=UI.alAll?L.length:4,b=L.slice(0,N).map(x=>`<button class="al ${x.sev}" ${alData(x)}>${esc(x.txt)}</button>`).join("");
 return`<div class="alerts">${b}${L.length>4?`<button class="al more" data-a="alall">${UI.alAll?"Show fewer":"Show all "+L.length+" alerts"}</button>`:""}</div>`;}
/* ---------- the Overview page ---------- */
function frame(i,title,body,short){const key="over:"+title,col=FOLDS()[key]===true;return`<section class="frame${col?" collapsed":""}" data-si="${i}"><h2 class="foldh" data-a="fold" data-k="${esc(key)}" role="button" tabindex="0" aria-expanded="${!col}">${esc(title)}${CHEV}</h2>${body}</section>`;}
function pbRow(l,us,them){const m=Math.max(us,them,1);return`<div class="pb"><span>${l}</span><span class="bb"><i class="us" style="width:${Math.max(1,us/m*100).toFixed(0)}%"></i><i class="them" style="width:${Math.max(1,them/m*100).toFixed(0)}%"></i></span><em><b>${fmt(us)}</b> · ${fmt(them)}</em></div>`;}
function pgOver(){const c=me(),st=c.stat||{},nf=natFig(c),rank=G.rank.indexOf(c.tag)+1,uh=c.uh||upperHouse(c),sh=uh[c.ideo]||0,net=st.net||0,tag=c.tag;
 const kp=(k,v,d,bad,t,ex)=>`<button class="kpi tap${ex?" ex":""} ${bad?"bad":""}" data-a="${ex?"why":"tab"}" data-t="${t}"${ex?` data-k="${ex}"`:""}><span class="k">${k}</span><span class="v">${v}</span><span class="d">${d}</span></button>`;
 const s0=`<div class="kgrid">${kp("Rank",ord(rank),isGP(tag)?"a Great Power":"among the nations",0,"dip","rank")}${kp("People",ppl(st.pop||0),"literacy "+pct(st.lit||0),0,"nat")}${kp("National income",money((st.gdp||0)*12),"a year",0,"eco","inc")}${kp("The poor",pct(nf.poor),"of life needs met",nf.poor<.6,"eco")}${kp("Militancy",nf.mil.toFixed(1),"of 10",nf.mil>=4,"pol","mil")}${GOVS[c.gov].elect?kp("Chamber",pct(sh),IDEOS[c.ideo].n+" government",sh<.3,"pol"):kp("Government",esc(GOVS[c.gov].n.split(" ")[0]),esc(IDEOS[c.ideo].n)+" rule",0,"pol")}</div>`;
 const R=G.rank.filter(t=>G.c[t]&&G.c[t].alive),ri=R.indexOf(tag),near=R.map((t,j)=>[t,Math.abs(j-ri)+(j<ri?-.1:0)]).filter(x=>x[0]!==tag).sort((a,b)=>a[1]-b[1]).slice(0,3).map(x=>x[0]).sort((a,b)=>R.indexOf(a)-R.indexOf(b)),sc=x=>x.score||{ind:0,mil:0};
 const s1=`<div class="pblegend"><span><i style="background:var(--red)"></i>${esc(c.n)}</span><span><i style="background:var(--line2)"></i>rival</span></div>`+near.map(t=>{const r=G.c[t];return`<div class="rival"><button class="rh" data-a="dipnat" data-t="${t}"><b>${flagOf(t)}${esc(r.n)}</b><span>${ord(R.indexOf(t)+1)} of ${R.length}</span></button>${pbRow("Industry",sc(c).ind||0,sc(r).ind||0)}${pbRow("Army",sc(c).mil||0,sc(r).mil||0)}${pbRow("Navy",fleetOf(tag),fleetOf(t))}${pbRow("Prestige",Math.round(c.pres),Math.round(r.pres))}</div>`;}).join("");
 const wars=G.wars.filter(w=>w.att.includes(tag)||w.def.includes(tag));
 const s2=wars.length?wars.map(w=>{const side=w.att.includes(tag)?1:2,ws=side===1?w.ws:-w.ws,need=WARGOALS[w.goal.k].ws,lead=w.att[0]===tag||w.def[0]===tag,foes=(side===1?w.def:w.att),allies=(side===1?w.att:w.def).filter(t=>t!==tag),en=new Set(foes);
  const lost=G.plist.filter(p=>p.o===tag&&p.ctl&&p.ctl!==p.o&&en.has(p.ctl)),won=G.plist.filter(p=>p.ctl===tag&&p.o!==tag&&en.has(p.o)),pn=L=>L.slice(0,4).map(p=>`<button class="pill" style="min-height:44px;padding:.1rem .7rem;font-size:.88rem" data-a="goprov" data-p="${p.id}">${esc(p.n)}</button>`).join(" ")+(L.length>4?" and "+(L.length-4)+" more":"");
  const left=ws>=0?50:50+ws/2,wd=Math.abs(ws)/2;
  return`<div class="war"><b class="t">${esc(foes.map(nameOf).join(", "))}</b><div class="small muted">${WARGOALS[w.goal.k].n}${w.goal.prov?": "+esc(P(w.goal.prov).n):""}${allies.length?"; with "+esc(allies.map(nameOf).join(", ")):""}; ${G.t-w.start} month${G.t-w.start===1?"":"s"} old</div><div class="wscore" role="img" aria-label="War score ${Math.round(ws)}"><i class="${ws<0?"neg":""}" style="left:${left}%;width:${wd}%"></i><u style="left:50%"></u><s style="left:${clamp(50+need/2,0,100)}%"></s></div><div class="small">War score <b class="${ws<0?"bad":"good"}">${Math.round(ws).toString().replace("-","−")}</b>; our goal needs <b>${need}</b>.</div>${lost.length?`<div class="small" style="margin-top:.3rem">Held by the enemy: ${pn(lost)}</div>`:""}${won.length?`<div class="small" style="margin-top:.3rem">We hold: ${pn(won)}</div>`:""}<div class="row"><button class="btn sm" data-a="why" data-k="ws" data-w="${w.id}">What makes up the score</button>${lead?`<button class="btn sm pri" data-a="dealopen" data-w="${w.id}">Peace terms</button>`:""}<button class="btn sm" data-a="tab" data-t="dip">The war in full</button></div></div>`;}).join(""):`<p class="calm">We are at peace.</p><div class="small muted" style="text-align:center">${c.infamy>=COAL_AT-6?"Infamy is high, so be careful whom you provoke. ":""}Tap the World page to find a cause for war.</div>`;
 const inc=st.inc||0,exp=st.exp||0,mx=Math.max(inc,exp,1),run=net<0&&c.tr>0?Math.floor(c.tr/-net):null;
 const s3=`<div class="bud"><span>Income</span><span class="meter green"><i style="width:${(inc/mx*100).toFixed(0)}%"></i></span><em>${money(inc)}</em></div><div class="bud"><span>Spending</span><span class="meter red"><i style="width:${(exp/mx*100).toFixed(0)}%"></i></span><em>${money(exp)}</em></div><div class="kgrid" style="margin-top:.5rem"><button class="kpi tap ex ${net<0?"bad":""}" data-a="why" data-k="net"><span class="k">Balance</span><span class="v">${net>=0?"+":"−"}${money(Math.abs(net))}</span><span class="d">${net<0?(run!=null?"reserves last "+run+" month"+(run===1?"":"s"):"reserves are gone"):"a month, in the black"}</span></button><button class="kpi tap ex ${c.tr<0?"bad":""}" data-a="why" data-k="net"><span class="k">Treasury</span><span class="v">${moneyS(c.tr)}</span><span class="d">${c.debt>0?"debt "+money(c.debt):"no debt"}</span></button></div><p class="small muted">Taxes ${money(st.taxes||0)} and tariffs ${money(st.tariffs||0)} come in. Pay ${money(st.pay||0)}, supplies and building ${money(st.gov||0)} and interest ${money(st.interest||0)} go out.</p><div class="row"><button class="btn sm" data-a="tab" data-t="nat">Open the budget</button></div>`;
 const hot=provsOf(tag).map(p=>[p,milOf(p)]).sort((a,b)=>b[1]-a[1]).slice(0,5).filter(x=>x[1]>=1.5);
 const s4=hot.length?hot.map(([p,m])=>`<button class="hot" data-a="goprov" data-p="${p.id}"><b>${esc(p.n)}</b><span class="meter ${m>=5?"red":""}"><i style="width:${Math.min(100,m*10)}%"></i></span><small>militancy ${m.toFixed(1)} of 10, ${ppl(p.pop)} people${p.ctl&&p.ctl!==p.o?", occupied":""}${p.rebels>0?", rebels about":""}</small></button>`).join(""):`<p class="calm">No province is restless.</p>`;
 const pinned=G.agenda?.goals.find(goal=>goal.done==null);
 const alerts=overAlerts().sort((a,b)=>(a.sev==="bad"?0:1)-(b.sev==="bad"?0:1));
 const urgent=alerts[0],lastChoice=G.choices?.at(-1);
 const underway=provsOf(c.tag).flatMap(province=>province.build.filter(project=>project.state).map(project=>({province,project})));
 const commitment=underway.sort((a,b)=>projProgress(b.project)-projProgress(a.project))[0];
 const quick=`<section class="turn-brief" aria-label="This month">
 <p><b>${esc(c.n)} · ${dateStr(G.t)}</b></p>
 ${urgent?`<button class="btn pri" ${alData(urgent)}>${esc(urgent.txt)}</button>`:pinned?`<button class="btn" data-a="tab" data-t="${AGENDA_METRICS[pinned.key].tab}">${esc(pinned.title)}</button>`:""}
 ${lastChoice?`<p class="small">Last decision · ${esc(lastChoice.label)}</p>`:""}
 ${commitment?`<p class="small">Nearest project milestone · <button class="btn sm" data-a="goprov" data-p="${esc(commitment.province.id)}">${esc(projName(commitment.project))} in ${esc(commitment.province.n)}</button> ${pct(projProgress(commitment.project))}</p>`:""}
 <p>Treasury ${moneyS(c.tr)} · ${moneyS(net)} per month<br>Basic needs met ${pct(nf.poor)}</p>
 </section>`;
 const secs=[["The minister's brief","Brief",briefFrame()],["The state of the nation","State",s0],["Rivals compared with us","Rivals",s1],["Wars and fronts","Wars",s2],["Budget this month","Budget",s3],["Unrest hotspots","Unrest",s4],["Cabinet agenda","Agenda",agendaHTML(c)],["Objectives","Goals",objHTML()]];
 const resume=UI.resumedAt===G.t?`<section class="card"><h2>Campaign resumed</h2><p>${esc(c.n)} · ${dateStr(G.t)}</p>${G.card?'<button class="btn" data-a="cardshow">Review pending decision</button>':""}<button class="btn" data-a="tab" data-t="works">Review construction queue</button></section>`:"";
 const outcome=c.historicalOutcome;
 return resume+quick+(outcome?`<section class="card"><h2>Punjab campaign outcome</h2><p>${esc(outcome.status)} · ${dateStr(outcome.month)}</p><p>Basic needs ${outcome.welfare}% · Schools ${outcome.schools}</p></section>`:"")+punjabChallengeHTML(c)+`<header class="headpiece">${VIG}<h1>The State of the Nation</h1><div class="sub">A summary for ${headTitle(c)}</div>${HEADORN}</header>${coachHTML("over")}<nav class="jumpbar" aria-label="Sections on this page">${secs.map((s,i)=>`<button data-a="jumpsec" data-i="${i}">${s[1]}</button>`).join("")}</nav>${alertsHTML()}${secs.map((s,i)=>frame(i,s[0],s[2])).join("")}${TAILORN}`;}
/* ---------- Dispatches: the existing news and decision content, for now ---------- */
function pgDisp(){UI.readM=G.msgs[0];const k=G.card;return pgNews().replace("<h1>News</h1>","<h1>Dispatches</h1>"+(k?`<div class="card warn"><h2>A decision awaits</h2><p><b>${esc(k.title)}</b></p><p class="small muted">${esc(k.txt)}</p><div class="row"><button class="btn pri" data-a="cardshow">Decide now</button></div></div>`:"")).replace('<div class="card news">','<div class="card news"><h2>Recent news</h2>');}
/* ---------- framed sections: collapse state is remembered ---------- */
let FOLD_=null;function FOLDS(){if(!FOLD_){try{FOLD_=JSON.parse(localStorage.getItem("vic.fold")||"{}")||{};}catch(e){FOLD_={};}}return FOLD_;}
function foldSave(){try{localStorage.setItem("vic.fold",JSON.stringify(FOLD_));}catch(e){}}
function enhance(pg){const F=FOLDS();pg.querySelectorAll(".card").forEach(s=>{const h=s.firstElementChild;if(!h||h.tagName!=="H2"||h.classList.contains("foldh"))return;const key=UI.tab+":"+h.textContent.trim();h.classList.add("foldh");h.dataset.a="fold";h.dataset.k=key;h.setAttribute("role","button");h.setAttribute("tabindex","0");h.insertAdjacentHTML("beforeend",CHEV);const col=F[key]===true;h.setAttribute("aria-expanded",String(!col));if(col)s.classList.add("collapsed");});}
/* ---------- sheets: More, Settings, Guide ---------- */
function openModal(h){const m=$("#modal");if(m.hidden)UI.modalReturnFocus=document.activeElement;m.innerHTML=h;m.hidden=false;const s=m.firstElementChild;if(s)s.focus();}
function closeModal(){const m=$("#modal");if(m){m.hidden=true;m.innerHTML="";UI.modalReturnFocus?.focus();UI.modalReturnFocus=null;}}
function openMore(){openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>More</h2><button class="x" data-a="close" aria-label="Close">×</button></div><div class="moregrid">${[["nat","Nation","nat"],["news","Dispatches","disp"],["mil","Military","mil"],["pol","Politics","pol"],["dip","World","dip"],["tech","Research","tech"],["chron","News","news"],["ledger","Ledger","ledger"],["works","Works","works"],["guide","Guide","guide"],["set","Settings","gear"]].map(([k,l,i])=>`<button class="mbtn" data-a="${k==="guide"?"guide":k==="set"?"settings":k==="ledger"?"ledger":"tab"}" data-t="${k}">${ic(i)}<span>${l}</span></button>`).join("")}</div><p class="small muted" style="text-align:center;margin:.6rem 0 0">Overview, Dispatches, Map, Economy and Military are on the bar below.</p></div>`);}
function openGuide(){openModal(`<div class="msheet" tabindex="-1"><div class="sh-h"><h2>How to play</h2><button class="x" data-a="close" aria-label="Close">×</button></div><ol class="guide"><li><b>Read the Overview.</b> The red and gold strips are warnings. Tap one to go where it can be fixed.</li><li><b>Keep the treasury in the black.</b> Taxes and spending are on the Nation page.</li><li><b>Build.</b> Tap one of your provinces on the map to build factories, railways and other works.</li><li><b>Mind the people.</b> Poor, angry provinces rise in revolt. Reforms on the Politics page calm them.</li><li><b>Choose wars carefully.</b> The World page lists causes for war. Every land grab raises infamy, and at 25 your neighbours band together.</li><li><b>Press End month.</b> History moves on, and decisions arrive as cards you must answer.</li></ol></div>`);}
Object.assign(ACT,{more:()=>openMore(),settings:()=>openSettings(),guide:()=>openGuide(),
 ledger:()=>{closeModal();UI.tab="dip";UI.dipT=null;closeSheet();render();const t=$("#page table.ledger");if(t){const f=t.closest(".card");if(f&&f.classList.contains("collapsed")){f.classList.remove("collapsed");}t.scrollIntoView({block:"start"});}},
 fold:(d,el)=>{const s=el.closest(".frame,.card");if(!s)return;const c=!s.classList.contains("collapsed");s.classList.toggle("collapsed",c);el.setAttribute("aria-expanded",String(!c));FOLDS()[d.k]=c;foldSave();},
 jumpsec:d=>{const pg=$("#page"),s=pg.querySelector(`[data-si="${d.i}"]`);if(!s)return;if(s.classList.contains("collapsed")){s.classList.remove("collapsed");const h=s.querySelector(".foldh");if(h){h.setAttribute("aria-expanded","true");FOLDS()[h.dataset.k]=false;foldSave();}}s.scrollIntoView({behavior:"smooth",block:"start"});},
 alall:()=>{UI.alAll=!UI.alAll;render();},
 goprov:d=>{const p=P(d.p);closeModal();UI.tab="map";closeSheet();render();UI.view.x=p.x-UI.view.w/2;UI.view.y=p.y-UI.view.h/2;applyView();pickProv(d.p);},
 tz:d=>{UI.tz=+d.v;document.documentElement.style.setProperty("--tz",UI.tz);UI._llk="";UI._lf=null;if(typeof placeLabels==="function"&&UI._sc)setTimeout(()=>{mapRect();UI._sc=0;applyView();},0);try{localStorage.setItem("vic.tz",String(UI.tz));}catch(e){}openSettings();}});
for(const k of["tab","load","import"]){const f=ACT[k];ACT[k]=(d,el)=>{closeModal();f(d,el);if(k==="tab"){const pg=$("#page");if(pg)pg.scrollTop=0;}else UI.readM=G.msgs[0];};}
{const f=ACT.cheat;ACT.cheat=(d,el)=>{f(d,el);openSettings();};}
{const f=ACT.cont;ACT.cont=(d,el)=>{f(d,el);if(!$("#start")){UI.tab="map";UI.readM=G.msgs[0];bmRestore();render();atlasHome();}};}
ACT.theme=d=>{const r=document.documentElement,cur=r.dataset.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),nx=d.v||(cur==="dark"?"light":"dark");r.dataset.theme=nx;try{localStorage.setItem("vic.theme",nx);}catch(e){}openSettings();};
PAGES.over=pgOver;PAGES.news=pgDisp;

const CHG={tax0:v=>{me().tax[0]=v/100;},tax1:v=>{me().tax[1]=v/100;},tax2:v=>{me().tax[2]=v/100;},tariff:v=>{me().tariff=v/100;},edu:v=>{me().sp.edu=v/100;},adm:v=>{me().sp.adm=v/100;},soc:v=>{me().sp.soc=v/100;},mil:v=>{me().sp.mil=v/100;}};
document.addEventListener("click",e=>{const el=e.target.closest("[data-a]");if(!el||el.disabled)return;if(el.dataset.a==="end"&&e.detail>1)return;const f=ACT[el.dataset.a];if(f)f(el.dataset,el);});
document.addEventListener("click",e=>{if(e.target&&e.target.id==="modal")closeModal();});
document.addEventListener("change",e=>{const k=e.target.dataset&&e.target.dataset.c;if(k&&CHG[k]){CHG[k](+e.target.value);render();}});
document.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.c;if(k&&CHG[k]){CHG[k](+e.target.value);const b=e.target.parentElement.querySelector("b");if(b)b.textContent=e.target.value+"%";}});
/* ---------- the start ---------- */
function skyline(){const chim=(x,h,w)=>`<rect x="${x}" y="${116-h}" width="${w}" height="${h}"/><rect x="${x-1.5}" y="${116-h-3}" width="${w+3}" height="3"/>`,win=(x,y)=>`<rect x="${x}" y="${y}" width="3" height="4" fill="var(--panel)" stroke="none"/>`;
 let s=`<svg class="sky" viewBox="0 0 320 150" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width=".7" opacity=".55">`;for(let i=0;i<9;i++)s+=`<path d="M${8+i*3} ${122+i*3} H${312-i*4}"/>`;
 s+=`</g><circle cx="272" cy="30" r="13" fill="var(--gold)" opacity=".85"/><circle cx="272" cy="30" r="9" fill="none" stroke="var(--panel)" stroke-width="1" opacity=".7"/><g fill="var(--gold)">${[[40,18],[96,30],[150,12],[206,34],[236,14]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="1.1"/>`).join("")}</g>
 <g fill="none" stroke="currentColor" stroke-width="1.1" opacity=".45" stroke-linecap="round"><path d="M38 52 q-8-8 2-14 q10-6 2-14"/><path d="M62 46 q-7-7 2-12 q9-5 1-12"/><path d="M196 50 q-8-8 2-14 q10-6 2-14"/></g>
 <g fill="currentColor" stroke="currentColor" stroke-width="1">${chim(36,64,6)}${chim(60,56,5)}${chim(194,60,6)}
 <rect x="8" y="94" width="96" height="22"/><path d="M8 94 l12-10 12 10 12-10 12 10 12-10 12 10 12-10 12 10z"/>${win(18,100)}${win(34,100)}${win(50,100)}${win(66,100)}${win(82,100)}
 <path d="M120 116 V84 a22 20 0 0 1 44 0 V116z"/><path d="M142 64 v-10" /><circle cx="142" cy="51" r="3"/><path d="M112 116 V96 h12 M160 96 h12 V116" fill="none"/><rect x="110" y="96" width="64" height="20"/>
 <rect x="186" y="92" width="64" height="24"/>${win(194,98)}${win(210,98)}${win(226,98)}${win(240,98)}<path d="M186 92 l32-12 32 12z"/>
 <path d="M258 116 V70 l5-14 5 14 V116z"/><rect x="0" y="115" width="320" height="3"/></g>
 <path d="M200 116 h82 l-8 -10 h-66z" fill="none"/>
 <g fill="currentColor"><path d="M44 134 h96 l-11 9 h-74z"/><rect x="62" y="125" width="30" height="9"/><rect x="98" y="118" width="7" height="16"/><rect x="96.5" y="115" width="10" height="3.5"/><rect x="66" y="128" width="3" height="3" fill="var(--panel)"/><rect x="74" y="128" width="3" height="3" fill="var(--panel)"/><rect x="82" y="128" width="3" height="3" fill="var(--panel)"/></g><path d="M102 113 q-7-5 0-9 q7-4 1-9" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/><path d="M52 134 v-18 M52 118 h-0 l10 4 -10 4z M120 134 v-12" stroke="currentColor" stroke-width=".9" fill="none"/></svg>`;return s;}
function returnCampaignView(){
 const modal=$("#modal");
 if(modal&&!modal.hidden){closeModal();return true;}
 if(G?.card&&!UI.cardHide){ACT.cardhide();return true;}
 if($("#pickc")){closeChooser();return true;}
 if($("#lenspop")&&!$("#lenspop").hidden){closeLens();return true;}
 if(UI.hx){hdrX(false);return true;}
 if($("#sheet")?.classList.contains("open")){closeSheet();return true;}
 if(!UI.previousTabs?.length)return false;
 UI.returning=true;
 try{ACT.tab({t:UI.previousTabs.pop()});}finally{UI.returning=false;}
 return true;
}
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&returnCampaignView())event.preventDefault();
});
/* Back is the on-screen arrow (and Escape). The History API is not used: inside the claude.ai wrapper a pushed entry could navigate the host page. */
function armCampaignBack(){}
function boot(){try{const th=localStorage.getItem("vic.theme");if(th)document.documentElement.dataset.theme=th;const z=+localStorage.getItem("vic.tz");if(z>=.8&&z<=1.3){UI.tz=z;document.documentElement.style.setProperty("--tz",z);}}catch(e){}(function(h){const o=document.getElementById("app");if(o){let n=o;while(n){const x=n.nextSibling;if(n.nodeType!==1||!/^(STYLE|SCRIPT|META|TITLE|LINK)$/.test(n.tagName))n.remove();n=x;}}document.body.insertAdjacentHTML("beforeend",h);})(`<div id="app"><header class="top"><div class="band" aria-hidden="true"></div><div class="hdr" id="hdr"></div><div id="stats"></div></header><div id="ticker" role="status" aria-live="polite"><i></i><span>Welcome to The Long Century.</span></div><main><div id="map"></div><div id="page"></div><div id="sheet"></div></main><nav class="bnav" aria-label="Sections"></nav></div><div id="modal" hidden></div>`);showStart();}
window.addEventListener("load",boot);
