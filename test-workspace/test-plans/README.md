# Debug-Host Test Plans

The source-workspace agent places run-specific manual validation plans here before asking the human to launch `Debug Extension`.

Each plan must state:

- the `LOOP-*` task and validation gate it supports;
- required build and fixture state;
- exact checks in execution order;
- which checks Copilot can perform and which require human UI action;
- expected machine artifacts and attributed observations;
- pass, fail, blocked, and not-run criteria;
- cleanup or reset steps;
- where the final summary must be written.

Copy `test-plan-template.md` rather than modifying an earlier plan. Plans are versioned; generated evidence under `_debug-evidence` is ignored.
