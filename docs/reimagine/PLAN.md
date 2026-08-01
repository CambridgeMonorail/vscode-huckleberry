# Implementation Plan

**Status: Current**

The source of truth for task detail is the `LOOP-*` issue set in [issues](./issues/README.md).

## Strategy

Build a tracer bullet through the existing substrate before generalizing the workflow language or adding a control plane.

The critical path is:

```text
measure the manual baseline
→ choose viable coding-agent runtime
→ bridge it to the runner
→ carry verifier feedback into attempts
→ measure and enforce repository changes
→ prove safety on fixtures
→ compare usefulness on real repositories
→ generalize only what the proof requires
```

The [Usefulness Validation Plan](./VALIDATION.md) defines the hypotheses, measures, experiment protocol, and continue/change/pivot/stop gates used below.

## Milestone -1: Validate the problem

Outcome: measured baseline evidence shows whether manually supervising TypeScript repair is painful enough to justify product work.

- `LOOP-000` Establish the validation corpus and manual baseline.

Gate A must pass before production actor and schema work is treated as committed product direction. A disposable actor spike may run in parallel because it also tests architectural feasibility.

## Milestone 0: Contract and feasibility

Outcome: an architecture decision backed by a disposable integration proves that one supported agent can edit a fixture repository, be cancelled, and report useful lifecycle information from the packaged extension architecture.

- `LOOP-001` Reconcile the product vocabulary and canonical runtime contract — **Done by this documentation reset**.
- `LOOP-002` Prove and select the executable coding-agent runtime.
- `LOOP-003` Define and implement the extension/runner actor protocol.

Do not implement schema v2 before `LOOP-002` resolves the real provider and process constraints.

## Milestone 1: Working feedback loop

Outcome: a real actor receives deterministic TypeScript failures, edits an isolated worktree, and is re-evaluated.

- `LOOP-004` Introduce the persisted iteration model and feedback bundle.
- `LOOP-005` Measure and enforce per-iteration repository deltas.
- `LOOP-006` Add typed TypeScript verifier output and feedback construction.
- `LOOP-007` Implement runtime-owned attempt, verify, and continue decisions.

## Milestone 2: Product vertical slice

Outcome: the loop is understandable and usable from VS Code rather than only from runner tests.

- `LOOP-008` Add the real TypeScript repair loop template and launch inputs.
- `LOOP-009` Add iteration-centric supervision and intervention UX.
- `LOOP-010` Add crash recovery and safe resume semantics.
- `LOOP-011` Add packaged-extension acceptance fixtures and dogfood validation.

Gate B must pass on the packaged-extension fixtures. Gate C must then show a useful reduction in developer supervision on non-fixture repositories. Technical completion alone does not unlock Milestone 3.

## Milestone 3: Generalize carefully

This milestone begins only after Validation Gates B and C pass. Gate D repeat-use evidence determines whether to invest beyond the first additional verifier.

- `LOOP-012` Finalize schema v2 from learned requirements.
- `LOOP-013` Add evidence-derived predicates and additional verifier adapters.
- `LOOP-014` Add skill discovery and binding to actor invocations.
- `LOOP-015` Add composition of proven loops where a concrete use case requires it.

## Deferred horizon

The following are deliberately not active tasks:

- autonomous Goal decomposition and replanning;
- multiple specialized agents;
- cross-goal scheduling;
- organisational or marketplace skill registries;
- reflection and automatic knowledge mutation;
- a general engineering policy platform;
- Kubernetes-style control-plane positioning.

Reconsider them only after evidence shows that developers repeatedly use the core loop and need orchestration above it.

## Global definition of done

A task is done only when:

- the capability is reachable through the real extension execution path;
- automated tests cover its stable contract and important failures;
- packaged or Extension Development Host validation is recorded where UI or provider behaviour matters;
- documentation describes actual behaviour and limitations;
- no completion claim depends solely on mocks, interfaces, or agent narration.
