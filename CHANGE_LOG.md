# magentadice-cyancode Cleanup — Change Log

Date: 2026-05-30
Directive: Repository cleanup v1.0

---

## HUMAN ACTIONS REQUIRED (not automatable — do these now)

### 1. REVOKE THE BRIGHTDATA TOKEN — CRITICAL
The BrightData API token `1b63e5da-7dcf-4c8c-abef-917256b8bb9d` was committed in commit `9323865` and is present in git history.

**Action required:**
1. Revoke the token at: https://brightdata.com/cp/api_tokens
2. Generate a new token and store it locally in `.env.local` (gitignored).
3. Scrub the token from git history **before any public push**:
   ```bash
   git filter-repo --path .mcp.json --invert-paths
   # OR use BFG Repo Cleaner: java -jar bfg.jar --delete-files .mcp.json
   git push origin --force --all   # after history scrub only
   ```
   Note: `git filter-repo` rewrites all commits — coordinate with collaborators.

### 2. DECIDE: data/ binary corpus migration
`data/` contains **2245 tracked binary files** (images + metadata) committed directly as git objects. This makes clone/fetch expensive and bloats the pack file.

**Current state**: Intentional per CLAUDE.md ("local directory, NOT a git submodule").

**Options to consider:**
- **Status quo**: Keep as-is. Fast for local work; expensive for fresh clones.
- **Git LFS**: Track `*.png *.jpeg` via `git lfs`. Requires all contributors to have LFS installed.
- **Separate submodule**: Move to a dedicated `data` repo and register as a submodule.

No automated migration was performed — this is a human decision.

### 3. DECIDE: visual_manifest files location
Per `SCAFFOLD.md` and `CLAUDE.md`, `visual_manifest.json` and `visual_manifest_schema.json` should live at `core/art/manifest/`. However:
- `core/` is a git submodule pointing to FAR_NZY.
- `core/art/manifest/` does not exist in the checked-out submodule.
- Creating directories inside a submodule from the integration layer is not safe.

**Files currently at root:**
- `visual_manifest.json` (61KB)
- `visual_manifest_schema.json` (24KB)

**Required action:** Initialize `core/` submodule (`git submodule update --init core`), then create `core/art/manifest/` inside the FAR_NZY repo and move these files. This is a FAR_NZY repo change, not an integration layer change.

---

## Changes Applied (staged, not committed)

### CRITICAL
- [x] **STEP 1**: BrightData token confirmed in git history (commit 9323865). `.mcp.json` was already untracked (commit b1f3f9e). Human revoke + history scrub required (see above).
- [x] **STEP 2**: `.mcp.json` was already untracked from git before this session. `.gitignore` updated to add explanatory comment.

### HIGH
- [x] **STEP 3**: `data/` confirmed as CASE B (2245 binary files committed directly). CLAUDE.md already documents this as intentional. Human migration decision required (see above).
- [x] **STEP 4**: `scenes/` and `project.godot` do not exist — no stale references found in CLAUDE.md. No action required.
- [x] **STEP 5**: `godot-mcp/` does not exist locally. Documented in CLAUDE.md under Integration Points (Local-only tools section).

### MEDIUM
- [x] **STEP 6**: `.mcp.json` does not exist locally (already removed). `.env.example` created with all required env vars: `BRIGHTDATA_TOKEN`, `GODOT_PATH`, `GODOT_MCP_PATH`, `REPO_ROOT`.
- [ ] **STEP 7a**: `visual_manifest*.json` files — NOT moved. `core/art/manifest/` does not exist (submodule not initialized). Human action required (see above).
- [x] **STEP 7b**: `newmodespec.md` moved → `prompts/newmodespec.md` (git mv, staged). CLAUDE.md references updated.
- [x] **STEP 8**: `CLAUDE.md` header updated: "dream-core-integration" → "magentadice-cyancode integration layer (internally: dream-core-integration)". Repo URL added.

### LOW
- [x] **STEP 9**: `README.md` already existed with correct content. Security section added.
- [x] **STEP 10**: `.gitignore` extended with Godot artifacts (`.godot/`, `*.import`, `export_presets.cfg`, `.godot_version`).
- [x] **STEP 11**: This file (`CHANGE_LOG.md`) created.

---

## Files Modified (staged)

| File | Action |
|------|--------|
| `.gitignore` | Added Godot artifacts block + MCP comment + `!.env.example` exception |
| `.env.example` | Created — env var template for machine-local config |
| `newmodespec.md` | Moved → `prompts/newmodespec.md` (git mv) |
| `CLAUDE.md` | Security section added; repo identity fixed; godot-mcp note added; newmodespec path updated |
| `README.md` | Security section added |
| `CHANGE_LOG.md` | Created (this file) |
