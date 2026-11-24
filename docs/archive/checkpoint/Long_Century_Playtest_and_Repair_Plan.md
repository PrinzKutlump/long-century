# The Long Century | Playtest and repair plan

Fix the Works queue first. A stale cancellation can delete a second project that the player intended to keep. Next, address the verified missing buyers and sellers in the commodity market. These two findings are reproducible on the released build. Diplomacy, French industry and debt need different experiments before selecting tuning values.

## What was played

Wider Rollout HTML, SHA-256 9294c15033e3ff4f6dccf26346f5cc3f5136bdba04d1425785c2650faecc018e. Eight scripted player runs followed the released game's monthly turn, card and construction commands from January 1836 to January 1846. Each country used seed 7. Its two branches loaded the same serialized opening position. One ordered a hospital in the capital. The other deferred the order. Both selected the recommended option on any pending card. Every run generated ten annual reports.

| Country | Hospital completion month | Hospital level at year ten, build / defer | Decision cards, build / defer |
|---|---:|---:|---:|
| Britain | 12 | 1 / 0 | 3 / 3 |
| France | 11 | 1 / 0 | 0 / 0 |
| Punjab | 10 | 1 / 0 | 0 / 0 |
| Japan | 13 | 1 / 0 | 0 / 0 |

A separate fork at Britain's 1838 People's Charter verified a real political tradeoff. Hearing the petitioners cost £66,403 and lowered population-weighted national militancy from 3.282 to 3.239. Rejection preserved the treasury and raised the same measure to 3.324. The card affects the capital, so the national change is smaller than the local one. Both choices closed the card and allowed the next month to advance.

A targeted French queue replay used the game's Works action handlers, with rendering and notifications intercepted. I started a fortress, naval base and university, then queued a hospital followed by irrigation. Cancelling the first row removed the hospital. Delivering that same action again removed irrigation. The two cancellations used an identical row index. This reproduces the state error. Its frequency during real touchscreen use is unmeasured.

The new runs exercised gameplay commands headlessly. Local Chromium could not start because its process socket was blocked. Screen layout, physical taps, Android Back navigation and on-device responsiveness remain open. The earlier eight AI centuries supply the long-run baselines below. The new player runs cover one seed and the opening decade.

## Ordered work for implementation

### 1. Make queue edits safe to retry

In src/ui6.js the cancel and move handlers address a queue row by position. Route both through the validation in src/turn.js. Identify the project by its persistent order ID. Validate the owner and current queue membership, consume the issued command once, and show the project and province in the result. Assign stable IDs once when loading legacy entries that lack them. Reordering must preserve which project starts when the next construction slot opens.

**Pass when** replaying the French cancellation leaves irrigation queued, a stale move cannot reorder a different project, and save/reload retains the queue order. Test a queue change between opening the Works page and confirming an action. Keep the four successful hospital runs as construction regressions.

### 2. Give production chains working buyers and suppliers

Wool and rubber had positive global supply and zero gross orders in every month of every new run. Both reached 20% of base price by month 60. Rubber already has downstream uses in electric goods and cars. Wool has output but no named input in the standard recipes. Canned goods had zero global supply throughout each opening decade, even as demand appeared. These are three different problems.

In src/defs.js and src/econ.js, prototype wool as an alternative textile input and allow mills to choose available fibres without charging for both. For rubber, inspect the first unlock and actual use of downstream industries versus the start of extraction. Scale early commercial extraction to viable demand. For canned goods, trace the first buyer to its order source and check whether an eligible producer can invest, obtain inputs and sell output. Separately check world pricing, which currently sums gross supply alongside demand net of certain trade deliveries. Compare gross orders with gross supply, or consistently measure residuals on both sides, and test the accounting before changing prices.

**Pass when** a textile producer demonstrably buys wool, a qualified late-game factory buys rubber, and a canned-goods buyer can receive output when capacity and inputs exist. Show gross orders, production, trade, fill and months at the price floor or ceiling before and after. Retest the six benchmark goods for 1860, 1880 and 1900 on seeds 7 and 3. Publish persistent breaches for the full goods list alongside those checkpoints.

### 3. Test access to diplomacy before changing war duration

In the four defer-hospital branches, 24 ordinary declaration attempts failed the congress-eligibility predicate and one passed it. None opened a congress. Two congresses did open in the build branches. Branches share a seed and can diverge after an order. These figures establish that the path works and illustrate its narrow reach. The century audit found 45–59 wars versus 30–45 intended, while nine of 21 congresses ended peacefully. Mean duration already met target in seven of eight worlds.

Instrument src/diplo.js at the actual decision point after truce and shared-war checks. Split counts by scripted event, ordinary dispute, containment, sponsor, guarantor, open decision card and subsequent random roll. Test extending eligibility to an interested Great Power backing a smaller state. Separately test the existing 30% convening chance. Inspect the AI's reluctance to approach the coalition threshold before moving that threshold. For each eliminated state, attribute loss of its last province to a peace term, unification or other event before altering peace terms.

**Pass when** paired centuries move toward 30–45 wars, 5–10 congresses, 3–8 coalitions and 8–15 distinct state losses, with at least one-third peaceful congresses. Track 12–24 months mean duration and the historical outcomes in the release checks.

### 4. Expose meaningful choices during quiet years

Britain received three first-decade cards. France, Punjab and Japan received none in these runs, although all could build and receive annual reports. Count actions separately from cards. For each annual report, surface the country's most consequential available choice, the cost, the likely effect and the relevant screen. Start with existing choices such as an unfinished project, a research decision or an unmet supply need. Suppress resolved recommendations and allow quiet years when no choice is material.

**Pass when** a player can act on an eligible issue directly from the report, see the consequence in the next relevant ledger, and resume a save without a duplicate decision. On several seeds, report the longest gap between actionable choices by country. Do not set identical event quotas.

### 5. Diagnose French investment and debt after market changes

The earlier century audit found France inside its 1900 factory range in 1/8 runs and the number of defaults inside its intended range in 1/8. A successful state-funded hospital checks public works only. It does not establish whether French factory investment works. Compare the earliest divergence between a passing and failing French run. Record eligible factory type, margin, investor funds, workforce, queue entry, materials delivered and completion. For debt, log the path from deficit to loan, interest, recovery or default. Select a fix only once the blocked step is visible.

**Pass when** all nine 1900 factory ranges hold together on at least 6/8 original seeds. Check France against 100–180 factory levels and the intended 2–6 defaults per century. Verify both a recoverable shortfall and a genuine insolvency without forcing bankruptcies to meet a quota.

### 6. Verify the release on desktop simulation and Android

Run the original eight seeds through January 1936 with before/after outcomes per seed, followed by fresh seeds held out of tuning. Preserve the required 1900 Great Powers on all eight and German formation, Italian formation and the Union outcome on at least seven. Run save/resume through an active queue and a pending card. On Android in portrait, start two works, cancel one, return from its detail sheet, resolve a decision, advance a month and reload. Confirm the surviving project and its progress at every step. Record viewport, browser, any clipped controls and advance time.

The game build was unchanged during verification. Release targets come from the existing plan. New acceptance tests above are proposed regression coverage.
