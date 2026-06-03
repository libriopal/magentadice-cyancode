# CIDX|v=1|repo=magentadice-cyancode|dt=2026-06-02|fmt=pipe+pcb|goal=4eng_review+wiremap+owc_path
L|E=id,name,st,role,in,out,src|W=from>sig>to|G=gap|P=path|PV=proof_value|D=diagram|R=risk|T=test|S=score(0..5)
AUTHORITY|docs/MASTER_DIRECTIVE.md|v2.0 June 2026|supersedes=prompts/DIRECTIVE_PROTOCOL.md,docs/OPPORTUNITY_ENGINE_DIRECTIVE.md

## ENGINES
E|FF|FarkleFrenzy|live|authoritative game loop|chain,grid,energy,roles,bank,vault,ws|score,events,analytics|core/apps/server/src/gameRoom.ts;core/apps/web/src/store/farkleStore.ts;core/FARKLEFRENZY.md
E|MC|SandboxMonteCarlo|live+partial|rtp/balance oracle|mode,model,seed,sessions,roles|normalizer,rtp_parts,gate_report|core/packages/farkle-engine/src/monteCarlo.ts;core/apps/server/src/sandbox.ts;docs/P3_RTP_MONTE_CARLO_PLAN.md
E|OWC|OpportunityWeightController|theory|adaptive opportunity spawn governor|grid,risk,cascade,score_delta,mode,energy|wildBoost,cascadeBoost,deadPenalty,blockerBoost|design/OpportunityWeightController.md;tests/owc-test-spec.md
E|AG|AGROS/ARGOS_audio_ERK|live+gap|emotional music+dsp conductor|gamePhase,chainLen,unbanked,explosion|calm,melancholic,tense,euphoric,sfx|core/apps/web/src/audio/gameAudio.ts;core/apps/web/src/hooks/useGameAudio.ts;docs/ff-v4-gap-analysis.md

## COMPACT FACTS
F|FF.rules|grid=7/8/9/10;chain=2..6;adj=4way;faces=1..6;score=max_partition;mult=[1,1.25,1.5,2,3,4];farkle=lose_unbanked;bank=safe|core/FARKLEFRENZY.md:328
F|FF.modes|SOLO/VS/RALLY/HEIST x FREE/CASINO;FD/PDX;RALLY roles=RAINMAKER,HEADHUNTER,ARCHIVIST,CONDUCTOR;HEIST vault=70/30|core/FARKLEFRENZY.md:194
F|FF.auth|server handles SUBMIT_CHAIN(_FACES),BANK,PASS,START,DISRUPT,RALLY_VOTE,COLLECT_ORB,CLAIM_VAULT;broadcasts CHAIN_RESULT,BOARD_UPDATE,GAME_STARTED,ENERGY_UPDATE|core/apps/server/src/gameRoom.ts
F|FF.score|scoreFarkle uses lookup table/max partition;6kind=>BOMB_STANDARD;straight=>BOMB_RAINBOW|core/packages/farkle-engine/src/farkleScorer.ts
F|FF.grid|SixPoolManager keeps equal face pool;createGrid places stone/ice/lock;spawnTiles draws die/wild only;hasValidChain scans chainability|core/packages/farkle-engine/src/gridUtils.ts
F|FF.dead|server dead recovery: if !hasValidChain then reshuffle up to 3, then BOARD_DEAD_RECOVERY_FAILED+endSession|core/apps/server/src/gameRoom.ts
F|FF.analytics|insertChainDecision stores faces,score,mult,unbanked,decision,was_optimal;insertSession computes skill_score|core/apps/server/src/analytics.ts
F|MC.v2|runMonteCarloV2 async chunks;streams=dice,board,bonus,decision;models=OPTIMAL/AVERAGE/WEAK;tracks p5,p95,var,rtp_parts,roles,milestones,votes|core/packages/farkle-engine/src/monteCarlo.ts
F|MC.old|runMonteCarlo still old wrapper: raw lookupScore loop;no board/mult/roles/bonus|core/packages/farkle-engine/src/monteCarlo.ts
F|MC.api|HTTP has /simulate old,/simulate-v2,/rtp-audit,/role-audit,/coverage-status;WS RUN_SIM still uses old runMonteCarlo+placeholder V2 shape|core/apps/server/src/sandbox.ts
F|OWC.design|ctx={grid,comboCount,cascadePotential,farkleRisk,turnNumber,playerBanked,leaderBanked,mode,energyMode};adj={wildBoost<=10,cascade<=10,deadPenalty<=8,blocker<=5}|design/OpportunityWeightController.md
F|OWC.constraint|do_not_touch scorer,csprng,SixPoolManager face balance,stores;add optional spawnTiles(grid,pool,owc)|design/OpportunityWeightController.md
F|AG.live|gameAudio has WebAudio SFX+ERK profiles;EmotionalState=calm/melancholic/tense/euphoric;useGameAudio maps chainLen/gamePhase/unbanked=>setMusicState|core/apps/web/src/audio/gameAudio.ts;core/apps/web/src/hooks/useGameAudio.ts
F|AG.gap|roadmap says AGROS ERK conductor not fully wired to FAR_NZY game state;current hook is basic, not RTP/OWC/energy-aware|docs/ff-v4-gap-analysis.md:51

