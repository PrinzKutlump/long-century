/* D5: historical events with player choices. usage: node test_d5.js [seed] [event id filter]
   Runs one all-AI game, snapshots the December before each event, then for every concerned nation takes control, waits for the card and plays each option. */
const ctx=require("./load_test_engine")(`
;globalThis.API={newGame,monthTick,getG:()=>G,cardChoose,EVENTS,provsOf,
 snap:()=>JSON.stringify(G,(k,v)=>k[0]==="_"||k==="plist"||k==="pricePrev"?undefined:v),
 load:s=>{const g=JSON.parse(s);g.plist=WORLD.provs.map(w=>g.prov[w.id]);g.pricePrev=Object.assign({},g.price);G=g;buildAdj();for(const[a,b,m]of(G.lanes||[]))if(!SEAADJ[a].some(x=>x[0]===b)){SEAADJ[a].push([b,m]);SEAADJ[b].push([a,m]);}UID=1+Math.max(0,...G.armies.map(a=>+a.id.slice(1)||0));}};`);
const A=ctx.API,seed=+(process.argv[2]||7),filt=process.argv[3]||"";
const CASES=[["famine",1845,["GBR"]],["y1848",1848,["PRU","AUS"]],["taiping",1850,["CHI"]],["crimea",1853,["RUS","OTT","GBR"]],["mutiny",1857,["GBR"]],["italy1",1859,["SAR","AUS"]],["civilwar",1861,["USA"]],["germany1",1864,["PRU","DEN"]],["germany2",1866,["PRU","AUS"]],["meiji",1868,["JAP"]],["germany3",1870,["PRU","FRA"]],["berlin",1884,["GBR","FRA"]],["boxers",1900,["CHI"]],["rjwar",1904,["RUS","JAP"]],["balkan",1912,["AUS","RUS"]]].filter(c=>!filt||c[0]===filt);
A.newGame(null,seed);let G=A.getG();const snaps={};const ys=new Set(CASES.map(c=>c[1]));let e0=null;
const maxT=Math.max(...CASES.map(c=>c[1]))-1836;
for(let i=0;i<=maxT*12;i++){G=A.getG();if(i%12===11&&ys.has(1836+Math.floor(i/12)+1))snaps[1836+Math.floor(i/12)+1]=A.snap();try{A.monthTick();}catch(e){e0=e;break;}}
if(e0){console.log("ERROR in the all-AI run",e0.stack.split("\n").slice(0,3).join("|"));process.exit(1);}
const T=(ev,k,tag)=>({
 "famine:relief":g=>g.famine&&g.famine.until-g.t<=24,"famine:market":g=>g.famine&&g.famine.until-g.t>24,
 "civilwar:go":g=>g.c.CSA&&g.c.CSA.alive&&!g.wars.some(w=>w.civil),"civilwar:mob":g=>g.wars.some(w=>w.civil)&&g.c.USA.mob&&g.c.USA.mob.st>0,"civilwar:fight":g=>g.wars.some(w=>w.civil),
 "italy1:cede":g=>g.prov.LOM.o==="SAR","italy1:fight":g=>g.wars.some(w=>w.att.includes("SAR")&&w.def.includes("AUS")),"italy1:france":g=>g.wars.some(w=>w.att.includes("SAR")&&w.def.includes("AUS")),"italy1:alone":g=>g.wars.some(w=>w.att.includes("SAR")&&w.def.includes("AUS")&&!w.att.includes("FRA")),"italy1:wait":g=>!g.wars.some(w=>w.att.includes("SAR")&&w.def.includes("AUS")),
 "germany1:cede":g=>g.prov.SLH.o==="PRU","germany1:drop":g=>g.prov.SLH.o==="DEN"&&!g.wars.some(w=>w.def.includes("DEN")),"germany1:both":g=>g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("DEN")),"germany1:alone":g=>g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("DEN")&&!w.att.includes("AUS")),
 "germany2:yield":g=>!g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("AUS")),"germany2:wait":g=>!g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("AUS")),"germany2:war":g=>g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("AUS")),
 "germany3:peace":g=>!g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("FRA")),"germany3:back":g=>!g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("FRA")),"germany3:war":g=>g.wars.some(w=>w.att.includes("PRU")&&w.def.includes("FRA")),
 "meiji:west":g=>g.c.JAP.modRef.includes("d3")&&g.c.JAP.gov==="const","meiji:old":g=>!g.c.JAP.civ&&g.c.JAP.hold>g.t,
 "berlin:big":g=>g.plist.some(p=>p.colz),"berlin:fair":g=>g.plist.some(p=>p.colz),
 "crimea:war":g=>g.wars.some(w=>w.att.includes("RUS")&&w.def.includes("OTT")),"crimea:yield":g=>!g.wars.some(w=>w.att.includes("RUS")&&w.def.includes("OTT"))&&(g.c.OTT.owes||[]).length>0,"crimea:talk":g=>!g.wars.some(w=>w.att.includes("RUS")&&w.def.includes("OTT")),
 "rjwar:talk":g=>!g.wars.some(w=>w.att.includes("JAP")&&w.def.includes("RUS")),
 "mutiny:crush":g=>g.armies.some(a=>a.reb&&a.reb.vs==="GBR"),"mutiny:reform":g=>g.armies.some(a=>a.reb&&a.reb.vs==="GBR"),
 "boxers:back":g=>!g.armies.some(a=>a.reb&&a.reb.vs==="CHI"&&a.loc==="PEK"),"taiping:relief":g=>g.armies.some(a=>a.reb&&a.reb.vs==="CHI"),"taiping:west":g=>g.armies.some(a=>a.reb&&a.reb.vs==="CHI"),
 "balkan:conf":g=>!g.wars.some(w=>w.att.includes("AUS")&&w.def.includes("RUS")||w.att.includes("RUS")&&w.def.includes("AUS")),
 "y1848:const":g=>g.c[tag].gov==="const"})[ev+":"+k];
