# Browser release gate

Desktop Chrome for Testing 153 (headless, Linux), `python3 wrap_test.py --months 24 --chromium /usr/bin/google-chrome --late seed-21-t600.txt seed-21-t1176.txt`. The late saves come from `LC_SAVES=dir node century.js 21` (Swiss player, seed 21, the largest 1936 save of the four baseline seeds). Raw lines are in `browser-gate.txt` and `browser-gate.json`.

## Month timing, 24 months each, ms

"Shown" runs from the End month tap to the laid-out frame of the new month. That is the figure held to the 130 ms budget. "Saved" runs on until the compressed autosave is in localStorage. Play mode advances every 700 ms, so the save finishes well before the next month.

| Start | Shown mean | Median | p95 | Max | Saved mean |
|---|---|---|---|---|---|
| New game, January 1836 | 70.6 | 69.5 | 110.4 | 117.6 | 131.9 |
| Seed 21, January 1886 | 86.8 | 74.8 | 131.1 | 171.2 | 188.4 |
| Seed 21, January 1934 | 89.7 | 79.4 | 143.5 | 177.9 | 203.7 |

Before this branch the same late runs measured 195–211 ms to the saved autosave, with about 140 ms of main-thread work before the frame (simulation about 90 ms, save JSON 30 ms, UTF-8 Blob 12 ms, render 8 ms). Two changes brought the tap under budget:

- End month now serializes the autosave after the frame that shows the new month (`autosaveSoon`). Leaving or hiding the page writes it at once. Code without timers still saves immediately.
- Tech effects are summed once per tech object (`TECH_FX`). Combat strength had been re-summing every researched tech three times per unit. Research clears the entry when it grants a tech, and events and new states replace the object.

The seed-21 century reproduces its final state digest exactly with both changes (`release-gate-seed-21.jsonl`). Node simulation time in the final decade fell from 61.7 to 46.9 ms per month.

The seed-21 digest differs from `checkpoint-seed-21.jsonl` before these changes too. Prices differ in the final floating-point digit from 1846 on, which points to Node 22 here against Node 24 at the checkpoint. Wars, state losses and every formation date match.

## Storage

The autosave and three manual slots each held the 930,789-character 1934 save. One more month was then autosaved with every slot full. Slot 3 reloaded to the saved month after a page reload.

| Used | Remaining | Measured capacity |
|---|---|---|
| 3,546,728 characters | 1,638,565 characters | 5,185,293 characters |

Chrome left room for about 1.7 more saves of this size. Firefox uses a 5 MiB limit per site, which this measurement does not cover.

## Portrait

At 360 and 390 px wide and at 100% and 125% text, the opening 24 months, settings and slot save/reload passed with no horizontal overflow. Late-game pages (Cabinet, Atlas, Economy, Government, Works, Nation, Diplomacy, Chronicle) had no overflow and no garbled text.

The Works checklist was tapped with touch input at each width and text size: two consecutive orders, slots filled until orders queued, a queued order moved and another cancelled, then a slot save and reload with the queue and active works unchanged.

At 360 px and 125% text some stat tiles truncate their values: national income on Economy, and government, party, next election and citizenship on Government. Screenshots are in `browser-gate/`.

## Still for a device

- Firefox for Android and the Claude web view: run the Android Works check in `docs/plans/Long_Century_Claude_Handoff.md`. Firefox could not be installed in this workspace.
- Advance through December and open the cabinet report on a phone, and check Works → Funding.
