"""Stress UI sweep: play every nation for a year in Chrome and audit every page.

    python3 tools/stress/ui_sweep.py --shard 0 --of 8 [--size 360x740@125] [--months 12] [--out ui-0.json]

For each nation in the shard: start a new game as that nation from the title page (ACT.pick), open every page in
PAGES and the capital's province sheet, record page errors and layout violations (tools/layout_check.py AUDIT:
element wider than its container or the viewport, clipped text, controls under 44 px), then end the month
--months times (taking each decision card's default) and audit again. Test tooling only; no game code changes.
"""
import argparse, json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
import layout_check as lc  # noqa: E402  (reuses its AUDIT script)

GAME = (ROOT / "dist/long-century.html").as_uri()
SIZES = {"360x740@125": (360, 740, 1.25), "390x844@100": (390, 844, 1.0)}


def audit(pg, scope):
    res = pg.evaluate(lc.AUDIT, scope)
    if res.get("missing"):
        return {"missing": True, "count": 0, "kinds": {}, "examples": []}
    kinds, ex = {}, []
    for kind, d, info in res["v"]:
        kinds[kind] = kinds.get(kind, 0) + 1
        if len(ex) < 4:
            ex.append(f"{kind}: {d} [{info}]"[:220])
    over = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    return {"count": len(res["v"]), "kinds": kinds, "examples": ex, "pageScrollsSideways": over}


def sweep(pg, label, rec):
    pages = pg.evaluate("Object.keys(PAGES)")
    for k in pages:
        try:
            pg.evaluate("(k) => { UI.tab = k; render(); }", k)
            pg.wait_for_timeout(60)
            rec["screens"][f"{label}:{k}"] = audit(pg, "#page")
        except Exception as e:  # a page that throws while rendering
            rec["screens"][f"{label}:{k}"] = {"error": str(e)[:300], "count": 0, "kinds": {}}
    try:
        pg.evaluate("() => { UI.tab = 'map'; render(); const c = me().cap; centerOn(P(c), 380, .5); pickProv(c); shSet(2); }")
        pg.wait_for_timeout(120)
        rec["screens"][f"{label}:province_sheet"] = audit(pg, "#sheet")
        pg.evaluate("() => { if (typeof closeSheet === 'function') closeSheet(); }")
    except Exception as e:
        rec["screens"][f"{label}:province_sheet"] = {"error": str(e)[:300], "count": 0, "kinds": {}}


def play(pg, months, rec):
    for _ in range(months):
        t = pg.evaluate("G.t")
        try:
            pg.evaluate("""() => { if (G.card) { cardDefault(); }
                document.querySelectorAll('#modal, .modal').forEach(m => { if (m.id === 'modal') m.hidden = true; });
                endMonth(G.t); if (G.card) cardDefault(); }""")
        except Exception as e:
            rec["playErrors"].append(f"month {t}: {str(e)[:240]}")
            break
        pg.wait_for_timeout(30)
        if pg.evaluate("G.t") == t:
            rec["stuck"] = t
            pg.evaluate("() => { if (G.card) cardDefault(); monthTick(); render(); }")
    rec["monthReached"] = pg.evaluate("G.t")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shard", type=int, default=0); ap.add_argument("--of", type=int, default=1)
    ap.add_argument("--size", default="360x740@125"); ap.add_argument("--months", type=int, default=12)
    ap.add_argument("--only"); ap.add_argument("--out", default=None)
    a = ap.parse_args()
    w, h, tz = SIZES[a.size]
    out = {"size": a.size, "nations": {}}
    t0 = time.time()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, has_touch=True)
        pg = ctx.new_page()
        pg.goto(GAME); pg.locator("#start h1").wait_for()
        pg.evaluate("(tz) => { localStorage.clear(); localStorage.setItem('vic.tz', tz); }", str(tz))
        pg.reload(); pg.locator("#start h1").wait_for()
        tags = pg.evaluate("Object.keys(G.c).filter(t => G.c[t].alive).sort()")
        if a.only:
            tags = [t for t in tags if t in a.only.split(",")]
        tags = [t for i, t in enumerate(tags) if i % a.of == a.shard]
        for tag in tags:
            rec = {"pageErrors": [], "playErrors": [], "screens": {}, "stuck": None}
            pg.goto(GAME); pg.locator("#start h1").wait_for()
            errs = rec["pageErrors"]
            handler = lambda e: errs.append(str(e)[:300])
            pg.on("pageerror", handler)
            t1 = time.time()
            try:
                pg.evaluate("(t) => ACT.pick({t})", tag)
                pg.wait_for_timeout(200)
                sweep(pg, "m0", rec)
                play(pg, a.months, rec)
                sweep(pg, f"m{a.months}", rec)
            except Exception as e:
                rec["playErrors"].append("fatal: " + str(e)[:300])
            pg.remove_listener("pageerror", handler)
            rec["seconds"] = round(time.time() - t1, 1)
            out["nations"][tag] = rec
            bad = sum(s.get("count", 0) for s in rec["screens"].values())
            print(f"{tag}: page errors {len(errs)}, play errors {len(rec['playErrors'])}, layout violations {bad}, {rec['seconds']} s", flush=True)
        b.close()
    out["seconds"] = round(time.time() - t0)
    if a.out:
        Path(a.out).write_text(json.dumps(out))


if __name__ == "__main__":
    main()
