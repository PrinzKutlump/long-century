# The Long Century: master plan v2 (rules, stages, tickets, targets)

Status: plan, 24 Nov 2026 (Claude), after a full audit, a cleanup of all plans and a 316-century stress run. **Supersedes** master plan v1 and every plan now in `docs/archive/` (GPT plan, engine plan, UI/art plan, civilising plan, PLAN.md, checkpoint plans, the 24 Nov review). Detail that still applies is cited as "[archive: file §]". Game design: `docs/DESIGN.md`. Verified state and stress results: `docs/STATUS.md`. Map detail: `docs/MAP_PROVINCES_PLAN.md`, `docs/ART_MAP_GPT_PLAN.md` (their rules sections yield to §1 below).

Roles: Codex/GPT implements game code; Claude plans, writes ticket issues, writes test tooling and docs, audits every PR and reviews this plan four times a day; the owner decides, plays and merges where Claude's merge is not permitted.

## 1. Rules (one list; the archived plans' rule lists are retired)

1. **Same rules for every nation**, player and AI. Differences come from data (flavour packs, region tables, events). No nation tag in core code.
2. **Game theory on every major decision**: one evaluator for adviser and AI (DESIGN §10).
3. **War by theatre**: no selecting or dragging individual armies; infantry, cavalry and artillery stay distinct; armies are visible and move on the map, and theatre orders are given with easy map controls (owner 27 Nov, B45; LIVING_WORLD §3.2).
4. **Phone first**: 360 and 390 px, 100% and 125% text, 44 px targets, no sideways page scroll, map ≥ 640 px, controls ≤ 8%.
5. **Offline first** (owner 27 Nov, B41): the whole game works without a connection; online extras (ads, cloud saves, the Historian, store) are welcome but never inside the simulation. **Full app** (B20, B46): the Vite multi-file build is the game (web app and Capacitor Android); `build.py`'s single HTML file stays only for tests and tools until PL9 moves them. Plain global JavaScript in the engine for now (modules: PL3a), wrapper-safe (no `document.write`, no `document.body.innerHTML=`).
6. **Saves**: old saves need not load until the first alpha (owner, 24 Nov). A save made by a build must load in that build and continue **exactly** (the stress tier checks this). From the alpha on, saves of the same release line load (SV5).
7. **Randomness only from `rng()`**; previews never draw from it. No scratch value is read in a month in which it was not recomputed.
8. **Stated effects are applied effects**, no more and no less.
9. **Ids from data**: provinces, nations and regions are read from tables; an event whose actors no longer exist does not fire.
10. **Conservation**: goods, money and people have a source and a sink.
11. **Art from allowed sources only**: our own, AI-made with prompt on record (owner 27 Nov, B42), PD, CC0, OFL, MIT, ISC, Apache-2.0 or BSD, each in `docs/ASSETS.md`. No raw Correlates of War files in the public repository.
12. **Plain English** on screen; a disabled button says why.
13. **Owner's standing wishes**: nation flags; a Settings cheat adding £100 million per press (how it fits achievements and revenue: CHEAT1); Android first (B20, replaces "web only, no APK"); a modern UI with the Devlet-i Âliyye old-book look as an optional theme (A18).
14. **Budgets** (until PL8 measures a phone; rewritten for the daily clock by DAY0/DAY9): simulation ≤ 4 ms per day in Node at 1926–36 (today ≤ 90 ms per month median on CI, browser ≤ 130 ms); map frame ≤ 17 ms median, ≤ 25 ms p95 on the A56; first download ≤ 3 MB, media loaded on demand with per-file budgets (MED1); save ≤ 300 ms blocked screen and load ≤ 3 s (the old 1 MB save cap retires with SV1/SV3).
15. **Process**: one ticket, one branch `t/<id>-<slug>`, one PR; a ticket names its state-hash change and why; CI decides pass or fail; no merge with a red stress run on the same base (from QA1).

## 2. Re-evaluation of the previous plan

| Previous choice | Verdict | Change |
|---|---|---|
| Foundations first (CI gates, saves, source split) | **Keep** | Add stability: four engine bugs found by the stress tier go first (FX1–FX4) |
| Alpha as a narrow Punjab grain scenario | **Keep, but not alone** | The owner plays every Pages build from now (QA5); the alpha stays the tutorial slice |
| Grow to 230–260 provinces after the pilot | **Keep with a new gate** | Month time is already over budget in the 1930s on many seats (Node p95 164 ms); province batches MP7+ wait for perf headroom (PF1–PF3) |
| Design specified system by system | **Incomplete** | Missing: demography as a hub, religion, national flavour packs, naval races, war exhaustion, trade policy, money and banking, history ledger. Added in DESIGN and in new tracks DM, NF, NV, TR, FI |
| Programmes (Tanzimat, Meiji, unification) as the flavour vehicle | **Keep inside a wider frame** | Flavour packs (NF) hold programmes, decisions, modifiers and AI inclinations as data |
| Old targets (wars 30–45, states destroyed 8–15) | **Retired** | Targets from COW by kind and decade (§T) |
| Milestones M0–M8 | **Renamed Stages S0–S8** | "M" clashed with the old art tickets M0–M7 and the military tests `test_m*.js` |
| Review four times a day with merges by Claude | **At risk** | This session's merge attempt was refused by the permission classifier; the owner merges, or allows Claude's merges for the scheduled review |

