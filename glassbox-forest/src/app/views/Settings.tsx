import { useState } from 'react';
import { THEMES, getThemeName, setThemeName, type ThemeName } from '../../theme/themes';
import { audio } from '../../audio/audioEngine';
import { surveyMood } from '../forestApp';
import { OSS_CREDITS, PROVENANCE } from '../../credits';
import { Die } from '../components/Die';
import { GatedFeatures } from './GatedFeatures';

// Settings — theme picker (cosmetic; never changes outcomes), audio toggle (survey-mood-driven), and
// source appreciation / credits for every open-source project this is built on.
export function Settings({ onTheme }: { onTheme: (t: ThemeName) => void }) {
  const [theme, setTheme] = useState<ThemeName>(getThemeName());
  const [sound, setSound] = useState<boolean>(audio.isEnabled());
  const [busy, setBusy] = useState(false);

  function pick(t: ThemeName) { setThemeName(t); setTheme(t); onTheme(t); }
  async function toggleSound() {
    setBusy(true);
    if (sound) { audio.disable(); setSound(false); }
    else { const ok = await audio.enable(); if (ok) { audio.setMood(surveyMood()); audio.trigger('reveal'); } setSound(ok); }
    setBusy(false);
  }

  return (
    <div className="panel">
      <h2>Settings</h2>

      <h3 className="sub">Theme <span className="muted">(cosmetic skin — never changes any outcome)</span></h3>
      <div className="theme-grid">
        {(Object.keys(THEMES) as ThemeName[]).map((t) => (
          <button key={t} className={`theme-card ${theme === t ? 'active' : ''}`} onClick={() => pick(t)}>
            <div className="row" style={{ gap: 6 }}>
              <Die value={5} size={38} theme={t} />
              <div style={{ textAlign: 'left' }}>
                <div><b>{THEMES[t].label}</b></div>
                <div className="muted" style={{ fontSize: 11 }}>{THEMES[t].blurb}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <h3 className="sub">Audio</h3>
      <div className="row">
        <button className="btn primary" onClick={() => void toggleSound()} disabled={busy}>{sound ? 'Sound: ON' : 'Sound: OFF'}</button>
        <span className="muted">Per-experiment music + SFX. Brightness follows the average survey mood ({surveyMood().toFixed(1)}/5) — audio observes evidence, never changes it.</span>
      </div>

      <GatedFeatures />

      <h3 className="sub">Credits &amp; source appreciation</h3>
      <p className="muted">Built with open source, not from scratch. Thank you to:</p>
      <ul className="credits">
        {OSS_CREDITS.map((c) => (
          <li key={c.name}><a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> <span className="pill">{c.license}</span> — {c.use}</li>
        ))}
      </ul>
      <p className="muted">Provenance:</p>
      <ul className="credits">
        {PROVENANCE.map((c) => (
          <li key={c.name}><a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> — {c.use}</li>
        ))}
      </ul>
    </div>
  );
}
