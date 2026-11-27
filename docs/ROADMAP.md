# The Long Century: roadmap (features → mechanics → tickets)

Status: 27 Nov 2026 (Claude, ledger B26). This file is the **map of everything**: every feature the owner asked for (ledger), every planned ticket (`docs/MASTER_PLAN.md` §4) and every open issue, grouped by what the player sees. `docs/MASTER_PLAN.md` keeps the ticket details and targets, `docs/DESIGN.md` the mechanics in full, `docs/LEDGER.md` the owner's asks, issue #1 the live board.

How it stays complete: `python3 tools/coord.py audit` fails if a MASTER_PLAN ticket id is missing here, an open ledger row has no issue, or an issue names no ledger row. Change this file in the same PR that adds or retires a plan id.

Legend: ✔ built · ◐ partly built · ○ planned, not started · ? needs design or an owner decision first. `#n` = GitHub issue. Ledger ids are A/B rows.

## 1. Where the game stands

Built and working on `main` (state hash dda070bb, seed 7): 62 playable nations (77 with dormant ones) from January 1836 to 1936, one month per turn, on a 184-province map; same rules for every nation; economy with production, markets, trade, railways, debt and default; society, research, modernisation programmes (Tanzimat); politics and reforms; theatre war with infantry, cavalry and artillery, mobilisation, generals, supply; naval interception and blockade; 104 events and 79 dispatches; Build mode and the Works board; autosave and save slots in IndexedDB; flags for every nation; the £100 million cheat; era sound cues; single-file web build on GitHub Pages; Vite build and Capacitor Android project (scaffolding); the coordination system (board, claims, ledger checks).

Biggest gaps: a dynamic graphics-chip map, a modern UI, an installable Android app tested on the owner's phone, the true-Earth map, the game-theory evaluator, most of the Ottoman-game features, demography, the history ledger, art and music, and the release path.

## 2. Stage order (Android first, owner 27 Nov)

The stages of MASTER_PLAN §3 stay, with two Android stages put in front of the content stages. A stage starts when the previous gate holds; tickets inside a stage can run in parallel when their files do not overlap.

| Stage | Goal for the player | Tickets | Gate |
|---|---|---|---|
| **A. Stable base on a phone** | The game never crashes, saves always reload, and installs on the Galaxy A56 | #27 FX1, #74, #75, #76, #98 SV4, #97 QA2, #99 FX2, #100 FX3, #101 FX5, #102 PF1, #80 AND3, #82 LED3, #96 SEC1, #7 PL2, #10 PL7, FX4, FX6, QA3, QA4, PB2, PB3 #13, PB4 #14, PB5, PL1, SV1, SV2 #8 | Stress tier green (MASTER_PLAN S0 gate); APK installs on the A56 |
| **B. Daily clock, living map, modern UI** | Time runs day by day; armies, fleets and buildings move and appear on a real map; a clean modern interface | DAY0–DAY9, MAP1–MAP4, PROG2, CAUSE1, BAL1, #81 AND4 (go/no-go for Godot), #92 AND8, #91 AND7, #90 AND6, #89 DEC1, #9 PL3a, PL3b, PL4, PL5, PL6, PL8, MP1a/b/c–MP5, #26, #85, UI5, UI2, UI4, FX6, #69 UI1a, UI1b, AR1–AR8 start, #93 MED1 | Owner says "go" on the A56 map; daily engine in calibration bands at 4 ms/day; 7 failing pages pass the layout sweep |
| **C. Alpha on Android** | A first playable slice others can test | LOAD1, NEWS1, PROG1, FD3a/b, FD4, FD5, AI1, UI3, UI9, UI11, SC1, SC3, RL1, RL2, RL3, QA5, #61 | Five testers' pass marks; owner played three builds |
| **D. Performance and provinces** | More provinces without slowing down | PF2, PF3, SO4, MP6, MP7–MP10, #84, WD1–WD4, #11 WD5a, MI6, HI5 | MASTER_PLAN S3 gate |
| **E. Economy, demography, society** | Living population and economy | SOC2, DM1–DM6, EC1–EC6, FI1–FI3, TR1–TR3, #45, #46, #64, #65, SO1a, SO1b, SO2, SO3, FD6, FD7, #5 FD2, #54 | MASTER_PLAN S4 gate |
| **F. Politics, programmes, flavour** | Each nation feels different | PO1–PO6, RS1–RS9, NF0–NF5, HI1–HI4, #67, #56, #83, #49 | MASTER_PLAN S5 gate |
| **G. Diplomacy, war, navy, AI** | Wars and diplomacy that follow history's patterns | DP1–DP7, MI1–MI11, NV1–NV3, AI2–AI6, HI6, HI7, #68, #39, #42, #47 | MASTER_PLAN S6 gate |
| **H. Whole world, art and sound** | Every corner of the map and the era's look and sound | MP11–MP14, AR1–AR8, UI2, UI4, UI6, UI7, UI8, UI10, UI12, UI13, SC2, SC4, CA2–CA5, #6 CA1, #43, #94 MUS1, #41, #70, #66 | Art budgets; every nation playable |
| **I. Release** | On Google Play | RL4, RL5, RL6, SC5, #95 REL1, #40 (1917 scenario) | Phone gate, licences, store checks |

