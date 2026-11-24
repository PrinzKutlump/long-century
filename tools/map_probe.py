"""Baseline probe for the Atlas (map) screen: pan smoothness under CPU throttling,
label overlap, tap-target sizes and how much of the screen the controls take.

    python3 tools/map_probe.py [--width 390] [--height 800] [--months 30] [--out probe.json]
    python3 tools/map_probe.py --fixture all --assert [--strict] --out validation/results/ui-baseline.json

--fixture PATH|all  load a saved game from testdata/ instead of playing a new GBR game ("all" = the three
                    seed-7 saves at 1840, 1866 and 1934). Adds boot time (1x and CPU 4x), Atlas map height,
                    share of the map covered by controls and the Art-detail level (null until V4 adds one).
--assert            check the budgets in docs/plans/Long_Century_UI_Art_Plan.md 4.4 and print PASS/FAIL per line with
                    baseline vs target. The exit code stays 0 unless --strict is also given.

Uses the system Chrome (/usr/bin/google-chrome) through Playwright. Headless Chrome
rasterises in software, so absolute numbers are indicative; compare before/after on
the same machine. The owner's phone is the final judge (see the V9 checklist).
"""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "dist/long-century.html").as_uri()

PAN = """async ([w, steps]) => {
  const v = UI.view; v.w = w; applyView();
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const times = []; let last = performance.now();
  for (let i = 0; i < steps; i++) { v.x += 3; applyView(); await frame(); const n = performance.now(); times.push(n - last); last = n; }
  times.sort((a, b) => a - b);
  return {median: +times[times.length >> 1].toFixed(1), p95: +times[Math.floor(times.length * .95)].toFixed(1), max: +times[times.length - 1].toFixed(1)};
}"""

MEASURE = """([w]) => {
  centerOn(P(me().cap), w, .5);
  const r = document.querySelector('#map').getBoundingClientRect();
  const labels = [...document.querySelectorAll('#lbls text, #plbl text')].filter(t => t.getBoundingClientRect().width > 0);
  const boxes = labels.map(t => t.getBoundingClientRect());
  let overlaps = 0;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) overlaps++;
  }
  const px = labels.map(t => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM ? t.getScreenCTM().a : 1));
  const provs = [...document.querySelectorAll('.pv')].map(p => p.getBoundingClientRect())
    .filter(b => b.right > r.left && b.left < r.right && b.bottom > r.top && b.top < r.bottom);
  const marks = [...document.querySelectorAll('#units [data-th], #units [data-ns], #units g, #ths g:not(.thg)')].map(e => e.getBoundingClientRect()).filter(b => b.width > 0);
  return {labelNodes: labels.length, overlapPairs: overlaps, labelPx: px.length ? [+Math.min(...px).toFixed(1), +Math.max(...px).toFixed(1)] : null,
          provincesInView: provs.length, provincesUnder44px: provs.filter(b => Math.min(b.width, b.height) < 44).length,
          markers: marks.length, markersUnder44px: marks.filter(b => b.height < 44 || b.width < 44).length,
          mapHeight: Math.round(r.height), svgNodes: document.querySelectorAll('#svg *').length};
}"""

COVER = """() => {
  const m = document.querySelector('#map').getBoundingClientRect();
  const sel = ['#lens .lensb', '#mapbtns', '#legend', '#app.hx #stats'];  // V1.3: lens button, right column, legend key, and the unfolded figures (only when open)
  const rs = [];
  for (const q of sel) for (const e of document.querySelectorAll(q)) {
    const b = e.getBoundingClientRect(); if (!b.width || !b.height) continue;
    const l = Math.max(b.left, m.left), t = Math.max(b.top, m.top), r = Math.min(b.right, m.right), bt = Math.min(b.bottom, m.bottom);
    if (r > l && bt > t) rs.push([l, t, r, bt]);
  }
  // exact union area by coordinate compression
  const xs = [...new Set(rs.flatMap(r => [r[0], r[2]]))].sort((a, b) => a - b); let area = 0;
  for (let i = 0; i + 1 < xs.length; i++) {
    const act = rs.filter(r => r[0] <= xs[i] && r[2] >= xs[i + 1]).map(r => [r[1], r[3]]).sort((a, b) => a[0] - b[0]);
    let end = -1e9, len = 0;
    for (const [a, b] of act) { if (b > end) { len += b - Math.max(a, end); end = b; } }
    area += len * (xs[i + 1] - xs[i]);
  }
  const found = sel.map(q => document.querySelectorAll(q).length);
  return {coverPct: +(100 * area / (m.width * m.height)).toFixed(1), found,
          artDetail: (typeof OPT === 'function' && OPT('art', null) != null) ? OPT('art', null) : null};
}"""

