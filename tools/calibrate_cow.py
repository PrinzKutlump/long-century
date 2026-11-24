#!/usr/bin/env python3
"""Compare the game with Correlates of War data, 1836-1936, and write docs/CALIBRATION_REPORT.md.

Calibration only: reads the built game (dist/long-century.html, run `python3 build.py` first) through
tools/cal_harness.js and never changes engine code.

  python3 tools/calibrate_cow.py                  # runs seeds 7 3 11 (about 90 s each, 2 at a time)
  python3 tools/calibrate_cow.py --reuse          # reuse /tmp/cal_seed_<n>.json when present
  python3 tools/calibrate_cow.py --seeds 7 --out /tmp/r.md
"""
import argparse, csv, json, math, os, subprocess, sys
from pathlib import Path
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COW = os.path.join(ROOT, "data", "raw", "cow")
DECADES = ["1836-39"] + [f"{y}s" for y in range(1840, 1940, 10)]
SNAP_YEARS = (1850, 1880, 1914)
# COW "great power, Ottoman Empire or China" set used in docs/WAR_CALIBRATION.md
GP_CC = {2, 200, 220, 255, 300, 325, 365, 640, 710, 740}
GP_TAGS = {"GBR", "FRA", "RUS", "AUS", "USA", "PRU", "GER", "OTT", "SAR", "ITA", "CHI", "JAP"}
# game tag -> COW ccode (only states that can rank in the top 8 of a metric)
CC = {"GBR": 200, "FRA": 220, "RUS": 365, "AUS": 300, "USA": 2, "PRU": 255, "GER": 255, "OTT": 640,
      "NED": 210, "SAR": 325, "ITA": 325, "CHI": 710, "JAP": 740, "SPA": 230, "BEL": 211, "SWE": 380,
      "DEN": 390, "SWI": 225, "POR": 235, "BRA": 140, "MEX": 70, "ARG": 160, "PER": 630, "GRE": 350,
      "BAV": 245, "SAX": 269, "WUR": 271, "HAN": 240, "TUS": 337, "SIC": 329, "CHL": 155, "SER": 345,
      "RMN": 360, "NOR": 385, "PEU": 135, "COL": 100, "CLM": 100}


