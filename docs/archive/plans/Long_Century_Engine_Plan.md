# The Long Century — engine implementation plan (revised)

Revised by Claude on 22 November 2026 from the owner's engine plan, after checking it against the source at commit `e8d5980`. The design is unchanged; the corrections are in §R below and in the marked tickets. Read §R first.

## R · Review corrections (read before anything else)

| # | Correction | Why |
|---|---|---|
| R1 | **Start from the workspace Git history (`ui-base` and later), not the bundle tip `e9941213` or a Performance Checkpoint zip.** | The bundle predates the unification gates (G2.2), the test harness, fixtures and probes (V0), and today's map work (V1). Cloning it would drop all of them. |
| R2 | **Every ticket has a performance and save check**, not just the release. | A3, B1 and the new records all add monthly work and save bytes. |
| R3 | **A3 is chosen by measurement.** | Running the full provincial economy for every nation may not fit 130 ms. |
| R4 | **Material changes bump `MODEL_REV` and re-run the balance table.** | A2 and A3 deliberately change outcomes, so digests will change. Unification dates, war counts and the Union result must be re-checked, or today's fixes can silently break. |
| R5 | **B3's interface reuses Build mode (UI plan V2) and its review sheet. It must not run at the same time as a V order.** | Both edit `ui6.js` and the Works planner. |
| R6 | **Releases C–G get numeric targets** (§T). | Their exit demonstrations prove a mechanism exists, not that the century plays plausibly. |
| R7 | **Wars per century is an open defect.** | Seeds give 39–57 against a 30–45 target. It is tracked in §T and taken up in F3/G3 if it is still open then. |
| R8 | **The calendar rule is clarified.** | Historical gates may keep a late fallback (e.g. Germany's 1869 war trigger) if it is documented in event data and reported. |
| R9 | **A1 is scoped.** | It ports railways, buildings, queue and factories to the shared command path first. AI diplomacy and war orders follow only when a later ticket needs them. |
| R10 | **External links removed.** | ChatGPT library links do not open for Sonnet. Required files travel in the handoff zip. |

**Measured profile at `e8d5980`** (Node, seed 7, Switzerland, `LC_PROFILE=1`):
- **1936:**
  - 72.9 ms per month, of which `econMonth` is 44.6, society 8.4, theatres 4.7, armies 3.7, diplomacy 2.0 and AI 1.5.
  - The save is 922 KB, four saves total 3.69 MB, and the heap is 70 MB.
  - Formations: Italy May 1860, the Confederacy February 1861, the Union December 1861, Germany June 1875.
  - Wars 49, states destroyed 18.
- **Browser:** the release gate measured 87–90 ms per month in desktop Chrome.

So the realistic headroom for new monthly engine work is about **35 ms in the browser at 1936**. The save has about **75 KB** of room under 1 MB.

## Verified code facts

All entry points named below exist. Two defects are confirmed:
- `hasProvincialEconomy(tag)` returns true only for `G.player` and `"PUN"`. `econMonth` builds its pilot participants from `["PUN", G.player]`.
- In `investMonth`, a construction ledger exists only when the site owner or payer is the player:

  ```js
  ledger = tag===G.player||payer.tag===G.player ? constructionAccount(p,b) : null
  fraction = ledger&&bill>0 ? min(1, payer[balance]/bill) : 1
  ```

  **So every non-player payer pays the full monthly bill whatever its balance. Treasuries and investment pools can go negative, while the player's projects are delayed.** This is the first fix in A2.

**Start with A0 through A4 (corrected per §R), then deliver B1 through B4 as the first integrated playable package.** The player should be able to deal with a grain shortage from one screen, see who received food and who paid, and find their previously funded railway still accounted for. Britain, Punjab and Switzerland must all use the same rules. Releases C through G carry that foundation through industrialisation, domestic politics, bargaining, unification and the full 1836–1936 campaign.

## Instructions to paste into Sonnet

> Implement this plan in the current Long Century source checkout (the workspace Git repository; see §R1). Read the checkpoint and owner instructions first. Identify the current commit and the first unfinished ticket using source and test evidence. Start there. Work in dependency order, build and exercise the playable HTML, and continue through the requested release. Keep existing campaigns loadable, all countries playable, and the central Works workflow usable on a phone. At a session boundary, record exactly what passed, what remains unverified and the next executable ticket. A design note or passing unit fixture alone does not complete a playable release.

**Inputs.** The handoff zip of the workspace repository, with its `.git` history, this file, `Long_Century_GPT_Plan.md`, `Long_Century_UI_Art_Plan.md`, `CHECKPOINT.md`, `PLAN.md`, `testdata/` and `tools/`. Check which tickets the current commit already satisfies.

## Establish the working baseline

1. Unpack the handoff zip and work in its Git repository. Inspect the branch, worktree and recent commits (expect `ui-base`, the V1 commits, and possibly V2 Build mode). Create an `engine/` branch. **Do not clone `Long_Century_History.bundle`**: it is an older history kept for reference only.
2. Preserve all UI, map, construction and balance work already on the branch. UI orders (V*) and engine tickets must not edit the same file at the same time (UI plan §4.7).
3. Read `CHECKPOINT.md`, `Long_Century_GPT_Plan.md`, `Long_Century_UI_Art_Plan.md` §2 and §4.7, and the relevant sections of `PLAN.md`. Visual changes stay digest-neutral. Economic behaviour changes bump `MODEL_REV` (§R4).
4. Run and retain a clean baseline (Node 24, Python 3, Playwright; use `--chromium /usr/bin/google-chrome` where Chromium is not installed). Keep a raw log for each run, noting commit, `MODEL_REV`, runtime, seed, country and machine. Benchmark one run at a time on one machine.

```sh
git rev-parse HEAD && git status --short
python3 build.py
node run_tests.js
LC_PROFILE=1 node century.js 7 SWI
python3 wrap_test.py --months 24 --chromium /usr/bin/google-chrome
python3 tools/map_probe.py --fixture all
```

**Delivery constraints.** One self-contained offline HTML, plain global JavaScript, current manifest and build script, no network calls. Preserve copyable save text and legacy save imports. Keep the existing campaign clock, theatre command model, flags, cheat and user reminder settings. Maintain 360 and 390 px portrait layouts, 100% and 125% text, and 44 px touch targets. Preserve a selected site and filter while queuing multiple builds. The game should interrupt the player for an actionable decision or a chosen reminder.

## Code ownership and monthly contracts

| Owner | Existing entry points | Responsibility after cutover |
|---|---|---|
| Clock and commands | `src/turn.js`, `advanceCampaign`, `applyCampaignCommand`, `monthTick` | Order validation, close-once monthly progression, replay and phase order |
| Initialisation, rules and map | `src/state.js`, `src/defs.js`, `src/world.js`, `engine-files.json` | Seeded world, identifiers, static definitions, topology and rebuildable indexes |
| Economy and finance | `src/econ.js`, `econMonth`, `moneyMonth`, `bilateralOrders`, `investMonth` | Deliveries, posted transfers, project funding, dividends and economic history |
| Households and research | `src/society.js`, `jobsMonth`, `migrateIn`, `researchMonth` | Workforce, needs, demographic flows, qualifications and adoption |
| Projects | `src/build.js`, `bqMonth`, `src/econ.js`, `constructionAccount` | Queue identity, budget, work remaining and exactly-once commissioning |
| Politics and foreign affairs | `src/politics.js`, `src/diplo.js`, `src/regional.js` | Laws, accession, transfer of control, signed clauses and obligations |
| Military and strategy | `src/mil.js`, `src/theatre.js`, `src/greatwar.js`, `src/ai.js` | Strategic commitments, demand, readiness and bounded actor decisions |
| Campaign and presentation | `src/campaign.js`, `src/events.js`, `src/history.js`, `src/ui*.js` | Historical eligibility, player decisions, explanations, dashboards and save adapters |

**Turn contract.** (1) Validate commands against the last closed month and reserve commitments. (2) Form funded employment, demand and construction orders from opening balances. (3) Produce from available inputs and clear local, regional and external deliveries over shared freight capacity. (4) Settle purchases, wages, taxes, dividends and arrears. (5) Update projects, households, institutions, political support and readiness. (6) Close once, record causes and totals, advance the month and autosave. Newly commissioned capacity works next month. Introduce these boundaries a domain at a time. Each commodity has exactly one active settlement writer. Legacy and replacement calculations may run side-by-side for comparison if only one can post transactions.

**Engine budgets for every ticket (§R2).** A ticket is not verified unless its report shows these at 1936 on seed 7, against the previous commit:

| Item | Limit |
|---|---|
| Added Node ms per month | at most +15 ms per ticket; the browser month must stay at or under 130 ms |
| Save at 1936 | at most 1 MB; new records state their bytes per month and their retention |
| Heap at 1936 | at most +20 MB per ticket |
| Digest | unchanged for refactors; a changed digest requires a `MODEL_REV` bump and the §T table re-run on seeds 3, 7, 11 and 21 |

**Minimal records and lifetimes.** Extend the game's existing objects wherever they already represent the fact.

| Record | Fields Sonnet must account for | Retention |
|---|---|---|
| Issued command | Actor, authority, month, serial, kind, target, arguments, outcome | Persistent retry protection and compact outcome for significant decisions |
| Delivery | Good, source, buyer, quantity ordered/delivered, unit price, freight, tariff, loss | Current month detail, annual totals, recent material explanations |
| Transfer | Payer, payee or explicit external account, amount, reason, related project/treaty | Account balances and annual totals. Retain material commitments and arrears |
| Project and asset | Stable ID, sponsor, site, payer, paid-to-date, materials delivered, work left, status, terminal reason, commissioned asset ID | Live state and compact permanent disposition for every project |
| Standing order or treaty | Parties, authority, scope, priority, ceiling, term, expiry, last execution | Persist until closed, retain terms and closing outcome |
| Forecast | Actor, decision, alternatives, horizon, assumptions, likely reply and outcome range | Bounded recent records in saves. Full samples in validation runs |

All monetary values need documented units and rounding. Reconcile in engine units before rounding display text. Keep deterministic allocation ties, own-property checks for identifiers, one seeded draw stream for committed outcomes and no draws from that stream for previews. Rebuild disposable indexes on load. Treat the save codec version and the economic model revision as separate fields.

## Implementation tickets

Each ticket below has a specific exit demonstration. Group changes by ticket so a later Sonnet session can resume at the first failing demonstration.

### A · Equal rules, reliable commands and durable construction

| ID | Implement | Exit demonstration |
|---|---|---|
| A0 | Add an observer-neutral test harness using `load_test_engine.js`. Fix actors, commands, pending-card policy and seed across runs. Compare material state independently of UI selection, report caches and human/AI control. Profile the existing phases in `century.js`. | Reproduce the checkpoint's seat-dependent provincial eligibility for Punjab, Britain and Switzerland. Save opening balances, partial project and first divergent material field. The regression becomes green in A3. |
| A1 | Extract actor-aware command validation and execution from the player wrapper. Port railway placement first, then queue, factory and building commands (§R9; subject and event commands only when a later ticket needs them). The AI's building and railway choices (`aiBudget`, `aiBuild`) issue the same commands. Validate ownership, control, prerequisites and available funds before mutation. Retain old callers through the wrapper. | Human, AI and scenario actors issuing the same authorised order get the same outcome. Rejected, stale, double-tapped and replayed commands cannot spend twice. Reloading and replaying the last accepted order is harmless. |
| A2 | Generalise construction lifecycle across public, private and foreign payers. **First fix:** in `investMonth` the funding fraction applies only when a ledger exists, and a ledger exists only for the player. Every other payer pays the full bill and can go negative. Apply the funding limit to every payer, and keep ledgers for reporting only (a compact ledger for AI, the full one for the player). Report how many AI treasuries or investment pools went negative per century before and after. Keep IDs across queue promotion. Handle completion, conquest, owner extinction and queue invalidation through common transitions. | Part-fund a rail project, queue a mill, exhaust the payer, restore funds, transfer ownership and reload. Every payment and asset reconciles for human and AI sponsors. Recommended initial transfer rule is to retain the existing cancellation policy and record spent, recoverable and unspent amounts explicitly. |
| A3 | **Measure first (§R3):** time the provincial path per province for the player and Punjab, project the cost for all nations, and report both. If the projection fits the ticket budget, run it for all qualifying provinces. Otherwise run one simplified shared model for everyone, the player included; the player gets no richer rules. Then replace both the participant list in `econMonth` and the `hasProvincialEconomy` branches in society. Apply five local goods, employment and household treatment to all qualifying provinces. Audit other player-tag checks: distinguish display caches from changes to material outcomes. Cache active rows and country ownership. | Observer-neutral fixture passes with the same actions and RNG. Compare actual deliveries, wages, employment, treasury and project progress through a save boundary. Zero-supply and occupied-province cases must stay finite. |
| A4 | Add a `MODEL_REV` field separate from the save codec version, and defaults at the real load path in `src/ui.js`. Also load `testdata/seed7_1840.txt`, `seed7_1866.txt` and `seed7_1934.txt`. Preserve V1/V2 imports, public/foreign ownership, historical spending and reminder state. Generate IDs deterministically for legacy live projects. Treat missing historic detail as unknown. | Load `testdata/prev_build_save.txt` and a checkpoint save with pending work. Save, restore twice and run a further year. No duplicate asset, lost commitment or new refund. Produce playable A build and timing/size results. |

### A+ · Research balance and the road to modernisation (owner request, 23 November 2026)

Start these after A4 and the research-queue change, before B. They change outcomes, so each one bumps `MODEL_REV` and re-runs §T.

**What the code does today** (`rpOf`, `techCost`, `researchMonth` in `society.js`; `DEC.west`, `DEC.meiji` in `build.js`; the auto-westernise line in `politics.js`):

```
rp/month = (3 + 25·lit + 20·clergyShare·lit + 3·log10(1+pop/1000) + 4·universityLevels + bonuses)
           × (civilised ? 1 : 0.4) × (1 + tech and great-work bonuses) × (free press ? 1.08 : 1)
techCost = base × (1 + 0.25·yearsAhead) × (civilised ? 1 : 1.4)
```

**Measured on seed 7:**

| | Switzerland | Prussia | USA | France | Britain | Russia | China | Punjab |
|---|---|---|---|---|---|---|---|---|
| 1836 rp | 28.9 | 26.8 | 26.4 | 21.9 | 20.7 | 10.5 | 6.6 | 3.3 |
| 1866 rp | 34.2 | 67.0 | 64.3 | 50.4 | 37.4 | 23.0 | 8.0 | 4.0 |

**Problems:**
1. Literacy is almost everything; industry counts for nothing. Britain is fifth in 1836 and falls behind Prussia by 1.8× by 1866.
2. The uncivilised penalty compounds to 0.4 × 1/1.4, about 0.29. Punjab needs about 170 months for one 560-point tech. The Westernize decision's 5 techs take about 70 years, so the path is closed in practice.
3. Westernisation is a single switch, with nothing to choose or pay along the way.
4. `pickTech` gives Britain alone a naval research weight in core code, which breaks the equal-rules principle.

**A5 · Research balance**
- New formula, the same for everyone:

```
rp/month = (3
          + 20·lit                       (was 25)
          + 15·clergyShare·lit           (was 20)
          + 3·log10(1+pop/1000)
          + 1.2·sqrt(factoryLevels)      (new: industry, engineers and workshops)
          + 5·universityLevels           (was 4)
          + 1·schoolLevels·lit           (new, small)
          + bonuses)
        × researchStatus(c)              (replaces the flat 0.4; see A6)
        × (1 + tech and great-work bonuses) × (free press ? 1.08 : 1)
techCost = base × (1 + 0.25·yearsAhead) × costStatus(c)   (replaces the flat 1.4; see A6)
```

- Move the naval preference out of `pickTech` into nation data: an `aiResearchBias` field on each nation, which Britain and other naval powers may set.
- **Measure before fixing the coefficients.**
  - Grid-search only the new industry and university weights.
  - Use seeds 3, 7, 11 and 21.
  - Pick the smallest change that meets the targets below.
  - Report every tried value and its result.
- **Targets:**

  | Measure | Target |
  |---|---|
  | Britain's rank among Great Powers, 1836 | top 3 |
  | Britain-to-Prussia rp ratio, 1866 | 0.8–1.25 |
  | Median year Great Powers reach railways, breech-loaders and electricity | within ±8 years of the historical years in `TECHS` |
  | Tech pace, 1836–1936 | no Great Power researches every tech before 1920 |
  | Gap between the highest and lowest civilised Great Power, 1900 | at most 2.5× |

**A6 · The road to modernisation** (replaces the 5-tech decision and the instant switch; the Meiji route stays as a historical event that uses the same system)

- **Modernisation progress, 0–100%, per nation.** It is stored as `c.modern`. Civilised nations hold 100. Uncivilised nations start at 0–25%, set in nation data (for example Egypt 20%, Japan 10%, Punjab 15% for Ranjit Singh's European-drilled army, China 5%).
- **It grows only through modernisation reforms.** Nine reforms in three tracks of three, each paid with **research points from the same pool**, so researching and modernising compete. Each gives progress and an immediate benefit, and stirs some resistance:

  | Track | Reform | rp cost | Progress | Immediate effect | Resistance |
  |---|---|---|---|---|---|
  | Army | Foreign drill instructors | 150 | +10% | +10% infantry quality | officers' and ruling-class militancy +0.5 |
  | Army | Modern arsenal and artillery school | 250 | +12% | artillery as effective as a civilised state's; arsenal buildable | +0.5 |
  | Army | General staff and conscription law | 350 | +13% | the existing mobilisation pool +20% | +1.0, and rural militancy +0.5 |
  | Economy | Western merchants and treaty ports | 150 | +10% | +10% trade income; one port opens to foreign investment | ruling-class militancy +0.5; a Great Power may demand terms |
  | Economy | State workshops and first mill | 250 | +12% | factories buildable at 1.5× cost | +0.5 |
  | Economy | Railway concession | 350 | +13% | railways buildable before civilised status | +0.5 |
  | Administration | Translation bureau and new schools | 150 | +10% | literacy growth +50% | clergy militancy +1.0 |
  | Administration | Land survey and tax reform | 250 | +10% | tax collection +10% | landowners' militancy +1.0 |
  | Administration | Codified law and ministries | 350 | +10% | stability; unlocks constitutional reforms | +0.5 |

  The progress values add up to 100%. A nation may take reforms in any order, at most one every 6 months.
- **Research status improves gradually, not at the end:**
  - `researchStatus = 0.5 + 0.5·modern/100`
  - `costStatus = 1.3 − 0.3·modern/100`

  Punjab at 15% makes about 2.2× its current points per tech month, and every reform helps at once.
- **Westernising** becomes possible at 100%, or at 80% plus 25% literacy. It is a decision card for a human and the same default for the AI:
  - **Proclaim it now:** civilised status, +10 prestige, and the reactionaries rise.
  - **Wait:** keep the current rules.

  It also gives:
  - entry to Great Power diplomacy and status;
  - immunity from the "uncivilised" casus belli;
  - an end to the colonisation pressure the map already describes.
- **Backlash and stability.** Reform resistance raises militancy among the groups named, and uprisings run through the existing paths. Each reform card shows the expected unrest and its odds of a revolt within 24 months, from the same model the engine uses.
- **Game theory on every reform card** (the owner's standing rule):
  - The table compares reforming, waiting and the alternative track, over 5 years:
    - research and tax gains;
    - army strength against the nearest colonial power;
    - the chance of revolt.
  - It shows the likely reply of the neighbouring Great Power. A higher modernisation level raises the cost of a colonial war against this nation, so the Power's chance of attacking falls. This comes from the existing war evaluator (`warEV`).
  - It shows the minister's pick and the decisive assumption.
- **AI policy:** the same evaluator picks reforms for AI states. Nation data may give a historical inclination (for example Egypt under Muhammad Ali and Japan after 1853 high, Bukhara low). There is no forced outcome by date.
- **Historical events reuse the system:**
  - **Meiji Restoration:** grants the three Administration reforms at once and costs stability.
  - **Muhammad Ali's reforms:** Egypt starts with Army 1 and Economy 1.
  - **Tanzimat-style reforms:** for any state with a ruling class strong enough.
  - **Ranjit Singh's army:** Punjab starts with Army 1.
- **Save fields:** `c.modern` and `c.modRef` (taken reforms), with defaults on load. Old saves get `modern` = 100 if civilised; otherwise the nation's starting value plus the number of techs × 5%.
- **UI:** a **Modernisation** panel on the Government page for uncivilised nations, showing:
  - a progress ring;
  - three tracks of reform cards with rp cost, effects and resistance;
  - the payoff table;
  - banked research points shared with the research queue.

  It is a card list with plain-English effects, no new map layer.
- **Tests:** `test_modernise.js`:
  - progress adds up correctly;
  - reforms spend research points once and are refused when points are short;
  - `researchStatus` rises with each reform;
  - westernising at 100% works the same for player and AI;
  - the seat test stays green;
  - save and reload keep progress.
- **Targets (8 seeds, no player intervention):**

  | Measure | Target |
  |---|---|
  | Japan westernises | 1866–1885 on at least 6 of 8 |
  | Other uncivilised states westernised by 1914 | 2–6 of 21 (historically Siam, Persia partly, Egypt pre-occupation, Ethiopia arguably) |
  | Uncivilised states destroyed or colonised by 1914 | at least 8 of 21 |
  | Punjab played by the minister's advice from 1836 | can reach 100% between 1855 and 1875 on at least 6 of 8 seeds |
  | Punjab as an AI | free to follow history or not; report the outcome |
  | Revolts caused by reforms per century, world | 3–12 |

### B · First complete gameplay loop: food, wages and freight

| ID | Implement | Exit demonstration |
|---|---|---|
| B1 | Reuse map adjacency and sea lanes. Build a sparse freight graph with capacity, controller and cost. Regions aggregate work internally while provinces retain origin, destination and access. Add a grain-only receipt path. Match home demand, treaty/corridor commitments, then residual exchange. Apply capacities and tariff exemptions once. | One coastal supplier and two competing destinations exhaust one shared link. Quantities, freight and tariff receipts reconcile. Closing that link changes deliveries and price exposure, including inland buyers. |
| B2 | Add opening grain stocks, seasonal or scenario harvest effects, storage releases and household purchases on the same delivery path. Relief transfers cash to eligible households. Emergency imports book a supplier, price, funding and available passage. | Under identical shocks, cash relief improves access where food is available. Relief alone cannot create grain. A silo cannot release more than it holds. Port and inland districts respond differently. |
| B3 | (UI shares files with Build mode: run it only when no V order is active, and reuse Build mode's review sheet and its 'started / queued / skipped' result; §R5.) Build a reproducible Punjab scenario in campaign/scenario data. Give the player four choices: import, targeted relief, prioritise rail, wait. Apply them through normal commands. Extend `worksPlanner` and cabinet views with immediate cost, time to effect, current bottleneck and the displaced project. Preserve site selection for repeat builds. | From the map, compare all four options on one sheet and commit once. Inspect receipts and remaining queue without changing tabs repeatedly. A funded rail project cannot provide extra freight before commissioning. |
| B4 | Run paired 3-month and 24-month scenarios with the same seed, route capacity and opening stocks. Capture delivered grain, household need fulfilment by district, treasury, farm income, freight utilisation, queue displacement and observable political response. Repeat with different controller seats. | Deliver playable HTML, source and a short table of measured outcomes. Show at least one scenario where waiting is defensible and one where it causes hardship. Explain parameter sensitivity if one option dominates everywhere. |

### C · Industrialisation, ownership and finance

| ID | Implement | Exit demonstration |
|---|---|---|
| C1 | Extend one textile production chain with explicit inputs, labour, qualifications, inventory and output. Reuse recipe, factory and hiring structures. Add a second method with a genuine skill/input trade-off. | Both methods are feasible in a favourable state. A shortage of fuel or skilled workers can reverse their profitability. Purchased inputs cannot also be consumed by another mill. |
| C2 | Connect schools, technical colleges, research, skill acquisition and method adoption. Model an adoption delay and training cost. Reuse migration with origin/destination accounting and funded vacancies. | After discovery, a trained province can adopt sooner. Moving workers changes both endpoints once. A cash-rich employer can still lack qualified staff. |
| C3 | Extend private investment and foreign dividends to shares and charter rights. Give investors build, wait and alternative-site options. Include committed rival capacity and expected post-entry prices. | A queued rival mill can reverse an investment decision. Shares sum to one. Foreign distributions reduce host retained income while domestic production still contributes to GDP. |
| C4 | Add debt maturities, refinancing exposure, creditor claims, reserves and recurring commitments to the treasury. Use the existing credit/default paths. Report domestic value added separately from sales. | A refinancing shock hits debts as they mature. A default books matching losses. Compare state and private claims on the same construction workforce. |

### D · Politics, institutions and society

| ID | Implement | Exit demonstration |
|---|---|---|
| D1 | Derive group influence from employment, ownership, legal access, franchise and organisation. Keep groups stable and movements issue-specific. Publish the constituents and cause of each major support change. | Two provinces with different ownership respond differently to the same land-tax bill. Franchise expansion alters political weight from the existing population records. |
| D2 | Model bill proposal, coalition building, amendments, vote and implementation. Compare each pivotal group's gain from assent against rejection. Write the enacted tax rule once. | A slightly cheaper concession can lose the decisive vote. Passing the bill changes subsequent tax receipts and disposable income exactly once. |
| D3 | Give education, public health, tax collection and welfare funded service targets. Use local buildings, staff and administration to determine actual coverage. Tie grievances and migration to unmet needs, rights and expected earnings. | An unfunded school mandate yields a coverage shortfall. A funded school changes attendance before literacy. Resolving hunger can leave a franchise grievance active. |

### E · Treaties, subjects and strategic reasoning

| ID | Implement | Exit demonstration |
|---|---|---|
| E1 | Give transit, commercial access, transfers and investment rights executable treaty clauses with eligibility, expiry, cost and breaches. Start with two-party transit. Reuse bilateral orders and existing treaty checks. | An accepted agreement alters actual freight and cash flows. A closed route lowers the agreement's value. Expiry terminates its effects and leaves a historical record. |
| E2 | Extend the evaluator described below to acceptance, counteroffer, deferral and refusal. Model each party's information, domestic vetoes and outside option. Adviser and AI read the same evaluator. | Worked negotiation fixture passes. A route closure, veto or credible alternative partner reverses the expected choice for a documented reason. |
| E3 | Apply clauses and repeated commitments to subjects, blocs, lobbies and colonial administration. Allow local resistance, consent and recurring administrative costs. Scenario data supplies historical differences. | A small subject can refuse a cash-positive deal on autonomy grounds. A broken promise changes later willingness to commit. One failed clause does not cancel unrelated agreements. |

### F · Unification, theatre logistics and historical programmes

| ID | Implement | Exit demonstration |
|---|---|---|
| F1 | Extend `unify` with claim eligibility, competing leadership, member consent, external response and integration. Preserve plausible early and failed outcomes. Track pending projects and treaties through accession. | Sphere membership alone cannot absorb a resisting state. A supported federation can form. A failed vote leaves treasury, ownership and order history coherent. |
| F2 | Route theatre supply and naval sustainment through actual procurement, recruitment, freight and dockyard capacity. Keep infantry, cavalry and artillery meaningful in the existing theatre system. Use strategic readiness, availability and expenditure in cabinet decisions. | Mobilisation reduces available civilian labour. Refitting consumes a real slot. A shipping shortfall changes readiness and expenditures as read by both theatre and treasury views. |
| F3 | Extend peace valuation from war score, exhaustion and elapsed time to settlement-versus-continuation payoffs. Use the same clause executor for the signed terms. | Both sides can accept a mutually preferable agreement. Transfers, reparations, outstanding works and subject obligations settle once, including after reload. |
| F4 | Give historical journals a stage, eligible actors, prerequisites, deadline, choice effects and durable outcome. Generate visible promises from the executable effects. Use existing regional and historical content as the first conversions. | A required state disappears or a province changes hands. The event branches or closes cleanly. A previously funded programme persists through a cabinet change. |

### G · World expansion and campaign qualification

| ID | Implement | Exit demonstration |
|---|---|---|
| G1 | Expand commodity coverage in dependency order: household staples, construction materials, industrial intermediates, strategic supplies and luxuries. Map each recipe, employer and institution to an authoritative producer and consumer. | Conservation fixtures pass for every migrated good. A good with zero demand, zero supply or interrupted transport creates no phantom income or consumption. |
| G2 | Exercise an industrial power, landlocked minor, subject and late industrialiser. Implement missing regional data and journals where systems already support the choices. Check national and world dashboards against underlying settlements. | Every country uses the same rules. Measured differences follow geography, institutions, resources, policy or history. A player can drill from an annual national result to a recent material cause. |
| G3 | Run 1836–1936 campaigns, AI calibration, legacy migration, wrapped browser and real phone checks. Package the release and evidence. | Publish benchmark tables, save sizes, replay results, balance distributions and known failures with named reproduction steps. |

## T · Numeric targets for every release (§R6)

Measured on 8 seeds (3, 7, 11, 21, 5, 13, 17, 29) unless stated. "Now" is `e8d5980`, seed 7 or the 8-seed range from the G2.2 runs.

| Measure | Now | Target | Checked from |
|---|---|---|---|
| Wars per century | 39–57 | 30–45, mean length 12–24 months | A3, then each release |
| States destroyed | 14–19 | 8–15 | each release |
| Germany forms | 1866–69 on 7 of 8 | 1866–1875 on at least 6 of 8 | each release |
| Italy forms | 1860–64 on 8 of 8 | 1859–1872 on at least 6 of 8 | each release |
| Union restored | 8 of 8 | at least 7 of 8, never undone | each release |
| AI treasuries or pools below zero, per century | measure in A2 | 0 caused by construction | A2 |
| Famines (grain fulfilment under 60% for 6 or more months in a province) | measure in B4 | 2–8 per century, worse without relief | B |
| Factory levels in 1900 | E1 table in `PLAN.md` | in range on 6 of 8 | C |
| Literacy in 1900, Great Powers | measure | GBR, GER/PRU, FRA at least 60%; RUS 20–45% | C2, D3 |
| Defaults per century (AI) | measure | 2–6 | C4 |
| Reform or franchise bills passed per century (world) | measure | at least 10; no Great Power stuck at its 1836 franchise on every seed | D |
| Treaties signed and broken | measure | at least 20 signed, at least 3 broken per century | E |
| Price indices (grain, iron, steel, machinery) | 0.70–1.35 | 0.6–1.8 | each release |
| Browser month at 1936 | 87–90 ms | at most 130 ms | each ticket |
| Save at 1936 | 922 KB | at most 1 MB | each ticket |

A target missed on a release is reported with its cause. Do not tune a parameter to hit a number until the cause is measured.

## Implement the decision evaluator

1. Generate legal actions including waiting. Score cheap candidates with existing `bldVal`, `aiBudget`, `warEV`, `dealVerdict` or their relevant successors. Keep the current heuristics as comparison policies.
2. For each shortlisted action estimate changes from waiting over a stated horizon. Keep pounds, welfare, legitimacy and autonomy in their natural units until actor-specific weights translate them into utility. Count each cost once. A domestic veto excludes the action.
3. For bargaining, evaluate each response from the counterparty's information and outside option. Compute the proposer's expected utility as the probability-weighted sum of its own payoffs across replies. For investment, forecast price after committed competitors open. For legislation, re-evaluate each pivotal vote after concessions.
4. Add the selected option, runner-up, decisive assumption, horizon and condition that would reverse the choice to the adviser result. Keep exact balances separate from uncertain forecasts. Only display empirical probability ranges after sufficient calibration.
5. Limit candidate count and opponent replies deterministically. Reuse results within the same decision state. Invalidate on material price, route, commitment, law or coalition changes. Benchmark before selecting production limits. Never use wall-clock time as a simulation stopping rule.

**Executable fixture for E2.** Relative to waiting, free transit yields Punjab/partner payoffs of (8, −3) on acceptance, (3, 2) on counter and (0, 0) on refusal. Transit with a modest fee yields (5, 4), (2, 3) and (−1, 0). Under complete information the partner counters the first offer and accepts the second. Under fixture response weights 10/55/35% and 70/20/10% respectively, Punjab's expected gains are 2.45 and 3.80. Assert both values and the selected offer. Then change the alternative-route fixture and verify that both parties' evaluations update. Treat the fixture probabilities as supplied inputs. Live calibration uses observed campaign outcomes.

**Evaluation.** Track forecast error at 3 and 12 months, response calibration by probability band, multiclass Brier score, rejected legal actions, decision cost and policy dominance. Compare with wait, always-accept, always-refuse and the previous heuristic using held-out seeds and equal information. Record sample counts. A single successful treaty cannot establish calibration.

## Verification, performance and save gates

- **Conservation.** Opening stock + production + imports equals final, intermediate and project use + exports + recorded losses + closing stock. Reconcile rerouted goods, unsold stock, spoilage and shortages. Match debits with credits. Record a source/sink for genuinely external flows. Keep prices and quantities in distinct fields.
- **Projects.** Every stable ID has one active state or one terminal disposition. Each completed project has exactly one commissioned asset or a traceable level increment. Check zero funds, exact final instalment, foreign sponsor, queued cancellation, capture, state extinction, retry and reload.
- **Determinism.** Compare command-by-command material states across different observer seats. Compare uninterrupted and save/resumed histories. A preview must leave save digest, campaign RNG, treasury and queue unchanged. Preserve byte-exact baseline digests for a pure refactor where the save representation is unchanged. If only the schema changes, compare a version-aware material digest.
- **Pacing and plausibility.** Compare archived seeds 3, 7, 11 and 21 plus preselected held-out seeds (5, 13, 17, 29). Measure against the §T table. Investigate extremes and publish causes. Avoid forcing one outcome by calendar. Documented historical fallbacks in event data are allowed (§R8).
- **Performance.** Existing targets are 130 ms per desktop Chromium month, 1 MB for the 1936 autosave and 4 MB for autosave plus three slots. Measure simulation, rendering, compression, write latency, cold load and actual storage separately. Report median, p95 and worst month with the test device. Avoid mistaking Node averages or four times a compressed payload for a browser quota test. Reduce detailed-history retention or repeated calculations first if a budget fails.
- **Interaction.** Test at both portrait widths and text sizes, with wrapped body styles and actual user inputs. Recheck queueing, confirmation, repeat builds, reminder behaviour and Copy save. Track tap count from a named initial screen. Verify reminder preferences survive load.
- **Failures.** Retain a minimal failing seed, month, actor, command list, opening balances and first divergent field. Correct the cause before changing a fixture. If a browser/device is unavailable, record the blocked check and proceed with independent work. Mark that release provisional.

Typical regression and collection commands, from the source root:

```sh
python3 build.py
python3 tools/map_probe.py --fixture all   # UI must stay within budget after engine changes
node test_works_planner.js
node test_autosave.js
node test_e4.js
node test_d3.js
node run_tests.js
mkdir -p validation/results/engine
for seed in 3 7 11 21; do
  node century.js "$seed" SWI > "validation/results/engine/seed-$seed.jsonl" || exit 1
done
LC_PROFILE=1 node century.js 7 SWI > validation/results/engine/profile-7.jsonl
python3 wrap_test.py --months 24 --chromium /usr/bin/google-chrome --screenshots validation/results/engine/screenshots
```

Run short targeted tests during development. Run the complete suite and representative campaigns at playable checkpoints. Run the full century matrix for material economy or balance changes and at release. Add focused `test_*.js` files where an existing script cannot expose the regression. The suite discovers scripts by filename. Ensure a failed assertion produces a failing exit or reported FAIL. Some scripts print intermediate successes while the simulation is still running.

## Handoff and resume protocol

For each playable release deliver the rebuilt `dist/long-century.html`, complete source or source bundle, compact test summary and baseline-to-current metrics. Keep the project's source history and old save fixture with the handoff. Mark tickets **open / active / verified / provisional** based on evidence. For the first Sonnet session all A–G tickets are **open pending inspection of the current checkout**. Already done before this plan: the G1.x performance work, the G2.2 unification gates, the UI harness V0 and the map V1. The workspace repository is the starting point.

| Required field | What Sonnet records |
|---|---|
| Build identity | Base and current commit, model/save versions, playable HTML location |
| Completed work | Ticket IDs, changed functions, player-visible outcomes and migrations |
| Evidence | Exact commands, exit status, seed, country, date range, key numbers and retained results |
| Outstanding work | First failing or unverified check, reproduction, scope and next ticket |
| Resume instruction | Concrete next command or failing fixture, plus dependencies already satisfied |

**Victoria 3 reading map.** For economic and political feedback use diaries 57, 59, 71, 74 and 81. For migration, ownership, movements and famine use 105, 110 and 128–131. For blocs, subjects and treaties use 109, 111–113, 118 and 146. For trade, companies and theatre logistics use 143, 147 and 175. These are historical design references for a human reader; the implementer needs none of them. The executable units, examples and release gates above belong to The Long Century.
