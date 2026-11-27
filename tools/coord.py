"""Coordination tool (docs/COORDINATION.md): board, audit, claim commands and PR checks.

GitHub calls go through the `gh` CLI (preinstalled on Actions runners; set GH_TOKEN there).
  python3 tools/coord.py board [--write]     render the board; --write puts it in issue #1
  python3 tools/coord.py audit                list gaps; exit 1 if any
  python3 tools/coord.py command <issue> <comment-file>   apply /claim, /release, /blocked, /unblock
  python3 tools/coord.py pr-check <pr-number>             PR rules; exit 1 on a breach
"""
import json, os, re, subprocess, sys, time
from datetime import datetime, timezone

REPO = os.environ.get("GITHUB_REPOSITORY", "PrinzKutlump/long-century")
BOARD = 1
LEDGER = "docs/LEDGER.json"
INBOX = "docs/inbox"
OPEN = {"partial", "missing", "unverified"}
AGENTS = {"claude", "codex", "gpt", "aistudio", "owner"}
STALE_DAYS = 3
# `Ledger: A5` in a body, or the issue form's "### Ledger" heading followed by its answer
LEDGER_RE = re.compile(r"^\s*(?:\**Ledger\**\s*:|###\s*Ledger\s*\n+)\s*(?:Ledger\s*:\s*)?(.+)$", re.I | re.M)
ID_RE = re.compile(r"\b([AB]\d{1,3})\b")


def gh(*args, data=None):
    cmd = ["gh", "api", *args]
    r = subprocess.run(cmd, input=json.dumps(data) if data is not None else None, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"gh api {' '.join(args)} failed: {r.stderr.strip()[:300]}")
    return json.loads(r.stdout) if r.stdout.strip() else None


def paged(path):
    out, page = [], 1
    while True:
        sep = "&" if "?" in path else "?"
        chunk = gh(f"repos/{REPO}/{path}{sep}per_page=100&page={page}")
        out += chunk
        if len(chunk) < 100:
            return out
        page += 1


def ledger_ids(text):
    m = LEDGER_RE.search(text or "")
    return set(ID_RE.findall(m.group(1))) if m else set()


def plan_linked(issue):
    """A ticket that comes from the plan rather than an owner ask says `Ledger: plan <PLAN-ID>`."""
    m = LEDGER_RE.search(issue.get("body") or "")
    return bool(m and re.match(r"\s*plan\b", m.group(1), re.I))


def ticket_ledger_ids(issue):
    """Ledger rows named by a ticket: the `Ledger:` line, else ids at the start of the title (`A1/B5: ...`)."""
    ids = ledger_ids(issue.get("body"))
    if not ids:
        head = re.split(r"[:\s]\s", issue["title"], maxsplit=1)[0]
        ids = set(ID_RE.findall(head))
    return ids


def labels(issue):
    return {x["name"] for x in issue.get("labels", [])}


def load_ledger():
    return json.load(open(LEDGER, encoding="utf-8"))["items"]


def inbox_files():
    if not os.path.isdir(INBOX):
        return []
    return sorted(f for f in os.listdir(INBOX) if f.endswith(".md") and f.lower() != "readme.md")


def age_days(stamp):
    t = datetime.strptime(stamp, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - t).total_seconds() / 86400


def last_claim(issue_no):
    """(agent, branch, time) of the newest /claim comment, or None."""
    found = None
    for c in paged(f"issues/{issue_no}/comments"):
        m = re.match(r"\s*/claim\s+(\S+)\s+(\S+)", c["body"] or "")
        if m:
            found = (m.group(1).lower(), m.group(2), c["created_at"])
        elif re.match(r"\s*/release\b", c["body"] or ""):
            found = None
    return found


def branch_age(branch):
    r = subprocess.run(["gh", "api", f"repos/{REPO}/branches/{branch}"], capture_output=True, text=True)
    if r.returncode:
        return None
    return age_days(json.loads(r.stdout)["commit"]["commit"]["committer"]["date"])


def gather():
    issues = [i for i in paged("issues?state=open") if "pull_request" not in i]
    prs = paged("pulls?state=open")
    tickets = [i for i in issues if "ticket" in labels(i)]
    asks = [i for i in issues if "owner-ask" in labels(i)]
    return issues, prs, tickets, asks


