# Current State and Next Work

- Checkpoint date: 2026-08-01
- Integration branch: `feat/autonomous-engineering`
- Next branch after merge: `codex/loop-000-validation-baseline`

## Where the product is now

Huckleberry is being developed as a VS Code runtime for bounded, evidence-driven development loops. The immediate product target is one trustworthy TypeScript repair loop in which a real coding actor edits an isolated worktree, deterministic TypeScript verification supplies feedback, and the runtime owns continuation and stopping.

The repository already has a useful deterministic workflow substrate: loop discovery, command execution, cancellation, event persistence, evidence browsing, approvals, worktree lifecycle, and run summaries. It does **not** yet have a coding actor that can edit files through the shipped runner, structured verifier feedback between attempts, Git-measured per-iteration scope enforcement, or a persisted iteration model. See [GAP.md](./GAP.md) for the capability ledger.

The `docs/reimagine` product thesis, vocabulary, MVP, runtime, gap assessment, validation gates, and `LOOP-*` backlog are authoritative. Archived RIM, ACP, and task-manager material is historical.

## What this branch establishes

- A documentation reset around the validated development-loop product boundary.
- An ordered, validation-led `LOOP-*` backlog.
- Repository instructions that prevent historical plans or scaffolding from being treated as implementation truth.
- A structured debug-host handoff using `test-workspace`, run-specific Markdown plans, a workspace Copilot prompt, attributed human observations, and machine evidence.
- Cross-platform VS Code and Nx commands required to build and validate the extension on Windows.
- Removal of stale issue-specific VS Code tasks and a deleted demo application's launch configuration.

The debug-host harness is primarily for controlled fixture and UI validation. It does not replace the normal manual Copilot baseline required by Gate A, and repeated smoke-fixture success is not evidence of usefulness on real repositories.

## Evidence at this checkpoint

- Extension lint: passed.
- Extension typecheck: passed.
- Extension tests: 26 files and 171 tests passed.
- `Debug Extension` pre-launch build: passed through `pnpm run build:extension`.
- VS Code JSON, launch/task references, new Markdown links, and `git diff --check`: passed.
- Full `pnpm run validate:affected`: lint, typecheck, and tests passed; the build phase remains red in the existing Docusaurus site after reporting a duplicate `/` route and unresolved legacy documentation links.
- Local Node is v24 while the extension declares Node `^22.0.0`; verification therefore emits an engine warning.

No real coding-agent repair loop or usefulness gate has passed. The above results validate the repository substrate and the new handoff machinery only.

## Next task: LOOP-000

[LOOP-000](./issues/LOOP-000.md), **Establish the validation corpus and manual baseline**, is the next product task. It must measure whether supervising TypeScript repair is painful enough to justify Huckleberry before production actor or schema work is treated as committed direction.

Start the next branch from updated `main` after this pull request merges:

```text
codex/loop-000-validation-baseline
```

The first deliverable on that branch should be a reviewable experiment pack under `docs/reimagine/validation/` containing:

1. one shared scenario and result format using the measures in [VALIDATION.md](./VALIDATION.md);
2. at least six reproducible TypeScript repair scenarios across at least two repositories;
3. clean seed/reset instructions and privacy constraints;
4. a baseline-run protocol for the normal manual Copilot workflow;
5. the first run-specific debug-host plan only where real VS Code, authentication, or UI behaviour requires it.

Run the scenarios from clean seeds, retain failures and inconvenient results, and end with an explicit Gate A continue, pivot, or stop decision. Do not implement the production actor protocol as part of LOOP-000. A disposable LOOP-002 feasibility spike may be separate, but it is not usefulness evidence.

## Workflow decision

Keep the current workspace prompt while the manual protocol is evolving. Do not add a skill or custom test agent yet. Reconsider a skill only after repeated runs reveal a stable procedure plus reusable scripts; reconsider a custom agent only if persistent tool restrictions or role-specific model configuration become necessary.
