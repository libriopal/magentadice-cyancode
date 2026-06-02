# GitHub Secrets Setup — FAR_NZY Deployment

This document covers every secret required for the CI/CD workflows that deploy
FAR_NZY to `www.ladicepolycall.com` (production) and the Netlify staging site.

---

## Required Secrets

| Secret name | Used in | Where to get it |
|---|---|---|
| `NETLIFY_AUTH_TOKEN` | Both workflows | Netlify → User Settings → Personal access tokens |
| `NETLIFY_SITE_ID_PRODUCTION` | `deploy-production.yml` | Netlify → Production site → Site configuration → Site ID |
| `NETLIFY_SITE_ID_STAGING` | `deploy-staging.yml` | Netlify → Staging site → Site configuration → Site ID |
| `PROD_SUPABASE_URL` | `deploy-production.yml` | Supabase → Production project → Settings → API → Project URL |
| `PROD_SUPABASE_KEY` | `deploy-production.yml` | Supabase → Production project → Settings → API → `anon` `public` key |
| `STAGING_SUPABASE_URL` | `deploy-staging.yml` | Supabase → Staging project → Settings → API → Project URL |
| `STAGING_SUPABASE_KEY` | `deploy-staging.yml` | Supabase → Staging project → Settings → API → `anon` `public` key |

---

## Step 1 — Get your Netlify auth token

1. Log in to [app.netlify.com](https://app.netlify.com)
2. Click your avatar (top-right) → **User settings**
3. Navigate to **Applications** → **Personal access tokens**
4. Click **New access token**
5. Name it `github-actions-farnzy` and set an expiry (or no expiry for CI)
6. Copy the token — it is shown **once only**

---

## Step 2 — Get Netlify site IDs

You need **two separate Netlify sites** — one for production, one for staging.

### Production site
1. In Netlify, open (or create) the site connected to `www.ladicepolycall.com`
2. Navigate to **Site configuration** → **General**
3. Copy the **Site ID** (a UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Staging site
1. Create a second Netlify site for staging (or use an existing preview site)
2. Follow the same path: **Site configuration** → **General** → **Site ID**

> **Domain note:** The production site's Netlify domain must have a CNAME record
> pointing `www.ladicepolycall.com` → `<your-site>.netlify.app`. Configure this
> via the Netlify custom domains panel — Netlify handles the edge certificate.
> Squarespace DNS: add a CNAME record `www` → `<your-netlify-subdomain>.netlify.app`.

---

## Step 3 — Get Supabase credentials

### Production project
1. Open [app.supabase.com](https://app.supabase.com) → select your **production** project
2. Navigate to **Settings** → **API**
3. Copy **Project URL** → `PROD_SUPABASE_URL`
4. Copy the **`anon` `public`** key → `PROD_SUPABASE_KEY`
   - Do **not** use the `service_role` key in a frontend build

### Staging project
1. Select your **staging** project (create one if needed: free tier is sufficient)
2. Repeat the same steps → `STAGING_SUPABASE_URL` / `STAGING_SUPABASE_KEY`

---

## Step 4 — Add secrets to GitHub

1. Open the repository at `github.com/libriopal/magentadice-cyancode`
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the 7 secrets in the table above
4. Paste the value exactly — no quotes, no trailing whitespace

---

## Verify secrets are registered

```bash
gh secret list --repo libriopal/magentadice-cyancode
```

Expected output (names only — values are never shown):

```
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID_PRODUCTION
NETLIFY_SITE_ID_STAGING
PROD_SUPABASE_KEY
PROD_SUPABASE_URL
STAGING_SUPABASE_KEY
STAGING_SUPABASE_URL
```

---

## Test a deployment

### Production (push to main)
```bash
git checkout main
git commit --allow-empty -m "chore: trigger production deploy test"
git push origin main
```

Then watch the **Actions** tab for the `Deploy Production` workflow.

### Staging (open a PR)
```bash
git checkout -b test/staging-deploy
git commit --allow-empty -m "chore: trigger staging deploy test"
git push origin test/staging-deploy
gh pr create --base develop --title "Test staging deploy" --body "Deploy test"
```

The `Deploy Staging` workflow runs, and a Netlify preview URL is posted as a PR
comment automatically.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Error: NETLIFY_AUTH_TOKEN is not set` | Secret missing or misspelled | Re-check step 4; names are case-sensitive |
| `Failed to deploy to Netlify: 401` | Token expired or revoked | Regenerate in Netlify → User settings → Access tokens |
| `Error: NETLIFY_SITE_ID is not set` | Wrong secret name used | Confirm `NETLIFY_SITE_ID_PRODUCTION` / `NETLIFY_SITE_ID_STAGING` exactly |
| Build fails on `pnpm type-check` | TypeScript errors in the PR | Fix TS errors locally: `cd core && pnpm type-check` |
| Build fails on `pnpm build:web` | Missing `VITE_SUPABASE_URL` | Confirm both Supabase secrets are set for the environment |
| PR comment never appears | Insufficient permissions | Confirm the workflow has `pull-requests: write` permission |
| Domain not resolving | DNS not propagated | Check Squarespace DNS CNAME for `www`; allow 24–48 h for TTL |
| Netlify shows 404 on SPA routes | Missing `_redirects` | Ensure `netlify.toml` or `public/_redirects` has `/* /index.html 200` |

---

## netlify.toml reference

Create `netlify.toml` at the repo root (or `core/apps/web/netlify.toml` if you
prefer to keep it with the app):

```toml
[build]
  base    = "core"
  command = "pnpm build:web"
  publish = "apps/web/dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

This ensures SPA client-side routing works on direct URL loads and refreshes.

---

## Next steps after secrets are set

1. Merge this PR to `main` — the production workflow fires automatically
2. Confirm `www.ladicepolycall.com` loads the production build
3. Open a test PR against `develop` — confirm the staging preview URL in the PR comment
4. Add `netlify.toml` to the repo root (see above) if not already present