## 3. Feature map

Each table: what the player gets, how it works (the mechanics, short; full text in DESIGN), where it is tracked, and its status.

### F1. Android app and platform (B20, B28, A32, A16)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Installable Android game | Vite builds the multi-file app; Capacitor wraps it; CI builds a debug APK | B20, #80 AND3, RL2 | ◐ project exists, no APK yet |
| Behaves like a phone game | Back button, pause sound in background, safe areas, splash, app storage | #90 AND6 | ○ |
| Never freezes on End month | Month runs in a background worker; one state copy; fallback on main thread | B28, #91 AND7 | ◐ worker file exists, unused |
| Code easy to extend | ES modules, no line over 300 characters, files under 600 lines, lint and type checks | B28, #9 PL3a, PL3b, PL5, PL6 | ○ |
| Fast on mid-range phones | Phone bench mode, 4x CPU throttle in CI, owner runs it on the A56 | PL8, RL3 | ○ |
| Mobile layout | 360–390 px, 125% text, 44 px targets, map ≥ 640 px, controls ≤ 8% | A16, FX6, UI11, #85 | ◐ 74 of 74 screens clean; 7 pages need redesign |
| CI that stays fast and strict | Quick, full, browser, stress, coord tiers; outcome policy | PL1, #7 PL2, #10 PL7, QA3, QA4 | ◐ |
| Public repo hardening | Settings, derived data only, geodata rerun, Pages | PB2 #12, PB3 #13, PB4 #14, PB5 | ◐ PB2 settings done 27 Nov |
| Province ids as data | About 350 province literals move to region tables, so maps and events can change without code | PL4 | ○ |

### F2. The map (B6, B7, A7, A10, A11, B20)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Dynamic living map | PixiJS on the graphics chip: terrain, rivers, sea, borders that change, pan and pinch-zoom, level of detail; go/no-go test on the A56, Godot only on no-go | B20, B29, #81 AND4, MAP1 | ? test first |
| Armies and fleets that move | Positions and paths, day-by-day travel by terrain, rail and sea lanes, battles and sieges shown; command model to confirm (theatre orders with visible armies, or direct control) | B29, B2, DAY3, MAP2 | ? owner choice |
| Buildings and infrastructure appear | Railway segments drawn as built, trains running, scaffolding and progress rings, cities sized by population, canals | B29, DAY4, MAP3, MAP4 | ○ |
| Unit, train and front sprites | Sprite tokens per unit type and ship class, trains, front lines (art) | B27, AR6, #93 MED1 | ○ |
| True-Earth map (Miller) | Historical province shapes from evidence, adjacency and straits from data, provinces generated from CSV | B7, MP1a/b/c, MP2, MP3, MP4, #26 | ◐ crosswalk done |
| More provinces where history needs them | Pilot 186 (Lombardy/Venetia, Peshawar/Kashmir), then batches by region | A10, #84, MP5, MP6, MP7–MP10, MP11–MP13 | ○ |
| Easy to use on a phone | First tap hits, search, region chips, recents, pins, small-province chooser | A11, #85, UI2, MP14 | ◐ |
| Map lenses | Political, diplomatic, population, unrest, industry, railways, terrain, build, trade, supply, culture and religion, naval, fronts, historical | UI4, DM6, FD7 | ◐ some lenses exist |

