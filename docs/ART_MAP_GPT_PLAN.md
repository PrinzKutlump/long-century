# The Long Century: Art and Earth-Map Plan (written for GPT/Codex to implement)

> Current rules, ticket ids and order: `docs/MASTER_PLAN.md` (v2). Where this plan's rules or ticket names differ, the master plan wins; this file keeps the map and art detail.

Status: plan, 23 Nov 2026. Replaces the "how" of UI/Art plan orders V3–V5 and keeps their goals, budgets and art rules (see `docs/archive/plans/Long_Century_UI_Art_Plan.md` §3 and §4). Each ticket below is self-contained: an implementer needs this file, `CLAUDE.md`, and the files the ticket names.

## 0. Rules for the implementer (read first)

1. **One ticket per branch** `t/<ticket-id>-<slug>`, one pull request to `main`, never push to `main`.
2. **Never open whole `src/*.js` files.** `src/world.js` is one line of about 150 KB. Use `python3 tools/fn.py <name>` or small scripts that load the data with `node -e`.
3. **The game makes no network calls.** Downloads happen only in the `geodata` workflow (ticket M0) or by the owner. Everything shipped is generated at build time and committed.
4. **Art rules (a break is a defect):** all artwork original and made in code (SVG, Python, Node) or hand-authored vectors; never trace or copy paintings, photos, illustrated maps, logos or characters; no likenesses of real people; flags from simple geometry. Geographic *data* (coastlines, rivers, relief) from public-domain sources is allowed and credited.
5. **Licences:** ship only public-domain, CC0, OFL, MIT, ISC, Apache-2.0 or BSD material. GPL, CC BY-NC or CC BY-SA sources may be used **as a visual reference only**: never copied into the repo or the game. Every shipped asset gets a line in `docs/ASSETS.md` (file, source, licence, author).
6. **Determinism:** generation scripts use fixed seeds, sorted iteration, no `Date`, no `Math.random`. Running a generator twice gives byte-identical output (checked in CI).
7. **Gameplay must not change by accident.** Province ids, owners, populations and the `adj` list are game data. A ticket that changes `adj` must list every change in its PR and is labelled `balance`. Otherwise `node century.js 7 SWI --quiet` must print the same `stateHash` before and after.
8. **Budgets (from the UI/Art plan):** map pan median ≤17 ms, p95 ≤25 ms at 4× CPU throttle; map ≥640 px tall on a 390 px phone; controls cover ≤8%; built HTML grows by at most 1.5 MB in total for all art; save size unchanged.
9. **Report** (end of every PR description, 100–150 words): commit, numbers before/after (hash, ms/month, pan median/p95, HTML size), tests run, first remaining risk, and one contact-sheet image (CI artifact link).

## 1. What the map is today (measured)

- `src/world.js`: `const WORLD={"w":3000,"h":1549,"provs":[...]}`. Each province has `id`, `n` (name), `o` (owner tag), `x`,`y` (centre), `pop`, `c` (culture), `t` (terrain), `adj` (neighbour ids), `sea`, `d` (SVG path in world units) and `a` (area).
- 184 provinces, hand-drawn on a stylised projection (not a true Earth projection).
- The map is one inline SVG, drawn by `src/ui5.js` (`applyView`, `placeLabels`, `tapAt`).

## 2. Open sources to use

### 2.1 Shipped in the game (public domain or permissive)

