"use strict";
/* ================= PROVINCE BUILDINGS ================= */
const BLD={
 fort:{n:"Fortress",max:5,cost:{cement:400,steel:60,timber:400},d:"Defenders fight better; sieges take longer.",lv:p=>p.fort,up:p=>{p.fort++;}},
 port:{n:"Naval base",max:3,cost:{timber:900,cement:200,machinery:30},d:"Repairs and supplies fleets; level 2 can build ironclads and later ships.",lv:p=>p.port||0,ok:p=>p.sea,up:p=>{p.port=(p.port||0)+1;}},
 uni:{n:"University",max:2,cost:{cement:200,paper:250,furniture:150},d:"Research +4 points a month per level; literacy rises faster here.",lv:p=>p.uni||0,up:p=>{p.uni=(p.uni||0)+1;}},
 hosp:{n:"Hospital",max:2,cost:{cement:150,clothes:150,furniture:100},d:"The population here grows faster and is less angry.",lv:p=>p.hosp||0,up:p=>{p.hosp=(p.hosp||0)+1;}},
 irr:{n:"Irrigation",max:3,cost:{timber:600,cement:250,machinery:20},d:"Farm output +12% per level.",lv:p=>p.irr||0,ok:p=>!!p.farm,up:p=>{p.irr=(p.irr||0)+1;}},
 minew:{n:"Mine works",max:3,cost:{timber:500,steel:80,machinery:40},d:"Mine output +15% per level.",lv:p=>p.minew||0,ok:p=>!!p.mine,up:p=>{p.minew=(p.minew||0)+1;}}};
