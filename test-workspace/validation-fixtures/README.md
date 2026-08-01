# Repair Fixture Definitions

This directory contains tracked inputs for disposable debug-host repair runs:

- `react-repair/` is the clean React and TypeScript template;
- `scenarios/` contains one-defect seed patches;
- `scenarios.json` declares objectives, allowed paths, attempt limits, verifiers, and expected seed evidence.

`react-unrepairable-scope` deliberately places the shared-contract repair outside the allowed path. Its expected machine outcome is `FAIL` with terminal state `EXHAUSTED` after two collected attempts; a third collection must be rejected and recorded without creating `attempt-003`.

Do not edit a template or scenario to make a measured run pass. Change fixture definitions only from the source workspace, review the bias introduced, and prepare a new run ID afterward.

Materialized repositories belong under the ignored `_scenario-workspaces/` directory. Never initialize or commit a nested `.git` directory inside this tracked fixture directory.
