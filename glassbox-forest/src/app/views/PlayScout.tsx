// Scout (foresight × partial): peek one die, then commit how many to roll on that partial info.
import { useEffect, useState, useCallback } from 'react';
import { generateClientSeed, type DieFace } from '../../engine/farkle-engine';
import * as scout from '../../experiments/scout/scout';
import { recordPlaySession, sparksBalance } from '../forestApp';
import { audio } from '../../audio/audioEngine';
import { Die, DiceRow } from '../components/Die';
import { SurveyView } from './SurveyView';

const SCOUT_SCORES = new Set([1, 5]); // a scoring single (informational hint text only)

export function PlayScout() {
  const [c, setC] = useState<scout.ScoutCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [peek, setPeek] = useState<DieFace | null>(null);
  const [count, setCount] = useState(3);
  const [out, setOut] = useState<scout.ScoutOutcome | null>(null);
  const [sid, setSid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reset = useCallback(async () => {
    setOut(null); setSid(null); setErr(null); setCount(3);
    const cs = generateClientSeed(); const commit = await scout.commit();
    setClientSeed(cs); setC(commit);
    audio.trigger('reveal');
    const s = await scout.revealScout(commit, cs);
    setPeek(s.scout);
  }, []);
  useEffect(() => { void reset(); }, [reset]);

  async function go() {
    if (!c) return;
    audio.trigger('roll');
    const o = await scout.reveal(c, clientSeed, count);
    const id = recordPlaySession('scout', o, { scout: o.scout, dice_count: count, client_seed: clientSeed });
    if (!id) { setErr('Play blocked: region not eligible.'); return; }
    audio.trigger(o.is_farkle ? 'bust' : 'score');
    setOut(o); setSid(id);
  }

  return (
    <div className="panel">
      <h2>Scout <span className="pill">foresight · partial</span></h2>
      <p className="muted">
        Peek one die, then commit how many to roll (all must score — it's all-or-nothing). A scoring scout
        (1 or 5) lets you bank a safe single or push; a blank scout forces a gamble. Provably fair — the
        scout is the first die of the same roll.
      </p>
      {!out ? (
        <>
          <div className="row" style={{ alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="muted" style={{ marginBottom: 4 }}>scout</div>
              {peek ? <Die value={peek} size={56} kept /> : <span className="pill">?</span>}
            </div>
            <div className="muted">
              {peek != null && (SCOUT_SCORES.has(peek)
                ? `A ${peek} scores on its own — commit 1 to bank it safe, or push for more.`
                : `A ${peek} does not score alone — you'll need a combo; committing more is a gamble.`)}
            </div>
          </div>
          <label htmlFor="sc" style={{ marginTop: 10 }}>Commit dice (incl. scout): {count}</label>
          <input id="sc" type="range" min={scout.MIN_DICE} max={scout.MAX_DICE} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          <div className="row" style={{ marginTop: 10 }}><button className="btn primary" disabled={!c} onClick={() => void go()}>Commit &amp; roll</button><span className="muted">Balance: {sparksBalance()} Sparks</span></div>
          {err && <p className="no">{err}</p>}
        </>
      ) : (
        <>
          <DiceRow faces={out.faces} />
          <p>{out.is_farkle ? <span className="no">Farkle — 0 (a die didn't fit).</span> : <span className="ok">{out.combo} — {out.score}.</span>}</p>
          <details><summary className="muted">Fairness data</summary><pre>{JSON.stringify(out, null, 2)}</pre></details>
          {sid && <SurveyView sessionId={sid} experimentId="scout" onDone={() => setOut({ ...out })} />}
          <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => void reset()}>New round</button></div>
        </>
      )}
    </div>
  );
}
