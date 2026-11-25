# Feature ledger

Generated from docs/LEDGER.json by tools/ledger.py. Do not edit by hand.
Rules: docs/DEV_WORKFLOW.md section 'Feature ledger'. Done rows stay forever for later audits.

Totals: done 10, partial 11, missing 9, unverified 18, closed 1  (audited 2026-11-25)

## A. Devlet-i Aliyye asks (Ottoman 1911+ game) as carried into the Long Century

| ID | Ask | Status | Ticket or evidence | Done on |
|---|---|---|---|---|
| A1 | Month turns, selectable decisions, comprehensive dashboard | partial | pages exist; dashboard depth unverified; needs ticket |  |
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
| A18 | Liquid-glass old-book look with borders and images | missing | ticket #41 |  |
| A19 | Small randomness in events and combat; decisions that feel purposeful | unverified | audit |  |
| A20 | Conquer Egypt and Libya from Jerusalem; invade Greece by land | unverified | regions exist (PR #48); invasion path from Jerusalem not tested |  |
| A21 | Order ships from shipyards; US shipyards and unique ships | missing | ticket #42 |  |
| A22 | Forts: no queue or build past max level | partial | real bug, ticket #36; probes merged PR #35 |  |
| A23 | Taxes by category with sector effects | partial | tax change moves income (PR #35 probe); categories per sector unverified |  |
| A24 | Great works by history, renovation of old works, historic buildings | partial | 34 great works, no renovation path |  |
| A25 | Great work and city pictures in background | missing | ticket #43 |  |
| A26 | Sounds and music of the era | missing | ticket #44 |  |
| A27 | Game theory in turns: deterrence, coalitions, payoffs, score vs real outcome | partial | some in diplo.js; scripted decisions unverified |  |
| A28 | Trade page with treaties, boycotts, tariffs | missing | ticket #45 |  |
| A29 | Resource deposits (coal, copper, chrome, lead, oil) in three levels | missing | ticket #46 |  |
| A30 | Citizenship policy, influence, war goals, crises, army supply | partial | some present |  |
| A31 | Autosave, save slots, export and import | done | IndexedDB store, Worker pack, Save to file: merged PR #34 (ticket #4) | 2026-11-25 |
| A32 | Android APK | closed | owner stopped APK; web only |  |

## B. The Long Century asks and decisions

| ID | Ask | Status | Ticket or evidence | Done on |
|---|---|---|---|---|
| B1 | Rebuild like Victoria 2; every country same rules; any country 1836 start | unverified | rule 1 |  |
| B2 | Theatre command with infantry, cavalry, artillery; no army selection | unverified | theatre.js exists |  |
| B3 | Flags for every nation | done |  | 2026-11-25 |
| B4 | Punjab 1836 flag | unverified | audit |  |
| B5 | Buildings, great works, decisions the player can use | partial | Build mode and Works board exist |  |
| B6 | UI at least as good as Devlet-i Aliyye | unverified | layout audit fails 7 pages |  |
| B7 | Miller true-Earth map, art, easy navigation | unverified | MP and AR tickets |  |
| B8 | About 20 more buildings and 12 more great works | unverified | audit |  |
| B9 | About 90 events plus chronicle | partial | chronicle exists |  |
| B10 | DeepSeek 12 European events fixed | unverified | owner to resend the other 3 deliverables |  |
| B11 | Naval war: interception, blockade by port, generals, supply | done |  | 2026-11-25 |
| B12 | Mobilisation strength and general selection | done |  | 2026-11-25 |
| B13 | Fix Germany forming too early; one economy for all; 130 ms and 1 MB budgets | unverified | Germany forms Mar 1868 (seed 7), Jul 1869 (seed 11): ticket #49; FX and SV tickets for budgets |  |
| B14 | Undo; end-of-year review of choices vs minister | partial | Build mode undo only |  |
| B15 | Early buyers for wool, rubber, canned goods; quiet opening decades; French debt | unverified | from Codex handoff |  |
| B16 | Process: ledger first each session, no silent removal | done | this system | 2026-11-25 |
| B17 | Branch protection and CI that does not starve (admin bypass, light stress on push) | done | PR #51; owner set bypass | 2026-11-25 |
