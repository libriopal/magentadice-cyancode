import { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Badge } from '@progress/kendo-react-indicators';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import type {
  SimProgress, LogEntry, MonteCarloResultV2, AIAgent,
  GateResult, GateStatus, GameMode, SimConfig,
} from '../types/sandbox';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SimulationProgressPanelProps {
  isRunning: boolean;
  progress: SimProgress | null;
  log: LogEntry[];
  lastResult: MonteCarloResultV2 | null;
  activeAgent: AIAgent;
  onExport: () => void;
  gates: GateResult[];
  optimalRTP: number | null;
  weakRTP: number | null;
}

// ─── RTP band config ──────────────────────────────────────────────────────────

const TRACK_MIN = 0.50;
const TRACK_MAX = 1.05;
const TRACK_RANGE = TRACK_MAX - TRACK_MIN; // 0.55

type LegalBand = { floor: number; ceiling: number } | null;

const LEGAL_BANDS: Partial<Record<GameMode, LegalBand>> = {
  SOLO_CASINO:  { floor: 0.82, ceiling: 1.02 },
  VS_CASINO:    { floor: 0.84, ceiling: 1.00 },
  RALLY_CASINO: { floor: 0.85, ceiling: 1.00 },
};

function getLegalBand(mode: GameMode | null): LegalBand {
  if (!mode) return null;
  return LEGAL_BANDS[mode] ?? null;
}

// Sum all contribution fields as a proxy for total RTP (until Batch A is done)
function computeRTP(r: MonteCarloResultV2): number {
  return r.baseChainRTP + r.multiplierContributionRTP + r.orbContributionRTP
       + r.doublerContributionRTP + r.archivistContributionRTP
       + r.bombStandardRTP + r.bombRainbowRTP;
}

// Parse mode from config JSON string; returns null if config is a hash or invalid
function parseMode(config: string): GameMode | null {
  try {
    const parsed = JSON.parse(config) as Partial<SimConfig>;
    return parsed.mode ?? null;
  } catch {
    return null;
  }
}

function rtpToPct(rtp: number): number {
  return Math.max(0, Math.min(100, ((rtp - TRACK_MIN) / TRACK_RANGE) * 100));
}

function tickColor(rtp: number, band: LegalBand): string {
  if (!band) return '#60a5fa';
  if (rtp < band.floor)    return '#ef4444';
  if (rtp > band.ceiling)  return '#f59e0b';
  return '#22c55e';
}

// ─── Section 1: RTP Band Gauge ────────────────────────────────────────────────

interface RTPRowProps {
  label: string;
  rtp: number | null;
  prominent: boolean;
  band: LegalBand;
  isFreeMode: boolean;
}

