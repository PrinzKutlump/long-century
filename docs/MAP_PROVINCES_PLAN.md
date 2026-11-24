# Map and provinces plan: true borders, then targeted provinces

Status: proposal for owner approval, revision 4 (24 Nov 2026). Revision 4: the owner dropped compatibility with existing saves, so ids may be renumbered and split migration of old saves is no longer required; ticket ids now follow `docs/MASTER_PLAN.md` (MP, FD, SV). Revision 2 adopted the first Codex/GPT review (finish at 184, pilot 186, evidence-led batches). Revision 3 adopts the second: saves move off localStorage, no lossy save changes, freight by distance, and the province range is decided after the pilot, not before. Replaces the "184 ids" scope of M2b in `docs/ART_MAP_GPT_PLAN.md`; M2a (crosswalk) stands.

## 1. Recommendation

1. **Fix CI first.** The full workflow's century step writes "FAIL" but still exits green, and it never checks the time or save budgets. No province change is approved on a green check until this is fixed.
2. **Finish the historical map at 184** (M2, M3) with an evidence note for every major border.
3. **Move saves off localStorage** (S1) in parallel. The 1 MB budget exists because localStorage holds about 5 MiB per origin, shared by the autosave and the save slot; IndexedDB has hundreds of MB. After S1 the save budget is set by phone save and load time, not bytes. Any encoding change must be lossless.
4. **Pilot 186**: split Lombardy from Venetia and Kashmir from Peshawar, and prove that a split migrates saves without duplicating anything.
5. **Add provinces in small batches, each tied to a named decision**, measured by decade and region after every batch. Planning estimate **about 230–260 provinces**, but the go decision comes from the pilot's 8-seed comparison and a phone playtest; 275 and 360 are benchmarks to test, not commitments.

## 2. What was measured (seed 7, `main` at 3bcdc63)

| Fact | Value | Why it matters |
|---|---|---|
| Provinces | 184 (Europe 52, Africa and Middle East 35, Americas 33, East Asia 30, Russia and Central Asia 17, South Asia 17); 366 neighbour pairs | Coarse outside Europe and inside Germany and Italy |
| Nations with one province | **39** (Hanover, Saxony, Bavaria, Württemberg, Sardinia, Tuscany, Papal States, Serbia, Greece, Afghanistan, Sindh, Korea …) | One lost province ends the state; no partial cessions |
| Combined provinces that break history | LOM "Lombardy & Venetia" (the 1859 war hands over Venetia too); PES "Kashmir & Peshawar" (the 1846 Kashmir transfer cannot leave Peshawar Sikh); SPB "St Petersburg & the Baltic" and MSK "Lithuania & White Russia" (Estonia, Latvia and Lithuania cannot leave Russia without the capital region) | Concrete wrong outcomes, not just looks |
| 1910s wars | COW 10, game 3. Seven of COW's ten are 1918–20 successor-state wars (Estonian, Latvian, Russo-Polish, Hungarian, Lithuanian-Polish, Greco-Turkish, Franco-Turkish) | Part of the war gap is a missing-province problem, not only AI tuning |
| Save at 1936, packed | **976,549 B of 1,000,000** (23,451 B headroom) | The limit is localStorage (about 5 MiB per origin), not the game |
| Save at 1936, saved JSON | 2.5 MB; pops 1.52 MB; the ideology map is 37% of saved pop bytes. `_a` and `_gross` are already skipped by the writer (an earlier figure of 24% derived fields measured memory, not the save) | Savings must be measured packed, on the same save |
| Month at 1936 | 69.5 ms (budget 130) | Roughly linear in pops |
| Hard-coded province ids | ~350 literals in engine and UI | Old ids must keep their meaning |
| OHM 1836 polygons at the 184 anchors | Historical polygon at 168; admin level 4 at only 63; none at 16; Lahore wrongly inside "Company Raj" | Open data is a starting point, not proof; every major border needs a note |

## 3. Findings from the Codex/GPT reviews (adopted)

