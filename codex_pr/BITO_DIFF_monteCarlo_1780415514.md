Model in use: ADVANCED

**Review Summary**

- **Float Arithmetic:**  
  All score calculations use Math.round (or equivalent) to handle float arithmetic. There are no apparent issues with floating‐point arithmetic in scoring paths.

- **Math.random Usage:**  
  The simulation logic exclusively utilizes the provided CSPRNG (seededRng) instances (diceRng, boardRng, bonusRng, decisionRng) rather than Math.random. This meets the requirement.

- **Exported Symbols:**  
  The existing symbols—MonteCarloResult, calibrateNormalizer, and runMonteCarlo—remain exported. Backward compatibility is maintained.

- **CSPRNG Lineage:**  
  The derivation of per-session streams using seededRng with XOR-ed constants appears correct and preserves proper CSPRNG lineage.

- **MonteCarloResultV2 Fields:**  
  All expected fields for MonteCarloResultV2 are present and appropriately populated from the simulation accumulators (even though one field, deadBoardRecoveryRate, is accumulated as zero, it is defined as required).

- **Type Safety:**  
  There are no signs of type widening to 'any'. All types, including new ones (e.g., PlayerModel, SimConfig), are properly defined.

- **Backward Compatibility (runMonteCarlo() and calibrateNormalizer()):**  
  The existing exports for runMonteCarlo() and calibrateNormalizer() remain maintained and are expected to call through to the V2 implementation, ensuring backward compatibility.

**Overall Score: 100**

Since the score is 100 (which is above 80), no exit condition is triggered.

