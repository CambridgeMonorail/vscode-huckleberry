# Loop Runtime Specification

**Status: Current design target**

This document defines the minimum runtime semantics required by the MVP. It is not a statement that the current implementation already supports them.

## Runtime ownership

The runtime, not the actor, owns:

- iteration sequencing;
- verifier execution;
- feedback construction;
- policy enforcement;
- budget accounting;
- persistence;
- terminal decisions.

The extension host owns VS Code APIs and user interaction. A child runner may own durable orchestration and command execution. Agent execution must occur in a process that can use the selected provider API, with explicit messages across the process boundary.

## Proposed v2 loop shape

The final serialized schema will be fixed after the agent-runtime spike. The following shape expresses the required semantics:

```yaml
schemaVersion: 2
kind: loop
id: repair-typescript
name: Repair TypeScript errors

inputs:
  objective:
    type: string
    required: true

execution:
  isolation: worktree

actor:
  adapter: selected-coding-agent
  instructions: |
    {{ inputs.objective }}
    Resolve the supplied TypeScript diagnostics.
  allowedPaths:
    - src

verifiers:
  - id: typecheck
    type: command
    command: pnpm typecheck
    feedback: typescript-diagnostics

success: verifiers.typecheck.exitCode == 0

budgets:
  maxIterations: 3
  maxTurnsPerIteration: 8
  maxFilesChanged: 5
  timeoutMinutes: 20

onExhausted: pause
```

This example is a design target, not yet a supported file.

## Run state

A run persists:

- run and loop identifiers;
- loop-definition digest;
- workspace, base revision, branch, and worktree location;
- resolved inputs and effective policy;
- status and terminal reason;
- current and completed iteration records;
- consumed and remaining budgets;
- evidence and claim references;
- pending approval or recovery action.

## Iteration state

An iteration persists:

- sequence number;
- start reason;
- input feedback bundle;
- actor invocation identity, status, usage, and claim;
- repository state before and after the actor;
- independently calculated delta;
- verifier invocations and evidence;
- predicate decisions;
- continuation or stop decision.

## Agent execution protocol

The provider boundary must support:

```ts
interface ActorRequest {
  runId: string;
  iteration: number;
  objective: string;
  workingDirectory: string;
  allowedPaths: string[];
  feedback: FeedbackBundle;
  budgets: RemainingBudgets;
}

interface ActorResult {
  invocationId: string;
  status: 'completed' | 'cancelled' | 'failed';
  claim?: string;
  turnsUsed?: number;
  usage?: Record<string, number>;
}
```

`ActorResult` intentionally does not provide authoritative changed files or success. The runtime derives changes from repository state and success from verifiers.

## Feedback protocol

Verifier adapters produce typed summaries plus immutable artifact references. Feedback construction selects a bounded, model-actionable subset without discarding the full evidence.

For TypeScript, normalized diagnostics should include file, line, column, error code, and message. Repeated diagnostics and unchanged diffs should be identifiable so the runtime can report lack of progress.

## Predicate model

Predicates operate only on a limited typed context:

- verifier status and typed summary fields;
- iteration number;
- budget state;
- independently measured repository delta;
- explicit approval decisions.

The MVP must not evaluate arbitrary JavaScript from loop files. The implementation should choose a small expression language or structured predicate objects and document it before schema v2 is accepted.

## Safety invariants

- No actor runs before workspace trust and effective policy are known.
- The runtime records repository state before and after every actor invocation.
- Allowed-path and file-count checks use the measured delta, not provider claims.
- A verifier pass must be fresh relative to the latest actor changes.
- Actor cancellation propagates to the provider and produces a terminal or recoverable state.
- Exhaustion cannot be represented as success.
- Secrets, full prompts, and source contents are not included in telemetry.

## Compatibility

Existing schema-v1 command loops remain useful as deterministic workflows during migration. They must be labelled as v1 workflows rather than presented as full development loops.

Schema v2 should not be implemented until the actor protocol and iteration persistence boundaries are validated by the vertical slice.
