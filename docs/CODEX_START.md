# Codex: start here

You implement every ticket of The Long Century. Claude plans, writes ticket issues and audits your PRs; the owner decides and playtests. Read `AGENTS.md`, `CLAUDE.md`, then `docs/MASTER_PLAN.md` (read §1, §3 and the rows of your ticket only) and the matching section of `docs/DESIGN.md`.

## First, in this order
Follow `docs/MASTER_PLAN.md` §5. The first engine ticket is **FX1** (#27) (phantom factory output and save/resume divergence; root cause in `docs/STATUS.md` §5), then SV1 (#4), FX2, FX3, CA1, PL2, PL3a. Open PRs to finish first: PL1 #23, FD1 #22, PB5 #25.

Take tickets only from issues labelled `ticket`, claim on the claims board, one ticket per branch `t/<id>-<slug>`.

## Rules that matter most
- Same rules for every nation, player and AI. No network calls in the game. One `<style>` element. Phone first (360/390 px, 44 px targets, no horizontal scroll). Plain English; disabled buttons say why. Original art only.
- New lines under 300 characters; files under 600 lines. Read code with `python3 tools/fn.py`, never whole `src/*.js` files.
- Old saves need not load (owner decision); a save from the same build must load and continue exactly (the stress tier checks this).
- No credentials or personal details in code, issues or PRs. Never commit raw Correlates of War files to the public repo.
- PR body: commit, hash before and after with the reason, ms/month at 1936, save bytes, tests run, first remaining risk.
- Claude posts APPROVE or CHANGES (numbered, each tied to a failing check) on your PR, four times a day, and merges approved PRs with green CI where permitted (otherwise the owner merges). Fix CHANGES on the same branch.
