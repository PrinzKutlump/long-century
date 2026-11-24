# The Long Century: master plan (every system, broken into GPT tickets)

Status: plan, 24 Nov 2026. Supersedes the order of work in `docs/plans/PLAN.md`, `docs/plans/Long_Century_GPT_Plan.md` and the Engine, UI/Art, Civilising and Art/Map plans; their ticket texts stay valid as detail and are cited by old ID in brackets.
Roles: Codex/GPT implements every ticket; Claude plans, writes the issue for each ticket, audits each PR (`docs/DEV_WORKFLOW.md` §3b) and reviews this plan four times a day; the owner decides and playtests.
Owner decisions 24 Nov: **compatibility with existing saves is dropped** (a new save "epoch"; compatibility returns from the first alpha build). **The project goes public** (section 0).

## 0. Going public (owner decision 24 Nov): impacts and mitigations

Method: a **fresh public repository** `PrinzKutlump/long-century` built from a clean snapshot of `main`. The current repository (`long-century-`) stays **private** as an archive, because its history and its old pull-request pages hold Correlates of War raw data, which COW's terms forbid passing on, and GitHub keeps pull-request commits reachable even after a history rewrite.

| Impact | Mitigation | Ticket |
|---|---|---|
| COW raw data may not be published | Snapshot excludes `data/raw/cow/**`; raw data stays in the private archive; the public repo holds only derived aggregates (counts by decade, top-8 ranks) produced from it, with COW cited | PB1, PB3 |
| Anyone can read and copy the code | `LICENSE`: all rights reserved (owner may change later); `NOTICE.md` credits every source and the bundled pako licence; README says contributions are not accepted for now | PB1 |
| Strangers can open issues and pull requests; fork PRs can run workflows | Interaction limit "collaborators only" (renewed every 6 months); fork-PR workflows need approval; no `pull_request_target`; default workflow token read-only, write only in the release job; branch protection on `main` with required checks | PB2 |
| Leaked secrets or personal details | Secret scan of the snapshot (gitleaks) before the first push; secret scanning and push protection on; rule in `AGENTS.md`/`CLAUDE.md`: no personal details or credentials in code, issues or PRs | PB1, PB2 |
| Old issues, PRs and the claims board stay in the archive | Claude recreates the open tickets and the claims board in the public repo; old repo archived read-only | PB6 |
| Map data release lives in the private repo | Re-run the geodata workflow in the public repo (Natural Earth public domain, OpenHistoricalMap CC0) | PB4 |
| Calibration tools read COW files | Tools read `data/derived/` tables only; Claude regenerates them from the archive when needed | PB3 |
| CI minutes | **Free on a public repo**: the minutes limit (L1) is lifted; PL2 shrinks to hygiene (docs skip CI) | PL2 |
| Upside: anyone can play | GitHub Pages serves the latest build at a fixed web address; Releases are public for testers | PB5 |

| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| PB0 | **Owner:** create an empty public repository `long-century` (no README); give Codex and Claude access | — | — | Repo exists |
| PB1 | Clean snapshot: copy `main` without `data/raw/cow/**`, `archive/**`, `deepseek_h1.txt` and old zips; move root plans into `docs/plans/`; add `LICENSE`, `NOTICE.md`, `README.md`, `SECURITY.md`; gitleaks scan; one initial commit pushed to the public repo | M | PB0, PR #26 merged | Scan clean; no raw COW data or restricted filename markers in the snapshot; build and tests pass in the new repo |
| PB2 | Public-repo hardening: workflow permissions, fork-PR rules, branch protection, CODEOWNERS, Dependabot; `docs/PUBLIC_REPO_SETTINGS.md` lists the owner's settings clicks | S | PB1 | Settings checklist done by owner; a fork PR cannot run with write access |
| PB3 | Derived calibration data: `tools/derive_cow.py` (runs in the archive) writes `data/derived/cow_*.csv` aggregates; `calibrate_cow.py` reads only those | S | PB1 | Report regenerates in the public repo without raw COW files |
| PB4 | Re-run geodata in the public repo; release `geodata-run-1` | S | PB2 | Checksums match `SOURCES.md` method |
| PB5 | GitHub Pages: the release workflow also publishes the latest build | S | PB2 | Game opens from the Pages address on a phone, offline after first load |
| PB6 | **Claude:** recreate open tickets and the claims board in the public repo; update the review schedule; archive the old repo (owner click) | S | PB1 | Queue live in the public repo |

