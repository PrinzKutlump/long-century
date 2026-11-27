# Feature ledger

Generated from docs/LEDGER.json by tools/ledger.py. Do not edit by hand.
Rules: docs/DEV_WORKFLOW.md section 'Feature ledger'. Done rows stay forever for later audits.

Totals: done 18, partial 8, missing 10, unverified 40, closed 2  (audited 2026-11-25)

## A. Devlet-i Aliyye asks (Ottoman 1911+ game) as carried into the Long Century

| ID | Ask | Status | Ticket or evidence | Done on |
|---|---|---|---|---|
| A1 | Month turns, selectable decisions, comprehensive dashboard | done | Phase 1 simulation engine, causal breakdowns, price/access clamps & state management complete | 2026-11-26 |
| A2 | Cheat button in Settings, +100M per press | done |  | 2026-11-25 |
| A3 | Refine gameplay, more historical events, refined military and naval system | unverified | audit vs Ottoman artifact |  |
| A4 | Build railways | done |  | 2026-11-25 |
| A5 | Build oil wells | partial | oil good exists, no well building found; needs ticket |  |
| A6 | Trade, resource extraction, industry that produces | unverified | audit |  |
| A7 | Refit ships in bulk, not one by one | missing | ticket #47 |  |
| A8 | Buttons must not jump the page scroll | done | Settings sheet keeps scroll, merged PR #50; Economy page ok | 2026-11-25 |
| A9 | More unique events, policies and systems, interlinked | unverified | audit |  |
| A10 | Map: Balkans, Caucasus, Crimea, Suez, Egypt areas joined to Libya | unverified | map has 184 provinces; Egypt/Libya/Crimea/Balkans/Caucasus present as regions (CAI Lower Egypt, ASW, SAE, TRP, ODE, SOF, SRB, BUC, TIF); no Alexandria, Suez, Benghazi, Baku provinces (PR #48) |  |
| A11 | Province tap hits first time | unverified | tap_probe: 0 failures at 390 px (2026-11-25) |  |
| A12 | Repay all loans option | done | merged PR #37 | 2026-11-25 |
| A13 | Improve naval training and quality | missing | ticket #39 |  |
| A14 | Modernise administration, army, navy, education, constitution with historical projects | partial | modern.js and prog_tanzimat.js exist; navy, education, constitution unverified |  |
| A15 | Red Sea fleet can return to the Mediterranean | unverified | audit |  |
| A16 | Mobile-friendly | unverified | layout_check 74 of 74 clean (2026-11-25) |  |
| A17 | Second scenario: Bolsheviks publish Sykes-Picot, Arab revolt turns loyal, play through WWII with interwar events, tech, industry, finance | missing | ticket #40 |  |
| A18 | Liquid-glass old-book look with borders and images | missing | ticket #41; owner 27 Nov: liquid glass is optional, the target is a modern UI (B20) |  |
| A19 | Small randomness in events and combat; decisions that feel purposeful | unverified | audit |  |
| A20 | Conquer Egypt and Libya from Jerusalem; invade Greece by land | unverified | regions exist (PR #48); invasion path from Jerusalem not tested |  |
| A21 | Order ships from shipyards; US shipyards and unique ships | missing | ticket #42 |  |
| A22 | Forts: no queue or build past max level | done | Ticket #36: queue admission counts active and waiting levels; AUD1 checks rejection and notices. | 2026-11-25 |
| A23 | Taxes by category with sector effects | partial | tax change moves income (PR #35 probe); categories per sector unverified |  |
| A24 | Great works by history, renovation of old works, historic buildings | partial | 34 great works, no renovation path |  |
| A25 | Great work and city pictures in background | missing | ticket #43 |  |
| A26 | Sounds and music of the era | missing | ticket #44 |  |
| A27 | Game theory in turns: deterrence, coalitions, payoffs, score vs real outcome | partial | some in diplo.js; scripted decisions unverified |  |
| A28 | Trade page with treaties, boycotts, tariffs | missing | ticket #45 |  |
| A29 | Resource deposits (coal, copper, chrome, lead, oil) in three levels | missing | ticket #46 |  |
| A30 | Citizenship policy, influence, war goals, crises, army supply | partial | some present |  |
| A31 | Autosave, save slots, export and import | done | IndexedDB store, Worker pack, Save to file: merged PR #34 (ticket #4) | 2026-11-25 |
| A32 | Android APK | closed | owner stopped APK; web only; reopened 27 Nov for The Long Century: Android first (B20) |  |

## B. The Long Century asks and decisions

| ID | Ask | Status | Ticket or evidence | Done on |
|---|---|---|---|---|
| B1 | Rebuild like Victoria 2; every country same rules; any country 1836 start | unverified | SWI, FRA, GBR accept the same fort order alike (PR #53); wider check open |  |
| B2 | Theatre command with infantry, cavalry, artillery; no army selection | unverified | theatre.js exists; owner 27 Nov (B45): theatre orders kept, armies visible and moving on the map, easy enjoyable controls |  |
| B3 | Flags for every nation | done |  | 2026-11-25 |
| B4 | Punjab 1836 flag | done | every nation has a flag (PR #53) | 2026-11-25 |
| B5 | Buildings, great works, decisions the player can use | partial | Build mode and Works board exist |  |
| B6 | UI at least as good as Devlet-i Aliyye | unverified | layout audit fails 7 pages |  |
| B7 | Miller true-Earth map, art, easy navigation | unverified | MP and AR tickets |  |
| B8 | About 20 more buildings and 12 more great works | unverified | 25 building kinds, 34 great works (22 non-fair); MASTER_PLAN has no great-works target (PR #53) |  |
| B9 | About 90 events plus chronicle | done | 104 events, 79 dispatches (PR #53); more events: ticket #56 | 2026-11-25 |
| B10 | DeepSeek 12 European events fixed | closed | owner set DeepSeek files aside 2026-11-25; events built from scratch: ticket #56 (B18) |  |
| B11 | Naval war: interception, blockade by port, generals, supply | done |  | 2026-11-25 |
| B12 | Mobilisation strength and general selection | done |  | 2026-11-25 |
| B13 | Fix Germany forming too early; one economy for all; 130 ms and 1 MB budgets | unverified | Germany forms Mar 1868 (seed 7), Jul 1869 (seed 11): ticket #49; FX and SV tickets for budgets |  |
| B14 | Undo; end-of-year review of choices vs minister | partial | Build mode undo only |  |
| B15 | Early buyers for wool, rubber, canned goods; quiet opening decades; French debt | unverified | wool has no consumer: ticket #54 (PR #53) |  |
| B16 | Process: ledger first each session, no silent removal | done | this system | 2026-11-25 |
| B17 | Branch protection and CI that does not starve (admin bypass, light stress on push) | done | PR #51; owner set bypass | 2026-11-25 |
| B18 | Missing historical events (Europe, Americas, Asia) built from scratch, not from DeepSeek files | missing | ticket #56 |  |
| B19 | Free-licence assets only (CC0, public domain, or our own); manifest and CI check | done | docs/ASSETS.md, docs/assets.json, tools/assets_check.py; asset files for #41, #43, #44 still to add; owner 27 Nov (B42): AI-made art now allowed, recorded in the manifest with tool, prompt and date | 2026-11-25 |
| B20 | Android game first; finished game has a dynamic map and modern UI; new features easy to add. Chosen path (option 1): keep the JavaScript engine, Vite multi-file build, Capacitor Android app, PixiJS map; switch to Godot only if the PixiJS map fails a phone test on the Galaxy A56 | unverified | from owner, Claude chat 27 Nov 2026 |  |
| B21 | Claude may implement game code as well as plan and audit (owner, 27 Nov 2026); AI Studio work goes through a branch and PR, never straight to main | done | from owner, Claude chat 27 Nov 2026; CLAUDE.md and AGENTS.md updated (PR #77); branch protection without bypass set by the owner 27 Nov | 2026-11-27 |
| B22 | Review AI Studio's 27 Nov engine changes (runMonthlyTick in src/engine/simulation.ts, price clamps, market access, construction queue, tax calibration) that reached main without a PR | unverified | seed 7 SWI before (ad5aaa3) vs after (2fc1e64): Germany Aug 1866 vs Sep 1880; wars 68 vs 51; states destroyed 20 vs 16; save 977 KB vs 943 KB; worst month 96 vs 84 ms; hash dda070bb vs 0592088d (PR AND1); owner 27 Nov: revert. PR #77 restores the engine and interface files to ad5aaa3 (hash dda070bb, save/reload passes again) and keeps AI Studio's build, Android, PWA, map and worker files. Ideas to redo as reviewed tickets: market access, price limits, construction queue, askSheet instead of confirm() |  |
| B23 | One GitHub-based coordination system for every AI and the owner: master plan and tickets on a claims board, agents take unclaimed tickets, no feature or planned feature goes missing, a new ask in any tool (AI Studio, Codex, Claude) is recorded in the repo before work, no independent streaks | done | from owner, Claude chat 27 Nov 2026; docs/COORDINATION.md, tools/coord.py, coord.yml (PR COORD1); merged PR #87; /claim and board refresh verified live on #88 | 2026-11-27 |
| B24 | Daily progression: replace the monthly tick with a daily tick, and update every feature and engine system to run on it | unverified | owner decided 27 Nov 2026 in Claude chat (first asked in AI Studio 26 Nov); design in docs/LIVING_WORLD.md, tickets DAY0-DAY9 |  |
| B25 | Commercial release and future security: Google Play release, clean licences, signing key kept safe, privacy policy, pricing model, dependency and security checks | unverified | from owner, Claude chat 27 Nov 2026 |  |
| B26 | Whole future plan streamlined into features, mechanics and tickets; nothing forgotten or missed | done | from owner, Claude chat 27 Nov 2026; docs/ROADMAP.md merged in PR #103; tools/coord.py audit checks plan coverage | 2026-11-27 |
| B27 | Room for rich media: unit and building pictures or models on the map, era pictures, music and sound, loaded only when needed | unverified | from owner, Claude chat 27 Nov 2026 (AI Studio limits list) |  |
| B28 | AI Studio's six platform fixes approved by the owner: multi-file app, larger saves, graphics-chip map, code modules, simulation in a background worker, Android app | unverified | from owner, Claude chat 27 Nov 2026; 1 multi-file app, 2 saves (already IndexedDB, A31) and 6 Android project done as scaffolding (PR #77); 3 map, 4 modules, 5 worker open |  |
| B29 | Not a text simulator: a content-rich game with animation and a genuine map where armies move on land, fleets move at sea, and buildings and infrastructure appear on the map as they are built | unverified | from owner, Claude chat 27 Nov 2026 |  |
| B30 | Loading screen with history tidbits and fun details, historical backgrounds and original quotes | unverified | from owner, Claude chat 27 Nov 2026 |  |
| B31 | Pops by strata with needs and standard of living, radicalism and loyalism, interest groups with clout (landowners, army, clergy, industrialists, intelligentsia, unions, rural folk, petite bourgeoisie), legitimacy and law enactment | unverified | from owner in AI Studio 26 Nov 2026 (docs/inbox note, never pushed) |  |
| B32 | Balance guardrails against death spirals: prices kept between 0.25x and 1.75x of base with dampening, shortage and market-access penalties floored at 0.15x, every playable country starts with a positive cash flow and stable radicalism | unverified | from owner in AI Studio 26 Nov 2026 (docs/inbox note, never pushed) |  |
| B33 | Causal breakdowns: tapping a key number (treasury, price, market access, standard of living, radicalism, legitimacy) shows 2-3 lines of the modifiers behind it; one deterministic pipeline in strict causal order; keep the visual theme and working features | unverified | from owner in AI Studio 26 Nov 2026 (docs/inbox note, never pushed) |  |
| B34 | Newspaper: a period newspaper reporting the world's events, wars, discoveries and the player's deeds | unverified | from owner, Claude chat 27 Nov 2026 ("Add a newspaper and progression system.") |  |
| B35 | Progression system (owner's words: "Add a newspaper and progression system."); meaning to confirm with the owner: player milestones and achievements, era progression, or both | unverified | owner chose all three layers on 27 Nov ("add all 3."): eras in the campaign (PROG1a), national milestones and beat-history score (PROG1b), player profile with unlocks and online challenges (PROG1c); paid items cosmetic only |  |
| B36 | Date controller: pause, play and speed controls for the daily clock, the current date always visible | unverified | from owner, Claude chat 27 Nov 2026 ("Add date controller") |  |
| B37 | Progress indicator (owner's words: "Add progress indicator"); planned as a loading progress bar on the loading screen plus progress bars for construction, research, programmes and wars; meaning to confirm with the owner | unverified | from owner, Claude chat 27 Nov 2026 |  |
| B38 | Daily ticker controller: an End Day button replaces End Month; each press updates the global date and advances the game world by one day | unverified | from owner, Claude chat 27 Nov 2026 |  |
| B39 | A small progress bar or indicator beside the date (the #hdr-when header) showing how far the current month has run as days pass | unverified | from owner, Claude chat 27 Nov 2026 |  |
| B40 | Use Google AI Studio's AI features where the game needs them (images, video, voice, Search data, Maps, chatbot, Three.js 3D, music generation, database and sign-in, transcription), planned and put on the claims board for AI Studio to implement | unverified | from owner, Claude chat 27 Nov 2026 (screenshots of AI Studio's Add AI features); owner 27 Nov: offline rule relaxed (B41), AI art allowed (B42), revenue by ads (B43) |  |
| B41 | Online features are welcome and encouraged, but the game must still work fully offline | unverified | from owner, Claude chat 27 Nov 2026 ("relax rules about offline, but it should work offline") |  |
| B42 | AI-made art can be added (replaces the earlier no-AI-images rule) | unverified | from owner, Claude chat 27 Nov 2026 ("ai made art can be added") |  |
| B43 | Revenue through ads and similar (in-app purchases etc.); encourage online use | unverified | from owner, Claude chat 27 Nov 2026 ("revenue generation will be through ads and etc") |  |
| B44 | 2.5D map: a rich 2D map with depth (shaded terrain, shadows, slight tilt), with units visible on the map that feel good and raise engagement | unverified | from owner, Claude chat 27 Nov 2026 ("2.5d but having units on map feel good and get more engagement") |  |
| B45 | Theatre orders stay, but commanding must be enjoyable with easy controls | unverified | from owner, Claude chat 27 Nov 2026 ("theater orders but make it enjoyable and easy controls") |  |
| B46 | Re-plan every earlier feature for the new scope (living 2.5D map, daily clock, Android app, online, AI art) and the move from the 1 MB single HTML file to a full game | unverified | from owner, Claude chat 27 Nov 2026 |  |
