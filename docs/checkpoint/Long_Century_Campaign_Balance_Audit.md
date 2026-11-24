# Long Century campaign balance audit

Wider Rollout HTML SHA-256 `9294c15033e3ff4f6dccf26346f5cc3f5136bdba04d1425785c2650faecc018e`. Eight all-AI seeds ran from 1836 to 1936. Two additional runs used scripted player turns. The game build was observed without changing its balance rules.

| Measure | Plan target | Observed | Seeds meeting target |
|---|---|---:|---:|
| Wars started | 30–45 | 45–59 | 1/8 |
| Average ended war duration | 12–24 months | 17.2–25.5 | 7/8 |
| Distinct countries eliminated | 8–15 | 14–19 | 2/8 |
| Debt defaults | 2–6 | 0–2 | 1/8 |
| Congresses | 5–10 | 1–6 | 1/8 |
| Peaceful congresses | At least one-third | 9/21 pooled | 5/8 |
| Coalitions formed | 3–8 | 1–5 | 1/8 |
| Required Great Powers in 1900 | All seeds | 8/8 | 8/8 |
| Germany and Italy formed | At least seven seeds | 8/8 | 8/8 |
| Union victory proxy | At least seven seeds | 8/8 | 8/8 |
| All nine 1900 factory targets | At least six seeds | 0/8 | 0/8 |
| All commodity ratios within band over century | 0.60–1.80 | 26–29 goods breached per seed | 0/8 |

## Seed results

| Seed | Wars | Mean ended war duration | Eliminated | Defaults | Congresses | Peaceful | Coalitions |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 7 | 53 | 17.6 | 17 | 0 | 6 | 2 | 1 |
| 3 | 56 | 22.6 | 16 | 0 | 1 | 0 | 2 |
| 11 | 46 | 17.2 | 19 | 2 | 1 | 1 | 2 |
| 21 | 45 | 23.0 | 14 | 0 | 3 | 2 | 2 |
| 5 | 48 | 21.8 | 15 | 0 | 1 | 0 | 1 |
| 13 | 57 | 25.5 | 16 | 0 | 4 | 1 | 2 |
| 17 | 55 | 20.3 | 16 | 0 | 1 | 1 | 5 |
| 29 | 59 | 22.3 | 16 | 0 | 4 | 2 | 1 |

## Industry and prices

| Nation | 1900 factory target | Observed levels | Seeds within target |
|---|---:|---:|---:|
| GBR | 150–250 | 144.5–168.5 | 6/8 |
| USA | 180–260 | 207.5–226.5 | 8/8 |
| GER/PRU | 110–200 | 107–176.5 | 7/8 |
| FRA | 100–180 | 84–104.5 | 1/8 |
| RUS | 40–90 | 43–48 | 8/8 |
| AUS | 40–80 | 33.5–75 | 6/8 |
| ITA/SAR | 25–50 | 23.5–48.5 | 7/8 |
| JAP | 15–40 | 11–32 | 7/8 |
| CHI | Below 15 | 3–14 | 8/8 |

0/8 runs had a country below six million people above 60 factory levels.

The plan’s E2 check uses six goods at the 1860, 1880 and 1900 checkpoints on seeds 7 and 3. An asterisk marks values outside the band.

| Seed and year | Iron | Coal | Steel | Machinery | Grain | Clothes |
|---|---:|---:|---:|---:|---:|---:|
| 7 · 1860 | 0.72 | 0.84 | 0.94 | 0.67 | 0.97 | 0.68 |
| 7 · 1880 | 0.75 | 0.73 | 1.23 | 0.93 | 0.92 | 0.78 |
| 7 · 1900 | 0.79 | 0.70 | 1.01 | 0.70 | 0.75 | 0.60✱ |
| 3 · 1860 | 0.83 | 0.85 | 0.95 | 0.68 | 0.95 | 0.77 |
| 3 · 1880 | 0.74 | 0.74 | 1.16 | 0.83 | 0.89 | 0.81 |
| 3 · 1900 | 0.87 | 0.83 | 1.17 | 0.81 | 0.76 | 0.59✱ |

| Good | Months out of band across eight seeds | Lowest ratio | Highest ratio |
|---|---:|---:|---:|
| wool | 9,544/9,600 | 0.20 | 0.78 |
| rubber | 9,544/9,600 | 0.20 | 0.78 |
| canned | 8,590/9,600 | 1.00 | 5.00 |
| cement | 6,591/9,600 | 0.50 | 1.16 |
| fuel | 5,403/9,600 | 0.48 | 5.00 |
| electric | 5,358/9,600 | 1.00 | 5.00 |
| fish | 5,325/9,600 | 0.39 | 0.96 |
| tobacco | 5,167/9,600 | 0.34 | 1.03 |

## Scripted player paths

| Country | Months reached | Survived | Decisions resolved | Annual reports |
|---|---:|---|---:|---:|
| GBR | 1200 | Yes | 14 | 100 |
| PUN | 1200 | Yes | 2 | 100 |

Both player paths used seed 7, the recommended card option when available and otherwise the first option. This covers the player turn path under one policy per country. Device input and the effect of discretionary orders are outside that sample.

War counts include opening wars. Missing end dates are filled from observed removal when possible, and unfinished wars are excluded from the duration mean. Eliminations count distinct countries that lost statehood, even if restored. The Union proxy checks the Confederacy’s final absence and emancipation. The core Great Power check includes Britain, the US, France, Prussia or Germany, and Russia. Results diagnose balance gaps in the current build. No balance settings were tuned during these runs.
