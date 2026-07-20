---
sidebar_position: 6
---

# Runner Troubleshooting

This guide covers the most common reasons a loop does not validate, start, finish, or resume as expected.

## Loop Does Not Appear in the Loops View

Check the following:

1. The file lives under `.huckleberry/loops`.
2. The file uses supported YAML or JSON syntax.
3. The workflow id and step ids are kebab-case.
4. The file has at least one step.
5. Refresh the `Loops` view after adding the file.

## Workflow Is Marked Invalid

Common validation failures:

- missing referenced step ids
- unsupported step type
- invalid `execution.isolation` value
- agent step missing `allowedPaths`, `maxFilesChanged`, or `maxTurns`
- approval branch target that points to a missing step
- repair loop target mismatch between `command.onFailure` and `agent.retry.target`

Start by simplifying the workflow to one command step and reintroduce branches gradually.

## Run Fails Immediately Before Command Execution

This usually means the runner blocked the command or could not prepare execution.

Check for:

- a high-risk command blocked by command policy
- missing workflow file on disk
- worktree setup failure in isolated mode
- invalid command path or shell invocation

High-risk command patterns are blocked by default. Use a safer command when possible. Only use explicit command-policy overrides for trusted workflows.

## Run Fails With a Non-Zero Exit Code

This is the expected path for deterministic checks such as lint, typecheck, or test.

Inspect, in order:

1. run stop reason
2. failing timeline entry
3. stderr artifact
4. metadata artifact
5. Problems or Test Explorer deep links

If the command is intentionally a gate, do not treat non-zero exit as a runner bug.

## Agent Repair Step Stops the Run

Common causes:

- no agent adapter is available
- the agent changed files outside `allowedPaths`
- the agent exceeded `maxFilesChanged`
- the agent exceeded `maxTurns`
- the repair target configuration is invalid

If the run should remain deterministic, keep the repair scope narrow and avoid broad prompts.

## Approval Step Does Not Resume

Check the `Runs` view entry:

- the run must be in `paused` state
- an approval decision must be submitted explicitly
- branch targets such as `onApprove` or `onReject` must reference valid steps

If no branch target exists for rejection or defer, the run may terminate instead of resuming.

## Evidence View Shows Missing Artifacts

Missing artifact markers usually mean:

- the file was deleted after the run completed
- the workspace was cleaned manually
- a diff or patch artifact could not be generated

Use the run summary and remaining artifacts to reconstruct what happened.

## Worktree Run Is Hard to Review

Use the `Runs` view actions to:

- open the worktree location
- inspect branch status
- open the run-level diff artifact

If worktree metadata is missing, the run may have been created before isolation metadata was added or the path may have been removed locally.

## Fresh Contributor Walkthrough Checklist

Use this checklist to confirm the documentation pack is sufficient:

1. Install the VSIX and open a workspace.
2. Create starter templates.
3. Edit one command to match the repo.
4. Run the loop.
5. Open the run summary.
6. Find stdout or stderr evidence.
7. Explain the result without backchannel help.

## Related Guides

- [Quick Start](./quick-start.md)
- [Workflow Authoring Guide](./workflow-authoring-guide.md)
- [Evidence Model Guide](./evidence-model-guide.md)
