import { describe, expect, it } from 'vitest';
import { executeCommandStep } from '@huckleberry/extension/runner/commandExecutor';

function nodeEvalCommand(source: string): string {
  const escaped = source.replace(/"/g, '\\"');
  return `node -e "${escaped}"`;
}

describe('executeCommandStep', () => {
  it('captures stdout/stderr and exit code for successful commands', async () => {
    const result = await executeCommandStep({
      command: nodeEvalCommand('process.stdout.write("ok"); process.stderr.write("warn"); process.exit(0);'),
      cwd: process.cwd(),
      timeoutMs: 2_000,
    });

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.stdout).toContain('ok');
    expect(result.stderr).toContain('warn');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('returns non-zero exit code for failing commands', async () => {
    const result = await executeCommandStep({
      command: nodeEvalCommand('process.stderr.write("boom"); process.exit(2);'),
      cwd: process.cwd(),
      timeoutMs: 2_000,
    });

    expect(result.exitCode).toBe(2);
    expect(result.timedOut).toBe(false);
    expect(result.stderr).toContain('boom');
  });

  it('marks timed out commands when timeout budget is exceeded', async () => {
    const result = await executeCommandStep({
      command: nodeEvalCommand('setTimeout(() => process.exit(0), 200);'),
      cwd: process.cwd(),
      timeoutMs: 50,
    });

    expect(result.timedOut).toBe(true);
  });
});
