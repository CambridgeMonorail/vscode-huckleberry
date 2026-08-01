# LOOP-011: Validate the packaged loop end to end

- Priority: P0
- Status: Planned
- Milestone: 2 — Product vertical slice
- Depends on: LOOP-000, LOOP-008, LOOP-009, LOOP-010

## Outcome

Recorded evidence demonstrates that the product promise works through the packaged extension on representative repositories.

## Acceptance criteria

- A repairable fixture fails baseline typecheck and passes after no more than three actor attempts.
- An unrepairable fixture exhausts without false success.
- An out-of-scope-edit fixture proves independent policy enforcement.
- Cancellation and reload recovery are manually validated in the Extension Development Host or an installed VSIX.
- Gate B passes on the packaged-extension safety fixtures defined in `VALIDATION.md`.
- At least ten paired or closely matched trials are recorded across at least three non-fixture TypeScript repositories.
- Results record verified completion, active intervention time, manual feedback interactions, elapsed time, iteration count, terminal reason, preference, and provider limitations.
- A Gate C continue, change, pivot, or stop decision is recorded against the predeclared thresholds.
- The capability gap and release documentation are updated from observed evidence.
