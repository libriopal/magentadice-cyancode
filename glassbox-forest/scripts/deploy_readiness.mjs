// G2 DEPLOY READINESS — built UP TO the deploy gate. This checks everything a deploy needs and then
// HALTS at the G2 token: it NEVER deploys, exposes, or publishes anything. It verifies the build is
// producible and the human artifacts are present, then refuses unless ratification/G2_DEPLOY.granted
// exists (+ a real rollback plan). Run: npm run deploy:check
import { existsSync, readFileSync } from 'node:fs';
import { isGrantedNode, escalate } from './lib/gatesNode.mjs';

let ready = true;
const check = (ok, label) => { console.log(`${ok ? '✓' : '✗'} ${label}`); if (!ok) ready = false; };

console.log('G2 deploy readiness (no deploy is performed):\n');

// 1. build artifact producible?
check(existsSync('dist') || existsSync('index.html'), 'app source present (run `npm run build` to produce dist/)');

// 2. rollback plan artifact present + not a template?
const rp = 'deploy/ROLLBACK_PLAN.md';
const rpOk = existsSync(rp) && !readFileSync(rp, 'utf8').includes('<FILL-IN>');
check(rpOk, `rollback plan filled in (${rp})`);

// 3. deploy target declared?
const dt = 'deploy/TARGET.md';
const dtOk = existsSync(dt) && !readFileSync(dt, 'utf8').includes('<FILL-IN>');
check(dtOk, `deploy target declared (${dt})`);

// 4. THE GATE — G2 token present?
const g2 = isGrantedNode('G2_DEPLOY');
check(g2, 'G2_DEPLOY token present (human-created)');

console.log('');
if (ready && g2) {
  console.log('All readiness checks pass AND G2 is granted. A human deploy step may now run (this script still does not deploy).');
  process.exit(0);
} else {
  if (!g2) escalate('G2_DEPLOY', 'deploy target + rollback plan (fill deploy/TARGET.md and deploy/ROLLBACK_PLAN.md)');
  console.error('DEPLOY HALTED — up to the gate, not past it. Nothing was deployed or exposed.');
  process.exit(1);
}
