# LOOP-004: Add persisted iterations and feedback bundles

- Priority: P0
- Status: Planned
- Milestone: 1 — Working feedback loop
- Depends on: LOOP-003

## Outcome

Attempts are first-class persisted iterations, and each actor invocation receives structured feedback derived from the preceding verifier evidence.

## Acceptance criteria

- Iterations persist sequence, start reason, actor lifecycle, repository states, verifier results, decision, and budgets.
- Feedback includes normalized failures, artifact references, prior changed files, diff summary, unresolved failures, and remaining budgets.
- Feedback size is bounded without losing links to full evidence.
- Reloaded history explains exactly why each iteration started.
- Agent conversation is not required to reconstruct the run.
