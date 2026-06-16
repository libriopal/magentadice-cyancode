# START_WORKFLOW_ANALYSIS.md
# Phase 4 — Current Workflow Bottleneck Audit
# Generated: 2026-06-14 | Source: start.sh (31 lines), session-log.md, session evidence

---

## start.sh as-is

```bash
# Every session runs these 5 steps in order:
1. git submodule status
2. ./manifest.sh status
3. [conditional] ./scripts/bito-pre-merge-check.sh  (only if diff touches core/ or dream/)
4. Conditional sandbox server start on port 3001 (live curl health check to /api/governance/health)
5. claude --permission-mode plan "read CLAUDE.md, core/.ff-core-lock, and roadmap/01-current-sprint.md..."
```

31 lines total. The launch prompt in step 5 is hardcoded.

---

## What happens after start.sh runs (actual evidence from session-log)

Every session entry (Sessions 3–18) begins with the same pattern:

```
Session N: [Claude reads CLAUDE.md + .ff-core-lock + roadmap/01-current-sprint.md]
→ 3 manual file reads, each 50–300 lines
→ Sprint status is derived by parsing 300-line roadmap file
→ Sacred files are located by parsing a 54-line lock file
→ Pending bito findings are located by listing codex_pr/
→ ADR status located by ls docs/adr/ and reading latest ADR file
→ Session begins ~5 context reads later
```

That 5-read startup sequence occurs in every recorded session. It is not a symptom of bad prompting — it is the minimum context load to understand the project state.

---

## Bottleneck 1: Hardcoded sprint context

The launch prompt says: "read roadmap/01-current-sprint.md"
But roadmap/01-current-sprint.md is 312 lines, currently describing P0–P6 plus deferred items.
Only the CURRENT sprint (P6) is active. Claude reads all 312 lines to determine this.

**Measured cost**: ~3-4 exchanges before reaching actual work content.

**Fix**: Dynamic prompt injection — extract current sprint name, branch, and status
at start.sh launch time and pass them directly in the prompt string.
No file reads required for sprint orientation.

---

## Bottleneck 2: Sacred file boundary lookup is manual every session

`.ff-core-lock` lists 13 CORE SACRED files + 17 SURFACE files.
At the start of any session that might touch files, Claude reads this file.
There is no programmatic way to ask "is file X sacred?" without reading the whole lock.

**Measured cost**: 1 file read per session, but more importantly: cognitive load.
The P6 calibrate-threshold.ts workaround script was created specifically to AVOID
touching monteCarlo.ts, but verifying that boundary still required reading the lock.

**Fix**: `./start.sh` can output sacred file list in the launch prompt dynamically.
Or: a `sacred-check <file>` script (10 lines) answers the question programmatically.

---

## Bottleneck 3: Pending bito findings require directory listing

At session start, Claude lists codex_pr/ to find pending bito results.
With 18 files in codex_pr/, the listing is meaningful but noisy.
The actual question is: "is there a pending bito result from the CURRENT branch?"

**Fix**: `./start.sh` can run `ls codex_pr/ | grep $(git branch --show-current)`
and surface only the current-branch result in the launch prompt.

---

## Bottleneck 4: sandbox server conditional startup (status: resolved as of 2026-06-16)

NOTE: This analysis described the 31-line start.sh at audit time. The current start.sh (112 lines)
conditionally starts the sandbox server: it checks `core/apps/server/dist/index.js` exists,
checks if port 3001 already responds (to avoid orphan processes), spawns the server with a
trap-based teardown, and polls up to 5s for bind. The COHERE health is fetched live.

The remaining question is whether this conditional approach is sufficient:
- If `core/apps/server/dist/index.js` does not exist (not built), the server is skipped silently.
- The conditional means sandbox-ui is still not guaranteed to be running at session start.
- `pnpm build` in core/ is a prerequisite that start.sh does not enforce.

**Current status**: Conditional startup exists. Unconditional startup would require ensuring the
build is always up-to-date, which is a separate concern from the launcher itself.

---

## Bottleneck 5: COHERE box is decorative

Lines 20–27 of start.sh print a static governance box with no live check.
No Cohere API call is made. The COHERE_IMPLEMENTATION_SUMMARY.md referenced is never read.

This is pure visual noise. It was useful when the Cohere integration was fresh;
it is now a stale echo statement that implies governance is running when it is not.

**Fix**: Either remove it or replace it with a live check that actually validates
that the governance layer is operational before Claude starts.

---

## What the workflow does well (do not change)

1. **Bito pre-merge check**: Only runs when diff touches core/ or dream/. Correct.
2. **Submodule status check**: Critical — tells Claude immediately if submodules are behind.
3. **Permission mode = plan**: Forces proposal-before-action. This has prevented every
   accidental sacred-file write in 18+ sessions. **Do not change this.**
4. **Launch prompt**: Explicitly forbids sacred-file modification before human authorization.
   This one line has governed every session. It must remain.

---

## Workflow friction map

| Step | Friction | Severity | Fix Complexity |
|------|----------|----------|----------------|
| Sprint context load | 300-line file read every session | Medium | Low (5-line start.sh injection) |
| Sacred boundary check | Manual lock file read | Medium | Low (10-line script) |
| Pending bito lookup | Directory listing + grep | Low | Low (2-line start.sh change) |
| Sandbox server | Never started, breaks sandbox-cli | High | Medium (requires server startup) |
| COHERE box | Decorative, implies false governance | Low | None (delete 8 lines) |
| Session orientation | 5-read startup sequence | Medium | Solved by above 3 fixes |

---

## Summary

The current workflow is effective but requires a 3–5 read startup sequence every session.
The three highest-ROI fixes are all in start.sh and require <20 lines of bash.

The sandbox-ui non-use is a consequence of bottleneck 4 (server never started),
not a consequence of the UI being bad. If the sandbox-ui is going to be used,
the server must be integrated into start.sh. This is the highest-friction gap.

**Net recommendation**: start.sh enhancement delivers 80% of the workflow improvement
with zero new dependencies. A DevOS UI adds value only if sandbox-ui is going to
be actively used — which it currently is not.
