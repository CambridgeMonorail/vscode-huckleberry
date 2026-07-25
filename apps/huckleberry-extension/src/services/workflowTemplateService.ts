import * as path from 'path';
import * as vscode from 'vscode';

const TEMPLATE_ROOT = '.huckleberry/loops';

export const STARTER_TEMPLATES: Array<{ fileName: string; content: string }> = [
  {
    fileName: 'lint.yaml',
    content: [
      'schemaVersion: 1',
      'id: lint',
      'name: Lint',
      'steps:',
      '  - id: lint',
      '    type: command',
      '    command: pnpm lint:affected',
      '',
    ].join('\n'),
  },
  {
    fileName: 'typecheck.yaml',
    content: [
      'schemaVersion: 1',
      'id: typecheck',
      'name: Typecheck',
      'steps:',
      '  - id: typecheck',
      '    type: command',
      '    command: pnpm typecheck:affected',
      '',
    ].join('\n'),
  },
  {
    fileName: 'test.yaml',
    content: [
      'schemaVersion: 1',
      'id: test',
      'name: Test',
      'steps:',
      '  - id: test',
      '    type: command',
      '    command: pnpm test:affected',
      '',
    ].join('\n'),
  },
  {
    fileName: 'verify-workspace.yaml',
    content: [
      'schemaVersion: 1',
      'id: verify-workspace',
      'name: Verify Workspace',
      'steps:',
      '  - id: typecheck',
      '    type: command',
      '    command: pnpm typecheck',
      '  - id: tests',
      '    type: command',
      '    command: pnpm test',
      '',
    ].join('\n'),
  },
];

/**
 * Creates starter workflow templates in .huckleberry/loops if they are missing.
 */
export class WorkflowTemplateService {
  async createStarterTemplates(): Promise<{ created: string[]; skipped: string[] }> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder is open.');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const loopsRoot = path.join(workspaceRoot, TEMPLATE_ROOT);
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(loopsRoot));

    const created: string[] = [];
    const skipped: string[] = [];

    for (const template of STARTER_TEMPLATES) {
      const filePath = path.join(loopsRoot, template.fileName);
      const fileUri = vscode.Uri.file(filePath);

      try {
        await vscode.workspace.fs.stat(fileUri);
        skipped.push(template.fileName);
        continue;
      } catch {
        // File does not exist yet.
      }

      await vscode.workspace.fs.writeFile(fileUri, Buffer.from(template.content, 'utf8'));
      created.push(template.fileName);
    }

    return { created, skipped };
  }
}
