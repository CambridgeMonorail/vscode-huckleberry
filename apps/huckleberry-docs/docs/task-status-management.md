---
sidebar_position: 14
---

# Run Status Management

This guide explains run lifecycle states, how to inspect status, and how to handle approval-gate decisions.

## Run Status Basics

Runs transition through explicit lifecycle states:

- `queued`
- `running`
- `paused`
- `succeeded`
- `failed`
- `cancelled`
- `exhausted`

Terminal states are `succeeded`, `failed`, `cancelled`, and `exhausted`.

## Checking Run Status

Use the Runs view or command actions:

```text
Get Run Status
Open Run Summary
```

In chat, you can ask:

```text
@Huckleberry Get run status for run_123
@Huckleberry Open run summary for run_123
```

## Approval State Handling

When a run pauses for approval:

1. Open the paused run from Runs.
2. Use `Submit Approval Decision`.
3. Choose one:
   - Approve
   - Reject
   - Defer
4. Optionally add an auditable note.

Chat examples:

```text
@Huckleberry Submit approval decision for run_123 as approve
@Huckleberry Submit approval decision for run_123 as reject with note "failing policy check"
@Huckleberry Submit approval decision for run_123 as defer
```

## Cancellation

For active runs:

- Use `Cancel Run` from the Runs view or command palette.
- Confirm status changes to `cancelled` and inspect summary/evidence for context.

## Status Investigation Workflow

When diagnosing a non-success outcome:

1. Check run status.
2. Open run summary.
3. Open step evidence (stdout/stderr/metadata).
4. Follow timeline deep links for diagnostics/tests/diffs/logs.

This keeps decisions evidence-based rather than memory-based.

## Isolation Context Visibility

For worktree runs, inspect status together with execution context:

- `Open Worktree Location`
- `Inspect Branch Status`

These actions help confirm where execution occurred and what branch context applied.

## Legacy Note

This page replaces earlier task-status guidance. On the workflow-first branch, status management refers to run lifecycle and approval decisions, not task CRUD state.

## Related Guides

- [Usage](./usage.md)
- [Workflow Storage](./task-storage.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
