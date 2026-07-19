import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import * as vscode from 'vscode';
import { WorkflowValidationService } from '@huckleberry/extension/services/workflowValidationService';

describe('workflowValidationService', () => {
  const service = new WorkflowValidationService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates a valid workflow json file', async () => {
    const workflow = {
      schemaVersion: 1,
      id: 'validate-affected',
      name: 'Validate Affected',
      steps: [
        { id: 'lint', type: 'command', command: 'pnpm lint:affected' },
      ],
    };

    (vscode.workspace.fs.readFile as Mock).mockResolvedValue(Buffer.from(JSON.stringify(workflow), 'utf8'));

    const result = await service.validateFile(vscode.Uri.file('/test/workspace/.huckleberry/loops/validate.json'));

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns parse error for malformed json', async () => {
    (vscode.workspace.fs.readFile as Mock).mockResolvedValue(Buffer.from('{"schemaVersion":1', 'utf8'));

    const result = await service.validateFile(vscode.Uri.file('/test/workspace/.huckleberry/loops/bad.json'));

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('WORKFLOW_PARSE_ERROR');
  });

  it('parses yaml files and reports semantic validation errors', async () => {
    const yaml = [
      'schemaVersion: 1',
      'id: conditional-loop',
      'name: Conditional Loop',
      'steps:',
      '  - id: start',
      '    type: command',
      '    command: echo start',
      '  - id: branch',
      '    type: condition',
      '    expression: success()',
      '    true: success-step',
      '    false: failure-step',
    ].join('\n');

    (vscode.workspace.fs.readFile as Mock).mockResolvedValue(Buffer.from(yaml, 'utf8'));

    const result = await service.validateFile(vscode.Uri.file('/test/workspace/.huckleberry/loops/conditional.yaml'));

    expect(result.valid).toBe(false);
    expect(result.errors.filter(error => error.code === 'STEP_REF_MISSING')).toHaveLength(2);
  });
});
