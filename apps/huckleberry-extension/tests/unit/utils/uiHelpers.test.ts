// Use relative import path to avoid module boundary issues
import * as uiHelpers from '../../../src/utils/uiHelpers';
import * as vscode from 'vscode';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

describe('uiHelpers', () => {  let mockStream: vscode.ChatResponseStream;
  beforeEach(() => {
    mockStream = {
      markdown: vi.fn().mockResolvedValue(undefined),
      progress: vi.fn().mockResolvedValue(undefined),
      anchor: vi.fn().mockResolvedValue(undefined),
      button: vi.fn().mockResolvedValue(undefined),
      filetree: vi.fn().mockResolvedValue(undefined),
      reference: vi.fn().mockResolvedValue(undefined),
      push: vi.fn().mockResolvedValue(undefined),
    } as vscode.ChatResponseStream;

    // Setup window message mocks to return promises
    vi.spyOn(vscode.window, 'showInformationMessage').mockResolvedValue(undefined);
    vi.spyOn(vscode.window, 'showErrorMessage').mockResolvedValue(undefined);
    vi.spyOn(vscode.window, 'showWarningMessage').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('streamMarkdown adds newline if needed', async () => {
    await uiHelpers.streamMarkdown(mockStream, 'Hello');
    expect(mockStream.markdown).toHaveBeenCalledWith('\nHello');
  });

  it('streamMarkdown does not add newline if already present', async () => {
    await uiHelpers.streamMarkdown(mockStream, '\nHello');
    expect(mockStream.markdown).toHaveBeenCalledWith('\nHello');
  });

  it('showProgress calls stream.progress', async () => {
    await uiHelpers.showProgress(mockStream);
    expect(mockStream.progress).toHaveBeenCalledWith('I\'ll be your huckleberry');
  });

  it('showInfo calls vscode.window.showInformationMessage', async () => {
    await uiHelpers.showInfo('info');
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('info');
  });

  it('showError calls vscode.window.showErrorMessage', async () => {
    await uiHelpers.showError('error');
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('error');
  });

  it('showWarning calls vscode.window.showWarningMessage', async () => {
    await uiHelpers.showWarning('warn');
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('warn');
  });

  it('confirm returns true when user selects Yes', async () => {
    (vi.spyOn(vscode.window, 'showInformationMessage') as unknown as { mockResolvedValue: (v: string) => void }).mockResolvedValue('Yes');
    const result = await uiHelpers.confirm('Are you sure?');
    expect(result).toBe(true);
  });

  it('confirm returns false when user selects No', async () => {
    (vi.spyOn(vscode.window, 'showInformationMessage') as unknown as { mockResolvedValue: (v: string) => void }).mockResolvedValue('No');
    const result = await uiHelpers.confirm('Are you sure?');
    expect(result).toBe(false);
  });
});
