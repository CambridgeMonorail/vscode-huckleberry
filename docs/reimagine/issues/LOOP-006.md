# LOOP-006: Add typed TypeScript verifier feedback

- Priority: P0
- Status: Planned
- Milestone: 1 — Working feedback loop
- Depends on: LOOP-004

## Outcome

The type-check verifier produces fresh, typed, model-actionable feedback rather than only raw command logs.

## Acceptance criteria

- The configured command, exit code, timing, stdout, and stderr remain immutable evidence.
- TypeScript diagnostics are normalized to file, line, column, code, and message where available.
- Full logs remain accessible when feedback excerpts are truncated.
- Evidence records the repository state it verified.
- Fixture tests cover pass, parseable failure, unparseable failure, timeout, and cancellation.
