// Lean playable views for the three recreated experiments (One-Roll, Keeper, Call Your Shot). Full
// survey / Sparks / evidence-store capture arrives in Stage 4; here each play feeds a real session into
// the FOREST ledger so the geometrical memory fills as humans play.
import { useEffect, useState, useCallback } from 'react';
import { generateClientSeed, type DieFace } from '../../engine/farkle-engine';
import * as oneRoll from '../../experiments/one-roll/oneRoll';
import * as keeper from '../../experiments/keeper/keeper';
import * as target from '../../experiments/target/target';
import { assertPlayAllowed, recordRealPlay, catalog } from '../forestApp';

const GLYPH = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const Dice = ({ faces }: { faces: DieFace[] }) => (
  <div className="dice">{faces.map((f, i) => <div className="die" key={i}>{GLYPH[f]}</div>)}</div>
);

// ── One-Roll ────────────────────────────────────────────────────────────────
export function PlayOneRoll() {
  const branch = catalog.experimentToBranch['one-roll']!;
  const [c, setC] = useState<oneRoll.OneRollCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [dice, setDice] = useState(6);
  const [out, setOut] = useState<oneRoll.OneRollOutcome | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const reset = useCallback(async () => { setOut(null); setErr(null); setClientSeed(generateClientSeed()); setC(await oneRoll.commit()); }, []);
  useEffect(() => { void reset(); }, [reset]);
  async function go() {
    if (!c) return;
    if (!assertPlayAllowed().allowed) { setErr('Play blocked: region not eligible.'); return; }
    const { outcome } = await oneRoll.reveal(c, clientSeed, dice);
    setOut(outcome); try { recordRealPlay(branch, false); } catch { /* observed-only */ }
  }
  return (
    <div className="panel">
      <h2>One-Roll <span className="pill">shaping</span></h2>
      <p className="muted">Choose how many dice to roll before the reveal — that pre-commit is the skill call. Provably fair.</p>
      {!out ? (
        <>
          <label htmlFor="d">Dice: {dice}</label>
          <input id="d" type="range" min={oneRoll.MIN_DICE} max={oneRoll.MAX_DICE} value={dice} onChange={(e) => setDice(Number(e.target.value))} />
          <div className="row" style={{ marginTop: 10 }}><button className="btn primary" disabled={!c} onClick={() => void go()}>Reveal &amp; roll</button></div>
          {err && <p className="no">{err}</p>}
        </>
      ) : (
        <>
          <Dice faces={out.faces} />
          <p>{out.is_farkle ? <span className="no">Farkle — 0.</span> : <span className="ok">{out.combo} — {out.score}.</span>}</p>
          <details><summary className="muted">Fairness data</summary><pre>{JSON.stringify(out, null, 2)}</pre></details>
          <button className="btn" onClick={() => void reset()}>New round</button>
        </>
      )}
    </div>
  );
}

// ── Keeper's Dilemma ─────────────────────────────────────────────────────────
export function PlayKeeper() {
  const branch = catalog.experimentToBranch['keeper']!;
  const [c, setC] = useState<keeper.KeeperCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [faces, setFaces] = useState<DieFace[] | null>(null);
  const [combined, setCombined] = useState('');
  const [kept, setKept] = useState<Set<number>>(new Set());
  const [out, setOut] = useState<keeper.KeeperOutcome | null>(null);
  const reset = useCallback(async () => { setFaces(null); setKept(new Set()); setOut(null); setClientSeed(generateClientSeed()); setC(await keeper.commit()); }, []);
  useEffect(() => { void reset(); }, [reset]);
  async function revealFaces() { if (!c) return; const r = await keeper.revealFaces(c, clientSeed); setFaces(r.faces); setCombined(r.combined); }
  function toggle(i: number) { const n = new Set(kept); n.has(i) ? n.delete(i) : n.add(i); setKept(n); }
  function score() {
    if (!c || !faces) return;
    if (!assertPlayAllowed().allowed) return;
    const o = keeper.resolve(c, clientSeed, combined, faces, [...kept]);
    setOut(o); try { recordRealPlay(branch, false); } catch { /* observed-only */ }
  }
  return (
    <div className="panel">
      <h2>Keeper's Dilemma <span className="pill">shaping</span></h2>
      <p className="muted">Reveal six fair dice, then keep the subset you want scored. Provably fair.</p>
      {!faces && <button className="btn primary" disabled={!c} onClick={() => void revealFaces()}>Reveal six dice</button>}
      {faces && !out && (
        <>
          <p className="muted">Tap dice to keep:</p>
          <div className="dice">{faces.map((f, i) => <button key={i} className="die" style={kept.has(i) ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined} onClick={() => toggle(i)}>{GLYPH[f]}</button>)}</div>
          <button className="btn primary" onClick={score}>Score kept ({kept.size})</button>
        </>
      )}
      {out && (
        <>
          <Dice faces={out.kept_faces} />
          <p>{out.score > 0 ? <span className="ok">{out.combo} — {out.score}.</span> : <span className="no">no scoring dice — 0.</span>}</p>
          <details><summary className="muted">Fairness data</summary><pre>{JSON.stringify(out, null, 2)}</pre></details>
          <button className="btn" onClick={() => void reset()}>New round</button>
        </>
      )}
    </div>
  );
}

// ── Call Your Shot ───────────────────────────────────────────────────────────
export function PlayTarget() {
  const branch = catalog.experimentToBranch['target']!;
  const [c, setC] = useState<target.TargetCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [dice, setDice] = useState(6);
  const [tgt, setTgt] = useState(500);
  const [out, setOut] = useState<target.TargetOutcome | null>(null);
  const reset = useCallback(async () => { setOut(null); setClientSeed(generateClientSeed()); setC(await target.commit()); }, []);
  useEffect(() => { void reset(); }, [reset]);
  async function go() {
    if (!c) return;
    if (!assertPlayAllowed().allowed) return;
    const o = await target.reveal(c, clientSeed, dice, tgt);
    setOut(o); try { recordRealPlay(branch, false); } catch { /* observed-only */ }
  }
  return (
    <div className="panel">
      <h2>Call Your Shot <span className="pill">foresight</span></h2>
      <p className="muted">Set your own target and dice count before the roll. Hit your number and it's a win by your own definition.</p>
      {!out ? (
        <>
          <label htmlFor="td">Dice: {dice}</label>
          <input id="td" type="range" min={target.MIN_DICE} max={target.MAX_DICE} value={dice} onChange={(e) => setDice(Number(e.target.value))} />
          <label htmlFor="tt">Target: {tgt}</label>
          <input id="tt" type="range" min={target.MIN_TARGET} max={target.MAX_TARGET} step={50} value={tgt} onChange={(e) => setTgt(Number(e.target.value))} />
          <div className="row" style={{ marginTop: 10 }}><button className="btn primary" disabled={!c} onClick={() => void go()}>Reveal &amp; roll</button></div>
        </>
      ) : (
        <>
          <Dice faces={out.faces} />
          <p className={out.met_target ? 'ok' : 'no'}>{out.combo || 'Farkle'} — {out.score} ({out.met_target ? 'met' : 'missed'} target {out.target_score}).</p>
          <details><summary className="muted">Fairness data</summary><pre>{JSON.stringify(out, null, 2)}</pre></details>
          <button className="btn" onClick={() => void reset()}>New round</button>
        </>
      )}
    </div>
  );
}
