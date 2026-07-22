import { useState } from 'react';
import { verifyOutcome as verifyOneRoll, type OneRollOutcome } from '../../experiments/one-roll/oneRoll';
import { verifyOutcome as verifyKeeper, type KeeperOutcome } from '../../experiments/keeper/keeper';
import { verifyOutcome as verifyTarget, type TargetOutcome } from '../../experiments/target/target';
import { store, getUserId } from '../labStore';

interface Check { label: string; ok: boolean }

// Public Verify view — recomputes a session's outcome from its revealed fairness data and
// confirms the commitment, combined seed, faces, and score all match (Constitution C4).
// Dispatches on the outcome's experiment_id so every experiment in the library is verifiable.
async function verifyAny(raw: unknown): Promise<{ checks: Check[]; ok: boolean }> {
  const o = raw as { experiment_id?: string };
  if (o.experiment_id === 'keeper') {
    const r = await verifyKeeper(raw as KeeperOutcome);
    const checks: Check[] = [
      { label: 'Commitment matches revealed server seed', ok: r.commitmentValid },
      { label: 'Combined seed recomputes identically', ok: r.combinedSeedMatch },
      { label: 'Dice faces recompute identically', ok: r.facesMatch },
      { label: 'Kept-subset score recomputes identically', ok: r.scoreMatch },
    ];
    return { checks, ok: r.ok };
  }
  if (o.experiment_id === 'target') {
    const r = await verifyTarget(raw as TargetOutcome);
    const checks: Check[] = [
      { label: 'Commitment matches revealed server seed', ok: r.commitmentValid },
      { label: 'Combined seed recomputes identically', ok: r.combinedSeedMatch },
      { label: 'Dice faces recompute identically', ok: r.facesMatch },
      { label: 'Score recomputes identically', ok: r.scoreMatch },
      { label: 'Met-target flag recomputes identically', ok: r.metTargetMatch },
    ];
    return { checks, ok: r.ok };
  }
  // default: one-roll
  const r = await verifyOneRoll(raw as OneRollOutcome);
  const checks: Check[] = [
    { label: 'Commitment matches revealed server seed', ok: r.commitmentValid },
    { label: 'Combined seed recomputes identically', ok: r.combinedSeedMatch },
    { label: 'Dice faces recompute identically', ok: r.facesMatch },
    { label: 'Score recomputes identically', ok: r.scoreMatch },
  ];
  return { checks, ok: r.ok };
}

export function Verify() {
  const [rawText, setRawText] = useState('');
  const [result, setResult] = useState<{ checks: Check[]; ok: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadLastSession() {
    const sessions = store.snapshot().sessions.filter((s) => s.user_id === getUserId());
    const last = sessions[sessions.length - 1];
    if (!last) { setError('No sessions yet — play a round first.'); return; }
    setRawText(last.outcome_json);
    setError(null);
    setResult(null);
  }

  async function run() {
    setError(null);
    setResult(null);
    let parsed: unknown;
    try { parsed = JSON.parse(rawText); } catch { setError('That is not valid outcome JSON.'); return; }
    try { setResult(await verifyAny(parsed)); } catch (e) { setError(`Verification error: ${(e as Error).message}`); }
  }

  return (
    <div className="panel">
      <h2>Verify a session</h2>
      <p className="muted">
        Paste the fairness JSON from any experiment session (the "Fairness data" block), or load your
        last one. Anyone can recompute the dice from the revealed server seed + client seed and confirm
        the published commitment.
      </p>
      <div className="row">
        <button className="btn" onClick={loadLastSession}>Load my last session</button>
        <button className="btn primary" onClick={() => void run()} disabled={!rawText.trim()}>Verify</button>
      </div>
      <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder='{"experiment_id":"one-roll", ...}' style={{ marginTop: 10 }} />
      {error && <p className="no" role="alert">{error}</p>}
      {result && (
        <div className="panel">
          {result.checks.map((c, i) => (
            <div key={i} className={c.ok ? 'ok' : 'no'}>{c.ok ? '✓' : '✗'} {c.label}</div>
          ))}
          <p className={result.ok ? 'ok' : 'no'} style={{ marginTop: 8 }}>
            {result.ok ? 'PROVABLY FAIR ✓ — every field independently reproduced.' : 'MISMATCH ✗ — do not trust this outcome.'}
          </p>
        </div>
      )}
    </div>
  );
}
