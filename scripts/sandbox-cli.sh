#!/usr/bin/env bash
# =============================================================================
# sandbox-cli.sh — RTP Sandbox CLI for Claude Code
# Used by Claude Code when working on the Opportunity Engine (P4-OWC)
# and Batch A (monteCarlo V2) without requiring the browser UI.
#
# Usage:
#   ./scripts/sandbox-cli.sh <command> [options]
#
# Commands:
#   health                          Check server is up
#   sim <mode> <model> [seed]       Run a single simulation
#   audit [seed]                    Run full 6-mode × 3-model audit
#   role-audit [seed]               Run Rally role balance audit
#   coverage                        Show monteCarlo coverage checklist status
#   undo                            Undo last config change
#   redo                            Redo last undone change
#   reset                           Reset session to base config
#   checkpoint                      Save current config as checkpoint
#   set <param> <value>             Change a single config parameter
#   get-config                      Print current sandbox config as JSON
#   gate-check                      Run all 6 validation gates, report PASS/FAIL
#   advisor                         Get AI advisor recommendations for current state
#   rtp-summary                     Print RTP by mechanic for last run
#   skill-gap                       Print OPTIMAL vs WEAK skill gap
#   legal-check <mode>              Check if last result is within legal band
#   watch-gate <gate> <mode>        Poll until named gate passes (max 10 attempts)
#   owc-param-set <key> <value>     Set an OWC weight parameter (P4 extension point)
#   owc-param-list                  List all current OWC parameters
#   help                            Show this help
#
# All commands output structured JSON to stdout on success.
# Errors output to stderr with prefix [ERROR].
# Exit 0 = success. Exit 1 = failure.
# =============================================================================

set -euo pipefail

BASE_URL="${SANDBOX_URL:-http://localhost:3001}"
TIMEOUT=120

# ── colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; AMBER='\033[0;33m'
CYAN='\033[0;36m'; DIM='\033[2m'; RESET='\033[0m'

pass()  { echo -e "${GREEN}✅ $*${RESET}" >&2; }
fail()  { echo -e "${RED}❌ $*${RESET}" >&2; }
warn()  { echo -e "${AMBER}⚠️  $*${RESET}" >&2; }
info()  { echo -e "${CYAN}ℹ  $*${RESET}" >&2; }
dim()   { echo -e "${DIM}$*${RESET}" >&2; }

err() { echo "[ERROR] $*" >&2; exit 1; }

# ── HTTP helpers ──────────────────────────────────────────────────────────────
get() {
  curl -sf --max-time "$TIMEOUT" "$BASE_URL$1" \
    -H "Content-Type: application/json" || err "GET $1 failed"
}

post() {
  local path="$1"; shift
  local body="${1:-{}}"
  curl -sf --max-time "$TIMEOUT" -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -d "$body" || err "POST $path failed"
}

ws_send() {
  # Send a single WS message and capture the next response.
  # Requires websocat: apt install websocat or cargo install websocat
  local msg="$1"
  if ! command -v websocat &>/dev/null; then
    err "websocat not found. Install: cargo install websocat"
  fi
  echo "$msg" | websocat -n1 "${BASE_URL/http/ws}/sandbox-ws" 2>/dev/null
}

require_server() {
  curl -sf --max-time 3 "$BASE_URL/health" > /dev/null 2>&1 \
    || err "Sandbox server not running. Start with: cd core/apps/server && node dist/index.js"
}

# ── legal bands ───────────────────────────────────────────────────────────────
legal_floor() {
  case "$1" in
    SOLO_CASINO)  echo "0.82" ;;
    VS_CASINO)    echo "0.84" ;;
    RALLY_CASINO) echo "0.85" ;;
    *)            echo "0.00" ;;
  esac
}

legal_ceil() {
  case "$1" in
    SOLO_CASINO)  echo "1.02" ;;
    VS_CASINO)    echo "1.00" ;;
    RALLY_CASINO) echo "1.00" ;;
    *)            echo "1.00" ;;
  esac
}

# ── commands ──────────────────────────────────────────────────────────────────