/* ---- B1: more province buildings. Levels of the new ones live in p.bx (missing = level 0); each effect is read by a system that already exists (hook named in each line) ---- */
const bxl=(p,k)=>(p.bx&&p.bx[k])||0,bxUp=(p,k)=>{(p.bx=p.bx||{})[k]=bxl(p,k)+1;};
const popAvg=(p,f)=>{let a=0,n=0;for(const q of p.pops){a+=q[f]*q.n;n+=q.n;}return n>0?a/n:0;};
const hostBorder=(c,p)=>ADJ[p.id].some(id=>{const o=P(id).o;return o&&o!==c.tag&&((c.rel[o]||0)<-30||atWarWith(c,G.c[o]));});
const needT=(c,id)=>c.tech[id]?"":"Needs "+tNm(TF[id].n)+".";
function mkB(k,o){const B=BLD[k]=Object.assign({max:2,m:10,grp:"eco",sc:1,lv:p=>bxl(p,k),up:p=>bxUp(p,k)},o);let v=0;for(const g in B.cost)v+=B.cost[g]*GOODS[g].p;B.upk=Math.round(v*.008);return B;}
mkB("depot",{n:"Railway depot",max:3,grp:"mil",m:8,cost:{timber:500,cement:200,steel:80},tech:"rail1",chk:(c,p)=>p.rail<1?"Needs a railway here first.":"",d:"Supply limit +2 and marching speed +6% in this province, for each level (stacks with the railway). Read by supply limits and army movement."});
mkB("barracks",{n:"Barracks",max:3,grp:"mil",m:8,cost:{timber:450,cement:150,clothes:80},d:"Mobilization draws 25% more brigades from this province per level. Read by the mobilization plan."});
mkB("arsenal",{n:"Arsenal",max:2,grp:"mil",m:12,cost:{timber:400,cement:350,steel:150,machinery:60},tech:"percussion",d:"Brigades and ships raised here cost 10% less per level and are finished 20% faster. Read by recruitment."});
mkB("dock",{n:"Dry dock",max:2,grp:"mil",m:14,cost:{timber:700,cement:500,steel:200,machinery:60},tech:"ironclad",chk:(c,p)=>!p.sea?"Needs a coast.":(p.port||0)<2?"Needs a naval base of level 2 here first.":"",d:"Ships in this port mend 6% faster each month per level, and dreadnoughts can be built only where there is a dry dock."});
mkB("coal",{n:"Coaling station",max:2,grp:"mil",m:6,cost:{timber:300,cement:120,steel:60},tech:"ironclad",chk:(c,p)=>p.sea?"":"Needs a coast.",d:"Steam warships within two sea zones (three at level 2) keep their organization; far from any station they recover at half pace. Read by fleet recovery."});
mkB("telegraph",{n:"Telegraph office",max:2,grp:"eco",m:8,cost:{timber:100,machinery:25,paper:60},tech:"telegraph",d:"Administration +2% and tax collection +1% per level for the whole nation (at most +10% and +5% with courts too). Read by administration and tax collection."});
mkB("customs",{n:"Customs house",max:2,grp:"eco",m:8,cost:{timber:250,cement:150,paper:100},chk:(c,p)=>p.sea?"":"Needs a coast.",d:"Tariff income +8% per level (at most +30% for the nation). Read by tariff revenue."});
mkB("bank",{n:"Bank branch",max:2,grp:"eco",m:10,cost:{cement:250,furniture:150,paper:150},chk:(c,p)=>(G.decDone&&G.decDone[c.tag]||[]).includes("bank")?"":"Needs the central bank decision.",d:"More private capital stays invested instead of flowing back to households: the reserve for new factories grows 18% per level (at most +120% with the exchange). Read by the investment reserve."});
mkB("exchange",{n:"Stock exchange",max:1,grp:"eco",m:14,cost:{cement:400,furniture:200,paper:300},tech:"exchange",chk:(c,p)=>p.id!==c.cap?"Only in the capital.":"",d:"The reserve of private capital for new factories grows 45%. Capital only. Read by the investment reserve."});
mkB("school",{n:"School",max:3,grp:"soc",m:6,cost:{timber:150,cement:60,paper:80},d:"People here learn to read faster: the literacy target rises 3 points per level. Cheaper than a university. Read by the literacy growth."});
mkB("college",{n:"Technical college",max:2,grp:"soc",m:12,cost:{cement:250,paper:250,machinery:30},tech:"steam_eng",chk:(c,p)=>popAvg(p,"lit")<.35?"Needs a literacy of 35% here.":"",d:"Research +3 points a month per level. Needs a literate province. Read by the research rate."});
mkB("silo",{n:"Grain silo",max:2,grp:"soc",m:6,cost:{timber:300,cement:200},d:"In a bad year the people here keep their life needs 12 points higher per level, and a famine bites less. Read by population growth, unrest and the famine."});
mkB("water",{n:"Waterworks and sewers",max:2,grp:"soc",m:14,cost:{cement:500,timber:300,steel:100,machinery:30},tech:"antisep",chk:(c,p)=>p.pop<2000?"Only in cities of two million people or more.":"",d:"The people here grow faster, 0.02% a month per level, and are calmer. Read by population growth."});
mkB("power",{n:"Power station",max:2,grp:"eco",m:12,cost:{steel:200,machinery:120,cement:200},tech:"dynamo",chk:(c,p)=>p.factories.some(f=>f.lv>0)?"":"Needs a factory here.",d:"Every factory in this province produces 8% more per level. Read by factory output."});
mkB("police",{n:"Police station",max:2,grp:"soc",m:6,cost:{timber:150,cement:100,clothes:40},d:"Militancy here falls by 0.35 per level; people grow a little more politically aware. Read by militancy and consciousness."});
mkB("court",{n:"Courthouse",max:2,grp:"soc",m:8,cost:{timber:200,cement:200,furniture:100},d:"Unrest here falls 2 points a month per level; administration +1% and tax collection +0.5% for the nation. Read by provincial unrest, administration and tax collection."});
mkB("worship",{n:"House of worship",max:2,grp:"soc",m:12,cost:{cement:300,timber:250,furniture:100},d:"A cathedral, great mosque or temple. Militancy here falls by 0.3 per level, by half as much among peoples the state does not accept. Read by militancy."});
mkB("theatre",{n:"Opera house and museum",max:2,grp:"cul",m:14,cost:{cement:400,furniture:300,paper:100},tech:"realism",d:"A steady trickle of prestige: +0.003 a month per level, at most +0.012 for the nation. Read by the monthly prestige."});
mkB("press",{n:"Newspaper press",max:2,grp:"cul",m:8,cost:{machinery:40,paper:200,timber:100},tech:"telegraph",d:"People here become politically aware faster, +0.6 per level on their target. Read by consciousness, and so by militancy and the parties."});
/* old buildings: group, and no scaling of cost by level */
Object.assign(BLD.fort,{grp:"mil",m:10,sc:0});Object.assign(BLD.port,{grp:"mil",m:10,sc:0});Object.assign(BLD.uni,{grp:"soc",m:10,sc:0});Object.assign(BLD.hosp,{grp:"soc",m:10,sc:0});Object.assign(BLD.irr,{grp:"eco",m:10,sc:0});Object.assign(BLD.minew,{grp:"eco",m:10,sc:0});
for(const k of["fort","port","uni","hosp","irr","minew"])BLD[k].upk=0;
BLD.irr.okw="Needs farmland.";BLD.minew.okw="Needs a mine.";BLD.port.okw="Needs a coast.";
const BGRP={mil:"Military",eco:"Economy",soc:"People",cul:"Culture"};
const bldCost=(p,k)=>{const B=BLD[k],f=B.sc?1+.4*B.lv(p):1,C={};for(const g in B.cost)C[g]=Math.round(B.cost[g]*f);return C;};
const bldMoney=C=>{let v=0;for(const g in C)v+=C[g]*G.price[g];return v;};
const buildSlots=c=>Math.max(2,Math.min(10,2+Math.floor(provsOf(c.tag).filter(p=>p.ctl===p.o&&p.col).length/4)));
const bldActive=c=>{let n=0;for(const p of provsOf(c.tag))for(const b of p.build)if(b.k==="bld")n++;return n;};
function bldCan(c,p,k){const B=BLD[k];if(p.o!==c.tag||p.ctl!==p.o)return{ok:false,why:"Only in provinces we hold."};if(p.waste)return{ok:false,why:"Not possible here."};if(B.ok&&!B.ok(p))return{ok:false,why:B.okw||"Not possible here."};if(B.lv(p)>=B.max)return{ok:false,why:"At the highest level."};if(B.tech&&!c.tech[B.tech])return{ok:false,why:needT(c,B.tech)};const w=B.chk&&B.chk(c,p);if(w)return{ok:false,why:w};if(p.build.some(b=>b.k==="bld"&&b.b===k))return{ok:false,why:"Already under construction."};return{ok:true};}
function startBld(c,p,k,force,pid){const ok=bldCan(c,p,k);if(!ok.ok)return ok;if(!force&&bldActive(c)>=buildSlots(c))return{ok:false,full:true,why:"All "+buildSlots(c)+" building slots are busy.",txt:"All "+buildSlots(c)+" building slots are busy."};const C=bldCost(p,k);const nb={k:"bld",b:k,left:Object.assign({},C),cost:C,state:true,pid:pid||newPid()};p.build.push(nb);return{ok:true,txt:"Work begins on "+(k==="minew"?"the mine works":"a "+BLD[k].n.toLowerCase())+" in "+p.n+"."};}
/* the player's waiting list: first in, first out as slots free up */
function bqAdd(c,pid,k){
 const p=P(pid),B=BLD[k];
 const waiting=(c.bq||[]).filter(order=>order.p===pid&&order.b===k).length;
 const active=p.build.filter(project=>project.k==="bld"&&project.b===k).length;
 if(B.lv(p)+waiting+active>=B.max){
  const why=B.lv(p)>=B.max?"At the highest level.":"Existing orders already reach the highest level.";
  return{ok:false,why,txt:why};
 }
 if(waiting)return{ok:false,why:"Already in the queue.",txt:"Already in the queue."};
 c.bq=c.bq||[];
 c.bq.push({p:pid,b:k,id:"q"+(c.queueSequence=(c.queueSequence||0)+1)});
 return{ok:true,txt:B.n+" in "+p.n+" is queued."};
}
function bqMonth(c){if(!c.bq||!c.bq.length||bldActive(c)>=buildSlots(c))return;const it=c.bq[0],p=P(it.p),r=startBld(c,p,it.b,false,queuePid(c,it));if(r.ok){if(it.orderId!=null)p.build.at(-1).orderId=it.orderId;c.bq.shift();if(c.tag===G.player)msg("economy",r.txt);}else if(!r.full){c.bq.shift();queueEnd(c,it,r.why);if(c.tag===G.player)msg("economy","A queued project was dropped: "+BLD[it.b].n+" in "+p.n+". "+r.why);}}
function bxAgg(){for(const t in G.c){const c=G.c[t];if(c.alive)c._bx={admin:0,inv:0,cust:0,pres:0,rp:0,up:0};}
 for(const p of G.plist){if(!p.o||!p.bx)continue;const c=G.c[p.o],a=c&&c._bx;if(!a)continue;for(const k in p.bx){const l=p.bx[k];if(!l||!BLD[k])continue;a.up+=BLD[k].upk*l;if(p.ctl!==p.o)continue;if(k==="telegraph")a.admin+=.02*l;else if(k==="court")a.admin+=.01*l;else if(k==="customs")a.cust+=.08*l;else if(k==="bank")a.inv+=.06*l;else if(k==="exchange")a.inv+=.15*l;else if(k==="theatre")a.pres+=.003*l;else if(k==="college")a.rp+=3*l;}}
 for(const t in G.c){const a=G.c[t]._bx;if(!a)continue;a.admin=Math.min(.1,a.admin);a.cust=Math.min(.3,a.cust);a.inv=Math.min(.4,a.inv);a.pres=Math.min(.012,a.pres);}}
