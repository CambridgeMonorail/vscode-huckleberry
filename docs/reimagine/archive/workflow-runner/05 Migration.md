## Yes, repurposing Huckleberry is a good idea

Having inspected the repository, I would **reuse it as the foundation for huckleberry rather than start again**.

It already contains much of the awkward VS Code extension plumbing that the huckleberry PRD requires:

* An Nx monorepo with separate build, lint, test, typecheck and packaging commands.
* A functioning VS Code extension application with TypeScript compilation and VSIX packaging.
* A contributed Tree View and Activity Bar-style explorer.
* VS Code command registration.
* A chat participant.
* Language Model Tool integration.
* Workspace file handling and file watching.
* Local persisted data.
* Existing documentation, testing strategy and release automation.

The extension already registers a `TreeDataProvider`, creates a VS Code Tree View and manages item-specific commands. That is directly reusable for huckleberry’s **Loops**, **Runs** and potentially **Evidence** explorers.

It also already contributes a Copilot chat participant and numerous Language Model Tools, so you have working examples of exposing extension functionality to Copilot rather than needing to learn those APIs from scratch.

The repository is not an ancient abandoned prototype either. It uses Nx 20, TypeScript 5.7, React 18, Vite 6 and Vitest 3, which are modern enough to provide a sensible base.

## The right approach is a controlled conversion

I would not try to gradually mutate the existing task manager into huckleberry while preserving all current behaviour.

That risks carrying the old product model into the new one.

Instead, treat Huckleberry as:

> **A proven VS Code extension shell whose task-management business logic will be removed and replaced.**

The reusable value is mainly:

```text
Nx workspace
VS Code extension packaging
Extension activation
Tree View plumbing
Commands
Chat participant integration
Language Model Tool registration
Logging
Testing setup
CI and release setup
Documentation structure
```

The parts to retire are:

```text
Task records
Task priorities
TODO scanning
Task completion
Requirement-to-task parsing
Task-specific tools
Task-specific commands
Task Explorer item models
Task JSON persistence
Task manager terminology
```

## What maps cleanly from Huckleberry to huckleberry

| Huckleberry          | huckleberry                            |
| -------------------- | ----------------------------------- |
| Task Explorer        | Loops Explorer                      |
| Task Tree Item       | Loop Tree Item                      |
| Task list            | Discovered workflow definitions     |
| Task details         | Run details                         |
| Task status          | Run and step status                 |
| Task persistence     | Run and evidence persistence        |
| Task commands        | Loop commands                       |
| Chat participant     | `@huckleberry` participant             |
| Language Model Tools | Run, inspect and explain loop tools |
| Workspace scanner    | Workflow discovery service          |
| File watcher         | `.huckleberry` workflow watcher        |
| Task service         | Workflow catalogue and run service  |
| Tool manager         | Agent and extension tool registry   |

The current architecture was already intended to be modular, with services, handlers, tools, providers and utilities separated under the extension source.

That is a helpful starting point, although I would not assume every part is as cleanly separated in the implementation as the architecture document suggests.

## The strongest assets to retain

### 1. The monorepo

The current repository already has a natural place for the architecture described in the PRD.

I would reshape it towards:

```text
apps/
├── huckleberry-extension/
├── huckleberry-runner/
└── huckleberry-docs/

libs/
├── workflow-schema/
├── workflow-engine/
├── runner-protocol/
├── process-executor/
├── evidence/
├── persistence/
├── git-worktrees/
└── agent-adapters/
```

You do not need to create all of those libraries immediately. The important point is that the current Nx setup gives you somewhere sensible to extract them as the product grows.

The existing scripts already support affected builds, linting, tests and typechecking, which is rather pleasingly appropriate for a product whose first workflow will run those exact checks.

### 2. The Tree View implementation

The current extension already creates and registers a `TaskExplorerProvider` using `vscode.window.createTreeView`.

This can become:

