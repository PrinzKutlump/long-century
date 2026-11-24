# The Long Century: game design (every system and how they connect)

Status: canonical design, 24 Nov 2026 (Claude). It replaces the design parts of `docs/plans/*` (now in `docs/archive/`). Delivery order, tickets and targets are in `docs/MASTER_PLAN.md`; verified state in `docs/STATUS.md`. Where this file and an archived plan disagree, this file wins.

Numbers marked *now* are measured on `main` (f6d0973) and by the stress tier (316 centuries, 24 Nov).

## 0. The game in one paragraph

A Victoria 2-style grand strategy game from January 1836 to 1936, one month per turn, playable as any of 62 nations (77 with dormant ones), on a phone. Every nation, player and AI alike, runs on one set of rules; nations differ only through data (geography, peoples, laws, institutions, inclinations) and historical pressure (events and programmes that open when the world allows). The player's job is to do better than history by choosing better, and every important choice is shown as a small game: the options, the likely replies of the other side, the payoffs and the minister's pick.

## 1. Pillars (tests for every feature)

| # | Pillar | Test a feature must pass |
|---|---|---|
| P1 | **Same rules, different worlds** | No nation tag in core code (*now* 18 comparisons remain in `state`, `econ`, `build`, `modern`, `politics`); flavour lives in nation data |
| P2 | **Every big choice is a game** | One evaluator serves the player's adviser and the AI; the card shows options incl. waiting, payoffs by horizon, the rival's best reply, the pick, the runner-up and what would reverse it |
| P3 | **One ledger** | Goods, money and people are conserved: every unit has a source and a sink; a stress check fails on phantom income (*now* broken: level-0 factories keep earning, see STATUS) |
| P4 | **History as pressure, not script** | Conditions open windows; dates are only earliest windows; failure branches are live; outcomes land in historical bands on most seeds, not all |
| P5 | **Map first, phone first** | 360/390 px, 125% text, 44 px targets, map ≥ 640 px, controls ≤ 8%, one style element, no network calls |
| P6 | **Measured against history** | Each system has a calibration target from COW, Maddison or HYDE (MASTER_PLAN §T) checked by the seeds and stress tiers |
| P7 | **Deterministic and resumable** | One seeded `rng()`; a save loaded in a fresh engine continues exactly (*now* 4% of resume checks diverge) |

## 2. Engine architecture

### 2.1 The monthly pipeline (turn contract)

One month runs these phases in this order for every nation. Each phase reads only what earlier phases or last month closed; each commodity and account has exactly one writer.

| # | Phase | Reads | Writes |
|---|---|---|---|
| 1 | Orders | commands from player, AI and events (`execCommand`) validated against last month's closed state | reservations, project queue, research, reforms, treaties |
| 2 | Demography | pops, nutrition and health from last month, war losses, housing | births, deaths, ageing of the pop mix, promotion and demotion, assimilation, migration intents |
| 3 | Labour and production | pops by type and skill, land, mines, factories, methods, inputs on hand | output per province, employment, wages owed |
| 4 | Markets and freight | output, household and state demand, stocks, freight graph capacity, tariffs, treaties, blockades | deliveries, prices, freight receipts, shortages |
| 5 | Settlement | deliveries, wages, taxes, rents, dividends, interest | all money flows, posted once to accounts |
| 6 | Society and politics | needs met, wages, literacy, rights, grievances | consciousness, militancy, group influence, movements, bills, elections, unrest |
| 7 | Research | research points from literates, clergy, universities, industry | progress, discoveries, method adoption |
| 8 | Diplomacy | relations, influence, treaties, crises, infamy | offers, replies, spheres, alliances, crises, war declarations |
| 9 | War | theatres, stances, supply, fleets, mobilisation | battles, occupation, war score, exhaustion, peace offers |
| 10 | Events and programmes | world state | event cards (paused for humans), programme phases, journals |
| 11 | Close | everything | month totals, history records, autosave |

Newly built capacity works next month. Phases 2, 6 and 7 may run every second or third month for small pops (quarterly demography) if the phone budget needs it; the rule is identical for every nation.

