#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, '..');
const fixturesRoot = path.join(workspaceRoot, 'validation-fixtures');
const scenariosPath = path.join(fixturesRoot, 'scenarios.json');
const generatedRoot = path.join(workspaceRoot, '_scenario-workspaces');
const evidenceRoot = path.join(workspaceRoot, '_debug-evidence');
const typescriptCompiler = path.resolve(workspaceRoot, '..', 'node_modules', 'typescript', 'bin', 'tsc');

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) {
      fail(`Unexpected argument: ${token}`);
    }

    const value = rest[index + 1];
    if (!value || value.startsWith('--')) {
      fail(`Missing value for ${token}`);
    }

    options[token.slice(2)] = value;
    index += 1;
  }

  return { command, options };
}

function loadScenarios() {
  return JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));
}

function validateRunId(runId) {
  if (!runId || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/.test(runId)) {
    fail('Run ID must be 3-64 characters using letters, numbers, dot, underscore, or hyphen.');
  }
}

function resolveRunPath(root, runId) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(root, runId);
  if (!resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    fail(`Resolved run path escaped its root: ${resolvedTarget}`);
  }
  return resolvedTarget;
}

function run(command, cwd) {
  if (command === 'npm run typecheck') {
    return runProcess(command, process.execPath, [typescriptCompiler, '-p', 'tsconfig.json', '--noEmit'], cwd);
  }

  if (command === 'npm test') {
    const build = runProcess(
      'npm run build --silent',
      process.execPath,
      [typescriptCompiler, '-p', 'tsconfig.json'],
      cwd,
    );
    if (build.exitCode !== 0) {
      return { ...build, command };
    }

    const tests = runProcess('node --test dist/catalog.test.js', process.execPath, [
      '--test',
      'dist/catalog.test.js',
    ], cwd);
    return {
      command,
      exitCode: tests.exitCode,
      stdout: `${build.stdout}${tests.stdout}`,
      stderr: `${build.stderr}${tests.stderr}`,
    };
  }

  return {
    command,
    exitCode: 1,
    stdout: '',
    stderr: `Unsupported fixture command: ${command}\n`,
  };
}

function runProcess(command, executable, args, cwd) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });

  return {
    command,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
  });

  return {
    command: `git ${args.join(' ')}`,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function requireSuccess(result, context) {
  if (result.exitCode !== 0) {
    fail(`${context} failed (${result.exitCode}).\n${result.stdout}${result.stderr}`);
  }
}

function writeCommandEvidence(directory, name, result) {
  fs.writeFileSync(path.join(directory, `${name}.stdout.txt`), result.stdout);
  fs.writeFileSync(path.join(directory, `${name}.stderr.txt`), result.stderr);
  fs.writeFileSync(
    path.join(directory, `${name}.json`),
    `${JSON.stringify({ command: result.command, exitCode: result.exitCode }, null, 2)}\n`,
  );
}

function taskMarkdown(runId, scenarioId, scenario) {
  return `# Repair Task: ${scenario.title}

- Run ID: \`${runId}\`
- Scenario: \`${scenarioId}\`
- Maximum repair attempts: ${scenario.maximumAttempts}
- Allowed paths: ${scenario.allowedPaths.map((item) => `\`${item}\``).join(', ')}
- Declared verifier: \`${scenario.verifier}\`

## Objective

${scenario.objective}

## Boundaries

- Work only in this generated repository and the allowed paths above.
- Do not inspect the parent fixture template, scenario patch, or Git history for the answer.
- Do not use casts, suppression comments, compiler weakening, or dependency changes to bypass the objective.
- Treat verifier output as evidence; do not claim success from prose alone.
`;
}

