import * as vscode from 'vscode';

export interface AgentAdapterAvailability {
  available: boolean;
  reason?: string;
}

export interface AgentStepExecutionRequest {
  runId: string;
  loopId: string;
  stepId: string;
  prompt: string;
  cwd: string;
  attempt: number;
}

export interface AgentStepExecutionResult {
  summary: string;
}

/**
 * Provider-neutral boundary for AI-powered workflow steps.
 */
export interface AgentAdapter {
  readonly id: string;
  isAvailable(): Promise<AgentAdapterAvailability>;
  executeAgentStep(request: AgentStepExecutionRequest): Promise<AgentStepExecutionResult>;
  dispose?(): void;
}

export interface AgentAdapterResolution {
  adapter?: AgentAdapter;
  availability: AgentAdapterAvailability;
}

/**
 * Runtime registry for agent adapters.
 */
export class AgentAdapterRegistry implements vscode.Disposable {
  private readonly adapters = new Map<string, AgentAdapter>();

  registerAdapter(adapter: AgentAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(adapterId: string): AgentAdapter | undefined {
    return this.adapters.get(adapterId);
  }

  async resolveAvailableAdapter(preferredAdapterId?: string): Promise<AgentAdapterResolution> {
    if (preferredAdapterId) {
      const adapter = this.adapters.get(preferredAdapterId);
      if (!adapter) {
        return {
          availability: {
            available: false,
            reason: `Agent adapter '${preferredAdapterId}' is not registered.`,
          },
        };
      }

      const availability = await adapter.isAvailable();
      return availability.available
        ? { adapter, availability }
        : {
          availability: {
            available: false,
            reason: availability.reason ?? `Agent adapter '${preferredAdapterId}' is unavailable.`,
          },
        };
    }

    if (this.adapters.size === 0) {
      return {
        availability: {
          available: false,
          reason: 'No agent adapter is registered.',
        },
      };
    }

    for (const adapter of this.adapters.values()) {
      const availability = await adapter.isAvailable();
      if (availability.available) {
        return { adapter, availability };
      }
    }

    return {
      availability: {
        available: false,
        reason: 'No registered agent adapter is currently available.',
      },
    };
  }

  dispose(): void {
    for (const adapter of this.adapters.values()) {
      adapter.dispose?.();
    }
    this.adapters.clear();
  }
}