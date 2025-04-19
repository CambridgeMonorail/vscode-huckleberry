---
sidebar_position: 12
---

# Parsing Requirements

One of Huckleberry's powerful features is the ability to automatically extract tasks from project requirements documents. This page explains how to use this feature and get the most out of it.

## Overview

Requirements documents often contain numerous actionable items that need to be converted into trackable tasks. Huckleberry can analyze these documents and automatically extract tasks, saving you time and ensuring nothing is missed.

## Basic Usage

To parse a requirements document and create tasks:

```
@Huckleberry Parse requirements.md and create tasks
```

You can also specify any Markdown or text file:

```
@Huckleberry Parse docs/PRD.md and create tasks
```

## How It Works

When Huckleberry parses a requirements document, it:

1. Analyzes the document's structure (headings, lists, paragraphs)
2. Identifies actionable items and requirements
3. Extracts relevant details like priority indicators and dependencies
4. Creates structured tasks from the identified requirements
5. Establishes relationships between related tasks

## Supported Document Types

Huckleberry can parse:

- **Markdown files** (`.md`)
- **Text files** (`.txt`)
- **Rich Text Format** (`.rtf`)
- **HTML files** (`.html`, `.htm`)

## Document Structure Best Practices

To get the best results when parsing requirements documents, follow these formatting guidelines:

### Clear Headings

Use headings to organize requirements into sections:

```markdown
# User Authentication

## User Registration
Users should be able to create accounts with email and password.

## Login System
The system must support secure login with rate limiting.
```

### Explicit Requirements

Make requirements explicit and actionable:

```markdown
* The system **must** validate email addresses.
* Users **should** receive a confirmation email after registration.
* The application **will** support password reset functionality.
```

### Priority Indicators

Use priority indicators that Huckleberry can recognize:

```markdown
* [HIGH] Implement secure authentication
* [MEDIUM] Add form validation
* [LOW] Improve error messages
```

### Numbered Lists for Sequential Tasks

Use numbered lists for tasks that should be executed in sequence:

```markdown
1. Design database schema
2. Implement data access layer
3. Create API endpoints
4. Develop frontend components
```

## Example Usage Scenarios

### Converting a PRD to Tasks

Project requirements document:

```markdown
# User Management System PRD

## Background
Our application needs a robust user management system.

## Features

### User Registration
* [HIGH] Implement email/password registration
* [MEDIUM] Add social login options (Google, GitHub)
* [LOW] Support username customization

### User Profiles
1. Create profile data model
2. Implement profile update API
3. Design profile edit interface

## Timeline
This feature should be completed by Q3 2025.
```

Command:

```
@Huckleberry Parse PRD.md and create tasks
```

Result:

```
📋 Created 6 tasks from PRD.md:

- TASK-001 (High): Implement email/password registration
  Category: User Registration

- TASK-002 (Medium): Add social login options (Google, GitHub)
  Category: User Registration
  
- TASK-003 (Low): Support username customization
  Category: User Registration

- TASK-004: Create profile data model
  Category: User Profiles

- TASK-005: Implement profile update API
  Category: User Profiles
  Depends on: TASK-004

- TASK-006: Design profile edit interface
  Category: User Profiles
  Depends on: TASK-005
```

## Advanced Parsing Options

### Specifying Categories

You can direct Huckleberry to assign specific categories to tasks:

```
@Huckleberry Parse requirements.md and create Frontend tasks
```

### Filtering by Priority

Extract only tasks with specific priority:

```
@Huckleberry Parse requirements.md and create high priority tasks
```

### Creating Tasks with Dependencies

Huckleberry automatically detects task dependencies based on:

- Document structure (nested lists)
- Explicit references between items
- Sequential numbering

### Handling Existing Tasks

When you parse a document that might overlap with existing tasks:

```
@Huckleberry Parse updated-requirements.md and update existing tasks
```

This will:
- Create new tasks for new requirements
- Update existing tasks if requirements have changed
- Preserve task IDs and status for continuity

## Customizing the Parser

You can customize how Huckleberry parses requirements by adding a `requirementsParser` section to your `.huckleberryrc.json` file:

```json
{
  "requirementsParser": {
    "priorityKeywords": {
      "high": ["critical", "essential", "must have"],
      "medium": ["important", "should have"],
      "low": ["nice to have", "optional"]
    },
    "ignoreSections": ["Background", "Introduction", "References"],
    "categoryMapping": {
      "User Interface": "Frontend",
      "Database": "Backend",
      "API": "Backend"
    }
  }
}
```

## Best Practices

### Preparation

1. **Organize your requirements document** with clear headings and structure
2. **Indicate priorities** using consistent markers
3. **Group related requirements** under common headings
4. **Use clear, action-oriented language** for requirements

### During Parsing

1. **Start with small documents** to understand how parsing works
2. **Review generated tasks** after parsing to ensure accuracy
3. **Adjust task attributes** like priority or status as needed

### After Parsing

1. **Further organize tasks** into appropriate categories
2. **Set deadlines** for high-priority tasks
3. **Assign tasks** to team members if applicable
4. **Link related tasks** that weren't automatically connected

## Troubleshooting

### Missing Requirements

If certain requirements aren't being picked up:

- Make them more explicit with action verbs
- Use clearer formatting like bullet points
- Add priority markers to highlight importance

### Incorrect Task Details

If tasks are created with incorrect details:

- Check for ambiguous language in your requirements
- Ensure priority markers are correctly formatted
- Verify that section headings clearly indicate categories

### Parser Limitations

The current parser has some limitations:

- Complex conditional requirements may not be parsed correctly
- Very large documents may need to be split into sections
- Highly technical specifications might need manual review

## Related Features

- [Scanning TODOs](./scanning-todos.md): Similar functionality for code comments
- [Task Status Management](./task-status-management.md): How to manage tasks after creation
- [Working with Tasks](./working-with-tasks.md): General task management workflow