"""Exercise the browser build with its style and script inside a host body.

Without --late this runs the original wrapped portrait check. With --late it
also runs the release gate: desktop month timing against --budget, storage for
an autosave plus three slots using real late-game saves, Works orders tapped at
portrait widths, and late-game layout across the main pages.
"""
import argparse
import json
import re
import statistics
from pathlib import Path
from tempfile import TemporaryDirectory

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
GAME = ROOT / "dist/long-century.html"


def wrapped(source):
    style, = re.findall(r"<style>.*?</style>", source, re.S)
    body, = re.findall(r"<body>(.*?)</body>", source, re.S)
    return ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" '
            'content="width=device-width, initial-scale=1">'
            '<style>body { margin: 8px; background-color: white; font: 16px sans-serif; }</style>'
            '</head><body>' + style + body + '</body></html>')


def exercise(browser, url, width, scale, months, screenshots):
    page = browser.new_page(viewport={"width": width, "height": 800},
                            has_touch=True, color_scheme="light")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(url)

    def click(action, qualifiers=""):
        # V1.3: on the Atlas, Settings sits in the unfolded figures; open them first when it is not on screen
        if action == "settings" and not page.locator('[data-a="settings"]').first.is_visible():
            page.locator('[data-a="hdrx"]').first.click(timeout=3000)
        page.locator(f'[data-a="{action}"]{qualifiers}').first.click(timeout=3000)

    def check_layout():
        assert page.locator("style").count() == 2
        assert page.evaluate("getComputedStyle(document.body).margin") == "0px"
        assert page.evaluate('''() => {
          const style = getComputedStyle(document.body);
          const sample = document.createElement("div");
          sample.style.color = style.getPropertyValue("--bg").trim();
          document.body.appendChild(sample);
          const color = getComputedStyle(sample).color;
          sample.remove();
          return style.backgroundColor === color && style.backgroundImage !== "none";
        }'''), "Parchment background missing"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Page overflows horizontally"

    def screenshot(name):
        if screenshots:
            screenshots.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(screenshots / f"{name}-{width}-{scale}.png"))

    page.locator("#start h1").wait_for()
    if scale != 1:
        page.evaluate("(scale) => localStorage.setItem('vic.tz', scale)", scale)
        page.reload()
    check_layout()
    screenshot("title")
    click("pick", '[data-t="SWI"]')
    page.evaluate('OPTS("sum",0)')
    for _ in range(months):
        page.evaluate("() => { if (G.card) cardDefault(); endMonth(); }")
    assert page.evaluate("G.t") == months
    check_layout()
    screenshot("overview")
    click("settings")
    click("slotsave", '[data-s="1"]')
    page.wait_for_function("UI.lastAutosave === G.t")
    page.reload()
    click("cont")
    assert page.evaluate("G.t") == months
    page.evaluate("() => { if (G.card) cardDefault(); endMonth(); }")
    assert page.evaluate("G.t") == months + 1
    click("settings")
    click("slotload", '[data-s="1"]')
    assert page.evaluate("G.t") == months
    click("settings")
    click("theme", '[data-v="dark"]')
    assert page.locator("html").get_attribute("data-theme") == "dark"
    next_scale = 1.25 if scale == 1 else 1
    click("tz", f'[data-v="{next_scale}"]')
    assert page.evaluate("UI.tz") == next_scale
    check_layout()
    screenshot("settings")
    assert not errors, errors
    page.close()
    print(f"PASS {width}px / {scale:.0%} text / {months} months")


YIELD = "() => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); })"

# One month as the player sees it. "shown" runs from the End month tap to the
# laid-out frame with the new month; that is the budgeted figure. "saved" runs on
# until the compressed autosave, written after that frame, is in storage.
ADVANCE = """async (months) => {
  const tick = %s;
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));
  const rows = [];
  for (let i = 0; i < months; i++) {
    if (G.card) cardDefault();
    const month = G.t, start = performance.now();
    endMonth(month);
    const sync = performance.now() - start;
    await frame();
    document.body.offsetHeight;
    const shown = performance.now() - start;
    while (UI.lastAutosave !== G.t && !UI.autosaveFailed) await tick();
    const saved = performance.now() - start;
    rows.push({ month, sync, shown, saved });
    if (G.t !== month + 1) throw new Error("Month did not advance at " + month);
    if (UI.autosaveFailed) throw new Error("Autosave failed at " + month);
  }
  return rows;
}""" % YIELD


