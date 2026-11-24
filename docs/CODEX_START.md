# Codex: start here

You implement every ticket of The Long Century. Claude plans, writes ticket issues and audits your PRs; the owner decides and playtests. Read `AGENTS.md`, `CLAUDE.md`, then `docs/MASTER_PLAN.md` (read §0, §1, §3 and the rows of your ticket only).

## First, in this order
1. **PB1** (`docs/MASTER_PLAN.md` §0): build the clean public snapshot once the owner has created the empty public repo `PrinzKutlump/long-century`. Exclude `data/raw/cow/**`, `archive/**`, `deepseek_h1.txt` and old zips; move root plan files into `docs/plans/`; add `LICENSE` (all rights reserved), `NOTICE.md` (Natural Earth public domain; OpenHistoricalMap CC0; HYDE 3.2 CC0, DOI 10.17026/DANS-25G-GEZ3; Maddison Project Database 2023, cite as asked; Correlates of War cited for derived counts only; pako licence), `README.md`, `SECURITY.md`. Run gitleaks; grep that no COW raw file is present; push one initial commit.
2. **PB2**, **PB3**, **PB4**, **PB5** in the public repo.
3. Then the M0 queue: PL1 (CI gates), FD1 (finish B1 grain freight, diagnosis in the private repo's issue #29), SV1 (IndexedDB saves), CA1, PL2.

Claude recreates the ticket issues and the claims board in the public repo (PB6). After that, take tickets only from issues labelled `ticket`, claim on the claims board, one ticket per branch `t/<id>-<slug>`.

## Rules that matter most
- Same rules for every nation, player and AI. No network calls in the game. One `<style>` element. Phone first (360/390 px, 44 px targets, no horizontal scroll). Plain English; disabled buttons say why. Original art only.
- New lines under 300 characters; files under 600 lines. Read code with `python3 tools/fn.py`, never whole `src/*.js` files.
- Old saves need not load (owner decision); a save from the same build must.
- No credentials or personal details in code, issues or PRs. Never commit raw Correlates of War files to the public repo.
- PR body: commit, hash before and after with the reason, ms/month at 1936, save bytes, tests run, first remaining risk.
- Claude posts APPROVE or CHANGES (numbered, each tied to a failing check) on your PR, four times a day, and merges approved PRs with green CI. Fix CHANGES on the same branch.
