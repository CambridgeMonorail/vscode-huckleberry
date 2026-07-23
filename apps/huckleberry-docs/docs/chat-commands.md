---
sidebar_position: 6
---

# Chat Commands

Huckleberry integrates with VS Code chat so you can drive workflow operations conversationally.

## Using Chat

1. Open VS Code chat.
2. Mention `@Huckleberry`.
3. Describe the workflow action you want.

Huckleberry maps natural-language requests to workflow operations across Loops, Runs, approvals, and Evidence.

## Core Prompt Patterns

### Loop Setup and Validation

```text
@Huckleberry Create starter loop templates for this workspace
@Huckleberry Validate loops in .huckleberry/loops and show any errors
```

### Loop Execution

```text
@Huckleberry Run loop lint and show current run status
@Huckleberry Run loop test
```

### Run Inspection

```text
@Huckleberry Get run status for run_123
@Huckleberry Open run summary for run_123
```

### Approval Handling

```text
@Huckleberry Submit approval decision for run_123: approve
@Huckleberry Submit approval decision for run_123: defer with note "needs security review"
```

### Evidence and Diagnostics

```text
@Huckleberry Open step evidence for run_123 step lint
@Huckleberry Open timeline deep link for run_123 failure event
@Huckleberry Reveal the latest stderr artifact in file explorer
```

## Command Intent Tips

For best results, include:

- Loop ID when asking to run or validate specific loops
- Run ID when asking for status, approvals, or summaries
- Step ID when requesting step-level evidence

## Example Conversation

```text
User: @Huckleberry Create starter templates and run lint.
Huckleberry: Starter loops created under .huckleberry/loops. Running lint now.
User: @Huckleberry If it fails, open summary and evidence.
Huckleberry: Run failed on step lint. Opened run summary and stderr evidence.
User: @Huckleberry Submit approval decision for run_123 as defer with note "waiting for CI rerun".
Huckleberry: Approval decision submitted.
```

## Related Guides

- [Usage](./usage.md)
- [Language Model Tools (Agent Mode)](./language-model-tools.md)
- [Workflow Authoring Guide](./workflow-authoring-guide.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
