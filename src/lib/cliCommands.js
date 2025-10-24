const CLI_COMMAND_BUILDERS = {
  'codex-cli': (promptPath, opts = {}) => {
    if (!promptPath) {
      throw new Error('promptPath is required');
    }

    const model = opts.model || 'gpt-5-codex-low';

    return {
      command: 'codex',
      args: [
        '--full-auto',
        '--model',
        model,
        'exec',
        '--sandbox',
        'danger-full-access',
        '--skip-git-repo-check',
        `Execute the prompt in ${promptPath}`,
      ],
    };
  },
};

function getCliInvocation(cli, promptPath, opts = {}) {
  const builder = CLI_COMMAND_BUILDERS[cli];
  if (!builder) {
    throw new Error(`Unsupported CLI "${cli}"`);
  }
  return builder(promptPath, opts);
}

module.exports = {
  CLI_COMMAND_BUILDERS,
  getCliInvocation,
};

