# Generate Tasks Prompt

Read `multishot/phases.md` to enumerate phases and their goals. Follow the Task Specification below for the required task schema and field formatting. Incorporate the project context from `multishot/project.md` while honoring every rule in the Constraints section below.

When provided a phase identifier (e.g., `Phase1`), create or overwrite the task prompt files under `multishot/{phaseId}/taskN.md`. Generate one file per task described for that phase, ensuring each includes the fields `id`, `title`, `depends_on`, `objective`, `success_criteria`, `prompt`, `logging`, and `constraints` exactly as specified in Task Specification below.

Within each task's `prompt`, instruct the executor to log to `multishot/{phaseId}/taskN.log`, starting the log with its model identifier and timestamp, capturing the full prompt and raw response, respecting the offline single-pass constraint, and printing only "Success" or "Failure" to stdout.

Do not modify any input references (`multishot/phases.md` or `multishot/project.md`) or files outside `multishot/{phaseId}/`. Only create or overwrite the task files for the requested phase.

After generating every task file for the chosen phase, verify the schema and constraint compliance, then emit the mandated single-line completion status.

Every task file must include the Constraints section below.

# Task Specification

## Format
Each task file resides under `multishot/phase[x]/task[y].md`.

### Required Fields
- **id:** Unique task identifier (e.g., `Task6`)
- **title:** Descriptive title
- **depends_on:** Optional list of task IDs required before this one
- **objective:** What the task must accomplish
- **success_criteria:** Explicit, testable conditions for success
- **prompt:** Instruction for the model (e.g., gpt-5-codex-low)
- **logging:** Path for logs (`multishot/phase[x]/task[y].log`)
- **constraints:** All prompts must conform to the Constraints section below.

### Example
---
id: Task6
title: Implement and test dispatcher registration
depends_on: [Task3, Task4]
objective: Register all ops in the central dispatcher file and verify registration via automated tests.
success_criteria:
  - The generated test file runs successfully with `pytest`.
  - All ops are verified as correctly registered.
  - The test run exits with code 0.
prompt: >
  Write C++ code registering ops using TORCH_LIBRARY in src/torch.cpp.
  Then, generate a pytest test file that validates each op registration.
  Run the test and confirm it exits with code 0.
logging: log/phase2/task6.log

# Constraints

- All tasks must run in a non-interactive, single-pass environment.
- Only the declared languages and tools may be used.
- Use standard Linux shell commands; no `sudo` or system-wide installs.
- No network writes or external API calls outside the project directory.
- Each task must print only `"Success"` or `"Failure"` to stdout.
- Test files must be self-contained and runnable offline.
- Tasks must not access files outside the project directory.
- Never add "options" that are not specifically defined in the project.md.  Stick only to what you are being asked to do and don't cause scope creep.
- Never, ever implement a fallback unless the project.md specifically asks for one.  Stick only to what you are being asked to do and don't cause scope creep.

### Logging
- Each log must begin with the model name, version, and timestamp.
- The full prompt and raw model response must be stored in the same log file.