### F3. Interface and dashboard (A1, B5, B6, A18, A8, B14)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Modern UI | Design system (colours light/dark, type, spacing, shared components) applied page by page; liquid glass optional | B20, A18, #92 AND8, #41, UI5 | ? design first |
| Comprehensive dashboard | National scorecard with trends; every number drills down to provinces and causes | A1, #69 UI1a, UI1b, EC6 | ◐ |
| Decision sheet | Each major choice shows options, the rival's best reply, payoffs, the minister's pick | A27, UI3 (needs AI1) | ○ |
| Ledger, treaty builder, military page | Debts ledger; clause-by-clause treaties; theatres and peace offers | UI6, UI7, UI8 | ○ |
| Undo and year-end review | Undo for orders before End month; each year compares choices with the minister's advice | B14, #61 | ◐ Build-mode undo only |
| History ledger and chronicle | Results against real history; a timeline of the campaign | A27, UI12, UI13 | ○ |
| Tutorial and coach | Punjab scenario walkthrough | UI9 | ○ |
| Accessibility | Checks in CI | UI10 | ○ |
| Buttons keep the scroll | — | A8 | ✔ |
| Cheat, flags | £100 million per press; flags for every nation | A2, B3, B4 | ✔ |

### F4. Time, clock and presentation (B24, B29, B30, B33–B39, A1) — design: [LIVING_WORLD.md](LIVING_WORLD.md)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Daily clock for every system (owner decision 27 Nov) | `G.day` on the real calendar; one scheduler; systems daily, staggered daily or smoothed daily; monthly chances become daily hazards | B24, DAY0–DAY9 | ○ design written |
| End Day button and date controller | End Day replaces End Month; pause, speeds 1–5, auto-pause rules, date always shown | B38, B36, DAY1, DAY8 | ○ |
| Month progress indicator | A small bar beside the date filling as the days of the month pass | B39, B37, DAY8 | ○ |
| Loading screen with history | Public-domain pictures, real quotes with sources (published before 1929), did-you-know facts, loading bar | B30, B37, LOAD1 | ○ |
| Newspaper | Weekly or monthly front page from the game's own events, period style | B34, NEWS1 | ○ |
| Progression system | Meaning to confirm: milestones and achievements, eras, or both | B35, PROG1 | ? owner |
| Progress indicators | Bars and rings on construction, research, programmes, war score, unification | B37, PROG2 | ○ |
| Causal breakdowns | Tap a key number to see its top causes | B33, CAUSE1 | ◐ some "why" sheets exist |
| Monthly turns (until DAY1) | One month per turn; fast-forward stops for decrees | A1 | ✔ (being replaced) |
| Decision note on the time model | Superseded: the owner decided daily on 27 Nov | #89 DEC1 | ✔ decided |

### F5. Saves and performance (A31, B13, B11 budgets)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Autosave, slots, export/import | IndexedDB, worker compression, save to file | A31, SV1 | ✔ |
| Saves always continue the same | Resume checks in quick and full tiers | #98 SV4, QA3 | ○ |
| Smaller, cleaner saves | Epoch 2, compact lossless encoding, same-release saves load | #8 SV2, SV3, SV5, FX4 | ○ |
| 130 ms per month at 1936 | Profile, cache, quarterly demography for small pops, pop merging | #102 PF1, PF2, PF3, SO4 | ○ |

### F6. Economy and production (A6, A5, A29, A23, B15, B11)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Industry that produces | Factories, mines and farms with inputs, staff and methods; one economy for player and AI | A6, B13 | ✔ (LED3 #82 to record) |
| Production methods and investment | Methods per chain (textiles first); private investment, shares, rival capacity | EC1, EC2 | ○ |
| Debt, refinancing, default | Maturities, rates by rank, default rules | EC3, A12 (repay all ✔) | ◐ |
| Every good bought and sold | Commodity coverage with conservation; early buyers for wool, rubber, canned goods | B15, #54, EC4a/b, QA2 #97 | ◐ |
| Oil wells and deposits | Buildable wells; coal, copper, chrome, lead, oil deposits in three grades | A5, #64, A29, #46 | ○ |
| Taxes by category | Separate rates per sector with sector effects | A23, #65 | ◐ |
| Steel and output in historical bands | Calibration fixes | EC5, CA3 | ○ |
| Numbers that add up | Dashboard sums reconcile; no phantom income | EC6, #27 FX1 | ○ |
| No death spirals | Price band 0.25–1.75x with dampening, shortage and access penalties floored at 0.15x, positive opening cash flow and stable radicalism for every country | B32, BAL1 | ○ |

