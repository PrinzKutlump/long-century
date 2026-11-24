"use strict";
const { readFileSync } = require("node:fs");
const { compileFunction } = require("node:vm");
const path = require("node:path");
const files = require("./engine-files.json");

module.exports = function loadTestEngine(testSource) {
 const scope = {};
 const engine = files.map(name => readFileSync(path.join(__dirname, "src", name), "utf8")).join("\n;\n");
 compileFunction(engine + "\n;\n" + testSource, ["globalThis"])(scope);
 return scope;
};
