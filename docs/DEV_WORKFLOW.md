# The Long Century: Development Workflow and Token Strategy

Status: plan (23 Nov 2026). Repository: `PrinzKutlump/long-century` (public). Default branch: `main`.
First CI run on `main`: all 31 engine test files passed and the seed 7 century run finished; the run took about 19 minutes.

## 1. Goals

1. Every change is small, reviewable, tested on GitHub, and can be undone on its own.
2. Agents start warm (they read a short repo guide automatically) and never run the slow suite themselves.
3. The owner plays a fresh build after each merged ticket, on a phone, with no setup.
4. Token use per ticket is about half of today's (today: 100k–360k tokens per agent).

## 2. Repository layout (target)

| Path | Contents |
|---|---|
| `CLAUDE.md` | One-page agent guide, loaded automatically by every Claude session that opens the repo. Replaces long briefs. Absorbs `AGENT_NOTES.md`. |
| `src/` | Game code. Split into modules of under 600 lines, no line over 300 characters (see section 6). |
| `tests/engine/` | Node tests (today's `test_*.js`). |
| `tests/browser/` | Playwright tests (`works_board_test.py`, `build_mode_test.py`, `layout_check.py`, `wrap_test.py`). |
| `tools/` | `fn.py`, profilers, probes. |
| `docs/plans/` | Engine, UI/Art, Civilising, GPT plans. The repository becomes the single source; project docs are copies. |
| `docs/tickets/` | One short brief per ticket (about 300 words). |
| `docs/results/` | Evidence files (today's `validation/results`). Screenshots go to CI artifacts, not into git. |
| `dist/` | Not tracked any more. CI builds it and attaches it to each run and release. |

## 3. How a ticket flows

**Roles (owner decision, 24 Nov 2026):** Codex/GPT implements every ticket, including engine, UI, map, art, data tools and CI. Claude plans, writes tickets, supervises and audits; Claude does not write or push code. The owner decides and playtests.

1. **Issue.** Claude opens a GitHub issue from the plan: goal, files and functions to touch, acceptance checks, budgets, labels (`engine`, `ui`, `art`, `balance`, `bug`), and the plan section it implements.
2. **Branch.** `t/<id>-<slug>`, for example `t/a5-research-balance`. One ticket per branch, one agent per ticket.
3. **Implementer.** Codex implements from the issue. It reads `AGENTS.md` and `CLAUDE.md`, uses `tools/fn.py`, and runs only the tests for the code it touched.
4. **Pull request.** The agent opens a PR that links the issue and lists numbers (hashes before and after, ms/month, save size, test counts).
5. **CI.** GitHub runs the checks (section 4). The agent reads only the pass/fail summary and, on a failure, only the failing test's last 20 lines.
6. **Audit.** Claude audits by the protocol in section 3b and posts one verdict on the PR: APPROVE, or CHANGES with numbered items, each tied to a failing check.
7. **Merge.** After an APPROVE verdict and green CI, Claude squash-merges into `main`. The release workflow builds the game and attaches it to a GitHub Release.
8. **Owner.** Plays that build, comments on the issue or PR, or opens a new issue (`feedback` label). Feedback becomes the next ticket.

## 3b. Audit protocol (Claude)

Every PR:
- CI green on all tiers that apply (the century step must be able to fail; see ticket Q0).
- PR body has the report: commit, hash before and after with the reason, ms/month at 1936, save bytes, tests added and run, first remaining risk.
- Diff read against the issue's acceptance list; no unrelated changes.
- House rules: same rules for every nation (player and AI); no network calls in the game; one `<style>` element; new lines under 300 characters, files under 600 lines; disabled buttons say why in plain English; original art only.

Extra for changes that touch money, saves, random outcomes or several systems:
- Claude reruns the ticket's acceptance test and `node century.js 7` in its own checkout and confirms the numbers in the PR.
- Save tickets: an old save (from the latest release) loads, plays a year and saves again.
- Balance tickets: 3 seeds compared with `main` by decade.

UI tickets: one screenshot at 390 px width, checked for fit, 44 px targets and no horizontal scroll.

Verdict wording: APPROVE, or CHANGES followed by numbered items. Claude does not push fixes; Codex does.

Rules: never push to `main` directly; never switch branches in a shared folder (each agent works in its own clone or worktree); each ticket names its hash change and why.

## 4. CI tiers (GitHub Actions)

The free plan gives a private repository 2,000 Actions minutes a month. A full run takes about 19 minutes, so full runs everywhere would allow only about 100 a month. So:

| Tier | When | What | Time |
|---|---|---|---|
| Quick | every push to a ticket branch | build, syntax check, the fast engine tests (under 30 s each), seed 7 run to 1866 | 3–5 min |
| Full | every PR to `main`, and nightly | all engine tests in parallel jobs (matrix of 4), seed 7 full century, seed 3 to 1900 | 6–8 min wall clock |
| Browser | PRs labelled `ui` | Playwright with Chrome: layout check, Works board, Build mode, map probe; screenshots uploaded as an artifact | 6–10 min |
| Release | merge to `main` | build, attach `long-century.html` to a Release with notes from the PR titles | 1 min |
| Seeds | weekly or on label `balance` | 8 seeds × full century, the T table (wars, destroyed states, Germany, Italy, Japan) as a markdown summary | 20–30 min |

Every job ends with one summary line per test, written to the run's summary page so the agent reads a few lines, not logs.

Budget check: about 60 quick + 30 full + 15 browser + 4 seed runs a month ≈ 1,000–1,300 minutes, inside the free 2,000.

## 5. Token strategy

### Where tokens went (measured, 12 agents, about 2.4M tokens)
Cold-start reading of long plans; source lines of up to 83,000 characters; context growing over 80–130 tool calls; long test output and screenshots; fix rounds; supervisor re-checks.

### Rules from now on

| Rule | Saving |
|---|---|
| `CLAUDE.md` in the repo carries the file map, commands, budgets and rules, so briefs are about 300 words and plans are read only by section. | 20–30k per agent |
| `tools/fn.py` for reading functions; no whole-file reads of `src/`. Source split (section 6) removes the long lines for good. | large, on every search |
| One ticket per agent, all acceptance checks in the issue; target under 40 tool calls. Big tickets are split before they start. | fewer snowballing contexts, fewer fix rounds |
| Tests run on GitHub; agents read the summary line. Locally an agent runs only the tests for touched code, in quiet mode. | 10–20% |
| Model routing: planning and reviews on Opus; implementation on Sonnet; mechanical runs (seeds, screenshots, profiling, merges) on Haiku. Routine supervision on Sonnet. | cost, not tokens |
| A fresh small agent for each follow-up fix, never resuming a large one. | avoids re-reading 200k+ of history |
| Screenshots: at most one per review, and only for UI tickets. | about 1.5k each |
| Supervisor checks the PR numbers and CI result; re-runs tests only when the numbers look wrong. | my side |

### Token budget per ticket (target)
- Small (bug, wording, one rule): under 60k.
- Medium (one engine ticket like A5): under 150k.
- Large (programme engine C0, map art V4): split into two or three medium tickets.

The PR template has a line for the agent's token count, so we can see if the budget holds.

## 6. Code health (one-time tickets, before C0)

- **H1 Source split:** break the 83,000-character line and the other long lines into readable functions and files under 600 lines, with no behaviour change (state hash identical on seeds 3 and 7). Biggest single token saving.
- **H2 Lint:** ESLint with a small rule set (no undefined globals, no unused variables) and a formatter, run in the quick CI tier.
- **H3 Type checks without a rewrite:** `// @ts-check` and JSDoc types on the engine's core data (`G`, nations, provinces), checked by `tsc --noEmit` in CI. Catches whole classes of NaN and typo bugs without leaving plain JS.
- **H4 Tests moved** into `tests/engine` and `tests/browser`, with one runner and quiet mode by default.
- **H5 Browser CI:** Playwright with Chrome in Actions (section 4).

## 7. Playtesting and releases

- **Each merge:** a GitHub Release with the single HTML file. On a phone: open the release page, download, open in the browser. Works offline.
- **Private web link:** GitHub Pages on a private repository needs a paid GitHub plan; the private claude.ai artifact stays the zero-cost web link and is republished from each release.
- **Feedback:** an issue template (what you did, what you expected, a save code from Copy text) so every report is reproducible from its save.
- **Milestones:** release B (grain, freight, relief), C (civilising programmes), V (map art); a GitHub Project board shows each milestone's tickets as To do / In progress / Review / Done.

## 7b. First alpha (from the Codex review, adopted)

- **One scenario, five testers.** Punjab grain shortage with a part-funded railway. Task: improve food access, queue a second project, close the game, return later.
- **Watch for:** where they hesitate; whether they can explain why imports helped one province more than another; whether they can find the railway and say how much has been spent; whether they play another session unprompted.
- **Pass mark:** 4 of 5 finish without coaching, 3 return within a week, 5 of 5 recover their saves. Test on the owner's Galaxy A56 plus one slower phone.
- **What it decides:** players return but struggle to reopen → installable app (PWA) first. Players quit because consequences are unclear → spend the next cycle on simulation and interface.
- **Two-agent rule:** Codex implements; Claude audits every PR (section 3b), with a full rerun for changes that touch money, saves, random outcomes or several systems.
- **Measure:** tokens (or model turns) per accepted ticket over ten comparable tickets, alongside reopened tickets and regressions.

## 8. Android (APK): recommendation

**Not now; plan for it after the art and civilising releases.**

- The game already runs offline in a phone browser as one HTML file, so an APK adds no gameplay. It adds signing keys, build tooling, Play policy work and device testing, which would compete with the engine and art work.
- **Step 1 (cheap, soon after V4): make it a PWA** (installable web app: icon, full screen, offline cache, local saves). It installs from the browser on Android without a store and changes nothing in the engine.
- **Step 2 (when release-ready): wrap the same build** with Capacitor or a Trusted Web Activity to produce an Android app bundle for Google Play. Google Play needs a one-time US$25 developer registration with identity verification, and a personal account must run a closed test (about 12 testers for 14 days) before going public.
- **Desktop:** the same build can be wrapped for Windows (Tauri or Electron) for itch.io or Steam. Steam charges US$100 per game, recoupable after US$1,000 in sales.

## 9. Making it professional: tools and resources

| Need | Tool or resource | Cost |
|---|---|---|
| Code, review, CI, releases, board | GitHub (Issues, Projects, Actions, Releases) | free plan is enough now |
| Code quality | ESLint, Prettier, TypeScript checker on JSDoc, Playwright | free |
| Original art | Inkscape (vector map art, icons), Krita (painted scenes), a pixel/icon editor if needed | free |
| Map base | Natural Earth (public-domain coastlines, rivers, relief) for coasts and terrain under the province shapes | free |
| Historical data | Maddison Project (GDP, population), Correlates of War (wars, alliances, state system) to calibrate targets | free for research use; check each licence |
| Fonts | OFL-licensed fonts (Google Fonts) embedded in the build | free |
| Sound (later) | CC0 sound libraries; licence recorded per file | free |
| Distribution | itch.io (simple, allows a restricted page for testers), Google Play, Steam | see section 8 |
| Playtesters | a small group via itch.io restricted page or GitHub Releases; 5–10 testers per release | free |

Licences: every asset gets a line in `docs/ASSETS.md` (source, licence, author), so a future store release is clean.

## 10. Order of work

1. Owner: set the default branch to `main` (Settings → General).
2. W1 (Haiku): `CLAUDE.md`, issue and PR templates, labels, Project board, CI tiers and release workflow, `dist/` out of git.
3. H1 source split (Sonnet, hash-identical), then H2–H5.
4. Engine A5/A6 as the first ticket through the new flow; measure its tokens against the budget.
5. Continue: B, C (civilising programmes), V (map art); PWA after V4; store builds when the game is release-ready.
