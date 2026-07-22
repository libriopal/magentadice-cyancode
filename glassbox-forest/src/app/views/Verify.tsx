import { useState } from 'react';
import { verifyOutcome as vOne, type OneRollOutcome } from '../../experiments/one-roll/oneRoll';
import { verifyOutcome as vKeep, type KeeperOutcome } from '../../experiments/keeper/keeper';
import { verifyOutcome as vTgt, type TargetOutcome } from '../../experiments/target/target';
import { verifyOutcome as vHold, type HoldCrownOutcome } from '../../experiments/hold-crown/holdCrown';

interface Check { label: string; ok: boolean }

// Public Verify — recompute any experiment's outcome from its revealed fairness data. Dispatches on
// experiment_id so every playable branch (including Hold the Crown) is independently verifiable.
async function verifyAny(raw: unknown): Promise<{ checks: Check[]; ok: boolean }> {
  const o = raw as { experiment_id?: string };
  if (o.experiment_id === 'hold-crown') {
    const r = await vHold(raw as HoldCrownOutcome);
    return { ok: r.ok, checks: [
      { label: 'Commitment matches revealed server seed', ok: r.commitmentValid },
      { label: 'Every round recomputes identically', ok: r.roundsMatch },
      { label: 'Final total recomputes from rolls + decisions', ok: r.totalMatch },
    ] };
  }
  if (o.experiment_id === 'keeper') {
    const r = await vKeep(raw as KeeperOutcome);
    return { ok: r.ok, checks: [
      { label: 'Commitment matches revealed server seed', ok: r.commitmentValid },
      { label: 'Combined seed recomputes', ok: r.combinedSeedMatch },
      { label: 'Faces recompute', ok: r.facesMatch },
      { label: 'Kept-subset score recomputes', ok: r.scoreMatch },
    ] };
  }
  if (o.experiment_id === 'target') {
    const r = await vTgt(raw as TargetOutcome);
    return { ok: r.ok, checks: [
      { label: 'Commitment matches revealed server seed', ok: r.commitmentValid },
      { label: 'Combined seed recomputes', ok: r.combinedSeedMatch },
      { label: 'Faces recompute', ok: r.facesMatch },
      { label: 'Score recomputes', ok: r.scoreMatch },
      { label: 'Met-target flag recomputes', ok: r.metTargetMatch },
    ] };
  }
  const r = await vOne(raw as OneRollOutcome);
  return { ok: r.ok, checks: [
    { label: 'Commitment matches revealed server seed', ok: r.commitmentValid },
    { label: 'Combined seed recomputes', ok: r.combinedSeedMatch },
    { label: 'Faces recompute', ok: r.facesMatch },
    { label: 'Score recomputes', ok: r.scoreMatch },
  ] };
}

export function Verify() {
  const [raw, setRaw] = useState('');
  const [res, setRes] = useState<{ checks: Check[]; ok: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setErr(null); setRes(null);
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { setErr('Not valid outcome JSON.'); return; }
    try { setRes(await verifyAny(parsed)); } catch (e) { setErr(`Verification error: ${(e as Error).message}`); }
  }

  return (
    <div className="panel">
      <h2>Verify a session</h2>
      <p className="muted">Paste the fairness JSON from any experiment (the "Fairness data" block). Anyone can recompute the dice from the revealed seeds and confirm the published commitment.</p>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder='{"experiment_id":"hold-crown", ...}' />
      <div className="row" style={{ marginTop: 8 }}><button className="btn primary" onClick={() => void run()} disabled={!raw.trim()}>Verify</button></div>
      {err && <p className="no">{err}</p>}
      {res && (
        <div className="panel">
          {res.checks.map((c, i) => <div key={i} className={c.ok ? 'ok' : 'no'}>{c.ok ? '✓' : '✗'} {c.label}</div>)}
          <p className={res.ok ? 'ok' : 'no'} style={{ marginTop: 8 }}>{res.ok ? 'PROVABLY FAIR ✓' : 'MISMATCH ✗'}</p>
        </div>
      )}
    </div>
  );
}
