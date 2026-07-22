import { useState } from 'react';
import { GATES, isGranted, type GateId } from '../../governance/gates';
import { redeemSparks } from '../../economy/redemption';
import { startSpotlightSession } from '../../multiplayer/socialWitness';
import { RemoteDbPersistence } from '../../persistence/adapter';
import { getUserId } from '../forestApp';

// Honest gated-features panel: shows G1/G2/G3 as LOCKED with exactly what each needs, and lets you PROVE
// the refusal is real by trying a gated action (it returns the escalation, never performs the action).
const SEAMS: { gate: GateId; label: string; try: () => void }[] = [
  { gate: 'G1_REAL_MONEY', label: 'Redeem Sparks for real value', try: () => redeemSparks({ userId: getUserId(), sparks: 100 }) },
  { gate: 'G2_DEPLOY', label: 'Start a multiplayer spotlight (social-witness)', try: () => startSpotlightSession('hold-crown', getUserId()) },
  { gate: 'G3_SECRETS', label: 'Connect a real database', try: () => new RemoteDbPersistence().connect() },
];

export function GatedFeatures() {
  const [msg, setMsg] = useState<Record<string, string>>({});

  function attempt(s: (typeof SEAMS)[number]) {
    try { s.try(); setMsg((m) => ({ ...m, [s.gate]: 'UNEXPECTED: action did not refuse — report this.' })); }
    catch (e) { setMsg((m) => ({ ...m, [s.gate]: (e as Error).message })); }
  }

  return (
    <div className="panel">
      <h3 className="sub">Gated features <span className="muted">(built up to the gate — inert until a human token)</span></h3>
      <p className="muted">Everything below is scaffolded and refuses to run without a human ratification token. The agent cannot create those tokens.</p>
      {SEAMS.map((s) => {
        const spec = GATES[s.gate];
        const granted = isGranted(s.gate);
        return (
          <div key={s.gate} className="panel" style={{ margin: '8px 0' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{s.label}</b>
              <span className={granted ? 'ok' : 'no'}>{granted ? 'UNLOCKED' : `🔒 ${s.gate}`}</span>
            </div>
            <p className="muted">Needs: {spec.humanArtifact} → creates {spec.token}</p>
            <button className="btn" onClick={() => attempt(s)}>Try it (expect refusal)</button>
            {msg[s.gate] && <p className="muted" style={{ marginTop: 6 }}>{msg[s.gate]}</p>}
          </div>
        );
      })}
    </div>
  );
}
