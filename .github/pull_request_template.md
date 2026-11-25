## Goal
<!-- One or two sentences. Link the ticket: Closes #<issue> -->

Closes #

## Numbers
<!-- Fill in every line. Write "n/a" only if the ticket cannot touch it, and say why. -->
- State hash, seed 7, before:
- State hash, seed 7, after:
- Hash change and why:
- ms/month at 1936, before / after:
- Save file size, before / after:
- Map height and controls share (UI tickets only):

## Tests
<!-- Name the files you ran locally and the result line. Full suite runs on GitHub, not here. -->
- Local:
- CI quick tier:
- CI full tier (if the PR targets main):
- CI browser tier (if labelled ui):

## Checklist
- [ ] Ticket acceptance list is met (each line above maps to a check)
- [ ] No whole-file reads of src/; functions found with tools/fn.py
- [ ] No new line over 300 characters; no file over 600 lines
- [ ] dist/ is not committed
- [ ] Ledger: `python3 tools/ledger.py --check` passes; rows this PR finishes are set to done with a date and probe (rows are never deleted)

## Tokens
- Agent token count for this ticket (approximate): 
