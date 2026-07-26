---
sidebar_position: 5
---

# Agent Mode Features

Huckleberry integrates with VS Code AI assistants through Agent Mode, allowing assistants to interact with workflow orchestration capabilities without requiring explicit `@Huckleberry` mentions in every step.

> **💡 Pro tip:** For the best experience with Huckleberry's agent mode features, we currently recommend using Claude models in Copilot agent mode. Enable agent mode by opening VS Code settings and setting `github.copilot.chat.localeOverride` to `"en-US"`, then selecting Claude as your model from the Copilot chat dropdown.

## What is Agent Mode?

Agent Mode is a VS Code capability that allows AI assistants like GitHub Copilot to use extension-provided tools to perform actions in your workspace. Technically, this works through the VS Code Language Model Tools API, but as a user, you'll experience it as enhanced capabilities of your AI assistant.

When Huckleberry agent mode features are available:

1. The assistant can detect when a workflow operation is useful
2. The assistant can perform workflow operations directly
3. The results are incorporated into the assistant's response

This creates a seamless experience where AI can help run and inspect workflows while preserving evidence and approval controls.

## Available Agent Mode Features

Huckleberry provides workflow-centric capabilities through agent mode. The exact tool names may evolve across releases, but the operational categories are:

### Loop Operations

**Purpose:** Create/discover workflow loops and start loop execution.

**Example usage scenarios:**

- Bootstrap a workspace with starter loop templates
- Validate loop definitions before execution
- Trigger a selected loop run

**Example conversation:**

```
User: Set up workflow checks for this repo.
Copilot: I can scaffold starter loop templates and help you run one. Proceed?
User: Yes.
Copilot: Done. I created starter loops under .huckleberry/loops.
```

### Run Operations

**Purpose:** Query, inspect, and control loop runs.

**Example usage scenarios:**

- Check run status and terminal outcomes
- Cancel a misconfigured or long-running run
- Open generated run summaries and timeline details

**Example conversation:**

```
User: Did the lint loop finish?
Copilot: I can query run status and open the run summary for you.
User: Please do.
Copilot: The run failed on step 1. I opened the summary and linked evidence.
```

### Approval Operations

**Purpose:** Submit approval decisions for paused runs.

**Example usage scenarios:**

- Human-in-the-loop checks
- Security/release gate reviews
- Deferred decision handling with audit notes

**Example conversation:**

```
User: This run is paused for approval.
Copilot: I can submit approve/reject/defer with an optional note.
User: Approve with note "validated in staging".
Copilot: Approval submitted.
```

### Evidence Operations

**Purpose:** Navigate artifacts and deep links to support decisions.

**Example usage scenarios:**

- Open stdout/stderr/metadata artifacts
- Reveal artifact location in OS explorer
- Follow timeline deep links to diagnostics/tests/diffs/logs

**Example conversation:**

```
User: Show me the evidence for the failed test step.
Copilot: I can open the step evidence and related deep links.
User: Go ahead.
Copilot: Opened stderr and summary artifacts; the deep link points to test failures.
```

## How to Use Agent Mode Features

To use Huckleberry features in agent mode:

1. Make sure Copilot Agent Mode is enabled (look for "Agent:" in the chat interface header)
2. If Agent Mode is not enabled:
   - Open VS Code settings
   - Search for "github.copilot.chat.localeOverride"
   - Set it to `"en-US"`
   - Restart VS Code if needed
3. Select Claude as your model from the Copilot chat dropdown (recommended for best results)
4. Start chatting with Copilot about your workflow goals and project state

Copilot will detect when Huckleberry workflow operations are useful based on context.

## Example Complete Workflow

Here is a complete workflow example using agent mode features:

**User**: "Set up workflow checks for this repository and run lint."

**GitHub Copilot**: "I can scaffold starter loops and run the lint loop. Proceed?"

**User**: "Yes."

**GitHub Copilot**: "Starter loops created. Running lint now."

**User**: "If it fails, show me evidence and summary."

**GitHub Copilot**: "The run failed on test command. I opened the run summary and linked stderr and diagnostics deep links."

**User**: "Pause this pipeline for manual review and then approve with a note."

**GitHub Copilot**: "Approval decision submitted with your audit note."

## Benefits of Agent Mode Integration

- **Seamless operation**: AI can trigger workflow actions without breaking conversation flow
- **Contextual awareness**: Features are invoked based on conversation state
- **Evidence-first outcomes**: Assistant can route you to summaries and artifacts
- **Human control**: Approval/cancel decisions remain explicit and auditable

## Troubleshooting

If you are having issues with Huckleberry agent mode features:

1. **Check Agent Mode status**: Make sure "Agent:" appears in the chat interface header
2. **Verify tool registration**: Run the command "Huckleberry (Dev): Check Copilot Agent Mode"
3. **Try a different model**: Different models have varying capabilities with tools. Claude models currently perform best with Huckleberry.
4. **Restart VS Code**: Sometimes a VS Code restart is needed after changing agent mode settings

## Technical Details

Behind the scenes, Huckleberry uses VS Code Language Model Tools to expose workflow operations to agent-mode models. If you are interested in implementation details, see [Extension Architecture](./extension-architecture.md).
