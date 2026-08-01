# huckleberry Reimagination Stage 0-1 Issue Specs

This document provides issue-ready specifications for Stage 0 and Stage 1 tasks.

## RIM-001: Create migration branch and lock initial scope

### Title
Create migration branch and lock reimagination scope

### Problem
Execution will drift without a dedicated branch and explicit scope boundaries.

### Scope
- Create branch `feat/huckleberry-reimagination`.
- Document stage boundaries, non-goals, and exit gates.
- Add links to source docs in docs/reimagine.

### Out of Scope
- Any runtime code changes.
- Any schema or runner implementation.

### Acceptance Criteria
- Branch exists on remote with upstream tracking.
- Scope statement and non-goals are documented.
- Stage gate list is visible in reimagine docs.

### Dependencies
- None

### Validation
- `git branch -a` shows branch.
- Documentation file reviewed and approved.

## RIM-002: Record architecture decision log (ADRs)

### Title
Create initial ADR set for reimagination foundations

### Problem
Foundational decisions will be re-litigated unless captured in ADRs.

### Scope
- Add ADR template.
- Add initial ADRs:
  - extension/runner split
  - append-only event persistence
  - agent provider boundary via adapter

### Out of Scope
- Implementing ADR decisions in runtime code.

### Acceptance Criteria
- ADR template exists and is reusable.
- At least 3 ADRs are drafted with status and consequences.
- Plan and tracker link to ADR files.

### Dependencies
- RIM-001

### Validation
- Files present in docs/reimagine ADR folder.
- Team review confirms decisions are actionable.

## RIM-003: Define run-state vocabulary and terminal statuses

### Title
Define canonical run lifecycle statuses

### Problem
Inconsistent status semantics will break UI, protocol, and persistence alignment.

### Scope
- Define canonical run states and transitions.
- Define terminal stop reasons taxonomy.
- Provide mapping guidance for UI badges and API responses.

### Out of Scope
- Runner implementation.
- UI styling implementation.

### Acceptance Criteria
- State vocabulary includes: queued, running, paused, succeeded, failed, cancelled, exhausted.
- Stop reasons include machine-readable code + human-readable message.
- Vocabulary is referenced by schema and protocol docs.

### Dependencies
- RIM-001

### Validation
- Review by extension + runner owners.
- No ambiguous status names remain.

## RIM-004: Add implementation tracker doc

### Title
Create implementation tracker with ownership and dependencies

### Problem
Plan tasks are not executable without ownership, status, and dependency tracking.

### Scope
- Create tracker table for all RIM IDs.
- Add status and priority model.
- Add stage exit checklists.

### Out of Scope
- Workflow engine work.

### Acceptance Criteria
- All RIM IDs from staged plan appear in tracker.
- Every task includes status and dependencies.
- Stage checklists are present.

### Dependencies
- RIM-001

### Validation
- Cross-check all IDs between plan and tracker.

## RIM-101: Rename user-facing product surfaces

### Title
Rename visible extension branding from task-manager product to huckleberry loops product

### Problem
Mixed branding confuses users and blocks clean migration.

### Scope
- Update display names, view titles, command descriptions, and user-facing strings.
- Keep technical identifiers stable only where migration risk is too high.
- Record any deferred rename items.

### Out of Scope
- Deep refactor of internal module names unless required for compilation.

### Acceptance Criteria
- No old product naming in user-facing UI strings.
- Updated naming appears in extension host UI.
- Deferred rename backlog captured.

### Dependencies
- RIM-001

### Validation
- Grep audit on user-facing strings.
- Manual extension host walkthrough.

## RIM-102: Remove task-domain commands and providers

### Title
Remove task-manager runtime paths and command handlers

### Problem
Legacy task behaviors conflict with new workflow model and increase maintenance risk.

### Scope
- Remove task commands, handlers, providers, and registrations from active runtime path.
- Remove dead code references and command contributions.
- Preserve build health.

### Out of Scope
- Runner implementation.
- Replacing all internals with final architecture.

### Acceptance Criteria
- Extension activates without missing registrations.
- No task-manager actions are reachable from command palette or views.
- Build and tests pass at baseline.

### Dependencies
- RIM-101

### Validation
- Activation smoke test.
- Command palette audit.

## RIM-103: Introduce new view containers (Loops/Runs)

### Title
Create Loops and Runs view containers with empty states

### Problem
Users need visible product scaffolding before execution engine exists.

### Scope
- Add Activity Bar container and views for Loops and Runs.
- Provide empty-state messaging and refresh command.
- Establish provider interfaces for future data wiring.

### Out of Scope
- Evidence Explorer.
- Full run timeline details.

### Acceptance Criteria
- Views render in extension host.
- Empty states are informative and actionable.
- Refresh actions work.

### Dependencies
- RIM-101

### Validation
- Manual extension host check.
- Basic UI/provider tests.

## RIM-104: Refactor activation entrypoint into composition root

### Title
Refactor extension activation into modular composition root

### Problem
Current activation coupling slows migration and increases regression risk.

### Scope
- Split registration concerns into modules: commands, views, services, tools.
- Keep extension.ts as composition/bootstrapping only.
- Add tests for registration wiring where practical.

### Out of Scope
- Feature behavior changes beyond registration movement.

### Acceptance Criteria
- extension.ts orchestrates modules only.
- No behavior regressions in activation flow.
- Build and tests pass.

### Dependencies
- RIM-102

### Validation
- Activation smoke test.
- Lint/typecheck clean.

## RIM-105: Preserve packaging and baseline tests

### Title
Maintain CI green baseline through shell conversion

### Problem
Migration without quality gates will introduce hidden instability.

### Scope
- Ensure build, lint, test, and package commands remain valid.
- Update or remove obsolete tests tied to deleted task features.
- Add baseline smoke test for activation and view rendering.

### Out of Scope
- New workflow runner tests.

### Acceptance Criteria
- CI baseline passes for extension shell.
- Packaging path produces valid artifact.
- Smoke tests cover activation + Loops/Runs visibility.

### Dependencies
- RIM-102, RIM-103, RIM-104

### Validation
- Run repository validation command set.
- Verify packaging artifact generated.

## Sequencing Notes

Recommended implementation order:
1. RIM-001
2. RIM-004
3. RIM-002
4. RIM-003
5. RIM-101
6. RIM-102
7. RIM-103
8. RIM-104
9. RIM-105
