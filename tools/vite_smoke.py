"""AND1 smoke test for the Vite (Android/PWA) build.

Serves dist/ with `npx vite preview`, opens it in headless Chrome at phone size, starts a game,
opens Settings, and fails on any page error, a missing Sound row, or a request for a missing file.
Run after `npx vite build`:  python3 tools/vite_smoke.py
"""
import os, signal, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

PORT = 4173
URL = f"http://127.0.0.1:{PORT}/"


def wait_up(proc):
    for _ in range(60):
        try:
            urllib.request.urlopen(URL, timeout=1)
            return
        except Exception:
            if proc.poll() is not None:
                sys.exit("FAIL vite preview exited")
            time.sleep(0.5)
    sys.exit("FAIL vite preview did not start")


def main():
    server = subprocess.Popen(["npx", "vite", "preview", "--host", "127.0.0.1", "--port", str(PORT), "--strictPort"],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    problems = []
    try:
        wait_up(server)
        with sync_playwright() as p:
            b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
            page = b.new_page(viewport={"width": 390, "height": 844})
            page.on("pageerror", lambda e: problems.append("page error: " + str(e)[:200]))
            page.on("response", lambda r: r.status >= 400 and problems.append(f"HTTP {r.status} {r.url}"))
            page.goto(URL)
            page.wait_for_function("typeof newGame === 'function' && !document.getElementById('lc-boot-splash')", timeout=30000)
            page.evaluate("ACT.pick({t:'GBR'})")
            page.wait_for_timeout(500)
            try:
                page.evaluate("openSettings()")
            except Exception as e:
                problems.append("Settings did not open: " + str(e).splitlines()[0][:200])
            page.wait_for_timeout(300)
            if not page.evaluate("[...document.querySelectorAll('[data-a=sndset]')].length === 3"):
                problems.append("Settings has no Sound row (ui_audio.js missing from the bundle?)")
            if not page.evaluate("document.body.innerText.includes('100')"):
                problems.append("Settings text does not mention the £100 million cheat")
            b.close()
    finally:
        os.killpg(server.pid, signal.SIGTERM)  # npx starts vite as a child: stop the whole group
    for x in problems:
        print("FAIL", x)
    print("PASS vite smoke" if not problems else f"{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
