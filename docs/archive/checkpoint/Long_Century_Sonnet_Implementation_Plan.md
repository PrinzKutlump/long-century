# The Long Century — Sonnet implementation plan

**Start with A0 through A4, then deliver B1 through B4 as the first integrated playable package.** The player should be able to deal with a grain shortage from one screen, see who received food and who paid, and find their previously funded railway still accounted for. Britain, Punjab and Switzerland must all use the same rules. Releases C through G carry that foundation through industrialisation, domestic politics, bargaining, unification and the full 1836–1936 campaign.

## Instructions to paste into Sonnet

> Implement this plan in the current Long Century source checkout. Read the checkpoint and owner instructions first. Identify the current commit and the first unfinished ticket using source and test evidence. Start there. Work in dependency order, build and exercise the playable HTML, and continue through the requested release. Keep existing campaigns loadable, all countries playable, and the central Works workflow usable on a phone. At a session boundary, record exactly what passed, what remains unverified and the next executable ticket. A design note or passing unit fixture alone does not complete a playable release.

**Inputs.** Supply [Long_Century_Performance_Checkpoint.zip](https://chatgpt.com/library?file_id=libfile_46c576cf8bb08191a337c7daf50fce61&account_id=personal) and this file to a fresh Sonnet session. If a newer checkout exists, use it and check which tickets are already satisfied. The [engine roadmap](https://chatgpt.com/library?file_id=libfile_f48b0806435c819192296a3a79a3c01b&account_id=personal) gives the design rationale. The work orders below include the requirements needed for implementation.

## Establish the working baseline

1. If starting from the ZIP, unpack it. Inside the unpacked directory, run the commands below. If already in a working checkout, inspect the branch, worktree and recent commits before creating an implementation branch. Preserve any later art, map, construction or balance work.
2. The bundled implementation tip inspected for this plan is `e9941213ef74b64d290c4fa700bc8596296be734`. The bundle and the outer ZIP may carry different validation or handoff files. Compare them and retain the accompanying results. Use the current source tree as the build input.
3. Read `docs/plans/CHECKPOINT.md`, `docs/plans/Long_Century_GPT_Plan.md`, `docs/plans/Long_Century_Claude_Handoff.md` and the relevant sections of `docs/plans/PLAN.md`. The later map/art plan applies to the interface. Keep purely visual changes digest-neutral. Economic behaviour changes require a documented model revision.
4. Run and retain a clean baseline. Use Node 24, Python 3 and Playwright with desktop Chromium for the wrapper. Keep a raw log for each run, noting commit, runtime, seed, country and hardware. Benchmark sequentially on one machine.

```sh
git clone -b implementation Long_Century_History.bundle Long_Century
cd Long_Century
git rev-parse HEAD
git status --short
python3 build.py
node run_tests.js
node century.js 7 SWI
python3 wrap_test.py --months 24 --screenshots screenshots
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
| A1 | Extract actor-aware command validation and execution from the player wrapper. Port railway placement first, then queue, factory, building, subject and migrated event commands. Validate ownership, control, prerequisites and available funds before mutation. Retain old callers through the wrapper. | Human, AI and scenario actors issuing the same authorised order get the same outcome. Rejected, stale, double-tapped and replayed commands cannot spend twice. Reloading and replaying the last accepted order is harmless. |
| A2 | Generalise construction lifecycle across public, private and foreign payers. In `investMonth`, ledger creation currently depends on the player or payer being the player, and the funding fraction depends on ledger existence. Make funding policy independent of reporting. Keep IDs across queue promotion. Handle completion, conquest, owner extinction and queue invalidation through common transitions. | Part-fund a rail project, queue a mill, exhaust the payer, restore funds, transfer ownership and reload. Every payment and asset reconciles for human and AI sponsors. Recommended initial transfer rule is to retain the existing cancellation policy and record spent, recoverable and unspent amounts explicitly. |
| A3 | Replace both the participant list in `econMonth` and `hasProvincialEconomy` branches in society. Apply five local goods, employment and household treatment to all qualifying provinces. Audit other player-tag checks: distinguish display caches from changes to material outcomes. Cache active rows and country ownership. | Observer-neutral fixture passes with the same actions and RNG. Compare actual deliveries, wages, employment, treasury and project progress through a save boundary. Zero-supply and occupied-province cases must stay finite. |
| A4 | Add defaults at the real load path in `src/ui.js`. Preserve V1/V2 imports, public/foreign ownership, historical spending and reminder state. Generate IDs deterministically for legacy live projects. Treat missing historic detail as unknown. | Load `testdata/prev_build_save.txt` and a checkpoint save with pending work. Save, restore twice and run a further year. No duplicate asset, lost commitment or new refund. Produce playable A build and timing/size results. |

### B · First complete gameplay loop: food, wages and freight

| ID | Implement | Exit demonstration |
|---|---|---|
| B1 | Reuse map adjacency and sea lanes. Build a sparse freight graph with capacity, controller and cost. Regions aggregate work internally while provinces retain origin, destination and access. Add a grain-only receipt path. Match home demand, treaty/corridor commitments, then residual exchange. Apply capacities and tariff exemptions once. | One coastal supplier and two competing destinations exhaust one shared link. Quantities, freight and tariff receipts reconcile. Closing that link changes deliveries and price exposure, including inland buyers. |
| B2 | Add opening grain stocks, seasonal or scenario harvest effects, storage releases and household purchases on the same delivery path. Relief transfers cash to eligible households. Emergency imports book a supplier, price, funding and available passage. | Under identical shocks, cash relief improves access where food is available. Relief alone cannot create grain. A silo cannot release more than it holds. Port and inland districts respond differently. |
| B3 | Build a reproducible Punjab scenario in campaign/scenario data. Give the player four choices: import, targeted relief, prioritise rail, wait. Apply them through normal commands. Extend `worksPlanner` and cabinet views with immediate cost, time to effect, current bottleneck and the displaced project. Preserve site selection for repeat builds. | From the map, compare all four options on one sheet and commit once. Inspect receipts and remaining queue without changing tabs repeatedly. A funded rail project cannot provide extra freight before commissioning. |
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
- **Pacing and plausibility.** Compare archived seeds 3, 7, 11 and 21 plus preselected held-out seeds. Track wars, state losses, unification dates and mechanisms, shortages, insolvencies and income distributions. Investigate extremes and publish causes. Avoid forcing one outcome by calendar.
- **Performance.** Existing targets are 130 ms per desktop Chromium month, 1 MB for the 1936 autosave and 4 MB for autosave plus three slots. Measure simulation, rendering, compression, write latency, cold load and actual storage separately. Report median, p95 and worst month with the test device. Avoid mistaking Node averages or four times a compressed payload for a browser quota test. Reduce detailed-history retention or repeated calculations first if a budget fails.
- **Interaction.** Test at both portrait widths and text sizes, with wrapped body styles and actual user inputs. Recheck queueing, confirmation, repeat builds, reminder behaviour and Copy save. Track tap count from a named initial screen. Verify reminder preferences survive load.
- **Failures.** Retain a minimal failing seed, month, actor, command list, opening balances and first divergent field. Correct the cause before changing a fixture. If a browser/device is unavailable, record the blocked check and proceed with independent work. Mark that release provisional.

Typical regression and collection commands, from the source root:

```sh
python3 build.py
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
python3 wrap_test.py --months 24 --screenshots validation/results/engine/screenshots
```

Run short targeted tests during development. Run the complete suite and representative campaigns at playable checkpoints. Run the full century matrix for material economy or balance changes and at release. Add focused `test_*.js` files where an existing script cannot expose the regression. The suite discovers scripts by filename. Ensure a failed assertion produces a failing exit or reported FAIL. Some scripts print intermediate successes while the simulation is still running.

## Handoff and resume protocol

For each playable release deliver the rebuilt `dist/long-century.html`, complete source or source bundle, compact test summary and baseline-to-current metrics. Keep the project's source history and old save fixture with the handoff. Mark tickets **open / active / verified / provisional** based on evidence. For the first Sonnet session all A–G tickets are **open pending inspection of the current checkout**. Earlier checkpoint work is the starting point.

| Required field | What Sonnet records |
|---|---|
| Build identity | Base and current commit, model/save versions, playable HTML location |
| Completed work | Ticket IDs, changed functions, player-visible outcomes and migrations |
| Evidence | Exact commands, exit status, seed, country, date range, key numbers and retained results |
| Outstanding work | First failing or unverified check, reproduction, scope and next ticket |
| Resume instruction | Concrete next command or failing fixture, plus dependencies already satisfied |

**Victoria 3 reading map.** For economic and political feedback use diaries 57, 59, 71, 74 and 81. For migration, ownership, movements and famine use 105, 110 and 128–131. For blocs, subjects and treaties use 109, 111–113, 118 and 146. For trade, companies and theatre logistics use 143, 147 and 175. These are historical design references. The executable units, examples and release gates above belong to The Long Century. [Paradox diary index](https://www.paradoxinteractive.com/games/victoria-3/news) · [AI diary](https://www.paradoxinteractive.com/games/victoria-3/news/victoria-3-dev-diary-59-ai) · [autonomous investment](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-71-autonomous-investment-in-1-2) · [logistics update](https://steamcommunity.com/games/529340/announcements/detail/503978984819655098)
