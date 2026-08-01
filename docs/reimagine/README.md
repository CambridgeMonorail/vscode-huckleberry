# Huckleberry Reimagination

This directory defines the product and implementation plan for Huckleberry's next phase.

## Current direction

Huckleberry is a VS Code runtime for bounded, evidence-driven development loops.

An agent attempts a change, deterministic tools evaluate the result, failures become feedback for the next attempt, and Huckleberry decides when the loop succeeds, stops, or needs a human.

The immediate goal is not a general autonomous engineering control plane. It is one trustworthy end-to-end development loop that can repair TypeScript errors in an isolated worktree and prove the result with compiler evidence.

## Authoritative documents

Read these in order:

1. [Product Thesis](./PRODUCT.md) — product boundary, users, promise, and non-goals.
2. [Domain Model](./DOMAIN.md) — precise vocabulary for loops, iterations, actors, verifiers, evidence, and skills.
3. [MVP Experience](./MVP.md) — the first complete user journey.
4. [Loop Runtime Specification](./RUNTIME.md) — normative runtime behaviour and proposed contract.
5. [Current Capability Gap](./GAP.md) — an honest comparison with the codebase.
6. [Usefulness Validation Plan](./VALIDATION.md) — hypotheses, comparison protocol, measures, and decision gates.
7. [Implementation Plan](./PLAN.md) — validation-led milestones and the active `LOOP-*` backlog.
8. [Issue Specs](./issues/README.md) — implementation-ready task bodies.
9. [Current State and Next Work](./HANDOFF.md) — the latest checkpoint and next-branch starting point.

When these documents conflict with another file under `docs/reimagine`, these documents win.

## Status labels

- **Current**: authoritative for product and implementation decisions.
- **Historical**: useful record of earlier thinking or completed substrate work; not a current plan.
- **Future horizon**: an idea that must not drive near-term implementation without a new product decision.

## Historical material

The [`archive/workflow-runner`](./archive/workflow-runner/) directory contains the numbered product documents, `RIM-*` issue files, and RIM tracker that guided the workflow-runner conversion. They are historical because some completion claims describe interfaces or scaffolding rather than a working AI repair loop.

The [`archive/control-plane`](./archive/control-plane/) directory contains the Autonomous Engineering Control Plane documents, `requirements.md`, `ACP-*` issue files, and ACP tracker. They are a future horizon, not the active roadmap. Goal planning, multi-agent scheduling, organisational skill registries, reflection, and a general policy control plane will be reconsidered only after the MVP loop is validated.

The repository-level `tasks` directory contains legacy task-manager data and is not the source of truth for this reimagination.

## Decision rule

New work must contribute directly to the MVP loop or to evidence that the MVP loop is safe and useful. If a proposed feature does not help an agent act, a verifier provide feedback, the runtime decide, or a human supervise that loop, defer it.
