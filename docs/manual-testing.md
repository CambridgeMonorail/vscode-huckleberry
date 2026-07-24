# Huckleberry Manual Testing Checklist

This document tracks manual verification for the workflow-first Huckleberry product surface in this branch.

Execution ownership matrix:

- `docs/reimagine/09 Practical Validation Matrix.md`
- `docs/reimagine/10 Local Extension Testing Playbook.md`

Current user-facing scope:

- Loops discovery and validation
- Runs execution lifecycle and approval handling
- Evidence exploration and artifact access
- Isolation/worktree visibility and diagnostics deep links

> Note: Legacy task-management testing moved out of active scope for this checklist. Use legacy debug references only when explicitly working in migration paths.

## Installation and Activation

- [ ] Extension installs from VSIX
- [ ] Extension activates when opening a workspace
- [ ] Chat participant `@Huckleberry` is registered and reachable
- [ ] Activity Bar container "Huckleberry" appears
- [ ] Loops, Runs, and Evidence views render

## Workspace Preconditions

- [ ] Workspace with write access is required and validated
- [ ] Missing-workspace path shows actionable guidance
- [ ] Existing `.huckleberry` folder is detected without errors

## Loops View and Templates

- [ ] Empty Loops view shows welcome content and docs links
- [ ] `Create Starter Templates` creates loop files under `.huckleberry/loops`
- [ ] `Refresh Loops` updates view after file add/edit/delete
- [ ] Invalid loop definitions show validation state/messages
- [ ] Valid loop definitions expose `Run Loop` context action

## Run Lifecycle (Command-Only Baseline)

- [ ] `Run Loop` starts a run for a valid loop
- [ ] Run transitions appear in order (queued/running/terminal)
- [ ] `Get Run Status` returns correct run state by run ID
- [ ] `Cancel Run` transitions active run to cancelled state
- [ ] Failed command step persists explicit stop reason context
- [ ] Run timeline entries include timestamps and step-level detail

## Approval Gate Flow

- [ ] Run pauses correctly at approval step
- [ ] `Submit Approval Decision` supports approve
- [ ] `Submit Approval Decision` supports reject
- [ ] `Submit Approval Decision` supports defer
- [ ] Optional approval note is captured and reflected in timeline/run events

## Run Summaries

- [ ] `Open Run Summary` opens generated summary artifacts for terminal runs
- [ ] Summary includes terminal outcome and unresolved items (if any)
- [ ] Summary content matches persisted event history

## Evidence Explorer

- [ ] Empty Evidence view shows welcome content and docs links
- [ ] Evidence groups by run, step, and category
- [ ] `Open Artifact` opens available files
- [ ] `Reveal Artifact` opens file location in OS explorer
- [ ] Missing/stale artifact states are surfaced clearly
- [ ] Evidence refresh reflects newly generated artifacts

## Diagnostics and Deep Links

- [ ] Timeline entries with deep links show actionable targets
- [ ] `Open Timeline Deep Link` navigates to expected destination
- [ ] `Open Deep Link Target` resolves selected target correctly
- [ ] Failure paths surface fallback guidance when link targets are unavailable

## Isolation and Worktree Visibility

- [ ] Runs executed in worktree mode show isolation status in view details
- [ ] `Open Worktree Location` reveals worktree path for applicable runs
- [ ] `Inspect Branch Status` opens or reports branch status correctly
- [ ] Run context distinguishes workspace vs worktree execution modes

## Chat Experience

- [ ] `@Huckleberry` responds with workflow-first guidance
- [ ] Chat guidance aligns with Loops/Runs/Evidence terminology
- [ ] Error handling for invalid run IDs and missing loops is clear and actionable

## Command Palette Surface

- [ ] `Huckleberry: Refresh Loops`
- [ ] `Huckleberry: Refresh Runs`
- [ ] `Huckleberry: Refresh Evidence`
- [ ] `Huckleberry: Create Starter Templates`
- [ ] `Huckleberry: Run Loop`
- [ ] `Huckleberry: Cancel Run`
- [ ] `Huckleberry: Submit Approval Decision`
- [ ] `Huckleberry: Get Run Status`
- [ ] `Huckleberry: Open Run Summary`
- [ ] `Huckleberry: Open Worktree Location`
- [ ] `Huckleberry: Inspect Branch Status`
- [ ] `Huckleberry: Open Step Evidence`
- [ ] `Huckleberry: Open Timeline Deep Link`
- [ ] `Huckleberry: Open Deep Link Target`
- [ ] `Huckleberry: Open Artifact`
- [ ] `Huckleberry: Reveal Artifact`

## Reliability and Recovery

- [ ] Extension survives VS Code window reload with no broken view state
- [ ] Existing runs are visible after reopening workspace
- [ ] Corrupt/missing run artifact files fail gracefully with clear warnings
- [ ] No command crashes when run/evidence IDs are stale or invalid

## Security and Locality

- [ ] Workflow definitions, run events, and artifacts stay in workspace-local storage
- [ ] High-risk command policy blocks are surfaced with clear user feedback
- [ ] No sensitive data is logged in user-facing messages

## Cross-Platform Smoke

- [ ] Windows manual smoke pass
- [ ] macOS manual smoke pass
- [ ] Linux manual smoke pass

## Documentation Accuracy

- [ ] Root README usage examples match actual command/view behavior
- [ ] Quick start docs match current Loops/Runs/Evidence flow
- [ ] Troubleshooting docs align with current run lifecycle and evidence model

## Legacy Scope Marker

The following areas are intentionally out of active scope for this checklist unless a migration task explicitly targets them:

- Task Explorer and task-initialization flows
- `tasks.json` task CRUD behavior
- Legacy task-oriented LM tools and settings

## Notes on Testing

For each issue found, capture:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages/log excerpts
- Environment details (OS, VS Code version, extension version)

Issue report template:

```markdown
### Issue: [Brief description]

- Steps to reproduce:
  1.
  2.
  3.
- Expected behavior:
- Actual behavior:
- Environment:
- Notes:
```

## Testing Progress Tracking

| Testing Session | Date | Tester | Areas Tested | Issues Found | Issues Fixed |
| --------------- | ---- | ------ | ------------ | ------------ | ------------ |
|                 |      |        |              |              |              |

---

Last Updated: 2026-07-23
