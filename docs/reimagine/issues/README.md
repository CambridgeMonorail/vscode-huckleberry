# Active Loop Runtime Backlog

This directory contains the only active implementation task set for the Huckleberry reimagination.

Historical `RIM-*` tasks are preserved under [`archive/workflow-runner/issues`](../archive/workflow-runner/issues/). Speculative `ACP-*` tasks are preserved under [`archive/control-plane/issues`](../archive/control-plane/issues/). Neither set is an active backlog.

## Status vocabulary

- `Done`: capability and validation evidence are present.
- `Ready`: sufficiently specified and dependencies are satisfied.
- `Blocked`: a named unresolved dependency prevents useful implementation.
- `Planned`: specified but dependencies are incomplete.
- `Deferred`: intentionally outside the current milestone.

## Active tasks

| ID | Milestone | Title | Priority | Status | Depends on |
| --- | --- | --- | --- | --- | --- |
| [LOOP-000](./LOOP-000.md) | -1 | Establish the validation corpus and manual baseline | P0 | Ready | LOOP-001 |
| [LOOP-001](./LOOP-001.md) | 0 | Establish canonical loop product and runtime contract | P0 | Done | None |
| [LOOP-002](./LOOP-002.md) | 0 | Prove and select an executable coding-agent runtime | P0 | Ready | LOOP-001 |
| [LOOP-003](./LOOP-003.md) | 0 | Implement the extension/runner actor protocol | P0 | Planned | LOOP-002 |
| [LOOP-004](./LOOP-004.md) | 1 | Add persisted iterations and feedback bundles | P0 | Planned | LOOP-003 |
| [LOOP-005](./LOOP-005.md) | 1 | Measure and enforce per-iteration repository deltas | P0 | Planned | LOOP-003 |
| [LOOP-006](./LOOP-006.md) | 1 | Add typed TypeScript verifier feedback | P0 | Planned | LOOP-004 |
| [LOOP-007](./LOOP-007.md) | 1 | Implement runtime-owned loop decisions | P0 | Planned | LOOP-004, LOOP-005, LOOP-006 |
| [LOOP-008](./LOOP-008.md) | 2 | Ship the TypeScript repair loop template and launch flow | P0 | Planned | LOOP-007 |
| [LOOP-009](./LOOP-009.md) | 2 | Add iteration supervision and intervention UX | P1 | Planned | LOOP-004, LOOP-007 |
| [LOOP-010](./LOOP-010.md) | 2 | Add crash recovery and safe resume semantics | P1 | Planned | LOOP-004, LOOP-007 |
| [LOOP-011](./LOOP-011.md) | 2 | Validate the packaged loop end to end | P0 | Planned | LOOP-000, LOOP-008, LOOP-009, LOOP-010 |

## Deferred work

Schema generalization, additional verifiers, skills, composition, Goals, planning, and multi-agent orchestration are not active issues. They are described as later milestones in [the implementation plan](../PLAN.md) and should not be imported into an issue tracker until the MVP acceptance evidence exists.

## Next task

Start with `LOOP-000` and `LOOP-002`. The baseline determines whether TypeScript repair is valuable enough, while the disposable runtime spike determines whether it is technically viable. Do not commit to production schema or orchestration work until both questions have evidence.
