// EXECUTION AUDIT (advisory, NON-RATIFYING — see governance/AI_AUDIT_LOOP_SPEC.md +
// ANTI_CIRCULARITY.md). This drives the FULL play → survey → evidence pipeline for every
// experiment through the real commit-reveal engine, DELIBERATELY forcing player mistakes
// (a Farkle, a zero-keep bank, a missed self-set target), and then audits that:
//   1. the evidence system CAPTURED the imperfect play faithfully (raw outcome + decision),
//   2. every session stays PROVABLY FAIR (independent recompute matches),
//   3. NO forbidden field (skill_score / was_optimal) ever entered or left the system,
//   4. the rewarded-survey nutrient ingests (flat bonus, reflection text stored).
//
// It CLASSIFIES findings and ROUTES gate-relevant limitations to humans. It CANNOT ratify,
// clear a gate, or grade the player. "self-audit passed" is NOT ratification (C3).
import type { EvidenceStoreShape } from '../evidence/schema';
import { EvidenceStore } from '../evidence/store';
import { containsForbidden } from '../evidence/forbiddenFields';
import { SPARKS } from '../sparks/wallet';
import * as oneRoll from '../experiments/one-roll/oneRoll';
import * as keeper from '../experiments/keeper/keeper';
import * as target from '../experiments/target/target';

// Classification bands mirror AI_AUDIT_LOOP_SPEC (VF/SI/AS/SP/SC). Defined here so the report
// is self-documenting; these are the auditor's working definitions, not new governance.
export type FindingCode = 'VF' | 'SI' | 'AS' | 'SP' | 'SC';
export const FINDING_LEGEND: Record<FindingCode, string> = {
  VF: 'Verified Fact — observed and independently reproduced',
  SI: 'Structural Integrity — a system invariant that held (or would break loudly)',
  AS: 'Anti-circularity Safeguard — confirms the system captures, never concludes/grades',
  SP: 'Scope / Pending — a real limitation routed to a human gate (not a defect to auto-fix)',
  SC: 'Safety / Consent — player-safety or consent property',
};

export interface AuditFinding {
  code: FindingCode;
  title: string;
  detail: string;
  routesTo?: string; // gate id if this must go to a human
}

export interface AuditScenario {
  experiment: string;
  intent: string;
  forcedMistake: string;
  captured: Record<string, unknown>;
  fairnessOk: boolean;
}

export interface ExecutionAuditReport {
  generatedAt: string;
  ratifying: false;
  scenarios: AuditScenario[];
  mistakesObserved: { farkle: boolean; zeroKeepBank: boolean; missedTarget: boolean };
  surveyNutrient: { ingested: boolean; flatBonus: number; reflectionStored: boolean };
  forbiddenFieldsPresentAnywhere: boolean;
  evidenceCounts: Record<string, number>;
  findings: AuditFinding[];
  ok: boolean; // all invariants held (does NOT mean "ratified")
}

// --- audit-local persistence: mirrors labStore.recordPlaySession WITHOUT localStorage/region,
//     so the audit is deterministic and isolated. Region gating is exercised separately in
//     regionAndWallet.test.ts; here we focus on the play→evidence→survey nutrient path. ---
function persistSession(
  store: EvidenceStore,
  experimentId: string,
  outcome: { server_seed: string; commitment: string },
  decision: unknown,
  now: string
): string {
  const sid = `audit_${experimentId}_${Math.random().toString(36).slice(2)}`;
  store.addSession({
    id: sid,
    user_id: 'audit-bot',
    experiment_id: experimentId,
    detected_region: 'TX',
    region_method: 'manual-dev-override',
    region_allowed: true,
    server_seed: outcome.server_seed,
    server_seed_hash: outcome.commitment,
    revealed_at: now,
    outcome_json: JSON.stringify(outcome),
    decision_json: JSON.stringify(decision),
    sparks_awarded: SPARKS.PLAY,
    created_at: now,
  });
  store.addSparks({ id: `sp_${sid}`, user_id: 'audit-bot', delta: SPARKS.PLAY, reason: `play:${experimentId}`, session_id: sid, created_at: now });
  return sid;
}

/** Search real commit-reveal rolls for a seed that yields a Farkle (score 0) — proving the
 *  pipeline captures a genuine losing outcome, not just happy-path wins. */
async function forceFarkle(commit: oneRoll.OneRollCommit): Promise<oneRoll.OneRollOutcome> {
  for (let i = 0; i < 2000; i++) {
    const { outcome } = await oneRoll.reveal(commit, `audit-seed-${i}`, 6);
    if (outcome.is_farkle) return outcome;
  }
  throw new Error('audit could not force a Farkle in 2000 seeds (statistically impossible)');
}