## CIRCUIT_DIAGRAMS
D|FF|
```text
[WS in]--chain-->[GameRoom]--faces-->[scoreFarkle]--score/combo/bomb-->[bank/unbank/mult]
   |                 |                         |                     |
   |                 v                         v                     v
[RALLY/HEIST]-->[roles/vault/orb/doubler]-->[CHAIN_RESULT]-->[web stores/HUD/audio]
   |                 |
   v                 v
[grid/pool]--hasValidChain-->[dead recovery]--BOARD_UPDATE-->[client board]
   \--decisions/session----------------------------->[analytics/skill]
```
D|MC|
```text
[SimConfig]-->[runMonteCarloV2]=>{diceRng|boardRng|bonusRng|decisionRng}
   |              |         |          |             |
   |              v         v          v             v
   |          [score]   [spawnW]   [orb/bomb]   [playerModel]
   |              \___________rtp_parts+p5/p95+normalizer___________/
   v
[/simulate-v2][/rtp-audit][/role-audit]----reports---->[core/art/profiling]
```
D|OWC|
```text
[grid]--hasValidChain/scanForWilds/estRisk-->[OWC ctx]
[score delta]+[leader gap]+[energy]+[cascadePotential]--/
        |
        v
  [computeOWCAdjustment]
   |wild+ |cascade+ |dead- |blocker+
   v      v         v      v
[spawnTiles optional bias]-->[more readable boards]-->[analytics+MC gate]
```
D|AG|
```text
[farkleStore]+[explosionStore]+[mp lastMessage]
   | chainLen,phase,unbanked,bomb,bank,farkle
   v
[useGameAudio]-->[resolveEmotionalState]-->[setMusicState]
   |                                    |
   v                                    v
[SFX funcs]                         [ERK profiles: calm/mel/tense/euph]
```
D|4ENG_PCB|
```text
          risk/cascade                  rtp gate
 [FF] ====================> [OWC] ====================> [MC]
  ||  CHAIN_RESULT/ENERGY      ^  sim variants             ||
  ||  BOARD_UPDATE             |  results/gates            ||
  VV                           |                           VV
 [AG] <===== emotion bus ======+====== proof telemetry <====+
      tension/farkle/bank/lead/owc_state
```

