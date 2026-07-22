// L5 ADORNMENT — themed 2D visual system (mobile-first, HD). A theme is a pure cosmetic SKIN: it swaps
// CSS custom properties + die styling, and NEVER touches scoring, RNG, or outcomes (invariant core). The
// four themes are the merged plan's Theme axis: Matter · Wave · Gem · Color. No 3D, no physics — pure CSS/SVG.
export type ThemeName = 'matter' | 'wave' | 'gem' | 'color';

export interface Theme {
  name: ThemeName;
  label: string;
  blurb: string;
  vars: Record<string, string>;
  /** die face gradient stops [top, bottom], pip colour, and per-theme token treatment. */
  die: {
    a: string; b: string; pip: string; stroke: string;
    shape: 'round' | 'gem' | 'orb';
    facet?: boolean;      // gem: draw crystalline facet lines
    chromatic?: boolean;  // color: hue-shift the token per face value
  };
}

export const THEMES: Record<ThemeName, Theme> = {
  matter: {
    name: 'matter', label: 'Matter', blurb: 'Solid physical tokens — warm graphite & amber.',
    vars: {
      '--bg': '#0c0a09', '--bg2': '#1a1410', '--panel': 'rgba(30,24,20,0.72)', '--line': '#3a2f26',
      '--ink': '#f4ede4', '--muted': '#b7a894', '--accent': '#ffb454', '--accent2': '#ff7a45',
      '--good': '#7ee081', '--bad': '#ff6b6b', '--warn': '#f5c451', '--glow': 'rgba(255,180,84,0.35)',
    },
    die: { a: '#fbeacb', b: '#cf9153', pip: '#2a1e12', stroke: '#a97b3f', shape: 'round' },
  },
  wave: {
    name: 'wave', label: 'Wave', blurb: 'Flowing aqua signal — teal & cyan.',
    vars: {
      '--bg': '#040d10', '--bg2': '#07222a', '--panel': 'rgba(8,32,38,0.72)', '--line': '#134450',
      '--ink': '#e6fbff', '--muted': '#8fc7d1', '--accent': '#39e6d6', '--accent2': '#22b8ff',
      '--good': '#5ff0c0', '--bad': '#ff6b8a', '--warn': '#ffd166', '--glow': 'rgba(57,230,214,0.35)',
    },
    die: { a: '#d6feff', b: '#2fbecf', pip: '#052028', stroke: '#1f8fa0', shape: 'orb' },
  },
  gem: {
    name: 'gem', label: 'Gem', blurb: 'Crystalline facets — violet & emerald.',
    vars: {
      '--bg': '#0a0713', '--bg2': '#170f2b', '--panel': 'rgba(24,16,44,0.72)', '--line': '#3a2b63',
      '--ink': '#f2ecff', '--muted': '#b4a3d9', '--accent': '#b98cff', '--accent2': '#57e0a8',
      '--good': '#6ef0b0', '--bad': '#ff6bb0', '--warn': '#ffcf6b', '--glow': 'rgba(185,140,255,0.4)',
    },
    die: { a: '#f3e6ff', b: '#9a5cff', pip: '#1c1030', stroke: '#6b3fd0', shape: 'gem', facet: true },
  },
  color: {
    name: 'color', label: 'Color', blurb: 'Full chromatic spectrum — vivid & bright.',
    vars: {
      '--bg': '#0b0b12', '--bg2': '#191423', '--panel': 'rgba(26,22,34,0.72)', '--line': '#3a3350',
      '--ink': '#f6f4ff', '--muted': '#b3aecb', '--accent': '#ff5db1', '--accent2': '#5dd6ff',
      '--good': '#7ef0a0', '--bad': '#ff6b6b', '--warn': '#ffd45d', '--glow': 'rgba(255,93,177,0.35)',
    },
    die: { a: '#ffffff', b: '#ff5db1', pip: '#12101a', stroke: '#c23f8f', shape: 'round', chromatic: true },
  },
};

const KEY = 'glassbox.forest.theme.v1';

export function getThemeName(): ThemeName {
  const raw = (globalThis as { localStorage?: Storage }).localStorage?.getItem(KEY);
  return raw && raw in THEMES ? (raw as ThemeName) : 'matter';
}

export function setThemeName(name: ThemeName): void {
  (globalThis as { localStorage?: Storage }).localStorage?.setItem(KEY, name);
  applyTheme(name);
}

/** Apply a theme's CSS variables to :root. Pure cosmetics — affects no game logic. */
export function applyTheme(name: ThemeName): void {
  const doc = (globalThis as { document?: Document }).document;
  if (!doc?.documentElement) return;
  const t = THEMES[name];
  for (const [k, v] of Object.entries(t.vars)) doc.documentElement.style.setProperty(k, v);
  doc.documentElement.setAttribute('data-theme', name);
}
