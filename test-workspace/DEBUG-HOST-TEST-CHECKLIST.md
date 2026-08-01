# Extension Host Test Checklist

> This checklist validates the existing deterministic runner substrate. It does not by itself prove that the product is useful or that a real coding-agent feedback loop works. Run-specific `LOOP-*` plans should extend it and use the gates in `docs/reimagine/VALIDATION.md`.

Use this checklist from inside the Extension Development Host window.

For an agent-assisted session, invoke `/run-huckleberry-validation` in Copilot Chat after the debug host opens. Copilot coordinates the checklist, but the human performs and confirms UI-only actions.

Purpose:
- Run the manual validation steps without switching back to the source workspace docs.
- Write all evidence into the run folder so review can happen outside the debug host.

## Before You Start

1. Choose a run id, for example: 2026-07-26-run-03.
2. Confirm this folder exists:
   test-workspace/_debug-evidence/<RUN_ID>/
3. Confirm these section folders exist:
   - 00-meta
   - 01-activation
   - 02-loop-discovery
   - 03-run-success
   - 04-run-failure
   - 05-run-cancel
   - 06-approval-gate
   - 07-vsix
   - 99-summary

## Step 1: Activation Checks (inside debug host)

Actions:
1. Open Command Palette.
2. Run: Developer: Show Running Extensions.
3. Confirm Huckleberry is listed and active.
4. Open View -> Output -> Log (Extension Host).
5. Confirm no activation crash/error.

Write evidence:
- test-workspace/_debug-evidence/<RUN_ID>/01-activation/running-extensions.txt
- test-workspace/_debug-evidence/<RUN_ID>/01-activation/extension-host-log.txt
- test-workspace/_debug-evidence/<RUN_ID>/01-activation/notes.md

Pass criteria:
- Huckleberry appears in Running Extensions.
- No activation crash in extension host log.

## Step 2: Loop Discovery Checks

Fixture loop files should exist in:
- test-workspace/.huckleberry/loops/

Expected fixtures:
- smoke-success.yaml
- smoke-fail.yaml
- smoke-cancel.yaml

Actions:
1. Open the Loops view in the extension UI.
2. Confirm all three smoke loops are visible.
3. Confirm no schema validation error for those files.

Write evidence:
- test-workspace/_debug-evidence/<RUN_ID>/02-loop-discovery/loops-list.txt
- test-workspace/_debug-evidence/<RUN_ID>/02-loop-discovery/notes.md

Pass criteria:
- All fixtures visible.
- No schema errors.

## Step 3: Success Run

Actions:
1. Run smoke-success.
2. Wait for terminal success state.
3. Capture timeline and evidence entries.

Write evidence:
- test-workspace/_debug-evidence/<RUN_ID>/03-run-success/timeline.txt
- test-workspace/_debug-evidence/<RUN_ID>/03-run-success/evidence.txt
- test-workspace/_debug-evidence/<RUN_ID>/03-run-success/notes.md

Pass criteria:
- Terminal success status.
- Stdout and exit code visible.

## Step 4: Failure Run

Actions:
1. Run smoke-fail.
2. Wait for terminal failure state.
3. Capture timeline and evidence entries.

Write evidence:
- test-workspace/_debug-evidence/<RUN_ID>/04-run-failure/timeline.txt
- test-workspace/_debug-evidence/<RUN_ID>/04-run-failure/evidence.txt
- test-workspace/_debug-evidence/<RUN_ID>/04-run-failure/notes.md

Pass criteria:
- Terminal failure status.
- Stderr and non-zero exit code visible.

## Step 5: Cancellation Run

Actions:
1. Run smoke-cancel.
2. Cancel before 30 seconds completes.
3. Capture timeline and evidence entries.

Write evidence:
- test-workspace/_debug-evidence/<RUN_ID>/05-run-cancel/timeline.txt
- test-workspace/_debug-evidence/<RUN_ID>/05-run-cancel/evidence.txt
- test-workspace/_debug-evidence/<RUN_ID>/05-run-cancel/notes.md

Pass criteria:
- Cancellation reflected in terminal state.
- Timeline includes explicit cancel/stop semantics.

## Step 6: Approval Gate (when applicable)

Actions:
1. Run one approval-gated loop.
2. Execute approve path.
3. Execute reject path.
4. Execute defer path.

Write evidence:
- test-workspace/_debug-evidence/<RUN_ID>/06-approval-gate/timeline.txt
- test-workspace/_debug-evidence/<RUN_ID>/06-approval-gate/decision-log.txt
- test-workspace/_debug-evidence/<RUN_ID>/06-approval-gate/notes.md

Pass criteria:
- Run pauses awaiting decision.
- Decision resumes expected branch target.
- Decision metadata visible.

## Step 7: VSIX Check (normal VS Code window)

Actions:
1. Install VSIX in clean profile.
2. Run smoke-success and smoke-fail once.

Write evidence:
- test-workspace/_debug-evidence/<RUN_ID>/07-vsix/install-output.txt
- test-workspace/_debug-evidence/<RUN_ID>/07-vsix/smoke-results.txt
- test-workspace/_debug-evidence/<RUN_ID>/07-vsix/notes.md

Pass criteria:
- VSIX behavior matches debug host behavior for core flows.

## Step 8: Final Summary

Update:
- test-workspace/_debug-evidence/<RUN_ID>/99-summary/summary.md

Summary must include:
1. Run id and date.
2. PASS/FAIL for sections 0 through 7.
3. Key evidence paths.
4. Open issues and repro notes.

## Notes Template

Paste this into each section notes.md if needed:

# <section>

## Actions Performed
- ...

## Observed Result
- ...

## Expected Result
- ...

## Pass/Fail
- PASS | FAIL

## Follow-ups
- ...
