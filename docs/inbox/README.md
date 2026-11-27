# Inbox: owner requests waiting for intake

An agent that hears a new request from the owner but cannot open a GitHub issue (Google AI Studio) writes it here, one file per request: `docs/inbox/<yyyy-mm-dd>-<short-slug>.md`, with the date, the owner's words unchanged, and the tool that heard it.

The planner (Claude) turns each file into ledger rows and tickets and deletes the file in the same PR. `tools/coord.py audit` and the board list every file still waiting here. Rules: [docs/COORDINATION.md](../COORDINATION.md) §3.
