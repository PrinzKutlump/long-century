# The Long Century: agent guide

Roles (owner, 27 Nov 2026, ledger B21): Codex/GPT, Claude and Google AI Studio may all implement tickets that change the game; Claude also plans, writes ticket issues, audits PRs (docs/DEV_WORKFLOW.md section 3b) and maintains docs and the stress tier. Every agent, AI Studio included, works on a `t/` branch and opens a PR; nobody pushes to `main`. Plans: `docs/ROADMAP.md` (map of every feature, mechanic and ticket; start here), `docs/DESIGN.md`, `docs/MASTER_PLAN.md`, `docs/STATUS.md`.

Direction (owner, ledger B20): Android game first, dynamic map, modern UI, features easy to add. Path: keep the JavaScript engine; Vite multi-file build; Capacitor Android app; PixiJS map; switch to Godot only if the PixiJS map fails the phone test on a Galaxy A56.

Session start: run `python3 tools/ledger.py --open` and read the open rows of `docs/LEDGER.md`. Every owner ask goes in the ledger (`--add`), rows are never deleted, done rows stay as history, and a PR may not make a done feature stop working (CI probe).

Coordination: follow [docs/COORDINATION.md](docs/COORDINATION.md). Session start: read the board (issue #1, generated), `python3 tools/ledger.py --open`, record any new owner ask (Owner request issue, or `docs/inbox/`), then resume your claim or claim the first Ready ticket you can do by commenting `/claim <agent> t/<id>-<slug>` on it. A PR needs `Closes #<ticket>` and `Ledger: <id>` (CI job `coord`). At session end, comment on the ticket what is done and what is left.

Plain JS game with a few TypeScript engine files (`src/engine/*.ts`, stripped to JS at build time by `scripts/transpile-engine.cjs`, Node 22.13 or later). Two builds read the same sources:
- `python3 build.py` (or `node build.mjs`): one file, `dist/long-century.html`. Used by CI, `century.js`, the tests and GitHub Pages.
- `npx vite build`: the multi-file app in `dist/` (installable web app and the Capacitor Android app). Its file list is in `vite.config.js`; a new `ui*.js` file must be added there, in `build.mjs` and in `build.py`. Check it with `python3 tools/vite_smoke.py`.
`dist/`, `dev-dist/` and the Android copies (`android/app/src/main/assets/public`) are generated and not tracked. Read this file first.

## Ticket flow
- One ticket, one branch: `t/<id>-<slug>`, for example `t/a5-research-balance`. One agent per ticket.
- Work in your own worktree. Never switch branches in a shared folder.
- Never push to `main`. Open a PR to `main` that links the issue and fills `.github/pull_request_template.md`.
- Claims are `/claim` comments on the ticket issue (not on the board); the board in issue #1 is generated.
- Each ticket names its hash change and why.
- Target: under 40 tool calls per ticket. Split big tickets before starting.
- CI: read only the pass/fail summary on the run page. On a failure, read only the failing test's last 20 lines.
- Run only the tests for the code you touched, one file at a time: `node test_<name>.js`.
- Do not run `node run_tests.js` locally (about 16 minutes). GitHub runs the full suite.
- Tier names: quick (every branch push), full (PRs to `main`, nightly), browser (PRs labelled `ui`), release (merge to `main`).

## Source rules
- Never `cat`, grep-dump or read whole `src/*.js` files. Some lines are 83,000 characters.
- Look up code with `python3 tools/fn.py <name> [file]`, or `python3 tools/fn.py --list <file>` for names and line numbers.
- Use `grep -n` with a short pattern to find a spot; then read a line range, not the file.
- Keep new lines under 300 characters and files under 600 lines.

## File map (src/)
Engine files (listed in engine-files.json, in this order):
- world.js: WORLD data (provinces, coordinates, farms, populations); one 83k-char line.
- defs.js: goods, prices, base tables (GOODS).
- state.js: the global `G`, helpers (clamp, rng, pick, P, yearOf, dateStr, provsOf, popOf).
- econ.js: economy (production, trade, prices, treasury, railways RAILK).
- society.js: society and research (rpOf, techCost, researchMonth), emigration (EMIG_DEST).
- politics.js: politics, revolts, nations that can appear.
- mil.js: military (MEN, armies, recruitment, combat).
- theatre.js: war theatres W1-W3, stances (STANCES), player and AI commands.
- diplo.js: the powers (industry, diplomacy, relations).
- events.js: historical events that fire when the world allows (WARGOALS).
- history.js: dispatches and historical anchors (HISTORY_DISPATCHES, historyDispatch, financialPanic).
- regional.js: regional and Indian administration (orderRegionalBuilding, governedIndia, companyBudget).
- greatwar.js: July crisis and Great War diplomacy (julyMonth, startJulyWar, julyArmistice).
- build.js: province buildings (BLD, bldCan, bldPay, startBld, railCan, bldCost).
- ai.js: AI budget and building (aiBudget, aiMonth, aiBuild).
- campaign.js: player campaign: agenda, Punjab challenge, cabinet (beginAgenda, agendaMonth, advanceStop).
- turn.js: one month (monthTick, advanceCampaign, issueCampaignCommand, campaignView) and execCommand(actor, command, options), the single path for every player and AI order.

Then the flags and interface files (build.py appends these after the engine list):
- flags.js: flag designs by nation (1836 designs).
- ui.js: base helpers ($, esc), layout, modal shell.
- ui2.js: dispatches, minister's brief, objectives, guide, coach cards, explain sheets.
- ui3.js, ui4.js: page redesign (Nation, Economy, Politics, Military, World, Ledger, Research, News).
- ui5.js: title page, the map / Atlas (applyView, placeLabels, tapAt, clipboard copy).
- ui6.js: buildings, factories, the Works page.
- ui7.js: agenda and cabinet report HTML.
- ui8.js: Build mode. ui9.js: Works board (shares one basket with Build mode).
- ui.css, ui3.css: styles. vendor/pako.js: compression, with its licence.

## Tools
- tools/ledger.py: feature ledger (`--open`, `--check`, `--render`, `--add`). Source: docs/LEDGER.json.
- tools/coord.py: coordination board, gap audit, claim commands, PR check (`board`, `audit`, `pr-check`). Rules: docs/COORDINATION.md.
- tools/fn.py: print one function.
- tools/layout_check.py: Playwright check that every sheet and modal fits (needs dist built).
- tools/works_board_test.py, tools/build_mode_test.py: acceptance tests for ui9.js and ui8.js.
- tools/shots.py: screenshot set (writes shots/, git-ignored).
- tools/map_probe.py, tools/tap_probe.py: Atlas pan, label overlap and tap-target probes.
- Playwright uses system Chrome: `executable_path="/usr/bin/google-chrome"`, `args=["--no-sandbox"]`.

## Build and simulate
- Build: `python3 build.py` (writes dist/long-century.html).
- Century: `node century.js <seed> <player>`, for example `node century.js 7 SWI`. Add `--quiet`
  (or `LC_QUIET=1`) for one summary line; records go to /tmp/lc_last_run.txt. About 70 s for seed 7.
- Century has no year limit; a partial run is not available.

## Budgets
- At most 130 ms per month at 1936 (century.js msPerMonth); becomes 4 ms per day with the daily clock (DAY9).
- Save file at most 1 MB (century.js saveBytes) until SV3; then save time ≤ 300 ms and load ≤ 3 s.
- Map at least 640 px tall.
- Controls at most 8% of the screen.

## Report format (end of every ticket)
100–150 words: commit, observed result with numbers, tests run, first remaining risk. Full logs stay in GitHub artifacts; quote only the first failing test, seed, month and state difference.

## Token rules
- Briefs about 300 words; point at the issue for acceptance checks.
- Read plans by section only, never the whole plan file.
- Screenshots: at most one per review, and only for UI tickets.
- Do not resume a large earlier agent for a fix; start a fresh small one.

No credentials or personal details in code, issues or PRs. Raw Correlates of War files never go into the public repository (docs/MASTER_PLAN.md §1 rule 11).
