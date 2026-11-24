/* D4: crises and congresses. usage: node test_d4.js [seed] */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,declareWar,endWar,provsOf,cardChoose,crisisWorthy,crisisCtx,guarantee,isGP,rng};');
const A=ctx.API,seed=+(process.argv[2]||7);A.newGame(null,seed);let G=A.getG();const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log((v?"ok   ":"FAIL ")+n);};
for(let i=0;i<24;i++)A.monthTick();G=A.getG();
const clean=()=>{for(const t in G.c){G.c[t].war=[];G.c[t].truce={};}G.wars=[];G.card=null;};
const gps=G.gp.slice();const [a,b]=["GBR","FRA"];
// 1. AI against AI: about three in ten GP-vs-GP declarations meet in congress first, and the outcomes are mixed
let n=0,cong0=G.congN||0,out={war:0,down:0},d0=G.congDown||0,wars=0;
for(let i=0;i<300;i++){clean();const w=A.declareWar(a,b,{k:"humble",tag:b});n++;if(w)wars++;}
const held=(G.congN||0)-cong0,downs=(G.congDown||0)-d0;
chk("GP v GP: congress held in "+held+" of "+n+" declarations (expected about 30%)",held>n*.2&&held<n*.4);
chk("congress outcomes are mixed: "+downs+" backed down, "+(held-downs)+" other (compromise or war)",downs>0&&downs<held);
chk("log of congresses kept",(G.congLog||[]).length>0&&G.congLog[0].att&&G.congLog[0].out);
// 2. a small state with a guarantor also draws a congress
clean();G.c.GBR.guar=["DEN"];let h2=0;const c1=G.congN||0,denProv=A.provsOf("DEN")[0].id /* A3: taken once; a congress that hands the province over would otherwise leave DEN without one */;for(let i=0;i<200;i++){clean();G.c.GBR.guar=["DEN"];A.declareWar("PRU","DEN",{k:"conquer",tag:"DEN",prov:denProv});}
chk("GP v guaranteed state also meets in congress ("+((G.congN||0)-c1)+" of 200)",(G.congN||0)-c1>20);
// 3. the player gets a card with three choices and odds; nothing happens until it is answered
clean();G.player="GBR";for(const t in G.c)G.c[t].ai=t!=="GBR";let card=null,tries=0;
for(;tries<60&&!G.card;tries++){clean();A.declareWar("GBR","FRA",{k:"humble",tag:"FRA"});}
card=G.card;chk("player attacking a Great Power gets a card ("+tries+" tries)",card&&card.kind==="cong"&&card.opts.length===3);
chk("card shows the odds in plain words",card&&/Estimated odds[^.]*\d+%/.test(card.txt)&&card.opts.every(o=>/\d+%|No war|War begins/.test(o.txt)));
chk("no war has begun while the card waits",G.wars.length===0&&G.c.GBR.war.length===0);
chk("card survives a JSON save",JSON.parse(JSON.stringify(G.card)).opts.length===3);
const snap=JSON.stringify({card:G.card});
// each choice
for(const k of ["down","comp","fight"]){clean();G.player="GBR";G.congLog=[];let c=null;for(let i=0;i<80&&!G.card;i++){clean();A.declareWar("GBR","FRA",{k:"humble",tag:"FRA"});}c=G.card;G.c.GBR.pres=80;const pres=G.c.GBR.pres,war0=G.wars.length;A.cardChoose(k);
 const warNow=G.wars.length>war0,last=(G.congLog||[])[0];
 if(k==="down")chk("back down: no war, 4 prestige lost, truce, choice saved",!warNow&&G.c.GBR.pres<pres&&G.c.GBR.truce.FRA>G.t&&G.choices[G.choices.length-1].k==="down"&&!G.card);
 if(k==="comp")chk("compromise: either a settlement (France pays) or, if refused, war ("+(last&&last.out)+")",(last&&last.out==="comp"&&(G.c.FRA.owes||[]).length>0)||(last&&last.out==="fight"&&warNow));
 if(k==="fight")chk("fight: war begins"+(G.wars[0]?" ("+G.wars[0].att+" v "+G.wars[0].def+")":""),warNow&&G.wars[0].goal.cong===1);}
// 4. defender card (AI attacks the player)
clean();G.player="FRA";for(const t in G.c)G.c[t].ai=t!=="FRA";tries=0;for(;tries<80&&!G.card;tries++){clean();A.declareWar("GBR","FRA",{k:"humble",tag:"FRA"});}
chk("player defending gets 'Give way / compromise / fight'",G.card&&G.card.opts[0].label==="Give way"&&G.c.GBR.war.length===0);
// 5. headless: the game never waits
let e=null;try{A.monthTick();}catch(x){e=x;}chk("headless monthTick takes the default and goes on",!e&&!G.card);
clean();G.player=null;for(const t in G.c)G.c[t].ai=true;let any=false;for(let i=0;i<100;i++){clean();A.declareWar("GBR","FRA",{k:"humble",tag:"FRA"});if(G.card)any=true;}chk("no player: no card is ever opened",!any);
// 6. old save without the new fields
delete G.congN;delete G.congDown;delete G.congLog;delete G.choices;e=null;try{for(let i=0;i<6;i++)A.monthTick();A.declareWar("GBR","FRA",{k:"humble",tag:"FRA"});}catch(x){e=x;}chk("old save without congress fields runs",!e);
console.log(ok.every(Boolean)?"ok":"FAIL");
