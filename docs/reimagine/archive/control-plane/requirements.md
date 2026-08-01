# Autonomous Engineering Control Plane Requirements

This document translates `docs/reimagine/Autonomous Engineering Control Plane for Visual Studio Code.md` into the work required in this repository.

It is a gap analysis against the current codebase, not a duplicate vision statement.

## Related Docs

- [Autonomous Engineering Control Plane for Visual Studio Code](./Autonomous%20Engineering%20Control%20Plane%20for%20Visual%20Studio%20Code.md)
- [Autonomous Engineering Control Plane Staged Implementation Plan](./Autonomous%20Engineering%20Control%20Plane%20Staged%20Implementation%20Plan.md)
- [Autonomous Engineering Control Plane Tracker](./Autonomous%20Engineering%20Control%20Plane%20Tracker.md)
- [Autonomous Engineering Control Plane Issue Import Matrix](./Autonomous%20Engineering%20Control%20Plane%20Issue%20Import%20Matrix.md)

## Current Project Review

The repository already provides a strong foundation for the new direction:

- VS Code extension packaging, activation, chat participant integration, and command registration.
- `Loops`, `Runs`, and `Evidence` activity bar views.
- Workflow discovery, validation, execution, cancellation, approvals, summaries, and isolated worktree support.
- Evidence persistence and a bounded agent adapter boundary.
- A local-first workspace model with tests, docs, and release automation.

That means the project is no longer starting from a task manager shell.

However, the new vision is materially broader than workflow orchestration:

- The product is now a control plane for autonomous engineering work, not just a workflow runner.
- The primary unit of work is a `Goal`, not a `Loop` or a task.
- Planning, policy, supervision, and evidence must be first-class runtime concepts.
- The system must coordinate multiple specialized agents and skills, not just execute one workflow at a time.
- The user must be able to inspect claims, facts, policy decisions, and intervention points as separate records.

## Gap Summary

| Area | Current project state | Required for new vision |
| --- | --- | --- |
| Work unit | Workflow/loop definition and run execution | Goal with acceptance criteria, plan, evidence, and history |
| Planning | Basic workflow validation and runner sequencing | Autonomous decomposition, replanning, dependency reasoning, and progress evaluation |
| Control | Runner controls one workflow at a time | Control plane schedules, supervises, pauses, and resumes autonomous engineering work |
| Agents | Single bounded adapter boundary | Multiple specialized agents with clear assignment and capability boundaries |
| Skills | Workflow templates and tools | Discoverable reusable engineering skills across repo, org, and third-party sources |
| Policy | Step limits and some guardrails | Central policy engine for allowed actions, approvals, escalation, and safety gates |
| Evidence | Run artifacts and summaries | Evidence catalog with provenance, claims vs facts, and auditability |
| UI | Loops/Runs/Evidence explorers | Goal inbox, planning view, supervision console, intervention history, and evidence timeline |

## Requirements

### 1. Goal Domain

The system must introduce a first-class `Goal` model.

Required behavior:

- A goal must store description, acceptance criteria, status, progress, plan, evidence, and history.
- Goals must be persisted locally in the workspace.
- Goals must survive reloads and be reconstructible from history.
- Goals must support terminal states and intervention states.

Required progress tracking behavior:

- A goal must expose a current progress value or progress state that is updated over time.
- Progress updates must be derived from planner output and evidence, not only from chat narration.
- Progress history must be persisted so users can understand how a goal moved from start to finish.
- Progress must be visible in the UI without opening the raw history log.

Required progress record shape:

- overall state, such as not-started, in-progress, blocked, at-risk, or complete
- completion percentage or milestone completion score
- current phase or checkpoint
- completed checkpoints
- remaining checkpoints
- last progress reason
- evidence references supporting the latest update
- timestamp of the last update

Acceptance criteria:

- A developer can create, inspect, pause, resume, and close a goal.
- Goal state is visible without reading chat history.
- Goal records remain valid after reload and branch changes.
- A developer can see how progress changed across the lifecycle of a goal.
- A developer can inspect the current progress record and understand why it changed.

### 2. Planner Service

The system must add a planner that converts goals into executable work.

Required behavior:

- Decompose goals into steps, dependencies, and checkpoints.
- Select the appropriate workflow or skill for each step.
- Re-plan when evidence fails, requirements change, or policy blocks an action.
- Track progress against the goal rather than only against the current run.

Acceptance criteria:

- A goal can produce a concrete execution plan.
- The plan can be revised without losing the original history.
- Progress can be evaluated from evidence rather than agent narration.

### 3. Control Plane Runtime

The system must become a supervisor for autonomous engineering work.

Required behavior:

- Queue and coordinate work across goals, workflows, and agents.
- Expose every major autonomous action as observable state.
- Separate decision-making from execution.
- Support paused, blocked, failed, exhausted, and completed states.
- Track goal progress independently from individual run status.

Acceptance criteria:

- The user can see what is running, why it is running, and what evidence exists.
- Execution can be stopped or redirected at any decision point.
- No meaningful autonomous action happens without a persisted trace.
- The user can see progress updates without inspecting raw logs.

