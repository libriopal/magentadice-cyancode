# Local Development Guide — FAR_NZY

Quick reference for running FAR_NZY locally, testing production builds, and
optionally exposing your dev server on `www.ladicepolycall.com` via a tunnel.

---

## Quick start

```bash
git clone https://github.com/libriopal/magentadice-cyancode --recurse-submodules
cd magentadice-cyancode/core
pnpm install
pnpm dev
```

Open **http://localhost:5173** in your browser.

### Submodules

| Submodule | Required | Purpose |
|-----------|----------|---------|
| `core/`   | Yes | FAR_NZY game engine — needed for all game development |
| `dream/`  | Yes | AGROS audio engine |
| `devos/`  | Optional | DevOS development OS (multi-agent tooling); not needed for game dev |

If you cloned without `--recurse-submodules`, initialize only what you need:

```bash
# Game development (required)
git submodule update --init --recursive core dream

# DevOS tooling (optional)
git submodule update --init devos
```

CI must use `submodules: recursive` (or equivalent) if `devos/` is needed in the pipeline.

---

## Dev mode features

When running `pnpm dev`, Vite enables:

| Feature | Detail |
|---|---|
| Hot Module Replacement (HMR) | Instant React component updates without full reload |
| Source maps | Full TypeScript source maps in browser DevTools |
| Console logging | All `console.log` / `console.warn` / `console.error` output visible |
| Network inspector | All Supabase and WebSocket calls visible in DevTools → Network |
| Performance profiling | React DevTools Profiler works out of the box |
| Error overlays | Vite error overlay on unhandled build/runtime errors |

---

## Environment files

Create these files in `core/` (never commit them — they are gitignored):

### `.env.development` — local dev server

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=http://localhost:5173
VITE_MODE=development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### `.env.production` — local production build test

```env
VITE_SUPABASE_URL=https://<your-prod-project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=https://www.ladicepolycall.com
VITE_MODE=production
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

> Use the **`anon` `public`** Supabase key only — never the `service_role` key
> in any file that gets bundled into a frontend build.

---

## Common workflows

### 1. Standard dev session

```bash
cd core
pnpm install          # once, or after pulling new changes
pnpm dev              # start Vite dev server on :5173
```

### 2. Test a production build locally

```bash
cd core
pnpm build:web        # outputs to apps/web/dist/
pnpm --filter @match3d/web preview  # serve dist/ on :4173
```

### 3. Expose dev server on a public URL (tunnel)

See [Tunnel options](#tunnel-options) below.

### 4. Debug Supabase auth or database calls

```bash
# Start local Supabase stack (Docker required)
pnpm supabase:start
# Studio UI at http://localhost:54323
# Then point VITE_SUPABASE_URL=http://localhost:54321 in .env.development
```

### 5. Profile Three.js / Rapier3D render performance

1. Run `pnpm dev` with `--mode development`
2. Open Chrome DevTools → **Performance** tab
3. Click **Record**, play for 10 s, stop
4. Inspect the **Frames** lane for dropped frames
5. Use the React DevTools **Profiler** tab for component re-render analysis

### 6. Test on a mobile device (same LAN)

```bash
# Find your local IP
ip route get 1 | awk '{print $7}' # Linux
ipconfig getifaddr en0             # macOS

# Start dev server bound to all interfaces
cd core && pnpm dev --host
# Open http://<your-local-ip>:5173 on your phone
```

---

## Tunnel options

Tunnels let you test on `www.ladicepolycall.com` locally or share a live dev
URL without deploying.

### Option A — Cloudflare Tunnel (recommended)

Cloudflare Tunnel routes HTTPS traffic from a domain you control to your local
machine with no open ports.

```bash
# Install cloudflared
brew install cloudflared       # macOS
# or: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# One-time login
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create farnzy-local

# Route your domain (requires Cloudflare-managed DNS for ladicepolycall.com)
cloudflared tunnel route dns farnzy-local dev.ladicepolycall.com

