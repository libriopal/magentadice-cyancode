import { useState } from 'react';
import { hasConsent } from './labStore';
import { Gate } from './views/Gate';
import { PlayOneRoll } from './views/PlayOneRoll';
import { Verify } from './views/Verify';
import { Admin } from './views/Admin';

type Tab = 'play' | 'verify' | 'admin';

export function App() {
  const [consented, setConsented] = useState<boolean>(hasConsent());
  const [tab, setTab] = useState<Tab>('play');

  return (
    <div className="wrap">
      <h1>◧ GLASSBOX Labs</h1>
      <p className="muted">
        Evidence-first, closed-loop skill-game experiments. No real money. Geo-gated. Provably fair.
        <br />
        <span className="pill">P0–P1 sandbox</span> <span className="pill">Sparks are non-redeemable</span>{' '}
        <span className="pill">NOT legal advice</span>
      </p>

      {!consented ? (
        <Gate onReady={() => setConsented(true)} />
      ) : (
        <>
          <nav>
            <button className={tab === 'play' ? 'active' : ''} onClick={() => setTab('play')}>Play · One-Roll</button>
            <button className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>Verify</button>
            <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Admin · Evidence</button>
          </nav>
          {tab === 'play' && <PlayOneRoll />}
          {tab === 'verify' && <Verify />}
          {tab === 'admin' && <Admin />}
        </>
      )}
    </div>
  );
}
