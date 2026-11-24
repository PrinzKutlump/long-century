# The Long Century — Claude handoff

## Start here

Use the latest **Long_Century_Construction.zip** as the code baseline. Extract it and work from the directory containing build.py. The archive has the game source in src/, the build script and module manifest, tests and a save fixture, plus dist/long-century.html for offline play. Edit src/ and regenerate the HTML.

```sh
python3 build.py
node test_history.js
node test_works_planner.js
```

The design is an original mobile-first historical grand strategy game covering 1836–1936. Treat the overhaul plan as design intent and the current source and tests as the authority on implemented behavior. Keep the direct mobile construction flow and preserve older saves, standing orders and cumulative campaign records.

## Implemented and verified to date

| Area | Current implementation |
|---|---|
| Mobile construction | Works has a province picker, project filters, costs, and one-tap orders for provincial buildings, railways and factories. Provincial buildings queue when their slots are full. Active works and funding records are visible. |
| Queue correctness | Move and remove target persistent project IDs with stale-command validation. There is a migration for legacy queue entries. |
| Economy | Provincial household markets, land and employer accounts, trade allocation, and material-based construction spending with a funding ledger. Bilateral freight is accounted for. Broader pooled commodity settlement is still open. |
| Diplomacy and history | Historical event branches, diplomatic crises and settlements, subject agreements, and East India Company administration through Britain with separate fiscal accounting and a Crown transition. A standalone Company campaign is still open. |
| Campaign play | Annual cabinet reports, agendas, decisions, save migration, and configurable pauses for war, default, project or agenda completion, and annual reports. Enabling report reminders also opens reports during manual advancement. |

The construction checkpoint passed the history and campaign regression suite and the new Works planner test. The earlier Wider Rollout checkpoint reached January 1936 on eight AI seeds. Eight opening-decade scripted player branches across Britain, France, Punjab and Japan verified construction completion and annual reporting on that earlier build. These checks do not substitute for a physical Android portrait playthrough.

## Performance checkpoint

See `CHECKPOINT.md` for work orders and `validation/` for measured results. The engine now uses indexed technology unlocks and province lists in the economy. V2 saves use lossless compression after the engine applies consistent household precision. V1 imports still load. Works payment history rolls up by year with payer, account and material totals preserved.

| Sign-off | Status |
|---|---|
| Full-century size | Four Swiss campaigns reached January 1936 with save payloads below 1 MB. |
| Replay | Seed 7 produced the same final state digest in repeat runs. |
| Browser and Android | Desktop Chrome passed on branch `claude/release-gate`: 87–90 ms per late-game month against 130 ms, four full saves fit, and portrait pages and Works taps passed at 360/390 px. End month now paints before writing the autosave. Firefox, the Claude web view and the construction-payment screen still need a phone. See `validation/results/BROWSER_GATE.md`. |
| Next implementation | Phase 2 still needs a measured shared economy and historical unification gates after browser performance sign-off. |

## Open work in priority order

1. Verify Works and reminder settings on Android. Try consecutive orders, queued work, cancellation, save/reload, and opening the annual report.
2. Trace the missing early buyers for wool and rubber and the absence of canned-goods production. Measure supply, gross orders, deliveries and price before tuning.
3. Trace why most ordinary declarations bypass congresses. Test eligibility and settlement separately. Re-run full centuries and measure state losses.
4. Improve quiet opening decades through meaningful actions in cabinet reports. Investigate French industrial development and debt/default behavior after market and diplomacy changes.

The earlier balance audit found 45–59 wars against a 30–45 target, 1–6 congresses against 5–10, and no seed meeting all nine 1900 factory targets together. The updated queue fix has shipped. The broader balance remedies are still open.

## Android Works check

1. In portrait, open Works and choose a province. Place two consecutive orders from the planner.
2. Fill the active construction slots, add a project to the queue, move it, then cancel it.
3. Save to a slot and reload. Check that the active orders and queue still match what you left.
4. Advance through December and open the cabinet report. Check the completed works and the yearly payments under Works → Funding.
5. Repeat in Firefox and the Claude web view at your usual text size.

## Collaboration

Use a private Git repository as the shared source of truth. Commit the extracted source and this handoff on main. Start each task from the latest main commit. Give Claude and Codex separate branches for their work, run the tests before merging, and update this handoff with what changed and what still needs verification. If an assistant cannot access the repo from its current session, give it a ZIP of a named commit or apply its patch locally. When handing off by ZIP, upload the source archive and this note to the other assistant.

- [Source archive](https://chatgpt.com/library?file_id=libfile_e89b38f55bd881918489423f4941e87b&account_id=personal)
- [Mobile overhaul plan](https://chatgpt.com/library?file_id=libfile_df9a1f542578819184872eea601cdb05&account_id=personal)
- [Campaign balance audit](https://chatgpt.com/library?file_id=libfile_d32b5a0ee4d88191bdb991f1a3a8d9a2&account_id=personal)
- [Playtest and repair plan](https://chatgpt.com/library?file_id=libfile_42ba33c2bf448191bf3561c8cb1d27d4&account_id=personal)
