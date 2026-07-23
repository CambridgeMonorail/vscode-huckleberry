# Workspace Setup

This guide covers the current contributor setup for the workflow-first Huckleberry repository.

## Prerequisites

- Node.js 22+
- pnpm
- VS Code
- Git

## Clone and Install

```bash
git clone https://github.com/CambridgeMonorail/vscode-huckleberry.git
cd vscode-huckleberry
pnpm install
```

## Monorepo Layout

```text
vscode-huckleberry/
├─ apps/
│  ├─ huckleberry-extension/   # VS Code extension
│  ├─ huckleberry-docs/        # Docusaurus docs site
│  └─ demo-site/               # React demo app
├─ docs/                       # Project-level documentation
└─ assets/                     # Shared assets
```

## Core Development Commands

From repository root:

```bash
# Build extension
pnpm run build:extension

# Watch extension builds
pnpm run watch:extension

# Run extension tests
pnpm run test:extension

# Validate affected projects (lint + typecheck + test + build)
pnpm validate:affected
```

## Docs and Demo Commands

```bash
# Serve docs locally
pnpm exec nx serve huckleberry-docs

# Build docs
pnpm exec nx build huckleberry-docs

# Run demo site
pnpm exec nx serve demo-site
```

## Debugging the Extension

1. Open the repository in VS Code.
2. Press F5 to run the extension debug configuration.
3. In the Extension Development Host, verify the Huckleberry container appears in the Activity Bar.
4. Confirm Loops, Runs, and Evidence views render.
5. Run a quick command from the Command Palette, such as Huckleberry: Refresh Loops.

For additional troubleshooting and debug details, see [debug-setup.md](./debug-setup.md).

## Notes on Legacy Docs

Some historical documents in `docs/` still describe the pre-reimagination task-manager model and are marked as legacy for migration traceability. For active planning, use the reimagination docs under `docs/reimagine/`.
