import { Card, CardHeader, CardTitle, CardBody } from '@progress/kendo-react-layout';
import { Loader, Skeleton } from '@progress/kendo-react-indicators';
import { Tooltip } from '@progress/kendo-react-tooltip';
import type { GateResult, GateStatus, AIAgent } from '../types/sandbox';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GateStatusPanelProps {
  gates: GateResult[];
  rtpSummary: { optimal: number; average: number; weak: number; skillGap: number } | null;
  activeAgent: AIAgent;
}

// ─── Status colours ───────────────────────────────────────────────────────────

const STATUS_COLOR: Record<GateStatus, string> = {
  PASS:    '#4caf50',
  WARN:    '#ff9800',
  FAIL:    '#f44336',
  RUNNING: '#90caf9',
  PENDING: '#666',
};

// ─── Status icon ─────────────────────────────────────────────────────────────

function GateIcon({ status }: { status: GateStatus }) {
  if (status === 'RUNNING') {
    return <Loader size="small" themeColor="info" style={{ display: 'inline-flex' }} />;
  }
  const icons: Record<GateStatus, string> = {
    PASS:    '✔',
    WARN:    '⚠',
    FAIL:    '✖',
    RUNNING: '',   // handled above
    PENDING: '—',
  };
  return (
    <span style={{ color: STATUS_COLOR[status], fontWeight: 'bold', fontSize: 13, lineHeight: 1 }}>
      {icons[status]}
    </span>
  );
}

// ─── Single gate row ─────────────────────────────────────────────────────────

function GateRow({ gate }: { gate: GateResult }) {
  return (
    <div
      title={gate.threshold}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 0',
        borderBottom: '1px solid #1e1e3a',
      }}
    >
      {/* Status icon */}
      <div style={{ width: 18, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <GateIcon status={gate.status} />
      </div>

      {/* Label */}
      <span style={{
        flex: 1,
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#b0b0cc',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {gate.label}
      </span>

      {/* Metric */}
      <span style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: STATUS_COLOR[gate.status],
        flexShrink: 0,
        textAlign: 'right',
      }}>
        {gate.metric}
      </span>
    </div>
  );
}

// ─── Skeleton gate row ────────────────────────────────────────────────────────

function SkeletonGateRow() {
  return (
    <div style={{ padding: '5px 0', borderBottom: '1px solid #1e1e3a' }}>
      <Skeleton shape="text" style={{ width: '100%', height: 20 }} />
    </div>
  );
}

// ─── RTP summary section ──────────────────────────────────────────────────────

interface RTPSummaryProps {
  rtpSummary: { optimal: number; average: number; weak: number; skillGap: number } | null;
}

function RTPSummary({ rtpSummary }: RTPSummaryProps) {
  const skeletonLine = (
    <Skeleton shape="text" style={{ width: '70%', height: 16, marginBottom: 4 }} />
  );

  if (!rtpSummary) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {skeletonLine}{skeletonLine}{skeletonLine}{skeletonLine}
      </div>
    );
  }

  const { optimal, average, weak, skillGap } = rtpSummary;

  const weakColor   = weak < 0.82 ? '#f44336' : '#4caf50';
  const gapColor    = skillGap >= 0.05 ? '#4caf50' : skillGap >= 0.03 ? '#ff9800' : '#f44336';
  const gapBadge    = skillGap >= 0.05 ? ' ✅' : skillGap >= 0.03 ? ' ⚠️' : ' ❌';

  const row = (label: string, value: string, color: string, suffix = '') => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#777' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color }}>{value}{suffix}</span>
    </div>
  );

  return (
    <>
      {row('OPTIMAL:',   (optimal  * 100).toFixed(1) + '%', '#4caf50')}
      {row('AVERAGE:',   (average  * 100).toFixed(1) + '%', '#d0d0e8')}
      {row('WEAK:',      (weak     * 100).toFixed(1) + '%', weakColor)}
      {row('Skill Gap:', (skillGap * 100).toFixed(1) + '%', gapColor, gapBadge)}
    </>
  );
}

// ─── GateStatusPanel ─────────────────────────────────────────────────────────

export function GateStatusPanel({ gates, rtpSummary, activeAgent }: GateStatusPanelProps) {
  const cardBorderLeft = activeAgent === 'claude' ? '2px solid #00e5ff' : undefined;

  return (
    <Card
      style={{
        height: '100%',
        background: '#1a1a2e',
        borderLeft: cardBorderLeft,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardHeader style={{ padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid #2a2a4a' }}>
        <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
          GATE STATUS
        </CardTitle>
      </CardHeader>

      <CardBody style={{ padding: '0 12px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Gate list */}
        <Tooltip anchorElement="target" position="right">
          <div style={{ paddingTop: 4 }}>
            {gates.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonGateRow key={i} />)
              : gates.map(gate => <GateRow key={gate.id} gate={gate} />)
            }
          </div>
        </Tooltip>

        {/* Divider */}
        <div style={{ height: 1, background: '#2a2a4a', margin: '8px 0' }} />

        {/* RTP summary */}
        <RTPSummary rtpSummary={rtpSummary} />
      </CardBody>
    </Card>
  );
}
