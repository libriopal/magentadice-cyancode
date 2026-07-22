# Netlify deploy — FAR_NZY web client (`core/apps/web`)

This deploys the **FAR_NZY game** (`core/`, submodule → `libriopal/FAR_NZY`). It is **not** the
GLASSBOX Labs sandbox (`glassbox-labs/`), which is a separate Vite app and — for a public deploy —
is behind gate **G2** (see `glassbox-labs/governance/HUMAN_GATES.md`).

## The root `netlify.toml` is authoritative
Netlify reads `netlify.toml` at the repo root and its `[build]` block **overrides the UI fields** for
base / command / publish. Keep the UI in sync with it (or leave the UI blank and let the file drive):

| Netlify UI field | Value | Notes |
|---|---|---|
| **Base directory** | `core` | FAR_NZY submodule mount point; `pnpm build:web` only exists there. |
| **Build command** | `pnpm build:web` | = `pnpm -C apps/web build` = `tsc && vite build`. |
| **Publish directory** | `apps/web/dist` | Relative to base → resolves to `core/apps/web/dist`. **No leading `/`.** |
| **Functions directory** | *(leave empty)* | FAR_NZY has **no Netlify Functions**; backend is Supabase Edge Functions + `apps/server`. |

Environment (already pinned in `netlify.toml`): `NODE_VERSION=20`, `PNPM_VERSION=9`. The file also ships
the COOP/COEP headers Rapier3D WASM needs (`SharedArrayBuffer`), the SPA catch-all redirect, and asset
caching — none of that needs UI configuration.

## REQUIRED: private-submodule access (the #1 cause of failed builds)
`base = "core"` only works if Netlify can clone the **private** submodule
`core → github.com/libriopal/FAR_NZY` (and `dream → libriopal/adabt-core` if pulled in). Netlify cannot
clone a private submodule over HTTPS without a key. Steps:

1. Netlify site → **Site configuration → Build & deploy → Continuous deployment → Deploy key** →
   *Generate/Copy* the deploy key.
2. Add that key as a **Deploy key** on **`libriopal/FAR_NZY`** (GitHub repo → Settings → Deploy keys →
   *Add deploy key*, read-only is fine). Repeat on `libriopal/adabt-core` if `dream` is used.
3. `.gitmodules` uses HTTPS URLs. If Netlify's submodule fetch still fails auth, switch the submodule URL
   to SSH so the deploy key is used:
   ```bash
   git config -f .gitmodules submodule.core.url git@github.com:libriopal/FAR_NZY.git
   git submodule sync
   ```
   (Commit the `.gitmodules` change.) Netlify inits submodules automatically once it has access.

## Sanity check before trusting a green deploy
- Build log shows the `core` submodule cloned (not `skipping submodule` / auth error).
- `core/apps/web/dist/index.html` exists in the publish step.
- Loaded site: physics scene initializes (confirms the WASM COOP/COEP headers are applied).

NOT legal advice; this is deploy configuration only.
