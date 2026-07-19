# huckleberry Product Requirements Document

**Product:** huckleberry
**Product type:** Visual Studio Code extension
**Document status:** Initial build specification
**Primary audience:** Product engineering and extension development team
**Target platform:** Visual Studio Code desktop
**Initial ecosystem:** GitHub Copilot, TypeScript, Node.js, Git and Nx-based repositories

## 1. Product summary

huckleberry is a Visual Studio Code extension for defining, running and inspecting evidence-driven engineering loops.

It allows developers to combine deterministic engineering checks, bounded AI repair steps, conditions, retry limits and human approval gates into reusable, version-controlled workflows.

The product is not intended to replace GitHub Copilot, testing tools, continuous integration systems or existing VS Code functionality.

It provides an orchestration layer that connects them.

The central product principle is:

> Do not ask the agent to keep trying. Define what trying means.

A huckleberry workflow might:

1. Run TypeScript validation.
2. Record the result.
3. Ask a Copilot agent to repair failures.
4. Run validation again.
5. Stop after a defined number of attempts.
6. Continue to unit tests if validation passes.
7. Collect screenshots and accessibility results.
8. Ask a human to approve visual changes.
9. Produce a final evidence report.

The huckleberry engine, rather than the AI agent, controls the workflow, retry count, evidence requirements and stopping conditions.

## 2. Problem statement

GitHub Copilot agents can already plan tasks, edit files, run commands and respond to failures. VS Code also supports custom agents, skills, hooks, plugins, background agents and third-party agent sessions. However, these capabilities are largely controlled through prompts, chat sessions and individual agent configurations.

Developers commonly ask agents to:

* Continue until tests pass.
* Fix any linting errors.
* Review their own changes.
* Keep trying until the feature works.
* Run all relevant validation before finishing.

These instructions leave important decisions under the control of the model:

* Which checks should be run.
* Whether the evidence is current.
* Whether a failure deserves another attempt.
* Whether the agent has exceeded the requested scope.
* Whether a check genuinely passed.
* When the task should stop.
* Whether human approval is required.

This creates workflows that are difficult to inspect, reproduce and govern.

Existing orchestration extensions tend to focus on parallel agents, role-based AI teams or visual multi-agent composition. Examples already exist for parallel worktree-based orchestration and role-based agent pipelines.

huckleberry will instead focus on:

* Explicit engineering checks.
* Typed evidence.
* Bounded repair attempts.
* Inspectable state transitions.
* Human approval at meaningful decision points.
* Reusable workflows stored with the codebase.

## 3. Product vision

huckleberry will become the VS Code-native workbench for creating and running executable development processes.

A developer should be able to open a repository and see:

* Which loops are available.
* What each loop will run.
* Which tools and agents it may use.
* What evidence it requires.
* What is currently running.
* Why a run passed, failed or stopped.
* What changed during each repair attempt.
* Whether the result is ready for human approval.

The product should feel closer to a local workflow engine or state-machine debugger than another AI chat interface.

## 4. Product positioning

### 4.1 Primary positioning

> A version-controlled VS Code workflow engine that connects coding agents to deterministic engineering evidence.

### 4.2 Supporting message

> Build the loop, not the prompt.

### 4.3 Product category

huckleberry sits between:

* GitHub Copilot and other coding agents.
* Local development tools.
* Git and worktrees.
* Test runners.
* Continuous integration pipelines.
* Human code and visual review.

### 4.4 Differentiation

| Typical agent orchestrator                | huckleberry                                                |
| ----------------------------------------- | ------------------------------------------------------- |
| Organises AI personas                     | Organises executable engineering steps                  |
| Centres the agent conversation            | Centres the evidence and state graph                    |
| Uses roles such as architect and reviewer | Uses checks such as typecheck, test, inspect and repair |
| May allow an agent to judge completion    | Uses explicit completion conditions                     |
| Optimises for broad autonomy              | Optimises for bounded, inspectable loops                |
| Shows agent activity                      | Shows engineering evidence                              |
| Often relies on large prompts             | Uses structured workflow definitions                    |

## 5. Goals

### 5.1 Initial product goals

huckleberry must allow developers to:

1. Define workflows in version-controlled YAML.
2. Discover available workflows from the current workspace.
3. Run workflows from a dedicated VS Code view.
4. Execute deterministic terminal commands.
5. Invoke a bounded AI repair step.
6. Branch based on structured results.
7. limit retries and execution time.
8. collect logs, diffs, test results and files as evidence.
9. pause for human approval.
10. stop with a clear and explicit terminal state.
11. inspect every step and attempt after a run.
12. run changes in the current workspace or an isolated Git worktree.

### 5.2 Longer-term goals

Future versions may support:

* Parallel branches.
* Reusable subloops.
* Visual workflow authoring.
* Pull request integration.
* Organisation-managed loop libraries.
* Cloud execution.
* Multiple agent providers.
* Shared policy packs.
* Scheduled and event-triggered workflows.
* Loop analytics and cost reporting.

## 6. Non-goals

The first release will not:

