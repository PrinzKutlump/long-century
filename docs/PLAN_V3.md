# Plan v3: phone-first 1.0, then updates

Status: **approved by the owner on 27 Nov 2026** (ledger B54): plan v3, daily clock option B, hero nations Britain, Ottoman Empire, Sikh Empire, Prussia and the United States. Written by Claude on 27 Nov 2026 after a director's review of main at commit f1b5323. The full review with charts and diagrams is the doc "The Long Century: Director's Review and Plan v3" (https://claude.ai/artifact/TG19Tp2BfUiXUdaFZLSSoP). Items marked **(owner decision)** wait for the owner's yes. Until then ROADMAP.md stays in force; the M0 work below already fits its Stage A.

## 0. Owner's words (intake, 27 Nov 2026, Claude chat)

> Deeply analyse the game in current status, my plan and all feature in pipeline, who is assigned whta, what is penfing and why, what is unfinished and why. Technical analysis of plan to transition from current status to commercial project. Show in visual chart and diagrams. Modify the olan as per your recommendations. Act as a senior game developer and director and consider all aspects of game development sales and marketing and market research. At the end rate current status and progress of game, rate the plan for transition, hiw much this game idea will be succesful on current trajectory. After analysis, give your recommendations and my options. Add anything that is helpful or stremlines the development.

Planner: add a ledger row for this ask (suggested B44, "Director's review and plan v3"), then turn section 7 into tickets.

## 1. Why the plan changes (evidence, 27 Nov 2026)

