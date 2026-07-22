import { useState } from 'react';
import { recordSurvey, sparksBalance, getUserId } from '../forestApp';
import { SPARKS } from '../../sparks/wallet';

// Opt-in rewarded reflection survey (lean, native — no heavy dep). The bonus is FLAT for completion,
// never scaled by the content of answers (anti-circularity: we never grade the human). Fully skippable.
// The free-text reflection is the richest nutrient signal; nothing here computes a skill score.
export function SurveyView({ sessionId, experimentId, onDone }: { sessionId: string; experimentId: string; onDone: () => void }) {
  const [state, setState] = useState<'offer' | 'open' | 'done' | 'skipped'>('offer');
  const [engagement, setEngagement] = useState(3);
  const [again, setAgain] = useState('Maybe');
  const [reflection, setReflection] = useState('');

  function submit() {
    recordSurvey(sessionId, experimentId, { engagement, again }, reflection.trim());
    setState('done');
    onDone();
  }

  if (state === 'offer') {
    return (
      <div className="panel warnbox">
        <h2>Optional reflection <span className="pill">+{SPARKS.SURVEY_COMPLETION} Sparks</span></h2>
        <p className="muted">Skippable. The bonus is identical no matter what you answer.</p>
        <div className="row">
          <button className="btn primary" onClick={() => setState('open')}>Reflect</button>
          <button className="btn" onClick={() => setState('skipped')}>Skip</button>
        </div>
      </div>
    );
  }
  if (state === 'open') {
    return (
      <div className="panel">
        <label htmlFor="eng">How engaged did that decision feel? ({engagement})</label>
        <input id="eng" type="range" min={1} max={5} value={engagement} onChange={(e) => setEngagement(Number(e.target.value))} />
        <label htmlFor="ag">Would you play another round?</label>
        <select id="ag" value={again} onChange={(e) => setAgain(e.target.value)}>
          <option>Yes</option><option>Maybe</option><option>No</option>
        </select>
        <label htmlFor="ref">In your own words — why did you decide the way you did?</label>
        <textarea id="ref" value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="optional free text" />
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={submit}>Submit &amp; earn {SPARKS.SURVEY_COMPLETION}</button>
          <button className="btn" onClick={() => setState('skipped')}>Skip</button>
        </div>
      </div>
    );
  }
  if (state === 'done') {
    return <p className="ok">Reflection captured. +{SPARKS.SURVEY_COMPLETION} Sparks. Balance: {sparksBalance(getUserId())}.</p>;
  }
  return <p className="muted">Survey skipped — no bonus, no problem.</p>;
}
