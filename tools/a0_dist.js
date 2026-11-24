"use strict";
/* Runs the built game (dist/long-century.html) in a vm exactly as century.js does, with optional source patches
 * from a0_lib.PATCHES and a harness string appended to the game's scope. Used by the A0 measurement tools. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash } = require("node:crypto");
const { performance } = require("node:perf_hooks");
const { patchSource } = require("./a0_lib");

function runDist({ seed, player, patches = [], cf = {}, harness, extra = {} }) {
 const nodes = new Map();
 globalThis.__CF = cf;
 const bindings = {
  console, performance, digest: text => createHash("sha256").update(text).digest("hex"),
  memory: () => process.memoryUsage().heapUsed,
  args: { seed, player: player === "AI" || player == null ? null : player },
  window: { addEventListener() {} },
  document: { addEventListener() {}, querySelector: s => nodes.get(s), createElement: () => ({}), body: { appendChild: n => nodes.set("#" + n.id, n) } },
  ...extra
 };
 const html = fs.readFileSync(path.join(__dirname, "..", "dist/long-century.html"), "utf8");
 const source = patchSource(html.match(/<script>([\s\S]*)<\/script>/)[1], patches);
 return vm.compileFunction(source + "\n" + harness, Object.keys(bindings))(...Object.values(bindings));
}
module.exports = { runDist };
