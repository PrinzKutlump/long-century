/**
 * Web Audio API procedural sound effects & optional period ambient bed.
 * Requires zero external MP3s to play crisp tactile feedback, while automatically
 * supporting drop-in audio files in public/assets/audio/ when added later.
 */
export function createAudioEngine() {
  let ctx = null;
  let muted = false;
  let ambientOn = false;
  let ambientNodes = null;

  try {
    muted = localStorage.getItem("vic.muted") === "1";
    ambientOn = localStorage.getItem("vic.ambient") === "1";
  } catch {
    muted = false;
  }

  function ensureCtx() {
    if (muted || typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      try {
        ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, dur, type = "sine", gainVal = 0.06, delay = 0) {
    const c = ensureCtx();
    if (!c) return;
    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, gainVal), now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function sfx(cue = "click") {
    if (muted) return;
    switch (cue) {
      case "seal":
        tone(196, 0.14, "triangle", 0.08, 0);
        tone(293.66, 0.22, "sine", 0.06, 0.05);
        break;
      case "month":
        tone(220, 0.09, "triangle", 0.05, 0);
        tone(330, 0.14, "sine", 0.045, 0.05);
        break;
      case "rail":
      case "build":
        tone(146.83, 0.08, "square", 0.035, 0);
        tone(220, 0.12, "triangle", 0.05, 0.06);
        break;
      case "warhorn":
        tone(130.81, 0.26, "sawtooth", 0.045, 0);
        tone(196, 0.34, "triangle", 0.06, 0.08);
        break;
      case "peace":
        tone(261.63, 0.18, "sine", 0.05, 0);
        tone(329.63, 0.2, "sine", 0.05, 0.07);
        tone(392, 0.28, "sine", 0.05, 0.14);
        break;
      case "coin":
        tone(880, 0.06, "sine", 0.04, 0);
        tone(1174.66, 0.1, "sine", 0.035, 0.04);
        break;
      default:
        tone(420, 0.045, "triangle", 0.03, 0);
        break;
    }
  }

  function startAmbient() {
    if (muted || ambientNodes) return;
    const c = ensureCtx();
    if (!c) return;
    try {
      const master = c.createGain();
      master.gain.value = 0.022;
      master.connect(c.destination);
      const freqs = [110, 164.81, 220];
      const oscs = freqs.map((f, idx) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = idx === 0 ? "triangle" : "sine";
        osc.frequency.value = f;
        g.gain.value = idx === 0 ? 0.55 : 0.25;
        osc.connect(g);
        g.connect(master);
        osc.start();
        return osc;
      });
      ambientNodes = { master, oscs };
    } catch {
      ambientNodes = null;
    }
  }

  function stopAmbient() {
    if (!ambientNodes) return;
    try {
      for (const osc of ambientNodes.oscs) {
        osc.stop();
        osc.disconnect();
      }
      ambientNodes.master.disconnect();
    } catch {
      // Ignore already stopped oscillators
    }
    ambientNodes = null;
  }

  function setMuted(next) {
    muted = !!next;
    try {
      localStorage.setItem("vic.muted", muted ? "1" : "0");
    } catch {}
    if (muted) stopAmbient();
    else if (ambientOn) startAmbient();
    syncBadges();
    return muted;
  }

  function setAmbient(next) {
    ambientOn = !!next;
    try {
      localStorage.setItem("vic.ambient", ambientOn ? "1" : "0");
    } catch {}
    if (ambientOn && !muted) startAmbient();
    else stopAmbient();
    syncBadges();
    return ambientOn;
  }

  function syncBadges() {
    document.querySelectorAll("[data-audio-mute]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(muted));
      btn.setAttribute("aria-label", muted ? "Unmute sound (M)" : "Mute sound (M)");
      btn.classList.toggle("is-muted", muted);
      const lbl = btn.querySelector(".lc-mute-lbl");
      if (lbl) {
        lbl.textContent = muted ? "Muted [M]" : "Sound [M]";
      } else {
        btn.textContent = muted ? "Muted [M]" : "Sound [M]";
      }
    });
  }

  return {
    sfx,
    isMuted: () => muted,
    isAmbient: () => ambientOn,
    toggleMute: () => setMuted(!muted),
    setMuted,
    setAmbient,
    unlock: () => {
      ensureCtx();
      if (ambientOn && !muted) startAmbient();
    },
    syncBadges
  };
}
