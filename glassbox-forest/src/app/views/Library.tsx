import { useState } from 'react';
import { catalog, promoteBranch } from '../forestApp';
import { coordinateLabel } from '../../geometry/d2geometry';
import { branchIsPlayable } from '../../engine/ruleLayers';

// The geometrical-memory view: the seed-42 branch library rendered from the FOREST ledger. Shows each
// branch's coordinate, lifecycle state, and real-play count. Only real play moves a branch's state.
export function Library({ onPlay }: { onPlay: (experimentId: string) => void }) {
  const [, force] = useState(0);
  const specs = catalog.specs;
  const summary = catalog.ledger.summary();

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
                  {playableNow
                    ? <button className="btn" onClick={() => { onPlay(exp!); }}>play</button>
                    : e.state === 'generated'
                      ? <button className="btn" title="human selection — the proposer may never do this" onClick={() => { promoteBranch(s.id); force((n) => n + 1); }}>seed playable</button>
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
