# The Long Century: Wow Factor Plan (ledger B62)

Owner ask, 28 Nov 2026: flesh out the wow factor under the creative, music, history and graphics directors, learning from competitor games. Tickets #187 to #196. None of this changes the rules of play; the seed-7 state hash stays dda070bb.

## 1. The big idea

"A living atlas of the 19th century that ages in your hand." The map starts as an engraved 1836 atlas and turns, era by era, into a colour lithograph, a Belle Époque chromolithograph and a 1930s modernist chart. Railways crawl across it, armies march, smoke rises over factories, and the music grows from a string quartet to a brass band to a dance band.

Every wow decision is tested against three feelings:
1. **Wonder:** the world visibly changes because of you; something new appears on the map every month.
2. **Authorship:** your century against the real one; the game shows where you beat, followed or broke history.
3. **Closeness:** people and places, not spreadsheets; leaders age, ministers argue, a province has a name, a picture and a story.

Gate: the M2 vertical slice. Five outside testers rate fun 7/10 or better, and at least three screenshot something unprompted.

## 2. What competitors teach

| Game | What wows | What critics missed | What we take |
|---|---|---|---|
| Victoria 3 (same era) | Two-layer map: model railway near, lettered paper map far; cities and railways spread | Music stays in the background; deals lack character | The two-layer map and visible growth, plus character and music |
| Europa Universalis V | Detailed map, strong orchestral score | Hard for newcomers | Depth, behind a gentle first five minutes |
| Civilization VII | Ages change the look of the world | Ages feel rigid when they reset progress | Eras as a visual and musical event, no reset |
| Old World | Hand-written event chains; portraits that age; strong score | Flavour text jars against bare numbers | Events and people that age; every number shown with its story |
| The Battle of Polytopia (mobile) | One readable art style, tight loop, fair monetisation | Shallow for grand-strategy fans | One strong style that reads on a small screen |
| Age of History 3, Dummynation (mobile) | The map changes within seconds | Plain looks, little story | Something visible happens in the first minute |

Gap in the market: no mobile game combines Victoria-level depth with a map that ages, music that follows the world, and characters that make history personal.

## 3. Signature moments (WOW2 #188)

Each under 10 seconds, skippable, at most once per occasion, with a Settings switch to turn scenes off.