/* ---- the payoff of a building here, in pounds a month: the same figure the player's "best province" list shows and the AI ranks by ---- */
const PC=10;
function fleetBuildingStats(c){if(c._fl&&c._fl.t===G.t)return c._fl;let n=0;for(const a of G.armies)if(a.o===c.tag&&a.naval&&!a.reb)n+=a.u.length;let far=0;for(const p of G.plist)if(p.o===c.tag&&p.col===0)far++;return c._fl={t:G.t,n,far};}
function bldVal(c,p,k){const u=p.pop*PC,lit=popAvg(p,"lit"),mil=popAvg(p,"mil"),inc=c.stat.inc||0,hb=hostBorder(c,p),war=c.war.length>0,cap=p.id===c.cap,lv=BLD[k].lv(p);let v=0,t="";const nat=(cur,cp,per)=>Math.max(0,Math.min(per,cp-cur));
 switch(k){
 case"fort":v=(hb?70:p.t==="m"?20:8)*(war?1.5:1);t=hb?"it faces a rival":"a safe stronghold";break;
 case"port":v=(p.sea?(cap&&c.tech.ironclad&&(p.port||0)<2?90:25):0);t="supplies fleets";break;
 case"uni":v=u*.0015+30;t="research";break;
 case"hosp":v=u*.003;t="healthier people";break;
 case"irr":v=(p._out&&p._out.farm||0)*G.price[p.farm||"grain"]*.12;t="farm output";break;
 case"minew":v=(p._out&&p._out.mine||0)*G.price[p.mine||"coal"]*.15;t="mine output";break;
 case"depot":v=60*(hb?2.5:1)*(war?1.5:1)+u*.0005;t=hb?"it faces a rival":"supply and marching";break;
 case"barracks":v=(hb?90:35)*(war?1.4:1);t="more men to call up";break;
 case"arsenal":v=(cap?80:12)*((c.rivalStr||0)>0?1.5:1);t="cheaper brigades";break;
 case"dock":{const f=fleetBuildingStats(c);v=((c.tech.dread&&lv===0?130:35)*(cap?1.3:.7)+f.n*(lv===0?14:6)*((p.port||0)>=2?1:.4))*(f.n?1:.5);t=f.n?"it mends and builds our "+f.n+" warships":"mends and builds ships";break;}
 case"coal":{const f=fleetBuildingStats(c);v=((p.col===0?60:25)*(c.tech.cruiser?1.3:1)+f.n*5+f.far*(p.col===0?10:4))*(lv?.7:1);t="steam fleets keep their strength";break;}
 case"telegraph":v=inc*.0025*nat(c._bx?c._bx.admin:0,.1,.02)/.02;t="a better run state";break;
 case"customs":v=(c.stat.tariffs||0)*.08*(p.pop/Math.max(1,sum(provsOf(c.tag).filter(x=>x.sea),x=>x.pop)));t="tariff income";break;
 case"bank":v=(c._cpAvg||0)*.06*.5;t="more capital to invest";break;
 case"exchange":v=(c._cpAvg||0)*.15*.5;t="more capital to invest";break;
 case"school":v=u*.002*(1-lit);t="more people who can read";break;
 case"college":v=u*.002*lit+25;t="research";break;
 case"silo":v=u*.002*(1+4*Math.max(0,.95-(c.fill&&c.fill.grain!=null?c.fill.grain:1)));t="protection from hunger";break;
 case"water":v=u*.004;t="faster growth";break;
 case"power":{let o=0;for(const f of p.factories)o+=(f._out||0)*G.price[f.g];v=o*.08;t="more factory output";break;}
 case"police":v=u*.003*(mil/5)+p.un*2;t="calmer streets";break;
 case"court":v=u*.002+p.un*u*.0004+inc*.0005;t="order and administration";break;
 case"worship":v=u*.003*(mil/5);t="calmer people";break;
 case"theatre":v=(cap?150:60)*(1-lv*.3);t="prestige";break;
 case"press":v=u*.0015*lit;t="more political awareness";break;}
 return{v:Math.max(0,v),t};}
