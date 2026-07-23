---
sidebar_position: 9
---

# Settings

This page describes configuration expectations for the workflow-first Huckleberry branch.

## Current Configuration Model

The primary configuration surface is file-based workflow definitions under `.huckleberry/loops` plus command-level actions in the Loops/Runs/Evidence views.

In practice, most behavior is controlled by:

- Loop definition content (steps, approvals, execution options)
- Run-time decisions (approve/reject/defer/cancel)
- Workspace execution context (workspace vs worktree)

## Where to Configure

1. **Loop files**: `.huckleberry/loops/*.yaml`
2. **Workspace policies/process**: repository conventions and review rules
3. **VS Code settings**: editor/chat ergonomics (keybindings, layout, model selection)

## Recommended Defaults

- Keep loop commands deterministic.
- Start with one-step loops and expand incrementally.
- Use approval gates for operations that require explicit sign-off.
- Use worktree isolation when command impact should be sandboxed.

## Legacy Settings Note

You may still encounter older task-domain settings in migration-era code or historical docs. Those settings are not the primary product surface for the reimagined workflow-first branch.

## Verification Checklist

After adjusting workflow settings via loop files:

- Run `Refresh Loops`
- Validate loop state in the Loops view
- Execute a run and inspect summary/evidence outputs

## Related Guides

- [Usage](./usage.md)
- [Workflow Storage](./task-storage.md)
- [Extension Architecture](./extension-architecture.md)