def open_game(browser, url, width, height=800, touch=False, scale=1):
    page = browser.new_page(viewport={"width": width, "height": height},
                            has_touch=touch, color_scheme="light")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(url)
    page.locator("#start h1").wait_for()
    page.evaluate("localStorage.clear()")
    if scale != 1:
        page.evaluate("(scale) => localStorage.setItem('vic.tz', scale)", scale)
        page.reload()
        page.locator("#start h1").wait_for()
    page.evaluate('OPTS("sum",0)')
    return page, errors


def load_save(page, text):
    ok = page.evaluate("(text) => loadText(text, 'Loaded')", text)
    assert ok, "The save could not be loaded"
    return page.evaluate("G.t")


def settle_autosave(page):
    page.evaluate("autosave()")
    page.wait_for_function("UI.lastAutosave === G.t || UI.autosaveFailed")
    assert not page.evaluate("UI.autosaveFailed"), "Autosave failed"


def summary(values):
    ordered = sorted(values)
    p95 = ordered[min(len(ordered) - 1, round(0.95 * (len(ordered) - 1)))]
    return {"mean": round(statistics.fmean(values), 1), "median": round(statistics.median(values), 1),
            "p95": round(p95, 1), "max": round(max(values), 1)}


def timing(browser, url, label, months, save=None):
    page, errors = open_game(browser, url, 1280)
    if save:
        start = load_save(page, save)
    else:
        page.locator('[data-a="pick"][data-t="SWI"]').first.click()
        start = page.evaluate("G.t")
    rows = page.evaluate(ADVANCE, months)
    assert not errors, errors
    page.close()
    result = {"label": label, "from": start, "months": months,
              "shown": summary([row["shown"] for row in rows]),
              "handler": summary([row["sync"] for row in rows]),
              "saved": summary([row["saved"] for row in rows])}
    print("TIMING", json.dumps(result))
    return result


def storage(browser, url, save):
    """Autosave plus three slots of the largest save, then a further autosave."""
    page, errors = open_game(browser, url, 390, touch=True)
    month = load_save(page, save)
    settle_autosave(page)
    if not page.locator('[data-a="settings"]').first.is_visible():
        page.locator('[data-a="hdrx"]').first.tap()
    page.locator('[data-a="settings"]').first.tap()
    for slot in (1, 2, 3):
        page.locator(f'[data-a="slotsave"][data-s="{slot}"]').first.tap()
        assert page.evaluate("(slot) => localStorage.getItem('vic.s' + slot) !== null", slot), f"Slot {slot} was not saved"
    page.evaluate("closeModal()")
    page.evaluate("() => { if (G.card) cardDefault(); }")
    page.evaluate(ADVANCE, 1)
    used = page.evaluate("""() => { let n = 0; for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i); n += k.length + localStorage.getItem(k).length; } return n; }""")
    keys = page.evaluate("Object.keys(localStorage).sort()")
    # Measure the remaining room in characters, then remove the probe.
    headroom = page.evaluate("""() => { const chunk = "x".repeat(64 * 1024); let n = 0, i = 0;
        try { for (;; i++) { localStorage.setItem("probe" + i, chunk); n += chunk.length + ("probe" + i).length; } }
        catch (e) {}
        for (let j = 0; j <= i; j++) localStorage.removeItem("probe" + j);
        return n; }""")
    page.reload()
    page.locator('[data-a="slotload"][data-s="3"]').first.tap()
    assert page.evaluate("G.t") == month, "Slot 3 did not restore the saved month"
    assert not errors, errors
    page.close()
    result = {"saveChars": len(save), "usedChars": used, "headroomChars": headroom,
              "capacityChars": used + headroom, "keys": keys}
    print("STORAGE", json.dumps(result))
    return result


