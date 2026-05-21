#!/usr/bin/env bash
# manifest.sh — visual manifest pipeline for libriopal/magentadice-cyancode
#
# Commands:
#   ./manifest.sh scaffold [schema_src]   create dirs, place schema
#   ./manifest.sh corpus                  count and shape-check data/
#   ./manifest.sh validate                validate visual_manifest.json against schema
#   ./manifest.sh status                  full pipeline readiness check
#
# Always run from the repo root (libriopal/magentadice-cyancode).

set -euo pipefail
IFS=$'\n\t'

# ── colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✓${RESET}  $*"; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
fail() { echo -e "  ${RED}✗${RESET}  $*"; }
info() { echo -e "  ${CYAN}→${RESET}  $*"; }
hdr()  { echo -e "\n${BOLD}── $* ──${RESET}"; }

# ── canonical paths ───────────────────────────────────────────────────────────
SCHEMA_DEST="core/art/manifest/visual_manifest_schema.json"
MANIFEST_DEST="core/art/manifest/visual_manifest.json"
PROFILING_DIR="core/art/profiling"
PROMPTS_DIR="prompts"
DATA_DIR="data"
DREAM_SOT="dream/shared/source-of-truth/organic-vegas"

# ── guards ────────────────────────────────────────────────────────────────────
require_repo_root() {
  if [[ ! -d ".git" ]]; then
    fail "Not a git repo root. cd to libriopal/magentadice-cyancode first."
    exit 1
  fi
}

# ── validator detection + install ─────────────────────────────────────────────
detect_validator() {
  if command -v ajv &>/dev/null; then
    echo "ajv_global"
  elif [[ -x "node_modules/.bin/ajv" ]]; then
    echo "ajv_local"
  elif command -v python3 &>/dev/null \
       && python3 -c "import jsonschema" &>/dev/null 2>&1; then
    echo "python"
  else
    echo "none"
  fi
}

install_validator() {
  hdr "Installing JSON Schema validator"
  if command -v npm &>/dev/null; then
    info "npm found — installing ajv-cli + ajv-formats locally..."
    npm install --save-dev ajv-cli ajv-formats --silent \
      && ok "ajv-cli installed (node_modules/.bin/ajv)" \
      && return 0
    warn "npm install failed, trying python..."
  fi
  if command -v python3 &>/dev/null; then
    info "python3 found — installing jsonschema..."
    python3 -m pip install jsonschema --quiet \
      && ok "jsonschema installed" \
      && return 0
  fi
  fail "No validator could be installed."
  fail "Fix: npm install --save-dev ajv-cli ajv-formats"
  fail "  OR: pip install jsonschema"
  exit 1
}

run_ajv() {
  local bin="ajv"
  [[ -x "node_modules/.bin/ajv" ]] && bin="node_modules/.bin/ajv"
  "$bin" validate --spec=draft2020 -s "$SCHEMA_DEST" -d "$MANIFEST_DEST"
}

run_python_validate() {
  python3 - "$SCHEMA_DEST" "$MANIFEST_DEST" <<'PYEOF'
import sys, json
try:
    from jsonschema import validate, Draft202012Validator
    from jsonschema.exceptions import ValidationError, SchemaError
except ImportError:
    print("  jsonschema not installed. Run: pip install jsonschema")
    sys.exit(1)

schema_path, manifest_path = sys.argv[1], sys.argv[2]

try:
    schema   = json.load(open(schema_path))
    manifest = json.load(open(manifest_path))
except json.JSONDecodeError as e:
    print(f"  JSON parse error: {e}")
    sys.exit(1)

try:
    validate(instance=manifest, schema=schema, cls=Draft202012Validator)
    print("  Manifest is valid.")
except ValidationError as e:
    print(f"  ValidationError: {e.message}")
    print(f"  Path: {' → '.join(str(p) for p in e.absolute_path)}")
    sys.exit(1)
except SchemaError as e:
    print(f"  Schema itself is invalid: {e.message}")
    sys.exit(1)
PYEOF
}

# ── command: scaffold ─────────────────────────────────────────────────────────
cmd_scaffold() {
  local schema_src="${1:-}"
  require_repo_root

  hdr "Scaffold"

  # create directories
  for dir in \
    "core/art/manifest" \
    "$PROFILING_DIR" \
    "$PROMPTS_DIR"; do
    if [[ -d "$dir" ]]; then
      ok "exists   $dir/"
    else
      mkdir -p "$dir"
      ok "created  $dir/"
    fi
  done

  # .gitkeep so profiling dir tracks in git
  if [[ ! -f "$PROFILING_DIR/.gitkeep" ]]; then
    touch "$PROFILING_DIR/.gitkeep"
    ok "created  $PROFILING_DIR/.gitkeep"
  fi

  # place schema
  if [[ -n "$schema_src" ]]; then
    if [[ -f "$schema_src" ]]; then
      cp "$schema_src" "$SCHEMA_DEST"
      ok "placed   $SCHEMA_DEST"
    else
      fail "Schema source not found: $schema_src"
      exit 1
    fi
  elif [[ -f "$SCHEMA_DEST" ]]; then
    ok "exists   $SCHEMA_DEST"
  else
    warn "Schema not placed."
    warn "  Supply the path: ./manifest.sh scaffold /path/to/visual_manifest_schema.json"
  fi

  # report prompt locations
  hdr "Prompts"
  for f in \
    "$PROMPTS_DIR/diecode.md:original core overhaul prompt" \
    "$PROMPTS_DIR/visual_overhaul.md:visual/UI/theme/3D overhaul prompt"; do
    local path="${f%%:*}" label="${f##*:}"
    if [[ -f "$path" ]]; then
      ok "$path  ($label)"
    else
      warn "missing  $path  ← place your $label here"
    fi
  done

  # report submodule state
  hdr "Submodules"
  for sub in core dream data; do
    if [[ -d "$sub" ]] && [[ -n "$(ls -A "$sub" 2>/dev/null)" ]]; then
      ok "populated  $sub/"
    else
      warn "empty/missing  $sub/"
      warn "  Fix: git submodule update --init --recursive $sub"
    fi
  done

  hdr "Done"
  info "Next: ./manifest.sh status"
}