```ts
const loopExplorerProvider = new LoopExplorerProvider(workflowCatalogue);

const loopTreeView = vscode.window.createTreeView('huckleberry.loops', {
  treeDataProvider: loopExplorerProvider,
  showCollapseAll: true,
});
```

The refresh, sorting, context menu and item-command patterns can all be adapted.

Later, create separate providers:

```text
LoopExplorerProvider
RunExplorerProvider
EvidenceExplorerProvider
```

### 3. Language Model Tool integration

Huckleberry currently declares Language Model Tools in the extension manifest and registers their implementations during activation.

That is directly useful for tools such as:

```text
run_loop
get_loop_status
list_loops
read_loop_evidence
cancel_loop
explain_loop_failure
```

This is an important head start because huckleberry should eventually be usable both through its visual interface and by Copilot.

### 4. Chat participant support

The existing participant can be renamed and narrowed:

```text
@huckleberry run validate-affected-project
@huckleberry explain the last failure
@huckleberry show the evidence from typecheck
```

The existing chat architecture already routes participant requests through services and handlers.

I would keep this integration, but not make it part of the first vertical slice. The workflow engine matters more than the chat experience.

### 5. Packaging and release work

The project already packages the extension using `vsce` and includes release-related documentation and workflows.

This work is tedious, easy to underestimate and provides little product differentiation. Reusing it is sensible.

## What needs substantial restructuring

### 1. `extension.ts` is doing too much

The current activation file is already over 250 lines in the partial section inspected, and it directly:

* Constructs tools.
* Creates providers.
* Registers views.
* Registers commands.
* Constructs chat services.
* Registers language model tools.
* Initialises global state.
* Handles workspace changes.

For huckleberry, `extension.ts` should become composition only:

```ts
export async function activate(context: ExtensionContext): Promise<void> {
  const services = await createExtensionServices(context);

  registerLoopViews(context, services);
  registerLoopCommands(context, services);
  registerLoopTools(context, services);
  registerWorkspaceListeners(context, services);

  await services.workflowCatalogue.initialise();
}
```

The workflow runner and state machine must not end up buried inside command handlers.

### 2. The current command manifest needs replacing

The manifest contains many task-specific commands and activation events, including duplicated variants and development commands. There are even duplicate `scanTodos` contributions under the same command identifier.

That suggests the manifest should be rebuilt rather than carefully edited in place.

Start with only:

```text
huckleberry.run
huckleberry.runWithInputs
huckleberry.validateWorkflow
huckleberry.openRun
huckleberry.cancelRun
huckleberry.resumeRun
huckleberry.approveStep
huckleberry.rejectStep
huckleberry.openWorktree
huckleberry.viewDiff
huckleberry.createStarterWorkflow
huckleberry.showOutput
```

### 3. The existing service model is task-oriented

The documented core service manages task creation, updates, relationships and persistence.

That logic is not useful to huckleberry and should not be generalised into some abstract “item manager”. Doing that would create a misleading abstraction.

Replace it with explicit services:

```text
WorkflowCatalogue
WorkflowValidator
RunCoordinator
RunnerClient
EvidenceRepository
WorktreeService
AgentAdapterRegistry
```

### 4. The existing persistence should not define the new model

Huckleberry stores task data in JSON and Markdown files inside the workspace.

Some filesystem utilities may be reusable, but huckleberry needs different persistence characteristics:

* Append-only run events.
* Potentially large logs and screenshots.
* Attempt-specific diffs.
* Recovery after crashes.
* Evidence freshness tracking.
* Worktree metadata.
* Retention and cleanup.

Do not retrofit these into `tasks.json`.

### 5. The extension host cannot own all execution

Huckleberry’s actions are relatively short task-management operations. huckleberry commands may:

* Run for many minutes.
* Launch process trees.
* Stream large outputs.
* Pause for approval.
* Survive a webview closing.
* Need cancellation and recovery.
* Manage worktrees.
* Invoke agent sessions.

That requires the separate runner process described in the PRD.

This is the largest architectural change. Huckleberry supplies the shell, but not the workflow engine.

## Branding decision

