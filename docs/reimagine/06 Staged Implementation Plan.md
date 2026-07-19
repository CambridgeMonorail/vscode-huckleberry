# huckleberry Reimagination: Staged Implementation Plan

## Purpose

This plan converts the reimagination docs into a delivery sequence with discrete, testable tasks.

Primary goals:
- Replace task-manager behavior with evidence-driven workflow orchestration.
- Keep existing extension infrastructure (Nx, packaging, testing, VS Code integration).
- Deliver value in vertical slices with bounded risk.

## Stage Overview

| Stage | Name | Outcome |
| --- | --- | --- |
| 0 | Program Setup | Scope, architecture baseline, migration branch, execution guardrails |
| 1 | Shell Conversion | Existing extension becomes a clean huckleberry shell |
| 2 | Workflow Discovery | `.huckleberry/loops` discovery and schema validation in UI |
| 3 | Runner v1 (Command-Only) | Executable deterministic loop engine with persistence |
| 4 | Agent Repair Steps | Bounded AI repair nodes integrated behind adapter boundary |
| 5 | Approval + Evidence UX | Human gates and inspectable evidence timeline |
| 6 | Worktree Isolation | Safe isolated execution path for riskier runs |
| 7 | Quality + Release | Hardening, docs, telemetry, and release readiness |

## Progress Snapshot

Last updated: 2026-07-19

- Completed: Stage 0 (RIM-001 through RIM-004)
- Completed: Stage 1 (RIM-101 through RIM-105)
- Completed: Stage 2 (RIM-201 through RIM-205)
- In progress next: Stage 3 starting with RIM-301 (runner process and IPC contract)
- Tracking source of truth: `docs/reimagine/07 Implementation Tracker.md`

## Cross-Cutting Rules

- Do not ship a stage until acceptance criteria are met.
- Keep all workflow definitions in repository files.
- Keep agent provider integration behind `AgentAdapter`.
- Avoid adding features that bypass evidence or stopping conditions.
- Every stage must include tests and documentation updates.

## Stage 0: Program Setup

### Objective
Establish delivery foundations and guardrails before product conversion.

### Tasks

1. RIM-001: Create migration branch and lock initial scope
- Deliverable: branch `feat/huckleberry-reimagination` and tracked stage scope in docs.
- Acceptance: scope, non-goals, and stage gates documented.

2. RIM-002: Record architecture decision log (ADRs)
- Deliverable: initial ADRs for extension/runner split, persistence strategy, and agent boundary.
- Acceptance: at least 3 ADRs merged and referenced by later tasks.

3. RIM-003: Define run-state vocabulary and terminal statuses
- Deliverable: canonical status model (`queued/running/paused/succeeded/failed/cancelled/exhausted`).
- Acceptance: model is used by both extension and runner contracts.

4. RIM-004: Add implementation tracker doc
- Deliverable: backlog table with owner/status/dependency fields.
- Acceptance: all task IDs in this plan appear in tracker.

### Exit Criteria
- Scope and architecture are unambiguous.
- Team can execute tasks without re-deciding foundations.

## Stage 1: Shell Conversion

### Objective
Convert Huckleberry Task Manager into a minimal huckleberry extension shell.

### Tasks

1. RIM-101: Rename user-facing product surfaces
- Deliverable: name, display labels, view titles, and command descriptions updated.
- Acceptance: no user-facing references to old task-manager product.

2. RIM-102: Remove task-domain commands and providers
- Deliverable: deprecated task commands, handlers, and UI items removed.
- Acceptance: extension activates with no missing command/provider registrations.

3. RIM-103: Introduce new view containers
- Deliverable: `Loops` and `Runs` views in Activity Bar container.
- Acceptance: empty-state views render and refresh.

4. RIM-104: Refactor activation entrypoint into composition root
- Deliverable: activation broken into service registration modules.
- Acceptance: `extension.ts` only composes and registers modules.

