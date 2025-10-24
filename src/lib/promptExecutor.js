const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getCliInvocation } = require('./cliCommands');

// Keep relative paths for internal API/tests; resolve to absolute at spawn time.
const PROMPT_PATHS = {
  'gen-phases': 'data/prompts/generate-phases.md',
  'gen-tasks': 'data/prompts/generate-tasks.md',
  'run-tasks': 'data/prompts/execute-task.md',
};

// Resolve a repo-relative path (e.g., data/...) to an absolute path
// based on this package's installed location. Works in local dev and when installed globally.
function resolveFromPackageRoot(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    return relativePath;
  }
  const pkgRoot = path.resolve(__dirname, '..', '..');
  return path.join(pkgRoot, relativePath);
}

// Determine the path to pass to the spawned CLI:
// Always resolve relative paths to an absolute path within the installed package.
function getPromptPathForInvocation(effectivePromptPath) {
  return resolveFromPackageRoot(effectivePromptPath);
}

function getPackageDataDir() {
  return resolveFromPackageRoot('data');
}

// Create a workspace-local copy of the prompt with absolute paths for internal data references.
function materializePromptWithAbsoluteData(absPromptPath) {
  const dataDir = getPackageDataDir();
  const workspaceDir = path.resolve(process.cwd(), 'multishot', '.internal');
  const destPath = path.join(workspaceDir, path.basename(absPromptPath));

  try {
    const original = fs.readFileSync(absPromptPath, 'utf8');
    // In case other prompts under data/ are referenced in the future, handle the general folder prefix
    let rewritten = original.replaceAll('data/prompts/', path.join(dataDir, 'prompts') + path.sep);

    fs.mkdirSync(workspaceDir, { recursive: true });
    fs.writeFileSync(destPath, rewritten, 'utf8');
    return destPath;
  } catch (error) {
    // If anything goes wrong, fall back to the original path
    return absPromptPath;
  }
}

const ACTION_DEPENDENCIES = {
  'gen-phases': [
    {
      path: 'multishot/project.md',
      message: 'Missing multishot/project.md. Provide the project spec before generating phases.',
    },
  ],
  'gen-tasks': [
    {
      path: 'multishot/phases.md',
      message: 'Missing multishot/phases.md. Run multishot --gen-phases first.',
    },
  ],
};

function resolvePrompt(action) {
  const promptPath = PROMPT_PATHS[action];
  if (!promptPath) {
    throw new Error(`No prompt configured for action "${action}"`);
  }
  return promptPath;
}

function validateDependencies(action, fsImpl) {
  const requirements = ACTION_DEPENDENCIES[action];
  if (!requirements) {
    return;
  }

  for (const requirement of requirements) {
    const resolvedPath = path.resolve(process.cwd(), requirement.path);
    if (!fsImpl.existsSync(resolvedPath)) {
      const error = new Error(requirement.message || `Missing required file: ${requirement.path}`);
      error.missingPath = requirement.path;
      throw error;
    }
  }
}

function getPhaseIds(fsImpl = fs) {
  const reader = fsImpl || fs;
  const phasesPath = path.resolve(process.cwd(), 'multishot/phases.md');
  if (!reader.existsSync(phasesPath)) {
    return [];
  }

  try {
    const content = reader.readFileSync(phasesPath, 'utf8');
    const matches = content.matchAll(/^\s*id:\s*([A-Za-z0-9_-]+)/gm);
    const ids = [];
    for (const match of matches) {
      if (match[1]) {
        ids.push(match[1]);
      }
    }
    return ids;
  } catch {
    return [];
  }
}

function ensureNoExistingOutputs(action, fsImpl, context = {}) {
  if (action === 'gen-phases') {
    const phasesDoc = path.resolve(process.cwd(), 'multishot/phases.md');
    if (fsImpl.existsSync(phasesDoc)) {
      const error = new Error('Cowardly refusing to overwrite multishot/phases.md');
      error.existingPath = 'multishot/phases.md';
      throw error;
    }

    let entries = [];
    try {
      entries = fsImpl.readdirSync(path.resolve(process.cwd(), 'multishot'));
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        return;
      }
      throw error;
    }

    const phaseFiles = entries.filter((name) => /^Phase[A-Za-z0-9_-]*\.md$/.test(name));
    if (phaseFiles.length > 0) {
      const existing = `multishot/${phaseFiles[0]}`;
      const error = new Error(`Cowardly refusing to overwrite ${existing}`);
      error.existingPath = existing;
      throw error;
    }
    return;
  }

  if (action === 'gen-tasks') {
    const { phaseId } = context;
    if (phaseId) {
      const candidateDir = path.resolve(process.cwd(), `multishot/${phaseId}`);
      if (fsImpl.existsSync(candidateDir)) {
        const error = new Error(`Cowardly refusing to overwrite multishot/${phaseId}`);
        error.existingPath = `multishot/${phaseId}`;
        throw error;
      }
      return;
    }

    const phaseIds = getPhaseIds(fsImpl);
    for (const id of phaseIds) {
      const candidateDir = path.resolve(process.cwd(), `multishot/${id}`);
      if (fsImpl.existsSync(candidateDir)) {
        const error = new Error(`Cowardly refusing to overwrite multishot/${id}`);
        error.existingPath = `multishot/${id}`;
        throw error;
      }
    }
  }
}

