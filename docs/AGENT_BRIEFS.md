# Start briefs for Codex and AI Studio (copy and paste)

Written by Claude on 27 Nov 2026 (ledger B59) so the owner can start each agent without Claude. Paste the brief as the first message of a session. The plan is `docs/PLAN_1_0.md`.

## Codex (GPT): every session

```text
Repository PrinzKutlump/long-century. Read AGENTS.md and CLAUDE.md first.
1. Read the newest comment on the pinned "Night report" issue. If a night job is red, fix that first.
2. Open the board (issue #1). Take the first unclaimed ticket labelled for:codex in the lowest open milestone (M0, then M1...), p1 before p2. Comment "/claim codex t/<id>-<slug>" on it.
3. Work on that branch only. Run only the tests for files you touch. Open a PR with "Closes #<ticket>" and "Ledger: <id>", the state-hash before and after, and evidence for each acceptance check.
4. Then review any open AI Studio PR that touches src/: comment APPROVE or numbered CHANGES against its ticket.
5. End: comment on the ticket what is done, what is left, last commit, tests run. Keep under 40 tool calls per ticket.
```

## AI Studio (Gemini): every session

```text
Repository PrinzKutlump/long-century. Read CLAUDE.md, docs/PLAN_1_0.md section 2 and docs/ASSETS.md first.
You do research, writing and media only. Never edit engine files src/*.js.
1. Take the first unclaimed ticket labelled for:aistudio in the lowest open milestone. Comment "/claim aistudio t/<id>-<slug>".
2. Put your work in the files the ticket names (docs/, data files, art/, audio/). Every picture or track: licence (public domain or CC0) or the AI prompt you used, recorded in docs/ASSETS.md.
3. History: give a source for every date and event. Events must work under the same rules for every nation (no special code for one country).
4. Open a PR on a t/ branch with "Closes #<ticket>" and "Ledger: <id>". Never push to main.
5. Then review any open Codex PR for plain-English text and historical accuracy: APPROVE or numbered CHANGES.
```

## Claude: once a week

```text
Do the weekly review ticket (#166): milestone gates against docs/PLAN_1_0.md, spot-check merged PRs, ledger --check and coord audit, one comment.
```
