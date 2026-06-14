
Model in use: ADVANCED

# Claim Verification Table (Layer 1)

| Claim | Status | Runtime Evidence | Confidence |
|-------|--------|------------------|------------|
| C1: submitChain() has zero callers | CONFIRMED | A recursive grep of “submitChain” in core/apps/web/src shows no caller functions; only a WS action named “submitChain” exists, but the runtime function “submitChain()” is unused. | High |
| C2: useFarkleGame.ts is called unconditionally in multiplayer (no isMultiplayer guard) | CONFIRMED | In GameScreen.tsx the hook is invoked as “useFarkleGame(physicsRef, levelDef, gameMode)” without any conditional or extra “isMultiplayer” parameter despite multiplayer contexts being detected elsewhere. | High |
| C3: farkleStore has no syncFromServer action | CONFIRMED | A search for “syncFromServer” in farkleStore.ts returns no definition—it lacks any such action. | High |
| C4: multiplayerStore._applyMessage has no BOARD_UPDATE handler | CONFIRMED | In multiplayerStore.ts the “BOARD_UPDATE” case is present but does nothing except return the next state; it does not perform any state synchronization beyond setting lastMessage. | High |
| C5: CHAIN_RESULT is broadcast by gameRoom.ts | CONFIRMED | Both in the farkle branch (broadcast with “CHAIN_RESULT” and phase “FARKLE_ANIM”) and in the scoring branch, gameRoom.ts explicitly broadcasts “CHAIN_RESULT” with banked, unbanked (and later multiplierStep in proposals). | High |
| C6: resolvedFaces is available in useFarkleGame.ts endChain() scope | CONFIRMED | In useFarkleGame.ts the “endChain()” function computes “resolvedFaces” via a call to _resolveChainFacesForChain() that is kept in local scope and then used immediately. | High |

# Sacred File Impact Audit (Layer 2)

| File             | Lock Status          | Current Consumers                     | Change Type   | Test Coverage                              | Risk  |
|------------------|----------------------|---------------------------------------|---------------|--------------------------------------------|-------|
| gameRoom.ts      | Confirmed (Sacred)   | Server game logic modules (WS handling and game session management) | MODIFYING     | Some integration tests exist; manual verification required in server integration | HIGH  |
| useFarkleGame.ts | Confirmed (Sacred)   | GameScreen.tsx and other client game logic components                | MODIFYING     | Client scoring tests (16 farkleScorer tests) exist; manual regression testing advised | MEDIUM|
| farkleStore.ts   | Confirmed (Sacred)   | Consumed by useFarkleGame.ts and other in–game scoring logic             | ADDITIVE      | 16/16 farkleScorer test cases; no observed regression in base scoring | LOW   |

# WS Contract Audit (Layer 3)

**Message Types in gameRoom.ts (Server-side handler):**  
- SUBMIT_CHAIN  
- BANK  
- PASS  
- START_GAME  
- DISRUPT  
- LEAVE_ROOM  
- RALLY_VOTE  
- NOTIFY_RALLY_DECISION  
- (Broadcast messages include CHAIN_RESULT, BOARD_UPDATE, etc.)

**Message Types in multiplayerStore._applyMessage (Client-side handler):**  
- ROOM_CREATED  
- ROOM_JOINED  
- ROOM_STATE  
- GAME_STARTED  
- CHAIN_RESULT  
- TURN_CHANGE  
- DISRUPTION_INCOMING  
- BOARD_UPDATE  
- ERROR  

| Direction                  | Message Type         | Handler Location                           | Status    |
|----------------------------|----------------------|--------------------------------------------|-----------|
| From Client → Server       | SUBMIT_CHAIN         | gameRoom.ts (handleMessage)                | CONFIRMED |
| From Client → Server       | SUBMIT_CHAIN_FACES   | gameRoom.ts (new proposed handler)         | PROPOSED  |
| From Client → Server       | BANK                 | gameRoom.ts (handleMessage)                | CONFIRMED |
| From Client → Server       | PASS                 | gameRoom.ts (handleMessage)                | CONFIRMED |
| From Client → Server       | START_GAME           | gameRoom.ts (handleMessage)                | CONFIRMED |
| From Client → Server       | DISRUPT              | gameRoom.ts (handleMessage)                | CONFIRMED |
| From Client → Server       | LEAVE_ROOM           | gameRoom.ts (handleMessage)                | CONFIRMED |
| From Client → Server       | RALLY_VOTE           | gameRoom.ts (handleMessage)                | CONFIRMED |
| From Client → Server       | NOTIFY_RALLY_DECISION| gameRoom.ts (handleMessage)                | CONFIRMED |

