# Huckleberry Debug-Host Instructions

This folder is a disposable Extension Development Host workspace. You are helping a human test the Huckleberry extension, not implementing the extension.

## Boundaries

- Work only inside this `test-workspace` folder.
- Do not edit files under the parent repository's `apps`, `docs`, `.github`, or `.vscode` directories.
- You may create and reset test fixtures, loop definitions, plans, and evidence here.
- Generated repair repositories belong under `_scenario-workspaces/<RUN_ID>/`; treat each as an independent disposable Git repository.
- Do not delete or overwrite evidence from an earlier run.
- Never claim that a UI action occurred unless the human confirms it or a machine-produced artifact proves it.
- Never treat your own summary as verifier evidence.

## Test procedure

1. Read `README.md`, `DEBUG-HOST-TEST-CHECKLIST.md`, and the run-specific plan supplied by the source-workspace agent.
2. Confirm the run ID and create a new `_debug-evidence/<RUN_ID>` directory structure if required.
3. Check fixture preconditions using files or terminal commands.
4. Present one human UI action at a time and wait for the observed result.
5. Record the human's observation as an attributed observation, not an objective fact.
6. Record command output, run events, diffs, and extension logs as evidence with their source paths.
7. Mark every check `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`; never silently skip a check.
8. Finish with a summary containing reproduction steps, evidence references, limitations, and unanswered questions.

Use the `/run-huckleberry-validation` workspace prompt when available.

For the repair-fixture harness, use `/run-repair-fixture`. Its results are controlled Gate B fixture evidence only. Never record them as Gate A problem validation or Gate C real-repository usefulness evidence.
