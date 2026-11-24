# The Long Century: plan for the next implementer

Written by Claude for GPT, 20 November 2026. Read this before touching the code. It replaces nothing in `Long_Century_Claude_Handoff.md`; it adds the owner's preferences, the method the game was built with, what testing showed today, and the order of work.

Attached with this note:
- `Long_Century_Construction.zip` is the code baseline (unchanged by me).
- `PLAN.md` is the original block-by-block design plan. Blocks 7–11 hold the detailed work orders for politics, colonies, technology, AI and release.
- `deepseek_h1.txt` holds twelve drafted European events (see Phase 5). Treat it as draft text only.

---

## 1. Who the owner is and what he wants

Read this section twice. Most ways of going astray come from ignoring it.

**How he plays**
- On an Android phone, in portrait, in Firefox and in the Claude app's web view.
- His screen is 360 CSS px wide with a larger system font (about 115–125%).
- The game is hosted inside a claude.ai artifact page. That page wraps our file in its own `<html><body>`, so our `<style>` ends up inside `<body>`. It also blocks file downloads.

**The game he wants**
- A Victoria 2-style grand strategy game from 1836 to 1936, one month per turn.
- He wants to replay history and do better by choosing better.
- **Any nation is playable, and every nation runs on the same rules,** the AI included. Nation-specific behaviour belongs only in data and in historical events, never in the core systems.
- **Game theory is visible on every major decision:** the options, their payoffs and odds, the other side's likely answer, and what the minister recommends.
- **A comprehensive dashboard:** buildings, ships, troops, money, infrastructure, policy, diplomacy, trade and finance, all tracked and shown.
- Historical events and policies, with real choices that have stated consequences.

**Warfare**
- He asked to remove selecting and moving individual armies. War is commanded **by theatre**, a refined version of his earlier Ottoman game's system.
- Infantry, cavalry and artillery stay as distinct arms with distinct roles.
- Do not bring back unit selection or map dragging of armies.

**Look**
- He called a plain, generic interface "downgraded and rubbish".
- The standard is his earlier game Devlet-i Âliyye:
  - parchment background and an ornamented red-and-gold band
  - small-caps red display headings, an emblem and a diamond divider
  - corner-bracketed collapsible frames and inset stat tiles
  - a round flag with a two-line date in the header
  - a red pill "End month" button and a floating bottom tab bar
- Never ship a screen that looks plainer than that.

**Other standing wishes**
- Nation flags.
- A cheat button in Settings that adds £100 million per press.
- Plain English everywhere, with no developer terms on screen.
- No Android APK work; update the web version only.

**How he likes work done**
- Results, not narration. Short reports with measured numbers against targets, and honest misses.
- He reads on a phone, so put the verdict first.
- Use tokens efficiently.
- Do not claim something works unless you ran it.

---

## 2. Non-negotiable rules for every change

1. **Architecture:** plain global JavaScript, concatenated by `build.py` into one self-contained HTML file. No frameworks, modules, external fonts, CDNs or network calls.
2. **Hosting:** the page runs inside the claude.ai wrapper.
   - Never use `document.body.innerHTML=`, `document.write`, or `document.body.replaceChildren`.
   - Never rely on `document.head` being ours.
   - Override the wrapper's body styles explicitly.
   - No downloads: saves leave the game as text through a Copy button.
3. **Same rules for all nations,** player and AI alike. A system that runs only for the player or one nation is a bug, unless it is purely presentation.
4. **Saves:** old saves must load. New fields are read with defaults. Keep `testdata/prev_build_save.txt` loading in the tests.
5. **Randomness only from `rng()`:** one seed must give the same history on every run.
6. **Performance budget:**
   - at most 130 ms per month on desktop Chromium at any date up to 1936
   - an autosave of at most 1 MB at 1936
   - autosave plus three slots must fit in 4 MB of `localStorage`
7. **Phone first:** 360 and 390 px wide at 100% and 125% text size; no horizontal scroll; no truncated labels; touch targets at least 44 px; nothing covering content.
8. **Data must exist:** check every nation tag and province ID against `world.js` and `defs.js` before using it. An event whose actors no longer fit must simply not fire.
9. **Stated effects are applied effects:** every consequence written on a choice card is actually applied, and nothing is applied that the card doesn't state.

---

## 3. How the game was built (method to keep)

- **Plan first.** `PLAN.md` holds numbered work orders in blocks (M military, E economy, D diplomacy, U interface, B buildings, W theatre warfare, then H, P, C, T, A, Q). Each order has a target with numbers and named tests.
- **One worker at a time.** All orders touch the same files, so they are never run in parallel.
- **Every batch is checked before release:**
  1. `python3 build.py`
  2. the whole test suite
  3. the century run on several seeds: no errors, Germany and Italy form, the Confederacy is reabsorbed
  4. the wrapped-page test (styles survive inside the host wrapper)
  5. a scripted play of 24–48 months at 360 and 390 px, with no page errors
  6. an old save still loads
  7. screenshots of every changed screen, compared with the reference look
