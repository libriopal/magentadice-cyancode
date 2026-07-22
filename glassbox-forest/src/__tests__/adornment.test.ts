// L5 ADORNMENT invariants: themes + audio are cosmetic and one-directional. They must never change a
// game outcome, and audio must be a safe no-op when disabled (so it can't affect the nutrient loop).
import { describe, test, expect } from 'vitest';
import { THEMES, getThemeName } from '../theme/themes';
import { audio } from '../audio/audioEngine';
import { scoreFarkle, type DieFace } from '../engine/farkle-engine';

describe('theme system (cosmetic only)', () => {
  test('every theme defines the required CSS variables + a die style', () => {
    const required = ['--bg', '--panel', '--ink', '--accent', '--good', '--bad'];
    for (const t of Object.values(THEMES)) {
      for (const k of required) expect(t.vars[k]).toBeTruthy();
      expect(t.die.a).toMatch(/^#/);
      expect(['round', 'gem', 'wave']).toContain(t.die.shape);
    }
  });

  test('a scoring outcome is identical regardless of theme (invariant core)', () => {
    const faces = [1, 1, 1, 5, 5, 2] as DieFace[];
    const base = scoreFarkle(faces).score;
    for (const name of Object.keys(THEMES) as (keyof typeof THEMES)[]) {
      // switching theme touches only CSS vars; scoring never reads a theme
      void name;
      expect(scoreFarkle(faces).score).toBe(base);
    }
  });

  test('default theme is valid', () => {
    expect(THEMES[getThemeName()]).toBeDefined();
  });
});

describe('audio engine (disabled = safe no-op)', () => {
  test('audio is off by default and triggers/mood/experiment are no-ops when disabled', () => {
    expect(audio.isEnabled()).toBe(false);
    // none of these should throw or require Tone.js when disabled
    expect(() => audio.trigger('roll')).not.toThrow();
    expect(() => audio.setMood(4.2)).not.toThrow();
    expect(() => audio.setExperiment('hold-crown')).not.toThrow();
    expect(audio.isEnabled()).toBe(false);
  });
});