| Point | Verified | Action |
|---|---|---|
| Century CI step cannot fail | Yes (`full.yml`: if/else, no `exit 1`) | Ticket Q0 |
| LOM includes Venetia, so event `italy1` (1859) transfers Venice | Yes (`events.js` `italy1`, `UNIFY.ITA` needs LOM) | Pilot split |
| PES combines Kashmir and Peshawar | Yes | Pilot split |
| NAG is "Central India & Rajputana", not Nagpur | Yes | **Corrects the M3 instruction of 24 Nov** (see §8) |
| Lahore and Multan already have separate ids; redraw the line, do not add ids | Yes | M2 cut, not a new province |
| Test expansion by decade and region before crediting it | Agreed | Gate on every batch |
| Each new province must enable a specific decision | Agreed | Rule 1 in §4 |
| Phone: search or nearby-province chooser for small provinces; three zoom scales; open a Punjab campaign on Punjab | Agreed | M5 and UI tickets |
| Historical lens: direct rule, princely or protected, contested | Agreed | M3 preview and later lens |

Second review (all checked against the code):

| Point | Verified | Action |
|---|---|---|
| The loader rejects a save missing any map id (`unpack`: "bad provinces") | Yes | Moot: old saves are refused after the save epoch change (SV2) |
| B1 freight charges 3% of base price per land crossing (`FREIGHT.landCost .03`) | Yes | F0: charge by distance, so a new border on the same road does not double freight |
| Four-digit rounding or merging pops changes outcomes | Agreed | No lossy save changes; P0 becomes a lossless experiment |
| B1 test failure: `grainFreight` is skipped in saves, so the full digest differs right after a load and key order differs later | Consistent with the test code | Rebuild or exclude the report on load; compare values independent of key order |
| Calibration counts every game war, including colonial conquests, against COW inter-state wars only | Agreed | Split game wars by kind (inter-state, colonial, civil) |
| Count annexations, plebiscites and unifications separately before blaming map size for destroyed states | Agreed | Calibration report addition |
| Ottoman AI never borrows: test its behaviour in a cash shortage before tuning | Agreed | Test first |
| The PR template exists; "main was never broken" is unproven while the century step cannot fail | Yes | Review corrected |

Where this plan differs from the reviews: the review would stop at 186 and later test 200–216 in batches of two to six. That leaves the 39 one-province nations and the Baltic, Polish and Balkan successor states unrepresentable, which the COW comparison shows costs real wars and settlements. This plan keeps the review's caution (pilot, evidence, measure every batch) but plans for about 230–260.

## 4. Rules for adding a province

A split needs **both**:
1. **A decision:** it enables a named settlement, war goal, port, route, market or scenario choice (for example "cede Lombardy, keep Venetia").
2. **Evidence:** a border ran through it at some date 1836–1936 (COW Territorial Change v6 row, OHM snapshot diff, or a cited map), recorded in `art/geo/seams.csv` with the source.

Never: cosmetic splits, modern-only borders, slivers (minimum about a quarter of the regional median area), empty land (Siberia, Sahara, Arctic). Names of the period in plain English, at most 20 characters; province labels from regional zoom only.

## 5. Tickets in order