function bldPay(c,p,k){const C=bldCost(p,k),cost=bldMoney(C),w=bldVal(c,p,k),net=w.v-BLD[k].upk;return{cost,val:w.v,net,why:w.t,yrs:net>0?cost/(net*12):99,score:net>0?net/cost:0,C};}
/* the best province for one kind of building, or the best (province, kind) pair overall */
function bldBest(c,k){let best=null;for(const p of provsOf(c.tag)){if(!bldCan(c,p,k).ok)continue;const y=bldPay(c,p,k);if(y.net>0&&(!best||y.score>best.y.score))best={p,k,y};}return best;}
function bldBestAll(c,lim){const L=[];for(const k in BLD){const b=bldBest(c,k);if(b)L.push(b);}L.sort((a,b)=>b.y.score-a.y.score);return lim?L.slice(0,lim):L;}
function railCan(c,p){if(p.o!==c.tag||p.ctl!==p.o)return{ok:false,why:"Only in provinces we hold."};if(p.rail>=railMax(c))return{ok:false,why:railMax(c)?"Our technology allows railways up to level "+railMax(c)+".":"We need railway technology."};if(p.build.some(b=>b.k==="rail"))return{ok:false,why:"Already under construction."};return{ok:true};}
const projProgress=b=>{const C=costOf(b);let t=0,l=0;for(const x in C){t+=C[x];l+=Math.max(0,b.left[x]||0);}return t?1-l/t:1;};
/* ================= GREAT WORKS ================= */
const ownsAny=(c,ids)=>ids.some(id=>P(id).o===c.tag),ownsAll=(c,ids)=>ids.every(id=>P(id).o===c.tag);
const capPop=c=>P(c.cap).pop;
const GW=[
 {id:"exhib",n:"The Great Exhibition",y:1850,cost:60000,m:18,uniq:1,d:"A palace of glass to show the world our industry. Prestige +15, research +10%.",ok:c=>c.civ&&capPop(c)>2000&&(isGP(c.tag)||!c.ai),fx:c=>{c.pres+=15;c.gwx.research=(c.gwx.research||0)+.1;}},
 {id:"telegraph",n:"The transatlantic telegraph",y:1857,cost:120000,m:30,uniq:1,d:"A cable under the ocean joins two continents. Prestige +10, administration +5%.",ok:c=>c.civ&&(ownsAny(c,["LON","NYC","QUE"])),fx:c=>{c.pres+=10;c.gwx.admin=(c.gwx.admin||0)+.05;}},
 {id:"suez",n:"The Suez Canal",y:1859,cost:400000,m:96,uniq:1,d:"Opens a sea route from the Mediterranean to the Indian Ocean; tolls of £3k a month to its owner. Prestige +25.",ok:c=>c.civ&&(P("CAI").o===c.tag||(P("CAI").o&&G.c[P("CAI").o].sphere===c.tag)||(["GBR","FRA"].includes(c.tag)&&P("CAI").o&&(G.c[P("CAI").o].rel[c.tag]||0)>-20)),fx:c=>{c.pres+=25;addLane("CAI","YEM",1);addLane("CAI","BOM",2);addLane("CAI","MUS",2);G.canal=G.canal||{};G.canal.suez=c.tag;}},
 {id:"transcon",n:"The Transcontinental Railroad",y:1860,first:10,cost:250000,m:72,d:"Railways across the plains and mountains to the Pacific. Railways +2 along the way, prestige +10; the first to finish gets 10 more.",ok:c=>c.civ&&ownsAll(c,["STL"])&&ownsAny(c,["SFO","ORG","PLN"]),fx:c=>{for(const id of["STL","PLN","SFO","ORG","CIN"])if(P(id).o===c.tag)P(id).rail+=2;c.pres+=10;}},
 {id:"capital",n:"A rebuilt capital",y:1853,cost:90000,m:48,d:"Boulevards, sewers and squares, as in Haussmann's Paris. The capital grows faster and calmer; prestige +8.",ok:c=>c.civ,fx:c=>{const p=P(c.cap);p.hosp=(p.hosp||0)+1;p.un=Math.max(0,p.un-20);c.pres+=8;}},
 {id:"metro",n:"A metropolitan railway",y:1863,cost:70000,m:36,d:"An underground railway beneath the capital. Capital railway +1, factory output there +10%.",ok:c=>c.civ&&capPop(c)>4000,fx:c=>{const p=P(c.cap);p.rail+=1;c.gwx.capfac=(c.gwx.capfac||0)+.1;c.pres+=5;}},
 {id:"gotthard",n:"The Gotthard Tunnel",y:1872,cost:110000,m:84,uniq:1,d:"A railway under the Alps. Railways +2 in Switzerland and northern Italy, prestige +8.",ok:c=>c.civ&&ownsAny(c,["ZUR","PIE","LOM"]),fx:c=>{for(const id of["ZUR","PIE","LOM","STU"])if(P(id).o===c.tag)P(id).rail+=2;c.pres+=8;}},
 {id:"kiel",n:"The Kiel Canal",y:1887,cost:120000,m:72,uniq:1,d:"Joins the Baltic to the North Sea. Fleets move faster; prestige +8.",ok:c=>c.civ&&P("SLH").o===c.tag,fx:c=>{addLane("SLH","HNV",1);addLane("SLH","LON",1);c.pres+=8;}},
 {id:"eiffel",n:"A tower for the world's fair",y:1887,cost:80000,m:24,uniq:1,d:"The tallest structure on earth, in iron. Prestige +20.",ok:c=>c.civ&&capPop(c)>3000&&(isGP(c.tag)||!c.ai),fx:c=>{c.pres+=20;}},
 {id:"baghdad",n:"The Berlin–Baghdad Railway",y:1888,cost:260000,m:96,d:"Rails from the Bosphorus to Mesopotamia. Railways +2 along the line, prestige +10.",ok:c=>c.civ&&ownsAll(c,["IST","BAG"]),fx:c=>{for(const id of["IST","ANK","ERZ","BAG","SMY"])if(P(id).o===c.tag)P(id).rail+=2;c.pres+=10;}},
 {id:"transsib",n:"The Trans-Siberian Railway",y:1890,cost:350000,m:120,uniq:1,d:"Rails across Asia to the Pacific. Railways +2 across Siberia, prestige +15.",ok:c=>c.civ&&ownsAll(c,["URA","OMS","IRK"]),fx:c=>{for(const id of["URA","OMS","IRK","KAZ"])if(P(id).o===c.tag)P(id).rail+=2;c.pres+=15;}},
 {id:"panama",n:"The Panama Canal",y:1880,cost:600000,m:120,uniq:1,d:"Joins the Atlantic and the Pacific; tolls of £4k a month. Prestige +30.",ok:c=>c.civ&&(P("BOG").o===c.tag||P("GUA").o===c.tag||(P("BOG").o&&G.c[P("BOG").o].sphere===c.tag)),fx:c=>{c.pres+=30;addLane("JAM","LIM",2);addLane("JAM","SFO",3);addLane("JAM","SCL",3);G.canal=G.canal||{};G.canal.panama=c.tag;}},
 {id:"univ",n:"A national university",y:1836,cost:50000,m:30,d:"A great university in the capital. Research +15%, literacy rises faster.",ok:c=>true,fx:c=>{c.gwx.research=(c.gwx.research||0)+.15;P(c.cap).uni=(P(c.cap).uni||0)+1;}}];
