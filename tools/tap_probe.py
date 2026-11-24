"""V1.2 tap harness: scripted taps on every small province (WORLD.provs with a < 1936) at given view widths.

    python3 tools/tap_probe.py [--widths 150,380] [--fixtures 1840,1934] [--width 390] [--height 800]

For each fixture and width the view is centred on the province, a real pointer tap (mouse click through
the Playwright page) lands on the province centre and the result is classified: 'direct' (the sheet shows that
province), 'chooser' (a chooser button lists it), or FAIL.
"""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "dist/long-century.html").as_uri()
FIX = {"1840": "testdata/seed7_1840.txt", "1866": "testdata/seed7_1866.txt", "1934": "testdata/seed7_1934.txt"}

CENTER = """([id, w]) => { UI.tab='map'; closeSheet(); closeChooser(); render(); const p = P(id); UI.view.w = w; applyView();
  UI.view.x = p.x - UI.view.w/2; UI.view.y = p.y - UI.view.h/2; applyView(); UI._sc = 0; applyView();
  const r = mapRect(), s = r.width / UI.view.w; return [r.left + (p.x - UI.view.x) * s, r.top + (p.y - UI.view.y) * s]; }"""
STATE = """(id) => { const c = document.querySelector('#pickc');
  const ch = c ? [...c.querySelectorAll('[data-a=pickprov]')].map(b => b.dataset.p) : null;
  return {sel: UI.sel, open: document.querySelector('#sheet').classList.contains('open'), chooser: ch, th: UI.thsheet || UI.nsheet || null}; }"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--widths", default="150,380"); ap.add_argument("--fixtures", default="1840,1934")
    ap.add_argument("--width", type=int, default=390); ap.add_argument("--height", type=int, default=800)
    a = ap.parse_args(); bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for fx in a.fixtures.split(","):
            pg = b.new_page(viewport={"width": a.width, "height": a.height}, has_touch=False)
            errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(GAME); pg.locator("#start h1").wait_for()
            assert pg.evaluate("(t) => loadText(t, 'Loaded')", (ROOT / FIX[fx]).read_text().strip())
            pg.evaluate("document.querySelectorAll('#modal [data-a=close]').forEach(e => e.click())")
            ids = pg.evaluate("WORLD.provs.filter(w => w.a < 1936).map(w => w.id)")
            for w in map(int, a.widths.split(",")):
                res = {"direct": 0, "chooser": 0, "fail": []}
                for id in ids:
                    x, y = pg.evaluate(CENTER, [id, w]); pg.mouse.click(x, y); pg.wait_for_timeout(15)
                    s = pg.evaluate(STATE, id)
                    if s["open"] and s["sel"] == id: res["direct"] += 1
                    elif s["chooser"] and id in s["chooser"]: res["chooser"] += 1
                    else: res["fail"].append((id, s))
                    pg.evaluate("closeSheet(); closeChooser()")
                bad += len(res["fail"])
                print(f"{fx} w{w}: {len(ids)} small provinces, direct {res['direct']}, chooser {res['chooser']}, FAIL {len(res['fail'])}", [f[0] for f in res["fail"]])
                for f in res["fail"][:4]: print("   ", f)
            print("  page errors:", errs[:2]); pg.close()
        b.close()
    raise SystemExit(1 if bad else 0)

if __name__ == "__main__": main()
