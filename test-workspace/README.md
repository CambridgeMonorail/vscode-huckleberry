# Huckleberry Test Workspace

This folder is used as the Extension Development Host workspace when running
`Debug Extension` from the root workspace.

Purpose:

- Provide a safe child workspace for extension integration and manual checks
- Allow the extension to create and modify files during testing
- Keep generated test files isolated from source folders

You can add disposable files and folders here while debugging.

## Agent-assisted manual validation

This workspace is also the handoff boundary for manual tests that require the real Extension Development Host and a signed-in Copilot session.

The source-workspace agent should place a run-specific Markdown plan under `test-plans/`. After launching `Debug Extension`, invoke `/run-huckleberry-validation` in Copilot Chat and provide a unique run ID.

Copilot may prepare fixtures, run terminal checks, and write evidence. The human remains responsible for UI actions and subjective observations. Evidence is written under `_debug-evidence/<RUN_ID>/` and reviewed from the source workspace after the debug session.

The workspace-local `AGENTS.md` and `.github/copilot-instructions.md` deliberately prevent the debug-host agent from changing extension source or fabricating UI evidence.

This harness is primarily for controlled technical and safety validation. Passing its smoke fixtures does not satisfy the real-repository usefulness comparison required by Validation Gate C.

## Generated repair fixtures

The repair-fixture harness creates a small independent Git repository under `_scenario-workspaces/<RUN_ID>/`, seeds one declared defect, and stores machine and attributed evidence under `_debug-evidence/<RUN_ID>/`.

From the debug-host Copilot session, invoke `/run-repair-fixture` and supply a new run ID plus one scenario:

- `react-prop-contract` — a shared TypeScript contract break visible to typecheck;
- `react-price-regression` — a behavior regression that passes typecheck but fails a focused test.

Copilot can prepare the repository, attempt the repair, run fresh verification, and write the result without switching back to the source workspace. The human is needed only for UI actions or subjective observations requested by the plan.

Generated repositories and evidence are ignored. The tracked templates, patches, scenario declarations, script, prompt, and plan remain reviewable.

These runs are controlled Gate B fixture/harness evidence. They do not measure the pain of a normal manual workflow and must not be counted toward Gate A or Gate C.
