import { describe, expect, it, vi } from 'vitest';
import {
  AgentAdapter,
  AgentAdapterRegistry,
} from '../../../src/runner/agentAdapter';

function createAdapter(overrides?: Partial<AgentAdapter>): AgentAdapter {
  return {
    id: 'fake-adapter',
    isAvailable: vi.fn().mockResolvedValue({ available: true }),
    executeAgentStep: vi.fn().mockResolvedValue({ summary: 'done' }),
    ...overrides,
  };
}

describe('AgentAdapterRegistry', () => {
  it('returns an explicit unavailable result when no adapter is registered', async () => {
    const registry = new AgentAdapterRegistry();

    const resolution = await registry.resolveAvailableAdapter();

    expect(resolution.adapter).toBeUndefined();
    expect(resolution.availability.available).toBe(false);
    expect(resolution.availability.reason).toContain('No agent adapter');
  });

  it('resolves a registered available adapter', async () => {
    const registry = new AgentAdapterRegistry();
    const adapter = createAdapter();

    registry.registerAdapter(adapter);
    const resolution = await registry.resolveAvailableAdapter();

    expect(resolution.adapter).toBe(adapter);
    expect(resolution.availability.available).toBe(true);
  });

  it('reports a clear reason when a preferred adapter is unavailable', async () => {
    const registry = new AgentAdapterRegistry();
    const adapter = createAdapter({
      id: 'copilot',
      isAvailable: vi.fn().mockResolvedValue({
        available: false,
        reason: 'Copilot API is not available in this environment.',
      }),
    });

    registry.registerAdapter(adapter);
    const resolution = await registry.resolveAvailableAdapter('copilot');

    expect(resolution.adapter).toBeUndefined();
    expect(resolution.availability.available).toBe(false);
    expect(resolution.availability.reason).toContain('Copilot API');
  });
});