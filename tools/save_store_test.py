"""SV1 acceptance test: saves in IndexedDB, Worker compression, file export, no network.

    python3 tools/save_store_test.py        (needs dist built; system Chrome)

Checks: 5 MB synthetic value round-trips after a reload; slot save then reload then load; autosave lands in the
store; old localStorage saves are removed (download offered once); main thread blocked <= 300 ms during a slot save
of the 1866 fixture at 4x CPU throttle; a refused write gives a plain message; no network request leaves the page.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
URL = (ROOT / "dist/long-century.html").as_uri()
FIX = (ROOT / "testdata/seed7_1866.txt").read_text().strip()
fails = []

def check(name, ok, extra=""):
    print(("ok   " if ok else "FAIL ") + name + (" " + str(extra) if extra else ""))
    if not ok:
        fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 390, "height": 800})
    net = []
    ctx.on("request", lambda r: net.append(r.url) if not r.url.startswith(("file:", "blob:", "data:")) else None)
    pg = ctx.new_page()
    dialogs = []
    pg.on("dialog", lambda d: (dialogs.append(d.message), d.dismiss()))
    pg.add_init_script("""if(location.protocol==='file:'&&!localStorage.getItem('seeded')){localStorage.setItem('seeded','1');localStorage.setItem('vic.auto','OLD');localStorage.setItem('vic.s1','OLD');}""")
    pg.goto(URL)
    pg.wait_for_function("typeof SAVES!=='undefined'&&typeof G!=='undefined'&&!!document.getElementById('start')", timeout=20000)
    check("old localStorage saves offered once and removed", len(dialogs) == 1 and pg.evaluate("localStorage.getItem('vic.auto')===null&&localStorage.getItem('vic.s1')===null"))
    pg.evaluate("SAVES.set('big','x'.repeat(5000000))")
    pg.evaluate("SAVES.set('probe','1')")
    pg.reload()
    pg.wait_for_function("typeof SAVES!=='undefined'&&!!document.getElementById('start')", timeout=20000)
    check("5 MB value reads back identically after reload", pg.evaluate("(SAVES.get('big')||'').length===5000000&&SAVES.get('probe')==='1'"))
    check("loads the 1866 fixture", pg.evaluate("(t)=>loadText(t,'Loaded')", FIX))
    cdp = ctx.new_cdp_session(pg)
    cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
    pg.evaluate("""window.__gap=0;window.__t=performance.now();window.__hb=setInterval(()=>{const n=performance.now();window.__gap=Math.max(window.__gap,n-window.__t);window.__t=n;},16);slotSave(2);""")
    pg.wait_for_function("(SAVES.get('vic.s2')||'').startsWith('V2:')&&!!SAVES.get('vic.s2m')", timeout=60000)
    gap = pg.evaluate("clearInterval(window.__hb),window.__gap")
    cdp.send("Emulation.setCPUThrottlingRate", {"rate": 1})
    check("main thread blocked <= 300 ms during slot save at 4x throttle", gap <= 300, f"{gap:.0f} ms (includes JSON.stringify)")
    pg.reload()
    pg.wait_for_function("typeof SAVES!=='undefined'&&!!document.getElementById('start')", timeout=20000)
    check("slot 2 survives reload and loads", pg.evaluate("slotLoad(2),!!G.prov&&G.t>0"))
    pg.evaluate("autosave()")
    pg.wait_for_function("(SAVES.get('vic.auto')||'').startsWith('V2:')&&!UI.autosaveFailed", timeout=30000)
    check("autosave lands in the store", True)
    pg.evaluate("indexedDB.deleteDatabase('vic')")
    msg = pg.evaluate("""new Promise(r=>{const t=toast;window.toast=m=>r(m);SAVES.set=()=>Promise.reject(new Error('full'));slotSave(3);setTimeout(()=>r('none'),8000);})""")
    check("refused write gives a plain message", "no room" in msg, msg)
    check("no network calls", not net, net[:3])
    b.close()
sys.exit(1 if fails else 0)