5. RIM-105: Preserve packaging and baseline tests
- Deliverable: extension builds/tests/packages under new shell.
- Acceptance: CI baseline green for build/lint/test/package paths.

### Exit Criteria
- Minimal shell works end-to-end with no task-manager logic left in active runtime path.

## Stage 2: Workflow Discovery

### Objective
Discover, parse, validate, and display workflow definitions from repo files.

### Tasks

1. RIM-201: Define workflow schema v1
- Deliverable: JSON Schema + TypeScript types for workflow model.
- Acceptance: schema validation catches malformed IDs, steps, and references.

2. RIM-202: Add `.huckleberry/loops` discovery service
- Deliverable: file scanner + watcher for workflow files.
- Acceptance: add/edit/delete loop files reflected in UI.

3. RIM-203: Build workflow validator service
- Deliverable: validation pipeline for schema + semantic checks.
- Acceptance: semantic errors (missing step refs, cycles if unsupported) are surfaced clearly.

4. RIM-204: Implement `LoopExplorerProvider`
- Deliverable: loops list with health/status badges (valid/invalid).
- Acceptance: clicking a loop opens definition and validation summary.

5. RIM-205: Add starter workflow templates
- Deliverable: command to scaffold baseline workflows (`typecheck`, `test`, `lint`).
- Acceptance: generated files validate successfully.

### Exit Criteria
- Users can discover workflows confidently and understand errors before execution.

## Stage 3: Runner v1 (Command-Only)

### Objective
Deliver first executable workflow engine for deterministic command steps.

### Tasks

1. RIM-301: Implement runner process and IPC contract
- Deliverable: extension-runner protocol for start/status/cancel/events.
- Acceptance: extension can start and monitor a run without blocking UI.

2. RIM-302: Implement state-machine engine
- Deliverable: sequential execution, condition branching, retries, timeout handling.
- Acceptance: state transitions are deterministic and replayable from event log.

3. RIM-303: Add command step executor
- Deliverable: subprocess execution with stdout/stderr capture and exit codes.
- Acceptance: outputs persisted and linked to step evidence.

4. RIM-304: Persist runs/events/evidence metadata
- Deliverable: append-only run event store + index.
- Acceptance: runs can be restored and inspected after reload.

5. RIM-305: Build Runs UI timeline
- Deliverable: run list and step timeline with statuses and durations.
- Acceptance: user can inspect each step result and outputs.

6. RIM-306: Add cancellation and failure-stop reasons
- Deliverable: explicit stop reason model and user controls.
- Acceptance: every non-success stop has machine-readable + human-readable reason.

### Exit Criteria
- Command-only loops run reliably with complete evidence trail.

## Stage 4: Agent Repair Steps

### Objective
Add bounded AI repair nodes while keeping deterministic orchestration control.

### Tasks

1. RIM-401: Introduce `AgentAdapter` abstraction
- Deliverable: provider-neutral interface and runtime registration.
- Acceptance: command-only runs still work with adapter disabled.

2. RIM-402: Implement Copilot adapter (preview-safe)
- Deliverable: first provider integration using Copilot SDK boundary.
- Acceptance: adapter availability checks and graceful failure paths implemented.

3. RIM-403: Add agent step node type
- Deliverable: bounded prompts/goals, max turns, max files changed, allowed paths.
- Acceptance: out-of-scope changes or limit breaches stop run with clear reason.

4. RIM-404: Implement repair loop semantics
- Deliverable: failed deterministic check can trigger repair then re-check.
- Acceptance: retries honor configured max attempts and timeout budgets.

5. RIM-405: Capture agent claims separately from evidence
- Deliverable: run model separates agent narrative from objective artifacts.
- Acceptance: UI clearly distinguishes claim vs fact.

### Exit Criteria
- AI repair is useful but constrained; workflow engine remains source of control.

## Stage 5: Approval + Evidence UX

