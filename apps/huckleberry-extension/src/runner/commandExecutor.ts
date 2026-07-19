import { spawn } from 'child_process';

export interface CommandExecutionRequest {
  command: string;
  cwd: string;
  timeoutMs: number;
  env?: Record<string, string>;
  shell?: boolean;
}

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  startedAt: number;
  completedAt: number;
  durationMs: number;
}

/**
 * Executes a command step in a child process with timeout tracking.
 */
export async function executeCommandStep(request: CommandExecutionRequest): Promise<CommandExecutionResult> {
  return new Promise<CommandExecutionResult>((resolve, reject) => {
    const startedAt = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(request.command, {
      cwd: request.cwd,
      env: {
        ...process.env,
        ...(request.env ?? {}),
      },
      shell: request.shell ?? true,
      windowsHide: true,
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, request.timeoutMs);

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on('close', code => {
      clearTimeout(timeout);
      const completedAt = Date.now();
      resolve({
        stdout,
        stderr,
        exitCode: code,
        timedOut,
        startedAt,
        completedAt,
        durationMs: completedAt - startedAt,
      });
    });
  });
}
