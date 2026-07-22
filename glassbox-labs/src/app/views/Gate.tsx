import { useState } from 'react';
import { grantConsent, getUserId, setRegion, REGION_METHOD, store } from '../labStore';
import { decideRegion, toRegionCheckRecord, BLOCKED_REGIONS } from '../../region/regionGate';

// P1/P2 gate shown before ANY capture: 18+ age gate, honest consent copy, and a hard
// region gate. In the sandbox the region is entered manually (no IP-geolocation provider
// until P2/G3); every region check is logged to the evidence store.
export function Gate({ onReady }: { onReady: () => void }) {
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);
  const [regionInput, setRegionInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function proceed() {
    setError(null);
    const decision = decideRegion(regionInput || null, REGION_METHOD);
    // Log EVERY region check (directive requirement).
    store.addRegionCheck(toRegionCheckRecord(decision, getUserId()));
    if (!age || !consent) {
      setError('You must confirm you are 18+ and agree to the opt-in data notice.');
      return;
    }
    if (!decision.allowed) {
      setError(
        decision.region
          ? `Region "${decision.region}" is not eligible (${decision.reason ?? 'blocked'}).`
          : 'Enter your US state. Unknown regions are blocked by default.'
      );
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
        This is a research sandbox. We capture your gameplay decisions and any optional survey
        answers to learn what makes skill experiments engaging. Data is opt-in and local to this
        sandbox. Sparks you earn are a score only — they are <b>not</b> money, cannot be purchased,
        redeemed, transferred, or cashed out. Surveys are always skippable.
      </p>

      <div className="panel">
        <label>
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /> I am 18
          years of age or older.
        </label>
        <label>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I
          agree to the opt-in capture of my gameplay decisions and optional survey answers.
        </label>
        <label htmlFor="region">Your US state (2-letter code)</label>
        <div className="row">
          <input
            id="region"
            placeholder="e.g. TX"
            maxLength={2}
            value={regionInput}
            onChange={(e) => setRegionInput(e.target.value.toUpperCase())}
          />
          <button className="btn primary" onClick={proceed}>Enter Labs</button>
        </div>
        {error && <p className="no" role="alert">{error}</p>}
        <p className="muted">
          {BLOCKED_REGIONS.blocked_us_states.length} states are currently gated out (human-owned
          blocklist, source: {BLOCKED_REGIONS.source}). The blocklist is legal config — it can only be
          changed by a human (Gate G4). NOT legal advice.
        </p>
      </div>
    </div>
  );
}
