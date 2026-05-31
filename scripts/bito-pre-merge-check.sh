#!/usr/bin/env bash
# scripts/bito-pre-merge-check.sh
#
# Pre-merge Bito review for core/ and dream/ submodule files.
# Run from anywhere in the repo:  bash scripts/bito-pre-merge-check.sh
#
# Steps:
#   1. Resolve core + dream submodule SHAs at main vs HEAD
#   2. Filter core/ files: core/apps/**, core/apps/web/src/game/**, .ff-core-lock exact
#   3. Filter dream/ files: dream/apps/**, dream/shared/**, dream/constitution/**,
#      + files governed by dream/constitution/operational-law.md
#   4. Concatenate all surviving files → /tmp/bito_merge_context.txt
#      (core/ first, dream/ appended)
#   5. Write combined prompt → /tmp/bito_merge_prompt.txt
#   6. Run: bito -p <prompt> -f <context> -m ADVANCED
#   7. Save output → codex_pr/BITO_PRE_MERGE_<sha>.md
#   8. Exit 1 if any FAIL found in output

set -euo pipefail

# ── Resolve repo root ─────────────────────────────────────────────────────────

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# ── Guards ────────────────────────────────────────────────────────────────────

if ! command -v bito &>/dev/null; then
  echo "ERROR: bito not found in PATH. Install the Bito CLI before running this script." >&2
  exit 1
fi

LOCK_FILE="core/.ff-core-lock"
if [[ ! -f "$LOCK_FILE" ]]; then
  echo "ERROR: $LOCK_FILE not found. Cannot determine core sacred file status." >&2
  exit 1
fi

OPERATIONAL_LAW="dream/constitution/operational-law.md"
if [[ ! -f "$OPERATIONAL_LAW" ]]; then
  echo "ERROR: $OPERATIONAL_LAW not found. Cannot determine dream governed files." >&2
  exit 1
fi

if [[ ! -d "core/.git" && ! -f "core/.git" ]]; then
  echo "ERROR: core/ submodule not initialized. Run: git submodule update --init core" >&2
  exit 1
fi

if [[ ! -d "dream/.git" && ! -f "dream/.git" ]]; then
  echo "ERROR: dream/ submodule not initialized. Run: git submodule update --init dream" >&2
  exit 1
fi

# ── Accumulate all filtered files from both submodules ────────────────────────

all_filtered_files=()

# ── 1a. core submodule: SHA resolution + filter ───────────────────────────────

echo "→ Resolving core submodule SHAs..."

CORE_SHA_MAIN=$(git rev-parse "main:core" 2>/dev/null || echo "")
CORE_SHA_HEAD=$(git rev-parse "HEAD:core" 2>/dev/null || echo "")

if [[ -z "$CORE_SHA_MAIN" || -z "$CORE_SHA_HEAD" ]]; then
  echo "  WARN: Could not resolve core submodule SHAs — skipping core." >&2
