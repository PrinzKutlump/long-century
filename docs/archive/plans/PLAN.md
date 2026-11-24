# The Long Century: work plan

You are implementing systems in an existing browser grand strategy game (1836–1936, 62 nations, 184 provinces, monthly turns). Do one work order at a time, in the order given. Finish, test and report on each before starting the next.

## 0. Status and handover (read first)

**Start here if you are a new agent.** Unzip `long-century-source.zip`; the project is the `vic/` folder. Run `python3 build.py` (writes `dist/long-century.html`, a single self-contained file that is the game). Requirements: Python 3, Node 18+, and for interface checks Python playwright with Chromium. Run the tests in section 3 before changing anything, so you know the baseline.

**Done and tested:** M1–M7 (military), E1–E7 (economy), D0–D6 (diplomacy), U1–U9 (interface). Sections 4, 5 and Block 3 are kept as a record of what the code is meant to do; do not redo them.

**Remaining, in this order:** Block 4 (interface, U1–U9) → Block 5 (buildings, B1–B4) → Block 6 (historical events, H1–H5) → Block 7 (politics and society, P1–P5) → Block 8 (colonies and the wider world, C1–C3) → Block 9 (technology, T1–T2) → Block 10 (AI and balance, A1–A4) → Block 11 (release checks, Q1–Q4). The owner's first priority is the interface: he considers the current look a downgrade from his earlier game (`ref/index.html`).

**Owner's standing wishes:** plays on an Android phone in Firefox; wants a comprehensive dashboard; game theory visible in advice (options, payoffs, odds); every nation playable under the same rules; plain English; a cheat button (+£100M) stays in Settings; no APK work.

**Known weak spots at handover** (fix where a work order below names them): wars per century 48–62 (target 30–45); congresses rare (2–3 per century, almost none backed down); coalitions rare (1–2 per century); results for one seed can differ between runs, which means some code path is not using `rng()` or depends on object key order — find and fix in A1 first if you do balance work; machinery price about 0.5 in 1860; AI defaults 0–2 per century; a containment coalition can restore the Confederacy after the Union has won; month time 70 ms alone (limit 130).

## 1. The project

| Path | What it is |
|---|---|
| `src/world.js` | Generated map data (`WORLD`). Never edit by hand. |
| `src/defs.js` | Goods, recipes, terrain, pop types, units (`UNITS`), techs, war goals |
| `src/state.js` | `newGame`, `mkNation`, `mkArmy`, `genPops`, `startForces`, `railMax`, `techFx` |
| `src/econ.js` | `econMonth` (production, market, incomes, treasury), `moneyMonth`, `investMonth`, `bestGood`, `bestSite` |
| `src/society.js` | Pop growth, jobs, migration, literacy, research |
| `src/politics.js` | Elections, reforms, movements, uprisings |
| `src/mil.js` | `recruit`, `findPath`, `orderMove`, `moveTick`, `battleTick`, `fight`, `siegeTick`, `armyMonth`, `aiArmies`, `aiRecruit` |
| `src/diplo.js` | `powerScore`, `rankPowers`, `declareWar`, `endWar`, `peaceOffer`, `cbsOf`, colonization, `aiWarMonth` |
| `src/events.js` | Historical events, `formNation`, `spawnNation` |
| `src/build.js` | Province buildings (`BLD`), great works (`GW`), decisions (`DEC`) |
| `src/ai.js` | `aiBudget`, `aiBuild` |
| `src/turn.js` | `monthTick`: the order systems run in each month |
| `src/flags.js`, `src/ui.js`, `src/ui.css` | Interface (single page, phone first) |
| `build.py` | Concatenates everything into one HTML file |
| `hist.js`, `bal.js`, `money.js` | Headless test runs (Node) |

All game code is plain global JavaScript, no modules, no dependencies. State lives in the global `G` (`G.c[tag]` nations, `G.prov[id]`/`G.plist` provinces, `G.armies`, `G.wars`, `G.price`, `G.t` month counter). Helpers you will use constantly: `P(id)`, `provsOf(tag)`, `popOf(tag)`, `sum`, `clamp`, `rng()`, `msg(category, text)`, `ADJ[id]`, `SEAADJ[id]`.

**Read the file you are about to change before changing it.** This plan describes intent; the code is the truth. Where the plan and the code disagree, follow the code and say so in your report.

## 2. Rules for every work order

1. **Saves must keep loading.** `G` is serialized whole. Any new field must be read with a default (`a.dig||0`), never assumed present. Do not rename existing fields.
2. **Same rules for every nation.** No player-only bonuses. If the player can do it, the AI must be able to do it, and must actually use it.
3. **Determinism.** Use `rng()`, never `Math.random()`.
4. **Speed.** `node hist.js 720 7` must stay under 130 ms per month. No per-month loops over all pops × all provinces × all nations.
5. **Text.** Plain English, sentence case, no jargon, no abbreviations the player has not seen. Money as `money(x)`.
6. **Interface.** Phone first (390 px wide). Every action reachable by tap. Disabled buttons say why.
7. **Code style.** Match the existing dense style. New systems go in the file named in the work order; if a new file is needed, add it to the list in `build.py` and to the `FILES` lists in `hist.js`, `bal.js` and `money.js`.
8. **Do not touch** `world.js`, `world.py`, the save format prefix, or unrelated systems.