## NATURAL_WIRES
W|FF.grid>grid,hasValidChain,scanForWilds,estimateFarkleRisk>OWC.ctx|fit=5|no_new_pkg=1|why=already exported by farkle-engine
W|FF.state>playerBanked,leaderBanked,mode,energyMode,comboCount>OWC.ctx|fit=5|no_new_pkg=1|why=GameRoom already owns banked/mode/players/energy
W|OWC.adj>wildBoost/deadPenalty/blockerBoost>FF.spawnTiles/createGrid|fit=4|code_needed=min|why=spawnTiles already single choke point;design keeps optional param
W|OWC.adj>config variant>MC.runMonteCarloV2|fit=5|code_needed=med|why=MC is balance oracle;OWC must pass RTP gates before live
W|MC.result>normalizer/rtp_parts/gates>FF.rtpConfig/sandbox UI|fit=5|code_needed=min|why=/rtp-audit already emits report
W|FF.CHAIN_RESULT>score,farkle,banked,unbanked,mult,bonuses>AG.resolveEmotionalState|fit=5|code_needed=min|why=multiplayerStore already stores lastMessage;farkleStore syncs server totals
W|FF.ENERGY_UPDATE+mode>AG.tension|fit=4|code_needed=min|why=GameRoom already broadcasts energy
W|OWC.adj>AG.emotion|fit=4|code_needed=low|why=stagnation/comeback/explosive are emotional states: tense/euphoric/calm
W|FF.analytics.chain_decisions>OWC tuning+MC validation|fit=4|code_needed=min|why=was_optimal/farkle/decision already stored
W|MC.roleContribution>AG role motif tuning|fit=3|code_needed=low|why=roles already named in audio/game loop;can vary ERK profile per role without scoring changes

## GAPS
G|G1|OWC not implemented;spawnTiles signature lacks owc;createGrid no state-aware opportunity|sev=high|src=design/OpportunityWeightController.md;core/packages/farkle-engine/src/gridUtils.ts
G|G2|MC V2 exists but WS sandbox RUN_SIM uses old runMonteCarlo and placeholder V2 fields|sev=high|src=core/apps/server/src/sandbox.ts
G|G3|MC V2 approximates board composition;does not consume actual grid/spawnTiles/OWC yet|sev=med|src=core/packages/farkle-engine/src/monteCarlo.ts
G|G4|GameRoom payout uses player.profile.banked in SOLO/VS endSession while scoring writes room state.banked;possible payout/winner mismatch|sev=high|src=core/apps/server/src/gameRoom.ts
G|G5|OWC proof requires RTP harness gate 88..96 and ADR-021 before merge|sev=high|src=design/OpportunityWeightController.md;tests/owc-test-spec.md
G|G6|AG basic conductor ignores multiplierStep,energy,farkleRisk,OWC state,role,vault,leader gap|sev=med|src=core/apps/web/src/hooks/useGameAudio.ts
G|G7|Analytics package has match_resolved type, server uses chain_decisions;OWC needs one canonical telemetry path|sev=med|src=core/packages/analytics/src/index.ts;core/apps/server/src/analytics.ts
G|G8|Dead recovery is reactive after no chain;OWC should prevent/reduce dead state before recovery fires|sev=med|src=core/apps/server/src/gameRoom.ts

## IMPLEMENTATION_PATHS
P|P0_index_only|done=create this map;no source edits|risk=0|next=P1
P|P1_wire_MC_sandbox|change WS RUN_SIM to await runMonteCarloV2(config) instead of old runMonteCarlo placeholder;keep /simulate old|files=core/apps/server/src/sandbox.ts|value=truthful sandbox UI|tests=simulate-v2+RUN_SIM smoke
P|P2_OWC_pure|add opportunityWeight.ts pure computeOWCAdjustment exactly bounded;export from index|files=core/packages/farkle-engine/src/opportunityWeight.ts,index.ts|value=testable no behavior change|tests=tests/owc-test-spec.md cases 1..5
P|P3_OWC_spawn_hook|extend spawnTiles(grid,pool,owc?) only;default identical;wild threshold only first;no face distribution change|files=gridUtils.ts|value=adaptive refill|tests=old scorer+grid tests+OWC RTP sim
P|P4_GameRoom_ctx|compute ctx after chain/refill/dead-check using existing grid/state/player scores/energy;pass owc only to spawn/recovery paths|files=gameRoom.ts|value=live opportunity engine|tests=dead-board regression+RTP
P|P5_MC_OWC_gate|add SimConfig.owcScenario and compare off/on;gate RTP bands+skill gap+bonus limits|files=monteCarlo.ts,sandbox.ts|value=legal proof before ship|tests=/rtp-audit seed=1,42,999
P|P6_AG_signal_upgrade|extend resolveEmotionalState inputs: multiplierStep,energyMode,isFarkle,bankDelta,owcAdj,role;call existing setMusicState only|files=useGameAudio.ts|value=audio reacts to real tension|tests=manual+unit pure resolver
P|P7_telemetry_close_loop|log owcAdj+cascadePotential+deadRecovery to chain/session analytics or existing analytics client|files=analytics.ts,skillMetrics.ts?|value=measure retention/skill perception|tests=SQL insert shape
P|P8_payout_fix_audit|verify/fix profile.banked vs state.banked payout/winner paths before casino certification|files=gameRoom.ts|value=legal correctness|tests=SOLO_CASINO/VS_CASINO endSession

