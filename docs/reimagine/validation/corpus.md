# TypeScript Repair Validation Corpus

**Status: To be populated by LOOP-000**

Do not implement product behaviour specifically for a scenario without recording the resulting corpus bias.

## Required scenario coverage

| Scenario | Required characteristic | Repository | Seed revision | Expected repairability | Status |
| --- | --- | --- | --- | --- | --- |
| TS-01 | Local type mismatch with one obvious repair | TBD | TBD | Repairable | Not prepared |
| TS-02 | Cross-file contract mismatch | TBD | TBD | Repairable | Not prepared |
| TS-03 | Multiple diagnostics with one root cause | TBD | TBD | Repairable | Not prepared |
| TS-04 | Tempts an unrelated or out-of-scope edit | TBD | TBD | Repairable within scope | Not prepared |
| TS-05 | Cannot be repaired under declared constraints | TBD | TBD | Unrepairable | Not prepared |
| TS-06 | Typecheck passes while a known regression remains | TBD | TBD | Demonstrates verifier limit | Not prepared |

## Scenario definition template

### TS-XX: Title

- Repository:
- Seed revision:
- Setup/reset command:
- Objective shown to the developer or actor:
- Type-check command:
- Allowed paths:
- Maximum attempts:
- Expected repairability:
- Expected acceptable change:
- Known traps or confounders:
- Sensitive-data restrictions:
