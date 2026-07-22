// Deterministically print the branch catalog for a given seed. Reproducible; no side effects beyond
// stdout. Usage: npm run generate:branches -- <seed>   (defaults to "seed-42")
import { generateCatalog, describeSpec } from '../src/generator/branchGenerator.ts';

const seed = process.argv[2] || 'seed-42';
const catalog = generateCatalog(seed);
console.log(`# GLASSBOX Forest branch catalog (seed="${seed}") — ${catalog.length} branches\n`);
for (const spec of catalog) console.log(describeSpec(spec));
console.log(`\nAnchors: ${catalog.filter((s) => s.kind === 'anchor').length} · Generated: ${catalog.filter((s) => s.kind === 'generated').length}`);
console.log('Reproducible from seed; provenance=generated (never observed). Only real play advances a branch.');
