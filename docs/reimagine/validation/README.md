# Validation Workspace

This directory holds non-sensitive definitions, measurements, and product decisions for the Huckleberry usefulness experiments.

## Rules

- Record the scenario and thresholds before running the comparison.
- Start each run from the recorded seed revision and equivalent repository state.
- Use the same measurement definitions for manual and Huckleberry workflows.
- Retain failures, exclusions, and inconvenient results.
- Reference raw `.huckleberry/runs` evidence rather than copying repository content here.
- Never store secrets, proprietary source, or full prompts in these documents.

## Files

- [corpus.md](./corpus.md) defines the scenario set.
- [baseline-protocol.md](./baseline-protocol.md) defines the normal manual coding-agent workflow and measurement rules.
- [run-template.md](./run-template.md) is copied for each measured run.
- [baseline-results.md](./baseline-results.md) tracks the six LOOP-000 runs without inventing pending evidence.
- [corpus-selection.md](./corpus-selection.md) records why candidate repository seeds were selected or rejected.
- [decision-log.md](./decision-log.md) records gate outcomes and changes to the validation protocol.

`LOOP-011` will add `dogfood-results.md` after the packaged tracer bullet exists.
