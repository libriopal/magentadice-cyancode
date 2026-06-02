import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@progress/kendo-react-layout';
import { Badge } from '@progress/kendo-react-indicators';
import type { ConfigCommand, AIAgent, MonteCarloResultV2 } from '../types/sandbox';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CommandHistoryPanelProps {
  history: ConfigCommand[];
  undoDepth: number;
  activeAgent: AIAgent;
}

// ─── Time-ago helper ──────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  const diffS = Math.floor((Date.now() - ms) / 1000);
  if (diffS < 5)    return 'just now';
  if (diffS < 60)   return `${diffS}s ago`;
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
  return `${Math.floor(diffS / 3600)}hr ago`;
}

// ─── RTP computation ──────────────────────────────────────────────────────────

// Default band: SOLO_CASINO 82–102%
const DEFAULT_FLOOR   = 0.82;
const DEFAULT_CEILING = 1.02;

function computeRTPFromResult(r: MonteCarloResultV2): number {
  return r.baseChainRTP + r.multiplierContributionRTP + r.bombStandardRTP
       + r.bombRainbowRTP + r.orbContributionRTP + r.doublerContributionRTP
       + r.archivistContributionRTP;
}

function rtpColor(rtp: number): string {
  if (rtp >= DEFAULT_FLOOR && rtp <= DEFAULT_CEILING) return '#4ade80';
  return '#f87171';
}

// ─── Separator ────────────────────────────────────────────────────────────────

function NowSeparator() {
  return (
    <div style={{ position: 'relative', margin: '8px 0', textAlign: 'center' }}>
      <div style={{ height: 1, background: '#f59e0b', width: '100%' }} />
      <span style={{
        position: 'absolute',
        top: -18,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'monospace',
        fontSize: 9,
        fontVariant: 'small-caps',
        letterSpacing: '0.1em',
        color: '#f59e0b',
        whiteSpace: 'nowrap',
        background: '#1a1a2e',
        padding: '0 6px',
      }}>
        ← NOW
      </span>
    </div>
  );
}

// ─── Single history entry ─────────────────────────────────────────────────────

interface EntryProps {
  cmd: ConfigCommand;
  isActive: boolean;
  isMostRecent: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function HistoryEntry({ cmd, isActive, isMostRecent, isHovered, onMouseEnter, onMouseLeave }: EntryProps) {
  const borderColor  = isMostRecent ? '#00e5ff' : '#3b3b5c';
  const textColor    = isActive ? '#e5e7eb' : '#6b7280';
  const opacity      = isActive ? 1 : 0.4;
  const background   = isHovered && isActive ? '#1a1a2e' : 'transparent';

  const rtp = cmd.simulationResultAfter !== null
    ? computeRTPFromResult(cmd.simulationResultAfter)
    : null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        padding: '8px 12px',
        opacity,
        borderLeft: `3px solid ${borderColor}`,
        background,
        transition: 'background 0.1s',
      }}
    >
      {/* UNDONE badge — top-right */}
      {!isActive && (
        <div style={{ position: 'absolute', top: 6, right: 8 }}>
          <Badge themeColor="base" size="small" rounded="full">UNDONE</Badge>
        </div>
      )}

      {/* Line 1 — description */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: textColor,
        marginBottom: 2,
        paddingRight: !isActive ? 52 : 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {cmd.description}
      </div>

      {/* Line 2 — timestamp */}
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555' }}>
        {timeAgo(cmd.timestamp)}
      </div>

      {/* Line 3 — RTP after (when result present) */}
      {rtp !== null && (
        <div style={{
          fontFamily: 'monospace',
          fontSize: 10,
          color: rtpColor(rtp),
          marginTop: 2,
        }}>
          RTP after: {(rtp * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

// ─── CommandHistoryPanel ──────────────────────────────────────────────────────

export function CommandHistoryPanel({ history, undoDepth, activeAgent }: CommandHistoryPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const cardBorderLeft = activeAgent === 'claude' ? '2px solid #00e5ff' : undefined;

  // Build the rendered list with the separator injected at the boundary
  const items: React.ReactNode[] = [];

  history.forEach((cmd, index) => {
    const isActive    = index < undoDepth;
    const isMostRecent = index === 0;

    // Insert NOW separator between last active and first undone
    if (index === undoDepth && undoDepth > 0 && undoDepth < history.length) {
      items.push(<NowSeparator key="now-separator" />);
    }

    items.push(
      <HistoryEntry
        key={cmd.id}
        cmd={cmd}
        isActive={isActive}
        isMostRecent={isMostRecent}
        isHovered={hoveredId === cmd.id}
        onMouseEnter={() => setHoveredId(cmd.id)}
        onMouseLeave={() => setHoveredId(null)}
      />,
    );
  });

  return (
    <Card style={{
      height: '100%',
      background: '#1a1a2e',
      borderLeft: cardBorderLeft,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <CardHeader style={{
        padding: '8px 12px',
        flexShrink: 0,
        borderBottom: '1px solid #2a2a4a',
      }}>
        <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
          CHANGE HISTORY
        </CardTitle>
      </CardHeader>

      <CardBody style={{
        flex: 1,
        overflowY: 'auto',
        padding: 0,
      }}>
        {history.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 60,
            color: '#555',
            fontStyle: 'italic',
            fontSize: 12,
            fontFamily: 'monospace',
          }}>
            No changes yet.
          </div>
        ) : (
          <div>{items}</div>
        )}
      </CardBody>
    </Card>
  );
}
