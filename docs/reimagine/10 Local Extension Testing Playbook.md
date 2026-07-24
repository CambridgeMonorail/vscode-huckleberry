# huckleberry Local Extension Testing Playbook

This playbook translates general VS Code extension testing advice into the exact commands and conventions used in this repository.

## Purpose

Use this guide to validate the extension at three levels:

1. Run from source in Extension Development Host.
2. Run automated tests.
3. Package and test as a VSIX in a clean profile.

Testing only in Extension Development Host is not enough for release confidence.

## Repo-Specific Facts

- Extension project name: `vscode-copilot-huckleberry`
- Extension folder: `apps/huckleberry-extension`
- Extension entrypoint (`main`): `./dist/extension.js`
- Workflow definitions folder: `.huckleberry/loops`
- Workflow command step shape: `type: command` with `command:`

## 1. Run From Source

From repository root:

```sh
pnpm install
pnpm nx show projects
pnpm nx build vscode-copilot-huckleberry
```

In VS Code, launch configuration:

- Run and Debug -> `Debug Extension`

This opens the Extension Development Host and runs the extension from local build output.

## 2. Validate Launch and Activation

Launch config is in:

- `.vscode/launch.json`

Confirm these align:

- `--extensionDevelopmentPath=${workspaceFolder}/apps/huckleberry-extension`
- `outFiles` includes `apps/huckleberry-extension/dist/**/*.js`

In Extension Development Host:

1. Run `Developer: Show Running Extensions` and confirm Huckleberry is active.
2. Open `View -> Output -> Log (Extension Host)` for activation errors.
3. Open `Help -> Toggle Developer Tools` and inspect Console for missing modules and registration failures.

## 3. Create Disposable Test Workspace

Do not use the huckleberry repo itself for workflow execution checks.

Create a separate repo with controlled failures and passes:

```text
huckleberry-test-workspace/
|- package.json
|- src/
|  |- valid.ts
|  |- broken.ts
|- tests/
|- .huckleberry/
|  |- loops/
|     |- verify-workspace.yaml
|- README.md
```

Include scenarios for:

- TypeScript pass and fail
- Test pass and fail
- Lint fail
- One fast successful command
- One failing command
- One long-running command suitable for cancellation

## 4. Deterministic First Vertical Slice

Start with command-only loop behavior before AI-driven repair paths.

Example loop (current repo schema):

```yaml
schemaVersion: 1
id: verify-workspace
name: Verify Workspace
steps:
  - id: typecheck
    type: command
    command: pnpm typecheck
  - id: tests
    type: command
    command: pnpm test
```

Acceptance checks:

1. Loop discovery from `.huckleberry/loops`.
2. Validation status appears in Loops view.
3. Run starts from Loops action/command.
4. Stdout/stderr/exit code evidence captured.
5. Success advances to next step.
6. Failure stops with explicit terminal reason.
7. Running loop can be cancelled.
8. Evidence is visible in Runs/Evidence views.

## 5. Automated Tests (Repo Commands)

From repo root:

```sh
pnpm validate:affected
pnpm run test:extension
```

Coverage-focused extension run:

```sh
cd apps/huckleberry-extension
pnpm exec vitest run --coverage --pool=forks --maxWorkers=1
```

These commands are the baseline automation lane used by the practical validation matrix.

## 6. Package as VSIX

Build and package from repo root:

```sh
pnpm run build:package:extension
```

Or package only (after build):

```sh
pnpm run package:extension
```

Inspect included files before packaging from extension directory:

```sh
cd apps/huckleberry-extension
pnpm exec vsce ls
```

Verify package includes runtime essentials:

- `dist/` extension runtime
- icons/resources contributed by the manifest
- runtime assets used by views/commands
- dependencies required at runtime

## 7. Install and Test VSIX in Clean Profile

Create a dedicated profile (for example `Huckleberry Testing`) and install VSIX there.

CLI install example:

```sh
code --profile "Huckleberry Testing" --install-extension <path-to-vsix>
```

Then open the disposable test workspace in a normal VS Code window (not Extension Development Host) and run the same M1-M7 checks.

## 8. Daily Development Loop

For normal daily work:

1. Edit source.
2. Run `pnpm run test:extension`.
3. Build extension.
4. Launch `Debug Extension`.
5. Validate behavior in Extension Development Host.

For milestone/release checks:

1. Run automation lane (`validate:affected`, extension tests, coverage).
2. Run manual lane on disposable workspace.
3. Package VSIX.
4. Install VSIX into clean profile.
5. Re-run critical manual checks against installed VSIX.

## 9. Definition of Done (Foundation Milestone)

The foundation milestone is complete when a developer can:

1. Discover a valid loop in `.huckleberry/loops`.
2. Run command-backed deterministic steps.
3. See explicit failure/terminal status on required-step failure.
4. Inspect stdout/stderr/exit-code evidence from UI.
5. Cancel a running loop.
6. Reload VS Code without corrupting run state.
7. Package and install VSIX in clean profile.
8. Repeat the same scenario outside Extension Development Host.

## Related Docs

- `docs/reimagine/09 Practical Validation Matrix.md`
- `docs/manual-testing.md`
- `apps/huckleberry-extension/package.json`
- `.vscode/launch.json`
