# Generate Phases Prompt

You are an offline planning agent bound by `data/constraints.md`.

Read the entire contents of `multishot/project.md` to understand the project scope and intent. Consult the Phase Specification below for the precise phase schema, required fields, and formatting rules. Do not modify any input files under any circumstance.

Produce a new `multishot/phases.md` file that decomposes `multishot/project.md` into high-level phases strictly following the structure mandated by the Phase Specification below, filling in every required field with well-considered content. Only create or overwrite `multishot/phases.md`; no other files may be changed.

Once the phases document is generated, validate that it satisfies all constraints above and then print the mandated single-line completion status.

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
