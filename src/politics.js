"use strict";
/* ================= POLITICS ================= */
// nations that can appear: released by revolt or treaty, or formed by unification
const DORMANT=[["POL","Poland","Polish","#c94c4c","WAR","polish"],["HUN","Hungary","Hungarian","#6a994e","HUN","hungarian"],["CZE","Bohemia","Czech","#5e81ac","BOH","czech"],["BUL","Bulgaria","Bulgarian","#7a9e6e","SOF","bulgarian"],
 ["IRL","Ireland","Irish","#3c9d5d","IRE","irish"],["NOR","Norway","Norwegian","#b4413a","NOR","norwegian"],["FIN","Finland","Finnish","#e5e5e5","FIN","finnish"],["CUB","Cuba","Cuban","#3d5a80","HAV","cuban"],["PHI","Philippines","Filipino","#0077b6","MNL","filipino"],
 ["UKR","Ukraine","Ukrainian","#e9c46a","UKR","ukrainian"],["ARM","Armenia","Armenian","#e07a5f","ERZ","armenian"],["ALB","Albania","Albanian","#9b2226","SAL","albanian"],["CRO","Croatia","Croatian","#457b9d","CRO","southslav"],
 ["ITA","Italy","Italian","#2a9d8f","ROM","italian",1],["GER","Germany","German","#555555","BER","german",1]];
const VOTEW=[{ARI:1,CAP:1,BUR:.6,CLE:.6,OFF:.6,ART:0,CLK:0,CRA:0,FAR:0,LAB:0,SOL:0,SLA:0},{ARI:4,CAP:4,BUR:2,CLE:2,OFF:2,ART:1.5,CLK:1.5,CRA:.4,FAR:.3,LAB:.3,SOL:0,SLA:0},
 {ARI:1,CAP:1,BUR:1,CLE:1,OFF:1,ART:1,CLK:1,CRA:1,FAR:1,LAB:1,SOL:.5,SLA:0},{ARI:1,CAP:1,BUR:1,CLE:1,OFF:1,ART:1,CLK:1,CRA:1,FAR:1,LAB:1,SOL:1,SLA:0}];
const ideoOK=k=>IDEOS[k].y<=yearOf(G.t);
function setRuling(c,k){c.ideo=k;const pp=PARTY_OF[k];c.econ=pp.econ;c.trade=pp.trade;c.cit=pp.cit;if(c.tariff>TRADE[c.trade].max)c.tariff=TRADE[c.trade].max;}
function votes(c){const lv=c.reforms.vote||0,W=VOTEW[lv],v={};for(const k of IK)v[k]=0;for(const p of provsOf(c.tag)){if(!p.col)continue;for(const q of p.pops){if(!accepted(c,q.c)&&c.cit!=="res")continue;const w=q.n*(W[q.t]||0);if(!w)continue;for(const k of IK)if(ideoOK(k))v[k]+=(q.id[k]||0)*w;}}return v;}
function upperHouse(c){const v={};for(const k of IK)v[k]=0;for(const p of provsOf(c.tag))for(const q of p.pops){const s=PTYPES[q.t].s;if(s===0)continue;const w=q.n*(s===2?3:1);for(const k of IK)v[k]+=(q.id[k]||0)*w;}let t=0;for(const k in v)t+=v[k];for(const k in v)v[k]=t?v[k]/t:0;return v;}
function election(c){const v=votes(c);let t=0,best=c.ideo,bv=-1;for(const k in v){t+=v[k];if(v[k]>bv){bv=v[k];best=k;}}if(!t)return;
 const old=c.ideo;c.lastVote={};for(const k in v)c.lastVote[k]=r2(v[k]/t);if(c.reforms.parties<2&&rng()<.5)best=old;setRuling(c,best);
 if(c.tag===G.player||best!==old&&G.c[c.tag].stat.pop>20000)msg("politics",c.n+" votes: the "+IDEOS[best].n.toLowerCase()+"s "+(best===old?"keep":"take")+" power.");}