I would rename the product and repository fairly early.

Keeping “Huckleberry” internally for months while building “huckleberry” will leave:

* Old command identifiers.
* Old settings.
* Old extension IDs.
* Old context keys.
* Old package names.
* Old storage namespaces.
* Old screenshots and documentation.
* Old Marketplace identity.

A clean rename should cover:

```text
vscode-copilot-huckleberry → huckleberry
Huckleberry Task Manager → huckleberry
huckleberryTaskExplorer → huckleberry.loops
@huckleberry → @huckleberry
huckleberry.* settings → huckleberry.*
```

The repository itself could become:

```text
CambridgeMonorail/vscode-huckleberry
```

However, I would preserve the old Git history rather than create a new repository. Rename the repository after making a tagged archival release of Huckleberry.

## Recommended migration strategy

### Phase 0: Preserve the old product

Before conversion:

1. Tag the final Huckleberry state, for example `huckleberry-v0.1.26`.
2. Add a short archival note to the old README.
3. Export or retain the old Marketplace package if needed.
4. Create a `huckleberry/main` or `feat/huckleberry-foundation` branch.
5. Record a list of reusable extension patterns before removing task logic.

This gives you a clean historical point without maintaining two repositories.

### Phase 1: Rename and reduce

Remove all task-specific features and leave a minimal functioning extension:

```text
Extension activates
Activity Bar icon appears
Loops view appears
Output Channel works
Commands register
Tests and packaging pass
```

Do not build the runner yet.

The key goal is to finish with a clean shell rather than a half-task-manager, half-loop-runner hybrid.

### Phase 2: Workflow discovery

Introduce:

```text
workflow-schema
workflow-catalogue
workflow-validator
LoopExplorerProvider
.huckleberry/loops/*.yml watcher
```

At this stage, the extension discovers and validates workflows but cannot run them.

### Phase 3: Command-only engine

Implement:

```text
runner process
runner protocol
command steps
state transitions
event persistence
timeouts
cancellation
run timeline
```

This proves the huckleberry model without adding Copilot complexity.

### Phase 4: Bounded repair agent

Only then add:

```text
AgentAdapter
Copilot adapter
repair steps
attempt tracking
stale evidence handling
scope controls
```

### Phase 5: Approvals and worktrees

Add isolation after the central loop works in the current workspace.

## Suggested first codebase transformation

I would aim for this initial boundary:

```text
apps/huckleberry-extension
    ↓ rename
apps/huckleberry-extension

Existing retained modules
├── logging utilities
├── VS Code activation scaffolding
├── Tree View patterns
├── chat registration patterns
├── LM tool registration patterns
└── packaging configuration

New modules
├── workflow catalogue
├── schema validation
├── run explorer
├── runner client
└── runner protocol

Removed modules
├── task manager
├── task tools
├── TODO scanner
├── task commands
├── task types
└── task persistence
```

## One concern: do not overvalue the existing code

Repurposing is a good idea because the repository gives you a useful **delivery platform**, not because much of the domain logic is reusable.

I would estimate the reuse in conceptual terms as:

* **High reuse:** Nx, build, CI, packaging, extension plumbing.
* **Medium reuse:** Tree Views, commands, chat and LM tool registration patterns.
* **Low reuse:** services, handlers and data models.
* **No meaningful reuse:** task-management product behaviour.

That is still enough to justify using it.

Starting from scratch would mean rebuilding the boring and failure-prone parts only to arrive at a similar extension shell. Reusing everything indiscriminately, however, would turn huckleberry into Huckleberry wearing a false moustache.

## Recommendation

Proceed with Huckleberry as the base repository, but treat the work as a **product replacement with retained infrastructure**, not a feature pivot.

The first development issue should be:

> **Create the huckleberry extension shell by archiving Huckleberry behaviour, renaming the extension namespace and retaining only the verified VS Code, Nx, testing and packaging infrastructure.**

No workflow engine should be added until that cleanup branch builds, tests, launches in the Extension Development Host and produces a package successfully.
