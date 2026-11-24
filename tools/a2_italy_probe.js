// A2: one seed, one build root (argv: root seed [player]); prints the italy1 war: state at Jan 1859, outcome, formation dates. Run for each rule variant to compare.
const fs=require("fs"),vm=require("vm"),{createHash}=require("crypto"),{performance}=require("perf_hooks");
const [root,seed,player="SWI"]=process.argv.slice(2);
const nodes=new Map();
const b={console,performance,digest:t=>createHash("sha256").update(t).digest("hex"),memory:()=>0,args:{seed:+seed,player},window:{addEventListener(){}},document:{addEventListener(){},querySelector:s=>nodes.get(s),createElement:()=>({}),body:{appendChild:n=>nodes.set("#"+n.id,n)}}};
const src=fs.readFileSync(root+"/dist/long-century.html","utf8").match(/<script>([\s\S]*)<\/script>/)[1];
const harness=`
 newGame(args.player,args.seed);
 const R={seed:args.seed};
 const land=t=>G.armies.filter(x=>x.o===t&&!x.reb&&!x.naval).reduce((n,x)=>n+x.u.length,0);
 const fac=t=>provsOf(t).reduce((n,p)=>n+p.factories.reduce((m,f)=>m+f.lv,0),0);
 let snapped=0;
 const oe=endWar;endWar=function(w,win){if(w.unify==="ITA"){R.end=dateStr(G.t);R.win=win;R.ws=Math.round(w.ws);R.ausTroopsEnd=land("AUS");R.def=w.def.join("+");R.att=w.att.join("+");}return oe(w,win);};
 while(G.t<(1873-1836)*12){if(G.card)cardDefault();const m=G.t;if(!snapped&&G.t>=(1859-1836)*12+1){snapped=1;R.sarTr=Math.round(G.c.SAR.tr);R.sarTroops=land("SAR");R.sarFac=fac("SAR");R.ausTroops=land("AUS");R.ausTr=Math.round(G.c.AUS.tr);R.warOn=G.c.SAR.war.length;}if(args.player&&G.c[args.player].alive)advanceCampaign(m);else monthTick();
  if(!R.ita&&(G.c.ITA?.alive||formedAlive("ITA")))R.ita=dateStr(G.t);if(!R.ger&&(G.c.GER?.alive||formedAlive("GER")))R.ger=dateStr(G.t);}
 console.log(JSON.stringify(R));`;
vm.compileFunction(src+"\n"+harness,Object.keys(b))(...Object.values(b));
