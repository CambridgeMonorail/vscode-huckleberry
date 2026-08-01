# LOOP-002: Prove and select an executable coding-agent runtime

- Priority: P0
- Status: Ready
- Milestone: 0 — Contract and feasibility
- Depends on: LOOP-001

## Problem

The existing Copilot adapter can request text but cannot edit repository files, and the child runner has no registered adapter. The product cannot be designed honestly until a viable coding actor and process boundary are proven.

## Scope

- Evaluate the smallest viable options: a VS Code extension-host tool loop, Copilot SDK integration, and an external CLI adapter where available.
- Build disposable spikes against a fixture repository.
- Prove file inspection, file editing, cancellation, bounded turns, error propagation, and usable lifecycle reporting.
- Record an ADR selecting the MVP provider and execution boundary.
- Document authentication, platform, licensing, preview-API, and packaging constraints.

## Acceptance criteria

- At least one spike edits a fixture file through the same architectural boundary that a packaged extension can use.
- Cancellation reaches an active invocation.
- The runtime can associate an invocation with a run and iteration ID.
- Failure and unavailability are distinguishable.
- The ADR explains rejected options and known limitations.

## Out of scope

- Production loop orchestration.
- Multiple providers.
- Final schema-v2 design.

## Validation relationship

This spike may run alongside `LOOP-000`, but its success proves only that the actor boundary is feasible. Production implementation proceeds only when the Gate A problem evidence also supports the TypeScript repair use case.
