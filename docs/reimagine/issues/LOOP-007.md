# LOOP-007: Implement runtime-owned loop decisions

- Priority: P0
- Status: Planned
- Milestone: 1 — Working feedback loop
- Depends on: LOOP-004, LOOP-005, LOOP-006

## Outcome

The runtime executes baseline verification, actor attempts, re-verification, feedback, and terminal decisions without delegating control to the agent.

## Acceptance criteria

- A passing baseline completes without invoking the actor.
- A failing baseline starts an actor iteration with verifier feedback.
- Every actor change is measured before re-verification.
- Fresh verifier success is required for `succeeded`.
- Iteration, turn, file, time, cancellation, policy, and no-progress outcomes are explicit.
- Exhaustion and interruption can never be reported as success.