## 3. Tests to run after every work order

```
node hist.js 720 7      # must print "ok", no ERROR, under 130 ms/month
node hist.js 720 3
node bal.js 7           # balance table at 1860, 1880, 1900
node money.js           # money stock over 25 years: grain price must stay between 0.6 and 1.6
python3 build.py        # writes the single-file game; then: node --check on the extracted script
```

Then open the built HTML in a browser at phone width, start as one Great Power and one small nation, play 24 months, and use the new feature by hand.

**Report after each work order:** what changed (files, functions), test output, anything that differs from this plan, and known weak spots.

---

## 4. Military work orders

Current state: armies are objects `{id,o,loc,u:[{k,str,org}],naval,dest,path,eta,siege,gen}` in `G.armies`. Land combat is a few dice rounds in `fight()`. Fleets fight only when hostile fleets share a port province. Blockade is a crude national switch. There are no generals (`gen` is always null), no mobilization, and supply is a national shortage penalty.

### M1. Naval war
- **Interception:** a fleet moving along a sea lane fights any hostile fleet stationed at either end of that lane, not only at its destination.
- **Blockade by port:** a coastal province is blockaded when a hostile fleet sits in it and no friendly fleet does. Replace the national switch with a share: blockaded coastal population ÷ total coastal population. That share cuts the nation's imports, exports and tariff income proportionally.
- **War score** from blockade: up to +1 a month at full blockade.
- **Naval AI:** at war, the stronger navy blockades the enemy's largest ports; the weaker keeps its fleet in its best naval base. Fleets escort transports when an invasion is planned.
- **Accept:** in a GBR–FRA war in the test run, blockade share of the weaker navy is above zero and its tariff income falls; no fleet sits idle in port while its side has naval superiority.

### M2. Transports and landings
- Each transport carries 4 land units. An army may move by sea only if its side has enough free transport capacity in the departure port; capacity is locked until the army lands.
- A landing in an enemy-held province takes one extra month and the landing force fights its first battle at −25% attack.
- The army panel shows capacity needed and available, and why a sea move is refused.
- **Accept:** an army without transports cannot cross water; with them it can; AI Great Powers land troops overseas at least once in a 60-year run.

### M3. Generals
- New per-nation pool `c.leaders`. Each month a nation earns leadership from its Officers share and military spending; at a threshold it gains a general `{n, atk, def, mv, age}` with stats 0–4 rolled with `rng()`.
- Names: a short surname list per culture group in `defs.js`.
- Assign or remove in the army panel. Effects in `fight()`: ±8% attack or defence per point; `mv` shortens marches. Generals can die in battle or of age.
- AI assigns its best general to its largest army.
- **Accept:** battle results differ measurably with a 4-attack general versus none over 200 simulated fights; generals survive a save and load.

### M4. Battles with depth
- **Frontage:** terrain sets how many units fight at once (plains wide, mountains and jungle narrow). Units beyond the front wait in reserve and replace broken ones.
- **Digging in:** an army that has not moved gains +1 dig-in a month up to 3 (each +10% defence), lost on moving.
- **Combined arms:** artillery adds its full value only when at least two infantry stand in front of each gun; cavalry gets a pursuit bonus when the enemy breaks.
- **Duration:** a battle can last several months; each month posts one line to the news for the player's battles.
- **Accept:** a smaller dug-in force in mountains beats a force 1.5× its size more often than not; the same forces on plains lose. Average battle lasts 1–3 months.

### M5. Supply and attrition
- Province supply limit = terrain base + railway level + fort level, in units. Units over the limit lose strength each month in proportion to the excess.
- An army with no land or sea path to territory its side holds is cut off: organisation falls to zero over three months, then it surrenders.
- Shortages of arms, ammunition and canned food reduce organisation recovery for armies in proportion to their distance from home.
- AI splits armies that exceed the supply limit and avoids marching through wasteland.
- **Accept:** a 40-unit stack in desert loses strength monthly; the AI's average stack does not exceed the limit by more than 20%.