cmd_health() {
  require_server
  local r; r=$(get /health)
  echo "$r"
  pass "Server healthy"
}

cmd_sim() {
  require_server
  local mode="${1:-SOLO_CASINO}"
  local model="${2:-AVERAGE}"
  local seed="${3:-$((RANDOM * RANDOM))}"
  local sessions="${4:-100000}"

  info "Running simulation: mode=$mode model=$model seed=$seed sessions=$sessions"

  local r; r=$(post /simulate-v2 \
    "{\"mode\":\"$mode\",\"playerModel\":\"$model\",\"seed\":$seed,\"sessions\":$sessions}")

  echo "$r"

  # Parse and surface key metrics to stderr for Claude Code readability
  local rtp; rtp=$(echo "$r" | python3 -c "
import json,sys
d=json.load(sys.stdin)
fields=['baseChainRTP','multiplierContributionRTP','bombStandardRTP',
        'bombRainbowRTP','orbContributionRTP','doublerContributionRTP',
        'archivistContributionRTP']
total=sum(d.get(f,0) for f in fields)
print(f'{total:.4f}')
" 2>/dev/null || echo "unknown")

  local farkle; farkle=$(echo "$r" | python3 -c \
    "import json,sys; print(json.load(sys.stdin).get('farkleRate','?'))" 2>/dev/null)

  local floor; floor=$(legal_floor "$mode")
  local ceil;  ceil=$(legal_ceil  "$mode")

  if [ "$rtp" != "unknown" ] && [ "$floor" != "0.00" ]; then
    local ok; ok=$(python3 -c \
      "print('yes' if $floor <= $rtp <= $ceil else 'no')" 2>/dev/null)
    if [ "$ok" = "yes" ]; then
      pass "RTP $rtp within legal band [$floor – $ceil] for $mode"
    else
      fail "RTP $rtp OUTSIDE legal band [$floor – $ceil] for $mode"
    fi
  fi

  info "Farkle rate: $farkle"
}

cmd_audit() {
  require_server
  local seed="${1:-$((RANDOM * RANDOM))}"
  info "Running full audit: seed=$seed (18 simulation runs — may take ~3 min)"
  local r; r=$(post /rtp-audit "{\"seed\":$seed}")
  echo "$r"

  # Surface gate results
  echo "$r" | python3 -c "
import json,sys
d=json.load(sys.stdin)
gates=d.get('gates',{})
for g,v in gates.items():
    status=v if isinstance(v,str) else v.get('status','?')
    sym='✅' if status=='PASS' else ('⚠️ ' if status=='WARN' else '❌')
    print(f'  {sym} {g}: {status}',file=sys.stderr)
" 2>&1 || true
}

cmd_role_audit() {
  require_server
  local seed="${1:-$((RANDOM * RANDOM))}"
  info "Running role audit: seed=$seed"
  local r; r=$(post /role-audit "{\"seed\":$seed}")
  echo "$r"
}

cmd_coverage() {
  require_server
  local r; r=$(get /coverage-status)
  echo "$r"

  echo "$r" | python3 -c "
import json,sys
d=json.load(sys.stdin)
total=d.get('total',0)
checked=d.get('checked',0)
unchecked=d.get('unchecked',0)
pct=d.get('percentComplete',0)
print(f'Coverage: {checked}/{total} ({pct:.1f}%)',file=sys.stderr)
if unchecked > 0:
    print(f'BLOCKED: {unchecked} unverified return paths',file=sys.stderr)
    items=d.get('items',[])
    for it in items:
        if not it.get('checked'):
            print(f'  ✖ [{it.get(\"category\",\"?\")}] {it.get(\"label\",\"?\")}',
                  file=sys.stderr)
else:
    print('All return paths verified ✅',file=sys.stderr)
" 2>&1 || true
}

cmd_set() {
  require_server
  local key="${1:-}"; local val="${2:-}"
  [ -z "$key" ] && err "Usage: sandbox-cli.sh set <param> <value>"
  [ -z "$val" ] && err "Usage: sandbox-cli.sh set <param> <value>"

  # Detect value type
  local body
  if python3 -c "float('$val')" 2>/dev/null; then
    body="{\"$key\": $val}"
  else
    body="{\"$key\": \"$val\"}"
  fi

  local r; r=$(ws_send "{\"type\":\"CONFIG_CHANGE\",\"payload\":$body}")
  echo "$r"
  pass "Set $key = $val"
}

cmd_get_config() {
  require_server
  local r; r=$(ws_send '{"type":"GET_CONFIG","payload":{}}')
  echo "$r"
}

cmd_undo() {
  require_server
  local r; r=$(ws_send '{"type":"UNDO","payload":{}}')
  echo "$r"
  pass "Undo applied"
}

cmd_redo() {
  require_server
  local r; r=$(ws_send '{"type":"REDO","payload":{}}')
  echo "$r"
  pass "Redo applied"
}

cmd_reset() {
  require_server
  local r; r=$(ws_send '{"type":"RESET","payload":{}}')
  echo "$r"
  pass "Session reset to base config"
}

cmd_checkpoint() {
  require_server
  local r; r=$(ws_send '{"type":"CHECKPOINT","payload":{}}')
  echo "$r"
  pass "Checkpoint saved"
}

cmd_gate_check() {
  require_server
  info "Running gate check against last simulation result..."
  local r; r=$(get /coverage-status)

  # Run a quick sim if no result exists yet
  local audit; audit=$(post /rtp-audit \
    "{\"seed\":42,\"sessions\":10000}" 2>/dev/null || echo '{}')

  echo "$audit" | python3 -c "
import json,sys
d=json.load(sys.stdin)
gates=d.get('gates',{})
all_pass=True
for g,v in gates.items():
    status=v if isinstance(v,str) else v.get('status','?')
    sym='✅' if status=='PASS' else ('⚠️ ' if status=='WARN' else '❌')
    if status not in ('PASS','WARN'):
        all_pass=False
    print(f'{sym} {g}: {status}')
sys.exit(0 if all_pass else 1)
" || { fail "One or more gates failing"; exit 1; }

  pass "All gates passing"
}

cmd_advisor() {
  require_server
  info "Requesting AI advisor recommendations..."
  local r; r=$(ws_send '{"type":"CHAT_MESSAGE","payload":{"text":"Analyse current RTP config and list any compliance issues with specific fix recommendations. Be concise.","agent":"claude"}}')
  echo "$r"
}

cmd_rtp_summary() {
  require_server
  local r; r=$(post /simulate-v2 \
    "{\"mode\":\"SOLO_CASINO\",\"playerModel\":\"AVERAGE\",\"seed\":42,\"sessions\":10000}")

  echo "$r" | python3 -c "
import json,sys
d=json.load(sys.stdin)
fields={
  'Base Chain':    'baseChainRTP',
  'Multiplier':    'multiplierContributionRTP',
  'Std Bomb':      'bombStandardRTP',
  'Rainbow Bomb':  'bombRainbowRTP',
  'Orb':           'orbContributionRTP',
  'Doubler':       'doublerContributionRTP',
  'Archivist':     'archivistContributionRTP',
}
total=0
print(f'  {\"Mechanic\":<16} {\"RTP%\":>8}')
print('  ' + '-'*26)
for label,key in fields.items():
    v=d.get(key,0)
    total+=v
    bar='█'*int(v*100)
    print(f'  {label:<16} {v*100:>6.1f}%  {bar}')
print('  ' + '-'*26)
print(f'  {\"TOTAL\":<16} {total*100:>6.1f}%')
" 2>&1 || echo "$r"
}

cmd_skill_gap() {
  require_server
  info "Running OPTIMAL and WEAK models to compute skill gap..."

  local seed=42
  local opt_r; opt_r=$(post /simulate-v2 \
    "{\"mode\":\"SOLO_CASINO\",\"playerModel\":\"OPTIMAL\",\"seed\":$seed,\"sessions\":50000}")
  local weak_r; weak_r=$(post /simulate-v2 \
    "{\"mode\":\"SOLO_CASINO\",\"playerModel\":\"WEAK\",\"seed\":$seed,\"sessions\":50000}")

  python3 -c "
import json,sys
fields=['baseChainRTP','multiplierContributionRTP','bombStandardRTP',
        'bombRainbowRTP','orbContributionRTP','doublerContributionRTP',
        'archivistContributionRTP']

opt=json.loads('''$opt_r''')
weak=json.loads('''$weak_r''')

opt_rtp=sum(opt.get(f,0) for f in fields)
weak_rtp=sum(weak.get(f,0) for f in fields)
gap=opt_rtp - weak_rtp

print(json.dumps({
  'optimalRTP': round(opt_rtp,4),
  'weakRTP':    round(weak_rtp,4),
  'skillGap':   round(gap,4),
  'gapPct':     round(gap*100,2),
  'passes':     gap >= 0.05,
  'threshold':  0.05,
}))

status='✅ PASSES' if gap>=0.05 else ('⚠️  MARGINAL' if gap>=0.03 else '❌ FAILS')
print(f'Skill gap: {gap*100:.2f}%  {status}',file=sys.stderr)
print(f'OPTIMAL RTP: {opt_rtp*100:.2f}%',file=sys.stderr)
print(f'WEAK RTP:    {weak_rtp*100:.2f}%',file=sys.stderr)
print(f'Required minimum: 5.00%',file=sys.stderr)
"
}

cmd_legal_check() {
  require_server
  local mode="${1:-SOLO_CASINO}"
  local floor; floor=$(legal_floor "$mode")
  local ceil;  ceil=$(legal_ceil  "$mode")

  if [ "$floor" = "0.00" ]; then
    info "$mode is a free-to-play mode — no legal band requirement"
    exit 0
  fi

  info "Legal check: $mode  band=[$floor – $ceil]"

  local r; r=$(post /simulate-v2 \
    "{\"mode\":\"$mode\",\"playerModel\":\"AVERAGE\",\"seed\":42,\"sessions\":50000}")

  python3 -c "
import json,sys
d=json.loads('''$r''')
fields=['baseChainRTP','multiplierContributionRTP','bombStandardRTP',
        'bombRainbowRTP','orbContributionRTP','doublerContributionRTP',
        'archivistContributionRTP']
rtp=sum(d.get(f,0) for f in fields)
floor=$floor; ceil=$ceil
within = floor <= rtp <= ceil
print(json.dumps({
  'mode': '$mode',
  'rtp': round(rtp,4),
  'floor': floor,
  'ceil': ceil,
  'within_band': within,
  'delta_floor': round(rtp-floor,4),
  'delta_ceil':  round(ceil-rtp,4),
}))
status='✅ COMPLIANT' if within else '❌ NON-COMPLIANT'
print(f'{status}  RTP={rtp*100:.2f}%  band=[{floor*100:.0f}%–{ceil*100:.0f}%]',
      file=sys.stderr)
if not within:
    if rtp < floor:
        adj=floor-rtp
        print(f'Need to RAISE RTP by {adj*100:.2f}%',file=sys.stderr)
    else:
        adj=rtp-ceil
        print(f'Need to LOWER RTP by {adj*100:.2f}%',file=sys.stderr)
"
}

cmd_watch_gate() {
  require_server
  local gate="${1:-Gate2}"; local mode="${2:-SOLO_CASINO}"
  local max_attempts=10; local attempt=0; local wait=15

  info "Watching $gate for mode=$mode (max $max_attempts attempts, ${wait}s interval)"

  while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    info "Attempt $attempt/$max_attempts..."

    local r; r=$(post /rtp-audit "{\"seed\":42,\"sessions\":50000}" 2>/dev/null || echo '{}')
    local status; status=$(echo "$r" | python3 -c \
      "import json,sys; d=json.load(sys.stdin); print(d.get('gates',{}).get('$gate',{}).get('status','UNKNOWN'))" \
      2>/dev/null || echo "UNKNOWN")

    if [ "$status" = "PASS" ]; then
      pass "$gate PASS on attempt $attempt"
      echo "$r"
      exit 0
    elif [ "$status" = "WARN" ]; then
      warn "$gate WARN on attempt $attempt — continuing"
    else
      fail "$gate $status on attempt $attempt"
    fi

    [ $attempt -lt $max_attempts ] && sleep "$wait"
  done

  fail "$gate did not pass after $max_attempts attempts"
  exit 1
}

# ── OWC extension points (P4 — stubs until OWC implemented) ─────────────────

cmd_owc_param_set() {
  local key="${1:-}"; local val="${2:-}"
  [ -z "$key" ] && err "Usage: sandbox-cli.sh owc-param-set <key> <value>"
  # OWC parameters are prefixed owc_ to distinguish from base SimConfig
  cmd_set "owc_$key" "$val"
}

cmd_owc_param_list() {
  require_server
  local r; r=$(cmd_get_config)
  echo "$r" | python3 -c "
import json,sys
d=json.loads(sys.stdin.read())
config=d.get('payload',{}).get('config',d)
owc={k:v for k,v in config.items() if k.startswith('owc_')}
if not owc:
    print('No OWC parameters set yet (P4 pending)',file=sys.stderr)
else:
    print(json.dumps(owc,indent=2))
" 2>&1 || echo "{}"
}

# ── help ──────────────────────────────────────────────────────────────────────

cmd_help() {
cat << 'HELP'
sandbox-cli.sh — RTP Sandbox CLI for Claude Code

USAGE: ./scripts/sandbox-cli.sh <command> [args]

SIMULATION
  sim <mode> <model> [seed] [sessions]   Run one simulation
      modes:  SOLO_FREE SOLO_CASINO VS_FREE VS_CASINO RALLY_FREE RALLY_CASINO
      models: OPTIMAL AVERAGE WEAK
  audit [seed]                           Full 6-mode × 3-model audit
  role-audit [seed]                      Rally role balance audit

CONFIG
  get-config                             Print current config as JSON
  set <param> <value>                    Change one parameter
  undo                                   Undo last change
  redo                                   Redo last undone change
  reset                                  Reset to base config
  checkpoint                             Save current state

COMPLIANCE
  gate-check                             Run all 6 validation gates
  legal-check <mode>                     Check RTP vs legal band
  skill-gap                              OPTIMAL vs WEAK gap (need ≥5%)
  rtp-summary                            RTP by mechanic for last run
  watch-gate <gate> <mode>               Poll until gate passes
  coverage                               monteCarlo checklist status

AI
  advisor                                Get AI compliance recommendations

OWC (P4 — stubs until Opportunity Engine implemented)
  owc-param-set <key> <value>            Set OWC weight parameter
  owc-param-list                         List all OWC parameters

ENVIRONMENT
  SANDBOX_URL   Server base URL (default: http://localhost:3001)

EXIT CODES
  0 = success / gate passed
  1 = failure / gate failed / server unreachable

HELP
}

# ── dispatch ──────────────────────────────────────────────────────────────────

CMD="${1:-help}"; shift || true

case "$CMD" in
  health)          cmd_health ;;
  sim)             cmd_sim "$@" ;;
  audit)           cmd_audit "$@" ;;
  role-audit)      cmd_role_audit "$@" ;;
  coverage)        cmd_coverage ;;
  set)             cmd_set "$@" ;;
  get-config)      cmd_get_config ;;
  undo)            cmd_undo ;;
  redo)            cmd_redo ;;
  reset)           cmd_reset ;;
  checkpoint)      cmd_checkpoint ;;
  gate-check)      cmd_gate_check ;;
  advisor)         cmd_advisor ;;
  rtp-summary)     cmd_rtp_summary ;;
  skill-gap)       cmd_skill_gap ;;
  legal-check)     cmd_legal_check "$@" ;;
  watch-gate)      cmd_watch_gate "$@" ;;
  owc-param-set)   cmd_owc_param_set "$@" ;;
  owc-param-list)  cmd_owc_param_list ;;
  help|--help|-h)  cmd_help ;;
  *)               err "Unknown command: $CMD. Run: sandbox-cli.sh help" ;;
esac