## OWC_POLICY
O|inputs|minimal={grid,comboCount,farkleRisk,cascadePotential,turnNumber,playerBanked,leaderBanked,mode,energyMode}
O|cascadePotential|derive_no_new_code=hasValidChain?0.4:0 + wilds*0.1 + scoring_neighbors*0.1 capped1|better_later=board search scoring-chain count
O|stagnant|if cascade<.2 && risk>.6 then wild+5 dead+3
O|behind|if leader>0 && player<leader*.7 then cascade+5
O|ahead|if player>leader*1.3 then blocker+3 wild-3
O|explosive|if cascade>.8 then blocker+=floor(cascade*5) capped5
O|legal_guard|never alter die face pool;never touch scorer/CSPRNG;always optional;MC gate before live

## PROOF_VALUE
PV|OWC_retention|metric=deadRecoveryRate+farkleRate+avg_chain_score+session_length|expected=15..25% more cascades on stagnant boards|source=OWC design
PV|MC_compliance|metric=RTP band+skill delta+role balance+seed reproducibility|expected=certification artifact|source=/rtp-audit,/role-audit
PV|AG_experience|metric=state transition coverage+audio latency+farkle/bank emotional hit rate|expected=less flat audio;uses existing ERK|source=gameAudio/useGameAudio
PV|4eng_synergy|metric=OWC on/off A/B: dead boards down, RTP stable, skill gap preserved, emotion states track tension|expected=opportunity without payout creep

## PRIORITY_MATRIX
S|P1|impact=4|risk=1|effort=1|rank=1
S|P2|impact=5|risk=1|effort=2|rank=2
S|P5|impact=5|risk=3|effort=3|rank=3
S|P3|impact=5|risk=4|effort=2|rank=4
S|P6|impact=3|risk=1|effort=1|rank=5
S|P4|impact=5|risk=4|effort=3|rank=6
S|P8|impact=5|risk=3|effort=2|rank=0_must_audit

## TESTS
T|static|no source behavior changed by this index
T|next_min|P1: call /simulate-v2 and WS RUN_SIM same seed config;assert non-placeholder p5/p95/rtp parts
T|owc_unit|cases=stagnation,behind,ahead,explosive,bounds,no-default-change
T|owc_rtp|run MC off/on max stagnation;assert RTP within mode bands;assert skill gap not collapsed
T|ag_audio|resolver table tests: farkle=>melancholic,high unbanked/mult=>tense/euphoric,win=>euphoric,lose=>melancholic

## READ_ORDER_FOR_AGENTS
RO|0|docs/MASTER_DIRECTIVE.md — MASTER DIRECTIVE (authoritative governance; read before all else)
RO|1|codex_index.md
RO|2|core/FARKLEFRENZY.md
RO|3|core/packages/farkle-engine/src/{farkleScorer.ts,gridUtils.ts,monteCarlo.ts,rtpConfig.ts}
RO|4|core/apps/server/src/{gameRoom.ts,sandbox.ts,analytics.ts}
RO|5|core/apps/web/src/{store/farkleStore.ts,store/multiplayerStore.ts,hooks/useGameAudio.ts,audio/gameAudio.ts}
RO|6|design/OpportunityWeightController.md;tests/owc-test-spec.md;docs/P3_RTP_MONTE_CARLO_PLAN.md;docs/ff-v4-gap-analysis.md
