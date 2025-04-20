# Huckleberry Manual Testing Guide

This document outlines the manual testing procedures for the Huckleberry Task Manager VS Code extension. It covers all the functionality that should be tested in both the VS Code chat interface and agent interactions.

## Prerequisites

Before testing, ensure you have:

1. VS Code (version 1.93.0 or later) installed
2. GitHub Copilot and GitHub Copilot Chat extensions installed and authenticated
3. Huckleberry extension installed
4. A workspace (folder) open in VS Code
5. GitHub Copilot Agent Mode enabled (recommended for best experience)

## Test Categories

The test cases are organized into the following categories:

1. Installation and Setup
2. Chat Commands
3. Language Model Tools
4. Task Management Operations
5. Error Handling and Edge Cases
6. Integration Tests

## 1. Installation and Setup

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| SETUP-01 | Install Huckleberry extension in VS Code | Extension appears in the Extensions list as installed |
| SETUP-02 | Activate the extension in a workspace | No errors in the Output panel (Huckleberry Debug channel) |
| SETUP-03 | Initialize task tracking via chat command | Task directory is created in the workspace; confirmation message shown |
| SETUP-04 | Initialize task tracking via LM tool | Task directory is created; tool returns success message |
| SETUP-05 | Reload VS Code with workspace open | Extension activates properly, maintains previous task state |
| SETUP-06 | Open VS Code without a folder, then open a folder | Extension prompts to reload window for chat features to work |

## 2. Chat Commands

### 2.1 Task Setup Commands

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| CHAT-01 | `@Huckleberry Initialize task tracking for this project` | Task tracking initialized, confirmation message shown |
| CHAT-02 | Try to initialize in a workspace already initialized | Appropriate message indicating already initialized |

### 2.2 Task Creation Commands

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| CHAT-03 | `@Huckleberry Create a task to implement user authentication` | New task created with default priority, ID shown |
| CHAT-04 | `@Huckleberry Create a high priority task to fix security vulnerability` | New high priority task created, ID shown |
| CHAT-05 | `@Huckleberry Create a critical priority task to fix data loss bug` | New critical priority task created, ID shown |
| CHAT-06 | `@Huckleberry Create a low priority task to update documentation` | New low priority task created, ID shown |

### 2.3 Task Viewing Commands

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| CHAT-07 | `@Huckleberry List all tasks` | All tasks listed with IDs, descriptions, priorities, status |
| CHAT-08 | `@Huckleberry What tasks are high priority?` | Only high priority tasks shown |
| CHAT-09 | `@Huckleberry List completed tasks` | Only completed tasks shown |
| CHAT-10 | `@Huckleberry Show me open tasks` | Only open tasks shown |

### 2.4 Task Management Commands

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| CHAT-11 | `@Huckleberry Mark task {ID} as complete` | Task status changed to complete, confirmation shown |
| CHAT-12 | `@Huckleberry Mark task {ID} as high priority` | Task priority changed, confirmation shown |
| CHAT-13 | `@Huckleberry Mark task {ID} as medium priority` | Task priority changed, confirmation shown |
| CHAT-14 | `@Huckleberry Mark task {ID} as low priority` | Task priority changed, confirmation shown |

### 2.5 Task Discovery Commands

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| CHAT-15 | `@Huckleberry Scan for TODOs in the codebase` | TODOs found and converted to tasks, count shown |
| CHAT-16 | `@Huckleberry Scan for TODOs in **/*.ts` | Only TypeScript TODOs found and converted |
| CHAT-17 | `@Huckleberry Parse requirements.md and create tasks` | Requirements parsed, tasks created from document |

### 2.6 Conversational Flow

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| CHAT-18 | Ask follow-up question after listing tasks | Context maintained, appropriate response given |
| CHAT-19 | Complex request combining multiple operations | Request understood and executed correctly |
| CHAT-20 | Request with typo or grammatical error | Intent understood despite error |

## 3. Language Model Tools

### 3.1 Create Task Tool

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| LM-01 | Invoke `create_task` tool with description | Task created, success message returned |
| LM-02 | Invoke `create_task` tool with description and priority | Task created with specified priority |
| LM-03 | Natural language: "Create a task to implement user authentication" | Tool correctly invoked, task created |
| LM-04 | Natural language: "Create a high priority task to fix login" | Tool invoked with correct priority |