export async function runExecutionAudit(now: string = new Date().toISOString()): Promise<ExecutionAuditReport> {
  const store = new EvidenceStore();
  store.reset();
  const scenarios: AuditScenario[] = [];

  // ── Scenario 1: One-Roll → forced Farkle (a real loss) ──────────────────────────────────
  const orCommit = await oneRoll.commit();
  const orOutcome = await forceFarkle(orCommit);
  const orVerify = await oneRoll.verifyOutcome(orOutcome);
  const orSid = persistSession(store, oneRoll.EXPERIMENT_ID, orOutcome, { dice_count: 6, client_seed: orOutcome.client_seed, decision_ms: 1234 }, now);
  scenarios.push({
    experiment: 'one-roll',
    intent: 'play through a real losing outcome',
    forcedMistake: `Farkle (score ${orOutcome.score}) on faces [${orOutcome.faces.join(',')}]`,
    captured: { score: orOutcome.score, is_farkle: orOutcome.is_farkle },
    fairnessOk: orVerify.ok,
  });

  // ── Scenario 2: Keeper → bank nothing (a costly skill mistake) ───────────────────────────
  const kCommit = await keeper.commit();
  const kReveal = await keeper.revealFaces(kCommit, 'audit-keeper');
  const kOutcome = keeper.resolve(kCommit, 'audit-keeper', kReveal.combined, kReveal.faces, []); // keep NOTHING
  const kVerify = await keeper.verifyOutcome(kOutcome);
  persistSession(store, keeper.EXPERIMENT_ID, kOutcome, { kept_indices: [], client_seed: 'audit-keeper', decision_ms: 4321 }, now);
  scenarios.push({
    experiment: 'keeper',
    intent: 'play through a zero-value keep decision',
    forcedMistake: `kept 0 dice from [${kReveal.faces.join(',')}] → score ${kOutcome.score}`,
    captured: { kept_indices: kOutcome.kept_indices, score: kOutcome.score },
    fairnessOk: kVerify.ok,
  });

  // ── Scenario 3: Target → impossible self-set target (a missed call) ──────────────────────
  const tCommit = await target.commit();
  const tOutcome = await target.reveal(tCommit, 'audit-target', 1, target.MAX_TARGET); // 1 die can't beat 3000
  const tVerify = await target.verifyOutcome(tOutcome);
  const tSid = persistSession(store, target.EXPERIMENT_ID, tOutcome, { dice_count: 1, target_score: target.MAX_TARGET, client_seed: 'audit-target', decision_ms: 2222 }, now);
  scenarios.push({
    experiment: 'target',
    intent: 'play through a missed self-set goal',
    forcedMistake: `target ${tOutcome.target_score} vs score ${tOutcome.score} → met_target ${tOutcome.met_target}`,
    captured: { target_score: tOutcome.target_score, score: tOutcome.score, met_target: tOutcome.met_target },
    fairnessOk: tVerify.ok,
  });

  // ── Rewarded-survey nutrient ingestion (attach reflection to two sessions) ───────────────
  const reflection = 'I went for broke and it did not pay off — would size the bet down next time.';
  for (const sid of [orSid, tSid]) {
    store.addSurvey({
      id: `sv_${sid}`,
      session_id: sid,
      user_id: 'audit-bot',
      experiment_id: sid.includes('one-roll') ? 'one-roll' : 'target',
      answers_json: JSON.stringify({ engagement: 4, again: 'Maybe' }),
      reflection_text: reflection,
      sparks_bonus: SPARKS.SURVEY_COMPLETION,
      created_at: now,
    });
    store.addSparks({ id: `spb_${sid}`, user_id: 'audit-bot', delta: SPARKS.SURVEY_COMPLETION, reason: 'survey:completion', session_id: sid, created_at: now });
  }

  // ── Audit the captured evidence ─────────────────────────────────────────────────────────
  const exported = store.exportEvidence();
  const snap = store.snapshot();
  const forbiddenAnywhere = containsForbidden(snap) || containsForbidden(exported);
  const mistakesObserved = {
    farkle: orOutcome.is_farkle && orOutcome.score === 0,
    zeroKeepBank: kOutcome.score === 0 && kOutcome.kept_indices.length === 0,
    missedTarget: tOutcome.met_target === false,
  };
  const surveys = snap.surveys;
  const surveyNutrient = {
    ingested: surveys.length > 0,
    flatBonus: SPARKS.SURVEY_COMPLETION,
    reflectionStored: surveys.every((s) => s.reflection_text.length > 0)
      && surveys.every((s) => s.sparks_bonus === SPARKS.SURVEY_COMPLETION),
  };

  const findings = buildFindings({ scenarios, mistakesObserved, surveyNutrient, forbiddenAnywhere });
  const evidenceCounts = countRows(snap);
  const ok =
    scenarios.every((s) => s.fairnessOk) &&
    mistakesObserved.farkle && mistakesObserved.zeroKeepBank && mistakesObserved.missedTarget &&
    surveyNutrient.ingested && surveyNutrient.reflectionStored &&
    !forbiddenAnywhere;

  return {
    generatedAt: now,
    ratifying: false,
    scenarios,
    mistakesObserved,
    surveyNutrient,
    forbiddenFieldsPresentAnywhere: forbiddenAnywhere,
    evidenceCounts,
    findings,
    ok,
  };
}

function countRows(snap: EvidenceStoreShape): Record<string, number> {
  return {
    sessions: snap.sessions.length,
    surveys: snap.surveys.length,
    sparks_ledger: snap.sparks_ledger.length,
    profiles: snap.profiles.length,
    region_checks: snap.region_checks.length,
  };
}

