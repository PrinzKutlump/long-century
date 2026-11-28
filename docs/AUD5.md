# AUD5: audit of ledger rows A3, A9, A11, A16, B6, B7

Date: 2026-11-27. Base: origin/main `ad5aaa3`. Built with `python3 build.py` (1357 KB).

Notes on sources:
- `docs/LEDGER_PLAN.md` does not exist at this base, so the "Wave 0" section could not be read. Row text and evidence came from `docs/LEDGER.md`.
- The Ottoman audit is `docs/OTTOMAN_HANDOFF.md`, added by PR #60 (commit `d16b4f9`). It is feature-level. The owner's reference `ottoman1911.html` is not in the repo or the sandbox, so no event-by-event comparison was possible.

## A11: province tap hits first time

Command: `python3 tools/tap_probe.py`. Summary lines:

- `1934 w150: 58 small provinces, direct 56, chooser 2, FAIL 0`
- `1934 w380: 58 small provinces, direct 27, chooser 31, FAIL 0`
- page errors: none

Reading: no failed taps at either zoom. At w380, only 27 of 58 small provinces hit on the first direct tap; 31 needed the chooser. The row says "first time", so the w380 direct rate does not meet it.

Result: **needs ticket** (first-tap rate at w380; reviewer should confirm that "chooser" counts as a miss).

## A16: mobile-friendly

Command: `python3 tools/layout_check.py`. Summary: `74 of 74 screens clean, 0 failed (66s)`.

The script checks two sizes, 360x740@125 and 390x844@100. The summary does not split by size, so the 390 px count is not separately shown.

Result: **close as done**. This also supersedes the stale B6 evidence ("layout audit fails 7 pages").

## A3 and A9: Ottoman events, policies and systems against src/

Each item from `docs/OTTOMAN_HANDOFF.md` was checked with a short grep over `src/*.js`.

| Ottoman item (handoff ref) | Status | Evidence |
| --- | --- | --- |
| Ship refit and yard instalments (A7) | missing | no hits for `refit`, `yard`, `instalment` |
| Naval training (A13) | missing | no naval training; the one `training` hit is in an unrelated event (`history.js:160`) |
| Naval missions and shipyard availability (A13, A15) | partial | naval armies exist (`diplo.js`, `mil.js`); no missions or shipyard hits |
| Suez and Aden transit rules (A21) | partial | Suez canal with tolls (`build.js:107,141`), Suez shares event (`history.js:175`); Aden appears in campaign/history/world; no transit rule |
| Arab Compact and Sykes-Picot choice (A17) | missing | no hits for `Sykes`, `Picot`, `Arab Compact`; no scenario initialiser |
| Ottoman tax instruments, sector level (A23) | partial | taxes exist; no `Abiana` or instrument-level tax layer |
| Historical works and renovation (A24) | partial | great works present (`build.js`, `ui2.js`, `ui6.js`); no `renovat` hits |
| Illustrated project metadata (A25) | missing | no `illustrat` hits |
| Threat estimates and payoff tables (A27) | partial | `threat` (`mil.js`, `events.js`, `history.js`) and `payoff` (`modern.js`, `programmes.js`) exist |
| Historical score benchmark (A27) | missing | no `benchmark` hits |
| Commercial treaties (A28) | partial | `compact`/`release` treaty terms (`turn.js:148`); national tariffs exist |
| Boycotts (A28) | missing | no `boycott` hits |
| Strategic-goods retention (A28) | missing | no `strategic goods` hits |
| Oil wells and deposit tiers (A5, A29) | missing | oil commodity exists (`defs.js`, `world.js`); no `deposit` or well-tier hits |
| Front targets follow ownership and adjacency (A20) | present | `thFronts` in `theatre.js:17` uses ownership and region; parity not tested |

Also grepped, not in the handoff list: Capitulations, Janissaries and Rumelia are missing (no hits). Hejaz is partial (`build.js`, `world.js`). Tanzimat is present (`prog_tanzimat.js`).

Count over the 15 table rows: 8 missing (refit, naval training, Arab Compact and Sykes-Picot, illustrated metadata, historical benchmark, boycotts, strategic goods, oil wells and deposits), 6 partial (naval missions, Suez and Aden, tax instruments, historical works, threat and payoff, treaties), 1 present (front targets).

Result: **needs ticket** for A3 and A9 (missing items above). A9 is wider than the handoff list, so it needs the event-level audit, which needs `ottoman1911.html`.

## B6: page-by-page comparison with the Ottoman game

The audit doc has no page-level UI content. The lines below are inferred by mapping each Ottoman feature from the table above to the page where it would sit. They are not what the Ottoman page showed.

- Nation: no entry in the audit.
- Economy: instrument-level tax (A23) and per-good tariffs (A28) missing.
- Politics: Arab Compact and Sykes-Picot choice (A17) missing.
- Military: ship refit and yard (A7) and naval training (A13) missing.
- World: Suez and Aden transit rules (A21) partial; front targets (A20) present.
- Works: renovation and illustrated metadata (A24, A25) missing.
- Ledger: no entry in the audit.
- Research: no entry in the audit.
- News: no entry in the audit.
- Settings: no entry in the audit.

Result: **needs ticket**. The page-level comparison needs `ottoman1911.html`. The ledger evidence ("layout audit fails 7 pages") is stale, since A16 now shows 74 of 74 clean.

## B7: Miller true-Earth map, art, navigation

Command: `python3 tools/map_probe.py` (viewport 390x800, 30 months). Units as printed by the probe.

- Pan: median 16.7 in all six runs (cpu1x and cpu4x at w150, w380, w1200). Largest max 31.5 (cpu4x, w380).
- Labels and tap targets:

| Zoom | Label nodes | Label overlaps | Provinces under 44 px | Markers under 44 px |
| --- | --- | --- | --- | --- |
| w150 | 169 | 0 | 0 | 0 of 12 |
| w260 | 157 | 0 | 4 | 0 of 12 |
| w380 | 150 | 0 | 30 | 0 of 12 |
| w900 | 47 | 0 | 77 | 0 of 12 |

- Atlas: coverPct 7.9; found `[1,1,1,0]`; page errors: none.
- Projection: `grep -n -i "miller" src/ui5.js docs/*.md` has no hits in `src/ui5.js`. Miller appears only as a candidate in `docs/ART_MAP_GPT_PLAN.md` (lines 50 and 79, a spike). The map is not Miller.

Result: **needs ticket** (projection and art not built; navigation measures pass).

## Result table

| Row | Result | Action |
| --- | --- | --- |
| A3 | 8 missing, 6 partial, 1 present (table above) | needs ticket |
| A9 | Event-level audit blocked by missing reference file | needs ticket |
| A11 | 0 failures; w380 direct 27 of 58 | needs ticket |
| A16 | 74 of 74 screens clean | close as done |
| B6 | No page-level evidence; feature gaps listed | needs ticket |
| B7 | No Miller projection; navigation measures pass | needs ticket |