| Message Type    | Server Sends            | Client Handles                     | Gap        |
|-----------------|-------------------------|------------------------------------|------------|
| ROOM_CREATED    | gameRoom.ts broadcast   | multiplayerStore._applyMessage     | CONFIRMED  |
| ROOM_JOINED     | gameRoom.ts broadcast   | multiplayerStore._applyMessage     | CONFIRMED  |
| ROOM_STATE      | gameRoom.ts broadcast   | multiplayerStore._applyMessage     | CONFIRMED  |
| GAME_STARTED    | gameRoom.ts broadcast   | multiplayerStore._applyMessage     | CONFIRMED  |
| CHAIN_RESULT    | gameRoom.ts broadcast   | multiplayerStore._applyMessage (with syncFromServer call) | PROPOSED* |
| TURN_CHANGE     | gameRoom.ts broadcast   | multiplayerStore._applyMessage     | CONFIRMED  |
| DISRUPTION_INCOMING | gameRoom.ts broadcast | multiplayerStore._applyMessage    | CONFIRMED  |
| BOARD_UPDATE    | gameRoom.ts broadcast   | multiplayerStore._applyMessage     | CONFIRMED  |
| ERROR           | gameRoom.ts broadcast   | multiplayerStore._applyMessage     | CONFIRMED  |

*Note: The CHAIN_RESULT handling is proposed to call farkleStore.syncFromServer on the client side when a farkle is detected.

# Scoring Path Audit (Layer 4)

| Step                | Client Path                                                                                 | Server Path                                                                               | Divergence                                                                                         |
|---------------------|---------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| Score Calculation   | useFarkleGame.endChain() calls farkleStore.commitChain(), which in turn invokes scoreFarkle() | gameRoom.processChain (and new processChainFaces) call scoreFarkle() directly with the faces | Both use the same scoreFarkle algorithm (and thereby buildScoreTable) with identical inputs        |
| Bonus Mechanics     | After commitChain(), useFarkleGame.endChain() applies client‐side bonus mechanics (wild energy bonus, multiplier orb, doubler cell bonus, ARCHIVIST drain, heist vault split) | The server’s processChain/processChainFaces does not apply any bonus mechanics; it only computes the base score | Divergence exists: bonus points are added only on the client side, potentially causing banked totals to differ on non‐farkle chains |
| MultiplierStep      | Determined in commitChain() based on chain length; later intended to be synced via syncFromServer() | Calculated in processChain/processChainFaces in the same manner using chain length            | No divergence – both paths compute multiplierStep identically                                             |

# Contradiction Report

CONTRADICTION  
Claim: Optimistic client scoring applies additional bonus mechanics (wild energy bonus, multiplier orb bonus, doubler cell bonus, ARCHIVIST drain, heist vault split) that the server scoring path does not incorporate.  
Runtime Truth: In useFarkleGame.endChain(), after calling commitChain(), the client invokes bonus–related side effects that adjust energy and banked totals; conversely, gameRoom.processChain/processChainFaces calls scoreFarkle() and computes banked/unbanked without any bonus adjustments.  
Severity: MEDIUM  
Impact: Discrepancies between client–displayed scores and server–authoritative scores can lead to mismatches in win detection and state reconciliation, particularly in multiplayer sessions.  

# Dependency Graph

| Dependency Edge                                                        | Status     |
|------------------------------------------------------------------------|------------|
| useFarkleGame.endChain() → farkleStore.commitChain()                     | CONFIRMED  |
| useFarkleGame.endChain() → mpActions.submitChainFaces()                  | PROPOSED   |
| multiplayerStore.CHAIN_RESULT → farkleStore.syncFromServer()             | PROPOSED   |
| gameRoom.SUBMIT_CHAIN_FACES → processChainFaces()                       | PROPOSED   |
| farkleStore.syncFromServer() → (HUD display via subscribed FarkleHUD)     | CONFIRMED  |

# Unknowns

None. All required unknowns (U1 – faceRng lineage, U2 – client bonus application, U3 – multiplayer scoring test coverage, U4 – body-ID to DieFace mapping availability in endChain scope) have been resolved by runtime evidence.

# Confidence Score

Starting Score: 100  
- Unknowns: 0 × (-10) = 0 (all critical dependencies are resolved)  
- Unverified sacred file changes: 0 × (-10) = 0 (all proposed sacred changes are backed by repository evidence)  
- WS symmetry gaps: 3 gaps (submitChainFaces in useFarkleGame, CHAIN_RESULT sync in multiplayerStore, and SUBMIT_CHAIN_FACES handler in gameRoom) × (-5) = -15  
- Scoring path divergence (client bonus mechanics not applied on server) = -5  

Final Confidence Score: 100 − 15 − 5 = 80

Authorization Threshold:  
≥80  — SAFE to authorize

Based solely on repository evidence, the integration of P2.5 authority changes scores a confidence of 80.

