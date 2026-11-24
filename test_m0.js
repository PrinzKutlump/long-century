const ctx=require("./load_test_engine")('\n;globalThis.API={newGame,monthTick,getG:()=>G,provsOf,P,supLim,strength};');
const A=ctx.API,seed=+(process.argv[2]||7),tagT=process.argv[3]||"GBR";A.newGame(null,seed);let G=A.getG();
const bad=[];let units=0;for(const t in G.c){const k={};for(const a of G.armies)if(a.o===t&&!a.naval){k[a.loc]=(k[a.loc]||0)+a.u.length;units+=a.u.length;}
 let capSum=0;for(const p of A.provsOf(t))capSum+=A.supLim(p);const tot=Object.values(k).reduce((s,x)=>s+x,0);for(const l in k)if(k[l]>A.supLim(A.P(l)))bad.push(t+"@"+l+" "+k[l]+">"+A.supLim(A.P(l))+" (nation total "+tot+", capacity "+capSum+")");}
console.log("month 0: land units",units,"| stacks over limit:",bad.length);bad.forEach(x=>console.log("  ",x));
const avg=()=>{let s=0,n=0;for(const a of G.armies)if(a.o===tagT&&!a.naval)for(const u of a.u){s+=u.str;n++;}return(s/n).toFixed(3);};
console.log(tagT,"avg strength month 0:",avg());G.c[tagT].ai=false;for(let m=1;m<=6;m++){A.monthTick();G=A.getG();}console.log(tagT,"avg strength month 6:",avg());
{A.newGame(null,seed);G=A.getG();for(let m=0;m<6;m++){A.monthTick();G=A.getG();}let low=[];for(const t in G.c){let s=0,n=0;for(const a of G.armies)if(a.o===t&&!a.naval&&!a.reb)for(const u of a.u){s+=u.str;n++;}if(n&&s/n<.9)low.push(t+" "+(s/n).toFixed(2));}console.log("all-AI month 6, nations with avg strength <0.9:",low.join(", ")||"none");}
