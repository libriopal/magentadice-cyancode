# Roadmap 01 — Current Sprint (T9 Completion)

**Date:** 2026-05-25 | **Branch:** tier/T9-social-platform-liveops-20260525

## T9 Completion Sequence

1. `pnpm type-check` in core/ — verify 0 new errors from classArchetype import
2. `pnpm test` + `node --import tsx/esm --test twoPlayer.determinism.test.ts` — must pass (44/44)
3. Commit core submodule: `tier(T9): social-platform-liveops — postHogTrack, classArchetype, MATCH_SCORE fix, determinism test`
4. Write `docs/adr/ADR-020-t9-social-platform-liveops.md`
5. Run 6 audit cells → `runs/2026-05-25/session-13.json`
6. Append Session 13 to `sessions/session-log.md`
7. Update `handoff/01–05` for T9
8. Commit integration repo artifacts (audit/, design/, roadmap/, tests/ included)
9. Push → `gh pr create` → PR #19

## Success Criteria

All T9 pass gates green. PR #19 opened. EXECUTE.md decision tree reaches HALT state.