### 2.2 Data model (one object per real thing)

| Object | Holds | Notes |
|---|---|---|
| Nation | laws, institutions, accounts, budget, tech, modernisation, relations, influence, treaties, programmes, flavour pack id | Flavour packs (§9.2) supply the differences |
| Province | owner, controller, terrain, climate, land and mines, buildings, factories, rail, port, fort, pops, cores, culture and religion mix, local market | Ids live in data tables, never in code |
| Pop | type (12), culture (88), **religion (new)**, size, literacy, skill, consciousness, militancy, cash, income, needs met, ideology mix, employment | Column-wise storage for saves (SV3) |
| Account | owner, balance, flows by reason | Treasury, investment pool, factory cash, pop cash, foreign accounts |
| Project | stable id, sponsor, payer, site, paid to date, materials, status, outcome | Exactly one terminal state |
| Treaty | parties, clauses, term, breaches | Executes through the same commands |
| War | sides, goals, theatres, score, exhaustion, start, end | Wars by kind: inter-state, colonial, civil |
| Programme / Journal | phases, support meters, momentum, deadline, outcome | Tanzimat, Meiji, unifications and every major historical process |
| Forecast | decision, options, payoffs, assumptions, reply | What the minister shows; bounded retention |

### 2.3 Rules every system obeys

- One command path (`execCommand(actor, command)`) for every order from player, AI, events and scripted actors; checks happen before the first mutation; stale or repeated orders are refused. *Now* proven by fuzzing: 407,016 random orders, no exception, no double spend, no refused order that changed state.
- One seeded random stream, never drawn by previews.
- No scratch value is read in a month in which it was not recomputed (P7): a value that must survive a month is saved; everything else is rebuilt before use.
- Province and nation ids come from data tables (`PL4`, `WD1`), so the map can grow without code changes.
- Performance: month ≤ 130 ms in a phone browser at 1936 (to be measured, PL8); Node ≤ 90 ms median on the CI runner as the proxy until then. *Now*: Node median 109 ms, p95 164 ms in the 1930s on the CI runner; worst single month 1.1 s.
- Saves: IndexedDB, versioned schema, compact and lossless; budget by time (save ≤ 300 ms of blocked screen, load ≤ 3 s) once SV1 lands. *Now*: 26% of 316 runs exceed the 1 MB localStorage budget (max 1.18 MB).

## 3. Demography (the hub)

People are the shared input of every other system, so the demography engine is the hub.

**Pop.** Type × culture × religion per province. Twelve types: aristocrats, capitalists, clergy, bureaucrats, officers, artisans, clerks, craftsmen (factory workers), labourers, farmers, soldiers, slaves. Religion is new (Sunni, Shia, Orthodox, Catholic, Protestant, Jewish, Hindu, Sikh, Buddhist, Shinto, Confucian/folk, animist), because the Tanzimat, the Eastern Question, India, the Balkans and Ireland turn on it.

**Flows each period (same equations everywhere):**

