---
sidebar_position: 4
---

# Features

Huckleberry Workflow Workbench provides evidence-driven workflow orchestration directly inside VS Code.

## Core Features

### Workflow Discovery and Validation

- Discover workflow definitions from `.huckleberry/loops`
- Validate schema and semantic correctness
- Surface validation state in the Loops explorer

### Deterministic Run Lifecycle

- Start workflow runs from the Loops view
- Track status transitions in the Runs view
- Capture explicit stop reasons and lifecycle events

### Approval Gates

- Pause runs for human decisions
- Submit approve/reject/defer actions
- Attach optional audit notes for traceability

### Evidence-First Review

- Generate run summaries in JSON and Markdown
- Group artifacts by run, step, and category
- Open deep links to diagnostics, tests, logs, and diffs

### Isolation and Worktrees

- Execute workflows in isolated worktree contexts when configured
- Surface worktree location and branch inspection actions in run details

## VS Code Integration

- Chat participant via `@Huckleberry`
- Command palette actions for loop/run/evidence workflows
- Activity Bar container with Loops, Runs, and Evidence views
- Agent-mode integration through VS Code Language Model Tools

## Storage and Portability

Huckleberry stores workflow state locally in your workspace:

- `.huckleberry/loops` for definitions
- `.huckleberry/runs` for events, summaries, and artifacts

This supports version control, auditability, and reproducibility.

## Current Scope

This branch is workflow-first. Legacy task-management modules may still exist during migration, but active user-facing behavior is centered on loops, runs, approvals, and evidence.

## Related Guides

- [Usage](./usage.md)
- [Workflow Storage](./task-storage.md)
- [Extension Architecture](./extension-architecture.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