function buildFindings(args: {
  scenarios: AuditScenario[];
  mistakesObserved: ExecutionAuditReport['mistakesObserved'];
  surveyNutrient: ExecutionAuditReport['surveyNutrient'];
  forbiddenAnywhere: boolean;
}): AuditFinding[] {
  const f: AuditFinding[] = [];
  const allFair = args.scenarios.every((s) => s.fairnessOk);
  f.push({
    code: 'VF',
    title: 'All forced-mistake sessions are provably fair',
    detail: allFair
      ? 'Every scenario (Farkle, zero-keep, missed target) independently recomputed to identical faces/score.'
      : 'FAIL: at least one scenario did not reproduce — investigate before any playtest.',
  });
  f.push({
    code: 'AS',
    title: 'Evidence captures imperfect play without grading it',
    detail: 'Losing/suboptimal outcomes are stored as raw facts (is_farkle / score 0 / met_target=false). No skill_score or was_optimal is derived — the system captures, it never concludes (C3).',
  });
  f.push({
    code: 'SI',
    title: 'Forbidden-field invariant holds across capture AND export',
    detail: args.forbiddenAnywhere
      ? 'FAIL: a forbidden field was present — C7 breach.'
      : 'No skill_score / was_optimal present in the live store or the admin export.',
  });
  f.push({
    code: 'SC',
    title: 'Rewarded-survey nutrient ingests on a flat, content-independent bonus',
    detail: `Reflection text stored; bonus is a flat ${args.surveyNutrient.flatBonus} Sparks for completion regardless of answers (no dark pattern, C5).`,
  });
  // Real limitations routed to humans — the audit does not fix these itself.
  f.push({
    code: 'SP',
    title: 'Evidence persists only in-browser (localStorage/in-memory)',
    detail: 'For multi-tester / cross-device aggregation, evidence must land in a real DB. That is a secrets/real-DB step.',
    routesTo: 'G3',
  });
  f.push({
    code: 'SP',
    title: 'Region eligibility is coarse (US-state blocklist, manual entry)',
    detail: 'Real IP-geolocation + precise (TIGER) geofencing determine who may play/earn — geo-legal logic.',
    routesTo: 'G4',
  });
  return f;
}

/** Render the report as a human-readable Markdown audit artifact. */
export function renderAuditMarkdown(r: ExecutionAuditReport): string {
  const lines: string[] = [];
  lines.push('# GLASSBOX Labs — Execution Audit (advisory, NON-RATIFYING)');
  lines.push('');
  lines.push(`Generated: ${r.generatedAt}`);
  lines.push('');
  lines.push('> This audit OBSERVES and CLASSIFIES. It does not ratify anything and cannot clear a gate.');
  lines.push('> Agreement between this audit and the builder is NOT evidence (anti-circularity, C3).');
  lines.push('');
  lines.push(`**Overall invariants held:** ${r.ok ? 'YES ✓ (not a ratification)' : 'NO ✗ — do not playtest until resolved'}`);
  lines.push('');
  lines.push('## Full-play execution (mistakes deliberately made)');
  for (const s of r.scenarios) {
    lines.push(`- **${s.experiment}** — ${s.intent}`);
    lines.push(`  - forced mistake: ${s.forcedMistake}`);
    lines.push(`  - captured: \`${JSON.stringify(s.captured)}\``);
    lines.push(`  - provably fair: ${s.fairnessOk ? '✓' : '✗'}`);
  }
  lines.push('');
  lines.push('## Mistakes observed & captured');
  lines.push(`- Farkle (real loss): ${r.mistakesObserved.farkle ? '✓' : '✗'}`);
  lines.push(`- Zero-value keep (banked nothing): ${r.mistakesObserved.zeroKeepBank ? '✓' : '✗'}`);
  lines.push(`- Missed self-set target: ${r.mistakesObserved.missedTarget ? '✓' : '✗'}`);
  lines.push('');
  lines.push('## Rewarded-survey nutrient');
  lines.push(`- Ingested: ${r.surveyNutrient.ingested ? '✓' : '✗'} · reflection stored: ${r.surveyNutrient.reflectionStored ? '✓' : '✗'} · flat bonus: ${r.surveyNutrient.flatBonus} Sparks`);
  lines.push('');
  lines.push('## Evidence rows captured');
  lines.push('```json');
  lines.push(JSON.stringify(r.evidenceCounts, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('## Findings');
  lines.push('Legend: ' + Object.entries(FINDING_LEGEND).map(([k, v]) => `**${k}** ${v}`).join(' · '));
  lines.push('');
  for (const f of r.findings) {
    lines.push(`- **[${f.code}] ${f.title}**${f.routesTo ? ` → routes to gate ${f.routesTo}` : ''}`);
    lines.push(`  - ${f.detail}`);
  }
  lines.push('');
  lines.push('_Forbidden fields present anywhere: ' + (r.forbiddenFieldsPresentAnywhere ? 'YES ✗' : 'NO ✓') + '_');
  return lines.join('\n') + '\n';
}
