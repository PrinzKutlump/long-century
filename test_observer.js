"use strict";
/* A0/A3: observer-neutral economy test.
 * The same seed, the same command list and the same pending-card policy (every card takes its default) are run with
 * different observer seats: nobody, PUN, GBR, SWI. Only G.player differs (every nation stays AI-run; control flags, UI
 * selection, report caches and messages are not part of the digest). The material digest includes treasuries,
 * investment pools, province pops, factories, projects (paid/left), prices, wars, ownership and the RNG word.
 *
 * History: A0 reproduced the seat dependence (provincial-economy eligibility came from hasProvincialEconomy and the econMonth
 * participant list ["PUN",G.player]); A2 removed the investMonth ledger dependence; A3 made the household economy the same rule for
 * every province of every nation and removed the G.player exclusions from material outcomes. All seats must now be identical.
 * LC_A0_MONTHS sets the window (default 120 months; the A3 report ran 120). tools/a3_century.js runs the same check over 100 years. */
const A3_DONE = true; /* flipped by ticket A3 */
const L = require("./tools/a0_lib");
const SEED = 7, MONTHS = +(process.env.LC_A0_MONTHS || 120);
const seats = [null, "PUN", "GBR", "SWI"];
let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };

/* 0. harness guard: the same seat twice must be identical, otherwise the comparison means nothing */
{
 const guard = L.observerRuns([null, null], MONTHS, SEED);
 check(guard.pairs[0].eco === null && guard.pairs[0].full === null, "harness: two runs of the same seat are identical for " + MONTHS + " months");
}

const result = L.observerRuns(seats, MONTHS, SEED);
const pair = (a, b) => result.pairs.find(x => x.a === a && x.b === b);
const first = (a, b, kind) => pair(a, b)[kind];
const name = L.label;
console.log("seed " + SEED + ", " + MONTHS + " months, actors " + L.ACTORS.join("/") + ", pending cards: default option");
for (const x of result.pairs) console.log("  " + name(x.a) + " vs " + name(x.b) + ": first divergent month " +
 (x.eco === null ? "none" : x.eco - 1 + " (" + dateOf(x.eco - 1) + ")") + " [economy digest], " + (x.full === null ? "none" : x.full - 1) + " [full digest]");
function dateOf(m) { const M = ["January","February","March","April","May","June","July","August","September","October","November","December"]; return M[m % 12] + " " + (1836 + Math.floor(m / 12)); }

check(A3_DONE, "A3_DONE flag is set");
for (const x of result.pairs) {
 check(x.eco === null, "A3: " + name(x.a) + " and " + name(x.b) + " have identical economy state for " + MONTHS + " months");
 check(x.full === null, "A3: " + name(x.a) + " and " + name(x.b) + " have identical full material state for " + MONTHS + " months");
}
/* the economy really ran provincially for every nation: a province of a nation that is neither the seat nor Punjab has household market rows */
{
 const run = L.createRun(null, SEED), G = run.A.getG();
 L.stepRun(run);
 const tags = Object.keys(G.c).filter(t => G.c[t].alive && !["PUN", "GBR", "SWI"].includes(t));
 const withRows = tags.filter(t => run.A.provsOf(t).some(p => p.localMarket && p.localMarket.grain && p.landUse));
 check(withRows.length === tags.length, "A3: every living nation has household market rows in its provinces (" + withRows.length + " of " + tags.length + ")");
 const bad = []; for (const p of G.plist) for (const g in (p.localMarket || {})) for (const k of ["supply","demand","received","fill","delivered"]) if (!Number.isFinite(p.localMarket[g][k])) bad.push(p.id + "." + g + "." + k);
 check(bad.length === 0, "A3: household market rows are finite (zero-supply and occupied provinces included)" + (bad.length ? ": " + bad.slice(0, 5) : ""));
}
process.exitCode = failed ? 1 : 0;