* Replace GitHub Copilot Chat.
* Replace GitHub Actions or another continuous integration system.
* Provide a general-purpose visual programming language.
* Automatically merge changes into the main branch.
* Run arbitrary unattended background jobs after VS Code has closed.
* Provide a hosted cloud orchestration service.
* Support every coding agent.
* Attempt to judge whether a product experience is aesthetically pleasing.
* Allow an AI agent to change workflow definitions during an active run.
* Use an AI response alone as proof that validation passed.
* Build a marketplace for workflow templates.
* Implement complex multi-agent role-playing workflows.
* Guarantee safe execution of arbitrary third-party scripts.

## 7. Target users

### 7.1 Primary user

A developer using VS Code and GitHub Copilot who already runs some combination of:

* TypeScript.
* ESLint.
* Unit tests.
* Playwright.
* Accessibility tests.
* Visual regression checks.
* Nx affected commands.
* Build scripts.
* Git workflows.

They want Copilot to handle repetitive repair work but do not want to surrender control of validation, scope or completion.

### 7.2 Secondary users

* Technical leads defining standard development processes.
* Platform teams creating shared engineering workflows.
* Quality engineers building repeatable validation loops.
* Front-end teams combining automated and visual review.
* Regulated or security-conscious teams requiring evidence and approval.
* Open-source maintainers standardising contribution checks.

## 8. Core user stories

### 8.1 Discover a loop

As a developer, I want huckleberry to discover workflows in my repository so that I can run approved development processes without reconstructing prompts.

### 8.2 Inspect before running

As a developer, I want to see what a loop will execute, modify and collect before I start it.

### 8.3 Run deterministic validation

As a developer, I want huckleberry to execute typechecks, linting and tests and record their actual results.

### 8.4 Repair mechanical failures

As a developer, I want a coding agent to attempt a bounded repair when a deterministic check fails.

### 8.5 Prevent infinite iteration

As a developer, I want every repair cycle to have a maximum number of attempts and a clear failure condition.

### 8.6 Inspect evidence

As a developer, I want to inspect command output, test results, diffs and screenshots for each step.

### 8.7 Approve subjective changes

As a developer, I want visual or product decisions to pause for human approval rather than being approved by the agent that made them.

### 8.8 Isolate autonomous changes

As a developer, I want longer or riskier loops to run in a Git worktree so that my active workspace remains unchanged.

### 8.9 Understand why a run stopped

As a developer, I want every stopped run to state whether it completed, failed, was cancelled, exhausted its retries or requires a decision.

### 8.10 Resume a paused run

As a developer, I want to resume a loop after providing approval or resolving an external blocker.

## 9. Product principles

### 9.1 Evidence before assertion

A command exit code, test report or captured artefact is evidence.

An agent saying that something works is a claim.

The interface must clearly distinguish between them.

### 9.2 The engine owns the loop

The workflow engine determines:

* Which step runs next.
* Whether a condition passed.
* How many retries remain.
* Whether required evidence exists.
* Whether the run can stop successfully.
* Whether human approval is required.

The agent only attempts bounded reasoning or repair work.

### 9.3 Small loops over giant workflows

huckleberry should encourage focused workflows such as:

* Repair TypeScript errors.
* Validate an affected Nx project.
* Check component accessibility.
* Capture signage screenshots.
* Review a pull request diff.

Large workflows should be composed from smaller reusable loops in later releases.

### 9.4 Human judgement remains explicit

huckleberry should automate mechanical checks.

It should expose, not disguise, decisions that require taste, product judgement or risk acceptance.

### 9.5 Repository files remain the source of truth

Workflow definitions must remain readable, reviewable and version controlled.

The future visual editor will edit the underlying YAML rather than store an opaque proprietary graph.

### 9.6 Failure should be useful

A failed run should leave behind:

* The failed step.
* The command output.
* Attempts made.
* Relevant diffs.
* The stopping reason.
* Suggested next action.

## 10. Initial scope

The minimum viable product will support:

* One VS Code workspace.
* YAML workflow definitions.
* Sequential execution.
* Conditional branches.
* Command steps.
* Agent steps.
* Approval steps.
* Evidence collection.
* Retry rules.
* Timeouts.
* Cancellation.
* Current-workspace execution.
* Git worktree execution.
* A run timeline.
* Run persistence.
* GitHub Copilot as the initial AI provider.
* Nx-aware starter workflow templates.

Parallel branches and nested subloops are excluded from the first release.

## 11. Technical approach

### 11.1 Proposed architecture

```text
VS Code extension
├── Activity Bar container
├── Loop explorer
├── Runs explorer
├── Commands
├── Notifications
├── Problems integration
└── Run details webview
          │
          ▼
Local huckleberry runner
├── Workflow parser
├── Schema validator
├── State-machine engine
├── Process executor
├── Agent adapter
├── Git worktree manager
├── Evidence store
├── Run persistence
└── Event stream
          │
          ├── GitHub Copilot SDK
          ├── Local terminal processes
          ├── Git
          ├── Test and build tools
          └── Workspace filesystem
```

VS Code extensions can contribute dedicated View Containers and Tree Views, while custom run visualisations can be implemented with the Webview API.

