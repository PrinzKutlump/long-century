# The Long Century · Performance checkpoint

| Order | Result |
|---|---|
| G0.1 | Imported the exact construction baseline on local Git `main`. The implementation branch and its history are included in the source package. |
| G0.2 | Added `node run_tests.js`. Older tests now load the full engine manifest. Corrected the sphere-tariff assertion to use the rates applied during settlement and reset the prior AI reform in the Meiji fixture. |
| G0.3 | Added `node century.js <seed> [player]`, with decade timings, save size, heap, major powers, prices, wars, state losses, formations and final state digest. |
| G0.4 | Added `python3 wrap_test.py --months 24 --screenshots screenshots`. Chromium could not launch in this workspace because its process socket was denied. Wrapped screenshots, portrait layout and device storage remain unverified. |
| G1.1 | Replaced repeated scans of researched technologies and province ownership in the economy. Summarized construction payments by year, payer and account. Browser autosave uses native asynchronous compression where available. |
| G1.3 | Desktop Chrome release gate passed (`validation/results/BROWSER_GATE.md`). Late-game End month takes 87–90 ms on average from tap to frame, against 130 ms. An autosave and three slots of the largest 1934 save fit, with 1.6M characters left. Portrait 360/390 px at 100%/125% text and the tapped Works checklist passed. Firefox and the Claude web view remain device checks. |
| G1.2 | Added compressed V2 saves, migration for V1 saves and yearly migration of construction payments. Household simulation values round consistently each turn. Save encoding preserves the resulting state exactly, including treasury and project balances. |

Open `dist/long-century.html` to play the checkpoint offline. To restore Git history, run `git clone -b implementation Long_Century_History.bundle Long_Century`. Build with `python3 build.py`. Node 24 and Python Playwright with desktop Chromium reproduce the checks. The game itself is self-contained.

The century figures in `validation/` separate simulation time from encoding time. Late-game save payloads meet the size target in all four completed updated runs. Desktop browser timing and quota are signed off. Firefox and Claude web view checks, rule parity, unification gates, balance, event expansion and later phases.
