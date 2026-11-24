"use strict";
/* Research queue (owner request after A4): points always bank; a per-nation queue of up to 5 studies runs in order; the next valid study
 * starts by itself and banked points cascade through it in the same month; commands go through execCommand (double taps and duplicates
 * are rejected); the queue and the banked points survive save and reload. Runs on the built game with the real pack/unpack. */
const fs = require("node:fs");
const { engine } = require("./tools/a4_lib");
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const E = engine();
E.A.newGame("GBR", 7);
const R = src => E.run(src);
R(`G.t=12*50;globalThis.__c=G.c.GBR;globalThis.__ord=cmd=>applyCampaignCommand({...issueCampaignCommand(),...cmd});
 globalThis.__ready=()=>TECHS.map(t=>t.id||t[0]).filter(id=>techReady(__c,id,[]));`);
const ready = R("__ready()");
check(ready.length >= 8, "enough studies are open to test with (" + ready.length + ")");
const [t1, t2, t3, t4, t5, t6] = ready;
const cost = id => R(`techCost(__c,TF[${JSON.stringify(id)}])`);
const order = c => R(`__ord(${JSON.stringify(c)})`);
const queue = () => R("__c.resQ.slice()");

/* 1. idle months bank points */
R(`__c.res=null;__c.resQ=[];__c.rp=0;`);
const gained = R(`(()=>{let s=0;for(let i=0;i<3;i++){researchMonth();s+=__c.stat.rp;}return [s,__c.rp];})()`);
check(gained[1] > 0 && Math.abs(gained[0] - gained[1]) < 1e-9, "idle months bank points (" + gained[1].toFixed(2) + " from 3 months, nothing wasted)");
R(`G.c.GBR.rp=0`);

/* 2. a queue of five runs in order; the sixth is rejected; a double add is rejected */
check(order({ kind: "research", tech: t1 }).ok && R("__c.res") === t1, "research set starts a study now");
const adds = [t2, t3, t4, t5, t6].map(t => order({ kind: "researchQueue", op: "add", tech: t }));
check(adds.every(r => r.ok) && queue().length === 5, "five studies queue behind the current one");
check(order({ kind: "researchQueue", op: "add", tech: t5 }).ok === false, "a duplicate add is rejected");
const tail = ready[6];
const sixth = order({ kind: "researchQueue", op: "add", tech: tail });
check(!sixth.ok && /full/i.test(sixth.why), "the sixth is rejected: " + sixth.why);
const stale = R(`applyCampaignCommand({month:G.t,serial:(G.commandSerial||0),kind:"researchQueue",op:"add",tech:${JSON.stringify(tail)}})`);
check(!stale.ok, "a replayed (double-tapped) order is stale and cannot add twice");
check(JSON.stringify(queue()) === JSON.stringify([t2, t3, t4, t5, t6]), "queue order is as ordered");
check(order({ kind: "researchQueue", op: "move", tech: t3, direction: -1 }).ok && queue()[0] === t3, "move up works");
check(!order({ kind: "researchQueue", op: "move", tech: t3, direction: -1 }).ok, "the first entry cannot move up");
order({ kind: "researchQueue", op: "move", tech: t3, direction: 1 });
check(order({ kind: "researchQueue", op: "remove", tech: t6 }).ok && queue().length === 4, "remove works");
order({ kind: "researchQueue", op: "add", tech: t6 });
const known = Object.keys(R("__c.tech"))[0];
check(!order({ kind: "researchQueue", op: "add", tech: known }).ok || queue().length === 5, "an already-known study cannot be queued");
check(!order({ kind: "researchQueue", op: "add", tech: "no_such_tech" }).ok, "an unknown study is rejected");

