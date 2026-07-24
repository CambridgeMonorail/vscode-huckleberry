# Local Extension Testing Playbook

This page mirrors the repository-native local extension testing guidance used for huckleberry validation.

Canonical source:

- `docs/reimagine/10 Local Extension Testing Playbook.md`

## Scope

This playbook defines a practical flow for:

1. Running the extension from source in Extension Development Host.
2. Running automated tests from the repository root.
3. Packaging and validating the installed VSIX in a clean profile.

## Core Commands

From repository root:

```sh
pnpm validate:affected
pnpm run test:extension
pnpm run build:package:extension
```

Coverage-focused extension run:

```sh
cd apps/huckleberry-extension
pnpm exec vitest run --coverage --pool=forks --maxWorkers=1
```

## Key Conventions

- Extension project: `vscode-copilot-huckleberry`
- Extension folder: `apps/huckleberry-extension`
- Workflow definitions: `.huckleberry/loops`
- Command step schema: `type: command` with `command`

## Related Docs

- `docs/reimagine/10 Local Extension Testing Playbook.md`
- `docs/reimagine/09 Practical Validation Matrix.md`
- `docs/manual-testing.md`
