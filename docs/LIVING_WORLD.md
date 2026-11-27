# Living world: daily clock, a map that moves, and presentation

Status: design, 27 Nov 2026 (Claude). Owner decisions behind it: the game is **not a text simulator** (B29); the monthly tick is **replaced by a daily tick for every feature and engine system** (B24); a loading screen with history (B30), a newspaper (B34), a progression system (B35), a date controller (B36) and progress indicators (B37). It changes `docs/DESIGN.md` §2.1 (turn contract), §7 (war), §11 (interface) and MASTER_PLAN rules 3 and 14; those files are updated by the tickets below, not silently.

## 1. What changes, in one table

| Today | After this plan |
|---|---|
| One month per turn, an End month button | A running clock, one day per tick: pause, speeds 1–5, the date always on screen (DAY8, B36) |
| Every system runs once a month | Every system runs on the daily clock; heavy ones are spread over the month (§2.2) |
| Armies are numbers inside a theatre | Armies and fleets have a position, move day by day along roads, railways and sea lanes, and are drawn on the map (§3.2) |
| Buildings are lists in a sheet | Railways grow segment by segment on the map; factories, forts, ports and great works appear with scaffolding while built (§3.3) |
| An SVG map of coloured shapes | A graphics-chip map (PixiJS): terrain, rivers, sea, cities by size, borders that move, fronts, animation (§3.1) |
| Dispatches and toasts | A period newspaper, event pictures, a loading screen with history (§4) |
| Plain numbers | Progress bars and causal breakdowns on every number that grows or changes (B33, B37) |

## 2. Daily clock (B24)

### 2.1 Time

- `G.day` = days since 1 January 1836 (real calendar, leap years). Date helpers from AI Studio's `src/engine/state.ts` (`isLeapYear`, `getDaysInMonth`, `getCalendarDateState`) are reused.
- `G.t` (the month index read in about 270 engine places and 88 interface places) becomes a value **derived from `G.day`** during the conversion, so old code keeps working while each system moves over. It is removed at the end (DAY9).
- Every duration becomes days: build times, research, treaties ("24 months" → an end date), war goals, debts, cooldowns.

### 2.2 One scheduler, three kinds of system

Each system registers how it runs. All run inside the daily tick, in the fixed causal order of DESIGN §2.1 (infrastructure and access → production → trade → prices → wages, taxes, investment → construction → pops → politics → research → diplomacy and war), from one seeded `rng()`.

| Kind | Runs | Systems | Why |
|---|---|---|---|
| **Daily** | every day, whole world | movement of armies and fleets, battles, sieges, supply, blockades, construction progress, treasury cash flow, event and decision timers, diplomacy offers, date-bound history | They change what the player sees on the map from one day to the next |
| **Staggered daily** | every day, 1/30 of the provinces or nations each day (each has its own day of the month) | production and consumption, pop growth and migration, needs and standard of living, radicalism, research points, AI thinking | Same total work as today spread across the month, so a day costs about 1/30 of a month and nothing jumps on the 1st |
| **Daily, smoothed** | every day with small steps | prices and market clearing, interest groups' clout, legitimacy | A daily step of 1/30 of today's monthly change keeps the same speed without spikes |

Conversion rules (so the first daily build plays like the monthly one before rebalancing):
- A rate per month becomes a rate per day: `× 1/daysInMonth`.
- A chance per month becomes a daily hazard: `1 − (1 − p)^(1/daysInMonth)`, same expected count.
- Monthly reports (budget, trade, news) become summaries of the last 30 days.

### 2.3 Budgets, saves, tests

