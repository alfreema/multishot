import { describe, it, expect, vi } from 'vitest';
import { parseArgs, run } from '../src/cli.js';

describe('CLI parsing', () => {
  it('parses valid command with explicit cli', () => {
    const argv = ['node', 'multishot', '--cli', 'codex-cli', '--gen-phases'];
    const result = parseArgs(argv);
    expect(result).toEqual({ kind: 'command', cli: 'codex-cli', action: 'gen-phases' });
  });

  it('defaults cli to codex-cli when omitted', () => {
    const argv = ['node', 'multishot', '--gen-phases'];
    const result = parseArgs(argv);
    expect(result).toEqual({ kind: 'command', cli: 'codex-cli', action: 'gen-phases' });
  });

  it('parses gen-tasks flag', () => {
    const argv = ['node', 'multishot', '--gen-tasks'];
    const result = parseArgs(argv);
    expect(result).toEqual({ kind: 'command', cli: 'codex-cli', action: 'gen-tasks' });
  });

  it('parses run-phase flag with phaseId', () => {
    const argv = ['node', 'multishot', '--run-phase', 'Phase1'];
    const result = parseArgs(argv);
    expect(result).toEqual({
      kind: 'command',
      cli: 'codex-cli',
      action: 'run-phase',
      phaseId: 'Phase1',
    });
  });

  it('returns help when no arguments provided', () => {
    const argv = ['node', 'multishot'];
    const result = parseArgs(argv);
    expect(result.kind).toBe('help');
    expect(result.helpText).toContain('Usage');
  });

  it('throws when multiple command flags provided', () => {
    const argv = ['node', 'multishot', '--cli', 'codex-cli', '--gen-phases', '--run-tasks'];
    expect(() => parseArgs(argv)).toThrow(/Only one action flag/);
  });

  it('supports help flag', () => {
    const argv = ['node', 'multishot', '--help'];
    const result = parseArgs(argv);
    expect(result.kind).toBe('help');
    expect(result.helpText).toContain('Usage');
  });
});

describe('CLI runner', () => {
  const createIO = () => {
    const out = [];
    const err = [];
    return {
      stdout: { write: (msg) => out.push(msg) },
      stderr: { write: (msg) => err.push(msg) },
      out,
      err,
    };
  };

  it('delegates to orchestrator for gen-phases', () => {
    const io = createIO();
    const orchestrator = {
      runGenPhases: vi.fn((ctx) => {
        ctx.onBeforeSpawn?.({
          command: 'codex',
          args: ['--sample'],
        });
        return { code: 0, detail: { code: 0 } };
      }),
      runGenTasks: vi.fn(),
      runTasks: vi.fn(),
    };
    const argv = ['node', 'multishot', '--cli', 'codex-cli', '--gen-phases'];
    const result = run(argv, io, { orchestrator, fs: {} });
    expect(result.code).toBe(0);
    expect(orchestrator.runGenPhases).toHaveBeenCalledWith(
      expect.objectContaining({ cli: 'codex-cli', fs: {} }),
    );
    expect(io.out.join('')).toContain('Executing: codex --sample');
  });

  it('prints orchestrator error messages', () => {
    const io = createIO();
    const orchestrator = {
      runGenPhases: vi.fn(),
      runGenTasks: vi.fn(() => ({ code: 1, errorMessage: 'no phases', phases: [] })),
      runTasks: vi.fn(),
    };
    const argv = ['node', 'multishot', '--gen-tasks'];
    const result = run(argv, io, { orchestrator, fs: {} });
    expect(result.code).toBe(1);
    expect(io.err.join('')).toContain('no phases');
  });

  it('returns orchestrator results for run-tasks', () => {
    const io = createIO();
    const orchestrator = {
      runGenPhases: vi.fn(),
      runGenTasks: vi.fn(),
      runTasks: vi.fn(() => ({
        code: 0,
        phases: [{ phaseId: 'Phase1', tasks: [{ taskFile: 'task1', code: 0 }] }],
      })),
    };
    const argv = ['node', 'multishot', '--run-tasks'];
    const result = run(argv, io, { orchestrator, fs: {} });
    expect(result.code).toBe(0);
    expect(orchestrator.runTasks).toHaveBeenCalledWith(
      expect.objectContaining({ cli: 'codex-cli' }),
    );
    expect(result.result.phases).toEqual([
      { phaseId: 'Phase1', tasks: [{ taskFile: 'task1', code: 0 }] },
    ]);
  });

  it('delegates to orchestrator for run-phase', () => {
    const io = createIO();
    const orchestrator = {
      runGenPhases: vi.fn(),
      runGenTasks: vi.fn(),
      runTasks: vi.fn(),
      runPhase: vi.fn(() => ({
        code: 0,
        phases: [{ phaseId: 'Phase1', tasks: [{ taskFile: 'task1', code: 0 }] }],
      })),
    };
    const argv = ['node', 'multishot', '--run-phase', 'Phase1'];
    const result = run(argv, io, { orchestrator, fs: {} });
    expect(result.code).toBe(0);
    expect(orchestrator.runPhase).toHaveBeenCalledWith(
      expect.objectContaining({ cli: 'codex-cli' }),
      'Phase1',
    );
    expect(result.result.phases).toEqual([
      { phaseId: 'Phase1', tasks: [{ taskFile: 'task1', code: 0 }] },
    ]);
  });

  it('writes error message for invalid cli usage', () => {
    const io = createIO();
    const argv = ['node', 'multishot', '--cli'];
    const result = run(argv, io);
    expect(result.code).toBe(1);
    expect(io.err.join('')).toMatch(/argument missing/);
  });

  it('prints usage when no arguments are provided', () => {
    const io = createIO();
    const argv = ['node', 'multishot'];
    const result = run(argv, io);
    expect(result.code).toBe(0);
    expect(io.out.join('')).toMatch(/Usage/);
  });
});
