# Autonomous Engineering Control Plane: Staged Implementation Plan

## Purpose

This plan converts `docs/reimagine/requirements.md` into a delivery sequence with discrete, testable work.

The repository already has a strong execution substrate:

- VS Code extension packaging and activation.
- Chat participant and command integration.
- `Loops`, `Runs`, and `Evidence` explorers.
- Workflow discovery, validation, execution, approvals, summaries, and worktree isolation.
- Evidence persistence and a bounded agent adapter boundary.

The next phase should therefore focus on the new product semantics required by the control-plane vision:

- `Goal` as the primary work unit.
- Planning as a first-class service.
- Policy as a centralized runtime concern.
- Skills as reusable capability units.
- Supervision, claims, and evidence as durable records.

## Related Docs

- [Autonomous Engineering Control Plane for Visual Studio Code](./Autonomous%20Engineering%20Control%20Plane%20for%20Visual%20Studio%20Code.md)
- [Autonomous Engineering Control Plane Requirements](./requirements.md)
- [Autonomous Engineering Control Plane Tracker](./Autonomous%20Engineering%20Control%20Plane%20Tracker.md)
- [Autonomous Engineering Control Plane Issue Import Matrix](./Autonomous%20Engineering%20Control%20Plane%20Issue%20Import%20Matrix.md)

## Delivery Principles

- Keep the repository local-first and workspace-persisted by default.
- Preserve the current workflow engine until the new goal path can replace it safely.
- Introduce new semantics incrementally behind clear service boundaries.
- Keep evidence and policy ahead of autonomy.
- Every stage must end with automated validation and a human-readable summary.

## Stage Overview

| Stage | Name | Outcome |
| --- | --- | --- |
| 0 | Scope and Architecture Baseline | Lock control-plane vocabulary, boundaries, and migration rules |
| 1 | Goal Domain and Persistence | Introduce the Goal record as the new primary work unit |
| 2 | Planning and Supervision Core | Add planner services and a goal-centric execution model |
| 3 | Policy and Evidence Model | Centralize policy decisions and expand evidence/audit records |
| 4 | Skills and Agent Orchestration | Add reusable skills and multi-role agent coordination |
| 5 | Goal-Centric UX | Surface goal, plan, policy, and evidence in the extension UI |
| 6 | Migration and Compatibility | Bridge existing workflow assets and preserve continuity |
| 7 | Validation, Docs, and Release Readiness | Harden tests, manual checks, and documentation |

## Stage 0: Scope and Architecture Baseline

### Objective

Establish the control-plane vocabulary and the architectural guardrails before changing runtime behavior.

### Tasks

1. Define the canonical control-plane domain vocabulary.

- Deliverable: documented definitions for `Goal`, `Planner`, `Workflow`, `Skill`, `Agent`, `Policy`, `Evidence`, `Claim`, and `Reflection`.
- Acceptance: the vocabulary is used consistently across docs and implementation work.

2. Establish the runtime boundaries for the new system.

- Deliverable: architecture note describing what belongs in goal services, planner services, policy services, skills runtime, agent adapters, and UI surfaces.
- Acceptance: each responsibility has a named owner boundary and no stage depends on hidden cross-layer behavior.

3. Define the migration posture from workflows to goals.

- Deliverable: migration note explaining how existing loops, runs, and evidence remain usable while goal support is added.
- Acceptance: the plan explicitly states what stays, what is repurposed, and what is deprecated later.

4. Record the new validation contract.

- Deliverable: map of automated checks and manual checks required per stage.
- Acceptance: the project has a clear rule for when a stage is done.

### Exit Criteria

- The team can explain the new architecture without referring to the old task-manager model.
- The migration path is explicit and low-risk.

## Stage 1: Goal Domain and Persistence

### Objective

Create the new primary work unit and make it durable in the workspace.

### Tasks

1. Define the `Goal` schema and TypeScript model.

- Deliverable: workspace-persisted goal record with description, acceptance criteria, status, progress, plan, evidence, and history.
- Acceptance: a goal can be created, serialized, deserialized, and reloaded without loss of information.

