# Design 02 — HollaEx Crypto Payment Integration

**Date:** 2026-05-25 | **Status:** PLANNED — pending T9 PASS

## What Is HollaEx?

HollaEx is an open-source crypto exchange platform with REST/WebSocket API. Supports deposit webhooks, balance queries, and withdrawal processing. User has an API key.

## Proof of Value

Enables PDX/SDX on-ramp via crypto. Broadens payment options beyond traditional fiat. Targets crypto-native player base.

## Expected Impact

Players can fund PDX wallets with crypto deposits. Deposit confirmation fires via HollaEx webhook → server credits PDX balance. Withdrawal request → server initiates HollaEx transfer.

## Architecture

**Server-side only.** API key never touches the browser.

```
Player → Farkle Frenzy server → HollaEx REST API
                              ← HollaEx webhook (deposit confirmed)
                              → insertWalletTransaction (PDX credit)
```

**New file:** `core/apps/server/src/hollaex.ts`
```typescript
const HOLLAEX_API_URL = process.env['HOLLAEX_API_URL'] ?? 'https://api.hollaex.com';
const HOLLAEX_API_KEY = process.env['HOLLAEX_API_KEY'] ?? '';
const HOLLAEX_API_SECRET = process.env['HOLLAEX_API_SECRET'] ?? '';

export async function getWalletBalance(userId: string): Promise<number> { ... }
export async function initiateWithdrawal(userId: string, amountUSD: number): Promise<string> { ... }
export function verifyWebhookSignature(payload: string, sig: string): boolean { ... }
```

**Webhook endpoint:** New Express route in `core/apps/server/src/index.ts`:
```
POST /hollaex/webhook
→ verifyWebhookSignature()
→ insertWalletTransaction({ type: 'PDX_PURCHASE', currency: 'PDX', amount: usdToPDX(depositUSD) })
```

## Risks

| Risk | Mitigation |
|---|---|
| Regulatory: crypto + sweepstakes | Legal review required before production. Crypto on-ramp may require money transmitter license in some states. |
| Key compromise | Server-side env var only. Never in client bundle. Rotate if leaked. |
| Exchange rate volatility | Lock PDX rate at deposit time (snapshot rate). Do not use live rate at withdrawal. |
| HollaEx downtime | Webhook retry queue (existing WAB pattern from analytics.ts). |

## Dependencies

- HollaEx REST API (user's API key)
- `HOLLAEX_API_URL`, `HOLLAEX_API_KEY`, `HOLLAEX_API_SECRET` env vars
- Existing `insertWalletTransaction()` in analytics.ts for PDX credit

## Rollback

Remove `/hollaex/webhook` route and `hollaex.ts`. No database schema changes if PDX credits use existing `wallet_transactions` table. Zero production risk when disabled.

## ADR Required

ADR-022 before implementation: D1: server-side only; D2: rate lock at deposit; D3: webhook signature verification mandatory.
