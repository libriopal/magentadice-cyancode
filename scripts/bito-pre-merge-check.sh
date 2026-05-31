#!/usr/bin/env bash
# scripts/bito-pre-merge-check.sh
#
# Pre-merge Bito review for core/ sacred and apps/ files.
# Run from anywhere in the repo:  bash scripts/bito-pre-merge-check.sh
#
# Steps:
#   1. Resolve core submodule SHAs at main vs HEAD; diff files inside submodule
#   2. Filter to core/.ff-core-lock entries OR core/apps/** files
#   3. Concatenate file contents → /tmp/bito_merge_context.txt
#   4. Write review prompt       → /tmp/bito_merge_prompt.txt
#   5. Run: bito -p <prompt> -f <context> -m ADVANCED
#   6. Save output → codex_pr/BITO_PRE_MERGE_<sha>.md
#   7. Exit 1 if any FAIL found in output

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
  echo "ERROR: $LOCK_FILE not found. Cannot determine sacred file status." >&2
  exit 1
fi

if [[ ! -d "core/.git" && ! -f "core/.git" ]]; then
  echo "ERROR: core/ submodule not initialized. Run: git submodule update --init core" >&2
  exit 1
fi

# ── 1. Changed files in core submodule vs main ────────────────────────────────

echo "→ Resolving core submodule SHAs..."

CORE_SHA_MAIN=$(git rev-parse "main:core" 2>/dev/null || echo "")
CORE_SHA_HEAD=$(git rev-parse "HEAD:core" 2>/dev/null || echo "")

if [[ -z "$CORE_SHA_MAIN" ]]; then
  echo "ERROR: Could not resolve core submodule SHA at main." >&2
  exit 1
fi
if [[ -z "$CORE_SHA_HEAD" ]]; then
  echo "ERROR: Could not resolve core submodule SHA at HEAD." >&2
  exit 1
fi

echo "  main:core = $CORE_SHA_MAIN"
echo "  HEAD:core = $CORE_SHA_HEAD"

if [[ "$CORE_SHA_MAIN" == "$CORE_SHA_HEAD" ]]; then
  echo "  core submodule is unchanged vs main. Nothing to review."
  exit 0
fi

# Paths returned here are relative to core/ (e.g. apps/server/src/gameRoom.ts)
changed_files_raw=$(cd core && git diff --name-only "${CORE_SHA_MAIN}".."${CORE_SHA_HEAD}" 2>/dev/null || true)

if [[ -z "$changed_files_raw" ]]; then
  echo "  No file changes found inside core submodule vs main. Nothing to review."
  exit 0
fi

# Prefix with 'core/' so paths match the working tree from repo root
changed_files=$(echo "$changed_files_raw" | sed 's|^|core/|')

# ── 2. Filter: core/apps/**, core/apps/web/src/game/**, OR lock-file exact ────

echo "→ Filtering to sacred and apps/ files..."

# Lock file entries are relative to core/ (e.g. apps/server/src/gameRoom.ts)
lock_entries=$(grep -v '^#' "$LOCK_FILE" | grep -v '^[[:space:]]*$')

filtered_files=()
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  include=false

  # Criterion A — file lives under core/apps/ or core/apps/web/src/game/
  if [[ "$f" == core/apps/* || "$f" == core/apps/web/src/game/* ]]; then
    include=true
  else
    # Criterion B — strip 'core/' prefix and match against lock-file entries
    rel="${f#core/}"
    if echo "$lock_entries" | grep -qxF "$rel"; then
      include=true
    fi
  fi

  [[ "$include" == true ]] && filtered_files+=("$f")
done <<< "$changed_files"

if [[ ${#filtered_files[@]} -eq 0 ]]; then
  echo "  No sacred or apps/ files in changeset. Nothing to review."
  exit 0
fi

echo "  Files selected for review (${#filtered_files[@]}):"
for f in "${filtered_files[@]}"; do
  echo "    $f"
done

# ── 3. Build context file ─────────────────────────────────────────────────────

CONTEXT_FILE="/tmp/bito_merge_context.txt"
echo "→ Building context file at $CONTEXT_FILE..."
> "$CONTEXT_FILE"

for f in "${filtered_files[@]}"; do
  echo "=== FILE: $f ===" >> "$CONTEXT_FILE"
  if [[ -f "$f" ]]; then
    cat "$f" >> "$CONTEXT_FILE"
  else
    echo "(file deleted or not present on disk — skipping content)" >> "$CONTEXT_FILE"
  fi
  printf '\n' >> "$CONTEXT_FILE"
done

echo "  Context: $(wc -l < "$CONTEXT_FILE") lines"

# ── 4. Write prompt ───────────────────────────────────────────────────────────

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
Return PASS or FAIL per file with line evidence.
PROMPT

# ── 5 + 6. Run Bito and save output ──────────────────────────────────────────

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

# ── 7. Check for FAIL ────────────────────────────────────────────────────────

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
