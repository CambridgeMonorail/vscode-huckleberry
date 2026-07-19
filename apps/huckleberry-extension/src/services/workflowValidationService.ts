import * as path from 'path';
import * as vscode from 'vscode';
import { parse as parseYaml } from 'yaml';
import { validateWorkflowDefinition } from '../workflows';
import { WorkflowValidationError } from '../workflows/types';

export interface LoopValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
}

/**
 * Validation service for loop definition files.
 */
export class WorkflowValidationService {
  async validateFile(uri: vscode.Uri): Promise<LoopValidationResult> {
    const contentBuffer = await vscode.workspace.fs.readFile(uri);
    const content = Buffer.from(contentBuffer).toString('utf8');

    let parsed: unknown;
    try {
      parsed = this.parseLoopContent(content, uri.fsPath);
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            code: 'WORKFLOW_PARSE_ERROR',
            path: '$',
            message: error instanceof Error ? error.message : 'Failed to parse workflow definition.',
          },
        ],
      };
    }

    return validateWorkflowDefinition(parsed);
  }

  private parseLoopContent(content: string, filePath: string): unknown {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.yaml' || extension === '.yml') {
      return parseYaml(content);
    }

    return JSON.parse(content);
  }
}
