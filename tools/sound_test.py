"""A26 acceptance test for era sound cues (src/ui_audio.js).

    python3 tools/sound_test.py

Checks, on testdata/seed7_1866.txt loaded with loadText:
  sound_off_default     sound is off and no AudioContext is created before enabling
  enable_creates_ctx    choosing Low in Settings creates one AudioContext
  tick_on_month         advancing one month plays the "tick" cue
  mute_silences         choosing Off plays nothing and creates no further context
  no_page_errors        no uncaught page errors during the run
Run tools/layout_check.py separately for the Settings sheet fit (74 of 74).
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "dist/long-century.html").as_uri()
FIX1866 = (ROOT / "testdata/seed7_1866.txt").read_text().strip()

# Count AudioContext constructions and wrap SND.play so the cues played can be read back.
INIT = """
window.__acCount = 0;
const _AC = window.AudioContext || window.webkitAudioContext;
if (_AC) { const Wrapped = function (...a) { window.__acCount++; return new _AC(...a); };
  Wrapped.prototype = _AC.prototype; window.AudioContext = Wrapped; window.webkitAudioContext = Wrapped; }
"""
SPY = """() => { window.__plays = []; const f = SND.tone.bind(SND);
  SND.tone = (...a) => { window.__plays.push(a[0]); return f(...a); }; }"""

RESULTS = []


def check(name, cond, detail=""):
    RESULTS.append((name, bool(cond)))
    print(("PASS  " if cond else "FAIL  ") + name + (("  [" + str(detail) + "]") if detail != "" else ""))
    return bool(cond)


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, has_touch=True)
        ctx.add_init_script(INIT)
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(GAME)
        pg.locator("#start h1").wait_for()
        pg.evaluate("() => { localStorage.clear(); }")
        pg.reload(); pg.locator("#start h1").wait_for()
        assert pg.evaluate("(t) => loadText(t, 'Loaded')", FIX1866)
        pg.evaluate("OPTS('sum', 0)"); pg.wait_for_timeout(300)
        pg.evaluate(SPY)

        off = pg.evaluate("() => OPT('sound', 0) === 0 && window.__acCount === 0")
        check("sound_off_default", off, pg.evaluate("() => [OPT('sound', 0), window.__acCount]"))

        pg.evaluate("openSettings()"); pg.wait_for_timeout(200)
        pg.locator('[data-a="sndset"][data-v="0.35"]').first.click()
        pg.wait_for_timeout(300)
        created = pg.evaluate("() => window.__acCount")
        check("enable_creates_ctx", created >= 1 and pg.evaluate("() => OPT('sound', 0)") == 0.35, created)

        pg.evaluate("() => { window.__plays = []; }")
        pg.evaluate("() => { if (G.card) cardDefault(); endMonth(); }")
        pg.wait_for_timeout(200)
        plays = pg.evaluate("() => window.__plays")
        check("tick_on_month", len(plays) > 0, len(plays))

        pg.evaluate("openSettings()"); pg.wait_for_timeout(200)
        before = pg.evaluate("() => window.__acCount")
        pg.locator('[data-a="sndset"][data-v="0"]').first.click(); pg.wait_for_timeout(200)
        pg.evaluate("() => { window.__plays = []; }")
        pg.evaluate("() => { if (G.card) cardDefault(); endMonth(); }"); pg.wait_for_timeout(200)
        silent = pg.evaluate("() => window.__plays.length === 0") and pg.evaluate("() => window.__acCount") == before
        check("mute_silences", silent, pg.evaluate("() => window.__plays"))

        check("no_page_errors", not errs, errs[:3])
        b.close()
    failed = [n for n, ok in RESULTS if not ok]
    print(f"{len(RESULTS) - len(failed)} of {len(RESULTS)} checks passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