2. Add goal lifecycle services.

- Deliverable: services for create, update, pause, resume, close, and append history events.
- Acceptance: goal transitions are explicit and testable.

3. Add goal persistence and hydration.

- Deliverable: repository-local storage for active and historical goals.
- Acceptance: goal state survives reloads and branch switching.

4. Introduce basic goal commands.

- Deliverable: commands to create, list, inspect, pause, resume, and close goals.
- Acceptance: the extension can operate on goals without chat transcripts.

5. Add goal progress tracking.

- Deliverable: persisted progress record with state, completion score, checkpoints, reasons, and evidence links.
- Acceptance: the UI and persisted records show how progress changes over time and what evidence drove updates.

### Exit Criteria

- A developer can manage a goal as a durable workspace object.
- The product has a concrete replacement for task-style work units.
- Goal progress is visible, durable, and distinct from raw run status.
- Goal progress has a structured record that can be queried and displayed.

## Stage 2: Planning and Supervision Core

### Objective

Add the planner that turns goals into executable, observable work.

### Tasks

1. Implement the planner service.

- Deliverable: service that decomposes goals into steps, dependencies, and checkpoints.
- Acceptance: a goal can produce a concrete plan without manual step wiring.

2. Add progress evaluation and replanning.

- Deliverable: progress model that can revise plans based on evidence, failures, or policy decisions and append a checkpoint history.
- Acceptance: replanning preserves prior history and emits explainable reasons.

3. Add progress reporting to the supervisory surfaces.

- Deliverable: UI and service hooks that surface progress updates alongside plan state.
- Acceptance: users can tell whether a goal is advancing, blocked, or regressing without reading logs.

4. Add supervision state tracking.

- Deliverable: canonical runtime states for queued, running, paused, blocked, failed, exhausted, and completed work.
- Acceptance: the user can see what is active, what is waiting, and why.

5. Bridge goal execution to the existing runner.

- Deliverable: compatibility layer that can map a goal plan to the current workflow engine where appropriate.
- Acceptance: the existing runner remains usable while goal orchestration is added.

### Exit Criteria

- Goals can be planned, supervised, and revised.
- The system can explain the current state of work without chat context.

## Stage 3: Policy and Evidence Model

### Objective

Make policy decisions and evidence records first-class and centrally enforced.

### Tasks

1. Implement a policy engine.

- Deliverable: centralized service for allow, deny, require-approval, and require-evidence decisions.
- Acceptance: commands, file paths, and tool usage can be constrained before execution.

2. Expand the evidence model.

- Deliverable: artifact model for compiler output, diagnostics, tests, screenshots, diffs, security scans, summaries, and provenance.
- Acceptance: evidence is linked to the goal and step that produced it.

3. Separate claims from evidence.

- Deliverable: explicit claim records for agent or planner assertions that are distinct from verified artifacts.
- Acceptance: claims never overwrite objective evidence.

4. Surface policy decisions in persistence.

- Deliverable: audit trail for blocked actions, approvals, and evidence requirements.
- Acceptance: every policy decision is traceable later.

### Exit Criteria

- The system can show why something was allowed, denied, or deferred.
- Evidence is the source of truth for progress and conclusions.

## Stage 4: Skills and Agent Orchestration

### Objective

Introduce reusable skills and coordinate multiple agents behind stable boundaries.

### Tasks

1. Add a skills registry.

- Deliverable: discovery layer for repo-local skills with a path to org and third-party registration.
- Acceptance: available skills can be enumerated and selected by the planner.

2. Define the skill contract.

- Deliverable: standard metadata for inputs, outputs, evidence, permissions, failure modes, and runtime limits.
- Acceptance: skills are small, testable, and policy-aware.

3. Extend the agent adapter model.

- Deliverable: orchestration boundary for research, planning, implementation, review, and verification roles.
- Acceptance: provider-specific logic remains isolated behind adapters.

4. Add agent assignment and claim tracking.

- Deliverable: goal planner can assign work to agents and record their claims separately from evidence.
- Acceptance: the system can explain who acted, under what constraints, and with what result.

