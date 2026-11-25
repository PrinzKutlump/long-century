#!/usr/bin/env python3
"""Feature ledger tool. Source of truth: docs/LEDGER.json. docs/LEDGER.md is generated.

  python3 tools/ledger.py --open      list open items (read this at the start of every session)
  python3 tools/ledger.py --check     validate; fail on removed ids, stale md, dead probes
  python3 tools/ledger.py --render    rewrite docs/LEDGER.md
  python3 tools/ledger.py --add ID "ask text" --src "who/where"   append a new ask as 'unverified'

Status values: done, partial, missing, unverified, closed (owner dropped it). Rows are never deleted.
A done or partial row needs a probe (or nosrc:true for process rows): a regex that must match somewhere in src/*.js. If a PR removes the
feature, the probe stops matching and --check fails, so features cannot vanish silently.
"""
import json, re, subprocess, sys, glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, "docs", "LEDGER.json")
MD = os.path.join(ROOT, "docs", "LEDGER.md")
STATUS = ["done", "partial", "missing", "unverified", "closed"]
OPEN = ["partial", "missing", "unverified"]

def load(path=JS):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def render(d):
    out = ["# Feature ledger", "", "Generated from docs/LEDGER.json by tools/ledger.py. Do not edit by hand.",
           "Rules: docs/DEV_WORKFLOW.md section 'Feature ledger'. Done rows stay forever for later audits.", ""]
    n = {s: sum(1 for r in d["items"] if r["status"] == s) for s in STATUS}
    out.append("Totals: " + ", ".join(f"{s} {n[s]}" for s in STATUS) + "  (audited " + d["audited"] + ")")
    for g in d["groups"]:
        out += ["", f"## {g['id']}. {g['title']}", "", "| ID | Ask | Status | Ticket or evidence | Done on |", "|---|---|---|---|---|"]
        for r in d["items"]:
            if r["id"].startswith(g["id"]):
                out.append(f"| {r['id']} | {r['ask']} | {r['status']} | {r.get('note','')} | {r.get('done','')} |")
    return "\n".join(out) + "\n"

def src_text():
    t = {}
    for p in glob.glob(os.path.join(ROOT, "src", "*.js")):
        with open(p, encoding="utf-8", errors="replace") as f:
            t[os.path.basename(p)] = f.read()
    return t

def base_ids():
    try:
        s = subprocess.run(["git", "show", "origin/main:docs/LEDGER.json"], cwd=ROOT, capture_output=True, text=True)
        return {r["id"]: r for r in json.loads(s.stdout)["items"]} if s.returncode == 0 else {}
    except Exception:
        return {}

def check():
    d, bad = load(), []
    ids = [r["id"] for r in d["items"]]
    if len(ids) != len(set(ids)):
        bad.append("duplicate ids")
    for old_id, old in base_ids().items():
        new = next((r for r in d["items"] if r["id"] == old_id), None)
        if not new:
            bad.append(f"{old_id}: row removed (rows may never be deleted; use status closed)")
        elif old["status"] == "done" and new["status"] != "done":
            bad.append(f"{old_id}: was done, now {new['status']} (explain in note and owner must approve)")
    txt = src_text()
    for r in d["items"]:
        if r["status"] not in STATUS:
            bad.append(f"{r['id']}: bad status {r['status']}")
        if r["status"] in ("missing", "partial") and not r.get("note"):
            bad.append(f"{r['id']}: open row needs a ticket or note")
        if r["status"] == "done" and not r.get("done"):
            bad.append(f"{r['id']}: done row needs a date")
        if r["status"] in ("done", "partial") and not r.get("nosrc"):
            if not r.get("probe"):
                bad.append(f"{r['id']}: {r['status']} row needs a probe")
            else:
                f, rx = r["probe"].split("::", 1)
                if not re.search(rx, txt.get(f, ""), re.I):
                    bad.append(f"{r['id']}: probe {r['probe']} no longer matches: feature removed?")
    if not os.path.exists(MD) or open(MD, encoding="utf-8").read() != render(d):
        bad.append("docs/LEDGER.md is stale: run python3 tools/ledger.py --render")
    for b in bad:
        print("FAIL", b)
    print("ledger ok" if not bad else f"{len(bad)} problem(s)")
    return 1 if bad else 0

def main(a):
    if "--render" in a:
        open(MD, "w", encoding="utf-8").write(render(load()))
        return 0
    if "--check" in a:
        return check()
    if "--add" in a:
        i = a.index("--add"); d = load()
        src = a[a.index("--src") + 1] if "--src" in a else ""
        d["items"].append({"id": a[i + 1], "ask": a[i + 2], "status": "unverified", "note": "from " + src})
        json.dump(d, open(JS, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
        open(MD, "w", encoding="utf-8").write(render(d))
        return 0
    d = load()
    for r in d["items"]:
        if r["status"] in OPEN:
            print(f"{r['id']:5} {r['status']:10} {r['ask'][:80]}  [{r.get('note','')[:40]}]")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
