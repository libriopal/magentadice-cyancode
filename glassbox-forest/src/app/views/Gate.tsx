import { useState } from 'react';
import { grantConsent, setRegion, REGION_METHOD } from '../forestApp';
import { decideRegion, BLOCKED_REGIONS } from '../../region/regionGate';

// 18+ / consent + hard region gate before any play (C5/C8). Sandbox uses a manual region entry (no
// IP-geolocation provider until a secrets/real-DB step). Fail-closed on unknown region.
export function Gate({ onReady }: { onReady: () => void }) {
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);
  const [regionInput, setRegionInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function proceed() {
    setError(null);
    const decision = decideRegion(regionInput || null, REGION_METHOD);
    if (!age || !consent) { setError('Confirm you are 18+ and agree to the opt-in data notice.'); return; }
    if (!decision.allowed) {
      setError(decision.region ? `Region "${decision.region}" is not eligible (${decision.reason ?? 'blocked'}).` : 'Enter your US state. Unknown regions are blocked by default.');
      return;
    }
    setRegion(decision.region as string);
    grantConsent();
    onReady();
  }

  return (
    <div className="panel">
      <h2>Consent &amp; eligibility</h2>
      <p className="muted">
        Research sandbox. We capture your gameplay decisions (and, later, optional survey answers) to
        learn which experiences engage people. Data is opt-in and local. Any points you earn are a score
        only — not money, not redeemable. Closed-loop; provably fair; NOT legal advice.
      </p>
      <div className="panel">
        <label><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /> I am 18 or older.</label>
        <label><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to opt-in capture of my gameplay decisions.</label>
        <label htmlFor="region">Your US state (2-letter)</label>
        <div className="row">
          <input id="region" placeholder="e.g. TX" maxLength={2} value={regionInput} onChange={(e) => setRegionInput(e.target.value.toUpperCase())} />
          <button className="btn primary" onClick={proceed}>Enter Forest</button>
        </div>
        {error && <p className="no" role="alert">{error}</p>}
        <p className="muted">{BLOCKED_REGIONS.blocked_us_states.length} states gated out (human-owned blocklist, Gate G4). NOT legal advice.</p>
      </div>
    </div>
  );
}
