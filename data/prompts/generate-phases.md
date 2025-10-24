# Generate Phases Prompt

Read the entire contents of `multishot/project.md` to understand the project scope and intent. Consult the Phase Specification below for the precise phase schema, required fields, and formatting rules. Do not modify any input files under any circumstance.

Produce a new `multishot/phases.md` file that decomposes `multishot/project.md` into high-level phases strictly following the structure mandated by the Phase Specification below, filling in every required field with well-considered content. Only create or overwrite `multishot/phases.md`; no other files may be changed.

These phases will be broken into task prompts in a later step and those task prompts will each require to be verified, preferably with a test of some sort like pytest, vitest, jest, etc.  So make sure the first phase sets up an environment including a test library of some sort.

If the project involves python, check to see if you are in a virtual environment -- if so the first phase should include installing pytest and any other packages that make sense for the project. Liberal use of pre-existing packages to solve common problems is strongly encouraged. Don't install any packages globally however.

If the project involves node project, the first phase should include installing vitest (or jest) and any other packages that make sense for the project. Liberal use of pre-existing packages to solve common problems is strongly encouraged. Don't install any packages globally however.

Once the phases document is generated, validate that it satisfies all constraints above and then print the completion status.


# Phase Specification

## Format
Each phase is written in Markdown and begins with a header:

Phase[X]: [Phase Title]

### Required Fields
- **id:** Unique phase identifier (e.g., `Phase1`)
- **title:** Descriptive title of the phase
- **languages:** Programming language(s) used in this phase
- **tests:** Primary test framework(s)
- **objective:** Concise description of what the phase achieves
- **notes:** Any relevant implementation or environment notes

### Example
---
id: Phase2
title: Implement Core Dispatcher
languages: [Python, C++]
tests: [pytest]
objective: Integrate custom dispatcher with autograd routing.
notes: Ensure compatibility with PyTorch 2.x dispatch mechanisms.

# Constraints

- Only the declared languages and tools may be used.
- Use standard Linux shell commands; no `sudo` or system-wide installs.
- Test files must be self-contained and runnable offline.
- Never add "options" that are not specifically defined in the project.md.  Stick only to what you are being asked to do and don't cause scope creep.
- Never implement a fallback unless the project.md specifically asks for one.  Stick only to what you are being asked to do and don't cause scope creep.
