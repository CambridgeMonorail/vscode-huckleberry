# ADR-003: Integrate AI Providers via AgentAdapter Boundary

- Status: Proposed
- Date: 2026-07-18
- Decision Owners: TBD
- Related Tasks: RIM-002, RIM-401, RIM-402, RIM-403
- Supersedes: None
- Superseded By: None

## Context

Agent SDK APIs evolve and provider capabilities differ. Locking workflow semantics to one provider creates migration risk and reduces resilience.

## Decision

Define and enforce an AgentAdapter interface. Workflow engine invokes only the adapter contract. Provider-specific logic remains isolated to adapter implementations.

## Options Considered

### Option A: Direct provider SDK calls throughout engine
- Summary: Integrate Copilot SDK directly in execution paths.
- Pros: Faster initial development.
- Cons: Tight coupling, hard portability, harder testing.

### Option B: Adapter boundary (chosen)
- Summary: Use provider-neutral contract with per-provider adapters.
- Pros: Better portability, safer upgrades, easier mocking.
- Cons: Additional abstraction and translation logic.

## Consequences

### Positive
- Command-only workflows remain functional without AI provider.
- Provider outages/errors can fail gracefully.
- Future providers can be added with lower risk.

### Negative
- Need capability negotiation and clear unsupported feature behavior.

### Neutral
- Slight initial latency/complexity overhead for mapping requests/results.

## Implementation Notes

- Scope boundaries: step orchestration never imports provider SDK directly.
- Migration notes: start with Copilot adapter as first implementation.
- Testing impact: contract tests + fake adapter fixtures.
- Documentation impact: provider capability matrix required.

## Validation

- Engine executes with adapter disabled for command-only loops.
- Adapter failures yield explicit stop reasons, not inconsistent run state.

## Follow-up Tasks

- [ ] RIM-401
- [ ] RIM-402
- [ ] RIM-403
- [ ] RIM-404