# Start tunnel pointing at local Vite server
cloudflared tunnel run --url http://localhost:5173 farnzy-local
```

Your dev server is now live at `https://dev.ladicepolycall.com` with a valid
TLS certificate. Supabase OAuth redirects and PWA service workers work correctly.

### Option B — ngrok (quick share)

```bash
# Install: https://ngrok.com/download
ngrok http 5173
# Creates a random https://xxxxxxxx.ngrok-free.app URL
```

Useful for quick testing but the URL changes on every restart (free tier).

### Option C — Local network only

```bash
cd core && pnpm dev --host
# Use http://<LAN-IP>:5173 on devices on the same Wi-Fi
```

No TLS — some PWA features and Supabase OAuth redirects will not work.

### Option D — GitHub Codespaces

Open the repo in a Codespace. Vite's port forwarding is automatic — the
Codespace gives you a public HTTPS URL for port 5173. Works with OAuth and
PWA features.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| HMR not working — full reload on every change | Vite can't watch files across the `core/` submodule boundary | Run `pnpm dev` from **inside** `core/`, not the repo root |
| Supabase calls fail with `401` | Wrong or missing anon key in `.env.development` | Check `VITE_SUPABASE_ANON_KEY` — copy from Supabase Settings → API |
| Port 5173 already in use | Another Vite process running | `lsof -i :5173` then `kill <PID>`, or use `pnpm dev --port 5174` |
| Three.js / Rapier3D renders blank | WebGL or WASM not initialized | Check browser console for errors; ensure `SharedArrayBuffer` headers are set |
| `pnpm install` fails | Node version mismatch | `node --version` must be 20+; use `nvm use 20` |
| `pnpm type-check` fails with module errors | Workspace symlinks not set up | Re-run `pnpm install` from `core/`; check `pnpm-lock.yaml` is not stale |
| `pnpm build:web` succeeds but preview shows blank | Missing `_redirects` for SPA routing | Add `core/apps/web/public/_redirects` with content `/* /index.html 200` |
| OAuth redirect fails in tunnel | Supabase auth redirect URL not whitelisted | Add your tunnel URL to Supabase → Auth → URL Configuration → Redirect URLs |

---

## Useful commands

```bash
# Dev
pnpm dev                              # Vite dev server on :5173
pnpm dev --host                       # bind to 0.0.0.0 (LAN-accessible)

# Build
pnpm build:web                        # production build → apps/web/dist/
pnpm --filter @match3d/web preview    # serve dist/ on :4173

# Type checking
pnpm type-check                       # all packages
pnpm --filter @match3d/web type-check # web only

# Lint
pnpm lint                             # all packages

# Test
pnpm test                             # all packages
pnpm --filter @match3d/farkle-engine test  # farkle engine only

# Single test file
node --import tsx/esm --test packages/farkle-engine/src/farkleScorer.test.ts

# Supabase local stack
pnpm supabase:start                   # start Docker-based Supabase
pnpm supabase:push                    # push migrations to local stack
pnpm supabase:gen-types               # regenerate TypeScript types from schema
```

---

## Performance optimization tips

- **Three.js draw calls:** Use `renderer.info.render` in dev to monitor draw calls. Target < 100 per frame for 60 fps on mid-range mobile.
- **Rapier3D WASM:** The physics WASM module is ~2 MB. Ensure it is served with `Cache-Control: max-age=31536000, immutable` in production.
- **Bundle size:** Run `pnpm --filter @match3d/web build -- --report` to open the Rollup bundle visualizer.
- **PWA caching:** The service worker pre-caches the WASM binary. On first load, Rapier3D initialization takes 200–500 ms; subsequent loads use the cache.

---

## See also

- **Full deployment guide:** `core/DEPLOY.md`
- **CI/CD secrets setup:** `.github/SECRETS_SETUP.md`
- **Game design authority:** `core/FARKLEFRENZY.md`
- **Visual design law:** `3libras/the_visual_layer.md`
