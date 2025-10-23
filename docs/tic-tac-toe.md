# Tic-Tac-Toe (Terminal) — Python Edition

## Goal

Build a **player vs. computer** tic-tac-toe game that runs fully in the terminal (ASCII/ANSI). The **game logic** is cleanly separated from the **rendering/IO layer**, so you can later swap the UI (e.g., curses, web, or tests) without touching the rules engine.

## Features (MVP)

* 3×3 board, X (human) goes first by default.
* Computer plays **randomly** into any open square.
* Clear **win/draw** detection.
* **Pure terminal** UI with optional ANSI colors.
* **Zero runtime deps** (standard library only).

## Architecture

**Layers**

1. **Core (Game Logic)** — Pure, deterministic, no IO:

   * `Board` model: state, valid moves, apply move, winner/draw checks.
   * `Game` controller: turn order, applies strategies (human/computer), produces immutable “snapshots” to render.
2. **Strategy** — Pluggable move selection:

   * `RandomAI` (MVP): chooses randomly from legal moves.
   * (Future) `MinimaxAI`.
3. **UI (Presentation)** — All IO and visuals:

   * `AsciiRenderer`: converts snapshots into strings with optional ANSI.
   * `CliController`: handles user input, prints frames, calls `Game` methods.

## Visuals (ASCII/ANSI)

* Board characters: `X`, `O`, `·` (dot) for empty.
* Grid example:

```
 X | · | O
---+---+---
 · | X | ·
---+---+---
 O | · | ·
```

* Optional ANSI: color X as bright cyan, O as bright magenta; highlight last move.

## Game Loop (CLI)

1. Render board + status.
2. If terminal state (win/draw), exit.
3. If **human turn**: prompt `row col` (1–3), map to 0–2, validate, apply.
4. If **computer turn**: call `RandomAI.select_move(board)`, apply.
5. Repeat.

## Testing

* `test_board.py`: legal moves on empty/full boards; win detection (rows/cols/diagonals); immutability (set returns new board).
* `test_game.py`: turn alternation; illegal move raises; terminal states.
* `test_random_ai.py`: chosen move ∈ legal moves; never chooses illegal.
* Run with `pytest`.

## How to Run

```bash
python -m tic_tac_toe.main
```
