import * as path from 'path';
import { fork, ChildProcess } from 'child_process';
import * as vscode from 'vscode';
import { logWithChannel, LogLevel } from '../utils';
import { RunnerApprovalAction, RunnerEvent, RunnerRequest, RunnerResponse, RunnerRunRecord, RunnerSummaryArtifacts } from './types';

interface PendingRequest {
  resolve: (response: RunnerResponse) => void;
  reject: (error: Error) => void;
}

function buildRunnerExecArgv(execArgv: readonly string[]): string[] {
  return execArgv.filter(arg => !arg.startsWith('--inspect'));
}

/**
 * Extension-side IPC client for the lightweight workflow runner process.
 */
export class RunnerClient implements vscode.Disposable {
  private childProcess?: ChildProcess;
  private requestCounter = 0;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private readonly runEventsEmitter = new vscode.EventEmitter<RunnerEvent>();

  readonly onRunEvent = this.runEventsEmitter.event;

  async startRun(loopId: string, loopFilePath: string): Promise<string> {
    const response = await this.sendRequest({
      type: 'start',
      requestId: this.nextRequestId(),
      payload: {
        loopId,
        loopFilePath,
      },
    });

    if (response.type !== 'ack' || !response.payload.runId) {
      throw new Error('Runner did not return a run id for start request.');
    }

    return response.payload.runId;
  }

  async getStatus(runId: string): Promise<RunnerRunRecord | undefined> {
    const response = await this.sendRequest({
      type: 'status',
      requestId: this.nextRequestId(),
      payload: { runId },
    });

    if (response.type !== 'status') {
      throw new Error(`Unexpected runner response type: ${response.type}`);
    }

    return response.payload.run;
  }

  async listRuns(): Promise<RunnerRunRecord[]> {
    const response = await this.sendRequest({
      type: 'listRuns',
      requestId: this.nextRequestId(),
      payload: {},
    });

    if (response.type !== 'runs') {
      throw new Error(`Unexpected runner response type: ${response.type}`);
    }

    return response.payload.runs;
  }

  async getRunEvents(runId: string): Promise<RunnerEvent[]> {
    const response = await this.sendRequest({
      type: 'events',
      requestId: this.nextRequestId(),
      payload: { runId },
    });

    if (response.type !== 'events') {
      throw new Error(`Unexpected runner response type: ${response.type}`);
    }

    return response.payload.events;
  }

  async getRunSummary(runId: string): Promise<RunnerSummaryArtifacts | undefined> {
    const response = await this.sendRequest({
      type: 'summary',
      requestId: this.nextRequestId(),
      payload: { runId },
    });

    if (response.type !== 'summary') {
      throw new Error(`Unexpected runner response type: ${response.type}`);
    }

    return response.payload.artifacts;
  }

  async cancelRun(runId: string): Promise<void> {
    const response = await this.sendRequest({
      type: 'cancel',
      requestId: this.nextRequestId(),
      payload: { runId },
    });

    if (response.type !== 'ack') {
      throw new Error(`Unexpected runner response type: ${response.type}`);
    }
  }

  async submitApprovalAction(
    runId: string,
    action: RunnerApprovalAction,
    actorId: string,
    actorName?: string,
    note?: string,
  ): Promise<void> {
    const response = await this.sendRequest({
      type: 'approvalAction',
      requestId: this.nextRequestId(),
      payload: {
        runId,
        action,
        actorId,
        actorName,
        note,
      },
    });

    if (response.type !== 'ack') {
      throw new Error(`Unexpected runner response type: ${response.type}`);
    }
  }

  dispose(): void {
    for (const pending of this.pendingRequests.values()) {
      pending.reject(new Error('Runner client disposed before request completed.'));
    }
    this.pendingRequests.clear();

    if (this.childProcess) {
      this.childProcess.removeAllListeners();
      this.childProcess.kill();
      this.childProcess = undefined;
    }

    this.runEventsEmitter.dispose();
  }

  private async sendRequest(request: RunnerRequest): Promise<RunnerResponse> {
    this.ensureRunnerProcess();

    if (!this.childProcess) {
      throw new Error('Runner process was not started.');
    }

    return new Promise<RunnerResponse>((resolve, reject) => {
      this.pendingRequests.set(request.requestId, { resolve, reject });

      const sent = this.childProcess?.send(request);
      if (!sent) {
        this.pendingRequests.delete(request.requestId);
        reject(new Error(`Failed to send runner request '${request.type}'.`));
      }
    });
  }

  private ensureRunnerProcess(): void {
    if (this.childProcess && this.childProcess.connected) {
      return;
    }

    const runnerProcessPath = path.join(__dirname, '..', 'runner', 'runnerProcess.js');
    this.childProcess = fork(runnerProcessPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      execArgv: buildRunnerExecArgv(process.execArgv),
    });

    this.childProcess.on('message', (response: RunnerResponse) => {
      this.handleRunnerResponse(response);
    });

    this.childProcess.stdout?.on('data', chunk => {
      logWithChannel(LogLevel.DEBUG, `Runner stdout: ${String(chunk).trimEnd()}`);
    });

    this.childProcess.stderr?.on('data', chunk => {
      logWithChannel(LogLevel.ERROR, `Runner stderr: ${String(chunk).trimEnd()}`);
    });

    this.childProcess.on('error', error => {
      logWithChannel(LogLevel.ERROR, 'Runner process error', error);
      this.rejectAllPending(error);
    });

    this.childProcess.on('exit', (code, signal) => {
      const details = [`code ${code ?? 'unknown'}`];
      if (signal) {
        details.push(`signal ${signal}`);
      }

      const exitMessage = `Runner process exited unexpectedly (${details.join(', ')}).`;
      logWithChannel(LogLevel.WARN, exitMessage);
      this.rejectAllPending(new Error(exitMessage));
      this.childProcess = undefined;
    });
  }

  private handleRunnerResponse(response: RunnerResponse): void {
    if (response.type === 'event') {
      this.runEventsEmitter.fire(response.payload);
      return;
    }

    const pending = this.pendingRequests.get(response.requestId);
    if (!pending) {
      return;
    }

    this.pendingRequests.delete(response.requestId);

    if (response.type === 'error') {
      pending.reject(new Error(`${response.payload.code}: ${response.payload.message}`));
      return;
    }

    pending.resolve(response);
  }

  private rejectAllPending(error: Error): void {
    for (const pending of this.pendingRequests.values()) {
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  private nextRequestId(): string {
    this.requestCounter += 1;
    return `req-${Date.now()}-${this.requestCounter}`;
  }
}
