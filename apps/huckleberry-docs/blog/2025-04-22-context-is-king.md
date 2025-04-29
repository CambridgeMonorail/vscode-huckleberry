---
slug: context-is-king
title: Context Is King - How Huckleberry Helps Copilot Do Its Job
authors: [tim]
tags: [huckleberry, github-copilot, context, ai-agents, productivity]
---

If you've ever used GitHub Copilot in agent mode, you'll know it can do a lot, but only if it knows what you're actually trying to do.

That's where Huckleberry comes in.

<!-- truncate -->

## Why Context Matters

Copilot in agent mode is like hiring a very clever junior developer. One who's full of potential, quick on the keyboard, but occasionally makes enthusiastic guesses when things aren't clear.

It doesn't just suggest code. It runs tasks, executes commands, edits files, and tries to help you move work forward. But without context, it's like asking someone to finish your sentence without telling them what it was about.

## Huckleberry's Role

Huckleberry is a task manager that lives inside VS Code. It helps you organise what needs doing, and makes that information available where it matters.

It helps by:

- **Organising tasks in context**  
  Your to-do list isn't just for you anymore. Copilot can reference it too.

- **Clarifying your intent**  
  A well-scoped task helps Copilot do the right thing on the first attempt.

- **Making conversations feel natural**  
  You can ask Huckleberry to suggest the next task, update priorities, or mark things as done, all without leaving your editor.

Think of it as a project whisperer. It translates your intentions into something Copilot can actually act on, so you don't have to keep repeating yourself.

## Getting Copilot on the Same Page

There's another trick too. You can give Copilot more permanent context by adding a `.github/copilot-instructions.md` file to your repo. This file lets you explain, in plain English, how your project is set up and what you expect.

If you're using Huckleberry, you can tell Copilot something like:

```markdown
We use the Huckleberry extension to manage tasks inside VS Code.
Tasks are stored in plain text and follow a structured format.
When asked to complete a task, refer to the current task list first.
```

It's not magic, but it helps. Especially when Copilot Chat is trying to guess what matters in a large workspace.

## What You Get

With Huckleberry in the loop, Copilot becomes more useful. You'll notice:

- Better-targeted edits  
- Fewer detours into the wrong files  
- Suggestions that actually relate to what you're working on  
- Less context-switching just to explain what you mean

It won't make Copilot perfect. But it makes it more focused, and more capable of acting like part of the team.

## Still in Alpha

Huckleberry's not finished. Some features are still being tested, and the occasional odd behaviour is to be expected. But it's already helping us work more smoothly, and we think it might help you too.

If you've ever felt like you were constantly having to explain the obvious to your AI assistant, Huckleberry might be what you've been waiting for.

## FAQs

### Q: What is the .github/copilot-instructions.md file and how does it help?

A: This file provides permanent context to GitHub Copilot about your project setup and preferences. For Huckleberry users, it helps Copilot understand how tasks are managed and stored in your workspace.

### Q: How does Huckleberry improve Copilot's context awareness?

A: Huckleberry helps by organizing tasks in context, clarifying your intentions through well-scoped tasks, and making task-related conversations feel natural. It provides Copilot with structured information about your project's tasks and priorities.

### Q: Does Huckleberry require GitHub Copilot to function?

A: Yes, Huckleberry is designed to work with GitHub Copilot and leverages its AI capabilities. You need an active GitHub Copilot subscription to use Huckleberry's full feature set.
