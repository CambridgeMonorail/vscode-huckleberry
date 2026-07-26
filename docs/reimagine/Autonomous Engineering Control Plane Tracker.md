# Autonomous Engineering Control Plane Tracker

This tracker operationalizes the staged implementation plan for the autonomous engineering control plane.

Status values:

- Not Started
- In Progress
- Blocked
- In Review
- Done

Progress values:

- 0%: not started
- 25%: discovery and design in progress
- 50%: implementation underway
- 75%: implementation mostly complete, validation in progress
- 100%: done

## Related Docs

- [Autonomous Engineering Control Plane for Visual Studio Code](./Autonomous%20Engineering%20Control%20Plane%20for%20Visual%20Studio%20Code.md)
- [Autonomous Engineering Control Plane Requirements](./requirements.md)
- [Autonomous Engineering Control Plane Staged Implementation Plan](./Autonomous%20Engineering%20Control%20Plane%20Staged%20Implementation%20Plan.md)
- [Autonomous Engineering Control Plane Issue Import Matrix](./Autonomous%20Engineering%20Control%20Plane%20Issue%20Import%20Matrix.md)

## Stage Progress Overview

| Stage | Name | Progress | Owner | Status | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Scope and Architecture Baseline | 0% | Docto | Not Started | None | Vocabulary, runtime boundaries, migration posture, and validation contract are documented |
| 1 | Goal Domain and Persistence | 0% | Docto | Not Started | Stage 0 | Goal records, lifecycle services, persistence, commands, and progress tracking are implemented |
| 2 | Planning and Supervision Core | 0% | Docto | Not Started | Stage 1 | Planner service, progress evaluation, supervision states, and runner bridge are implemented |
| 3 | Policy and Evidence Model | 0% | Docto | Not Started | Stage 2 | Policy engine, evidence records, claim separation, and audit trail are implemented |
| 4 | Skills and Agent Orchestration | 0% | Docto | Not Started | Stage 3 | Skills registry, skill contract, agent orchestration, and claim tracking are implemented |
| 5 | Goal-Centric UX | 0% | Docto | Not Started | Stage 4 | Goal, plan, policy, and evidence surfaces are visible in the UI |
| 6 | Migration and Compatibility | 0% | Docto | Not Started | Stage 5 | Existing workflows remain usable while goal-first support is introduced |
| 7 | Validation, Docs, and Release Readiness | 0% | Docto | Not Started | Stage 6 | Tests, manual validation, docs, and release gates are updated |

## Backlog

