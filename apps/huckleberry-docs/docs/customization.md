---
sidebar_position: 10
---

# Customization

This guide covers practical customization points for the workflow-first Huckleberry experience.

## What You Can Customize Today

### Workflow Definitions

Loop files under `.huckleberry/loops` are the primary customization surface.

You can customize:

- Loop IDs and names
- Step sequences
- Command arguments and execution behavior
- Approval gates and branching behavior
- Isolation/worktree execution options

Use the starter templates as your baseline, then adapt commands to your repository conventions.

### Team Conventions

Treat loop files as productized automation artifacts:

- Keep naming consistent (for example `lint`, `typecheck`, `test`)
- Prefer deterministic command steps where possible
- Document intent in loop descriptions/comments
- Review loop updates in pull requests

### Evidence Review Workflow

Customize your review process around persisted evidence:

- Decide which artifacts should be retained
- Define how run summaries are consumed in code review
- Add branch/worktree inspection steps for higher-risk runs

## VS Code-Level Customization

You can customize usage ergonomics through VS Code itself:

- Keyboard shortcuts for frequently used Huckleberry commands
- View/container placement and layout preferences
- Chat and agent mode model selection

## Recommended Operating Patterns

1. Start with simple command-only loops.
2. Add approvals where human judgment is needed.
3. Add isolation/worktree mode for higher-risk workflows.
4. Use summaries and evidence links as the decision source of truth.

## Legacy Configuration Note

Some task-domain configuration examples may still exist in historical docs or migration-era modules. For the active workflow-first branch, prioritize loop/run/evidence configuration through `.huckleberry/loops` and run operations.

## Related Guides

- [Workflow Authoring Guide](./workflow-authoring-guide.md)
- [Usage](./usage.md)
- [Workflow Storage](./task-storage.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
