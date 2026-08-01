## The opportunity is real, but the gap is narrower than we thought

There **are now VS Code-native orchestration tools**. I found several released during 2026:

* **Copilot Orchestrator** runs parallel Copilot agents in isolated Git worktrees, supports DAG-based execution and applies a seven-stage pipeline covering prechecks, work, commits, postchecks, merging and cleanup. It currently has a relatively small install base. ([Visual Studio Marketplace][1])
* **AgentX** coordinates specialised Copilot agents such as product manager, architect, engineer, reviewer and tester through a structured development workflow. ([Visual Studio Marketplace][2])
* **AETHER** provides a dashboard for routing work between 34 specialised agents, managing approvals and tracking costs. ([Visual Studio Marketplace][3])
* Other recent Marketplace projects include Bernstein, Event Horizon and Agent System, all exploring variations of parallel agents, supervisors and role-based workflows. ([Visual Studio Marketplace][4])

So the opportunity is **not**:

> Nobody has built a VS Code agent orchestrator.

The more interesting opportunity is:

> Nobody appears to have established a clear, evidence-first standard for designing small, inspectable engineering loops.

Most existing products are selling an **AI team**:

```text
Product manager
↓
Architect
↓
Developer
↓
Reviewer
↓
Tester
```

Our idea should sell an **engineering process**:

```text
Change
↓
Run a deterministic check
↓
Collect evidence
↓
Evaluate a condition
↓
Repair or continue
↓
Stop for an explicit reason
```

That is a much stronger distinction.

# The product concept

Working name:

## **huckleberry**

> A VS Code-native workbench for building, running and inspecting evidence-driven engineering loops.

It would not be another chat window and it would not pretend that giving eight agents job titles creates an engineering department.

The product would let developers define something like this:

```yaml
name: Validate React component

trigger:
  type: manual

inputs:
  component:
    type: file

steps:
  - id: typecheck
    run: pnpm nx typecheck {{project}}
    retry:
      agent: implementer
      maxAttempts: 3

  - id: unit-tests
    run: pnpm nx test {{project}}
    retry:
      agent: implementer
      maxAttempts: 3

  - id: accessibility
    run: pnpm playwright test {{spec}} --grep accessibility
    retry:
      agent: accessibility-fixer
      maxAttempts: 2

  - id: visual
    uses: wallrun/capture@1
    with:
      viewport: 1920x1080

  - id: review
    agent: reviewer
    requires:
      - typecheck.passed
      - unit-tests.passed
      - accessibility.passed
      - visual.artifact

stop:
  success: review.approved
  failure:
    - retries.exhausted
    - scope.exceeded
    - human.decision.required
```

The important thing is that the YAML is not merely a very long prompt. It describes an actual state machine.

# How it could integrate with VS Code

## 1. A native Activity Bar view

VS Code extensions can add custom workbench views using Tree View APIs and can provide fully custom interfaces using webviews. That gives us everything necessary for a dedicated huckleberry panel and a visual loop editor. ([Visual Studio Code][5])

The Activity Bar could contain:

```text
huckleberry

Loops
  Validate affected project
  Review pull request
  Verify signage layout
  Repair accessibility issues

Runs
  ✓ Header accessibility
  ● Menu board validation
  ✕ Authentication refactor

Evidence
  Test results
  Screenshots
  Diffs
  Logs
  Review findings
```

Selecting a running loop would open a visual editor:

```text
┌──────────────┐
│  Typecheck   │ ✓ 14s
└──────┬───────┘
       │ pass
┌──────▼───────┐
│  Unit tests  │ ✓ 31s
└──────┬───────┘
       │ pass
┌──────▼──────────┐
│  Accessibility  │ ✕ 3 violations
└──────┬───────────┘
       │ repair
┌──────▼───────────┐
│ Accessibility AI │ ● attempt 2/3
└──────────────────┘
```

This is closer to a GitHub Actions visualisation or state-machine debugger than an AI chat transcript.

## 2. The GitHub Copilot SDK as the agent runtime

This is the biggest practical discovery.

