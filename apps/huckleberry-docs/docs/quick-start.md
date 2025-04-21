---
sidebar_position: 3
---

# Quick Start

This guide will get you up and running with Huckleberry Task Manager in just a few minutes.

> **Note:** Haven't installed Huckleberry yet? Check out the [Installation Guide](./installation.md) first.

## Initialize Task Tracking

After installing Huckleberry, the first step is to initialize task tracking in your workspace:

1. Open VS Code with your project workspace
2. Open the chat panel by clicking on the chat icon in the Activity Bar or pressing `Ctrl+Alt+Space` (Windows/Linux) or `Cmd+Shift+Space` (Mac)
3. Type the following:

```
@Huckleberry Initialize task tracking for this project
```

This will create the necessary files in your workspace for tracking tasks.

## Creating Your First Task

Let's create your first task:

1. In the chat panel, type:

```
@Huckleberry Create a task to implement user authentication
```

2. Huckleberry will create a new task with a unique ID (e.g., `TASK-001`) and provide you with the details.

You can also create tasks with specific priorities:

```
@Huckleberry Create a high priority task to fix security vulnerability
```

## Viewing Your Tasks

To see all your tasks:

```
@Huckleberry List all tasks
```

You can also filter by priority:

```
@Huckleberry What tasks are high priority?
```

Or by status:

```
@Huckleberry List completed tasks
```

## Managing Tasks

### Mark a Task as Complete

```
@Huckleberry Mark task TASK-001 as complete
```

### Change a Task's Priority

```
@Huckleberry Mark task TASK-002 as high priority
```

## Scanning for TODOs

Huckleberry can automatically find TODO comments in your code and turn them into tasks:

```
@Huckleberry Scan for TODOs in the codebase
```

You can also specify a pattern to scan specific files:

```
@Huckleberry Scan for TODOs in **/*.ts
```

## Where Are My Tasks Stored?

Huckleberry stores tasks in your workspace:

- **tasks.json** - The main task registry with basic metadata for all tasks
- **tasks/** directory - Individual task files with detailed information

These files are stored locally and can be committed to version control to share with your team.

## Next Steps

Now that you've learned the basics, you can:

- Explore [all features](./features.md) of Huckleberry
- Learn about [Agent Mode Features](./language-model-tools.md)
- See more [advanced usage examples](./usage.md)