FIXTURES = {"1840": "testdata/seed7_1840.txt", "1866": "testdata/seed7_1866.txt", "1934": "testdata/seed7_1934.txt"}

def boot_ms(browser, cpu, width, height):
    pg = browser.new_page(viewport={"width": width, "height": height})
    if cpu > 1: pg.context.new_cdp_session(pg).send("Emulation.setCPUThrottlingRate", {"rate": cpu})
    t0 = __import__("time").perf_counter(); pg.goto(GAME); pg.locator("#start h1").wait_for()
    ms = (__import__("time").perf_counter() - t0) * 1000; pg.close(); return round(ms)

def settle(pg):
    pg.evaluate("document.querySelectorAll('#modal [data-a=close]').forEach(e => e.click())"); pg.wait_for_timeout(300)
    if pg.locator('[data-a="cardhide"]').count(): pg.locator('[data-a="cardhide"]').first.click()
    pg.locator('[data-a="tab"][data-t="map"]').first.click(); pg.wait_for_timeout(500)

def run_one(b, a, loader):
    pg = b.new_page(viewport={"width": a.width, "height": a.height}, has_touch=True, color_scheme="light")
    errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(GAME); pg.locator("#start h1").wait_for(); loader(pg); settle(pg)
    r = {"measure": {}, "pan": {}}
    for w in (150, 260, 380, 900): r["measure"][f"w{w}"] = pg.evaluate(MEASURE, [w])
    pg.evaluate("([w]) => centerOn(P(me().cap), w, .5)", [380]); pg.wait_for_timeout(200)
    r["atlas"] = pg.evaluate(COVER)
    cdp = pg.context.new_cdp_session(pg)
    for rate in (1, 4):
        cdp.send("Emulation.setCPUThrottlingRate", {"rate": rate})
        for w in (150, 380, 1200): r["pan"][f"cpu{rate}x/w{w}"] = pg.evaluate(PAN, [w, 90])
    r["pageErrors"] = errors; pg.close(); return r