## 3. Stages and gates

> **Order from 27 Nov 2026:** Android first. Two stages, A (stable base on a phone) and B (dynamic map and modern UI), now come before the alpha; the stage order with every ticket is in [ROADMAP.md](ROADMAP.md) §2. The gates below still apply.

| Stage | Contents | Gate (all must hold) |
|---|---|---|
| **S0 Foundations and stability** | Open PRs (#22 FD1, #23 PL1, #25 PB5), QA1, FX1–FX6, PB2 owner settings, PB3–PB4, PL2, PL3a/b, PL4, PL7, SV1–SV4, CA1 | Stress tier green: 0 crashes, 0 invariant breaks, 0 resume divergences, 0 phantom income; saves in IndexedDB; no line over 300 chars; ids in data |
| **S1 True map** | MP1–MP5, FD2, WD1, NF0–NF1 | Owner approves the 184 historical map; 186 pilot plays; no tag tests in core |
| **S2 Alpha** | FD3–FD5, AI1, UI1a, UI3, UI9, UI11, SC1, RL1, RL3, QA5 | Five testers' pass marks [archive: DEV_WORKFLOW §7b]; owner has played three Pages builds |
| **S3 Performance and provinces** | PF1–PF3, SO4, MP6–MP10, WD2–WD4, MI6, HI5 | Node p95 ≤ 90 ms at 1926–36 on every stress seat; calibration not worse by > 10% per batch |
| **S4 Economy, demography and society** | DM1–DM6, EC1–EC6, FI1–FI3, TR1–TR3, SO1–SO3, FD6–FD7 | §T targets for population, literacy, factories, prices, defaults |
| **S5 Politics, programmes and flavour** | PO1–PO6, RS1–RS9, NF2–NF5, HI1–HI4 | Japan, Ottoman, Germany, Italy targets on 6 of 8 seeds; every priority pack loaded |
| **S6 Diplomacy, war, navy and AI** | DP1–DP7, MI1–MI11, NV1–NV3, AI2–AI6, HI6 | War counts by kind and decade inside COW bands; war length p90 ≤ 48 months |
| **S7 Whole world and art** | MP11–MP14, AR1–AR8, UI2, UI4–UI8, UI10, UI12–UI13, SC2–SC4, CA2–CA5 | Art budgets; every nation playable under the same rules |
| **S8 Release** | RL2, RL4–RL6, SC5, release gate | Phone gate, licences, PWA |

## 4. Tickets

Size: S under 60k tokens; M one day; L split first. "After": tickets that must merge first. A ticket becomes a GitHub issue labelled `ticket` when its "after" list has merged. ✔ done, ◐ PR open.

### QA Quality and stress (Claude writes tooling; Codex fixes what it finds)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| QA1 | Stress tier: `tools/stress/` and `stress.yml` (316 centuries, resume checks, fuzzing, interface sweep of 62 nations) ◐ branch `t/stress-harness` | S | — | Merged; weekly run on main; report in the job log |
| QA2 | Conservation checks in the stress runner: goods (supply = use + stock change + loss), money (minted, destroyed, external flows), people (births − deaths ± migration) | M | QA1 | Report sections for each; zero breaches on main after FX1 |
| QA3 | Resume checks in the full tier (seed 7 at months 240 and 720) | S | FX1 | Full tier fails on divergence |
| QA4 | Per-run JSON as a release asset of the weekly run, so reviewers without artifact access can read it | S | QA1 | Asset attached |
| QA5 | Owner playtest loop: each Pages build has a feedback link; owner notes become `feedback` issues | S | PB5 | Three owner sessions recorded |

### FX Fixes from the stress tier (engine lane, label `balance` where outcomes change)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| FX1 (#27) | **Phantom factory output and resume divergence.** In `econMonth` production, a factory skipped by `if(f.lv<=0\|\|!goodOK(c,f.g))continue` keeps last month's `_out`, `_e`, `_im`; settlement then pays revenue on output never made (64 level-0 factories at 1856, 104 at 1896 on seed 3) and, because `_im` is not saved, a loaded game prices inputs differently (40 of 948 resume checks diverge). Zero them on skip; compute `im` where used | S | — | Stress: 0 resume divergences, 0 level-0 factories with output; hash change explained |
| FX2 | **Endless wars**: p90 62 months, max 337. Exhaustion forces talks; a stalemate past 36 months ends in a white or status-quo peace through the evaluator | M | FX1 | p90 ≤ 48, max ≤ 120 months on 128 seeds |
| FX3 | **Treasury discipline**: GBR (17 of 256 runs, ~182 months negative, low −£954k) and China (10 runs, ~319 months) run deficits for years. Find the spending path (GBR: `companyBudget` special case in `econ.js`; China: army upkeep?) and make every actor cut or borrow by the same rule | M | FX1 | No nation below zero for more than 12 consecutive months on 128 seeds |
| FX4 | **Save size**: 82 of 316 runs exceed 1 MB (max 1.18 MB). Folded into SV1 (#4), now the second engine ticket; interim trims only if SV1 slips | S | — | Max ≤ 1 MB on the stress set, or SV1 merged |
| FX5 | **Nation tags in core**: 18 tag comparisons in `state`, `econ`, `build`, `modern`, `politics` move into data (pack fields) | M | WD1 | grep finds none in core files; hash identical except where noted |
| FX6 | **Page layout sweep**: Research, Military, Politics, Nation, Works-as-page, World and Overview fail the layout audit (8,396 violations, mostly controls under 44 px and clipped labels) | M | PL3b | `tools/stress/ui_sweep.py` reports 0 for these pages at 360×740 @125% |

### PB Public repository (✔ PB1, PB6; ◐ PB2 settings, PB5)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| PB2 | **Owner settings** from `docs/PUBLIC_REPO_SETTINGS.md`: branch protection on `main` (*now* off), required checks quick and full, fork-PR approval | — | — | Settings confirmed |
| PB3 | Derived calibration data only (Codex claimed) | S | — | Report regenerates without raw COW |
| PB4 | Re-run geodata in public; release `geodata-run-1` | S | PB2 | Checksums match |
| PB5 | Pages deploy (◐ #25). **Owner: enable Pages with source "GitHub Actions" before merging** (*now* off; the deploy job would fail) | S | Pages on | Game opens from the Pages address on the phone |

### PL Platform and CI (◐ PL1 #23)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| PL1 | CI gates ◐ #23 (audited APPROVE) | S | — | A planted failure turns CI red |
| PL2 | CI wall-clock diet (minutes are free on a public repo): docs skip CI, 2 balanced shards, cancel superseded runs | S | PB2 | Full tier ≤ 10 min |
| PL3a | Source split, engine files: no line over 300 chars, no file over 600 lines | M | PL1 | Hash identical on seeds 3 and 7 |
| PL3b | Source split, interface JS and CSS | M | PL3a | Layout and Playwright tests pass |
| PL4 | Province ids as data (~350 literals to region tables) | M | PL3a | No province literal in engine code |
| PL5 | ESLint minimal and `@ts-check` on `G`, nation, province | M | PL3b | Zero errors |
| PL6 | Tests into `tests/engine` and `tests/browser`, one quiet runner | S | PL3b | CI uses it |
| PL7 | Outcome policy: hash for refactors only; features judged by the §T table from the seeds and stress tiers | S | PL1, QA1 | Seeds tier writes §T to the run summary |
| PL8 | Phone bench: `?bench` mode, Playwright 4× CPU throttle in CI, owner runs it on the Galaxy A56 | M | SV1 | First phone numbers in `docs/PERF.md` |

### SV Saves
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| SV1 | IndexedDB saves, worker compression, file export and import | M | PL1 | 5 MB save round-trips; ≤ 300 ms blocked screen |
| SV2 | Save epoch 2: delete legacy repair, decode paths and `testdata/` legacy fixtures; refuse older saves with a plain message | M | SV1 | Legacy code and fixtures gone |
| SV3 | Lossless compact encoding (ideology arrays, pops column-wise, derived fields out) | M | SV2 | Save → load → continue identical |
| SV4 | Save/resume invariance in the quick tier | S | FX1 | In quick tier |
| SV5 | From the alpha: same-release-line saves load | S | RL1 | Test loads the previous alpha save |

### PF Performance (new)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| PF1 | Profile the slowest months (worst single month 1.1 s; JAP and FRA seats 200 ms/month in the 1930s) by system, from the stress seeds | S | QA1 | Table of causes in `docs/PERF.md` |
| PF2 | Fix the top two causes (caching, quarterly demography for small pops, bounded histories) | M | PF1 | Node p95 ≤ 110 ms |
| PF3 | Pop merging (SO4) if PF2 is not enough | M | PF2 | Node p95 ≤ 90 ms; outcomes within bands |

### MP Map and provinces (detail: MAP_PROVINCES_PLAN, ART_MAP_GPT_PLAN). M2a crosswalk ✔ (private PR #17; public issue #26 to be re-scoped as MP1a)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| MP1a/b/c | Historical shapes at 184 with evidence notes: Europe and Middle East / Asia / Americas and Africa | M each | — | `cuts.geojson` notes; ART plan M2 checks |
| MP2 | Owner checkpoint: preview build, contact sheets, `adj_diff.md` | S | MP1 | Owner approves |
| MP3 | Adjacency switch and straits table | M | MP2 | 8-seed table not worse by 10% |
| MP4 | `provinces.csv` generates `world.js` | M | PL4, MP3 | Byte-identical rerun |
| MP5 | Pilot 186: Lombardy/Venetia, Peshawar/Kashmir | M | MP4, FD2 | Cede Lombardy, Venetia stays Austrian |
| MP6 | Seam list from COW Territorial Change v6 and the OHM diff | M | owner data | Every 1836–1936 transfer mapped |
| MP7–MP10 | Batches: Italy and Germany; Balkans and Black Sea; successor-state regions; Punjab and North India | M each | MP5, MP6, **PF2** | Budgets, tap probe, calibration by decade and region |
| MP11–MP13 | Middle East and Africa; East and South-East Asia; Americas | M each | MP10 | Same |
| MP14 | Small-province play on the phone (chooser, search, labels from regional zoom) | M | MP5 | Tap probe passes |

### WD World data and NF national flavour (new track NF)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| WD1 | Nation table as data (tags, capitals, government, status, colours, formables, dormant nations) | M | PL4 | Generated; hash identical |
| WD2 | Culture **and religion** by province for 1836, with sources | M | MP4 | Regional review table |
| WD3 | Resources and terrain checked against Natural Earth and HYDE cropland | M | MP4 | Changes listed |
| WD4 | Successor states: cores and conditions (Baltic, Poland, Czechoslovakia, Yugoslavia, Arab states, Ireland) | M | MP9 | 1918–22 states appear on 6 of 8 seeds after a Great War |
| WD5 | 1836 population and GDP by province from HYDE and Maddison (WD5a issue #11 open) | M | MP4 | Totals within 10% of Maddison |
| NF0 | Flavour-pack schema and loader: modifiers, AI inclinations, programmes, decisions, start notes, challenge, unit and ship names | M | WD1 | Schema test; packs for 3 nations load |
| NF1 | Move every nation-specific rule into packs (with FX5) | M | NF0 | No tag tests in core |
| NF2 | Great-power packs: GBR, FRA, PRU, AUS, RUS, OTT, USA | M | NF1 | Owner check against DESIGN §9.3 |
| NF3 | Asian packs: JAP, CHI, PUN, SIA, PER, plus the princely-state template | M | NF1 | Owner check |
| NF4 | Regional templates: German and Italian minors, Balkans, Latin America, Africa, Central Asia | M | NF1 | Every nation has a pack or template |
| NF5 | Decisions as data (Corn Law repeal, serf emancipation, Alaska sale, Janissary abolition, canal concessions) open to anyone meeting the conditions | M | NF0, HI1 | 20 decisions; same rules |

### DM Demography (new)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| DM1 | Religion on pops (data from WD2), with state religion and tolerance laws | M | WD2 | Saves and UI show it |
| DM2 | Vital rates: births and deaths from nutrition, health services, urbanisation, literacy (demographic transition) | M | DM1 | Population by region and decade within 15% of Maddison on 6 of 8 seeds |
| DM3 | Promotion and demotion review (factory workers, clerks, bureaucrats) | M | DM2 | Type shares by 1900 within bands |
| DM4 | Migration and emigration on one rule (with SO1b) | M | DM2 | Conservation test; Atlantic emigration by decade |
| DM5 | Manpower link: mobilisation and casualties remove workers and change births | M | DM2, MI3 | Fixture: a long war lowers output and population |
| DM6 | Demography page and lens | M | DM2 | Phone layout check |

### FD Food, freight and markets (◐ FD1 #22)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| FD1 | B1 freight graph and save/resume comparison ◐ #22 (audited: merge after PL1 so its full run passes the hash gate) | S | — | CI green with PL1 gate |
| FD2 | Freight by route length (#5) | S | FD1 | Split route keeps freight |
| FD3a/b | Grain stocks, harvests, storage; relief and emergency imports | M each | FD2 | A silo cannot release more than it holds; relief cannot create grain |
| FD4 | Punjab grain scenario | M | FD3b | Playable from the start screen |
| FD5 | Paired 3- and 24-month runs; famine 2–8 per century | S | FD4 | Table |
| FD6 | Freight and prices for all goods | M | FD5 | Price indices 0.6–1.8 |
| FD7 | Routes lens and trade ledger UI | M | FD6 | Phone layout check |

### TR Trade policy (new) and FI Finance (new)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| TR1 | Tariff schedules by good group; free-trade and protection laws through bills | M | FD6, PO2 | Trade war fixture |
| TR2 | Canals and straits as conditional world projects (Suez, Panama, Kiel; Straits regime) | M | FD6 | Suez opens 1860–1880 on 6 of 8 when funded |
| TR3 | Treaty ports, unequal treaties, extraterritoriality, customs unions | M | DP1 | China and Japan fixtures |
| FI1 | Money standard choice (silver, bimetallic, gold) and central bank | M | EC3 | Panic halves with a central bank |
| FI2 | Panics spread through creditors and trade partners | M | FI1 | 1873 and 1929 contagion fixtures |
| FI3 | Creditor control after default (customs administration) | M | EC3 | Ottoman and Egypt fixtures |

### EC Economy (detail [archive: engine plan C1–C4, G1–G2])
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| EC1 | Production methods, textile chain first | M | FD6 | Shortage flips profitability |
| EC2 | Private investment, shares, rival capacity | M | EC1 | A queued rival changes the decision |
| EC3 | Debt maturities, refinancing, default (test AI cash shortage first) | M | FX3 | 2–6 defaults per century; Ottoman 1–3 of 8 |
| EC4a/b | Commodity coverage with conservation fixtures | M each | EC1, QA2 | Fixtures pass |
| EC5 | Steel spread fix | S | CA1 | Top-8 steel shares within 2× of COW |
| EC6 | Dashboard numbers reconcile | S | EC4b | Drill-down sums match |

### SO Society and PO Politics
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| SO1a | Schools, colleges, skills, method adoption | M | EC1 | Trained province adopts sooner |
| SO1b | Migration (merged into DM4) | — | — | — |
| SO2 | Public health and mortality (merged into DM2) | — | — | — |
| SO3 | Culture acceptance, assimilation, minority grievance, religion | M | DM1 | Regional table |
| SO4 | Pop merging (as PF3) | — | — | — |
| PO1 | Group influence from jobs, ownership, franchise | M | DM3 | Provinces react differently to one bill |
| PO2 | Bills, coalitions, amendments, votes | M | PO1 | Pivotal group decides |
| PO3 | Services and grievances | M | PO2 | Unfunded mandate shows a shortfall |
| PO4 | Elections and franchise | M | PO2 | ≥ 10 reforms per century |
| PO5 | Rebellion, secession and civil war as one rule (*now* only the scripted US civil war) | M | PO1 | Civil wars by decade vs COW intra-state |
| PO6 | Cabinet and government review | S | PO2 | Owner check |

### RS Research and programmes (✔ A5, A6, A6b, C0, C1 Tanzimat)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| RS1 | Tech prerequisites and eras | M | — | No tech before its prerequisites |
| RS2 | Military tech adoption vs COW | S | RS1 | ±10 years |
| RS3 | Meiji on the programme engine | M | RS1 | Japan westernises 1866–85 on 6 of 8 (*now* 81% of runs) |
| RS4 | German unification routes | M | MP7 | Germany 1866–75 on 6 of 8 |
| RS5 | Italian unification phases | M | MP7, RS4 | Italy 1859–72 on 6 of 8 |
| RS6 | Programmes panel UI | M | RS3 | Phone check |
| RS7 | Programme validation, 8 seeds | S | RS5, EC3 | Targets |
| RS8 | Variants: China, Siam, Egypt, Persia | M | RS7 | Each on ≥ 3 of 8 |
| RS9 | Diffusion and inventions inside windows | M | RS1 | First adopter varies across seeds |

### DP Diplomacy and NV Navy (NV new)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| DP1 | Executable treaty clauses, transit first | M | FD6 | Treaty changes freight and cash |
| DP2 | Negotiation: accept, counter, defer, refuse | M | DP1, AI1 | Fixture passes |
| DP3 | Subjects, blocs, colonial administration (India's princely states as clauses) | M | DP2 | A subject can refuse on autonomy |
| DP4 | Alliances calibrated to COW | S | CA1 | Within bands |
| DP5 | Congresses and coalitions | M | DP2 | ≥ 3 congresses per century |
| DP6 | Spheres and ranking review (*now* China a great power in 49% of runs by 1900) | S | EC6 | NMC top 8 at 1914 on 6 of 8 |
| DP7 | Influence as a currency (market access, investment rights, crisis backing) | M | DP2 | Fixture |
| NV1 | Navy acting on freight: blockade cuts deliveries; patrol protects lanes (was MI5) | M | FD6 | Blockade fixture |
| NV2 | Naval races and arms-limit treaties (repeated game) | M | NV1, AI3 | Race and treaty both occur across seeds |
| NV3 | Coaling stations and naval bases as reach | M | NV1 | Fleets beyond reach lose readiness |

### MI Military and war
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| MI1 | War frequency by kind and decade (*now* 3.5 wars in the 1830s vs COW 0; 2.8 in the 1910s vs 10) | M | CA1, FX2 | Each decade within COW ± 50% |
| MI2 | Army sizes vs COW NMC (*now* China and the USA in the top 8 in 93–94% of runs) | S | CA1 | Rank correlation ≥ 0.7 at 1914 |
| MI3 | Theatre supply through procurement and freight | M | FD6 | Shortfall lowers readiness |
| MI4 | Peace valuation and clause executor | M | DP1 | Mutually better settlement accepted |
| MI6 | Successor-state wars 1918–22 | M | WD4 | 1910s wars in band |
| MI7 | Great War audit | S | MI1 | Outbreak 1905–1920 on 6 of 8 |
| MI8 | Colonial wars (*now* the "take a colony" goal is never used) | M | HI4 | Extra-state wars per decade within ± 50% |
| MI9 | War goals in use: free a people, make a vassal, humble (*now* 83% of wars are "take a province") | M | MI4 | Goal mix report |
| MI10 | Casualties and manpower drain (with DM5) | M | DM5 | Long wars cost population |
| MI11 | Mobilisation economy in total war (factories to arms, rationing) | M | MI3, EC1 | Great War fixture |

### HI History and events
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| HI1 | Events as data using region tables and actor roles | M | PL4 | No province literal in events |
| HI2 | Journals: stage, actors, deadline, durable outcome | M | HI1 | Closes cleanly when its state dies |
| HI3 | Unification with consent and integration | M | RS5 | Failed vote leaves state coherent |
| HI4 | Colonisation and the Scramble | M | MP11 | Partition by 1914 on 6 of 8 |
| HI5 | Post-war settlement and new states | M | WD4, MI4 | Owner check |
| HI6 | Regional anchors (Punjab 1839–49, India 1857, Meiji, Taiping) | M | HI2 | Owner check |
| HI7 | Event audit: each of 104 events and 79 dispatches checked for stated = applied effects, history's choice and AI weight | M | HI1 | Table in docs |

### AI Evaluator
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| AI1 | Evaluator core (legal actions incl. waiting, payoffs by horizon, runner-up, reversal) | M | — | Fixture; same output for adviser and AI |
| AI2 | Building and budget through the evaluator | M | AI1, FX3 | No AI treasury below zero from construction |
| AI3 | War and peace | M | AI1, MI4 | War counts in bands |
| AI4 | Bills and programmes | M | AI1, PO2 | Owner check |
| AI5 | Caching and caps | S | AI3 | Month within budget |
| AI6 | Personalities from pack inclinations | S | AI1, NF0 | Seeds differ by personality, not by tag code |

### UI Interface
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| UI1a | Comprehensive dashboard: scorecard and trends | M | SV1 | Phone check |
| UI1b | Drill-down to provinces | M | UI1a, EC6 | Sums match |
| UI2 | Search, region chips, recents, pins | M | PL3b | Any province in ≤ 3 taps |
| UI3 | Decision sheet with the evaluator's table | M | AI1 | Owner check |
| UI4 | Lenses incl. historical and religion | M | MP2 | Pan budget |
| UI5 | Shared components and page headers | M | PL3b | First action within 520 px |
| UI6 | Ledger with debts | S | EC3 | Owner check |
| UI7 | Treaty builder | M | DP2 | Owner check |
| UI8 | Military page: theatres and peace offers | M | MI4 | Owner check |
| UI9 | Coach and tutorial for the Punjab scenario | M | FD4 | 4 of 5 testers finish unaided |
| UI10 | Accessibility checks in CI | S | PL6 | Browser tier |
| UI11 | Page layout sweep in the browser tier (with FX6) | S | FX6 | Required check |
| UI12 | History ledger: results against real history | M | UI1a | Owner check |
| UI13 | Chronicle timeline | S | UI1a | Owner check |

### AR Art, SC Scenarios, CA Calibration, RL Release
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| AR1–AR8 | Icons, emblems and flags, coasts and sea, relief, cities and infrastructure, war on the map, scenes, credits [ART_MAP_GPT_PLAN] | M each | as v1 | As v1 |
| SC1 | Punjab grain packaging | S | FD4 | One tap |
| SC2 | Every-nation parity runs | M | S4 | Differences explained |
| SC3 | Start screen with scenarios and notes | S | SC1 | Owner check |
| SC4 | Sikh Empire 1839 scenario | M | HI6, MP10 | Owner check |
| SC5 | Bookmarks 1861, 1871, 1914 from calibrated seeds | M | S6 | Each bookmark's outcomes in bands |
| CA1 | Like-for-like calibration (wars by kind, India apart) (#6) | S | — | Regenerated from clean checkout |
| CA2 | `docs/TARGETS.md` from COW, Maddison, HYDE (§T) | S | CA1 | Used by seeds and stress tiers |
| CA3 | GDP and population by region and decade | M | CA2 | Report |
| CA4 | Weekly calibration report (merged into the stress report) | S | QA1 | In the report |
| CA5 | Literacy calibration (*now* 1900 medians GBR 55, FRA 48, RUS 8 against ≥ 60, ≥ 60, 20–45) | S | SO1a | In band on 6 of 8 |
| RL1 | Alpha build, feedback template, five testers | S | S2 | Pass marks |
| RL2 | PWA | M | AR4 | Installs offline on Android |
| RL3 | Phone gate on the Galaxy A56 | S | PL8 | Within budgets |
| RL5 | Release notes from PR titles | S | PL2 | Each release |
| RL6 | Version stamp and feedback link on the Pages build | S | PB5 | Owner check |

### AN Android and platform, MD media, RL release additions (owner, 27 Nov 2026: ledger B20, B24, B25, B27, B28)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| AND3 (#80) | Debug APK built by CI on every merge | S | — | APK installs on the A56 |
| AND4 (#81) | PixiJS map phone test: go, or plan Godot | M | AND3 | Owner's go or no-go on the A56 |
| AND5 (#86) | Redo AI Studio's reverted ideas as reviewed tickets | S | — | One child ticket per idea |
| AND6 (#90) | Android app basics: back button, sound pause, storage, splash | S | AND3 | Checked on the A56 |
| AND7 (#91) | Month in a background worker | M | PL3a | Hash identical; 60 fps during a month |
| AND8 (#92) | Modern UI design system (liquid glass optional) | M | — | Owner approves; child tickets per page |
| DEC1 (#89) | Decide daily progression or monthly turns | S | — | Decided daily by the owner, 27 Nov (B24) |
| MED1 (#93) | Media pipeline: pictures, unit and building sprites, budgets | M | AND4 | Sample sprite and picture through the pipeline |
| MUS1 (#94) | Music of the era | M | MED1 | 3 tracks per era, off by default |
| SEC1 (#96) | Security baseline (dependency checks, secret scanning, CSP, network only from online extras) | S | — | CI fails on a high advisory |
| REL1 (#95) | Commercial release plan for Google Play | S | — | docs/RELEASE.md with owner decisions |
| RL4 | Google Play release build: signing, closed test, listing | M | REL1, RL3 | Closed test passes |
| PL9 (#141) | Tests and tools on the full app, single file retired | M | AND3 | Every tool runs on the Vite build |
| DEP1 (#142) | Publish the Vite build on Pages and the APK on releases | S | AND3, PL9 | Pages installs as an app on the A56 |
| AUD3 (#143) | One sound system (SND cues + AUD + music) | S | — | One setting controls all sound |
| MAPDATA1 (#144) | Province geometry as a data asset for the PixiJS map | M | MP4 | Same shapes in both maps; hash unchanged |
| UIR1 (#145) | Rebuild every page on the modern design system (child ticket per page) | L | AND8 | Layout sweep passes; features keep working |
| CHEAT1 (#146) | Cheat rule for achievements, leaderboards and revenue | S | — | Owner's rule recorded |

### DAY Daily clock, MAP living map, presentation (owner, 27 Nov 2026: B24, B29, B30–B39; design in LIVING_WORLD.md)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| DAY0 (#104) | Living-world design approved; DESIGN §2.1, §7, §11 and rules 3 and 14 updated | S | — | Owner approves; command model chosen |
| DAY1 (#105) | Calendar and clock (`G.day`), End Day button replaces End Month, durations as dates, save epoch | M | DAY0 | 30 End Day presses equal one old month; hash change stated |
| DAY2 | Scheduler: daily, staggered daily, smoothed daily systems in causal order | M | DAY1 | Registry test; outcomes in bands |
| DAY3 | Movement and war daily | L | DAY2 | War counts and lengths in bands |
| DAY4 | Construction daily, railway segments | M | DAY2 | Build counts in bands |
| DAY5 | Economy daily (staggered production, smoothed prices, daily cash flow) | L | DAY2 | §T economy targets in bands |
| DAY6 | Pops, society, politics daily | M | DAY5 | Population, literacy, reforms in bands |
| DAY7 | Research, diplomacy, events and AI daily | M | DAY2 | Event counts and war frequency in bands |
| DAY8 (#112) | Date controller: pause, speeds, auto-pause, month progress bar | S | DAY1 | Owner check on the A56 |
| DAY9 | Remove `G.t`, rebalance, 4 ms per day budget | M | DAY3–DAY7 | Stress tier green |
| MAP1 | PixiJS map renderer, layers, level of detail | L | AND4 | Pan p95 ≤ 25 ms on the A56 |
| MAP2 | Armies and fleets moving on the map, battles, sieges | L | DAY3, MAP1 | Owner check |
| MAP3 | Infrastructure and buildings on the map, scaffolding, trains | M | DAY4, MAP1 | Owner check |
| MAP4 | Fronts, occupation, cities by size, canals | M | MAP2 | Owner check |
| MAP5 (#136) | Theatre controls on the map (draw-an-arrow orders, one-tap stances, army card, battle moments, undo) | M | MAP2, DAY3 | Owner finds it easy on the A56 |
| LOAD1 | Loading screen: public-domain pictures, sourced quotes, facts, progress bar | M | MED1 | 50 quotes and 50 facts with sources |
| NEWS1 | Newspaper front page from game events | M | DAY7 | Owner check |
| PROG1a (#120) | Eras that change the campaign | M | DAY7, AIS6 | Eras arrive in historical windows |
| PROG1b (#139) | National milestones and beat-history score | M | UI12, NEWS1 | 40 milestones; yearly score |
| PROG1c (#140) | Player profile, unlocks, online challenges | M | PROG1b, AIS5, REV1 | Unlocks work offline |
| PROG2 | Progress indicators on everything that grows | S | DAY4 | Owner check |
| CAUSE1 | Causal breakdown on every key number | M | UI1a | Sums match |
| SOC2 | Strata, standard of living, radicalism, interest groups, legitimacy, laws | L | DAY6, PO1 | Groups react differently to one law |
| BAL1 | Balance guardrails (price band, penalty floors, positive opening cash flow) | S | DAY5 | Fixture per guardrail |

### AIS Google AI Studio features (owner, 27 Nov 2026: B40; plan in AI_FEATURES.md; suggested agent AI Studio)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| AIS1 (#125) | Historical research assistant with Search grounding | M | — | 50 quotes and 50 facts with checked sources |
| AIS2 (#126) | Newspaper templates built offline | M | — | 300 reviewed templates; filled deterministically |
| AIS3 (#127) | Design optional "Ask the Historian" | S | CAUSE1 | Owner approves or drops |
| AIS4 (#128) | Voice minister and voice orders | M | AIS3 | Owner check |
| AIS5 (#129) | Cloud save backup and sign-in | M | REL1 | Save round-trip identical; works offline |
| AIS6 (#130) | AI art pipeline: style guide, backgrounds, event pictures, portraits, sprites | M | MED1 | Style guide approved; first 20 pictures and a sprite sheet in the manifest |
| AIS7 (#131) | AI music for each era | M | MED1 | 3 tracks per era reviewed |
| AIS8 (#132) | AI video: intro and event cinematics | M | AIS6 | Intro under 30 s; game identical without it |
| REV1 (#133) | Revenue design (ads, purchases) | S | — | Owner approves the model |
| REV2 (#134) | Ads and in-app purchases in the Android app | M | REV1, AND3 | Test ad and purchase on the A56; offline unaffected |
| REV3 (#135) | Consent screen, privacy policy, Play forms | S | REV1 | Consent shown in the EU test region |

## T. Targets (one table; measured by the seeds and stress tiers)

| Measure | Now (stress, 256 unfuzzed runs) | Target | Source |
|---|---|---|---|
| Crashes, invariant breaks | 0, 0 | 0, 0 | — |
| Save/resume divergence | 40 of 948 checks | 0 | P7 |
| Inter-state wars per decade | 3.5, 4.9, 5.8, 6.6, 6.0, 5.1, 3.5, 2.9, 2.8, 1.3, 0.6 (1830s–1930s) | COW 0, 4, 5, 8, 4, 3, 3, 6, 10, 2, 4, each ± 50% | COW Inter-State v4 |
| Wars per century, all kinds | 44.1 (22–72) | inter-state 49 ± 25%; colonial and civil counted apart | COW |
| War length | median 11, p90 62, max 337 months | p90 ≤ 48, max ≤ 120 | — |
| States destroyed per century | 17.4 (12–26) | 10–20, with causes reported | COW system membership |
| New or restored states | 3.2 | ≥ 12 (successor states 1918–22) | COW |
| Germany forms | seed 7: Aug 1866 (stress figure pending a metric fix) | 1866–1875 on 6 of 8 | — |
| Italy forms | 70% of runs, all 1859–1870, median 1861 | 1859–1872 on 6 of 8 | — |
| Japan westernises | 94% of runs; 81% in 1866–85 | 1866–1885 on 6 of 8 | — |
| Other states westernised by 1914 | 5.5 | 2–6 | — |
| Defaults per century | 0.6; Ottoman 0% | 2–6; Ottoman 1–3 of 8 | — |
| Great powers 1900 | GBR, FRA, USA, RUS, PRU ≥ 93%; CHI 49% | CHI ≤ 15% | — |
| Top-8 armies 1914 | CHI 93%, USA 94% | rank correlation ≥ 0.7 with COW NMC | COW NMC |
| Literacy 1900 | GBR 55, FRA 48, RUS 8 | GBR, GER, FRA ≥ 60; RUS 20–45 | — |
| Population by region and decade | to measure (DM2) | within 15% of Maddison | Maddison 2023 |
| Price indices | 0.70–1.35 | 0.6–1.8 | — |
| Famines | to measure (FD5) | 2–8 per century | — |
| Treasury | GBR, CHI negative for years | none below zero > 12 months | — |
| Month time (Node, CI) 1926–36 | median 109, p95 164 ms | median ≤ 90, p95 ≤ 110 | — |
| Save size | median 0.98 MB, 26% over 1 MB | ≤ 1 MB until SV1; then time budget | — |
| Interface | 0 page errors; 8,396 layout violations on 7 pages | 0 | — |

## R. Resources and outside drafts (added 2026-11-25)
- Assets: only `original`, CC0 or public-domain items; rules, sources and the manifest check are in docs/ASSETS.md. The owner or a networked agent downloads; the checker admits.
- DeepSeek files are set aside and not integrated. The missing events (Europe, Americas, Asia) are built from scratch under the H6 ticket; the determinism tool and roadmap it was to deliver already exist here as `tools/stress/`, `tools/state_hash.txt` and this plan.

## 5. Order and pace

1. **Now (S0):** owner settings (PB2 branch protection, Pages on); merge PL1 #23, then FD1 #22 after a full run through the gate, QA1 (stress tier), PB5 #25; FX1 (#27) first among engine tickets (it blocks SV4, QA3 and every resume claim); then SV1 (#4), FX2, FX3, PL2, CA1, PL3a, PL4, PL7, SV2, PL3b, FX6, SV3, PL8, SV4.
2. **S1 → S2:** map at 184, FD2–FD5, AI1, dashboard, decision sheet, tutorial, alpha. The owner plays every Pages build meanwhile.
3. **S3:** performance before more provinces.
4. **S4–S6** in parallel lanes (engine, map/data, interface), three tickets at a time.
5. **S7–S8.**

Estimate at 4–6 merged tickets a day: S0 in 5–7 days, the alpha in about 3 weeks, the whole plan (about 150 tickets) in 7–9 weeks. Re-estimated at each review.

## 6. Lanes

| Lane | Owns | Never touches |
|---|---|---|
| E engine | `src/` engine files, `test_*.js`, `century.js` | `ui*.js`, `*.css`, `art/` |
| M map and data | `art/geo/`, `data/`, `tools/` (data and calibration), generated tables | other engine logic |
| U interface and art | `src/ui*.js`, `src/*.css`, `src/flags.js`, `art/` (not `art/geo`) | engine files |
| Q quality (Claude) | `tools/stress/`, `.github/workflows/stress.yml`, docs | game code |

## 7. Review routine (Claude, four times a day; scheduled task "Long Century plan review")

1. Audit every open PR with finished CI (APPROVE or CHANGES, numbered). Merge on APPROVE if permitted; otherwise ask the owner in one line.
2. Open issues for tickets whose "after" list has merged, keeping five ready and at most one in progress per lane.
3. Read the latest stress report (weekly, and on any `stress/**` push); turn new failures into FX tickets.
4. Post a short status on the claims board.
5. Change this plan only when evidence requires it, as a docs-only PR.