### 11.2 Extension process

The extension will own:

* Activation.
* Workspace discovery.
* Commands.
* Tree Views.
* User-facing configuration.
* Notifications.
* Webview lifecycle.
* Deep links into files and evidence.
* Communication with the runner.

### 11.3 Runner process

A separate local Node.js process should own workflow execution.

This process will:

* Parse and validate workflow files.
* Persist active run state.
* Launch child processes.
* Stream output.
* Invoke the selected agent adapter.
* Manage cancellations and timeouts.
* Create and remove worktrees.
* Calculate diffs.
* Store evidence metadata.
* Resume paused runs.

The runner should communicate with the extension through a local IPC mechanism such as:

* Node.js child-process IPC for the first release.
* Local sockets if process independence is later required.

### 11.4 Agent integration

The preferred initial agent runtime is the GitHub Copilot SDK.

GitHub describes the SDK as a way to embed Copilot agentic workflows within applications. Its documentation includes agent sessions and application-provided custom tools. The SDK is currently in public preview.

The use of a preview SDK introduces compatibility risk. Therefore:

* All Copilot functionality must sit behind an internal `AgentAdapter` interface.
* Workflow definitions must not contain SDK-specific implementation details.
* The runner must remain capable of executing command-only workflows without an AI provider.
* SDK failures must produce a clear stopped state rather than corrupting the run.

Proposed interface:

```ts
interface AgentAdapter {
  readonly id: string;

  isAvailable(): Promise<boolean>;

  runStep(request: AgentStepRequest): Promise<AgentStepResult>;

  cancel(runId: string, stepId: string): Promise<void>;
}
```

### 11.5 Alternative VS Code model integration

The VS Code Language Model API may be used for small bounded tasks such as summarising a run or classifying failure output. VS Code advises extension authors to account for model request quotas and rate limiting.

It should not be the primary code-editing runtime in the first release.

### 11.6 Chat integration

A future or secondary entry point may expose a huckleberry chat participant:

```text
@huckleberry run affected-project
@huckleberry explain the current failure
@huckleberry show evidence from the last attempt
```

VS Code supports extension-provided chat participants, slash commands, follow-up suggestions and participant detection.

Chat integration is not required for the initial vertical slice.

## 12. Repository structure

huckleberry files will live in a `.huckleberry` directory at the repository root.

```text
.huckleberry/
├── loops/
│   ├── affected-project.yml
│   ├── accessibility.yml
│   └── visual-review.yml
├── policies/
│   └── repository.yml
├── scripts/
│   ├── find-affected-project.mjs
│   └── parse-test-results.mjs
└── huckleberry.config.yml
```

Run data should not be committed by default.

Recommended `.gitignore` entry:

```gitignore
.huckleberry/runs/
.huckleberry/worktrees/
.huckleberry/cache/
```

User-level data, credentials and large artefacts should use VS Code extension storage rather than the repository.

## 13. Workflow definition

### 13.1 Example workflow

```yaml
schemaVersion: 1

id: validate-affected-project
name: Validate affected Nx project
description: Runs mechanical checks and repairs failures within bounded limits.

inputs:
  base:
    type: string
    default: main

execution:
  isolation: worktree
  timeoutMinutes: 30

steps:
  - id: detect-projects
    type: command
    command: pnpm nx show projects --affected --base={{ inputs.base }}
    capture:
      stdout: affected-projects.txt

  - id: typecheck
    type: command
    command: pnpm nx affected --target=typecheck --base={{ inputs.base }}
    onFailure: repair-typecheck

  - id: repair-typecheck
    type: agent
    agent: mechanical-fixer
    goal: >
      Fix only the TypeScript errors reported by the typecheck step.
    context:
      evidence:
        - typecheck.stdout
        - typecheck.stderr
    constraints:
      maxFilesChanged: 10
      allowedPaths:
        - apps/**
        - libs/**
      forbiddenPaths:
        - node_modules/**
        - dist/**
    retry:
      target: typecheck
      maxAttempts: 3

  - id: lint
    type: command
    command: pnpm nx affected --target=lint --base={{ inputs.base }}
    onFailure: repair-lint

  - id: repair-lint
    type: agent
    agent: mechanical-fixer
    goal: >
      Fix only the linting failures reported by the lint step.
    retry:
      target: lint
      maxAttempts: 2

  - id: tests
    type: command
    command: pnpm nx affected --target=test --base={{ inputs.base }}
    onFailure: repair-tests

  - id: repair-tests
    type: agent
    agent: test-fixer
    goal: >
      Diagnose and fix the failing affected tests without weakening their
      assertions unless the workflow input explicitly changed requirements.
    retry:
      target: tests
      maxAttempts: 3

  - id: approval
    type: approval
    title: Review completed changes
    evidence:
      - run.diff
      - typecheck
      - lint
      - tests

success:
  requires:
    - typecheck.passed
    - lint.passed
    - tests.passed
    - approval.approved
```

### 13.2 Schema requirements

Every workflow must contain:

* `schemaVersion`
* `id`
* `name`
* At least one step
* Explicit success requirements

