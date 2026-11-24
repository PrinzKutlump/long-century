/* C0: programme engine. A tiny fixture programme (registered here, not in the game) proves state, conditions, costs,
 * the shared AI evaluator, execCommand, failure, save defaults and determinism. usage: node test_programmes.js */
const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,progRegister,progUnregister,progStart,progOpenPhase,progBest,progSanitize,progMilitancy,execCommand,PROGRAMMES};');
const A=ctx.API;let bad=0;const ok=(c,t)=>{console.log((c?"ok   ":"FAIL ")+t);if(!c)bad++;};
const fixture=(odds)=>({id:"fx",n:"Fixture",groups:{a:40,b:60},lean:{AUS:100},ok:c=>c.alive,phases:[
 {id:"p1",n:"First",from:1840,cond:c=>c.tr<0?"No money.":"",choices:[
  {id:"go",n:"Go",cost:{tr:10},odds:()=>odds,gain:30,loss:5,mom:10,sup:{a:10},win:c=>{c.fxWin=(c.fxWin||0)+1;},fail:c=>{c.fxFail=(c.fxFail||0)+1;}},
  {id:"wait",n:"Wait",odds:()=>1,gain:0,loss:0}]},
 {id:"p2",n:"Second",choices:[{id:"end",n:"End",odds:()=>1,gain:20,loss:0}]}]});
function game(seed){A.newGame(null,seed);return A.getG();}
let G=game(7);
ok(!A.PROGRAMMES.fx,"the fixture is not in the game (content programmes such as the Tanzimat are registered separately)");
const tag="PRU",c=G.c[tag];
A.progRegister(fixture(1));
ok(A.progStart(c,"fx").ok&&!A.progStart(c,"fx").ok,"starts once; second start refused");
ok(c.prog.fx.support.a===40&&c.prog.fx.momentum===50,"state seeded from definition");
ok(!A.progOpenPhase(c,"fx").ok,"phase closed before its earliest year ("+A.progOpenPhase(c,"fx").why+")");
G.t=(1840-1836)*12;c.tr=1e6;c.rp=50;c.stat.inc=1000;
const o=A.progOpenPhase(c,"fx");ok(o.ok&&o.choices.length===2,"phase opens by year and condition");
ok(Math.abs(o.choices[0].ev.ev-30)<.5&&o.choices[1].ev.ev===0,"payoff table: p*gain-(1-p)*loss-cost");
c.tr=-5;ok(A.progOpenPhase(c,"fx").why==="No money.","condition can hold a phase shut");c.tr=1e6;
/* the same evaluator for the player and an AI nation; lean moves the AI's threshold */
ok(A.progBest(c,"fx").ch.id==="go","evaluator picks the best affordable choice");
const aus=G.c.AUS;A.progStart(aus,"fx");aus.tr=1e6;
const lowOdds=fixture(0.1);A.progRegister(lowOdds);
const nb=A.progBest(c,"fx");ok(nb===null,"low odds: no choice beats the margin for a nation with no lean");
ok(A.progBest(aus,"fx")!==null,"a historical lean lowers the threshold for the same low-odds card");
A.progRegister(fixture(1));
/* stale/invalid orders through execCommand */
const t0=c.tr;
ok(!A.execCommand(tag,{kind:"programme",id:"fx",choice:"nope"},{auto:true}).ok,"unknown choice refused");
ok(!A.execCommand(tag,{kind:"programme",id:"zz",choice:"go"},{auto:true}).ok,"unknown programme refused");
ok(!A.execCommand(tag,{kind:"programme",id:"fx",choice:"go",month:-1,serial:99}).ok,"stale serial refused");
ok(c.tr===t0,"refused orders change nothing");
const r=A.execCommand(tag,{kind:"programme",id:"fx",choice:"go"},{auto:true});
ok(r.ok&&r.win&&c.tr===t0-10&&c.fxWin===1,"order pays, succeeds, applies its effect");
ok(c.prog.fx.phase===1&&c.prog.fx.momentum===60&&c.prog.fx.support.a===50,"phase advanced, momentum and support moved");
A.execCommand(tag,{kind:"programme",id:"fx",choice:"end"},{auto:true});
ok(c.prog.fx.done==="complete"&&!A.execCommand(tag,{kind:"programme",id:"fx",choice:"end"},{auto:true}).ok,"last phase completes the programme");
/* failure is real: a sure-fail choice stalls and then ends the programme */
A.progRegister(fixture(0));A.progStart(G.c.FRA,"fx");const f=G.c.FRA;f.tr=1e6;f.stat.inc=1000;
for(let i=0;i<3;i++)A.execCommand("FRA",{kind:"programme",id:"fx",choice:"go"},{auto:true});
ok(f.prog.fx.done==="failed"&&f.fxFail===3&&f.prog.fx.phase===0,"three failures end the programme; no scripted success");
/* AI monthly path: an AI nation takes the card by itself, on the same command path */
A.progRegister(fixture(1));const i0=G.c.AUS;i0.prog={};A.progStart(i0,"fx");i0.tr=1e6;i0.ai=true;
for(let i=0;i<4&&i0.prog.fx.phase===0;i++)A.monthTick();
ok(i0.prog.fx.phase>=1,"AI nation advances the programme in monthTick");
/* save defaults */
const d=G.c.ENG||G.c.GBR;d.prog={x:{phase:-3,momentum:"a",support:{k:500},done:"zz",hist:7},y:5};
A.progSanitize(d);ok(!d.prog.y&&d.prog.x.phase===0&&d.prog.x.momentum===50&&d.prog.x.support.k===100&&d.prog.x.done===""&&d.prog.x.hist.length===0,"damaged saved state is repaired");
d.prog=undefined;A.progSanitize(d);ok(typeof d.prog==="object","old save without c.prog gets {}");
/* determinism: same seed, same order -> same result */
function run(){const g=game(11);A.progRegister(fixture(.5));const n=g.c.PRU;A.progStart(n,"fx");g.t=48;n.tr=1e6;n.rp=9;n.stat.inc=1000;const x=A.execCommand("PRU",{kind:"programme",id:"fx",choice:"go"},{auto:true});return JSON.stringify([x.win,n.prog.fx]);}
ok(run()===run(),"same seed gives the same outcome");
console.log(bad?"FAIL":"ok");process.exit(bad?1:0);
