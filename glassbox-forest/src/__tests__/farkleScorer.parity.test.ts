// Parity suite — mirrors the 16 PRESERVATION_SPEC regression cases from FAR_NZY
// (farkleScorer.test.ts). If any of these drift, the port has diverged from the
// source engine and public verifiability is broken. These must stay green.
import { describe, test, expect } from 'vitest';
import { scoreFarkle } from '../engine/farkle-engine';
import type { DieFace } from '../engine/farkle-engine';

function score(faces: number[]): number {
  return scoreFarkle(faces as DieFace[]).score;
}

describe('farkle-engine parity (FAR_NZY 16-case regression)', () => {
  test('single 1 → 100', () => expect(score([1])).toBe(100));
  test('single 5 → 50', () => expect(score([5])).toBe(50));
  test('single 2 → Farkle (0)', () => expect(score([2])).toBe(0));
  test('single 6 → Farkle (0)', () => expect(score([6])).toBe(0));
  test('pair of 1s → 200', () => expect(score([1, 1])).toBe(200));
  test('pair of 5s → 100', () => expect(score([5, 5])).toBe(100));
  test('three 1s → 1000', () => expect(score([1, 1, 1])).toBe(1000));
  test('three 2s → 200', () => expect(score([2, 2, 2])).toBe(200));
  test('three 5s → 500', () => expect(score([5, 5, 5])).toBe(500));
  test('four 2s → 1000', () => expect(score([2, 2, 2, 2])).toBe(1000));
  test('five 1s → 2000', () => expect(score([1, 1, 1, 1, 1])).toBe(2000));
  test('six 1s → 3000', () => expect(score([1, 1, 1, 1, 1, 1])).toBe(3000));
  test('straight (1-6) → 1500', () => expect(score([1, 2, 3, 4, 5, 6])).toBe(1500));
  test('three pairs → 1500', () => expect(score([2, 2, 3, 3, 4, 4])).toBe(1500));
  test('W6: Two Triplets [1,1,1,2,2,2] → 2500 not 1200', () =>
    expect(score([1, 1, 1, 2, 2, 2])).toBe(2500));
  test('W6: Two Triplets [2,2,2,3,3,3] → 2500', () =>
    expect(score([2, 2, 2, 3, 3, 3])).toBe(2500));

  test('combo + bomb metadata present for six-of-a-kind', () => {
    const r = scoreFarkle([1, 1, 1, 1, 1, 1] as DieFace[]);
    expect(r.combo).toBe('Six of a Kind');
    expect(r.triggersBomb).toBe('BOMB_STANDARD');
  });
  test('straight triggers rainbow bomb', () => {
    const r = scoreFarkle([1, 2, 3, 4, 5, 6] as DieFace[]);
    expect(r.combo).toBe('Straight');
    expect(r.triggersBomb).toBe('BOMB_RAINBOW');
  });
});
