import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { readEngineFile } = require("./scripts/transpile-engine.cjs");

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const readUtf8 = (relPath) => fs.readFileSync(path.join(rootDir, relPath), "utf8");

const engineFiles = JSON.parse(readUtf8("engine-files.json"));
const jsFiles = [
  ...engineFiles,
  "flags.js",
  "ui.js",
  "ui2.js",
  "ui3.js",
  "ui4.js",
  "ui5.js",
  "ui6.js",
  "ui7.js",
  "ui8.js",
  "ui9.js",
  "ui_audio.js",
  "ui_day.js",
];

const css = ["ui.css", "ui3.css"]
  .map((f) => readUtf8(path.join("src", f)))
  .join("\n");

const compression = readUtf8("src/vendor/pako.js");
const licenseText = readUtf8("src/vendor/pako-LICENSE.txt");

const codec =
  "const SAVE_COMPRESSION=(function(window,module,exports,define){\n" +
  "/*\n" +
  licenseText +
  "*/\n" +
  compression +
  "\n;return window.pako;\n})({});";

const codecCopy = codec
  .replaceAll("http://zlib.net/manual.html#Advanced", "zlib.net/manual.html#Advanced")
  .replace("const SAVE_COMPRESSION=", "var SAVE_COMPRESSION=");

let buildNumber = process.env.LC_BUILD_NUMBER || "";
if (!/^[0-9]+$/.test(buildNumber)) {
  buildNumber = "";
}

const js = [
  `const LC_BUILD_NUMBER = ${JSON.stringify(buildNumber)};`,
  codec,
  ...jsFiles.map((f) => readEngineFile(rootDir, f)),
].join("\n;\n");

const description =
  "Lead a country from 1836 through 1936 in a single-player historical strategy game. Manage construction, budgets, diplomacy and reform one month at a time.";

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>The Long Century</title><meta name="description" content="${description}"><meta property="og:title" content="The Long Century"><meta property="og:description" content="${description}"><style>${css}</style></head><body><script type="text/plain" id="codec-src">${codecCopy}</script><script>${js}</script></body></html>`;

const distDir = path.join(rootDir, "dist");
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "long-century.html"), html, "utf8");
fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");

console.log(`built ${Math.floor(Buffer.byteLength(html, "utf8") / 1024)} KB`);
