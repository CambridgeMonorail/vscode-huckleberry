---
sidebar_position: 4
---

# Workflow Authoring Guide

This guide covers the schema basics for Huckleberry workflow definitions and the authoring patterns that work well in the first release.

## File Location

Store workflow files under:

```text
.huckleberry/loops/
```

Huckleberry discovers `.yaml`, `.yml`, and JSON workflow files from that directory and updates the `Loops` view when files are added, changed, or removed.

## Minimal Workflow

The smallest valid command-only workflow contains a schema version, workflow identity, and at least one step.

```yaml
schemaVersion: 1
id: lint
name: Lint
steps:
  - id: lint
    type: command
    command: pnpm lint:affected
```

## Core Top-Level Fields

- `schemaVersion`: currently `1`
- `id`: kebab-case workflow identifier
- `name`: human-readable title shown in the UI
- `description`: optional explanatory text
- `execution.isolation`: optional `workspace` or `worktree`
- `steps`: ordered list of workflow steps

## Step Types

### Command

Runs a deterministic shell command.

```yaml
- id: test
  type: command
  command: pnpm test:affected
```

Optional fields:

- `onFailure`: step id of an agent repair step that should run after the command fails

### Condition

Routes execution to one of two step ids.

```yaml
- id: choose-path
  type: condition
  expression: run-smoke
  true: smoke
  false: full-suite
```

### Approval

Pauses the run until a human records a decision from the `Runs` view.

```yaml
- id: approve-release
  type: approval
  onApprove: publish
  onReject: stop-release
```

### Agent

Runs a bounded agent repair step.

```yaml
- id: repair-test
  type: agent
  prompt: Fix the failing tests without changing workflow files.
  allowedPaths:
    - apps/huckleberry-extension/src
    - apps/huckleberry-extension/tests
  maxFilesChanged: 4
  maxTurns: 3
  retry:
    target: test
    maxAttempts: 2
```

Required guardrails:

- `allowedPaths`
- `maxFilesChanged`
- `maxTurns`

### Artifact

Runs a command that exists to capture or materialize evidence.

```yaml
- id: collect-report
  type: artifact
  command: pnpm exec vitest run --coverage --pool=forks --maxWorkers=1
```

## Execution Flow

By default, steps execute sequentially in the order they appear.

Execution can branch when you use:

- `condition` steps
- `approval` steps with `onApprove`, `onReject`, or `onDefer`
- `command.onFailure` paired with an `agent.retry` target

## Repair Loop Pattern

Use this when you want a deterministic check, bounded repair, and deterministic re-check.

```yaml
schemaVersion: 1
id: test-with-repair
name: Test With Repair
steps:
  - id: test
    type: command
    command: pnpm test:affected
    onFailure: repair-test

  - id: repair-test
    type: agent
    prompt: Fix the failing tests and keep changes within the extension source and tests.
    allowedPaths:
      - apps/huckleberry-extension/src
      - apps/huckleberry-extension/tests
    maxFilesChanged: 4
    maxTurns: 3
    retry:
      target: test
      maxAttempts: 2
```

## Isolation Options

Use `execution.isolation: worktree` when the workflow may change files and you want a separate Git worktree.

```yaml
schemaVersion: 1
id: isolated-repair
name: Isolated Repair
execution:
  isolation: worktree
steps:
  - id: test
    type: command
    command: pnpm test:affected
```

Use workspace mode when you want the command to run directly in the current repository checkout.

## Validation Rules That Commonly Fail

- workflow and step ids must be kebab-case
- every workflow needs at least one step
- referenced step ids must exist
- agent steps must include explicit bounds
- approval branch targets must point to valid steps
- repair loops must point back to the original deterministic check

## Authoring Recommendations

- Start with a single command step and confirm the loop runs cleanly.
- Prefer deterministic commands over broad shell scripts.
- Keep agent prompts narrow and auditable.
- Use approval steps when a human should decide whether to continue.
- Treat workflow files as code: review them, version them, and avoid hidden side effects.

## Related Guides

- [Quick Start](./quick-start.md)
- [Evidence Model Guide](./evidence-model-guide.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
