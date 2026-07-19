import { describe, expect, it } from 'vitest';
import {
  buildTimelineLabel,
  buildTimelineTooltip,
  RunTimelinePresentationModel,
} from '@huckleberry/extension/providers/runTimelinePresentation';

function createBaseTimelineModel(): RunTimelinePresentationModel {
  return {
    stepId: 'repair',
    eventType: 'step-succeeded:agent',
    timestamp: 100,
    status: 'running',
    attempt: 1,
    message: 'Agent repair completed.',
  };
}

describe('runTimelinePresentation', () => {
  it('labels agent claim entries distinctly from evidence entries', () => {
    const claimLabel = buildTimelineLabel({
      ...createBaseTimelineModel(),
      agentClaim: {
        stepId: 'repair',
        attempt: 1,
        source: 'agent',
        summary: 'I fixed the failing test.',
        adapterId: 'copilot',
      },
    });

    const evidenceLabel = buildTimelineLabel({
      ...createBaseTimelineModel(),
      stepResult: {
        runId: 'run-1',
        stepId: 'tests',
        attempt: 1,
        command: 'pnpm test:affected',
        cwd: '/workspace',
        startedAt: 100,
        completedAt: 120,
        durationMs: 20,
        exitCode: 1,
        timedOut: false,
        stdoutArtifactPath: '/artifacts/stdout.txt',
        stderrArtifactPath: '/artifacts/stderr.txt',
        metadataArtifactPath: '/artifacts/metadata.json',
      },
    });

    expect(claimLabel.startsWith('[Claim]')).toBe(true);
    expect(evidenceLabel.startsWith('[Evidence]')).toBe(true);
  });

  it('renders separate claim and evidence sections in timeline tooltip', () => {
    const tooltip = buildTimelineTooltip({
      ...createBaseTimelineModel(),
      agentClaim: {
        stepId: 'repair',
        attempt: 1,
        source: 'agent',
        summary: 'The lint errors should be resolved now.',
        adapterId: 'copilot',
      },
      stepResult: {
        runId: 'run-1',
        stepId: 'lint',
        attempt: 2,
        command: 'pnpm lint:affected',
        cwd: '/workspace',
        startedAt: 200,
        completedAt: 220,
        durationMs: 20,
        exitCode: 0,
        timedOut: false,
        stdoutArtifactPath: '/artifacts/lint-stdout.txt',
        stderrArtifactPath: '/artifacts/lint-stderr.txt',
        metadataArtifactPath: '/artifacts/lint-metadata.json',
      },
    });

    expect(tooltip).toContain('Claim (agent):');
    expect(tooltip).toContain('Statement: The lint errors should be resolved now.');
    expect(tooltip).toContain('Evidence (deterministic):');
    expect(tooltip).toContain('Stdout: /artifacts/lint-stdout.txt');
  });
});
