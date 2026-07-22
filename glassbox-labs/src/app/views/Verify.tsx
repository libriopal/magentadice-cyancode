import { useState } from 'react';
import { verifyOutcome, type OneRollOutcome, type VerificationReport } from '../../experiments/one-roll/oneRoll';
import { store, getUserId } from '../labStore';

// Public Verify view — recomputes a session's outcome from its revealed fairness data and
// confirms the commitment, combined seed, faces, and score all match (Constitution C4).
export function Verify() {
  const [raw, setRaw] = useState('');
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadLastSession() {
    const sessions = store.snapshot().sessions.filter((s) => s.user_id === getUserId());
    const last = sessions[sessions.length - 1];
    if (!last) {
      setError('No sessions yet — play a round first.');
      return;
    }
    setRaw(last.outcome_json);
    setError(null);
    setReport(null);
  }

  async function run() {
    setError(null);
    setReport(null);
    let outcome: OneRollOutcome;
    try {
      outcome = JSON.parse(raw) as OneRollOutcome;
    } catch {
      setError('That is not valid outcome JSON.');
      return;
    }
    try {
      setReport(await verifyOutcome(outcome));
    } catch (e) {
      setError(`Verification error: ${(e as Error).message}`);
    }
  }

  const Line = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className={ok ? 'ok' : 'no'}>{ok ? '✓' : '✗'} {label}</div>
  );

  return (
    <div className="panel">
      <h2>Verify a session</h2>
      <p className="muted">
        Paste the fairness JSON from any One-Roll session (the "Fairness data" block), or load your
        last one. Anyone can recompute the dice from the revealed server seed + client seed and confirm
        the published commitment.
      </p>
      <div className="row">
        <button className="btn" onClick={loadLastSession}>Load my last session</button>
        <button className="btn primary" onClick={() => void run()} disabled={!raw.trim()}>Verify</button>
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder='{"experiment_id":"one-roll", ...}'
        style={{ marginTop: 10 }}
      />
      {error && <p className="no" role="alert">{error}</p>}
      {report && (
        <div className="panel">
          <Line ok={report.commitmentValid} label="Commitment matches revealed server seed" />
          <Line ok={report.combinedSeedMatch} label="Combined seed recomputes identically" />
          <Line ok={report.facesMatch} label="Dice faces recompute identically" />
          <Line ok={report.scoreMatch} label="Score recomputes identically" />
          <p className={report.ok ? 'ok' : 'no'} style={{ marginTop: 8 }}>
            {report.ok ? 'PROVABLY FAIR ✓ — every field independently reproduced.' : 'MISMATCH ✗ — do not trust this outcome.'}
          </p>
        </div>
      )}
    </div>
  );
}
