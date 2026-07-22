import { useMemo } from 'react';
import { THEMES, getThemeName, type ThemeName } from '../../theme/themes';

// HD 2D die — pure SVG, no 3D/physics. Renders a face value 1–6 with a themed gradient body, soft shadow,
// glow, and the standard pip layout. The die is L5 adornment: it displays the value, never computes it.
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 27], [70, 27], [30, 50], [70, 50], [30, 73], [70, 73]],
};

export function Die({ value, size = 52, theme, kept = false }: { value: number; size?: number; theme?: ThemeName; kept?: boolean }) {
  const t = THEMES[theme ?? getThemeName()];
  const id = useMemo(() => `d${Math.random().toString(36).slice(2, 8)}`, []);
  const d = t.die;
  const path = d.shape === 'gem'
    ? 'M50 4 L92 30 L92 74 L50 96 L8 74 L8 30 Z'          // hexagon
    : d.shape === 'wave'
      ? 'M14 14 H86 A6 6 0 0 1 92 20 V80 A6 6 0 0 1 86 86 H14 A6 6 0 0 1 8 80 V20 A6 6 0 0 1 14 14 Z'
      : 'M20 6 H80 A14 14 0 0 1 94 20 V80 A14 14 0 0 1 80 94 H20 A14 14 0 0 1 6 80 V20 A14 14 0 0 1 20 6 Z';
  const pips = value >= 1 && value <= 6 ? PIPS[value]! : [];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="die-svg" role="img" aria-label={`die ${value}`}
      style={{ filter: kept ? `drop-shadow(0 0 8px var(--glow))` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.45))' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={d.a} />
          <stop offset="1" stopColor={d.b} />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#${id})`} stroke={kept ? 'var(--accent)' : d.stroke} strokeWidth={kept ? 3 : 2} />
      {d.shape === 'wave' && (
        <path d="M12 60 Q30 48 50 60 T88 60" fill="none" stroke={d.pip} strokeOpacity="0.25" strokeWidth="3" />
      )}
      {pips.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={value === 1 ? 9 : 7} fill={d.pip} />
      ))}
    </svg>
  );
}

/** A themed token strip (row of dice). */
export function DiceRow({ faces, kept }: { faces: number[]; kept?: Set<number> }) {
  return (
    <div className="dice">
      {faces.map((f, i) => <Die key={i} value={f} kept={kept?.has(i)} />)}
    </div>
  );
}
