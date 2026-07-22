import { useState } from 'react';
import { exportEvidence, evidence, catalog, sparksBalance } from '../forestApp';
import { containsForbidden } from '../../evidence/forbiddenFields';

// Facilitator view: the captured evidence (persisted across reloads) + a forbidden-field-stripped export.
export function Admin() {
  const [preview, setPreview] = useState<string | null>(null);
  const [clean, setClean] = useState<boolean | null>(null);
  const s = catalog.ledger.summary();

  function build() {
    const exported = exportEvidence();
    setClean(!containsForbidden(exported));
    setPreview(JSON.stringify(exported, null, 2));
  }
  function download() {
    const blob = new Blob([JSON.stringify(exportEvidence(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `glassbox-forest-evidence-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="panel">
      <h2>Evidence &amp; memory</h2>
      <p className="muted">
        Persisted locally (a real DB is a G3 step). Forbidden fields (skill_score/was_optimal) are stripped
        on export by construction. Balance: {sparksBalance()} Sparks.
      </p>
      <p className="muted">
        Sessions: {evidence.sessions.length} · surveys: {evidence.surveys.length} · region checks:{' '}
        {evidence.region_checks.length} · sparks entries: {evidence.sparks_ledger.length}
      </p>
      <p className="muted">
        Ledger — generated: {s.byState.generated} · seeded-playable: {s.byState['seeded-playable']} ·
        played: {s.byState.played} · nourished: {s.byState.nourished} · archived: {s.byState.archived}
      </p>
      <div className="row">
        <button className="btn" onClick={build}>Preview export</button>
        <button className="btn primary" onClick={download} disabled={evidence.sessions.length === 0}>Download JSON</button>
      </div>
      {clean !== null && <p className={clean ? 'ok' : 'no'}>{clean ? '✓ No forbidden fields in export.' : '✗ Forbidden field detected.'}</p>}
      {preview && <pre>{preview}</pre>}
    </div>
  );
}
