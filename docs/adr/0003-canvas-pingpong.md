# ADR 0003: Canvas keyboard Ping-Pong

## Status

Accepted

## Context

Ping-Pong needs real-time ball physics unlike Chess's turn-based DOM board. Issue #1 asks for ping-pong alongside chess.

## Decision

Implement Ping-Pong as a `<canvas>` game with `requestAnimationFrame` loop. Player 1 uses W/S keys; Player 2 uses ↑/↓. Score to 11, win by 2.

## Consequences

- Chess and Ping-Pong have cleanly separated render paths (DOM vs canvas).
- Keyboard listeners attach on `init()` and detach on `destroy()` to avoid leaks when switching games.
- Roman theme applies to canvas border/chrome via CSS; court drawn in canvas.
- Match-win tracking can mirror chess's `matchWins` pattern per game.

## Alternatives considered

- **Div/CSS paddles** — simpler but awkward physics and touch/keyboard conflicts.
- **Endless scoring** — rejected; doesn't match arcade score panel pattern.
