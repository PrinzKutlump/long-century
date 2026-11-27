"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { stripTypeScriptTypes } = require("node:module");

function transpileTsForClassicBundle(source, filename) {
  let code = stripTypeScriptTypes(source, { mode: "strip" });
  code = code
    .replace(/^\s*import\s+type\b[\s\S]*?;\s*$/gm, "")
    .replace(/^\s*import\s+\{[^}]*\}\s+from\s+["'][^"']+["'];?\s*$/gm, "")
    .replace(/^\s*export\s+type\b[\s\S]*?;\s*$/gm, "")
    .replace(/^\s*export\s+\{[^}]*\};?\s*$/gm, "")
    .replace(/^([ \t]*)export\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/gm, "$1");
  return code;
}

function readEngineFile(rootDir, relPath) {
  const fullPath = path.join(rootDir, "src", relPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  if (relPath.endsWith(".ts")) {
    return transpileTsForClassicBundle(raw, fullPath);
  }
  return raw;
}

module.exports = { readEngineFile, transpileTsForClassicBundle };
