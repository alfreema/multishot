import { describe, it, expect } from 'vitest';
import { getCliInvocation } from '../../src/lib/cliCommands.js';

describe('getCliInvocation', () => {
  it('returns codex-cli command template with prompt path', () => {
    const invocation = getCliInvocation('codex-cli', 'docs/specs/phase7/task3.md');
    expect(invocation.command).toBe('codex');
    expect(invocation.args).toEqual([
      '--full-auto',
      '--model',
      'gpt-5-codex-low',
      'exec',
      '--sandbox',
      'danger-full-access',
      '--skip-git-repo-check',
      'Execute the prompt in docs/specs/phase7/task3.md',
    ]);
  });

  it('throws for missing prompt path', () => {
    expect(() => getCliInvocation('codex-cli')).toThrow(/promptPath is required/);
  });

  it('errors for unsupported cli', () => {
    expect(() => getCliInvocation('unknown-cli', 'foo')).toThrow(/Unsupported CLI/);
  });
});
