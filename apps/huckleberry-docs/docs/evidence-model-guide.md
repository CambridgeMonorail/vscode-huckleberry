---
sidebar_position: 5
---

# Evidence Model Guide

Huckleberry is built around inspectable evidence. A run is only useful if you can trace what happened from persisted artifacts and event history.

## Evidence Principles

- deterministic command output is evidence
- timeline events are evidence about state transitions
- summaries are derived from persisted events, not handwritten narratives
- agent explanations are recorded separately from objective artifacts

## Where Evidence Lives

Run artifacts are stored under:

```text
.huckleberry/runs/
```

Common artifacts include:

- per-step stdout logs
- per-step stderr logs
- per-step metadata
- run summary files
- run-level diff artifacts for isolated worktree runs

## Key Surfaces in VS Code

### Runs view

Use the `Runs` view to inspect:

- terminal run status
- step timeline entries
- approval decisions
- deep links to logs, Problems, tests, and diffs
- run summary access

### Evidence view

Use the `Evidence` view to inspect grouped artifacts by:

- run
- step
- artifact category

Missing or stale files are surfaced directly so broken evidence chains are visible.

## Claims vs Evidence

Agent steps can emit narrative summaries. Those are useful, but they are not treated as proof.

- `agentClaim`: what the agent says it changed or concluded
- `stepResult` and stored artifacts: what the deterministic system captured

When a run matters, trust the artifacts first.

## Summary Files

Terminal runs generate summary artifacts in both machine-readable and human-readable forms.

These summaries capture:

- outcome and stop reason
- attempts by step
- key evidence references
- unresolved items

Use summaries to review a run quickly, then drill into artifacts if you need exact logs.

## Execution Context Metadata

Every run can include execution-context metadata such as:

- workspace mode or worktree mode
- working directory
- worktree path
- base ref

This matters when a run changed files and you need to know exactly where those changes happened.

## Deep Links

Failed or timed-out steps can expose direct navigation to:

- Problems
- Test Explorer
- stdout and stderr logs
- diff or patch artifacts

These links reduce the gap between a failed run and the underlying evidence.

## How to Review a Failed Run

1. Open the terminal run entry in `Runs`.
2. Read the stop reason and the failing step.
3. Open the step stderr and metadata artifacts.
4. Follow deep links to Problems, tests, or diffs when available.
5. If the run used worktree isolation, inspect the worktree path and run diff.
6. Only then evaluate the agent summary or approval notes.

## Related Guides

- [Quick Start](./quick-start.md)
- [Workflow Authoring Guide](./workflow-authoring-guide.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
