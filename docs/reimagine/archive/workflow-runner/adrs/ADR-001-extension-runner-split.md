# ADR-001: Separate VS Code Extension Shell and Local Runner

- Status: Proposed
- Date: 2026-07-18
- Decision Owners: TBD
- Related Tasks: RIM-002, RIM-301, RIM-302
- Supersedes: None
- Superseded By: None

## Context

huckleberry workflows include long-running command execution, retries, cancellation, and persistence requirements. The VS Code extension host is optimized for interactive editor experiences, not durable orchestration.

## Decision

Use a two-process architecture:
- VS Code extension handles UX, commands, views, notifications, and integration points.
- Local runner process handles parsing, state-machine execution, subprocesses, persistence, and orchestration.

Communication occurs through an explicit IPC contract.

## Options Considered

### Option A: Run everything in extension host
- Summary: Keep execution and UI in a single process.
- Pros: Simpler startup and fewer moving parts.
- Cons: Higher risk of UI contention, weaker durability, harder recovery model.

### Option B: Split extension and runner (chosen)
- Summary: Keep UX and orchestration separated by process boundary.
- Pros: Better durability, clearer responsibilities, easier testability for engine.
- Cons: IPC complexity and lifecycle management overhead.

## Consequences

### Positive
- Clear separation of concerns.
- Better resilience for long-running operations.
- Easier unit/integration testing around runner logic.

### Negative
- Need robust runner lifecycle management.
- Need versioned protocol compatibility.

### Neutral
- Adds one more deployable/runtime component within extension package.

## Implementation Notes

- Scope boundaries: no business logic in extension activation handlers.
- Migration notes: introduce runner in command-only stage first.
- Testing impact: add protocol contract tests and reconnect tests.
- Documentation impact: architecture diagram and troubleshooting updates required.

## Validation

- Extension remains responsive during long command runs.
- Runs survive UI refresh/reload through persisted state and reconnect.

## Follow-up Tasks

- [ ] RIM-301
- [ ] RIM-302
- [ ] RIM-304