| # | Ticket | Lane | Done when |
|---|---|---|---|
| Q0 | **CI gates.** Century step exits non-zero on failure; fails if 1936 ms/month > 130 or save > 1 MB; one hash file `tools/state_hash.txt` checked in CI; failing test tail printed in the job log; PR template added. | Claude/Sonnet | A deliberately broken century run turns the check red |
| M2 | **Historical map at 184** (per ART plan): territories assembled from several pieces, `cuts.geojson` with an evidence note per major border, `adj_diff.md` against the 366 pairs (islands, enclaves, river crossings, straits called out). LAH/MUL: one sovereignty colour, lighter internal line, two centres. | Codex | As ART plan M2 |
| M3 | **Owner checkpoint**: before/after views of Punjab, Italy, East Asia, Africa, the Americas; a playable phone build; the two Indian cuts; each neighbour change. | Owner | Shapes and adjacency approved |
| S1 | **Saves to IndexedDB**: autosave and slots in IndexedDB with `navigator.storage.persist()`; localStorage keeps settings only; existing localStorage saves migrate once; compression in a Web Worker so saving never freezes the screen; export and import as a file, not the clipboard. | Claude/Sonnet | Old saves load; a 5 MB test save writes and reads on a Galaxy A56-class phone; new budget recorded: save ≤ 300 ms of blocked screen, load ≤ 3 s |
| P0 | **Lossless encoding experiment**: ideology as a 7-number array, pops column-wise, no rounding; measured packed on the same 1936 save. | Claude/Sonnet | Save→load→continue gives the identical outcome hash; packed size reported |
| F0 | **Freight by distance**: land freight per km of route, not per province crossing; capacities per route. | Claude/Sonnet | Splitting a province on a route leaves its freight unchanged |
| P1 | **Pilot 186** (after F0) on a `balance` branch: LOM → Lombardy + Venetia; PES → Peshawar + Kashmir. `italy1` cedes Lombardy only; `italy3` (1866) cedes Venetia; a Kashmir-only transfer works. On a new game and on a save made with the same build: pops, assets, queues and rail capacity are split, never duplicated (old-save migration not required). | Claude/Sonnet (engine), Codex (shapes) | Playable test: cede Lombardy, Venetia stays Austrian, then queue projects in three provinces with one confirmation on the Works board. Same 8 seeds on 184 and 186: migration, freight on the same routes, peak save, slow-month time on a phone |
| P2 | **Seam list**: `tools/seams.py` from COW Territorial Change v6 and the OHM diff writes `seams.csv` (parent, child, decision, evidence). | Codex | Every COW transfer 1836–1936 maps to a seam or "covered" |
| P3 | **Province table as data**: `art/geo/provinces.csv` generates `src/world.js`; ids may be renumbered (compatibility lifted), but keep stable ids where the province is unchanged to limit churn; HYDE 3.3 1840 population shares for children. | Codex + Sonnet | Byte-identical rerun; national totals unchanged |
| B1–B4 | **Batches of 6–15 provinces**, each approved by the owner, in this order: (1) Italy and Germany (Savoy and Nice, Romagna, Holstein and Schleswig, Bavarian Palatinate, Hesse, Alsace and Lorraine); (2) Balkans and Black Sea (Eastern Rumelia, Thessaly, Dobruja, Bessarabia, Kars and Batum, Crete); (3) successor states (Estonia, Latvia, Lithuania, Slovakia, Bohemia split check); (4) Punjab and North India (Derajat, Jullundur, Cis-Sutlej, Bahawalpur, Oudh); then the rest of the world. | Codex + Sonnet | Per batch: save ≤ 1 MB and month ≤ 110 ms at 1936; pan median ≤ 17 ms, p95 ≤ 25 ms; controls ≤ 8%; tap probe passes; decade-by-region report shows no target worse by more than 10% |

## 6. Effect on other work

- Release B: the freight graph is built from adjacency, so capacities regenerate after each batch.
- Civilising programmes: regions named in C1–C3 become province lists.
- Calibration: rerun `tools/calibrate_cow.py` after the pilot and each batch, by decade and region.

## 7. Data needed from the owner

- COW Territorial Change v6: `terr-changes-v6.zip` from https://correlatesofwar.org/data-sets/territorial-change/
- HYDE 3.3 population grids (baseline, 1830 and 1850) from https://public.yoda.uu.nl/geo/UU01/94FNH0.html; confirm the licence on that page.

## 8. Correction to the M3 instruction of 24 Nov

The instruction "NAG = Vidarbha" was wrong: NAG is "Central India & Rajputana". Replace it with: BOM = Bombay Presidency and Gujarat; NAG = Central India and Rajputana agencies; report where the Nagpur kingdom (Vidarbha) and Chhattisgarh fall, and move the NAG anchor into Central India if it sits in modern Maharashtra. Show direct British rule, protected states and independent states differently in the historical lens.

## 9. Decisions for the owner

1. Approve the order: Q0, then M2/M3 at 184 with S1, P0 and F0 alongside, then the 186 pilot, then batches.
2. Approve about 230–260 as the working range (360 a ceiling), with the two-condition rule in §4.
3. Approve the NAG correction in §8.
