import path from 'path';
import { describe, it, expect, vi } from 'vitest';
import {
  executePrompt,
  resolvePrompt,
  listPhaseTaskFiles,
} from '../../src/lib/promptExecutor.js';

const cwd = process.cwd();

function createFsMock(files = {}, dirs = []) {
  const normalized = new Map(
    Object.entries(files).map(([relativePath, value]) => [
      path.resolve(cwd, relativePath),
      value,
    ]),
  );
  const dirSet = new Set(dirs.map((relative) => path.resolve(cwd, relative)));

  return {
    existsSync: vi.fn((target) => {
      const resolved = path.resolve(cwd, target);
      if (normalized.has(resolved)) {
        return true;
      }
      if (dirSet.has(resolved)) {
        return true;
      }
      return Array.from(normalized.keys()).some((key) => key.startsWith(`${resolved}${path.sep}`));
    }),
    readFileSync: vi.fn((target) => {
      const key = path.resolve(cwd, target);
      if (!normalized.has(key)) {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      }
      return normalized.get(key);
    }),
    readdirSync: vi.fn((target) => {
      const dirPath = path.resolve(cwd, target);
      const fileEntries = Array.from(normalized.keys())
        .filter((key) => path.dirname(key) === dirPath)
        .map((key) => path.basename(key));
      const dirEntries = Array.from(dirSet)
        .filter((dir) => path.dirname(dir) === dirPath)
        .map((dir) => path.basename(dir));

      const combined = Array.from(new Set([...fileEntries, ...dirEntries])).sort();

      if (combined.length === 0) {
        if (!dirSet.has(dirPath)) {
          const error = new Error('ENOENT');
          error.code = 'ENOENT';
          throw error;
        }
        return [];
      }

      return combined;
    }),
  };
}

describe('resolvePrompt', () => {
  it('returns prompt path for known action', () => {
    expect(resolvePrompt('gen-phases')).toBe('data/prompts/generate-phases.md');
  });

  it('throws for unknown action', () => {
    expect(() => resolvePrompt('unknown')).toThrow(/No prompt configured/);
  });
});

