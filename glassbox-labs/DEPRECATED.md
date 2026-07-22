# ⚠ DEPRECATED — superseded by `../glassbox-forest`

`glassbox-labs/` is the **historical predecessor** of the GLASSBOX ecosystem. It is no longer the
active project and receives no new work. It is kept for provenance/reference only.

**Active project:** [`../glassbox-forest`](../glassbox-forest) — the reimagined ecosystem
(D2 geometry, seeded branch generator, FOREST evidence ledger + persistent journal, six playable
experiments across all five competency families, budget-isolated Cohere proposer, themed HD 2D visuals +
audio). Every capability that lived here has been reimplemented there, with governance carried verbatim.

## What moved to glassbox-forest
| glassbox-labs (here) | glassbox-forest (active) |
|---|---|
| One-Roll · Keeper · Call Your Shot | recreated + Hold the Crown, Author's Gambit, Transmute |
| evidence store + survey + Sparks | persistent event-sourced journal (survives reloads) |
| forbidden-field strip · region gate · consent | carried verbatim |
| execution audit | ecosystem execution audit |
| governance/ constitution + gates | carried verbatim (single source of truth) |

## Why it's kept, not deleted
Deleting a working, tested subtree is a semi-irreversible action; git history preserves it regardless.
If you want it removed from the working tree, that's a one-line `git rm -r glassbox-labs` — say the word.

Do not build new features here. Point tooling, CI, and agents at `glassbox-forest`
(see `glassbox-forest/CLAUDE.md`, the operating manual of record).
