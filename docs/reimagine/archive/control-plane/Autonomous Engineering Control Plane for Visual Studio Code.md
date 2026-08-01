# Huckleberry 2

## Autonomous Engineering Control Plane for Visual Studio Code

**Status:** Vision Proposal

**Version:** 2.0

**Audience:** Engineering, Product, UX

---

# Vision

Software engineering is changing.

Developers are increasingly delegating implementation, testing, documentation and research to AI agents. The challenge is no longer generating code. The challenge is supervising autonomous systems that generate code.

Today's AI coding experience is largely conversational.

You ask an agent to perform a task.

You wait.

Eventually it reports back.

The conversation becomes the history.

The conversation becomes the memory.

The conversation becomes the explanation.

This model does not scale.

Huckleberry 2 aims to replace conversation-driven engineering with evidence-driven engineering.

It is not another coding agent.

It is the control plane that coordinates, constrains and supervises autonomous software engineers.

---

# Background

The original Huckleberry focused on orchestrating workflows inside Visual Studio Code.

That remains an important foundation.

However, autonomous engineering requires capabilities beyond simple workflow execution.

Modern engineering increasingly resembles an operations problem.

Multiple specialised AI agents perform work.

Developers supervise outcomes.

Policies govern behaviour.

Evidence determines truth.

Progress must remain visible.

Huckleberry should become the engineering equivalent of Kubernetes or GitHub Actions.

It should schedule work.

Coordinate specialists.

Enforce policy.

Collect evidence.

Provide complete visibility into autonomous engineering.

---

# Inspiration

Several emerging ideas strongly influence this vision.

## Ralph Loops

Ralph Loops demonstrate that autonomous coding works best through repeated bounded iterations rather than enormous conversations.

Each iteration starts with a fresh understanding of the repository.

The repository becomes memory.

The workflow provides continuity.

---

## Matt Pocock's Skills for Real Engineers

Matt Pocock's **Skills for Real Engineers** project demonstrates that engineering expertise can be captured as small, composable skills instead of enormous prompts.

Repository:

https://github.com/mattpocock/skills

The skills include engineering practices such as:

* Research
* Requirements clarification
* Domain modelling
* Test Driven Development
* Code Review
* Architecture Review
* Bug Diagnosis

Huckleberry should not replace these skills.

Instead it should become the orchestration layer that discovers, executes, supervises and coordinates them.

The same runtime should eventually support:

* Matt Pocock Skills
* Repository-specific skills
* Organisation-specific skills
* Third-party skills
* Future marketplace skills

Huckleberry should become the operating system for engineering skills.

---

# Product Philosophy

## AI performs work.

Huckleberry controls work.

---

## Evidence is truth.

Conversation is never evidence.

Evidence includes:

* compiler output
* diagnostics
* benchmarks
* test reports
* accessibility reports
* security scans
* screenshots
* git diffs
* coverage reports

---

## Repository over conversation.

The repository is the permanent memory.

Chats are disposable.

---

## Human judgement remains essential.

Humans decide.

Agents propose.

Evidence informs.

---

## Every autonomous action should be observable.

Nothing should happen "inside the AI."

Every decision should be visible.

---

# Product Goals

Huckleberry should allow a developer to supervise autonomous engineering exactly as they would supervise a junior software engineer.

The developer should always know:

* what is happening
* why it is happening
* what evidence has been collected
* what remains
* what requires intervention

---

# User Stories

## Solo Developer

I want to ask Huckleberry to implement a feature while I continue working elsewhere.

I should be able to return later and understand everything that happened.

---

## Team Lead

I want engineering work to follow agreed workflows rather than personal prompting styles.

---

## Principal Engineer

I want architecture reviews, accessibility reviews and security reviews automatically included in every workflow.

---

## Product Engineer

I want to compose reusable engineering workflows from existing skills rather than continually writing prompts.

---

# Core Concepts

## Goal