/* ---- B3: more great works. Each is tied to a province and a technology, and feeds an existing system (railways, irrigation, research, prestige, migration, taxes, capital) ---- */
const gwOwn=(c,ids)=>ids.filter(id=>{const o=P(id).o;return o===c.tag||(o&&G.c[o].sphere===c.tag);}),gwRail=(c,ids,n)=>{for(const id of ids)if(P(id).o===c.tag)P(id).rail+=n;};
const gwHost=c=>Object.keys(G.gwDone||{}).some(id=>id.startsWith("fair")&&G.gwDone[id].includes(c.tag));
const gwNeed=(c,t,ids)=>!c.civ?"We must be a westernized state.":!c.tech[t]?needT(c,t):ids&&!ids.every(id=>P(id).o===c.tag)?"We must hold "+ids.filter(id=>P(id).o!==c.tag).map(id=>P(id).n).join(" and ")+".":"";
GW.push(
 {id:"mtcenis",n:"The Mont Cenis Tunnel",y:1857,cost:100000,m:96,uniq:1,d:"The first great railway tunnel under the Alps. Railways +2 in Piedmont and Burgundy, prestige +8.",ok:c=>c.civ&&!!c.tech.rail1&&ownsAny(c,["PIE","LYO"]),why:c=>gwNeed(c,"rail1")||"We must hold Piedmont or Lyon.",fx:c=>{gwRail(c,["PIE","LYO"],2);c.pres+=8;}},
 {id:"ring",n:"The Ringstrasse",y:1860,cost:80000,m:60,uniq:1,d:"The old walls of Vienna come down for a ring of boulevards and public buildings. Vienna calmer and healthier, administration +3%, prestige +8.",ok:c=>c.civ&&!!c.tech.realism&&P("VIE").o===c.tag,why:c=>gwNeed(c,"realism",["VIE"]),fx:c=>{const p=P("VIE");p.un=Math.max(0,p.un-25);p.hosp=(p.hosp||0)+1;c.gwx.admin=(c.gwx.admin||0)+.03;c.pres+=8;}},
 {id:"tokyo",n:"The Tokyo–Yokohama railway",y:1870,cost:60000,m:30,d:"The first line of a modern railway network. Railways +2 in Kanto and +1 in Kansai, prestige +5.",ok:c=>c.civ&&!!c.tech.rail1&&P("EDO").o===c.tag,why:c=>gwNeed(c,"rail1",["EDO"]),fx:c=>{gwRail(c,["EDO"],2);gwRail(c,["OSA"],1);c.pres+=5;}},
 {id:"india",n:"The Indian railways",y:1853,cost:250000,m:96,d:"A trunk network joining Calcutta, Delhi and Bombay. Railways +2 across the plains, +1 in the Deccan and the centre; prestige +10.",ok:c=>c.civ&&!!c.tech.rail1&&ownsAll(c,["CAL","DEL","BOM"]),why:c=>gwNeed(c,"rail1",["CAL","DEL","BOM"]),fx:c=>{gwRail(c,["CAL","DEL","BOM","MDR"],2);gwRail(c,["NAG","HYD"],1);c.pres+=10;}},
 {id:"brooklyn",n:"The Brooklyn Bridge",y:1883,cost:100000,m:40,d:"A steel suspension bridge over the East River. Railway +1 in New York, prestige +6.",ok:c=>c.civ&&!!c.tech.bessemer&&P("NYC").o===c.tag,why:c=>gwNeed(c,"bessemer",["NYC"]),fx:c=>{gwRail(c,["NYC"],1);c.pres+=6;}},
 {id:"liberty",n:"The Statue of Liberty",y:1886,cost:60000,m:30,uniq:1,d:"A gift to the harbour of New York. Migrants from the old world choose New York more often; prestige +10.",ok:c=>c.civ&&!!c.tech.bessemer&&P("NYC").o===c.tag,why:c=>gwNeed(c,"bessemer",["NYC"]),fx:c=>{c.pres+=10;}},
 {id:"cpr",n:"The Canadian Pacific Railway",y:1881,cost:300000,m:96,first:6,d:"Rails from the St Lawrence to the Pacific. Railways +2 in Upper Canada, Rupert's Land and Oregon, +1 in Lower Canada; the prairie farms grow 8% more; prestige +12. The first to finish gets 6 more.",ok:c=>c.civ&&!!c.tech.rail2&&ownsAll(c,["TOR","RUP","ORG"]),why:c=>gwNeed(c,"rail2",["TOR","RUP","ORG"]),fx:c=>{gwRail(c,["TOR","RUP","ORG"],2);gwRail(c,["QUE"],1);P("RUP").farmCap*=1.08;c.pres+=12;}},
 {id:"aswan",n:"The Aswan Low Dam",y:1898,cost:120000,m:60,uniq:1,d:"A great dam on the Nile. Irrigation +2 in Upper Egypt and +1 in Lower Egypt; the valley's farmland grows 10%; prestige +8.",ok:c=>c.civ&&!!c.tech.bessemer&&P("ASW").o===c.tag,why:c=>gwNeed(c,"bessemer",["ASW"]),fx:c=>{const a=P("ASW");a.irr=Math.min(3,(a.irr||0)+2);a.farmCap*=1.1;if(P("CAI").o===c.tag)P("CAI").irr=Math.min(3,(P("CAI").irr||0)+1);c.pres+=8;}},
 {id:"nobel",n:"The Nobel prizes",y:1901,cost:70000,m:24,uniq:1,d:"Prizes for science and letters, awarded from Stockholm. Research +10%, prestige +15.",ok:c=>c.civ&&!!c.tech.darwin&&P("STO").o===c.tag,why:c=>gwNeed(c,"darwin",["STO"]),fx:c=>{c.gwx.research=(c.gwx.research||0)+.1;c.pres+=15;}},
 {id:"hejaz",n:"The Hejaz Railway",y:1900,cost:200000,m:96,uniq:1,d:"A pilgrim railway from Damascus to the holy cities. Railways +2 in Syria and the Hejaz, a depot at the end of the line; prestige +8.",ok:c=>c.civ&&!!c.tech.rail3&&ownsAll(c,["DAM","MEC"]),why:c=>gwNeed(c,"rail3",["DAM","MEC"]),fx:c=>{gwRail(c,["DAM","MEC"],2);bxUp(P("MEC"),"depot");c.pres+=8;}},
 {id:"cape",n:"The Cape to Cairo railway",y:1890,cost:450000,m:120,uniq:1,d:"A line the length of Africa. Needs the Cape, the Highveld, the Great Lakes, the Sudan and both Egypts, ours or in our sphere. Railways +2 along it, prestige +20.",ok:c=>c.civ&&!!c.tech.rail3&&gwOwn(c,["CPT","TRV","KEN","KHA","ASW","CAI"]).length===6,why:c=>gwNeed(c,"rail3")||"We need a chain of our own or sphere land: "+["CPT","TRV","KEN","KHA","ASW","CAI"].filter(id=>!gwOwn(c,[id]).length).map(id=>P(id).n).join(", ")+".",fx:c=>{gwRail(c,["CPT","TRV","KEN","KHA","ASW","CAI"],2);c.pres+=20;}},
 {id:"austral",n:"The Trans-Australian Railway",y:1910,cost:150000,m:72,d:"Rails across the desert from east to west. Railways +2 in New South Wales and Western Australia, prestige +6.",ok:c=>c.civ&&!!c.tech.rail3&&ownsAll(c,["SYD","WAU"]),why:c=>gwNeed(c,"rail3",["SYD","WAU"]),fx:c=>{gwRail(c,["SYD","WAU"],2);c.pres+=6;}},
 {id:"natbank",n:"A national bank headquarters",y:1860,cost:100000,m:36,d:"A great bank in the capital, trusted at home and abroad. Taxes +4%, the reserve of private capital for new factories +30%, prestige +4.",ok:c=>c.civ&&!!c.tech.central,why:c=>gwNeed(c,"central"),fx:c=>{c.gwx.tax=(c.gwx.tax||0)+.04;c.gwx.inv=(c.gwx.inv||0)+.1;c.pres+=4;}});
