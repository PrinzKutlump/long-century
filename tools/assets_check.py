#!/usr/bin/env python3
"""Check assets/ against docs/assets.json (see docs/ASSETS.md). Exit 1 on any problem."""
import hashlib, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man = json.load(open(os.path.join(ROOT, "docs", "assets.json"), encoding="utf-8"))
bad, total = [], 0
files = set()
for adir in (os.path.join(ROOT, "assets"), os.path.join(ROOT, "public", "assets")):
    for base, _, names in os.walk(adir):
        for n in names:
            if n not in (".gitkeep", "README.md"):
                files.add(os.path.relpath(os.path.join(base, n), ROOT).replace(os.sep, "/"))
listed = set()
for it in man["items"]:
    p = it.get("path", "")
    listed.add(p)
    if it.get("license") not in man["allowed"]:
        bad.append(f"{p}: licence {it.get('license')} not allowed")
    if it.get("license") in ("CC0", "PD") and not (it.get("source_url") and it.get("author") and it.get("retrieved")):
        bad.append(f"{p}: CC0 and PD items need source_url, author, retrieved")
    if it.get("license") == "AI" and not all(it.get(k) for k in ("tool", "prompt", "created", "reviewed_by")):
        bad.append(f"{p}: AI items need tool, prompt, created, reviewed_by (docs/ASSETS.md)")
    if it.get("license") == "OFL":
        if not p.lower().endswith((".ttf", ".otf", ".woff", ".woff2")):
            bad.append(f"{p}: OFL is allowed for font files only (ledger B63)")
        elif not os.path.exists(os.path.join(ROOT, os.path.dirname(p), "OFL.txt")):
            bad.append(f"{p}: OFL fonts need OFL.txt in the same folder")
        if not (it.get("source_url") and it.get("author") and it.get("retrieved")):
            bad.append(f"{p}: OFL items need source_url, author, retrieved")
    full = os.path.join(ROOT, p)
    if p.startswith(("assets/", "public/assets/")):
        if not os.path.exists(full):
            bad.append(f"{p}: file missing")
            continue
        data = open(full, "rb").read()
        total += len(data)
        if it.get("sha256") != hashlib.sha256(data).hexdigest():
            bad.append(f"{p}: sha256 does not match")
    elif not os.path.exists(full):
        bad.append(f"{p}: original item path missing")
for f in sorted(files - listed):
    bad.append(f"{f}: file has no row in docs/assets.json")
if total > man["budget_kb"] * 1024:
    bad.append(f"assets total {total // 1024} KB over budget {man['budget_kb']} KB")
for b in bad:
    print("FAIL", b)
print("assets ok" if not bad else f"{len(bad)} problem(s)", f"({len(man['items'])} items, {total // 1024} KB)")
sys.exit(1 if bad else 0)
