# Feature ledger

Generated from docs/LEDGER.json by tools/ledger.py. Do not edit by hand.
Rules: docs/DEV_WORKFLOW.md section 'Feature ledger'. Done rows stay forever for later audits.

Totals: done 19, partial 12, missing 9, unverified 9, closed 2  (audited 2026-11-27)

## A. Devlet-i Aliyye asks (Ottoman 1911+ game) as carried into the Long Century

| ID | Ask | Status | Ticket or evidence | Done on |
|---|---|---|---|---|
| A1 | Month turns, selectable decisions, comprehensive dashboard | partial | pages exist; dashboard depth unverified; ticket #69 |  |
| A2 | Cheat button in Settings, +100M per press | done |  | 2026-11-25 |
| A3 | Refine gameplay, more historical events, refined military and naval system | unverified | Ottoman handoff: 8 of 15 items missing, all ticketed (#39 #40 #43 #45 #46 #47 #68); event-level audit needs ottoman1911.html in the repo (PR #72) |  |
| A4 | Build railways | done |  | 2026-11-25 |
| A5 | Build oil wells | partial | oil good exists, no well building found; ticket #64 |  |
| A6 | Trade, resource extraction, industry that produces | done | GBR/FRA/RUS output 1.36M to 1.40M over 24 months (PR #73) | 2026-11-27 |
| A7 | Refit ships in bulk, not one by one | missing | ticket #47 |  |
| A8 | Buttons must not jump the page scroll | done | Settings sheet keeps scroll, merged PR #50; Economy page ok | 2026-11-25 |
| A9 | More unique events, policies and systems, interlinked | unverified | see A3; events batches ticket #56 |  |
| A10 | Map: Balkans, Caucasus, Crimea, Suez, Egypt areas joined to Libya | unverified | map has 184 provinces; Egypt/Libya/Crimea/Balkans/Caucasus present as regions (CAI Lower Egypt, ASW, SAE, TRP, ODE, SOF, SRB, BUC, TIF); no Alexandria, Suez, Benghazi, Baku provinces (PR #48) |  |
| A11 | Province tap hits first time | done | tap_probe 0 misses; chooser opens for dense provinces by design (PR #72) | 2026-11-27 |
| A12 | Repay all loans option | done | merged PR #37 | 2026-11-25 |
| A13 | Improve naval training and quality | missing | ticket #39 |  |
| A14 | Modernise administration, army, navy, education, constitution with historical projects | partial | modern.js and prog_tanzimat.js exist; navy, education, constitution unverified; ticket #67 |  |
| A15 | Red Sea fleet can return to the Mediterranean | done | sea route ASW to CAI exists; Suez canal adds the lane (PR #73) | 2026-11-27 |
| A16 | Mobile-friendly | done | layout_check 74 of 74 clean at 360x740 and 390x844 (PR #72) | 2026-11-27 |
| A17 | Second scenario: Bolsheviks publish Sykes-Picot, Arab revolt turns loyal, play through WWII with interwar events, tech, industry, finance | missing | ticket #40 |  |
| A18 | Liquid-glass old-book look with borders and images | missing | ticket #41 |  |
| A19 | Small randomness in events and combat; decisions that feel purposeful | partial | randomness present but battle spread 5.6 of 8: ticket #76 |  |
| A20 | Conquer Egypt and Libya from Jerusalem; invade Greece by land | partial | land paths DAM>CAI>TRP and IST>SOF>SAL>ATH exist; declareWar crash: ticket #74 |  |
| A21 | Order ships from shipyards; US shipyards and unique ships | missing | ticket #42 |  |
| A22 | Forts: no queue or build past max level | done | Ticket #36: queue admission counts active and waiting levels; AUD1 checks rejection and notices. | 2026-11-25 |
| A23 | Taxes by category with sector effects | partial | tax change moves income (PR #35 probe); categories per sector unverified; ticket #65 |  |
| A24 | Great works by history, renovation of old works, historic buildings | partial | 34 great works, no renovation path; ticket #66 |  |
| A25 | Great work and city pictures in background | missing | ticket #43 |  |
| A26 | Sounds and music of the era | partial | five synthesized cues merged PR #55; era music still open, ticket #44 |  |
| A27 | Game theory in turns: deterrence, coalitions, payoffs, score vs real outcome | partial | some in diplo.js; scripted decisions unverified; ticket #68 |  |
| A28 | Trade page with treaties, boycotts, tariffs | missing | ticket #45 |  |
| A29 | Resource deposits (coal, copper, chrome, lead, oil) in three levels | missing | ticket #46 |  |
| A30 | Citizenship policy, influence, war goals, crises, army supply | partial | some present; ticket #68 |  |
| A31 | Autosave, save slots, export and import | done | IndexedDB store, Worker pack, Save to file: merged PR #34 (ticket #4) | 2026-11-25 |
| A32 | Android APK | closed | owner stopped APK; web only |  |

## B. The Long Century asks and decisions

| ID | Ask | Status | Ticket or evidence | Done on |
|---|---|---|---|---|
| B1 | Rebuild like Victoria 2; every country same rules; any country 1836 start | unverified | same answers for 5 nations on forts; no recruit command kind: ticket #75 |  |
| B2 | Theatre command with infantry, cavalry, artillery; no army selection | done | defender 7.81 infantry, 2.24 with cavalry, 2.19 with artillery (PR #73) | 2026-11-27 |
| B3 | Flags for every nation | done |  | 2026-11-25 |
| B4 | Punjab 1836 flag | done | every nation has a flag (PR #53) | 2026-11-25 |
| B5 | Buildings, great works, decisions the player can use | partial | Build mode and Works board exist; ticket #69 |  |
| B6 | UI at least as good as Devlet-i Aliyye | unverified | page gaps inferred in docs/AUD5.md; ticket #69 |  |
| B7 | Miller true-Earth map, art, easy navigation | unverified | pan and labels fine, 0 overlaps; no Miller projection yet, Atlas covers 7.9 %: map plan MP tickets (PR #72) |  |
| B8 | About 20 more buildings and 12 more great works | unverified | 25 building kinds, 34 great works (22 non-fair); MASTER_PLAN has no great-works target (PR #53); ticket #70 |  |
| B9 | About 90 events plus chronicle | done | 104 events, 79 dispatches (PR #53); more events: ticket #56 | 2026-11-25 |
| B10 | DeepSeek 12 European events fixed | closed | owner set DeepSeek files aside 2026-11-25; events built from scratch: ticket #56 (B18) |  |
| B11 | Naval war: interception, blockade by port, generals, supply | done |  | 2026-11-25 |
| B12 | Mobilisation strength and general selection | done |  | 2026-11-25 |
| B13 | Fix Germany forming too early; one economy for all; 130 ms and 1 MB budgets | unverified | Germany ticket #49; seed 7 save 976 KB ok; one local run 150.9 ms/month at 1846 while two agents shared the machine, CI is the budget check |  |
| B14 | Undo; end-of-year review of choices vs minister | partial | Build mode undo only; annual review ticket #61 |  |
| B15 | Early buyers for wool, rubber, canned goods; quiet opening decades; French debt | unverified | wool has no consumer: ticket #54 (PR #53) |  |
| B16 | Process: ledger first each session, no silent removal | done | this system | 2026-11-25 |
| B17 | Branch protection and CI that does not starve (admin bypass, light stress on push) | done | PR #51; owner set bypass | 2026-11-25 |
| B18 | Missing historical events (Europe, Americas, Asia) built from scratch, not from DeepSeek files | missing | ticket #56 |  |
| B19 | Free-licence assets only (CC0, public domain, or our own); manifest and CI check | done | docs/ASSETS.md, docs/assets.json, tools/assets_check.py; asset files for #41, #43, #44 still to add | 2026-11-25 |