GitHub now provides an official Copilot SDK for TypeScript, Python, Go, .NET, Java and Rust. It is explicitly designed to embed Copilot’s agentic workflows in applications and allows applications to provide custom tools. ([GitHub][6])

That means huckleberry would not necessarily need to automate the Copilot Chat UI or simulate keyboard input. It could create and manage Copilot agent sessions directly.

A sensible implementation would be:

```text
VS Code extension
        │
        │ IPC
        ▼
huckleberry runner process
        │
        ├── Copilot SDK session
        ├── terminal process manager
        ├── Git worktree manager
        ├── evidence store
        └── workflow state machine
```

The extension provides the interface. A local Node.js process performs the durable orchestration.

That separation matters because an extension host is not the ideal place for long-running autonomous jobs. A companion process can survive reloads, manage child processes and preserve run state more reliably.

## 3. VS Code’s Language Model API for lightweight steps

VS Code also exposes a Language Model API that lets extensions invoke available language models directly. It is suitable for bounded operations such as:

* Classifying a failure
* Summarising test output
* Converting an issue into acceptance criteria
* Deciding which loop template applies
* Producing a human-readable run summary

However, VS Code warns extension authors about rate limits, and the API is better viewed as a model invocation interface than a complete autonomous coding harness. ([Visual Studio Code][7])

I would therefore use two AI paths:

```text
Small reasoning operation
→ VS Code Language Model API

Autonomous code-editing operation
→ Copilot SDK agent session
```

This prevents us from using a full coding agent merely to classify an ESLint error.

## 4. Extension tools for local Copilot agents

A huckleberry extension could contribute tools directly to Copilot Chat. VS Code agents can use built-in tools, MCP tools and extension-provided tools. Tools can also be grouped into named tool sets. ([Visual Studio Code][8])

For example:

```text
#huckleberry/runLoop
#huckleberry/getRunStatus
#huckleberry/readEvidence
#huckleberry/retryStep
#huckleberry/requestApproval
#huckleberry/captureScreenshot
```

A developer could ask Copilot:

> Run the affected-project validation loop and fix mechanical failures.

Copilot would invoke the extension tool, while huckleberry owns the actual execution state.

This is preferable to handing Copilot six shell commands and hoping it remembers the order.

## 5. Chat participant for natural-language entry

huckleberry could also register a chat participant:

```text
@huckleberry validate the current component
@huckleberry create a loop for this issue
@huckleberry explain why this run stopped
@huckleberry retry accessibility with a narrower scope
```

VS Code’s Chat Participant API supports domain-specific assistants, slash commands, follow-up suggestions and automatic participant detection. ([Visual Studio Code][9])

The participant should be a front door, not the orchestration engine.

Its responsibility would be to translate natural language into a structured loop invocation:

```json
{
  "loop": "validate-react-component",
  "inputs": {
    "file": "src/components/PlayerCard.tsx",
    "project": "control-panel-ui"
  }
}
```

## 6. Copilot CLI for background work

VS Code now supports Copilot CLI sessions that run independently in the background. The editor uses the Copilot SDK to start, stop and monitor these sessions. They can continue after the VS Code window closes and can operate in isolated Git worktrees. ([Visual Studio Code][10])

This gives us a very useful execution target:

```text
Interactive loop step
→ local VS Code agent

Long-running implementation step
→ Copilot CLI background session

Repository-scale delegated task
→ isolated Copilot CLI worktree

Remote collaborative task
→ Copilot cloud agent
```

Worktree isolation is especially relevant. In that mode, tool calls are automatically approved because changes are confined to the isolated worktree. Multiple Copilot CLI sessions can also run in parallel. ([Visual Studio Code][10])

However, there is an important limitation: Copilot CLI background sessions currently cannot access extension-provided tools and have more limited MCP support. ([Visual Studio Code][10])

That means this architecture would not work:

```text
huckleberry VS Code extension tool
↓
Background Copilot CLI calls extension tool
```

Instead, huckleberry must either:

1. Control the background session through the Copilot SDK.
2. Expose capabilities through a local MCP server.
3. Give the agent executable scripts inside the repository.
4. Pass all required context into the session at launch.

