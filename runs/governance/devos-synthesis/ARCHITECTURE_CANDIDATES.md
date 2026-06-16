# ARCHITECTURE_CANDIDATES.md
# Phase 7 — Three Architecture Candidates
# Generated: 2026-06-14

---

## Candidate A — Minimal: Enhanced start.sh

**Philosophy**: Fix the actual friction. No new UI. No new dependencies.

**What changes:**
1. `start.sh` gains dynamic prompt injection:
   - Current sprint name + status (from roadmap/01-current-sprint.md first heading)
   - Current branch and its ADR (from docs/adr/ last file)
   - Sacred file list (from core/.ff-core-lock CORE SACRED section)
   - Current-branch bito result (from codex_pr/ grep)
2. `scripts/sacred-check.sh` — new 10-line script:
   - Usage: `./scripts/sacred-check.sh <file-path>`
   - Returns: SACRED / SURFACE / NOT IN LOCK with auth tier
3. `scripts/sprint-status.sh` — new 20-line script:
   - Emits current sprint name, status, branch, and active acceptance criteria
   - Used by start.sh and callable standalone

**New files:** 2 scripts + start.sh modification
**Lines of new code:** ~50
**New dependencies:** None
**Sandbox server required:** No
**Authorization model:** Unchanged
**Claude Code launch:** Unchanged (`--permission-mode plan`)

**What you gain:**
- Session startup reads drop from 5 to 1-2
- Sacred boundary check from grep/read to 1 command
- Branch-specific bito result surfaced automatically

**What you don't gain:**
- Visual dashboard
- Live gate monitoring
- TREES navigation
- Asset generation
- Multi-agent capabilities

**Risk:** Minimal. Pure bash addition to existing file.
**Estimated implementation time:** 1 session (non-sacred files only, no ADR required).
**Who can implement:** Claude Code autonomously (Routine tier).

---

## Candidate B — Strategic: Enhanced start.sh + Sandbox Integration

**Philosophy**: Wire what exists. Everything needed is already built.

**What changes (Candidate A, plus):**
4. `start.sh` starts sandbox server before launching Claude:
   ```bash
   # start sandbox server in background
   (cd core && node apps/server/dist/index.js 2>&1 | tee /tmp/sandbox-server.log) &
   SANDBOX_PID=$!
   echo "Sandbox server started (PID $SANDBOX_PID)"
   ```
5. `start.sh` opens sandbox-ui in browser or prints access URL:
   ```bash
   (cd sandbox-ui && npm run dev -- --open) &
   echo "Sandbox UI: http://localhost:5173"
   ```
6. `scripts/gate-live.sh` — wraps sandbox-cli gate-check with live output:
   - Calls sandbox-cli gate-check every 30s during active sessions
   - Writes results to `/tmp/gate-status.json` (readable by sandbox-ui GateStatusPanel)

**New files:** Candidate A files + gate-live.sh + server startup in start.sh
**Lines of new code:** ~120
**New dependencies:** None (uses existing sandbox-ui and server)
**Sandbox server required:** Yes (auto-started)
**Authorization model:** Unchanged

**What you gain (over Candidate A):**
- sandbox-ui GateStatusPanel live during sessions (Gate 1–6 real-time)
- SimulationProgressPanel shows MC run progress
- ParameterEditorPanel lets you adjust OWC params without editing files
- RTPBreakdownPanel visible during compliance audits
- The "Replit preview tab" vision is realized — browser tab beside Claude session

**What you don't gain:**
- TREES navigation panel
- FOREST dashboard
- Meshy asset generation
- Cohere governance dashboard (Tier 1 live, Tier 2/3 gated)
- Multi-agent routing

**Risk:** Medium. Sandbox server startup adds 2-5s to session launch.
Server crash would need graceful handling (check PID before Claude launch).
**Estimated implementation time:** 2 sessions (server integration requires testing).
**Who can implement:** Claude Code with Elevated authorization (CLAUDE.md change + start.sh change).
**Authorization required:** Human approval of start.sh and CLAUDE.md changes (they are not sacred files, but they affect every session).

---

## Candidate C — Ambitious: Full DevOS with Multi-Agent Awareness

**Philosophy**: Build the RPG Maker / Replit vision end-to-end.

