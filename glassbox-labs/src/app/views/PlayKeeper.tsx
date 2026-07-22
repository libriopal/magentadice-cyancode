import { useEffect, useState, useCallback, useRef } from 'react';
import {
  commit,
  revealFaces,
  resolve,
  EXPERIMENT_ID,
  type KeeperCommit,
  type KeeperOutcome,
} from '../../experiments/keeper/keeper';
import type { DieFace } from '../../engine/farkle-engine';
import { generateClientSeed } from '../../engine/farkle-engine';
import { store, getUserId, recordPlaySession } from '../labStore';
import { SPARKS } from '../../sparks/wallet';
import { SurveyView } from './SurveyView';

const FACE_GLYPH = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function PlayKeeper() {
  const [commitData, setCommitData] = useState<KeeperCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [faces, setFaces] = useState<DieFace[] | null>(null);
  const [combined, setCombined] = useState('');
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [outcome, setOutcome] = useState<KeeperOutcome | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [balance, setBalance] = useState(store.sparksBalance(getUserId()));
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());

  const newRound = useCallback(async () => {
    setFaces(null);
    setKept(new Set());
    setOutcome(null);
    setSessionId(null);
    setError(null);
    setClientSeed(generateClientSeed());
    setCommitData(await commit());
    startedAt.current = Date.now();
  }, []);

  useEffect(() => { void newRound(); }, [newRound]);

  async function doReveal() {
    if (!commitData) return;
    const r = await revealFaces(commitData, clientSeed);
    setFaces(r.faces);
    setCombined(r.combined);
  }

  function toggle(i: number) {
    const next = new Set(kept);
    if (next.has(i)) next.delete(i); else next.add(i);
    setKept(next);
  }

  function scoreKept() {
    if (!commitData || !faces) return;
    const oc = resolve(commitData, clientSeed, combined, faces, [...kept]);
    const { sessionId: sid, region } = recordPlaySession(EXPERIMENT_ID, oc, { kept_indices: oc.kept_indices, client_seed: clientSeed, decision_ms: Date.now() - startedAt.current });
    if (!sid) {
      setError(`Play blocked: region "${region.region ?? 'unknown'}" is not eligible.`);
      return;
    }
    setOutcome(oc);
    setSessionId(sid);
    setBalance(store.sparksBalance(getUserId()));
  }

  return (
    <div className="panel">
      <h2>Keeper's Dilemma <span className="pill">skill dice</span></h2>
      <p className="muted">
        Roll six provably-fair dice, then choose which to <b>keep</b> — that subset is scored. Keep more
        for a higher ceiling, or bank a sure thing. We record which dice you kept and the raw score,
        never a judgement of whether it was the "right" keep.
      </p>

      <div className="panel">
        <div className="muted">Commitment:</div>
        <div className="hashline">{commitData ? commitData.commitment : '…'}</div>
      </div>

      {!faces && (
        <>
          <label htmlFor="ks">Your client seed</label>
          <input id="ks" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} style={{ width: '100%' }} />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={!commitData} onClick={() => void doReveal()}>Reveal six dice</button>
            <span className="muted">Balance: {balance} Sparks</span>
          </div>
        </>
      )}

      {faces && !outcome && (
        <>
          <p className="muted">Tap dice to keep (kept dice are highlighted):</p>
          <div className="dice">
            {faces.map((f, i) => (
              <button
                key={i}
                className="die"
                style={kept.has(i) ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
                onClick={() => toggle(i)}
              >
                {FACE_GLYPH[f]}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn primary" onClick={scoreKept}>Score kept ({kept.size})</button>
          </div>
          {error && <p className="no" role="alert">{error}</p>}
        </>
      )}

      {outcome && (
        <>
          <div className="dice">
            {outcome.kept_faces.map((f, i) => <div className="die" key={i}>{FACE_GLYPH[f]}</div>)}
          </div>
          <p>
            {outcome.score > 0
              ? <span className="ok">{outcome.combo} — {outcome.score} points.</span>
              : <span className="no">No scoring dice kept — 0 points.</span>}{' '}
            <span className="muted">+{SPARKS.PLAY} Sparks. Balance: {balance}.</span>
          </p>
          <details>
            <summary className="muted">Fairness data</summary>
            <pre>{JSON.stringify(outcome, null, 2)}</pre>
          </details>
          {sessionId && <SurveyView sessionId={sessionId} onDone={() => setBalance(store.sparksBalance(getUserId()))} />}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => void newRound()}>New round</button>
          </div>
        </>
      )}
    </div>
  );
}
