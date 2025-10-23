const fs = require('fs');
const { Command, Option } = require('commander');
const {
  executePrompt,
  getPhaseIds,
  listPhaseTaskFiles,
} = require('./lib/promptExecutor');
const { createOrchestrator } = require('./orchestrator/index');

const ALLOWED_CLIS = ['codex-cli'];

const ACTION_MAP = {
  genPhases: 'gen-phases',
  genTasks: 'gen-tasks',
  runTasks: 'run-tasks',
};

function buildProgram() {
  const program = new Command();
  program
    .name('multishot')
    .description('Transform project specs into executable AI workflows')
    .exitOverride()
    .showHelpAfterError();

  program.addOption(
    new Option('--cli <cli>', 'CLI integration to invoke')
      .choices(ALLOWED_CLIS)
      .default('codex-cli'),
  );

  program
    .option('--gen-phases', 'Generate docs/specs/phases.md from project spec')
    .option('--gen-tasks', 'Generate per-phase task prompts')
    .option('--run-tasks', 'Execute task prompts sequentially');

  return program;
}

function parseArgs(argv = process.argv) {
  if (!Array.isArray(argv)) {
    throw new Error('argv must be an array');
  }

  const program = buildProgram();
  let capturedStdout = '';
  let capturedStderr = '';

  program.configureOutput({
    writeOut: (str) => {
      capturedStdout += str;
    },
    writeErr: (str) => {
      capturedStderr += str;
    },
    outputError: (str) => {
      capturedStderr += str;
    },
  });
  const provided = argv.slice(2);

  if (provided.length === 0) {
    return { kind: 'help', helpText: program.helpInformation() };
  }

  try {
    program.parse(argv);
  } catch (error) {
    if (error?.code === 'commander.helpDisplayed') {
      return { kind: 'help', helpText: program.helpInformation() };
    }
    const combined = (capturedStderr + capturedStdout).trim();
    throw new Error(combined || error?.message || String(error));
  }

  const options = program.opts();
  const selected = Object.keys(ACTION_MAP)
    .filter((key) => options[key])
    .map((key) => ACTION_MAP[key]);

  if (selected.length === 0) {
    throw new Error('You must specify one action flag');
  }

  if (selected.length > 1) {
    throw new Error('Only one action flag is allowed');
  }

  return {
    kind: 'command',
    cli: options.cli,
    action: selected[0],
  };
}

function run(argv = process.argv, io, deps) {
  const streams = io || {
    stdout: process.stdout,
    stderr: process.stderr,
  };
  const fsImpl = deps?.fs || fs;
  const spawn = deps?.spawn;
  const executor = deps?.executePrompt || executePrompt;
  const phaseReader = deps?.getPhaseIds || getPhaseIds;
  const phaseTaskResolver = deps?.listPhaseTaskFiles || listPhaseTaskFiles;
  const orchestrator =
    deps?.orchestrator ||
    createOrchestrator({
      executePrompt: executor,
      getPhaseIds: phaseReader,
      listPhaseTaskFiles: phaseTaskResolver,
    });
  const onBeforeSpawn = (invocation) => {
    const rendered = [invocation.command, ...invocation.args].join(' ');
    streams.stdout.write(`Executing: ${rendered}\n`);
  };

  try {
    const result = parseArgs(argv);

    if (result.kind === 'help') {
      streams.stdout.write(result.helpText || '');
      return { code: 0, result };
    }

    const context = {
      cli: result.cli,
      fs: fsImpl,
      spawn,
      onBeforeSpawn,
    };

    let orchestration;

    if (result.action === 'gen-phases') {
      orchestration = orchestrator.runGenPhases(context);
    } else if (result.action === 'gen-tasks') {
      orchestration = orchestrator.runGenTasks(context);
    } else if (result.action === 'run-tasks') {
      orchestration = orchestrator.runTasks(context);
    } else {
      throw new Error(`Unsupported action "${result.action}"`);
    }

    if (orchestration?.errorMessage) {
      streams.stderr.write(`${orchestration.errorMessage}\n`);
    }

    const payload = { ...result };
    if (orchestration?.detail) {
      payload.detail = orchestration.detail;
    }
    if (orchestration?.phases) {
      payload.phases = orchestration.phases;
    }

    return { code: orchestration.code ?? 1, result: payload };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    streams.stderr.write(`${message}\n`);
    return { code: 1, error };
  }
}

module.exports = {
  ALLOWED_CLIS,
  parseArgs,
  run,
  executePrompt,
};
