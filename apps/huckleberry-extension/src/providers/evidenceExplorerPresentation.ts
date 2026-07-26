export type EvidenceArtifactCategory =
  | 'output'
  | 'diff'
  | 'screenshot'
  | 'diagnostic'
  | 'test-result'
  | 'other';

export interface EvidenceArtifactDescriptor {
  runId: string;
  loopId?: string;
  stepId: string;
  attempt?: number;
  label: string;
  artifactPath: string;
  category: EvidenceArtifactCategory;
  missing: boolean;
}

export interface EvidenceCategoryModel {
  category: EvidenceArtifactCategory;
  artifacts: EvidenceArtifactDescriptor[];
}

export interface EvidenceStepModel {
  stepId: string;
  categories: EvidenceCategoryModel[];
}

export interface EvidenceRunModel {
  runId: string;
  loopId?: string;
  steps: EvidenceStepModel[];
}

export function inferEvidenceCategoryFromPath(artifactPath: string): EvidenceArtifactCategory {
  const normalized = artifactPath.toLowerCase();

  if (normalized.includes('stdout') || normalized.includes('stderr') || normalized.includes('output')) {
    return 'output';
  }

  if (normalized.includes('diff') || normalized.endsWith('.diff') || normalized.endsWith('.patch')) {
    return 'diff';
  }

  if (
    normalized.includes('screenshot')
    || normalized.endsWith('.png')
    || normalized.endsWith('.jpg')
    || normalized.endsWith('.jpeg')
    || normalized.endsWith('.webp')
    || normalized.endsWith('.gif')
  ) {
    return 'screenshot';
  }

  if (
    normalized.includes('test')
    || normalized.includes('junit')
    || normalized.includes('coverage')
    || normalized.endsWith('.trx')
    || normalized.endsWith('.xml')
  ) {
    return 'test-result';
  }

  if (normalized.includes('diagnostic') || normalized.endsWith('.metadata.json') || normalized.endsWith('.sarif')) {
    return 'diagnostic';
  }

  return 'other';
}

export function buildEvidenceExplorerModel(descriptors: EvidenceArtifactDescriptor[]): EvidenceRunModel[] {
  const runMap = new Map<string, EvidenceRunModel>();

  for (const descriptor of descriptors) {
    let run = runMap.get(descriptor.runId);
    if (!run) {
      run = {
        runId: descriptor.runId,
        loopId: descriptor.loopId,
        steps: [],
      };
      runMap.set(descriptor.runId, run);
    }

    const step = ensureStep(run, descriptor.stepId);
    const category = ensureCategory(step, descriptor.category);
    category.artifacts.push(descriptor);
  }

  return [...runMap.values()]
    .map(run => ({
      ...run,
      steps: run.steps
        .sort((left, right) => left.stepId.localeCompare(right.stepId))
        .map(step => ({
          ...step,
          categories: step.categories
            .sort((left, right) => left.category.localeCompare(right.category))
            .map(category => ({
              ...category,
              artifacts: [...category.artifacts].sort((left, right) => {
                const attemptDelta = (left.attempt ?? 0) - (right.attempt ?? 0);
                if (attemptDelta !== 0) {
                  return attemptDelta;
                }

                return left.label.localeCompare(right.label);
              }),
            })),
        })),
    }))
    .sort((left, right) => right.runId.localeCompare(left.runId));
}

function ensureStep(run: EvidenceRunModel, stepId: string): EvidenceStepModel {
  const existing = run.steps.find(step => step.stepId === stepId);
  if (existing) {
    return existing;
  }

  const created: EvidenceStepModel = {
    stepId,
    categories: [],
  };
  run.steps.push(created);
  return created;
}

function ensureCategory(step: EvidenceStepModel, category: EvidenceArtifactCategory): EvidenceCategoryModel {
  const existing = step.categories.find(entry => entry.category === category);
  if (existing) {
    return existing;
  }

  const created: EvidenceCategoryModel = {
    category,
    artifacts: [],
  };
  step.categories.push(created);
  return created;
}
