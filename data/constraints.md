# Execution Constraints

- All tasks must run in a non-interactive, single-pass environment.
- Only the declared languages and tools may be used.
- Use standard Linux shell commands; no `sudo` or system-wide installs.
- No network writes or external API calls outside the project directory.
- All generated code must write only within `./src/`, `./test/` or `./log/`.
- Each task must print only `"Success"` or `"Failure"` to stdout.
- Test files must be self-contained and runnable offline.
- Tasks must not access files outside the project directory.
- Never add "options" that are not specifically defined in the project.md.  Stick only to what you are being asked to do and don't cause scope creep.
- Never, ever implement a fallback unless the project.md specifically asks for one.  Stick only to what you are being asked to do and don't cause scope creep.

### Logging
- Each log must begin with the model name, version, and timestamp.
- The full prompt and raw model response must be stored in the same log file.