const REF_SIDE={p:{LIB:1,SOC:1,ANL:1,COM:.5,CON:.2,REA:-1,FAS:-1},s:{SOC:1,COM:1,FAS:.6,LIB:.3,CON:.2,ANL:-.5,REA:-.5}};
function reformSupport(c,k){const uh=c.uh||upperHouse(c);let s=0;for(const i in uh)s+=uh[i]*(REF_SIDE[k][i]||0);return s;}
function reformPressure(c,k){let a=0,b=0;for(const p of provsOf(c.tag))for(const q of p.pops){const s=PTYPES[q.t].s,want=k==="p"?(q.id.LIB+q.id.SOC+q.id.ANL):(q.id.SOC+q.id.COM);if(s===2)continue;a+=q.mil*q.con/10*want*q.n;b+=q.n;}return b?a/b:0;}
function franchiseConcession(c){
 const chamber=c.uh||upperHouse(c);
 const supporters=(chamber.LIB||0)+(chamber.SOC||0)+(chamber.ANL||0);
 const undecided=chamber.CON||0;
 const cost=Math.ceil((c.stat.inc||1000)*.5);
 return {supporters,undecided,opponents:Math.max(0,1-supporters-undecided),cost,
  available:c.gov!=="abs"&&reformSupport(c,"p")<.5&&supporters+undecided*.6>=.5&&c.tr>=cost};
}
function canReform(c,r,concession=false){const lv=c.reforms[r.id]||0;if(lv>=r.lv.length-1)return{ok:false,why:"At the highest level."};if(r.y&&yearOf(G.t)<r.y)return{ok:false,why:"Not before "+r.y+"."};
 if(c.gov==="abs"&&r.k==="p"&&!["slavery","press"].includes(r.id))return{ok:false,why:"An absolute monarchy grants no political reforms."};
 if((c.cd||0)>G.t)return{ok:false,why:"The government can pass another reform after "+dateStr(c.cd)+"."};const sup=reformSupport(c,r.k),pr=reformPressure(c,r.k);
 if(r.id==="vote"&&concession&&franchiseConcession(c).available)return{ok:true,how:"Moderates accept the transition grant."};
 if(sup>=.5)return{ok:true,how:"The upper house supports it."};if(pr>=1.2)return{ok:true,how:"The people demand it."};return{ok:false,why:"The upper house is "+Math.round(sup*100)+"% in favor; it needs half, or popular pressure."};}
function passReform(c,id,concession=false){const r=REFORMS.find(x=>x.id===id),ordinary=canReform(c,r),ok=ordinary.ok?ordinary:canReform(c,r,concession);if(!ok.ok)return ok;
 if(!ordinary.ok&&id==="vote"&&concession)c.tr-=franchiseConcession(c).cost;c.reforms[id]=(c.reforms[id]||0)+1;c.cd=G.t+12;
 for(const p of provsOf(c.tag))for(const q of p.pops){const want=r.k==="p"?(q.id.LIB+q.id.SOC+q.id.ANL):(q.id.SOC+q.id.COM);q.mil=clamp(q.mil-want*1.5+q.id.REA*.8,0,10);}
 if(id==="vote"&&c.gov==="abs")c.gov="const";if(c.tag===G.player||c.stat.pop>20000)msg("politics",c.n+": "+r.n.toLowerCase()+", "+r.lv[c.reforms[id]].toLowerCase()+".");return{ok:true};}
/* movements and uprisings */
function movements(c){const m={};for(const p of provsOf(c.tag))for(const q of p.pops){if(q.mil<5.5)continue;let key;
 if(!accepted(c,q.c)&&q.t!=="SLA"){if(!DORMANT.some(d=>d[5]===q.c&&!d[6])&&!Object.values(G.c).some(x=>x.alive&&x.cul===q.c&&x.tag!==c.tag))continue;key="N:"+q.c;}else{let b="CON",bv=0;for(const k of IK)if(ideoOK(k)&&(q.id[k]||0)>bv){bv=q.id[k];b=k;}
 if(b==="CON"||(b==="REA"&&c.gov!=="dem")||(b==="LIB"&&c.gov!=="abs"&&c.reforms.parties>=2)||b===c.ideo)continue;key="I:"+b;}
 const e=m[key]=m[key]||{key,n:0,pv:{}},x=q.n*(q.mil-5)/5;e.n+=x;e.pv[p.id]=(e.pv[p.id]||0)+x;}return Object.values(m).sort((a,b)=>b.n-a.n);}
