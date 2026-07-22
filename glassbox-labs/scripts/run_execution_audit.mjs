// Runnable execution audit → writes a Markdown artifact into evidence/audits/.
// Advisory, NON-RATIFYING (governance/AI_AUDIT_LOOP_SPEC.md). Needs no API key (this is the
// deterministic in-repo pipeline audit, distinct from the optional Claude-API auditor in
// ai_audit.mjs). Run: npm run audit:play
import { mkdirSync, writeFileSync } from 'node:fs';
import { runExecutionAudit, renderAuditMarkdown } from '../src/audit/executionAudit.ts';

const report = await runExecutionAudit();
const md = renderAuditMarkdown(report);
mkdirSync('evidence/audits', { recursive: true });
const path = `evidence/audits/${report.generatedAt.replace(/[:.]/g, '-')}-execution-audit.md`;
writeFileSync(path, md);
console.log(md);
console.log(`\nadvisory execution audit written: ${path}`);
if (!report.ok) {
  console.error('\nAUDIT INVARIANTS FAILED — do not playtest until resolved.');
  process.exit(1);
}
