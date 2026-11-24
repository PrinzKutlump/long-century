"use strict";
/* A6 report: which uncivilised states westernise and when, Punjab rp in 1900. Usage: node tools/a6_west.js <seed>... */
const { engine } = require("./a4_lib");
for (const seed of process.argv.slice(2).map(Number)) {
 const E = engine(); E.A.newGame("SWI", seed);
 const start = JSON.parse(E.run(`JSON.stringify(Object.values(G.c).filter(c=>!c.civ).map(c=>c.tag))`));
 let rp1900 = null;
 for (let t = 0; t < 12 * 78; t++) { E.month(); if (rp1900 === null && E.run("yearOf(G.t)") >= 1900) rp1900 = E.run(`G.c.PUN&&G.c.PUN.alive?Math.round(G.c.PUN.stat.rp*10)/10+" modern "+G.c.PUN.modern:"gone"`); }
 const out = JSON.parse(E.run(`JSON.stringify(${JSON.stringify(start)}.map(t=>{const c=G.c[t];return [t,c.alive?(c.civ?yearOf(c.civT)+"":"no ("+Math.round(c.modern)+"%)"):"gone"]}))`));
 console.log("seed " + seed + " Punjab rp 1900: " + rp1900 + "\n " + out.map(x => x.join(" ")).join("; "));
}