for(let d=1860;d<=1930;d+=10)GW.push({id:"fair"+d,n:"The world's fair of the "+d+"s",y:d,cost:70000,m:24,uniq:1,fair:1,d:"A fair in the capital for the whole world, once each decade and never twice in one capital. Prestige +12, research +3%.",ok:c=>c.civ&&capPop(c)>2000&&!gwHost(c)&&(isGP(c.tag)||!c.ai),why:c=>!c.civ?"We must be a westernized state.":capPop(c)<=2000?"Our capital is too small.":gwHost(c)?"We have held a world's fair already; another capital must have its turn.":"Only a Great Power or the player may host.",fx:c=>{c.pres+=12;c.gwx.research=(c.gwx.research||0)+.03;}});
function addLane(a,b,m){if(SEAADJ[a].some(x=>x[0]===b))return;SEAADJ[a].push([b,m]);SEAADJ[b].push([a,m]);G.lanes=G.lanes||[];G.lanes.push([a,b,m]);}
function gwState(c,w){if(G.gwDone&&G.gwDone[w.id]&&(w.uniq||G.gwDone[w.id].includes(c.tag)))return"done";if(c.gw&&c.gw[w.id])return"building";if(yearOf(G.t)<w.y)return"date";if(!w.ok(c))return"cond";return"ok";}
function startGW(c,id){const w=GW.find(x=>x.id===id),st=gwState(c,w);if(st!=="ok")return{ok:false,txt:st==="done"?"Already built.":st==="date"?"Not before "+w.y+".":st==="building"?"Already under way.":"We do not meet the conditions."};c.gw=c.gw||{};c.gw[id]={left:w.m,pay:w.cost/w.m};return{ok:true,txt:w.n+": work begins. "+w.m+" months."};}
function gwMonth(){for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;c.gwx=c.gwx||{};if(c._bx&&c._bx.pres)c.pres+=c._bx.pres;if(c.bq)bqMonth(c);
  if(G.canal){if(G.canal.suez===tag)c.tr+=3000;if(G.canal.panama===tag)c.tr+=4000;}
  for(const id in c.gw||{}){const w=GW.find(x=>x.id===id),g=c.gw[id];if(w.uniq&&G.gwDone&&G.gwDone[id]){delete c.gw[id];if(tag===G.player)msg("economy","Another nation finished "+w.n+" first; our works are abandoned.");continue;}
   if(c.tr<g.pay)continue;c.tr-=g.pay;g.left--;if(g.left<=0){c.projectDoneAt=G.t;delete c.gw[id];G.gwDone=G.gwDone||{};const fst=!(G.gwDone[id]||[]).length;(G.gwDone[id]=G.gwDone[id]||[]).push(tag);w.fx(c);if(w.first&&fst)c.pres+=w.first;const txt=c.n+" completes "+w.n+".";msg("economy",txt);G.log.unshift({t:G.t,txt});}}
  if(c.ai&&G.t%12===tag.charCodeAt(0)%12&&c.civ){const inc=c.stat.inc||1;if(c.tr>inc*6&&Object.keys(c.gw||{}).length<1){const L=GW.filter(w=>gwState(c,w)==="ok"&&w.cost<c.tr*1.5+inc*w.m*.15);if(L.length){L.sort((a,b)=>b.cost-a.cost);startGW(c,L[0].id);}}}}}
