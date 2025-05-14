# Improving Extension Quality with Vitest

A practical playbook for raising code quality, test coverage, and CI confidence for a Visual Studio Code Copilotenabled extension using Vitest as the primary test runner.

## TL;DR

- Separate concerns. Keep business logic pure and testable; hide Copilot & VS Code APIs behind narrow interfaces.
- Run fast, deterministic Vitest suites on every commit for >90% of the codebase.
- Maintain a slim Mocha + Extension Development Host (EDH) suite for wiring and UI commands.
- Stub or record all network traffic during unit/integration tests; reserve live Copilot calls for nightly e2e.
- Automate with a lightweight GitHub Actions workflow that runs Vitest first, then EDH tests under xvfb.

## 1. Project Layout

`
.vscode/
src/
  extension.ts          activation entry (CommonJS)
  lib/                  pure logic (ESM, Vitestcovered)
    prompt.ts
    telemetry.ts
  services/
    copilot.ts          real CopilotService
tests/
  unit/                 Vitest
  integration-edh/      Mocha + @vscode/test-electron
vite.config.ts
vitest.config.ts
tsconfig.json
`

Production stays CommonJS so VS Code's runtime can require() it, while tests and src/lib compile to ESM for Vitest's speedy loader.

## 2. Refactor for Testability

### 2.1 Copilot Service Interface

` ypescript
export interface CopilotService {
  getCompletions(ctx: PromptCtx): Promise<string[]>;
}

export class RealCopilotService implements CopilotService {
  async getCompletions(ctx: PromptCtx) {
    // fetch() to Copilot's API
  }
}
`

Inject CopilotService wherever you need completions. Swap RealCopilotService for a stub in tests.

### 2.2 VS Code API Boundaries

- Access vscode.window, workspace, etc. only in thin adapters.
- Use dependency injection so pure functions never import vscode directly.

## 3. Vitest Configuration

` ypescript
// vitest.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: true,
    coverage: { provider: "c8" },
    deps: { fallbackCJS: true },
    alias: {
      vscode: "./tests/__mocks__/vscode.ts" // shim VS Code API
    }
  }
});
`

Use Vite aliases to stub vscode without loaders or Babel hacks.

## 4. Mocking & Stubbing

### 4.1 Copilot Stub

` ypescript
import { vi } from "vitest";

export const stubCopilot = {
  getCompletions: vi.fn().mockResolvedValue(["//  mocked completion"])
};
`

### 4.2 Network Interception with Nock

`ypescript
import nock from "nock";
nock("https://api.github.com")
  .post("/copilot_internal/completions")
  .reply(200, { choices: [{ text: "// copilot" }] });
`

### 4.3 VS Code Shim

`ypescript
export const window = { showInformationMessage: vi.fn() };
export const commands = { registerCommand: vi.fn() };
export const workspace = { onDidSaveTextDocument: vi.fn() };
`

Place in tests/__mocks__/vscode.ts.

## 5. Integration Tests inside the Extension Host

Because VS Code boots Mocha internally, keep one CJS test suite:

` ypescript
import * as vscode from "vscode";
import { stubCopilot } from "../stubs";

describe("Command wiring", () => {
  it("registers suggest command", async () => {
    const cmds = await vscode.commands.getCommands();
    expect(cmds).toContain("myExt.suggest");
  });
});
`

Run via @vscode/test-electron in CI.

## 6. Continuous Integration

`yaml

## .github/workflows/ci.yml

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx vitest run --coverage
      - name: Run VS Code EDH tests
        run: xvfb-run -a npm run test:edh
`

Vitest fails fast; EDH tests give UI confidence.

## 7. Handling Nondeterminism

| Problem | Strategy |
|---------|----------|
| Copilot returns variable text | Stub service or replay Nock fixtures. |
| Random prompt templates | Expose a seed parameter and lock during tests. |
| Minor wording drift breaks snapshots | Assert invariants (nonempty, contains keyword) instead of exact match. |

## 8. Coverage & Quality Gates

Aim for >90% statement coverage on src/lib.

`ash
npx vitest --coverage
`

Feed the generated lcov into Codecov or SonarCloud for PR badges.

## 9. Recommended Tooling

| Tool | Purpose |
|------|---------|
| Vitest VS Code | Green/red gutters & watch mode |
| Vitest Runner | Sidebar test explorer |
| @vscode/testelectron | Launches EDH for integration tests |
| Nock | HTTP intercept/record |
| vscode-mock or manual stubs | Simulate VS Code API |
| xvfb | Headless display for CI |

## 10. Next Steps

- Move one pure utility into src/lib and write its first Vitest.
- Add tests/__mocks__/vscode.ts and stub window.showInformationMessage.
- Wire GitHub Actions workflow and turn on coverage gating.
- Schedule a nightly job to run the live Copilot e2e smoke test.