For an MVP, I would favour the Copilot SDK plus repository scripts.

# The execution model

Each loop should be composed from a small number of node types.

## Command node

Runs a deterministic command:

```yaml
- id: typecheck
  type: command
  command: pnpm nx typecheck control-panel-ui
  timeout: 120s
```

Produces:

```json
{
  "exitCode": 1,
  "stdoutArtifact": "artifacts/typecheck.stdout",
  "stderrArtifact": "artifacts/typecheck.stderr",
  "duration": 18342
}
```

## Agent node

Gives a bounded goal to an agent:

```yaml
- id: repair-types
  type: agent
  agent: mechanical-fixer
  goal: Fix only the TypeScript errors from {{typecheck.stderr}}
  constraints:
    paths:
      - apps/control-panel-ui/**
    maxFilesChanged: 8
    maxTurns: 5
```

## Condition node

Branches using machine-readable evidence:

```yaml
- id: typecheck-result
  type: condition
  expression: steps.typecheck.exitCode == 0
  true: unit-tests
  false: repair-types
```

## Human gate

Requires an explicit decision:

```yaml
- id: visual-approval
  type: approval
  evidence:
    - screenshots.desktop
    - screenshots.signage
    - diff.summary
```

## Subloop node

Invokes another reusable loop:

```yaml
- id: accessibility
  uses: .huckleberry/loops/accessibility.yml
```

## Evidence node

Collects an artefact without asking an LLM to interpret it:

```yaml
- id: capture
  type: artifact
  command: pnpm playwright screenshot
  outputs:
    - test-results/**/*.png
```

This relatively small vocabulary is sufficient to build useful workflows without becoming a general-purpose programming language.

# Evidence should be a first-class object

This is where I think huckleberry could be substantially better than existing “AI team” products.

Every step should produce typed evidence:

```ts
interface Evidence {
  id: string;
  runId: string;
  stepId: string;
  kind:
    | 'command-output'
    | 'test-result'
    | 'screenshot'
    | 'diff'
    | 'diagnostic'
    | 'review'
    | 'metric'
    | 'approval';
  status: 'passed' | 'failed' | 'warning' | 'informational';
  createdAt: string;
  source: {
    type: 'tool' | 'agent' | 'human';
    name: string;
  };
  artifactPath?: string;
  summary?: string;
  structuredData?: unknown;
}
```

The UI would make a clear distinction between:

```text
FACT
TypeScript exited with code 0.

AGENT CLAIM
The implementation appears to satisfy the requirement.

HUMAN DECISION
The interaction feels natural and is approved.
```

That distinction alone could be a meaningful product proposition.

# How tests could appear natively

VS Code’s Testing API allows extensions to discover tests, execute them and publish rich results, including output and diffs, through the Test Explorer. ([Visual Studio Code][11])

huckleberry could consume or complement this rather than building a worse test-results interface.

For example:

```text
Loop node: Run affected tests
        ↓
VS Code Testing API or task command
        ↓
Test results published to Test Explorer
        ↓
Loop receives structured pass/fail evidence
```

A failed step could deep-link directly to the failing test or diagnostic.

Similarly, compiler and lint failures could be added to the Problems panel using diagnostic collections, while screenshots could open in editor tabs.

The loop dashboard should coordinate existing VS Code surfaces rather than cloning all of them inside a giant webview.

# Hooks make the loops enforceable

VS Code agent hooks can execute deterministic shell commands at lifecycle events and return structured JSON that affects agent behaviour. Supported events include session start, prompt submission, pre-tool use, post-tool use, subagent start, subagent stop and session stop. Hooks remain a preview feature, so their format may change. ([Visual Studio Code][12])

huckleberry could generate hooks from policy:

```yaml
policies:
  deny:
    - command: rm -rf
    - paths:
        - libs/generated/**
  requireBeforeStop:
    - typecheck
    - affected-tests
```

This could become:

```text
PreToolUse
→ Reject dangerous command

PostToolUse
→ Record tool evidence

Stop
→ Reject completion if required evidence is stale or missing
```

