import { RunnerHost } from './runnerHost';
import { RunnerRequest, RunnerResponse } from './types';

const host = new RunnerHost();

function sendMessage(response: RunnerResponse): void {
  if (typeof process.send === 'function') {
    process.send(response);
  }
}

process.on('message', (message: RunnerRequest) => {
  host.handleMessage(message, sendMessage, sendMessage);
});

process.on('disconnect', () => {
  host.dispose();
  process.exit(0);
});
