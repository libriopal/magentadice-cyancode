import { useEffect, useState, useCallback } from 'react';
import {
  commit, playRound, resolveSession, multiplierFor, bustProbabilityPerRound, MAX_ROUNDS,
  type HoldCrownCommit, type RoundResult, type Decision, type HoldCrownOutcome,
} from '../../experiments/hold-crown/holdCrown';
import { generateClientSeed } from '../../engine/farkle-engine';
import { assertPlayAllowed, recordRealPlay, catalog } from '../forestApp';

const GLYPH = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const HOLD_BRANCH = catalog.experimentToBranch['hold-crown']!;

// The emphasized King of Tokyo family experiment. Interactive push-your-luck: each round keeps its best
// scoring subset; HOLD to grow the multiplier at a constant ~2.3% bust risk that would wipe the pot, or
// BANK to secure. The calibration read (bust risk + exposed pot) is shown — informed, not solved.
export function PlayHoldCrown() {
  const [commitData, setCommitData] = useState<HoldCrownCommit | null>(null);
  const [clientSeed, setClientSeed] = useState('');
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [pot, setPot] = useState(0);
  const [done, setDone] = useState(false);
  const [outcome, setOutcome] = useState<HoldCrownOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bustPct = (bustProbabilityPerRound() * 100).toFixed(1);

  const finalize = useCallback(async (c: HoldCrownCommit, cs: string, decs: Decision[]) => {
    const o = await resolveSession(c, cs, decs);
    setOutcome(o);
    setDone(true);
    try { recordRealPlay(HOLD_BRANCH, false); } catch { /* ledger enforces observed-only */ }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const decision = assertPlayAllowed();
    if (!decision.allowed) { setError(`Play blocked: region "${decision.region ?? 'unknown'}" not eligible.`); return; }
    const cs = generateClientSeed();
    const c = await commit();
    setClientSeed(cs); setCommitData(c);
    setDecisions([]); setDone(false); setOutcome(null);
    const r0 = await playRound(c, cs, 0);
    setRounds([r0]);
    if (r0.isFarkle) { setPot(0); await finalize(c, cs, []); }
    else setPot(Math.round(r0.roundScore * r0.multiplier));
  }, [finalize]);

  useEffect(() => { void start(); }, [start]);

  async function decide(choice: Decision) {
    if (!commitData || done) return;
    const nextDecisions = [...decisions, choice];
    setDecisions(nextDecisions);
    if (choice === 'bank') { await finalize(commitData, clientSeed, nextDecisions); return; }
    const nextRound = rounds.length;
    if (nextRound >= MAX_ROUNDS) { await finalize(commitData, clientSeed, nextDecisions); return; }
    const rr = await playRound(commitData, clientSeed, nextRound);
    setRounds((rs) => [...rs, rr]);
    if (rr.isFarkle) { setPot(0); await finalize(commitData, clientSeed, nextDecisions); }
    else setPot((p) => p + Math.round(rr.roundScore * rr.multiplier));
  }

  const cur = rounds[rounds.length - 1];
  const nextMult = multiplierFor(rounds.length);

  return (
    <div className="panel">
      <h2>Hold the Crown <span className="pill">King of Tokyo family</span></h2>
      <p className="muted">
        Each round keeps its best scoring subset. <b>Hold</b> the crown to grow your multiplier — but a
        Farkle while holding <b>wipes your whole pot</b> (knocked out of Tokyo). <b>Bank</b> to secure.
        Per-round bust risk is a constant <b>~{bustPct}%</b>; what rises is the stake, not the odds.
      </p>

      <div className="panel"><div className="hashline">{commitData ? `commitment = ${commitData.commitment}` : '…'}</div></div>

      {cur && (
        <>
          <div className="muted">Round {rounds.length} · multiplier ×{cur.multiplier}</div>
          <div className="dice">{cur.faces.map((f, i) => <div className="die" key={i}>{GLYPH[f]}</div>)}</div>
          <p>{cur.roundScore ? <span className="ok">kept {cur.roundScore}.</span> : <span className="no">no score.</span>}</p>
        </>
      )}

      {!done && (
        <div className="panel warnbox">
          <div className="muted">Exposed pot: <b>{pot}</b> · next hold pays ×{nextMult} · bust risk ~{bustPct}% (wipes pot).</div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn primary" onClick={() => void decide('hold')}>Hold the crown (×{nextMult})</button>
            <button className="btn" onClick={() => void decide('bank')}>Bank {pot}</button>
          </div>
          {error && <p className="no" role="alert">{error}</p>}
        </div>
      )}

      {done && (
        <>
          <p className={outcome?.busted ? 'no' : 'ok'}>
            {outcome?.busted
              ? 'Knocked out of Tokyo — pot wiped (0).'
              : `Banked ${outcome?.final_total ?? pot} points across ${rounds.length} round(s).`}
          </p>
          {outcome && <details><summary className="muted">Fairness data (verify in the Verify tab)</summary><pre>{JSON.stringify(outcome, null, 2)}</pre></details>}
          <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={() => void start()}>New game</button></div>
        </>
      )}
    </div>
  );
}
