import * as fs from 'fs/promises';
import * as path from 'path';
import {
  RunnerEvent,
  RunnerRunRecord,
  RunnerRunStatus,
  RunnerStepResult,
  RunnerRunSummary,
  RunnerSummaryArtifacts,
  RunnerSummaryEvidenceRef,
  RunnerUnresolvedItem,
} from './types';

interface EvidenceIndex {
  runId: string;
  steps: Record<string, RunnerStepResult[]>;
}

const EVENTS_FILE = 'events.ndjson';
const EVIDENCE_INDEX_FILE = 'evidence-index.json';
const SUMMARY_JSON_FILE = 'summary.json';
const SUMMARY_MARKDOWN_FILE = 'summary.md';

function getRunsRoot(): string {
  return path.join(process.cwd(), '.huckleberry', 'runs');
}

/**
 * Appends a run lifecycle event without mutating prior history.
 */
export async function appendRunEvent(event: RunnerEvent): Promise<void> {
  const runDirectory = path.join(getRunsRoot(), event.runId);
  await fs.mkdir(runDirectory, { recursive: true });

  const payload = JSON.stringify(event);
  await fs.appendFile(path.join(runDirectory, EVENTS_FILE), `${payload}\n`, 'utf8');
}

/**
 * Updates a run-local evidence index for fast lookups by step id.
 */
