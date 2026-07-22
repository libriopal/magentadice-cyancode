import { useState } from 'react';
import { catalog, promoteBranch, nourishBranch, runEpoch, generateProposals } from '../forestApp';
import { coordinateLabel } from '../../geometry/d2geometry';
import { branchIsPlayable } from '../../engine/ruleLayers';

// The geometrical-memory view: the seed-42 branch library rendered from the FOREST ledger. Shows each
// branch's coordinate, lifecycle state, and real-play count. Only real play moves a branch's state.
export function Library({ onPlay }: { onPlay: (experimentId: string) => void }) {
  const [, force] = useState(0);
  const [epochMsg, setEpochMsg] = useState<string | null>(null);
  const specs = catalog.specs;
  const summary = catalog.ledger.summary();

  function doEpoch() {
    const { archived, nourishCandidates } = runEpoch();
    setEpochMsg(`Epoch: archived ${archived.length} untouched branch(es); ${nourishCandidates.length} branch(es) reached the real-play threshold and can be nourished (your call).`);
    force((n) => n + 1);
  }

  return (
    <div className="panel">
      <h2>Branch library <span className="pill">seed: {catalog.seed}</span></h2>
      <p className="muted">
        28 branches across the D2 field (5 families × 5 information-surfaces + 3 recreated anchors),
        generated deterministically from seed-42. Growth is driven ONLY by real human play — synthetic
        signal can never move a branch. States: {summary.byState.generated} generated ·{' '}
        {summary.byState['seeded-playable']} seeded-playable · {summary.byState.played} played ·{' '}
        {summary.byState.nourished} nourished · {summary.byState.archived} archived.
      </p>
      <div className="row">
        <button className="btn" onClick={doEpoch} title="shelves untouched branches; flags real-play-threshold branches to nourish">Run epoch</button>
        <button className="btn" onClick={() => { const ids = generateProposals(3); setEpochMsg(`Proposed ${ids.length} new dormant variation(s) (synthetic) — promote any you want to try. Cohere enriches these node-side.`); force((n) => n + 1); }} title="deterministic in-app proposer; Cohere enriches node-side">Propose variations</button>
        <span className="muted">Archiving is reversible + never synthetic-driven; nourish needs real play; proposals land dormant.</span>
      </div>
      {epochMsg && <p className="muted">{epochMsg}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
            <th>branch</th><th>coordinate</th><th>state</th><th>real plays</th><th></th>
          </tr>
        </thead>
        <tbody>
          {specs.map((s) => {
            const e = catalog.ledger.get(s.id)!;
            const exp = catalog.branchToExperiment[s.id];
            const playableNow = branchIsPlayable(s.ruleLayers) && !!exp;
            return (
              <tr key={s.id} style={{ borderTop: '1px solid var(--line)' }}>
                <td>{s.id}{s.kind === 'anchor' ? ' ★' : ''}</td>
                <td className="muted">{coordinateLabel(s.coordinate)}</td>
                <td className={e.state === 'played' || e.state === 'nourished' ? 'ok' : e.state === 'archived' ? 'no' : ''}>{e.state}</td>
                <td>{e.realPlayCount}</td>
                <td>
                  {e.realPlayCount >= 3 && e.state !== 'nourished' && (
                    <button className="btn" title="real-play evidence only" onClick={() => { nourishBranch(s.id); force((n) => n + 1); }}>nourish</button>
                  )}{' '}
                  {playableNow
                    ? <button className="btn" onClick={() => { onPlay(exp!); }}>play</button>
                    : e.state === 'generated'
                      ? <button className="btn" title="human selection — the proposer may never do this" onClick={() => { promoteBranch(s.id); force((n) => n + 1); }}>seed playable</button>
                      : e.state === 'archived'
                        ? <span className="pill">archived</span>
                        : <span className="pill">{e.state === 'seeded-playable' ? 'promoted (awaiting engine)' : 'dormant'}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted" style={{ marginTop: 10 }}>
        ★ = recreated current experiment. Dormant branches await a human seeding them playable (never
        auto-promoted). Play a branch to see its real-play count rise here.{' '}
        <button className="btn" onClick={() => force((n) => n + 1)}>refresh</button>
      </p>
    </div>
  );
}
