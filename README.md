# **multishot**

**multishot** transforms a single project spec into a structured, executable workflow for AI development.
It generates clear phases, organized tasks, and runs each step automatically through your chosen AI CLI.

## **Install**

```bash
# global install directly from GitHub
npm install -g alfreema/multishot

# verify the CLI is on your PATH
multishot --help
```

## **Prerequisite**

- User must create a `multishot/project.md` that thoroughly describes a project that they want to create.  
- See `docs/sample-project.md` for a thorough example.

## **Usage**

```bash
multishot --gen-phases
multishot --gen-tasks
multishot --run-tasks
```

### **Options**

* `--cli`
  Specifies which CLI integration to use. Defaults to `codex-cli`.
  Allowed values: `codex-cli`

* `--gen-phases`
  Processes `multishot/project.md` and generates a high-level list of phases in `multishot/phases.md`.

* `--gen-tasks`
  Processes each phase declared in `multishot/phases.md` and creates individual task files under `multishot/PhaseX/taskY.md`.

* `--run-tasks`
  Sequentially executes the prompts in each generated `multishot/PhaseX/taskY.md` file, stopping on the first failure.
