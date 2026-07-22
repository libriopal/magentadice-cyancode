import { describe, test, expect } from 'vitest';
import { FAMILIES, INFO_SURFACES, SUBSTRATES, TRAITS, GRID_SIZE, FAMILY_TRAIT_ANCHORS } from '../geometry/d2geometry';

describe('D2 geometry (L3)', () => {
  test('the primary grid is 5 families x 5 information-surfaces = 25', () => {
    expect(FAMILIES.length).toBe(5);
    expect(INFO_SURFACES.length).toBe(5);
    expect(GRID_SIZE).toBe(25);
  });

  test('axes have no duplicate members', () => {
    for (const axis of [FAMILIES, INFO_SURFACES, SUBSTRATES, TRAITS]) {
      expect(new Set(axis).size).toBe(axis.length);
    }
  });

  test('every family has a dominant trait anchor pair drawn from the trait set', () => {
    for (const family of FAMILIES) {
      const [a, b] = FAMILY_TRAIT_ANCHORS[family];
      expect(TRAITS).toContain(a);
      expect(TRAITS).toContain(b);
      expect(a).not.toBe(b);
    }
  });
});