# ── command: corpus ───────────────────────────────────────────────────────────
cmd_corpus() {
  require_repo_root

  hdr "Corpus — $DATA_DIR/"

  if [[ ! -d "$DATA_DIR" ]]; then
    fail "$DATA_DIR/ not found or not initialized."
    warn "Fix: git submodule update --init data"
    exit 1
  fi

  local total info_json images usable_pairs=0

  total=$(find "$DATA_DIR" -maxdepth 1 -type f | wc -l | tr -d ' ')
  info_json=$(find "$DATA_DIR" -maxdepth 1 -name '*.info.json' | wc -l | tr -d ' ')
  images=$(find "$DATA_DIR" -maxdepth 1 \
    \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) \
    | wc -l | tr -d ' ')

  echo
  printf "  %-22s %s\n" "total files:"    "$total"
  printf "  %-22s %s\n" ".info.json files:" "$info_json"
  printf "  %-22s %s\n" "image files:"    "$images"

  # paired coverage: for each .info.json, check a matching image exists
  while IFS= read -r jf; do
    local base="${jf%.info.json}"
    for ext in png jpg jpeg webp; do
      if [[ -f "${base}.${ext}" ]]; then
        usable_pairs=$((usable_pairs + 1))
        break
      fi
    done
  done < <(find "$DATA_DIR" -maxdepth 1 -name '*.info.json')

  printf "  %-22s %s\n" "paired (img + json):" "$usable_pairs"
  echo

  # shape validation — sample up to 20 files
  hdr "Shape validation (sample, up to 20 files)"

  if ! command -v python3 &>/dev/null; then
    warn "python3 not found — skipping shape validation."
    return
  fi

  local checked=0 passed=0

  while IFS= read -r jf && [[ $checked -lt 20 ]]; do
    checked=$((checked + 1))
    local name; name="$(basename "$jf")"
    if python3 - "$jf" <<'PYEOF' 2>/dev/null; then
import sys, json
try:
    d = json.load(open(sys.argv[1]))
    assert isinstance(d.get("meta", {}).get("id"), str)
    assert isinstance(d.get("meta", {}).get("w"), (int, float))
    assert isinstance(d.get("meta", {}).get("h"), (int, float))
    assert isinstance(d.get("mime"), str)
    assert isinstance(d.get("info", {}).get("prompt"), str)
except (AssertionError, KeyError, TypeError):
    sys.exit(1)
PYEOF
      ok "$name"
      passed=$((passed + 1))
    else
      fail "$name  ← missing one or more: meta.id / meta.w / meta.h / mime / info.prompt"
    fi
  done < <(find "$DATA_DIR" -maxdepth 1 -name '*.info.json' | sort | head -20)

  echo
  if [[ $checked -eq 0 ]]; then
    warn "No .info.json files found in $DATA_DIR/"
  else
    info "Sample shape: ${passed}/${checked} valid"
  fi
}

# ── command: validate ─────────────────────────────────────────────────────────
cmd_validate() {
  require_repo_root

  hdr "Validate manifest"

  if [[ ! -f "$SCHEMA_DEST" ]]; then
    fail "Schema not found at $SCHEMA_DEST"
    info "Run: ./manifest.sh scaffold /path/to/visual_manifest_schema.json"
    exit 1
  else
    ok "schema found"
  fi

  if [[ ! -f "$MANIFEST_DEST" ]]; then
    warn "No manifest at $MANIFEST_DEST"
    info "Claude Code generates this. Run the visual_overhaul.md prompt first."
    info "Expected gate output:  SLICE-VISUAL-CANDIDATE"
    exit 0
  else
    ok "manifest found"
  fi

  # detect or install validator
  local v; v=$(detect_validator)
  if [[ "$v" == "none" ]]; then
    install_validator
    v=$(detect_validator)
  fi

  info "Validator: $v"
  echo

  local exit_code=0
  case "$v" in
    ajv_global|ajv_local)
      run_ajv && ok "Manifest is VALID." || exit_code=$?
      ;;
    python)
      run_python_validate && ok "Manifest is VALID." || exit_code=$?
      ;;
  esac

  if [[ $exit_code -ne 0 ]]; then
    echo
    fail "Manifest failed validation."
    info "Fix the errors above, then re-run: ./manifest.sh validate"
    info "Claude Code gate status remains: BLOCKED until validation passes."
    exit 1
  fi
}

