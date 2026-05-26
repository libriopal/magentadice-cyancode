# Tests — OpportunityWeightController Test Spec

**Date:** 2026-05-25 | **Status:** Spec only — implementation pending OWC build

## Test File

`core/packages/farkle-engine/src/__tests__/opportunityWeight.test.ts`

## Test Cases

### 1. Stagnation Detection
```typescript
test('stagnation: cascadePotential < 0.2 AND farkleRisk > 0.6 → wildBoost > 0', () => {
  const adj = computeOWCAdjustment({
    grid: /* empty grid */,
    comboCount: 0,
    cascadePotential: 0.1,
    farkleRisk: 0.8,
    turnNumber: 5,
    playerBanked: 1000,
    leaderBanked: 1000,
    mode: 'SOLO_FREE',
    energyMode: 'NORMAL',
  });
  assert.ok(adj.wildBoostPct > 0, 'stagnant board must boost wild spawn');
  assert.ok(adj.deadStatePenaltyPct > 0, 'stagnant board must reduce dead tiles');
});
```

### 2. Comeback Scenario
```typescript
test('behind: playerBanked < leaderBanked * 0.7 → cascadeEnablerBoost > 0', () => {
  const adj = computeOWCAdjustment({
    cascadePotential: 0.4,
    farkleRisk: 0.3,
    playerBanked: 5000,
    leaderBanked: 10000,  // player is 50% behind
    // ...
  });
  assert.ok(adj.cascadeEnablerBoostPct > 0, 'behind player must get cascade opportunities');
  assert.strictEqual(adj.wildBoostPct, 0, 'no wild boost for non-stagnant board');
});
```

### 3. Ahead Normalization
```typescript
test('ahead: playerBanked > leaderBanked * 1.3 → blockerBoost > 0', () => {
  const adj = computeOWCAdjustment({
    playerBanked: 15000,
    leaderBanked: 10000,  // player is 50% ahead
    cascadePotential: 0.5,
    farkleRisk: 0.2,
    // ...
  });
  assert.ok(adj.blockerBoostPct > 0, 'ahead player must face more friction');
});
```

### 4. Explosive Board Normalization
```typescript
test('explosive: cascadePotential > 0.8 → blockerBoost > 0', () => {
  const adj = computeOWCAdjustment({ cascadePotential: 0.9, /* ... */ });
  assert.ok(adj.blockerBoostPct > 0);
});
```

### 5. Bounds Never Exceeded
```typescript
test('all adjustments are within defined maximums', () => {
  const extremeCtx = { cascadePotential: 0.0, farkleRisk: 1.0, playerBanked: 0, leaderBanked: 100000 };
  const adj = computeOWCAdjustment({ ...extremeCtx, /* ... */ });
  assert.ok(adj.wildBoostPct <= 10);
  assert.ok(adj.cascadeEnablerBoostPct <= 10);
  assert.ok(adj.deadStatePenaltyPct <= 8);
  assert.ok(adj.blockerBoostPct <= 5);
});
```

### 6. No EV Increase — RTP Simulation Gate
```typescript
test('OWC at max stagnation does not push RTP outside 88–96% bounds', async () => {
  // Run existing RTP harness with OWC enabled at worst-case stagnation
  // Assert RTP stays within configured bounds
  // This test requires monteCarlo.ts integration — implement after OWC is built
});
```