def budgets(out):
    """Section 4.4 rows: (name, baseline value, target text, passed)."""
    runs = [v for k, v in out.items() if k.startswith("run:")] or [out]
    pan4 = [v for r in runs for k, v in r["pan"].items() if k.startswith("cpu4x")]
    nodes = max(m["svgNodes"] for r in runs for m in r["measure"].values())
    mh = min(r["atlas"]["mapHeight"] if "mapHeight" in r["atlas"] else r["measure"]["w380"]["mapHeight"] for r in runs)
    cover = max(r["atlas"]["coverPct"] for r in runs)
    size = (ROOT / "dist/long-century.html").stat().st_size
    med, p95 = max(x["median"] for x in pan4), max(x["p95"] for x in pan4)
    return [("dist HTML size", f"{size/1048576:.2f} MB", "<= 1.8 MB", size <= 1.8 * 1048576),
            ("boot to title, CPU 4x", f"{out['bootMs']['cpu4x']} ms", "<= 2000 ms", out["bootMs"]["cpu4x"] <= 2000),
            ("map pan median, CPU 4x (worst width)", f"{med} ms", "<= 17 ms", med <= 17),
            ("map pan p95, CPU 4x (worst width)", f"{p95} ms", "<= 25 ms", p95 <= 25),
            ("live SVG nodes (worst zoom)", str(nodes), "<= 1500", nodes <= 1500),
            ("map height on Atlas", f"{mh} px", ">= 640 px", mh >= 640),
            ("map covered by controls", f"{cover}%", "<= 8%", cover <= 8)]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=390); ap.add_argument("--height", type=int, default=800)
    ap.add_argument("--months", type=int, default=30); ap.add_argument("--out")
    ap.add_argument("--fixture"); ap.add_argument("--assert", dest="check", action="store_true"); ap.add_argument("--strict", action="store_true")
    a = ap.parse_args()
    out = {"viewport": [a.width, a.height], "months": a.months, "pan": {}, "measure": {}}
    if a.fixture:
        names = list(FIXTURES) if a.fixture == "all" else [a.fixture]
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
            out = {"viewport": [a.width, a.height], "bootMs": {"cpu1x": boot_ms(b, 1, a.width, a.height), "cpu4x": boot_ms(b, 4, a.width, a.height)}}
            for n in names:
                path = ROOT / FIXTURES.get(n, n); text = path.read_text().strip()
                def load(pg, text=text):
                    assert pg.evaluate("(t) => loadText(t, 'Loaded')", text), "fixture did not load"
                out["run:" + (n if n in FIXTURES else path.name)] = run_one(b, a, load)
            b.close()
        text = json.dumps(out, indent=1)
        if a.out: Path(a.out).parent.mkdir(parents=True, exist_ok=True); Path(a.out).write_text(text)
        print(text)
        if a.check:
            rows = budgets(out); print("\nBudget (plan 4.4)                       baseline        target       result")
            for n, v, t, ok in rows: print(f"{n:<40}{v:<16}{t:<13}{'PASS' if ok else 'FAIL (baseline above target)' if not a.strict else 'FAIL'}")
            if a.strict and not all(r[3] for r in rows): raise SystemExit(1)
        return
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg = b.new_page(viewport={"width": a.width, "height": a.height}, has_touch=True, color_scheme="light")
        errors = []; pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(GAME); pg.locator("#start h1").wait_for()
        pg.locator('[data-a="pick"][data-t="GBR"]').first.click(timeout=4000)
        for _ in range(a.months): pg.evaluate("if (G.card) cardDefault(); endMonth()")
        pg.evaluate("document.querySelectorAll('#modal [data-a=close]').forEach(e => e.click())"); pg.wait_for_timeout(300)
        if pg.locator('[data-a="cardhide"]').count(): pg.locator('[data-a="cardhide"]').first.click()
        pg.locator('[data-a="tab"][data-t="map"]').first.click(); pg.wait_for_timeout(500)
        for w in (150, 260, 380, 900): out["measure"][f"w{w}"] = pg.evaluate(MEASURE, [w])
        cdp = pg.context.new_cdp_session(pg)
        for rate in (1, 4):
            cdp.send("Emulation.setCPUThrottlingRate", {"rate": rate})
            for w in (150, 380, 1200): out["pan"][f"cpu{rate}x/w{w}"] = pg.evaluate(PAN, [w, 90])
        out["pageErrors"] = errors
        out["atlas"] = pg.evaluate(COVER); out["bootMs"] = {"cpu1x": boot_ms(b, 1, a.width, a.height), "cpu4x": boot_ms(b, 4, a.width, a.height)}
        b.close()
    text = json.dumps(out, indent=1)
    if a.out: Path(a.out).write_text(text)
    print(text)
    if a.check:
        rows = budgets(out); print("\nBudget (plan 4.4)                       baseline        target       result")
        for n, v, t, ok in rows: print(f"{n:<40}{v:<16}{t:<13}{'PASS' if ok else 'FAIL (baseline above target)' if not a.strict else 'FAIL'}")
        if a.strict and not all(r[3] for r in rows): raise SystemExit(1)

if __name__ == "__main__":
    main()