Every step must contain:

* A stable `id`
* A supported `type`
* Type-specific configuration

Workflow parsing must reject:

* Duplicate step IDs.
* Missing step targets.
* Cyclic retry paths.
* Unknown node types.
* Invalid timeout values.
* Missing success requirements.
* References to unavailable evidence.
* Invalid path constraints.
* Unsupported schema versions.

## 14. Supported step types

### 14.1 Command step

Runs a local process and records its output.

```yaml
- id: typecheck
  type: command
  command: pnpm nx affected --target=typecheck
  workingDirectory: .
  timeoutSeconds: 180
```

Required output:

* Start time.
* End time.
* Exit code.
* Standard output.
* Standard error.
* Cancellation state.
* Timeout state.

### 14.2 Agent step

Invokes a coding agent with bounded instructions.

```yaml
- id: repair
  type: agent
  agent: mechanical-fixer
  goal: Fix the failures recorded by the typecheck step.
  constraints:
    maxFilesChanged: 8
    allowedPaths:
      - apps/control-panel-ui/**
```

Required output:

* Agent provider.
* Model, when available.
* Start and end time.
* Outcome.
* Files modified.
* Tool calls or summary, where exposed by the provider.
* Token usage, where exposed.
* Error or cancellation state.
* Diff produced by the attempt.

### 14.3 Condition step

Evaluates structured data without invoking a model.

```yaml
- id: has-ui-changes
  type: condition
  expression: run.diff.matches("**/*.tsx")
  onTrue: screenshots
  onFalse: approval
```

The first release may use a deliberately limited expression syntax rather than arbitrary JavaScript.

### 14.4 Approval step

Pauses the workflow for human input.

```yaml
- id: approval
  type: approval
  title: Review visual changes
  description: Confirm that the result is suitable to continue.
  evidence:
    - run.diff
    - screenshots
```

Supported responses:

* Approve.
* Reject.
* Cancel run.
* Add comment and return to a configured repair step.

### 14.5 Evidence step

Captures files or structured output.

```yaml
- id: screenshots
  type: evidence
  command: pnpm playwright test tests/screenshots.spec.ts
  collect:
    - test-results/**/*.png
    - test-results/**/*.json
```

For the MVP, an evidence step may internally use the same process runner as a command step but apply additional collection rules.

## 15. Run state machine

### 15.1 Run states

```ts
type RunStatus =
  | 'created'
  | 'validating'
  | 'queued'
  | 'running'
  | 'awaiting-approval'
  | 'cancelling'
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'blocked';
```

### 15.2 Step states

```ts
type StepStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'passed'
  | 'failed'
  | 'skipped'
  | 'awaiting-approval'
  | 'cancelled'
  | 'timed-out'
  | 'blocked';
```

### 15.3 Terminal reasons

A run must stop with one explicit terminal reason:

```ts
type StopReason =
  | 'success-requirements-met'
  | 'command-failed'
  | 'agent-failed'
  | 'retry-limit-reached'
  | 'timeout-reached'
  | 'scope-limit-exceeded'
  | 'approval-rejected'
  | 'user-cancelled'
  | 'provider-unavailable'
  | 'workflow-invalid'
  | 'external-blocker'
  | 'internal-error';
```

The UI must never show only “Stopped” or “Something went wrong”.

## 16. Retry model

Retries must be controlled by the workflow engine.

A retry definition must specify:

* Which validation step is rerun.
* Which repair step is invoked.
* Maximum attempts.
* Optional delay.
* Optional changed-file limit.
* Optional total token or cost limit.
* Optional total elapsed-time limit.

Example:

```yaml
retry:
  target: typecheck
  maxAttempts: 3
```

An agent must not be able to reset its own retry count.

Every attempt must create a distinct evidence record and diff.

## 17. Scope controls

Agent steps may be constrained by:

* Allowed paths.
* Forbidden paths.
* Maximum files changed.
* Maximum lines changed.
* Maximum attempts.
* Maximum execution time.
* Maximum tool calls, where supported.
* Maximum token usage, where supported.
* Network availability.
* Current workspace or worktree isolation.

If a limit is exceeded, the agent step must stop and the run must enter `blocked` or `failed` with the reason `scope-limit-exceeded`.

The extension must not silently discard changes made outside the allowed scope.

## 18. Isolation

### 18.1 Current workspace mode

The loop operates directly on the developer’s current working tree.

This mode is appropriate for:

* Short workflows.
* Fully supervised runs.
* Read-only validation.
* Low-risk repairs.

The UI must warn when uncommitted changes exist.

### 18.2 Worktree mode

huckleberry creates an isolated Git worktree for the run.

Proposed location:

```text
.huckleberry/worktrees/<run-id>/
```

The run must record:

* Source branch.
* Source commit.
* Worktree path.
* Branch name.
* Commits created.
* Final diff.
* Cleanup state.

The user must be able to:

* Open the worktree in a new VS Code window.
* View its diff.
* Apply changes to the current branch.
* Keep the worktree.
* Delete the worktree.

Automatic merging is outside the MVP.

## 19. Evidence model

