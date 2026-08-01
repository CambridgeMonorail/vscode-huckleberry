# LOOP-005: Measure and enforce per-iteration repository deltas

- Priority: P0
- Status: Planned
- Milestone: 1 — Working feedback loop
- Depends on: LOOP-003

## Outcome

Huckleberry independently measures what an actor changed and enforces scope before accepting the attempt or running further actions.

## Acceptance criteria

- Repository state is captured before and after every actor invocation.
- Changed, added, deleted, renamed, and untracked files are identified from Git state.
- Allowed paths and maximum-file limits are evaluated against the measured delta.
- Violations produce persisted policy evidence and a safe stop or approval state.
- Tests prove an adapter cannot hide an out-of-scope change by omitting it from its result.
