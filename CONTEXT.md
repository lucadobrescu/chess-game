# Chess Game Arcade

A Roman-themed browser arcade hosting multiple local two-player games under one shared shell.

## Language

**App Shell**:
The persistent frame around every game — background scene, skin pickers, game selector, and shared chrome.
_Avoid_: Layout, wrapper, container

**Game**:
A top-level playable experience the user picks from the arcade (e.g. Chess, Ping-Pong).
_Avoid_: Mode, module, plugin

**Variant**:
A rules or setup configuration within a single Game (e.g. Standard and Freestyle within Chess).
_Avoid_: Mode (at the arcade level), ruleset

**Match**:
A single play session from start to win/reset within a Game. Match wins may accumulate across resets.
_Avoid_: Round, game (ambiguous with Game)

**Ludus**:
The in-app label for starting a new match (from the existing "Novus Ludus" reset button).
_Avoid_: New game, restart

**Freestyle (variant)**:
A Chess variant where the back rank is randomly shuffled (bishops on opposite colors, king between rooks) while all other rules match Standard.
_Avoid_: Chess960 (implies full FIDE castling rules), custom setup, Fischer Random

**Ping-Pong**:
A real-time arcade Game rendered on canvas with keyboard-controlled paddles (W/S vs arrow keys).
_Avoid_: Table tennis, pong (lowercase, ambiguous with sound effect)
