/**
 * Tests for initializeTaskTracking command handler
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel, logWithChannel } from '../../../../src/utils/debugUtils';
import { initializeTaskTracking } from '../../../../src/handlers/commandHandlers/initializeTaskTracking';
import { ExtensionStateService } from '../../../../src/services/extensionStateService';
import { IChatService } from '../../../../src/interfaces/IChatService';
import { ILanguageModelToolsProvider } from '../../../../src/interfaces/ILanguageModelToolsProvider';
import { IToolManager } from '../../../../src/interfaces/IToolManager';
import { ExtensionState } from '../../../../src/interfaces/IExtensionStateService';

vi.mock('vscode');
vi.mock('../../../../src/utils/debugUtils');
vi.mock('../../../../src/services/extensionStateService');

describe('initializeTaskTracking command handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('when invoked through TreeView', () => {
    it('should handle command execution with undefined apply', async () => {
      // Mock getExtensionState to return a valid state with full IToolManager implementation
      const mockToolManager: IToolManager = {
        registerTool: vi.fn().mockReturnThis(),
        getTool: vi.fn(),
        executeTool: vi.fn().mockResolvedValue(undefined),
        getAllTools: vi.fn().mockReturnValue([]),
      };
      
      const mockChatService: IChatService = {
        initialize: vi.fn(),
        registerChatParticipant: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        handleRequest: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true),
        getLastActiveTimestamp: vi.fn().mockReturnValue(Date.now()),
        startMonitoring: vi.fn(),
        stopMonitoring: vi.fn(),
        refreshParticipants: vi.fn(),
        getParticipantIds: vi.fn().mockReturnValue([]),
        dispose: vi.fn(),
      };

      const mockToolsProvider: ILanguageModelToolsProvider = {
        initialize: vi.fn(),
        registerTools: vi.fn(),
        isInitialized: vi.fn().mockReturnValue(true),
        handleRequest: vi.fn().mockResolvedValue(undefined),
        dispose: vi.fn(),
      };

      const mockState: ExtensionState = {
        toolManager: mockToolManager,
        chatService: mockChatService,
        languageModelToolsProvider: mockToolsProvider,
      };

      // Create a properly typed mock instance
      const mockExtensionStateService = {
        _state: mockState,
        getState: () => mockState,
        isInitialized: () => true,
        reset: vi.fn(),
        initialize: vi.fn(),
        initializeWithServices: vi.fn(),
        getInstance: () => ExtensionStateService.getStaticInstance(),
      } as unknown as ExtensionStateService;

      vi.mocked(ExtensionStateService.getStaticInstance).mockReturnValue(mockExtensionStateService);

      // Call the command handler - this simulates a TreeView invocation
      await initializeTaskTracking();

      // Verify logging occurred
      expect(logWithChannel).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        '🎯 Entering initializeTaskTracking command handler',
      );
    });
  });

  describe('when invoked through Command Palette', () => {
    it('should handle command execution normally', async () => {
      // Mock getExtensionState to return a valid state with full IToolManager implementation
      const mockToolManager: IToolManager = {
        registerTool: vi.fn().mockReturnThis(),
        getTool: vi.fn(),
        executeTool: vi.fn().mockResolvedValue(undefined),
        getAllTools: vi.fn().mockReturnValue([]),
      };
      
      const mockChatService: IChatService = {
        initialize: vi.fn(),
        registerChatParticipant: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        handleRequest: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true),
        getLastActiveTimestamp: vi.fn().mockReturnValue(Date.now()),
        startMonitoring: vi.fn(),
        stopMonitoring: vi.fn(),
        refreshParticipants: vi.fn(),
        getParticipantIds: vi.fn().mockReturnValue([]),
        dispose: vi.fn(),
      };

      const mockToolsProvider: ILanguageModelToolsProvider = {
        initialize: vi.fn(),
        registerTools: vi.fn(),
        isInitialized: vi.fn().mockReturnValue(true),
        handleRequest: vi.fn().mockResolvedValue(undefined),
        dispose: vi.fn(),
      };

      const mockState: ExtensionState = {
        toolManager: mockToolManager,
        chatService: mockChatService,
        languageModelToolsProvider: mockToolsProvider,
      };

      // Create a properly typed mock instance
      const mockExtensionStateService = {
        _state: mockState,
        getState: () => mockState,
        isInitialized: () => true,
        reset: vi.fn(),
        initialize: vi.fn(),
        initializeWithServices: vi.fn(),
        getInstance: () => ExtensionStateService.getStaticInstance(),
      } as unknown as ExtensionStateService;

      vi.mocked(ExtensionStateService.getStaticInstance).mockReturnValue(mockExtensionStateService);

      // Call the command handler with 'this' context - simulates Command Palette invocation
      const thisContext = {};
      await initializeTaskTracking.call(thisContext);

      // Verify logging occurred
      expect(logWithChannel).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        '🎯 Entering initializeTaskTracking command handler',
      );
    });
  });
});