### 4. Policy Engine

The system must enforce policy centrally rather than ad hoc in handlers.

Required behavior:

- Evaluate proposed actions before execution.
- Support allow, deny, require-approval, and require-evidence decisions.
- Enforce workspace, path, command, and tool boundaries.
- Record policy decisions as part of the audit trail.

Acceptance criteria:

- Unsafe or out-of-scope actions are blocked before execution.
- Policy decisions are visible in the UI and persisted with the run or goal.
- Approval gates can be used by humans when policy requires intervention.

### 5. Agent Orchestration

The system must coordinate multiple specialized agents.

Required behavior:

- Support explicit agent roles such as research, planning, implementation, review, and verification.
- Keep provider-specific logic behind a stable adapter boundary.
- Allow agent assignments to be driven by planner output and policy.
- Distinguish agent claims from objective evidence.

Acceptance criteria:

- A goal can invoke more than one agent role over time.
- The system can explain which agent acted, under what constraints, and with what result.
- Claims never overwrite evidence.

### 6. Skills Runtime

The system must discover and reuse engineering skills as composable units.

Required behavior:

- Discover repo-local skills from files.
- Allow future org and third-party skills to be registered.
- Expose skills to the planner as selectable capabilities.
- Preserve skills as small, testable units with explicit inputs and outputs.

Acceptance criteria:

- The runtime can enumerate available skills.
- A goal can be mapped to an appropriate skill without hard-coded prompt text.
- Skill execution is observable and policy-controlled.

### 7. Evidence and Audit Model

The system must make evidence the source of truth.

Required behavior:

- Persist compiler output, diagnostics, tests, screenshots, diffs, security scans, and summaries as evidence artifacts.
- Record provenance for every artifact.
- Keep claims, hypotheses, and conclusions separate from evidence.
- Make all significant decisions traceable to the evidence that justified them.

Acceptance criteria:

- A user can inspect what was claimed, what was verified, and what remains uncertain.
- Evidence can be traced back to the goal and step that produced it.
- Historical runs remain understandable without chat context.

### 8. UX Surfaces

The extension UI must shift from workflow management to supervisory control.

Required behavior:

- Add a Goal-centric view and detail surface.
- Surface planner output, execution state, policy decisions, and intervention points.
- Keep Runs and Evidence views, but subordinate them to goal supervision.
- Preserve command-first access, but make chat a control surface rather than the only interface.

Acceptance criteria:

- A user can understand goal state without opening source files or chat logs.
- The UI shows what is planned, what is running, what is blocked, and why.
- Evidence and decisions are reachable from the goal and the run.

### 9. Repository Memory and Continuity

The system must treat the repository as the durable memory of the work.

Required behavior:

- Store goal history, run history, evidence, and policies in workspace files.
- Reconstruct progress after reload or branch switching.
- Avoid relying on conversation history as the system of record.
- Support repeated bounded iterations that start from repository state, not chat state.

Acceptance criteria:

- A developer can reopen the workspace and recover the full engineering story.
- Work remains understandable across sessions.
- The repo content is sufficient to rehydrate the current state.

### 10. Validation and Safety

The system must remain testable and safe while it grows.

Required behavior:

- Keep automated tests for domain logic, policy, planning, and evidence handling.
- Keep the existing validation lane for build, lint, test, and typecheck.
- Add manual checks for goal supervision, policy blocking, and evidence traceability.
- Avoid introducing agent features that bypass evidence or approval rules.

Acceptance criteria:

- Every new core capability has automated coverage.
- The current validation commands remain green.
- Manual UX checks confirm the new control plane is observable and understandable.

## Required Work Packages

The implementation should be split into these work packages:

1. Introduce the `Goal` domain model and persistence.
2. Add planner services for decomposition, re-planning, and progress evaluation.
3. Introduce a control-plane runtime that schedules and supervises autonomous work.
4. Centralize policy and approval logic.
5. Expand the agent adapter layer into a multi-role orchestration boundary.
6. Add a skills registry and discovery layer.
7. Expand evidence and audit modeling.
8. Add goal-centric UI surfaces.
9. Harden validation, tests, and documentation.

## Non-Goals For This Phase

- Replacing VS Code with a web app or external service.
- Moving execution state out of the workspace by default.
- Making chat the only control surface.
- Allowing unconstrained autonomous execution without evidence.

## Definition Of Done

This vision is met when a developer can:

- Create a goal with acceptance criteria.
- Watch the system plan, schedule, and supervise work toward that goal.
- Inspect policy decisions, agent claims, and evidence separately.
- Pause or redirect the work when human judgment is needed.
- Reopen the workspace later and reconstruct the full story from repository data.

## Notes For Implementation Planning

The current repository already covers much of the execution substrate, so the next phase should focus on new product semantics rather than more workflow plumbing.

The highest-value additions are the goal domain, planner, policy engine, and goal-centric UX. Those are the parts that turn the current workbench into a real autonomous engineering control plane.