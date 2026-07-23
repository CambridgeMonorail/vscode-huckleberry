---
sidebar_position: 8
---

# Usage

This guide provides practical examples for using Huckleberry Workflow Workbench in day-to-day engineering workflows.

## Basic Workflow

A typical workflow with Huckleberry consists of:

1. Create or discover loop definitions under `.huckleberry/loops`.
2. Validate loops and resolve schema or semantic issues.
3. Run a loop and monitor status in the Runs view.
4. Inspect timeline entries, summaries, and artifacts.
5. Approve, reject, defer, cancel, or retry based on evidence.

## Common Scenarios

### Getting Started with a New Project

When beginning a new project:

1. Open the Huckleberry container in the Activity Bar.
2. In the Loops view, choose `Create Starter Templates`.
3. Confirm loop files are created in `.huckleberry/loops`.
4. Edit one loop command so it matches your workspace validation command.

### Running Your First Loop

From the Loops view:

```text
Right-click a valid loop
Select: Run Loop
```

Then monitor progress in the Runs view with actions such as:

```text
Get Run Status
Open Run Summary
```

### Reviewing Evidence

Use the Evidence view to inspect artifacts by run, step, and category.

Common actions:

```text
Open Artifact
Reveal Artifact
```

### Handling Approval Gates

If a workflow pauses for human review:

1. Open the paused run in the Runs view.
2. Trigger `Submit Approval Decision`.
3. Choose approve, reject, or defer.
4. Optionally include an audit note.

### Debugging Failures Quickly

Failed runs often include timeline deep links:

```text
Open Timeline Deep Link
Open Deep Link Target
```

These actions navigate to diagnostics, tests, logs, or diff evidence when available.

## Team Workflow

### Sharing Workflows

Because loop definitions and run artifacts are workspace files, teams can collaborate through version control:

1. Commit loop definitions under `.huckleberry/loops`.
2. Review loop changes in pull requests.
3. Share run evidence and summaries for release and readiness decisions.

### Reviewable Execution

Use run summaries and evidence artifacts in code reviews or release gates to answer:

- What ran?
- What failed or passed?
- Which evidence supports the conclusion?

## Using Chat with Huckleberry

You can drive workflow operations from chat. Example prompts:

```text
@Huckleberry Create starter loop templates for this workspace
@Huckleberry Validate loops in .huckleberry/loops and show any errors
@Huckleberry Run loop lint and show current run status
@Huckleberry Open the latest run summary and key evidence artifacts
```

## Using the Command Palette

You can also run Huckleberry commands directly:

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac).
2. Type `Huckleberry:`.
3. Run commands such as:
   - `Refresh Loops`
   - `Run Loop`
   - `Get Run Status`
   - `Open Run Summary`
   - `Submit Approval Decision`

## Best Practices

### Authoring Loops

- Keep loops deterministic where possible.
- Start with one-step command loops, then add complexity.
- Validate loops after every material edit.

### Evidence-First Review

- Treat summaries as outputs derived from run events.
- Use artifact links rather than memory when making decisions.
- Capture approval notes for audit trails.

### Isolation and Safety

- Use worktree isolation for high-risk or invasive workflows.
- Review branch status and run-level diff evidence before merge.

## Troubleshooting

### No Loops Visible

1. Ensure loop files exist under `.huckleberry/loops`.
2. Run `Refresh Loops`.
3. Check loop validation output.

### Run Not Advancing

1. Open run status and timeline details.
2. Check for paused approval gates.
3. Open evidence artifacts and summary for stop-reason context.

### Evidence Missing

1. Refresh the Evidence view.
2. Verify artifact files still exist on disk.
3. Use timeline links to inspect fallback diagnostics.

For deeper guidance, see:

- [Quick Start](./quick-start.md)
- [Workflow Authoring Guide](./workflow-authoring-guide.md)
- [Evidence Model Guide](./evidence-model-guide.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