### M6. Mobilization
- A nation may mobilize: conscript infantry appear in each owned province in proportion to its Farmers and Labourers and its conscription level; those workers leave the fields and mines (output falls) until demobilized.
- Mobilizing takes two months, raises militancy slightly each month it lasts, and is announced to all nations (neighbours' relations fall).
- Demobilizing returns the survivors to work.
- AI mobilizes when at war with a nation of at least 70% of its strength, and demobilizes at peace.
- **Accept:** Prussia's field army roughly doubles on mobilization; its grain output falls while mobilized and recovers after.

### M7. Military interface
- Map: arrows for every moving army the player can see; a crossed-swords marker on provinces with a battle; a hatched overlay on occupied provinces (exists, check it reads well).
- Army panel: general, dig-in, supply status (within limit / over / cut off), transport need.
- Military page: mobilize and demobilize, list of generals, navy list with blockade share inflicted and suffered.
- **Accept:** all new mechanics from M1–M6 are visible and operable at 390 px without horizontal scrolling.

---

## 5. Economy work orders

Current state: single world market with home-first supply and tariffs; pops buy needs in three tiers; capitalists build factories from pooled savings; the state builds buildings, railways and factories; money stock is topped up by `moneyMonth` when it falls below its 1836 ratio to real output.

### E1. Late industrializers
Target factory levels in 1900 with all nations AI-controlled, in at least 3 of 4 seeds (7, 3, 11, 21):

| Nation | Target levels |
|---|---|
| United Kingdom | 150–250 |
| United States | 180–260 |
| Germany (or Prussia) | 110–200 |
| France | 100–180 |
| Russia | 40–90 |
| Austria | 40–80 |
| Italy (or Sardinia) | 25–50 |
| Japan | 15–40 |
| China | under 15 |

Russia is now around 5. First find out why with `bal.js` (print Russia's investment pool, staffing, `bestGood` and `bestSite` results each decade). Likely levers, in order of preference: literacy penalty on factory cost, share of Capitalists in the population, and **foreign investment**: a Great Power's investment pool may build factories and railways in states in its sphere when margins at home are poor; profits flow back to the investor's capitalists.
- **Accept:** the table above; no nation under 6 million people exceeds 60 levels.

### E2. Stable prices across the century
- Make `moneyMonth` two-sided: when money in circulation exceeds 1.15× its 1836 ratio to real output, withdraw the excess gradually (through treasuries, never below zero for any pop).
- Find why steel and machine parts run short by 1900 (demand from construction and armies outgrows capacity) and fix the cause, not the symptom.
- **Accept:** in `bal.js`, every listed price index stays between 0.6 and 1.8 at 1860, 1880 and 1900 on seeds 7 and 3.

### E3. Power ranking by real output
- Industry score = value of factory output at base prices, not factory levels. Re-weight prestige, industry and military so that the eight Great Powers of 1900 are drawn from GBR, GER/PRU, USA, FRA, RUS, AUS, ITA/SAR, JAP in at least 3 of 4 seeds, with at most one other nation.
- **Accept:** the lists printed by `bal.js`.

### E4. Sphere markets
- States in a Great Power's sphere count as its home market: the sphere leader's producers supply them before the world market does, and no tariff applies between them.
- **Accept:** a sphere member's imports of a good its leader produces come from the leader first (log one example); tariff income between them is zero.

### E5. Factory modernization
- Each factory has a method level 0–2. Technologies unlock higher methods per industry group; upgrading costs machine parts and time; each level raises output per worker by 20% and input efficiency by 10%.
- Capitalists upgrade profitable factories before building new ones; the state may order upgrades.
- **Accept:** by 1900 most British and German factories are at method 1 or 2; total output rises without a matching rise in craftsmen.

### E6. Debt and bankruptcy
- Review the existing debt code. Interest depends on rank and debt relative to income; a credit ceiling of about five years of income; default clears the debt, costs prestige, blocks borrowing for ten years and angers creditor Great Powers (a casus belli).
- **Accept:** an AI nation driven into deficit borrows, pays interest and, if it cannot recover, defaults; no nation holds negative treasury indefinitely.

### E7. Economy interface
- Record one history point a year per nation (population, income, factory levels, rank) and per good (price). Draw simple line charts: prices on the Economy page, population and income on the Nation page.
- A ledger on the World page: a sortable table of all nations (people, income, industry, army, navy, literacy, rank).
- Trade: imports and exports by good for the player's nation.
- **Accept:** charts and ledger render at 390 px, use the existing color tokens, and do not slow the month by more than 5 ms.

---

## 6. Order of execution

M1 → M2 → M5 → M4 → M3 → M6 → M7, then E1 → E3 → E2 → E4 → E5 → E6 → E7.

After the military block and again after the economy block, run all four seeds for the full 100 years (`node hist.js 1200 <seed>`) and report: wars fought, average war length, nations destroyed, Great Powers by decade, and anything implausible.

## Block 3: Diplomacy and balance (D0–D6)
Order: D0 → D1 → D2 → D3 → D4 → D5 → D6. Same rules and regression tests as above.

- **D0 Balance leftovers.** (a) Britain reaches 300–330 factory levels by 1900 (target 150–250): find a general cause (e.g. colonial/Indian provinces counting toward home industry, capital pool size, slot rules) and fix without nation-specific code; keep the other E1 rows in range. (b) AI research: nations must research the techs that unlock factory methods when they have factories (Russia never does). (c) AI nations in real fiscal trouble should sometimes default: check that AI borrowing/default path is reachable in normal play.
- **D1 Infamy and coalitions.** Conquest adds infamy scaled by the share of the victim taken; full annexation of a civilized nation costs much more. Infamy decays slowly. Above a threshold (about 25) neighbours and Great Powers form a containment coalition: they ally each other against the aggressor, join defensive wars against it, and may declare a "contain" war (goal: release nations / return last conquests, cut infamy). Coalition dissolves when infamy falls. Player sees infamy, the threshold and coalition members on the Diplomacy/World page and gets a warning before a war declaration that would cross the threshold. Target: nations destroyed per century 8–15 (now 24–27), wars 30–45.
- **D2 Guarantees and balance of power.** Great Powers guarantee small neighbours whose fall would strengthen a rival (game theory: guarantee when rival gain > cost of war × probability). A guarantee brings the guarantor into a defensive war. AI weighs guarantees and alliances of the target before attacking (expected value of war = p(win)·gain − cost; attack only if positive with margin) — this also removes hopeless AI attacks. Player can issue/revoke guarantees.
- **D3 Peace deals.** Peace offers itemised: provinces, release a nation, reparations (share of income for 5 years), humiliate (prestige), end sphere. Each item costs war score; AI accepts by war score, exhaustion and length of war. Released nations come from DORMANT where cultures match. Phone-friendly peace screen with running total.
- **D4 Crises and congresses.** When a Great Power war threatens (GP vs GP, or GP vs guaranteed state) there is a 30% chance of a congress first: other GPs back a side by interest; the weaker backing must concede a lesser goal or fight. Gives the player a choice card (back down / compromise / fight) with the estimated odds shown.
- **D5 Historical events with player choices.** When the player is the nation concerned, events in events.js (1848, Italian wars, Schleswig, 1866, 1870, Civil War, famine, Taiping) show a choice card with 2–3 options and plainly stated consequences instead of running automatically. AI keeps current behaviour. Add 6–8 more dated events with choices on the same pattern (e.g. Crimean War 1853, Indian Mutiny 1857, Meiji Restoration 1868, Scramble/Berlin Conference 1884, Russo-Japanese rivalry 1904, Balkan crisis 1912), each conditional on world state.
- **D6 Diplomacy UI.** Diplomacy page per nation: relations, alliance, guarantees, sphere, infamy, truce, last war; action buttons with the AI's answer and reasons shown before committing ("would accept: +relations, −rival"). World page: coalition and crisis banner. All at 390x844.

Block review: `node hist.js 1200 <seed>` on 7, 3, 11, 21: nations destroyed, wars, Great Powers at 1900, E1 table, coalitions formed, congresses held.

## Block 4: Interface and ease of use (U1–U9)
Reference: `ref/index.html` is the owner's earlier game "Devlet-i Âliyye" whose look he prefers (parchment theme, red small-caps display headings, ornamented band under the header, corner-bracketed frames, diamond divider, floating tab bar, "State of the Empire" overview). Open it in playwright at 390x844, press through to the Overview, screenshot, and read its CSS (classes: band, hero, headorn, tailorn, kpi, kgrid, foldh, collapsed, jumpbar, alerts, alert, brief, bnav, moregrid, morebtn, sheet, disp, seal, titlepage, meter, spark). PORT that design system into `src/ui.css` (copy and adapt rules, fonts and inline SVG ornaments; keep everything in one file, no network fonts unless the reference already embeds them). The goal is that a screenshot of The Long Century's Overview next to the reference Overview looks like the same family. Game logic is not to change in this block except where stated. Old saves must load. Phone first: 390x844, Firefox Android; no horizontal scroll; touch targets ≥ 44 px; nothing may cover content (no toast over the page).

Order: U1 → U2 → U3 → U4 → U5 → U6 → U7 → U8 → U9. After each: playwright at 390x844, screenshots to `shots/u<N>_*.png`, no page errors.

- **U1 Design system.** Port tokens, typography, band, framed section (`.frame` with corner brackets, small-caps red title, chevron collapse, state remembered in localStorage inside try/catch), KPI tile, meter/gauge bar, sparkline, chip, alert strip (red/amber/green), button styles (primary red pill, round icon button), bottom sheet, divider ornament. Header: round flag, date large with a second line (reign/government and turn number), settings gear, fast-forward (») and End month. Scrollable KPI strip (Treasury with monthly change, Rank, Prestige, Stability/Militancy, Army, Infamy, War exhaustion) — tiles turn red-bordered when bad; tap a tile opens its page.
- **U2 Navigation.** Floating rounded tab bar with six items: Overview, Dispatches (badge with count), Map, Economy, Military, More. More opens a sheet grid: Nation, Politics, World, Research, News, Ledger, Guide, Settings (save/load/export, cheat button moved here, text size, theme). Old tab keys must keep working (`ACT.tab`).
- **U3 Overview page (new home).** Emblem + "The State of the Nation — a summary for the <head of government title by government type>" + divider. Jump chips to each section. Alerts first (computed: province about to fall, treasury negative within N months, debt near ceiling, coalition forming/infamy near 25, unrest hotspots, blockade, famine, army over supply limit, idle capital/empty build slot, research idle, war that can be ended now with score). Each alert is one plain sentence and tapping it goes to the place to fix it. Then framed sections: State of the nation (rank, people+literacy, national income, the poor, militancy, chamber/ruling party), Rivals compared with us (3 nearest powers: industry, army, navy, prestige as paired bars), Wars and fronts (war score bars), Budget this month (income vs spending bar, balance), Unrest hotspots (top 5 provinces), Objectives (U6), Minister's brief (U5).
- **U4 Dispatches.** Replace toasts with a Dispatches inbox: events, decisions available, peace offers, congress/crisis cards, war declarations, completed works, as sealed cards with a category icon, date, 2–3 options where a choice exists, and consequences in one line each. Unread badge on the tab. "End month" warns (once, dismissible) if a dispatch needs an answer. Minor news goes to a one-line ticker under the header that never overlaps content.
- **U5 Minister's brief (game theory, plain words).** Each month 3–5 ranked recommendations with reason and expected payoff, computed from existing AI evaluators (war expected value from diplo.js, best factory good/site, budget slack, research value, guarantee value): e.g. "Build a steel mill in Silesia: steel is short and pays about 14% a year", "Do not attack Denmark now: Britain guarantees it; odds 30%". Each has a button that performs or opens the action. Show the payoff comparison of the top 2–3 options as a small table.
- **U6 Objectives and guide.** Per-nation objectives (historical and generic: unify Germany/Italy, abolish slavery, reach rank N, literacy X, industrial score Y, keep Great Power status to 1936) with progress bars and a score. First-game guide: 6 short steps as dismissible coach cards on the pages concerned; a Guide page with one screen per system (economy, war, navy, diplomacy, politics) in under 80 words each; every number label gets a tap-to-explain sheet ("why is this value what it is": breakdown of contributors).
- **U7 Restyle every page** (Nation, Economy, Politics, Military, World, Research, News, province sheet, peace screen, war declaration, nation picker) into collapsible frames using the system; replace paragraphs by bars/gauges/sparklines with the explanation behind an ⓘ tap; lists get flags and aligned numbers; confirm dialogs for irreversible actions state the cost. Title page: illustrated period header (inline SVG skyline/steamship/railway), drop-cap intro, nation cards with flag, ruler/government, people, rank, difficulty (Easy/Medium/Hard), and a one-line situation.
- **U8 Map.** Map takes the full height between header and tab bar; cleaner labels (nation names curved or centred, size by area, no overlap), army markers as small flag counters with size, selected army shows its orders; map mode switch as chips; legend collapsible; tap province → bottom sheet in the new style; pinch-zoom and drag smooth on phone; "next idle army" and "go to capital" buttons.
- **U9 Play comfort.** Autosave every month and "Continue" on the title page; 3 save slots + export/import; end-of-month summary sheet (what changed: money, wars, events) that can be turned off; fast-forward stops on dispatches needing an answer, war declared on us, province lost; undo for the last non-combat order of the month; text-size setting; dark theme tokens if the reference has them; end-of-game chronicle (1936 or defeat) with score, graph of rank over time, and key events.

Block review: screenshots of every page at 390x844 and 360x740 next to the reference Overview; a full 24-month scripted play (start, build factory, declare war, move army, make peace, answer a dispatch, save, reload) with no page errors; `node hist.js 240 7` still ok; month time unchanged.

## Block 5: Buildings (B1–B4)
Current: `BLD` in `src/build.js` has six province buildings (fort, port, university, hospital, irrigation, mine works) and 13 great works (`GW`). Same rules for AI (`aiBld`). Every building needs: cost in money and goods, build time, upkeep, levels, a tech or condition gate, one clear effect that already-existing systems read, an icon, and one plain sentence in the province sheet. Old saves load (missing building = level 0).

- **B1 Province buildings, new.** Add: railway station/depot (raises supply limit and troop speed; separate from rail level), arsenal (cheaper/faster recruitment here, small arms output), barracks (raises local recruit cap and mobilization share), naval base and dry dock (ship repair speed, build ironclads/dreadnoughts only with dry dock level by tech), coaling station (extends naval range from late 1860s: steam fleets need one within N sea zones — keep simple), telegraph office (admin efficiency, faster news/orders; needs telegraph tech), customs house (tariff efficiency in ports), bank branch (local investment capital; needs central bank decision), school (literacy growth; cheaper than university), technical college (clerks/research; needs literacy), market hall and warehouses (local needs met, less price swing), grain silo (famine protection), waterworks and sewers (city growth cap, lower death rate; late century), power station (after electricity; factory method 2 output), police station (militancy growth down, consciousness up slightly), courthouse (admin, crime), cathedral/great mosque/temple (militancy down, assimilation up or down by culture), theatre/opera and museum (prestige trickle), newspaper press (consciousness, election swings), stock exchange (capital only: investment pool), canal/river port (inland trade access for landlocked provinces with rivers — use terrain flag if there is one, else skip).
- **B2 Factories as buildings the player sees.** Province sheet lists each factory with good, level, method, staffing, profit, owner; state-run economies (planned/state capitalism policies) let the player build, expand, subsidise and close; laissez-faire shows capitalists' queue and lets the player only encourage (subsidy/tariff). Show why a build is refused ("no literate workers", "no coal").
- **B3 Great works, more.** Add about 12 with historical places and dates, each tied to a province and a tech: Crystal Palace (LON 1851), Brooklyn Bridge, Statue of Liberty, Ringstrasse (VIE), Haussmann's Paris, Hejaz Railway (OTT), Cape-to-Cairo railway (needs chain of provinces), Trans-Australian/Canadian Pacific (if provinces exist), Aswan Low Dam (CAI region, irrigation), Simplon/Mont Cenis tunnel, Tokyo–Yokohama railway (JAP after Meiji), Grand Trunk Road/Indian railways (GBR in India), Nobel/Royal academies (research), national bank headquarters, world's fair repeatable each decade by a different capital. Check province IDs in `world.js`; where a province does not exist, pick the nearest that does or drop the item. Each gives prestige plus one system effect. Rival great works: only one nation can hold "first" bonuses (first transcontinental, first exhibition).
- **B4 Building interface.** Province sheet "Buildings" as an icon grid with level pips, cost and effect; a national "Works" page: all projects with progress bars, a build queue the player can reorder, filters by type, a "build in best province" suggestion with the payoff shown (ties into U5). AI builds by the same payoff function.

## Block 6: Historical events (H1–H5)
Current: `EVENTS` in `src/events.js` (16 dated events; D5 added player choice cards). Pattern for every event: `id`, year window, `cond()` on world state (never fire if the nations/provinces concerned no longer fit), 2–3 options with stated consequences for the player, a default for AI weighted by its situation, effects through existing systems (militancy, wars, spawnNation, reforms, prestige, relations, prices), a dispatch card text of 2–3 sentences in period voice, and a line in the chronicle. No event may be nation-specific code inside other systems; all goes through the event table. Each event gets a headless test that it fires under history-like conditions on seeds 7, 3, 11 and does not fire when its condition is broken.

- **H1 Europe.** Reform Act agitation/Chartism (GBR 1838–48), Zollverein expansion, Belgian neutrality treaty 1839, Carlist wars (SPA), Sonderbund war (SWI 1847), Hungarian revolution 1848–49 (AUS; Russian intervention option), French Second Republic/Second Empire 1848–52, repeal of Corn Laws link, Polish rising 1863, Ausgleich 1867 (AUS becomes dual monarchy: accept Hungarian culture, lower militancy, lose central power), Paris Commune 1871, Kulturkampf and anti-socialist laws (GER), Congress of Berlin 1878 after a Russo-Turkish war, Bulgarian/Serbian/Romanian independence, Dreyfus affair, Norwegian independence 1905, Russian revolution of 1905, Young Turk revolution 1908, Bosnian crisis 1908, Moroccan crises 1905/1911, Italo-Turkish war 1911, Balkan wars 1912–13, the July crisis 1914 → Great War (H4).
- **H2 Americas, Asia, Africa, Middle East.** Texas annexation and Mexican–American war 1846 (USA: Manifest Destiny choice), Oregon settlement, California gold rush 1849 (migration pull, money growth), Kansas–Nebraska/Dred Scott build-up raising Civil War odds, Reconstruction choice after victory, Alaska purchase 1867, Spanish–American war 1898, Panama independence 1903, Mexican revolution 1910, War of the Triple Alliance 1864 (PRG), War of the Pacific 1879 (CHL/PEU/BOL), Brazilian abolition 1888 and republic 1889; Opium wars 1839 and 1856 (GBR/CHI: treaty ports, Hong Kong), Perry expedition 1853 (JAP: open or resist), Self-Strengthening movement (CHI), Sino-Japanese war 1894, Hundred Days reform 1898, Xinhai revolution 1911, Anglo-Sikh wars 1845/1848 (PUN), First Afghan war 1839, Great Game crises (RUS/GBR over AFG/PER), Persian constitutional revolution 1906, Egyptian–Ottoman war 1839 and Oriental crisis 1840, Urabi revolt and British occupation of Egypt 1882, Mahdist war, Suez purchase 1875 (ties to GW), Great Trek and Boer wars 1880/1899 (TRN, ZUL: Anglo-Zulu war 1879), Fashoda 1898, Adwa 1896 (ETH vs ITA), Tanzimat/1876 Ottoman constitution and suspension, Hamidian debt default 1875 (ties to E6: Ottoman Public Debt Administration as a default outcome), Armenian and Balkan unrest, Philippine revolution 1896.
- **H3 World-wide and economic.** Cholera pandemics (city deaths unless waterworks: ties B1), railway mania 1840s (investment boom then bust), panics of 1837, 1857, 1873 (Long Depression: demand shock, bank failures where no central bank), 1893, 1907; gold standard adoption choice 1870s (stable prices vs tighter money: ties `moneyMonth`), gold rushes (California, Australia, Transvaal, Klondike), guano/nitrate/rubber/oil booms where goods exist, Irish/German/Italian mass emigration waves, abolition of slave trade enforcement, First International 1864 and rise of socialist parties, women's suffrage movements, Nobel prizes/Olympics 1896 (prestige), Hague conferences 1899/1907 (arms limits choice), influenza 1918.
- **H4 The Great War and after.** Alliance blocs form from 1879 on world state (not fixed lists): when two GP blocs exist and a crisis (D4) fails after 1905, a general war starts: all bloc members join, total mobilization, war weariness → revolutions (Russia 1917 if exhaustion and militancy high: government change to a new ideology already in the game or peace at any price), collapse of losing empires into DORMANT nations by culture (Poland, Czechoslovakia/Hungary, Yugoslav states, Arab states, Ireland 1921), peace conference with itemised terms (uses D3) and a League of Nations choice (lower war odds for members). If no Great War happens by 1925 that is a valid outcome. After: reparations, 1929 crash (H3 pattern), rise of radical movements where militancy and unemployment are high.
- **H5 Chains and chronicle.** Event chains keep memory (`G.ev` flags): choices change later events' odds and options (e.g. harsh Reconstruction → later unrest; refusing Perry → forced opening later). A Chronicle page lists every event with the choice taken and compares with what happened in history in one line ("In history Austria accepted the Compromise"). Counterfactual note when the world has diverged so an event cannot occur. Per-nation flavour: at least 4 events with choices for each of the 8 starting Great Powers and 2 for each secondary power by the end of the block; list counts in the report.

## Block 7: Politics and society (P1–P5)
Read `src/politics.js` and `src/society.js` first and report what exists; extend, do not replace.
- **P1 Parties and elections.** Named parties per nation by ideology with positions on trade, economy, religion, citizenship, war; election campaigns with 2–3 issue events; upper house composition limits reforms; coalitions when no majority; the player can appoint the ruling party in monarchies at a militancy cost.
- **P2 Reforms.** Full political (franchise, press, unions, parties, upper house) and social (wages, hours, safety, health, pensions, schools) ladders; each step has cost, effects on pops' needs/militancy/consciousness and budget, and who supports it; movements that push for a step and rebel if ignored; reactionary backlash.
- **P3 Pops.** Promotion/demotion by needs and literacy, unemployment visible, migration within nation and overseas (pull by wages and reforms), assimilation, religion if present; pop detail sheet with needs, income, politics; national population pyramid by type as a chart.
- **P4 Unrest and revolutions.** Rebel types with aims (liberal, reactionary, socialist, nationalist, separatist); revolution changes government type when rebels hold the capital; nationalist success releases a DORMANT nation; player options: concede, repress, reform.
- **P5 Government and policy.** Government types with real differences (who chooses the ruling party, reform rights, mobilization, war weariness); national focus points per region (encourage a pop type, an industry, colonisation, assimilation); budget sliders with consequences explained; national bank and currency policy from H3.

## Block 8: Colonies and the wider world (C1–C3)
- **C1 Colonisation as a contest.** Claims need naval range (coaling stations, B1), tech (medicine, machine gun, steamers) and points; rival claims lead to a crisis (D4) or partition at a conference (Berlin event); colonies as distinct status (colony → protectorate → dominion → state) with different tax, manpower and unrest; colonial goods (rubber, ivory, tropical wood, tea, coffee) where goods exist.
- **C2 Uncivilised states.** Westernisation as a reform track (military, economic, administrative steps bought with research points and at risk of reactionary revolt) replacing the single decision; unequal treaties (treaty ports, extraterritoriality, tariff control) imposed by GPs and later revised; puppets, protectorates, tribute.
- **C3 Dominions and release.** Release nations by choice, dominion status for settler colonies (Canada, Australia, South Africa if provinces exist), independence movements after 1900, decolonisation pressure late game.

## Block 9: Technology (T1–T2)
- **T1 Tech tree depth.** Five fields with about 8 steps each and dated inventions that fire by chance after a tech (e.g. Bessemer steel, breech-loading rifle, dreadnought, dynamo, telegraph, vaccination, combustion engine, aeroplane, tank, gas, radio); each invention has one concrete effect; ahead-of-time penalty; research points from literacy, clerks, universities; spread from neighbours and sphere leader.
- **T2 Military eras.** Unit upgrades by era (muskets → rifles → magazine rifles → machine guns/trenches → tanks/aircraft as late support brigades; sail → steam → ironclad → pre-dreadnought → dreadnought → submarine/cruiser), with battles shifting to defence advantage around 1900 (trenches) unless combined arms; obsolete ships lose most value. Research page shows the tree with dates and what each step unlocks.

## Block 10: AI and balance (A1–A4)
- **A1 Determinism and speed.** One seed must give identical results on every run: find the source of run-to-run differences (iteration order, Date, Math.random, shared state between tests) and fix. Profile `monthTick`; keep under 100 ms alone at 1900.
- **A2 Balance targets across 8 seeds (7, 3, 11, 21, 5, 13, 17, 29).** Wars 30–45 per century, mean 12–24 months; nations destroyed 8–15; E1 table in range on 6 of 8; Great Powers at 1900 include GBR, USA, FRA, GER/PRU, RUS on all and AUS or ITA or JAP on most; prices 0.6–1.8; Germany and Italy form on 7 of 8; Union wins on 7 of 8 and a coalition cannot later undo a civil-war result; 2–6 AI defaults per century; 5–10 congresses with a third ending without war; coalitions 3–8.
- **A3 AI personalities and difficulty.** Per-nation strategic aims (unifier, coloniser, balancer, isolationist, revanchist) that weight the expected-value decisions; difficulty levels change AI aggressiveness toward the player and bonuses, never the rules; AI uses every system added in blocks 5–9 (buildings, reforms, tech choices, colonies).
- **A4 Game-theory layer for the player.** For every major decision screen (war, peace, alliance, guarantee, congress, reform, big investment) show the options as a small payoff table with odds and the other side's likely answer, and a "what the minister would do" mark; an end-of-year review of decisions taken against the recommended ones.

## Block 11: Release checks (Q1–Q4)
- **Q1 Full play tests** at 390x844 and 360x740 as GBR, PRU, RUS, OTT, JAP, USA, SAR and one minor: 120 months each by script exercising every page and action, no page errors, saves from the handover version still load.
- **Q2 Real-phone comfort.** File size under 1 MB if possible; first load under 3 s on a mid-range phone (measure with CPU throttling 4×); no layout jump when the Firefox address bar hides; safe-area insets; back button closes sheets instead of leaving the page.
- **Q3 Text pass.** Every string plain English, consistent names, no developer terms; numbers with units; Guide complete for every system.
- **Q4 Scenarios.** Extra start dates built from the same rules if time allows: 1861, 1871, 1900, 1914 (world state tables only; no new code paths).

## Order of execution (remaining)
(U1–U9 done) → B1–B4 → W1–W6 → H1 → H2 → H3 → P1–P5 → C1–C3 → T1–T2 → H4 → H5 → A1–A4 → Q1–Q4. One agent at a time: all work orders edit the same files. Report after each work order in under 400 words: what was done, measured numbers against targets, misses and why, weak spots.

## Block 5b: Theatre warfare (W1–W6) — runs right after Block 5, before Block 6
Owner's request: remove individual army selection and movement; command by theatre as in his earlier game (`ref/index.html`: `THEATER_DEFS`, `THEATER_HUB`, its Army page), refined; keep infantry, cavalry and artillery. Same rules for every nation and for the AI.

**Design.** Keep the existing engine (`G.armies`, paths, supply, `landFight`, sieges, transports, generals, mobilization) as the hidden layer. Add a theatre layer that owns every army and gives it orders; the player commands theatres only. This reuses tested code and keeps old saves loading (armies are assigned to theatres on load).

- **W1 Theatres.** A fixed world table `REGIONS` in `src/defs.js`: about 45 named regions covering all 184 provinces (e.g. Rhineland, Low Countries, North Italy, Danube, Balkans, Poland, Baltic, Caucasus, Anatolia, Levant, Egypt, Punjab, Bengal, North China, Manchuria, Atlantic seaboard, Mississippi, …); build it from province coordinates/adjacency in `world.js` plus hand names; every province in exactly one region; test that each region is connected. A nation's **theatre** = its provinces (owned or occupied) in one region. Each theatre has: hub (best rail/port province), brigades by type (inf/cav/art, regulars and conscripts), general, supply state, dig-in, morale, readiness, and the enemy theatres it faces (**fronts** = adjacent province pairs across a hostile border, plus sea fronts for landings). `G.th[tag][region]`; saved; rebuilt for old saves.
- **W2 Orders.** Per theatre one **stance**: Attack (objective = enemy region or province chosen from a short list), Probe (limited attacks, low losses), Hold, Dig in (builds entrenchment, lower supply use), Fall back (trade land for time to a named line), Garrison (anti-rebel, minimum force). Per theatre an **intensity** (cautious / normal / all-out: trades losses for speed) and a **priority** for reinforcements and supplies (low / normal / high). National **reserve** pool. **Transfers**: move N brigades of a type from theatre A to B; arrival time from the existing path, rail and sea-lane/transport code; shown as "arriving in 2 months". Expeditions: create an overseas theatre by assigning brigades and a fleet to a target coast (uses M2 landing rules).
- **W3 Theatre commander.** One function `theatreOrders(tag, region)` turns stance + objective into army orders each month for player and AI alike (generalise `aiArmies`): concentrates on the objective axis by supply limit and frontage, keeps a reserve line, relieves sieges, pursues, respects supply (M5), refuses hopeless attacks unless all-out. The AI's part becomes choosing stances and transfers by expected value (existing `diplo.js` evaluators); the player chooses the same things by hand. No code path lets the player move a single army.
- **W4 Fronts and battles.** Battles still resolve by `landFight` with terrain, dig-in, frontage, generals, combined arms (inf holds, cav pursues and scouts — pursuit losses and recon bonus —, art breaks entrenchment and sieges). Results aggregate per front: front line position, provinces taken this month, losses by type, a one-line reason ("outnumbered 2:1 in the mountains"). Rebels are handled by Garrison stance automatically. War score and occupation unchanged.
- **W5 Navy by station.** Fleets assigned to sea regions with a mission: Blockade (target nation), Patrol/escort (protects lanes and transfers), Fleet in port, Seek battle, Support landing. Reuses M1 code (`navalPower`, `laneIntercept`, `blockadeMonth`); no individual fleet movement in the UI.
- **W6 Interface.** Military page: national strength tiles (inf/cav/art, reserve, manpower), then one framed card per theatre: name, general, strength bars by type vs the enemy's estimate (fog: ±20% unless cavalry/recon advantage), supply and dig-in gauges, stance chips, objective picker, intensity, priority, transfer button, last month's result line, and the minister's advice with odds (ties to U5: "Attack in the Rhineland: odds 62%, expected losses 14 brigades"). Map: remove army counters and army sheets; draw theatre outlines for the player, front lines as thick coloured segments with an arrow for the attacker and a strength chip per front (ours : theirs), crossed swords on active battles, anchors for fleet stations; tap a front or theatre → its card as a bottom sheet. Recruit/raise brigades goes to the national reserve or a chosen theatre. Remove "next idle army"; add "next theatre needing orders". Guide and coach cards updated.

Tests: `test_w1.js` (regions cover all provinces, connected), `test_w3.js` (Prussia vs Austria 1866 set-up: Attack stance takes provinces; Hold/Dig in holds against 1.3:1; Fall back loses land but fewer men), `test_w5.js` (blockade by station ≥ 30% GBR on FRA), old save loads and armies are assigned; `hist.js 720` on 7, 3, 11 still forms Germany and Italy and reabsorbs the CSA; wars per century and nations destroyed within ±15% of the pre-block values (measure first); month time within +10 ms; wrap_test.py; scripted 48-month war as PRU and as GBR (with an expedition) at 390 and 360 wide with no page errors.
