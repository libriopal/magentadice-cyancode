// EXPERIENCE-PROPOSAL ENGINE — the compliant Cohere use (generation, NOT selection). It reads the
// real-play nutrient (observed only), asks Cohere to PROPOSE new experience variations (or degrades to
// a deterministic proposer with no key/budget), and registers each proposal into the FOREST ledger as a
// DORMANT 'generated' branch. It NEVER promotes, nourishes, deploys, or ranks a branch as "positive"
// in a way that moves state. A human (or a human-set real-play policy) promotes. Synthetic score is
// advisory and never becomes nutrient. NODE-SIDE ONLY (config reads the G3 secret).
import {
  FAMILIES, INFO_SURFACES, SUBSTRATES, type Family, type InfoSurface, type Substrate, type Coordinate,
} from '../geometry/d2geometry';
import { specForCoordinate, type BranchSpec } from '../generator/branchGenerator';
import type { CatalogHandle } from '../forest/catalog';
import { SpendTracker } from './budget';
import { cohereProposeVariations, EST_CALL_COST_USD } from './provider';
import { isCohereAvailable } from './config';

export interface NutrientSummary {
  byFamily: Record<Family, number>; // real (observed) play counts per family — the only nutrient
  totalRealPlays: number;
}

export interface ExperienceProposal {
  spec: BranchSpec;
  provenance: 'synthetic';                       // NEVER 'observed'
  origin: 'cohere' | 'deterministic-fallback';
  rationale: string;
  syntheticScore: number;                        // advisory only — never nutrient, never moves state
}

/** Read the real-play nutrient from the ledger. Counts ONLY observed real plays (the ledger already
 *  refuses synthetic), grouped by the family of each branch. */
export function readNutrient(handle: CatalogHandle): NutrientSummary {
  const byFamily = Object.fromEntries(FAMILIES.map((f) => [f, 0])) as Record<Family, number>;
  let total = 0;
  for (const spec of handle.specs) {
    const entry = handle.ledger.get(spec.id);
    if (!entry) continue;
    byFamily[spec.coordinate.family] += entry.realPlayCount;
    total += entry.realPlayCount;
  }
  return { byFamily, totalRealPlays: total };
}

/** Families ordered by nutrient (most-played first); ties + zero-nutrient fall back to canonical order.
 *  This BIASES where we propose (advisory) — it never promotes anything. */
function familiesByNutrient(n: NutrientSummary): Family[] {
  return [...FAMILIES].sort((a, b) => n.byFamily[b] - n.byFamily[a]);
}

/** Coordinates not already present in the catalog/ledger — the space we may propose into. */
function openCoordinates(handle: CatalogHandle): Coordinate[] {
  const existing = new Set(handle.specs.map((s) => `${s.coordinate.family}:${s.coordinate.infoSurface}:${s.coordinate.substrate}`));
  const open: Coordinate[] = [];
  for (const family of FAMILIES) {
    for (const infoSurface of INFO_SURFACES) {
      for (const substrate of SUBSTRATES) {
        if (!existing.has(`${family}:${infoSurface}:${substrate}`)) open.push({ family, infoSurface, substrate });
      }
    }
  }
  return open;
}

/** Deterministic fallback proposer: propose sibling variations (alternate substrates) biased toward the
 *  families that real play is exercising. Fully reproducible; used when Cohere is unavailable/over-budget. */
function deterministicProposals(handle: CatalogHandle, nutrient: NutrientSummary, n: number): ExperienceProposal[] {
  const order = familiesByNutrient(nutrient);
  const open = openCoordinates(handle);
  const out: ExperienceProposal[] = [];
  for (const family of order) {
    for (const c of open.filter((x) => x.family === family)) {
      if (out.length >= n) return out;
      const seed = `proposal|${family}|${c.infoSurface}|${c.substrate}`;
      out.push({
        spec: specForCoordinate(c, seed),
        provenance: 'synthetic',
        origin: 'deterministic-fallback',
        rationale: `variation adjacent to the ${family} family (real plays: ${nutrient.byFamily[family]})`,
        syntheticScore: 0, // no confidence claim in the deterministic path
      });
    }
  }
  return out;
}