else
  echo "  main:core = $CORE_SHA_MAIN"
  echo "  HEAD:core = $CORE_SHA_HEAD"

  if [[ "$CORE_SHA_MAIN" == "$CORE_SHA_HEAD" ]]; then
    echo "  core submodule unchanged vs main — skipping."
  else
    # Paths relative to core/ — prefix with 'core/' for working-tree access
    changed_core_raw=$(cd core && git diff --name-only "${CORE_SHA_MAIN}".."${CORE_SHA_HEAD}" 2>/dev/null || true)

    if [[ -n "$changed_core_raw" ]]; then
      # ── 2. Filter core files ────────────────────────────────────────────
      echo "→ Filtering core/ files..."
      lock_entries=$(grep -v '^#' "$LOCK_FILE" | grep -v '^[[:space:]]*$')

      while IFS= read -r f; do
        [[ -z "$f" ]] && continue
        f="core/${f}"
        include=false
        # Criterion A — core/apps/ or core/apps/web/src/game/
        if [[ "$f" == core/apps/* || "$f" == core/apps/web/src/game/* ]]; then
          include=true
        else
          # Criterion B — lock-file exact match (paths relative to core/)
          rel="${f#core/}"
          if echo "$lock_entries" | grep -qxF "$rel"; then
            include=true
          fi
        fi
        [[ "$include" == true ]] && all_filtered_files+=("$f")
      done <<< "$changed_core_raw"
    fi
  fi
fi

# ── 1b. dream submodule: SHA resolution + filter ──────────────────────────────

echo "→ Resolving dream submodule SHAs..."

DREAM_SHA_MAIN=$(git rev-parse "main:dream" 2>/dev/null || echo "")
DREAM_SHA_HEAD=$(git rev-parse "HEAD:dream" 2>/dev/null || echo "")

if [[ -z "$DREAM_SHA_MAIN" || -z "$DREAM_SHA_HEAD" ]]; then
  echo "  WARN: Could not resolve dream submodule SHAs — skipping dream." >&2
else
  echo "  main:dream = $DREAM_SHA_MAIN"
  echo "  HEAD:dream = $DREAM_SHA_HEAD"

  if [[ "$DREAM_SHA_MAIN" == "$DREAM_SHA_HEAD" ]]; then
    echo "  dream submodule unchanged vs main — skipping."
  else
    # Paths relative to dream/ — prefix with 'dream/' for working-tree access
    changed_dream_raw=$(cd dream && git diff --name-only "${DREAM_SHA_MAIN}".."${DREAM_SHA_HEAD}" 2>/dev/null || true)

    if [[ -n "$changed_dream_raw" ]]; then
      # ── 3. Filter dream files ───────────────────────────────────────────
      echo "→ Filtering dream/ files..."

      # Extract governed files: /path/to/file references in operational-law.md,
      # strip leading '/' and prefix with 'dream/' (e.g. dream/viktor.md)
      dream_governed=$(grep -oE '/[a-zA-Z0-9/_.-]+\.(md|ts|js)' "$OPERATIONAL_LAW" \
        | sed 's|^/|dream/|' | sort -u || true)

      while IFS= read -r f; do
        [[ -z "$f" ]] && continue
        f="dream/${f}"
        include=false
        # Criterion A — dream/apps/, dream/shared/, dream/constitution/
        if [[ "$f" == dream/apps/* || "$f" == dream/shared/* || "$f" == dream/constitution/* ]]; then
          include=true
        else
          # Criterion B — governed file listed in operational-law.md
          if echo "$dream_governed" | grep -qxF "$f"; then
            include=true
          fi
        fi
        [[ "$include" == true ]] && all_filtered_files+=("$f")
      done <<< "$changed_dream_raw"
    fi
  fi
fi

# ── Early exit if nothing to review ──────────────────────────────────────────

echo ""
if [[ ${#all_filtered_files[@]} -eq 0 ]]; then
  echo "  No reviewable files changed in core/ or dream/ vs main. Nothing to review."
  exit 0
fi

echo "→ Files selected for review (${#all_filtered_files[@]}):"
for f in "${all_filtered_files[@]}"; do
  echo "    $f"
done

# ── 4. Build context file (core/ first, dream/ appended) ─────────────────────

CONTEXT_FILE="/tmp/bito_merge_context.txt"
echo "→ Building context file at $CONTEXT_FILE..."
> "$CONTEXT_FILE"

for f in "${all_filtered_files[@]}"; do
  echo "=== FILE: $f ===" >> "$CONTEXT_FILE"
  if [[ -f "$f" ]]; then
    cat "$f" >> "$CONTEXT_FILE"
  else
    echo "(file deleted or not present on disk — skipping content)" >> "$CONTEXT_FILE"
  fi
  printf '\n' >> "$CONTEXT_FILE"
done

echo "  Context: $(wc -l < "$CONTEXT_FILE") lines"

# ── 5. Write combined prompt ──────────────────────────────────────────────────

PROMPT_FILE="/tmp/bito_merge_prompt.txt"
echo "→ Writing prompt to $PROMPT_FILE..."
cat > "$PROMPT_FILE" << 'PROMPT'
Post-implementation review only. No planning. No recommendations.
For each file changed in this PR verify:
- No Math.random() introduced
- No float introduced in any scoring path
- No sacred file modified without the change being additive-only
- All new WS message types have both a sender and a handler
- No console.log or debug statements left in production paths

For dream/ files also verify:
- No Math.random() introduced (AGROS invariant — DeterministicPRNG only)
- No new emotional states added beyond the 8 canonical: Dread, Suspense, Escalation, Catastrophic Release, Mourning, Recovery, Silence, Ritualistic Build
- No direct SQLite writes outside db.ts
- No SharedArrayBuffer usage added without COOP/COEP header confirmation
- Memory ledger files (project-memory.md, viktor.md, coderabbit.md) updated if backend engines were modified

Return PASS or FAIL per file with line evidence.
PROMPT

# ── 6 + 7. Run Bito and save output ──────────────────────────────────────────

SHORT_SHA=$(git rev-parse --short HEAD)
OUTPUT_FILE="codex_pr/BITO_PRE_MERGE_${SHORT_SHA}.md"
mkdir -p codex_pr

echo "→ Running Bito (ADVANCED) — this may take several minutes..."
echo "  Output → $OUTPUT_FILE"
echo ""

bito_exit=0
bito -p "$PROMPT_FILE" -f "$CONTEXT_FILE" -m ADVANCED 2>&1 | tee "$OUTPUT_FILE" || bito_exit=$?

if [[ $bito_exit -ne 0 ]]; then
  echo "" >&2
  echo "ERROR: bito exited with status $bito_exit." >&2
  exit 1
fi

echo ""
echo "→ Saved to $OUTPUT_FILE"

# ── 8. Check for FAIL ────────────────────────────────────────────────────────

if grep -q "FAIL" "$OUTPUT_FILE"; then
  echo ""
  echo "✗  BITO PRE-MERGE CHECK FAILED — one or more files require attention."
  echo "   Review: $OUTPUT_FILE"
  exit 1
else
  echo ""
  echo "✓  BITO PRE-MERGE CHECK PASSED"
  exit 0
fi