- **Release:** only after those checks pass.
- **Reports:** under 300 words, with numbers against targets, misses with causes, and known weak spots.
- **Patching style for the very long source lines:** exact-string replacement that asserts the match count. Never blind regex rewrites.

---

## 4. What testing showed today (baseline archive, 20 Nov 2026)

**Build and tests**
- The rebuild is byte-identical to the shipped `dist/long-century.html`.
- `test_history.js` and `test_works_planner.js` pass.
- The 20 older tests (`test_m*`, `test_e*`, `test_d*`, `test_w*`, `test_b3`) pass. Caveat: they load only the old file list. They do not load `history.js`, `regional.js`, `greatwar.js` or `campaign.js`, so they test a subset of the game.
- No network calls or code evaluation in the source.

**Century run** (Switzerland played with default answers, in Chromium, wrapped as on the host)

| Measure | This baseline | My last build | Target |
|---|---|---|---|
| ms/month in 1846 | 142 | 101 | ≤130 |
| ms/month in 1896 | 429 | 145 | ≤130 |
| ms/month in 1936 | 500 | 200 | ≤130 |
| Save size in 1846 | 0.99 MB | 0.40 MB | — |
| Save size in 1936 | 2.17 MB | 0.81 MB | ≤1 MB |
| Wars per century | 54 | 61 | 30–45 |
| Nations destroyed | 17 | 16 | 8–15 |
| Germany forms | 1839 | 1851 | about 1866–71 |
| Italy forms | 1860 | 1867 | about 1859–70 |

Notes on the run:
- One browser tab crashed ("Target crashed") when two century runs shared the machine. Treat memory as suspect.
- Great Powers in 1936 include China in both builds.

**Defects found**
1. **Month time grows with the date.** By the 1880s it is more than three times the budget, and on a phone a late-game month will take well over a second. Something accumulates: histories, ledgers, receipts, dispatches or choices.
2. **Saves grow to 2.2 MB.** Autosave plus three slots will exceed phone storage in the later decades. The autosave-failure warning exists, but the cause must be removed.
3. **`hasProvincialEconomy(tag)` returns true only for the player and Punjab.** This breaks rule 3, and it makes the player's economy unlike every AI's.
4. **Germany forms around 1840.** `UNIFY.GER` counts provinces owned by Prussia *or in its sphere*. The German minors start in Prussia's sphere, and nothing ties formation to history. Italy has the same weakness, to a lesser degree.
5. **Wars are too frequent and too many states die,** in both builds.
6. **Interface:**
   - The bottom bar is down to four tabs, so the theatre pages are a tap further away.
   - Punjab's flag is a plain disc.
   - Punjab's Overview boxes use the old plain card style.

---

## 5. Order of work

Do the phases in order. Each work order gets one report.

### Phase 0: Harness (first, before any game change)
- **G0.1** Put the baseline in a private Git repository with this note and `PLAN.md`. Keep `main` releasable.
- **G0.2** One runner, `node run_tests.js`:
  - Runs every test.
  - Update the old tests to load the files from `engine-files.json`, not a hard-coded list.
  - Prints a pass/fail table.
- **G0.3** A headless century script, `node century.js <seed> [player]`. Per decade it prints ms/month, save size, heap, wars started, states destroyed, the Great Power list, and the price indices for grain, iron, steel and machinery. It also prints the formation years of Germany, Italy and the Confederacy, and the year the Union reabsorbs the Confederacy.
  - Run it on seeds 7, 3, 11 and 21 and keep the outputs as the baseline record.
- **G0.4** `wrap_test.py` (Playwright) builds a wrapped copy. It asserts the parchment background, two style elements, and no page errors across the title page, a pick, three months, Continue after reload, a slot load, a theme switch and a text-size change.

### Phase 1: Performance and saves (P0; blocks everything else)
- **G1.1** Profile `monthTick` by system at 1846, 1896 and 1936. Find what grows with time and fix it:
  - rolling windows for histories
  - yearly aggregation of ledgers
  - caps on receipts, dispatches and choice logs
  - recomputing derived data instead of storing it
- **G1.2** Slim the save:
  - Exclude derived and cache fields (extend `SKIP`).
  - Store yearly aggregates, not monthly detail.
  - Round floats.
  - The save schema must migrate old saves.
- **Targets:** ≤130 ms/month at 1936, an autosave of ≤1 MB at 1936, and everything stored ≤4 MB. Report the before and after table.