function prepare(runId, scenarioId, scenario) {
  validateRunId(runId);
  const target = resolveRunPath(generatedRoot, runId);
  const evidence = resolveRunPath(evidenceRoot, runId);

  if (fs.existsSync(target)) {
    fail(`Scenario workspace already exists and will not be overwritten: ${target}`);
  }
  if (fs.existsSync(evidence)) {
    fail(`Evidence directory already exists and will not be overwritten: ${evidence}`);
  }

  const template = path.join(fixturesRoot, scenario.template);
  const patch = path.join(fixturesRoot, 'scenarios', scenario.patch);
  if (!fs.existsSync(template) || !fs.existsSync(patch)) {
    fail(`Scenario template or patch is missing for ${scenarioId}.`);
  }

  fs.mkdirSync(generatedRoot, { recursive: true });
  fs.mkdirSync(path.join(evidence, '00-meta'), { recursive: true });
  fs.mkdirSync(path.join(evidence, '01-fixture'), { recursive: true });
  fs.mkdirSync(path.join(evidence, '02-agent'), { recursive: true });
  fs.mkdirSync(path.join(evidence, '03-verification'), { recursive: true });
  fs.mkdirSync(path.join(evidence, '99-summary'), { recursive: true });
  fs.cpSync(template, target, { recursive: true });
  fs.writeFileSync(path.join(target, 'TASK.md'), taskMarkdown(runId, scenarioId, scenario));

  const cleanVerifier = run(scenario.verifier, target);
  const cleanKnownCheck = run(scenario.knownCheck, target);
  writeCommandEvidence(path.join(evidence, '01-fixture'), 'clean-verifier', cleanVerifier);
  writeCommandEvidence(path.join(evidence, '01-fixture'), 'clean-known-check', cleanKnownCheck);

  if (cleanVerifier.exitCode !== 0 || cleanKnownCheck.exitCode !== 0) {
    fail(`Clean fixture checks failed. Evidence: ${path.join(evidence, '01-fixture')}`);
  }

  for (const result of [
    runGit(['init', '--initial-branch=main'], target),
    runGit(['config', 'user.name', 'Huckleberry Fixture'], target),
    runGit(['config', 'user.email', 'fixture@local.invalid'], target),
    runGit(['add', '--all'], target),
    runGit(['commit', '-m', 'test: establish clean fixture'], target),
  ]) {
    requireSuccess(result, 'Fixture Git initialization');
  }

  const applyResult = runGit(['apply', patch], target);
  requireSuccess(applyResult, 'Scenario patch');

  const seedVerifier = run(scenario.verifier, target);
  writeCommandEvidence(path.join(evidence, '01-fixture'), 'seed-verifier', seedVerifier);

  let seedKnownCheck;
  if (scenario.expectedSeedKnownExit !== undefined) {
    seedKnownCheck = run(scenario.knownCheck, target);
    writeCommandEvidence(path.join(evidence, '01-fixture'), 'seed-known-check', seedKnownCheck);
  }

  const verifierMatched = seedVerifier.exitCode === scenario.expectedSeedVerifierExit;
  const knownCheckMatched =
    scenario.expectedSeedKnownExit === undefined ||
    seedKnownCheck?.exitCode === scenario.expectedSeedKnownExit;

  for (const result of [
    runGit(['add', '--all'], target),
    runGit(['commit', '-m', `test: seed ${scenarioId}`], target),
  ]) {
    requireSuccess(result, 'Scenario seed commit');
  }

  const seedCommitResult = runGit(['rev-parse', 'HEAD'], target);
  requireSuccess(seedCommitResult, 'Seed revision lookup');
  const seedCommit = seedCommitResult.stdout.trim();

  const metadata = {
    runId,
    scenarioId,
    title: scenario.title,
    preparedAt: new Date().toISOString(),
    workspace: target,
    seedCommit,
    objective: scenario.objective,
    allowedPaths: scenario.allowedPaths,
    maximumAttempts: scenario.maximumAttempts,
    verifier: scenario.verifier,
    knownCheck: scenario.knownCheck,
    expectedSeedVerifierExit: scenario.expectedSeedVerifierExit,
    expectedSeedKnownExit: scenario.expectedSeedKnownExit ?? null,
    seedEvidenceMatched: verifierMatched && knownCheckMatched,
  };
  fs.writeFileSync(
    path.join(evidence, '00-meta', 'fixture.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(evidence, '00-meta', 'setup.md'),
    `# Fixture Setup

- Run ID: \`${runId}\`
- Scenario: \`${scenarioId}\`
- Generated repository: \`${target}\`
- Seed commit: \`${seedCommit}\`
- Clean verifier exit: ${cleanVerifier.exitCode}
- Clean known-check exit: ${cleanKnownCheck.exitCode}
- Seed verifier exit: ${seedVerifier.exitCode} (expected ${scenario.expectedSeedVerifierExit})
- Seed known-check exit: ${seedKnownCheck ? `${seedKnownCheck.exitCode} (expected ${scenario.expectedSeedKnownExit})` : 'not required'}
- Seed evidence matched: ${verifierMatched && knownCheckMatched ? 'YES' : 'NO'}
- Evidence classification: Gate B fixture/harness evidence; not Gate A or Gate C usefulness evidence.
`,
  );

  if (!verifierMatched || !knownCheckMatched) {
    fail(`Seed evidence did not match the scenario declaration. See ${path.join(evidence, '00-meta', 'setup.md')}`);
  }

  process.stdout.write(`Prepared ${scenarioId} at ${target}\n`);
  process.stdout.write(`Task: ${path.join(target, 'TASK.md')}\n`);
  process.stdout.write(`Evidence: ${evidence}\n`);
}

function changedFilesFromStatus(statusOutput) {
  return statusOutput
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const value = line.slice(3).trim();
      return value.includes(' -> ') ? value.split(' -> ').at(-1) : value;
    })
    .map((value) => value.replaceAll('\\', '/'));
}