| Source | What we take | Licence | Where to get it |
|---|---|---|---|
| Natural Earth vector, 1:10m and 1:50m | coastlines, land, lakes, rivers, admin-1 states/provinces (modern, used as building blocks), glaciated areas | public domain | GitHub repo `nvkelso/natural-earth-vector` (reachable from GitHub Actions) |
| Natural Earth raster, shaded relief (e.g. SR_50M) | greyscale relief tone under the map | public domain | naturalearthdata.com download (owner or M0 workflow) |
| NOAA ETOPO 2022 (optional) | elevation, to classify mountain/hill terrain per province | US government work, public domain | NOAA NCEI |
| OpenHistoricalMap | 1836–1936 country and province boundaries, railways, canals, city founding dates | CC0 by default (check each feature's `license` tag; drop any that are not CC0) | Overpass API at openhistoricalmap.org |
| Fonts: EB Garamond, IM Fell English SC | map and UI type | OFL-1.1 | npm `@fontsource/eb-garamond`, `@fontsource/im-fell-english-sc` |

### 2.2 Reference only (look, never copy into the repo)

| Source | Why | Licence |
|---|---|---|
| `aourednik/historical-basemaps` (world_1815, 1880, 1914 GeoJSON) | quick check of who owned what | GPL-3.0 |
| CShapes 2.0 (1886 onward) | state borders after 1886 | CC BY-NC-SA 4.0 |
| Shepherd's Historical Atlas (1911–1926), Perry-Castañeda Library | period borders; layout ideas for cartouches only | public-domain scans, but the art rule still forbids tracing |

### 2.3 Tools (all free)

| Tool | Use | Licence | Runs where |
|---|---|---|---|
| `mapshaper` (npm) | clip, dissolve admin-1 into game provinces, simplify, keep shared borders topologically exact | MPL-2.0 | GitHub Actions and local; build-time only |
| `d3-geo`, `d3-geo-projection` (npm) | project lon/lat into the 3000×1549 world (try Robinson, Winkel Tripel, Miller) | ISC | build-time |
| `topojson-server`, `topojson-client` (npm) | shared arcs: one border line per neighbouring pair | ISC | build-time |
| `svgo` (npm) | shrink generated SVG | MIT | build-time |
| `sharp` (npm) | relief raster to small WebP | Apache-2.0 | build-time |
| Playwright + Chrome | contact sheets, pan profiling | Apache-2.0 | CI `browser` tier |
| Inkscape CLI (optional, `apt install inkscape` in CI) | render SVG previews | GPL (tool only, output is ours) | CI |
| GitHub Actions, Releases, artifacts | run generators, publish contact sheets and builds | n/a | GitHub |

Build-time npm packages go in `art/package.json` (devDependencies), never in the shipped game.

## 3. The big choice: true Earth geography (recommended)

Today's map is a stylised drawing. The owner wants a real Earth map. Plan:

- **Project real geography** (Natural Earth land, coasts, lakes, rivers) into the same 3000×1549 world box with one fixed projection (chosen in M1).
- **Rebuild each of the 184 game provinces** as a union of Natural Earth admin-1 areas (and admin-0 for small countries), using a hand-checked table `art/geo/province_map.csv` (`province_id, ne_admin1_codes, notes`). Where an 1836 border cuts across a modern admin-1 unit, split it with a cut line stored in `art/geo/cuts.geojson` (drawn from OpenHistoricalMap CC0 data or as a straight line by hand, never traced from a copyrighted map).
- **Keep game data stable:** same ids, owners, cultures, populations, terrain. Centres `x,y` and areas `a` are recomputed from the new shapes. `adj` is recomputed from shared borders and compared with today's list; differences go to the owner as a short table (keep old, accept new) before merging.
- **Fallback:** if the true-geography shapes break budgets or gameplay, keep today's shapes and only restyle them (the UI/Art plan's option A).

## 4. Tickets

Order: M0 → M1 → M2 → M3 (owner checkpoint) → M4 → M5 → M6 → A1 → A2 → A3 → M7. M-tickets are map; A-tickets are art. Each needs the previous one merged unless stated.

### M0 · Geodata fetch workflow (Haiku/GPT-mini level)
- Add `.github/workflows/geodata.yml`, run by hand (`workflow_dispatch`). It downloads the Natural Earth 1:10m and 1:50m layers listed in §2.1 from `nvkelso/natural-earth-vector` at a pinned commit, and an OpenHistoricalMap Overpass extract of admin_level 2 and 4 boundaries valid on 1836-01-01, 1866-01-01, 1900-01-01 and 1914-01-01, keeping only features with no `license` tag or a CC0 one.
- It clips everything to the game's extent, writes compact GeoJSON under `data/raw/geo/` with a `SOURCES.md` (URL, commit or query, date, licence, SHA-256 per file), and opens a PR.
- **Done when:** the PR adds data only, total size under 25 MB, the SHA list matches, and `docs/ASSETS.md` has the source lines.

