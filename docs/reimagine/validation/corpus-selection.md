# Corpus Selection Notes

**Date: 2026-08-01**

Candidate repositories were required to have a public pinned revision, locally reconstructable dependencies, and a green narrow verifier before any seed patch was applied.

## Selected

- `vscode-huckleberry` at `fd2572efc4a369f26a9f94874b153a7e239ea7da`: extension typecheck passed.
- `chord-overlay-maker` at `1c83e314997ab0846154d5e3ece4aaeafa97a71c`: `chord-contract` typecheck passed.

## Rejected

- `shadcn-signage-kit` at `02fa0d1ea235a7a1e148105f7e2da71fb32065a8`: rejected because the clean signage-blocks typecheck already reported an unused import and stale declaration-build diagnostics.
- `react-weapons-of-choice` at `30a2189dc1efcbdbb50c99446fd04f0e1f5d46a9`: rejected because the clean all-project typecheck already reported multiple Storybook, chart, and component contract diagnostics.

These failures are selection evidence, not LOOP-000 baseline results. They are retained to prevent later runs from quietly choosing a different verifier or treating pre-existing failures as seeded scenario evidence.
