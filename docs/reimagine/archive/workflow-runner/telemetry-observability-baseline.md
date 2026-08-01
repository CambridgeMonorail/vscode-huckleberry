# Telemetry and Observability Baseline

## Purpose
This baseline defines non-sensitive lifecycle telemetry for the huckleberry runner so support and debugging can inspect run behavior without collecting source content.

## Emitted Lifecycle Telemetry
Telemetry is emitted from runner lifecycle events and includes structured fields:

- `telemetryType`: fixed marker (`runner-lifecycle`)
- `runId`: unique run correlation identifier
- `loopId`: workflow identifier
- `status`: lifecycle status at event time
- `eventType`: lifecycle event name (for example `run-queued`, `step-started`, `step-failed`, `all-steps-succeeded`)
- `executionMode`: `workspace` or `worktree`
- `transitionFrom` / `transitionTo`: state transition correlation
- `stepId`: step correlation identifier when present
- `attempt`: retry or execution attempt number when present
- `stopReasonCode`: normalized terminal/failure reason code when present
- `terminal`: indicates terminal run status events
- `timestamp`: event timestamp used for ordering and correlation

## Structured Log Requirements
- Lifecycle telemetry logs MUST include run-level correlation (`runId`, `loopId`).
- Step lifecycle logs SHOULD include `stepId` and `attempt` when known.
- Failure and warning events MUST include `stopReasonCode` when available.
- Logs are intended for debugging workflows and runner health, not analytics productization.

## Privacy Boundaries
Included:
- Lifecycle metadata and normalized identifiers.
- Status transitions and stop reason codes.

Excluded:
- Source file contents.
- Prompt bodies.
- Command stdout/stderr content.
- Full filesystem path inventories.

## Retention Expectations
- Telemetry is written to extension debug output channels and local runtime logs.
- Historical run evidence and lifecycle events remain in `.huckleberry/runs` according to repository lifecycle and user cleanup behavior.
- No external telemetry transport is introduced by this baseline.

## Reviewability
- Telemetry schema and constraints are documented in this file.
- Runner lifecycle tests assert telemetry emission in representative success and failure paths.
