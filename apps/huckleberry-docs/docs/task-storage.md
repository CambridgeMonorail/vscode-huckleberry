---
sidebar_position: 7
---

# Workflow Storage

Huckleberry uses a file-based workflow storage model that keeps loop definitions, run events, summaries, and artifacts local to your workspace.

## Why This Model

- Workflow definitions live alongside source code
- Evidence can be reviewed in pull requests and release gates
- Teams can reproduce outcomes from persisted artifacts
- No required external storage service

## Storage Structure

```text
your-workspace/
└── .huckleberry/
    ├── loops/                     # Workflow definitions (YAML)
    │   ├── lint.yaml
    │   ├── typecheck.yaml
    │   └── test.yaml
    └── runs/
        ├── <run-id>/              # Per-run events, summaries, and artifacts
        │   ├── events.ndjson      # Append-only event stream
        │   ├── evidence-index.json
        │   ├── summary.json
        │   ├── summary.md
        │   └── ...artifacts...
        └── worktree-metadata.json # Isolation metadata when applicable
```

## Loop Definitions

Loop files under `.huckleberry/loops` define executable workflows.

Example:

```yaml
schemaVersion: 1
id: lint
name: Lint
steps:
  - id: lint
    type: command
    command: pnpm lint:affected
```

## Run Event History

Each run writes an append-only `events.ndjson` stream containing lifecycle transitions, step outcomes, approvals, and stop reasons.

This event stream is the source of truth for:

- Runs timeline rendering
- Run-state reconstruction after restart
- Deterministic summary generation

## Summaries and Artifacts

Each run directory includes:

- `summary.json` for structured analysis
- `summary.md` for human-readable review

Artifacts may include stdout/stderr captures, metadata, diffs, and links to diagnostics or tests.

## Evidence Index

`evidence-index.json` maps step attempts to artifact paths. The Evidence view uses it to group items by run, step, and category.

## Worktree Metadata

When isolation is enabled, `worktree-metadata.json` stores run-to-worktree mapping and context used for execution visibility and cleanup behavior.

## Version Control and Collaboration

Because storage is file-based:

- Loop changes are visible in diffs
- Run artifacts can be retained per team policy
- Reviewers can inspect outcomes without rerunning every workflow

## Data Security and Privacy

Workflow data remains local to your workspace by default:

- No mandatory external data service
- Artifacts remain project-controlled
- Security posture inherits repository/workspace controls

## Legacy Migration Note

Earlier task-manager releases used task-oriented storage. On the reimagined workflow-first branch, the active storage model is `.huckleberry/loops` and `.huckleberry/runs`.