### 19.1 Evidence interface

```ts
interface Evidence {
  id: string;
  runId: string;
  stepId: string;
  attempt: number;
  kind:
    | 'command-output'
    | 'test-result'
    | 'diagnostic'
    | 'diff'
    | 'file'
    | 'screenshot'
    | 'review'
    | 'approval'
    | 'metric'
    | 'agent-claim';
  status:
    | 'passed'
    | 'failed'
    | 'warning'
    | 'informational';
  source: {
    type: 'tool' | 'agent' | 'human' | 'engine';
    name: string;
  };
  summary?: string;
  artifactPath?: string;
  structuredData?: unknown;
  createdAt: string;
}
```

### 19.2 Evidence presentation

The UI must visibly label evidence according to its source.

Examples:

```text
TOOL EVIDENCE
TypeScript exited with code 0.

AGENT CLAIM
The component now satisfies the requirement.

HUMAN APPROVAL
Visual review approved by the developer.
```

Agent claims must never be rendered with the same pass treatment as deterministic tool evidence.

### 19.3 Evidence freshness

Success requirements must refer to evidence generated during the current run.

A test result from before the most recent repair attempt must be considered stale.

For example:

1. Tests pass.
2. Agent modifies code.
3. Previous test evidence becomes stale.
4. Tests must run again before successful completion.

## 20. User interface

### 20.1 Activity Bar container

huckleberry will contribute a dedicated Activity Bar container.

Views:

* Loops.
* Runs.
* Evidence.

VS Code supports extension-provided View Containers and Tree Views.

### 20.2 Loops view

Each loop item should show:

* Name.
* Description.
* Validation state.
* Last run status.
* Isolation mode.
* Estimated step count.
* Whether AI access is required.

Context actions:

* Run.
* Run with inputs.
* Open workflow file.
* Validate definition.
* Duplicate.
* View previous runs.

### 20.3 Runs view

Group runs by status:

```text
RUNNING
  Validate affected project

AWAITING APPROVAL
  Component accessibility

RECENT
  Passed: TypeScript repair
  Failed: Menu board screenshots
```

Each run item should show:

* Status icon.
* Name.
* Current step.
* Attempt count.
* Elapsed time.
* Isolation mode.

Context actions:

* Open run.
* Cancel.
* Resume.
* Open worktree.
* View diff.
* Delete record.

### 20.4 Run details webview

The run details webview will show:

1. Header.
2. Current status.
3. Workflow timeline.
4. Selected step details.
5. Evidence.
6. Diff.
7. Approval controls.
8. Run summary.

Suggested layout:

```text
┌────────────────────────────────────────────────────────────┐
│ Validate affected project               Running  04:18     │
│ Worktree isolation · Attempt 2 of 3                       │
├──────────────────────┬─────────────────────────────────────┤
│ Workflow             │ Selected step                       │
│                      │                                     │
│ ✓ Detect projects    │ Repair typecheck                    │
│ ✕ Typecheck          │ Agent currently editing 3 files     │
│ ● Repair typecheck   │                                     │
│ ○ Typecheck retry    │ Evidence                            │
│ ○ Lint               │ typecheck.stderr                    │
│ ○ Tests              │ attempt-1.diff                      │
│ ○ Approval           │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

The Webview API supports fully custom extension interfaces within VS Code.

### 20.5 Native VS Code integration

Where practical, huckleberry should use existing VS Code surfaces:

* Problems panel for diagnostics.
* Editor tabs for files and logs.
* Diff editor for code changes.
* Test Explorer for supported test integrations.
* Notifications for approval requests and terminal states.
* Output Channel for raw runner logs.
* Status Bar for the current active run.

The webview should orchestrate these surfaces rather than reproduce all of them.

## 21. Commands

The extension must register:

```text
huckleberry: Run Loop
huckleberry: Run Loop With Inputs
huckleberry: Validate Workflow
huckleberry: Open Current Run
huckleberry: Cancel Current Run
huckleberry: Resume Run
huckleberry: Approve Step
huckleberry: Reject Step
huckleberry: Open Run Worktree
huckleberry: View Run Diff
huckleberry: Create Starter Workflow
huckleberry: Show Output
```

Command identifiers should use a stable namespace:

```text
huckleberry.run
huckleberry.runWithInputs
huckleberry.validate
huckleberry.cancel
huckleberry.resume
huckleberry.approve
huckleberry.reject
```

## 22. Configuration

Proposed settings:

```json
{
  "huckleberry.workflowDirectory": ".huckleberry/loops",
  "huckleberry.defaultIsolation": "workspace",
  "huckleberry.runner.logLevel": "info",
  "huckleberry.worktrees.directory": ".huckleberry/worktrees",
  "huckleberry.worktrees.cleanupOnSuccess": false,
  "huckleberry.agent.provider": "github-copilot",
  "huckleberry.agent.requireConfirmation": true,
  "huckleberry.commands.requireConfirmation": true,
  "huckleberry.evidence.maxArtifactSizeMb": 25,
  "huckleberry.runs.retentionDays": 30
}
```

Security-sensitive defaults must favour confirmation and isolation over autonomy.

## 23. Security and trust

### 23.1 Workspace trust

huckleberry must respect VS Code Workspace Trust.

In an untrusted workspace:

* Workflow files may be viewed.
* Workflow definitions may be validated structurally.
* Commands may not run.
* Agents may not edit files.
* Scripts may not execute.
* Worktrees may not be created.

### 23.2 Command approval

Before the first execution of a workflow, the user should be able to inspect all statically declared commands.

Dynamic commands require additional confirmation unless explicitly allowed by trusted workspace policy.

### 23.3 Secrets

huckleberry must:

* Avoid recording environment variables by default.
* Redact configurable secret patterns.
* Avoid including the user’s full environment in agent prompts.
* Store authentication through approved provider mechanisms.
* Never store GitHub or Copilot credentials in workflow files.
* Warn when evidence files appear to contain secrets.

### 23.4 Hooks and sandboxing

VS Code agent hooks can run commands at agent lifecycle events and influence agent behaviour through structured output. Hooks are currently documented as a preview feature.

Hooks may later provide optional policy enforcement, but the MVP must not depend on them.

Likewise, any VS Code or Copilot sandbox integration should be accessed through an adapter. huckleberry’s own scope, retry and worktree controls must remain functional without preview sandbox APIs.

## 24. Persistence

Each run requires durable state.

Suggested metadata structure:

```text
.huckleberry/runs/<run-id>/
├── run.json
├── events.jsonl
├── evidence/
│   ├── typecheck.stdout
│   ├── typecheck.stderr
│   ├── attempt-1.diff
│   └── screenshot.png
└── summary.json
```

For larger artefacts or repositories that should not store run data locally, the runner may use VS Code extension storage and keep only references in repository metadata.

The event log should be append-only.

This allows the run state to be reconstructed after:

* Extension reload.
* VS Code restart.
* Runner crash.
* Webview closure.

## 25. Error handling

The product must handle:

* Invalid YAML.
* Invalid schema.
* Missing command.
* Missing executable.
* Process timeout.
* Agent provider unavailable.
* Agent authentication failure.
* Agent cancellation failure.
* Git not installed.
* Repository not under Git.
* Worktree creation failure.
* Worktree cleanup failure.
* Disk-space failure.
* Evidence write failure.
* VS Code reload.
* Runner crash.
* User cancellation.
* Unexpected internal exception.

Every error must include:

* Human-readable summary.
* Technical detail.
* Affected step.
* Whether changes may have been made.
* Recommended next action.
* Link to logs where applicable.

## 26. Telemetry and privacy

Telemetry must be opt-in unless covered by an existing clearly disclosed extension policy.

Useful product metrics include:

* Workflow started.
* Workflow completed.
* Workflow failed.
* Stop reason.
* Step type used.
* Average attempts.
* Time per step.
* Approval accepted or rejected.
* Worktree mode adoption.
* Agent provider availability.

Telemetry must not include:

* Source code.
* Prompts.
* Command output.
* File paths without anonymisation.
* Repository names.
* Evidence content.
* Secrets.
* User-entered approval comments.

Local run metrics may be more detailed because they remain on the developer’s machine.

## 27. Accessibility

The extension must meet WCAG 2.2 AA where applicable.

Requirements include:

* Full keyboard navigation.
* Visible focus states.
* No colour-only status communication.
* Screen-reader labels for state and evidence.
* Accessible webview semantics.
* Reduced-motion support.
* Support for VS Code high-contrast themes.
* Respect for VS Code font and zoom settings.
* Logical focus movement after approvals and errors.
* Accessible labels for workflow graph nodes.

## 28. Performance requirements

The extension should:

* Activate only when huckleberry files are present or a huckleberry command is invoked.
* Discover workflows within 500 milliseconds for a typical repository.
* Render the Loops view without parsing large evidence files.
* Stream process output without loading all logs into memory.
* Avoid blocking the extension host.
* Keep runner communication asynchronous.
* Handle log files of at least 50 MB.
* Support at least 100 stored runs without noticeable explorer degradation.
* Debounce file-watcher updates.
* Lazy-load artefacts and diffs.

## 29. Starter workflows

The extension should ship with three templates.

### 29.1 Validate affected Nx project

```text
Detect affected projects
→ Typecheck
→ Repair on failure
→ Lint
→ Repair on failure
→ Unit tests
→ Repair on failure
→ Human approval
```

### 29.2 Repair TypeScript errors

```text
Run configured typecheck
→ Collect diagnostics
→ Bounded repair
→ Rerun typecheck
→ Stop after three attempts
```

### 29.3 Validate React component

```text
Run typecheck
→ Run unit tests
→ Run accessibility test
→ Capture screenshot
→ Human visual approval
```

The first implementation milestone should concentrate on the affected Nx project workflow.

## 30. MVP acceptance criteria

### 30.1 Workflow discovery

* The extension discovers valid YAML files under `.huckleberry/loops`.
* Invalid workflows are clearly marked.
* Selecting a workflow opens its source file.
* Validation errors include a line or field reference.

### 30.2 Running commands

* A command step launches successfully.
* Standard output and error stream into the run view.
* Exit codes are recorded.
* Timeouts stop the process.
* Cancellation terminates the process and child processes.
* A failed command cannot be marked as passed by an agent.

### 30.3 Running agent repairs

* The runner detects whether the Copilot adapter is available.
* A repair step receives only configured context and evidence.
* File changes are recorded.
* Attempt limits are enforced by the engine.
* Provider failure stops cleanly.
* Command-only workflows remain usable without Copilot.

### 30.4 Conditions and retries

* A failed validation step can route to a repair step.
* Successful repair routes back to validation.
* Attempt counts persist after reload.
* Stale evidence is invalidated after file changes.
* The run stops with `retry-limit-reached` after the configured limit.

### 30.5 Approval

* The workflow pauses at an approval step.
* The user can inspect required evidence.
* Approve resumes the run.
* Reject produces the configured result.
* Approval identity and time are recorded locally.

### 30.6 Worktree isolation

* huckleberry can create a worktree from the current commit.
* Commands and agents execute inside the worktree.
* The current working tree remains unchanged.
* The user can view the final diff.
* The user can keep or remove the worktree.
* Cleanup failures are reported without losing run evidence.

### 30.7 Run inspection

* Every step appears in the timeline.
* Attempts are displayed separately.
* Evidence can be opened.
* The final stopping reason is explicit.
* A completed run includes a summary of checks and changed files.

### 30.8 Recovery

* Closing the run webview does not stop the run.
* Reloading VS Code restores run state.
* A runner crash changes the run to a recoverable blocked state.
* The user can inspect partial evidence after failure.

## 31. Suggested implementation phases

### Phase 1: Extension shell

Deliver:

* Extension scaffolding.
* Activity Bar container.
* Loops and Runs Tree Views.
* Workflow discovery.
* YAML schema validation.
* Output Channel.
* Basic settings.
* Command registration.

Exit condition:

A user can see and validate workflows but cannot run them.

### Phase 2: Deterministic runner

Deliver:

* Runner process.
* State-machine engine.
* Command steps.
* Conditions.
* Timeouts.
* Cancellation.
* Event log.
* Run timeline.
* Evidence files.

Exit condition:

A command-only Nx validation workflow can run from start to finish.

### Phase 3: Copilot repair adapter

Deliver:

* `AgentAdapter` interface.
* GitHub Copilot SDK adapter.
* Agent steps.
* Context assembly.
* File-change tracking.
* Retry limits.
* Scope controls.
* Provider error handling.

Exit condition:

huckleberry can run typecheck, request one bounded repair, rerun typecheck and stop correctly.

### Phase 4: Approvals and worktrees

Deliver:

* Approval steps.
* Approval UI.
* Git worktree manager.
* Worktree diff.
* Open worktree command.
* Keep and cleanup controls.

Exit condition:

A full affected-project loop can run safely in an isolated worktree and wait for final approval.

### Phase 5: Product hardening

Deliver:

* Accessibility pass.
* Recovery testing.
* Secret redaction.
* Workspace Trust.
* Performance improvements.
* Schema documentation.
* Starter templates.
* Extension packaging.
* Marketplace assets.
* User documentation.

Exit condition:

The extension is ready for a limited public preview.

## 32. Testing strategy

### 32.1 Unit tests

Test:

* YAML parsing.
* Schema validation.
* Condition evaluation.
* Retry counting.
* State transitions.
* Evidence freshness.
* Path constraints.
* Stop-reason selection.
* Redaction.
* Run restoration.

### 32.2 Integration tests

Test:

* Runner process lifecycle.
* Streaming command output.
* Cancellation.
* Timeouts.
* Git worktree creation.
* Worktree cleanup.
* Agent adapter mocking.
* VS Code command invocation.
* File watchers.
* Run persistence.

### 32.3 End-to-end extension tests

Use VS Code extension testing to verify:

* Activation.
* Workflow discovery.
* Tree View updates.
* Running a sample loop.
* Opening the run webview.
* Approving a paused step.
* Cancelling a run.
* Restoring after reload.

### 32.4 Failure simulation

Include controlled fixtures for:

* Failing typecheck.
* Agent provider unavailable.
* Retry exhaustion.
* Hanging command.
* Child process that ignores termination.
* Invalid workflow.
* Dirty working tree.
* Worktree collision.
* Disk write failure.
* Runner crash.

## 33. Engineering constraints

* Use TypeScript in strict mode.
* Use named exports.
* Keep extension-host code separate from runner code.
* Keep provider-specific code behind adapters.
* Avoid importing VS Code APIs into reusable engine packages.
* Use JSON Schema for workflow validation.
* Keep the workflow engine deterministic.
* Store state transitions as append-only events.
* Do not execute arbitrary JavaScript expressions from workflow YAML.
* Treat preview VS Code and Copilot APIs as optional adapters.
* Include migrations for future workflow schema versions.
* Maintain compatibility with the current stable VS Code release and one previous stable release where practical.

## 34. Proposed monorepo structure

```text
apps/
├── vscode-extension/
│   ├── src/
│   │   ├── activation/
│   │   ├── commands/
│   │   ├── views/
│   │   ├── webviews/
│   │   ├── services/
│   │   └── extension.ts
│   └── package.json
└── runner/
    └── src/