- Seed 7 century run on main: completes 1836 to 1936, state hash dda070bb (matches the pin), 16 of 16 quick tests pass, save 977 KB at 1936 (98% of budget), 68 wars, month 85 to 93 ms in the 1930s on the sandbox.
- Ledger: 75 rows; 17 done (4 of them process rules), 8 partial, 10 missing, 38 unverified, 2 closed. A1 is marked done on AI Studio code that PR #77 reverted.
- ROADMAP: 153 features; 18 built, 40 partly built, 87 planned, 8 waiting for a decision. 12 of 23 areas have nothing built, including the map, Android, release and revenue.
- Board (issue #1): 99 Ready, 0 claimed, 3 in review; real claims only in comments.
- Since 24 Nov, 25 PRs merged; 6 changed what a player sees. 24 ledger rows were added on 27 Nov alone.
- No APK has ever been built, so the map go/no-go test on the Galaxy A56 (#81) cannot happen.
- Two commits reached main without a PR on 26 and 27 Nov (AI Studio pushing as the owner's account).
- Plan files contradict each other (MASTER_PLAN rule 13 "web only, no APK" and its roles line; EXECUTION_STRATEGY "APK closed, Claude paused"; STATUS.md from 24 Nov).

## 2. Milestones

| Milestone | Dates | Builds | Gate (all must hold) |
|---|---|---|---|
| M0 Phone proof | 30 Nov to 13 Dec 2026 | FX1 merged; CI builds the APK; PixiJS map connected to the Atlas; phone basics (AND6); doc contradictions fixed; board cleaned | APK installs on the A56; owner's map go or no-go; one in-game year on the phone without a crash |
| M1 Living map | 14 Dec 2026 to 17 Jan 2027 | Daily clock layer (option B); End Day, pause, speeds 1 to 5; month progress bar; armies, fleets and railways drawn and moving; tick in the worker (AND7); exact resume | Pan at 30 fps or more on the A56 during play; 0 resume drift in the stress tier |
| M2 Vertical slice | 18 Jan to 14 Feb 2027 | Five hero nations polished (owner, 27 Nov: Britain, Ottoman Empire, Sikh Empire, Prussia, United States); design system and 6 core screens; newspaper; loading screen with history; art style guide and about 40 pictures; tutorial; adviser with the rival's best reply on war, peace, alliance, tariff and reform | Five outside testers play 2 hours each and rate fun 7/10 or better |
| M3 Closed test | 15 Feb to 21 Mar 2027 | All 62 nations under the same rules; wars that end (FX2); fair battles (#76); achievements; rewarded ads and one unlock behind a switch; consent, privacy policy, Data safety; crash reporting | 25 testers for 14 days; 99.5% crash-free sessions; Play production access |
| M4 Launch | 22 Mar to 12 Apr 2027 | Listing, trailer, launch posts, 1.0 | 1.0 live on Google Play |
| 1.x updates | every 4 to 6 weeks from May 2027 | Demography and society, trade policy and finance, more provinces, navy depth, 1917 scenario, Steam | Crash-free rate and rating hold |

Pace assumed: 1.5 to 2 merged player-facing tickets a day (the rate since 24 Nov), about 120 tickets to launch.

## 3. Scope: in 1.0, or moved to 1.x

Ledger rows are never deleted. Rows whose work moves out of 1.0 get the tag "1.x" in their note.

| Area | In 1.0 | Moved to 1.x |
|---|---|---|
| Platform | App bundle from CI, phone basics, worker, crash reports | Full module split, PL4 province ids as data |
| Map | PixiJS 2.5D map, moving armies and fleets, railways and buildings that appear, 6 lenses, first-tap accuracy | Reshaping beyond 184 provinces, MP5 to MP14 |
| Time and presentation | Daily layer, date controller, month bar, loading screen, newspaper, progress bars | Full daily economy (only if the owner later picks option A) |
| Interface | Design system, 6 core screens, causal breakdowns on key numbers, undo before End Day, year-end review | Treaty builder, history ledger page, full accessibility pass |
| Economy | Current economy, FX1 to FX6, BAL1 guardrails, oil wells (A5), deposits in three grades (A29) | EC1 to EC4, FI1 to FI3, TR3 |
| Society and politics | Current reforms and programmes | SOC2, DM1 to DM6, PO4 elections |
| War and navy | Theatre orders with visible armies, FX2, #76 fair battles, A7 bulk refit | NV2, NV3, MI11, A21 named yards |
| History and AI | 104 events plus about 60 for the five hero nations; AI1 evaluator for adviser and AI on war, peace and budget | NF packs for every nation, AI5 personalities, #40 1917 scenario |
| Art and sound | Style guide, about 40 AI-made pictures with prompts in ASSETS.md, unit tokens, 6 music tracks | Portraits for all, AIS8 video |
| Online and money | Rewarded ads, one unlock, consent (REV1 to REV3) | AIS3 Historian, AIS4 voice, AIS5 cloud saves |

## 4. Daily clock: option B (owner chose it, 27 Nov 2026)

Daily layer: G.day, End Day, speeds, movement, battles, sieges, supply and construction progress run daily (DAY1, DAY3, DAY4, DAY8). Economy, pops, politics and research keep their calibrated monthly settlement, shown to the player as daily accrual. Calibration and saves stay valid. Option A (full daily, DAY0 to DAY9) remains in the ledger as a 1.x choice.

## 5. How the work runs

1. One GitHub milestone label at a time; Ready holds at most 10 tickets of the current milestone; the rest wait under Backlog.
2. At most 3 tickets in progress, one per lane: engine (Codex first), map and interface (Claude), art and text (AI Studio, by PR only).
3. New asks are recorded the same day as now, tagged for the current milestone or the Parking lot. The Parking lot is reviewed at milestone ends.
4. Plans change only at milestone ends, in one PR.
5. One daily merge window for the owner (about 15 minutes). Option: green PRs that touch only docs, tests or tools may merge on their own.
6. Branch protection on main with "Do not allow bypassing" ticked (owner setting).
7. Phone Friday: CI builds the app, the owner plays 20 minutes, notes go into one feedback issue.
8. Done means: works on the A56, saves and resumes, hash change explained, one screenshot for UI tickets.
9. Claude's scheduled review runs once a day and on PR events, not four times a day.

## 6. Owner decisions

- [x] Approve plan v3 milestones and the 1.0 scope cut (27 Nov).
- [x] Daily clock option B (27 Nov).
- [x] Hero nations: Britain, Ottoman Empire, Sikh Empire, Prussia, United States (27 Nov). Risk: five instead of three adds work to M2; if M2 slips, Prussia and the United States finish in M3.
- [ ] Play account: personal (12 testers for 14 days) or organisation (D-U-N-S number).
- [ ] Unlock price (suggested $4.99 with regional pricing); rewarded ads only.
- [ ] Tick "Do not allow bypassing" on main.
- [ ] Check the Punjab Government Servants (Conduct) Rules question on private work before any revenue.
- [ ] Add ottoman1911.html to the repository (unblocks #83).
- [ ] Confirm the 27 Nov choice (2.5D map, visible units, theatre orders) is recorded (PR #138 may do it).

## 7. Planner actions (next agent with GitHub access)

1. Ledger rows B44, B45 and B54 (done in PRs #154 and this one).
2. Create labels M0 to M4, Backlog and Parking; move tickets outside M0 out of Ready.
3. Fix doc contradictions: MASTER_PLAN roles line and rules 3, 5 and 13; EXECUTION_STRATEGY lines on the APK and Claude being paused; mark STATUS.md superseded.
4. Fix the board gaps: ticket for B26; ledger ids for #95, #114, #136, #137, #141 to #151; intake of #153; tickets for PRs #72 and #73; release stale claims on #78 and #79; record Codex's claim on #27 (draft PR #30).
5. M0 tickets: #27 FX1, #80 AND3, #81 AND4 (first connect src/ui/pixiMap.js to the Atlas), #90 AND6; new tickets for a CI job that attaches the APK to UI PRs, for crash reporting, and for the itch.io web demo.
6. Update the scheduled review task to once a day.

## 8. Specialist leads under the main dev (owner request, 27 Nov 2026)

> Under the main dev create a plan of music developer to make era accurate music and to add license free music. Also assign a creative and art developer to research all images and animation and map creation plans, a history nerd to research and improvise a plane consisting of historical events of each country and region. Add a qol dev plan too

Planner: add a ledger row and one ticket per lead. Board: "The Long Century: plan v3" whiteboard (https://claude.ai/artifact/RHENTpextKyq5MHkQqbm8U).

| Lead | Plan |
|---|---|
| Music developer | Research era styles by region, 1836 to 1936; find public-domain scores and CC0 recordings; arrange PD scores and make AI music with prompts logged; log every licence in ASSETS.md; 6 tracks for 1.0 (menu, peace, war, crisis); music follows era, region and war |
| Creative and art developer | Research period maps, uniforms and art (PD only); style guide for map, UI and pictures; map plan (2.5D terrain, coasts, cities, rail); animations (march, sail, battle, build); unit tokens and building icons; 40 event pictures for 1.0 with prompts logged |
| History researcher | Timeline of key events per region with sources; dated, ranked event list per nation; about 60 new events for the five hero nations first; each event a real choice with history's outcome; same rules for every nation; audit the 104 events and 79 dispatches (HI7) |
| Quality-of-life developer | Undo before End Day and confirmation of costly orders; any province in 3 taps; why-breakdown on every key number; alerts inbox with optional auto-build and auto-trade; autosave and quick save; settings for text size, speed and sound |
