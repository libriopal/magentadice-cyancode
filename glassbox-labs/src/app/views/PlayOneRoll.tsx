import { useEffect, useState, useCallback, useRef } from 'react';
import {
  commit,
  reveal,
  MIN_DICE,
  MAX_DICE,
  EXPERIMENT_ID,
  type OneRollCommit,
  type OneRollOutcome,
} from '../../experiments/one-roll/oneRoll';
import { generateClientSeed } from '../../engine/farkle-engine';
import { store, getUserId, recordPlaySession } from '../labStore';
import { SPARKS } from '../../sparks/wallet';
import { SurveyView } from './SurveyView';

const FACE_GLYPH = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function PlayOneRoll() {
  const [commitData, setCommitData] = useState<OneRollCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [diceCount, setDiceCount] = useState(6);
  const [outcome, setOutcome] = useState<OneRollOutcome | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [balance, setBalance] = useState(store.sparksBalance(getUserId()));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef<number>(Date.now());

  const newRound = useCallback(async () => {
    setOutcome(null);
    setSessionId(null);
    setError(null);
    setClientSeed(generateClientSeed());
    setCommitData(await commit());
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    void newRound();
  }, [newRound]);

  async function doReveal() {
    if (!commitData) return;
    setBusy(true);
    setError(null);
    try {
      const { outcome: oc } = await reveal(commitData, clientSeed, diceCount);
      // Hard region gate + session persistence + flat reward (shared across experiments).
      const { sessionId: sid, region } = recordPlaySession(EXPERIMENT_ID, oc, { dice_count: diceCount, client_seed: clientSeed, decision_ms: Date.now() - startedAt.current });
      if (!sid) {
        setError(`Play blocked: region "${region.region ?? 'unknown'}" is not eligible.`);
        return;
      }
      setOutcome(oc);
      setSessionId(sid);
      setBalance(store.sparksBalance(getUserId()));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h2>One-Roll <span className="pill">skill dice</span></h2>
      <p className="muted">
        Decide how many dice to roll <b>before</b> the reveal — that pre-commitment is the skill call.
        Fewer dice: safer, lower ceiling. More dice: higher ceiling, more Farkle risk. We record only
        your decision and the raw outcome — never a score of how "good" it was.
      </p>

      <div className="panel">
        <div className="muted">Commitment (published before the roll):</div>
        <div className="hashline">{commitData ? `sha256(serverSeed) = ${commitData.commitment}` : '…'}</div>
      </div>

      {!outcome && (
        <>
          <label htmlFor="dc">Dice to roll: {diceCount}</label>
          <input
            id="dc"
            type="range"
            min={MIN_DICE}
            max={MAX_DICE}
            value={diceCount}
            onChange={(e) => setDiceCount(Number(e.target.value))}
          />
          <div className="row" style={{ marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="cs">Your client seed (you control this half of the randomness)</label>
              <input id="cs" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={!commitData || busy} onClick={doReveal}>
              Reveal &amp; roll
            </button>
            <span className="muted">Balance: {balance} Sparks</span>
          </div>
          {error && <p className="no" role="alert">{error}</p>}
        </>
      )}

      {outcome && (
        <>
          <div className="dice">
            {outcome.faces.map((f, i) => (
              <div className="die" key={i}>{FACE_GLYPH[f]}</div>
            ))}
          </div>
          <p>
            {outcome.is_farkle ? (
              <span className="no">Farkle — 0 points.</span>
            ) : (
              <span className="ok">{outcome.combo} — {outcome.score} points.</span>
            )}{' '}
            <span className="muted">+{SPARKS.PLAY} Sparks. Balance: {balance}.</span>
          </p>
          <details>
            <summary className="muted">Fairness data (verify in the Verify tab)</summary>
            <pre>{JSON.stringify(outcome, null, 2)}</pre>
          </details>

          {sessionId && (
            <SurveyView
              sessionId={sessionId}
              onDone={() => setBalance(store.sparksBalance(getUserId()))}
            />
          )}

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => void newRound()}>New round</button>
          </div>
        </>
      )}
    </div>
  );
}