### Exit Criteria

- The system can orchestrate multiple bounded agent roles.
- Skills are reusable runtime units rather than hard-coded prompts.

## Stage 5: Goal-Centric UX

### Objective

Turn the extension into a supervisory console for goals, plans, policy, and evidence.

### Tasks

1. Add a Goal view and detail experience.

- Deliverable: UI surface for active goals, current plan, status, and history.
- Acceptance: a user can inspect a goal without reading chat history.

2. Add plan and policy visibility.

- Deliverable: surface planner output, current constraints, and blocked decisions in the UI.
- Acceptance: the user can tell what is planned, what is blocked, and why.

3. Integrate evidence navigation.

- Deliverable: deep links from goal and plan surfaces to run artifacts and evidence records.
- Acceptance: evidence is reachable from every important supervisory surface.

4. Preserve existing workflow explorers during transition.

- Deliverable: Loops, Runs, and Evidence remain available while goal surfaces are introduced.
- Acceptance: no abrupt loss of existing user workflows.

### Exit Criteria

- The extension presents the new control-plane model directly in the UI.
- Users can supervise work without relying on conversational history.

## Stage 6: Migration and Compatibility

### Objective

Bridge the current workflow-first product into the goal-first model without breaking continuity.

### Tasks

1. Map workflows to goals.

- Deliverable: compatibility layer or import path that can treat an existing workflow as a goal seed.
- Acceptance: current workflows can be reused rather than rewritten immediately.

2. Deprecate task-era concepts in a controlled way.

- Deliverable: documentation and code cleanup plan for any remaining task-centric references.
- Acceptance: old terminology is not mixed into new user-facing flows.

3. Preserve historical runs and evidence.

- Deliverable: migration-safe handling for existing run data and evidence artifacts.
- Acceptance: prior data remains inspectable after the new model is introduced.

4. Add compatibility tests.

- Deliverable: regression coverage proving old workflow assets still behave correctly.
- Acceptance: goal-first changes do not break the current working substrate.

### Exit Criteria

- Existing repository investments are preserved.
- The new model can coexist with the old model during transition.

## Stage 7: Validation, Docs, and Release Readiness

### Objective

Prove the new control plane is correct, understandable, and ready for a formal release milestone.

### Tasks

1. Expand automated tests.

- Deliverable: unit and integration coverage for goal state, planning, policy decisions, evidence records, and orchestration boundaries.
- Acceptance: critical paths are covered by deterministic tests.

2. Expand manual validation.

- Deliverable: updated manual test matrix for goal creation, planning, policy blocking, evidence traceability, and UI navigation.
- Acceptance: manual checks can validate the end-to-end supervisory experience.

3. Update documentation.

- Deliverable: refreshed reimagine docs, usage docs, and implementation notes for the goal-first model.
- Acceptance: docs explain the control plane in terms a new contributor can follow.

4. Define release gates.

- Deliverable: go/no-go checklist for the new product baseline.
- Acceptance: the project has a clear release gate tied to validation evidence.

### Exit Criteria

- The new control plane has automated and manual proof points.
- The project can move from implementation into release planning with confidence.

## Suggested Work Ordering

1. Stage 0: Scope and Architecture Baseline.
2. Stage 1: Goal Domain and Persistence.
3. Stage 2: Planning and Supervision Core.
4. Stage 3: Policy and Evidence Model.
5. Stage 4: Skills and Agent Orchestration.
6. Stage 5: Goal-Centric UX.
7. Stage 6: Migration and Compatibility.
8. Stage 7: Validation, Docs, and Release Readiness.

## Definition Of Done

The staged implementation is complete when a developer can:

- Create a goal with acceptance criteria.
- Watch the system plan and supervise progress toward that goal.
- See policy decisions, claims, and evidence as separate durable records.
- Intervene when human judgment is required.
- Reload the workspace and recover the full story from repository state.

## Notes

The current repository is already strong on execution substrate. The highest-leverage work now is semantic: goal modeling, planning, policy, evidence, and supervision.

That is the difference between a workflow workbench and an autonomous engineering control plane.