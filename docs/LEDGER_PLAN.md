# Plan for the 35 open ledger rows (2026-11-27)

Source of truth for status: `docs/LEDGER.json` (`python3 tools/ledger.py --open`). This file says the order, who does what, and when a row counts as done. A row is done only when its probe matches `src/` and its ticket's "Done when" checks pass in CI.

Rules for every wave:
- Same rules for every nation; every order goes through `execCommand` (src/turn.js).
- Tickets that change the seed 7 state hash land **one at a time** (re-pin after each). Tickets that keep the hash can run in parallel.
- Haiku: probes, small UI, docs. Sonnet or Codex: engine systems. Opus: designs and audits. Owner: approvals, downloads of free-licence assets, playtests.

## Wave 0: verify the 16 unverified rows (tests only, no hash change, 2 PRs, parallel)
| Probe PR | Rows | What it proves |
|---|---|---|
| AUD4 engine | A6, A15, A19, A20, B1, B2, B13 budgets | production really produces; Red Sea fleet can reach the Mediterranean (Suez rule); randomness exists in combat and events (spread over seeds); an army in Palestine can take Egypt, then Libya, and one in Thrace can take Greece by land; 5 nations get identical answers to the same orders; infantry, cavalry and artillery change theatre outcomes; ms/month and save size on 3 seeds |
| AUD5 interface and content | A3, A9, A11, A16, B6, B7 | compare with the Ottoman audit (PR #60): which events, policies and systems are missing; tap_probe and layout_check results recorded (A11 and A16 can close now); page-by-page gap list for B6; map navigation checks for B7 |
Each passing row becomes done with a probe. Each failure becomes a ticket and joins the wave that fits it.

## Wave 0 result (2026-11-27, PRs #72 and #73)
Done: A6, A11, A15, A16, B2. New tickets: #74 declareWar crash (A20), #75 recruit through execCommand (B1), #76 battle spread (A19). All 8 missing Ottoman items were already ticketed. Owner: add ottoman1911.html to the repo for the event-level audit.

## Wave 1: small engine fixes (hash changes, one at a time, Sonnet or Codex)
0. #74 declareWar crash (A20), first: it blocks conquest of Egypt, Libya and Greece
1. #49 Germany forms too early (B13)
2. #54 wool has no buyer (B15)
3. #64 oil wells (A5)
4. #65 taxes by category (A23)
5. #66 renovate great works (A24)
6. #61 annual review and wider undo (B14)
7. #75 recruitment through execCommand (B1)
8. #76 battle spread (A19)
FX1 #30 and playtest #32 (Codex) land before or between these.

## Wave 2: systems (hash changes, one at a time; designs first where marked)
1. #46 resource deposits, three levels (A29), then #45 trade page with treaties, boycotts, tariffs (A28), which builds on it
2. #39 naval training and quality (A13)
3. #47 ship refit design, then the bulk order (A7); then #42 shipyards and unique ships, US yards included (A21)
4. #67 modernisation for navy, education, constitution (A14)
5. #68 deterrence, coalitions, crises, score against history (A27, A30)
6. #70 more buildings and great works in batches of 5 (B8)

## Wave 3: look and feel (no hash change; can run beside wave 2)
1. #41 old-book look: borders, seals, paper in our own SVG and CSS (A18). Owner approves one screenshot.
2. #43 pictures behind great works and cities (A25): owner downloads CC0 or public-domain images (docs/ASSETS.md); `tools/assets_check.py` admits them.
3. #44 music (A26): public-domain tunes played by our synth; the five cues already merged (PR #55).
4. #69 dashboard and page parity with Devlet-i Aliyye (A1, B5, B6).

## Wave 4: content and scenario (largest, last)
1. #56 historical events from scratch in three batches: Europe, Americas, Asia (B18; also A3, A9).
2. Map splits for Alexandria, Suez, Benghazi, Baku (A10), through the map plan tickets, needed by the scenario.
3. #40 Sykes-Picot alternate scenario through WWII (A17): design note first, owner approves, then build on waves 2 and 4.

## Pace and checks
- Roughly 2 to 4 merges a day when CI is quiet; the light stress default (PR #51) keeps queues short.
- After each wave: update `docs/LEDGER.json`, run `python3 tools/ledger.py --check`, and post the wave summary on issue #1.
- If a row slips a wave twice, it is re-scoped or split, never silently dropped.
