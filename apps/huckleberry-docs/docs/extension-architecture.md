---
sidebar_position: 11
---

# Extension Architecture

This page documents the current workflow-first architecture of Huckleberry.

## Architectural Overview

Huckleberry is organized around three primary product surfaces:

- Loops: discover and validate workflow definitions
- Runs: execute loops and inspect lifecycle state
- Evidence: inspect artifacts, summaries, and deep links

Current high-level structure:

```text
huckleberry-extension/
├── src/
│   ├── extension.ts            # Entry point and activation orchestration
│   ├── activation/             # Composition root modules
│   ├── providers/              # Loops/Runs/Evidence TreeDataProviders
│   ├── runner/                 # Runner client/host, IPC, state machine, evidence, worktrees
│   ├── workflows/              # Workflow schema, loader, validator
│   ├── services/               # Chat, discovery, validation, templates, state
│   ├── handlers/               # Chat and command request routing
│   ├── tools/                  # Internal tool implementations
│   ├── utils/                  # Logging and VS Code helpers
│   └── types.ts                # Shared type definitions
```

## Entry Point and Activation

`src/extension.ts` handles startup and delegates to activation modules:

- `createExtensionServices`
- `registerShellViews`
- `registerCoreCommands`
- `registerWorkspaceLifecycle`
- `registerChatParticipants`

This keeps startup composable and testable.

## Product Surfaces

### Loops Surface

Loops are workflow definitions located under `.huckleberry/loops`.

Key responsibilities:

- Discover loop files from workspace
- Validate schema and semantics
- Present validation state in the Loops view
- Allow execution via `Run Loop`

Key modules:

- `services/loopDiscoveryService.ts`
- `services/workflowValidationService.ts`
- `providers/LoopExplorerProvider.ts`
- `workflows/*`

### Runs Surface

Runs represent workflow executions and lifecycle timelines.

Key responsibilities:

- Start, monitor, and cancel runs
- Surface run status and transitions
- Handle approval-gate pause and resume decisions
- Open run summaries and timeline deep links

Key modules:

- `runner/runnerClient.ts`
- `runner/runnerHost.ts`
- `runner/stateMachine.ts`
- `providers/RunExplorerProvider.ts`
- `providers/runTimelinePresentation.ts`

### Evidence Surface

Evidence provides inspectable execution outputs.

Key responsibilities:

- Group artifacts by run/step/category
- Open and reveal artifacts
- Surface missing/stale artifact states
- Support traceability for decisions and audits

Key modules:

- `providers/EvidenceExplorerProvider.ts`
- `providers/evidenceExplorerPresentation.ts`
- `runner/evidenceStore.ts`
- `runner/runEventStore.ts`

## Runner Architecture

The runner layer is responsible for deterministic workflow execution and persistence.

Core components:

- Runner host/client IPC boundary
- Command-step execution
- Optional agent-step adapter boundary
- Approval decision handling
- Event persistence and run reconstruction
- Summary generation (`summary.json`, `summary.md`)
- Isolation support with worktree lifecycle service

Storage model:

- `.huckleberry/loops` for workflow definitions
- `.huckleberry/runs` for event logs, summaries, and artifacts

## Chat and Agent Mode Integration

Huckleberry integrates with VS Code Chat and Language Model Tools so users can drive workflow operations conversationally.

Common operation categories:

- Loop operations
- Run operations
- Approval operations
- Evidence operations

The assistant experience is conversational, while execution and state remain deterministic and inspectable.

## Request Flow

Typical flow for a workflow action:

1. User triggers chat or command action.
2. Handler routes to service and/or runner client.
3. Runner host executes state-machine transitions.
4. Events and artifacts are persisted.
5. Providers refresh Loops/Runs/Evidence views.
6. User inspects summary and evidence for next decision.

## Testing Strategy

Current testing emphasizes workflow reliability and auditability:

- Unit tests for runner, providers, and workflow validation
- Integration tests for VS Code extension behavior
- Manual smoke checks for loop execution, approval gates, deep links, and evidence

## Security and Reliability Principles

- Workspace-local storage for loops/runs/evidence
- Explicit stop reasons and approval decisions
- Deterministic summary generation from persisted events
- Bounded agent behavior and command policy guardrails

## Migration Note

Legacy task-domain modules may still exist in the repository while migration completes. New feature work should target the workflow-first architecture described above.