| Flow | Driven by | Calibrated to |
|---|---|---|
| Births | baseline fertility by stage of the demographic transition (falls with literacy, urbanisation, income) | Maddison population by region and decade (CA3) |
| Deaths | baseline mortality falling with health services, water, food security; famine, epidemic (cholera waves, 1918 influenza), war | Same; famine target 2–8 per century (FD5) |
| Promotion and demotion | income versus needs, literacy, jobs on offer, laws (slavery, guild rules) | Factory workers and clerks shares by 1900 |
| Assimilation and conversion | accepted cultures, state religion, schools, laws, consciousness | Regional table (SO3) |
| Internal migration | wage and need gaps, rail access, funded vacancies; counted once at both ends | Urban shares by 1900 |
| Emigration and settlement | push (hunger, land, persecution) and pull (destinations' wages, open land, laws); `EMIG_DEST` | Atlantic emigration totals by decade |
| Military service | conscription law, mobilisation, casualties | Army sizes (COW NMC) |

**What it feeds:** labour to production; recruits and reservists to the army (mobilisation takes workers from fields and factories); taxpayers and the tax base; voters and interest groups to politics; literates, clergy and academics to research; demand by need tier to markets; militancy to unrest.

**Dashboard:** population pyramid by type, literacy, urbanisation, migration balance, cultures and religions, causes of death; each tappable to provinces.

## 4. Economy

### 4.1 Production
- **Land and mines (RGO):** output from workers × capacity × terrain, climate and season; tech and irrigation raise yields; famine years from weather shocks, not dates.
- **Factories:** 16 recipes today over 31 goods; each recipe gains two to three **production methods** (e.g. hand loom / power loom / ring spinning) with different inputs, labour, skills and capital (EC1). Methods are adopted only when the tech, the skilled workers and the inputs exist.
- **Artisans** produce the same goods at low productivity and lose to factories where freight reaches them.
- **Ownership:** state, domestic capitalists, foreign capital (with dividends abroad), subjects' companies. Investment decisions use the evaluator with rival capacity and expected prices (EC2).

### 4.2 Markets and prices
- Province local market for staples (A3, every nation), national market for everything, world market by freight. Prices respond to supply, demand and stocks; stocks (silos, inventories) carry over and spoil.
- Needs by tier (life, everyday, luxury) per pop type; unmet life needs drive mortality, militancy and migration.
- *Now*: grain, iron, steel and machinery price indices 0.70–1.35; target 0.6–1.8.

### 4.3 Freight and trade
- **Freight graph** (B1/FD1): land adjacency, rail, roads, sea lanes, ports, straits, canals. Cost by route length, not border crossings (FD2); capacity per edge; controller and enemies can close edges; blockades remove sea capacity.
- **Canals and straits as world events:** Suez 1869 and Panama 1914 (conditions: the builder's funding, not dates), Kiel 1895, the Straits regime (Ottoman control, treaty clauses).
- **Trade policy:** tariff schedule per good group, free trade or protection laws, treaty ports, most-favoured-nation clauses, customs unions (Zollverein as the template, open to anyone).
- **Trade ledger:** exports, imports, re-exports, freight earnings, shipping tonnage, balance of trade and payments.

### 4.4 Finance
- **Accounts:** treasury, investment pool, debt; taxes (land, head, income, customs, excise, licence), spending (administration, education, health, army, navy, interest, subsidies, relief).
- **Debt:** bonds with maturities, coupon, domestic or foreign creditors; refinancing risk; default with creditor responses (rescheduling, control of customs revenue as with the Ottoman Public Debt Administration and Egypt's Caisse, gunboats). Target 2–6 defaults per century; Ottoman 1–3 of 8 seeds (*now* 0.6 per century and never Ottoman).
- **Money:** silver, bimetallic or gold standard (an adoption choice with trade and price effects), central bank (lender of last resort halves a panic), the financial panics already in the events (1837, 1857, 1873, 1893, 1907, 1929) spreading through creditors and trade partners.
- **Treasury discipline:** no actor spends money it does not have through construction or programmes (*now* GBR and China run negative for years in many seeds: GBR in 17 of 256 unfuzzed runs, about 182 months each, low −£954k).

### 4.5 Infrastructure and works
Projects (railways, ports, canals, schools, hospitals, barracks, arsenals, docks, telegraph, power) through one project ledger, the Works board and Build mode. Railways raise freight capacity, mobilisation speed and market reach; ports raise sea capacity and naval bases; telegraph lowers crisis and command delays.

## 5. Society and politics

- **Interest groups** derived from pops and institutions: landowners, industrialists, financiers, clergy, army officers, intelligentsia, petty bourgeoisie, industrial workers, peasants, minorities. Influence = wealth × organisation × legal access (franchise, press, unions).
- **Ideologies** (7: reactionary, conservative, liberal, socialist, anarcho-liberal, communist, fascist) shift with needs, literacy, events and repression.
- **Government** (6 types: absolute monarchy, constitutional monarchy, democracy, presidential, proletarian, fascist), cabinet, upper house.
- **Laws** (14 today: slavery, vote, electoral system, assembly, press, unions, parties, minimum wage, hours, safety, unemployment, pensions, health, schools) change only through **bills**: proposal, coalition, amendment, vote, implementation (PO2). A pivotal group decides; concessions buy votes.
- **Elections and franchise** by government type; turnout and repression.
- **Movements → unrest → rebellion → civil war → secession**, one general rule (PO5): militancy and organisation create movements; a weak state (lost war, high exhaustion, default, low army versus a patron, a great-power guarantee) can lose a region to its people. *Now* the only civil war is the scripted American one.
- **Services:** education, health, police, welfare coverage from funded buildings and staff; unmet services raise grievances before they change outcomes.
- **Stability and legitimacy** from needs met, rights, victories and prestige.

## 6. Research, modernisation and innovation

- **69 techs in 5 fields** (army 15, navy 11, commerce 13, culture 13, industry 17) get prerequisites and eras (RS1; *now* none have prerequisites).
- **Research points** (A5 formula): literates, clergy, universities, schools, industry, press freedom.
- **Diffusion:** a tech is cheaper when trade partners and neighbours have it; foreign experts and missions abroad (Iwakura template) buy speed with money and prestige.
- **Inventions** as discoveries inside a window (railway, telegraph, Bessemer, dynamo, internal combustion), so the first adopter varies.
- **Adoption is separate from discovery:** a method spreads only where skills, inputs and capital exist (SO1a).
- **Modernisation road** (A6) for unrecognised states: 9 reforms in Army, Economy and Administration tracks, paid from the same research pool; westernisation at 100% (or 80% plus 25% literacy). *Now* Japan westernises in 94% of runs, 81% in 1866–85; other states by 1914 average 5.5 (target 2–6).
- **Great works** and world fairs as prestige projects.

## 7. Military: forces, logistics and war

### 7.1 Force structure
- **Land arms** (UNITS): infantry, cavalry, artillery from 1836; engineers, machine guns, tanks and aircraft by tech. Infantry holds and takes ground, cavalry scouts, screens and pursues (declining after machine guns), artillery breaks forts and trenches and dominates the 1910s, engineers build works and cross rivers.
- **Naval classes:** frigates, ships of the line, transports (sail); ironclads, cruisers, steam transports, battleships (steam and steel). Coal and later oil as supply; coaling stations and naval bases as reach.
- **People:** soldiers from pops (conscription law sets the pool), officers from the officer class (quality), generals and admirals with traits (*now* `genMonth`); reservists mobilised from the workforce.
- **No individual army selection** (owner decision): armies exist in the engine, but the player commands **theatres**.

### 7.2 Theatres and stances
- Each war opens theatres by region (*now* W1–W3). The player assigns forces and a stance: attack, probe, hold, dig in, fall back, garrison (STANCES). Objectives come from the war goals.
- Combat is resolved by front: frontage, terrain, forts, entrenchment, supply, organisation, morale, arms mix and tech. Trench deadlock emerges from firepower techs plus the dig-in stance, not from a script.
- **Supply** is goods: ammunition, food, horses, fuel, coal, delivered by the freight graph (MI3). Railways mobilise faster; a shipping shortfall lowers readiness.
- **Attrition** by terrain, climate and season; disease in colonial theatres.

### 7.3 Navies
- Fleets get missions (*now* port, blockade, patrol, seek battle, landing): blockades cut the enemy's sea freight and add war score; patrol and escort protect lanes; landing projects an army; raiding hits trade.
- **Naval races:** spending on capital ships answered by rivals (the evaluator's repeated game), with arms-limitation treaties (Washington 1922 template) as clauses.

### 7.4 War lifecycle
1. **Cause:** a casus belli from claims, cores, insults, unequal treaties, spheres, crises; fabricating one costs time and infamy.
2. **Crisis** (diplomatic play): sides gather, backers commit, demands are made; most crises end without war (target: a third of congresses end peacefully).
3. **Declaration** with war goals (*now* conquer, puppet, humble, free a people, take a colony, contain an aggressor; *now* 83% of wars are "conquer" and colonial wars never occur).
4. **Mobilisation** takes workers from the economy and costs money each month.
5. **Theatre fighting**, occupation, blockades.
6. **War score and exhaustion** from objectives held, battles, occupation, blockade, casualties and cost; exhaustion forces talks (*now* the median war lasts 11 months but the longest 337).
7. **Peace:** the evaluator values settlement against continuation for both sides (MI4); the clause executor applies transfers, reparations, releases, subject status and disarmament once.
8. **Truce**, then memory: grudges, revanchism, trust.

**Kinds of war** (counted separately for calibration): inter-state (COW 49 per century; *now* 44 total with 3.5 in the 1830s against 0, and 2.8 in the 1910s against 10), colonial or extra-state (HI4, MI8), civil (PO5), successor-state wars after a collapse (MI6), the Great War (July crisis path, MI7).

## 8. Diplomacy and influence

- **Relations, opinion and trust:** opinion moves with deeds; trust falls when promises are broken and changes later willingness to commit.
- **Infamy** from conquest; at 25 neighbours band together (coalitions).
- **Influence** as a currency: spent to raise opinion, add to a sphere, win market access, investment rights or a port, or to back a client in a crisis. Great powers earn more (*now* `IND_K` 300).
- **Treaties as clause bundles** (DP1): transit, commercial access, most-favoured nation, investment rights, alliance, guarantee, non-aggression, arms limits, subject terms, cession, reparations. Negotiation: accept, counter, defer, refuse, with outside options and domestic vetoes (DP2).
- **Subjects:** protectorates, princely states, dominions, puppets and colonies with autonomy, tribute and local resistance (DP3). India's princely states and the Company's administration (*now* `regional.js`) become clause sets.
- **The Concert of Europe:** congresses (≥ 3 per century), coalitions against aggressors, great-power ranking (prestige, industry, military; *now* China ranks a great power in 49% of runs by 1900).
- **Blocs:** alliances form from shared rivals; the July crisis needs two blocs; the rivalry graph makes them, not a script.
- **The Scramble and spheres in Asia:** colonisation, protectorates, treaty ports, extraterritoriality, concessions; a Berlin-style conference partitions when great powers collide.

## 9. History: events, journals and national flavour

### 9.1 Events and journals
- **Four kinds:** anchors (long journals such as unifications, Meiji, Tanzimat, emancipation, the Scramble, the Great War); windows (one-off choices that open on conditions with an earliest date); dispatches (news, no choice); crises (diplomatic plays).
- **Format:** data, not code (HI1): actors by role ("whoever holds Constantinople", "the leading German state"), conditions on region tables, options with stated effects that are exactly the applied effects, history's choice marked, AI weight from the evaluator plus the pack's inclination, a chronicle line.
- **Events never bypass systems:** they issue commands, open journals, start crises, change modifiers or spawn movements. *Now* 104 events, 79 dispatches, 3 programmes.
- **Clean failure:** an event whose actors no longer exist does not fire; a journal whose state dies closes with a recorded outcome.

### 9.2 National flavour packs (data only)
A pack per nation (and templates per region) holds: starting laws and institutions; national modifiers (e.g. a strong navy tradition, an Ottoman millet system, a Prussian general staff); historical inclinations for the AI (risk, expansion, prestige, reform appetite); programmes and journals it can open; decisions (e.g. buy Alaska, abolish the Janissaries, Corn Law repeal) available to anyone who meets the conditions; start notes and a challenge; flag and emblem; names for units and ships. Core code reads packs; it never tests a tag.

### 9.3 Priority packs and their key dilemmas

| Nation | Journals and decisions | Key dilemma (game) |
|---|---|---|
| Britain | Corn Laws, Reform Acts, Company to Crown in India, naval supremacy, splendid isolation, Irish question | Free trade versus protection; two-power naval standard against rising rivals; concede Irish home rule or hold |
| France | Revolutions (1848, Commune), Second Empire, Algeria, Suez, Third Republic, revanche | Regime type and stability; colonies versus the Rhine |
| Prussia / Germany | Zollverein, army reform, three unification routes, Kulturkampf, Weltpolitik | Bargain or war with Austria; edit the Ems telegram; navy race with Britain |
| Austria | 1848, neo-absolutism, Ausgleich, Balkans, nationalities | Centralise or federalise; Germany or the Danube |
| Russia | Crimea, emancipation of serfs, Great Reforms, Central Asia, Trans-Siberian, 1905, revolution | Reform from above versus revolution from below |
| Ottoman Empire | Tanzimat (live), debt trap, constitution, Young Turks, millets, Straits | Reform speed versus clergy and notables; borrow or default |
| USA | Manifest Destiny, Texas, Mexico, slavery and civil war, Reconstruction, Gilded Age, Pacific | Compromise or confrontation over slavery; isolation or empire |
| Japan | Forced opening, shogunate or domains, Meiji (C2), samurai revolt, treaty revision | Accept or resist the ultimatum; pace of stipend conversion |
| China | Opium crisis, Taiping, Self-Strengthening, Boxers, Xinhai | Concede to foreigners to fight rebels, or the reverse |
| Sikh Empire (Punjab) | Ranjit Singh's army, succession crisis, Anglo-Sikh wars, Lahore and Multan administration, canal colonies | Pay the Khalsa or cut it; ally with or resist the Company |
| Italian states | Italian unification (C3b): 1848, Cavour, Plombières, Garibaldi, Venetia, Rome | Back, disown or stop the expedition; France's price |
| Egypt | Muhammad Ali, Suez, debt and occupation | Modernise on credit or stay small |
| Persia, Siam, Ethiopia | Buffer-state survival, concessions, modernisation, Adwa | Play the powers against each other |
| Mexico, Brazil, Argentina | Caudillos, reform wars, foreign intervention, abolition, immigration, beef and coffee booms | Export-led growth versus foreign debt |

Templates cover the rest: German and Italian minors, Balkan nations (awakening and patrons), Latin American republics, African kingdoms (resistance and modernisation), Indian princely states, Central Asian khanates, South-East Asian kingdoms.

## 10. AI and game theory

**One evaluator** (AI1) for every decision, player adviser and AI alike:
1. List legal actions including waiting; score cheap candidates with today's heuristics.
2. For the shortlist, estimate the change from waiting over a stated horizon in natural units (money, welfare, legitimacy, autonomy, prestige), translated into utility by the actor's weights (pack inclination plus situation).
3. For moves that invite a reply, compute the counterparty's best response from its own information and outside options; for bargains, expected utility over accept, counter, defer and refuse.
4. Report pick, runner-up, the decisive assumption, the horizon and the condition that would reverse the choice.
5. Bound candidates and replies deterministically; cache per decision state; invalidate on material changes.

**Games the evaluator plays** (shown to the player as small payoff tables):

| Domain | Game | Example |
|---|---|---|
| War and crisis | Sequential game with coalition reply; chicken in crises | Attack the weak neighbour if the guarantor's best reply is to stay out |
| Bargaining | Alternating offers with outside options and vetoes | The transit fixture in the archived engine plan (E2) |
| Alliances | Commitment and signalling | Guarantee a buffer state to deter, at the risk of being dragged in |
| Arms races | Repeated prisoner's dilemma with a treaty option | Anglo-German naval race; Washington-style limits |
| Trade | Tariff war versus free-trade treaty | Retaliate or open |
| Scramble | First-mover race with a congress exit | Claim now or wait for partition |
| Unification | Coordination and hold-out game | Small states join when integration and security pay |
| Reform | Veto players | A concession buys the pivotal group |
| Debt | Creditor-debtor commitment | Default and lose customs to creditors, or squeeze the budget |

Calibration: forecast error at 3 and 12 months, Brier score by probability band, compared with "always wait" and the old heuristics on held-out seeds.

## 11. Interface and dashboard

- **Map first:** lenses (political, diplomatic, population, unrest, industry, railways, terrain, build, trade and prices, supply, culture and religion, naval, fronts, historical), the province sheet at three heights, theatre and fleet tokens, Build mode and the Works board (one basket).
- **Comprehensive dashboard** (UI1a/b): national scorecard (GDP, population, literacy, army, navy, treasury, debt, stability, prestige, rank) with trends, each number drilling down to provinces and causes; ledger; trade ledger; demography page.
- **Decision sheet** (UI3) with the evaluator's table on every major card.
- **History ledger (new):** the player's results against what really happened (population, GDP per head, literacy, territory, wars won, defaults avoided), so "better results by choosing better" is measured.
- **Chronicle:** a timeline of the campaign's events, wars and reforms.
- Look: the Devlet-i Âliyye standard (parchment, red-and-gold band, small-caps headings, framed tiles, round flag, red End month pill), engraved-atlas map art, original art only.
- *Now*: no page errors on any of 62 nations over a year of play, but seven pages fail the layout audit (Research, Military, Politics, Nation, Works when opened as a page, World, Overview: 8,396 violations, mostly sub-44 px controls and clipped labels).

## 12. How the systems connect (integration matrix)

Row produces what the column consumes.

| From → To | Demography | Economy | Trade | Finance | Politics | Research | Military | Diplomacy |
|---|---|---|---|---|---|---|---|---|
| **Demography** | – | workers, skills, demand | – | taxpayers | voters, groups, militancy | literates, clergy | recruits, reservists | – |
| **Economy** | food, wages, jobs | – | goods to move | taxes, dividends | group wealth | industry research | arms, ammo, ships | – |
| **Trade** | prices of staples | inputs, markets | – | customs, freight earnings | merchant interests | diffusion | supply lines | dependence, leverage |
| **Finance** | relief, services | investment, subsidies | – | – | budget fights | university funding | army and navy budgets | loans as leverage |
| **Politics** | laws on migration, slavery, schooling | economic laws | trade policy | taxes, spending | – | press freedom | conscription | war support, treaties ratified |
| **Research** | health, schooling | methods, yields | rail, steam, canals | – | ideas | – | weapons, doctrine | prestige |
| **Military** | casualties, mobilisation | war demand, labour lost | blockades | war costs | war support, exhaustion | – | – | war score, deterrence |
| **Diplomacy** | – | investment rights | treaties, tariffs, transit | loans, reparations | prestige | missions abroad | alliances, subjects | – |
| **Events** | famines, epidemics | shocks, panics | canals | panics, defaults | revolutions, reforms | inventions | crises | congresses |

**Worked chains (each must work end to end in a fixture):**
1. *Harvest failure* → grain stocks fall → local prices rise → poor households cut needs → mortality and militancy rise → relief or imports through the freight graph → budget and debt.
2. *Railway* → freight cost falls → artisans lose to factories → workers migrate to towns → literacy and socialism rise → a hours-and-unions bill.
3. *Naval race* → steel and ships demand → budget deficit → borrowing → a crisis in which the rival's best reply changes.
4. *Lost war* → exhaustion, default risk, a weak state → the minority movement can secede → a successor state appears with its own pack.
5. *Unequal treaty* → treaty port and tariff cap → imports undercut artisans → reform programme pressure (Meiji, Self-Strengthening).

## 13. Scenarios and campaign

- **Grand campaign** 1836–1936, any nation.
- **Punjab grain** (alpha tutorial): one crisis, four choices, the full chain 1.
- **Sikh Empire 1839** (succession crisis).
- **Later bookmarks** (1861, 1871, 1914) once calibrated runs can seed them: each bookmark is a stored state from a seed whose outcomes sit in historical bands, re-checked by the seeds tier.

## 14. Recommendations beyond the brief

1. **Stability before content:** the stress tier now runs weekly; a red stress run blocks feature merges.
2. **The history ledger** (§11) turns the owner's purpose into a score.
3. **Owner plays now:** GitHub Pages serves every merged build; the owner's phone sessions are the first playtest, before the five-tester alpha.
4. **Bookmarks** after calibration (§13).
5. **Data-first modding:** packs, events, region tables and province tables as plain data, so new content is a data PR.
6. **Observer mode** (watch the AI play) for calibration and fun.
7. **Accessibility:** 125% text and contrast in CI (UI10), a list view for the map.
8. **PWA install** and offline play (RL2) before any store build.
