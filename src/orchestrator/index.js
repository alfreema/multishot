const REQUIRED_ACTIONS = {
  genPhases: 'gen-phases',
  genTasks: 'gen-tasks',
  runTasks: 'run-tasks',
};

function createOrchestrator(deps = {}) {
  const executePrompt = deps.executePrompt;
  const getPhaseIds = deps.getPhaseIds;
  const listPhaseTaskFiles = deps.listPhaseTaskFiles;

  if (!executePrompt) {
    throw new Error('executePrompt dependency is required');
  }
  if (!getPhaseIds) {
    throw new Error('getPhaseIds dependency is required');
  }
  if (!listPhaseTaskFiles) {
    throw new Error('listPhaseTaskFiles dependency is required');
  }

  const buildExecDeps = (context, extras = {}) => {
    const { fs, spawn, onBeforeSpawn } = context || {};
    return {
      fs,
      spawn,
      onBeforeSpawn,
      ...extras,
    };
  };

  function runGenPhases(context) {
    if (!context?.cli) {
      throw new Error('cli is required for runGenPhases');
    }
    const execResult = executePrompt(
      { cli: context.cli, action: REQUIRED_ACTIONS.genPhases },
      buildExecDeps(context),
    );
    return {
      code: execResult.code,
      detail: execResult,
    };
  }

  function runGenTasks(context) {
    if (!context?.cli) {
      throw new Error('cli is required for runGenTasks');
    }
    const phaseIds = getPhaseIds(context.fs);
    if (!Array.isArray(phaseIds) || phaseIds.length === 0) {
      return {
        code: 1,
        errorMessage: 'No phases found in multishot/phases.md. Run multishot --gen-phases first.',
        phases: [],
      };
    }

    const phases = [];

    for (const phaseId of phaseIds) {
      const execResult = executePrompt(
        { cli: context.cli, action: REQUIRED_ACTIONS.genTasks, phaseId },
        buildExecDeps(context),
      );
      phases.push({ phaseId, code: execResult.code });

      if (execResult.code !== 0) {
        return {
          code: execResult.code,
          phases,
        };
      }
    }

    return {
      code: 0,
      phases,
    };
  }

  function runTasks(context) {
    if (!context?.cli) {
      throw new Error('cli is required for runTasks');
    }
    const phaseTasks = listPhaseTaskFiles(context.fs);
    if (!Array.isArray(phaseTasks) || phaseTasks.length === 0) {
      return {
        code: 1,
        errorMessage: 'No phase task files found under multishot/. Run multishot --gen-tasks first.',
        phases: [],
      };
    }

    const phases = [];

    for (const phase of phaseTasks) {
      const taskResults = [];
      if (!Array.isArray(phase.taskFiles) || phase.taskFiles.length === 0) {
        return {
          code: 1,
          errorMessage: `Phase ${phase.phaseId} contains no task files.`,
          phases,
        };
      }

      for (const taskFile of phase.taskFiles) {
        const execResult = executePrompt(
          {
            cli: context.cli,
            action: REQUIRED_ACTIONS.runTasks,
            phaseId: phase.phaseId,
            taskFile,
          },
          buildExecDeps(context),
        );

        taskResults.push({ taskFile, code: execResult.code });

        if (execResult.code !== 0) {
          return {
            code: execResult.code,
            phases: [...phases, { phaseId: phase.phaseId, tasks: taskResults }],
            errorMessage: `Task ${taskFile} failed (phase ${phase.phaseId}) with code ${execResult.code}`,
          };
        }
      }

      phases.push({ phaseId: phase.phaseId, tasks: taskResults });
    }

    return {
      code: 0,
      phases,
    };
  }

  return {
    runGenPhases,
    runGenTasks,
    runTasks,
  };
}

module.exports = {
  createOrchestrator,
};