### Objective
Make evidence first-class and add explicit human decision points.

### Tasks

1. RIM-501: Implement approval gate step
- Deliverable: `approval` node with approve/reject/defer actions.
- Acceptance: paused runs resume only through explicit user action.

2. RIM-502: Build Evidence Explorer
- Deliverable: artifacts grouped by run/step/type (output, diff, screenshot, diagnostic).
- Acceptance: users can open evidence quickly and trace provenance.

3. RIM-503: Improve diagnostics and deep-link integration
- Deliverable: problems/tests/diffs linked from run timeline.
- Acceptance: failed steps can be navigated to root evidence in one action.

4. RIM-504: Add run summary report generation
- Deliverable: machine + human summary with outcome, attempts, and unresolved items.
- Acceptance: summary reproducibly reflects event log data.

### Exit Criteria
- Human judgement is explicit; run outcomes are inspectable and auditable.

## Stage 6: Worktree Isolation

### Objective
Support isolated execution for long-running or higher-risk workflows.

### Tasks

1. RIM-601: Implement worktree lifecycle service
- Deliverable: create/reuse/cleanup isolated worktrees per run policy.
- Acceptance: worktree setup/teardown works across repeat runs.

2. RIM-602: Route command and agent steps through isolation context
- Deliverable: execution context abstraction for workspace vs worktree mode.
- Acceptance: mode switching requires no workflow definition changes.

3. RIM-603: Add isolation visibility in UI
- Deliverable: run details show branch/worktree path and isolation status.
- Acceptance: users can inspect exactly where changes were made.

4. RIM-604: Add diff evidence for isolated runs
- Deliverable: run-level diff artifact and optional step-level snapshots.
- Acceptance: reviewers can inspect isolated changes without manual git setup.

### Exit Criteria
- Isolated mode is reliable and transparent.

## Stage 7: Quality + Release

### Objective
Harden product behavior, document usage, and prepare stable release.

### Tasks

1. RIM-701: Comprehensive test suite expansion
- Deliverable: unit + integration + smoke tests for runner and extension pathways.
- Acceptance: critical path coverage for run lifecycle and failures.

2. RIM-702: Resilience and recovery testing
- Deliverable: tests for crash/restart/reconnect scenarios.
- Acceptance: interrupted runs recover to known state without data loss.

3. RIM-703: Telemetry and observability baseline
- Deliverable: non-sensitive lifecycle metrics and structured logs.
- Acceptance: key events observable for support/debugging.

4. RIM-704: Security and policy review
- Deliverable: command safety guardrails and policy docs.
- Acceptance: high-risk operations documented and gated.

5. RIM-705: Documentation pack
- Deliverable: quickstart, workflow authoring guide, evidence model, troubleshooting.
- Acceptance: new user can author and run a command-only loop in under 15 minutes.

6. RIM-706: Release checklist and go/no-go gate
- Deliverable: release criteria and rollback plan.
- Acceptance: release sign-off captured by engineering + product.

### Exit Criteria
- Product is stable, documented, and releasable.

## Dependency Map (Execution Order)

- Stage 0 -> Stage 1
- Stage 1 -> Stage 2
- Stage 2 -> Stage 3
- Stage 3 -> Stage 4 and Stage 5
- Stage 4 and Stage 5 -> Stage 6
- Stage 6 -> Stage 7

## Suggested Milestones

- Milestone A: Stages 0-2 complete (discover + validate loops).
- Milestone B: Stage 3 complete (command-only runnable loops).
- Milestone C: Stages 4-5 complete (bounded AI + approvals + evidence UX).
- Milestone D: Stages 6-7 complete (isolation + hardening + release).

## Definition of Done (Global)

A stage is done only when:
- Acceptance criteria for all included tasks pass.
- Documentation is updated.
- Tests for new behavior are added and passing.
- No open P0/P1 defects remain for that stage.
