# Public repository settings

Apply these settings as the repository owner. Use a pull request to change workflows.

- [ ] **Settings → Actions → General → Workflow permissions**. Select **Read repository contents and packages permissions**. Leave approval and creation of pull requests by Actions disabled. Save.
- [ ] **Settings → Actions → General → Approval for running fork pull request workflows from contributors**. Select **Require approval for all outside collaborators** and save.
- [ ] **Settings → Branches → Add classic branch protection rule**. Enter `main`. Require a pull request before merging and require status checks to pass.
  Select the GitHub Actions job checks `quick` and `full` after they have run on this PR. Leave force pushes disabled. Apply the rule to administrators too.
- [ ] **Settings → Advanced Security** (or **Code security and analysis**) **→ Secret Protection**. Enable secret scanning and push protection. Verify both show as enabled.
- [ ] **Settings → General → Features**. Clear **Wikis** and **Discussions**.
- [ ] **Settings → Moderation options → Interaction limits**. Choose **Limit to repository collaborators**, select six months and enable the limit. Record the expiry and renew every six months.

## Verify and record

After enabling the fork approval rule and before enabling the interaction limit, have an outside contributor open a harmless PR from a fork into main. A collaborator's own fork cannot verify this rule.
Check the PR's Actions panel for “approval required” with no runner started. Record the PR link and observation, then close the test PR and enable the interaction limit.
Confirm the settings on claims board #1 with the fork PR link and renewal date.

Geodata generation runs read-only. Its main-branch release job publishes the original ZIP, SOURCES.md and SHA256SUMS. For a tracked manifest update, copy the release's SOURCES.md to data/raw/geo/SOURCES.md on a topic branch and open a PR.
