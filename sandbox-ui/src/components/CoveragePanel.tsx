import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import { Grid, GridColumn, type GridCellProps } from '@progress/kendo-react-grid';
import { process as kendoProcess } from '@progress/kendo-data-query';
import type { GroupDescriptor } from '@progress/kendo-data-query';
import type { CoverageItem, CoverageReport } from '../types/sandbox';

// ─── Constants ────────────────────────────────────────────────────────────────

const COVERAGE_URL = '/coverage-status';
const GROUP: GroupDescriptor[] = [{ field: 'category' }];

// ─── ProgressBar label ────────────────────────────────────────────────────────

function ProgressLabel({ value }: { value?: number | null }) {
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
      {value != null ? `${Math.round(value)}%` : '0%'}
    </span>
  );
}

// ─── Custom cells ─────────────────────────────────────────────────────────────

function StatusCell(props: GridCellProps) {
  const item = props.dataItem as CoverageItem;
  return (
    <td style={{ textAlign: 'center', padding: '3px 8px', width: 32 }}>
      {item.checked
        ? <span style={{ color: '#4ade80', fontSize: 13 }}>✔</span>
        : <span style={{ color: '#f87171', fontSize: 13 }}>✖</span>
      }
    </td>
  );
}

function LabelCell(props: GridCellProps) {
  const item = props.dataItem as CoverageItem;
  return (
    <td style={{
      fontFamily: 'monospace',
      fontSize: 11,
      color: item.checked ? '#c0c0e0' : '#9ca3af',
      padding: '3px 8px',
    }}>
      {item.label}
    </td>
  );
}

function LineRefCell(props: GridCellProps) {
  const item = props.dataItem as CoverageItem;
  return (
    <td style={{ fontFamily: 'monospace', fontSize: 10, padding: '3px 8px' }}>
      {item.lineRef
        ? <span style={{ color: '#60a5fa' }}>{item.lineRef}</span>
        : <span style={{ color: '#374151' }}>—</span>
      }
    </td>
  );
}

// ─── CoveragePanel ────────────────────────────────────────────────────────────

export function CoveragePanel() {
  const [report, setReport] = useState<CoverageReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(COVERAGE_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as CoverageReport;
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load coverage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReport(); }, [fetchReport]);

  // Prepare grouped data for the Grid
  const processedData = report
    ? kendoProcess(report.items, { group: GROUP })
    : { data: [], total: 0 };

  const checked        = report?.checked ?? 0;
  const total          = report?.total ?? 0;
  const unchecked      = report?.unchecked ?? 0;
  const percentComplete = report?.percentComplete ?? 0;

  return (
    <Card style={{
      height: '100%',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <CardHeader style={{
        padding: '8px 12px',
        flexShrink: 0,
        borderBottom: '1px solid #2a2a4a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
          RETURN PATH COVERAGE
        </CardTitle>
        <Button
          fillMode="flat"
          size="small"
          onClick={() => void fetchReport()}
          disabled={loading}
          style={{ fontFamily: 'monospace', fontSize: 11 }}
        >
          ↻ REFRESH
        </Button>
      </CardHeader>

      <CardBody style={{
        flex: 1,
        overflow: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>

        {/* Loading */}
        {loading && (
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', fontStyle: 'italic' }}>
            Loading coverage checklist…
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            fontFamily: 'monospace', fontSize: 11, color: '#f87171',
            background: '#1f0a0a', border: '1px solid #7f1d1d',
            borderRadius: 4, padding: '6px 10px',
          }}>
            Error: {error}
          </div>
        )}

        {report && (
          <>
            {/* Blocker banner */}
            {unchecked > 0 && (
              <div style={{
                background: '#450a0a',
                border: '1px solid #b91c1c',
                borderRadius: 4,
                padding: '6px 12px',
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: 'bold',
                color: '#fca5a5',
                flexShrink: 0,
              }}>
                🚫 BLOCKED: {unchecked} unchecked return path{unchecked !== 1 ? 's' : ''} — Batch A authorization withheld
              </div>
            )}

            {/* Progress bar */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 11, color: '#888', marginBottom: 4,
              }}>
                {checked} of {total} return paths verified
              </div>
              <ProgressBar
                value={percentComplete}
                max={100}
                label={ProgressLabel}
                labelVisible
                labelPlacement="center"
                animation={false}
              />
            </div>

            {/* Grid grouped by category */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Grid
                data={processedData.data}
                group={GROUP}
                style={{
                  fontSize: 11,
                  background: 'transparent',
                  border: '1px solid #2a2a4a',
                }}
                scrollable="none"
              >
                <GridColumn title="" width={36} cells={{ data: StatusCell }} />
                <GridColumn title="Return Path" cells={{ data: LabelCell }} />
                <GridColumn title="Line Ref" width={140} cells={{ data: LineRefCell }} />
              </Grid>
            </div>
          </>
        )}

      </CardBody>
    </Card>
  );
}
