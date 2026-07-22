import { useEffect, useState, useCallback } from 'react';
import {
  commit,
  reveal,
  EXPERIMENT_ID,
  MIN_DICE,
  MAX_DICE,
  MIN_TARGET,
  MAX_TARGET,
  type TargetCommit,
  type TargetOutcome,
} from '../../experiments/target/target';
import { generateClientSeed } from '../../engine/farkle-engine';
import { store, getUserId, recordPlaySession } from '../labStore';
import { SPARKS } from '../../sparks/wallet';
import { SurveyView } from './SurveyView';

const FACE_GLYPH = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export function PlayTarget() {
  const [commitData, setCommitData] = useState<TargetCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [diceCount, setDiceCount] = useState(6);
  const [target, setTarget] = useState(500);
  const [outcome, setOutcome] = useState<TargetOutcome | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [balance, setBalance] = useState(store.sparksBalance(getUserId()));
  const [error, setError] = useState<string | null>(null);

  const newRound = useCallback(async () => {
    setOutcome(null);
    setSessionId(null);
    setError(null);
    setClientSeed(generateClientSeed());
    setCommitData(await commit());
  }, []);

  useEffect(() => { void newRound(); }, [newRound]);

  async function doReveal() {
    if (!commitData) return;
    const oc = await reveal(commitData, clientSeed, diceCount, target);
    const { sessionId: sid, region } = recordPlaySession(EXPERIMENT_ID, oc, { dice_count: diceCount, target_score: target, client_seed: clientSeed });
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
      <h2>Call Your Shot <span className="pill">skill dice</span></h2>
      <p className="muted">
        Before you roll, set your own target and how many dice to risk. Hit your number and it's a win
        <b> by your own definition</b>. We record your target, your dice count, and the raw score — we do
        not grade the call.
      </p>

      <div className="panel">
        <div className="muted">Commitment:</div>
        <div className="hashline">{commitData ? commitData.commitment : '…'}</div>
      </div>

      {!outcome && (
        <>
          <label htmlFor="td">Dice to roll: {diceCount}</label>
          <input id="td" type="range" min={MIN_DICE} max={MAX_DICE} value={diceCount} onChange={(e) => setDiceCount(Number(e.target.value))} />
          <label htmlFor="tt" style={{ marginTop: 10 }}>Target score: {target}</label>
          <input id="tt" type="range" min={MIN_TARGET} max={MAX_TARGET} step={50} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          <label htmlFor="tcs" style={{ marginTop: 10 }}>Your client seed</label>
          <input id="tcs" value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} style={{ width: '100%' }} />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" disabled={!commitData} onClick={() => void doReveal()}>Reveal &amp; roll</button>
            <span className="muted">Balance: {balance} Sparks</span>
          </div>
          {error && <p className="no" role="alert">{error}</p>}
        </>
      )}

      {outcome && (
        <>
          <div className="dice">
            {outcome.faces.map((f, i) => <div className="die" key={i}>{FACE_GLYPH[f]}</div>)}
          </div>
          <p>
            <span className={outcome.met_target ? 'ok' : 'no'}>
              {outcome.combo || 'Farkle'} — {outcome.score} points ({outcome.met_target ? 'met' : 'missed'} your target of {outcome.target_score}).
            </span>{' '}
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
