# LOOP-000: Establish the validation corpus and manual baseline

- Priority: P0
- Status: Ready
- Milestone: -1 — Validate the problem
- Depends on: LOOP-001

## Problem

The project assumes that manually supervising agent repair loops is sufficiently painful to justify a VS Code orchestration product. That assumption has not been measured, so technical progress could optimize a workflow developers do not need.

## Scope

- Create at least six reproducible TypeScript repair scenarios across at least two repositories.
- Include simple, cross-file, repeated-diagnostic, scope-trap, unrepairable, and typecheck-insufficient cases.
- Run the selected coding agent using a good manual workflow from clean seeded states.
- Record verified outcome, active intervention time, manual feedback interactions, elapsed time, attempts, diff quality, and qualitative friction.
- Store non-sensitive definitions and results under `docs/reimagine/validation/`.
- For any baseline run performed in the Extension Development Host, place the run plan under `test-workspace/test-plans/` and use the workspace-local Copilot validation prompt.
- Make a recorded Gate A continue, pivot, or stop decision using `VALIDATION.md`.

## Acceptance criteria

- Scenario seed states are reproducible.
- At least six baseline results use the same measurement definitions.
- Failures and inconvenient results remain in the dataset.
- The decision states whether TypeScript repair is the right first loop and why.
- Threshold changes, exclusions, and provider limitations are explicit.
- Human observations and machine evidence are distinguishable in debug-host records.

## Out of scope

- Implementing the Huckleberry actor runtime.
- Claiming statistical significance.
- Collecting source code, secrets, or full prompts as telemetry.
