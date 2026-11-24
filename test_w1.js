// W1: regions cover every province once, each is connected, armies belong to theatres, transfers arrive
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('dist/long-century.html','utf8').split('<script>')[1].split('</script>')[0];
const ctx={window:{addEventListener(){}},document:{addEventListener(){}},console,Math,JSON,Object,Array,Number,String,Date,Set,Map,isFinite};vm.createContext(ctx);
vm.runInContext(source+'\n;globalThis.A={newGame,monthTick,G:()=>G,REGIONS,REGION,REG_OF,ADJ:()=>ADJ,SEA:()=>SEAADJ,thSync,thBrig,thTransfer,thGet,thHub,thList};',ctx);
const A=ctx.A;A.newGame(null,7);let G=A.G(),bad=0;const ok=(c,m)=>{if(!c){bad++;console.log("FAIL",m);}};
const ids=G.plist.map(p=>p.id),cnt={};for(const r of A.REGIONS)for(const p of r.p)cnt[p]=(cnt[p]||0)+1;
ok(ids.every(i=>cnt[i]===1),"every province in exactly one region");ok(Object.keys(cnt).length===ids.length,"no unknown provinces");
const adj=A.ADJ(),sea=A.SEA();let disc=0;
for(const r of A.REGIONS){const set=new Set(r.p),seen=new Set([r.p[0]]),q=[r.p[0]];while(q.length){const x=q.pop();for(const y of adj[x].concat(sea[x].map(e=>e[0])))if(set.has(y)&&!seen.has(y)){seen.add(y);q.push(y);}}if(seen.size!==r.p.length){disc++;console.log("disconnected",r.id);}}
ok(!disc,"every region connected by land or sea lane");console.log("regions",A.REGIONS.length,"provinces",ids.length);
for(let i=0;i<24;i++)A.monthTick();G=A.G();
const land=G.armies.filter(a=>!a.naval&&!a.reb);ok(land.length>0&&land.every(a=>a.th==="res"||A.REGION[a.th]),"every land army belongs to a theatre ("+land.length+")");
// old-save style: wipe th fields, sync restores them
land.forEach(a=>{delete a.th;});delete G.th;A.thSync();ok(land.every(a=>A.REGION[a.th]&&a.th===A.REG_OF[a.loc]),"armies re-assigned by position");
// transfer: France's brigades go from France to the Rhineland (player-style hold orders) and arrive
const tag="FRA",c=G.c[tag];c.ai=false;for(const a of G.armies)if(a.o===tag&&!a.naval&&!a.reb)a.th=A.REG_OF[a.loc];
const from="fran",to="rhin",have=A.thBrig(tag,from);ok(have.n>=2,"France has brigades at home ("+have.n+")");
const dry=A.thTransfer(tag,from,to,{inf:2,cav:0,art:0},true);console.log("theatre",from,"->",to,JSON.stringify(dry));ok(dry.ok&&dry.eta>=1,"dry run gives an arrival time");
const r=A.thTransfer(tag,from,to,{inf:2,cav:0,art:0});ok(r.ok&&r.n===2,"transfer ordered "+JSON.stringify(r));
let b=A.thBrig(tag,to);ok(b.mv>=2,"brigades listed as arriving");for(let i=0;i<dry.eta+6;i++){A.monthTick();c.ai=false;}G=A.G();b=A.thBrig(tag,to);ok(b.inf>=2&&b.mv===0,"brigades have arrived ("+JSON.stringify(b)+")");
console.log(bad?"FAILED":"ok");process.exit(bad?1:0);
