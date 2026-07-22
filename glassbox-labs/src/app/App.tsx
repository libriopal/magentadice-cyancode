import { useState } from 'react';
import { hasConsent } from './labStore';
import { EXPERIMENTS } from '../experiments/registry';
import { Gate } from './views/Gate';
import { PlayOneRoll } from './views/PlayOneRoll';
import { PlayKeeper } from './views/PlayKeeper';
import { PlayTarget } from './views/PlayTarget';
import { Verify } from './views/Verify';
import { Admin } from './views/Admin';

type Tab = 'library' | 'verify' | 'admin';

const PLAY_VIEWS: Record<string, () => JSX.Element> = {
  'one-roll': PlayOneRoll,
  keeper: PlayKeeper,
  target: PlayTarget,
};

export function App() {
  const [consented, setConsented] = useState<boolean>(hasConsent());
  const [tab, setTab] = useState<Tab>('library');
  const [experimentId, setExperimentId] = useState<string>('one-roll');

  const ActiveView = PLAY_VIEWS[experimentId];

  return (
    <div className="wrap">
      <h1>◧ GLASSBOX Labs</h1>
      <p className="muted">
        Evidence-first, closed-loop skill-game experiments. No real money. Geo-gated. Provably fair.
        <br />
        <span className="pill">P0–P3 sandbox</span> <span className="pill">Sparks are non-redeemable</span>{' '}
        <span className="pill">NOT legal advice</span>
      </p>

      {!consented ? (
        <Gate onReady={() => setConsented(true)} />
      ) : (
        <>
          <nav>
            <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Experiments</button>
            <button className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>Verify</button>
            <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Admin · Evidence</button>
          </nav>

          {tab === 'library' && (
            <>
              <div className="panel">
                <h2>Experiment library</h2>
                <p className="muted">Rendered from config/experiments.registry.json. Each row is a closed-loop, provably-fair skill experiment.</p>
                <nav>
                  {EXPERIMENTS.map((e) => (
                    <button
                      key={e.id}
                      className={experimentId === e.id ? 'active' : ''}
                      onClick={() => setExperimentId(e.id)}
                      disabled={!PLAY_VIEWS[e.id]}
                      title={e.hypothesis}
                    >
                      {e.name} <span className="pill">{e.phase}</span>
                    </button>
                  ))}
                </nav>
              </div>
              {ActiveView ? <ActiveView /> : <p className="muted">No player UI for “{experimentId}” yet.</p>}
            </>
          )}
          {tab === 'verify' && <Verify />}
          {tab === 'admin' && <Admin />}
        </>
      )}
    </div>
  );
}
