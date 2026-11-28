"""Measure the browser simulation and publish the nightly GitHub report."""
import json
import os
from pathlib import Path
import subprocess
import sys

BENCH = """() => {
  newGame('SWI', 7);
  while (G.t < 1080) monthTick();
  const start = performance.now();
  for (let i = 0; i < 120; i++) monthTick();
  return {monthMs: (performance.now() - start) / 120, saveBytes: new Blob([pack()]).size};
}"""


def bench():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path="/usr/bin/google-chrome")
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(Path("dist/long-century.html").resolve().as_uri())
        session = page.context.new_cdp_session(page)
        session.send("Emulation.setCPUThrottlingRate", {"rate": 4})
        result = page.evaluate(BENCH)
        browser.close()
    print(json.dumps(result))


def report():
    jobs = json.loads(os.environ["JOB_RESULTS"])
    repo = os.environ["GITHUB_REPOSITORY"]
    run = os.environ["GITHUB_RUN_ID"]
    link = f"https://github.com/{repo}/actions/runs/{run}"
    print(f"<!-- night-run:{run} -->\n## Night report\n")
    print(f"[Run and artifacts]({link}) · commit `{os.environ['GITHUB_SHA'][:7]}`\n")
    print("| Job | Result |\n| --- | --- |")
    for name, value in jobs.items():
        print(f"| {name} | {value['result']} |")
    print()
    if jobs["publish"]["result"] == "success":
        print(f"[Download APK](https://github.com/{repo}/releases/download/nightly/long-century-nightly-debug.apk)")
    if jobs["pages"]["result"] == "success":
        owner, project = repo.split("/")
        print(f" · [Play web build](https://{owner.lower()}.github.io/{project}/nightly/)")
    print()
    root = Path("measurements")
    checks = []
    for path in sorted(root.glob("*/stress.json")):
        checks.extend(json.loads(path.read_text())["resume"])
    print(f"Save/resume: {sum(not check['ok'] for check in checks)} divergences across {len(checks)} of 24 expected checkpoints.\n")
    path = root / "measurements-bench/bench.json"
    if path.exists():
        result = json.loads(path.read_text())
        month, size = result["monthMs"], result["saveBytes"]
        print(f"4× CPU throttle, 1926–1936: {month:.1f} ms/month; packed save {size:,} B (budget 1,000,000 B).")
        print("The 130 ms/month budget uses Node. Daily timings will be available once the daily clock lands.\n")
    print("| Calibration seed | Wars | States ended | States formed |\n| --- | ---: | ---: | ---: |")
    for path in sorted(root.glob("*/calibration.json")):
        result = json.loads(path.read_text())
        print(f"| {result['seed']} | {len(result['wars'])} | {len(result['destroyed'])} | {len(result['formed'])} |")


def gh(*args):
    return subprocess.check_output(["gh", *args], text=True)


def post():
    repo = os.environ["GITHUB_REPOSITORY"]
    run = os.environ["GITHUB_RUN_ID"]
    jobs = json.loads(os.environ["JOB_RESULTS"])
    comments = gh("api", "--paginate", f"repos/{repo}/issues/167/comments", "--jq",
                  f'.[] | select(.body | startswith("<!-- night-run:{run} -->")) | .id')
    if comments.strip():
        comment_id = comments.splitlines()[0]
        gh("api", "--method", "PATCH", f"repos/{repo}/issues/comments/{comment_id}", "-F", "body=@report.md")
    else:
        gh("issue", "comment", "167", "--repo", repo, "--body-file", "report.md")
    failures = [name for name, status in jobs.items() if status["result"] != "success"]
    if not failures:
        return
    title = "Night shift failures"
    issues = json.loads(gh("issue", "list", "--repo", repo, "--label", "bug", "--search", f'"{title}" in:title', "--json", "number,title"))
    body = f"Jobs requiring attention: {', '.join(failures)}. See the [night run](https://github.com/{repo}/actions/runs/{run})."
    for issue in issues:
        if issue["title"] == title:
            gh("issue", "edit", str(issue["number"]), "--repo", repo, "--body", body)
            return
    gh("issue", "create", "--repo", repo, "--title", title, "--label", "bug", "--body", body)


if __name__ == "__main__":
    {"bench": bench, "post": post, "report": report}[sys.argv[1]]()
