import { describe, test, expect } from 'vitest';
import { generateCatalog, ANCHORS } from '../generator/branchGenerator';
import { FAMILIES, INFO_SURFACES, GRID_SIZE } from '../geometry/d2geometry';

describe('branch generator (L4)', () => {
  test('same seed → identical catalog (reproducible)', () => {
    const a = generateCatalog('seed-42');
    const b = generateCatalog('seed-42');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('different seed → different detail (substrate/traits vary) but same coordinates grid', () => {
    const a = generateCatalog('seed-42');
    const b = generateCatalog('seed-99');
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    // grid coordinates (family x info) are structural and identical across seeds
    const famInfo = (xs: typeof a) => xs.filter((s) => s.kind === 'generated').map((s) => `${s.coordinate.family}/${s.coordinate.infoSurface}`).sort();
    expect(famInfo(a)).toEqual(famInfo(b));
  });

  test('catalog = 25 generated + 3 anchors = 28, full grid coverage', () => {
    const cat = generateCatalog('seed-42');
    const generated = cat.filter((s) => s.kind === 'generated');
    const anchors = cat.filter((s) => s.kind === 'anchor');
    expect(generated.length).toBe(GRID_SIZE);
    expect(anchors.length).toBe(ANCHORS.length);
    expect(cat.length).toBe(GRID_SIZE + ANCHORS.length);
    // every family x info-surface cell is present exactly once
    for (const family of FAMILIES) {
      for (const info of INFO_SURFACES) {
        const hits = generated.filter((s) => s.coordinate.family === family && s.coordinate.infoSurface === info);
        expect(hits.length).toBe(1);
      }
    }
  });

  test('every spec is provenance=generated, carries its seed, has rule layers + a normalized trait vector', () => {
    for (const s of generateCatalog('seed-42')) {
      expect(s.provenance).toBe('generated'); // never "observed" from generation
      expect(s.seed.length).toBeGreaterThan(0);
      expect(s.ruleLayers.length).toBeGreaterThan(0);
      const sum = Object.values(s.traitVector).reduce((a, b) => a + (b ?? 0), 0);
      expect(sum).toBeGreaterThan(0.98);
      expect(sum).toBeLessThan(1.02);
      // forbidden fields must never appear as trait/rule names
      expect(Object.keys(s.traitVector)).not.toContain('skill_score');
      expect(Object.keys(s.traitVector)).not.toContain('was_optimal');
    }
  });

  test('spec ids are unique', () => {
    const ids = generateCatalog('seed-42').map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
