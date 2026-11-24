"use strict";
/* A0 evidence: first divergent month and field per observer seat, with opening balances and partial projects,
 * plus counterfactuals that name the cause. Writes validation/results/engine/a4-observer.json and .txt. */
const fs = require("node:fs");
const path = require("node:path");
const L = require("./a0_lib");
const SEED = +(process.env.LC_SEED || 7), MONTHS = +(process.env.LC_A0_MONTHS || 24);
const out = path.join(L.ROOT, "validation/results/engine");
fs.mkdirSync(out, { recursive: true });
const seats = [null, "PUN", "GBR", "SWI"];
const M = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const dateOf = m => M[m % 12] + " " + (1836 + Math.floor(m / 12));
const lines = [];
const say = t => { console.log(t); lines.push(t); };
const report = { seed: SEED, months: MONTHS, actors: L.ACTORS, commands: null, variants: {} };

function variant(key, title, opts, localiseSeats = true) {
 say("");
 say("== " + title);
 const t0 = Date.now();
 const r = L.observerRuns(seats, MONTHS, SEED, opts);
 const v = { title, pairs: r.pairs.map(p => ({ a: L.label(p.a), b: L.label(p.b), firstDivergentMonthEco: p.eco === null ? null : p.eco - 1, firstDivergentMonthFull: p.full === null ? null : p.full - 1 })), seats: {} };
 for (const p of r.pairs) say("  " + L.label(p.a).padEnd(5) + " vs " + L.label(p.b).padEnd(5) + " economy digest: " + (p.eco === null ? "identical for " + MONTHS + " months" : "first differs after month " + (p.eco - 1) + " (" + dateOf(p.eco - 1) + ")") +
  "; full digest: " + (p.full === null ? "identical" : "month " + (p.full - 1)));
 if (localiseSeats) for (const seat of ["PUN", "GBR", "SWI"]) {
  const p = r.pairs.find(x => x.a === null && x.b === seat);
  if (p.eco === null && p.full === null) continue;
  const month = (p.eco === null ? p.full : p.eco) - 1;
  const d = L.localise(null, seat, month, SEED, opts);
  delete d.eventsA; delete d.eventsB;
  v.seats[seat] = d;
  say("  seat " + seat + " vs nobody, month " + month + " (" + d.date + ")");
  say("    first divergent snapshot: after " + (d.firstEvent ? d.firstEvent.afterPhase : "none") + "; allocateLocalHouseholds calls " + d.allocateLocalHouseholdsCalls.a + " (nobody) vs " + d.allocateLocalHouseholdsCalls.b + " (seat)");
  if (d.firstEvent) {
   say("    first divergent material field (document order): " + d.firstField + " = " + JSON.stringify(d.firstFieldValues.a) + " vs " + JSON.stringify(d.firstFieldValues.b));
   say("    first divergent field of the seat's own nation: " + d.firstSeatField);
   say("    fields differing at that snapshot: " + d.firstEvent.differentPaths + "; groups " + JSON.stringify(d.firstEvent.groups));
   say("    opening balances (identical in both runs): " + JSON.stringify(Object.fromEntries(Object.entries(d.openingBalances).map(([t, b]) => [t, { tr: +b.a.tr.toFixed(2), inv: +b.a.inv.toFixed(2), debt: +b.a.debt.toFixed(2) }]))));
   if (d.involvedNation) {
    say("    involved nation " + d.involvedNation + ", balances after: nobody " + JSON.stringify(d.balancesAfter.a) + " | seat " + JSON.stringify(d.balancesAfter.b));
    say("    projects of " + d.involvedNation + " nobody: " + JSON.stringify(d.projectsA.map(x => x.g + "@" + x.prov + " paid " + x.paid + " left " + x.leftUnits)));
    say("    projects of " + d.involvedNation + " seat:   " + JSON.stringify(d.projectsB.map(x => x.g + "@" + x.prov + " paid " + x.paid + " left " + x.leftUnits)));
   }
  }
 }
 v.seconds = +((Date.now() - t0) / 1000).toFixed(1);
 report.variants[key] = v;
 return r;
}

const probe = L.createRun(null, SEED);
report.commands = probe.plan;
say("A0 observer-neutral comparison, seed " + SEED + ", " + MONTHS + " months, fixed command list (" + probe.plan.length + " commands for " + L.ACTORS.join("/") + "), pending cards take their default");
say("Digest excludes: " + L.EXCLUDE.join(", ") + " and every key starting with an underscore; includes treasuries, pools, debt, province pops, factories, projects, prices, wars, ownership and the RNG word.");

variant("post_init_fixture", "Seats set after identical initialisation, with the exhausted-treasury fixture (months 5-12)", {});
variant("post_init_natural", "Same, but no treasury fixture (the natural economy only)", { fixture: false });
variant("real_init", "Seat chosen at newGame (real new-game path), control flag neutralised, with fixture", { realInit: true });

const cf = (key, title, names, c) => variant(key, "Counterfactual: " + title, { loader: () => L.loadPatched(names, c) });
cf("cf_ledger_only", "only the investMonth ledger neutralised (display-only since A2; no outcome change expected)", ["ledger"], { ledger: () => false });

fs.writeFileSync(path.join(out, "a4-observer.json"), JSON.stringify(report, null, 1));
fs.writeFileSync(path.join(out, "a4-observer.txt"), lines.join("\n") + "\n");