### F7. Food, freight and markets (FD)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Grain freight by route | Freight graph; cost by route length | FD1, #5 FD2 | ◐ |
| Harvests, stores and famine | Stocks, storage, relief and emergency imports; 2–8 famines per century | FD3a/b, FD5 | ○ |
| Punjab grain scenario | Playable from the start screen | FD4, SC1 | ○ |
| Prices and freight for all goods | Price indices 0.6–1.8; routes lens and trade ledger | FD6, FD7 | ○ |

### F8. Trade policy and finance (A28, A30, TR, FI)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Trade page | Treaties, boycotts, tariffs by good group, free trade or protection through bills | A28, #45, TR1 | ○ |
| Canals and straits | Suez, Panama, Kiel as conditional world projects; Straits regime | TR2 | ◐ Suez exists as a great work |
| Treaty ports and customs unions | Unequal treaties, extraterritoriality, Zollverein-type unions | TR3 | ○ |
| Money and banking | Silver, bimetallic or gold standard; central bank; panics spreading; creditor control after default | FI1, FI2, FI3 | ○ |

### F9. Buildings and great works (B5, B8, A24, A22, A4)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Build mode and Works board | One basket for province and national orders | B5, #31 | ✔ / ◐ playtest fixes |
| Railways, forts with level caps | — | A4, A22 | ✔ |
| More buildings and great works | About 20 more buildings, 12 more works by history | B8, #70 | ○ |
| Renovate and restore old works | Renovation path for existing works | A24, #66 | ○ |

### F10. Demography and society (DM, SO)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Population that lives | Births and deaths from food, health, cities, literacy; religion on pops | DM1, DM2, SO2 | ○ |
| Jobs and classes change | Promotion and demotion between pop types | DM3 | ○ |
| Migration and emigration | One rule for internal and Atlantic migration | DM4, SO1b | ◐ emigration exists |
| War costs people | Mobilisation and casualties remove workers | DM5, MI10 | ○ |
| Schools and skills | Schools, colleges, skills speed method adoption; literacy in band | SO1a, CA5 | ◐ |
| Culture and minorities | Acceptance, assimilation, grievance, religion | SO3, WD2 | ○ |
| Demography page | Page and lens | DM6 | ○ |

### F11. Politics and reform (PO, A30)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Interest groups and bills | Group influence from jobs and ownership; bills, coalitions, votes with a pivotal group | PO1, PO2 | ◐ reforms exist |
| Strata, standard of living, radicalism, legitimacy, laws (asked in AI Studio) | Needs by strata drive standard of living; radicalism against expectations; eight interest groups with clout; legitimacy and law enactment | B31, SOC2 | ○ |
| Services and grievances | Unfunded mandates show shortfalls | PO3 | ○ |
| Elections and franchise | ≥ 10 reforms per century | PO4 | ○ |
| Revolts, secession, civil war | One rule (now only the scripted US civil war) | PO5 | ◐ |
| Cabinet | Ministers and their advice | PO6 | ◐ |
| Citizenship, influence, war goals, crises, supply | From the Ottoman game | A30, #68 | ◐ |

### F12. Research, modernisation and programmes (A14, RS)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Research with eras and prerequisites | Tech tree, adoption dates near history | RS1, RS2 | ◐ |
| Modernisation projects | Administration, army, navy, education, constitution as historical projects | A14, #67 | ◐ Tanzimat built |
| Programmes for every reformer | Meiji, German and Italian unification, China, Siam, Egypt, Persia | RS3, RS4, RS5, RS7, RS8, #49 | ◐ |
| Programmes panel | — | RS6 | ○ |
| Inventions that diffuse | First adopter varies by seed | RS9 | ○ |

