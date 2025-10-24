id: ReevaluateTasks
title: Rate, split, and renumber tasks within a phase
objective: |
  Reevaluate all tasks under a target phase directory for oneshot-ability.
  Where needed, split oversized or ambiguous tasks into smaller tasks and
  rewrite/renumber the phase’s tasks in-place, maintaining valid dependencies.

instructions: |
  Scope
  - Target exactly one phase directory: `docs/specs/{phaseId}/` (e.g., `docs/specs/phase6/`). This prompt explicitly references `docs/specs/phaseX/` tasks to align with specs.
  - Only read from: `docs/specs/{phaseId}/task*.md` and `docs/task-spec.md`.
  - Write changes only within the same target phase directory.
  - Never modify files outside `docs/specs/{phaseId}/` and never modify `docs/project.md`.

  Required references
  - Task schema: `docs/task-spec.md` (required fields, numbering rules, depends_on semantics).
  - Phase tasks: `docs/specs/{phaseId}/taskN.md` files are the sole inputs to reevaluate (i.e., tasks under `docs/specs/phaseX/`).

  Procedure (single pass)
  1) Load `docs/task-spec.md` and validate that each task file conforms to the required fields.
  2) Read all tasks under `docs/specs/{phaseId}/` in numeric order.
  3) For each task, rate oneshot-ability based on:
     - Context size and determinism for offline execution.
     - Clarity of objective, success criteria, and logging requirements.
     - Estimated token/cost footprint given referenced assets.
  4) For any task rated risky or too large/ambiguous, split it into smaller, clearer tasks that are each oneshottable.
     - Preserve original intent and coverage.
     - Distribute work logically to minimize cross-task coupling.
  5) Rewrite the target phase’s tasks in-place:
     - Emit updated files as `docs/specs/{phaseId}/task1.md`, `task2.md`, ... with contiguous numbering starting at 1.
     - Update each task’s `depends_on` to reference only tasks within the same phase using the new numbering.
  6) Validate the rewritten phase:
     - All tasks exist with contiguous numbering, valid `id`/`title`/`objective`/`prompt` fields.
     - Any task splits include proportional test/validation steps.
     - No files outside `docs/specs/{phaseId}/` were modified.

  Output contract
  - Make changes only under `docs/specs/{phaseId}/`.
  - Do not modify `docs/project.md`.
  - Print exactly one line to stdout: `Success` when all validations pass; otherwise `Failure`.

inputs: |
  - `phaseId` (required): A phase identifier like `Phase6` (case-insensitive when mapping to folder `docs/specs/phase6/`).

validation: |
  Consider the run successful only if:
  - All tasks in `docs/specs/{phaseId}/` are present and renumbered contiguously starting at 1.
  - `depends_on` fields reference only tasks within the same phase using the new numbering.
  - The rewritten tasks adhere to `docs/task-spec.md`.
  - No files outside `docs/specs/{phaseId}/` were changed and `docs/project.md` was not modified.

stdout_contract: |
  Print exactly one line:
  - `Success` when validations pass.
  - `Failure` otherwise.
