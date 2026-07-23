---
sidebar_position: 10
---

# Development

This guide helps contributors build, test, and debug Huckleberry in the workflow-first branch.

## Repository Structure

Huckleberry is an Nx monorepo:

```text
vscode-huckleberry/
├─ apps/
│  ├─ huckleberry-extension/   # VS Code extension
│  ├─ huckleberry-docs/        # Docusaurus docs
│  └─ demo-site/               # Demo application
├─ docs/                       # Project-level docs and migration plan
└─ assets/                     # Shared assets
```

## Prerequisites

- Node.js 22+
- pnpm
- VS Code
- Git

## Getting Started

```bash
git clone https://github.com/CambridgeMonorail/vscode-huckleberry.git
cd vscode-huckleberry
pnpm install
```

## Build and Test

```bash
# Build extension
pnpm run build:extension

# Run extension tests
pnpm run test:extension

# Validate affected (lint + typecheck + test + build)
pnpm validate:affected
```

## Docs Workflow

```bash
# Serve docs locally
pnpm exec nx serve huckleberry-docs

# Build docs
pnpm exec nx build huckleberry-docs
```

## Debugging the Extension

1. Open repository in VS Code.
2. Start the extension debug configuration (F5).
3. Use Loops/Runs/Evidence views to exercise workflow paths.
4. Check Huckleberry output logs for diagnostics.

For detailed setup, see [debug setup](../../../docs/debug-setup.md).

## Contribution Guidance

When contributing on this branch:

- Prefer workflow-first surfaces (loops/runs/evidence)
- Avoid expanding legacy task-domain runtime paths
- Keep runner behavior deterministic and evidence-first
- Add or update tests with behavior changes
- Keep docs aligned with active product behavior

## Useful References

- [Extension Architecture](./extension-architecture.md)
- [Usage](./usage.md)
- [Runner Troubleshooting](./runner-troubleshooting.md)
- [Manual Testing](../../../docs/manual-testing.md)
