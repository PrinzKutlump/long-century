# The Long Century: map-first interface and art plan

Fourth revision, 22 November 2026 (after the owner's first playtest), by Claude, for the next implementer (GPT, or Sonnet workers supervised by Claude). Read `Long_Century_GPT_Plan.md` first: its §1 (the owner) and §2 (the nine rules) still apply. Order IDs start with **V** so they do not clash with M, E, D, U, B, W or G.

---

## 0. One-screen summary

**Owner's brief (22 Nov):** most time is spent on the map, so make it easy to interact with, rich in content, easy to navigate and easy to build on. Modernise the interface with pictures and art.

**Finding:** the parchment design system is sound. The map is not. It shows flat colour shapes on a flat sea. Labels collide, 12 of 17 war markers are too small to tap, and controls cover 18% of the map. Building takes 4 taps, and the cost appears only at the third.

**Plan, in order:**
1. **Construction playtest first** (V1, V2): a compact Atlas header, a reliable province picker, and building **the project you chose** in one or many provinces from the map. One review, one confirm, no tab changes. The chosen building stays selected for the next batch.
2. **Navigate** (V2b): search, the minimap, Next needing me and view history, after the playtest.
3. **Art on the map** (V4–V6): coasts, borders, sea, terrain, cities, railways, ports, factories and war tokens, in light and dark.
4. **Pictures elsewhere** (V3, V7): one icon set, nation emblems, event scenes, great-work monuments and decade plates.
5. **Polish** (V8): tokens, tab bar, motion and embedded fonts.

**Safeguards:**
- Art never changes the simulation; every seed's final state digest must stay identical.
- Art is original only.
- A size and speed budget is checked after every order.
- An **Art detail** setting (Full, Light, Plain) lets the owner fall back if his phone struggles.
- The owner gets a playable build after V2 (the construction playtest), V4 and V7.

### What changed in the fourth revision (owner's playtest)
- **Verdict:** building is still tedious, and the interface was misaligned. Building one project at a time from the map does not scale to a country.
- **Fixed now:** the month-end summary was laid out in a single squashed row. The compact header's new `.sum` class collided with the summary's `.msheet.sum`. It is renamed `.hsum`, and the rule in V2c.6 prevents repeats.
- **New order V2c, the Works board,** comes next, before V2b. It is one dashboard where every building in every province can be chosen, mixed in one basket, reviewed once and confirmed once.

### What changed in the third revision (owner's review)
- **The build promise was about the wrong case.** "3 taps" held only for the minister's first pick. The owner's real need is building the project *he* chose, repeatedly, across provinces. V2 is now a **Build mode**: choose the building once, tap provinces, review once, confirm once. It has a hard test on 360 px at 125% text: five schools, zero tab changes, one confirmation, five orders surviving a reload, and School still selected afterwards.
- **No exact price.** `bldPay` values materials at today's prices, and the state buys them over the following months. Screens show **"Estimated total at today's prices"**. Tests check material quantities exactly and reconcile actual payments with the treasury as deliveries arrive. The 25% treasury warning applies to the whole batch.
- **Railway routes no longer use army pathfinding.** `findPath(a,to,any)` takes an army and can cross sea lanes or foreign land. A new UI-only route search crosses connected land provinces we control. The preview shows which segments have rail, which can start and where a gap blocks the route. Railways go through `startRail`, not the building queue, so the result reports how many projects started, queued or were skipped.
- **Staging made consistent.** V0 records the baseline only; layout targets are enforced from V1 on. Full detail no longer has to pass to ship: Full must pass to be the default, otherwise Light is the default (§4.3). Every build is compared against one pinned source revision that includes `tools/`, because the 20 Nov checkpoint does not contain `map_probe.py`.
- **Labels re-checked on every pinch, resize and text-size change**, not just on a zoom-band or owner change. Tested by a continuous zoom and pan over dense provinces, with a small province beside a theatre marker still selectable.
- **Construction playtest brought forward.** The minimap, expanded search and illustrations wait until the owner has played the build-and-account task (V2.8) on his phone.

### What changed in the second revision
- Build comes right after navigation (it was after icons), because the 25 building icons already exist.
- Fixed a wrong target: the controls float over the map, so removing them does not make it taller. The header does. New targets: map at least 640 px tall and controls covering at most 8%, measured against today's 560 px and 18.1%.
- Fixed a gesture clash: long-press was given to two features. There is now one gesture table (§4.5).
- Fixed the build-tap claim. "2 taps" was not achievable with the stated design. The real target is 3 taps, with no spending on a single mis-tap, because started orders cannot be cancelled in the engine.
- Merged the duplicated "peek" features. The plan now upgrades the existing Find province, Next theatre and Capital buttons instead of adding twins.
- Taps are hit-tested from geometry in code instead of extra invisible SVG nodes.
- The refined map outlines live in a new art file. `world.js` is never edited, because the engine measures distances from province positions.
- Added: a boot-time budget (measured 525 ms, or 1,523 ms with the CPU slowed 4×), the Art detail fallback, a "what changed this month" map layer, owner checkpoints, a risk register, a file-ownership table so two workers can run safely, and the one-style-element rule the wrapped test enforces.

---

## 1. Baseline measured on 22 November 2026

These are measurements in Chrome at 390×800, playing the United Kingdom, from month 1 to 30. Reproduce them with `python3 tools/map_probe.py`. It was written in this workspace on 22 Nov and is **not** in the 20 Nov checkpoint; it ships with the pinned revision (§4.8). Headless Chrome paints in software, so the numbers are for before-and-after comparison on one machine. The owner's phone is the final judge.

| Area | Measured |
|---|---|
| Map construction | One inline SVG. 184 province paths average 19 vertices (31 KB of path data). The world is 3000×1549 units, with 105 sea lanes between ports and no sea polygons, and 62 nations. 537 SVG nodes. Layers: `#pvs #plbl #lbls #ths #fronts #arrows #bats #units`. Pan and zoom rewrite the `viewBox` (`applyView`, `bindMap` in `ui5.js`). |
| Geometry | The provinces tile exactly, with no overlap and one enclosed hole. They share almost no vertices: 353 of 3,205 edges. Coasts and nation borders therefore cannot be styled separately until a build step cuts them. The engine uses province `x,y` for distances (`state.js`) and never reads the outlines (`d`). |
| Look | Flat fills from `provColor`, and one 0.6 px stroke on every edge. No terrain, cities, railways, ports or factories are drawn. There are 7 lenses (`MODES`): Political, Diplomacy, Population, Unrest, Industry, Railways and Terrain. |
| Screen | The map spans y 164–724, 560 px of 800. Above it sit the header (132) and the ticker (32); below it, the tab bar. The mode chips (48), the side column (195), Find province (44) and the legend (46) float on the map and cover **18.1%** of it. |
| Labels | Overlapping pairs: 1 at view width 380, 10 at 260, 35 among 175 labels at 150. At 900 only 6 labels remain, 5.2 px tall. |
| Tap targets | 12 of 17 theatre and fleet markers are under 44 px at every zoom. 39 of the 62 provinces visible at default zoom are under 44 px across. 58 of 184 provinces have less area than 44×44 units. |
| Pan smoothness | With the CPU slowed 4×, the median frame is 16.5–17.2 ms and p95 is 19.3–23.2 ms at widths 150, 380 and 1200. Today's map is cheap, but SVG patterns and many nodes would not be free. |
| Boot | Page script finished at 525 ms; with the CPU slowed 4×, 1,523 ms. |
| Province sheet | It opens 419 px tall over the selected province. Buildings sit in a section that is collapsed by default. Building takes 4 taps: province, expand Buildings, tile, "Begin the work". Cost and return appear at tap 3 (`bldAsk`). Started orders have no cancel; only queued orders do (`bqdel`). |
| First screen | After picking a nation the game opens on the Cabinet page, whose first sub-tab row starts at about 690 px. |
| Pictures | The title skyline (`skyline()`). 40 stroke icons in `ICON`: 25 buildings and 15 interface glyphs. Flags from `flagSVG`: 78 specs, 16 of them a plain field, including Punjab. Goods, units, terrains, pop types and great works have none. |
| Fonts | The CSS names EB Garamond and IM Fell English SC but has no `@font-face`, so Android falls back to its own serif. Desktop screenshots do not show what the owner sees. |
| Content to illustrate | 31 goods, 26 factory types, 25 buildings, 34 great works, 14 unit types, 7 terrains, 12 pop types, 6 governments, 69 technologies, 102 events, 48 regions and 62 nations. |

---

## 2. Rules that bite hardest here

From `Long_Century_GPT_Plan.md` §1–2:
- Phone first: 360 and 390 px wide, 100% and 125% text, no horizontal scroll, 44 px targets.
- One self-contained HTML file, no network, built inside the claude.ai wrapper, no downloads.
- Plain English, and disabled buttons say why.
- War by theatre, never by selecting individual armies.
- The same rules for every nation.

Added for this work:
1. **One style element.** All new CSS, fonts included, goes inside the existing `<style>`. `wrap_test.py` asserts exactly two style elements once wrapped: the host's and ours.
2. **Simulation untouched.** No art or UI order edits `world.js`, `defs.js` or any engine file. After every order, seeds 7 and 3 must give the same final state digest as before it.
3. **The command path.** Every build, queue or cancel still goes through `issueCampaignCommand` and `applyCampaignCommand`. Every cost stated on screen equals the cost applied.

---

## 3. Art direction: an engraved atlas on parchment

Keep the parchment system and push it toward a nineteenth-century atlas and a good newspaper.
- **Ink:** dark brown, in three line weights: coast, nation border and province border. Nation colour is washed in at about 55% so the line art shows through.
- **Sea:** pale blue-grey with three fading water-lining bands off every coast and fine wave hatching. At low zoom it adds a compass rose, rhumb lines and a title cartouche.
- **Land:** terrain as small pictorial symbols: peaks, hills, trees, palms, grass tufts and dunes.
- **Icons:** one stroke-and-wash style on a 24 px grid, readable at 20 px.
- **Scenes:** woodcut-style vignettes with strong silhouettes and one accent colour each.
- **Era:** the map ages with the game. Railways spread, chimneys appear on cities as factories open, and ships change from sail to steam to dreadnought.
- **Dark theme:** a night atlas with an ink-blue sea, warm gold lines and lit windows. Every asset is coloured by CSS variables, never stored as two copies.

**Art rules (breaking one is a defect):**
1. All artwork is original, built from code or hand-authored vectors.
   - Do not trace or copy paintings, photographs, illustrated maps, logos or characters, or recreate a famous artwork even loosely.
   - Public-domain geographic data (Natural Earth) may be used for coastline shapes, credited in the HTML.
2. No likenesses of real people. Rulers and ministers appear as heraldic emblems or generic period figures.
3. Flags and heraldry are data: colours and charges drawn from simple geometry. Add an emblem only where the historical design is known; otherwise keep the plain field.
4. Embedded third-party assets keep their licence text in the HTML, as `pako` does now. The open fonts are `@fontsource/eb-garamond` and `@fontsource/im-fell-english-sc`, both OFL-1.1, both on npm.
5. Art never reads or writes game state and never enters a save.

---

## 4. Architecture

### 4.1 Asset pipeline (build time, no network)
- Sources live in `art/`: Python scripts, SVG fragments and data tables.
- `python3 art/build_art.py` writes committed files: `src/art-geo.js`, `src/art-sym.js`, `src/art-scenes.js`, and `src/art-font.css` if fonts are embedded. `build.py` adds them after `flags.js`.
- A normal build needs neither network nor `shapely`; only regenerating art does (`pip install --break-system-packages shapely`).
- Generation is deterministic: seeded noise, sorted iteration, no `Date`, no `Math.random`.

### 4.2 Zoom bands and layers
Bands follow the view width `UI.view.w`. The phone default is 380; the limits are 140 to 3300.

| Band | View width | Adds |
|---|---|---|
| Z0 world | over 1400 | sea, coasts, nation fills and borders, curved nation names, capitals, war fronts |
| Z1 region | 600–1400 | province borders, big cities, Great Power ports, theatre tokens |
| Z2 nation | 250–600 | province names, all cities, railways, ports, construction cranes, shortage marks |
| Z3 local | under 250 | factories, mines, farms, forts, full terrain symbols |

- Labels are laid out again after every pinch end, resize and text-size change, not only on a band or owner change (380 to 260 stays in one band, but spacing changes). The layout is throttled to once per gesture end, never per frame.
- Each layer declares its band and a node budget.
- Only provinces in view get nodes, pooled and reused, never rebuilt on pan.
- After a month, update only what changed (owner, level, state) and never redraw everything.

### 4.3 Art detail setting (the safety valve)
Settings gain **Map detail: Full / Light / Plain**, stored in `localStorage`, not in the save.
- **Plain:** today's map plus V1 usability.
- **Light:** borders, coasts, cities and railways only.
- **Full:** everything.

**Ship rule:** Plain and Light must pass the pan budget to ship. Full must pass to be the **default**; if it misses, Light is the default and Full stays available, marked "may be slow on some phones". If panning is slow on the owner's phone, he switches here, with no rebuild.

### 4.4 Budgets (a failure blocks release)

| Item | Now | Budget |
|---|---|---|
| `dist/long-century.html` | 976 KB | at most 1.8 MB |
| Generated art, raw | 0 | at most 650 KB in total: geometry 150, symbols 130, scenes and plates 150, optional relief 90, optional fonts 130 |
| Boot to title screen, CPU 4× slower | 1,523 ms | at most 2,000 ms |
| Map pan, CPU 4× slower, widths 150, 380, 1200, three fixtures | median 17, p95 23 ms | median at most 17, p95 at most 25 ms, at Light (to ship) and at Full (to be the default) |
| Live SVG nodes at any zoom | 537 | at most 1,500 |
| Map height on Atlas at 390×800 | 560 px | at least 640 px, enforced from V1.3 |
| Map covered by controls | 18.1% | at most 8%, enforced from V1.3 |
| Month tick | at most 130 ms | unchanged; no art code inside `monthTick` |
| Decoded images | about 0 | at most 12 MB (a browser tab crashed in an earlier long run, so memory is treated as suspect) |
| Save size | under 1 MB at 1936 | unchanged |

### 4.5 Gestures (one table, no clashes)

| Gesture | Result |
|---|---|
| Tap a province | Select it. The sheet opens at peek height and the map re-centres above it. |
| Tap the peek, or swipe it up | Half sheet; swipe again for the full sheet. |
| Swipe the sheet down, or tap open sea | Close the sheet. |
| Drag, pinch | Pan and zoom, with momentum. |
| Double-tap | Zoom in on that point. |
| Two-finger tap | Zoom out. |
| Long-press a province | Start multi-select. Further taps add or remove provinces, and a bar shows the total and the action. |
| Tap a theatre or fleet token | Its orders sheet (existing `thsheet` / `navSheet`). |
| Back (Android gesture or on-screen arrow) | Leave multi-select, then close the sheet, then go to the previous view. Use the History API only if the wrapped test shows it cannot navigate the host page; otherwise show the on-screen arrow only. |

### 4.6 Rendering rules
- SVG and CSS only: no WebGL, libraries or SVG filters on the moving map.
- Texture comes from patterns and strokes, plus at most one low-resolution relief image.
- Tap hit-testing runs in code from province geometry: point in polygon, or the nearest province within 22 px. No invisible halo nodes.
- Animations use `transform` and `opacity`, respect `prefers-reduced-motion`, and stop when the gesture ends.
- **During a drag**, measure two options and keep the faster on the 1934 fixture: rewriting `viewBox` every frame (as now), or moving the SVG with a CSS transform and committing the `viewBox` when the finger lifts.

### 4.7 Who owns which files (for running two workers safely)

| Orders | Files |
|---|---|
| V0 | `tools/`, `test_art_budget.js`, `testdata/`, `ui.css` (tokens only) |
| V1, V2 | `ui5.js` (map), `ui4.js` (`provHTML`), `ui6.js` (`bldHTML`, `bldAsk`), `ui.js`, `ui.css`, `ui3.css` |
| V3–V7 | `art/`, `src/art-*.js`, `build.py`, plus the UI files above |
| G2.1, G2.3 (engine) | `econ.js`, `society.js`, `turn.js`, `state.js`, `ai.js` |

V and G orders may run side by side. Two V orders may not, because they share UI files.

### 4.8 Pinned revision
- Put the workspace under Git. The first commit is the 20 Nov release-gate checkpoint plus G2.2 and `tools/`, tagged `ui-base`.
- Each V order is one commit. Its report names the commit, plus the engine revision it was measured against.
- UI numbers and digests are always compared with the **same engine revision**. If a G order lands in between, re-measure the baseline on the new engine before judging the V order.
- Every handoff zip contains `tools/`, `testdata/` fixtures and `validation/results/ui-baseline.json`.

---

## 5. Work orders

**After every order:**
- `python3 build.py` and `node run_tests.js`.
- `node century.js 7` and `node century.js 3`, with final state digests identical to before the order.
- `python3 wrap_test.py`.
- `python3 tools/shots.py`: 360 and 390 px, 100% and 125% text, light and dark.
- `python3 tools/map_probe.py` against §4.4.

Report in under 300 words with numbers against targets and honest misses. Each order is sized for one worker session.

### V0. Harness and tokens (first)
- **V0.1** Fixtures: saves at about 1840, 1866 and 1934 on seed 7, made with `century.js` and committed under `testdata/`.
- **V0.2** `tools/map_probe.py` (written 22 Nov in this workspace; add it to the pinned revision). Extend it to:
  - load the three fixtures;
  - report boot time, map height, control coverage and Art-detail level;
  - record §4.4 as a baseline JSON. V0 **records only**; it does not assert the layout targets, which V1.3 is there to meet.
- **V0.3** `tools/shots.py`: a fixed list of screens (map at three zooms, peek, half and full sheet, Build tab, lens menu, Cabinet, Works, Wars, an event card) at 360/390 px × 100/125% × light/dark. It also writes one contact-sheet PNG per run for the owner to review on his phone.
- **V0.4** `test_art_budget.js`, picked up by `run_tests.js`:
  - checks sizes per art chunk;
  - checks for no `http` URLs and a single `<style>` in the HTML;
  - checks AA contrast on every colour-token pair in both themes: 4.5:1 for text, 3:1 for large text, map lines and controls.
- **V0.5** Design tokens in `ui.css`, with no visual change yet:
  - a six-step type scale;
  - a 4 px spacing grid, radii and three elevations;
  - motion times of 120, 200 and 400 ms.
- **Done when:** one command prints the baseline table, the file-size and contrast checks run in the suite, and `ui-base` is committed (§4.8).

### V1. Map: touch and space (no new art)
- **V1.1 Labels never collide.**
  - One layout pass: priority by area and importance, greedy placement on rendered boxes, two-line wrapping, abbreviation as a last resort.
  - Labels are at least 11 px rendered; nation names show at Z0–Z1 and province names at Z2–Z3.
  - Lay out again at each gesture end, resize and text-size change, and when owners change (§4.2); never per frame.
  - **Target:** 0 overlapping pairs at widths 150, 260, 380 and 900 on all three fixtures, **and** at every step of a continuous sweep from 900 to 150 in about 12 pinch steps with pans over dense Europe, and after a text-size change.
- **V1.2 Every target tappable.**
  - Hit-test from geometry (§4.6).
  - When two candidates lie within 24 px of the tap, show a small chooser instead of guessing.
  - Markers are at least 44 px.
  - **Target:** 0 markers under 44 px; a scripted tap on each of the 58 small provinces selects it or opens a chooser containing it; a small province beside a theatre marker stays selectable.
- **V1.3 More map.**
  - On the Atlas tab the header compacts: flag, date and End month on one row, with the KPI strip folding to one line that expands on tap.
  - The ticker folds into the header.
  - The mode chips become one **Lens** button. Zoom, locate, next-attention and search share one slim right-hand column.
  - The legend is one line (keep the existing `lgmin` option).
  - **Target:** map at least 640 px tall at 390×800, and controls covering at most 8%.
- **V1.4 A sheet that respects the map.**
  - Three heights:
    - **Peek** (about 96 px): flag, name, the three numbers that matter for the current lens, and one main action.
    - **Half.**
    - **Full.**
  - The map re-centres so the province sits above the sheet. The sheet remembers its last tab.
- **V1.5 Start on the map.** After picking a nation, and after Continue, open the Atlas. The Cabinet badge stays on the tab bar.
- **Done when:** every V1 target is met, and a 24-month scripted play (select, chooser, pinch, theatre order, change lens) has no page errors. No owner build yet; it goes out with V2.

### V2. Build mode: the project you chose, anywhere on the map. Owner checkpoint 1 (construction playtest).
The cost, return and payback rows already exist in `bldAsk`/`bldPay` and move forward. All orders go through `applyCampaignCommand` (buildings: kinds `building` and `queue`) or the existing railway path (`startRail`).

- **V2.1 Choose the project once.**
  - A **Build** button on the Atlas opens a project picker: every building plus Railway, grouped Economy, Military and Civic, with icon and one-line effect.
  - Choosing one enters **Build mode** for that project. A slim bar at the top of the map shows the project, the count selected and the **Estimated total at today's prices**.
  - Provinces where it can be built are highlighted. The rest are dimmed, and tapping one shows why in the bar (for example "Needs a railway here first"), never silently.
  - **The chosen project stays selected** after a batch is confirmed, until the player picks another or leaves Build mode. Doing three batches of schools never means choosing School three times.
- **V2.2 Select provinces on the map.**
  - In Build mode one tap adds or removes a province. Long-press does the same from normal mode (§4.5).
  - "Select all eligible in view" and "Clear" buttons sit in the bar.
  - No tab changes and no sheets during selection.
- **V2.3 Review once, confirm once.**
  - **Review** opens one half sheet listing each province: level now → next, estimated cost, months, expected return, and whether it **starts now** or **joins the queue** (slots from `bldActive`/`buildSlots`).
  - Ineligible or duplicate provinces are listed as **skipped**, with the reason.
  - Totals: **Estimated total at today's prices**, total materials (exact quantities from `bldCost`), the monthly return and the treasury after the first month.
  - If the batch's estimated total exceeds 25% of the treasury, a warning line shows above Confirm. The **whole batch** counts, not each order.
  - **Confirm** issues the orders in one go and reports "Started 3, queued 2, skipped 1", with a link to the Works page.
  - A single province uses the same review sheet, so there is one flow, not two.
- **V2.4 Prices told honestly.**
  - Never show a cost as exact. Wording: "Estimated total at today's prices; materials are bought as they are delivered, so the final bill follows the market."
  - Tests: material **quantities** in the review equal what the engine records on the project; and over the next 12 months, the sum of payments recorded for these projects equals the treasury movement attributed to them (the construction ledger from G1.1).
- **V2.5 Undo where the engine allows.**
  - Queued orders get a 6-second **Undo all queued** toast using `bqdel`.
  - Started orders get none: the engine has no cancel for them. Adding one is a rule change and needs the owner's approval.
- **V2.6 Railway routes.**
  - Pick Railway, tap a start province, then an end province.
  - The route is found by a **new UI-only breadth-first search over connected land provinces we control** (neighbours from `adj`, no sea lanes, no foreign or occupied land). Do not use `findPath`, which takes an army and can cross sea and foreign territory.
  - The preview colours each segment: has rail already (by level), can start now, would queue, or **blocked** with the reason (foreign gap, no tech, level cap). If no all-land controlled route exists, say so and show where it breaks.
  - Confirm reports started, queued and skipped. Railways start through the existing `startRail` path. If railways cannot be queued today, mark the extras **skipped, slots full** rather than inventing a queue.
- **V2.7 On the map afterwards.**
  - Crane badges with a progress ring on each province with work in progress or queued; the badge tap opens the province's queue (reorder `bqmv`, remove `bqdel`).
  - The minister's top three picks appear only when the Build lens is on (V2b), never mixed into the player's own selection.
- **V2.8 The acceptance test (blocking).**
  - Run on 360 px at 125% text, from a fresh start and on the 1866 fixture:
    1. Start on the Atlas.
    2. Choose School.
    3. Select five eligible provinces.
    4. Review once and confirm once.
  - Required:
    - zero tab changes;
    - one confirmation;
    - five school orders exist, and still exist after a save and reload;
    - School is still the chosen project.
  - Then advance six months, start a sixth school from the still-selected project, reload, and find all six on the Works page with their current status (building, queued or done).
  - Repeat the railway route test across at least four provinces, with one blocked segment.
- **Done when:** V2.8 passes, every stated material quantity matches the applied one, payments reconcile with the treasury, no single tap spends money, and the owner gets the build with the device checklist and this task to play:
  - **Owner's task:** order five schools, advance several months, start another project, reload, and find every school in Works with its status.

### V2c. The Works board: every building, every province, one screen. Owner checkpoint 1b.
The map's Build mode stays, for building by place. The Works board is for building by plan. Both share one **basket**, one review sheet and one confirm.

**Measured:** evaluating every building in every province (`bldCan` + `bldPay` + `railCan`) takes 21–30 ms with the CPU slowed 4×, for France, Britain, Russia and China in 1836. That is cheap enough to compute when the board opens, cached until the month changes or an order is placed.

- **V2c.1 Where it lives.**
  - It replaces the top of the Works page, and opens from the Atlas Build button: a choice of "On the map" or "Works board".
  - It is one tap from every tab through the Works entry.
  - The existing planner, Your orders and the annual report stay below it.
- **V2c.2 Status strip** (always visible, one line, tap for detail):
  - treasury;
  - estimated construction spend this month;
  - building slots used and free (`bldActive` / `buildSlots`);
  - orders waiting in the queue.
- **V2c.3 Three views of the same data** (segmented control; the choice is remembered):
  - **By building (default).**
    - A row of building chips, grouped by Military 7, Economy 7, People 9, Culture 2 and Railway, each with an icon and a count of eligible provinces.
    - Below the chips, every province we hold, one row each:
      - name;
      - level pips;
      - status: can build, needs X, building 40%, queued #2 or at maximum;
      - estimated cost;
      - payback;
      - a 44 px tick box.
    - Sort by payback, cost, level or name. Filter by "can build now" or region.
  - **By province.**
    - Every province we hold as a collapsible card.
    - Inside, all buildings as tiles with pips. Tapping a tile ticks it.
    - The card header shows how much is ticked in that province.
  - **Grid** (for an overview):
    - provinces as rows, with a sticky 110 px name column;
    - one building group per page, swiped sideways, at most 5 columns of 44 px cells at 360 px;
    - each cell shows level and state by colour and pip;
    - tapping a cell ticks it.

    The page itself never scrolls sideways; only the grid does.
- **V2c.4 One basket across everything.**
  - Ticks persist while switching chips, views, tabs and the map's Build mode, so one basket can hold schools in nine provinces, railways in three and a hospital in two.
  - A sticky bottom bar shows "14 orders · 3 kinds · estimated £18.2k at today's prices" with **Review**.
  - The basket is kept in `localStorage`, never in the save, and is cleared on confirm or when a new game is loaded.
- **V2c.5 Bulk tools.** None of them spends money; they only fill the basket:
  - **Select all eligible** for the current building.
  - **Raise to level N:** choose a target level, and every province below it is ticked (for example, every school to level 2).
  - **Best value within £X:** ticks the projects with the shortest payback until the estimate reaches £X or the slots run out. Each pick shows the minister's reason.
  - **Fill free slots:** the same, limited to free slots, so nothing waits in the queue.
- **V2c.6 Review and confirm.**
  - The review is Build mode's sheet, grouped by building: per province, the level change, estimated cost, months, and starts or queued or skipped with the reason.
  - Totals: the estimate at today's prices, exact material quantities, monthly return, and the 25% batch warning.
  - **Confirm** once. The result reads "Started 6, queued 8, skipped 1" with Undo for the queued ones (`bqdel`).
  - Railways start through `startRail` or are skipped, as in V2.6.
- **V2c.7 Orders in the same screen.**
  - An **Orders** view lists everything building or queued, with:
    - progress;
    - estimated months left;
    - paid so far (the construction ledger);
    - reorder (`bqmv`) and remove (`bqdel`).
  - It also lists works finished in the last 12 months.
  - Tapping a province name opens it on the map.
- **V2c.8 Fit and alignment rules.**
  - New classes are prefixed `wb-`, so no generic names like `.sum` again.
  - A new browser check, `tools/layout_check.py`, opens every sheet and modal: month summary, decision card, ask sheet, review, Works board views, province sheet at all three heights. At 360×740 at 125% and 390×844 at 100%, light and dark, it asserts:
    - no element wider than its container;
    - no clipped text;
    - every control at least 44 px.
  - It runs in `run_tests.js` whenever Chrome is present.
  - Known map overlaps from the playtest screenshots get fixed in the same order:
    - theatre and port tokens drawn over province names;
    - the toast hiding the zoom-in button;
    - the selection outline cutting through a name.

    Labels avoid the markers' boxes, and toasts sit below the map controls.
- **V2c.9 Acceptance test (blocking)**, `tools/works_board_test.py`, at 360×740 and 125% text, fresh start and the 1866 fixture:
  1. **Schools everywhere:**
     - Works board, School, Select all eligible, Review, Confirm: at most 5 taps, whatever the number of provinces.
     - Every eligible province gets an order, and the orders survive a reload.
  2. **Mixed basket:**
     - schools in every eligible province, railways in three named provinces and a hospital in two;
     - at most 14 taps, one confirmation and zero tab changes;
     - the result matches the review line by line.
  3. **Raise to level 2:** pick a building, then the target level. Only provinces below level 2 are ticked.
  4. **Best value within £X:**
     - The estimate never exceeds £X.
     - The picks are in payback order.
     - Nothing is spent before Confirm.
  5. **Orders view:** after 6 months and a reload, every order is listed with its true status and paid-so-far equals the ledger.
  6. **Layout check:** passes on every screen above.
  7. **Unchanged:** `century.js 7` hash, all tests, pan and label budgets.
- **Done when:** all of V2c.9 passes, the owner gets the build, and he can order a country's worth of construction from one screen in under a minute.

### V2b. Navigation, after the playtest
- **V2b.1 Find your way.**
  - Upgrade **Find province** into search with autocomplete over provinces, nations, buildings and goods, plus recents and pins.
  - Add region chips from `REGION` (48).
  - Upgrade **next theatre** (`nextth`) into **Next needing me**. It cycles idle theatres, unrest hotspots, finished works, shortages and war events, with a short fly-to and a count badge.
  - Keep **Capital**.
  - Add a view history with an on-screen back arrow and a minimap showing the view rectangle (Z2–Z3 only).
  - The view and lens survive tab changes and reloads (`localStorage`).
- **V2b.2 What changed this month.**
  - After End month, a dismissible layer pins:
    - provinces that changed owner;
    - finished buildings and factories;
    - new revolts;
    - battles;
    - new shortages.
  - Tapping a pin opens that province.
  - It reads from existing dispatches and month data only.
- **V2b.3 Build lens and the minister's picks.** The Build lens shades provinces by free slots and best return. Pins show the minister's top three, with the payoff, the odds and what rivals are likely to do, from `briefCalc`. Tapping a pin enters Build mode with that project and province selected.
- **Done when:** a 24-month scripted play (search, back, Next needing me, theatre order, Build lens) has no page errors, and V2.8 still passes.

### V3. Icons and emblems
- **V3.1 Symbol sprite.** One style, as `<symbol>` plus `<use>`:
  - restyle the 40 existing `ICON` glyphs;
  - add 31 goods (the 26 factory types reuse them);
  - add 14 unit types (infantry, cavalry, artillery, engineers, machine guns, tanks, aircraft and the ship classes);
  - add 7 terrains, 12 pop types and 6 governments.
  - `ic(k)` and `mic(k)` keep working, so call sites are unchanged.
  - A debug gallery shows every symbol at 20, 32 and 48 px in both themes.
- **V3.2 Emblems.**
  - Heraldic roundels and shields for all 62 nations, from a data table of charge, tincture and shape.
  - The 16 plain flags get an emblem only where history supports one, Punjab first, as the owner asked.
  - Report each flag left plain, with its reason.

### V4. Map base art. Owner checkpoint 2.
- **V4.0 Spike, then choose (one short report).** Compare two options:
  - **(A)** procedural refinement of today's outlines;
  - **(B)** Natural Earth coastlines fitted to the provinces. This map is not a plain projection, so (B) needs a fitted warp and repair.

  Measure the area change per province, the mismatch in world units and the path size. (A) is the default if (B) moves any Great Power's area by more than 3%.
- **V4.1 Geometry build** (into `src/art-geo.js`, never `world.js`):
  - Node all boundaries and cut them into arcs between junctions.
  - Classify each arc as coast or land boundary, refine it once with a seed, and rebuild every outline from its arcs.
  - Also emit label anchors and axes, port points on the coast and a spatial index for hit-testing.
  - **Target:** the same 184 ids and neighbours, no overlaps, at most one hole, and every province within 2% of its current area.
- **V4.2 Borders.**
  - Draw one static segment per neighbouring pair, styled by ownership:
    - **nation border:** ink with a thin gold offset;
    - **province border:** dotted;
    - **coast:** ink.
  - After a month, restyle only the pairs that changed.
- **V4.3 Sea and coast.**
  - Three offset water-lining bands and wave hatching.
  - About 25 sea names (Atlantic, North Sea, Mediterranean and so on) from a hand-written table of positions and angles.
  - A compass and a cartouche at Z0–Z1.
- **V4.4 Terrain.**
  - Seven `<pattern>` fills clipped to provinces at half opacity; at Z3, a seeded scatter of larger symbols.
  - Optionally a greyscale relief tone (WebP, at most 90 KB) under the fills.
  - Keep each item only if the pan budget holds; otherwise move it to Full only.
- **V4.5 Labels.** Curved nation names along the anchor axis at Z0–Z1, using V1.1's layout.
- **V4.6 Themes and Art detail.** Light and dark palettes, and the three detail levels (§4.3).
- **Done when:**
  - before-and-after contact sheets are attached;
  - pan and node budgets hold on all three fixtures at Full and at Light;
  - digests are unchanged;
  - the owner gets the build.

### V5. Map content and lenses
- **V5.1 Cities.**
  - One marker per province: four sizes by population, era styles (chimneys with factories, spires and domes by culture) and a flagged star for capitals.
  - Z1 shows big cities only.
- **V5.2 Infrastructure.**
  - Railways as track between neighbours, heavier with level.
  - Ports at the V4.1 port points, and forts.
  - At Z3: mines, farms (crop from `p.farm`) and factory stacks, with a red mark on shortage.
  - Construction cranes, unrest flames, and blockade and occupation marks.
- **V5.3 Lens menu.**
  - One popover with an icon and a one-line explanation for each lens: the existing 7 plus Build, Trade and prices (pick a good), Supply and shortages, Culture, Naval and Fronts.
  - Ramps are colour-blind safe and contrast-checked. Where useful, a lens prints its number on each province at Z2–Z3; for example, Industry shows factory levels.
- **V5.4 Lens-aware peek.** The peek's three numbers and its main action follow the active lens: Build shows the best project, Unrest the militancy and a police action, Trade the price and the province's output.
- **Done when:** the node and pan budgets hold at Z2–Z3 on the 1934 fixture, and every lens has a legend, a screenshot and a contrast check.

### V6. War and diplomacy on the map
- **V6.1 Tokens.**
  - Theatre and fleet tokens are 44 px flags with state rings (hold, advance, idle).
  - Draw arrows, front lines, siege rings, battle icons and fleet silhouettes by era.
  - The **Naval** lens draws the 105 sea lanes as dotted routes.
  - Orders open from the token. Never bring back selecting or dragging individual armies.
- **V6.2 Diplomacy lens.** For the selected nation: alliances in gold dashes, rivals in red, guarantees with blue ticks and spheres in hatching. Tapping a nation opens its diplomacy sheet.
- **V6.3 Colonies and occupation** use hatch and stripe patterns by the same rules as V4.2.
- **Done when:** a scripted war on a fixture shows every state on the map, with every marker at least 44 px to tap.

### V7. Pictures for everything else. Owner checkpoint 3.
- **V7.1 Scene engine.**
  - About 20 composable scenes, each at most 4 KB, in 16:7, with era, season and nation palettes:
    - parliament and war council;
    - battlefield and naval action;
    - strike, riot and barricade;
    - harbour and emigrant ship;
    - railway building and factory floor;
    - famine and epidemic;
    - exhibition, treaty and ceremony;
    - telegraph, expedition, flood, fire and discovery;
    - city skyline.
  - A table maps each of the 102 events, the decrees (`DEC`) and the dispatch categories to a scene. A test fails if any of them has none.
- **V7.2 Great works.** Monuments for the 34 great works; the eight world fairs share one hall scene with era variants. Original compositions only.
- **V7.3 Plates.**
  - Generalise `skyline()` into page-top engravings that change with era and industry.
  - Add a one-tap **decade plate** on 1 January of each decade.
- **V7.4 Title and nation pick.** The nation cards gain the emblem and a silhouette of the nation's territory, drawn from the V4.1 outlines.
- **Done when:** every decision card, dispatch, great work and page has art in both themes, and the budget holds.

### V8. Shared modernisation
- **V8.1 Components.**
  - Use the V0.5 tokens everywhere and remove frames nested in frames.
  - Shorten page headers so the first action on each page is visible within 520 px of 800 (the Cabinet's is at about 690 px today).
- **V8.2 Tab bar.**
  - Atlas first and default; then Cabinet with its badge, Economy and Government.
  - One-tap access to Military and Dispatches (open item in `Long_Century_GPT_Plan.md` §4).
- **V8.3 Motion and feedback.**
  - Sheet spring (200 ms), fly-to (400 ms, cancelled by touch) and treasury count-up (300 ms).
  - A short vibration on Confirm where the browser allows it.
  - All of it off under reduced motion.
- **V8.4 Fonts.**
  - Embed Latin subsets of the two fonts as WOFF2 data URLs (at most 130 KB) inside the one style element, with the current fallbacks.
  - Check inside the claude.ai wrapper; if the host blocks data fonts, ship without them and say so.
  - Re-run all overflow checks, because font metrics change.
- **V8.5 Accessibility.** AA contrast throughout, visible focus, labels on map markers, and the search sheet as a list view of provinces and markers (the alternative to the map).

### V9. Release gate and owner checklist
All the checks of `Long_Century_GPT_Plan.md` §3, plus:
- the art budget test and the pan table at 4× slower CPU on three fixtures, at Full and at Light;
- identical digests against the pre-art build;
- an old save loading;
- the wrapped test with art.

**Device checklist for the owner**, sent with each checkpoint build because it cannot be run from a server:
- **Browser:** does it open in Firefox and in the Claude app?
- **Fonts:** do they look like the screenshots?
- **Panning:** is it smooth at world, nation and local zoom? Try each Map detail level.
- **Sheet:** do the swipe gestures and the back arrow behave?
- **Building:** the owner's task in V2.8, plus a railway route across four provinces.
- **Look:** dark theme and 125% text.
- **Layout:** is the bottom bar clear of Android's navigation bar?
- **Stability:** play 30 minutes; any freeze or reload?

---

## 6. Order and why

V0 → V1 → V2 (owner playtest) → V2c Works board (owner playtest) → V2b → V3 → V4 → V5 → V6 → V7 → V8 → V9.

- **V1 and V2 first, then stop for the owner:** the compact header, a reliable picker and Build mode are what he asked for. The minimap, expanded search and illustrations wait for his verdict on the playtest.
- **V3 before V4:** the map art uses the symbols.
- **V7 and V8 last:** they touch other screens and can wait.
- **Engine orders alongside:** with two workers, G2.1 and G2.3 can run beside V0–V3 (§4.7).

---

## 7. Risks

| Risk | Sign | Response |
|---|---|---|
| The phone's GPU is slower than headless Chrome suggests | Owner reports stutter at checkpoint 2 | Art detail Light by default, move terrain patterns to Full, use the transform-during-drag option |
| claude.ai wrapper blocks data fonts or the History API | Wrapped test or owner check fails | Ship system fonts; use the on-screen back arrow only |
| Fitted real coastlines distort provinces | V4.0 shows over 3% area change on any Great Power | Use procedural refinement (A) |
| Art bloats the file and slows boot | Boot over 2,000 ms or file over 1.8 MB | Drop the relief image first, then fonts; lazy-build scenes on first use |
| A UI change alters the simulation | Digest differs | Revert and find the engine call; UI must only read state or issue commands |
| Two workers edit the same file | Merge conflicts or broken build | Follow §4.7; never run two V orders together |

---

## 8. Ways to go astray

- Do not change rules, saves or the simulation for the art, and never edit `world.js`.
- Do not download, trace or copy artwork, illustrated maps or photographs, and do not draw real people.
- Do not add WebGL, libraries, filters on the moving map, a second style element, or network calls.
- Do not rebuild map nodes on every pan or every month.
- Do not bring back individual army selection, and keep infantry, cavalry and artillery distinct.
- Do not let one tap spend money, and do not add a cancel for started orders without the owner's approval.
- Do not call an estimate a price. Do not route railways with army pathfinding.
- Do not judge a UI order against a different engine revision than its baseline.
- Do not ship a screen plainer than today's Overview, or art that lowers contrast below AA.
- Do not report a pass you did not run. Do not trust desktop screenshots for fonts or smoothness; list those as owner checks.

---

## 9. Report template (after every order)

1. **Done:** one line per item.
2. **Numbers:** target, before and after (probe table, art sizes, node counts).
3. **Tests:**
   - the runner table;
   - digests for seeds 7 and 3, which must be identical;
   - the wrapped test;
   - the contact sheet.
4. **Missed:** each miss with its cause.
5. **Weak spots** noticed but not fixed.
6. **Files changed.**
