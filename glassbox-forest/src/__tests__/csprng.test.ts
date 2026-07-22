// Commit-reveal / CSPRNG parity + fairness properties.
import { describe, test, expect } from 'vitest';
import {
  CSPRNG,
  sha256,
  hashServerSeed,
  deriveCombinedSeed,
  verifyServerSeed,
  generateServerSeed,
} from '../engine/farkle-engine';

describe('csprng commit-reveal', () => {
  test('verifyServerSeed accepts a genuine reveal and rejects a tampered one', async () => {
    const seed = await generateServerSeed();
    const commitment = await hashServerSeed(seed);
    expect(await verifyServerSeed(seed, commitment)).toBe(true);
    expect(await verifyServerSeed(seed + '00', commitment)).toBe(false);
    expect(await verifyServerSeed(seed, commitment.slice(0, -2) + 'ff')).toBe(false);
  });

  test('hashServerSeed === sha256 (commitment definition)', async () => {
    const seed = 'deadbeef';
    expect(await hashServerSeed(seed)).toBe(await sha256(seed));
  });

  test('deriveCombinedSeed is deterministic and order-sensitive', async () => {
    const a = await deriveCombinedSeed('server', ['c1', 'c2']);
    const b = await deriveCombinedSeed('server', ['c1', 'c2']);
    const c = await deriveCombinedSeed('server', ['c2', 'c1']);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test('CSPRNG stream is deterministic for a fixed seed', async () => {
    const combined = await deriveCombinedSeed('s', ['client']);
    const r1 = new CSPRNG(combined);
    const r2 = new CSPRNG(combined);
    const a = [await r1.nextInt(1, 6), await r1.nextInt(1, 6), await r1.nextInt(1, 6)];
    const b = [await r2.nextInt(1, 6), await r2.nextInt(1, 6), await r2.nextInt(1, 6)];
    expect(a).toEqual(b);
    for (const v of a) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
});
