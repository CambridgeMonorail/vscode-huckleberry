# Huckleberry Workflow Workbench

![Huckleberry Logo](https://raw.githubusercontent.com/CambridgeMonorail/vscode-huckleberry/main/assets/images/huckleberry-logo.png)

Evidence-driven workflow orchestration inside Visual Studio Code.

[![Release](https://img.shields.io/github/v/release/CambridgeMonorail/vscode-huckleberry?include_prereleases&style=flat-square)](https://github.com/CambridgeMonorail/vscode-huckleberry/releases)
[![License](https://img.shields.io/github/license/CambridgeMonorail/vscode-huckleberry?style=flat-square)](./LICENSE)
[![VS Code Version](https://img.shields.io/badge/VS%20Code-%5E1.93.0-blue?style=flat-square)](https://code.visualstudio.com/updates/v1_93)

> ⚠️ ALPHA STATUS: This extension is in active development. APIs and behavior may change.

## Overview

Huckleberry is a VS Code extension for workflow execution with explicit evidence. It helps you define loops, run them, inspect outcomes, and make approval decisions without leaving the editor.

Primary product surfaces:

- Loops: workflow definitions and validation
- Runs: execution lifecycle and timeline
- Evidence: artifacts, summaries, and deep links

## Features

- Workflow loop discovery and validation from `.huckleberry/loops`
- Starter template generation for common checks
- Run execution with persisted lifecycle events
- Approval-gate controls (approve, reject, defer)
- Run summaries (`summary.json`, `summary.md`) derived from event history
- Evidence explorer grouped by run, step, and category
- Deep links from timeline entries to diagnostics, tests, logs, and diffs
- Optional isolation support with worktree visibility commands

## Installation

### Pre-release (recommended)

1. Download the latest VSIX from [GitHub Releases](https://github.com/CambridgeMonorail/vscode-huckleberry/releases).
2. In VS Code Extensions view, choose `Install from VSIX...`.
3. Select the downloaded VSIX and reload when prompted.

### Requirements

- VS Code `1.93+`
- GitHub Copilot subscription (for chat and agent-mode features)

## Getting Started

1. Open the Huckleberry container from the Activity Bar.
2. In Loops view, run `Create Starter Templates`.
3. Edit generated loop commands to match your workspace scripts.
4. Run a valid loop using `Run Loop`.
5. Inspect status, timeline, and summaries in Runs.
6. Inspect artifacts in Evidence.

## Command Surface

Key commands:

- `Huckleberry: Refresh Loops`
- `Huckleberry: Refresh Runs`
- `Huckleberry: Refresh Evidence`
- `Huckleberry: Create Starter Templates`
- `Huckleberry: Run Loop`
- `Huckleberry: Cancel Run`
- `Huckleberry: Submit Approval Decision`
- `Huckleberry: Get Run Status`
- `Huckleberry: Open Run Summary`
- `Huckleberry: Open Worktree Location`
- `Huckleberry: Inspect Branch Status`
- `Huckleberry: Open Step Evidence`
- `Huckleberry: Open Timeline Deep Link`
- `Huckleberry: Open Deep Link Target`
- `Huckleberry: Open Artifact`
- `Huckleberry: Reveal Artifact`

## Data Model and Storage

Huckleberry keeps runtime state in workspace files:

- `.huckleberry/loops` for workflow definitions
- `.huckleberry/runs` for run events, summaries, and evidence artifacts

This supports traceability, reproducibility, and reviewability.

## Troubleshooting

If the extension appears idle:

1. Confirm a workspace folder is open.
2. Check Loops view for valid definitions.
3. Refresh Loops/Runs/Evidence views.
4. Open run summary and evidence artifacts for failure context.

For deeper guidance, see:

- [Quick Start](https://github.com/CambridgeMonorail/vscode-huckleberry/blob/main/apps/huckleberry-docs/docs/quick-start.md)
- [Workflow Authoring Guide](https://github.com/CambridgeMonorail/vscode-huckleberry/blob/main/apps/huckleberry-docs/docs/workflow-authoring-guide.md)
- [Evidence Model Guide](https://github.com/CambridgeMonorail/vscode-huckleberry/blob/main/apps/huckleberry-docs/docs/evidence-model-guide.md)
- [Runner Troubleshooting](https://github.com/CambridgeMonorail/vscode-huckleberry/blob/main/apps/huckleberry-docs/docs/runner-troubleshooting.md)

## Contributing

Contributions are welcome:

- Report issues: https://github.com/CambridgeMonorail/vscode-huckleberry/issues
- Submit PRs: https://github.com/CambridgeMonorail/vscode-huckleberry/pulls

Please follow repository contribution guidelines and keep changes aligned to the workflow-first architecture.

## License

[MIT License](./LICENSE)
