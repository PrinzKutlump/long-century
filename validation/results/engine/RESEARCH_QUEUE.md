# Research queue (after A4) - MODEL_REV 4

Rule for every nation: points always bank (c.rp); queue c.resQ of up to 5 studies; the next valid study starts by itself; leftover points carry and cascade through the queue in the same month (loop bounded by queue length + 1); an idle AI picks with pickTech. Commands via execCommand (`research`, `researchQueue` add/remove/move; chain validated in order, duplicates and known techs rejected, double taps stale by serial). Tech data has no prerequisite lists; `techReady` honours a `pre` field if one is added. UI (Research page): banked points, months to finish, queue rows with remove and up/down, "Queue" next to "Study", "Queue full (5)" disabled. Load default c.resQ = [] (A4 defaults).
Tests: test_research_queue.js (24 checks), all 31 test files pass, wrap_test 24 months PASS.

## T and tech pace, seeds 3 and 7 (SWI player), A4 commit vs this commit
| Seed | outcome hash (save JSON without modelRev) before | after | wars b/a | destroyed b/a | GER after | ITA after | Union after | GP median year with 3 key techs b/a | mean techs known by GPs 1936 b/a | save bytes b/a |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | 87d40c44cb5c64cfabe76bb91ec811321da51960a4a4f8048c287878dc3b5419 | 2c2553fc2e23135e5258bb0beed2bfd5a061c2cce1cd3572c7486a28d6d8bc4d | 60/48 | 16/19 | Apr 1879 (was none) | Apr 1864 (Aug 1860) | Dec 1861 (Aug 1861) | 1890/1890 | 49.6/49.6 | 971,311/975,137 |
| 7 | 25fd11df18cff8babdacc74cdf0c2fbaecec3c06ed1c6da54f00dee6bd475feb | 0f08d550f9b67b21f2d81ad71f936ed974d90e2475bba9a4987fdc94b13ddee7 | 50/51 | 17/17 | May 1866 | Apr 1863 | Feb 1862 | 1890/1890 | 50.0/50.1 | 956,065/977,957 |
Key techs = the five factory-method techs (METH_TECH), 3 learned in play; great powers = G.gp in 1936 (tools/research_pace.js, files pace-{before,after}-seed-N.json). Tech pace is unchanged in median (1890); the world trajectory differs (hash). Seed 3 Germany now forms (1879, outside the 1866-1875 window). Prices 1936 seed 3 .65/.78/1.18/1.24, seed 7 .64/.78/.90/.85. ms/month 49.6 and 58.1.
