id: ReevaluateTasks
title: Rate, split, and renumber tasks within a phase
objective: |
  Reevaluate all tasks under a target phase directory for oneshot-ability.
  Where needed, split oversized or ambiguous tasks into smaller tasks and
  rewrite/renumber the phase’s tasks in-place, maintaining valid dependencies.

instructions: |
  Scope
  - Target exactly one phase directory: `multishot/{phaseId}/` (e.g., `multishot/phase6/`). This prompt explicitly references `multishot/phaseX/` tasks to align with specs.
  - Only read from: `multishot/{phaseId}/task*.md`.
  - Write changes only within the same target phase directory.
  - Never modify files outside `multishot/{phaseId}/` and never modify `multishot/project.md`.

  Required references
  - Phase tasks: `multishot/{phaseId}/taskN.md` files are the sole inputs to reevaluate (i.e., tasks under `multishot/phaseX/`).

  Procedure (single pass)
  1) Read all tasks under `multishot/{phaseId}/` in numeric order.
  2) For each task, rate oneshot-ability based on:
     - Context size and determinism for offline execution.
     - Clarity of objective, success criteria, and logging requirements.
     - Estimated token/cost footprint given referenced assets.
  3) For any task rated risky or too large/ambiguous, split it into smaller, clearer tasks that are each oneshottable.
     - Preserve original intent and coverage.
     - Distribute work logically to minimize cross-task coupling.
  4) Rewrite the target phase’s tasks in-place:
     - Emit updated files as `multishot/{phaseId}/task1.md`, `task2.md`, ... with contiguous numbering starting at 1.
     - Update each task’s `depends_on` to reference only tasks within the same phase using the new numbering.
  5) Validate the rewritten phase:
     - All tasks exist with contiguous numbering, valid `id`/`title`/`objective`/`prompt` fields.
     - Any task splits include proportional test/validation steps.
     - No files outside `multishot/{phaseId}/` were modified.

  Output contract
  - Make changes only under `multishot/{phaseId}/`.
  - Do not modify `multishot/project.md`.
  - Print to stdout: `Success` when all validations pass; otherwise `Failure`.

inputs: |
  - `phaseId` (required): A phase identifier like `Phase6` (case-insensitive when mapping to folder `multishot/phase6/`).

validation: |
  Consider the run successful only if:
  - All tasks in `multishot/{phaseId}/` are present and renumbered contiguously starting at 1.
  - `depends_on` fields reference only tasks within the same phase using the new numbering.
  - No files outside `multishot/{phaseId}/` were changed and `multishot/project.md` was not modified.

stdout_contract: |
  Print:
  - `Success` when validations pass.
  - `Failure` otherwise.
