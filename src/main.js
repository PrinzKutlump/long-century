import "./ui.css";
import "./ui3.css";
import "./styles/modern.css";

import { ASSET_MANIFEST, getProvinceSceneMeta } from "./platform/assetManifest.js";
import { createStorageAdapter } from "./platform/storage.js";
import { createAudioEngine } from "./platform/audio.js";
import { setupPWAAndCapacitor } from "./platform/pwa.js";
import { createSimClient } from "./platform/simClient.js";
import { createPixiMapController } from "./ui/pixiMap.js";
import { createInitialEngineState, getPlayerEngineState, syncInitialEngineState, advanceGameMonth } from "./engine/state.ts";

const storage = createStorageAdapter();
const audio = createAudioEngine();
const simClient = createSimClient();
const pixiMap = createPixiMapController();
const pwa = setupPWAAndCapacitor({
  onAndroidBack: () => {
    if (typeof window.returnCampaignView === "function") {
      return window.returnCampaignView();
    }
    return false;
  }
});

window.LC_ASSETS = ASSET_MANIFEST;
window.LC_ASSET_FN = { getProvinceSceneMeta };
window.SAVES_V2 = storage;
window.AUD = audio;
window.LC_SIM = simClient;
window.LC_PWA = pwa;
window.LC_PIXIMAP = pixiMap;
window.EngineState = {
  createInitialEngineState,
  getPlayerEngineState,
  syncInitialEngineState,
  advanceGameMonth
};

// DOM state synchronizer reacting to game state changes
function updateGameDOM() {
  // once a campaign runs, the classic interface owns the header (drawTop and ui_day.js write #hdr-date)
  if (typeof window !== "undefined" && window.G && window.G.player && typeof window.drawTop === "function") return;
  const state = typeof getPlayerEngineState === "function" && typeof window !== "undefined" && window.G
    ? getPlayerEngineState(window.G)
    : createInitialEngineState();
  
  if (!state) return;

  const valTreasury = document.getElementById("val-treasury");
  if (valTreasury) {
    valTreasury.textContent = "£" + Math.round(state.treasury || 1000).toLocaleString();
  }

  const valDate = document.getElementById("val-date");
  if (valDate) {
    valDate.textContent = state.dateLabel || "January 1836";
  }

  const hdrDate = document.getElementById("hdr-date");
  if (hdrDate) {
    hdrDate.textContent = state.dateLabel || "January 1836";
  }

  const hdrCountry = document.getElementById("hdr-country");
  if (hdrCountry) {
    hdrCountry.textContent = (state.countryName || "United Kingdom") + " · " + (state.year || 1836);
  }
}

window.updateGameDOM = updateGameDOM;

function loadClassicRuntime() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${import.meta.env.BASE_URL}lc-app-bundle.js`;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = err => reject(err || new Error("Failed to load classic engine bundle"));
    document.head.appendChild(script);
  });
}

// Unlock audio on first pointer or key interaction
window.addEventListener("pointerdown", () => audio.unlock(), { once: true, passive: true });
window.addEventListener("keydown", () => audio.unlock(), { once: true });

// Periodic DOM synchronization with engine state changes
setInterval(() => {
  if (typeof window !== "undefined" && window.G) {
    updateGameDOM();
  }
}, 300);

storage
  .init()
  .catch(() => {})
  .then(loadClassicRuntime)
  .then(() => {
    const splash = document.getElementById("lc-boot-splash");
    if (splash) splash.remove();
    audio.syncBadges();
    pwa.renderInstallButtons();
    updateGameDOM();
  })
  .catch(err => {
    const splash = document.getElementById("lc-boot-splash");
    if (splash) {
      const p = splash.querySelector("p");
      if (p) p.textContent = "Startup failed: " + (err?.message || "please reload.");
    }
  });