# ── command: status ───────────────────────────────────────────────────────────
cmd_status() {
  require_repo_root

  hdr "Pipeline readiness"

  local score=0 total=0

  item() {
    # item "label" "bash test" "fix hint"
    total=$((total + 1))
    if eval "$2" &>/dev/null 2>&1; then
      ok "$1"
      score=$((score + 1))
    else
      fail "$1"
      info "  fix: $3"
    fi
  }

  # repo / submodules
  item "git repo root"         "[[ -d .git ]]"                                "cd to libriopal/magentadice-cyancode"
  item "core/ submodule"       "[[ -d core ]] && [[ \$(ls -A core) ]]"       "git submodule update --init core"
  item "dream/ submodule"      "[[ -d dream ]] && [[ \$(ls -A dream) ]]"     "git submodule update --init dream"
  item "data/ corpus"          "[[ -d data  ]] && [[ \$(ls -A data) ]]"      "git submodule update --init data"

  # dream source truth
  item "design_tokens.json"    "[[ -f $DREAM_SOT/design_tokens.json ]]"      "check dream submodule is current"
  item "performance_budget.md" "[[ -f $DREAM_SOT/performance_budget.md ]]"   "check dream submodule is current"

  # manifest pipeline dirs
  item "core/art/manifest/ dir"  "[[ -d core/art/manifest ]]"               "./manifest.sh scaffold"
  item "core/art/profiling/ dir" "[[ -d $PROFILING_DIR ]]"                   "./manifest.sh scaffold"

  # schema
  item "schema placed"         "[[ -f $SCHEMA_DEST ]]"                       "./manifest.sh scaffold /path/to/visual_manifest_schema.json"

  # prompts
  item "diecode.md"            "[[ -f $PROMPTS_DIR/diecode.md ]]"            "place in prompts/"
  item "visual_overhaul.md"    "[[ -f $PROMPTS_DIR/visual_overhaul.md ]]"    "place in prompts/"

  # validator
  total=$((total + 1))
  local v; v=$(detect_validator)
  if [[ "$v" != "none" ]]; then
    ok "validator ($v)"
    score=$((score + 1))
  else
    warn "no validator"
    info "  fix: npm install --save-dev ajv-cli ajv-formats"
    info "    or: pip install jsonschema"
  fi

  # manifest (generated by Claude Code — not required to be READY, just reported)
  total=$((total + 1))
  if [[ -f "$MANIFEST_DEST" ]]; then
    ok "manifest generated (run validate to check it)"
    score=$((score + 1))
  else
    warn "manifest not yet generated"
    info "  expected: run visual_overhaul.md in Claude Code"
  fi

  # summary
  echo
  echo -e "  ${BOLD}Score: ${score}/${total}${RESET}"
  echo

  if [[ $score -eq $total ]]; then
    echo -e "  ${GREEN}${BOLD}PIPELINE READY${RESET}"
    echo -e "  Next: run ./manifest.sh validate"
  elif [[ $score -ge $((total - 2)) ]]; then
    echo -e "  ${YELLOW}${BOLD}NEARLY READY${RESET} — fix the warnings above"
  else
    echo -e "  ${RED}${BOLD}NOT READY${RESET} — fix the failures above, then re-run ./manifest.sh status"
  fi
}

# ── dispatch ──────────────────────────────────────────────────────────────────
CMD="${1:-help}"
shift || true

case "$CMD" in
  scaffold) cmd_scaffold "$@" ;;
  corpus)   cmd_corpus    ;;
  validate) cmd_validate  ;;
  status)   cmd_status    ;;
  help|--help|-h)
    echo -e "${BOLD}manifest.sh${RESET} — visual manifest pipeline for magentadice-cyancode"
    echo
    echo "  ./manifest.sh scaffold [schema_src]"
    echo "      Create dirs and place schema. Pass path to visual_manifest_schema.json."
    echo
    echo "  ./manifest.sh corpus"
    echo "      Count data/ files and shape-validate a sample of .info.json files."
    echo
    echo "  ./manifest.sh validate"
    echo "      Validate core/art/manifest/visual_manifest.json against the schema."
    echo "      Installs ajv or jsonschema automatically if neither is found."
    echo
    echo "  ./manifest.sh status"
    echo "      Full pipeline readiness check — run this first and after any change."
    echo
    echo "  Run order:"
    echo "      1. ./manifest.sh scaffold /path/to/visual_manifest_schema.json"
    echo "      2. ./manifest.sh status"
    echo "      3. ./manifest.sh corpus"
    echo "      4. (run visual_overhaul.md prompt in Claude Code)"
    echo "      5. ./manifest.sh validate"
    ;;
  *)
    fail "Unknown command: $CMD"
    echo "  Run ./manifest.sh help"
    exit 1
    ;;
esac
