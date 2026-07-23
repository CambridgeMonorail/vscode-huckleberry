---
sidebar_position: 13
---

# Roadmap

This roadmap reflects the reimagined workflow-first direction of Huckleberry.

## Current Status

Huckleberry is in alpha with active hardening of workflow execution, evidence UX, and release readiness.

## Near-Term Priorities

### 1. Workflow Reliability

- Continue strengthening deterministic runner behavior
- Expand lifecycle smoke coverage
- Improve resilience across restart/reconnect scenarios

### 2. Evidence and Review UX

- Improve evidence discoverability and navigation
- Refine summary quality and unresolved-item reporting
- Expand deep-link actions for faster failure triage

### 3. Isolation and Safety

- Harden worktree lifecycle and transparency
- Improve execution-context visibility in run surfaces
- Continue command policy guardrail improvements

### 4. Documentation and Adoption

- Keep docs consistently workflow-first
- Improve onboarding for loop authoring and run review
- Strengthen troubleshooting playbooks

## Release Gating Focus

Primary go/no-go criteria center on:

- Stable run lifecycle behavior
- Evidence completeness and traceability
- Approval-gate correctness
- Cross-platform reliability
- Documentation accuracy

## Longer-Term Direction

Potential future directions include:

- richer workflow composition patterns
- stronger multi-run analytics and observability
- expanded ecosystem integrations once core workflow model is stable

## Legacy Note

Historical task-manager roadmap items are not the active planning baseline for this branch. The active planning baseline is the reimagination plan under `docs/reimagine/`.

## Related Guides

- [Usage](./usage.md)
- [Extension Architecture](./extension-architecture.md)
- [Manual Testing](../../../docs/manual-testing.md)