libs/
├── workflow-schema/
├── workflow-engine/
├── runner-protocol/
├── evidence/
├── git-worktrees/
├── process-executor/
├── agent-adapters/
│   ├── core/
│   └── github-copilot/
├── persistence/
├── redaction/
└── test-fixtures/
```

## 35. Key technical risks

### 35.1 Copilot SDK stability

The Copilot SDK is currently a preview technology and may change.

Mitigation:

* Use an adapter.
* Pin versions.
* Add contract tests.
* Support command-only operation.
* Avoid exposing SDK concepts in workflow YAML.

### 35.2 Process cancellation

Terminating complete process trees consistently across macOS, Linux and Windows is difficult.

Mitigation:

* Implement platform-specific process-tree termination.
* Test hanging child processes.
* Include a force-stop path.
* Clearly report incomplete termination.

### 35.3 Worktree lifecycle

Crashes may leave worktrees or branches behind.

Mitigation:

* Record worktree state before creation.
* Reconcile worktrees during extension activation.
* Provide a cleanup command.
* Never delete a worktree containing unrecorded changes without confirmation.

### 35.4 Agent scope control

An agent may modify more files than requested.

Mitigation:

* Compare Git status before and after each attempt.
* Stop when configured limits are exceeded.
* Record the entire attempt diff.
* Require approval before applying changes.

### 35.5 Evidence volume

Screenshots, logs and test artefacts may consume significant disk space.

Mitigation:

* Set retention limits.
* Set artefact-size limits.
* Lazy-load content.
* Provide cleanup controls.
* Store summaries separately from large artefacts.

### 35.6 Preview VS Code APIs

Hooks, plugins and some agent integrations may change. VS Code currently documents hooks and agent plugins as preview features.

Mitigation:

* Do not make them MVP dependencies.
* Introduce integrations through capability detection.
* Keep the internal engine independent of VS Code agent lifecycle events.

## 36. Success measures

The public preview should be considered successful when:

* A new user can install the extension and run a starter loop within ten minutes.
* At least 80 per cent of command-only example runs complete without runner errors.
* Retry limits are never bypassed in automated tests.
* Worktree mode never modifies the primary working tree in automated tests.
* Every run produces an explicit stop reason.
* Developers report that the evidence timeline is more useful than reading a raw agent conversation.
* At least one real repository adopts a committed `.huckleberry` workflow.
* The Nx affected-project loop saves repeated manual validation work.
* Users can understand what the agent changed and why the workflow continued or stopped.

## 37. Open product decisions

The following decisions should be resolved during technical discovery:

1. Whether run artefacts should default to repository-local storage or extension global storage.
2. Whether the runner should begin as a child process or a separately installed local service.
3. Whether workflow conditions should use JSON Logic, CEL or a custom limited expression language.
4. How Copilot SDK authentication behaves inside a VS Code extension context.
5. Whether agent steps should reference existing `.agent.md` files or use huckleberry-owned configuration.
6. Whether the first release should support direct application of worktree changes or only display instructions.
7. How much agent transcript detail the Copilot SDK exposes reliably.
8. Whether token and premium request usage can be recorded consistently.
9. How cancellation behaves across Copilot SDK sessions.
10. Whether Windows worktree and process management need a narrower initial support level.

## 38. Recommended first vertical slice

The first implemented workflow should be:

### Repair TypeScript errors

```text
Run configured typecheck
        ↓
