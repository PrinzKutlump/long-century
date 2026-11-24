# Release A - equal rules, reliable commands, durable construction (A0-A4)

Branch `engine`, MODEL_REV 3, save codec SAVE_SCHEMA 3, build dist/long-century.html (python3 build.py, ~1.04 MB). Playable: wrap_test 360/390 px at 100% and 125% PASS; late-game gate on the 1934 save PASS.

## Tickets and evidence
| Ticket | Status | Evidence |
|---|---|---|
| A0 observer-neutral harness, baselines | verified | A0.md, test_observer.js, tools/a0_*.js (profile and report restored in A4) |
| A1 actor-aware command path | verified | execCommand for human, AI, scenario actors; test_commands.js; hashes unchanged |
| A2 one funding rule, common project transitions, MODEL_REV 2 | verified | A2.md, test_construction.js; non-player overdraws 15 to 0 |
| A3 one household economy for every nation, seat-independent outcomes, MODEL_REV 3 | verified | A3.md, test_a3.js, test_observer.js (nobody/PUN/GBR/SWI identical 120 months), tools/a3_century.js (100 years, 5 seats) |
| A4 MODEL_REV field, load defaults, legacy fixtures | verified | A4.md, test_a4.js (4 legacy saves plus a fresh one), test_save_resume.js (120 months, save at 60, SWI/GBR/nobody identical) |
| A3 follow-ups: save/resume, July threshold, tools | verified | A4.md sections 2-4 |

## T table (8 seeds, SWI player, century.js; identical in A3 and A4 commits)
| Seed | wars | destroyed | GER | ITA | Union | grain/iron/steel/mach 1936 | save KB |
|---|---|---|---|---|---|---|---|
| 3 | 60 | 16 | none | Aug 1860 | Aug 1861 | .69/.81/1.11/.79 | 949 |
| 7 | 50 | 17 | May 1866 | Apr 1863 | Feb 1862 | .69/.73/.92/.92 | 934 |
| 11 | 50 | 19 | Oct 1866 | May 1860 | Sep 1861 | .62/.69/.89/.99 | 972 |
| 21 | 55 | 20 | Sep 1867 | Sep 1860 | Nov 1861 | .66/.76/.99/1.11 | 953 |
| 5 | 51 | 24 | Apr 1866 | May 1861 | Oct 1862 | .66/.77/.92/.65 | 961 |
| 13 | 50 | 17 | Apr 1875 | Feb 1860 | Feb 1862 | .69/.78/.93/1.09 | 944 |
| 17 | 60 | 13 | none | Feb 1864 | Aug 1861 | .67/.77/.81/.95 | 964 |
| 29 | 56 | 17 | Oct 1866 | May 1862 | May 1862 | .68/.77/.92/.89 | 954 |
(KB column from A3's table; the 1936 save measured in A4 at 1926 year-row: 952-996 KB, i.e. under 1,048,576 bytes on all seeds.)
Targets: Germany 1866-1875 on 6 of 8 (seeds 5, 7, 11, 13, 21, 29), Italy 8 of 8, Union 8 of 8, prices inside 0.6-1.8 in 1936. Open: wars 50-60 (target 30-45), destroyed 13-24 (8-15), Germany "none" on seeds 3 and 17 (PRU did not win the 1866/1868 wars).

## Timings and size
Node month at 1936: 52-63 ms (century.js), interleaved A3 to A4 +2.1 ms. Browser month, seed 7 1934 save, 12 months: 104 ms mean (p95 152), limit 130; opening 72 ms. 1936 save 956 KB (seed 7), max 996 KB. Autosave plus three slots: 3.51M of 5.22M chars. Heap 84-127 MB.

## Open items
- Wars per century and states destroyed above target (R7); needs a diplomacy/war-score ticket.
- Real new-game init is not seat-neutral at month 0 because calibration reads the control flag c.ai (works spending, debt repayment): by design, documented.
- No freight capacity inside a nation (B1 reintroduces it); Punjab has no rail-capacity grain bottleneck until then.
- Legacy saves: spending before the load is unknown (null), not reconstructed.
- Next: B1 freight graph and grain receipt path.