### M1 · Projection spike (one report, no game change)
- `art/geo/spike.mjs`: project Natural Earth land with Robinson, Winkel Tripel and Miller into 3000×1549 and overlay today's province centres `x,y`.
- For each projection report: mean and worst distance between each province centre and the projected location of its real capital or main city (table `art/geo/anchors.csv`, one lon/lat per province, written by the implementer from general knowledge and checked against Natural Earth populated places), Europe's share of the screen, and how much of the Pacific is wasted.
- Pick the projection, centre longitude and crop that keep Europe at least as large on screen as today.
- **Done when:** a contact sheet of the three options and the chosen parameters in `art/geo/projection.json`.

### M2 · Province rebuild (largest ticket; split into M2a Europe and Middle East, M2b rest of the world)
- `art/geo/province_map.csv` for all 184 ids; `art/geo/cuts.geojson` for 1836 borders that split modern units.
- `art/geo/build_geo.mjs` (Node, mapshaper + topojson): dissolve, apply cuts, project (M1), simplify to a path budget, build shared arcs, and write `src/art-geo.js` containing: per-province path, centre, area, label anchor and axis, port points on coast arcs, and the list of shared arcs with their two sides (province/province, province/sea).
- Write `art/geo/adj_diff.md`: neighbour pairs gained and lost compared with `WORLD.provs[*].adj`.
- `src/world.js` is not edited. The game reads shapes from `art-geo.js` when present and falls back to `WORLD.provs[*].d`.
- **Done when:** 184 ids present, no overlaps (area of pairwise intersections under 0.1% per province), no gaps on land borders, no province with more than one hole, `art-geo.js` under 600 KB before compression, the generator is byte-identical on a second run, and `stateHash` is unchanged (because `adj` is not used yet).

### M3 · Owner checkpoint: the new world
- Build with the new shapes (current flat style), publish as a GitHub Release `map-preview-N`, and attach contact sheets at the four zoom bands for Europe, India, China and Japan, the Americas, Africa.
- Post `adj_diff.md` as a table: for each changed pair, "keep old / accept new". The owner decides; the decisions go into `art/geo/adj_overrides.csv`.
- **Done when:** the owner has approved the shapes (or listed fixes) and the adjacency table.

### M4 · Adjacency switch (label `balance`)
- Apply the accepted neighbour list from M3 to the game (generated into `src/art-geo.js`, read at load; saves stay compatible because ids do not change).
- Run the seeds tier (8 seeds). Report wars per century, states destroyed, Germany and Italy formation, compared with `main`.
- **Done when:** seat-independence and save/resume tests pass, and no target in the engine plan's §T table gets worse by more than 10%.

### M5 · Coasts, sea and rivers (UI/Art V4.2–V4.3)
- From the shared arcs: one static segment per neighbouring pair, styled by type (nation border: ink with thin gold offset; province border: dotted; coast: ink). After each month, restyle only pairs whose owners changed.
- Sea: three offset water-lining bands from coast arcs, light wave hatching as an SVG `<pattern>`, about 25 sea names from a hand-written table (position, angle, size), compass and cartouche at Z0–Z1 drawn in code.
- Major rivers and lakes from Natural Earth (1:50m), shown from Z1; navigable rivers thicker.
- **Done when:** pan budget holds on the 1934 fixture at Full and Light detail, contact sheets in both themes, HTML growth recorded.

### M6 · Relief and terrain (UI/Art V4.4)
- Relief: Natural Earth shaded relief projected and cropped to the world box with `sharp`, greyscale WebP at most 90 KB, under the nation fills at 15–25% opacity (Full detail only).
- Terrain symbols: seven original `<pattern>` fills (mountains, hills, forest, jungle, plains, desert, marsh) drawn in code, clipped to provinces by `t`. If ETOPO is available, an optional check that mountain provinces really sit high.
- At Z3, a seeded scatter of larger terrain symbols inside each province (deterministic by province id).
- **Done when:** budgets hold; Light detail turns relief and scatter off.