function coerce<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Propose `n` experience variations. Cohere path when a key is present AND the experience-proposal
 * budget allows; otherwise the deterministic fallback. Records spend only for real Cohere calls, and
 * only within the isolated budget (else it degrades rather than overspends).
 */
export async function proposeExperiences(
  handle: CatalogHandle,
  tracker: SpendTracker,
  n = 3
): Promise<{ proposals: ExperienceProposal[]; degraded: boolean }> {
  const nutrient = readNutrient(handle);

  const budgetOk = tracker.canSpend('experience-proposal', EST_CALL_COST_USD);
  if (isCohereAvailable() && budgetOk) {
    const prompt = buildPrompt(handle, nutrient, n);
    const result = await cohereProposeVariations(prompt, n);
    if (!result.degraded && result.proposals.length > 0) {
      tracker.record('experience-proposal', result.costUsd);
      const open = new Set(openCoordinates(handle).map((c) => `${c.family}:${c.infoSurface}:${c.substrate}`));
      const proposals: ExperienceProposal[] = [];
      for (const raw of result.proposals) {
        const c: Coordinate = {
          family: coerce<Family>(raw.family, FAMILIES, 'commitment'),
          infoSurface: coerce<InfoSurface>(raw.infoSurface, INFO_SURFACES, 'hidden'),
          substrate: coerce<Substrate>(raw.substrate, SUBSTRATES, 'contest'),
        };
        if (!open.has(`${c.family}:${c.infoSurface}:${c.substrate}`)) continue; // only propose into open space
        proposals.push({
          spec: specForCoordinate(c, `proposal|cohere|${c.family}|${c.infoSurface}|${c.substrate}`),
          provenance: 'synthetic',
          origin: 'cohere',
          rationale: String(raw.rationale ?? 'cohere-proposed variation'),
          syntheticScore: Number.isFinite(raw.syntheticScore) ? raw.syntheticScore : 0,
        });
      }
      if (proposals.length > 0) return { proposals, degraded: false };
    }
  }
  // No key, over budget, or empty/failed Cohere output → deterministic fallback.
  return { proposals: deterministicProposals(handle, nutrient, n), degraded: true };
}

function buildPrompt(handle: CatalogHandle, nutrient: NutrientSummary, n: number): string {
  const open = openCoordinates(handle).slice(0, 40).map((c) => `${c.family}/${c.infoSurface}/${c.substrate}`);
  return [
    `Nutrient (REAL human plays per family, the only evidence): ${JSON.stringify(nutrient.byFamily)}.`,
    `Total real plays: ${nutrient.totalRealPlays}.`,
    `Propose up to ${n} NEW experience variations from these OPEN coordinates only: ${open.join(', ')}.`,
    'You are proposing candidates for HUMAN review — you do not choose which ship. Return JSON only.',
  ].join('\n');
}

/**
 * Register proposals into the FOREST ledger as DORMANT 'generated' branches, annotating each with a
 * synthetic provenance note. This is the ONLY ledger interaction the proposer performs: it NEVER calls
 * markSeededPlayable / recordPlay / nourish. Promotion is a separate human action.
 */
export function registerProposals(handle: CatalogHandle, proposals: ExperienceProposal[]): string[] {
  const registered: string[] = [];
  for (const p of proposals) {
    if (handle.ledger.get(p.spec.id)) continue; // already known — skip
    handle.ledger.register(p.spec); // → state 'generated' (dormant)
    handle.ledger.noteSyntheticSignal(p.spec.id, `cohere-proposal (${p.origin}): ${p.rationale} [syntheticScore=${p.syntheticScore}]`);
    handle.specs.push(p.spec); // so the Library can render it as a dormant candidate
    registered.push(p.spec.id);
  }
  return registered;
}
