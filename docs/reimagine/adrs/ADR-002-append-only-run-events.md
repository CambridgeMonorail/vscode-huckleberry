# ADR-002: Persist Runs as Append-Only Event Streams

- Status: Proposed
- Date: 2026-07-18
- Decision Owners: TBD
- Related Tasks: RIM-002, RIM-304, RIM-305, RIM-504
- Supersedes: None
- Superseded By: None

## Context

huckleberry must provide inspectable evidence and reliable post-mortem analysis. Mutable state snapshots alone make debugging and reconstruction difficult.

## Decision

Persist run lifecycle changes as append-only events, with derived read models for UI timelines and summaries.

## Options Considered

### Option A: Mutable state documents only
- Summary: Keep one mutable JSON document per run.
- Pros: Simpler write path.
- Cons: Weak auditability, difficult replay, risk of partial corruption.

### Option B: Append-only events with projections (chosen)
- Summary: Record immutable events and derive current state/timelines.
- Pros: Strong audit trail, replay capability, safer recovery.
- Cons: Additional projection/indexing complexity.

## Consequences

### Positive
- Reconstructable run history.
- Better support for summaries and evidence traceability.
- Better failure diagnostics.

### Negative
- Need projection/index maintenance.
- Storage growth must be managed by retention policy.

### Neutral
- Requires event schema versioning discipline.

## Implementation Notes

- Scope boundaries: event write path owned by runner.
- Migration notes: begin with local file-backed store; keep pluggable storage interface.
- Testing impact: deterministic replay tests required.
- Documentation impact: event model and retention docs required.

## Validation

- Restart/recovery reconstructs run status and timeline accurately.
- Summary report generation uses event stream as source of truth.

## Follow-up Tasks

- [ ] RIM-304
- [ ] RIM-305
- [ ] RIM-702
