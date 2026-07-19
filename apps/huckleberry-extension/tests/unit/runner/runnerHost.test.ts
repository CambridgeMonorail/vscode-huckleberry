import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RunnerHost } from '@huckleberry/extension/runner';
import { RunnerRequest, RunnerResponse } from '@huckleberry/extension/runner';

describe('RunnerHost', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a run and emits queued/running/succeeded lifecycle events', () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    const request: RunnerRequest = {
      type: 'start',
      requestId: 'req-1',
      payload: {
        loopId: 'lint',
        loopFilePath: '/workspace/.huckleberry/loops/lint.yaml',
      },
    };

    host.handleMessage(request, response => replies.push(response), event => events.push(event));

    expect(replies).toHaveLength(1);
    expect(replies[0].type).toBe('ack');
    expect(events[0]).toMatchObject({
      type: 'event',
      payload: {
        status: 'queued',
      },
    });

    vi.runAllTimers();

    const statuses = events
      .filter(event => event.type === 'event')
      .map(event => (event.type === 'event' ? event.payload.status : ''));

    expect(statuses).toContain('queued');
    expect(statuses).toContain('running');
    expect(statuses).toContain('succeeded');

    host.dispose();
  });

  it('cancels a queued run', () => {
    const host = new RunnerHost();
    const replies: RunnerResponse[] = [];
    const events: RunnerResponse[] = [];

    host.handleMessage(
      {
        type: 'start',
        requestId: 'req-start',
        payload: {
          loopId: 'test',
          loopFilePath: '/workspace/.huckleberry/loops/test.yaml',
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    const startAck = replies.find(reply => reply.type === 'ack');
    if (!startAck || startAck.type !== 'ack' || !startAck.payload.runId) {
      throw new Error('Failed to start run in test setup.');
    }

    host.handleMessage(
      {
        type: 'cancel',
        requestId: 'req-cancel',
        payload: {
          runId: startAck.payload.runId,
        },
      },
      response => replies.push(response),
      event => events.push(event),
    );

    const cancelEvent = events.find(
      event => event.type === 'event' && event.payload.status === 'cancelled',
    );
    expect(cancelEvent).toBeDefined();

    host.dispose();
  });
});
