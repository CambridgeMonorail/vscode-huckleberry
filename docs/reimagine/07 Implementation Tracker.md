# huckleberry Reimagination Implementation Tracker

This tracker operationalizes task IDs from the staged plan and adds ownership and dependency fields.

Status values:
- Planned
- In Progress
- Blocked
- In Review
- Done

Priority values:
- P0
- P1
- P2

## Backlog

| Task ID | Stage | Title | Priority | Owner | Status | Depends On | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RIM-001 | 0 | Create migration branch and lock initial scope | P0 | Docto | Done | None | Branch `feat/huckleberry-reimagination` created and active |
| RIM-002 | 0 | Record architecture decision log (ADRs) | P0 | Docto | Done | RIM-001 | Initial ADR set drafted under `docs/reimagine/adrs` |
| RIM-003 | 0 | Define run-state vocabulary and terminal statuses | P0 | Docto | Done | RIM-001 | Canonical status vocabulary added in schema/types artifacts |
| RIM-004 | 0 | Add implementation tracker doc | P0 | Docto | Done | RIM-001 | This file |
| RIM-101 | 1 | Rename user-facing product surfaces | P0 | Docto | Done | RIM-001 | User-facing branding updated to Workflow Workbench language |
| RIM-102 | 1 | Remove task-domain commands and providers | P0 | Docto | Planned | RIM-101 | Runtime cleanup |
| RIM-103 | 1 | Introduce new view containers (Loops/Runs) | P1 | Docto | Planned | RIM-101 | Empty-state first |
| RIM-104 | 1 | Refactor activation into composition root | P1 | Docto | Planned | RIM-102 | Reduce extension.ts scope |
| RIM-105 | 1 | Preserve packaging and baseline tests | P0 | Docto | Planned | RIM-102, RIM-103, RIM-104 | Build confidence gate |
| RIM-201 | 2 | Define workflow schema v1 | P0 | Docto | Planned | RIM-003 | Canonical model |
| RIM-202 | 2 | Add .huckleberry/loops discovery service | P0 | Docto | Planned | RIM-201 | Scanner + watcher |
| RIM-203 | 2 | Build workflow validator service | P0 | Docto | Planned | RIM-201 | Schema + semantic checks |
| RIM-204 | 2 | Implement LoopExplorerProvider | P1 | Docto | Planned | RIM-202, RIM-203 | UI integration |
| RIM-205 | 2 | Add starter workflow templates | P2 | Docto | Planned | RIM-201, RIM-203 | Quickstart path |
| RIM-301 | 3 | Implement runner process and IPC contract | P0 | Docto | Planned | RIM-201 | Runner foundation |
| RIM-302 | 3 | Implement state-machine engine | P0 | Docto | Planned | RIM-301 | Deterministic transitions |
| RIM-303 | 3 | Add command step executor | P0 | Docto | Planned | RIM-301, RIM-302 | Command-only vertical slice |
| RIM-304 | 3 | Persist runs/events/evidence metadata | P0 | Docto | Planned | RIM-302 | Recovery and inspectability |
| RIM-305 | 3 | Build Runs UI timeline | P1 | Docto | Planned | RIM-302, RIM-304 | Timeline + statuses |
| RIM-306 | 3 | Add cancellation and failure-stop reasons | P0 | Docto | Planned | RIM-302 | Clear terminal outcomes |
| RIM-401 | 4 | Introduce AgentAdapter abstraction | P0 | Docto | Planned | RIM-303 | Provider boundary |
| RIM-402 | 4 | Implement Copilot adapter | P1 | Docto | Planned | RIM-401 | First provider |
| RIM-403 | 4 | Add agent step node type | P0 | Docto | Planned | RIM-401, RIM-201 | Constrained agent execution |
| RIM-404 | 4 | Implement repair loop semantics | P0 | Docto | Planned | RIM-403, RIM-303 | Retry repair flow |
| RIM-405 | 4 | Capture agent claims separately from evidence | P1 | Docto | Planned | RIM-304, RIM-403 | Claims vs facts |
| RIM-501 | 5 | Implement approval gate step | P0 | Docto | Planned | RIM-302, RIM-304 | Explicit human decision |
| RIM-502 | 5 | Build Evidence Explorer | P1 | Docto | Planned | RIM-304 | Evidence navigation |
| RIM-503 | 5 | Improve diagnostics and deep-link integration | P1 | Docto | Planned | RIM-305 | Better triage flow |
| RIM-504 | 5 | Add run summary report generation | P2 | Docto | Planned | RIM-304 | End-of-run reporting |
| RIM-601 | 6 | Implement worktree lifecycle service | P0 | Docto | Planned | RIM-303 | Isolation base |
| RIM-602 | 6 | Route steps through isolation context | P0 | Docto | Planned | RIM-601, RIM-403 | Workspace/worktree parity |
| RIM-603 | 6 | Add isolation visibility in UI | P1 | Docto | Planned | RIM-602, RIM-305 | Transparency in run details |
| RIM-604 | 6 | Add diff evidence for isolated runs | P1 | Docto | Planned | RIM-602, RIM-304 | Reviewability |
| RIM-701 | 7 | Comprehensive test suite expansion | P0 | Docto | Planned | RIM-306, RIM-404, RIM-504, RIM-604 | Critical path quality |
| RIM-702 | 7 | Resilience and recovery testing | P0 | Docto | Planned | RIM-304, RIM-701 | Crash safety |
| RIM-703 | 7 | Telemetry and observability baseline | P1 | Docto | Planned | RIM-305 | Operational visibility |
| RIM-704 | 7 | Security and policy review | P0 | Docto | Planned | RIM-403, RIM-602 | Guardrails |
| RIM-705 | 7 | Documentation pack | P1 | Docto | Planned | RIM-205, RIM-504 | Adoption readiness |
| RIM-706 | 7 | Release checklist and go/no-go gate | P0 | Docto | Planned | RIM-701, RIM-702, RIM-703, RIM-704, RIM-705 | Release decision gate |

## Stage Exit Gate Checklist

### Stage 0
- [ ] Scope and non-goals approved
- [ ] ADR drafts accepted
- [ ] Status vocabulary accepted

### Stage 1
- [ ] No task-manager runtime path remains
- [ ] Extension activates with Loops/Runs views
- [ ] Build/test/package baseline green

### Stage 2
- [ ] Loop discovery works with file watch updates
- [ ] Validation errors are clear and actionable
- [ ] Starter templates validate out of the box

### Stage 3
- [ ] Command-only loops execute deterministically
- [ ] Full event trail persisted and inspectable
- [ ] Cancel and timeout behavior reliable

### Stage 4
- [ ] Agent steps bounded by explicit limits
- [ ] Adapter failure paths safe and clear
- [ ] Claims/facts separation visible in UI

### Stage 5
- [ ] Human approval gates pause/resume correctly
- [ ] Evidence is easy to inspect and trace
- [ ] Summaries are reproducible from event data

### Stage 6
- [ ] Worktree lifecycle stable
- [ ] Execution context switch transparent
- [ ] Isolated run diffs captured as evidence

### Stage 7
- [ ] Quality gates met
- [ ] Documentation complete
- [ ] Release gate approved
