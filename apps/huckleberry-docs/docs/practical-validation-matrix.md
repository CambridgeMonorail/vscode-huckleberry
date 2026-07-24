# Practical Validation Matrix

This page mirrors the practical ownership split used for branch validation.

Canonical source:

- `docs/reimagine/09 Practical Validation Matrix.md`

## What This Gives You

- A clear split between automation-owned checks and manual UX validation.
- Repeatable command-level gates for CI and local verification.
- A structured handoff template for reporting manual findings back to implementation.

## Ownership Summary

- Lane A: Copilot-run deterministic automated checks.
- Lane B: Human-run VS Code interaction checks.
- Lane C: Joint triage and targeted reruns.

## Core Automated Commands

Run from workspace root unless noted.

```sh
pnpm validate:affected
pnpm exec nx test vscode-copilot-huckleberry -- --runInBand
cd apps/huckleberry-extension && pnpm exec vitest run --coverage --pool=forks --maxWorkers=1
```

## Core Manual Checks

- M1: Views and activation surface
- M2: Run lifecycle and summary opening
- M3: Approval decision paths
- M4: Evidence explorer interactions
- M5: Timeline deep-link behavior
- M6: Workspace/worktree isolation visibility
- M7: Reload/recovery behavior

For exact procedures and result template, use:

- `docs/reimagine/09 Practical Validation Matrix.md`
- `docs/manual-testing.md`