def works(browser, url, width, scale, save):
    """The Android Works checklist, tapped at a portrait width."""
    page, errors = open_game(browser, url, width, touch=True, scale=scale)
    load_save(page, save)
    page.evaluate("ACT.tab({t: 'works'})")
    count = "(() => { const c = me(); return bldActive(c) + (c.bq || []).length; })()"
    before = page.evaluate(count)
    for _ in range(2):
        page.locator('[data-a="worksbuild"]').first.tap()
    assert page.evaluate(count) == before + 2, "Two consecutive orders did not both register"
    for _ in range(12):
        if page.evaluate("(me().bq || []).length") >= 2:
            break
        page.locator('[data-a="worksbuild"]').first.tap()
    queued = page.evaluate("me().bq.map(order => order.id)")
    assert len(queued) >= 2, "Orders did not reach the queue once the slots were full"
    page.locator('[data-a="bqmv"]:not([disabled])').last.tap()
    moved = page.evaluate("me().bq.map(order => order.id)")
    assert moved != queued and sorted(moved) == sorted(queued), "Queue move did not reorder"
    page.locator('[data-a="bqdel"]').first.tap()
    kept = page.evaluate("me().bq.map(order => order.id)")
    assert len(kept) == len(queued) - 1, "Cancel did not remove one order"
    active = page.evaluate("JSON.stringify(provsOf(G.player).map(p => [p.id, p.build]))")
    if not page.locator('[data-a="settings"]').first.is_visible():
        page.locator('[data-a="hdrx"]').first.tap()
    page.locator('[data-a="settings"]').first.tap()
    page.locator('[data-a="slotsave"][data-s="2"]').first.tap()
    page.reload()
    page.locator('[data-a="slotload"][data-s="2"]').first.tap()
    assert page.evaluate("me().bq.map(order => order.id)") == kept, "Queue changed after reload"
    assert page.evaluate("JSON.stringify(provsOf(G.player).map(p => [p.id, p.build]))") == active, "Active works changed after reload"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Works overflows horizontally"
    assert not errors, errors
    page.close()
    print(f"PASS Works {width}px / {scale:.0%} text")


def pages(browser, url, width, scale, save, screenshots):
    """Late-game layout on each main page."""
    page, errors = open_game(browser, url, width, touch=True, scale=scale)
    load_save(page, save)
    for tab in ("over", "map", "eco", "pol", "works", "nat", "dip", "chron"):
        page.evaluate("(t) => ACT.tab({t})", tab)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"{tab} overflows at {width}px"
        assert "\u00c2" not in page.evaluate("document.body.innerText"), f"{tab} shows garbled characters"
        if screenshots:
            screenshots.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(screenshots / f"late-{tab}-{width}-{scale}.png"))
    assert not errors, errors
    page.close()
    print(f"PASS late pages {width}px / {scale:.0%} text")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--months", type=int, default=3)
    parser.add_argument("--screenshots", type=Path)
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    parser.add_argument("--late", type=Path, nargs="*", default=[],
                        help="late-game save files; the largest is used for storage, Works and layout")
    parser.add_argument("--budget", type=float, default=130, help="mean ms per month on desktop")
    parser.add_argument("--json", type=Path, help="write the gate results here")
    args = parser.parse_args()
    with TemporaryDirectory() as temp, sync_playwright() as playwright:
        html = Path(temp) / "wrapped.html"
        html.write_text(wrapped(GAME.read_text(encoding="utf-8")), encoding="utf-8")
        browser = playwright.chromium.launch(executable_path=args.chromium, args=["--no-sandbox"])
        url = html.as_uri()
        for width in (360, 390):
            for scale in (1, 1.25):
                exercise(browser, url, width, scale, args.months, args.screenshots)
        if not args.late:
            return
        results = {"timing": [timing(browser, url, "opening", args.months)]}
        saves = {path.name: path.read_text(encoding="utf-8").strip() for path in args.late}
        for name, text in saves.items():
            results["timing"].append(timing(browser, url, name, args.months, text))
        largest = max(saves.values(), key=len)
        results["storage"] = storage(browser, url, largest)
        for width in (360, 390):
            for scale in (1, 1.25):
                works(browser, url, width, scale, largest)
                pages(browser, url, width, scale, largest, args.screenshots)
        if args.json:
            args.json.write_text(json.dumps(results, indent=1), encoding="utf-8")
        over = [run for run in results["timing"] if run["shown"]["mean"] > args.budget]
        assert not over, f"Over the {args.budget} ms budget: " + ", ".join(run["label"] for run in over)
        assert results["storage"]["headroomChars"] > 0
        print(f"PASS release gate: every timing mean is within {args.budget:g} ms per month")


if __name__ == "__main__":
    main()
