import {
  Chart,
  ChartSeries,
  ChartSeriesItem,
  ChartValueAxis,
  ChartValueAxisItem,
  ChartCategoryAxis,
  ChartCategoryAxisItem,
  ChartLegend,
} from '@progress/kendo-react-charts';
import { Grid, GridColumn, type GridCellProps } from '@progress/kendo-react-grid';
import { Card, CardHeader, CardTitle, CardBody } from '@progress/kendo-react-layout';
import { Loader } from '@progress/kendo-react-indicators';
import type { MonteCarloResultV2, AIAgent } from '../types/sandbox';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RTPBreakdownPanelProps {
  result: MonteCarloResultV2 | null;
  isRunning: boolean;
  activeAgent: AIAgent;
}

// ─── Mechanic config ──────────────────────────────────────────────────────────

interface MechanicConfig {
  label: string;
  field: keyof MonteCarloResultV2;
  rateField: keyof MonteCarloResultV2 | null;
  color: string;
}

const MECHANICS: MechanicConfig[] = [
  { label: 'Base Chain',   field: 'baseChainRTP',           rateField: null,                    color: '#3b82f6' },
  { label: 'Multiplier',   field: 'multiplierContributionRTP', rateField: null,                 color: '#06b6d4' },
  { label: 'Std Bomb',     field: 'bombStandardRTP',         rateField: 'bombStandardRate',     color: '#f97316' },
  { label: 'Rainbow Bomb', field: 'bombRainbowRTP',          rateField: 'bombRainbowRate',      color: '#a855f7' },
  { label: 'Orb',          field: 'orbContributionRTP',      rateField: 'orbActivationRate',    color: '#eab308' },
  { label: 'Doubler',      field: 'doublerContributionRTP',  rateField: 'doublerTriggerRate',   color: '#22c55e' },
  { label: 'Archivist',    field: 'archivistContributionRTP',rateField: null,                   color: '#ec4899' },
];

const LADDER_CATEGORIES = ['×1.0', '×1.25', '×1.5', '×2.0', '×3.0', '×4.0'];

// ─── Grid row type ────────────────────────────────────────────────────────────

interface MechanicRow {
  mechanic: string;
  color: string;
  rtp: number;
  ptsPerSession: number;
  triggerRate: number | null;
}

function buildGridData(result: MonteCarloResultV2): MechanicRow[] {
  return MECHANICS.map(m => ({
    mechanic: m.label,
    color: m.color,
    rtp: result[m.field] as number,
    ptsPerSession: Math.round(result.averageScore * (result[m.field] as number)),
    triggerRate: m.rateField !== null ? (result[m.rateField] as number) : null,
  }));
}

// ─── Custom Grid cells ────────────────────────────────────────────────────────

function MechanicCell(props: GridCellProps) {
  const row = props.dataItem as MechanicRow;
  return (
    <td style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 8px' }}>
      <span style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: row.color,
        marginRight: 6,
        verticalAlign: 'middle',
        flexShrink: 0,
      }} />
      {row.mechanic}
    </td>
  );
}

function RTPCell(props: GridCellProps) {
  const val = (props.dataItem as MechanicRow).rtp;
  return (
    <td style={{ fontFamily: 'monospace', fontSize: 11, textAlign: 'right', padding: '2px 8px' }}>
      {(val * 100).toFixed(1)}%
    </td>
  );
}

function PtsCell(props: GridCellProps) {
  const val = (props.dataItem as MechanicRow).ptsPerSession;
  return (
    <td style={{ fontFamily: 'monospace', fontSize: 11, textAlign: 'right', padding: '2px 8px' }}>
      {val.toLocaleString()}
    </td>
  );
}

function TriggerCell(props: GridCellProps) {
  const val = (props.dataItem as MechanicRow).triggerRate;
  return (
    <td style={{ fontFamily: 'monospace', fontSize: 11, textAlign: 'right', padding: '2px 8px', color: val === null ? '#555' : undefined }}>
      {val === null ? '—' : val.toFixed(2)}
    </td>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: '#2a2a4a', margin: '8px 0' }} />;
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: 10,
      color: '#555',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 4,
    }}>
      {text}
    </div>
  );
}

