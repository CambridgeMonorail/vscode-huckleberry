I think this is the level I'd aim for. It explains the idea without diving into implementation details or AI buzzwords.

---

# Huckleberry

### Evidence-driven engineering workflows for AI coding

AI coding assistants are becoming remarkably good at writing software.

What's still largely missing is a reliable way to define **how** that software should be engineered.

Every team has its own development process. Run the type checker. Fix the linting errors. Execute the affected tests. Capture screenshots. Review accessibility. Stop if more than five files change. Ask for approval before modifying production code.

Today, most of that process lives in prompts, documentation or tribal knowledge.

Huckleberry turns it into executable workflows.

Instead of repeatedly telling an AI assistant what to do, you define the engineering process once as a reusable workflow. Huckleberry orchestrates terminal commands, coding agents, validation tools and human approval into repeatable loops that produce evidence at every step.

The AI doesn't decide when it's finished.

Your workflow does.

---

## What Huckleberry does

Huckleberry allows developers to create version-controlled engineering workflows inside VS Code.

A workflow can combine:

* Terminal commands
* AI coding agents
* Build and test tools
* Git operations
* Conditional logic
* Retry policies
* Human approval
* Evidence collection

For example:

```text
Run TypeScript
        ↓
Errors?
        ↓
Repair using AI
        ↓
Run TypeScript again
        ↓
Pass?
        ↓
Run tests
        ↓
Capture evidence
        ↓
Request approval
        ↓
Complete
```

Each step produces evidence that can be inspected later.

---

## Why not just use prompts?

Prompts describe intent.

Workflows define process.

A prompt might say:

> Continue fixing the code until all the tests pass.

A Huckleberry workflow defines exactly:

* which tests
* how they're executed
* how many repair attempts are allowed
* when to stop
* what evidence is required
* when a human must approve the result

The workflow engine—not the AI—controls the process.

---

## Why it's different

Most AI coding tools focus on making the agent smarter.

Huckleberry focuses on making the engineering process more reliable.

It doesn't replace Copilot, Claude Code or other coding assistants.

It coordinates them.

Rather than asking an agent to "keep trying," Huckleberry executes a predefined workflow that combines deterministic tooling with bounded AI reasoning.

The result is a process that is:

* repeatable
* inspectable
* version controlled
* evidence driven
* easier to review
* easier to share across teams

---

## Core principles

### Evidence over optimism

A passing test is evidence.

An AI saying "I fixed it" is not.

---

### The workflow owns the loop

The AI performs bounded reasoning.

The workflow decides what happens next.

---

### Small composable workflows

Simple workflows can be combined into larger engineering processes.

---

### Humans remain responsible for judgement

Mechanical work should be automated.

Engineering judgement should remain explicit.

---

## Example workflows

* Repair TypeScript compilation errors
* Fix linting failures
* Validate affected Nx projects
* Review accessibility
* Capture Playwright screenshots
* Modernise legacy React components
* Verify API compatibility
* Generate release evidence
* Prepare a pull request for review

---

## Built for developers

Huckleberry is designed to fit naturally into existing engineering workflows.

It works alongside tools you already use, including:

* GitHub Copilot
* Claude Code
* Terminal commands
* Git
* TypeScript
* ESLint
* Playwright
* Vitest
* Nx
* Custom scripts

Rather than replacing those tools, it orchestrates them into repeatable engineering workflows.

---

## Positioning

> **Huckleberry is a VS Code extension that lets teams define, run and share evidence-driven engineering workflows for AI-assisted software development.**

---

## A phrase I'd consider making part of the brand

One thing I really like is this as the closing statement:

> **Don't just teach AI what to build. Teach it how your team builds software.**

I think that captures the shift you're trying to make. Every AI coding tool is trying to produce better code. Huckleberry is trying to produce **better engineering**. That's a much more durable and differentiated position.