function RTPBandRow({ label, rtp, prominent, band, isFreeMode }: RTPRowProps) {
  const displayRTP = rtp !== null ? (rtp * 100).toFixed(1) + '%' : '—';
  const dimStyle = !prominent ? { opacity: 0.4 } : {};

  return (
    <div style={{ marginBottom: 8, ...dimStyle }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 3,
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>{label}</span>
        <span style={{
          fontFamily: 'monospace',
          fontSize: prominent ? 13 : 11,
          fontWeight: prominent ? 'bold' : 'normal',
          color: rtp !== null ? tickColor(rtp, band) : '#555',
        }}>
          {displayRTP}
        </span>
      </div>

      {isFreeMode ? (
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', fontStyle: 'italic' }}>
          No requirement
        </span>
      ) : (
        <div style={{ position: 'relative', height: 8, borderRadius: 4, background: '#2a2a4a' }}>
          {/* Green zone (legal band) */}
          {band && (
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${rtpToPct(band.floor).toFixed(2)}%`,
              width: `${((band.ceiling - band.floor) / TRACK_RANGE * 100).toFixed(2)}%`,
              background: '#166534',
              borderRadius: 2,
            }} />
          )}
          {/* Tick mark */}
          {rtp !== null && (
            <div style={{
              position: 'absolute',
              top: -2,
              bottom: -2,
              width: 3,
              borderRadius: 1,
              left: `calc(${rtpToPct(rtp).toFixed(2)}% - 1.5px)`,
              background: tickColor(rtp, band),
            }} />
          )}
          {/* Floor / ceiling labels */}
          {band && (
            <>
              <span style={{
                position: 'absolute',
                left: `${rtpToPct(band.floor).toFixed(2)}%`,
                top: 10,
                fontFamily: 'monospace',
                fontSize: 9,
                color: '#555',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}>
                {(band.floor * 100).toFixed(0)}%
              </span>
              <span style={{
                position: 'absolute',
                left: `${rtpToPct(band.ceiling).toFixed(2)}%`,
                top: 10,
                fontFamily: 'monospace',
                fontSize: 9,
                color: '#555',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}>
                {(band.ceiling * 100).toFixed(0)}%
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RTPBandGauge({ lastResult, optimalRTP, weakRTP }: {
  lastResult: MonteCarloResultV2;
  optimalRTP: number | null;
  weakRTP: number | null;
}) {
  const mode = parseMode(lastResult.config);
  const band = getLegalBand(mode);
  const isFreeMode = mode !== null && !LEGAL_BANDS[mode];
  const currentRTP = computeRTP(lastResult);

  const rtpFor = (model: 'OPTIMAL' | 'AVERAGE' | 'WEAK'): number | null => {
    if (lastResult.playerModel === model) return currentRTP;
    if (model === 'OPTIMAL') return optimalRTP;
    if (model === 'WEAK') return weakRTP;
    return null;
  };

  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 6 }}>
        RTP BAND — {mode ?? 'UNKNOWN MODE'}
      </div>
      <div style={{ paddingBottom: 18 }}> {/* space for floor/ceiling labels */}
        <RTPBandRow label="OPTIMAL" rtp={rtpFor('OPTIMAL')} prominent={lastResult.playerModel === 'OPTIMAL'} band={band} isFreeMode={isFreeMode} />
        <RTPBandRow label="AVERAGE" rtp={rtpFor('AVERAGE')} prominent={lastResult.playerModel === 'AVERAGE'} band={band} isFreeMode={isFreeMode} />
        <RTPBandRow label="WEAK"    rtp={rtpFor('WEAK')}    prominent={lastResult.playerModel === 'WEAK'}    band={band} isFreeMode={isFreeMode} />
      </div>
    </div>
  );
}

// ─── Section 2: Skill Window Indicator ────────────────────────────────────────

function SkillWindowIndicator({ optimalRTP, weakRTP }: {
  optimalRTP: number | null;
  weakRTP: number | null;
}) {
  const SKILL_TARGET = 0.05;
  const BAR_MAX = 0.15;

  if (optimalRTP === null || weakRTP === null) {
    return (
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', fontStyle: 'italic' }}>
        Run OPTIMAL and WEAK models to compute skill gap
      </span>
    );
  }

  const gap = optimalRTP - weakRTP;
  const gapColor  = gap >= SKILL_TARGET ? '#22c55e' : gap >= 0.03 ? '#f59e0b' : '#ef4444';
  const gapLabel  = gap >= SKILL_TARGET
    ? '✅ Meets skill-predominance threshold'
    : gap >= 0.03
    ? '⚠️ Marginal — may not satisfy all jurisdictions'
    : '❌ Below threshold — reclassification risk';

  const barFillPct = Math.min(100, (gap / BAR_MAX) * 100);
  const targetPct  = (SKILL_TARGET / BAR_MAX) * 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#888' }}>Skill Gap</span>
        <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold', color: gapColor }}>
          {(gap * 100).toFixed(1)}%
        </span>
      </div>
      {/* Gap bar */}
      <div style={{ position: 'relative', height: 8, borderRadius: 4, background: '#2a2a4a', marginBottom: 4 }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: `${barFillPct.toFixed(2)}%`,
          background: gapColor,
          borderRadius: 4,
        }} />
        {/* 5% target line */}
        <div style={{
          position: 'absolute', top: -3, bottom: -3, width: 2,
          left: `${targetPct.toFixed(2)}%`,
          background: '#60a5fa',
          borderRadius: 1,
        }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#60a5fa' }}>▲ 5% target</span>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: gapColor, marginTop: 2 }}>
        {gapLabel}
      </div>
    </div>
  );
}

// ─── Section 3: Gate Summary Strip ────────────────────────────────────────────

const GATE_PILL_BG: Record<GateStatus, string> = {
  PASS:    '#166534',
  WARN:    '#92400e',
  FAIL:    '#991b1b',
  PENDING: '#374151',
  RUNNING: '#374151',
};

const GATE_PILL_TEXT: Record<GateStatus, string> = {
  PASS:    '#4ade80',
  WARN:    '#fbbf24',
  FAIL:    '#f87171',
  PENDING: '#9ca3af',
  RUNNING: '#9ca3af',
};

function GateSummaryStrip({ gates }: { gates: GateResult[] }) {
  // Render 6 placeholder pills if no gates yet
  const items: GateResult[] = gates.length > 0
    ? gates
    : (['Gate1','Gate2','Gate3','Gate4','Gate5','Gate6'] as const).map(id => ({
        id, label: id, status: 'PENDING' as GateStatus, metric: '—', threshold: '', delta: null,
      }));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map(gate => {
        const shortLabel = gate.id.replace('Gate', 'G');
        const isRunning = gate.status === 'RUNNING';
        return (
          <span
            key={gate.id}
            title={`${gate.label}: ${gate.metric} (${gate.status})`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 8px',
              borderRadius: 999,
              background: GATE_PILL_BG[gate.status],
              color: GATE_PILL_TEXT[gate.status],
              fontFamily: 'monospace',
              fontSize: 10,
              fontWeight: 'bold',
              animation: isRunning ? 'gate-pulse 1s ease-in-out infinite' : undefined,
            }}
          >
            {shortLabel}
          </span>
        );
      })}
    </div>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: '1 1 0',
      background: '#111128',
      border: '1px solid #2a2a4a',
      borderRadius: 4,
      padding: '4px 8px',
      minWidth: 80,
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#666', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', color: '#c0c0e0' }}>
        {value}
      </div>
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider() {
  return <div style={{ height: 1, background: '#2a2a4a', margin: '8px 0' }} />;
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: 'monospace', fontSize: 10, color: '#555',
      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
    }}>
      {text}
    </div>
  );
}

// ─── ProgressBar label ────────────────────────────────────────────────────────

function ProgressLabel({ value }: { value?: number | null }) {
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
      {value != null ? `${Math.round(value)}%` : '0%'}
    </span>
  );
}

// ─── Log helpers ──────────────────────────────────────────────────────────────

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const LOG_TEXT_COLOR: Record<LogEntry['level'], string> = {
  INFO: '#9ca3af', WARN: '#f59e0b', ERROR: '#ef4444',
};
const LOG_BADGE_COLOR: Record<LogEntry['level'], 'base' | 'warning' | 'error'> = {
  INFO: 'base', WARN: 'warning', ERROR: 'error',
};
const LOG_BADGE_LABEL: Record<LogEntry['level'], string> = {
  INFO: 'INFO', WARN: 'WARN', ERROR: 'ERR',
};

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '2px 0', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.4,
    }}>
      <span style={{ color: '#555', flexShrink: 0 }}>
        [{formatTimestamp(entry.timestamp)}]
      </span>
      <Badge
        themeColor={LOG_BADGE_COLOR[entry.level]}
        rounded="full"
        size="small"
        style={{ flexShrink: 0 }}
      >
        {LOG_BADGE_LABEL[entry.level]}
      </Badge>
      <span style={{ color: LOG_TEXT_COLOR[entry.level], wordBreak: 'break-word' }}>
        {entry.message}
      </span>
    </div>
  );
}

// ─── SimulationProgressPanel ──────────────────────────────────────────────────

export function SimulationProgressPanel({
  isRunning,
  progress,
  log,
  lastResult,
  activeAgent,
  onExport,
  gates,
  optimalRTP,
  weakRTP,
}: SimulationProgressPanelProps) {
  const logScrollRef = useRef<HTMLDivElement>(null);
  const cardBorderLeft = activeAgent === 'claude' ? '2px solid #00e5ff' : undefined;

  useEffect(() => {
    if (logScrollRef.current) logScrollRef.current.scrollTop = 0;
  }, [log.length]);

  const percentComplete = progress?.percentComplete ?? 0;
  const elapsedS = progress ? (progress.elapsedMs / 1000).toFixed(1) : '0.0';

  return (
    <>
      {/* Keyframe for RUNNING gate pulse */}
      <style>{`
        @keyframes gate-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <Card style={{
        height: '100%',
        background: '#1a1a2e',
        borderLeft: cardBorderLeft,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <CardHeader style={{
          padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid #2a2a4a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
            SIMULATION LOG
          </CardTitle>
          <Button
            fillMode="flat"
            size="small"
            onClick={onExport}
            disabled={lastResult === null}
            style={{ fontSize: 11, fontFamily: 'monospace' }}
          >
            ⬇ EXPORT JSON
          </Button>
        </CardHeader>

        <CardBody style={{
          flex: 1, overflow: 'auto', padding: '8px 12px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>

          {/* Progress section */}
          {isRunning && (
            <div style={{ flexShrink: 0 }}>
              <ProgressBar
                value={percentComplete}
                max={100}
                label={ProgressLabel}
                labelVisible
                labelPlacement="center"
                animation={false}
              />
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' }}>
                {progress
                  ? `${progress.sessionsComplete.toLocaleString()} of ${progress.totalSessions.toLocaleString()} sessions (${elapsedS}s elapsed)`
                  : 'Starting…'}
              </div>
            </div>
          )}

          {/* Legal Compliance Status — when result present */}
          {lastResult !== null && !isRunning && (
            <div style={{ flexShrink: 0 }}>

              {/* Section 1: RTP Band Gauge */}
              <SectionLabel text="RTP Band Compliance" />
              <RTPBandGauge lastResult={lastResult} optimalRTP={optimalRTP} weakRTP={weakRTP} />

              <SectionDivider />

              {/* Section 2: Skill Window */}
              <SectionLabel text="Skill Influence" />
              <SkillWindowIndicator optimalRTP={optimalRTP} weakRTP={weakRTP} />

              <SectionDivider />

              {/* Section 3: Gate Summary Strip */}
              <SectionLabel text="Gate Status" />
              <GateSummaryStrip gates={gates} />

              <SectionDivider />

              {/* Section 4: Stat Chips — 6 chips */}
              <SectionLabel text="Session Metrics" />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <StatChip label="Avg Score"   value={lastResult.averageScore.toLocaleString()} />
                <StatChip label="Farkle Rate" value={(lastResult.farkleRate * 100).toFixed(1) + '%'} />
                <StatChip label="P5 Score"    value={lastResult.p5Score.toLocaleString()} />
                <StatChip label="P95 Score"   value={lastResult.p95Score.toLocaleString()} />
                <StatChip label="Std Dev"     value={lastResult.stdDev.toLocaleString()} />
                <StatChip label="Normalizer"  value={lastResult.normalizer.toFixed(4)} />
              </div>

            </div>
          )}

          {/* Log area */}
          <div
            ref={logScrollRef}
            style={{ flex: 1, overflowY: 'auto', maxHeight: 180, padding: '4px 0' }}
          >
            {log.length === 0 ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', minHeight: 60, color: '#555',
                fontStyle: 'italic', fontSize: 12, fontFamily: 'monospace',
              }}>
                No log entries yet.
              </div>
            ) : (
              log.map((entry, i) => <LogRow key={`${entry.timestamp}-${i}`} entry={entry} />)
            )}
          </div>

        </CardBody>
      </Card>
    </>
  );
}
