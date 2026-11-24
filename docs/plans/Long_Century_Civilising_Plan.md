# The Long Century: Civilising Programmes (Tanzimat, Meiji, German and Italian Unification)

Status: plan, not started. Builds on engine plan A5 (research balance) and A6 (modernisation road, `c.modern`), and on the existing unification gates (G2.2: `UNIFY`, `unifyOpen`, events germany1–3, italy1–3).
Rules that stay: same rules for every nation (player and AI), no forced outcomes by date, game theory visible on each major decision, plain English, phone-first, no network calls.

## 1. The idea: one engine for "national programmes"

Today these three are one-off events or flat decisions (`DEC.tanzimat`, `DEC.meiji`, germany1–3). We replace them with one shared **programme** system. A programme is a multi-year chain of phases. Each phase is a decision card with costs, winners, losers, rivals' replies, and a failure branch.

- **State:** `c.prog[id] = {phase, start, momentum 0–100, support{group:0–100}, flags, done}`. Save defaults on load, MODEL_REV bump.
- **Phases open by conditions, not dates.** A date only sets the earliest window, as with unification today.
- **Each phase** names: money / research-point / political-capital cost, who gains, who resists, what the strongest rival does, and the failure branch. The AI uses the same evaluator (`warEV`-style payoff) with a historical inclination in nation data.
- **Failure is real:** a programme can stall, split the country, or be taken over by foreigners. No scripted success.
- **Links:** programmes feed A6 `c.modern` (reforms) and the unification gates; they do not duplicate them.

## 2. Tanzimat (Ottoman Empire; the template for Egypt and Persia)

**Historical shape:** reform from above under pressure from Russia, Britain and France, balancing Muslim notables and clergy against non-Muslim communities, funded by foreign loans that became a trap.

**Groups tracked:** ulema (clergy), ayan (provincial notables), army and bureaucracy, each non-Muslim community (Greek, Armenian, Bulgarian and others present in the data), and Great Power patrons.

**Phases (each opens on conditions):**
1. **Gülhane Edict (1839 earliest):** legal equality, fixed taxes. Winners: bureaucrats, communities. Losers: tax-farmers and ayan. Gain: administration +, minority militancy −.
2. **New army and conscription:** after the Janissary break (1826 is the setup). Cost: money, ayan anger over local levies. Links to A6 Army track.
3. **Provincial reform (Vilayet law):** salaried collectors replace tax-farming. Revenue dips for 2–3 years, then rises. Fork: *centralise now* or *deal with the notables first*.
4. **Reform Edict (1856 earliest, pressured by the Crimean settlement):** equality of non-Muslims. Gain: Great Power goodwill, the patron's reduced pretext for intervention. Cost: ulema militancy.
5. **Loans and the Bank:** a real choice. Borrowing speeds reforms but each loan adds debt service. A default (credit crisis plus unpaid interest) lets creditors take a share of customs income (the Debt Administration route). This is the trap, shown on the card.
6. **Constitution (1876 earliest):** fork. *Parliament* (stability gain, long-run legitimacy, risk of a nationalist split) or *autocratic reform* (control, but the minorities' and liberals' militancy persists).

**Secession of a community (owner decision: only when the empire is weak).** A community with a home region may break away as a new nation only if its militancy is high **and** the empire is weak. Weak means at least two of:
- lost a war or signed a peace with land loss in the last 5 years;
- war exhaustion above 50, or stability in the bottom band;
- defaulted on debt (phase 5);
- army strength below half that of the community's Great Power patron;
- a Great Power has guaranteed the community (Russia for Balkan Orthodox, Britain or France by event).

A strong empire faces revolts it can put down; a weak one can lose Greece-, Serbia- or Bulgaria-style states. The same rule applies to every multi-national state (Austria, Russia, China, Persia). Reforms that lower minority militancy are the defence, so the Tanzimat has a reason to exist. C0 recon checks whether the engine can create a released nation; if not, C1 adds it.

