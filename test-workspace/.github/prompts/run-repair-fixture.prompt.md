---
description: Prepare, run, and record one controlled repair-fixture validation
agent: agent
---

Run the controlled repair-fixture procedure with:

- run ID: `${input:runId:enter a new run ID}`
- scenario: `${input:scenario:react-prop-contract or react-price-regression}`

Before acting:

1. Read [the debug-host instructions](../../AGENTS.md).
2. Read [the workspace overview](../../README.md).
3. Read [the repair-fixture test plan](../../test-plans/repair-fixture-harness.md).

Then:

1. Run `node scripts/repair-fixture.mjs prepare --run-id <RUN_ID> --scenario <SCENARIO>` from the `test-workspace` root.
2. Stop as `BLOCKED` if preparation reports that clean or seeded evidence differs from the declaration. Do not adjust dependencies, compiler settings, or the scenario.
3. Read only `_scenario-workspaces/<RUN_ID>/TASK.md` and the generated repository source needed for the repair. Do not inspect `validation-fixtures/scenarios/` or Git history for the answer.
4. Record the start time and each repair attempt in `_debug-evidence/<RUN_ID>/02-agent/interaction.md`.
5. Work within the generated repository and its declared allowed paths. Use a normal coding workflow and no more than the declared maximum attempts.
6. After each attempt, run `node scripts/repair-fixture.mjs collect --run-id <RUN_ID>` from the `test-workspace` root. Treat the resulting verifier, known-check, scope, and Git evidence as authoritative feedback.
7. Continue only while attempts remain and the fresh evidence gives an actionable failure. Never claim success from your own summary.
8. Write `_debug-evidence/<RUN_ID>/99-summary/summary.md` using the required format in the plan. Distinguish `Machine evidence`, `Copilot action`, and `Human observation`.

Ask the human only for UI-only actions or a brief subjective observation required by the plan. Explicitly label the final result as Gate B fixture/harness evidence that does not satisfy Gate A or Gate C.