def plan_ids_missing():
    """Ticket ids from MASTER_PLAN §4 tables that docs/ROADMAP.md does not mention."""
    try:
        plan = open("docs/MASTER_PLAN.md", encoding="utf-8").read()
        road = open("docs/ROADMAP.md", encoding="utf-8").read()
    except OSError:
        return []
    ids = re.findall(r"^\|\s*([A-Z]{2,3}\d[\w/]*(?:[–-][A-Z]{2,3}\d+)?)", plan, re.M)
    have = set(re.findall(r"[A-Z]{2,3}\d+[a-z/]*", road))
    for pre, a, b in re.findall(r"\b([A-Z]{2,3})(\d+)[–-]\1?(\d+)\b", road):  # NF0–NF5, MP7–MP10
        have |= {f"{pre}{k}" for k in range(int(a), int(b) + 1)}
    return sorted({i for i in ids if i not in road and i not in have})


def gaps(ledger, tickets, asks):
    covered = set()
    for t in tickets:
        covered |= ticket_ledger_ids(t)
    no_ticket = [r for r in ledger if r["status"] in OPEN and r["id"] not in covered and not r.get("waits")]
    no_row = [t for t in tickets if not ticket_ledger_ids(t) and not plan_linked(t)]
    known = {r["id"] for r in ledger}
    bad_row = [(t, sorted(ticket_ledger_ids(t) - known)) for t in tickets if ticket_ledger_ids(t) - known]
    return no_ticket, no_row, bad_row, asks, inbox_files()


def prio(t):
    ls = labels(t)
    for p in ("p1", "p2", "p3"):
        if p in ls:
            return int(p[1])
    return 4


def render(ledger, issues, prs, tickets, asks):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    pr_for = {}
    for p in prs:
        for n in re.findall(r"(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)", p["body"] or "", re.I):
            pr_for.setdefault(int(n), []).append(p)
    ready, claimed, review, blocked = [], [], [], []
    for t in sorted(tickets, key=lambda t: (prio(t), t["number"])):
        ls = labels(t)
        if t["number"] in pr_for:
            review.append(t)
        elif "blocked" in ls:
            blocked.append(t)
        elif "claimed" in ls:
            claimed.append(t)
        else:
            ready.append(t)
    no_ticket, no_row, bad_row, asks, inbox = gaps(ledger, tickets, asks)
    row = lambda t: f"#{t['number']} {t['title']}"
    led = lambda t: ", ".join(sorted(ticket_ledger_ids(t))) or ("plan" if plan_linked(t) else "**none**")
    out = [
        "# Start here: the coordination board",
        "",
        f"_Generated by `tools/coord.py` at {now}. Do not edit by hand: the next refresh overwrites it. "
        "Rules: [docs/COORDINATION.md](https://github.com/" + REPO + "/blob/main/docs/COORDINATION.md)._",
        "",
        "**Every agent, every session:** read this board → run `python3 tools/ledger.py --open` → record any new owner ask "
        "(Owner request issue, or `docs/inbox/` for AI Studio) → resume your claim or take the first Ready ticket you can do: "
        "comment `/claim <agent> t/<id>-<slug>` on the ticket. Never push to `main`.",
        "",
    ]
    missing = plan_ids_missing()
    if no_ticket or no_row or bad_row or asks or inbox or missing:
        out += ["## ⚠️ Gaps to fix first (planner)", ""]
        out += [f"- Ledger {r['id']} ({r['status']}) has no ticket: {r['ask'][:90]}" for r in no_ticket]
        out += [f"- Ticket {row(t)} names no ledger row (add `Ledger: <id>`)" for t in no_row]
        out += [f"- Ticket {row(t)} names unknown ledger ids {', '.join(ids)}" for t, ids in bad_row]
        out += [f"- New owner ask waiting for intake: {row(a)}" for a in asks]
        out += [f"- Inbox file waiting for intake: `docs/inbox/{f}`" for f in inbox]
        out += [f"- Plan id {i} is missing from docs/ROADMAP.md" for i in missing]
        out.append("")
    meant = lambda t: ", ".join(sorted(l[4:] for l in labels(t) if l.startswith("for:"))) or "any"
    out += [f"## Ready ({len(ready)}): take the first one you can do", "", "| Ticket | Priority | Ledger | For |", "|---|---|---|---|"]
    out += [f"| {row(t)} | {'p'+str(prio(t)) if prio(t) < 4 else '—'} | {led(t)} | {meant(t)} |" for t in ready] or ["| none | | | |"]
    out += ["", f"## Claimed ({len(claimed)})", "", "| Ticket | Agent | Branch | Since | Last push |", "|---|---|---|---|---|"]
    for t in claimed:
        c = last_claim(t["number"])
        if not c:
            out.append(f"| {row(t)} | ? | ? | | label without a /claim comment |")
            continue
        b = branch_age(c[1])
        push = "no branch yet" if b is None else f"{b:.1f} days ago"
        stale = " ⚠️ stale" if (b is None and age_days(c[2]) > STALE_DAYS) or (b is not None and b > STALE_DAYS) else ""
        out.append(f"| {row(t)} | {c[0]} | `{c[1]}` | {c[2][:10]} | {push}{stale} |")
    if not claimed:
        out.append("| none | | | | |")
    out += ["", f"## In review ({len(review)})", "", "| Ticket | Pull request |", "|---|---|"]
    out += [f"| {row(t)} | " + ", ".join(f"#{p['number']}" for p in pr_for[t["number"]]) + " |" for t in review] or ["| none | |"]
    loose = [p for p in prs if not re.search(r"#\d+", p["body"] or "") and not p["user"]["login"].startswith("dependabot")]
    if loose:
        out += ["", "PRs with no ticket: " + ", ".join(f"#{p['number']} {p['title']}" for p in loose)]
    out += ["", f"## Blocked ({len(blocked)})", ""]
    out += [f"- {row(t)}" for t in blocked] or ["- none"]
    counts = {}
    for r in ledger:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    out += ["", "## Ledger", "", "Rows by status: " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())) +
            ". Full list: [docs/LEDGER.md](https://github.com/" + REPO + "/blob/main/docs/LEDGER.md).", "",
            "## Commands (comment on a ticket)", "",
            "`/claim <agent> <branch>` · `/release <what is done, what is left>` · `/blocked <reason>` · `/unblock`  ",
            "Agents: claude, codex, aistudio, owner. History of claims before 27 Nov 2026 is in the comments below."]
    return "\n".join(out) + "\n"


