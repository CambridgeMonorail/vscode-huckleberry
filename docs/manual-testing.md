# Huckleberry Manual Testing Checklist

This document outlines all the features of the Huckleberry Task Manager extension that need to be manually tested before release. Each feature includes a checkbox to track testing progress.

> **Note:** This testing document corresponds to the features specified in the [Product Requirements Document (PRD.md)](./PRD.md). Refer to the PRD for detailed feature specifications and implementation guidelines.

## Installation and Setup

- [x] Extension can be installed from VSIX file
- [x] Extension activates properly when opening a workspace
- [x] Extension registers as a chat participant
- [x] Language model tools are properly registered
- [x] Extension shows up in the Command Palette

## Core Chat Participant Functionality

- [x] @Huckleberry can be mentioned in VS Code Chat
- [x] Chat participant responds to messages
- [x] Chat participant maintains context across messages in a conversation
- [x] Error messages are displayed properly when issues occur

## Task Initialization

- [x] `@Huckleberry Initialize task tracking for this project` creates proper task structure
- [x] Task initialization creates `tasks.json` file
- [x] Task initialization creates tasks directory
- [x] Task initialization produces confirmation message
- [x] Task initialization fails gracefully if already initialized

## Task Creation and Management

- [x] `@Huckleberry Create a task to implement user authentication` creates new task
- [x] `@Huckleberry Create a high priority task to fix security vulnerability` creates high priority task
- [x] Created tasks have unique IDs
- [x] Created tasks have appropriate metadata (priority, status, etc.)
- [x] Tasks can be created with explicit priority levels (high, medium, low)
- [x] Tasks are stored properly in task files
- [x] `@Huckleberry List all tasks` shows all tasks correctly
- [ ] `@Huckleberry What tasks are high priority?` filters tasks by priority

## Task Status Management

- [ ] `@Huckleberry Mark task TASK-123 as complete` updates task status
- [ ] `@Huckleberry Mark task TASK-123 as high priority` updates task priority
- [ ] Status changes are reflected in tasks.json
- [ ] Status changes are reflected in task files
- [ ] Task status changes fail gracefully for invalid task IDs

## Task Decomposition

- [ ] `@Huckleberry Break TASK-123 into subtasks` creates subtasks
- [ ] Subtasks are properly linked to parent task
- [ ] Subtasks have unique IDs
- [ ] Subtask hierarchy is reflected in tasks.json

## TODO Comment Scanning

- [ ] `@Huckleberry Scan for TODOs in the codebase` finds TODOs across all files
- [ ] `@Huckleberry Scan for TODOs in **/*.ts` finds TODOs in matching files only
- [ ] Scanned TODOs are converted to tasks
- [ ] Scanned TODOs include context from surrounding code
- [ ] TODO scanning supports different comment formats (// TODO:, /* TODO:, # TODO:)
- [ ] Duplicate TODOs are handled appropriately

## Requirements Document Parsing

- [ ] `@Huckleberry Parse requirements.md and create tasks` extracts tasks
- [ ] Task hierarchy from document structure is preserved
- [ ] Document parsing extracts priorities where specified
- [ ] Document parsing extracts dependencies where inferred
- [ ] Document parsing generates meaningful task descriptions

## Language Model Tools Integration

- [ ] `huckleberry.createTask` tool works from VS Code's language model
- [ ] `huckleberry.initializeTaskTracking` tool works from VS Code's language model
- [ ] `huckleberry.scanTodos` tool works from VS Code's language model
- [ ] `huckleberry.listTasks` tool works from VS Code's language model
- [ ] `huckleberry.markTaskDone` tool works from VS Code's language model
- [ ] `huckleberry.changeTaskPriority` tool works from VS Code's language model
- [ ] Tools can be invoked during normal chat without explicit @Huckleberry mentions

## Settings and Configuration

- [ ] `huckleberry.taskmanager.defaultTasksLocation` setting changes task file location
- [ ] `huckleberry.taskmanager.taskFileTemplate` setting changes task file format
- [ ] `huckleberry.taskmanager.defaultTaskPriority` setting changes default priority
- [ ] `huckleberry.taskmanager.defaultDueDate` setting changes default due date
- [ ] Settings changes take effect without needing to reload extension

## Command Palette Integration

- [ ] `Huckleberry: Manage Tasks` command is available in Command Palette
- [ ] Command Palette command opens task management UI
- [ ] Task management works via Command Palette as expected

## Error Handling

- [ ] Extension handles non-existent task references gracefully
- [ ] Extension handles workspace without task initialization gracefully
- [ ] Extension handles permission errors gracefully
- [ ] Extension handles malformed tasks.json gracefully
- [ ] Extension provides helpful error messages when actions fail

## Edge Cases

- [ ] Extension works after reloading VS Code window
- [ ] Extension works after reopening VS Code
- [ ] Extension works with large number of tasks (100+)
- [ ] Extension works with long task descriptions
- [ ] Extension works with special characters in task names/descriptions
- [ ] Extension works in multi-root workspaces

## Performance

- [ ] Task operations complete in reasonable time (<1s for most operations)
- [ ] UI remains responsive during task scanning operations
- [ ] Memory usage remains reasonable during extended use
- [ ] File operations are batched appropriately for large tasks

## Cross-Platform Testing

- [ ] Extension works properly on Windows
- [ ] Extension works properly on macOS
- [ ] Extension works properly on Linux

## Security and Privacy

- [ ] Task data is stored only in the workspace (no external data transfer)
- [ ] Security-sensitive information in tasks is handled appropriately
- [ ] Authentication tokens (if any) are stored securely

## Documentation Accuracy

- [ ] All documented commands work as described
- [ ] All documented settings work as described
- [ ] Example workflows from documentation can be followed successfully

## Notes on Testing

For each feature, document any issues encountered during testing including:

- Steps to reproduce
- Expected vs. actual behavior
- Error messages or logs
- Screenshots if relevant

Use this format for reporting issues:

```
### Issue: [Brief description]
- **Steps to reproduce**: 
  1. 
  2. 
  3. 
- **Expected behavior**: 
- **Actual behavior**: 
- **Environment**: [VS Code version, OS, etc.]
- **Notes**: 
```

## Testing Progress Tracking

| Testing Session | Date | Tester | Features Tested | Issues Found | Issues Fixed |
|----------------|------|--------|-----------------|--------------|--------------|
|                |      |        |                 |              |              |

---

*Last Updated: April 20, 2025*
