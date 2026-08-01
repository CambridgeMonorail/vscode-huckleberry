# Current Capability Gap

**Status: Current as of 2026-08-01**

This assessment describes observable implementation capability, not completed issue labels.

## Summary

The repository contains a substantial deterministic workflow substrate. It does not yet contain a working coding-agent feedback loop.

| Capability | State | Evidence and gap |
| --- | --- | --- |
| Loop-file discovery | Implemented | `.huckleberry/loops` files are discovered and watched. |
| Schema validation | Partial | The implemented v1 type is smaller than the documented schema; unsupported concepts remain in docs. |
| Command execution | Implemented | Commands run in the child runner with timeout, cancellation, and output capture. |
| Event persistence | Implemented | Append-only run events and reconstruction helpers exist. |
| Evidence browsing | Implemented foundation | stdout, stderr, metadata, summaries, and run diffs are inspectable; typed verifier evidence is not yet modeled. |
| Approval gates | Implemented foundation | Runs can pause for approve, reject, or defer decisions. |
| Worktree isolation | Implemented foundation | Worktree lifecycle and final diff capture exist. Per-actor delta enforcement is missing. |
| Agent abstraction | Interface only | An adapter interface and Copilot text adapter exist. The shipped child runner has no registered adapter. |
| Coding-agent execution | Missing | The current Copilot adapter produces text and reports no changed files; it cannot perform repository edits. |
| Feedback transport | Missing | Failed verifier evidence is not converted into structured context for the next actor attempt. |
| Independent actor scope enforcement | Missing | Limits are checked against adapter-reported files instead of a measured before/after delta. |
| Evidence-derived conditions | Missing | Runtime conditions are literals or externally supplied booleans, not expressions over step evidence. |
| Generic loop semantics | Missing | Repair routing is a special relationship between a failed command and an agent retry target. |
| Iteration persistence | Missing | Events record attempts, but there is no complete persisted iteration aggregate and feedback state. |
| Crash-safe active resume | Partial | Historical runs can be reconstructed; safe continuation of an in-flight actor/iteration is not defined. |
| Skills runtime | Missing and deferred | No skill discovery, binding, or invocation contract exists. |
| Goal planner/control plane | Missing and deferred | This is not required for the MVP. |

## Misleading historical claims

The RIM tracker records several items as done because their interfaces, event shapes, or isolated tests landed. In product terms, the following are not complete:

- `RIM-402 Implement Copilot adapter`: an availability/text adapter exists, but it is not a working coding actor in the runner.
- `RIM-404 Implement repair loop semantics`: deterministic routing exists, but the actor cannot repair and receives no verifier feedback.
- `RIM-405 Capture agent claims separately from evidence`: event shapes exist, but a real agent loop has not validated the distinction end to end.
- `RIM-701 Comprehensive test suite expansion`: substrate tests exist, but no real repair-loop acceptance test exists.
- `RIM-706 Release checklist and go/no-go gate`: the product-level MVP gate has not been met.

The RIM files remain historical records, not an active completion ledger.

## Existing code that should be retained

- runner process and IPC foundation;
- state and terminal vocabulary where compatible;
- workflow discovery and parsing;
- command executor;
- append-only event store;
- evidence and Runs explorers;
- approval interaction;
- worktree lifecycle service;
- provider-neutral adapter intent;
- validation, packaging, and extension test infrastructure.

## Existing code that needs correction or replacement

- register a real actor through a viable cross-process protocol;
- replace adapter-reported change enforcement with Git-based measurement;
- replace static repair prompts with feedback bundles;
- replace special-case repair routing with explicit iteration semantics;
- reconcile the implemented schema with the single canonical schema;
- remove or quarantine active task-manager chat paths;
- distinguish deterministic v1 workflows from v2 development loops in the UI and docs.

## Evidence required to change a capability to implemented

A capability is implemented only when it works through the packaged extension on a representative workspace, has automated coverage at its stable boundary, and has a recorded manual or end-to-end validation result. Types, stubs, mocks, and isolated unit tests are foundations, not product completion.
