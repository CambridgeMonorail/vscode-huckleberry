# Security and Policy Review Baseline (RIM-704)

Date: 2026-07-20
Owner: Docto
Scope: Runner command and agent execution policy controls for workflow orchestration.

## Threat Model Assumptions

- Workflow files can contain dangerous commands and should be treated as untrusted input.
- Runner execution may occur in workspace or worktree mode and can affect local repositories.
- Agent steps are bounded by explicit constraints but command steps can still perform destructive operations.
- Local developer environments vary by OS and shell, so policy controls must be deterministic and explicit.

## Guardrails Implemented

### Command policy defaults

- High-risk command patterns are blocked by default before process spawn.
- Blocked defaults include destructive and force operations such as:
  - `rm -rf`
  - `rmdir /s`
  - `del /s`
  - `format <drive>`
  - `git reset --hard`
  - `git clean -fdx`
  - `git push --force` and `git push --force-with-lease`
  - `shutdown`, `reboot`, `mkfs`
- Policy violations fail the run with `COMMAND_POLICY_BLOCKED` and do not execute the command.

### Policy controls

- Execution option `commandPolicy.allowHighRiskCommands` allows explicit opt-in override for trusted workflows.
- Execution option `commandPolicy.blockedCommandPatterns` supports custom additional deny patterns.
- Invalid custom regex patterns are ignored with a runner warning log; defaults remain enforced.

### Existing adjacent controls

- Agent steps require explicit allowed paths, max files changed, and max turns.
- Agent path-scope violations fail runs with explicit stop reasons.
- Worktree execution context is tracked in run metadata for auditability.

## Security Findings Register

| Finding ID | Area | Severity | Decision | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| SEC-704-001 | Command-step destructive operations | High | Mitigate | Resolved | Added default high-risk command denylist in runner policy checks. |
| SEC-704-002 | Command policy override misuse | Medium | Accept with control | Accepted | Override requires explicit execution flag and is visible in run request configuration. |
| SEC-704-003 | Custom deny-pattern misconfiguration | Low | Mitigate | Resolved | Invalid patterns do not disable defaults and produce warning logs. |

## Security Review Checklist

- [x] High-risk operations identified.
- [x] Guardrails implemented with safe defaults.
- [x] Policy controls documented.
- [x] Enforcement is covered by automated tests.
- [x] Findings tracked with explicit resolution/acceptance decisions.
- [x] Review sign-off recorded by implementation owner.

Sign-off: Docto (implementation owner), 2026-07-20
