import * as vscode from 'vscode';
import {
  AgentAdapter,
  AgentAdapterAvailability,
  AgentStepExecutionRequest,
  AgentStepExecutionResult,
} from './agentAdapter';

export interface CopilotAgentAdapterOptions {
  enabled?: boolean;
}

/**
 * Copilot-backed implementation of the provider-neutral agent adapter boundary.
 */
export class CopilotAgentAdapter implements AgentAdapter {
  readonly id = 'copilot';

  constructor(private readonly options: CopilotAgentAdapterOptions = {}) {}

  async isAvailable(): Promise<AgentAdapterAvailability> {
    if (this.options.enabled === false) {
      return {
        available: false,
        reason: 'Copilot agent adapter is disabled.',
      };
    }

    if (!vscode.lm || typeof vscode.lm.selectChatModels !== 'function') {
      return {
        available: false,
        reason: 'VS Code Language Model API is not available.',
      };
    }

    try {
      const models = await vscode.lm.selectChatModels();
      if (models.length === 0) {
        return {
          available: false,
          reason: 'No compatible Copilot chat model is available.',
        };
      }

      return { available: true };
    } catch (error) {
      return {
        available: false,
        reason: this.toErrorMessage(error, 'Failed to query Copilot model availability.'),
      };
    }
  }

  async executeAgentStep(request: AgentStepExecutionRequest): Promise<AgentStepExecutionResult> {
    const availability = await this.isAvailable();
    if (!availability.available) {
      throw new Error(availability.reason ?? 'Copilot agent adapter is unavailable.');
    }

    const [model] = await vscode.lm.selectChatModels();
    if (!model) {
      throw new Error('No compatible Copilot chat model is available.');
    }

    try {
      const response = await model.sendRequest(
        [
          vscode.LanguageModelChatMessage.Assistant(this.buildSystemPrompt()),
          vscode.LanguageModelChatMessage.User(this.buildUserPrompt(request)),
        ],
        {
          justification: 'Huckleberry needs Copilot to execute a bounded workflow agent step.',
        },
        new vscode.CancellationTokenSource().token,
      );

      let summary = '';
      for await (const chunk of response.text) {
        summary += chunk;
      }

      const normalizedSummary = summary.trim();
      return {
        summary: normalizedSummary.length > 0 ? normalizedSummary : 'Copilot agent step completed with no textual summary.',
        turnsUsed: 1,
        changedFiles: [],
      };
    } catch (error) {
      throw new Error(this.toErrorMessage(error, 'Copilot agent step execution failed.'));
    }
  }

  private buildSystemPrompt(): string {
    return [
      'You are executing a bounded workflow step for Huckleberry Workflow Workbench.',
      'Stay within the requested goal and return a concise summary of the work performed.',
      'Do not invent success conditions or claim verification that was not performed.',
    ].join(' ');
  }

  private buildUserPrompt(request: AgentStepExecutionRequest): string {
    return [
      `Run ID: ${request.runId}`,
      `Loop ID: ${request.loopId}`,
      `Step ID: ${request.stepId}`,
      `Attempt: ${request.attempt}`,
      `Working directory: ${request.cwd}`,
      `Allowed paths: ${request.allowedPaths.join(', ')}`,
      `Max files changed: ${request.maxFilesChanged}`,
      `Max turns: ${request.maxTurns}`,
      '',
      'Goal:',
      request.prompt,
    ].join('\n');
  }

  private toErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof vscode.LanguageModelError) {
      return `${fallback} ${error.message}`;
    }

    if (error instanceof Error) {
      return `${fallback} ${error.message}`;
    }

    return fallback;
  }
}