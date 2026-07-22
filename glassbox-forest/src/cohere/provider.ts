// Cohere provider — the actual API call, guarded so it degrades cleanly with no key (local/sandbox).
// NODE-SIDE ONLY (uses the G3 secret key). When no key is present it returns { degraded: true } and
// makes NO network call, so the proposer falls back to the deterministic path. Everything it returns is
// SYNTHETIC provenance — it can never become nutrient or move ledger state.
import { cohereApiKey, isCohereAvailable, COHERE_MODEL } from './config';
import type { Family, InfoSurface, Substrate } from '../geometry/d2geometry';

export interface RawProposal {
  family: Family;
  infoSurface: InfoSurface;
  substrate: Substrate;
  rationale: string;
  syntheticScore: number; // Cohere's own confidence — advisory only, NEVER nutrient
}

export interface ProviderResult {
  proposals: RawProposal[];
  degraded: boolean; // true when no key / call skipped → caller uses the deterministic fallback
  costUsd: number;
}

/** Estimated cost of one proposal call (rough; the budget guard uses this before spending). */
export const EST_CALL_COST_USD = 0.02;

/**
 * Ask Cohere to propose experience variations. With no key (sandbox), returns degraded immediately —
 * no network, no spend. The prompt is passed as a plain string; the caller supplies the nutrient +
 * geometry context. Output is parsed defensively; malformed output → degraded (never throws upward).
 */
export async function cohereProposeVariations(prompt: string, n: number): Promise<ProviderResult> {
  if (!isCohereAvailable()) {
    return { proposals: [], degraded: true, costUsd: 0 };
  }
  try {
    const res = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${cohereApiKey()}` },
      body: JSON.stringify({
        model: COHERE_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an ADVISORY experience-proposal engine. You PROPOSE candidate game-experience ' +
              'variations as JSON. You do NOT decide, promote, deploy, score human outcomes, or rank ' +
              'anything as "better". Your output is synthetic and never evidence. Respond with a JSON ' +
              `array of up to ${n} objects: {family, infoSurface, substrate, rationale, syntheticScore}.`,
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const json = (await res.json()) as { message?: { content?: Array<{ text?: string }> } };
    const text = json.message?.content?.map((c) => c.text ?? '').join('') ?? '';
    const parsed = JSON.parse(extractJsonArray(text)) as RawProposal[];
    return { proposals: parsed.slice(0, n), degraded: false, costUsd: EST_CALL_COST_USD };
  } catch {
    // Any failure (network, parse, auth) → degrade to deterministic. Never break the ecosystem.
    return { proposals: [], degraded: true, costUsd: 0 };
  }
}

function extractJsonArray(text: string): string {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  return start >= 0 && end > start ? text.slice(start, end + 1) : '[]';
}