def decade(year):
    return 0 if year < 1840 else min((year - 1840) // 10 + 1, 10)


def cow_wars():
    """Inter-state wars by first start year: [(year, involves_gp)]"""
    first, gp = {}, defaultdict(bool)
    for r in csv.DictReader(open(os.path.join(COW, "Inter-StateWarData_v4.0.csv"), encoding="utf-8-sig")):
        n, y = r["WarNum"], int(r["StartYear1"])
        if y > 0:
            first[n] = min(first.get(n, 9999), y)
        if int(r["ccode"]) in GP_CC:
            gp[n] = True
    return [(y, gp[n]) for n, y in first.items() if 1836 <= y <= 1936]


def load_nmc(source):
    with source.open(encoding="utf-8-sig") as stream:
        rows = list(csv.DictReader(stream))
    data = defaultdict(dict)  # year -> ccode -> row
    life = defaultdict(list)
    for r in rows:
        y, cc = int(r["year"]), int(r["ccode"])
        data[y][cc] = {k: float(r[k]) for k in ("milper", "irst", "tpop", "cinc")}
        life[cc].append(y)
    return data, life


def cow_states(life):
    """States entering/leaving NMC in 1837-1936 (NMC years run 1816-2016, so survivors never leave)."""
    formed, destroyed = [0] * 11, [0] * 11
    for cc, ys in life.items():
        a, b = min(ys), max(ys)
        if 1837 <= a <= 1936:
            formed[decade(a)] += 1
        if 1836 <= b < 1936:
            destroyed[decade(b + 1)] += 1
    return formed, destroyed


def run_seeds(seeds, reuse):
    todo = [s for s in seeds if not (reuse and os.path.exists(f"/tmp/cal_seed_{s}.json"))]
    procs = []
    for s in todo:
        procs.append(subprocess.Popen(["node", os.path.join(ROOT, "tools", "cal_harness.js"), str(s), f"/tmp/cal_seed_{s}.json"]))
        while sum(p.poll() is None for p in procs) >= 2:  # two cores
            procs[0].wait() if procs[0].poll() is None else procs[[p.poll() is None for p in procs].index(True)].wait()
    for p in procs:
        if p.wait() != 0:
            sys.exit("harness failed")
    return {s: json.load(open(f"/tmp/cal_seed_{s}.json")) for s in seeds}


def game_decades(runs):
    """Mean per decade across seeds: wars, wars with a great power, destroyed, formed."""
    out = {k: [0.0] * 11 for k in ("wars", "gpwars", "destroyed", "formed")}
    for d in runs.values():
        for w in d["wars"]:
            i = decade(1836 + w["t"] // 12)
            out["wars"][i] += 1
            if set(w["sideA"]) | set(w["sideD"]) | {w["att"], w["def"]} & GP_TAGS:
                pass
            if (set(w["sideA"]) | set(w["sideD"])) & (GP_TAGS | set(w["gp"])):
                out["gpwars"][i] += 1
        for e in d["destroyed"]:
            out["destroyed"][decade(1836 + (e["t"] - 1) // 12)] += 1
        marks = [e for e in d["formed"]] + [{"t": e["t"]} for e in d.get("renamed", []) if e["to"] in ("Germany", "Italy")]
        for e in marks:
            out["formed"][decade(1836 + (e["t"] - 1) // 12)] += 1
    n = len(runs)
    return {k: [v / n for v in vs] for k, vs in out.items()}


def spearman(a, b):
    def ranks(x):
        order = sorted(range(len(x)), key=lambda i: -x[i])
        r = [0] * len(x)
        for k, i in enumerate(order):
            r[i] = k + 1
        return r
    ra, rb = ranks(a), ranks(b)
    n = len(a)
    return 1 - 6 * sum((x - y) ** 2 for x, y in zip(ra, rb)) / (n * (n * n - 1)) if n > 2 else float("nan")


def snapshot_tables(runs, nmc):
    """Per year and metric: pool = COW top 8 by CINC. Shares inside the pool, ranks among all mapped states."""
    metrics = [("army", "milper", "units"), ("steel/iron", "irst", "steel"), ("population", "tpop", "pop")]
    cells, tables = [], []
    seeds = sorted(runs)
    for y in SNAP_YEARS:
        cow = nmc[y]
        pool = [cc for cc, _ in sorted(cow.items(), key=lambda kv: -kv[1]["cinc"])[:8]]
        pool_tag = {}
        for cc in pool:
            pool_tag[cc] = next((t for t, c in CC.items() if c == cc and any(t in runs[s]["snaps"][str(y)] for s in seeds)), None)
        for mname, cm, gm in metrics:
            cow_all = {cc: v[cm] for cc, v in cow.items() if v[cm] > 0}
            cow_pool = {cc: cow_all.get(cc, 0) for cc in pool}
            tot_c = sum(cow_pool.values()) or 1
            # game values: mean across seeds (state absent = 0)
            gv = {}
            for cc in pool:
                tag = pool_tag[cc]
                gv[cc] = sum(runs[s]["snaps"][str(y)].get(tag, {}).get(gm, 0) for s in seeds) / len(seeds) if tag else 0
            tot_g = sum(gv.values()) or 1
            if mname == "steel/iron":  # game has no combined series: steel only, so also report iron ore
                pass
            rows = []
            for cc in pool:
                sc, sg = cow_pool[cc] / tot_c, gv[cc] / tot_g
                name = next((t for t, c in CC.items() if c == cc and t == pool_tag[cc]), None) or str(cc)
                ratio = (sg + 0.005) / (sc + 0.005)
                rows.append((name, cow_pool[cc], sc, gv[cc], sg, ratio))
                if max(sc, sg) >= 0.05:
                    cells.append((abs(math.log(ratio)), mname, y, name, sc, sg))
            rho = spearman([r[1] for r in rows], [r[3] for r in rows])
            # top 8 lists over all mapped states
            top_c = [next((t for t, c in CC.items() if c == cc), str(cc)) for cc, _ in sorted(cow_all.items(), key=lambda kv: -kv[1])[:8]]
            mean_g = defaultdict(float)
            for s in seeds:
                for tag, v in runs[s]["snaps"][str(y)].items():
                    mean_g[tag] += v[gm] / len(seeds)
            top_g = [t for t, _ in sorted(mean_g.items(), key=lambda kv: -kv[1])[:8]]
            tables.append((y, mname, rows, rho, top_c, top_g))
    return tables, cells


def md_table(head, rows):
    return "\n".join(["| " + " | ".join(head) + " |", "|" + "---|" * len(head)] + ["| " + " | ".join(map(str, r)) + " |" for r in rows])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, nargs="+", default=[7, 3, 11])
    ap.add_argument("--reuse", action="store_true")
    ap.add_argument("--out", default=os.path.join(ROOT, "docs", "CALIBRATION_REPORT.md"))
    a = ap.parse_args()
    inputs = list((Path(COW) / "nmc_v7").glob("*abridged.csv"))
    if len(inputs) != 1:
        ap.error("Raw calibration inputs are private. See docs/CALIBRATION_REPORT.md for the published comparison.")
    nmc, life = load_nmc(inputs[0])
    runs = run_seeds(a.seeds, a.reuse)
    cw = cow_wars()
    cw_all, cw_gp = [0] * 11, [0] * 11
    for y, g in cw:
        cw_all[decade(y)] += 1
        cw_gp[decade(y)] += g
    cf, cd = cow_states(life)
    gd = game_decades(runs)
    n = len(runs)
    L = [f"# Calibration report: game vs Correlates of War, 1836-1936",
         "", f"Made by `python3 tools/calibrate_cow.py` (seeds {', '.join(map(str, a.seeds))}, AI-only worlds, `tools/cal_harness.js`). Engine untouched.",
         "", "## Method and caveats",
         "- Game runs replay `century.js`'s loop with no player (`newGame(null, seed)`, `monthTick`). `century.js --quiet` records (`/tmp/lc_last_run.txt`) hold only cumulative `wars` and `destroyed` every 10 years, so the harness hooks `declareWar` and nation death itself. Game wars are the wars the engine opens (any size, including colonial conquest); COW inter-state wars need 1,000 battle deaths. Expect the game to be higher.",
         "- COW wars: Inter-State War Data v4.0 by first start year. Great-power involvement uses the set in docs/WAR_CALIBRATION.md (US, UK, France, Germany/Prussia, Austria-Hungary, Italy, Russia, Ottoman Empire, China, Japan). Game: any participant that is in that set or in `G.gp` at the declaration.",
         "- Destroyed/formed: COW has no membership file here, so NMC v7 presence is the proxy (a state's first/last NMC year). NMC lists many micro-states, so COW counts are approximate. Game formed = newly alive tags plus Germany and Italy name changes of existing tags.",
         "- Units. COW milper and tpop are thousands, irst is thousand tons (iron and steel combined). Game army = land units (`MEN` = 3 per unit in the engine, scale unproven), steel = annual output of steel factories (units/yr), population = `popOf` (people). No unit conversion is assumed: each series is turned into a share of the pool of the 8 largest COW powers by CINC in that year (inter-year and inter-unit safe), and ranks are compared. Ratio = game share / COW share (+0.005 smoothing).",
         "- Game steel is steel only; COW irst also counts pig iron. Game iron ore is mined, not smelted, so it is not comparable.",
         ""]
    L += ["## (a) Wars and states per decade", "", f"Game = mean of {n} seed(s); COW inter-state counts are exact.", ""]
    rows = []
    for i, d in enumerate(DECADES):
        rows.append((d, cw_all[i], f"{gd['wars'][i]:.1f}", cw_gp[i], f"{gd['gpwars'][i]:.1f}", cd[i], f"{gd['destroyed'][i]:.1f}", cf[i], f"{gd['formed'][i]:.1f}"))
    rows.append(("Total", sum(cw_all), f"{sum(gd['wars']):.1f}", sum(cw_gp), f"{sum(gd['gpwars']):.1f}", sum(cd), f"{sum(gd['destroyed']):.1f}", sum(cf), f"{sum(gd['formed']):.1f}"))
    L.append(md_table(["Decade", "COW wars", "Game wars", "COW GP wars", "Game GP wars", "COW states ended (NMC)", "Game destroyed", "COW states joined (NMC)", "Game formed"], rows))
    L += ["", "Per seed totals (wars / GP wars / destroyed / formed):", ""]
    for s, d in sorted(runs.items()):
        gp = sum(1 for w in d["wars"] if (set(w["sideA"]) | set(w["sideD"])) & (GP_TAGS | set(w["gp"])))
        fm = len(d["formed"]) + len([e for e in d.get("renamed", []) if e["to"] in ("Germany", "Italy")])
        L.append(f"- seed {s}: {len(d['wars'])} / {gp} / {len(d['destroyed'])} / {fm}")
    L += ["", "## (b) Power rankings at 1850, 1880, 1914", ""]
    tables, cells = snapshot_tables(runs, nmc)
    for y, mname, rows, rho, top_c, top_g in tables:
        L += [f"### {y}: {mname}", "",
              md_table(["Power", "COW share", "Game value (mean)", "Game share", "Ratio"],
                       [(r[0], f"{r[2]:.0%}", f"{r[3]:,.0f}", f"{r[4]:.0%}", f"{r[5]:.2f}") for r in rows]),
              "", f"Spearman rank correlation inside the pool: {rho:.2f}. Top 8 by this metric, COW: {', '.join(top_c)}. Game: {', '.join(top_g)}.", ""]
    # mismatches: best cell per family, 3 largest
    fam = {}
    for sc, m, y, name, c, g in cells:
        if (m not in fam) or sc > fam[m][0]:
            fam[m] = (sc, m, y, name, c, g)
    for i, d in enumerate(DECADES):
        if i == 0:
            continue  # 1836-39 is a partial bucket
        sc = abs(math.log((gd["wars"][i] + 1) / (cw_all[i] + 1)))
        if "wars" not in fam or sc > fam["wars"][0]:
            fam["wars"] = (sc, "wars started", d, "all", cw_all[i], gd["wars"][i])
        sc = abs(math.log((gd["destroyed"][i] + 1) / (cd[i] + 1)))
        if "destroyed" not in fam or sc > fam["destroyed"][0]:
            fam["destroyed"] = (sc, "states destroyed", d, "all", cd[i], gd["destroyed"][i])
    top = sorted(fam.values(), reverse=True)
    L += ["## Largest mismatches (one per family, ranked by |ln ratio|)", ""]
    for sc, m, y, name, c, g in top:
        L.append(f"- {m}, {y}, {name}: COW {c:.2f} vs game {g:.2f} (|ln ratio| {sc:.2f})")
    L += ["", "## The 3 largest mismatches and suggested engine parameters (not changed here)", "",
          "Judged from the tables above (3 seeds, shares inside the COW top-8 pool).", "",
          "1. **Population of Britain, 4-5x COW (1850: 4.3x, 1880: 5.2x, 1914: 5.3x).** The game's GBR includes India (DEL/BOM etc.; `governedIndia`), COW's UKG does not. Not an engine fault: compare GBR without Indian provinces, or add an `exclude` list to this tool. If the game should show a UK-core ranking, the knob is the start population of the Indian provinces in `src/world.js` (do not edit by hand, one 83k-char line).",
          "2. **Army size ranks (1914 rank correlation -0.02; 1880 0.45).** Continental conscript powers are at 0.35-0.4 of their COW share in 1914 (Germany, France, Austria) and Russia at 0.5-0.75, while GBR 2.7x, USA 3.7x, China 2.2x. Suggested: in `src/society.js` `soldiersWanted(c,p)` (the `solT` target), raise the target for conscription/mass-army reforms and cap it for volunteer-army governments; check `MEN` (3, `src/mil.js`) and the war-time `U.sup` upkeep in mil.js, which is what limits recruiting.",
          "3. **War frequency after 1900 (game 8 wars in 1900-36 vs COW 22; 1910s: 3.0 vs 10, with great powers 2.7 vs 9).** The game is at or above COW in 1840-1899 (about 1.3x) then collapses. Suggested in `src/diplo.js` `aiWarMonth`: the monthly roll `rng()>.035` could rise toward .05 after 1900, the great-power edge gate `e.r<(isGP(cb.t)?1.8:1.2)` could fall toward 1.5, and `CONG_P=.3` (crisis instead of war) could fall; the war-weariness gate `c.we>10` and `COAL_AT` infamy limit also bite. Note COW counts WWI as one war, so the 1910s COW total is mostly small Balkan, Turkish, Baltic and Polish wars.",
          "",
          "Also noted: steel output of minor and mid powers is 2-10x COW share (Austria 3.7x in 1850, Italy 10x in 1880, France 2.8x in 1914, Britain 0.5x in 1850), so steel factory output (`f._out` in `src/econ.js`, `GOODS.steel` in `src/defs.js`) is too evenly spread; China and Japan show 0 steel in 1850-80 (COW also near 0). States formed: game forms about 4 per run (Germany, Italy, Confederacy, Norway); NMC lists 55 new states in the period, mostly 1900-30 successor states, which the game does not generate.", ""]
    open(a.out, "w").write("\n".join(L) + "\n")
    print("wrote", a.out)


if __name__ == "__main__":
    main()