Hooks would be an integration option, not the core workflow engine. Building the entire product around a preview API would be risky.

# Sandbox and worktree strategy

I would distinguish two kinds of isolation.

## Process sandbox

Controls what terminal commands can access:

```text
Workspace files: allowed
Home directory: denied
Network: restricted
Secrets: denied
```

## Git worktree isolation

Controls where code modifications land:

```text
Main working tree
  untouched

.huckleberry/worktrees/run-023/
  agent changes
```

For serious autonomous runs, both are useful:

```text
Sandbox
→ limits machine access

Worktree
→ limits repository impact
```

A run should visibly show its containment level:

```text
Isolation: Worktree + restricted network
Permissions: Automatic within sandbox
Merge: Human approval required
```

# A sensible MVP

I would deliberately avoid building the visual node editor first.

## MVP 1: Loop runner

Ship these capabilities:

1. Discover `.huckleberry/*.yml` files.
2. Display loops in a Tree View.
3. Run sequential command, condition, agent and approval steps.
4. Invoke coding agents through the Copilot SDK.
5. Capture logs, test results, diffs and screenshots.
6. Enforce retry limits and explicit stopping conditions.
7. Show the current run in a webview timeline.
8. Run in either the current workspace or an isolated worktree.
9. Persist run state under `.huckleberry/runs/` or VS Code storage.
10. Provide `@huckleberry run`, `status` and `explain` commands.

One excellent starter workflow would be:

```text
Validate affected Nx project
```

```text
Detect affected project
↓
Typecheck
↓
Lint
↓
Unit tests
↓
Repair mechanical failures
↓
Repeat up to three times
↓
Produce evidence report
↓
Human approval
```

That is understandable, valuable and testable.

## MVP 2: Visual inspection

Add:

* Playwright integration
* Screenshot artefacts
* Side-by-side image comparison
* Accessibility result parsing
* Browser console evidence
* Signage resolution presets
* Manual visual approval

This would suit your work particularly well because visual and accessibility evidence cannot be reduced to another generic “reviewer agent”.

## MVP 3: Composition

Add:

* Reusable subloops
* Parallel branches
* Template gallery
* Loop inputs
* Shared policies
* Organisation-level loop packs
* Agent Skills and plugin packaging
* GitHub issue and pull request triggers

## MVP 4: Visual authoring

Only after the schema has settled:

```text
Drag node
Connect condition
Select evidence
Set retry limit
Save as version-controlled YAML
```

The YAML must remain the source of truth. The visual editor should be a projection of it, not an opaque proprietary file.

# Repository structure

A project might contain:

```text
.huckleberry/
├── loops/
│   ├── affected-project.yml
│   ├── accessibility.yml
│   ├── visual-review.yml
│   └── signage-component.yml
├── agents/
│   ├── mechanical-fixer.agent.md
│   ├── accessibility-fixer.agent.md
│   └── reviewer.agent.md
├── policies/
│   ├── repository.yml
│   └── security.yml
├── scripts/
│   ├── find-affected-project.mjs
│   ├── parse-playwright.mjs
│   └── capture-signage.mjs
└── huckleberry.config.yml
```

This would work well alongside existing Copilot assets:

```text
.github/
├── copilot-instructions.md
├── agents/
├── prompts/
├── skills/
└── hooks/
```

huckleberry should reference those files rather than inventing competing formats for everything:

```yaml
agent:
  copilotAgent: .github/agents/mechanical-fixer.agent.md

skills:
  - .github/skills/react-testing
  - .github/skills/signage-layout
```

VS Code already packages agents, skills, commands, hooks and MCP servers as Agent Plugins, so a huckleberry plugin could eventually be distributed as an additional component of those packages. ([Visual Studio Code][13])

# The most important design decision

The engine should own the loop.

The agent should only own individual reasoning steps.

Bad architecture:

```text
Prompt:
Keep trying until everything passes.
```

The model controls:

* What runs
* What passed
* Whether to retry
* Whether it is finished
* Whether its own result is acceptable

Better architecture:

