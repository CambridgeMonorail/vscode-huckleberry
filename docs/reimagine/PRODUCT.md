# Product Thesis

**Status: Current**

## Product statement

Huckleberry is a VS Code extension for running bounded, evidence-driven development loops.

It coordinates a coding agent, deterministic engineering tools, repository state, and human judgement. The agent performs work. Verifiers determine whether the work is acceptable. Huckleberry carries feedback between attempts and owns the decision to continue or stop.

## The problem

Coding agents can produce changes quickly, but developers still have to repeatedly:

- explain the objective and constraints;
- run types, tests, lint, or browser checks;
- feed failures back to the agent;
- inspect what changed;
- decide whether another attempt is safe or useful;
- remember what happened after a session or editor restart.

Prompts can request this behaviour, but prompts do not reliably enforce it. Agent conversation is transient and agent claims are not proof.

## Product promise

Define the feedback loop once, then run and supervise it from VS Code.

Huckleberry makes each attempt bounded, each verifier result durable, each decision explainable, and each terminal outcome explicit.

## Primary user

A developer who already uses a coding agent and has deterministic feedback tools such as a type checker, test runner, linter, browser automation, or security scanner.

The developer wants the agent to iterate with less prompting without surrendering control of the repository or the definition of done.

## Core jobs

1. **Define** which actor may work, which verifiers decide, and what limits apply.
2. **Run** repeated attempts with verifier feedback carried forward automatically.
3. **Supervise** progress, changes, evidence, budgets, pauses, and failures in VS Code.
4. **Resume** from repository and run state without depending on chat history.
5. **Share** version-controlled loops that encode a team's engineering practice.

## Principles

### Verifiers decide

A compiler exit code, test result, screenshot, diagnostic, or review decision is evidence. An agent saying it succeeded is a claim.

### Feedback is first-class

A failed verifier must produce structured feedback that the next attempt can consume. Merely rerunning a static prompt is not a development loop.

### Each attempt is bounded

Attempts have explicit path, file, turn, time, and iteration limits. Limits are enforced independently of the agent's report.

### Repository state provides continuity

The current files, diffs, committed loop definition, run events, and evidence are durable state. Conversation may help an attempt but is not the system of record.

### Humans own judgement

The runtime automates mechanical feedback. Humans approve subjective outcomes, risky changes, expanded scope, and exhausted loops.

### Start narrow

The product earns broader orchestration by first making one common feedback loop trustworthy.

## MVP boundary

The MVP is a TypeScript repair loop that:

- starts from a version-controlled loop definition;
- works in an isolated Git worktree;
- invokes a coding-capable agent;
- runs a configured type-check command;
- sends parsed failures and current change context into the next attempt;
- independently enforces scope and budgets;
- stops on verified success, exhaustion, policy failure, cancellation, or human intervention;
- persists an inspectable record of every attempt.

## Non-goals for the MVP

- Autonomous decomposition of broad product goals.
- Multiple agents working concurrently.
- An organisation or third-party skill marketplace.
- General scheduling across repositories.
- Automatic learning or mutation of repository knowledge.
- Visual workflow authoring.
- Supporting every coding-agent provider.
- Replacing issue trackers, CI systems, or coding agents.

These may become future layers. They are not prerequisites for proving the product.

## Product success

The MVP is successful when developers can run the repair loop on real TypeScript repositories and observe:

- verified fixes without repeatedly copying diagnostics into chat;
- no false success when the verifier still fails;
- no changes outside declared scope;
- a clear explanation for every continuation and stop;
- useful evidence after reload;
- less supervision time than an equivalent manual prompt-run-check cycle.

The hypotheses, comparison method, thresholds, and continue/change/pivot/stop decisions are defined in the [Usefulness Validation Plan](./VALIDATION.md). Passing automated fixtures proves safety and feasibility; it does not by itself prove product usefulness.
