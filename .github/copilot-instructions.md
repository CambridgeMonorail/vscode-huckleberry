# Huckleberry Copilot Instructions

Read and follow [`AGENTS.md`](../AGENTS.md) before changing this repository.

Huckleberry is no longer primarily a task manager. It is being developed as a VS Code runtime for bounded, evidence-driven development loops. The current source of truth is [`docs/reimagine/README.md`](../docs/reimagine/README.md); RIM, ACP, and legacy TASK material is historical.

When implementing:

- work from the active `LOOP-*` specification;
- distinguish existing capability from target design;
- prefer a working vertical slice over speculative abstractions;
- keep agent claims separate from verifier evidence;
- do not report a capability complete because interfaces, mocks, or unit scaffolding exist;
- run the narrowest relevant tests during development and `pnpm validate:affected` before handoff.

When validating the extension, use the `Debug Extension` launch configuration and follow the instructions inside `test-workspace`. Do not invent UI observations or evidence that a human has not supplied.