function listPhaseTaskFiles(fsImpl = fs) {
  const reader = fsImpl || fs;
  const baseDir = path.resolve(process.cwd(), 'multishot');
  let phaseEntries;

  try {
    phaseEntries = reader.readdirSync(baseDir);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const normalizeName = (entry) => (typeof entry === 'string' ? entry : entry.name);
  const result = [];

  for (const entry of phaseEntries) {
    const name = normalizeName(entry);
    if (!/^Phase[A-Za-z0-9_-]*$/.test(name)) {
      continue;
    }

    const phaseDir = path.join(baseDir, name);
    let taskEntries;
    try {
      taskEntries = reader.readdirSync(phaseDir);
    } catch (error) {
      if (error && error.code === 'ENOTDIR') {
        continue;
      }
      if (error && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }

    const taskNames = taskEntries
      .map(normalizeName)
      .filter((task) => /^task\d+\.md$/i.test(task))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/^\D+/g, ''), 10);
        const numB = parseInt(b.replace(/^\D+/g, ''), 10);
        if (Number.isNaN(numA) || Number.isNaN(numB)) {
          return a.localeCompare(b);
        }
        return numA - numB;
      });

    if (taskNames.length === 0) {
      continue;
    }

    result.push({
      phaseId: name,
      taskFiles: taskNames.map((task) => path.join('multishot', name, task)),
    });
  }

  result.sort((a, b) => {
    const numA = parseInt(a.phaseId.replace(/^\D+/g, ''), 10);
    const numB = parseInt(b.phaseId.replace(/^\D+/g, ''), 10);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      return a.phaseId.localeCompare(b.phaseId);
    }
    return numA - numB;
  });

  return result;
}

function executePrompt(params, deps) {
  const { cli, action, phaseId, promptPath, taskFile } = params || {};
  if (!cli || !action) {
    throw new Error('cli and action are required');
  }

  const fsImpl = deps?.fs || fs;
  validateDependencies(action, fsImpl);
  ensureNoExistingOutputs(action, fsImpl, { phaseId });

  if (action === 'gen-tasks' && !phaseId) {
    throw new Error('phaseId is required for gen-tasks execution');
  }

  if (action === 'run-tasks') {
    if (!phaseId) {
      throw new Error('phaseId is required for run-tasks execution');
    }
    if (!taskFile) {
      throw new Error('taskFile is required for run-tasks execution');
    }
    const resolvedTaskFile = path.resolve(process.cwd(), taskFile);
    if (!fsImpl.existsSync(resolvedTaskFile)) {
      const error = new Error(`Missing task file ${taskFile}`);
      error.missingPath = taskFile;
      throw error;
    }
  }

  const effectivePromptPath = promptPath || resolvePrompt(action);
  const pathForCli = getPromptPathForInvocation(effectivePromptPath);
  const promptForCli = materializePromptWithAbsoluteData(pathForCli);
  const invocation = getCliInvocation(cli, promptForCli);
  if (invocation.args.length > 0) {
    const args = [...invocation.args];
    let message = args[args.length - 1];
    if (phaseId) {
      message = `${message} for phase ${phaseId}`;
    }
    if (action === 'run-tasks' && taskFile) {
      message = `${message} task ${taskFile}`;
    }
    args[args.length - 1] = message;
    invocation.args = args;
  }

  if (deps?.onBeforeSpawn) {
    deps.onBeforeSpawn(invocation);
  }

  const spawn = deps?.spawn || ((command, args, options) => spawnSync(command, args, options));
  const spawnResult = spawn(invocation.command, invocation.args, { stdio: 'inherit' });

  if (spawnResult?.error) {
    throw spawnResult.error;
  }

  const code = typeof spawnResult?.status === 'number' ? spawnResult.status : 0;

  return {
    code,
    promptPath: effectivePromptPath,
    phaseId: phaseId || null,
    taskFile: taskFile || null,
    invocation,
  };
}

module.exports = {
  PROMPT_PATHS,
  resolvePrompt,
  validateDependencies,
  getPhaseIds,
  ensureNoExistingOutputs,
  listPhaseTaskFiles,
  executePrompt,
};
