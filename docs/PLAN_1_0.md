# The Long Century 1.0: final plan

Status: approved direction (plan v3, B58) turned into a work plan on 27 Nov 2026 (Claude, ledger B59). Launch target: **Google Play, about 12 April 2027.** What comes after 1.0 is in `docs/PLAN_1_1.md`. Every open ticket carries a milestone label (`M0` to `M4` or `v1.1`) and one agent label (`for:codex`, `for:aistudio`, `for:owner`, `for:claude`).

## 1. What 1.0 is

A 19th-century grand strategy game for Android phones, fully offline, 1836 to 1936, every nation under the same rules. Daily clock (option B): days pass for armies, fleets, construction and the date; economy and society settle monthly. A 2.5D PixiJS map where armies march, fleets sail and railways grow. About 400 provinces drawn from historical regions, up from 184 (owner, B61): enough to feel full, still easy to tap on a phone. Five polished hero nations (Britain, Ottoman Empire, Sikh Empire, Prussia, United States), all 62 nations playable. Modern UI, newspaper, loading screen with history, era music, achievements. Free download with opt-in rewarded ads and one Full Edition unlock. Scope details: `docs/PLAN_V3.md` section 3.

## 2. Who does what (Claude minimal after 27 Nov 2026)

| Who | Does | Does not |
|---|---|---|
| **Codex (GPT)** | All game code: engine, map, UI, Android, CI and night jobs, tests. Reviews AI Studio PRs that touch `src/`. | Art direction, research |
| **AI Studio (Gemini)** | Research, writing and media: history research and event data, newspaper and loading texts, style guide, pictures, sprites, music, store listing, closed-test kit, release and revenue documents. Reviews Codex PRs for plain-English text and history. Delivers only by PR. | Engine code in `src/*.js` (after the PR #77 repair) |
| **Claude** | One weekly review (#166): milestone gates, spot-checks of PRs, ledger and audit. Rare design calls when an agent is stuck. | Day-to-day implementation |
| **Owner** | Merges green PRs in a daily 15-minute window; plays the nightly APK on the A56 on Fridays; decides open questions. | Coding |
| **GitHub (automation)** | Night shift (#162), CI gates, board refresh, claims, ledger and coord checks. | — |

Review without Claude: a PR merges when (1) CI is green, including `coord`, (2) the other AI agent has left an APPROVE comment against the ticket's acceptance checks, and (3) UI or media PRs carry one screenshot from the nightly build. Claude's weekly review spot-checks merged PRs and reopens anything that missed its checks.

## 3. Night shift: GitHub's free resources

The repository is public, so standard GitHub Actions runners cost nothing. Heavy work runs from 00:00 to 07:00 Pakistan time (19:00 to 02:00 UTC) and reports by morning.

| Free resource | Used for |
|---|---|
| Actions, scheduled (night) | NIGHT1 (#162): nightly APK and web build, stress tier with resume checks, 8-seed calibration, layout and tap probes, phone bench with CPU throttle, ledger and coord audit, morning report |
| Actions, on push and PR (day) | quick tier on pushes; full tier, coord and browser checks on PRs only (PL2 #7 keeps the day light) |
| Releases | `nightly` APK every night; numbered test APKs for the closed test; 1.0 build artifacts |
| Pages | the web build (`/nightly/` and the latest release) for quick checks and the itch.io demo source |
| Issues and issue forms | tickets, owner requests, tester feedback form (TEST1 #165), the Night report issue (#167) |
| Discussions | tester community during the closed test (owner turns it on in Settings) |
| Labels and the board (issue #1) | milestones M0 to M4 and v1.1, agent labels, generated board |
| Dependabot and CodeQL | dependency updates and code scanning, both free for public repositories (SEC1 #96) |
| Codespaces (personal free hours) | an emergency browser-based workspace if an agent's own environment fails |

## 4. Rhythm

| When | Who | What |
|---|---|---|
| Every night, 00:00 PKT | GitHub | NIGHT1 jobs; morning report on the Night report issue |
| Morning | Codex, AI Studio | Read the morning report; fix red jobs first; then the next Ready ticket in the current milestone |
| Daily, 15 minutes | Owner | Merge green, cross-approved PRs |
| Friday | Owner | Install the nightly APK, play 20 minutes, one feedback issue |
| Weekly | Claude | #166 review comment |
| Milestone end | Owner + Claude | Gate check; move unfinished tickets; plan changes only here |

Work limits: at most 3 tickets in progress at once (Codex 2, AI Studio 1); Ready holds the current milestone only.

## 5. Milestones and tickets

### M0 Phone proof (30 Nov to 13 Dec 2026)

**Gate:** The APK from the nightly Release installs on the Galaxy A56; the owner gives the PixiJS map a go or no-go; one in-game year on the phone without a crash; the morning report arrives every day.

| Ticket | Work | Agent | Note |
|---|---|---|---|
| #7 | PL2: CI minutes diet (full tier only when ready, docs skip CI, balanced sha | Codex | CI diet; heavy jobs move to night |
| #27 | FX1: phantom factory output and save/resume divergence | Codex | resume fix; unblocks saves and DAY1 |
| #31 | Playtest: finish almost-complete construction and streamline national order | Codex | finish PR #32 |
| #74 | A20: declareWar crashes with an object war goal (reading 'inf') | Codex | crash fix |
| #80 | AND3: Android test APK built by CI on every merge | Codex | APK built by CI |
| #81 | AND4: PixiJS map phone test (go or no-go for Godot) | Codex | connect PixiJS map, then A56 go/no-go |
| #82 | LED3: fold the AUD4/AUD5 audit results into the ledger | Codex | ledger audit fold |
| #90 | AND6: Android app basics (back button, sound pause, storage, splash) | Codex | back button, pause, splash |
| #98 | SV4: save and reload check in the quick tier | Codex | save/reload check in quick tier |
| #142 | DEP1: publish the full app: web build on Pages, APK on releases | Codex | nightly APK on Releases, web on Pages |
| #146 | CHEAT1: cheat only in test builds, removed from the public release | Codex | cheat in test builds only |
| #162 | NIGHT1: night shift on GitHub Actions | Codex |  |
| #125 | AIS1: historical research assistant with Google Search grounding | AI Studio | research assistant; output feeds #159 |
| #160 | B45d: quality-of-life lead plan | AI Studio | QoL plan document; Codex builds it in M1 and M2 |
| #12 | PB2: harden the public repo (workflow permissions, fork PRs, branch protect | Owner | branch protection: Do not allow bypassing |
| #166 | REVIEW: weekly plan review | Claude |  |
| #147 | HP1: province plan of about 400 historical regions | AI Studio | p1: the list and count first; owner approves |

### M1 Living map (14 Dec 2026 to 17 Jan 2027)

**Gate:** Days pass with End Day and speeds 1 to 5; armies, fleets and railways visibly move or grow; pan at 30 fps or more on the A56 during play; 0 resume drift in the night stress run.

| Ticket | Work | Agent | Note |
|---|---|---|---|
| #14 | PB4: re-run the geodata workflow in the public repo | Codex | geodata rerun for MAPDATA1 |
| #85 | A11: first tap selects the province at 380 px | Codex | first tap |
| #91 | AND7: run the month in a background worker | Codex | tick in the worker |
| #99 | FX2: endless wars end through exhaustion and talks | Codex | wars end |
| #100 | FX3: no nation stays in the red for years | Codex | no endless deficits |
| #102 | PF1: find what makes late-game months slow | Codex | profile slow months |
| #105 | DAY1: day clock and End Day button replacing End Month | Codex | day clock, End Day |
| #106 | DAY2: scheduler for daily, staggered and smoothed systems | Codex | light scheduler for option B only |
| #107 | DAY3: movement and war on the daily clock | Codex | movement and war daily |
| #108 | DAY4: construction on the daily clock | Codex | construction daily |
| #112 | DAY8: date controller and month progress bar | Codex | date controller |
| #114 | MAP1: PixiJS map renderer with layers and level of detail | Codex | PixiJS renderer |
| #115 | MAP2: armies and fleets move on the map | Codex | armies and fleets move |
| #116 | MAP3: buildings and infrastructure appear on the map | Codex | buildings appear |
| #136 | MAP5: easy, enjoyable theatre controls on the map | Codex | theatre controls |
| #141 | PL9: tests and tools run on the full app, not only the single HTML file | Codex | tests on the full app |
| #144 | MAPDATA1: province shapes as a geometry asset, not SVG paths in world.js | Codex | geometry asset |
| #149 | SEA1: sea areas (sea zones) for fleets, trade and blockades | Codex | sea zones for fleets |
| #157 | B45a: music lead plan, era-accurate and licence-free music | AI Studio | start early: research and sourcing; tracks due in M2 |
| #158 | B45b: creative and art lead plan, images, animation and map art | AI Studio | start early: style guide due before MAP1 art; pictures in M2 |
| #159 | B45c: history lead plan, events for every country and region | AI Studio | start early: research; 60 events due in M2 |
| #170 | PL4: province ids as data | Codex | p1: required before any province batch |
| #148 | HP2: scale test at 450 provinces (target about 400) | Codex | p1: a 450-province test world holds the A56 budgets |
| #171 | HPD1: province data, Europe and the Ottoman Empire | AI Studio | p1 |
| #172 | HPD2: province data, South Asia and North America | AI Studio | p1 |

### M2 Vertical slice (18 Jan to 14 Feb 2027)

**Gate:** Britain, Ottoman Empire, Sikh Empire, Prussia and the United States polished: design system and 6 core screens, newspaper, loading screen, about 60 new events, 40 pictures, 6 music tracks, tutorial, adviser showing the rival's best reply. Five outside testers play 2 hours each and rate fun 7/10 or better. Fallback: Prussia and the USA finish in M3.

| Ticket | Work | Agent | Note |
|---|---|---|---|
| #61 | B14 annual review: compare player choices with the minister’s advice | Codex | year-end review |
| #68 | A27/A30: deterrence, coalitions, crises and score against history | Codex | adviser with rival best reply |
| #69 | A1/B5/B6: comprehensive dashboard and page parity with Devlet-i Aliyye | Codex | dashboard parity |
| #92 | AND8: modern UI design system (liquid glass optional) | Codex | design system |
| #119 | NEWS1: the newspaper | Codex | newspaper |
| #120 | PROG1a: eras that change the campaign (1836-1936) | Codex | eras |
| #121 | PROG2: progress indicators everywhere something grows | Codex | progress bars |
| #122 | CAUSE1: causal breakdown on every key number | Codex | why-breakdowns |
| #124 | BAL1: balance guardrails against death spirals | Codex | death-spiral guardrails |
| #143 | AUD3: one sound system (merge SND cues and AI Studio's AUD) | Codex | one sound system |
| #145 | UIR1: rebuild every page and sheet on the modern design system | Codex | 6 core screens only; rest 1.1 |
| #56 | H6: build the missing historical events from scratch (DeepSeek files set as | AI Studio | event data from research |
| #83 | A3/A9: Ottoman game parity audit at event level (needs ottoman1911.html in  | AI Studio | Ottoman parity audit (needs ottoman1911.html) |
| #93 | MED1: media pipeline for pictures, unit and building sprites | AI Studio | sprites and tokens |
| #94 | MUS1: music of the era | AI Studio | era music sourcing |
| #118 | LOAD1: loading screen with history, quotes and facts | AI Studio | loading screen texts |
| #126 | AIS2: newspaper headline and story templates (built offline) | AI Studio | headline templates |
| #130 | AIS6: AI art pipeline (style guide, backgrounds, event pictures, portraits, | AI Studio | 40 event pictures |
| #131 | AIS7: AI music for each era (Lyria) | AI Studio | AI music |
| #150 | GW2: historical great projects for every region and nation | AI Studio | great projects data |
| #174 | HPW1: wire new provinces, Europe and the Ottoman Empire | Codex | p1 |
| #175 | HPW2: wire new provinces, South Asia and North America | Codex | p1 |
| #173 | HPD3: province data, rest of the world | AI Studio | p1 |

### M3 Closed test (15 Feb to 21 Mar 2027)

**Gate:** All 62 nations under the same rules; wars end; ads and unlock behind a switch; consent, privacy policy, Data safety, crash reports; 25 testers opted in for 14 days; 99.5% crash-free sessions; Play production access granted.

| Ticket | Work | Agent | Note |
|---|---|---|---|
| #6 | CA1: like-for-like calibration (wars by kind, states destroyed by cause, In | Codex | calibration |
| #8 | SV2: save epoch 2 (drop old-save code, refuse older saves) | Codex | save epoch 2 |
| #10 | PL7: outcome policy and 8-seed tier | Codex | 8-seed outcome tier |
| #13 | PB3: calibration on derived COW aggregates only | Codex | derived COW data |
| #46 | A29 Resource deposits in three levels | Codex | deposits |
| #47 | A7: ship refit design first, then bulk refit order | Codex | bulk refit |
| #49 | B13: Germany forms 1868-69 on seeds 7 and 11 (history: 1871) | Codex | Germany timing |
| #54 | B15: wool has no consumer (no early buyer before 1860) | Codex | wool buyer |
| #64 | A5: oil wells as a buildable province building | Codex | oil wells |
| #75 | B1: recruitment through execCommand; check that a started fort is charged | Codex | recruitment path |
| #76 | A19: battle results swing too widely between seeds | Codex | fair battles |
| #96 | SEC1: security baseline for a commercial app | Codex | security baseline |
| #97 | QA2: conservation checks for goods, money and people | Codex | conservation checks |
| #101 | FX5: remove nation tags from core rules | Codex | no tags in core |
| #134 | REV2: ads and in-app purchases in the Android app | Codex | ads and unlock behind a switch |
| #135 | REV3: consent screen, privacy policy and Play forms | Codex | consent, privacy, Play forms |
| #139 | PROG1b: national milestones and the beat-history score | Codex | achievements |
| #163 | CRASH1: crash reports with consent | Codex |  |
| #95 | REL1: commercial release plan (Google Play) | AI Studio | Play release plan |
| #133 | REV1: revenue design (ads, purchases) for the owner | AI Studio | revenue design for the owner |
| #165 | TEST1: closed test kit | AI Studio |  |
| #176 | HPW3: wire new provinces, rest of the world | Codex | p1 |

### M4 Launch (22 Mar to 12 Apr 2027)

**Gate:** Store listing, trailer and launch posts done; 1.0 live on Google Play.

| Ticket | Work | Agent | Note |
|---|---|---|---|
| #164 | STORE1: store listing, screenshots, trailer | AI Studio |  |

Tickets per milestone and agent:

| Milestone | Codex | AI Studio | Owner | Claude |
|---|---|---|---|---|
| M0 | 12 | 3 | 1 | 1 |
| M1 | 20 | 5 | 0 | 0 |
| M2 | 13 | 10 | 0 | 0 |
| M3 | 19 | 3 | 0 | 0 |
| M4 | 0 | 1 | 0 | 0 |

## 6. Definition of done (every ticket)

1. Acceptance checks in the ticket are ticked with evidence (numbers, screenshot or night-report link).
2. Works in the nightly APK on the A56 (UI, map and Android tickets).
3. Save, reload and continue gives the same state; the state-hash change is named and explained.
4. Ledger row updated (`done` with date and probe, or `partial` with the follow-up ticket).
5. Assets: licence or AI prompt logged in `docs/ASSETS.md`.

## 7. Risks and fallbacks

| Risk | Sign | Fallback |
|---|---|---|
| PixiJS map too slow on the A56 | under 30 fps after fixes in M0 | lower detail levels first; Godot only as a last resort (owner decision) |
| Five hero nations too much for M2 | M2 gate missed by more than a week | Prussia and the USA finish in M3; launch date holds |
| Codex or AI Studio limits run out | no PRs for 3 days | the night shift keeps testing; owner reorders Ready; Claude covers one blocking ticket |
| About 400 provinces too slow or too small to tap on the A56 | HP2 #148 scale test at 450 misses budgets in M1 | settle the count lower (350) before the data tickets start; map level of detail; quarterly updates for small provinces |
| Closed-test dropouts | fewer than 12 testers active | recruit 25 to 30; the 14-day clock restarts only if under 12 |
| Save size grows with daily state | night bench over budget | compact save (SV2/SV3) moves from 1.1 into M3 |

## 7a. Province count (owner, 28 Nov 2026, B61)

Target **about 400 provinces** (range 350 to 450), up from 184. Not the full historical count (over 1,000), which would make provinces too small to tap and the phone too slow. Rules for the province plan (HP1 #147):
- A province is a historical region or a group of first-level units (for example Brittany or the Rhine Province), never a modern border.
- Denser where the history happens and where the hero nations play: Europe, the Ottoman lands, India, China and Japan, the eastern United States. Sparse in Siberia, the Sahara, the Amazon and the Canadian north.
- Every province at least about 44 px across at the zoom where it is chosen on a 390 px screen, or reachable by search.
- The scale test (HP2 #148) runs a 450-province world first; if it fails the A56 budgets, the count settles lower before the data work starts.

Rough split of the 400: Europe 150, Ottoman lands and the Middle East 45, South Asia 50, East and South-East Asia 55, the Americas 60, Africa 25, Russia in Asia and Central Asia 15.

### Province plan totals (HP1 #147, from `data/provinces/plan.csv`)

| Region | Current (184) | Planned 1.0 (B61) | Direct tap (>=44 px) | Flagged for search |
|---|---:|---:|---:|---:|
| Europe | 54 | **150** | 80 | 70 |
| Ottoman lands and the Middle East | 17 | **45** | 39 | 6 |
| South Asia | 13 | **50** | 48 | 2 |
| East and South-East Asia | 31 | **55** | 53 | 2 |
| Americas | 38 | **60** | 57 | 3 |
| Africa | 25 | **25** | 25 | 0 |
| Russia in Asia and Central Asia | 6 | **15** | 15 | 0 |
| **Total** | **184** | **400** | **317** | **83** |

**Hero nations (1836 snapshot):**

| Hero nation (1836 tag) | Current provinces | Planned 1.0 provinces | Direct tap | Flagged for search | Notes |
|---|---:|---:|---:|---:|---|
| Britain (`GBR`) | 17 | **58** | 44 | 14 | 13 British Isles, 38 India/Ceylon (incl. Cis-Sutlej), 3 Canada, 2 Australia, 1 West Indies, 1 Cape Colony |
| Ottoman Empire (`OTT`) | 9 | **26** | 20 | 6 | 10 Balkans, 11 Anatolia & Cyprus, 4 Mesopotamia/Diyarbekir, 1 Tripolitania |
| Sikh Empire (`PUN`) | 3 | **8** | 8 | 0 | Lahore, Jullundur, Rawalpindi, Multan, Derajat, Peshawar, Kashmir, Jammu (Cis-Sutlej under GBR per 1809 treaty) |
| Prussia (`PRU`) | 5 | **10** | 10 | 0 | Brandenburg, Prussian Saxony, Pomerania, Posen, East & West Prussia, Lower & Upper Silesia, Westphalia, Rhine Province |
| United States (`USA`) | 6 | **14** | 14 | 0 | 14 states/territories in 1836 (Great Plains, Oregon, Texas, California & New Mexico adjacent) |

Full historical unit census (2,164 first-level units, 1836–1936) and grouping crosswalk: `data/provinces/census.csv` and `docs/PROVINCE_CENSUS.md`.


## 8. Decisions still with the owner

- Turn on "Do not allow bypassing" for main (#12) and Discussions in Settings.
- Play account: personal (12 testers, 14 days) or organisation (D-U-N-S number).
- Unlock price (suggested $4.99 with regional pricing).
- Approve the province list from HP1 #147 (about 400).
- Check the government service conduct rules before any revenue.
- Add `ottoman1911.html` to the repository (#83).