### F13. Diplomacy and influence (DP, A27)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Treaties that do things | Executable clauses (transit first); negotiation accept, counter, defer, refuse | DP1, DP2, UI7 | ◐ transit exists |
| Subjects and colonies | Blocs, colonial administration, princely states | DP3 | ◐ |
| Alliances, congresses, coalitions | Calibrated to history; ≥ 3 congresses per century | DP4, DP5, #68 | ◐ |
| Great-power ranking and spheres | NMC top 8 at 1914 | DP6 | ◐ |
| Influence as a currency | Market access, investment rights, crisis backing | DP7, A30 | ○ |

### F14. Military and war (B2, B12, A19, A20, MI)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Theatre command | No army selection; infantry, cavalry, artillery distinct; stances | B2 | ✔ (LED3 #82) |
| Mobilisation and generals | — | B12 | ✔ |
| Battles that are fair, not lottery | Cap luck so the stronger side usually wins | A19, #76 | ○ |
| Wars of every kind | War goals in use, colonial wars, successor-state wars, Great War audit, frequency by decade | MI1, MI6, MI7, MI8, MI9, #74 | ◐ |
| Armies of the right size | NMC calibration | MI2 | ○ |
| Supply and peace | Supply through freight; peace valuation and clause executor | MI3, MI4, A30 | ◐ |
| Wars end | Exhaustion and talks | #99 FX2 | ○ |
| Total war economy | Factories to arms, rationing | MI11 | ○ |
| Conquer Egypt and Libya, invade Greece | Land routes exist; crash fix | A20, #74 | ◐ |
| Recruit through the shared order path | — | B1, #75 | ○ |

