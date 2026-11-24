# The Long Century: verified status, 24 Nov 2026

Written by Claude after an audit of both repositories, every plan, the open PRs and a 316-century stress run on GitHub Actions. Replaces `REVIEW_2026-11-24.md` (archived). Updated at each review.

## 1. Verdict

The game is stable under heavy use (0 crashes and 0 broken invariants in 316 full centuries across 16 seats; 0 page errors for all 62 nations over a year of play; 407,016 fuzzed orders without a fault), but four engine defects make long campaigns untrustworthy: **phantom factory income**, **save/resume divergence** (4% of checks), **wars that never end** (up to 28 years) and **treasuries negative for years** (Britain, China). Saves exceed the 1 MB budget in 26% of runs and month time is over budget in the 1930s for most seats. Fix these before features (MASTER_PLAN S0, tickets FX1–FX6).

## 2. Cleanup done

| Item | Action |
|---|---|
| 9 plans in `docs/plans/` and 9 pre-GitHub plans in `docs/checkpoint/`, plus the 24 Nov review | Moved to `docs/archive/` with an index; superseded by `DESIGN.md`, `MASTER_PLAN.md` v2 and this file |
| Project knowledge (claude.ai): 9 copies of repo plans | Reduced to 3: design, master plan, status (the rest live in the repo's archive) |
| Conflicting rules: old saves must load (GPT, engine, UI plans) vs owner's 24 Nov decision | One rules list (MASTER_PLAN §1): compatibility only from the alpha; same-build saves must resume exactly |
| Conflicting implementer: Sonnet/Haiku (engine, civilising, workflow plans, a memory note) vs Codex (CLAUDE.md, master plan) | Codex implements game code; Claude writes plans, tests tooling and docs, audits |
| Conflicting targets: wars 30–45 and states destroyed 8–15 vs COW measurements | One targets table (MASTER_PLAN §T) from COW, Maddison and HYDE |
| Ticket id collisions: "B1–B4" (grain tickets and map batches), "A1–A3" (engine and art), "M0–M8" (milestones, art tickets and `test_m*.js`) | Master plan ids only (FD, MP, AR …); milestones renamed Stages S0–S8 |
| Issue #26 "art/M2a crosswalk candidates" | Stale: the crosswalk (`art/geo/crosswalk.mjs`) was merged in the private repo (PR #17). Re-scope to MP1a (historical shapes, Europe and Middle East) |
| Scheduled review prompt | Still lists the old ticket order and assumes merges succeed; an update (v2 plan, stress report, owner-merge fallback) was refused by the permission classifier and waits for the owner |

## 3. Repositories

- **Public `long-century`** (main f6d0973): a faithful snapshot of the private repo; `src/` and `century.js` are byte-identical to the private main 272544e. No raw COW files. Secret scanning and push protection on.
- **Private `long-Century-`**: frozen archive; all its issues closed with links to the public ones.

### Completed (evidence: merged PRs and code)
Before GitHub: harness and observer test (A0), shared command path (A1), construction lifecycle (A2), one household economy for every nation (A3, comment in `econ.js`), model revision and save defaults (A4), unification gates (G2.2), Build mode and Works board (V2, V2c). On GitHub (private): CI tiers and agent guide (W1), research balance (A5), road to modernisation (A6, A6b), programme engine (C0), Tanzimat (C1), geodata pipeline (M0, release geodata-run-12), projection spike (M1), crosswalk (M2a), Maddison and COW data, calibration report. Public: PB1 snapshot, PB2 workflow hardening (code), PB6 tickets and claims board.

### Open PRs (audited this session)
| PR | Ticket | CI | Verdict |
|---|---|---|---|
| #23 | PL1 CI gates | full green | **APPROVE** (comment posted). Pinned hash `dda070bb…` matches an independent run. Merge first |
| #22 | FD1 freight graph | full green (before the PL1 gate existed) | **APPROVE after PL1**: update the branch so its full run passes the hash gate; one line is 307 characters (nit) |
| #25 | PB5 Pages | green | **Hold** until the owner enables Pages with source "GitHub Actions" (*now* off); otherwise every release run fails at deploy |
| #17–#21 | Dependabot major bumps of five actions | — | Review together in one PR after reading release notes; not urgent |
| t/stress-harness | QA1 stress tier (Claude) | quick green; stress runs | Ready for review |

Merging from this session was refused by the permission classifier, so merges wait for the owner.

### Owner settings pending (PB2)
Branch protection on `main` is **off** (any collaborator can push to main and the CI gates are advisory); Pages is **off**.

## 4. Loopholes and missing context found

1. `main` is unprotected, so the gates do not gate.
2. The PL1 gate checks seed 7 as Switzerland only; the stress tier shows 26% of seeds over the save budget and most seats over the time budget while seed 7 passes. Green CI is not evidence for other nations; the weekly stress tier closes this (QA1, PL7).
3. `test_save_resume.js` checks months 60–120 on seed 7 only; the divergence appears later and on 4% of checks (FX1, SV4, QA3).
4. Reviewers cannot download Actions artifacts from Claude's sandbox; the stress report is printed in the job log (QA4 adds a release asset).
5. Merges by Claude through the REST API may be refused, and the scheduled review prompt (old ticket order) could not be updated from this session; until the owner updates it, reviews may stall silently on merges.
6. 18 nation-tag comparisons remain in core engine files, including a Britain-only `companyBudget` charge in `econ.js` (FX5, NF1).
7. Every century benchmark plays a passive seat (default answers, no orders); the AI nations are the real test. The stress tier adds fuzzed seats.
8. `century.js` profile output still lists "PUN plus player" as provincial participants, stale since A3 (cosmetic).
9. The claude.ai project instructions describe a text simulation and do not mention The Long Century; the owner may want to update them.

## 5. Stress run (GitHub Actions, public repo)

Workflow `stress.yml` on branch `t/stress-harness`: 24 shards × 4 parallel century runs (16 seats × 16 seeds, plus 4 fuzzed seeds × 15 seats), save/resume checks at months 240, 720 and 1080, and an interface sweep of all 62 nations. About 25 minutes wall clock.

| Area | Result |
|---|---|
| Crashes / invariant violations | 0 / 0 (nations, provinces, pops, prices, armies, wars checked every month) |
| Save/resume | **40 of 948 checks diverge** within 12 months of a load |
| Fuzzing | 407,016 orders, 42,226 accepted: 0 exceptions, 0 double spends, 0 refused orders that changed state, 0 treasuries pushed below zero by an order |
| Month time (Node on the CI runner, 1926–36) | median 109 ms, p95 164, max 207; worst single month 1.1 s (JAP and FRA seats slowest) |
| Save size | median 0.98 MB; **82 of 316 runs over 1 MB** (max 1.18 MB) |
| Wars | 44.1 per century (22–72); 1830s 3.5 vs COW 0; 1900s 2.9 vs 6; 1910s 2.8 vs 10; 83% "take a province"; no colonial wars |
| War length | median 11 months, p90 62, **max 337** |
| States destroyed / new states | 17.4 / 3.2 per century |
| Unification | Italy in 70% of runs (all 1859–1870, median 1861); Germany pending a fix to the stress metric (seed 7: August 1866) |
| Japan | westernises in 94% of runs, 1866–85 in 81% |
| Defaults | 0.6 per century; Ottoman never |
| Great powers 1900 | GBR 100%, FRA 98%, USA 96%, RUS 96%, PRU 93%, AUS 86%, SAR 82%, NED 68%, **CHI 49%** |
| Literacy 1900 (median) | GBR 55, FRA 48, PRU 72, USA 72, RUS 8 |
| Treasury | GBR negative in 17 of 256 runs (~182 months each, low −£954k); China in 10 runs (~319 months) |
| Interface | 0 page or play errors in 62 nations; 8,396 layout violations on Research, Military, Politics, Nation, Works (as a page), World, Overview |

### Root cause of the divergence (FX1)
`econMonth` production skips a factory with `if(f.lv<=0||!goodOK(c,f.g))continue;` before recomputing `_out`, `_e` and `_im`. Settlement then pays revenue on last month's `_out` (seed 3: 64 level-0 factories with output at 1856, 104 at 1896: phantom income every month). `_im` is in the save's `SKIP` set, so after a load the stale input multiplier is 1 instead of last month's value and input costs differ. Bisection: copying only the factories' `_im` from the uninterrupted engine into the loaded one removes the divergence. Fix: zero `_out`, `_e` and `_im` when a factory is skipped, and compute `im` where it is used.

## 6. Decisions for the owner

1. **Roles:** keep "Codex implements, Claude audits", or let Claude implement small fixes such as FX1 directly?
2. **Settings:** turn on branch protection for `main` and Pages (source: GitHub Actions).
3. **Merges:** merge PL1 #23 now, then FD1 #22 after its full run; or allow Claude's scheduled review to merge.
4. **Plan v2:** approve the stage order (stability before features; performance before more provinces), religion on pops, and the new tracks (QA, FX, PF, DM, NF, TR, FI, NV).
