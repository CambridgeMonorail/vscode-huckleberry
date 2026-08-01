# LOOP-008: Ship the TypeScript repair loop template and launch flow

- Priority: P0
- Status: Planned
- Milestone: 2 — Product vertical slice
- Depends on: LOOP-007

## Outcome

A developer can configure, inspect, and start a real TypeScript repair loop from the Huckleberry Activity Bar.

## Acceptance criteria

- The template declares type-check command, objective input, actor, allowed paths, isolation, and budgets.
- The Loops view distinguishes runnable loops from deterministic v1 workflows and invalid definitions.
- Before launch, the developer can inspect effective commands, provider, scope, budgets, and isolation.
- Missing provider, untrusted workspace, invalid Git state, or invalid configuration blocks launch with an actionable explanation.
- The starter template is exercised by the packaged-extension acceptance test.
