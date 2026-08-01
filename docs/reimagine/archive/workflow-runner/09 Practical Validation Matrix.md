# huckleberry Practical Validation Matrix

This matrix defines exactly which tests are automation-owned (Copilot) and which are human-owned (manual UX and behavior checks).

## Current Baseline (2026-07-24)

- Automated extension unit suite: pass (25 files, 169 tests).
- Automated extension coverage suite: pass (25 files, 169 tests).
- Workspace affected validation: pass (`pnpm validate:affected`).

## Execution Log

| Date | Lane | ID | Owner | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-07-24 | A | A1 | Copilot | Pass | `pnpm validate:affected` exited `0` |
| 2026-07-24 | A | A2 | Copilot | Pass | Extension tests: 25 files, 166 tests passed |
| 2026-07-24 | A | A3 | Copilot | Pass | Coverage run passed in forks/serial mode |
| 2026-07-24 | A | A4 | Copilot | Pass | Aligned reimagine schema/types agent-step contract to runtime (`prompt`, `allowedPaths`, `maxFilesChanged`, `maxTurns`) |
| 2026-07-24 | A | A5 | Copilot | Pass | Added risk-focused tests for unsupported runtime step handling and failed-status unresolved summary semantics; extension suite green (169 tests) |

## Current A4 Alignment Notes

- Reimagine schema files now match the runtime agent-step contract:
  - `prompt`
  - `allowedPaths`
  - `maxFilesChanged`
  - `maxTurns`
- Optional adapter selector field is represented as `adapter`.

## Ownership Lanes

- Lane A: Copilot runs deterministic automated checks in terminal and reports results.
- Lane B: Human runs VS Code UI and interaction checks that require visual and experiential validation.
- Lane C: Joint triage where Human reports evidence and Copilot maps failures to code changes.

## Lane A: Copilot-Run Automated Tests

| ID | Owner | Command | Purpose | Pass Criteria | Evidence |
| --- | --- | --- | --- | --- | --- |
| A1 | Copilot | `pnpm validate:affected` | Monorepo affected lint/typecheck/test/build gate | Exit code `0` | Terminal transcript summary |
| A2 | Copilot | `pnpm exec nx test vscode-copilot-huckleberry -- --runInBand` | Extension unit and runner/service/provider tests | All tests pass | Test file/test count summary |
| A3 | Copilot | `cd apps/huckleberry-extension && pnpm exec vitest run --coverage --pool=forks --maxWorkers=1` | Coverage and regression signal for runner/workflow surfaces | Test pass + threshold compliance in Vitest config | Coverage summary |
| A4 | Copilot | Static contract comparison in code/docs | Detect runtime schema drift vs reimagine schema docs | No unresolved drift or drift tracked with explicit decision | Drift report with file references |
| A5 | Copilot | Focused unit tests for known risk paths | Enforce behavior for terminal stop reasons, summary unresolved items, and unsupported step handling | Added scenarios pass and fail when expected | New/updated test output |

## Lane B: Human-Run Manual Tests

These checks require the Extension Host UI, command palette behavior, and human judgment.

| ID | Owner | Procedure | Expected Result | Evidence To Provide Back |
| --- | --- | --- | --- | --- |
| M1 | Human | Open Huckleberry Activity Bar container and verify Loops/Runs/Evidence. Run Refresh commands. Optionally run Create Starter Templates. | Views render, commands work, templates appear under `.huckleberry/loops` | Screenshot + any error text |
| M2 | Human | Run a valid loop from Loops view. Query status. Cancel if running. Open run summary when terminal. | Coherent state transitions and summary artifacts open | Run ID, transition chain, final status, stop reason |
| M3 | Human | Run approval-path loop and submit approve/reject/defer decisions. | Pause/resume logic follows configured branches and records decisions | Three run IDs + branch outcomes |
| M4 | Human | Use Evidence view to open/reveal artifacts and verify stale/missing behavior. | Evidence grouping and artifact actions are correct | Screenshot + one success and one failure path |
| M5 | Human | Trigger failing step and follow timeline deep links (Problems, Test Explorer, logs, diff). | Deep links navigate or show clear fallback guidance | Which links worked/failed and message text |
| M6 | Human | Execute run in workspace mode and worktree mode. Use Open Worktree Location and Inspect Branch Status. | Isolation metadata is accurate and actions resolve expected locations/state | Run IDs + mode shown + branch status output |
| M7 | Human | Reload VS Code during/after runs and reopen workspace. | Run history hydrates and views remain functional | Before/after run state notes + screenshot |

## Lane C: Joint Triage Flow

1. Human sends evidence for failed manual checks.
2. Copilot maps failure to code paths and proposes fixes.
3. Copilot implements fix and re-runs Lane A tests.
4. Human re-runs only impacted Lane B checks.

## Manual Result Template

Use this exact template to speed triage:

```text
M1
- Views visible: pass/fail
- Refresh commands: pass/fail
- Starter templates: pass/fail
- Errors:

M2
- Run ID:
- Transition chain:
- Final status:
- Stop reason/code:
- Summary opened (json/md): yes/no
- Errors:

M3
- Approve run ID / result:
- Reject run ID / result:
- Defer run ID / result:
- Branch behavior matched expected: yes/no
- Errors:

M4
- Evidence grouping: pass/fail
- Open/reveal artifact actions: pass/fail
- Missing/stale artifact behavior: pass/fail
- Errors:

M5
- Deep links tested:
- Worked:
- Failed:
- Fallback messages:

M6
- Workspace-mode run ID / result:
- Worktree-mode run ID / result:
- Isolation metadata accurate: yes/no
- Branch inspect output summary:

M7
- Reload scenario steps:
- History restored: yes/no
- View state healthy after reload: yes/no
- Errors:
```

## Go/No-Go Gate

- Go when Lane A passes and Lane B has no unresolved correctness issues in lifecycle, evidence, approval, or isolation behavior.
- No-Go when any workflow terminal state is incorrect, evidence is missing/misclassified, approval branching is wrong, or recovery fails after reload.

## Related Docs

- `docs/manual-testing.md`
- `docs/reimagine/10 Local Extension Testing Playbook.md`
- `docs/reimagine/07 Implementation Tracker.md`
- `apps/huckleberry-extension/vitest.config.ts`
