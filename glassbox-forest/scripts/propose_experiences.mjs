// Run the compliant Cohere experience-proposer (NODE-SIDE). Reads the real-play nutrient from a fresh
// seed-42 catalog, proposes variations (Cohere if COHERE_API_KEY is set + budget allows, else the
// deterministic fallback), and registers them into the FOREST ledger as DORMANT candidates. It NEVER
// promotes/nourishes — a human does that. No key (sandbox) → degrades cleanly, no spend, no network.
// Usage: npm run propose -- [count]
import { buildCanonicalCatalog } from '../src/forest/catalog.ts';
import { SpendTracker } from '../src/cohere/budget.ts';
import { proposeExperiences, registerProposals } from '../src/cohere/proposalEngine.ts';
import { isCohereAvailable } from '../src/cohere/config.ts';

const n = Number(process.argv[2] ?? 3);
const handle = buildCanonicalCatalog();
const tracker = new SpendTracker();

console.log(`Cohere available: ${isCohereAvailable()} (no key → deterministic degrade, no spend)`);
const { proposals, degraded } = await proposeExperiences(handle, tracker, n);
const ids = registerProposals(handle, proposals);

console.log(`\nDegraded: ${degraded} · proposed ${proposals.length} · registered ${ids.length} DORMANT candidate(s):`);
for (const p of proposals) {
  console.log(`  • ${p.spec.id}  [${p.origin}, synthetic]  — ${p.rationale}`);
}
console.log('\nAll proposals are provenance=synthetic and land as state "generated" (dormant).');
console.log('A HUMAN must seed one playable; real play alone can nourish. Synthetic signal never moves state.');
console.log(`Budget (experience-proposal): $${tracker.spentIn('experience-proposal').toFixed(2)} spent.`);