// ─── RTPBreakdownPanel ────────────────────────────────────────────────────────

export function RTPBreakdownPanel({ result, isRunning, activeAgent }: RTPBreakdownPanelProps) {
  const cardBorderLeft = activeAgent === 'claude' ? '2px solid #00e5ff' : undefined;

  // ── State 1: empty ─────────────────────────────────────────────────────────
  if (!result && !isRunning) {
    return (
      <Card style={{ height: '100%', background: '#1a1a2e', borderLeft: cardBorderLeft, display: 'flex', flexDirection: 'column' }}>
        <CardHeader style={{ padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid #2a2a4a' }}>
          <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
            RTP BY MECHANIC
          </CardTitle>
        </CardHeader>
        <CardBody style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#555', fontStyle: 'italic', fontSize: 12 }}>
            Run simulation to see breakdown
          </span>
        </CardBody>
      </Card>
    );
  }

  // ── State 2: running ───────────────────────────────────────────────────────
  if (isRunning) {
    return (
      <Card style={{ height: '100%', background: '#1a1a2e', borderLeft: cardBorderLeft, display: 'flex', flexDirection: 'column' }}>
        <CardHeader style={{ padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid #2a2a4a' }}>
          <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
            RTP BY MECHANIC
          </CardTitle>
        </CardHeader>
        <CardBody style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Loader size="large" themeColor="info" />
          <span style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>Simulating…</span>
        </CardBody>
      </Card>
    );
  }

  // ── State 3: result present ────────────────────────────────────────────────
  const gridData = buildGridData(result!);

  const ladderData = ([0, 1, 2, 3, 4, 5] as const).map(
    i => result!.multiplierStepDistribution[i] ?? 0,
  );

  return (
    <Card style={{
      height: '100%',
      background: '#1a1a2e',
      borderLeft: cardBorderLeft,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <CardHeader style={{ padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid #2a2a4a' }}>
        <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
          RTP BY MECHANIC
        </CardTitle>
      </CardHeader>

      <CardBody style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>

        {/* Section A — 100% stacked horizontal bar */}
        <SectionLabel text="RTP contribution by mechanic" />
        <Chart style={{ height: 80 }} transitions={false}>
          <ChartLegend visible={false} />
          <ChartCategoryAxis>
            <ChartCategoryAxisItem categories={['RTP']} />
          </ChartCategoryAxis>
          <ChartValueAxis>
            <ChartValueAxisItem max={1} labels={{ format: 'p0' }} />
          </ChartValueAxis>
          <ChartSeries>
            {MECHANICS.map(m => (
              <ChartSeriesItem
                key={m.label}
                type="bar"
                name={m.label}
                data={[result![m.field] as number]}
                color={m.color}
                stack={{ type: '100%' }}
              />
            ))}
          </ChartSeries>
        </Chart>

        <Divider />

        {/* Section B — Mechanic breakdown grid */}
        <Grid
          data={gridData}
          style={{
            fontSize: 11,
            background: 'transparent',
            border: '1px solid #2a2a4a',
          }}
          scrollable="none"
        >
          <GridColumn title="Mechanic"    width={120} cells={{ data: MechanicCell }} />
          <GridColumn title="RTP %"       width={70}  cells={{ data: RTPCell }} />
          <GridColumn title="Pts/Session" width={90}  cells={{ data: PtsCell }} />
          <GridColumn title="Trigger/Ses" width={90}  cells={{ data: TriggerCell }} />
        </Grid>

        <Divider />

        {/* Section C — Multiplier ladder distribution */}
        <SectionLabel text="MULTIPLIER LADDER DISTRIBUTION" />
        <Chart style={{ height: 120 }} transitions={false}>
          <ChartCategoryAxis>
            <ChartCategoryAxisItem categories={LADDER_CATEGORIES} />
          </ChartCategoryAxis>
          <ChartValueAxis>
            <ChartValueAxisItem
              labels={{ format: 'p0' }}
              title={{ text: '% of turns' }}
            />
          </ChartValueAxis>
          <ChartSeries>
            <ChartSeriesItem
              type="column"
              data={ladderData}
              color="#06b6d4"
            />
          </ChartSeries>
        </Chart>

      </CardBody>
    </Card>
  );
}