### F15. Navy (A7, A13, A15, A21, B11, NV)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Interception and blockade | — | B11 | ✔ |
| Red Sea fleet returns to the Mediterranean | — | A15 | ✔ (LED3 #82) |
| Naval training and quality | Training separate from equipment | A13, #39 | ○ |
| Bulk refit | Refit design, then one order for many ships | A7, #47 | ○ |
| Shipyards and unique ships | Named yards, US yards, capacity and queues | A21, #42 | ○ |
| Navy acting on freight | Blockade cuts deliveries; patrols protect lanes | NV1 | ◐ |
| Naval races and limits | Repeated game with a treaty option | NV2 | ○ |
| Coaling stations and reach | Fleets beyond reach lose readiness | NV3 | ○ |

### F16. History, events and national flavour (A3, A9, B9, B18, NF, HI)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Events and chronicle | 104 events, 79 dispatches | B9 | ✔ |
| Missing events (Europe, Americas, Asia, Africa, Oceania) | Built from sources, one pilot first | B18, #56 | ○ |
| Ottoman-game parity | Event-level audit against Devlet-i Aliyye | A3, A9, #83 | ? needs ottoman1911.html |
| Events as data, journals | Region tables and actor roles; staged journals | HI1, HI2, HI7 | ○ |
| Unification and colonisation | Consent and integration; the Scramble | HI3, HI4 | ○ |
| Settlements and regional anchors | Post-war new states; Punjab 1839–49, India 1857, Meiji, Taiping | HI5, HI6, WD4 | ○ |
| National flavour packs | Modifiers, AI inclinations, programmes and decisions as data | NF0–NF5, WD1, #101 FX5 | ○ |

### F17. AI and game theory (A27, AI)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| One evaluator for adviser and AI | Legal actions incl. waiting, payoffs by horizon, rival's best reply, runner-up, reversal condition | AI1 | ○ |
| AI building, budget, war, bills | Through the evaluator | AI2, AI3, AI4, #100 FX3 | ◐ heuristics |
| Personalities and speed | Pack inclinations; caching | AI5, AI6 | ○ |
| Games shown to the player | Deterrence, coalitions, arms races, tariffs, scramble, unification, reform, debt | A27, #68, UI3 | ◐ |

### F18. Scenarios and campaign (A17, SC)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Any nation from 1836 | Same rules | B1 | ◐ (#75, #101) |
| Start screen with scenarios | Punjab grain, Sikh Empire 1839, bookmarks 1861, 1871, 1914 | SC1, SC3, SC4, SC5 | ○ |
| Every nation plays fair | Parity runs | SC2 | ○ |
| 1917 Arab Compact scenario to 1945 | Design first; interwar, WWII, 1945 ending | A17, #40 | ? design |

### F19. Art, media and sound (A18, A25, A26, B19, B27, AR)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Original art only | Our own, public domain or CC0; manifest and CI check | B19 | ✔ |
| Map art | Icons, emblems and flags, coasts and sea, relief, cities and infrastructure, war on the map, scenes, credits | AR1–AR8 | ○ |
| Pictures and sprites | Media pipeline, loaded when shown | B27, #93 MED1, A25, #43 | ○ |
| Old-book look | Optional theme (owner 27 Nov) | A18, #41 | ○ optional |
| Sound and music | Cues ✔ (PR #55); music by era | A26, #94 MUS1 | ◐ |

### F20. Quality, calibration and history check (QA, CA, FX)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Stress tier | 316 centuries, resume checks, fuzzing, interface sweep | QA1 | ✔ |
| Conservation and resume checks | — | #97 QA2, QA3, #98 SV4 | ○ |
| Owner playtest loop | Feedback link on each Pages build | QA5, RL6 | ○ |
| Calibration against history | COW wars and capabilities, Maddison GDP, HYDE population, literacy | #6 CA1, CA2, CA3, CA4, CA5, #13 | ◐ |
| Engine fixes from stress | Phantom income, endless wars, treasury, save size, tags, layout | #27 FX1, #99 FX2, #100 FX3, FX4, #101 FX5, FX6 | ○ |
| Germany forms near 1871 | Unification route | B13, #49, RS4 | ○ |
| Rebuild like Victoria 2, same rules | Tag-free core, shared order path | B1, #75, #101 | ◐ |

### F21. Release, commercial and security (B25, RL)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Alpha with testers | Five testers, pass marks | RL1 | ○ |
| Installable web app | Offline, icon, full screen | RL2 | ◐ scaffolding |
| Phone gate on the A56 | Budgets met on the device | RL3 | ○ |
| Google Play release | Account, closed test, signing, privacy policy, Data safety, listing, pricing | B25, #95 REL1, RL4 | ? owner decisions |
| Security | Dependency checks, secret scanning, CSP, no network calls, key custody | B25, #96 SEC1 | ○ |
| Release notes and version stamp | — | RL5, RL6 | ○ |

### F22. Process and coordination (B16, B17, B21, B22, B23, B26)

| Feature | Mechanics | Tracked in | Status |
|---|---|---|---|
| Ledger, board, claims, intake | docs/COORDINATION.md, tools/coord.py | B16, B23 | ✔ |
| Branch protection and CI | PR required, no bypass, quick/full/coord | B17, B21, PB2 | ✔ |
| AI Studio's reverted ideas redone properly | Market access, price limits, construction queue, askSheet | B22, #86 AND5 | ○ |
| One roadmap, nothing missed | This file and the audit check | B26, #88 | ✔ with this PR |
| Ledger catches up with audits | A6, A15, A16, B2, A26; A1 back to partial | #82 LED3 | ○ |

## 4. Still to design before tickets can be written

1. **Map stack decision** (#81): PixiJS go or Godot no-go, on the owner's phone.
2. **Daily clock** (DAY0): decided daily by the owner; design in LIVING_WORLD.md awaits approval and the command-model choice.
3. **Modern UI design system** (#92): owner approves the look before pages are rebuilt.
4. **Media plan** (#93, #94): sprite style for units, buildings and trains; picture sources; synthesised or recorded music.
5. **1917 scenario** (#40): the divergence, entry state and a playable path to 1945.
6. **Ottoman parity** (#83): needs `ottoman1911.html` added to the repo.
7. **Release model** (#95): free or paid, Play closed test, privacy policy.
8. **Flavour packs** (NF0): the data schema every nation's specifics will use.
9. **Evaluator** (AI1): the shared game-theory core behind the adviser, the AI and the decision sheet.

## 5. Owner decisions waiting

| Decision | Ticket | Needed before |
|---|---|---|
| Command model: theatre orders with visible armies, or direct control | DAY0 | DAY3 and MAP2 |
| What "progression system" means | PROG1 | PROG1 |
| Map: PixiJS go or Godot | #81 | Stage B map and art work |
| Modern UI design approval | #92 | Page rebuilds |
| Add `ottoman1911.html` to the repo | #83 | Ottoman parity tickets |
| Free or paid, and store account | #95 | Stage I |
| Synthesised or recorded music | #94 | Music work |
