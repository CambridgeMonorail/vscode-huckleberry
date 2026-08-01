# Huckleberry Repository Instructions

## Product direction

Huckleberry is a VS Code runtime for bounded, evidence-driven development loops. An actor attempts work, deterministic verifiers evaluate it, failures become feedback for the next attempt, and Huckleberry owns continuation and stopping.

The authoritative product documents are under `docs/reimagine`:

- `README.md` — navigation and authority
- `PRODUCT.md` — product boundary
- `DOMAIN.md` — normative vocabulary
- `MVP.md` — first vertical slice
- `RUNTIME.md` — target runtime semantics
- `GAP.md` — honest current capability
- `VALIDATION.md` — usefulness hypotheses and decision gates
- `PLAN.md` and `issues/LOOP-*.md` — active implementation backlog

Documents under `docs/reimagine/archive` and tasks under `tasks/archive` are historical. Do not use RIM, ACP, or legacy TASK completion labels as current implementation truth.

## Delivery rules

- Build the smallest vertical slice that produces product evidence.
- Do not generalize schema, skills, planning, or multi-agent orchestration before the validation gates permit it.
- Treat agent prose as a claim. Success requires fresh verifier evidence.
- Enforce repository scope from measured Git state, not from an agent-reported file list.
- Record limitations and failed experiments; do not convert scaffolding or mocked behaviour into completion claims.
- Keep extension-host UI work separate from durable runner logic.

## Validation workflow

Automated checks and human debug-host checks are complementary:

1. The source-workspace agent prepares code, fixtures, a run-specific test plan, and expected evidence.
2. The human launches `Debug Extension`, which opens `test-workspace` in an Extension Development Host.
3. Copilot in the debug host follows the workspace-local validation prompt and helps execute terminal/file operations.
4. The human performs UI-only actions and reports observations.
5. Copilot records only observed or machine-produced evidence under `test-workspace/_debug-evidence/<RUN_ID>/`.
6. The source-workspace agent reviews that evidence, updates the relevant gate, and decides the next implementation step.

Never ask the debug-host Copilot session to modify extension source. It may modify disposable fixtures and evidence inside `test-workspace` only.

Fixture success proves technical behaviour, not usefulness. Baseline and dogfood comparisons must follow `docs/reimagine/VALIDATION.md`.

Use `test-workspace` primarily for controlled debug-host and Gate B fixture validation. Gate A needs a measured normal Copilot workflow, and Gate C needs non-fixture repositories; do not count repeated smoke runs in `test-workspace` as usefulness evidence.

## Engineering checks

- Inspect TypeScript diagnostics for changed source files.
- Run the narrowest relevant tests while iterating.
- Before handing off a code change, run `pnpm validate:affected` unless the task documents why it cannot run.
- For UI, provider, authentication, cancellation, or packaged-extension behaviour, record manual validation in addition to automated tests.
- Keep `.vscode/tasks.json` limited to stable reusable development commands. Do not add issue-specific GitHub, commit, or push tasks.
