import * as fs from 'fs/promises';
import * as path from 'path';
import { RunnerEvent, RunnerRunRecord, RunnerRunStatus, RunnerStepResult } from './types';

interface EvidenceIndex {
  runId: string;
  steps: Record<string, RunnerStepResult[]>;
}

const EVENTS_FILE = 'events.ndjson';
const EVIDENCE_INDEX_FILE = 'evidence-index.json';

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
    if (last.message) {
      record.stopReason = last.message;
    }
  }

  return record;
}

function isTerminalStatus(status: RunnerRunStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'exhausted';
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
