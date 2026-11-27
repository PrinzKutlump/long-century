import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";

export function setupPWAAndCapacitor({ onAndroidBack } = {}) {
  let deferredPrompt = null;
  const isStandalone = () =>
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true ||
    !!Capacitor?.isNativePlatform?.();

  const isIos = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent || "") && !isStandalone();

  // Register Workbox service worker in VitePWA
  let updateSW = null;
  try {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW?.(true);
      },
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent("lc:offline-ready"));
      }
    });
  } catch {
    // SW may be unsupported in restricted contexts
  }

  // Offline / Online indicator
  function ensureOfflineBanner() {
    let el = document.getElementById("lc-offline-pill");
    if (!el) {
      el = document.createElement("div");
      el.id = "lc-offline-pill";
      el.className = "lc-offline-banner";
      el.setAttribute("role", "status");
      el.textContent = "Offline mode — campaigns & saves work locally";
      document.body.appendChild(el);
    }
    el.hidden = navigator.onLine !== false;
  }

  window.addEventListener("online", ensureOfflineBanner);
  window.addEventListener("offline", ensureOfflineBanner);
  ensureOfflineBanner();

  // Install prompt capture
  function renderInstallButtons() {
    const showAndroidPrompt = !!deferredPrompt && !isStandalone();
    const showIosGuide = isIos() && !isStandalone();
    document.querySelectorAll("[data-pwa-install-slot]").forEach(slot => {
      if (isStandalone()) {
        slot.innerHTML = "";
        return;
      }
      if (showAndroidPrompt) {
        slot.innerHTML = `<button type="button" class="btn sm pri" data-pwa-install="1">Install App</button>`;
      } else if (showIosGuide) {
        slot.innerHTML = `<button type="button" class="btn sm" data-pwa-ios="1">Add to Home Screen</button>`;
      } else {
        slot.innerHTML = "";
      }
    });
  }

  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
    renderInstallButtons();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    renderInstallButtons();
  });

  document.addEventListener("click", async e => {
    const btn = e.target.closest("[data-pwa-install]");
    if (btn && deferredPrompt) {
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch {}
      deferredPrompt = null;
      renderInstallButtons();
      return;
    }
    const iosBtn = e.target.closest("[data-pwa-ios]");
    if (iosBtn) {
      const slot = iosBtn.closest("[data-pwa-install-slot]");
      if (slot) {
        slot.innerHTML = `<span class="small muted">Tap Safari's Share icon, then “Add to Home Screen”.</span>`;
      }
    }
  });

  // Capacitor hardware back button on Android
  try {
    if (Capacitor?.isNativePlatform?.() && CapacitorApp?.addListener) {
      CapacitorApp.addListener("backButton", () => {
        const handled = onAndroidBack ? onAndroidBack() : false;
        if (!handled) {
          CapacitorApp.minimizeApp?.().catch(() => {});
        }
      });
    }
  } catch {
    // Web browser environment
  }

  return {
    isStandalone,
    isNative: () => !!Capacitor?.isNativePlatform?.(),
    renderInstallButtons,
    canInstall: () => (!!deferredPrompt || isIos()) && !isStandalone()
  };
}