A Goal represents an engineering objective.

Example

```text
Implement OAuth Login
```

A Goal owns:

* description
* acceptance criteria
* progress
* evidence
* planner state
* workflows
* history

Goals replace traditional task management.

---

## Planner

The Planner converts Goals into executable engineering work.

Responsibilities:

* decomposition
* dependency planning
* workflow selection
* re-planning
* progress evaluation

The planner never executes work.

---

## Workflow

A Workflow represents deterministic orchestration.

Example

```text
Research

↓

Architecture Review

↓

Implementation

↓

Testing

↓

Accessibility

↓

Documentation

↓

Approval
```

---

## Skill

A Skill is a reusable engineering capability.

Inspired by Matt Pocock's Skills.

Each Skill exposes a standard contract.

Inputs

Outputs

Evidence

Acceptance Criteria

Permissions

Failure Modes

Cost Estimate

Runtime Limits

Skills become the building blocks of workflows.

---

## Agent

Agents perform bounded work.

Examples:

Claude

GPT-5

GitHub Copilot

Future providers

Agents never own orchestration.

---

## Evidence

Evidence represents objective engineering facts.

Examples:

stdout

stderr

coverage

compiler diagnostics

benchmark reports

git diff

Evidence is immutable.

---

## Policy

Policies define repository governance.

Examples:

Maximum retries

Protected branches

Protected files

Maximum cost

Required approvals

Policies are enforced automatically.

---

## Knowledge

Knowledge captures lessons between runs.

Examples

Known failures

Repository conventions

Architecture decisions

Successful repair strategies

Knowledge improves future planning.

---

## Reflection

Every completed run should generate structured reflection.

Questions include:

What worked?

What failed?

Should strategy change?

Should knowledge be updated?

---

# Matt Pocock Skill Integration

Huckleberry should treat Matt Pocock's Skills for Real Engineers as reference implementations for engineering workflows rather than special cases.

Repository:

https://github.com/mattpocock/skills

Example engineering workflow

```text
Research

↓

Grill Requirements

↓

Generate CONTEXT.md

↓

Domain Modelling

↓

Architecture Review

↓

Implementation

↓

Test Driven Development

↓

Code Review

↓

Maintainability Review

↓

Documentation

↓

Approval
```

Each stage becomes an executable Huckleberry Skill.

Huckleberry remains responsible for:

* discovery
* scheduling
* execution
* orchestration
* evidence collection
* retries
* approvals
* visualisation

This architecture allows future skills from any source to execute using exactly the same runtime.

---

# Planning Engine

The Planning Engine introduces intelligence before execution.

Responsibilities

Analyse Goal

↓

Break into work

↓

Choose Skills

↓

Build Workflow

↓

Estimate Cost

↓

Estimate Risk

↓

Execute

↓

Reflect

↓

Re-plan

Planning should remain explainable.

Developers should always understand why a strategy was chosen.

---

# Workflow Engine

The Workflow Engine becomes a deterministic state machine.

Responsibilities:

* sequencing
* branching
* retries
* parallel execution
* recovery
* pause
* resume
* cancellation

Agents should never loop independently.

The Workflow Engine owns iteration.

---

# Policy Engine

Every repository should define operational constraints.

Example

```yaml
maxRetries: 3

maxCost: $5

maxRuntime: 45m

protectedBranches:

- main

protectedFiles:

- package-lock.json

approvalRequired:

- dependency updates

- database migrations

- releases
```

Violations immediately stop execution.

---

# Evidence Engine

Every workflow produces structured evidence.

Evidence types include:

* logs
* compiler output
* diagnostics
* screenshots
* git diffs
* benchmark reports
* architecture reports
* review reports

Evidence is linked directly to workflow stages.

---

# Reflection Engine

Reflection is a first-class workflow stage.

Reflection captures:

Successes

Failures

Lessons Learned

Updated Knowledge

Alternative Strategies

