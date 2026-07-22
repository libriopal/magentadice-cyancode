import { useState } from 'react';
import { store } from '../labStore';
import { containsForbidden } from '../../evidence/forbiddenFields';

// Admin evidence export — always passes through the forbidden-field strip (C7). The UI
// also asserts the export is clean before offering the download, as a visible guard.
export function Admin() {
  const [preview, setPreview] = useState<string | null>(null);
  const [clean, setClean] = useState<boolean | null>(null);

  const snap = store.snapshot();
  const counts = {
    profiles: snap.profiles.length,
    sessions: snap.sessions.length,
    surveys: snap.surveys.length,
    sparks_ledger: snap.sparks_ledger.length,
    region_checks: snap.region_checks.length,
    experiments: snap.experiments.length,
  };

  function build() {
    const exported = store.exportEvidence();
    setClean(!containsForbidden(exported));
    setPreview(JSON.stringify(exported, null, 2));
  }

  function download() {
    const exported = store.exportEvidence();
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glassbox-evidence-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="panel">
      <h2>Evidence export</h2>
      <p className="muted">
        Local sandbox evidence (no real DB — that is a G3-gated step). Export is run through the
        forbidden-field strip so <code>skill_score</code> / <code>was_optimal</code> can never leave
        the system, by construction and defensively.
      </p>
      <p className="muted">
        Rows — profiles: {counts.profiles} · sessions: {counts.sessions} · surveys: {counts.surveys} ·
        sparks: {counts.sparks_ledger} · region checks: {counts.region_checks} · experiments:{' '}
        {counts.experiments}
      </p>
      <div className="row">
        <button className="btn" onClick={build}>Preview export</button>
        <button className="btn primary" onClick={download} disabled={counts.sessions === 0}>Download JSON</button>
      </div>
      {clean !== null && (
        <p className={clean ? 'ok' : 'no'}>
          {clean ? '✓ Export contains no forbidden fields.' : '✗ Forbidden field detected — export halted.'}
        </p>
      )}
      {preview && <pre>{preview}</pre>}
    </div>
  );
}
