# Usefulness Validation Plan

**Status: Current**

The purpose of validation is not to prove that Huckleberry can run commands or call an agent. It is to determine whether developers prefer a Huckleberry-controlled feedback loop to manually prompting an agent, copying failures back into chat, and deciding when to stop.

## Product hypotheses

### H1: The orchestration problem is real

For bounded repair work, developers currently spend meaningful attention rerunning verifiers, transferring failures, checking scope, and deciding whether another attempt is justified.

### H2: Automatic feedback reduces supervision

Huckleberry reduces active human intervention time and manual feedback interactions without materially lowering the verified completion rate.

### H3: Runtime ownership improves trust

Developers can determine what happened, why the loop continued, and why it stopped more quickly from iteration evidence than from an agent transcript.

### H4: Guardrails prevent false confidence

Huckleberry never reports success with a failing or stale verifier result and detects changes outside declared scope independently of the agent.

### H5: The loop is worth repeating

After using the loop on real work, developers choose it again for a similar task without being prompted by the project team.

## What we compare

### Baseline workflow

The developer uses the selected coding agent normally. They manually run the verifier, paste or reference failures, ask for another attempt, inspect changes, and decide when the task is complete.

### Huckleberry workflow

The same class of task is run through Huckleberry with equivalent model access, verifier, scope, and maximum attempt budget.

The comparison is against the best reasonable manual workflow, not against an intentionally poor prompt.

## Validation corpus

Maintain a versioned corpus of reproducible TypeScript repair scenarios. Start with at least six:

1. A local type mismatch with one obvious repair.
2. A cross-file contract mismatch.
3. Several diagnostics with one root cause.
4. A repair that tempts an unrelated or out-of-scope edit.
5. An unrepairable failure under the declared constraints.
6. A change where typecheck passes but a known regression demonstrates the limit of a typecheck-only loop.

Use seeded commits or resettable fixture branches so baseline and Huckleberry runs start from equivalent repository state. Add real incidents as the product is dogfooded; do not tune the product only to synthetic fixtures.

## Measures

### Primary measures

- **Verified completion rate**: runs ending with fresh passing evidence and an acceptable diff.
- **Active human intervention time**: time spent prompting, copying feedback, invoking checks, inspecting status, or deciding the next action. Agent and command wait time is excluded.
- **Manual feedback interactions**: developer messages or actions whose purpose is to carry verifier output into another attempt.

### Safety measures

- false-success count;
- undetected out-of-scope change count;
- stale-evidence completion count;
- runs exceeding declared budgets;
- cancellation or recovery failures.

### Diagnostic measures

- total elapsed time;
- number of iterations and actor turns;
- verifier executions;
- files and lines changed;
- terminal-reason distribution;
- provider failures;
- time required for a developer to explain why a completed run stopped;
- whether the developer would choose Huckleberry for the next similar task.

The extension should generate the machine-observable fields. Active intervention time and preference may be captured with a short local post-run prompt or research note. Source code, full prompts, and secrets must not be collected as product telemetry.

## Experiment protocol

For each scenario:

1. Record repository, seed revision, objective, allowed scope, verifier, agent/model, and budgets.
2. Run either the baseline or Huckleberry workflow from a clean equivalent state.
3. Record every human intervention and the final verifier and diff result.
4. Repeat with the other workflow. Alternate ordering where practical to reduce learning bias.
5. Review failures qualitatively; averages alone will hide the product lesson.

Small early samples are directional, not statistically conclusive. Keep raw run records and do not change thresholds after seeing results without recording why.

## Validation gates

### Gate A: Problem validation

Run the manual baseline on at least six scenarios across at least two repositories before committing to production actor architecture.

Continue when:

- at least half of repairable scenarios require two or more manual feedback interactions; or
- median active intervention time is at least three minutes; and
- developers identify transferring feedback or deciding when to stop as recurring friction.

If this gate fails, test a different loop such as test repair, browser verification, or pull-request readiness before building more orchestration infrastructure.

### Gate B: Technical tracer bullet

Use fixtures to prove the complete packaged-extension path.

Continue when:

- repairable fixtures end only with fresh passing evidence;
- unrepairable fixtures exhaust without false success;
- scope traps and budgets are enforced independently;
- cancellation and reload recovery produce explainable states.

Gate B proves feasibility and safety, not usefulness.

### Gate C: Dogfood usefulness

Run at least ten paired or closely matched baseline/Huckleberry trials across at least three non-fixture TypeScript repositories. Include more than one developer where available; record the cohort honestly if the project is initially solo.

The directional continue criteria are:

- Huckleberry verified completion is no worse than ten percentage points below baseline;
- median active human intervention time is at least 40% lower;
- median manual feedback interactions are at least 60% lower;
- false-success and undetected scope-violation counts are zero;
- at least 80% of completed post-run responses prefer Huckleberry for a similar repeat task;
- a developer can explain the stop reason from the Runs UI in under one minute without opening the agent transcript.

These thresholds are product decision rules for a small cohort, not claims of statistical significance.

### Gate D: Repeat use

Observe use after the structured trial. Continue toward generalization when at least three real loop runs are initiated voluntarily for new work and developers request another verifier or reusable loop rather than only requesting fixes to the demo.

Repeat use is stronger evidence than survey enthusiasm.

## Decision outcomes

### Continue

All safety criteria pass and the usefulness thresholds show a material reduction in supervision. Proceed to schema v2 and additional verifier adapters.

### Change

The loop completes work safely but does not reduce intervention, or evidence is hard to understand. Improve feedback quality, defaults, or supervision UX and repeat the affected gate before broadening scope.

### Pivot

The manual baseline reveals little pain, or repeated trials show no advantage over normal agent use. Test a different high-friction loop rather than adding planners, skills infrastructure, or more workflow features.

### Stop

False success, unenforceable scope, provider constraints, or unacceptable recovery behaviour cannot be corrected within the extension architecture. Preserve the deterministic workflow substrate and do not market it as an autonomous development loop.

## Validation artefacts

Store non-sensitive study definitions and summaries under [`docs/reimagine/validation`](./validation/):

- [`corpus.md`](./validation/corpus.md): scenario definitions and seed revisions;
- [`run-template.md`](./validation/run-template.md): common measurement record for baseline and Huckleberry runs;
- `baseline-results.md`: manual workflow observations, created by `LOOP-000`;
- `dogfood-results.md`: paired outcomes and qualitative findings, created by `LOOP-011`;
- [`decision-log.md`](./validation/decision-log.md): gate decisions and any threshold changes.

Raw run evidence remains under the workspace's `.huckleberry/runs` storage and should be referenced rather than copied when it may contain repository content.
