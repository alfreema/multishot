id: ExecuteTask
title: Execute a single task offline and log transcript
objective: |
  Given a task file path like `docs/specs/phaseX/taskY.md`, execute the task
  in a single, non-interactive pass, write a full
  append-only transcript to `log/phaseX/taskY.log`, and print exactly one line
  to stdout: `Success` on valid completion or `Failure` otherwise.

instructions: |
  Inputs
  - `task_file`: A path like `docs/specs/phaseX/taskY.md` containing fields such as
    `id`, `title`, `objective`, `prompt`, `logging`, and `constraints`.

  Steps (single pass)
  1) Parse `task_file` and extract the full task prompt (treat everything under its `prompt:` as the task body).
  2) Begin append-only logging to `log/phaseX/taskY.log` where `phaseX/taskY` matches the `task_file` path.
     - Prepend a header with:
       - `model:` your model identifier
       - `version:` your model/runtime version
       - `timestamp:` ISO8601 UTC timestamp
     - Then write the full task prompt body (verbatim).
  3) Execute the task fully offline in one pass.
  4) Append raw outputs to the same log under a clear section.
  5) Append a final `result:` classification line with one of:
     `success|model_failure|test_failure|infra_failure|executor_failure`.
  6) Print exactly one line to stdout:
     - `Success` if the task completed and all validations passed.
     - `Failure` otherwise.

  Logging requirements
  - Always append to `log/phaseX/taskY.log`; never truncate existing content.
  - The log must contain, in order:
    1) Header (model, version, ISO8601 timestamp)
    2) Full task prompt body
    3) Raw outputs from execution
    4) A single `result:` classification line

  Prohibitions
  - Do not modify any input docs, including `docs/project.md`, specs, or constraints.
  - Do not write files outside `log/phaseX/taskY.log` for this execution.
  - Do not perform network calls or non-declared tools.

validation: |
  Consider the run successful only if:
  - The log file exists at the derived `log/phaseX/taskY.log` path.
  - The log begins with a header that includes `model`, `version`, `timestamp` (ISO8601),
    followed by the full task prompt body, raw outputs, and a `result:` line.
  - No input documents were modified.
  - Stdout contained exactly one of: `Success` or `Failure`.

stdout_contract: |
  Print exactly one line:
  - `Success` when validations pass.
  - `Failure` otherwise.

# Execution Constraints

- Only the declared languages and tools may be used.
- Use standard Linux shell commands; no `sudo` or system-wide installs.
- No network writes or external API calls outside the project directory.
- Test files must be self-contained and runnable offline.
- Tasks must not access files outside the project directory.
- Never add "options" that are not specifically defined in the project.md.  Stick only to what you are being asked to do and don't cause scope creep.
- Never, ever implement a fallback unless the project.md specifically asks for one.  Stick only to what you are being asked to do and don't cause scope creep.

### Logging
- Each log must begin with the model name, version, and timestamp.
- The full prompt and raw model response must be stored in the same log file.