**What changes (Candidate B, plus):**
7. `devos/` directory — new top-level DevOS layer:
   - `devos/devos.sh` — master launcher (wraps start.sh, adds additional panes)
   - `devos/agent-router.ts` — routes tasks between Claude Code / Bito / FOREST / Meshy
   - `devos/context-server.ts` — real-time context broadcaster to sandbox-ui
8. sandbox-ui gains new panels:
   - **AgentStatusPanel**: shows which agent is active (Claude / Bito / Meshy), last action
   - **ForestPanel**: shows FOREST fitness history when triggered
   - **AssetBrowserPanel**: Meshy-generated assets with thumbnail preview
   - **CohereDashboardPanel**: live Cohere governance health, spend by category (Tier 1),
     Opportunity Engine status (Tier 2 stub), retrieval corpus size (Tier 3 readiness)
9. Multi-agent protocol:
   - Claude Code handles implementation
   - Bito review is auto-triggered on save to sacred-adjacent files
   - FOREST runs on ADR acceptance (new trigger condition)
   - Meshy triggered by "generate asset" command in AIAdvisorPanel
   - Cohere governance health displayed live (Tier 1 endpoint already built)
10. Cohere Tier 2 activation path: CohereDashboardPanel shows audit record count;
    when count reaches 100+, surfaces "activate Opportunity Engine" button

**New files:** 20+ files, 1500+ new lines of code
**New dependencies:** tmux or similar pane manager; potential new npm packages for agent-router
**Sandbox server required:** Yes (always running)
**Authorization model:** Extended — agent-router has its own permission tier

**What you gain (over Candidate B):**
- True multi-agent session (Claude + Bito + FOREST + Meshy as peer processes)
- Asset generation panel in sandbox-ui
- Cohere governance live dashboard (Tier 1 already built; just needs panel wiring)
- Cohere Tier 2 activation path visible in UI
- TREES navigation panel (finally has a home in the UI)
- Full "RPG Maker" dashboard feel

**What you risk:**
- Authorization model complexity: agent-router must enforce same sacred-file rules
  or it becomes a governance bypass vector
- Scope is large enough to require its own ADR and 3-5 implementation sprints
- Cohere Tier 2/3 cannot activate until server has run enough sessions to build corpus —
  the panel is honest about this, but the prerequisite is still unmet
- Multi-agent routing without a proven message bus introduces coordination failures
- Gate 3 lesson applies here: building a sophisticated architecture before validating
  the basic loop (sandbox-ui is used, Cohere governance records accumulate) is premature

**Risk:** High. Candidate C builds on Candidates A+B, which are not yet proven in sessions.
**Estimated implementation time:** 5-8 sessions minimum.
**Who can implement:** Requires human authorization for ADR, architecture decision,
and each new sacred-adjacent file change.

---

## Cross-candidate comparison

| Dimension | Candidate A | Candidate B | Candidate C |
|-----------|-------------|-------------|-------------|
| Implementation time | 1 session | 2 sessions | 5–8 sessions |
| Authorization tier | Routine | Elevated | Sacred-adjacent |
| New lines of code | ~50 | ~120 | 1500+ |
| New dependencies | 0 | 0 | 2+ |
| Governance risk | None | Low | Medium |
| Evidence base | Strong | Moderate | Weak (circular) |
| Solves startup friction | Yes | Yes | Yes |
| Enables sandbox-ui use | No | Yes | Yes |
| Enables FOREST new info | No | No | Conditional |
| Delivers "Replit preview" | No | Yes | Yes |
| Delivers "RPG Maker" | No | Partial | Yes |
| Cohere Tier 1 live in session | No | Yes (server runs) | Yes (+ dashboard panel) |
| Cohere Tier 2 activation path | No | No | Visible in UI |

---

## Recommendation

**Start with Candidate A.**

Reason: The startup friction is proven (18 sessions of evidence). The fix is additive
and reversible. Candidate A does not prevent Candidate B — it is Candidate B's prerequisite.

**Upgrade to Candidate B after Candidate A proves insufficient or sandbox-ui is needed.**

Reason: Candidate B wires what exists. The sandbox-ui has 2667 lines already built.
If it proves useful in 2–3 sessions, the investment is already made.

**Candidate C is Phase 2 scope, after B is validated.**

Reason: Multi-agent routing, Cohere Tier 2/3, full DevOS architecture — none of these have
evidence of being needed. Gate 3 taught us: don't build a sophisticated model
before validating the basic loop. Validate Candidate B first.
