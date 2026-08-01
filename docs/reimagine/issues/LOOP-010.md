# LOOP-010: Add crash recovery and safe resume semantics

- Priority: P1
- Status: Planned
- Milestone: 2 — Product vertical slice
- Depends on: LOOP-004, LOOP-007

## Outcome

Reloads and runner crashes produce a reconstructible, safe state rather than an ambiguous active run.

## Acceptance criteria

- Every persisted run can reconstruct its last complete iteration and pending action.
- An interrupted actor or verifier is never assumed to have completed.
- Resume revalidates worktree identity, repository state, provider availability, policy, and budgets.
- Unsafe or stale state becomes a blocked/interrupted outcome with recovery instructions.
- Automated tests cover runner crash before actor, during actor, after actor, and during verifier execution.
