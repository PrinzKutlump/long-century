import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const require = createRequire(import.meta.url);
const { readEngineFile } = require("./scripts/transpile-engine.cjs");

const ROOT = process.cwd();
const metadata = JSON.parse(fs.readFileSync(path.join(ROOT, "metadata.json"), "utf8"));
const engineFiles = JSON.parse(fs.readFileSync(path.join(ROOT, "engine-files.json"), "utf8"));
const uiFiles = [
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
  "ui_day.js"
];

function readSrc(file) {
  return readEngineFile(ROOT, file);
}

function buildPakoSnippet() {
  const pako = readSrc("vendor/pako.js");
  return `const SAVE_COMPRESSION=(function(window,module,exports,define){\n${pako}\n;return window.pako;})({});\n`;
}

function buildEngineBundle() {
  const parts = [`const LC_BUILD_NUMBER = "";`, buildPakoSnippet()];
  for (const file of engineFiles) {
    parts.push(`\n/* === src/${file} === */\n` + readSrc(file));
  }
  return parts.join("\n;\n");
}

function buildFullClassicBundle() {
  const parts = [buildEngineBundle()];
  for (const file of uiFiles) {
    parts.push(`\n/* === src/${file} === */\n` + readSrc(file));
  }
  return parts.join("\n;\n");
}

function buildWorkerBundle() {
  const workerHandler = fs.readFileSync(path.join(ROOT, "src/workers/sim.worker.js"), "utf8");
  const preamble = `
if (typeof globalThis.window === "undefined") globalThis.window = globalThis;
if (typeof globalThis.performance === "undefined") globalThis.performance = { now: () => Date.now() };
if (typeof globalThis.localStorage === "undefined") globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
if (typeof globalThis.document === "undefined") {
  globalThis.document = {
    readyState: "complete",
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, addEventListener() {} }),
    body: { appendChild() {}, dataset: {} },
    documentElement: { dataset: {}, style: { setProperty() {} } }
  };
}
`;
  return preamble + "\n" + buildEngineBundle() + "\n" + workerHandler;
}

function longCenturyBundlerPlugin() {
  return {
    name: "long-century-classic-bundler",
    configureServer(server) {
      server.middlewares.use("/lc-app-bundle.js", (_req, res) => {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(buildFullClassicBundle());
      });
      server.middlewares.use("/sim-worker.js", (_req, res) => {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(buildWorkerBundle());
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "lc-app-bundle.js",
        source: buildFullClassicBundle()
      });
      this.emitFile({
        type: "asset",
        fileName: "sim-worker.js",
        source: buildWorkerBundle()
      });
    }
  };
}

const siteBase = process.env.LC_SITE_BASE || "/";

export default defineConfig({
  base: siteBase,
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  },
  plugins: [
    longCenturyBundlerPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module"
      },
      includeAssets: [
        "icon.svg",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-512x512.png"
      ],
      manifest: {
        id: siteBase,
        name: metadata.name,
        short_name: "LongCentury",
        description: metadata.description,
        theme_color: "#141b26",
        background_color: "#141b26",
        display: "standalone",
        orientation: "any",
        scope: siteBase,
        start_url: siteBase,
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json}"],
        // media under public/assets/ loads only when shown, then stays cached (runtimeCaching below)
        globIgnores: ["assets/pictures/**", "assets/audio/**", "assets/models/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/assets\/(pictures|audio|models)\//.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "lc-media-assets",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ]
});
