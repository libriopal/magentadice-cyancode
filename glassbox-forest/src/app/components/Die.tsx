import { useMemo } from 'react';
import { THEMES, getThemeName, type ThemeName } from '../../theme/themes';

// HD 2D die — pure SVG, no 3D/physics. Each theme renders a distinct TOKEN (Matter block · Wave orb ·
// Gem faceted crystal · Color chromatic), with a gloss highlight + shadow for depth. The die displays the
// value; it never computes it (L5 adornment). Themes are cosmetic — a swap changes zero outcomes.
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[32, 32], [68, 68]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[32, 32], [68, 32], [32, 68], [68, 68]],
  5: [[32, 32], [68, 32], [50, 50], [32, 68], [68, 68]],
  6: [[32, 28], [68, 28], [32, 50], [68, 50], [32, 72], [68, 72]],
};

function shapePath(shape: string): string {
  if (shape === 'gem') return 'M50 3 L93 28 L93 72 L50 97 L7 72 L7 28 Z';                 // hexagon
  if (shape === 'orb') return 'M50 6 A44 44 0 1 1 49.9 6 Z';                              // circle
  return 'M22 5 H78 A17 17 0 0 1 95 22 V78 A17 17 0 0 1 78 95 H22 A17 17 0 0 1 5 78 V22 A17 17 0 0 1 22 5 Z'; // squircle
}

export function Die({ value, size = 54, theme, kept = false }: { value: number; size?: number; theme?: ThemeName; kept?: boolean }) {
  const t = THEMES[theme ?? getThemeName()];
  const id = useMemo(() => `d${Math.random().toString(36).slice(2, 8)}`, []);
  const d = t.die;
  const path = shapePath(d.shape);
  const pips = value >= 1 && value <= 6 ? PIPS[value]! : [];
  // Color theme: hue-shift the token per face value so all six faces read as six colours.
  const topStop = d.chromatic ? `hsl(${(value - 1) * 58}, 100%, 88%)` : d.a;
  const botStop = d.chromatic ? `hsl(${(value - 1) * 58}, 85%, 55%)` : d.b;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="die-svg" role="img" aria-label={`die ${value}`}
      style={{ filter: kept ? 'drop-shadow(0 0 9px var(--glow))' : 'drop-shadow(0 3px 7px rgba(0,0,0,0.5))' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={topStop} />
          <stop offset="1" stopColor={botStop} />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="0.35" cy="0.25" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d={path} fill={`url(#${id})`} stroke={kept ? 'var(--accent)' : d.stroke} strokeWidth={kept ? 3 : 2} />
      {/* gloss highlight for HD depth */}
      <path d={path} fill={`url(#${id}g)`} />

      {/* gem facet lines */}
      {d.facet && (
        <g stroke={d.pip} strokeOpacity="0.18" strokeWidth="1.5" fill="none">
          <path d="M50 3 L50 97 M7 28 L93 72 M93 28 L7 72" />
        </g>
      )}
      {/* wave motif for the orb */}
      {d.shape === 'orb' && (
        <path d="M16 62 Q31 50 50 62 T84 62" fill="none" stroke={d.pip} strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
      )}

      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={value === 1 ? 9 : 7} fill={d.pip} />
      ))}
    </svg>
  );
}

/** A themed token row (a set of dice). */
export function DiceRow({ faces, kept }: { faces: number[]; kept?: Set<number> }) {
  return (
    <div className="dice">
      {faces.map((f, i) => <Die key={i} value={f} kept={kept?.has(i)} />)}
    </div>
  );
}
