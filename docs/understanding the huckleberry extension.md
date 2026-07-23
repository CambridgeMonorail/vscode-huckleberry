# Understanding the Huckleberry Extension

This document explains the current architecture of the Huckleberry extension in the reimagined workflow-first model. It focuses on how loops, runs, approvals, and evidence are wired today, and calls out legacy task-domain modules that still exist during migration.

## Product Model

Huckleberry is a workflow orchestration extension for VS Code. The active user-facing model is:

- Loops: workflow definitions discovered from workspace files
- Runs: execution records and timelines produced by the runner
- Evidence: artifacts and summaries persisted for auditability

Primary workspace storage paths:

- `.huckleberry/loops` for workflow definitions
- `.huckleberry/runs` for run history, events, summaries, and artifacts

## Source Layout Overview

Current source layout:

```txt
apps/huckleberry-extension/src/
├─ activation/        # Composition root modules for startup wiring
├─ config/            # Configuration constants and helpers
├─ handlers/          # Chat and command request routing
├─ interfaces/        # Shared interfaces and contracts
├─ lib/               # Pure logic utilities (minimal VS Code coupling)
├─ providers/         # TreeDataProviders for Loops, Runs, Evidence
├─ runner/            # Runner client/host, IPC, state machine, evidence, worktree
├─ services/          # Core extension services
├─ tools/             # LM tool implementations used by internal tool manager
├─ utils/             # VS Code-aware utility helpers (logging, UI, params)
├─ workflows/         # Workflow schema/types/validation/loading
├─ config.ts          # Configuration entrypoint
├─ extension.ts       # Activation entrypoint
└─ types.ts           # Shared type definitions
```

## Activation and Composition

`src/extension.ts` is the entrypoint. It delegates startup work to `src/activation/*` modules:

- `createExtensionServices`: constructs service instances
- `registerShellViews`: registers Loops, Runs, and Evidence views plus run/approval/evidence commands
- `registerCoreCommands`: registers shared extension commands
- `registerWorkspaceLifecycle`: workspace-change lifecycle wiring
- `registerChatParticipants`: chat participant registration

This keeps `extension.ts` focused on composition rather than business logic.

## Views and Explorer Providers

The Activity Bar container surfaces three workflow-centric views:

- Loops: discovered/validated loop definitions
- Runs: run status and timeline navigation
- Evidence: artifacts grouped by run, step, and category

Provider modules in `src/providers/`:

- `LoopExplorerProvider`: loop discovery and validation surface
- `RunExplorerProvider`: run list and timeline details
- `EvidenceExplorerProvider`: grouped evidence browsing and artifact open/reveal actions
- Presentation helpers (`runTimelinePresentation`, `evidenceExplorerPresentation`, isolation helpers) format model data for display

## Workflow and Runner Stack

Workflow definition pipeline (`src/workflows/`):

- Type/schema model for loop definitions
- Validation for semantic and structural correctness
- Loader utilities for reading workflow files

Execution pipeline (`src/runner/`):

- `RunnerClient` and `RunnerHost`: extension-to-runner boundary
- `stateMachine`: deterministic step execution and transitions
- `commandExecutor`: command-step execution
- `agentAdapter` and `copilotAgentAdapter`: bounded agent-step integration
- `runEventStore`: append/read events, reconstruct runs, generate summaries
- `evidenceStore`: persist step evidence artifacts
- `worktreeLifecycleService`: provision/reuse/cleanup isolated worktrees

## Services Layer

Core services in `src/services/` include:

- `ChatService`: chat participant behavior and lifecycle
- `ToolManager`: internal tool registration/execution coordination
- `LanguageModelToolsProvider`: LM tool exposure and invocation glue
- `LoopDiscoveryService`: workspace loop discovery
- `WorkflowValidationService`: workflow validation orchestration
- `WorkflowTemplateService`: starter loop scaffolding
- `ExtensionStateService`: extension-level state coordination

## Chat, Commands, and Tools

`src/handlers/` manages request routing from chat and command palette surfaces.

Current user-facing product surfaces are loop/run/evidence-oriented (for example: create starter templates, run loop, run status, submit approval decision, open summary, open/reveal evidence artifacts).

`src/tools/` contains internal file/task-oriented helper tools still used by existing internals. These are not the primary product narrative and may continue evolving as migration progresses.

## Data Flow (Workflow-First)

1. User starts from chat or explorer views.
2. Request routes through handlers/commands to services and runner client.
3. Runner host executes workflow steps via deterministic state machine.
4. Events and artifacts are persisted to `.huckleberry/runs`.
5. Providers refresh Loops/Runs/Evidence views from persisted state.
6. User inspects summaries, deep links, and evidence artifacts for decisions and recovery.

## Testing Structure

```txt
apps/huckleberry-extension/tests/
├─ unit/              # Unit tests for providers, runner, workflows, services, utils
├─ integration-edh/   # Extension Development Host integration tests
├─ stubs/             # Test stubs
└─ __mocks__/         # Module mocks (including VS Code API)
```

Testing emphasis in the reimagined model is on:

- Runner lifecycle behavior
- Workflow validation correctness
- Evidence and summary determinism
- View-model rendering for Loops/Runs/Evidence

## Migration Note: Legacy Task-Domain Modules

Legacy task-management modules still exist in parts of the codebase (for example under `src/handlers/tasks`, `src/handlers/commandHandlers`, parts of `src/tools`, and some task-oriented test fixtures). They are documented here as migration context, not as the active product model.

When contributing:

- Prefer loop/run/evidence architecture for new features
- Avoid expanding legacy task-domain runtime paths
- Keep behavior deterministic and evidence-first

## Further Resources

- [Release Process](./release-process.md)
- [Testing Strategy](./testing-strategy.md)
- [Improving Quality](./improving-quality.md)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [GitHub Copilot](https://github.com/features/copilot)