function rebelName(key){if(key.startsWith("N:"))return key.slice(2).replace(/^./,x=>x.toUpperCase())+" nationalists";return{REA:"Reactionary",CON:"Legitimist",LIB:"Liberal",SOC:"Socialist",ANL:"Anarchist",COM:"Communist",FAS:"Fascist"}[key.slice(2)]+" rebels";}
function polMonth(){for(const tag in G.c){const c=G.c[tag];if(!c.alive)continue;if(G.t%6===0)c.uh=upperHouse(c);
  if(GOVS[c.gov].elect&&--c.elect<=0){election(c);c.elect=48;}
  if(c.ai&&G.t%6===3)for(const r of REFORMS){const bargain=r.id==="vote"&&reformPressure(c,"p")>.65&&franchiseConcession(c).available;if(canReform(c,r,bargain).ok&&(r.k==="p"||c.stat.inc>c.stat.exp*1.05||reformPressure(c,"s")>1.5)){passReform(c,r.id,bargain);break;}}
  if(c.gov==="abs"&&c.civ&&(reformPressure(c,"p")>1.1||(c.stat.lit>.35&&yearOf(G.t)>1848))&&rng()<.012){c.gov="const";c.reforms.press=Math.max(1,c.reforms.press);c.reforms.parties=Math.max(1,c.reforms.parties);msg("politics",c.n+" grants a constitution.");}
  if(tag==="JAP"&&!c.civ&&yearOf(G.t)>=1866&&(c.ai||(G.ev&&G.ev.meiji))&&!(c.hold>G.t)&&rng()<.05){takeDecision(c,"meiji");continue;}
  if(G.t%3===0)uprisings(c);unify(c);}}
function uprisings(c){if(c.war.length&&rng()<.5)return;const mv=movements(c),need=Math.max(80,(c.stat.pop||0)*.004);for(const m of mv){if(m.n<need)break;const pid=Object.keys(m.pv).sort((a,b)=>m.pv[b]-m.pv[a])[0],p=P(pid);
  if(rng()>.08+Math.min(.3,m.n/need*.05))continue;if(G.armies.some(a=>a.o==="REB"&&a.loc===pid))continue;const nb=clamp(Math.round(m.n/120),1,40);
  const a=mkArmy("REB",pid,{inf:Math.ceil(nb*.8),cav:Math.floor(nb*.2)});a.reb={key:m.key,vs:c.tag};c.modRev=(c.modRev||0)+1;G.armies.push(a);p.un=Math.min(100,p.un+30);
  for(const q of p.pops)if(q.mil>5)q.mil-=1.5;msg("war",rebelName(m.key)+" rise in "+p.n+" against "+c.n+".");break;}}
function rebelWin(c,key){const P2=provsOf(c.tag);if(key.startsWith("N:")){const cul=key.slice(2),d=DORMANT.find(x=>x[5]===cul&&!x[6]);if(!d)return;const tag=d[0];
  if(!G.c[tag])G.c[tag]=Object.assign(mkNation({tag,n:d[1],adj:d[2],col:d[3],cap:d[4],gov:"const",ideo:"LIB",cul,acc:[],lit:c.lit,civ:c.civ,pres:5,tech:[0,0,0,0,0]}),{alive:true});
  const nc=G.c[tag];nc.alive=true;nc.tech=Object.assign({},c.tech);for(const p of P2){const share=p.pops.filter(q=>q.c===cul).reduce((s,q)=>s+q.n,0)/Math.max(1,p.pop);if(share>.4)transferProv(p,tag);}
  if(!provsOf(tag).length){nc.alive=false;return;}nc.cap=provsOf(tag)[0].id;for(const t in G.c){G.c[t].rel[tag]=G.c[t].rel[tag]||0;nc.rel[t]=0;}msg("war",nc.n+" wins its independence from "+c.n+".");}
 else{const k=key.slice(2);setRuling(c,k);if(k==="LIB"&&c.gov==="abs"){c.gov="const";c.reforms.parties=Math.max(2,c.reforms.parties);c.reforms.press=2;}if(k==="COM"){c.gov="prol";}if(k==="FAS")c.gov="fasc";if(k==="REA"&&c.gov==="dem")c.gov="pres";
  if(k==="SOC"||k==="COM")for(const r of REFORMS)if(r.k==="s")c.reforms[r.id]=Math.max(c.reforms[r.id],2);msg("politics",rebelName(key)+" take power in "+c.n+".");}}