describe('executePrompt', () => {
  it('spawns command with codex-cli invocation and emits beforeSpawn event', () => {
    const spawn = vi.fn().mockReturnValue({ status: 0 });
    const onBeforeSpawn = vi.fn();
    const fsMock = createFsMock({
      'multishot/project.md': '# spec',
    });
    const result = executePrompt(
      { cli: 'codex-cli', action: 'gen-phases' },
      { spawn, onBeforeSpawn, fs: fsMock },
    );
    expect(result.code).toBe(0);
    expect(result.promptPath).toBe('data/prompts/generate-phases.md');
    expect(result.invocation.command).toBe('codex');
    const expectedPromptAbs = path.resolve(
      process.cwd(),
      'multishot',
      '.internal',
      'generate-phases.md',
    );
    expect(onBeforeSpawn).toHaveBeenCalledWith({
      command: 'codex',
      args: [
        '--full-auto',
        '--model',
        'gpt-5-medium',
        'exec',
        '--sandbox',
        'danger-full-access',
        '--skip-git-repo-check',
        `Execute the prompt in ${expectedPromptAbs}`,
      ],
    });
    expect(spawn).toHaveBeenCalledWith(
      'codex',
      [
        '--full-auto',
        '--model',
        'gpt-5-medium',
        'exec',
        '--sandbox',
        'danger-full-access',
        '--skip-git-repo-check',
        `Execute the prompt in ${expectedPromptAbs}`,
      ],
      { stdio: 'inherit' },
    );
  });

  it('throws when spawn reports error', () => {
    const error = new Error('spawn failed');
    const spawn = vi.fn().mockReturnValue({ error });
    const fsMock = createFsMock({
      'multishot/project.md': '# spec',
    });
    expect(() =>
      executePrompt({ cli: 'codex-cli', action: 'gen-phases' }, { spawn, fs: fsMock }),
    ).toThrow(/spawn failed/);
  });

  it('handles gen-tasks action mapping', () => {
    const spawn = vi.fn().mockReturnValue({ status: 0 });
    const fsMock = createFsMock({
      'multishot/phases.md': 'id: Phase1',
    });
    const result = executePrompt(
      { cli: 'codex-cli', action: 'gen-tasks', phaseId: 'Phase1' },
      { spawn, fs: fsMock },
    );
    expect(result.promptPath).toBe('data/prompts/generate-tasks.md');
    const expectedPromptAbs = path.resolve(
      process.cwd(),
      'multishot',
      '.internal',
      'generate-tasks.md',
    );
    expect(result.invocation.args[result.invocation.args.length - 1]).toBe(
      `Execute the prompt in ${expectedPromptAbs} for phase Phase1`,
    );
    expect(result.phaseId).toBe('Phase1');
  });

  it('fails fast when project spec missing for gen-phases', () => {
    const fsMock = createFsMock({});
    const spawn = vi.fn();
    expect(() =>
      executePrompt({ cli: 'codex-cli', action: 'gen-phases' }, { fs: fsMock, spawn }),
    ).toThrow(/Missing multishot\/project\.md/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('fails fast when phases doc missing for gen-tasks', () => {
    const fsMock = createFsMock({});
    const spawn = vi.fn();
    expect(() =>
      executePrompt({ cli: 'codex-cli', action: 'gen-tasks', phaseId: 'Phase1' }, { fs: fsMock, spawn }),
    ).toThrow(/Missing multishot\/phases\.md/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('refuses to overwrite existing phases output', () => {
    const fsMock = createFsMock({
      'multishot/project.md': '# spec',
      'multishot/phases.md': 'existing phases',
    });
    const spawn = vi.fn();
    expect(() =>
      executePrompt({ cli: 'codex-cli', action: 'gen-phases' }, { fs: fsMock, spawn }),
    ).toThrow(/Cowardly refusing to overwrite multishot\/phases\.md/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('refuses to overwrite existing phase task directory', () => {
    const fsMock = createFsMock(
      {
        'multishot/phases.md': 'id: Phase1',
        'multishot/Phase1/file.txt': 'placeholder',
      },
      ['multishot', 'multishot/Phase1'],
    );
    const spawn = vi.fn();
    expect(() =>
      executePrompt({ cli: 'codex-cli', action: 'gen-tasks', phaseId: 'Phase1' }, { fs: fsMock, spawn }),
    ).toThrow(/Cowardly refusing to overwrite multishot\/Phase1/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('requires phaseId for gen-tasks', () => {
    const fsMock = createFsMock({
      'multishot/phases.md': 'id: Phase1',
    });
    expect(() => executePrompt({ cli: 'codex-cli', action: 'gen-tasks' }, { fs: fsMock })).toThrow(
      /phaseId is required/,
    );
  });

  it('appends task context when running tasks', () => {
    const spawn = vi.fn().mockReturnValue({ status: 0 });
    const fsMock = createFsMock(
      {
        'multishot/Phase1/task1.md': 'task',
      },
      ['multishot', 'multishot/Phase1'],
    );
    const result = executePrompt(
      {
        cli: 'codex-cli',
        action: 'run-tasks',
        phaseId: 'Phase1',
        taskFile: 'multishot/Phase1/task1.md',
      },
      { spawn, fs: fsMock },
    );
    const expectedPromptAbs = path.resolve(
      process.cwd(),
      'multishot',
      '.internal',
      'execute-task.md',
    );
    expect(spawn).toHaveBeenCalledWith(
      'codex',
      [
        '--full-auto',
        '--model',
        'gpt-5-codex-low',
        'exec',
        '--sandbox',
        'danger-full-access',
        '--skip-git-repo-check',
        `Execute the prompt in ${expectedPromptAbs} for phase Phase1 task multishot/Phase1/task1.md`,
      ],
      { stdio: 'inherit' },
    );
    expect(result.phaseId).toBe('Phase1');
    expect(result.taskFile).toBe('multishot/Phase1/task1.md');
  });

  it('requires phaseId for run-tasks', () => {
    const fsMock = createFsMock({
      'multishot/Phase1/task1.md': 'task',
    });
    expect(() =>
      executePrompt(
        { cli: 'codex-cli', action: 'run-tasks', taskFile: 'multishot/Phase1/task1.md' },
        { fs: fsMock },
      ),
    ).toThrow(/phaseId is required/);
  });

  it('requires taskFile for run-tasks', () => {
    const fsMock = createFsMock({
      'multishot/Phase1/task1.md': 'task',
    });
    expect(() =>
      executePrompt({ cli: 'codex-cli', action: 'run-tasks', phaseId: 'Phase1' }, { fs: fsMock }),
    ).toThrow(/taskFile is required/);
  });

  it('errors when task file missing', () => {
    const fsMock = createFsMock({}, ['multishot', 'multishot/Phase1']);
    expect(() =>
      executePrompt(
        { cli: 'codex-cli', action: 'run-tasks', phaseId: 'Phase1', taskFile: 'multishot/Phase1/task1.md' },
        { fs: fsMock },
      ),
    ).toThrow(/Missing task file/);
  });
});

describe('listPhaseTaskFiles', () => {
  it('lists phase directories with task files', () => {
    const fsMock = createFsMock(
      {
        'multishot/Phase1/task2.md': 'task',
        'multishot/Phase1/task1.md': 'task',
        'multishot/Phase2/task1.md': 'task',
      },
      ['multishot', 'multishot/Phase1', 'multishot/Phase2'],
    );
    const result = listPhaseTaskFiles(fsMock);
    expect(result).toEqual([
      {
        phaseId: 'Phase1',
        taskFiles: ['multishot/Phase1/task1.md', 'multishot/Phase1/task2.md'],
      },
      {
        phaseId: 'Phase2',
        taskFiles: ['multishot/Phase2/task1.md'],
      },
    ]);
  });

  it('returns empty array when multishot directory missing', () => {
    const fsMock = createFsMock();
    fsMock.readdirSync = vi.fn(() => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      throw error;
    });
    expect(listPhaseTaskFiles(fsMock)).toEqual([]);
  });

  it('skips phases with no task files', () => {
    const fsMock = createFsMock(
      {
        'multishot/Phase1/readme.txt': 'info',
        'multishot/Phase2/task1.md': 'task',
      },
      ['multishot', 'multishot/Phase1', 'multishot/Phase2'],
    );
    const result = listPhaseTaskFiles(fsMock);
    expect(result).toEqual([
      {
        phaseId: 'Phase2',
        taskFiles: ['multishot/Phase2/task1.md'],
      },
    ]);
  });
});
