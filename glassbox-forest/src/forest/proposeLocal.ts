// Browser-safe deterministic proposer. This is the IN-APP half of the Cohere loop: it reads the real-play
// nutrient from the ledger and PROPOSES new experience variations into open coordinates, biased toward the
// families real play is exercising. It imports NO Cohere code (no secret, no network) — the Cohere-enriched
// path stays node-only (scripts/propose_experiences.mjs). Proposals are synthetic + land dormant; a human
// promotes. This connects the "generation → human selection" loop end-to-end in the app.
import { FAMILIES, INFO_SURFACES, SUBSTRATES, type Family, type Coordinate } from '../geometry/d2geometry';
import { specForCoordinate, type BranchSpec } from '../generator/branchGenerator';
import type { CatalogHandle } from './catalog';

export interface LocalProposal { spec: BranchSpec; origin: 'deterministic-local'; rationale: string }

function nutrientByFamily(handle: CatalogHandle): Record<Family, number> {
  const by = Object.fromEntries(FAMILIES.map((f) => [f, 0])) as Record<Family, number>;
  for (const spec of handle.specs) {
    const e = handle.ledger.get(spec.id);
    if (e) by[spec.coordinate.family] += e.realPlayCount;
  }
  return by;
}

function openCoordinates(handle: CatalogHandle): Coordinate[] {
  const existing = new Set(handle.specs.map((s) => `${s.coordinate.family}:${s.coordinate.infoSurface}:${s.coordinate.substrate}`));
  const open: Coordinate[] = [];
  for (const family of FAMILIES) for (const infoSurface of INFO_SURFACES) for (const substrate of SUBSTRATES) {
    if (!existing.has(`${family}:${infoSurface}:${substrate}`)) open.push({ family, infoSurface, substrate });
  }
  return open;
}

/** Propose up to `n` variations, most-played families first (advisory bias — never a promotion). */
export function proposeLocal(handle: CatalogHandle, n = 3): LocalProposal[] {
  const nutrient = nutrientByFamily(handle);
  const order = [...FAMILIES].sort((a, b) => nutrient[b] - nutrient[a]);
  const open = openCoordinates(handle);
  const out: LocalProposal[] = [];
  for (const family of order) {
    for (const c of open.filter((x) => x.family === family)) {
      if (out.length >= n) return out;
      out.push({
        spec: specForCoordinate(c, `proposal|local|${c.family}|${c.infoSurface}|${c.substrate}`),
        origin: 'deterministic-local',
        rationale: `variation adjacent to ${family} (real plays: ${nutrient[family]})`,
      });
    }
  }
  return out;
}
