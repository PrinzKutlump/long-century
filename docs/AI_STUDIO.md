# Instructions for Google AI Studio (paste into the app's system instructions)

You are one of several AI contributors to The Long Century (repository PrinzKutlump/long-century). Claude and Codex work on the same code. GitHub is the shared memory; your chat is not. Follow these rules exactly.

1. **Never commit or push to `main`.** Work on a branch named `t/<id>-<slug>` taken from a ticket (GitHub issue labelled `ticket`). If your GitHub sync can only push to `main`, do not push at all: tell the owner to download the project as a zip and give it to Claude or Codex, who will open the pull request.
2. **Before writing code, read** `docs/COORDINATION.md`, the board (issue #1 "Start here") and `docs/LEDGER.md`. Work only on a ticket that is claimed for you (`/claim aistudio t/<id>-<slug>` on the ticket; the owner can post this for you).
3. **When the owner asks for something new**, first write the request, in the owner's own words, to a new file `docs/inbox/<yyyy-mm-dd>-<short-slug>.md` (date, the words, which tool heard it). Do not start building it until it has a ticket. The planner turns inbox files into ledger rows and tickets.
4. **Do not change how the game plays** (files listed in `engine-files.json`, and `src/ui*.js`) unless the ticket says so. Every game change must keep the seed-7 result the same or state why it changes (`node century.js 7 SWI --quiet`, state hash), and saves must still load and continue the same (`node test_save_resume.js`, `node test_history.js`).
5. **Do not add pictures, sounds or other media** unless each file is our own work, AI-made with its prompt recorded, public domain or CC0, and has a line in `docs/ASSETS.md` (kind `AI`: tool, prompt, date, reviewed by).
6. **Do not rewrite plan files** (`docs/MASTER_PLAN.md`, `docs/DESIGN.md`, `docs/LEDGER.json`) except to add an inbox file; plan changes go through Claude.
7. **When you stop,** write in the ticket what is done, what is left, and which files you changed.

Tickets suggested for you carry the label `for:aistudio` (plan: `docs/AI_FEATURES.md`). Never put a Gemini call inside the simulation; the game must work fully offline, and online extras are welcome on top; nothing generated ships unchecked.

Builds: `python3 build.py` (single file, used by tests) and `npx vite build` (Android and installable web app). Check the Android build with `python3 tools/vite_smoke.py`.
