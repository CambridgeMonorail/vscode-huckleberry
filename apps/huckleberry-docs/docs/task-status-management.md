---
sidebar_position: 14
---

# Task Status Management

Managing the status of tasks is a core part of the Huckleberry workflow. This guide explains how to update task status, understand the task lifecycle, and customize status workflows.

## Task Status Basics

In Huckleberry, every task has a status that reflects its current state in the development workflow. By default, tasks can have the following statuses:

- **Todo**: The task has been created but work hasn't started
- **In Progress**: Work on the task is currently underway
- **Done**: The task has been completed

## Updating Task Status

### Using Chat

The most common way to update a task's status is through the chat interface:

```
@Huckleberry Mark task TASK-001 as in progress
@Huckleberry Mark task TASK-002 as done
```

### Status Transitions

Tasks typically follow a progression:

1. **Todo** (initial state when created)
2. **In Progress** (when work begins)
3. **Done** (when work is completed)

You can transition a task to any status at any time - there are no forced workflows unless you've configured custom status workflows (see below).

## Viewing Task Status

To see the status of your tasks:

```
@Huckleberry List all tasks
```

You can filter by status:

```
@Huckleberry List in progress tasks
@Huckleberry What tasks are done?
```

## Bulk Status Updates

You can update multiple tasks at once:

```
@Huckleberry Mark all frontend tasks as done
@Huckleberry Mark tasks TASK-001, TASK-002, and TASK-003 as in progress
```

## Status Tracking

Huckleberry automatically tracks status changes, recording:

- When the status change occurred
- The previous status
- Who made the change (if available)

This history is stored in the task's metadata and can be viewed:

```
@Huckleberry Show history for task TASK-001
```

## Custom Status Workflows

For more complex projects, you can define custom statuses beyond the default three. This allows you to model your specific development workflow.

### Defining Custom Statuses

Create a `.huckleberryrc.json` file in your workspace root with custom statuses:

```json
{
  "taskManager": {
    "customStatusFlow": [
      "Backlog",
      "Ready",
      "In Progress",
      "Review",
      "Testing",
      "Done"
    ]
  }
}
```

### Using Custom Statuses

Once defined, you can use these statuses in your commands:

```
@Huckleberry Mark task TASK-001 as Ready
@Huckleberry Mark task TASK-002 as Review
@Huckleberry List tasks in Testing
```

### Status Flow Enforcement

By default, Huckleberry allows any status transition. If you want to enforce a specific flow, you can add status flow rules:

```json
{
  "taskManager": {
    "customStatusFlow": [
      "Backlog",
      "Ready",
      "In Progress",
      "Review",
      "Testing",
      "Done"
    ],
    "enforceStatusFlow": true,
    "allowSkipStatus": false
  }
}
```

With `enforceStatusFlow` set to `true`, tasks must progress through statuses in the defined order (or backward).

### Status Conditions

You can define conditions for status transitions:

```json
{
  "taskManager": {
    "statusConditions": {
      "Review": {
        "requiresComments": true
      },
      "Done": {
        "requiresApproval": true
      }
    }
  }
}
```

When these conditions are defined, Huckleberry will prompt for the required information when attempting to transition to these statuses.

## Task Lifecycle Events

Huckleberry can trigger actions when tasks change status. This is defined in the `.huckleberryrc.json` file:

```json
{
  "taskManager": {
    "lifecycleHooks": {
      "onStatusChange": {
        "Done": {
          "message": "Congratulations on completing task ${taskId}!",
          "updateRelatedTasks": true
        },
        "In Progress": {
          "message": "You've started work on ${taskId}. Good luck!",
          "recordStartTime": true
        }
      }
    }
  }
}
```

## Status Labels and Colors

You can customize how statuses appear in reports and listings:

```json
{
  "taskManager": {
    "statusLabels": {
      "Todo": {
        "label": "⭕ Not Started",
        "color": "gray"
      },
      "In Progress": {
        "label": "🔄 Working",
        "color": "blue"
      },
      "Done": {
        "label": "✅ Completed",
        "color": "green"
      }
    }
  }
}
```

## Task Completion

When a task is marked as "Done" (or your equivalent final status), Huckleberry:

1. Updates the task status in `tasks.json`
2. Adds a completion timestamp
3. Updates any dependent tasks
4. Optionally triggers completion actions

### Completion Actions

You can define actions to take when tasks are completed:

```json
{
  "taskManager": {
    "completionActions": {
      "archiveTasks": true,
      "notifyOnDependencyCompletion": true,
      "suggestNextTasks": true
    }
  }
}
```

## Status Statistics

To get an overview of your task progress:

```
@Huckleberry Show task statistics
```

This will display a breakdown of tasks by status, giving you insight into your project's progress.

## Due Dates and Status

Huckleberry can integrate due dates with status management:

```
@Huckleberry Create a task to implement login page due in 2 days
@Huckleberry List overdue tasks
```

When a task is overdue but not marked as done, Huckleberry can provide warnings or highlight these tasks in reports.

## Status in Task Files

Task status is stored in two places:

1. In `tasks.json` as part of the task metadata
2. In the individual task Markdown file at the top

Example of a task Markdown file:

```markdown
# TASK-001: Implement user authentication

**Priority**: High  
**Status**: In Progress  
**Created**: 2025-04-18  
**Updated**: 2025-04-19  

## Description

Create a user authentication system with login, registration, and password reset functionality.

## Status History

- 2025-04-18: Created (Todo)
- 2025-04-19: Started work (In Progress)
```

## Best Practices

### Status Updates

- Update task status regularly to maintain an accurate picture of project progress
- Follow a consistent workflow to make status tracking meaningful
- Use descriptive custom statuses that match your team's workflow
- Automate status updates where possible (e.g., with git hooks)

### Status Reviews

Regular status reviews help keep your project on track:

```
@Huckleberry List tasks that haven't changed status in 7 days
```

### Team Communication

When working in a team:

- Communicate status changes in team meetings
- Consider adding comments when changing status to provide context
- Review status changes when pulling from version control

## Related Features

- [Working with Tasks](./working-with-tasks.md): General task management workflow
- [Settings](./settings.md): Configuration options for task management
- [Customization](./customization.md): Advanced customization of Huckleberry