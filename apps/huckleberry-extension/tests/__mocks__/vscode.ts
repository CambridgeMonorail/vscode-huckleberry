/**
 * Mock implementation of the VS Code API for unit testing
 * This file is aliased as 'vscode' in vitest.config.ts
 */
import { vi } from 'vitest';

// Window namespace
export const window = { 
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  showWarningMessage: vi.fn().mockResolvedValue(undefined),
  createOutputChannel: vi.fn().mockReturnValue({
    appendLine: vi.fn(),
    append: vi.fn(),
    clear: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    replace: vi.fn(),
    name: 'Huckleberry Debug',
  }),
  createTerminal: vi.fn().mockReturnValue({
    sendText: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    dispose: vi.fn(),
    processId: Promise.resolve(1),
    name: 'Test Terminal',
  }),
  createTextEditorDecorationType: vi.fn().mockReturnValue({
    key: 'test-decoration-type',
    dispose: vi.fn(),
  }),
  withProgress: vi.fn().mockImplementation((options, task) => {
    return task({ report: vi.fn() });
  }),
  showQuickPick: vi.fn().mockResolvedValue(undefined),
  showInputBox: vi.fn().mockResolvedValue(''),
  showTextDocument: vi.fn().mockResolvedValue(undefined),
  visibleTextEditors: [],
  onDidChangeVisibleTextEditors: vi.fn(),
  onDidChangeActiveTextEditor: vi.fn(),
  setStatusBarMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  activeTextEditor: undefined,
  createWebviewPanel: vi.fn().mockReturnValue({
    webview: {
      html: '',
      onDidReceiveMessage: vi.fn(),
      postMessage: vi.fn().mockResolvedValue(true),
      asWebviewUri: vi.fn().mockImplementation(uri => uri),
      cspSource: 'https://test-csp-source/',
    },
    onDidDispose: vi.fn(),
    onDidChangeViewState: vi.fn(),
    reveal: vi.fn(),
    dispose: vi.fn(),
  }),
};

// Workspace namespace
export const workspace = { 
  workspaceFolders: [{ 
    uri: { 
      fsPath: '/test/workspace',
      toString: () => 'file:///test/workspace',
      scheme: 'file',
      path: '/test/workspace',
      with: vi.fn().mockImplementation(function(this: Record<string, unknown>, change: Record<string, unknown>) {
        return { ...this, ...change };
      }),
    },
    name: 'test',
    index: 0,
  }],
  onDidChangeWorkspaceFolders: vi.fn(),
  getConfiguration: vi.fn().mockReturnValue({
    get: vi.fn(),
    update: vi.fn(),
    has: vi.fn(),
    inspect: vi.fn(),
  }),
  fs: {
    readFile: vi.fn().mockResolvedValue(Buffer.from('test file content')),
    writeFile: vi.fn().mockResolvedValue(undefined),
    createDirectory: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({
      type: 1,
      size: 100,
      mtime: Date.now(),
      ctime: Date.now(),
    }),
    readDirectory: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    isWritableFileSystem: vi.fn().mockReturnValue(true),
  },
  openTextDocument: vi.fn().mockResolvedValue({
    fileName: '/test/file.ts',
    getText: vi.fn().mockReturnValue('test file content'),
    save: vi.fn().mockResolvedValue(true),
    lineAt: vi.fn().mockReturnValue({
      text: 'test line content',
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
    }),
    lineCount: 1,
  }),
  onDidChangeTextDocument: vi.fn(),
  onDidSaveTextDocument: vi.fn(),
  onDidOpenTextDocument: vi.fn(),
  onDidCloseTextDocument: vi.fn(),
  saveAll: vi.fn().mockResolvedValue(true),
  applyEdit: vi.fn().mockResolvedValue(true),
  createFileSystemWatcher: vi.fn().mockReturnValue({
    onDidCreate: vi.fn(),
    onDidChange: vi.fn(),
    onDidDelete: vi.fn(),
    dispose: vi.fn(),
  }),
  asRelativePath: vi.fn().mockImplementation(path => path.toString().replace('/test/workspace/', '')),
  rootPath: '/test/workspace',
  name: 'Test Workspace',
};

// Commands namespace
export const commands = { 
  executeCommand: vi.fn(),
  registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  registerTextEditorCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  getCommands: vi.fn().mockResolvedValue([]),
};

// Language namespace
export const languages = {
  registerCodeLensProvider: vi.fn(),
};

// URI handling
export class Uri {
  scheme: string;
  authority: string;
  path: string;
  query: string;
  fragment: string;
  fsPath: string;

