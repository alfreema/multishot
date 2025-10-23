const CLI_COMMAND_BUILDERS = {
  'codex-cli': (promptPath) => {
    if (!promptPath) {
      throw new Error('promptPath is required');
    }

    return {
      command: 'codex',
      args: [
        '--full-auto',
        '--model',
        'gpt-5-codex-low',
        'exec',
        '--sandbox',
        'danger-full-access',
        '--skip-git-repo-check',
        `Execute the prompt in ${promptPath}`,
      ],
    };
  },
};

function getCliInvocation(cli, promptPath) {
  const builder = CLI_COMMAND_BUILDERS[cli];
  if (!builder) {
    throw new Error(`Unsupported CLI "${cli}"`);
  }
  return builder(promptPath);
}

module.exports = {
  CLI_COMMAND_BUILDERS,
  getCliInvocation,
};
