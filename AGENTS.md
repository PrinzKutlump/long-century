# Working on The Long Century

Order of work: [docs/PLAN_1_0.md](docs/PLAN_1_0.md) (27 Nov 2026, ledger B59). Take the first Ready ticket labelled `for:codex` in the lowest open milestone (`M0` first), p1 before p2. Before new work, read the latest morning report on the Night report issue (#167) and fix red night jobs first. Review AI Studio PRs that touch `src/` against their acceptance checks (APPROVE or numbered CHANGES). [EXECUTION_STRATEGY](docs/EXECUTION_STRATEGY.md) is history for acceptance evidence only.

Coordination: follow [docs/COORDINATION.md](docs/COORDINATION.md). Session start: read the board (issue #1, generated), `python3 tools/ledger.py --open`, record any new owner ask (Owner request issue, or `docs/inbox/`), then resume your claim or claim the first Ready ticket you can do by commenting `/claim <agent> t/<id>-<slug>` on it. A PR needs `Closes #<ticket>` and `Ledger: <id>` (CI job `coord`). At session end, comment on the ticket what is done and what is left.

Follow the shared repository instructions in [CLAUDE.md](CLAUDE.md). Feature ledger: run `python3 tools/ledger.py --open` first; see CLAUDE.md. New implementer: read [docs/CODEX_START.md](docs/CODEX_START.md) first.

Roles and direction: see the top of [CLAUDE.md](CLAUDE.md) (owner decisions of 27 Nov 2026, ledger B20 and B21). Any agent may implement; every agent, Google AI Studio included, works on a `t/` branch and opens a PR, never pushing to `main`. Take tickets from issues labelled `ticket`; claim on the public claims board first.

No credentials or personal details in code, issues or PRs. Raw Correlates of War files never go into the public repository (docs/MASTER_PLAN.md §1 rule 11).