- Budget: at most **4 ms per day** in Node at 1926–36 (≈ 120 ms per month, inside today's 130 ms), checked by the stress tier; the clock shows a day at most every 50 ms at top speed on the A56.
- Saves: a new save epoch; `G.day` stored; old saves are refused with a clear message (alpha rule, MASTER_PLAN rule 6).
- `century.js`, the stress tier and every `test_*.js` that counts months switch to days; the seed-7 hash changes once per DAY ticket, each stated in its PR.
- Calibration: after DAY5–DAY7 the §T targets are re-run; results must land in the same bands (DAY9).

## 3. A map that moves (B29, B20, B7)

### 3.1 Renderer

PixiJS on the graphics chip (go/no-go on the A56: #81 AND4; Godot only on no-go). Layers, bottom to top: sea and terrain (relief, rivers), provinces (owner colour, occupation hatching), borders, infrastructure (railways, ports, canals), cities sized by population, buildings, units and fleets, fronts and battle markers, labels, selection. Zoom levels decide what is drawn (level of detail), so a phone stays smooth.

### 3.2 Armies and fleets that move

- Each army and fleet has a position (province or sea zone) and, when moving, a path and a progress in days. Travel time depends on terrain, roads, railways (much faster), rivers, season and supply; fleets follow sea lanes and straits.
- On the map a unit token (sprite by type: infantry, cavalry, artillery, guards; ships by class) slides along its path each day; battles show where they happen and how they go; sieges show around the fort.
- **Command (owner decision needed, B2):** today the player gives orders to a **theatre** and never selects single armies (owner rule from earlier). Two ways forward:
  1. **Keep theatre command, show the armies.** The theatre's orders move the armies on their own, visible on the map; the player can tap an army to see it. Keeps the owner's earlier rule.
  2. **Direct control.** The player also selects and moves armies like Europa Universalis or Victoria 2, with theatres as an option.
  Recommendation: 1 first (smaller change, keeps earlier decision); 2 can be added later.

### 3.3 Building and infrastructure on the map

- Railways: each segment is drawn as it is finished; a moving train runs on finished lines.
- Factories, mines, forts, ports, naval bases, great works: an icon in the province, with scaffolding and a progress ring while built (B37), its level shown by size.
- Cities grow and shrink with population; canals open on the map (Suez, Panama, Kiel).

### 3.4 Art

All sprites, icons and terrain art are our own, AI-made (owner 27 Nov, B42, with prompt on record) or CC0/public domain, each listed in `docs/ASSETS.md`. One unit sprite style for the whole game, designed first (MED1 #93).

## 4. Presentation

| Feature | What the player sees | Data and rules | Ledger |
|---|---|---|---|
| **Date controller** | Date with day, month, year; pause; speeds 1–5; auto-pause on wars, events and finished buildings (each switchable) | Speed = days per second; pause states saved | B36 |
| **Loading screen** | A historical picture of the era or the chosen nation, a real quote with speaker, year and source, and a short "did you know" fact; a progress bar while loading | Quotes and facts in a data file, each with its source; only quotes published before 1929 by their authors (public domain); pictures public domain (museum collections), our own art or AI-made scenes (B42), each in `docs/ASSETS.md`; no invented quotes | B30, B37 |
| **Newspaper** | A front page every week or month: headlines about wars, treaties, inventions, elections, disasters and the player's deeds, in period style, with a masthead per nation | Built from the game's own events and numbers; each headline links to the event or province | B34 |
| **Progression** | Meaning to confirm with the owner: national milestones and achievements (first railway, industrialised, great power, history goals beaten), era changes, or both | Tracked from the history ledger (UI12) | B35 |
| **Progress indicators** | Bars and rings on construction, research, programmes, war score, unification and loading | Read from existing progress values | B37 |
| **Causal breakdowns** | Tap any key number to see the 2–3 biggest causes | One breakdown function per number | B33 |

## 5. Tickets (in order)

Stage A (stable base) comes first: the daily conversion multiplies any existing bug in saves or money (FX1, SV4).

| ID | Ticket | After | Done when |
|---|---|---|---|
| DAY0 | This design approved; DESIGN §2.1, §7, §11 and MASTER_PLAN rules 3 and 14 updated | — | Owner approves; command option chosen (§3.2) |
| DAY1 | Calendar and clock: `G.day`, date helpers, `G.t` derived, durations as dates, save epoch, tools in days | DAY0, FX1, SV4 | Same outcomes as monthly in a 1-day-per-month mode; hash change stated |
| DAY2 | Scheduler: systems register as daily, staggered or smoothed; causal order; one rng | DAY1 | Registry test; month made of 30 daily steps reproduces DAY1 in bands |
| DAY3 | Movement and war daily: positions, paths, travel time, battles on contact, sieges, supply, blockades | DAY2 | War counts and lengths in bands; armies never teleport |
| DAY4 | Construction daily: progress per day, completion dates, railway segments | DAY2 | Same build counts per decade in bands |
| DAY5 | Economy daily: staggered production and consumption, smoothed prices, daily cash flow, 30-day reports | DAY2 | §T economy targets in bands; no phantom income |
| DAY6 | Pops, society and politics daily (staggered); dated elections | DAY5 | Population, literacy, reform counts in bands |
| DAY7 | Research, diplomacy, events and AI daily; hazards converted; each nation thinks on its own day | DAY2 | Event counts, programme dates, war frequency in bands |
| DAY8 | Date controller and time UI: pause, speeds, auto-pause rules, date on screen | DAY1 | Owner check on the A56 |
| DAY9 | Remove `G.t`; rebalance; 4 ms/day budget; stress tier green | DAY3–DAY7 | Stress tier green; calibration in bands |
| MAP1 | PixiJS map renderer with layers and level of detail (extends AND4 #81) | AND4 go | Pan p95 ≤ 25 ms on the A56 |
| MAP2 | Armies and fleets drawn and moving, battles and sieges shown | DAY3, MAP1 | Owner check |
| MAP3 | Infrastructure and buildings on the map, scaffolding, trains | DAY4, MAP1 | Owner check |
| MAP4 | Fronts, occupation, cities by size, canals | MAP2 | Owner check |
| LOAD1 | Loading screen: pictures, verified quotes, facts, progress bar | MED1 | 50 quotes and 50 facts with sources; owner check |
| NEWS1 | Newspaper front page from game events | DAY7 | Owner check |
| PROG1 | Progression system (after the owner says what it means) | UI12 | Owner check |
| PROG2 | Progress indicators everywhere something grows | DAY4 | Owner check |
| CAUSE1 | Causal breakdown on every key number | UI1a | Sums match the number |
| SOC2 | Strata, needs, standard of living, radicalism, interest groups, legitimacy, laws (AI Studio Phase 2 asks) | DAY6, PO1 | Owner check; groups react differently to one law |
| BAL1 | Balance guardrails: price band 0.25–1.75x, penalty floors 0.15x, positive opening cash flow and stable radicalism for every country | DAY5 | Fixture for each guardrail; no death spiral in the stress tier |
