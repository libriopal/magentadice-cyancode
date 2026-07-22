# DATA MODEL (local/sandbox until G3)
profiles(user_id, age_confirmed_at, consent_at, created_at)
sessions(id, user_id, experiment_id, detected_region, region_method, region_allowed, server_seed,
         server_seed_hash, revealed_at, outcome_json, sparks_awarded, created_at)
surveys(id, session_id, user_id, experiment_id, answers_json, reflection_text, sparks_bonus, created_at)  # NO skill_score/was_optimal
sparks_ledger(id, user_id, delta, reason, session_id, created_at)   # non-redeemable, no external value
experiments(id, name, hypothesis, status, created_at)              # loaded from config
region_checks(id, user_id, detected_region, allowed, method, created_at)
