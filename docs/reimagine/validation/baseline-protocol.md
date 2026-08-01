# Manual Baseline Protocol

**Status: Ready for LOOP-000 runs**

This protocol measures the best reasonable normal coding-agent workflow. It does not use the Huckleberry runtime, the Extension Development Host, or the workspace debug prompt.

## Roles

- The setup operator prepares a disposable seeded checkout and confirms the expected initial evidence before measurement.
- The developer uses their normal coding agent and decides when to run checks, provide feedback, inspect the diff, continue, or stop.
- The recorder tracks time and interactions without coaching the developer toward the known repair.

One person may fill all roles, but must record that limitation. A person who authored or inspected the seed patches has prior knowledge and should not be treated as a blind participant.

## Before each run

1. Choose the next scenario before opening its patch or expected repair notes.
2. Follow the seed procedure in [`corpus.md`](./corpus.md) in a fresh disposable checkout.
3. Copy [`run-template.md`](./run-template.md) to `runs/<run-id>.md`; use an ID such as `BASE-TS01-20260801-A`.
4. Predeclare the repository revision, scenario, coding agent/provider/model, objective, verifier, allowed paths, maximum attempts, and run order.
5. Start a wall-clock timer and a separate active-intervention stopwatch only when the objective is submitted to the coding agent.

## Normal workflow

Give the coding agent only the scenario objective, allowed paths, and attempt limit from `corpus.md`. The developer may otherwise use the agent normally: inspect files, run the declared verifier, pass failures back, review changes, ask for another attempt, or stop.

Do not:

- reveal the acceptable change, expected diagnostics, known trap, or TS-06 regression check unless the developer discovers it through their normal workflow;
- require intentionally inefficient copying when the agent can read terminal output directly;
- use Huckleberry commands, its runner, or its debug-host prompt;
- repair setup or dependency failures during the timed task; mark the run excluded with its reason instead.

Stop when the developer accepts the result, declares the task unrepairable, reaches the attempt limit, or abandons the run.

## Measurement rules

- **Verified completion**: after the developer stops, the recorder runs the declared verifier fresh and reviews the diff against the objective and allowed paths. Both must be acceptable.
- **Active human intervention time**: stopwatch time spent composing or sending messages, invoking or choosing checks, reading diagnostics to decide what to do, reviewing the diff, or deciding to continue/stop. Exclude agent and command wait time. If exact pausing is impractical, record timestamped active intervals and total them afterward.
- **Manual feedback interaction**: one developer message or action whose purpose is to carry a verifier failure or review finding into another actor attempt. The initial objective does not count.
- **Attempt**: one coding-agent turn authorized to modify files. Read-only explanation turns do not count unless they replace an attempted repair.
- **Verifier execution**: every invocation of the declared verifier, including the recorder's final fresh run. Track stronger checks separately.
- **Diff quality**: acceptable only when the objective is met, allowed paths are respected, and there are no suppressions, dependency changes, generated artifacts, or unrelated edits.
- **Unrepairable success**: TS-05 is successful only when the developer stops without edits and explains the required scope expansion; it is not a verified completion and must remain distinguishable in the result.

For TS-06, run the known regression check only after the developer has stopped and record whether the developer independently ran it. A passing typecheck with a failing known test is stale confidence, not verified completion.

## Post-run review

1. Stop both timers and record terminal outcome.
2. Run `git status --short`, `git diff --check`, and `git diff --stat`.
3. Run the declared verifier fresh; for TS-06 also run its known regression check.
4. Record files and lines changed from measured Git output, not from the agent's report.
5. Ask the developer where attention was spent, what feedback was missing, and whether they would choose the same workflow for a similar task.
6. Keep failures, exclusions, inconvenient outcomes, and provider limitations in [`baseline-results.md`](./baseline-results.md).

## Gate A decision

After all six valid baseline runs:

1. Separate repairable scenarios from TS-05 and report TS-06 both as a repair outcome and a verifier-selection outcome.
2. Calculate the median active intervention time and the share of repairable scenarios requiring at least two manual feedback interactions.
3. Summarize whether transferring feedback or deciding when to stop recurred as qualitative friction.
4. Apply Gate A exactly as written in [`VALIDATION.md`](../VALIDATION.md); do not change thresholds after seeing results without recording the change first.
5. Add a dated Continue, Pivot, or Stop entry to [`decision-log.md`](./decision-log.md), including limitations and links to the six run records.