def cmd_board(write):
    issues, prs, tickets, asks = gather()
    body = render(load_ledger(), issues, prs, tickets, asks)
    if write:
        gh(f"repos/{REPO}/issues/{BOARD}", "-X", "PATCH", "--input", "-", data={"body": body, "title": "Start here: coordination board (tickets, claims, gaps)"})
        print("board written")
    else:
        sys.stdout.write(body)


def cmd_audit():
    issues, prs, tickets, asks = gather()
    no_ticket, no_row, bad_row, asks, inbox = gaps(load_ledger(), tickets, asks)
    for r in no_ticket:
        print(f"GAP ledger {r['id']} ({r['status']}) has no ticket")
    for t in no_row:
        print(f"GAP ticket #{t['number']} names no ledger row")
    for t, ids in bad_row:
        print(f"GAP ticket #{t['number']} names unknown rows {ids}")
    for a in asks:
        print(f"INTAKE owner-ask #{a['number']} {a['title']}")
    for f in inbox:
        print(f"INTAKE inbox {f}")
    missing = plan_ids_missing()
    for i in missing:
        print(f"GAP plan id {i} (MASTER_PLAN) is missing from docs/ROADMAP.md")
    n = len(no_ticket) + len(no_row) + len(bad_row) + len(asks) + len(inbox) + len(missing)
    print(f"{n} item(s)" if n else "audit ok")
    return 1 if n else 0


def ensure_label(name, color="ededed"):
    subprocess.run(["gh", "api", f"repos/{REPO}/labels", "-f", f"name={name}", "-f", f"color={color}"], capture_output=True)