export async function appendEvidenceIndex(runId: string, stepResult: RunnerStepResult): Promise<void> {
  const runDirectory = path.join(getRunsRoot(), runId);
  await fs.mkdir(runDirectory, { recursive: true });

  const indexPath = path.join(runDirectory, EVIDENCE_INDEX_FILE);
  const index = await readEvidenceIndex(indexPath, runId);

  const existing = index.steps[stepResult.stepId] ?? [];
  existing.push(stepResult);
  index.steps[stepResult.stepId] = existing;

  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

/**
 * Reads evidence entries for a run and optional step.
 */
export async function getEvidenceIndex(runId: string, stepId?: string): Promise<RunnerStepResult[]> {
  const indexPath = path.join(getRunsRoot(), runId, EVIDENCE_INDEX_FILE);
  const index = await readEvidenceIndex(indexPath, runId);

  if (stepId) {
    return index.steps[stepId] ?? [];
  }

  return Object.values(index.steps).flat();
}

/**
 * Reconstructs run read models from append-only event files.
 */
export async function reconstructRunsFromEvents(): Promise<RunnerRunRecord[]> {
  let runDirectories: string[] = [];

  try {
    runDirectories = await fs.readdir(getRunsRoot());
  } catch {
    return [];
  }

  const records: RunnerRunRecord[] = [];

  for (const runId of runDirectories) {
    const eventsPath = path.join(getRunsRoot(), runId, EVENTS_FILE);
    let content: string;
    try {
      content = await fs.readFile(eventsPath, 'utf8');
    } catch {
      continue;
    }

    const events = parseEvents(content);
    const record = toRunRecord(runId, events);
    if (record) {
      records.push(record);
    }
  }

  return records.sort((left, right) => right.startedAt - left.startedAt);
}

/**
 * Reads and returns lifecycle events for a specific run.
 */
export async function getRunEvents(runId: string): Promise<RunnerEvent[]> {
  const eventsPath = path.join(getRunsRoot(), runId, EVENTS_FILE);

  try {
    const content = await fs.readFile(eventsPath, 'utf8');
    return parseEvents(content).sort((left, right) => left.timestamp - right.timestamp);
  } catch {
    return [];
  }
}

/**
 * Builds deterministic run summary files and returns their artifact references.
 */
export async function writeRunSummaryArtifacts(runId: string): Promise<RunnerSummaryArtifacts | undefined> {
  const events = await getRunEvents(runId);
  const summary = buildRunSummaryFromEvents(events);
  if (!summary) {
    return undefined;
  }

  const runDirectory = path.join(getRunsRoot(), runId);
  await fs.mkdir(runDirectory, { recursive: true });

  const jsonPath = path.join(runDirectory, SUMMARY_JSON_FILE);
  const markdownPath = path.join(runDirectory, SUMMARY_MARKDOWN_FILE);

  await fs.writeFile(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
  await fs.writeFile(markdownPath, renderRunSummaryMarkdown(summary), 'utf8');

  return {
    summary,
    jsonPath,
    markdownPath,
  };
}

/**
 * Returns cached summary artifacts if present, otherwise generates them from events.
 */
export async function getRunSummaryArtifacts(runId: string): Promise<RunnerSummaryArtifacts | undefined> {
  const runDirectory = path.join(getRunsRoot(), runId);
  const jsonPath = path.join(runDirectory, SUMMARY_JSON_FILE);
  const markdownPath = path.join(runDirectory, SUMMARY_MARKDOWN_FILE);

  try {
    const jsonText = await fs.readFile(jsonPath, 'utf8');
    const summary = JSON.parse(jsonText) as RunnerRunSummary;
    await fs.stat(markdownPath);

    return {
      summary,
      jsonPath,
      markdownPath,
    };
  } catch {
    return writeRunSummaryArtifacts(runId);
  }
}

/**
 * Derives a stable summary object from a run event stream.
 */
export function buildRunSummaryFromEvents(events: RunnerEvent[]): RunnerRunSummary | undefined {
  if (events.length === 0) {
    return undefined;
  }

  const sorted = [...events].sort((left, right) => left.timestamp - right.timestamp);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const attemptsMap = new Map<string, number>();
  const evidence: RunnerSummaryEvidenceRef[] = [];
  const unresolvedItems: RunnerUnresolvedItem[] = [];

  for (const event of sorted) {
    const stepId = event.transition?.stepId;
    const attempt = event.transition?.attempt;

    if (stepId) {
      const current = attemptsMap.get(stepId) ?? 0;
      attemptsMap.set(stepId, Math.max(current, attempt ?? 1));
    }

    if (event.stepResult) {
      evidence.push({
        stepId: event.stepResult.stepId,
        attempt: event.stepResult.attempt,
        kind: 'stdout',
        path: event.stepResult.stdoutArtifactPath,
      });
      evidence.push({
        stepId: event.stepResult.stepId,
        attempt: event.stepResult.attempt,
        kind: 'stderr',
        path: event.stepResult.stderrArtifactPath,
      });
      evidence.push({
        stepId: event.stepResult.stepId,
        attempt: event.stepResult.attempt,
        kind: 'metadata',
        path: event.stepResult.metadataArtifactPath,
      });
    }

    const isFailureLike = event.eventType.includes('failed') || event.eventType.includes('timeout');
    if (isFailureLike || event.status === 'cancelled' || event.status === 'exhausted') {
      unresolvedItems.push({
        code: event.stopReason?.code ?? event.eventType.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        message: event.stopReason?.message ?? event.message ?? 'Run ended with unresolved diagnostics.',
        stepId,
        eventType: event.eventType,
        timestamp: event.timestamp,
      });
    }
  }

  const attempts = [...attemptsMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([stepId, attemptCount]) => ({
      stepId,
      attempts: attemptCount,
    }));

  const attemptTotal = attempts.reduce((sum, item) => sum + item.attempts, 0);
  const dedupedEvidence = dedupeEvidenceReferences(evidence).sort((left, right) => {
    if (left.stepId !== right.stepId) {
      return left.stepId.localeCompare(right.stepId);
    }

    if (left.attempt !== right.attempt) {
      return left.attempt - right.attempt;
    }

    return left.kind.localeCompare(right.kind);
  });

  const dedupedUnresolved = dedupeUnresolvedItems(unresolvedItems).sort((left, right) => left.timestamp - right.timestamp);

  return {
    runId: first.runId,
    loopId: first.loopId,
    status: last.status,
    startedAt: first.timestamp,
    updatedAt: last.timestamp,
    completedAt: isTerminalStatus(last.status) ? last.timestamp : undefined,
    eventCount: sorted.length,
    terminalEventType: last.eventType,
    stopReasonCode: last.stopReason?.code,
    stopReason: last.stopReason?.message ?? last.message,
    attempts,
    attemptTotal,
    keyEvidence: dedupedEvidence,
    unresolvedItems: dedupedUnresolved,
  };
}

/**
 * Renders human-readable markdown report from summary data.
 */
export function renderRunSummaryMarkdown(summary: RunnerRunSummary): string {
  const lines: string[] = [
    `# Run Summary: ${summary.runId}`,
    '',
    `- Loop: ${summary.loopId}`,
    `- Status: ${summary.status}`,
    `- Terminal event: ${summary.terminalEventType}`,
    `- Started: ${new Date(summary.startedAt).toISOString()}`,
    `- Updated: ${new Date(summary.updatedAt).toISOString()}`,
    `- Completed: ${summary.completedAt ? new Date(summary.completedAt).toISOString() : 'n/a'}`,
    `- Events: ${summary.eventCount}`,
    `- Total attempts: ${summary.attemptTotal}`,
  ];

  if (summary.stopReasonCode || summary.stopReason) {
    lines.push(`- Stop reason: ${summary.stopReasonCode ?? 'UNKNOWN'}${summary.stopReason ? ` (${summary.stopReason})` : ''}`);
  }

  lines.push('', '## Attempts by Step', '');
  if (summary.attempts.length === 0) {
    lines.push('- None');
  } else {
    for (const attempt of summary.attempts) {
      lines.push(`- ${attempt.stepId}: ${attempt.attempts}`);
    }
  }

  lines.push('', '## Key Evidence', '');
  if (summary.keyEvidence.length === 0) {
    lines.push('- None');
  } else {
    for (const evidenceRef of summary.keyEvidence) {
      lines.push(`- ${evidenceRef.stepId} (attempt ${evidenceRef.attempt}) [${evidenceRef.kind}]: ${evidenceRef.path}`);
    }
  }

  lines.push('', '## Unresolved Items', '');
  if (summary.unresolvedItems.length === 0) {
    lines.push('- None');
  } else {
    for (const unresolvedItem of summary.unresolvedItems) {
      const prefix = unresolvedItem.stepId ? `${unresolvedItem.stepId}: ` : '';
      lines.push(`- ${prefix}${unresolvedItem.code} - ${unresolvedItem.message}`);
    }
  }

  return lines.join('\n');
}

function parseEvents(content: string): RunnerEvent[] {
  const events: RunnerEvent[] = [];
  const lines = content.split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as RunnerEvent;
      if (parsed.runId && parsed.loopId && parsed.status && typeof parsed.timestamp === 'number') {
        events.push(parsed);
      }
    } catch {
      // Corrupted lines are skipped so valid history remains usable.
      continue;
    }
  }

  return events;
}

