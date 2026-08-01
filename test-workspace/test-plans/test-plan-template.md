# Test Plan: TITLE

- Plan ID:
- Related task:
- Validation gate:
- Prepared from commit:
- Required run ID format:

## Objective

Describe the product or technical claim this run is intended to test.

## Preconditions

- Required build:
- Required fixtures:
- Required provider/authentication:
- Required repository state:
- Known limitations:

## Checks

### Check 1: TITLE

- Operator: Copilot / Human / Huckleberry
- Action:
- Expected result:
- Machine evidence:
- Human observation:
- PASS:
- FAIL:
- BLOCKED:

## Required summary

Write `_debug-evidence/<RUN_ID>/99-summary/summary.md` with:

- commit and plan ID;
- status of every check;
- evidence references;
- attributed human observations;
- failures and reproduction steps;
- limitations and unanswered questions;
- recommendation: continue, change, pivot, or stop where this run evaluates a validation gate.

## Cleanup

Describe what may be reset after evidence review. Never remove evidence from an earlier run.