**Game theory on the cards:** reforming fast vs slow vs not at all, over 5 years: revenue, army, revolt odds, and the likely reaction of Russia, Britain and France (reform lowers Russia's pretext, borrowing raises British leverage). The minister's pick and the key assumption are shown.

**Reused for Egypt and Persia:** the same phases with different group sizes and starting values (Egypt starts with Army 1 and Economy 1 per A6).

## 3. Meiji Restoration (Japan; the template for forced opening)

**Historical shape:** forced opening, a split between shogunate and western domains, a civil war, then a state-led rebuild paid for by ending the samurai stipends.

**Groups tracked (support meters 0–100, owner decision):** shogunate, western-domain faction (Satsuma/Chōshū-style), samurai class, merchants, peasants, the throne. The domains are not separate states; the civil war in phase 2 is fought by the side whose meters and army share win the split.

**Phases:**
0. **Forced opening (trigger for any closed uncivilised state facing a naval ultimatum, not only Japan):** accept (unequal treaties, trade income, unrest) or resist (risk of a bombardment and worse terms).
1. **Factions:** back the shogunate's own reforms, or ally with the reform domains. Each has different odds of a civil war.
2. **Restoration (1868 earliest):** the existing civil-war and uprising path runs the war by theatre. Outcome by strength, not script: the shogunate can win and modernise slower, or the domains win.
3. **Centralisation:** abolish domains. Samurai stipends are a very large budget item; converting them costs money and can trigger a samurai revolt (Satsuma-style) 4–6 years later.
4. **Conscription, schools, state pilot factories:** A6 Army, Administration and Economy reforms at a discount while the programme is live.
5. **Mission abroad (Iwakura-style):** spend rp and prestige for one-off tech gains and a chance to revise unequal treaties; leaving the capital leaves politics exposed. Real trade-off.
6. **Constitution and treaty revision:** equality status (A6 westernisation) when modernisation is high enough and the treaties are revised.

**Game theory:** accept vs resist, faction choice, stipend conversion pace, mission timing: each with 5-year payoffs and the neighbouring Great Power's likely reply.

## 4. German unification (Prussia, and any other leader)

The gates already exist (`UNIFY.GER`, `unifyOpen`, germany1–3, Zollverein). We deepen them into a three-route programme, so Prussia is one possible leader, not a script.

**New tracked values:**
- **Integration index (0–100)** per German state: Zollverein membership, rail links across borders (uses the freight graph in B1), shared market share, language and press nationalism.
- **Leadership bid:** Prussia, Austria, or a coalition. Same rules for any state that meets the conditions.

**Routes:**
1. **Liberal route (1848-style):** a parliament offers the crown. The ruler accepts (nationalist surge, but risk of Austrian and Russian intervention) or refuses (the movement fades and unrest rises).
2. **Kleindeutsch (Prussian-led, without Austria):** phases: army reform (Roon/Moltke-style, tied to A6 Army), Schleswig war with Denmark, rivalry with Austria (war or bargain), a North German union, then the southern states through a war with France (the Ems provocation stays as a player choice: edit the telegram or not).
3. **Grossdeutsch (Austria-led, including Austria):** possible only if Austria is strong and holds its German lands; the Habsburg multi-national problem raises the cost.
4. **No union:** the states stay split. This must remain a live outcome.

**Game theory:** per phase, the leader's payoff for war vs bargain, Austria's / France's / Russia's best replies, and the states' "join or hold out" choice using integration and security. Shown as a small payoff table.

**Targets:** Germany forms 1866–1885 in at least 6 of 8 seeds (today's rate), with the route mix not all Prussian: Kleindeutsch 55–70%, Grossdeutsch 5–15%, no union 15–30%.

## 4b. Italian unification (historical, with the same route system)

The gates exist (`UNIFY.ITA`, `unifyOpen`, italy1–3, leader SAR). We deepen them on the same programme engine as Germany, so Sardinia-Piedmont is the likely leader but not a scripted one.

**Tracked values:**
- **Integration index** per Italian state (customs ties, rail links, press nationalism, secret societies).
- **Support meters:** Piedmontese moderates (Cavour-style), democrats and republicans (Mazzini/Garibaldi-style), Catholic opinion, the Pope, the Bourbon court of the Two Sicilies.
- **Patron:** France's goodwill toward Sardinia. Austria's grip on Lombardy-Venetia and the duchies.

**Phases (conditions open them; dates are only earliest windows):**
1. **1848 rising (earliest 1848):** revolts in Milan, Venice and Rome; Sardinia may declare war on Austria. Alone, Sardinia usually loses (as in 1848–49), but losing raises nationalism and Sardinia's standing as leader. Choice: *fight now* or *wait*. A Roman Republic may form and invite French intervention.
2. **Statecraft (Cavour-style, after 1850):** rail, finance and army reform in Sardinia (uses A6 and Build); optional entry into a Great Power war (Crimea-style) to gain a seat at the peace table and French goodwill.
3. **The French bargain (Plombières-style, earliest 1858):** France helps against Austria in return for Nice and Savoy. Accept: strong chance to take Lombardy, but land lost to France. Refuse: fight alone. France may stop early (Villafranca-style) and leave Venetia with Austria.
4. **Central Italy (after a win over Austria):** the duchies and the Romagna vote to join. Austria and the Pope protest; France's reply depends on its goodwill and Catholic opinion.
5. **The southern expedition (Garibaldi-style, earliest 1860):** a volunteer force sails for Sicily. This is the key game-theory card for the leader: *quietly back it*, *disown it*, or *stop it*. Backing it can take the Two Sicilies cheaply, but the democrats may set up a rival republic in the south unless the leader marches south to meet them and hold plebiscites.
6. **Proclamation (Kingdom of Italy):** when the leader holds enough of `UNIFY.ITA.need`. Rome and Venetia may still be outside.
7. **Venetia (earliest 1866):** ally with whoever fights Austria next (Prussia historically). Italy may lose battles and still gain Venetia at the peace if its ally wins. Links to the German programme.
8. **Rome (earliest 1867):** the Pope is protected by a French garrison. Marching on Rome while France stands guard risks war with France and a Catholic backlash (Mentana-style). The garrison leaves when France is at war or weak; then Rome can be taken with little cost, and the Pope's anger stays as clergy militancy.

**Routes (all live outcomes):**
- **Piedmontese monarchy** (historical): the phases above.
- **Democratic-republican** (Mazzini/Garibaldi): a popular rising wins without the monarchy; strong nationalism, high risk of foreign intervention.
- **Federation under the Pope** (neo-Guelph 1848 idea): a loose league; fewer wars, weaker state, Austria keeps influence.
- **No union:** Austria and France keep Italy divided.

**Game theory shown on the cards:** France's price against its help, Austria's fight-or-concede choice, the expedition back/disown/stop table, and the Rome question (wait for the garrison to leave vs strike now), each with 5-year payoffs and the minister's pick.

**Targets:**
- Italy forms 1859–1875 on at least 6 of 8 seeds.
- Route mix: Piedmontese 60–75%, democratic 5–15%, federation 5–10%, no union 10–25%.
- Rome joins by 1880 on at least half of the seeds where Italy forms.
- Nice and Savoy go to France on about half of the forming seeds (only when the bargain is taken).

## 5. Order of work (small tickets, one per agent)

| Ticket | Scope | Depends on |
|---|---|---|
| C0 | Programme engine: state, phases, conditions, AI evaluator hook, save defaults, `test_programmes.js`. Recon first: how minorities and civil wars work today. | A5, A6 |
| C1 | Tanzimat on C0 (including the debt trap) and Egypt/Persia variants | C0 |
| C2 | Meiji on C0 (including forced opening and the samurai revolt) | C0 |
| C3 | German unification routes: integration index, liberal route, Austrian route; keep the existing gates working | C0, B1 for rail links |
| C3b | Italian unification on C0: phases 1–8, the expedition and Rome cards, the four routes; keep italy1–3 gates working | C0, C3 |
| C4 | UI: Programmes panel on the Government page (phase list, payoff table, winners/losers); integration lens on the map | C1–C3, V orders |
| C5 | Validation across 8 seeds: Japan, Ottoman, Egypt, Germany and Italy targets, no seat dependence, save/resume | all |

Each ticket: short brief, acceptance checks written up front, Sonnet implementation, Haiku for test runs.

**Acceptance targets (C5):**
- Japan westernises 1866–1885 on at least 6 of 8 seeds.
- The Ottoman Empire reaches the 1856 reform phase on at least 6 of 8 seeds, and defaults on debt on 1–3 of 8.
- Germany and Italy targets above; wars per century do not rise.
- Seat-independence test green; month time inside the engine budget (+15 ms per ticket).

## 6. Owner decisions (23 Nov 2026)

1. Japan's domains are **support meters**, not separate states.
2. Ottoman (and other) communities **may secede, but only when the empire is weak** (rule in section 2).
3. **Italian unification** follows the historical phases on the same route system (section 4b).