function toRunRecord(runId: string, events: RunnerEvent[]): RunnerRunRecord | undefined {
  if (events.length === 0) {
    return undefined;
  }

  const sorted = [...events].sort((left, right) => left.timestamp - right.timestamp);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const record: RunnerRunRecord = {
    runId,
    loopId: first.loopId,
    loopFilePath: first.loopFilePath ?? '',
    status: last.status,
    startedAt: first.timestamp,
    updatedAt: last.timestamp,
  };

  if (isTerminalStatus(last.status)) {
    record.completedAt = last.timestamp;
    record.stopReasonCode = last.stopReason?.code;
    record.stopReason = last.stopReason?.message ?? last.message;
  }

  return record;
}

function isTerminalStatus(status: RunnerRunStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'exhausted';
}

function dedupeEvidenceReferences(entries: RunnerSummaryEvidenceRef[]): RunnerSummaryEvidenceRef[] {
  const seen = new Set<string>();
  const deduped: RunnerSummaryEvidenceRef[] = [];

  for (const entry of entries) {
    const key = `${entry.stepId}:${entry.attempt}:${entry.kind}:${entry.path}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function dedupeUnresolvedItems(items: RunnerUnresolvedItem[]): RunnerUnresolvedItem[] {
  const seen = new Set<string>();
  const deduped: RunnerUnresolvedItem[] = [];

  for (const item of items) {
    const key = `${item.code}:${item.stepId ?? ''}:${item.eventType ?? ''}:${item.message}:${item.timestamp}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

async function readEvidenceIndex(indexPath: string, runId: string): Promise<EvidenceIndex> {
  try {
    const content = await fs.readFile(indexPath, 'utf8');
    const parsed = JSON.parse(content) as EvidenceIndex;
    if (parsed && parsed.steps) {
      return parsed;
    }
  } catch {
    // Fall through to fresh index.
  }

  return {
    runId,
    steps: {},
  };
}
