# MVP Experience

**Status: Current**

## First vertical slice

The MVP proves one complete loop: repair TypeScript errors using a coding agent and a deterministic type-check command.

## Preconditions

- A TypeScript repository is open in a trusted VS Code workspace.
- The repository is a Git worktree with a clean or explicitly acknowledged starting state.
- A supported coding-agent runtime is available.
- A valid loop definition specifies the type-check command, allowed paths, and budgets.

## Developer journey

### 1. Discover and inspect

The Loops view shows `Repair TypeScript errors` and whether its configuration is runnable.

Before starting, the developer can inspect:

- the objective;
- type-check command;
- actor/provider;
- allowed paths;
- maximum iterations, turns, files, and time;
- worktree isolation;
- success and stop conditions.

### 2. Start safely

Huckleberry validates workspace trust and creates an isolated worktree. It records the base revision and initial status. If the starting conditions are unsafe or ambiguous, the run does not start silently.

### 3. Establish the baseline

Huckleberry runs the configured type checker before asking the agent to edit anything.

- If it passes, the run succeeds with baseline evidence and no agent invocation.
- If it fails, diagnostics become the initial feedback bundle.

### 4. Attempt a repair

Huckleberry invokes the coding agent with:

- the objective and acceptance rule;
- the current working directory;
- allowed paths and remaining budgets;
- normalized diagnostics and artifact references;
- current changed-file and diff context;
- instructions not to claim success without verifier evidence.

The agent may inspect and edit files but does not control iteration or completion.

### 5. Measure and verify

After the actor returns, Huckleberry independently computes the Git delta and checks scope limits. It then reruns the type checker.

The result, not the agent summary, determines what happens next.

### 6. Continue or stop

- Passing typecheck: succeed.
- Failing typecheck with budget remaining: create a new feedback bundle and iteration.
- Scope or policy violation: fail safely or request approval according to policy.
- No progress across attempts: pause for human intervention or exhaust according to configuration.
- Cancellation: terminate the actor and verifier, then persist a cancelled outcome.

### 7. Inspect and resume

The Runs view groups events by iteration and shows:

- why the iteration started;
- actor status and claim;
- independently measured file changes;
- verifier result;
- feedback selected for the next attempt;
- budgets consumed and remaining;
- the reason the run continued or stopped.

After a reload, a developer can inspect the full run. A non-terminal run is either safely resumable from persisted state or explicitly marked interrupted with recovery actions.

## Required terminal evidence

A successful run contains:

- base revision and execution context;
- final type-check command, exit code, timestamp, stdout, and stderr;
- final repository delta;
- iteration count and budget usage;
- actor claims kept separate from evidence;
- an explicit `succeeded` stop reason tied to the passing verifier result.

## Technical MVP acceptance test

Given a fixture repository containing a repairable TypeScript type error, a developer can start the loop from the Activity Bar and observe the agent edit the fixture in an isolated worktree. The type checker fails initially, passes after no more than three attempts, no out-of-scope file changes remain, and the complete iteration record is inspectable after reloading VS Code.

A second fixture contains an unrepairable or deliberately constrained error and proves that the loop exhausts without claiming success.

This is Validation Gate B. The MVP is not considered useful merely because the fixtures pass. It must also meet the real-repository comparison criteria in [Validation Gate C](./VALIDATION.md#gate-c-dogfood-usefulness).
