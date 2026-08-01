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
- [run-template.md](./run-template.md) is copied for each measured run.
- [decision-log.md](./decision-log.md) records gate outcomes and changes to the validation protocol.

`LOOP-000` will add `baseline-results.md`. `LOOP-011` will add `dogfood-results.md` after the packaged tracer bullet exists.