| Task ID | Stage | Title | Priority | Owner | Status | Depends On | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ACP-001 | 0 | Define control-plane vocabulary | P0 | Docto | Not Started | None | Define Goal, Planner, Workflow, Skill, Agent, Policy, Evidence, Claim, and Reflection |
| ACP-002 | 0 | Record architecture boundaries | P0 | Docto | Not Started | ACP-001 | Document service ownership and runtime boundaries |
| ACP-003 | 0 | Define migration posture | P0 | Docto | Not Started | ACP-001 | Document what is retained, repurposed, and deprecated |
| ACP-004 | 0 | Record validation contract | P1 | Docto | Not Started | ACP-001 | Define automated and manual checks per stage |
| ACP-101 | 1 | Define Goal schema and model | P0 | Docto | Not Started | ACP-001 | Persist description, acceptance criteria, status, progress, plan, evidence, and history |
| ACP-102 | 1 | Add goal lifecycle services | P0 | Docto | Not Started | ACP-101 | Create, update, pause, resume, close, and append history events |
| ACP-103 | 1 | Add goal persistence and hydration | P0 | Docto | Not Started | ACP-101 | Workspace-local storage for active and historical goals |
| ACP-104 | 1 | Introduce basic goal commands | P1 | Docto | Not Started | ACP-102, ACP-103 | Commands to create, list, inspect, pause, resume, and close goals |
| ACP-105 | 1 | Add structured progress tracking | P0 | Docto | Not Started | ACP-101, ACP-102 | Persist progress state, checkpoints, reasons, and evidence links |
| ACP-201 | 2 | Implement planner service | P0 | Docto | Not Started | ACP-101 | Decompose goals into steps, dependencies, and checkpoints |
| ACP-202 | 2 | Add progress evaluation and replanning | P0 | Docto | Not Started | ACP-201, ACP-105 | Progress is revised from evidence, failures, or policy decisions |
| ACP-203 | 2 | Add supervisory progress reporting | P1 | Docto | Not Started | ACP-202 | UI and service hooks expose progress changes |
| ACP-204 | 2 | Add supervision state tracking | P0 | Docto | Not Started | ACP-201 | Canonical queued/running/paused/blocked/failed/exhausted/completed states |
| ACP-205 | 2 | Bridge goal execution to current runner | P1 | Docto | Not Started | ACP-201, ACP-204 | Compatibility layer for current workflow engine where appropriate |
| ACP-301 | 3 | Implement policy engine | P0 | Docto | Not Started | ACP-201 | Allow/deny/require-approval/require-evidence decisions before execution |
| ACP-302 | 3 | Expand evidence model | P0 | Docto | Not Started | ACP-201 | Persist compiler output, diagnostics, tests, screenshots, diffs, scans, summaries, and provenance |
| ACP-303 | 3 | Separate claims from evidence | P0 | Docto | Not Started | ACP-302 | Claims never overwrite verified artifacts |
| ACP-304 | 3 | Persist policy audit trail | P1 | Docto | Not Started | ACP-301, ACP-302 | Blocked actions, approvals, and evidence requirements are traceable |
| ACP-401 | 4 | Add skills registry | P0 | Docto | Not Started | ACP-201 | Discover repo-local skills with future org/third-party registration |
| ACP-402 | 4 | Define skill contract | P0 | Docto | Not Started | ACP-401 | Inputs, outputs, evidence, permissions, failure modes, and runtime limits |
| ACP-403 | 4 | Extend agent adapter model | P0 | Docto | Not Started | ACP-301, ACP-402 | Research, planning, implementation, review, and verification roles |
| ACP-404 | 4 | Add agent assignment and claim tracking | P1 | Docto | Not Started | ACP-303, ACP-403 | Claims are captured separately from evidence |
| ACP-501 | 5 | Add Goal view and detail experience | P0 | Docto | Not Started | ACP-101, ACP-105 | Active goals, current plan, status, and history are visible |
| ACP-502 | 5 | Add plan and policy visibility | P0 | Docto | Not Started | ACP-201, ACP-301 | Users can see what is planned, blocked, and why |
| ACP-503 | 5 | Integrate evidence navigation | P1 | Docto | Not Started | ACP-302, ACP-303 | Deep links from goal and plan surfaces to evidence records |
| ACP-504 | 5 | Preserve existing workflow explorers | P0 | Docto | Not Started | ACP-205 | Loops, Runs, and Evidence remain available during transition |
| ACP-601 | 6 | Map workflows to goals | P0 | Docto | Not Started | ACP-101, ACP-205 | Existing workflows can seed or inform goals |
| ACP-602 | 6 | Deprecate task-era concepts | P1 | Docto | Not Started | ACP-601 | Documentation and code cleanup for remaining task-centric references |
| ACP-603 | 6 | Preserve historical runs and evidence | P0 | Docto | Not Started | ACP-302, ACP-303 | Existing data remains inspectable after the new model is introduced |
| ACP-604 | 6 | Add compatibility tests | P0 | Docto | Not Started | ACP-601, ACP-603 | Goal-first changes do not break the current substrate |
| ACP-701 | 7 | Expand automated tests | P0 | Docto | Not Started | ACP-202, ACP-301, ACP-302, ACP-404 | Coverage for goal state, planning, policy, evidence, and orchestration |
| ACP-702 | 7 | Expand manual validation | P1 | Docto | Not Started | ACP-501, ACP-502, ACP-503 | Manual checks for goal creation, planning, blocking, and traceability |
| ACP-703 | 7 | Update documentation | P1 | Docto | Not Started | ACP-501, ACP-502, ACP-603 | Reimagine docs and usage docs reflect the goal-first model |
| ACP-704 | 7 | Define release gates | P0 | Docto | Not Started | ACP-701, ACP-702, ACP-703 | Clear go/no-go criteria tied to validation evidence |

## Stage Exit Checklist

### Stage 0

- [ ] Vocabulary is documented and consistent
- [ ] Runtime boundaries are clear
- [ ] Migration posture is explicit
- [ ] Validation contract is defined

### Stage 1

- [ ] Goal schema exists
- [ ] Goal lifecycle services work
- [ ] Goal persistence and hydration work
- [ ] Goal commands are available
- [ ] Structured progress tracking works

### Stage 2

- [ ] Planner service works
- [ ] Progress evaluation and replanning work
- [ ] Progress reporting is visible
- [ ] Supervision states are tracked
- [ ] Goal plans can bridge to the current runner

### Stage 3

- [ ] Policy engine blocks or approves actions correctly
- [ ] Evidence records are persisted with provenance
- [ ] Claims are separate from evidence
- [ ] Policy decisions are auditable

### Stage 4

- [ ] Skills can be discovered
- [ ] Skill contracts are stable
- [ ] Agents can be orchestrated by role
- [ ] Claims are tracked separately from objective evidence

### Stage 5

- [ ] Goal-centric UI is available
- [ ] Plan and policy visibility is available
- [ ] Evidence navigation works
- [ ] Existing workflow explorers remain available

### Stage 6

- [ ] Existing workflows can seed goals
- [ ] Task-era concepts are deprecated safely
- [ ] Historical runs and evidence remain inspectable
- [ ] Compatibility tests are green

### Stage 7

- [ ] Automated tests cover core paths
- [ ] Manual validation passes
- [ ] Documentation is updated
- [ ] Release gates are defined and approved

## Notes

- This tracker is intended to be the working source of truth for progress on the control-plane roadmap.
- Stage progress should be updated as work lands, with backlog task status used to show within-stage movement.