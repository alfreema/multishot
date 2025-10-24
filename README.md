# multishot

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen) ![Status: Alpha](https://img.shields.io/badge/status-alpha-orange)

<p align="center">
  <strong>Automate multi-phase AI project scaffolding from a single specification.</strong>
  <br />
  Generate phase plans, create executable task prompts, and run them sequentially through your preferred CLI.
  <br />
  <a href="https://github.com/alfreema/multishot/issues">File an Issue or Feature Request</a>
</p>

---

## Table of Contents

- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [CLI Options](#cli-options)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

---

## About The Project

`multishot` turns a single project specification into an actionable, multi-phase workflow for AI development. It reads your high-level goals, generates phase outlines, expands them into task prompts with logging constraints, and then executes each task sequentially through a configured AI CLI.

Key capabilities:

- Deterministic generation of `multishot/phases.md` from `multishot/project.md`
- Per-phase task prompt creation under `multishot/Phase*/task*.md`
- Sequential task execution that halts on the first failure and surfaces the offending phase/task
- Strict adherence to logging rules and the Success/Failure stdout contract

### Built With

- [Node.js](https://nodejs.org/) (18+)
- [Commander](https://github.com/tj/commander.js)
- [Vitest](https://vitest.dev/)

---

## Getting Started

### Prerequisites

- Codex CLI
- Node.js 18 or later
- A project specification stored at `multishot/project.md` (see `docs/sample-project.md` for inspiration)

### Installation

```bash
# install the CLI globally from GitHub
npm install -g alfreema/multishot

# verify the command is on your path
multishot --help
```

---

## Usage

```bash
# generate phase plan
multishot --gen-phases

# generate task prompts for every phase
multishot --gen-tasks

# execute all task prompts sequentially
multishot --run-tasks

# execute only a single phase
multishot --run-phase "Phase 1"
```

### CLI Options

- `--cli <codex-cli>`  
  Selects the backing AI CLI. Defaults to `codex-cli` (currently the only supported integration).

- `--gen-phases`  
  Reads `multishot/project.md` and produces `multishot/phases.md`.

- `--gen-tasks`  
  Scans `multishot/phases.md`, generates per-phase prompts under `multishot/PhaseX/taskY.md`, and stops if any target directory already exists.

- `--run-tasks`  
  Iterates every generated task prompt (`multishot/PhaseX/taskY.md`), executing them through the configured CLI until completion or the first failure.

- `--run-phase <phase>`  
  Executes all tasks for a single phase, by phase name (e.g., `--run-phase "Phase 1"`).

---

## Roadmap

- [ ] Support additional CLI integrations (Claude, OpenAI realtime, etc.)
- [ ] Rich status reporting and summaries after task execution
- [ ] Optional retries for infra-classified failures

See the [open issues](https://github.com/alfreema/multishot/issues) for a full list of proposed features and known issues.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/my-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git push origin feat/my-feature`)
5. Open a Pull Request

Please open an issue first to discuss major changes or architectural shifts.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

Aaron Freeman - [GitHub](https://github.com/alfreema)

Project Link: [https://github.com/alfreema/multishot](https://github.com/alfreema/multishot)

---

## Acknowledgments

- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
- [Commander.js](https://github.com/tj/commander.js)
- [Vitest](https://vitest.dev/)