```text
huckleberry engine
├── selects next node
├── invokes commands
├── records evidence
├── evaluates conditions
├── counts retries
├── enforces scope
└── decides whether the run has stopped

Agent
└── attempts one bounded repair
```

This makes the system reproducible and prevents “loop engineering” from becoming a euphemism for letting a chatbot continue for longer.

# Product differentiation

I would position it against current orchestrators like this:

| Existing orchestrators           | huckleberry                               |
| -------------------------------- | -------------------------------------- |
| Organise AI personas             | Organises executable checks            |
| Agent conversation is central    | Evidence graph is central              |
| Roles such as PM and architect   | Steps such as test, inspect and repair |
| Success often judged by an agent | Success defined by explicit conditions |
| Large autonomous workflow        | Small composable loops                 |
| Dashboard shows agent activity   | Dashboard shows engineering evidence   |
| “AI software team”               | “Executable development process”       |

The key line could be:

> **Do not ask the agent to keep trying. Define what trying means.**

Or:

> **Build the loop, not the prompt.**

# My recommendation

The best initial product is not a generic multi-agent canvas. That market is already filling up, and some existing tools have more agents than a badly managed consultancy.

The strongest version is:

> **A version-controlled VS Code workflow engine that connects Copilot agents to deterministic engineering evidence.**

Its first release should support:

```text
YAML-defined workflows
Sequential and conditional nodes
Command execution
Copilot SDK repair steps
Nx-aware validation
Git worktree isolation
Retry and scope limits
Evidence timeline
Human approval gates
```

That is technically feasible with the current extension APIs and Copilot SDK. The largest engineering uncertainties are likely to be agent-session lifecycle management, reliable cancellation, token and rate-limit behaviour, sandbox portability and maintaining compatibility with fast-moving preview features. VS Code’s hooks and plugin formats are particularly useful, but should remain adapters around a stable internal engine rather than foundations the entire product depends upon. ([Visual Studio Code][7])

The next useful artefact would be a proper MVP technical specification covering the extension architecture, loop schema, execution state machine, storage model, UI surfaces and a first Nx validation loop.

[1]: https://marketplace.visualstudio.com/items?itemName=JeromyStatia.vscode-copilot-orchestrator "
        Copilot Orchestrator - Visual Studio Marketplace
    "
[2]: https://marketplace.visualstudio.com/items?itemName=jnpiyush.agentx "
        AgentX - Multi-Agent Orchestration - Visual Studio Marketplace
    "
[3]: https://marketplace.visualstudio.com/items?itemName=SufficientDaikon.aether-vscode "
        AETHER — Multi-Agent Orchestrator - Visual Studio Marketplace
    "
[4]: https://marketplace.visualstudio.com/items?itemName=JorgeLeal.agent-system&utm_source=chatgpt.com "Agent System — Multi-Agent Coding Assistant"
[5]: https://code.visualstudio.com/api/extension-capabilities/overview "Extension Capabilities Overview | Visual Studio Code Extension
API"
[6]: https://github.com/github/copilot-sdk?utm_source=chatgpt.com "github/copilot-sdk: Multi-platform SDK for integrating ..."
[7]: https://code.visualstudio.com/api/extension-guides/ai/language-model "Language Model API | Visual Studio Code Extension
API"
[8]: https://code.visualstudio.com/docs/copilot/agents/agent-tools "Use tools in chat"
[9]: https://code.visualstudio.com/api/extension-guides/ai/chat?utm_source=chatgpt.com "Chat Participant API"
[10]: https://code.visualstudio.com/docs/agents/agent-types/copilot-cli "Copilot CLI sessions in Visual Studio Code"
[11]: https://code.visualstudio.com/api/extension-guides/testing?utm_source=chatgpt.com "Testing API | Visual Studio Code Extension API"
[12]: https://code.visualstudio.com/docs/agent-customization/hooks "Agent hooks in Visual Studio Code (Preview)"
[13]: https://code.visualstudio.com/docs/agent-customization/agent-plugins?utm_source=chatgpt.com "Agent plugins in VS Code (Preview)"
