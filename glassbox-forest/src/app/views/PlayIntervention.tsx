// Play views for the intervention + transformation families: Author's Gambit and Transmute. HD dice,
// audio, full nutrient-loop recording + survey. Both are provably fair (the random roll is verifiable;
// the authoring/transform decisions are recorded transparently).
import { useEffect, useState, useCallback } from 'react';
import { generateClientSeed, type DieFace } from '../../engine/farkle-engine';
import * as ag from '../../experiments/author-gambit/authorGambit';
import * as tm from '../../experiments/transmute/transmute';
import { recordPlaySession, sparksBalance } from '../forestApp';
import { audio } from '../../audio/audioEngine';
import { Die, DiceRow } from '../components/Die';
import { SurveyView } from './SurveyView';

const Balance = () => <span className="muted">Balance: {sparksBalance()} Sparks</span>;

// ── Author's Gambit (intervention) ───────────────────────────────────────────
export function PlayAuthorGambit() {
  const [c, setC] = useState<ag.AuthorGambitCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [forced, setForced] = useState<ag.ForcedMap>({});
  const [out, setOut] = useState<ag.AuthorGambitOutcome | null>(null);
  const [sid, setSid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const reset = useCallback(async () => { setForced({}); setOut(null); setSid(null); setErr(null); setClientSeed(generateClientSeed()); setC(await ag.commit()); }, []);
  useEffect(() => { void reset(); }, [reset]);

  const forcedCount = Object.keys(forced).length;
  function setDie(idx: number, face: DieFace | 0) {
    const next = { ...forced };
    if (face === 0) delete next[idx];
    else if (forcedCount < ag.MAX_FORCED || idx in next) next[idx] = face;
    setForced(next);
  }
  async function go() {
    if (!c) return;
    audio.trigger('roll');
    const o = await ag.reveal(c, clientSeed, forced);
    const id = recordPlaySession('author-gambit', o, { forced: o.forced, client_seed: clientSeed });
    if (!id) { setErr('Play blocked: region not eligible.'); return; }
    audio.trigger(o.score > 0 ? 'score' : 'bust');
    setOut(o); setSid(id);
  }
  return (
    <div className="panel">
      <h2>Author's Gambit <span className="pill">intervention</span></h2>
      <p className="muted">Author the future: force up to {ag.MAX_FORCED} dice to a chosen face before the roll — but each forced die cuts your value by {ag.FORCE_COST * 100}%. Agency vs. ceiling. Provably fair (the random dice are verifiable; your forces are recorded).</p>
      {!out ? (
        <>
          <p className="muted">Force dice (tap a value; forced: {forcedCount}/{ag.MAX_FORCED}, multiplier ×{(Math.max(0, 1 - ag.FORCE_COST * forcedCount)).toFixed(1)}):</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                {forced[idx] ? <Die value={forced[idx]!} size={40} kept /> : <div className="pill" style={{ display: 'inline-block', padding: '14px 8px' }}>?</div>}
                <select value={forced[idx] ?? 0} onChange={(e) => setDie(idx, Number(e.target.value) as DieFace | 0)} style={{ width: '100%', marginTop: 4, padding: 4 }}>
                  <option value={0}>—</option>
                  {[1, 2, 3, 4, 5, 6].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}><button className="btn primary" disabled={!c} onClick={() => void go()}>Reveal &amp; roll</button><Balance /></div>
          {err && <p className="no">{err}</p>}
        </>
      ) : (
        <>
          <DiceRow faces={out.final_faces} />
          <p className={out.score > 0 ? 'ok' : 'no'}>score {out.base_score} × {out.multiplier.toFixed(1)} = <b>{out.score}</b> ({out.forced.length} forced).</p>
          <details><summary className="muted">Fairness data</summary><pre>{JSON.stringify(out, null, 2)}</pre></details>
          {sid && <SurveyView sessionId={sid} experimentId="author-gambit" onDone={() => setOut({ ...out })} />}
          <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => void reset()}>New round</button></div>
        </>
      )}
    </div>
  );
}

// ── Transmute (transformation) ───────────────────────────────────────────────
export function PlayTransmute() {
  const [c, setC] = useState<tm.TransmuteCommit | null>(null);
  const [clientSeed, setClientSeed] = useState(generateClientSeed());
  const [faces, setFaces] = useState<DieFace[] | null>(null);
  const [transforms, setTransforms] = useState<number[]>([]);
  const [out, setOut] = useState<tm.TransmuteOutcome | null>(null);
  const [sid, setSid] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reset = useCallback(async () => {
    setFaces(null); setTransforms([]); setOut(null); setSid(null); setErr(null);
    const cs = generateClientSeed(); const commit = await tm.commit();
    setClientSeed(cs); setC(commit);
    audio.trigger('reveal');
    const o0 = await tm.reveal(commit, cs, []); // reveal the raw roll to transform from
    setFaces(o0.rolled_faces);
  }, []);
  useEffect(() => { void reset(); }, [reset]);

  const budgetLeft = tm.TRANSFORM_BUDGET - transforms.length;
  // preview: apply transforms to a local copy
  const preview = faces ? faces.map((f, i) => {
    const ups = transforms.filter((t) => t === i).length;
    return Math.min(6, f + ups) as DieFace;
  }) : [];
  function transform(i: number) { if (budgetLeft > 0) setTransforms([...transforms, i]); }
  async function resolve() {
    if (!c) return;
    const o = await tm.reveal(c, clientSeed, transforms);
    const id = recordPlaySession('transmute', o, { transforms, client_seed: clientSeed });
    if (!id) { setErr('Play blocked: region not eligible.'); return; }
    audio.trigger(o.is_farkle ? 'bust' : 'score');
    setOut(o); setSid(id);
  }
  return (
    <div className="panel">
      <h2>Transmute <span className="pill">transformation</span></h2>
      <p className="muted">Roll six fair dice, then recombine: each transform upgrades a die by +1 (max 6). Spend {tm.TRANSFORM_BUDGET} to discover a hidden combo. Provably fair.</p>
      {faces && !out && (
        <>
          <p className="muted">Tap a die to upgrade (+1). Budget left: {budgetLeft}</p>
          <div className="dice">{preview.map((f, i) => <button key={i} className="die" onClick={() => transform(i)}><Die value={f} kept={transforms.includes(i)} /></button>)}</div>
          <div className="row"><button className="btn primary" onClick={() => void resolve()}>Score</button><button className="btn" onClick={() => setTransforms([])}>Reset transforms</button><Balance /></div>
          {err && <p className="no">{err}</p>}
        </>
      )}
      {out && (
        <>
          <DiceRow faces={out.final_faces} />
          <p>{out.score > 0 ? <span className="ok">discovered {out.score} ({out.transforms.length} transform{out.transforms.length === 1 ? '' : 's'}).</span> : <span className="no">no combo — 0.</span>}</p>
          <details><summary className="muted">Fairness data</summary><pre>{JSON.stringify(out, null, 2)}</pre></details>
          {sid && <SurveyView sessionId={sid} experimentId="transmute" onDone={() => setOut({ ...out })} />}
          <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => void reset()}>New round</button></div>
        </>
      )}
    </div>
  );
}
