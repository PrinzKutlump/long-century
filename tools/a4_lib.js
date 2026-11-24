"use strict";
/* A4 helpers: the built game in a fresh vm context (the page's own pack/unpack), with the A0 digest functions added. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const L = require("./a0_lib");
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "dist/long-century.html"), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

function engine() {
 const nodes = new Map();
 const ctx = vm.createContext({ console, performance, setInterval: () => 1, clearInterval: () => {}, window: { addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild(n) { nodes.set("#" + n.id, n); } } } });
 vm.runInContext(script, ctx);
 vm.runInContext(L.API_SOURCE, ctx);
 const run = src => vm.runInContext(src, ctx);
 return {
  ctx, A: ctx.API, run,
  pack: () => run("pack()"),
  unpack(z) { ctx.__z = z; run("unpack(__z)"); return JSON.parse(JSON.stringify(run("LAST_LOAD"))); },
  json: () => run("saveJSON()"),
  digest: () => L.digestRow({ A: ctx.API }),
  month() { const G = ctx.API.getG(); if (G.card) ctx.API.cardDefault(); ctx.API.monthTick(); },
  advance(n) { for (let i = 0; i < n; i++) this.month(); }
 };
}
/* every number reachable from G that is not finite (province list and cyclic helpers skipped) */
function nonFinite(E) {
 return E.run(`(()=>{const bad=[],seen=new Set();const scan=(o,p,d)=>{if(o==null||d>14||bad.length>20)return;if(typeof o==="number"){if(!Number.isFinite(o))bad.push(p);return;}
  if(typeof o!=="object"||seen.has(o))return;seen.add(o);for(const k in o){if(k==="plist")continue;scan(o[k],p+"."+k,d+1);}};scan(G,"G",0);return bad;})()`);
}
module.exports = { engine, nonFinite, ROOT };
