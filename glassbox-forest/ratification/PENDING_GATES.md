# Pending gates — what each needs to open (human-only)

The code is built UP TO each gate and HALTS there. To open one, a HUMAN places the token file below (the
agent cannot) with contents `GRANTED BY <name> ON <date> FOR <scope>`, plus the listed artifact.

| Gate | Token to create | Human must also provide | Seam that unblocks |
|------|-----------------|-------------------------|--------------------|
| G1 | ratification/G1_REAL_MONEY.granted | licensed-counsel sign-off + value-model decision | src/economy/redemption.ts |
| G2 | ratification/G2_DEPLOY.granted | fill deploy/TARGET.md + deploy/ROLLBACK_PLAN.md | scripts/deploy_readiness.mjs · src/multiplayer/socialWitness.ts |
| G3 | ratification/G3_SECRETS.granted | scoped creds in .env (COHERE_API_KEY, DATABASE_URL) | src/persistence/adapter.ts · src/cohere/* |

Until then: closed-loop, local-only, no deploy, no spend. Every seam throws a GateError with an escalation.
