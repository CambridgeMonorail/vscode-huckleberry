# Local Extension Testing Playbook

This playbook defines a reviewable manual test flow for the extension in Extension Development Host.

The key rule is simple: every section writes artifacts into test-workspace so results can be reviewed outside the debug host.

Canonical source (complete background guidance):

- `docs/reimagine/10 Local Extension Testing Playbook.md`

Debug host operator checklist (open this from the test workspace window):

- `test-workspace/DEBUG-HOST-TEST-CHECKLIST.md`

## Goal

Use this document to:

1. Launch the extension from source.
2. Run manual checks in Extension Development Host.
3. Persist evidence in test-workspace for asynchronous review.

## Evidence Contract

Create one run folder per session under test-workspace:

```text
test-workspace/_debug-evidence/<RUN_ID>/
```

Use a timestamp-like run id, for example:

```text
2026-07-26-run-01
```

Create this structure at the start of each run:

```text
test-workspace/_debug-evidence/<RUN_ID>/
|- 00-meta/
|- 01-activation/
|- 02-loop-discovery/
|- 03-run-success/
|- 04-run-failure/
|- 05-run-cancel/
|- 06-approval-gate/
|- 07-vsix/
|- 99-summary/
```

Minimum file format for every section:

```text
notes.md
```

Use this template inside each section notes file:

```md
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
```

## Step 0: Preflight From Repository Root

Run:

```sh
pnpm validate:affected
pnpm run test:extension
pnpm run build:package:extension
```

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/00-meta/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/00-meta/command-output.txt`

Record exact command output and exit codes.

## Step 1: Launch Debug Extension Host

In VS Code:

1. Open Run and Debug.
2. Start `Debug Extension`.
3. Confirm launched workspace is `test-workspace`.
4. Open `DEBUG-HOST-TEST-CHECKLIST.md` from the test workspace and execute the remaining manual steps from there.

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/01-activation/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/01-activation/running-extensions.txt`
3. `test-workspace/_debug-evidence/<RUN_ID>/01-activation/extension-host-log.txt`

Acceptance:

1. Huckleberry appears in Running Extensions.
2. No activation crash in Extension Host logs.

## Step 2: Prepare Loop Fixtures In test-workspace

Create loop files under:

```text
test-workspace/.huckleberry/loops/
```

Create `smoke-success.yaml`:

```yaml
schemaVersion: 1
id: smoke-success
name: Smoke Success
steps:
	- id: success-step
		type: command
		command: node -e "console.log('success step ok'); process.exit(0)"
```

Create `smoke-fail.yaml`:

```yaml
schemaVersion: 1
id: smoke-fail
name: Smoke Fail
steps:
	- id: fail-step
		type: command
		command: node -e "console.error('intentional failure'); process.exit(2)"
```

Create `smoke-cancel.yaml`:

```yaml
schemaVersion: 1
id: smoke-cancel
name: Smoke Cancel
steps:
	- id: wait-step
		type: command
		command: node -e "setTimeout(() => { console.log('finished wait'); process.exit(0); }, 30000)"
```

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/02-loop-discovery/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/02-loop-discovery/loops-list.txt`

Acceptance:

1. All three loops are visible in Loops UI.
2. No schema validation error for the fixtures.

## Step 3: Success Path Run

Run `smoke-success` from the debug host.

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/03-run-success/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/03-run-success/timeline.txt`
3. `test-workspace/_debug-evidence/<RUN_ID>/03-run-success/evidence.txt`

Acceptance:

1. Run reaches terminal success.
2. Stdout and exit code are visible in run evidence.

## Step 4: Failure Path Run

Run `smoke-fail` from the debug host.

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/04-run-failure/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/04-run-failure/timeline.txt`
3. `test-workspace/_debug-evidence/<RUN_ID>/04-run-failure/evidence.txt`

Acceptance:

1. Run reaches terminal failure.
2. Stderr and non-zero exit code are visible.

## Step 5: Cancellation Path Run

Run `smoke-cancel`, then cancel before 30 seconds completes.

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/05-run-cancel/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/05-run-cancel/timeline.txt`
3. `test-workspace/_debug-evidence/<RUN_ID>/05-run-cancel/evidence.txt`

Acceptance:

1. Cancellation is reflected in terminal state.
2. Timeline includes explicit cancel/stop semantics.

## Step 6: Approval Gate Path (When Applicable)

If the target branch includes approval steps, execute one approval-gated loop.

Run three variants where available:

1. Approve path.
2. Reject path.
3. Defer path.

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/06-approval-gate/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/06-approval-gate/timeline.txt`
3. `test-workspace/_debug-evidence/<RUN_ID>/06-approval-gate/decision-log.txt`

Acceptance:

1. Run pauses awaiting decision.
2. Decision action resumes to expected branch target.
3. Decision metadata is visible in timeline/evidence.

## Step 7: VSIX Install Check In Clean Profile

Build package from repo root:

```sh
pnpm run build:package:extension
```

Install in a clean profile:

```sh
code --profile "Huckleberry Testing" --install-extension <path-to-vsix>
```

Repeat smoke-success and smoke-fail once in normal VS Code window using test-workspace.

Write artifacts:

1. `test-workspace/_debug-evidence/<RUN_ID>/07-vsix/notes.md`
2. `test-workspace/_debug-evidence/<RUN_ID>/07-vsix/install-output.txt`
3. `test-workspace/_debug-evidence/<RUN_ID>/07-vsix/smoke-results.txt`

Acceptance:

1. Installed VSIX behavior matches debug-host behavior for core flows.

## Step 8: Final Summary For Review

Create:

1. `test-workspace/_debug-evidence/<RUN_ID>/99-summary/summary.md`

Summary must include:

1. Run id and date.
2. PASS/FAIL per section (0 through 7).
3. Links/paths to the most relevant evidence files.
4. Open issues and repro notes.

## How Review Works

After you run the steps, share the run id.

I will review artifacts directly from:

```text
test-workspace/_debug-evidence/<RUN_ID>/
```

This avoids dependency on live access to Extension Development Host.

## Related Docs

- `docs/reimagine/10 Local Extension Testing Playbook.md`
- `docs/reimagine/09 Practical Validation Matrix.md`
- `docs/manual-testing.md`
