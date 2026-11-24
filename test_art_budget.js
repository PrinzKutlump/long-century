"use strict";
// V0.4 art/UI budget checks (docs/archive/plans/Long_Century_UI_Art_Plan.md 4.4): size, no network URLs, one <style>, contrast.
// Hard failures print "FAIL ..." and exit 1. Known contrast misses print "WARN KNOWN ..." and do not fail.
const fs = require("node:fs");
const path = require("node:path");
const read = f => fs.readFileSync(path.join(__dirname, f), "utf8");
let failed = 0;
const ok = (c, msg) => { console.log((c ? "ok   " : "FAIL ") + msg); if (!c) failed++; };

// ---- 1. Size
const html = read("dist/long-century.html");
const bytes = Buffer.byteLength(html);
ok(bytes <= 1.8 * 1024 * 1024, `dist HTML ${(bytes / 1024).toFixed(0)} KB <= 1843 KB (1.8 MB)`);

// ---- 2. No network URLs.
// Exceptions (documented): (a) the zlib manual link in doc comments inside the vendored pako block
// (between the "const SAVE_COMPRESSION=" wrapper and its return), never fetched; (b) the SVG XML namespace
// inside percent-encoded data: URIs in CSS (an identifier, not a request). Anything else fails.
const vStart = html.indexOf("const SAVE_COMPRESSION=");
const vEnd = html.indexOf(";return window.pako;", vStart);
ok(vStart > 0 && vEnd > vStart, "vendor block (pako) located");
const vendor = html.slice(vStart, vEnd), rest = html.slice(0, vStart) + html.slice(vEnd);
const urlRe = /https?:\/\/[^\s)"'<>\]]*/g;
const badVendor = (vendor.match(urlRe) || []).filter(u => !/^http:\/\/zlib\.net\/manual\.html#Advanced$/.test(u));
ok(!badVendor.length, `vendor block: only the zlib.net manual comment link allowed${badVendor.length ? " (found " + badVendor[0] + ")" : ""}`);
ok(!(rest.match(urlRe) || []).length, `no http(s):// URL outside vendor block${(rest.match(urlRe) || [])[0] ? " (found " + rest.match(urlRe)[0] + ")" : ""}`);
const enc = (html.match(/https?%3A%2F%2F[A-Za-z0-9.%_-]*/gi) || []).filter(u => !/^http%3A%2F%2Fwww\.w3\.org%2F2000%2Fsvg$/i.test(u) && !/^http%3A%2F%2Fwww\.w3\.org%2F2000%2Fsvg%2F?$/i.test(u));
ok(!enc.length, `no encoded URL in data: URIs except the w3.org SVG namespace${enc[0] ? " (found " + enc[0] + ")" : ""}`);

// ---- 3. One <style> in the template (build.py emits the single element; wrap_test.py checks the wrapped page)
ok((html.match(/<style[\s>]/g) || []).length === 1, "exactly one <style> element in dist HTML");
ok((read("build.py").match(/<style>/g) || []).length === 1, "build.py template has exactly one <style>");

// ---- 4. Contrast (WCAG 2.x)
const css = read("src/ui.css");
const block = (re) => { const m = css.match(re); if (!m) throw new Error("block not found " + re); return m[1]; };
const vars = body => { const o = {}; for (const m of body.matchAll(/--([\w-]+):([^;]+?)(?=;|--[\w-]+:|$)/g)) o[m[1]] = m[2].trim(); return o; };
const light = vars(block(/^:root\{([\s\S]*?color-scheme:light;)/m));
const dark = { ...light, ...vars(block(/:root\[data-theme="dark"\]\{([\s\S]*?)color-scheme:dark\}/)) };
function parse(c) {
 c = c.trim();
 let m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
 if (m) { let h = m[1]; if (h.length === 3) h = [...h].map(x => x + x).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(1); }
 m = c.match(/^rgba?\(([^)]+)\)$/);
 if (m) { const p = m[1].split(",").map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
 throw new Error("cannot parse colour " + c);
}
const over = (fg, bg) => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
// The primary button: read its text colour and gradient stops from the rule itself.
const pri = css.match(/\.btn\.pri\{color:(#[0-9A-Fa-f]{6});[^}]*?linear-gradient\(180deg,(rgba\([^)]*\)),(rgba\([^)]*\))\)/);
ok(!!pri, "found .btn.pri rule in ui.css");
const checks = []; // [theme, label, ratio, needed]
for (const [theme, v] of [["light", light], ["dark", dark]]) {
 const panel = parse(v.panel);
 const T = (label, fg, bg, need = 4.5) => checks.push([theme, label, ratio(fg, bg), need]);
 T("--ink on --panel", parse(v.ink), panel);
 T("--muted on --panel", parse(v.muted), panel);
 T("--red on --panel", parse(v.red), panel);
 T("--gold on --panel", parse(v.gold), panel);
 for (const g of ["glass-a", "glass-b"]) T(`--glass-ink on ${g} over --panel`, parse(v["glass-ink"]), over(parse(v[g]), panel));
 for (const [i, stop] of [[1, pri[2]], [2, pri[3]]]) T(`primary button text on gradient stop ${i}`, parse(pri[1]), over(parse(stop), panel));
}
// Pairs that already failed AA when V0 was written would be listed here as "theme|label" and reported as
// warnings, not failures. On 22 Nov 2026 every pair above passes, so the list is empty. Any pair NOT listed
// that falls below its threshold is a hard failure.
const KNOWN = new Set([]);
for (const [theme, label, r, need] of checks) {
 const line = `${theme.padEnd(5)} ${label}: ${r.toFixed(2)}:1 (needs ${need})`;
 if (r >= need) console.log("ok   " + line);
 else if (KNOWN.has(theme + "|" + label)) console.log("WARN KNOWN " + line);
 else ok(false, line);
}
process.exitCode = failed ? 1 : 0;