Did it pass?
   ┌────┴────┐
  Yes        No
   │          │
Complete   Collect errors
              ↓
        Invoke bounded agent
              ↓
        Record changed files
              ↓
        Rerun typecheck
              ↓
     Stop after three attempts
```

This slice validates the most important product assumptions:

* Workflow discovery.
* YAML parsing.
* Command execution.
* Evidence capture.
* Agent invocation.
* Retry control.
* Stale evidence handling.
* State persistence.
* Cancellation.
* Explicit stopping conditions.

It avoids the additional complexity of browser automation, screenshot comparison and human approval until the central engine has proved reliable.

## 39. Definition of MVP complete

The MVP is complete when a developer can:

1. Install huckleberry.
2. Open an Nx TypeScript repository.
3. Create a starter workflow.
4. Run the workflow from the Activity Bar.
5. See typecheck output in real time.
6. Allow Copilot to attempt a bounded repair.
7. See each attempt and its diff.
8. Observe validation rerun after changes.
9. See the workflow stop after success or three failed attempts.
10. Inspect the final evidence and stopping reason.
11. Run the same workflow in a Git worktree.
12. Close and reopen VS Code without losing the recorded run.

## 40. Final product statement

huckleberry will not make an agent infallible.

It will make the development process around the agent explicit, repeatable and inspectable.

The agent writes and repairs code.

The existing engineering tools produce evidence.

The huckleberry engine controls the sequence, limits and stopping conditions.

The developer remains responsible for the decisions that deserve human judgement.
