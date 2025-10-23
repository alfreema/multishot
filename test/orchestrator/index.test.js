import { describe, it, expect, vi } from 'vitest';
import { createOrchestrator } from '../../src/orchestrator/index.js';

const createContext = (overrides = {}) => ({
  cli: 'codex-cli',
  fs: {},
  spawn: vi.fn(),
  onBeforeSpawn: vi.fn(),
  ...overrides,
});

describe('createOrchestrator', () => {
  it('runs gen-phases and returns detail', () => {
    const executePrompt = vi.fn().mockReturnValue({ code: 0, promptPath: 'phases' });
    const getPhaseIds = vi.fn();
    const listPhaseTaskFiles = vi.fn();
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runGenPhases(createContext());
    expect(result).toEqual({ code: 0, detail: { code: 0, promptPath: 'phases' } });
    expect(executePrompt).toHaveBeenCalledWith(
      { cli: 'codex-cli', action: 'gen-phases' },
      expect.objectContaining({ fs: {} }),
    );
  });

  it('runs gen-tasks for each phase', () => {
    const executePrompt = vi.fn().mockReturnValue({ code: 0 });
    const getPhaseIds = vi.fn().mockReturnValue(['Phase1', 'Phase2']);
    const listPhaseTaskFiles = vi.fn();
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runGenTasks(createContext());
    expect(result).toEqual({
      code: 0,
      phases: [
        { phaseId: 'Phase1', code: 0 },
        { phaseId: 'Phase2', code: 0 },
      ],
    });
    expect(executePrompt).toHaveBeenCalledTimes(2);
    expect(executePrompt).toHaveBeenNthCalledWith(
      1,
      { cli: 'codex-cli', action: 'gen-tasks', phaseId: 'Phase1' },
      expect.any(Object),
    );
  });

  it('stops gen-tasks on failure', () => {
    const executePrompt = vi
      .fn()
      .mockReturnValueOnce({ code: 0 })
      .mockReturnValueOnce({ code: 2 });
    const getPhaseIds = vi.fn().mockReturnValue(['Phase1', 'Phase2']);
    const listPhaseTaskFiles = vi.fn();
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runGenTasks(createContext());
    expect(result).toEqual({
      code: 2,
      phases: [
        { phaseId: 'Phase1', code: 0 },
        { phaseId: 'Phase2', code: 2 },
      ],
    });
  });

  it('handles missing phases for gen-tasks', () => {
    const executePrompt = vi.fn();
    const getPhaseIds = vi.fn().mockReturnValue([]);
    const listPhaseTaskFiles = vi.fn();
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runGenTasks(createContext());
    expect(result.code).toBe(1);
    expect(result.errorMessage).toMatch(/No phases/);
    expect(result.phases).toEqual([]);
    expect(executePrompt).not.toHaveBeenCalled();
  });

  it('runs tasks sequentially', () => {
    const executePrompt = vi.fn().mockReturnValue({ code: 0 });
    const getPhaseIds = vi.fn();
    const listPhaseTaskFiles = vi.fn().mockReturnValue([
      { phaseId: 'Phase1', taskFiles: ['multishot/Phase1/task1.md'] },
      { phaseId: 'Phase2', taskFiles: ['multishot/Phase2/task1.md'] },
    ]);
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runTasks(createContext());
    expect(result).toEqual({
      code: 0,
      phases: [
        {
          phaseId: 'Phase1',
          tasks: [{ taskFile: 'multishot/Phase1/task1.md', code: 0 }],
        },
        {
          phaseId: 'Phase2',
          tasks: [{ taskFile: 'multishot/Phase2/task1.md', code: 0 }],
        },
      ],
    });
    expect(executePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        cli: 'codex-cli',
        action: 'run-tasks',
        phaseId: 'Phase1',
        taskFile: 'multishot/Phase1/task1.md',
      }),
      expect.any(Object),
    );
  });

  it('reports failure when a task fails', () => {
    const executePrompt = vi
      .fn()
      .mockReturnValueOnce({ code: 0 })
      .mockReturnValueOnce({ code: 5 });
    const getPhaseIds = vi.fn();
    const listPhaseTaskFiles = vi.fn().mockReturnValue([
      { phaseId: 'Phase1', taskFiles: ['multishot/Phase1/task1.md', 'multishot/Phase1/task2.md'] },
    ]);
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runTasks(createContext());
    expect(result.code).toBe(5);
    expect(result.errorMessage).toMatch(/task2\.md/);
    expect(result.phases).toEqual([
      {
        phaseId: 'Phase1',
        tasks: [
          { taskFile: 'multishot/Phase1/task1.md', code: 0 },
          { taskFile: 'multishot/Phase1/task2.md', code: 5 },
        ],
      },
    ]);
  });

  it('fails when phase lacks task files', () => {
    const executePrompt = vi.fn();
    const getPhaseIds = vi.fn();
    const listPhaseTaskFiles = vi.fn().mockReturnValue([{ phaseId: 'Phase1', taskFiles: [] }]);
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runTasks(createContext());
    expect(result.code).toBe(1);
    expect(result.errorMessage).toMatch(/no task files/i);
    expect(result.phases).toEqual([]);
    expect(executePrompt).not.toHaveBeenCalled();
  });

  it('fails when no task files found', () => {
    const executePrompt = vi.fn();
    const getPhaseIds = vi.fn();
    const listPhaseTaskFiles = vi.fn().mockReturnValue([]);
    const orchestrator = createOrchestrator({
      executePrompt,
      getPhaseIds,
      listPhaseTaskFiles,
    });

    const result = orchestrator.runTasks(createContext());
    expect(result.code).toBe(1);
    expect(result.errorMessage).toMatch(/No phase task files/);
    expect(result.phases).toEqual([]);
  });
});
