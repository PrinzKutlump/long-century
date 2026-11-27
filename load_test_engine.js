"use strict";
const { compileFunction } = require("node:vm");
const files = require("./engine-files.json");
const { readEngineFile } = require("./scripts/transpile-engine.cjs");

module.exports = function loadTestEngine(testSource) {
 const scope = {};
 const engine = files.map(name => readEngineFile(__dirname, name)).join("\n;\n");
 compileFunction(engine + "\n;\n" + testSource, ["globalThis"])(scope);
 return scope;
};
