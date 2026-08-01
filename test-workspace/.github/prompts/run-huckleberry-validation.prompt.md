---
description: Coordinate a Huckleberry debug-host validation run and record evidence
agent: agent
---

Run the Huckleberry validation procedure for `${input:runId:enter a unique run ID}`.

Before acting:

1. Read [the debug-host instructions](../../AGENTS.md).
2. Read [the workspace overview](../../README.md).
3. Read [the manual checklist](../../DEBUG-HOST-TEST-CHECKLIST.md).
4. Find and read the run-specific Markdown plan under `test-plans/`. If more than one is applicable, ask the user which plan to use.

Then:

- Verify fixture preconditions with file and terminal tools where possible.
- Create a new evidence directory for this run without overwriting earlier evidence.
- Work through the plan one check at a time.
- Run safe terminal or file checks yourself.
- For Activity Bar, Command Palette, notification, approval, cancellation, or other UI-only actions, give the human one precise action and wait for their observation.
- Attribute human-reported observations as `Human observation`.
- Save command output and artifact paths as `Machine evidence`.
- Mark each check `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`.
- Do not edit extension source or claim success based on your own prose.
- Produce the required final summary and tell the user exactly where it was saved.

If the extension is unavailable, authentication is missing, the plan is ambiguous, or a prerequisite fails, stop that check as `BLOCKED` and record the actionable reason.
