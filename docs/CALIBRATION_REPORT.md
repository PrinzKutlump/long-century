# Calibration report: game vs Correlates of War, 1836-1936

Made by `python3 tools/calibrate_cow.py` (seeds 7, 3, 11, AI-only worlds, `tools/cal_harness.js`). Engine untouched.

## Method and caveats
- Game runs replay `century.js`'s loop with no player (`newGame(null, seed)`, `monthTick`). `century.js --quiet` records (`/tmp/lc_last_run.txt`) hold only cumulative `wars` and `destroyed` every 10 years, so the harness hooks `declareWar` and nation death itself. Game wars are the wars the engine opens (any size, including colonial conquest); COW inter-state wars need 1,000 battle deaths. Expect the game to be higher.
- COW wars: Inter-State War Data v4.0 by first start year. Great-power involvement uses the set in docs/WAR_CALIBRATION.md (US, UK, France, Germany/Prussia, Austria-Hungary, Italy, Russia, Ottoman Empire, China, Japan). Game: any participant that is in that set or in `G.gp` at the declaration.
- Destroyed/formed: COW has no membership file here, so NMC v7 presence is the proxy (a state's first/last NMC year). NMC lists many micro-states, so COW counts are approximate. Game formed = newly alive tags plus Germany and Italy name changes of existing tags.
- Units. COW milper and tpop are thousands, irst is thousand tons (iron and steel combined). Game army = land units (`MEN` = 3 per unit in the engine, scale unproven), steel = annual output of steel factories (units/yr), population = `popOf` (people). No unit conversion is assumed: each series is turned into a share of the pool of the 8 largest COW powers by CINC in that year (inter-year and inter-unit safe), and ranks are compared. Ratio = game share / COW share (+0.005 smoothing).
- Game steel is steel only; COW irst also counts pig iron. Game iron ore is mined, not smelted, so it is not comparable.

## (a) Wars and states per decade

Game = mean of 3 seed(s); COW inter-state counts are exact.

| Decade | COW wars | Game wars | COW GP wars | Game GP wars | COW states ended (NMC) | Game destroyed | COW states joined (NMC) | Game formed |
|---|---|---|---|---|---|---|---|---|
| 1836-39 | 0 | 3.0 | 0 | 2.3 | 0 | 1.7 | 3 | 0.0 |
| 1840s | 4 | 5.3 | 4 | 5.0 | 0 | 2.7 | 7 | 0.0 |
| 1850s | 5 | 6.3 | 3 | 5.3 | 0 | 1.3 | 5 | 0.0 |
| 1860s | 8 | 9.0 | 5 | 7.7 | 10 | 7.0 | 3 | 2.7 |
| 1870s | 4 | 6.0 | 2 | 5.3 | 3 | 2.0 | 3 | 0.0 |
| 1880s | 3 | 5.3 | 2 | 4.3 | 0 | 2.0 | 3 | 0.0 |
| 1890s | 3 | 5.3 | 3 | 4.7 | 0 | 0.7 | 3 | 0.0 |
| 1900s | 6 | 3.0 | 3 | 3.0 | 1 | 0.0 | 5 | 1.0 |
| 1910s | 10 | 3.0 | 9 | 2.7 | 1 | 1.3 | 10 | 0.0 |
| 1920s | 2 | 1.0 | 1 | 1.0 | 0 | 0.0 | 12 | 0.0 |
| 1930s | 4 | 1.0 | 2 | 0.7 | 0 | 0.7 | 1 | 0.0 |
| Total | 49 | 48.3 | 34 | 42.0 | 15 | 19.3 | 55 | 3.7 |

Per seed totals (wars / GP wars / destroyed / formed):

- seed 3: 42 / 36 / 21 / 4
- seed 7: 40 / 36 / 19 / 4
- seed 11: 63 / 54 / 18 / 3

## (b) Power rankings at 1850, 1880, 1914

### 1850: army

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| GBR | 9% | 130 | 30% | 3.34 |
| RUS | 37% | 80 | 18% | 0.50 |
| FRA | 19% | 57 | 13% | 0.71 |
| AUS | 18% | 53 | 12% | 0.67 |
| USA | 1% | 27 | 6% | 4.78 |
| PRU | 6% | 19 | 4% | 0.80 |
| OTT | 6% | 41 | 9% | 1.48 |
| SPA | 5% | 32 | 7% | 1.43 |

Spearman rank correlation inside the pool: 0.79. Top 8 by this metric, COW: RUS, FRA, AUS, GBR, OTT, PRU, SPA, BAV. Game: GBR, CHI, RUS, FRA, AUS, OTT, SPA, USA.

### 1850: steel/iron

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| GBR | 58% | 5,256 | 29% | 0.50 |
| RUS | 6% | 1,923 | 11% | 1.73 |
| FRA | 11% | 3,781 | 21% | 1.93 |
| AUS | 4% | 2,924 | 16% | 3.67 |
| USA | 15% | 1,940 | 11% | 0.73 |
| PRU | 5% | 1,721 | 9% | 1.67 |
| OTT | 0% | 129 | 1% | 2.41 |
| SPA | 1% | 511 | 3% | 2.23 |

Spearman rank correlation inside the pool: 0.81. Top 8 by this metric, COW: GBR, USA, FRA, RUS, PRU, AUS, BEL, SWE. Game: GBR, FRA, AUS, USA, RUS, PRU, NED, BEL.

### 1850: population

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| GBR | 11% | 196,004 | 48% | 4.34 |
| RUS | 26% | 64,810 | 16% | 0.60 |
| FRA | 14% | 36,009 | 9% | 0.65 |
| AUS | 14% | 32,545 | 8% | 0.58 |
| USA | 9% | 27,162 | 7% | 0.75 |
| PRU | 6% | 14,852 | 4% | 0.60 |
| OTT | 14% | 18,763 | 5% | 0.35 |
| SPA | 6% | 19,688 | 5% | 0.88 |

Spearman rank correlation inside the pool: 0.48. Top 8 by this metric, COW: RUS, AUS, OTT, FRA, GBR, USA, PRU, SPA. Game: CHI, GBR, RUS, FRA, AUS, JAP, USA, SPA.

### 1880: army

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| GBR | 7% | 111 | 22% | 3.10 |
| CHI | 28% | 119 | 24% | 0.87 |
| USA | 1% | 48 | 10% | 6.60 |
| FRA | 15% | 45 | 9% | 0.61 |
| PRU | 12% | 35 | 7% | 0.61 |
| RUS | 25% | 70 | 14% | 0.57 |
| AUS | 8% | 34 | 7% | 0.92 |
| SAR | 5% | 33 | 7% | 1.40 |

Spearman rank correlation inside the pool: 0.45. Top 8 by this metric, COW: CHI, RUS, FRA, PRU, AUS, GBR, SAR, SPA. Game: CHI, GBR, RUS, USA, FRA, PRU, OTT, AUS.

### 1880: steel/iron

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| GBR | 47% | 18,438 | 26% | 0.56 |
| CHI | 0% | 0 | 0% | 0.81 |
| USA | 23% | 11,116 | 16% | 0.69 |
| FRA | 10% | 10,386 | 15% | 1.41 |
| PRU | 15% | 15,242 | 21% | 1.45 |
| RUS | 3% | 4,556 | 6% | 2.19 |
| AUS | 3% | 7,419 | 10% | 3.37 |
| SAR | 0% | 3,929 | 6% | 10.04 |

Spearman rank correlation inside the pool: 0.95. Top 8 by this metric, COW: GBR, USA, PRU, FRA, BEL, AUS, RUS, SWE. Game: GBR, PRU, USA, FRA, AUS, RUS, SAR, SPA.

### 1880: population

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| GBR | 5% | 255,089 | 28% | 5.20 |
| CHI | 52% | 389,967 | 43% | 0.81 |
| USA | 7% | 58,241 | 6% | 0.89 |
| FRA | 5% | 40,038 | 4% | 0.83 |
| PRU | 6% | 32,392 | 4% | 0.58 |
| RUS | 14% | 82,471 | 9% | 0.66 |
| AUS | 6% | 33,188 | 4% | 0.68 |
| SAR | 4% | 25,435 | 3% | 0.72 |

Spearman rank correlation inside the pool: 0.55. Top 8 by this metric, COW: CHI, RUS, USA, PRU, AUS, FRA, JAP, GBR. Game: CHI, GBR, RUS, USA, FRA, JAP, AUS, PRU.

### 1914: army

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| USA | 3% | 117 | 13% | 3.69 |
| PRU | 16% | 49 | 5% | 0.35 |
| GBR | 10% | 248 | 28% | 2.65 |
| RUS | 25% | 171 | 19% | 0.76 |
| CHI | 9% | 182 | 20% | 2.24 |
| FRA | 15% | 52 | 6% | 0.40 |
| AUS | 16% | 47 | 5% | 0.35 |
| JAP | 6% | 36 | 4% | 0.72 |

Spearman rank correlation inside the pool: -0.02. Top 8 by this metric, COW: RUS, PRU, AUS, FRA, GBR, CHI, SAR, JAP. Game: GBR, CHI, RUS, USA, SAR, OTT, FRA, PRU.

### 1914: steel/iron

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| USA | 43% | 22,643 | 21% | 0.50 |
| PRU | 25% | 23,660 | 22% | 0.89 |
| GBR | 14% | 21,466 | 20% | 1.38 |
| RUS | 8% | 6,379 | 6% | 0.76 |
| CHI | 0% | 3,197 | 3% | 5.81 |
| FRA | 5% | 15,768 | 15% | 2.75 |
| AUS | 4% | 8,613 | 8% | 1.94 |
| JAP | 1% | 5,172 | 5% | 5.28 |

Spearman rank correlation inside the pool: 0.90. Top 8 by this metric, COW: USA, PRU, GBR, RUS, FRA, AUS, BEL, SAR. Game: PRU, USA, GBR, FRA, AUS, RUS, JAP, SPA.

### 1914: population

| Power | COW share | Game value (mean) | Game share | Ratio |
|---|---|---|---|---|
| USA | 10% | 149,495 | 12% | 1.14 |
| PRU | 7% | 48,700 | 4% | 0.58 |
| GBR | 5% | 349,426 | 27% | 5.32 |
| RUS | 18% | 118,516 | 9% | 0.53 |
| CHI | 46% | 488,467 | 38% | 0.82 |
| FRA | 3% | 51,090 | 4% | 1.15 |
| AUS | 5% | 37,540 | 3% | 0.58 |
| JAP | 5% | 44,846 | 3% | 0.69 |

Spearman rank correlation inside the pool: 0.38. Top 8 by this metric, COW: CHI, RUS, USA, PRU, AUS, JAP, GBR, SAR. Game: CHI, GBR, USA, RUS, FRA, PRU, JAP, AUS.

## Largest mismatches (one per family, ranked by |ln ratio|)

- steel/iron, 1880, SAR: COW 0.00 vs game 0.06 (|ln ratio| 2.31)
- army, 1880, USA: COW 0.01 vs game 0.10 (|ln ratio| 1.89)
- population, 1914, GBR: COW 0.05 vs game 0.27 (|ln ratio| 1.67)
- states destroyed, 1840s, all: COW 0.00 vs game 2.67 (|ln ratio| 1.30)
- wars started, 1910s, all: COW 10.00 vs game 3.00 (|ln ratio| 1.01)

## The 3 largest mismatches and suggested engine parameters (not changed here)

Judged from the tables above (3 seeds, shares inside the COW top-8 pool).

1. **Population of Britain, 4-5x COW (1850: 4.3x, 1880: 5.2x, 1914: 5.3x).** The game's GBR includes India (DEL/BOM etc.; `governedIndia`), COW's UKG does not. Not an engine fault: compare GBR without Indian provinces, or add an `exclude` list to this tool. If the game should show a UK-core ranking, the knob is the start population of the Indian provinces in `src/world.js` (do not edit by hand, one 83k-char line).
2. **Army size ranks (1914 rank correlation -0.02; 1880 0.45).** Continental conscript powers are at 0.35-0.4 of their COW share in 1914 (Germany, France, Austria) and Russia at 0.5-0.75, while GBR 2.7x, USA 3.7x, China 2.2x. Suggested: in `src/society.js` `soldiersWanted(c,p)` (the `solT` target), raise the target for conscription/mass-army reforms and cap it for volunteer-army governments; check `MEN` (3, `src/mil.js`) and the war-time `U.sup` upkeep in mil.js, which is what limits recruiting.
3. **War frequency after 1900 (game 8 wars in 1900-36 vs COW 22; 1910s: 3.0 vs 10, with great powers 2.7 vs 9).** The game is at or above COW in 1840-1899 (about 1.3x) then collapses. Suggested in `src/diplo.js` `aiWarMonth`: the monthly roll `rng()>.035` could rise toward .05 after 1900, the great-power edge gate `e.r<(isGP(cb.t)?1.8:1.2)` could fall toward 1.5, and `CONG_P=.3` (crisis instead of war) could fall; the war-weariness gate `c.we>10` and `COAL_AT` infamy limit also bite. Note COW counts WWI as one war, so the 1910s COW total is mostly small Balkan, Turkish, Baltic and Polish wars.

Also noted: steel output of minor and mid powers is 2-10x COW share (Austria 3.7x in 1850, Italy 10x in 1880, France 2.8x in 1914, Britain 0.5x in 1850), so steel factory output (`f._out` in `src/econ.js`, `GOODS.steel` in `src/defs.js`) is too evenly spread; China and Japan show 0 steel in 1850-80 (COW also near 0). States formed: game forms about 4 per run (Germany, Italy, Confederacy, Norway); NMC lists 55 new states in the period, mostly 1900-30 successor states, which the game does not generate.

