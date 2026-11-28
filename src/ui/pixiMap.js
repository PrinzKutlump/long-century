import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";

function hexToInt(hex) {
  if (!hex || typeof hex !== "string") return 0xcccccc;
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    return parseInt([...clean].map(c => c + c).join(""), 16) || 0xcccccc;
  }
  return parseInt(clean.slice(0, 6), 16) || 0xcccccc;
}

function pointInRing(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInProv(w, x, y, provPts) {
  const rings = provPts(w);
  for (const pts of rings) {
    if (pointInRing(pts, x, y)) return true;
  }
  return false;
}

function parseColorCss(c, fallback = "#ece4cf") {
  if (!c) return fallback;
  if (c.startsWith("#")) return c;
  return fallback;
}

export function createPixiMapController() {
  let runtime;
  let hostEl = null;
  let canvasEl = null;
  let app = null;
  let usePixi = false;
  let initializing = null;
  let mounting = null;

  let worldRoot = null;
  let oceanGfx = null;
  let provGfx = null;
  let overlayGfx = null;
  let railGfx = null;
  let moveGfx = null;
  let unitLayer = null;
  let labelLayer = null;

  let hitMarkers = []; // screen-space marker hitboxes { x, y, r, kind, id, label }
  let animPhase = 0;
  let animTimer = null;
  let pendingDraw = false;
  let labelCacheKey = "";
  let cachedLabelNodes = [];

  function ensureCanvas(host) {
    hostEl = host;
    if (!canvasEl) {
      canvasEl = document.createElement("canvas");
      canvasEl.setAttribute("data-testid", "atlas-canvas");
      canvasEl.className = "atlas-canvas";
      canvasEl.setAttribute("aria-label", "Interactive historical world atlas");
    }
    if (canvasEl.parentElement !== host) {
      host.prepend(canvasEl);
    }
    return canvasEl;
  }

  async function initRenderer(host) {
    ensureCanvas(host);
    if (app || usePixi) return true;
    if (initializing) return initializing;

    initializing = (async () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width || 800));
      const h = Math.max(240, Math.round(rect.height || 600));
      try {
        const instance = new Application();
        await instance.init({
          canvas: canvasEl,
          width: w,
          height: h,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          preference: "webgl",
          autoStart: false
        });
        app = instance;
        worldRoot = new Container();
        oceanGfx = new Graphics();
        provGfx = new Graphics();
        overlayGfx = new Graphics();
        railGfx = new Graphics();
        moveGfx = new Graphics();
        unitLayer = new Container();
        labelLayer = new Container();

        worldRoot.addChild(oceanGfx, provGfx, overlayGfx, railGfx, moveGfx, unitLayer, labelLayer);
        app.stage.addChild(worldRoot);
        usePixi = true;
        startAnimLoop();
        return true;
      } catch {
        usePixi = false;
        app = null;
        startAnimLoop();
        return false;
      }
    })();

    return initializing;
  }

  function startAnimLoop() {
    if (animTimer) return;
    animTimer = setInterval(() => {
      if (document.hidden || !hostEl?.classList.contains("has-pixi")) return;
      if (!runtime.G || !runtime.UI || runtime.UI.tab !== "map") return;
      if (!document.getElementById("map")?.isConnected) return;
      animPhase = (animPhase + 0.14) % (Math.PI * 2);
      renderDynamicOverlayAndStage();
    }, 90);
  }

  function resizeToHost() {
    if (!hostEl || !canvasEl) return { w: 800, h: 600 };
    const r = hostEl.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (app && usePixi && (app.screen.width !== w || app.screen.height !== h)) {
      app.renderer.resize(w, h);
    } else if (!usePixi) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvasEl.width !== w * dpr || canvasEl.height !== h * dpr) {
        canvasEl.width = w * dpr;
        canvasEl.height = h * dpr;
      }
      canvasEl.style.width = w + "px";
      canvasEl.style.height = h + "px";
    }
    return { w, h };
  }

  function buildProvinceGeometry() {
    if (!usePixi || !provGfx || !overlayGfx || !railGfx) return;
    const G = runtime.G;
    const UI = runtime.UI;
    const WORLD = runtime.WORLD;
    if (!G || !WORLD) return;

    provGfx.clear();
    overlayGfx.clear();
    railGfx.clear();

    // Ocean cartographic graticule
    oceanGfx.clear();
    const dark = document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme && matchMedia?.("(prefers-color-scheme: dark)")?.matches);
    const gridColor = dark ? 0x3b4d52 : 0x8ea4a0;
    for (let x = 0; x <= WORLD.w; x += 180) {
      oceanGfx.moveTo(x, 0).lineTo(x, WORLD.h);
    }
    for (let y = 0; y <= WORLD.h; y += 140) {
      oceanGfx.moveTo(0, y).lineTo(WORLD.w, y);
    }
    oceanGfx.stroke({ width: 0.7, color: gridColor, alpha: 0.28 });

    // Province polygons
    const bmOn = typeof runtime.bmOn === "function" && runtime.bmOn();
    const bmSel = new Set(UI?.bm?.sel || []);
    const borderCol = dark ? 0x16110b : 0x362816;

    for (const w of WORLD.provs) {
      const p = runtime.P ? runtime.P(w.id) : G.prov?.[w.id];
      if (!p) continue;
      const rings = runtime.provPts ? runtime.provPts(w) : [];
      if (!rings.length) continue;

      const fillHex = parseColorCss(runtime.provColor ? runtime.provColor(p) : "#ece4cf");
      const fillInt = hexToInt(fillHex);
      let alpha = 1;
      if (bmOn && p.o !== G.player) alpha = 0.42;

      for (const pts of rings) {
        if (pts.length < 3) continue;
        const flat = [];
        for (let i = 0; i < pts.length; i++) {
          flat.push(pts[i][0], pts[i][1]);
        }
        provGfx.poly(flat, true);
      }
      provGfx.fill({ color: fillInt, alpha });
      provGfx.stroke({ width: 0.65, color: borderCol, alpha: 0.5 });

      // Occupied or selected or build-mode highlights
      const isSel = UI?.sel === p.id;
      const isOcc = !!p.ctl && p.ctl !== p.o;
      const isBm = bmSel.has(p.id);
      if (isSel || isOcc || isBm) {
        for (const pts of rings) {
          if (pts.length < 3) continue;
          const flat = [];
          for (let i = 0; i < pts.length; i++) flat.push(pts[i][0], pts[i][1]);
          overlayGfx.poly(flat, true);
        }
        if (isBm) {
          overlayGfx.fill({ color: 0x9c2a22, alpha: 0.35 });
          overlayGfx.stroke({ width: 2.2, color: 0x1d150a, alpha: 0.95 });
        } else if (isSel) {
          overlayGfx.fill({ color: 0xf6e6b8, alpha: 0.22 });
          overlayGfx.stroke({ width: 2.3, color: dark ? 0xf2e5c7 : 0x1f1409, alpha: 0.96 });
        } else if (isOcc) {
          const occCol = p.ctl === "REB" ? 0x1e1e1e : hexToInt(G.c[p.ctl]?.col || "#9c2a22");
          overlayGfx.fill({ color: occCol, alpha: 0.22 });
          overlayGfx.stroke({ width: 1.4, color: occCol, alpha: 0.85 });
        }
      }
    }

    // Railway lines & industrial markers
    const drawnPairs = new Set();
    for (const p of G.plist) {
      if (!p.rail || p.rail <= 0) continue;
      for (const nid of runtime.ADJ?.[p.id] || []) {
        const key = p.id < nid ? p.id + "|" + nid : nid + "|" + p.id;
        if (drawnPairs.has(key)) continue;
        const q = runtime.P(nid);
        if (!q || !q.rail) continue;
        drawnPairs.add(key);
        railGfx.moveTo(p.x, p.y).lineTo(q.x, q.y);
      }
    }
    railGfx.stroke({ width: 1.5, color: dark ? 0x92b4d8 : 0x24476b, alpha: 0.65 });

    // Little building/factory indicators on provinces with industry/forts
    for (const p of G.plist) {
      if (!p.o || p.waste) continue;
      const facLv = (p.factories || []).reduce((s, f) => s + (f.lv || 0), 0);
      if (facLv > 0) {
        railGfx.rect(p.x - 3.5, p.y + 4, 7, 4.5).fill({ color: 0x5a3d1e, alpha: 0.78 });
      }
      if ((p.fort || 0) > 0) {
        railGfx.poly([p.x + 5, p.y + 5, p.x + 8, p.y + 2, p.x + 11, p.y + 5, p.x + 11, p.y + 9, p.x + 5, p.y + 9], true)
          .fill({ color: 0x6a5535, alpha: 0.78 });
      }
    }
  }

  function renderDynamicOverlayAndStage() {
    const G = runtime.G;
    const UI = runtime.UI;
    const WORLD = runtime.WORLD;
    if (!G || !UI || !UI.view || !WORLD || !hostEl) return;

    const { w: cw } = resizeToHost();
    const v = UI.view;
    const sc = cw / Math.max(1, v.w);

    if (usePixi && app && worldRoot) {
      worldRoot.position.set(-v.x * sc, -v.y * sc);
      worldRoot.scale.set(sc, sc);
      drawDynamicMovesAndUnits(sc);
      updatePixiLabels(sc);
      app.render();
    } else {
      drawCanvas2DFallback(sc);
    }
  }

  function drawDynamicMovesAndUnits(sc) {
    if (!moveGfx || !unitLayer) return;
    const G = runtime.G;
    const UI = runtime.UI;
    const seen = typeof runtime.seenSet === "function" ? runtime.seenSet() : new Set();
    const meTag = G.player;

    moveGfx.clear();
    while (unitLayer.children.length) {
      const ch = unitLayer.removeChildAt(0);
      ch.destroy({ children: true });
    }
    hitMarkers = [];

    const invSc = 1 / Math.max(0.25, sc);
    const pulse = 0.5 + 0.5 * Math.sin(animPhase);

    // Marching army & navy arrows
    for (const a of G.armies || []) {
      if (!a.u.length || !a.path?.length) continue;
      if (!(a.o === meTag || (G.c[a.o] && runtime.friendly?.(meTag, a.o)) || seen.has(a.loc))) continue;
      const pts = [a.loc].concat(a.path.slice(0, 6)).map(id => runtime.P(id)).filter(Boolean);
      if (pts.length < 2) continue;

      const colInt = a.reb ? 0x222222 : hexToInt(G.c[a.o]?.col || "#9c2a22");
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const ang = Math.atan2(last.y - prev.y, last.x - prev.x);

      // Dashed / glowing march path
      for (let i = 0; i < pts.length - 1; i++) {
        const A = pts[i], B = pts[i + 1];
        const segLen = Math.hypot(B.x - A.x, B.y - A.y) || 1;
        const steps = Math.max(2, Math.floor(segLen / (8 * invSc)));
        for (let k = 0; k < steps; k += 2) {
          const t0 = Math.min(1, (k + (animPhase * 0.25) % 2) / steps);
          const t1 = Math.min(1, t0 + 0.55 / steps);
          if (t1 <= t0) continue;
          moveGfx.moveTo(A.x + (B.x - A.x) * t0, A.y + (B.y - A.y) * t0)
            .lineTo(A.x + (B.x - A.x) * t1, A.y + (B.y - A.y) * t1);
        }
      }
      moveGfx.stroke({ width: 2.6 * invSc, color: colInt, alpha: 0.92 });

      // Arrowhead
      const headSize = 7 * invSc;
      moveGfx.poly([
        last.x, last.y,
        last.x - Math.cos(ang - 0.5) * headSize, last.y - Math.sin(ang - 0.5) * headSize,
        last.x - Math.cos(ang + 0.5) * headSize, last.y - Math.sin(ang + 0.5) * headSize
      ], true).fill({ color: colInt, alpha: 0.95 });
    }

    // Active & recent battles with pulsing aura
    const btList = (G.bt || []).map(r => ({ p: r.p, active: true, m: r.m }));
    for (const b of btList) {
      const p = runtime.P(b.p);
      if (!p) continue;
      const rPx = (9 + pulse * 4) * invSc;
      moveGfx.circle(p.x, p.y - 16 * invSc, rPx).fill({ color: 0xc0413a, alpha: 0.28 + pulse * 0.2 });
      moveGfx.circle(p.x, p.y - 16 * invSc, 6.5 * invSc)
        .fill({ color: 0x9c2a22, alpha: 0.98 })
        .stroke({ width: 1.5 * invSc, color: 0xfff6e2, alpha: 0.95 });
    }

    // Theatre / army tokens & naval fleet tokens (screen-scaled cleanly so they don't bloat or stack)
    const tokenPlacements = [];
    const seenLocs = new Map();

    // Group visible armies by province/sea zone & owner for crisp non-cluttered markers
    for (const a of G.armies || []) {
      if (!a.u.length) continue;
      if (!(a.o === meTag || (G.c[a.o] && runtime.friendly?.(meTag, a.o)) || seen.has(a.loc))) continue;
      const p = runtime.P(a.loc);
      if (!p) continue;
      const key = `${a.loc}|${a.o}|${a.naval ? "N" : "L"}`;
      let entry = seenLocs.get(key);
      if (!entry) {
        entry = {
          p,
          o: a.o,
          reb: !!a.reb,
          naval: !!a.naval,
          count: 0,
          moving: !!a.path?.length,
          th: a.th || null,
          ns: a.naval ? (a.sr || runtime.SEAR_OF?.[a.loc] || null) : null
        };
        seenLocs.set(key, entry);
      }
      entry.count += a.u.length;
    }

    const byProvCount = {};
    for (const entry of seenLocs.values()) {
      const idx = (byProvCount[entry.p.id] = (byProvCount[entry.p.id] || 0) + 1) - 1;
      const angle = idx * 2.1;
      const offsetR = idx === 0 ? 0 : 18 * invSc;
      const bob = entry.naval ? Math.sin(animPhase + entry.p.x) * 1.4 * invSc : (entry.moving ? Math.sin(animPhase * 2) * 1.3 * invSc : 0);
      const wx = entry.p.x + Math.cos(angle) * offsetR;
      const wy = entry.p.y + Math.sin(angle) * offsetR + (entry.naval ? 14 * invSc : -12 * invSc) + bob;

      const badge = new Container();
      badge.position.set(wx, wy);
      badge.scale.set(invSc, invSc);

      const g = new Graphics();
      const fillCol = entry.reb ? 0x222222 : hexToInt(G.c[entry.o]?.col || "#7e1928");
      const strokeCol = entry.o === meTag ? 0xf6e6b8 : 0x1d150a;

      if (entry.naval) {
        // Stylized steam warship hull silhouette
        g.poly([-14, 2, 14, 2, 10, 8, -10, 8], true)
          .fill({ color: fillCol, alpha: 0.96 })
          .stroke({ width: 1.5, color: strokeCol, alpha: 0.95 });
        g.rect(-5, -5, 10, 7).fill({ color: 0xf8f0dc, alpha: 0.95 });
      } else {
        // Military corps counter shield
        g.roundRect(-13, -9, 26, 18, 4)
          .fill({ color: fillCol, alpha: 0.96 })
          .stroke({ width: 1.6, color: strokeCol, alpha: 0.96 });
      }
      badge.addChild(g);

      const labelTxt = new Text({
        text: String(entry.count),
        style: new TextStyle({
          fontFamily: "system-ui, sans-serif",
          fontSize: 10.5,
          fontWeight: "700",
          fill: entry.naval ? 0x141b26 : 0xffffff
        })
      });
      labelTxt.anchor.set(0.5);
      labelTxt.position.set(0, entry.naval ? -1.5 : 0);
      badge.addChild(labelTxt);
      unitLayer.addChild(badge);

      const sx = (wx - UI.view.x) * sc;
      const sy = (wy - UI.view.y) * sc;
      const rHit = 15;
      hitMarkers.push({
        x: sx,
        y: sy,
        r: rHit,
        o: entry.o,
        pId: entry.p.id,
        naval: entry.naval,
        th: entry.th,
        ns: entry.ns
      });
      tokenPlacements.push([sx - 18, sy - 14, sx + 18, sy + 14]);
    }
    UI._mkbPixi = tokenPlacements;
  }

  function updatePixiLabels(sc) {
    if (!labelLayer || !runtime.G || !runtime.UI) return;
    const UI = runtime.UI;
    const G = runtime.G;
    const nat = UI.view.w >= 580;
    const band = Math.round(Math.log(Math.max(0.1, sc)) / Math.log(1.18));
    const key = `${nat ? "N" : "P"}|${G.t}|${band}|${G.player || ""}`;

    const invSc = 1 / Math.max(0.25, sc);

    if (labelCacheKey !== key) {
      labelCacheKey = key;
      while (labelLayer.children.length) {
        const ch = labelLayer.removeChildAt(0);
        ch.destroy();
      }
      cachedLabelNodes = [];

      const items = nat
        ? (typeof runtime.labelLayout === "function" ? runtime.labelLayout().map(o => ({ ...o })) : [])
        : (typeof runtime.provLabelItems === "function" ? runtime.provLabelItems() : []);
      items.sort((a, b) => b.pri - a.pri);

      const placed = (UI._mkbPixi || []).slice();
      const dark = document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme && matchMedia?.("(prefers-color-scheme: dark)")?.matches);

      for (const it of items) {
        const px = Math.max(10, Math.min(15.5, sc * it.k));
        const text = (it.nm || "").length > 18 && !nat ? (it.ab || it.nm) : it.nm;
        const estW = text.length * px * 0.56 + 10;
        const estH = px * 1.35 + 6;
        const cx = (it.x - UI.view.x) * sc;
        const cy = (it.y - UI.view.y) * sc;

        // Avoid unit badges and already-placed labels cleanly
        const x0 = cx - estW / 2, x1 = cx + estW / 2, y0 = cy - estH / 2, y1 = cy + estH / 2;
        if (placed.some(q => x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1])) continue;
        placed.push([x0, y0, x1, y1]);

        const txt = new Text({
          text,
          style: new TextStyle({
            fontFamily: nat ? "Georgia, serif" : "system-ui, -apple-system, sans-serif",
            fontSize: px,
            fontWeight: nat ? "700" : "600",
            fill: dark ? 0xf6eedc : 0x1d150a,
            stroke: { color: dark ? 0x141b26 : 0xfbf5e6, width: 3.5, join: "round" },
            letterSpacing: nat ? 1.1 : 0.2
          })
        });
        txt.anchor.set(0.5);
        txt.position.set(it.x, it.y);
        txt.scale.set(invSc, invSc);
        labelLayer.addChild(txt);
        cachedLabelNodes.push(txt);
        if (cachedLabelNodes.length >= (nat ? 42 : 55)) break;
      }
    } else {
      for (const txt of cachedLabelNodes) {
        txt.scale.set(invSc, invSc);
      }
    }
  }

  function drawCanvas2DFallback(sc) {
    if (!canvasEl || !runtime.G || !runtime.WORLD || !runtime.UI) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    const G = runtime.G;
    const UI = runtime.UI;
    const WORLD = runtime.WORLD;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const v = UI.view;
    const dark = document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme && matchMedia?.("(prefers-color-scheme: dark)")?.matches);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasEl.width / dpr, canvasEl.height / dpr);

    const invSc = 1 / Math.max(0.25, sc);
    const pulse = 0.5 + 0.5 * Math.sin(animPhase);
    const bmOn = typeof runtime.bmOn === "function" && runtime.bmOn();
    const bmSel = new Set(UI?.bm?.sel || []);
    const seen = typeof runtime.seenSet === "function" ? runtime.seenSet() : new Set();
    const meTag = G.player;

    ctx.save();
    ctx.scale(sc, sc);
    ctx.translate(-v.x, -v.y);

    // 1. Ocean cartographic graticule
    ctx.strokeStyle = dark ? "rgba(59, 77, 82, 0.3)" : "rgba(95, 118, 112, 0.25)";
    ctx.lineWidth = 0.7 * invSc;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.w; x += 180) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.h);
    }
    for (let y = 0; y <= WORLD.h; y += 140) {
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.w, y);
    }
    ctx.stroke();

    // 2. Province fills, borders, selection, occupation, build-mode
    for (const w of WORLD.provs) {
      const p = runtime.P(w.id);
      if (!p) continue;
      const rings = runtime.provPts ? runtime.provPts(w) : [];
      if (!rings.length) continue;
      ctx.beginPath();
      for (const pts of rings) {
        if (!pts.length) continue;
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
      }
      ctx.save();
      ctx.globalAlpha = bmOn && p.o !== meTag ? 0.42 : 1;
      ctx.fillStyle = parseColorCss(runtime.provColor(p));
      ctx.fill();
      ctx.restore();

      const isSel = UI.sel === p.id;
      const isBm = bmSel.has(p.id);
      const isOcc = !!p.ctl && p.ctl !== p.o;
      if (isOcc) {
        ctx.fillStyle = p.ctl === "REB" ? "rgba(30,30,30,0.22)" : (G.c[p.ctl]?.col || "#9c2a22") + "38";
        ctx.fill();
      }
      if (isBm) {
        ctx.fillStyle = "rgba(156, 42, 34, 0.32)";
        ctx.fill();
      } else if (isSel) {
        ctx.fillStyle = "rgba(246, 230, 184, 0.24)";
        ctx.fill();
      }

      ctx.strokeStyle = isBm || isSel ? (dark ? "#f2e5c7" : "#1f1409") : (dark ? "rgba(22,17,11,0.55)" : "rgba(54,40,22,0.48)");
      ctx.lineWidth = (isBm || isSel ? 2.2 : 0.65) * invSc;
      ctx.stroke();
    }

    // 3. Railways & factory/fort indicators
    const drawnPairs = new Set();
    ctx.strokeStyle = dark ? "rgba(146, 180, 216, 0.72)" : "rgba(36, 71, 107, 0.68)";
    ctx.lineWidth = 1.5 * invSc;
    ctx.beginPath();
    for (const p of G.plist) {
      if (!p.rail || p.rail <= 0) continue;
      for (const nid of runtime.ADJ?.[p.id] || []) {
        const key = p.id < nid ? p.id + "|" + nid : nid + "|" + p.id;
        if (drawnPairs.has(key)) continue;
        const q = runtime.P(nid);
        if (!q || !q.rail) continue;
        drawnPairs.add(key);
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
      }
    }
    ctx.stroke();

    for (const p of G.plist) {
      if (!p.o || p.waste) continue;
      const facLv = (p.factories || []).reduce((s, f) => s + (f.lv || 0), 0);
      if (facLv > 0) {
        ctx.fillStyle = "rgba(90, 61, 30, 0.82)";
        ctx.fillRect(p.x - 3.5, p.y + 4, 7, 4.5);
      }
      if ((p.fort || 0) > 0) {
        ctx.fillStyle = "rgba(106, 85, 53, 0.82)";
        ctx.fillRect(p.x + 5, p.y + 4, 5, 5);
      }
    }

    // 4. Marching army & navy dashed arrows
    for (const a of G.armies || []) {
      if (!a.u.length || !a.path?.length) continue;
      if (!(a.o === meTag || (G.c[a.o] && runtime.friendly?.(meTag, a.o)) || seen.has(a.loc))) continue;
      const pts = [a.loc].concat(a.path.slice(0, 6)).map(id => runtime.P(id)).filter(Boolean);
      if (pts.length < 2) continue;
      const colCss = a.reb ? "#222222" : G.c[a.o]?.col || "#9c2a22";
      ctx.save();
      ctx.strokeStyle = colCss;
      ctx.lineWidth = 2.5 * invSc;
      ctx.setLineDash([6 * invSc, 4 * invSc]);
      ctx.lineDashOffset = -animPhase * 6 * invSc;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.restore();

      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
      const hs = 7 * invSc;
      ctx.fillStyle = colCss;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x - Math.cos(ang - 0.5) * hs, last.y - Math.sin(ang - 0.5) * hs);
      ctx.lineTo(last.x - Math.cos(ang + 0.5) * hs, last.y - Math.sin(ang + 0.5) * hs);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Active battles
    for (const b of G.bt || []) {
      const p = runtime.P(b.p);
      if (!p) continue;
      ctx.fillStyle = `rgba(192, 65, 58, ${(0.28 + pulse * 0.2).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 16 * invSc, (9 + pulse * 4) * invSc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#9c2a22";
      ctx.strokeStyle = "#fff6e2";
      ctx.lineWidth = 1.5 * invSc;
      ctx.beginPath();
      ctx.arc(p.x, p.y - 16 * invSc, 6.2 * invSc, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 6. Unit & fleet tokens (world-drawn, screen-constant size, hit-tested)
    hitMarkers = [];
    const tokenPlacements = [];
    const seenLocs = new Map();
    for (const a of G.armies || []) {
      if (!a.u.length) continue;
      if (!(a.o === meTag || (G.c[a.o] && runtime.friendly?.(meTag, a.o)) || seen.has(a.loc))) continue;
      const p = runtime.P(a.loc);
      if (!p) continue;
      const key = `${a.loc}|${a.o}|${a.naval ? "N" : "L"}`;
      let entry = seenLocs.get(key);
      if (!entry) {
        entry = {
          p,
          o: a.o,
          reb: !!a.reb,
          naval: !!a.naval,
          count: 0,
          moving: !!a.path?.length,
          th: a.th || null,
          ns: a.naval ? (a.sr || runtime.SEAR_OF?.[a.loc] || null) : null
        };
        seenLocs.set(key, entry);
      }
      entry.count += a.u.length;
    }

    const byProvCount = {};
    for (const entry of seenLocs.values()) {
      const idx = (byProvCount[entry.p.id] = (byProvCount[entry.p.id] || 0) + 1) - 1;
      const angle = idx * 2.1;
      const offsetR = idx === 0 ? 0 : 18 * invSc;
      const bob = entry.naval ? Math.sin(animPhase + entry.p.x) * 1.4 * invSc : (entry.moving ? Math.sin(animPhase * 2) * 1.3 * invSc : 0);
      const wx = entry.p.x + Math.cos(angle) * offsetR;
      const wy = entry.p.y + Math.sin(angle) * offsetR + (entry.naval ? 14 * invSc : -12 * invSc) + bob;

      const fillCss = entry.reb ? "#222222" : (G.c[entry.o]?.col || "#7e1928");
      const strokeCss = entry.o === meTag ? "#f6e6b8" : "#1d150a";

      ctx.save();
      ctx.translate(wx, wy);
      ctx.scale(invSc, invSc);
      if (entry.naval) {
        ctx.fillStyle = fillCss;
        ctx.strokeStyle = strokeCss;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-14, 2);
        ctx.lineTo(14, 2);
        ctx.lineTo(10, 8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f8f0dc";
        ctx.fillRect(-5, -5, 10, 7);
      } else {
        ctx.fillStyle = fillCss;
        ctx.strokeStyle = strokeCss;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(-13, -9, 26, 18, 4);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = entry.naval ? "#141b26" : "#ffffff";
      ctx.font = "700 10.5px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(entry.count), 0, entry.naval ? -1.5 : 0);
      ctx.restore();

      const sx = (wx - v.x) * sc;
      const sy = (wy - v.y) * sc;
      hitMarkers.push({
        x: sx,
        y: sy,
        r: 15,
        o: entry.o,
        pId: entry.p.id,
        naval: entry.naval,
        th: entry.th,
        ns: entry.ns
      });
      tokenPlacements.push([sx - 18, sy - 14, sx + 18, sy + 14]);
    }
    UI._mkbPixi = tokenPlacements;

    // 7. Zoom-tiered decluttered country & province labels
    const nat = v.w >= 580;
    const items = nat
      ? (typeof runtime.labelLayout === "function" ? runtime.labelLayout().map(o => ({ ...o })) : [])
      : (typeof runtime.provLabelItems === "function" ? runtime.provLabelItems() : []);
    items.sort((a, b) => b.pri - a.pri);
    const placed = tokenPlacements.slice();
    let count = 0;
    for (const it of items) {
      const px = Math.max(10, Math.min(15.5, sc * it.k));
      const text = (it.nm || "").length > 18 && !nat ? (it.ab || it.nm) : it.nm;
      const estW = text.length * px * 0.56 + 10;
      const estH = px * 1.35 + 6;
      const cx = (it.x - v.x) * sc;
      const cy = (it.y - v.y) * sc;
      const x0 = cx - estW / 2, x1 = cx + estW / 2, y0 = cy - estH / 2, y1 = cy + estH / 2;
      if (placed.some(q => x0 < q[2] && x1 > q[0] && y0 < q[3] && y1 > q[1])) continue;
      placed.push([x0, y0, x1, y1]);

      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.scale(invSc, invSc);
      ctx.font = `${nat ? "700" : "600"} ${px.toFixed(1)}px ${nat ? "Georgia, serif" : "system-ui, -apple-system, sans-serif"}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = dark ? "#141b26" : "#fbf5e6";
      ctx.fillStyle = dark ? "#f6eedc" : "#1d150a";
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();

      if (++count >= (nat ? 42 : 55)) break;
    }

    ctx.restore();
  }

  function pickAtScreen(cx, cy) {
    const r = hostEl?.getBoundingClientRect();
    const UI = runtime.UI;
    const WORLD = runtime.WORLD;
    if (!r || !UI?.view || !WORLD) return null;
    const lx = cx - r.left;
    const ly = cy - r.top;

    // First check unit/navy/theatre markers
    for (const m of hitMarkers) {
      if (Math.hypot(lx - m.x, ly - m.y) <= m.r) {
        if (m.th && runtime.ACT?.thsheet && m.o === runtime.G.player) {
          return { kind: "theatre", th: m.th, pId: m.pId };
        }
        if (m.naval && m.ns && runtime.navSheet && m.o === runtime.G.player) {
          return { kind: "navy", ns: m.ns, pId: m.pId };
        }
        return { kind: "province", pId: m.pId };
      }
    }

    const sc = r.width / Math.max(1, UI.view.w);
    const wx = UI.view.x + lx / sc;
    const wy = UI.view.y + ly / sc;

    // Exact polygon hit
    for (const w of WORLD.provs) {
      const b = typeof runtime.bbOf === "function" ? runtime.bbOf(w.id) : null;
      if (b && (wx < b[0] || wx > b[2] || wy < b[1] || wy > b[3])) continue;
      if (pointInProv(w, wx, wy, runtime.provPts)) {
        return { kind: "province", pId: w.id };
      }
    }

    // Nearest edge fallback within 20 screen px for tiny islands/cantons
    let bestId = null;
    let bestDist = 20 / sc;
    if (typeof runtime.edgeDist === "function") {
      for (const w of WORLD.provs) {
        const b = runtime.bbOf(w.id);
        if (wx < b[0] - bestDist || wx > b[2] + bestDist || wy < b[1] - bestDist || wy > b[3] + bestDist) continue;
        const d = runtime.edgeDist(w, wx, wy);
        if (d < bestDist) {
          bestDist = d;
          bestId = w.id;
        }
      }
    }
    return bestId ? { kind: "province", pId: bestId } : null;
  }

  return {
    mount(host, bindings) {
      runtime = bindings;
      ensureCanvas(host);
      if (!mounting) {
        mounting = initRenderer(host).then(ready => {
          if (!ready || !hostEl || canvasEl.parentElement !== hostEl) return false;
          buildProvinceGeometry();
          renderDynamicOverlayAndStage();
          return true;
        }).finally(() => { mounting = null; });
      }
      return mounting;
    },
    unmount() {
      hostEl?.classList.remove("has-pixi");
      canvasEl?.remove();
      hostEl = null;
    },
    redrawGeometry() {
      labelCacheKey = "";
      if (!hostEl) return;
      if (!usePixi && !initializing) {
        initRenderer(hostEl).then(() => {
          buildProvinceGeometry();
          renderDynamicOverlayAndStage();
        });
        return;
      }
      buildProvinceGeometry();
      renderDynamicOverlayAndStage();
    },
    syncView() {
      if (pendingDraw || !hostEl) return;
      pendingDraw = true;
      requestAnimationFrame(() => {
        pendingDraw = false;
        renderDynamicOverlayAndStage();
      });
    },
    invalidateLabels() {
      labelCacheKey = "";
    },
    pickAtScreen,
    isActive: () => !!hostEl?.classList.contains("has-pixi") && !!canvasEl?.isConnected
  };
}
