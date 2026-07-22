import { useState, useEffect } from 'react';
import { hasConsent } from './forestApp';
import { applyTheme, getThemeName } from '../theme/themes';
import { audio } from '../audio/audioEngine';
import { Gate } from './views/Gate';
import { Library } from './views/Library';
import { PlayHoldCrown } from './views/PlayHoldCrown';
import { PlayOneRoll, PlayKeeper, PlayTarget } from './views/PlaySimple';
import { Verify } from './views/Verify';
import { Admin } from './views/Admin';
import { Settings } from './views/Settings';

type Tab = 'play' | 'library' | 'verify' | 'admin' | 'settings';

const PLAY_VIEWS: Record<string, () => JSX.Element> = {
  'hold-crown': PlayHoldCrown,
  'one-roll': PlayOneRoll,
  keeper: PlayKeeper,
  target: PlayTarget,
};

export function App() {
  const [consented, setConsented] = useState<boolean>(hasConsent());
  const [tab, setTab] = useState<Tab>('play');
  const [experimentId, setExperimentId] = useState<string>('hold-crown'); // emphasized default
  const [, forceTheme] = useState(0);

  useEffect(() => { applyTheme(getThemeName()); }, []);
  useEffect(() => { audio.setExperiment(experimentId); }, [experimentId]);

  const ActiveView = PLAY_VIEWS[experimentId];

  return (
    <div className="wrap">
      <h1>🌲 GLASSBOX Forest</h1>
      <p className="muted">
        Evidence-first, closed-loop experience-discovery ecosystem. Branches sampled across the D2 field;
        growth by real human play only. No real money · geo-gated · provably fair.
        <br />
        <span className="pill">seed-42</span> <span className="pill">Hold the Crown (King of Tokyo)</span> <span className="pill">NOT legal advice</span>
      </p>

      {!consented ? (
        <Gate onReady={() => setConsented(true)} />
      ) : (
        <>
          <nav>
            <button className={tab === 'play' ? 'active' : ''} onClick={() => setTab('play')}>Play</button>
            <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>Library</button>
            <button className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>Verify</button>
            <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Evidence</button>
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button>
          </nav>

          {tab === 'play' && (
            <>
              <nav>
                {Object.keys(PLAY_VIEWS).map((id) => (
                  <button key={id} className={experimentId === id ? 'active' : ''} onClick={() => setExperimentId(id)}>{id}</button>
                ))}
              </nav>
              {ActiveView ? <ActiveView /> : null}
            </>
          )}
          {tab === 'library' && <Library onPlay={(id) => { setExperimentId(id); setTab('play'); }} />}
          {tab === 'verify' && <Verify />}
          {tab === 'admin' && <Admin />}
          {tab === 'settings' && <Settings onTheme={() => forceTheme((n) => n + 1)} />}
        </>
      )}
    </div>
  );
}
