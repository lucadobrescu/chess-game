# ADR 0002: Plain script files with global game registry

## Status

Accepted

## Context

The arcade needs multiple games with a shared shell. The repo has no package manager, bundler, or module system today — just `<script src="chess.js">`.

## Decision

Split into plain script files loaded in order, exposing a global game registry:

```
js/shell.js        — App Shell, skin loader, game picker
js/chess-game.js   — Chess (refactored from chess.js)
js/pingpong-game.js — Ping-Pong (new)
js/app.js          — Registry + mount/switch logic
```

Each game exports `{ id, name, init(mountEl), destroy() }` on a shared `window.ArcadeGames` object.

## Consequences

- No build step; open `index.html` directly still works.
- Script load order matters — `app.js` must load last.
- No `import`/`export`; rely on explicit global namespace.
- Slightly less ergonomic than ES modules, but proportional to repo size.

## Alternatives considered

- **Native ES modules** — cleaner, but `file://` CORS issues when opening HTML locally without a server.
- **Vite/npm** — best DX, but heavy for a 3-file hobby project.
- **Single-file visibility toggle** — fastest, but doesn't scale and duplicates shell logic.
