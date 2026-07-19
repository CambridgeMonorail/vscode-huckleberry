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
| RIM-102 | 1 | Remove task-domain commands and providers | P0 | Docto | Done | RIM-101 | Task-domain manifest contributions removed and activation path trimmed; `pnpm validate:affected` green |
| RIM-103 | 1 | Introduce new view containers (Loops/Runs) | P1 | Docto | Done | RIM-101 | Loops/Runs activity views added with refresh commands and welcome empty states; `pnpm validate:affected` green |
| RIM-104 | 1 | Refactor activation into composition root | P1 | Docto | Done | RIM-102 | Activation responsibilities moved into `src/activation/*`; `extension.ts` now composes modules |
| RIM-105 | 1 | Preserve packaging and baseline tests | P0 | Docto | Done | RIM-102, RIM-103, RIM-104 | `pnpm validate:affected` and extension `pnpm run package` both pass |
| RIM-201 | 2 | Define workflow schema v1 | P0 | Docto | Done | RIM-003 | Added workflow model + validator with tests for malformed IDs, empty steps, duplicate IDs, and bad condition refs |
| RIM-202 | 2 | Add .huckleberry/loops discovery service | P0 | Docto | Done | RIM-201 | Added scanner + watcher service and wired Loops view to auto-refresh on add/edit/delete |
| RIM-203 | 2 | Build workflow validator service | P0 | Docto | Done | RIM-201 | Added parse+validate pipeline (JSON/YAML) with clear parse/semantic errors |
| RIM-204 | 2 | Implement LoopExplorerProvider | P1 | Docto | Done | RIM-202, RIM-203 | Loops view now lists files with valid/invalid badges; opening a loop shows validation summary |
| RIM-205 | 2 | Add starter workflow templates | P2 | Docto | Done | RIM-201, RIM-203 | Added scaffold command for lint/typecheck/test templates under `.huckleberry/loops` with validation coverage |
| RIM-301 | 3 | Implement runner process and IPC contract | P0 | Docto | Done | RIM-201 | Added runner host/process/client IPC for start/status/cancel/events with Runs view integration and tests |
| RIM-302 | 3 | Implement state-machine engine | P0 | Docto | Done | RIM-301 | Added deterministic transition engine with condition branching, retry limits, timeout handling, and replayable transition traces |
| RIM-303 | 3 | Add command step executor | P0 | Docto | Done | RIM-301, RIM-302 | Added child-process command execution with timeout/exit capture, retry behavior, and per-step evidence artifacts under `.huckleberry/runs` |
| RIM-304 | 3 | Persist runs/events/evidence metadata | P0 | Docto | Done | RIM-302 | Added append-only run event store, evidence metadata index, run reconstruction helpers, and Runs view hydration from persisted history |
| RIM-305 | 3 | Build Runs UI timeline | P1 | Docto | Done | RIM-302, RIM-304 | Runs explorer now renders hierarchical event timeline with step status/timestamps/durations and evidence artifact links |
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
- [x] No task-manager runtime path remains
- [x] Extension activates with Loops/Runs views
- [x] Build/test/package baseline green

### Stage 2
- [x] Loop discovery works with file watch updates
- [x] Validation errors are clear and actionable
- [x] Starter templates validate out of the box

### Stage 3
- [x] Command-only loops execute deterministically
- [x] Full event trail persisted and inspectable
- [x] Runs timeline surfaces step status, timestamps, durations, and evidence links
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