### Phase 2: Rule integrity
- **G2.1** One economy for everyone. Either the provincial household economy runs for every nation within the time budget, or it runs for none. Choose by measurement and report both timings. Punjab keeps its challenge (presentation and goals) but not its own rules.
- **G2.2** Unification gates:
  - Germany forms only after the 1866 war against Austria is won (`G.ev.germany2` with an attacker win), or by the player's decision once the same conditions hold. Italy forms only after the 1859 war or its decision path.
  - Count sphere members only after the gate is passed.
  - Target: Germany forms 1866–1875 and Italy 1859–1872 on at least 6 of 8 seeds.
- **G2.3** Determinism: the same seed gives an identical century twice. Fix any iteration-order, `Date` or `Math.random` dependence.

### Phase 3: Open items from the handoff
- **G3.1** The missing early buyers for wool and rubber, and the absent canned-goods production. Measure supply, gross orders, deliveries and price before tuning.
- **G3.2** Why ordinary declarations bypass congresses. Test eligibility and settlement separately.
- **G3.3** The quiet opening decades: give the cabinet report meaningful actions. Investigate French industry and debt/default behaviour.
- **G3.4** A checklist for the owner's Android test of Works: consecutive orders, queued work, cancellation, save and reload, and the annual report. Hand it to the owner; you cannot run a phone.

### Phase 4: Balance (eight seeds: 7, 3, 11, 21, 5, 13, 17, 29)

| Measure | Target |
|---|---|
| Wars per century | 30–45, mean length 12–24 months |
| States destroyed | 8–15 |
| Congresses per century | 5–10, a third ending without war |
| Coalitions | 3–8 |
| AI defaults | 2–6 |
| Great Powers in 1900 | GBR, USA, FRA, GER/PRU and RUS on all seeds |
| Factory levels in 1900 | the E1 table in `PLAN.md`, in range on 6 of 8 seeds |
| Price indices | 0.6–1.8 |
| Civil War | the Union wins on 7 of 8, and nothing later undoes that result |

### Phase 5: Historical events (Block 6 in `PLAN.md`)
- Extend the existing event pattern. Each event gets 2–3 options with stated and applied consequences, history's choice marked, an AI default weighted by its situation, and a chronicle line.
- `greatwar.js` already holds the July Crisis. Build H4 (the Great War, revolutions, collapse of losing empires into dormant nations, the peace conference) on top of it, not beside it.
- `deepseek_h1.txt` has twelve drafted European events. Use the texts, but fix these faults first:
  - `G.def.length` should be `w.def.length`.
  - Government types "pres" and "prol" do not exist; only the types in `GOVS` do.
  - A war is declared on Hungary while it is still a dormant, not-alive nation.
  - `c.gwx.admin` is read nowhere, so its "administration" effects do nothing.
  - `reforms.vote` and the "puppet" war goal are unverified.
  - The Carlist war is dated 1833, before the 1836 start.
  - Several stated effects are never applied.
- Report the events added by region, those skipped and why, and how many fired per seed.

### Phase 6 onwards
Politics and society, colonies, technology and military eras, AI personalities and the game-theory layer, then release checks, as in `PLAN.md` Blocks 7–11. Every phase keeps the rules in section 2.

---

## 6. Interface rules for every phase

- Use the existing design system: frames, tiles, chips, alert strips, sheets and decree cards. New screens must match the Overview's quality.
- Put Military and Dispatches back within one tap. A five- or six-item bar fits at 360 px if the labels are short.
- Every number the player cares about can be tapped to show what makes it up.
- Every major decision shows a small payoff table: the options, the odds, the expected gain and loss, the other side's likely answer, and the minister's pick.
- Choice cards pause play and are saved. Headless runs never block on them.
- Give Punjab a proper 1836 flag (the Sikh Empire's), and add flags for any new nations.

---

## 7. Ways to go astray (do not do these)

- Do not rewrite or replace the engine, or restructure files for neatness.
- Do not add nation-specific code paths to core systems; that includes the player-only and Punjab-only economy.
- Do not bring back individual army selection or movement, and do not drop the infantry/cavalry/artillery distinction.
- Do not simplify the look to generic cards, or remove the ornaments, frames or header.
- Do not tune balance numbers before measuring causes.
- Do not run several workers on the same files at once.
- Do not report success without the test output, and do not skip the wrapped-page and phone-width checks.
- No APK, no external hosting, no network features.

---

## 8. Report template (after every work order)

1. **Done:** one line per item.
2. **Numbers:** target, before and after, per seed where relevant.
3. **Tests:** the runner table, the century summary on 4 seeds, the wrapped test, and the phone checks.
4. **Missed:** each miss with its cause.
5. **Weak spots** you noticed but did not fix.
6. **Files changed.** Update the handoff note's status tables.
