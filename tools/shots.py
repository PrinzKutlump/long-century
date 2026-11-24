"""Screenshot set for visual review (V0.3).

    python3 tools/shots.py [--fixture testdata/seed7_1866.txt] [--out shots] [--only 360x740@125]

For every combination of phone size x text size x theme it saves one PNG per screen into
shots/<run>/ and writes one contact sheet (contact-<run>.png) with every shot labelled.
Sizes: 360x740 at 125% text and 390x844 at 100% text. Text size is localStorage 'vic.tz';
the theme is the data-theme attribute on <html>. Uses the system Chrome through Playwright.
"""
import argparse, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "dist/long-century.html").as_uri()
SIZES = [(360, 740, 1.25), (390, 844, 1.0)]
THEMES = ["light", "dark"]

CLEAN = """() => { document.querySelectorAll('#modal [data-a=close]').forEach(e => e.click()); if (typeof closeLens === 'function') closeLens(); if (typeof hdrX === 'function') hdrX(false);
  if (typeof closeSheet === 'function') closeSheet(); const t = document.querySelector('#toast'); if (t) t.remove(); }"""
TAB = "(t) => { UI.tab = t; UI.dipT = null; closeSheet(); render(); }"
ZOOM = "([w]) => { UI.tab = 'map'; closeSheet(); render(); centerOn(P(me().cap), w, .5); }"
PROV = "([k]) => { UI.tab = 'map'; render(); centerOn(P(me().cap), 380, .5); UI.shH = k; pickProv(me().cap); shSet(k); }"
LENS = "() => { UI.tab = 'map'; closeSheet(); render(); centerOn(P(me().cap), 380, .5); ACT.lens(); }"
HDRX = "() => { UI.tab = 'map'; closeSheet(); render(); centerOn(P(me().cap), 380, .5); hdrX(true); }"
CARD = """() => { UI.tab = 'map'; closeSheet(); render(); for (let i = 0; i < 300 && !G.card; i++) endMonth();
  drawCard(); return !!G.card; }"""

SCREENS = [
    ("map-w150", ZOOM, [150]), ("map-w380", ZOOM, [380]), ("map-w900", ZOOM, [900]),
    ("sheet-peek", PROV, ["peek"]), ("sheet-half", PROV, ["half"]), ("sheet-full", PROV, ["full"]),
    ("lens-menu", LENS, None), ("header-open", HDRX, None), ("cabinet", TAB, "over"), ("works", TAB, "works"),
    ("wars-military", TAB, "mil"), ("decision-card", CARD, None),
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fixture", default="testdata/seed7_1866.txt")
    ap.add_argument("--out", default="shots"); ap.add_argument("--only", help="e.g. 360x740@125")
    a = ap.parse_args()
    save = (ROOT / a.fixture).read_text().strip()
    # Switzerland gets its first decision card ~95 months after the 1840 save ("After the Sonderbund"), so that
    # screen starts from the 1840 fixture and plays forward until a card opens.
    card_save = (ROOT / "testdata/seed7_1840.txt").read_text().strip()
    run = time.strftime("%Y%m%d-%H%M%S"); out = ROOT / a.out / run; out.mkdir(parents=True, exist_ok=True)
    tiles = []; problems = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for (w, h, tz) in SIZES:
            tag = f"{w}x{h}@{round(tz * 100)}"
            if a.only and a.only != tag: continue
            for theme in THEMES:
                ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, has_touch=True,
                                    color_scheme=theme)
                pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(GAME); pg.locator("#start h1").wait_for()
                pg.evaluate("(tz) => { localStorage.clear(); localStorage.setItem('vic.tz', tz); }", str(tz))
                pg.reload(); pg.locator("#start h1").wait_for()
                pg.evaluate("(t) => { document.documentElement.dataset.theme = t; }", theme)
                if not pg.evaluate("(t) => loadText(t, 'Loaded')", save): problems.append(f"{tag} {theme}: save did not load"); continue
                pg.evaluate("OPTS('sum', 0)")
                for name, fn, args in SCREENS:
                    # a fresh load for every screen keeps them independent (the card screen advances time)
                    pg.evaluate("(t) => loadText(t, 'Loaded')", card_save if name == "decision-card" else save); pg.evaluate(CLEAN)
                    r = pg.evaluate(fn, args) if args is not None else pg.evaluate(fn)
                    pg.wait_for_timeout(350)
                    if name == "decision-card" and not r: problems.append(f"{tag} {theme}: no decision card appeared in 300 months")
                    f = out / f"{tag}_{theme}_{name}.png"; pg.screenshot(path=str(f)); tiles.append((f"{tag} {theme} {name}", f))
                if errs: problems.append(f"{tag} {theme}: page errors {errs[:2]}")
                ctx.close()
        b.close()
    # contact sheet: one row per size x theme, one column per screen
    if tiles:
        scale = .5; cols = len(SCREENS); label_h = 16
        ims = [(lab, Image.open(f)) for lab, f in tiles]
        tw = max(i.width for _, i in ims); th = max(i.height for _, i in ims)
        tw2, th2 = int(tw * scale), int(th * scale)
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (tw2 + 6) + 6, rows * (th2 + label_h + 6) + 6), (60, 60, 60)); d = ImageDraw.Draw(sheet)
        for n, (lab, im) in enumerate(ims):
            x = 6 + (n % cols) * (tw2 + 6); y = 6 + (n // cols) * (th2 + label_h + 6)
            d.text((x, y), lab, fill=(255, 255, 255))
            sheet.paste(im.resize((int(im.width * scale), int(im.height * scale))), (x, y + label_h))
        cs = ROOT / a.out / f"contact-{run}.png"; sheet.save(cs); print("contact sheet:", cs)
    print(f"{len(tiles)} screenshots in {out}")
    for pr in problems: print("PROBLEM:", pr)

if __name__ == "__main__":
    main()
