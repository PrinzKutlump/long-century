import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { createStorageAdapter } from "./storage.js";
import { buildAssetManifest, resolveProvinceSceneMeta } from "./assetCatalog.js";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const { readEngineFile } = require(path.join(ROOT, "scripts/transpile-engine.cjs"));

test("FX1: closed factories (lv <= 0) zero stale output metrics in economy pass", () => {
  const loadTestEngine = require(path.join(ROOT, "load_test_engine.js"));
  const ctx = loadTestEngine(`
    newGame("GBR", 7);
    const prov = provsOf("GBR").find(p => p.factories && p.factories.length > 0);
    if (!prov) throw new Error("expected British factory");
    prov.factories.push({
      g: "steel",
      lv: 0,
      emp: 1200,
      _out: 48.5,
      _e: 1200,
      _im: 1.0,
      _limitingInput: "coal"
    });
    advanceCampaign(G.t);
    globalThis.closed = prov.factories[prov.factories.length - 1];
    globalThis.inc = G.c.GBR.stat.inc;
  `);
  assert.equal(ctx.closed.lv, 0);
  assert.equal(ctx.closed._out, 0);
  assert.equal(ctx.closed._e, 0);
  assert.equal(ctx.closed._im, 0);
  assert.equal(ctx.closed._limitingInput, null);
  assert.ok(Number.isFinite(ctx.inc));
});

test("Storage v2 silently migrates legacy localStorage keys without blocking prompts", async () => {
  const store = new Map([
    ["vic.auto", "V2:abc123"],
    ["vic.autoM", JSON.stringify({ t: 3, n: "Prussia" })],
    ["vic.s1", "V2:slotone"]
  ]);
  const prevLS = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k)
  };
  try {
    const adapter = createStorageAdapter();
    await adapter.init();

    assert.equal(adapter.get("vic.auto"), "V2:abc123");
    assert.equal(adapter.get("vic.s1"), "V2:slotone");
    assert.equal(store.has("vic.auto"), false);
    assert.equal(store.has("vic.s1"), false);
    assert.equal(adapter.stats().migratedLegacyCount, 3);

    await adapter.set("vic.s2", "V2:manual");
    assert.equal(adapter.get("vic.s2"), "V2:manual");
    await adapter.del("vic.s2");
    assert.equal(adapter.get("vic.s2"), null);
  } finally {
    if (prevLS === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = prevLS;
  }
});

test("Source tree eliminates window.confirm, window.prompt, and window.alert calls", () => {
  const srcFiles = fs.readdirSync(path.join(ROOT, "src")).filter(f => f.endsWith(".js"));
  for (const file of srcFiles) {
    const raw = fs.readFileSync(path.join(ROOT, "src", file), "utf8");
    const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.equal(/\b(?:window\.)?(?:confirm|alert)\s*\(/.test(stripped), false, `${file} contains confirm/alert`);
    assert.equal(/(?<!deferredPrompt\.)\bprompt\s*\(/.test(stripped), false, `${file} contains window.prompt`);
  }
});

test("Asset manifest resolves province and naval scenes without undefined entries", () => {
  const ASSET_MANIFEST = buildAssetManifest();
  assert.ok(ASSET_MANIFEST.pictures.titleBackdrop.src);
  assert.ok(ASSET_MANIFEST.pictures.capitalScene.src);
  assert.ok(ASSET_MANIFEST.pictures.navalFleet.src);
  assert.ok(ASSET_MANIFEST.pictures.emblem.src);
  assert.ok(ASSET_MANIFEST.units.inf && ASSET_MANIFEST.units.dread);

  const capitalScene = resolveProvinceSceneMeta(
    ASSET_MANIFEST,
    { id: "p0", n: "London", sea: true, port: 2, t: "p" },
    { cap: "p0", n: "United Kingdom" }
  );
  assert.equal(capitalScene.src, ASSET_MANIFEST.pictures.capitalScene.src);
  assert.match(capitalScene.caption, /Seat of United Kingdom/);

  const portScene = resolveProvinceSceneMeta(
    ASSET_MANIFEST,
    { id: "p9", n: "Portsmouth", sea: true, port: 1, t: "p" },
    { cap: "p0", n: "United Kingdom" }
  );
  assert.equal(portScene.src, ASSET_MANIFEST.pictures.navalFleet.src);
});

test("Sim worker handler runs ping, newGame, advance, pack, and unpack identically", () => {
  const engineFiles = JSON.parse(fs.readFileSync(path.join(ROOT, "engine-files.json"), "utf8"));
  const pako = fs.readFileSync(path.join(ROOT, "src/vendor/pako.js"), "utf8");
  const workerSrc = fs.readFileSync(path.join(ROOT, "src/workers/sim.worker.js"), "utf8");

  const sent = [];
  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    Error,
    Int32Array,
    Uint8Array,
    Uint16Array,
    Float64Array,
    btoa: s => Buffer.from(s, "binary").toString("base64"),
    atob: s => Buffer.from(s, "base64").toString("binary"),
    performance: { now: () => Date.now() },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    document: {
      readyState: "complete",
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {} }),
      body: { appendChild() {}, dataset: {} },
      documentElement: { dataset: {}, style: { setProperty() {} } }
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = {
    postMessage: msg => sent.push(msg),
    onmessage: null
  };
  vm.createContext(sandbox);

  const pakoCode = `const SAVE_COMPRESSION=(function(window,module,exports,define){\n${pako}\n;return window.pako;})({});`;
  vm.runInContext(pakoCode, sandbox);
  for (const f of engineFiles) {
    vm.runInContext(readEngineFile(ROOT, f), sandbox, { filename: f });
  }
  vm.runInContext(workerSrc, sandbox, { filename: "sim.worker.js" });

  assert.equal(typeof sandbox.self.onmessage, "function");

  sandbox.self.onmessage({ data: { id: 1, type: "ping" } });
  assert.equal(sent[0].ok, true, sent[0].error);

  sandbox.self.onmessage({ data: { id: 2, type: "newGame", tag: "PRU", seed: 7 } });
  assert.equal(sent[1].ok, true, sent[1].error);
  assert.ok(sent[1].stateJson.length > 1000);

  sandbox.self.onmessage({ data: { id: 3, type: "advance", expectedMonth: 0, stateJson: sent[1].stateJson } });
  assert.equal(sent[2].ok, true, sent[2].error);
  assert.equal(sent[2].t, 1);
  assert.ok(sent[2].packedSave.startsWith("V2:"));

  sandbox.self.onmessage({ data: { id: 4, type: "unpack", saveText: sent[2].packedSave } });
  assert.equal(sent[3].ok, true, sent[3].error);
  const unpacked = JSON.parse(sent[3].stateJson);
  assert.equal(unpacked.t, 1);
  assert.equal(unpacked.player, "PRU");
});