  constructor(scheme: string, authority: string, path: string, query: string, fragment: string) {
    this.scheme = scheme;
    this.authority = authority;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
    this.fsPath = path;
  }

  static file(path: string): Uri {
    return new Uri('file', '', path, '', '');
  }

  static parse(value: string): Uri {
    return new Uri('file', '', value, '', '');
  }

  with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
    return new Uri(
      change.scheme || this.scheme,
      change.authority || this.authority,
      change.path || this.path,
      change.query || this.query,
      change.fragment || this.fragment,
    );
  }

  toString(): string {
    return `${this.scheme}://${this.authority}${this.path}${this.query ? '?' + this.query : ''}${this.fragment ? '#' + this.fragment : ''}`;
  }
}

// Position class
export class Position {
  line: number;
  character: number;

  constructor(line: number, character: number) {
    this.line = line;
    this.character = character;
  }

  isBefore(other: Position): boolean {
    if (this.line < other.line) {
      return true;
    }
    if (this.line === other.line && this.character < other.character) {
      return true;
    }
    return false;
  }

  isAfter(other: Position): boolean {
    if (this.line > other.line) {
      return true;
    }
    if (this.line === other.line && this.character > other.character) {
      return true;
    }
    return false;
  }

  isEqual(other: Position): boolean {
    return this.line === other.line && this.character === other.character;
  }
}

// Range class
export class Range {
  start: Position;
  end: Position;

  constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
    this.start = new Position(startLine, startCharacter);
    this.end = new Position(endLine, endCharacter);
  }

  contains(positionOrRange: Position | Range): boolean {
    if (positionOrRange instanceof Position) {
      return !positionOrRange.isBefore(this.start) && !positionOrRange.isAfter(this.end);
    }
    return !positionOrRange.start.isBefore(this.start) && !positionOrRange.end.isAfter(this.end);
  }

  isEmpty(): boolean {
    return this.start.isEqual(this.end);
  }

  isSingleLine(): boolean {
    return this.start.line === this.end.line;
  }
}

// Selection class
export class Selection extends Range {
  anchor: Position;
  active: Position;

  constructor(anchorLine: number, anchorCharacter: number, activeLine: number, activeCharacter: number) {
    super(anchorLine, anchorCharacter, activeLine, activeCharacter);
    this.anchor = new Position(anchorLine, anchorCharacter);
    this.active = new Position(activeLine, activeCharacter);
  }

  isReversed(): boolean {
    return this.anchor.isAfter(this.active);
  }
}

// Event handling
export class EventEmitter<T> {
  private handlers: Array<(e: T) => unknown> = [];
  
  event = (listener: (e: T) => unknown): { dispose: () => void } => {
    this.handlers.push(listener);
    return {
      dispose: () => {
        this.handlers = this.handlers.filter(l => l !== listener);
      },
    };
  };
  
  fire(data: T): void {
    this.handlers.forEach(handler => handler(data));
  }
}

// Extension context
export interface ExtensionContext {
  subscriptions: { dispose(): void }[];
  extensionPath: string;
  storagePath: string | undefined;
  globalState: Memento;
  workspaceState: Memento;
  extension: {
    id: string;
    extensionKind?: ExtensionKind;
    packageJSON: Record<string, unknown>;
  };
}

// Memento
export interface Memento {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: unknown): Thenable<void>;
}

// Extension kind
export enum ExtensionKind {
  UI = 1,
  Workspace = 2
}

// Chat related mocks
export class LanguageModelChatMessage {
  constructor(
    public readonly role: string,
    public readonly content: string,
    public readonly name?: string,
  ) {}
}

export class LanguageModelExecuteResult {
  constructor(public readonly result: unknown) {}
}

// Other commonly used API components
export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
  Two = 2,
  Three = 3,
}

// Disposable
export class Disposable {
  static from(...disposables: { dispose(): unknown }[]): Disposable {
    return new Disposable(() => {
      disposables.forEach(d => d.dispose());
    });
  }

  constructor(private readonly callOnDispose: () => unknown) {}

  dispose(): unknown {
    return this.callOnDispose();
  }
}

// Helper for resetting mocks between tests
export function resetAllMocks(): void {
  vi.clearAllMocks();
  
  // Reset any stored state
  workspace.workspaceFolders = [{ 
    uri: { 
      fsPath: '/test/workspace',
      toString: () => 'file:///test/workspace',
      scheme: 'file',
      path: '/test/workspace',
      with: vi.fn().mockImplementation(function(this: Record<string, unknown>, change: Record<string, unknown>) {
        return { ...this, ...change };
      }),
    },
    name: 'test',
    index: 0,
  }];
}