/* ================= DECISIONS ================= */
const DEC=[
 {id:"const",n:"Grant a constitution",d:"Become a constitutional monarchy with a parliament. Liberals rejoice; reactionaries do not.",ok:c=>c.gov==="abs"&&c.civ,why:c=>"Only absolute monarchies.",fx:c=>{c.gov="const";c.reforms.parties=Math.max(1,c.reforms.parties);c.reforms.press=Math.max(1,c.reforms.press);c.reforms.vote=Math.max(1,c.reforms.vote);c.elect=12;shiftMil(c,"LIB",-2,"REA",1.5);}},
 {id:"republic",n:"Proclaim a republic",d:"Abolish the monarchy: a democracy with universal male suffrage.",ok:c=>c.gov==="const"&&["LIB","SOC"].includes(c.ideo),fx:c=>{c.gov="dem";c.reforms.vote=Math.max(2,c.reforms.vote);c.reforms.parties=3;c.reforms.press=2;shiftMil(c,"LIB",-2,"REA",2.5);c.pres-=5;}},
 {id:"slavery",n:"Abolish slavery",d:"Free every slave. The planters will be furious.",ok:c=>c.reforms.slavery<2&&provsOf(c.tag).some(p=>p.pops.some(q=>q.t==="SLA")),fx:c=>{c.reforms.slavery=2;for(const p of provsOf(c.tag))for(const q of p.pops)if(q.t==="ARI"&&p.f.includes("S"))q.mil=Math.min(10,q.mil+3);c.pres+=5;}},
 {id:"west",n:"Westernize",d:"Adopt Western learning, law and arms. We become a recognized nation; the old order resents it.",ok:c=>modWestOk(c),why:c=>c.tag==="JAP"&&c.hold>G.t?"Reforms postponed until "+dateStr(c.hold)+".":"Needs modernisation at 100%, or 80% with 25% literacy.",fx:c=>{modWestDo(c.tag);}},
 {id:"bank",n:"Establish a central bank",d:"Tax collection +8%.",ok:c=>c.civ&&!!c.tech.central,why:c=>"Needs Central banking.",once:1,fx:c=>{c.gwx=c.gwx||{};c.gwx.tax=(c.gwx.tax||0)+.08;}},
 {id:"annex",n:"Annex a state in our sphere",d:"A state long in our sphere joins us outright. Infamy +5.",ok:c=>isGP(c.tag)&&!!annexTarget(c),why:c=>"Needs a friendly state of our own culture in our sphere.",repeat:1,fx:c=>{const t=annexTarget(c);if(!t)return;if(askHuman(t.tag,{a:"annexSphere",lord:c.tag,t:t.tag},"Union with "+c.n,c.n+" asks us, long in its sphere, to join it outright.",["Join "+c.n,"Our lands and people join "+c.n+" and our state ends."],["Remain independent","We keep our state. Nothing changes for five years."])){t.refuse=G.t+60;return;}annexSphereDo(c.tag,t.tag);}},
 {id:"italy",n:"Unify Italy",d:"Proclaim the Kingdom of Italy, absorbing the Italian states of our sphere.",ok:c=>c.tag==="SAR"&&!c.formed&&!formedAlive("ITA")&&unifyOpen("ITA",c)&&unifyCount(c,"ITA")>=3,why:c=>"Needs the 1859 war won (or Lombardy ceded), then three of the Italian heartlands, ours or in our sphere.",once:1,fx:c=>formNation(c,"ITA")},
 {id:"germany",n:"Unify Germany",d:"Proclaim the German Empire, absorbing the German states of our sphere.",ok:c=>c.tag==="PRU"&&!c.formed&&!formedAlive("GER")&&unifyOpen("GER",c)&&unifyCount(c,"GER")>=5,why:c=>"Needs the 1866 war with Austria won (or Austria yielding), then five of the German heartlands, ours or in our sphere.",once:1,fx:c=>formNation(c,"GER")},
 {id:"tanzimat",n:"The Tanzimat",y:1839,tag:"OTT",d:"Equality before the law and modern administration. Administration +10%, minorities calmer.",once:1,ok:c=>false,fx:c=>{}},
 {id:"corn",n:"Repeal the Corn Laws",y:1846,tag:"GBR",d:"Free trade in grain: food gets cheaper for the poor, landowners lose. Tariff to 5%.",once:1,ok:c=>true,fx:c=>{c.trade="free";c.tariff=.05;for(const p of provsOf(c.tag))for(const q of p.pops){if(PTYPES[q.t].s===0)q.mil=Math.max(0,q.mil-1);if(q.t==="ARI")q.mil=Math.min(10,q.mil+2);}}},
 {id:"serfs",n:"Emancipate the serfs",y:1855,tag:"RUS",d:"Free the peasants from their lords. Peasants calmer, nobles angry; the land produces more.",once:1,ok:c=>true,fx:c=>{for(const p of provsOf(c.tag)){p.farmCap*=1.1;for(const q of p.pops){if(q.t==="FAR")q.mil=Math.max(0,q.mil-2);if(q.t==="ARI")q.mil=Math.min(10,q.mil+3);}}c.pres+=5;}},
 {id:"zoll",n:"Found the Zollverein",y:1836,tag:"PRU",d:"A customs union of the German states: influence +30 with each German state.",once:1,ok:c=>true,fx:c=>{for(const t in G.c){const m=G.c[t];if(m.alive&&m.cul==="german"&&t!==c.tag&&!isGP(t)){m.inf=m.inf||{};m.inf[c.tag]=(m.inf[c.tag]||0)+30;m.rel[c.tag]=(m.rel[c.tag]||0)+20;}}}},
 {id:"monroe",n:"Proclaim the Monroe Doctrine",y:1836,tag:"USA",d:"The Americas are closed to European meddling: influence +25 across Latin America; Europe is annoyed.",once:1,ok:c=>true,fx:c=>{for(const t in G.c){const m=G.c[t];if(m.alive&&P(m.cap).x<1100&&t!==c.tag&&!isGP(t)){m.inf=m.inf||{};m.inf[c.tag]=(m.inf[c.tag]||0)+25;}}for(const g of["GBR","FRA","SPA"])if(G.c[g])G.c[g].rel[c.tag]-=10;c.pres+=5;}},
 {id:"destiny",n:"Manifest Destiny",y:1845,tag:"USA",d:"Settlers pour west: every unclaimed land next to us begins to be settled at once.",once:1,ok:c=>true,fx:c=>{for(const p of G.plist)if(!p.o&&!p.waste&&!p.colz&&p.f.includes("U")&&provsOf(c.tag).some(m=>ADJ[m.id].includes(p.id)))p.colz={tag:c.tag,left:12};}},
 {id:"meiji",n:"The Meiji Restoration",y:1860,tag:"JAP",d:"Restore the emperor and end the shogunate: the three administrative reforms at once, a constitution, and unrest among the old order.",once:1,ok:c=>!c.civ&&!(c.hold>G.t),why:c=>c.hold>G.t?"Reforms postponed until "+dateStr(c.hold)+".":"Japan has already modernized.",fx:c=>{for(const id of["d1","d2","d3"])if(!modHas(c,id)){c.modRef=(c.modRef||[]).concat(id);c.modern=Math.min(100,(c.modern||0)+MOD_BY[id].pr);modEffect(c,id);}c.gov="const";setRuling(c,"CON");c.pres-=5;shiftMil(c,"REA",3,"LIB",-1);}}];