### 3.2 Initialize Task Tracking Tool

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| LM-05 | Invoke `initialize_task_tracking` tool | Task tracking initialized, success message |
| LM-06 | Natural language: "Initialize task tracking for this project" | Tool correctly invoked |
| LM-07 | Try to initialize in a workspace already initialized | Appropriate message indicating already initialized |

### 3.3 Scan TODOs Tool

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| LM-08 | Invoke `scan_todos` tool without pattern | All TODOs scanned, tasks created |
| LM-09 | Invoke `scan_todos` tool with pattern | Only matching files scanned |
| LM-10 | Natural language: "Scan for TODOs in the codebase" | Tool correctly invoked |
| LM-11 | Natural language: "Scan for TODOs in JavaScript files" | Tool invoked with correct pattern |

### 3.4 List Tasks Tool

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| LM-12 | Invoke `list_tasks` tool without filters | All tasks listed |
| LM-13 | Invoke `list_tasks` tool with priority filter | Only tasks with specified priority shown |
| LM-14 | Invoke `list_tasks` tool with status filter | Only tasks with specified status shown |
| LM-15 | Natural language: "Show me all my tasks" | Tool correctly invoked |
| LM-16 | Natural language: "What high priority tasks are still open?" | Tool invoked with correct filters |

### 3.5 Mark Task Done Tool

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| LM-17 | Invoke `mark_task_done` tool with task ID | Task marked complete, success message |
| LM-18 | Natural language: "Mark task HUCK-123 as complete" | Tool correctly invoked with task ID |
| LM-19 | Invoke with non-existent task ID | Appropriate error message |

### 3.6 Change Task Priority Tool

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| LM-20 | Invoke `change_task_priority` tool with task ID and priority | Priority changed, success message |
| LM-21 | Natural language: "Change task HUCK-123 to high priority" | Tool correctly invoked with parameters |
| LM-22 | Invoke with non-existent task ID | Appropriate error message |
| LM-23 | Invoke with invalid priority | Appropriate error message |

## 4. Task Management Operations

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| TASK-01 | Create multiple tasks via different methods | All tasks appear in task listing |
| TASK-02 | Change priority of existing task | Priority updated in storage |
| TASK-03 | Mark task as complete | Status updated in storage |
| TASK-04 | Create task with very long description | Task created properly, description not truncated |
| TASK-05 | Create tasks, close VS Code, reopen | Tasks persist correctly |

## 5. Error Handling and Edge Cases

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| ERR-01 | Reference non-existent task ID | Clear error message indicating task not found |
| ERR-02 | Try commands before initializing task tracking | Prompt to initialize task tracking first |
| ERR-03 | Use invalid priority value | Clear error message about valid priorities |
| ERR-04 | Try to mark already completed task as complete | Appropriate message indicating already complete |
| ERR-05 | Try commands with no workspace open | Clear message that workspace is required |
| ERR-06 | Parse non-existent requirements file | Clear error message about file not found |
| ERR-07 | Scan for TODOs in empty workspace | Message indicating no TODOs found |

## 6. Integration Tests

| Test ID | Description | Expected Outcome |
|---------|-------------|------------------|
| INT-01 | Workflow: Initialize → Create tasks → List → Mark complete | All operations work in sequence |
| INT-02 | GitHub Copilot conversation about tasks without explicit @Huckleberry | Copilot uses LM tools correctly |
| INT-03 | Mix of chat commands and LM tools in same session | Both interaction methods work correctly |
| INT-04 | Create task file outside extension then use extension | Extension recognizes and works with existing tasks |
| INT-05 | Test with Agent Mode enabled vs disabled | Expected behavior differences documented |
| INT-06 | Create tasks → edit task files manually → list tasks | Extension handles manual edits correctly |

## Test Environments

Test the extension in these environments:

1. Windows with VS Code latest stable
2. macOS with VS Code latest stable
3. Linux with VS Code latest stable
4. VS Code Insiders build (if available)

## Known Limitations

* If you open a folder after starting VS Code (start with no folder/workspace and then open one), you must reload the window for Huckleberry chat features to work.
* Some features may not work if GitHub Copilot Agent Mode is disabled.

## Bug Reporting

When reporting bugs, please include:

1. VS Code version
2. Huckleberry extension version
3. Operating system details
4. GitHub Copilot and Copilot Chat versions
5. Steps to reproduce
6. Expected vs actual behavior
7. Screenshots if applicable
8. Any relevant error messages from the Output panel (Huckleberry Debug channel)