### A1 · Icon sprite (UI/Art V3.1)
- `art/icons/*.svg` (24 px grid, one stroke-and-wash style, colours from CSS variables), combined by `art/build_icons.mjs` into one `<symbol>` sprite in `src/art-sym.js`.
- Set: restyle the 40 existing `ICON` glyphs; 31 goods; 14 unit types (keep infantry, cavalry and artillery distinct); 7 terrains; 12 pop types; 6 governments. `ic(k)` and `mic(k)` keep working.
- A debug gallery page (`?gallery`) shows every symbol at 20, 32 and 48 px in both themes.
- **Done when:** every icon readable at 20 px in a Playwright screenshot, sprite under 120 KB, no call site changed.

### A2 · Emblems and flags (UI/Art V3.2)
- Data table `art/emblems.csv` (tag, field colours, division, charge, tincture, shape). Charges from a small original library (eagle, lion, crescent and star, sun, cross, crown, wheel) drawn in code.
- 62 nation emblems; the 16 plain flags get an emblem only where the historical design is known (Punjab first). Report each flag left plain and why.
- **Done when:** gallery screenshot, sizes, and a list of sources used for each design (descriptions, not images).

### A3 · Cities and infrastructure (UI/Art V5.1–V5.2)
- City markers in four sizes by population, era styles (chimneys appear with factories; spires or domes by culture) and a capital star.
- Railways drawn along shared arcs between neighbouring province centres, heavier with level; ports at M2 port points; forts; at Z3 mines, farms and factory stacks; construction cranes and unrest marks.
- Optional: OpenHistoricalMap (CC0) railway lines as a visual guide for routing between centres, simplified, never as gameplay data.
- **Done when:** node and pan budgets hold at Z2–Z3 on the 1934 fixture.

### M7 · Credits, licences and release check
- `docs/ASSETS.md` complete; an in-game Credits panel lists Natural Earth, OpenHistoricalMap contributors, fonts (OFL text embedded), and tools.
- Script `tools/licence_check.mjs` fails CI if any file in `src/` or `art/` lacks an `ASSETS.md` line or comes from a non-permitted licence.
- **Done when:** the licence check runs in the quick CI tier and passes.

## 5. How GitHub runs this

- **Workflows:** `geodata.yml` (M0, manual), `art.yml` (on PRs touching `art/`: regenerate, fail if the output differs from what is committed, upload contact sheets), and the existing `browser` tier for pan budgets.
- **Labels:** `art`, `ui`, `balance`. Milestone: "Release V".
- **Contact sheets:** generated by Playwright in CI and attached to the PR as artifacts; the owner views them on the phone.
- **Owner checkpoints:** M3 (new world and neighbours) and after M6 (full map look), each as a GitHub Release the owner plays.

## 6. Ticket brief template (paste into the GitHub issue)

```
Ticket: <id> — <title>
Branch: t/<id>-<slug>   Base: main @ <commit>
Goal (player view): <one sentence>
Read: docs/ART_MAP_GPT_PLAN.md §<n>, CLAUDE.md. Functions: <2–4 names via tools/fn.py>.
Inputs: <data files>   Outputs: <files>
Must not: edit src/world.js; add network calls; trace or copy images; change stateHash (unless labelled balance).
Done when: <checks copied from the plan>
Report: 100–150 words + contact sheet link.
```

## 7. Risks

- **Province shapes vs gameplay:** true geography changes neighbours; M3/M4 make that an explicit owner decision with a seeds check.
- **File size:** 1:10m data is large; simplification budgets in M2 and the 1.5 MB total cap protect phones.
- **Pan speed:** more SVG nodes; every map ticket re-measures and moves extras to Full detail.
- **Licence drift:** OpenHistoricalMap features can carry other licences; M0 filters them and M7 enforces it.
- **Historical accuracy of cuts:** cut lines are approximations; each has a note and can be corrected later without touching gameplay.
