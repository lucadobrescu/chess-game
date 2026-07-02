# ADR 0001: Multi-game arcade with shared App Shell

## Status

Accepted

## Context

The repo started as a single chess page (`index.html` + `chess.js`). Two feature requests arrived: add ping-pong (#1) and add freestyle chess (#2). The current code has no game registry, lifecycle hooks, or separation between shared UI and game logic.

## Decision

Evolve the app into a **multi-game arcade** where Chess and Ping-Pong are peer **Games** selected from a shared **App Shell**. Freestyle chess is a **Variant** inside Chess, not a third top-level game.

## Consequences

- Introduce a game registry and `init` / `destroy` lifecycle per game.
- Refactor `chess.js` out of auto-starting on page load; the shell mounts the active game.
- Ping-pong gets its own module and mount point; chess-specific panels hide when ping-pong is active.
- Freestyle work stays scoped to the chess module (setup + rules), avoiding a third arcade entry.

## Alternatives considered

- **Chess-first with ping-pong as easter egg** — rejected; issue #1 implies equal visibility.
- **Freestyle as a top-level game** — rejected; it shares board, pieces, and most rules with standard chess.
