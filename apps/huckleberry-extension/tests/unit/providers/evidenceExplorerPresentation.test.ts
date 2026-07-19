import { describe, expect, it } from 'vitest';
import {
  buildEvidenceExplorerModel,
  inferEvidenceCategoryFromPath,
  type EvidenceArtifactDescriptor,
} from '../../../src/providers/evidenceExplorerPresentation';

describe('evidenceExplorerPresentation', () => {
  it('infers artifact categories from file names and extensions', () => {
    expect(inferEvidenceCategoryFromPath('/tmp/lint.attempt-1.stdout.txt')).toBe('output');
    expect(inferEvidenceCategoryFromPath('/tmp/attempt-2.diff')).toBe('diff');
    expect(inferEvidenceCategoryFromPath('/tmp/screenshot-home.png')).toBe('screenshot');
    expect(inferEvidenceCategoryFromPath('/tmp/tsc.diagnostic.sarif')).toBe('diagnostic');
    expect(inferEvidenceCategoryFromPath('/tmp/junit-results.xml')).toBe('test-result');
    expect(inferEvidenceCategoryFromPath('/tmp/notes.md')).toBe('other');
  });

  it('groups descriptors by run, step, and category', () => {
    const descriptors: EvidenceArtifactDescriptor[] = [
      {
        runId: 'run-2',
        loopId: 'lint-loop',
        stepId: 'lint',
        attempt: 1,
        label: 'stdout',
        artifactPath: '/tmp/lint.stdout.txt',
        category: 'output',
        missing: false,
      },
      {
        runId: 'run-2',
        loopId: 'lint-loop',
        stepId: 'lint',
        attempt: 1,
        label: 'metadata',
        artifactPath: '/tmp/lint.metadata.json',
        category: 'diagnostic',
        missing: false,
      },
      {
        runId: 'run-2',
        loopId: 'lint-loop',
        stepId: 'tests',
        attempt: 2,
        label: 'junit.xml',
        artifactPath: '/tmp/tests.junit.xml',
        category: 'test-result',
        missing: true,
      },
      {
        runId: 'run-1',
        loopId: 'typecheck-loop',
        stepId: 'typecheck',
        attempt: 1,
        label: 'stderr',
        artifactPath: '/tmp/typecheck.stderr.txt',
        category: 'output',
        missing: false,
      },
    ];

    const model = buildEvidenceExplorerModel(descriptors);

    expect(model).toHaveLength(2);
    expect(model[0].runId).toBe('run-2');

    const run2Lint = model[0].steps.find(step => step.stepId === 'lint');
    expect(run2Lint).toBeDefined();
    expect(run2Lint?.categories).toHaveLength(2);

    const run2Tests = model[0].steps.find(step => step.stepId === 'tests');
    expect(run2Tests?.categories[0].artifacts[0].missing).toBe(true);

    const run1 = model.find(run => run.runId === 'run-1');
    expect(run1?.steps).toHaveLength(1);
  });
});