/* 3. prerequisites: a chain is validated in order, earlier queue entries count */
R(`__c.resQ=[];`);
R(`TF[${JSON.stringify(t4)}].pre=[${JSON.stringify(t3)}];`);
check(!order({ kind: "researchQueue", op: "add", tech: t4 }).ok, "a study whose prerequisite is not known or queued is rejected");
check(order({ kind: "researchQueue", op: "add", tech: t3 }).ok && order({ kind: "researchQueue", op: "add", tech: t4 }).ok, "queued after its prerequisite it is accepted");
check(!order({ kind: "researchQueue", op: "remove", tech: t3 }).ok, "the prerequisite cannot be removed while a dependent study is queued");
check(!order({ kind: "researchQueue", op: "move", tech: t4, direction: -1 }).ok, "the dependent study cannot move ahead of its prerequisite");
R(`delete TF[${JSON.stringify(t4)}].pre;`);

/* 4. cascade: banked points cover several studies and the queue runs in order within one month */
R(`__c.res=${JSON.stringify(t1)};__c.resQ=[${[t2, t3, t4].map(x => JSON.stringify(x)).join(",")},${JSON.stringify(t5)}];__c.rp=0;`);
const need = cost(t1) + cost(t2) + cost(t3) + 5;
R(`__c.rp=${need}-__c.stat.rp-1e-9;`); /* researchMonth adds this month's points first */
R(`__c.stat.rp=0;`);
R(`(()=>{const o=rpOf;rpOf=()=>0;__c.rp=${need};researchMonth();rpOf=o;})()`);
const st = R(`({known:[${[t1, t2, t3, t4].map(x => JSON.stringify(x)).join(",")}].map(x=>!!__c.tech[x]),res:__c.res,q:__c.resQ.slice(),rp:__c.rp})`);
check(st.known.join() === "true,true,true,false", "banked points complete three studies in one month, in queue order");
check(st.res === t4 && JSON.stringify(st.q) === JSON.stringify([t5]), "the next queued study is now under way and the queue shrank");
check(Math.abs(st.rp - 5) < 1e-6, "leftover points carry over (" + st.rp.toFixed(3) + ")");

/* 5. invalid entries are skipped with a dispatch for the player */
R(`__c.res=null;__c.resQ=[${JSON.stringify(t6)},${JSON.stringify(ready[6])}];__c.tech[${JSON.stringify(t6)}]=1;G.msgs.length=0;__c.rp=0;(()=>{const o=rpOf;rpOf=()=>0;researchMonth();rpOf=o;})()`);
const st5 = R(`({res:__c.res,q:__c.resQ.slice(),msg:G.msgs.some(m=>/can no longer be started/.test(m.txt))})`);
check(st5.res === ready[6] && st5.q.length === 0 && st5.msg, "an entry that became invalid is skipped, the next one starts, the player is told");

/* 6. save and reload keep the queue and the points */
R(`__c.res=${JSON.stringify(t5)};__c.resQ=[${JSON.stringify(ready[7])}];__c.rp=123.5;`);
const E2 = engine(); E2.unpack(E.pack());
const re = E2.run(`({res:G.c.GBR.res,q:G.c.GBR.resQ,rp:G.c.GBR.rp})`);
check(re.res === t5 && JSON.stringify(re.q) === JSON.stringify([ready[7]]) && re.rp === 123.5, "save and reload keep the current study, the queue and the banked points");
const E3 = engine(); const legacy = JSON.parse(E.json()); for (const t in legacy.c) delete legacy.c[t].resQ; legacy.c.GBR.resQ = ["bad", t5, t5];
E3.unpack(JSON.stringify(legacy));
check(E3.run(`Object.values(G.c).every(c=>Array.isArray(c.resQ))`) && JSON.stringify(E3.run("G.c.GBR.resQ")) === JSON.stringify([t5]), "load defaults: missing queue -> [], unknown and duplicate ids dropped");

/* 7. the AI picks when idle and uses banked points the same way */
const ai = R(`(()=>{const a=G.c.FRA;a.res=null;a.resQ=[];a.rp=1e9;const before=Object.keys(a.tech).length;researchMonth();return [Object.keys(a.tech).length-before,a.resQ.length];})()`);
check(ai[0] >= 2 && ai[0] <= 6 && ai[1] === 0, "an idle AI with banked points picks and finishes studies, bounded per month (" + ai[0] + ")");
process.exitCode = failed ? 1 : 0;
