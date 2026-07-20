---
sidebar_position: 3
---

# Quick Start

This guide gets a new contributor from installation to a successful command-only loop run in under 15 minutes.

> Haven't installed Huckleberry yet? Start with the [Installation Guide](./installation.md).

## What You Will Build

By the end of this guide you will:

- create starter loop definitions under `.huckleberry/loops`
- inspect a valid workflow file
- run a deterministic loop from the Loops view
- review run evidence and summary artifacts

## Prerequisites

Before you begin:

1. Install the extension and open a workspace folder.
2. Make sure the workspace has scripts such as `pnpm lint:affected`, `pnpm typecheck:affected`, or replace the starter commands with equivalents for your repo.
3. If you opened the folder after VS Code started, reload the window once so chat and tree views fully register.

## 1. Open the Huckleberry Views

After activation, the Activity Bar shows a Huckleberry container with three views:

- `Loops`: discovered workflow definitions from `.huckleberry/loops`
- `Runs`: execution history and timeline entries
- `Evidence`: grouped artifacts produced by runs

If `Loops` is empty, use the welcome action to create starter templates.

## 2. Create Starter Templates

Run `Huckleberry: Create Starter Templates` from either:

- the `Loops` view welcome content
- the Command Palette

This creates the following files:

```text
.huckleberry/loops/lint.yaml
.huckleberry/loops/typecheck.yaml
.huckleberry/loops/test.yaml
```

The generated `lint.yaml` looks like this:

```yaml
schemaVersion: 1
id: lint
name: Lint
steps:
  - id: lint
    type: command
    command: pnpm lint:affected
```

## 3. Adjust the Command for Your Workspace

If your repository does not expose `pnpm lint:affected`, edit the generated file and replace the command with a deterministic validation command that succeeds locally, for example:

```yaml
command: pnpm exec nx run vscode-copilot-huckleberry:lint
```

Keep the first loop simple: one command step, one clear pass/fail result.

## 4. Run the Loop

In the `Loops` view:

1. Refresh if needed.
2. Right-click a valid loop.
3. Select `Run Loop`.

The `Runs` view shows the queued run, then a running state, then a terminal outcome such as `succeeded` or `failed`.

## 5. Inspect the Result

Open the finished run from the `Runs` view to inspect:

- step timeline entries
- stdout and stderr evidence
- metadata artifacts
- generated run summary files

The `Evidence` view groups artifacts by run, step, and category so you can trace what happened without leaving VS Code.

## 6. Know Where Files Are Stored

Huckleberry writes loop and run data into your workspace:

- `.huckleberry/loops/` for workflow definitions
- `.huckleberry/runs/` for event history, summaries, and evidence artifacts

This makes runs inspectable, reproducible, and easy to review in version-controlled repositories.

## Next Steps

- Read the [Workflow Authoring Guide](./workflow-authoring-guide.md) to add conditions, approvals, agent repair steps, and execution options.
- Read the [Evidence Model Guide](./evidence-model-guide.md) to understand claims, facts, summaries, and artifacts.
- Use the [Runner Troubleshooting Guide](./runner-troubleshooting.md) when a loop fails to validate, execute, or resume.

## Success Criteria

You are done when you can:

- create a loop file under `.huckleberry/loops`
- run it from the `Loops` view
- inspect the terminal status, summary, and evidence from `Runs` and `Evidence`
- explain why the run succeeded or failed using stored artifacts rather than memory