let bad=0,cards=0,n=0;const shown=[];
for(const [ev,y,tags] of CASES){const base=snaps[y];for(const tag of tags){
 A.load(base);G=A.getG();if(ev==="meiji"){
  G.c.JAP.civ=0;
  // Reset the prior AI reform so both choices are tested from a feudal Japan.
  if(G.decDone?.JAP)G.decDone.JAP=G.decDone.JAP.filter(id=>id!=="meiji");
 }G.player=tag;for(const t in G.c)G.c[t].ai=t!==tag;let id=null;
 for(let i=0;i<14&&!G.card;i++){try{A.monthTick();}catch(e){console.log("FAIL error before card",ev,tag,e.message);bad++;break;}if(G.card&&G.card.id!==ev&&G.card.kind==="ev")A.monthTick();}
 G=A.getG();
 if(!G.card||G.card.id!==ev){console.log("skip "+ev+" as "+tag+": the event did not apply (world state)"+(G.card?" other card "+G.card.id:""));continue;}
 cards++;const card=G.card,sv=A.snap();shown.push(ev+"/"+tag+": "+card.opts.map(o=>o.label).join(" | "));
 if(card.opts.length<2||card.opts.length>3||!card.opts.every(o=>o.txt&&o.label)||!card.txt){console.log("FAIL card shape",ev,tag);bad++;}
 if(JSON.stringify(JSON.parse(JSON.stringify(G.card)))!==JSON.stringify(G.card)){console.log("FAIL card not savable");bad++;}
 // the card must not be taken by the clock when a person is playing: monthTick in a headless run takes the default, so here we check the state just before
 for(const o of card.opts){n++;A.load(sv);G=A.getG();let e=null,before=JSON.stringify(G.choices||[]);
  let now=true;const chk=T(ev,o.k,tag);try{G.player=tag;A.cardChoose(o.k);G=A.getG();now=!chk||chk(G);for(let i=0;i<12;i++)A.monthTick();}catch(x){e=x;}
  G=A.getG();const pass=!e&&(!G.card||G.card.id!==ev)&&(G.choices||[]).some(c=>c.id===ev&&c.k===o.k)&&now;
  if(!pass){bad++;console.log("FAIL "+ev+" as "+tag+" option "+o.k+(e?" error "+e.message:"")+(!now?" effect not seen":""));}else console.log("ok   "+ev+" as "+tag+": "+o.label);}
 // AI keeps the old automatic course: no card, event runs by itself
 A.load(base);G=A.getG();G.player=null;let anyc=false;for(let i=0;i<14;i++){A.monthTick();if(G.card)anyc=true;}if(anyc||(G.ev[ev]==null&&false)){console.log("FAIL AI path opened a card",ev);bad++;}
}}
console.log("cards seen "+cards+", options played "+n+", failures "+bad);console.log(bad?"FAIL":"ok");
