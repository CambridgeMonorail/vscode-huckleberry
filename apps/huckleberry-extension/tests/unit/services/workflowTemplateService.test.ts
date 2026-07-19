import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import * as vscode from 'vscode';
import { parse as parseYaml } from 'yaml';
import { validateWorkflowDefinition } from '@huckleberry/extension/workflows';
import { WorkflowTemplateService, STARTER_TEMPLATES } from '@huckleberry/extension/services/workflowTemplateService';

describe('workflowTemplateService', () => {
  const service = new WorkflowTemplateService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates starter templates when files are missing', async () => {
    (vscode.workspace.fs.stat as Mock).mockRejectedValue(new Error('missing'));

    const result = await service.createStarterTemplates();

    expect(result.created).toHaveLength(3);
    expect(result.skipped).toHaveLength(0);
    expect(vscode.workspace.fs.createDirectory).toHaveBeenCalledTimes(1);
    expect(vscode.workspace.fs.writeFile).toHaveBeenCalledTimes(3);
  });

  it('skips templates that already exist', async () => {
    (vscode.workspace.fs.stat as Mock).mockResolvedValue({ type: 1 });

    const result = await service.createStarterTemplates();

    expect(result.created).toHaveLength(0);
    expect(result.skipped).toHaveLength(3);
    expect(vscode.workspace.fs.writeFile).not.toHaveBeenCalled();
  });

  it('starter template definitions validate out of the box', () => {
    for (const template of STARTER_TEMPLATES) {
      const parsed = parseYaml(template.content);
      const validation = validateWorkflowDefinition(parsed);
      expect(validation.valid).toBe(true);
    }
  });
});
