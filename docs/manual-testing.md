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
- [ ] `@Huckleberry Create a high priority task to fix security vulnerability` creates high priority task
- [x] Created tasks have unique IDs
- [x] Created tasks have appropriate metadata (priority, status, etc.)
- [x] Tasks can be created with explicit priority levels (high, medium, low)
- [x] Tasks are stored properly in task files
- [x] `@Huckleberry List all tasks` shows all tasks correctly
- [x] `@Huckleberry What tasks are high priority?` filters tasks by priority

## Task Status Management

- [x] `@Huckleberry Mark task TASK-123 as complete` updates task status
- [x] `@Huckleberry Mark task TASK-123 as high priority` updates task priority
- [x] Status changes are reflected in tasks.json
- [x] Status changes are reflected in task files
- [x] Task status changes fail gracefully for invalid task IDs

## Task Prioritization

- [ ] `@Huckleberry Prioritize tasks` sorts tasks by status and priority
- [ ] High priority tasks appear before medium and low priority tasks
- [ ] Incomplete tasks appear before completed tasks

## Next Task Suggestions

- [x] `@Huckleberry What task should I work on next?` suggests appropriate next task
- [ ] Next task suggestions consider priority and dependencies 
- [ ] Next task suggestions provide rationale for the recommendation

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

## Help and Documentation

- [ ] `@Huckleberry help` shows general help information
- [ ] `@Huckleberry help task-creation` shows topic-specific help
- [ ] Help information is accurate and matches implemented functionality
- [ ] Help includes examples of command usage

## Language Model Tools Integration

- [ ] `create_task` tool works from VS Code's language model
- [ ] `initialize_tracking` and `initialise_tracking` tools work from VS Code's language model
- [ ] `scan_todos` tool works from VS Code's language model
- [ ] `list_tasks` tool works from VS Code's language model
- [ ] `mark_task_done` tool works from VS Code's language model
- [ ] `update_task_priority` tool works from VS Code's language model
- [ ] `prioritize_tasks` tool works from VS Code's language model
- [ ] `next_task` tool works from VS Code's language model
- [ ] `help` tool works from VS Code's language model
- [ ] Tools can be invoked during normal chat without explicit @Huckleberry mentions

## Settings and Configuration

- [ ] `huckleberry.taskmanager.defaultTasksLocation` setting changes task file location
- [ ] `huckleberry.taskmanager.taskFileTemplate` setting changes task file format
- [ ] `huckleberry.taskmanager.defaultTaskPriority` setting changes default priority
- [ ] `huckleberry.taskmanager.defaultDueDate` setting changes default due date
- [ ] Settings changes take effect without needing to reload extension

## Command Palette Integration

- [ ] `Huckleberry: Manage Tasks` command is available in Command Palette
- [ ] `Huckleberry: Initialize Task Tracking` / `Initialise Task Tracking` commands work as expected
- [ ] `Huckleberry: Create Task` command works as expected
- [ ] `Huckleberry: List Tasks` command works as expected
- [ ] `Huckleberry: Mark Task Complete` command works as expected
- [ ] `Huckleberry: Change Task Priority` command works as expected
- [ ] `Huckleberry: Scan TODOs` / `Scan for TODOs` commands work as expected
- [ ] `Huckleberry: Prioritize Tasks` command works as expected
- [ ] `Huckleberry: Get Next Task` command works as expected
- [ ] `Huckleberry: Get Help` command works as expected
- [ ] `Huckleberry: Parse Requirements Document` command works as expected
- [ ] Command Palette commands provide appropriate feedback and error messages

## Developer Mode Commands

- [ ] `Huckleberry (Dev): Check Copilot Agent Mode` verifies Copilot agent mode status
- [ ] `Huckleberry (Dev): Test Chat Integration` validates chat participant functionality
- [ ] `Huckleberry (Dev): Refresh Chat Participants` successfully refreshes chat integration
- [ ] Developer commands are only visible when development mode is enabled

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

*Last Updated: April 22, 2025*
