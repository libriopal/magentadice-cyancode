// Ecosystem execution audit (advisory, NON-RATIFYING). Drives the full play → journal → ledger →
// evidence path for every playable experiment while deliberately forcing losing play (Farkle, zero-keep,
// missed target, Hold-the-Crown bust), then verifies: every session stays provably fair, imperfect play
// is captured faithfully, the survey nutrient ingests, the forbidden-field strip holds on export, and the
// FOREST ledger reflects the real plays. It classifies findings and never ratifies (C3).
import { buildCanonicalCatalog, type CatalogHandle } from '../forest/catalog';
import { applyEvent, exportEvidence, type ForestEvent } from '../forest/journal';
import { EMPTY_STORE, type EvidenceStoreShape, type SessionRecord } from '../evidence/schema';
import { containsForbidden } from '../evidence/forbiddenFields';
import { SPARKS } from '../sparks/wallet';
import * as oneRoll from '../experiments/one-roll/oneRoll';
import * as keeper from '../experiments/keeper/keeper';
import * as target from '../experiments/target/target';
import * as hold from '../experiments/hold-crown/holdCrown';

export interface AuditScenario { experiment: string; forcedMistake: string; fairnessOk: boolean }
export interface EcosystemAuditReport {
  generatedAt: string;
  ratifying: false;
  scenarios: AuditScenario[];
  mistakesObserved: boolean;
  surveyNutrientIngested: boolean;
  forbiddenPresent: boolean;
  ledgerReflectsPlays: boolean;
  ok: boolean;
}

function play(handle: CatalogHandle, ev: EvidenceStoreShape, experimentId: string, outcome: { server_seed: string; commitment: string }, sid: string): void {
  const session: SessionRecord = {
    id: sid, user_id: 'audit', experiment_id: experimentId, detected_region: 'TX',
    region_method: 'manual-dev-override', region_allowed: true,
    server_seed: outcome.server_seed, server_seed_hash: outcome.commitment, revealed_at: 't',
    outcome_json: JSON.stringify(outcome), decision_json: null, sparks_awarded: SPARKS.PLAY, created_at: 't',
  };
  applyEvent(handle, ev, { kind: 'play', at: 't', session } as ForestEvent);
}

export async function runEcosystemAudit(now = new Date().toISOString()): Promise<EcosystemAuditReport> {
  const handle = buildCanonicalCatalog();
  const ev = structuredClone(EMPTY_STORE);
  const scenarios: AuditScenario[] = [];

  // One-Roll → forced Farkle
  const orC = await oneRoll.commit();
  let orOutcome = (await oneRoll.reveal(orC, 'x', 6)).outcome;
  for (let i = 0; i < 2000 && !orOutcome.is_farkle; i++) orOutcome = (await oneRoll.reveal(orC, `s${i}`, 6)).outcome;
  scenarios.push({ experiment: 'one-roll', forcedMistake: `Farkle score ${orOutcome.score}`, fairnessOk: (await oneRoll.verifyOutcome(orOutcome)).ok });
  play(handle, ev, 'one-roll', orOutcome, 'a1');

  // Keeper → bank nothing
  const kC = await keeper.commit();
  const kR = await keeper.revealFaces(kC, 'x');
  const kOut = keeper.resolve(kC, 'x', kR.combined, kR.faces, []);
  scenarios.push({ experiment: 'keeper', forcedMistake: `kept 0 → score ${kOut.score}`, fairnessOk: (await keeper.verifyOutcome(kOut)).ok });
  play(handle, ev, 'keeper', kOut, 'a2');

  // Target → missed impossible target
  const tC = await target.commit();
  const tOut = await target.reveal(tC, 'x', 1, target.MAX_TARGET);
  scenarios.push({ experiment: 'target', forcedMistake: `missed ${tOut.target_score} (score ${tOut.score})`, fairnessOk: (await target.verifyOutcome(tOut)).ok });
  play(handle, ev, 'target', tOut, 'a3');

  // Hold the Crown → force a bust while holding
  const hC = await hold.commit();
  let hOut = await hold.resolveSession(hC, 'x', ['hold', 'hold']);
  for (let i = 0; i < 400 && !hOut.busted; i++) hOut = await hold.resolveSession(hC, `s${i}`, ['hold', 'hold', 'hold']);
  scenarios.push({ experiment: 'hold-crown', forcedMistake: `busted=${hOut.busted}, total ${hOut.final_total}`, fairnessOk: (await hold.verifyOutcome(hOut)).ok });
  play(handle, ev, 'hold-crown', hOut, 'a4');

  // Survey nutrient on one session
  applyEvent(handle, ev, { kind: 'survey', at: now, survey: { id: 'sv', session_id: 'a1', user_id: 'audit', experiment_id: 'one-roll', answers_json: '{"engagement":2}', reflection_text: 'went too greedy', sparks_bonus: SPARKS.SURVEY_COMPLETION, created_at: now } });

  const exported = exportEvidence(ev);
  const forbiddenPresent = containsForbidden(ev) || containsForbidden(exported);
  const mistakesObserved = orOutcome.is_farkle && kOut.score === 0 && !tOut.met_target && hOut.busted;
  const surveyNutrientIngested = ev.surveys.length > 0 && ev.surveys.every((s) => s.reflection_text.length > 0);
  const ledgerReflectsPlays = ['one-roll', 'keeper', 'target', 'hold-crown'].every((exp) => {
    const b = handle.experimentToBranch[exp]!;
    return handle.ledger.get(b)!.realPlayCount >= 1;
  });
  const ok = scenarios.every((s) => s.fairnessOk) && mistakesObserved && surveyNutrientIngested && !forbiddenPresent && ledgerReflectsPlays;

  return { generatedAt: now, ratifying: false, scenarios, mistakesObserved, surveyNutrientIngested, forbiddenPresent, ledgerReflectsPlays, ok };
}