function nextAttemptDirectory(verificationDirectory) {
  const existing = fs.existsSync(verificationDirectory)
    ? fs.readdirSync(verificationDirectory).filter((name) => /^attempt-\d{3}$/u.test(name))
    : [];
  const next = existing.length + 1;
  return path.join(verificationDirectory, `attempt-${String(next).padStart(3, '0')}`);
}

function collect(runId) {
  validateRunId(runId);
  const target = resolveRunPath(generatedRoot, runId);
  const evidence = resolveRunPath(evidenceRoot, runId);
  const metadataPath = path.join(evidence, '00-meta', 'fixture.json');
  if (!fs.existsSync(path.join(target, '.git')) || !fs.existsSync(metadataPath)) {
    fail(`Prepared scenario or metadata not found for run ${runId}.`);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const attempt = nextAttemptDirectory(path.join(evidence, '03-verification'));
  fs.mkdirSync(attempt, { recursive: true });

  const verifier = run(metadata.verifier, target);
  const knownCheck = run(metadata.knownCheck, target);
  const status = runGit(['status', '--porcelain=v1'], target);
  const diffCheck = runGit(['diff', '--check', 'HEAD'], target);
  const diffStat = runGit(['diff', '--stat', 'HEAD'], target);
  const diff = runGit(['diff', '--no-ext-diff', 'HEAD'], target);
  const changedFiles = changedFilesFromStatus(status.stdout);
  const outOfScope = changedFiles.filter((file) => !metadata.allowedPaths.includes(file));
  const scopePassed = outOfScope.length === 0;
  const passed =
    verifier.exitCode === 0 &&
    knownCheck.exitCode === 0 &&
    diffCheck.exitCode === 0 &&
    scopePassed &&
    changedFiles.length > 0;

  writeCommandEvidence(attempt, 'verifier', verifier);
  writeCommandEvidence(attempt, 'known-check', knownCheck);
  fs.writeFileSync(path.join(attempt, 'git-status.txt'), status.stdout);
  fs.writeFileSync(path.join(attempt, 'git-diff-check.txt'), `${diffCheck.stdout}${diffCheck.stderr}`);
  fs.writeFileSync(path.join(attempt, 'git-diff-stat.txt'), diffStat.stdout);
  fs.writeFileSync(path.join(attempt, 'git-diff.patch'), diff.stdout);

  const resultPath = path.join(attempt, 'result.md');
  fs.writeFileSync(
    resultPath,
    `# Machine Verification Attempt

- Captured at: ${new Date().toISOString()}
- Run ID: \`${runId}\`
- Scenario: \`${metadata.scenarioId}\`
- Fresh verifier exit: ${verifier.exitCode}
- Fresh known-check exit: ${knownCheck.exitCode}
- Git diff check exit: ${diffCheck.exitCode}
- Changed files: ${changedFiles.length ? changedFiles.map((file) => `\`${file}\``).join(', ') : 'none'}
- Allowed scope: ${metadata.allowedPaths.map((file) => `\`${file}\``).join(', ')}
- Out-of-scope files: ${outOfScope.length ? outOfScope.map((file) => `\`${file}\``).join(', ') : 'none'}
- Machine result: ${passed ? 'PASS' : 'FAIL'}
- Evidence classification: Gate B fixture/harness evidence; not Gate A or Gate C usefulness evidence.
`,
  );

  fs.writeFileSync(
    path.join(evidence, '99-summary', 'latest-machine-result.md'),
    `# Latest Machine Result

- Attempt evidence: \`${resultPath}\`
- Result: ${passed ? 'PASS' : 'FAIL'}
- Captured at: ${new Date().toISOString()}

This file contains machine results only. Copilot must write a separate attributed summary for human observations and limitations.
`,
  );

  process.stdout.write(`${passed ? 'PASS' : 'FAIL'}: ${resultPath}\n`);
  process.exitCode = passed ? 0 : 1;
}

const { command, options } = parseArguments(process.argv.slice(2));
const scenarios = loadScenarios();

if (command === 'list') {
  for (const [id, scenario] of Object.entries(scenarios)) {
    process.stdout.write(`${id}: ${scenario.title}\n`);
  }
} else if (command === 'prepare') {
  const scenario = scenarios[options.scenario];
  if (!scenario) {
    fail(`Unknown scenario: ${options.scenario ?? '(missing)'}. Run the list command first.`);
  }
  prepare(options['run-id'], options.scenario, scenario);
} else if (command === 'collect') {
  collect(options['run-id']);
} else {
  fail('Usage: node scripts/repair-fixture.mjs <list|prepare|collect> [--run-id ID] [--scenario ID]');
}