Until PB1 is pushed, nothing else merges in the private repo, so the two do not diverge.

## 1. What limits the plan (measured 24 Nov, `main` 3bcdc63)

| # | Limit | Measured | Effect | Remedy (ticket) |
|---|---|---|---|---|
| L1 | **CI minutes** (lifted once public, §0) | 1,645 job-minutes used since 22 Nov; GitHub Free includes 2,000 a month and by default stops private-repo Actions at the limit. Full tier costs about 23 job-minutes per PR push; 4 shards each round up | CI can stop within days; approvals then stall | PL2 now; owner: check Settings → Billing, set a small spending limit or move to Pro (3,000) |
| L2 | **Save storage** | Saves in localStorage (about 5 MiB per site); 1936 save 976,549 B of the 1 MB budget | Blocks provinces, records and new systems | SV1 IndexedDB, then SV3 |
| L3 | **Save compatibility** | 72-line save-defaults repair, legacy fixtures (`testdata/`, 2.2 MB), "keep old ids" rule, migration in every structural ticket | Slows every structural change | **Lifted by owner.** SV2 deletes it |
| L4 | **Monthly time** | 69.5 ms at 1936 in Node (economy 42.6), 87–90 ms in desktop Chrome; budget 130; **phone never measured** | Caps pops and provinces; phone may already be over | PL8 phone bench; SO4 pop merging if needed |
| L5 | **Source shape** | 26 files have lines over 300 characters (world.js one 83k line; ui.css 8.4k; ui5.js 2.7k); ~350 hard-coded province ids in 10 files | Every map change touches code; agents burn tokens | PL3 split, PL4 ids as data, MP4 province table |
| L6 | **Exact hash pinning** | Seed 7 hash pinned in a Playwright test only; changes on every feature | Cannot tell a good change from a bad one | PL7: hash only for refactors; outcome bands for features |
| L7 | **CI checks that cannot fail** | Century step exits green on failure; no budget checks | "Green" is not evidence | PL1 (#28) |
| L8 | **One implementer, one auditor, one owner** | GPT implements all; Claude audits 4×/day; owner decides | Queue stalls on decisions or audit | 3 lanes with file ownership (§3); decisions batched in #8 |
| L9 | **No player has played it** | 0 playtests | Risk of building the wrong thing | Alpha at milestone M2, not at the end |
| L10 | **Data gaps and licences** | OHM lacks 1836 South Asia; COW terms forbid passing data on; HYDE licence to confirm | Map evidence and repo openness | MP1 evidence notes; RL4 data out of repo |
| L11 | **Design gaps found by calibration** | 39 one-province nations; Baltic states inside St Petersburg province; post-1900 wars 8 vs COW 22; army ranks uncorrelated (−0.02); techs have no prerequisites; freight per border crossing | History cannot happen | MP, WD4, MI1–MI2, RS1, FD2 |

## 2. Milestones

| Milestone | Contents | Gate (all must hold) |
|---|---|---|
| **M0 Public repo and foundations** | PB0–PB6, PL1–PL8, SV1–SV4, FD1, CA1 | CI trustworthy and inside its minutes; saves in IndexedDB; old save code gone; no line over 300 chars; province ids live in data; phone numbers known |
| **M1 True map** | MP1–MP5, FD2, WD1 | Owner approves the 184 historical map; 186 pilot plays (cede Lombardy, Venetia stays Austrian) |
| **M2 Alpha "Punjab grain"** | FD3–FD5, SC1, UI1a, UI9, AI1, UI3, RL1, RL3 | Five testers; pass marks in `DEV_WORKFLOW.md` §7b; saves compatible from here |
| **M3 More provinces and new states** | MP6–MP10, WD2–WD4, MI6, HI5 | Decade-and-region calibration not worse by more than 10%; budgets hold on phone |
| **M4 Economy and society** | EC1–EC6, SO1–SO4, FD6–FD7 | §T targets for factories, literacy, prices |
| **M5 Politics and programmes** | PO1–PO6, RS1–RS8 | Japan, Ottoman, Germany, Italy targets on 6 of 8 seeds |
| **M6 Diplomacy, war and AI** | DP1–DP6, MI1–MI8, AI2–AI6, HI1–HI4, HI6 | War counts by kind and decade inside COW bands |
| **M7 Whole world and art** | MP11–MP14, AR1–AR8, UI2, UI4–UI8, UI10, SC2–SC4, CA2–CA5 | Art budgets; every nation playable under the same rules |
| **M8 Release** | RL2, RL4, RL5, release gate (V9) | Phone gate, licences, PWA |

## 3. Lanes (so GPT can run up to three tickets at once)

| Lane | Owns | Never touches |
|---|---|---|
| E engine | `src/` engine files, `test_*.js`, `century.js` | `ui*.js`, `*.css`, `art/` |
| M map and data | `art/geo/`, `data/`, `tools/` (data and calibration), generated `src/world.js` | other engine logic |
| U interface and art | `src/ui*.js`, `src/*.css`, `src/flags.js`, `art/` (not `art/geo`) | engine files |

A ticket that needs two lanes is split, engine half first. Platform tickets (PL) run alone.

## 4. Tickets by component

Size: S under 60k tokens or about half a day; M one day; L split before starting. "After" lists tickets that must be merged first. Each ticket becomes a GitHub issue labelled `ticket` when its "after" list is merged; the issue carries the full acceptance checks.

### PL Platform and CI
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| PL1 | CI gates: century step can fail; 1936 time and save budgets; `tools/state_hash.txt`; failing tail in job log (#28) | S | — | A planted failure turns CI red |
| PL2 | CI hygiene (public repo, minutes free): `paths-ignore` for docs; 2 balanced shards; cancel superseded runs | S | PB2 | Docs-only PR starts no workflow; full tier ≤ 10 min wall clock |
| PL3a | Source split, engine files: no line over 300 chars, no file over 600 lines | M | PL1 | Hash identical on seeds 3 and 7 |
| PL3b | Source split, interface JS and CSS | M | PL3a | Layout check and Playwright tests pass; screenshots unchanged |
| PL4 | Province ids as data: the ~350 literals move to named region tables | M | PL3a | No province-id literal in engine code outside data tables; hash identical |
| PL5 | Lint and type checks (ESLint minimal; `@ts-check` with JSDoc on `G`, nation, province) in the quick tier | M | PL3b | Zero errors on `main` |
| PL6 | Tests into `tests/engine` and `tests/browser`, one runner, quiet by default | S | PL3b | CI uses the new runner |
| PL7 | Outcome policy: refactors keep the hash; features are judged by an 8-seed outcome table (label `balance` runs the seeds tier); Playwright tests stop pinning hashes | S | PL1 | Seeds tier writes the §T table to the run summary |
| PL8 | Phone bench: a `?bench` mode reporting ms per month, save and load times; Playwright 4× CPU throttle in CI; owner runs it on the Galaxy A56 | M | SV1 | First A56 numbers in `docs/PERF.md` |

### SV Saves
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| SV1 | IndexedDB saves, Web Worker compression, file export and import (#30; old-save migration no longer required) | M | PL1 | 5 MB test save round-trips; ≤ 300 ms blocked screen |
| SV2 | Save epoch 2: delete save-defaults repair and legacy decode paths and fixtures; versioned schema; older saves refused with a plain message | M | SV1 | Code and `testdata/` legacy files removed; tests green |
| SV3 | Lossless compact encoding: ideology as arrays, pops column-wise, derived fields out | M | SV2 | Save→load→continue gives the identical outcome; packed size reported |
| SV4 | Save/resume invariance as a standing CI test (sorted-value digest, from #29) | S | FD1 | In the quick tier |
| SV5 | From alpha on: saves of the same release line must load (policy and test) | S | RL1 | Test loads the previous alpha save |

### MP Map and provinces (detail: `docs/MAP_PROVINCES_PLAN.md`, `docs/ART_MAP_GPT_PLAN.md`)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| MP1a/b/c | Historical shapes at 184 with an evidence note per major border: Europe and Middle East / Asia / Americas and Africa [M2] | M each | — | ART plan M2 checks; `cuts.geojson` notes |
| MP2 | Owner checkpoint: preview build, contact sheets at 390 px and desktop, `adj_diff.md` in three groups [M3] | S | MP1 | Owner approves |
| MP3 | Adjacency switch and straits table [M4] | M | MP2 | 8-seed table not worse by 10% |
| MP4 | `provinces.csv` generates `world.js`; ids may be renumbered (compatibility lifted) | M | PL4, MP3 | Byte-identical rerun |
| MP5 | Pilot 186: Lombardy/Venetia, Peshawar/Kashmir; events `italy1`/`italy3` and Kashmir transfer | M | MP4, FD2 | Playable test in the map plan |
| MP6 | Seam list from COW Territorial Change v6 and the OHM diff | M | owner data | Every 1836–1936 transfer mapped |
| MP7–MP10 | Batches: Italy and Germany; Balkans and Black Sea; successor-state regions (Baltic, Poland, Bohemia and Slovakia, Hungary and Transylvania); Punjab and North India | M each | MP5, MP6 | Per batch: budgets, tap probe, calibration by decade and region |
| MP11–MP13 | Batches: Middle East and Africa; East and South-East Asia; Americas | M each | MP10 | Same |
| MP14 | Small-province play on phone: nearby-province chooser, search, labels from regional zoom | M | MP5 | Tap probe passes at the smallest province |

### WD World data
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| WD1 | Nation table as data: tags, capitals, government, civilised status, colours, formables, dormant nations | M | PL4 | Generated; hash identical |
| WD2 | Culture and religion by province for 1836, with sources | M | MP4 | Regional review table |
| WD3 | Resources and terrain checked against Natural Earth and HYDE cropland | M | MP4 | Changes listed with reasons |
| WD4 | Successor states: cores and conditions for Baltic states, Poland, Czechoslovakia, Yugoslavia, Arab states, Ireland; uses the existing dormant-nation path (13 today) | M | MP9 | 1918–22 states appear when the world allows, on at least 6 of 8 seeds after a Great War |
| WD5 | 1836 population and GDP by province from HYDE and Maddison | M | MP4, owner data | National totals within 10% of Maddison |

### FD Food, freight and markets (Release B)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| FD1 | B1 fix, take over PR #25 (#29) | S | — | CI green |
| FD2 | Freight by route length (#31) | S | FD1 | Split route keeps freight |
| FD3a | Grain stocks, harvests and storage [B2] | M | FD2 | A silo cannot release more than it holds |
| FD3b | Relief transfers and emergency imports [B2] | M | FD3a | Relief cannot create grain |
| FD4 | Punjab grain scenario with four choices through normal commands [B3] | M | FD3b, UI lane free | Playable from the start screen |
| FD5 | Paired 3- and 24-month runs; famine target 2–8 per century [B4] | S | FD4 | Table of outcomes |
| FD6 | Freight and prices for all goods, not only grain | M | FD5 | Price indices 0.6–1.8 |
| FD7 | Freight and trade UI: routes lens, trade ledger | M | FD6 | Phone layout check |

### EC Economy and finance (Release C)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| EC1 | Textile chain with two methods [C1] | M | FD6 | Both feasible; shortages flip profitability |
| EC2 | Private investment, shares and rival capacity [C3] | M | EC1 | Queued rival changes the decision |
| EC3 | Debt maturities, refinancing, default; test AI in a cash shortage first [C4] | M | — | AI defaults 2–6 per century; Ottoman 1–3 of 8 |
| EC4a/b | Commodity coverage: staples and construction / intermediates, strategic, luxuries [G1] | M each | EC1 | Conservation fixtures pass |
| EC5 | Steel spread fix from calibration (minor powers too high) | S | CA1 | Steel shares within 2× of COW for top 8 |
| EC6 | Dashboard numbers reconcile with settlements [G2] | S | EC4b | Drill-down sums match |

### SO Society and population
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| SO1a | Schools, colleges, skills and method adoption [C2] | M | EC1 | Trained province adopts sooner |
| SO1b | Migration with funded vacancies, counted once at both ends [C2] | M | SO1a | Conservation test |
| SO2 | Public health and mortality, famine deaths | M | FD5 | Mortality by decade plausible vs Maddison population |
| SO3 | Culture acceptance and assimilation; minority grievance | M | WD2 | Regional table |
| SO4 | Merge tiny same-type pops (only if PL8 shows the phone over budget) | M | PL8 | Month time down, outcomes within bands |

### PO Politics
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| PO1 | Group influence from jobs, ownership, franchise [D1] | M | SO1b | Different provinces react differently to the same bill |
| PO2 | Bills, coalitions, amendments, votes [D2] | M | PO1 | Pivotal group decides; effect applied once |
| PO3 | Services and grievances [D3] | M | PO2 | Unfunded mandate shows a shortfall |
| PO4 | Elections and franchise by government type | M | PO2 | ≥ 10 reforms per century world-wide |
| PO5 | Rebellion, secession and civil war as one general rule (weak-state gate; replaces the scripted USA-only path) | M | PO1 | Civil wars by decade vs COW intra-state |
| PO6 | Cabinet and government review | S | PO2 | Owner check |

### RS Research and national programmes
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| RS1 | Technology prerequisites and eras (69 techs have none) | M | — | No tech before its prerequisites on 8 seeds |
| RS2 | Military tech adoption years vs COW Arms Technology | S | RS1 | Adoption within ±10 years for great powers |
| RS3 | Meiji on C0 [C2] | M | RS1 | Japan westernises 1866–85 on 6 of 8 |
| RS4 | German unification routes [C3] | M | MP7 | Germany 1866–75 on 6 of 8 |
| RS5 | Italian unification phases [C3b] | M | MP7, RS4 | Italy 1859–72 on 6 of 8 |
| RS6 | Programmes panel UI [C4] | M | RS3 | Phone layout check |
| RS7 | Programme validation, 8 seeds [C5] | S | RS5, EC3 | All C5 targets |
| RS8 | Variants: China self-strengthening, Siam, Egypt and Persia tuning | M | RS7 | Each reachable on at least 3 of 8 seeds |

### DP Diplomacy
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| DP1 | Executable treaty clauses, transit first [E1] | M | FD6 | Treaty changes actual freight and cash |
| DP2 | Negotiation: accept, counter, defer, refuse [E2] | M | DP1, AI1 | Worked fixture passes |
| DP3 | Subjects, blocs, colonial administration [E3] | M | DP2 | Subject can refuse on autonomy |
| DP4 | Alliances calibrated to COW Formal Alliances by decade | S | CA1 | Within bands |
| DP5 | Congresses and coalitions (rare today) | M | DP2 | ≥ 3 congresses per century |
| DP6 | Spheres and great-power ranking review | S | EC6 | Ranking matches NMC top 8 at 1914 on 6 of 8 |

### MI Military and war
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| MI1 | War frequency by kind and decade (post-1900 shortfall) | M | CA1 | Inter-state per decade within COW ± 50% |
| MI2 | Army sizes vs COW NMC (`soldiersWanted`) | S | CA1 | Rank correlation ≥ 0.7 at 1914 |
| MI3 | Theatre supply through procurement and freight [F2] | M | FD6 | Shipping shortfall changes readiness |
| MI4 | Peace valuation and clause executor [F3] | M | DP1 | Mutually better settlement accepted |
| MI5 | Navy, blockade and sea lanes acting on freight | M | FD6 | Blockade cuts deliveries |
| MI6 | Successor-state wars 1918–22 | M | WD4 | 1910s wars within COW band |
| MI7 | Great War audit by seed | S | MI1 | Outbreak 1905–1920 on 6 of 8 |
| MI8 | Colonial wars vs COW extra-state | M | HI4 | Per decade within ± 50% |

### HI History, events and unification
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| HI1 | Events as data using region tables | M | PL4 | No province literal in events |
| HI2 | Journals: stage, actors, deadline, durable outcome [F4] | M | HI1 | Event closes cleanly when its state dies |
| HI3 | Unification with consent, rival leaders, integration [F1] | M | RS5 | Failed vote leaves state coherent |
| HI4 | Colonisation and the scramble for Africa | M | MP11 | Partition by 1914 on 6 of 8 |
| HI5 | Post-war settlement and new states | M | WD4, MI4 | Owner check |
| HI6 | Regional anchors (Punjab 1839–49, India 1857, Meiji, Taiping) checked | M | HI2 | Owner check |

### AI Decision evaluator and game theory
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| AI1 | Evaluator core: legal actions including wait, payoffs by horizon, choice, runner-up, reversal condition | M | — | Fixture passes; same output for player adviser and AI |
| AI2 | Evaluator for building and budget (old heuristic kept for comparison) | M | AI1 | No AI treasury below zero from construction |
| AI3 | Evaluator for war and peace | M | AI1, MI4 | War counts within bands |
| AI4 | Evaluator for bills and programmes | M | AI1, PO2 | Owner check |
| AI5 | Caching and caps | S | AI3 | Month time within budget |

### UI Interface and dashboard
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| UI1a | Comprehensive dashboard: national scorecard and trends | M | SV1 | Phone layout check; owner check |
| UI1b | Drill-down from nation to province | M | UI1a, EC6 | Sums match |
| UI2 | Search, region chips, recents, pins [V2b] | M | PL3b | Find any province in ≤ 3 taps |
| UI3 | Decision sheet: options, payoffs, odds, runner-up | M | AI1 | Owner check |
| UI4 | Lenses: political, historical (direct, protected, contested), economy, unrest, integration | M | MP2 | Pan budget holds |
| UI5 | Shared components and page headers [V8] | M | PL3b | First action visible within 520 px |
| UI6 | Ledger with debts | S | EC3 | Owner check |
| UI7 | Diplomacy page treaty builder | M | DP2 | Owner check |
| UI8 | Military page: theatres and peace offers | M | MI4 | Owner check |
| UI9 | Coach and tutorial for the Punjab scenario | M | FD4 | 4 of 5 testers finish unaided |
| UI10 | Accessibility checks (125% text, 44 px, contrast) in CI | S | PL6 | In browser tier |

### AR Art (detail: `docs/ART_MAP_GPT_PLAN.md`)
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| AR1 | Icon sprite [A1, V3.1] | M | PL3b | Readable at 20 px |
| AR2 | Emblems and flags [A2] | M | AR1 | Report of plain flags |
| AR3 | Coasts, sea, rivers [M5] | M | MP3 | Pan budget |
| AR4 | Relief and terrain [M6] | M | AR3 | Light detail turns it off |
| AR5 | Cities and infrastructure [A3, V5] | M | AR4 | Node budget at Z2–Z3 |
| AR6 | War and diplomacy on the map [V6] | M | UI8 | Pan budget |
| AR7a/b | Scenes [V7] | M each | AR5 | ≤ 4 KB each |
| AR8 | Credits and licence check [M7] | S | AR7b | Every asset in `ASSETS.md` |

### SC Scenarios and campaign
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| SC1 | Punjab grain scenario packaging for alpha (FD4 plus start screen entry) | S | FD4 | Starts in one tap |
| SC2 | Every-nation parity runs: industrial power, landlocked minor, subject, late industrialiser [G2] | M | M4 | Same rules; differences explained |
| SC3 | Start screen: scenarios and nation picker with notes | S | SC1 | Owner check |
| SC4 | Sikh Empire 1839 scenario (option) | M | HI6, MP10 | Owner check |

### CA Calibration
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| CA1 | Like-for-like comparison (#32) | S | — | Regenerated from clean checkout |
| CA2 | `docs/TARGETS.md`: §T rewritten from COW and Maddison (wars by kind and decade, states, armies, steel, population, GDP) | S | CA1 | Used by the seeds tier |
| CA3 | GDP and population by region and decade vs Maddison | M | CA2 | Report |
| CA4 | Seeds tier weekly report | S | PL7 | In run summary |

### RL Release
| ID | Ticket | Size | After | Done when |
|---|---|---|---|---|
| RL1 | Alpha build and feedback template; five testers | S | M2 tickets | Pass marks recorded |
| RL2 | Installable web app (PWA) | M | AR4 | Installs and works offline on Android |
| RL3 | Phone gate on the Galaxy A56 | S | PL8 | Within budgets |
| RL4 | (Done by PB1/PB3: raw COW data never enters the public repo) | — | — | — |
| RL6 | Pages build carries a version stamp and a feedback link | S | PB5 | Owner check |
| RL5 | Release notes from PR titles | S | PL2 | On each release |

## 5. Order and pace

1. **Now:** PB1–PB6 (going public), then **M0:** PL1, FD1, SV1, CA1, PL2 in parallel lanes; then PL3a, PL4, PL7, SV2, PL3b, SV3, PL8, SV4, PL5, PL6. Map lane runs MP1 alongside.
2. **Then M1 → M2:** MP2–MP5, FD2–FD5, AI1, UI1a, UI3, UI9, SC1, RL1, RL3. The alpha comes before the deep systems so testers shape them.
3. **Then M3–M8** in the order of §2, three lanes at a time.

Estimate at 4–6 merged tickets a day: M0 in about 4 days, M2 (alpha) in about 2–3 weeks, the full plan (about 120 tickets) in 5–7 weeks. Re-estimated at every review.

## 6. Review routine (Claude, four times a day)

1. Audit every open PR with finished CI (APPROVE or CHANGES; merge on APPROVE).
2. Open the issue for each ticket whose "after" list is now merged, so five tickets are always ready, at most one per lane in progress.
3. Check CI minutes used this month and the projection.
4. Post a short status on #8: merged, in progress, blocked, owner decisions needed, milestone progress.
5. Change this plan only when evidence requires it, as a docs-only PR.
