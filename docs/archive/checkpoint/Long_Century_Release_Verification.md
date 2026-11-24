# Long Century Wider Rollout release verification

Release verdict: Android acceptance remains open. The environment has no connected Android device, and local Chromium stops before page load because process sockets are restricted.

## Build and regression checks

- Archive SHA-256: `bfae47745b985473fb7909040a95c58f6cd6339f2739ac37394788f4eda36c88`.
- Rebuilt HTML SHA-256: `9294c15033e3ff4f6dccf26346f5cc3f5136bdba04d1425785c2650faecc018e`. Matches the packaged HTML byte for byte.
- Host: Linux x86_64, v24.22.3.
- Regression groups observed passing: 17.

## Century simulations

8 of 8 exact-release engine runs reached January 1936 without an engine error. These are all-AI simulations.
Wall times were measured with concurrent jobs, so they describe this run and do not establish the standalone 130 ms/month or phone timing target. Final active wars are a snapshot.

| Seed | Latest checkpoint | Active wars at checkpoint | Average wall ms/month | Engine result | Formation summary |
|---:|---|---:|---:|---|---|
| 7 | January 1936 | 0 | 203.1 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |
| 3 | January 1936 | 0 | 209.6 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |
| 11 | January 1936 | 0 | 194.4 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |
| 21 | January 1936 | 0 | 200.4 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |
| 5 | January 1936 | 1 | 193.2 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |
| 13 | January 1936 | 0 | 197.4 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |
| 17 | January 1936 | 1 | 202.9 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |
| 29 | January 1936 | 0 | 214.0 | Pass | Germany, Italy · CSA reabsorbed · USA slavery 2 |

## Isolated engine timing

Seed 7, 120 months, one Node process on the reference host. Mean 89.1 ms, median 80.3 ms, 95th percentile 153.2 ms and maximum 203.6 ms. The mean meets the 130 ms target for this sample. The sample covers the first decade and engine time. Full-century sequential performance and Android frame and storage timings remain unmeasured.

## Automated regression output

- deck integrity, Jan 1836, historical dates, Perry branching, card rendering, save migration, credit and influenza expiry, debt default, independence, and persisted war IDs.
- agenda, annual report, multi-month stop rules, both Punjab branches, July mediation, neutrality, entry, separate peace and reparations.
- advance menu and toggles, actual three-turn cutoff, first report and report markup.
- London building estimates agree across release and engine, and diplomacy displays fleet counts.
- Meiji refusal and reload, construction queue, original holdings, migration conservation and Wichalē divergence.
- failed autosave preserves the last save, Punjab challenge persists, and agreements apply once.
- rejected import and decree, monthly credit, manual slot recovery, unique agendas, deterministic restart and reload.
- Punjab hiring conserves population, respects qualifications and records household spending.
- project commands survive save/reload, queue IDs persist and Punjab accounts reconcile.
- Punjab household freight, tariff sensitivity and allocation limits.
- both Punjab bill paths run for 24 months with recorded school order, market receipts and two annual reports.
- import priorities, customs capacity, method trade-off, financial fields and policy save/load.
- bilateral depot clearing, commercial rights, Punjab milestone and Britain market rollout.
- regional market starts and exhaustion-driven peace preserve legal ownership.
- construction funding delays, payments and ledger persistence.
- Company revenue, Crown reserve transfer and unchanged province ownership.
- wider rollout across ten additional starts, allocation totals, save and Economy display.

## Outstanding acceptance

- Physical Android Firefox at 360 and 390 CSS pixels. Start a campaign, queue construction, resolve a decision, use the map, advance a turn, suspend, resume offline and review the century ending.
- Actual browser layout and paint, storage writes and isolated turn timing. The regression suite simulates storage failures, save migration and resume.
- Full campaign balance requires cumulative war, default and congress metrics as well as the snapshots captured by this runner. Major and small player-controlled century runs are separate from the all-AI seed runs.
