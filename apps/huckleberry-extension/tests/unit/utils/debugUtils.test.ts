/**
 * Tests for debugUtils.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { 
  LogLevel, 
  logDebug, 
  logWithChannel, 
  initDebugChannel,
  showDebugChannel,
  dumpState,
} from '../../../src/utils/debugUtils';
import * as vscode from 'vscode';

describe('debugUtils', () => {
  // Setup mocks
  const mockOutputChannel = {
    appendLine: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
  };
  
  // Spy on console.log
  const consoleLogSpy = vi.spyOn(console, 'log');
  
  beforeEach(() => {
    vi.clearAllMocks();
    (vscode.window.createOutputChannel as Mock).mockReturnValue(mockOutputChannel);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('LogLevel', () => {
    it('should have the correct log levels defined', () => {
      expect(LogLevel.INFO).toBe('INFO');
      expect(LogLevel.ERROR).toBe('ERROR');
      expect(LogLevel.DEBUG).toBe('DEBUG');
      expect(LogLevel.WARN).toBe('WARN');
      expect(LogLevel.CRITICAL).toBe('CRITICAL');
    });
  });  describe('logDebug', () => {
    it('should log messages with the correct format', () => {
      logDebug(LogLevel.INFO, 'Test message');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[HUCKLEBERRY INFO]'),
      );
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Test message');
    });
    
    it('should format object data correctly', () => {
      const testObj = { name: 'test', value: 42 };
      logDebug(LogLevel.DEBUG, 'Object data', testObj);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('[HUCKLEBERRY DEBUG]');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Object data');
    });
    
    it('should handle non-object data', () => {
      logDebug(LogLevel.WARN, 'Number value', 42);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('[HUCKLEBERRY WARN]');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Number value');
      expect(consoleLogSpy.mock.calls[0][1]).toBe(42);
    });
    
    it('should handle stringification errors', () => {
      // Create an object with circular reference
      const circular: Record<string, unknown> = { name: 'circular' };
      circular.self = circular;
      
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('Circular structure');
      });
      
      logDebug(LogLevel.ERROR, 'Circular object', circular);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('[HUCKLEBERRY ERROR]');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Circular object');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('[Data could not be stringified]');
      
      // Restore original stringify
      JSON.stringify = originalStringify;
    });
  });  describe('initDebugChannel', () => {
    beforeEach(() => {
      // Reset the debugChannel between tests by accessing it via module internals
      // We're directly accessing a global variable that's defined in the module
      global.debugChannel = null;
    });

    it('should create and return an output channel', () => {
      const channel = initDebugChannel();
      
      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Huckleberry Debug');
      expect(channel).toBe(mockOutputChannel);
    });
    
    it('should reuse existing channel if already created', () => {
      initDebugChannel(); // First call
      const originalCallCount = (vscode.window.createOutputChannel as Mock).mock.calls.length;
      initDebugChannel(); // Second call
      
      // Should have the same number of calls (not called again)
      expect((vscode.window.createOutputChannel as Mock).mock.calls.length).toBe(originalCallCount);
    });
  });
  
  describe('logWithChannel', () => {
    it('should log messages to both console and channel', () => {
      logWithChannel(LogLevel.INFO, 'Channel test');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Channel test'),
      );
    });
    
    it('should format object data in the channel output', () => {
      const testObj = { id: 'test123', active: true };
      logWithChannel(LogLevel.DEBUG, 'Object in channel', testObj);
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalled();
      const call = mockOutputChannel.appendLine.mock.calls[0][0];
      expect(call).toContain('[DEBUG] Object in channel');
      // The JSON might be included as a new line in the channel message
      expect(call).toContain('test123');
      expect(call).toContain('active');
    });
    
    it('should handle non-object data in the channel output', () => {
      logWithChannel(LogLevel.WARN, 'Boolean value', false);
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Boolean value false'),
      );
    });
    
    it('should handle stringification errors in the channel output', () => {
      // Create an object with circular reference
      const circular = { name: 'circular' } as { name: string; self: unknown };
      circular.self = circular;
      
      // Mock JSON.stringify to throw an error
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('Circular structure');
      });
      
      logWithChannel(LogLevel.ERROR, 'Circular in channel', circular);
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[Data could not be stringified]'),
      );
      
      // Restore original stringify
      JSON.stringify = originalStringify;
    });  });
  
  describe('showDebugChannel', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it('should initialize and show the debug channel', () => {
      // First make sure we have a clean state
      initDebugChannel(); // Ensure we have a channel first
      mockOutputChannel.show.mockClear(); // Clear the show mock specifically
      
      // Now call the function we're testing
      showDebugChannel();
      
      // Verify the channel was shown
      expect(mockOutputChannel.show).toHaveBeenCalled();
    });
  });
  
  describe('dumpState', () => {
    it('should log extension state information', () => {
      const mockContext = {
        extension: {
          id: 'test.huckleberry',
          packageJSON: {
            version: '0.1.0',
          },
        },
        extensionPath: '/test/path',
      } as vscode.ExtensionContext;
      
      const mockState = {
        initialized: true,
        taskCount: 5,
      };
      
      dumpState(mockContext, mockState);
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('Extension State Dump'),
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('test.huckleberry'),
      );
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('/test/path'),
      );
      expect(mockOutputChannel.show).toHaveBeenCalled();
    });
  });
});
