# Ottoman 1911 handoff and Long Century reconciliation

Source review for the 25 November 2026 handoff, against public main at `455ddd4` and the open PR heads listed below. The Ottoman reference is the owner-supplied `ottoman1911.html`. The feature ledger and linked tickets remain the working backlog.

## Work already in the repository

| Work | Evidence |
| --- | --- |
| Master plan, design and status | #29 merged |
| Full-century CI gate, grain freight and engine save comparison | #23 and #22 merged |
| Stress suite and lighter default stress runs | #28 and #51 merged |
| Feature ledger and the first two audit suites | #33, #35 and #48 merged |
| IndexedDB, worker compression and export | #34 merged, implements issue #4 |
| Repay all loans and Settings scroll retention | #37 and #50 merged |

## Work on open branches

| PR | State at review |
| --- | --- |
| #30 phantom factory income | Quick and Full green. Seed 3 SWI passed three local resumes with the #59 harness. Broader corrected stress coverage is pending. |
| #32 construction and Works | Quick and Full green. Browser failed at `02cafa8`. Recheck the browser failure before release. Combined #30/#32 needs a fresh state hash when the first lands. |
| #52 ledger sync and #53 audit probes | Quick and Full green. #53 records the wool gap and event coverage. |
| #55 sound cues | Quick and Browser green. Full failed. Five cues exist. Music and remaining triggers are incomplete. |
| #57 asset policy and tooling | Quick and Full green. Ships the asset checker and policy; no actual asset files. |
| #58 fortress queue and #59 resume harness | Quick and Full green. Both await owner review. |
| #25 Pages deployment | Open. Publish and verify the numbered phone build under issue #15. |

## Source evidence for outstanding features

| Ledger / ticket | Ottoman source and scope |
| --- | --- |
| A7 / #47 | `refitShip` and `refitAll` put eligible ships in the yard and pay in instalments. Use this design as the starting point. Verify single and bulk costs, service status, and save/resume. |
| A13, A15, A21 / #39, #42 | Naval training, missions, shipyard availability, and the Suez/Aden transit rules are implemented. Check the Red Sea route separately in Long Century. |
| A17 / #40 | The Arab Compact runs from December 1917 to September 1945 in the source. It has a scenario initializer, Sykes–Picot choice, and a historical benchmark. Scenario completion still needs a full playthrough. |
| A23 | Ottoman tax instruments affect sectors and unrest. Long Century taxes population groups. Keep the instrument-level gap visible. |
| A24, A25 / #43 | Historical works and illustrated project metadata exist in Ottoman. Long Century has great works. Renovation and background art remain follow-up work. |
| A27 | Threat estimates, payoff tables and a historical score benchmark belong in the audit. Long Century already has power rankings, influence and crisis logic. Track a historical benchmark separately from power rank. |
| A28 / #45 | Partial in Long Century. Trade reporting and national tariffs exist. Ottoman adds commercial treaties, boycotts and strategic-goods retention. Per-good and per-partner tariffs extend the Ottoman national rate. |
| A5, A29 / #46 | Separate buildable oil wells and deposit tiers from existing Long Century oil commodity and production inputs. |
| A20 | Ottoman front targets follow current ownership and adjacency. Test the corresponding routes and border changes in Long Century before marking parity. |

## Order of work

1. Finish FX1 and the Works mobile gate. Re-pin the combined century state on the supported runtime after the first lands.
2. Reconcile A8 and A12 after #52, and keep A28 partial. Preserve evidence when closing tickets. Continue stability and campaign tickets #5, #8, #6, #10 and CI/data work #7, #14, #13, #9 against their current acceptance checks.
3. Use #47, #39 and #42 for the naval gaps, and #45 and #46 for trade and deposits. Integrate these into common game rules before building the extended scenario.
4. Keep DeepSeek files set aside. Build the missing Europe, Americas and Asia events from scratch under #56 in tested batches. #57 carries the proposed original-art, CC0 or public-domain asset policy. Android APK work remains closed.
