# Domain Model

**Status: Current**

This vocabulary is normative. Product and implementation documents should use these terms consistently.

## Objective

The concrete outcome requested by a developer for one loop run.

An objective is smaller than a general product goal. Example: `Make the configured TypeScript check pass without changing generated files.`

## Loop definition

A version-controlled specification of a repeated engineering feedback process.

A loop definition owns:

- objective template and inputs;
- actor configuration;
- verifier configuration;
- feedback mapping;
- success and failure predicates;
- budgets and scope constraints;
- isolation and approval policy.

## Loop run

One execution of a loop definition against a specific repository state and set of inputs.

A run owns its iterations, evidence, decisions, execution context, budgets, and terminal outcome.

## Iteration

One bounded attempt-and-evaluate cycle:

1. Rehydrate current repository and run state.
2. Build an iteration context from the objective, constraints, and latest evidence.
3. Invoke the actor.
4. Measure the resulting repository delta independently.
5. Run the verifiers.
6. Persist evidence and evaluate predicates.
7. Complete, continue, pause, or stop.

Each new iteration receives fresh bounded agent context. Continuity comes from repository state and the structured iteration context, not an indefinitely growing conversation.

## Actor

The component allowed to perform work during an iteration. For the MVP, the actor is one coding-capable agent that can inspect and edit files in the execution context.

An actor never determines that the loop has succeeded.

## Agent adapter

A provider-specific implementation behind a stable actor boundary.

The adapter must report lifecycle and usage information, but Huckleberry must independently inspect repository changes and verifier outcomes rather than trusting adapter claims.

## Verifier

A deterministic or explicitly human evaluation that produces evidence used by a predicate.

Examples include a type checker, tests, lint, a browser assertion, a security scan, a diff limit, or an approval decision.

## Feedback bundle

The structured input derived from verifier evidence and supplied to the next iteration.

For the MVP it contains:

- failed command and exit code;
- normalized TypeScript diagnostics;
- bounded stdout and stderr excerpts with artifact references;
- files changed during prior attempts;
- current diff summary;
- remaining budgets;
- unresolved verifier failures;
- the reason another iteration was selected.

## Evidence

An immutable observation produced by Huckleberry or a verifier, with provenance.

Evidence records who or what produced it, when, against which repository state, and where the full artifact is stored. Agent prose is a claim, not evidence.

## Predicate

A deterministic expression over typed run state or evidence. Predicates decide success, continuation, approval, or failure.

Examples:

- `verifiers.typecheck.exitCode == 0`
- `iteration.number < budgets.maxIterations`
- `delta.filesChanged <= budgets.maxFilesChanged`

## Policy

Constraints evaluated before and after an action. MVP policy covers workspace trust, allowed paths, blocked commands, file-count limits, time limits, and approval requirements.

## Budget

A consumable execution limit such as maximum iterations, actor turns, elapsed time, files changed, or provider usage.

Exhausting a budget is a terminal or human-intervention outcome, never implicit success.

## Skill

Reusable instructions or engineering discipline that can shape an actor invocation.

A skill is not automatically an executable step. Huckleberry may later discover skill files and bind them to actor invocations, but the loop definition still owns verification, feedback, budgets, and stopping.

## Workflow

A future composition of loops and one-off actions. The MVP does not need a general workflow abstraction beyond compatibility with existing loop files.

## Goal

A possible future container for a longer-lived objective spanning multiple loop runs and planning decisions. Goal planning is outside the MVP and must not replace the loop as the runtime unit.

## Terminal outcomes

- `succeeded`: all success predicates are supported by fresh evidence.
- `exhausted`: a retry or resource budget ended before success.
- `failed`: execution or policy made safe continuation impossible.
- `cancelled`: a human requested termination.
- `rejected`: a human rejected a required approval.
- `blocked`: external input or authority is required before continuation.

`paused` is non-terminal and must include a persisted reason and available actions.
