"""Settings sheet scroll test (issue #38, ledger row A8).

    python3 tools/scroll_test.py

At 390x800 the Settings sheet is scrolled to its maximum, then the cheat button and one option
toggle are pressed. Each press re-renders the sheet through openModal; the sheet's scrollTop must
change by at most 24 px across that press. Needs dist/long-century.html (run build.py first).
Exit status 1 on any failure.
"""
import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "dist/long-century.html").as_uri()
FIX1866 = (ROOT / "testdata/seed7_1866.txt").read_text().strip()
SCROLL = "(v) => { const s = document.querySelector('#modal .msheet'); if (s) s.scrollTop = v; return s ? s.scrollTop : -1; }"
TOP = "() => { const s = document.querySelector('#modal .msheet'); return s ? s.scrollTop : -1; }"
MAX = "() => { const s = document.querySelector('#modal .msheet'); return s ? s.scrollHeight - s.clientHeight : -1; }"
LIMIT = 24


def main():
    fails = []
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = b.new_context(viewport={"width": 390, "height": 800}, device_scale_factor=1, has_touch=True)
        pg = ctx.new_page(); pg.errs = []
        pg.on("pageerror", lambda e: pg.errs.append(str(e)))
        pg.goto(GAME); pg.locator("#start h1").wait_for()
        assert pg.evaluate("(t) => loadText(t, 'Loaded')", FIX1866)
        pg.wait_for_timeout(300)
        pg.evaluate("() => openSettings()")
        pg.locator('#modal .msheet [data-a="cheat"]').wait_for()
        room = pg.evaluate(MAX)
        if room <= 0:
            fails.append(f"settings sheet does not scroll at 390x800 (room {room})")
        pg.evaluate(SCROLL, 10 ** 6)
        steps = [("cheat", '#modal [data-a="cheat"]'), ("option toggle", '#modal [data-a="opt"]')]
        for name, sel in steps:
            before = pg.evaluate(TOP)
            pg.locator(sel).first.click(); pg.wait_for_timeout(150)
            after = pg.evaluate(TOP)
            delta = abs(after - before)
            print(f"{name}: scrollTop {before} -> {after} (delta {delta}, limit {LIMIT}, max {room})")
            if delta > LIMIT:
                fails.append(f"{name} moved the sheet by {delta} px")
        if pg.errs:
            fails.append("page errors: " + "; ".join(pg.errs[:3]))
        b.close()
    for f in fails:
        print("FAIL  " + f)
    print("PASS" if not fails else f"{len(fails)} failure(s)")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