function shiftMil(c,up,a,down,b){for(const p of provsOf(c.tag))for(const q of p.pops){const w=q.id[up]||0,v=q.id[down]||0;q.mil=clamp(q.mil+a*w+b*v,0,10);}}
function annexTarget(c){return Object.values(G.c).find(m=>m.alive&&m.sphere===c.tag&&(m.refuse||0)<=G.t&&(m.cul===c.cul||c.acc.includes(m.cul))&&(m.rel[c.tag]||0)>=80&&popOf(m.tag)<popOf(c.tag)/3);}
function unifyCount(c,tag){return UNIFY[tag].need.filter(id=>{const o=P(id).o;return o===c.tag||(o&&G.c[o].sphere===c.tag);}).length;}
function decState(c,d){G.decDone=G.decDone||{};if(d.tag&&d.tag!==c.tag)return null;if(d.once&&(G.decDone[c.tag]||[]).includes(d.id))return"done";if(d.y&&yearOf(G.t)<d.y)return"date";if(!d.ok(c))return"cond";return"ok";}
function takeDecision(c,id){const d=DEC.find(x=>x.id===id),st=decState(c,d);if(st!=="ok")return{ok:false,txt:st==="date"?"Not before "+d.y+".":st==="done"?"Already done.":(d.why?d.why(c):"We do not meet the conditions.")};
 d.fx(c);G.decDone=G.decDone||{};(G.decDone[c.tag]=G.decDone[c.tag]||[]).push(id);const txt=c.n+" enacts: "+d.n+".";msg("politics",txt);G.log.unshift({t:G.t,txt});G.popV=(G.popV||0)+1;return{ok:true,txt:d.n+"."};}
const AI_DEC={tanzimat:.05,corn:.03,serfs:.02,zoll:.2,monroe:.05,destiny:.05,meiji:.04,bank:.05,annex:.02,italy:.1,germany:.1,const:.003,slavery:.004};
function decMonth(){for(const tag in G.c){const c=G.c[tag];if(!c.alive||!c.ai)continue;for(const d of DEC){const p=AI_DEC[d.id];if(!p||rng()>p)continue;if(d.id==="slavery"&&tag==="USA"&&yearOf(G.t)<1866)continue;if(decState(c,d)==="ok")takeDecision(c,d.id);}}}
/* ================= AI BUILDS ================= */
/* a naval power needs a harbour for its big ships and coaling stations for its steamers; the ranking by plain payoff never reaches them, so they are asked for first */
function navBld(c){const f=fleetBuildingStats(c);if(f.n<6||!c.tech.ironclad)return null;const my=provsOf(c.tag).filter(p=>p.ctl===p.o),L=k=>sum(my,p=>bxl(p,k));
 const hb=P(c.cap).sea&&P(c.cap).ctl===c.tag?P(c.cap):my.filter(p=>p.sea&&p.col).sort((a,b)=>(b.port||0)-(a.port||0)||b.pop-a.pop)[0],want=[];
 if(hb){if((hb.port||0)<2)want.push([hb,"port"]);else if(bxl(hb,"dock")<1&&(c.tech.dread||f.n>=12))want.push([hb,"dock"]);}
 if(f.n>=8&&L("coal")<Math.min(3,1+Math.floor(f.far/4))){const cs=my.filter(p=>p.sea&&!bxl(p,"coal")).sort((a,b)=>(a.col===0?0:1)-(b.col===0?0:1)||b.pop-a.pop)[0];if(cs)want.push([cs,"coal"]);}
 for(const[p,k]of want)if(bldCan(c,p,k).ok){const y=bldPay(c,p,k);if(y.net>0&&bldMoney(y.C)<=c.tr*.25)return[p,k];}return null;}
function aiBld(c){if(!c.civ||G.t%6!==c.tag.charCodeAt(1)%6||c.tr<(c.stat.inc||1)*4)return;const ps=provsOf(c.tag).filter(p=>p.ctl===p.o);if(sum(ps,p=>p.build.length)>=2+Math.floor(ps.length/3)||bldActive(c)>=buildSlots(c))return;
 if(c._bx&&c._bx.up>(c.stat.inc||1)*.03)return;const tight=(c.fill.machinery!=null&&c.fill.machinery<.9)||((G.tight&&G.tight.machinery)||1)>1.08;
 const nb=navBld(c);if(nb&&rng()<.5&&!(tight&&BLD[nb[1]].cost.machinery>40)){aiOrder(c,{kind:"building",province:nb[0].id,building:nb[1]});return;}
 let best=null;for(const p of ps)for(const k in BLD){if(tight&&BLD[k].cost.machinery>40)continue;if(!bldCan(c,p,k).ok)continue;const y=bldPay(c,p,k);if(y.net<=0||bldMoney(y.C)>c.tr*.25)continue;const sc=y.score*(.8+.4*rng());if(!best||sc>best.sc)best={p,k,sc};}
 if(best&&rng()<.3)aiOrder(c,{kind:"building",province:best.p.id,building:best.k});}

function facCan(c,p,g){const n=counts(p);
 if(p.o!==c.tag||p.ctl!==p.o)return{ok:false,why:"Only in provinces we hold."};
 if(!c.civ&&!modHas(c,"e2"))return{ok:false,why:"We need State workshops and a first mill (a modernisation reform)."};
 if(!goodOK(c,g))return{ok:false,why:"We lack the technology to make "+GOODS[g].n.toLowerCase()+"."};
 if(p.col===0)return{ok:false,why:"Colonies have too few business people to run a factory."};
 if(p.build.some(b=>b.k==="fac"&&b.g===g&&!b.fo))return{ok:false,why:"One is already being built here."};
 const lv=sum(p.factories,f=>f.lv)+p.build.filter(b=>b.k==="fac").length,cap=litCap(p)*ruleShare(c,p);
 if(cap<.3)return{ok:false,why:"No literate workers here: people must learn to read first (build a school)."};
 if(lv>=cap)return{ok:false,why:"No literate workers to spare: this province can staff "+cap.toFixed(2)+" levels of mills."};
 if(n.CRA-lv*FAC_WORK*.9+(n.FAR+n.LAB)*.012<FAC_WORK*.6)return{ok:false,why:"No free craftsmen: everyone here who can work a mill is already employed."};
 for(const x in RECIPE[g].I)if(c.fill[x]!=null&&c.fill[x]<.85)return{ok:false,why:(c.fill[x]<.3?"No ":"Not enough ")+GOODS[x].n.toLowerCase()+": the market is short, so the mill would stand idle."};
 if(c.fill.machinery!=null&&c.fill.machinery<.6)return{ok:false,why:"Machine parts are too scarce to build with."};
 return{ok:true};}