Future workflows benefit from accumulated experience.

---

# VS Code Experience

The extension should feel like Mission Control rather than a chat application.

---

# Activity Bar

Mission Control

Goals

Skills

Runs

Evidence

Knowledge

Policies

Agents

---

# Goal Explorer

Displays:

Current Goal

Progress

Current Skill

Estimated Completion

Current Risks

Blocking Issues

---

# Live Workflow Graph

A real-time visual representation of execution.

Nodes display:

Waiting

Running

Succeeded

Failed

Cancelled

Blocked

Execution should feel similar to observing a GitHub Actions pipeline.

---

# Skill Inspector

Displays:

Purpose

Inputs

Outputs

Logs

Evidence

Execution Time

Files Modified

Retries

Cost

---

# Evidence Explorer

Browse evidence by:

Goal

↓

Workflow

↓

Run

↓

Skill

↓

Evidence

Everything should remain searchable.

---

# Agent Monitor

Shows every active agent.

Displays:

Current Objective

Current Skill

Files Modified

Tokens

Estimated Cost

Execution Time

Retry Count

Controls:

Pause

Resume

Restart

Cancel

---

# Planning View

Shows:

Current Strategy

Alternative Strategies

Dependencies

Risk Assessment

Reasoning Summary

Developers should understand planner decisions without reading prompts.

---

# Policy View

Displays repository governance.

Examples:

Retry Limits

Cost Budgets

Protected Paths

Approval Gates

Runtime Limits

Violations appear immediately.

---

# Reflection View

Every completed run displays:

What succeeded

What failed

Knowledge captured

Recommendations

Future improvements

---

# Timeline

Every run becomes replayable.

Example

```text
09:12

Planner

↓

09:13

Research

↓

09:16

Architecture Review

↓

09:24

Implementation

↓

09:37

TypeScript Failed

↓

09:39

Repair

↓

09:43

TypeScript Passed

↓

09:45

Accessibility Review

↓

09:48

Complete
```

The timeline functions as a flight recorder for engineering.

---

# Human Supervision

Developers should be able to intervene at any point.

Supported actions:

Pause

Resume

Cancel

Retry

Skip

Replace Skill

Insert Skill

Approve

Reject

Modify Workflow

Take Manual Control

The system must always remain interruptible.

---

# Extensibility

The architecture should support:

Custom Skills

Custom Planners

Custom Policies

Custom Evidence Providers

Custom Agent Providers

Marketplace Extensions

No component should assume a specific AI provider.

---

# High-Level Architecture

```text
Goal Engine

↓

Planning Engine

↓

Workflow Engine

↓

Skill Runtime

↓

Agent Runtime

↓

Evidence Engine

↓

Policy Engine

↓

Knowledge Store

↓

VS Code User Interface
```

Each layer should be independently testable.

---

# Success Criteria

A successful Huckleberry 2 allows a developer to answer, at a glance:

* What is the current engineering goal?
* Which workflow is executing?
* Which skill is currently running?
* Which agent is performing work?
* What evidence has been produced?
* Which policies are constraining execution?
* What remains to be completed?
* What requires human judgement?
* How much time, compute and cost has been consumed?

If those questions can be answered without reading a chat transcript, Huckleberry has achieved its objective.

---

# Long-Term Vision

Huckleberry should become the engineering operating system for autonomous software development.

Coding agents will continue to improve.

New models will emerge.

New engineering skills will be created.

Workflows will evolve.

The enduring value of Huckleberry is not tied to any individual AI model.

Its value lies in providing the orchestration, governance, evidence and visibility that transform autonomous coding from an opaque conversation into a disciplined engineering process.

The future of software engineering is unlikely to be a single superhuman AI.

It is more likely to resemble a well-run engineering organisation, where specialised workers collaborate under clear processes, shared standards and experienced supervision.

Huckleberry 2 should become the platform that makes that future practical inside Visual Studio Code.
