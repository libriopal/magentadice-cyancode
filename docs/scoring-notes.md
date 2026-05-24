# Scoring System Notes

Technical notes for developers working near the scoring subsystem.
This document is non-sacred (read-only reference).

## farkleScorer.ts

The authoritative scoring function lives in the `core/` submodule at
`core/packages/farkle-engine/src/farkleScorer.ts` (Sacred Core — read only).
It uses an exhaustive lookup table built by `core/packages/farkle-engine/src/chainIndex.ts`.

Two-Triplets `[1,1,1,2,2,2]` correctly returns 2500 (not 1200 greedy approximation).

Developers integrating with the scoring system should call `scoreFarkle()` via the
`@match3d/farkle-engine` package export — never import from the sacred file directly.