def cmd_command(issue_no, comment_file):
    text = open(comment_file, encoding="utf-8").read().strip()
    issue = gh(f"repos/{REPO}/issues/{issue_no}")
    ls = labels(issue)
    reply = None
    m = re.match(r"/claim\s+(\S+)\s+(\S+)", text)
    if m:
        agent, branch = m.group(1).lower(), m.group(2)
        if "ticket" not in ls:
            reply = "Not claimed: only issues labelled `ticket` can be claimed. Ask the planner to make this a ticket."
        elif agent not in AGENTS:
            reply = f"Not claimed: agent must be one of {', '.join(sorted(AGENTS))}."
        elif not branch.startswith("t/"):
            reply = "Not claimed: the branch must be named `t/<id>-<slug>`."
        elif "claimed" in ls:
            c = last_claim(int(issue_no))
            reply = f"Not claimed: already claimed by {c[0] if c else 'someone'} (`{c[1] if c else '?'}`). Pick another Ready ticket or ask for a handoff here."
        else:
            for x in [l for l in ls if l.startswith("agent:")]:
                subprocess.run(["gh", "api", "-X", "DELETE", f"repos/{REPO}/issues/{issue_no}/labels/{x}"], capture_output=True)
            ensure_label("claimed", "fbca04"); ensure_label("agent:" + agent, "c5def5")
            gh(f"repos/{REPO}/issues/{issue_no}/labels", "--input", "-", data={"labels": ["claimed", "agent:" + agent]})
            reply = f"Claimed by **{agent}** on `{branch}`. Push early; release with `/release <note>` if you stop."
    elif re.match(r"/release\b", text):
        for x in ["claimed"] + [l for l in ls if l.startswith("agent:")]:
            subprocess.run(["gh", "api", "-X", "DELETE", f"repos/{REPO}/issues/{issue_no}/labels/{x}"], capture_output=True)
        reply = "Released: back in Ready."
    elif re.match(r"/blocked\b", text):
        ensure_label("blocked", "d93f0b")
        gh(f"repos/{REPO}/issues/{issue_no}/labels", "--input", "-", data={"labels": ["blocked"]})
        reply = "Marked blocked. `/unblock` returns it to the board."
    elif re.match(r"/unblock\b", text):
        subprocess.run(["gh", "api", "-X", "DELETE", f"repos/{REPO}/issues/{issue_no}/labels/blocked"], capture_output=True)
        reply = "Unblocked."
    if reply:
        gh(f"repos/{REPO}/issues/{issue_no}/comments", "--input", "-", data={"body": reply})
        print(reply)
    return 0


def removed_or_weakened(base_items, head_items):
    head = {r["id"]: r for r in head_items}
    bad = []
    for r in base_items:
        h = head.get(r["id"])
        if h is None:
            bad.append(f"ledger row {r['id']} removed")
        elif r["status"] == "done" and h["status"] != "done":
            bad.append(f"ledger row {r['id']} went from done to {h['status']}")
    return bad


def cmd_pr_check(pr_no):
    pr = gh(f"repos/{REPO}/pulls/{pr_no}")
    body, branch, problems = pr["body"] or "", pr["head"]["ref"], []
    if pr["user"]["login"].startswith("dependabot"):
        print("dependabot PR: skipped"); return 0
    if not branch.startswith("t/"):
        problems.append(f"branch `{branch}` is not named t/<id>-<slug>")
    refs = re.findall(r"(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)", body, re.I)
    if not refs:
        problems.append("the body has no `Closes #<ticket>` line")
    for n in refs:
        i = gh(f"repos/{REPO}/issues/{n}")
        if "ticket" not in labels(i):
            problems.append(f"#{n} is not an issue labelled `ticket`")
    if not ledger_ids(body) and not re.search(r"^\s*\**Ledger\**\s*:\s*plan\b", body, re.I | re.M):
        problems.append("the body has no `Ledger: <id>` (or `Ledger: plan <PLAN-ID>`) line")
    base = subprocess.run(["git", "show", f"origin/{pr['base']['ref']}:{LEDGER}"], capture_output=True, text=True)
    if base.returncode == 0 and "Owner-approved ledger change" not in body:
        problems += removed_or_weakened(json.loads(base.stdout)["items"], load_ledger())
    for p in problems:
        print("FAIL", p)
    print("pr-check ok" if not problems else f"{len(problems)} problem(s); rules in docs/COORDINATION.md §3")
    return 1 if problems else 0


def main(a):
    if not a:
        print(__doc__); return 2
    if a[0] == "board":
        return cmd_board("--write" in a) or 0
    if a[0] == "audit":
        return cmd_audit()
    if a[0] == "command":
        return cmd_command(a[1], a[2])
    if a[0] == "pr-check":
        return cmd_pr_check(a[1])
    print(__doc__); return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
