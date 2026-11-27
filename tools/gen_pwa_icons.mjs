import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const outDir = path.resolve("public");
fs.mkdirSync(outDir, { recursive: true });

// Crisp anti-aliased compass-rose and heraldic crown emblem PNG renderer
function renderEmblemPng(size, safeRatio = 0.84) {
  const png = new PNG({ width: size, height: size, colorType: 6 });
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const R = (size / 2) * safeRatio;

  const NAVY = [20, 27, 38, 255];      // #141B26
  const CRIMSON = [126, 25, 40, 255];  // #7E1928
  const GOLD = [212, 175, 92, 255];    // #D4AF5C
  const GOLD_DK = [148, 114, 48, 255]; // #947230
  const PAPER = [246, 238, 220, 255];  // #F6EEDC

  function blend(dst, src, a) {
    const t = Math.max(0, Math.min(1, a));
    return [
      Math.round(dst[0] * (1 - t) + src[0] * t),
      Math.round(dst[1] * (1 - t) + src[1] * t),
      Math.round(dst[2] * (1 - t) + src[2] * t),
      255
    ];
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = [...NAVY];
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);

      // Outer crimson ring seal
      if (r <= R * 0.94) {
        const edge = Math.max(0, Math.min(1, (R * 0.94 - r) * 1.4));
        col = blend(col, CRIMSON, edge);
      }
      // Outer brass border ring
      const ringDist = Math.abs(r - R * 0.92);
      if (ringDist < R * 0.035) {
        col = blend(col, GOLD, 1 - ringDist / (R * 0.035));
      }

      // 8-point compass star
      const normA = ((ang + Math.PI * 2) % (Math.PI / 2));
      const dAxis = Math.min(normA, Math.PI / 2 - normA);
      const diagA = ((ang + Math.PI / 4 + Math.PI * 2) % (Math.PI / 2));
      const dDiag = Math.min(diagA, Math.PI / 2 - diagA);

      // Minor diagonal rays
      const minorLen = R * 0.62;
      const minorHalf = Math.max(0.01, (1 - r / minorLen) * 0.28);
      if (r > R * 0.2 && r <= minorLen && dDiag < minorHalf) {
        const shade = diagA < Math.PI / 4 ? GOLD : GOLD_DK;
        col = blend(col, shade, Math.min(1, (minorHalf - dDiag) * 16));
      }

      // Major cardinal compass points
      const majorLen = R * 0.85;
      const majorHalf = Math.max(0.01, (1 - r / majorLen) * 0.28);
      if (r > R * 0.22 && r <= majorLen && dAxis < majorHalf) {
        const shade = normA < Math.PI / 4 ? GOLD : GOLD_DK;
        col = blend(col, shade, Math.min(1, (majorHalf - dAxis) * 18));
      }

      // Inner dark center medallion
      if (r <= R * 0.34) {
        const edge = Math.max(0, Math.min(1, (R * 0.34 - r) * 1.4));
        col = blend(col, NAVY, edge);
      }
      const inRing = Math.abs(r - R * 0.34);
      if (inRing < R * 0.028) {
        col = blend(col, GOLD, 1 - inRing / (R * 0.028));
      }

      // Minimalist crown / imperial fleur inside center medallion
      const nx = dx / (R * 0.34);
      const ny = dy / (R * 0.34);
      const inCrownBase = Math.abs(nx) < 0.56 && ny > 0.14 && ny < 0.38;
      const crownHeight = -0.35 + 0.45 * Math.pow(Math.abs(Math.sin(nx * Math.PI * 2.2)), 0.7);
      const inCrownBody = Math.abs(nx) < 0.58 && ny <= 0.16 && ny > crownHeight;
      if (inCrownBase || inCrownBody) {
        col = blend(col, PAPER, 0.95);
      }
      if (Math.hypot(nx, ny + 0.42) < 0.09 || Math.hypot(nx - 0.54, ny + 0.28) < 0.08 || Math.hypot(nx + 0.54, ny + 0.28) < 0.08) {
        col = blend(col, GOLD, 1);
      }

      const idx = (y * size + x) * 4;
      png.data[idx] = col[0];
      png.data[idx + 1] = col[1];
      png.data[idx + 2] = col[2];
      png.data[idx + 3] = col[3];
    }
  }
  return PNG.sync.write(png);
}

fs.writeFileSync(path.join(outDir, "pwa-192x192.png"), renderEmblemPng(192, 0.86));
fs.writeFileSync(path.join(outDir, "pwa-512x512.png"), renderEmblemPng(512, 0.86));
fs.writeFileSync(path.join(outDir, "pwa-maskable-512x512.png"), renderEmblemPng(512, 0.66));
fs.writeFileSync(path.join(outDir, "apple-touch-icon.png"), renderEmblemPng(180, 0.86));

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#141B26"/>
  <circle cx="256" cy="256" r="206" fill="#7E1928" stroke="#D4AF5C" stroke-width="12"/>
  <g fill="#D4AF5C" stroke="#141B26" stroke-width="4" stroke-linejoin="round">
    <polygon points="256,58 292,220 256,256"/>
    <polygon points="256,58 220,220 256,256" fill="#947230"/>
    <polygon points="454,256 292,292 256,256"/>
    <polygon points="454,256 292,220 256,256" fill="#947230"/>
    <polygon points="256,454 220,292 256,256"/>
    <polygon points="256,454 292,292 256,256" fill="#947230"/>
    <polygon points="58,256 220,220 256,256"/>
    <polygon points="58,256 220,292 256,256" fill="#947230"/>
  </g>
  <circle cx="256" cy="256" r="82" fill="#141B26" stroke="#D4AF5C" stroke-width="10"/>
  <path d="M206 286h100l10-56-34 24-26-44-26 44-34-24z" fill="#F6EEDC"/>
  <rect x="206" y="294" width="100" height="14" rx="4" fill="#D4AF5C"/>
</svg>`;
fs.writeFileSync(path.join(outDir, "icon.svg"), iconSvg);
console.log("Generated PWA icons in public/");
