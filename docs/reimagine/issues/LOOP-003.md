# LOOP-003: Implement the extension/runner actor protocol

- Priority: P0
- Status: Planned
- Milestone: 0 — Contract and feasibility
- Depends on: LOOP-002

## Outcome

The child runner can request, observe, cancel, and receive the result of a real actor invocation through an explicit protocol compatible with the selected provider boundary.

## Acceptance criteria

- Actor requests contain run ID, iteration number, objective, working directory, allowed paths, feedback, and remaining budgets.
- Actor lifecycle events are persisted without treating claims as evidence.
- Cancellation and provider failures map to explicit run events.
- The packaged extension can execute the selected actor against a fixture.
- No adapter-reported changed-file list is treated as authoritative.