function transferProv(p,tag){const old=p.o;p.o=tag;p.ctl=tag;if(!p.core.includes(tag))p.core.push(tag);for(const b of p.build){
 const rec=endProject(p,b,"canceled","Province changed hands");
 if(old&&old===G.player&&b.k==="bld")(G.c[old].completedWorks||=[]).push({t:G.t,province:p.id,kind:b.b,paid:b.paid,canceled:"Province changed hands",spent:rec.spent,recoverable:0,unspent:rec.unspent});
}p.build=[];G.armies.forEach(a=>{if(a.loc===p.id&&a.o===old&&!a.naval){const cap=G.c[old]&&G.c[old].alive?G.c[old].cap:null;if(cap&&P(cap).o===old)a.loc=cap;}});
 if(old&&G.c[old]&&!provsOf(old).length){G.c[old].alive=false;G.c[old].bq=[];G.armies=G.armies.filter(a=>a.o!==old);msg("diplomacy",G.c[old].n+" has ceased to exist.");}else if(old&&G.c[old]&&G.c[old].cap===p.id){const np=provsOf(old)[0];if(np)G.c[old].cap=np.id;}}
/* Italy and Germany */
const UNIFY={ITA:{by:["SAR"],need:["PIE","TUS","ROM","NAP","LOM"],min:4},GER:{by:["PRU","AUS"],need:["BER","RHN","HNV","DRE","MUN","STU","SIL"],min:6}};
const unifyOpen=(tag,c)=>!!c&&((G.unif||{})[tag]===c.tag);
const formedAlive=tag=>Object.values(G.c).some(c=>c.alive&&c.formed===tag);
function unify(c){if(c.formed)return;for(const tag in UNIFY){const u=UNIFY[tag];if(!u.by.includes(c.tag)||(G.c[tag]&&G.c[tag].alive)||formedAlive(tag)||!unifyOpen(tag,c))continue;const have=u.need.filter(id=>{const o=P(id).o;return o===c.tag||(o&&G.c[o].sphere===c.tag);}).length;
  if(have<u.min||!c.civ)continue;const d=DORMANT.find(x=>x[0]===tag);const old=c.tag;
  for(const id of u.need){const p=P(id),o=p.o;if(o!==old&&o&&G.c[o].sphere===old){transferProv(p,old);}}
  c.n=d[1];c.adj=d[2];c.col=d[3];c.formed=tag;if(!c.acc.includes(d[5])&&c.cul!==d[5])c.acc.push(d[5]);c.pres+=20;msg("politics","Unification! "+c.n+" is proclaimed.");}}

// Vote weights reflect landholders, cultivators, town employers and workers.
function landRevenueVote(country,amended){
 const totals={landholders:0,cultivators:0,towns:0,staff:0};
 for(const p of provsOf(country.tag)){
  if(p.ctl!==country.tag)continue;
  const n=counts(p);
  totals.landholders+=n.ARI*10;
  totals.cultivators+=n.FAR;
  totals.towns+=(n.CRA+n.ART)*2+n.CAP*8;
  totals.staff+=n.BUR;
 }
 const weight=Math.max(1,totals.landholders+totals.cultivators+totals.towns);
 const yes=(totals.landholders*(amended?.8:.2)+totals.cultivators*(amended?.48:.68)+totals.towns*.61)/weight;
 const administration=clamp(totals.staff/Math.max(1,totals.cultivators*.008),0,1);
 return {...totals,yes,administration,passes:yes>=.5};
}
function voteOnLandRevenue(country,amended){
 const previous=country.landRevenue;
 if(previous?.enacted||previous?.month===G.t)return null;
 const result=landRevenueVote(country,amended);
 country.landRevenue={...result,amended,month:G.t,enacted:result.passes,
  movement:result.passes?0:Math.min(1,(previous?.movement||0)+result.yes)};
 return country.landRevenue;
}
function landRevenueRate(country,province,pop,strength){
 if(!country.landRevenue?.enacted||province.ctl!==country.tag)return 0;
 if(pop.t==="FAR")return -strength*(country.landRevenue.amended?.006:.012);
 if(pop.t==="ARI")return strength*(country.landRevenue.amended?.008:.02);
 return 0;
}
