# AUTONOMY POLICY (auto-accept scope + refusal boundary)
Auto-accept / --dangerously-skip-permissions PERMITTED only when ALL hold:
  (a) isolated, reversible sandbox (no real creds, no prod, no real DB);
  (b) work is within P0-P4 (closed-loop, non-consequential);
  (c) all HUMAN_GATES remain enforced by token-absence.
FORBIDDEN for P5, deploy, secrets, geo-legal config, irreversible actions -> require a human token
regardless of session mode. The boundary is STRUCTURAL: gated steps cannot run without a token file,
so it does not depend on the agent choosing caution.