1. First railway: a small engine runs the new line, a whistle, next morning's paper.
2. A new era dawns (1848, 1871, 1890, 1914): slow wipe to the new map style, the music changes band, a title card.
3. War declared: telegram card, drums, the sky darkens over the border, armies leave barracks.
4. Battle: tokens clash with smoke, a bugle, casualty counter, the front moves.
5. A nation is born: flags merge, a period anthem, the new colour spreads like ink.
6. Famine or flood: the province greys, rain or dust falls, music drops to one instrument.
7. A great work opens (Suez, Eiffel Tower, Grand Trunk Road): the landmark rises; first ship through.
8. The newspaper: a monthly front page about you (NEWS1 #119).
9. History against you: real borders appear as a ghost over yours, with real year against game year.
10. Your Long Century: the 1936 scrolling chronicle and a shareable image card.

Always on, cheap: seasons (snow, monsoon) and night shading at high speed.

## 4. Graphics director: the living atlas (WOW1 #187, WOW6 #192, WOW10 #196)

| Era | Years | Map style | Interface | Event pictures |
|---|---|---|---|---|
| Age of Revolutions | 1836–1848 | Copper-plate engraving, cream paper, hand-tinted borders | Brass, leather, ink | Steel engravings |
| Age of Steam | 1848–1871 | Hand-coloured lithograph, hatched railways | Brass, green baize | Tinted lithographs |
| Age of Empire | 1871–1914 | Chromolithograph, bold colours, cartouches | Gilt, glass | Colour posters |
| Age of Crisis | 1914–1936 | Modernist chart, flat colour, sans-serif | Art deco chrome | Photogravure, poster style |

- Far zoom: paper atlas, nation colours, period lettering, fronts as burning lines.
- Near zoom: 2.5D diorama; cities grow in five sizes; moving trains, ships, factory smoke, seasonal fields.
- Tokens: painted figures uniformed by nation and era. Buildings appear as landmarks where built.
- Portraits: one painterly style, aged every decade; ruler, chief minister, finance minister, general, admiral.
- About 40 event illustrations for 1.0.
- Budget: 60 fps panning on the Galaxy A56, never under 30; at most 80 MB of art in the first download; every effect has a low setting, default on phones with under 6 GB of memory.

## 5. Music director: a score that follows the world (WOW3 #189, WOW4 #190)

Every track has three layers (melody, harmony, rhythm), mixed live by:
- **Era:** chamber strings and piano (1836), romantic orchestra (1848), brass band and marches (1871), ragtime and dance band (1914).
- **Region on screen:** sarangi, harmonium and dhol (Punjab, India); ney and kanun (Ottoman lands); banjo and fiddle (American frontier); erhu and koto (East Asia).
- **Mood:** peace soft; tension one instrument and a pulse; war drums and brass; crisis a cello; triumph the full nation theme.
- **Stingers** of 3 to 8 seconds on moments.

Sources, licence-free only:
- Public-domain compositions, newly arranged (Chopin, Schubert, Mendelssohn, Verdi, Johann Strauss II, Brahms, Dvořák, Tchaikovsky, Mussorgsky, Sullivan, Foster, Sousa, Joplin, Satie).
- Traditional melodies with no known author. No sacred music as background.
- Old recordings are usually still under copyright, so we render our own in MuseScore with its MIT sound set, or AI music with the prompt logged. Outside recordings only if CC0 or public domain.
- Period sound effects (telegraph, coins, whistles, bugles, cannon, crowds, bells, rain) from CC0 sources, each logged.

1.0 budget: 12 tracks (4 eras x 3 moods), 5 nation themes, about 10 stingers, Opus, about 25 MB.

## 6. History director: your century against the real one (WOW5 #191, WOW9 #195)

- **Ghost map:** a toggle shows real history's borders for the current year over yours (1836, 1848, 1861, 1871, 1890, 1914, 1920, 1936).
- **Century ledger:** each great milestone with the real year and your game year.
- **Newspaper verdicts:** "Historians will note that the Sikh Empire outlived Ranjit Singh by half a century."
- **People who age:** real people while history allows (Ranjit Singh, Bismarck, Lincoln, Gladstone, Mahmud II, Reşid Pasha), invented successors otherwise. Cosmetic in 1.0; traits that change play wait for 1.1.
- **Events:** about 60 new events for the five hero nations in 1.0, each with a picture, 2 to 4 choices, what history chose, and its consequence in one sentence next to the numbers. Same rules for every nation.
- **Almanac:** about 400 province entries and 100 people and event entries, each with a public-domain picture and one source; loading screens draw from it.
- **Hard history** (slavery, famine, conquest, massacres) is shown plainly and seriously, never as a joke, reward or decoration, with sources.

## 7. Feel and polish (WOW7 #193, WOW8 #194)

First five minutes:
1. 0:00 engraved 1836 map on a desk, a quill writes the title, strings start.
2. 0:20 pick a nation: flag, ruler portrait, one-line pitch, four bars of its theme.
3. 0:45 zoom to the capital; engraving turns to colour diorama under your finger.
4. 1:00 the chief minister's first choice, with the rival's likely reply shown.
5. 1:30 End Day at speed 3: money ticks, a caravan moves, the first building rises.
6. 3:00 the first event with a picture and a historical note.
7. 5:00 the first newspaper, your name in the headline.

Touch: haptic ticks (End Day, war, building done) with an off switch; numbers roll; new map items grow in over 300 ms; nothing blocks input over 500 ms; End Day and speed within thumb reach. Rewards: nation milestones and a century score against history; no ads during decisions.

## 8. Delivery

| Ticket | What | Builder | Milestone | Depends on |
|---|---|---|---|---|
| #193 WOW7 | First five minutes | Codex, script by AI Studio | M2 | #187, #192 |
| #187 WOW1 | Map ages by era, two zoom levels | Codex | M2 | art #158, PixiJS map |
| #188 WOW2 | Signature moments framework | Codex | M2 | #187, #189 |
| #189 WOW3 | Adaptive music engine | Codex | M2 | — |
| #190 WOW4 | Score and sound set | AI Studio | M2 | music lead #157 |
| #192 WOW6 | Portraits and people | AI Studio | M2 | art lead #158 |
| #194 WOW8 | Touch, motion, haptics | Codex | M2 | — |
| #191 WOW5 | History against you | Codex | M3 | history lead #159, #171–#173 |
| #195 WOW9 | The Almanac | AI Studio | M3 | province list #181 |
| #196 WOW10 | Seasons, weather, chronicle | Codex | M3 | daily clock, #187 |

Related tickets: #119 newspaper, #120 eras, #130 art, #131 music, #139 achievements.

Budgets on every ticket: 60 fps map (30 at lowest setting), 130 ms per month at 1936, at most 80 MB art and 25 MB music in 1.0, a low setting that turns off scenes, weather and the near-zoom diorama. Licences: public domain, CC0 or MIT, or AI-made with the prompt in docs/ASSETS.md. CC-BY is not allowed.

Biggest risk: WOW1 depends on the PixiJS map passing the phone test. Fallback: tint the SVG map and swap textures by era; drop the near zoom until 1.1.
