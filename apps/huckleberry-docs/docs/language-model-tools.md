---
sidebar_position: 5
---

# Agent Mode Features

Huckleberry integrates with VS Code's AI assistants (like GitHub Copilot) through "Agent Mode," allowing these assistants to directly interact with Huckleberry's task management capabilities without requiring explicit `@Huckleberry` mentions.

> **💡 Pro tip:** For the best experience with Huckleberry's agent mode features, we currently recommend using Claude models in Copilot agent mode. Enable agent mode by opening VS Code settings and setting `github.copilot.chat.localeOverride` to `"en-US"`, then selecting Claude as your model from the Copilot chat dropdown.

## What is Agent Mode?

Agent Mode is a VS Code capability that allows AI assistants like GitHub Copilot to use extension-provided tools to perform actions in your workspace. Technically, this works through the VS Code Language Model Tools API, but as a user, you'll experience it as enhanced capabilities of your AI assistant.

When Huckleberry's agent mode features are available:

1. The AI assistant can detect when a task management action might be helpful in your conversation
2. The assistant can perform those actions directly (create tasks, list tasks, etc.)
3. The results are incorporated into the assistant's response

This creates a seamless experience where the AI can help manage tasks without requiring explicit `@Huckleberry` mentions.

## Available Agent Mode Features

Huckleberry provides the following features for use in agent mode:

### create_task

**Purpose:** Creates a new task in the Huckleberry Task Manager

**Example usage scenarios:**

- When discussing a feature implementation in chat, Copilot might offer to create a task for it
- When planning work for a sprint
- When identifying bug fixes needed

**Example conversation:**

```
User: I need to implement user authentication for my app
Copilot: Would you like me to create a task for implementing user authentication?
User: Yes, please make it high priority
Copilot: I've created task TASK-001: Implement user authentication with high priority
```

### initialize_tracking

**Purpose:** Sets up task tracking for a project workspace

**Example usage scenarios:**

- When starting a new project
- When adding task tracking to an existing project
- When a user first mentions they want to organize their work

**Example conversation:**

```
User: I'm starting a new project and want to keep track of my tasks
Copilot: Would you like me to initialize task tracking for this project?
User: Yes, please
Copilot: I've set up task tracking in the 'tasks' directory. You can now create and manage tasks.
```

### scan_todos

**Purpose:** Scans the codebase for TODO comments and converts them to tasks

**Example usage scenarios:**

- When doing code cleanup
- When taking over a project with many TODO comments
- When preparing for a release and need to address remaining TODO items

**Example conversation:**

```
User: There are a lot of TODOs in our codebase that we need to address
Copilot: Would you like me to scan for TODOs and convert them to tasks?
User: Yes, but only in the TypeScript files
Copilot: I'll scan for TODOs in TypeScript files. I found 5 TODOs and created tasks for them.
```

### list_tasks

**Purpose:** Lists tasks from the task manager with optional filtering

**Example usage scenarios:**

- When planning daily work
- When checking what high-priority items need attention
- When reviewing completed work

**Example conversation:**

```
User: What high priority tasks do we have left?
Copilot: Let me check the high priority tasks for you.
[Copilot lists the high priority tasks]
```

### mark_task_done

**Purpose:** Marks a task as complete

**Example usage scenarios:**

- After completing implementation of a feature
- After fixing a bug
- When updating task status after a code review

**Example conversation:**

```
User: I just finished implementing the login form
Copilot: Great! Would you like me to mark task TASK-003: "Implement login form" as complete?
User: Yes
Copilot: I've marked task TASK-003 as complete.
```

### update_task_priority

**Purpose:** Changes the priority of a task

**Example usage scenarios:**

- When reprioritizing work
- When a task becomes more urgent
- When planning sprint work

**Example conversation:**

```
User: The authentication bug is more critical than we thought
Copilot: Would you like me to update the priority of task TASK-007: "Fix authentication bug"?
User: Yes, make it critical
Copilot: I've updated task TASK-007 to critical priority.
```

## How to Use Agent Mode Features

To use Huckleberry's features in agent mode:

1. Make sure Copilot Agent Mode is enabled (look for "Agent:" in the chat interface header)
2. If Agent Mode is not enabled:
   - Open VS Code settings
   - Search for "github.copilot.chat.localeOverride"
   - Set it to `"en-US"`
   - Restart VS Code if needed
3. Select Claude as your model from the Copilot chat dropdown (recommended for best results)
4. Start chatting with Copilot about your tasks and project

Copilot will automatically detect when to use Huckleberry's task management features based on the conversation context.

## Example Complete Workflow

Here's a complete example of a task management workflow using Huckleberry's agent mode features:

**User**: "I'm starting a new feature for our e-commerce platform. I need to track the tasks for it."

**GitHub Copilot**: "I'd be happy to help you set up task tracking for your e-commerce feature. Would you like me to initialize task tracking for this project?"

**User**: "Yes, please."

**GitHub Copilot**: "I've initialized task tracking in this project. The tasks will be stored in the 'tasks' directory. Now, let's create some tasks for your e-commerce feature. What specific tasks do you need to track?"

**User**: "I need to implement a shopping cart, product search, and payment processing."

**GitHub Copilot**: "I'll create tasks for those features. I've created the following tasks:

- TASK-001: Implement shopping cart functionality
- TASK-002: Create product search feature
- TASK-003: Develop payment processing system

Would you like to prioritize any of these tasks?"

**User**: "Make the payment processing high priority."

**GitHub Copilot**: "I've updated TASK-003: Develop payment processing system to high priority. Is there anything else you'd like to do with these tasks?"

**User**: "Let's also check if there are any TODOs in the codebase related to e-commerce."

**GitHub Copilot**: "I'll scan for TODOs in the codebase. I found 2 TODOs related to e-commerce and created tasks for them:

- TASK-004: Update product model with new fields (from TODO in src/models/Product.ts)
- TASK-005: Fix cart calculation logic (from TODO in src/services/CartService.ts)

Would you like to see all your current tasks?"

**User**: "Yes, show me all high priority tasks."

**GitHub Copilot**: "Here are all your high priority tasks:

- TASK-003: Develop payment processing system
- TASK-005: Fix cart calculation logic

These would be good tasks to focus on first."

## Benefits of Agent Mode Integration

- **Seamless experience**: The AI can manage tasks without breaking the conversational flow
- **Contextual awareness**: Features are invoked based on the conversation context
- **Reduced friction**: Users don't need to remember specific command syntax
- **Proactive assistance**: The AI can suggest task operations at appropriate moments

## Troubleshooting

If you're having issues with Huckleberry's Agent Mode features:

1. **Check Agent Mode status**: Make sure "Agent:" appears in the chat interface header
2. **Verify tool registration**: Run the command "Huckleberry (Dev): Check Copilot Agent Mode"
3. **Try a different model**: Different models have varying capabilities with tools. Claude models currently perform best with Huckleberry.
4. **Restart VS Code**: Sometimes a VS Code restart is needed after changing agent mode settings

## Technical Details

Behind the scenes, Huckleberry implements these features using VS Code's Language Model Tools API. This API allows extensions to register tools that can be called by language models like GitHub Copilot. If you're a developer interested in how this works, see our [Extension Architecture](./extension-architecture.md) documentation.
