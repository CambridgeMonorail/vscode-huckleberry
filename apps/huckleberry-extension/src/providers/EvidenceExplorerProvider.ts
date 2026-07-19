import * as fs from 'fs/promises';
import { Dirent } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getEvidenceIndex, RunnerClient, RunnerStepResult } from '../runner';
import {
  buildEvidenceExplorerModel,
  EvidenceArtifactCategory,
  EvidenceArtifactDescriptor,
  EvidenceRunModel,
  inferEvidenceCategoryFromPath,
} from './evidenceExplorerPresentation';

const RUNS_ROOT = path.join(process.cwd(), '.huckleberry', 'runs');
const EVENTS_FILE = 'events.ndjson';
const EVIDENCE_INDEX_FILE = 'evidence-index.json';

export type EvidenceArtifactNodeModel = EvidenceArtifactDescriptor;

class EvidenceRunTreeItem extends vscode.TreeItem {
  constructor(public readonly run: EvidenceRunModel) {
    super(`${run.loopId ?? 'unknown-loop'} (${run.runId})`, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${run.steps.length} step${run.steps.length === 1 ? '' : 's'}`;
    this.tooltip = `Run ID: ${run.runId}\nLoop: ${run.loopId ?? 'unknown'}`;
    this.contextValue = 'evidence-run';
    this.iconPath = new vscode.ThemeIcon('archive');
  }
}

class EvidenceStepTreeItem extends vscode.TreeItem {
  constructor(public readonly runId: string, public readonly stepId: string, categoryCount: number) {
    super(stepId, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${categoryCount} category${categoryCount === 1 ? '' : 'ies'}`;
    this.tooltip = `Run ID: ${runId}\nStep: ${stepId}`;
    this.contextValue = 'evidence-step';
    this.iconPath = new vscode.ThemeIcon('symbol-method');
  }
}

class EvidenceCategoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly runId: string,
    public readonly stepId: string,
    public readonly category: EvidenceArtifactCategory,
    artifactCount: number,
  ) {
    super(category, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${artifactCount} artifact${artifactCount === 1 ? '' : 's'}`;
    this.tooltip = `Run ID: ${runId}\nStep: ${stepId}\nCategory: ${category}`;
    this.contextValue = 'evidence-category';
    this.iconPath = iconForCategory(category);
  }
}

class EvidenceArtifactTreeItem extends vscode.TreeItem {
  constructor(public readonly artifact: EvidenceArtifactNodeModel) {
    const statusSuffix = artifact.missing ? ' (missing)' : '';
    super(`${artifact.label}${statusSuffix}`, vscode.TreeItemCollapsibleState.None);
    this.description = artifact.attempt !== undefined ? `attempt ${artifact.attempt}` : undefined;
    this.tooltip = [
      `Run ID: ${artifact.runId}`,
      `Step: ${artifact.stepId}`,
      `Category: ${artifact.category}`,
      artifact.attempt !== undefined ? `Attempt: ${artifact.attempt}` : undefined,
      `Path: ${artifact.artifactPath}`,
      artifact.missing ? 'Status: missing or stale' : 'Status: available',
    ]
      .filter(Boolean)
      .join('\n');
    this.contextValue = artifact.missing ? 'evidence-artifact-missing' : 'evidence-artifact';
    this.iconPath = artifact.missing ? new vscode.ThemeIcon('warning') : new vscode.ThemeIcon('file');
    this.command = {
      command: 'vscode-copilot-huckleberry.evidence.openArtifact',
      title: 'Open Evidence Artifact',
      arguments: [artifact],
    };
  }
}

/**
 * TreeDataProvider for evidence grouped by run, step, and artifact category.
 */
export class EvidenceExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined | void>();
  private readonly runnerEventSubscription: vscode.Disposable;
  private runs: EvidenceRunModel[] = [];

  constructor(private readonly runnerClient: RunnerClient) {
    this.runnerEventSubscription = this.runnerClient.onRunEvent(() => {
      void this.refresh();
    });

    void this.refresh();
  }

  readonly onDidChangeTreeData = this.onDidChangeEmitter.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
    if (!element) {
      return this.runs.map(run => new EvidenceRunTreeItem(run));
    }

    if (element instanceof EvidenceRunTreeItem) {
      return element.run.steps.map(step => new EvidenceStepTreeItem(element.run.runId, step.stepId, step.categories.length));
    }

    if (element instanceof EvidenceStepTreeItem) {
      const run = this.runs.find(candidate => candidate.runId === element.runId);
      const step = run?.steps.find(candidate => candidate.stepId === element.stepId);
      return (step?.categories ?? []).map(
        category => new EvidenceCategoryTreeItem(element.runId, element.stepId, category.category, category.artifacts.length),
      );
    }

    if (element instanceof EvidenceCategoryTreeItem) {
      const run = this.runs.find(candidate => candidate.runId === element.runId);
      const step = run?.steps.find(candidate => candidate.stepId === element.stepId);
      const category = step?.categories.find(candidate => candidate.category === element.category);
      return (category?.artifacts ?? []).map(artifact => new EvidenceArtifactTreeItem(artifact));
    }

    return [];
  }

  async refresh(): Promise<void> {
    this.runs = await this.loadEvidenceRuns();
    this.onDidChangeEmitter.fire();
  }

  dispose(): void {
    this.runnerEventSubscription.dispose();
    this.onDidChangeEmitter.dispose();
  }

  private async loadEvidenceRuns(): Promise<EvidenceRunModel[]> {
    const runRecords = await this.runnerClient.listRuns();
    const descriptors: EvidenceArtifactDescriptor[] = [];

    for (const runRecord of runRecords) {
      const seenPaths = new Set<string>();
      const indexedEvidence = await getEvidenceIndex(runRecord.runId);

      for (const stepResult of indexedEvidence) {
        descriptors.push(
          ...(await toDescriptorsFromStepResult(stepResult, runRecord.loopId, seenPaths)),
        );
      }

      const inferredArtifacts = await discoverRunArtifacts(runRecord.runId, seenPaths);
      for (const inferred of inferredArtifacts) {
        descriptors.push({
          ...inferred,
          loopId: runRecord.loopId,
        });
      }
    }

    return buildEvidenceExplorerModel(descriptors);
  }
}

function iconForCategory(category: EvidenceArtifactCategory): vscode.ThemeIcon {
  switch (category) {
    case 'output':
      return new vscode.ThemeIcon('output');
    case 'diff':
      return new vscode.ThemeIcon('diff');
    case 'screenshot':
      return new vscode.ThemeIcon('device-camera');
    case 'diagnostic':
      return new vscode.ThemeIcon('warning');
    case 'test-result':
      return new vscode.ThemeIcon('beaker');
    default:
      return new vscode.ThemeIcon('file');
  }
}

async function toDescriptorsFromStepResult(
  stepResult: RunnerStepResult,
  loopId: string,
  seenPaths: Set<string>,
): Promise<EvidenceArtifactDescriptor[]> {
  const candidates = [
    { label: 'stdout', artifactPath: stepResult.stdoutArtifactPath, category: inferEvidenceCategoryFromPath(stepResult.stdoutArtifactPath) },
    { label: 'stderr', artifactPath: stepResult.stderrArtifactPath, category: inferEvidenceCategoryFromPath(stepResult.stderrArtifactPath) },
    { label: 'metadata', artifactPath: stepResult.metadataArtifactPath, category: inferEvidenceCategoryFromPath(stepResult.metadataArtifactPath) },
  ];

  const descriptors: EvidenceArtifactDescriptor[] = [];

  for (const candidate of candidates) {
    seenPaths.add(normalizePath(candidate.artifactPath));
    descriptors.push({
      runId: stepResult.runId,
      loopId,
      stepId: stepResult.stepId,
      attempt: stepResult.attempt,
      label: candidate.label,
      artifactPath: candidate.artifactPath,
      category: candidate.category,
      missing: !(await fileExists(candidate.artifactPath)),
    });
  }

  return descriptors;
}

async function discoverRunArtifacts(
  runId: string,
  seenPaths: Set<string>,
): Promise<EvidenceArtifactDescriptor[]> {
  const runDirectory = path.join(RUNS_ROOT, runId);
  const files = await listFilesRecursively(runDirectory);
  const descriptors: EvidenceArtifactDescriptor[] = [];

  for (const filePath of files) {
    const normalized = normalizePath(filePath);
    const basename = path.basename(filePath).toLowerCase();
    if (basename === EVENTS_FILE || basename === EVIDENCE_INDEX_FILE || seenPaths.has(normalized)) {
      continue;
    }

    const { stepId, attempt } = inferStepIdentity(path.basename(filePath));
    descriptors.push({
      runId,
      stepId,
      attempt,
      label: path.basename(filePath),
      artifactPath: filePath,
      category: inferEvidenceCategoryFromPath(filePath),
      missing: false,
    });
  }

  return descriptors;
}

function inferStepIdentity(filename: string): { stepId: string; attempt?: number } {
  const match = filename.match(/^(.*)\.attempt-(\d+)\./i);
  if (!match) {
    return {
      stepId: 'run',
      attempt: undefined,
    };
  }

  return {
    stepId: match[1] || 'run',
    attempt: Number(match[2]),
  };
}

async function listFilesRecursively(directory: string): Promise<string[]> {
  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursively(absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizePath(filePath: string): string {
  return path.normalize(filePath).toLowerCase();
}
