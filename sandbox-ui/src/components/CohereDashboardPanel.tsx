import { useState, useEffect, useCallback } from 'react';
import type { GovernanceHealth, BudgetCategory } from '../types/sandbox';

const SERVER_URL = import.meta.env.VITE_GOVERNANCE_API_URL ?? 'http://localhost:3001';
const POLL_INTERVAL = 10_000;

export interface CohereDashboardPanelProps {
  serverUrl?: string;
  pollInterval?: number;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 8, height: 8,
      borderRadius: '50%',
      background: ok ? '#00e5a0' : '#ff4466',
      marginRight: 6,
      boxShadow: ok ? '0 0 4px #00e5a0' : '0 0 4px #ff4466',
      flexShrink: 0,
    }} />
  );
}

function BudgetBar({ cat }: { cat: BudgetCategory }) {
  const pct = cat.limit > 0 ? Math.min(100, (cat.spent / cat.limit) * 100) : 0;
  const color = pct > 85 ? '#ff4466' : pct > 60 ? '#ffaa00' : '#00e5a0';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#aaa', textTransform: 'uppercase' }}>{cat.category}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>
          ${cat.spent.toFixed(4)} / ${cat.limit.toFixed(2)}
        </span>
      </div>
      <div style={{ height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 9, color: '#666', fontFamily: 'monospace', marginTop: 2 }}>
        ${cat.remaining.toFixed(4)} remaining
      </div>
    </div>
  );
}

export function CohereDashboardPanel({ serverUrl = SERVER_URL, pollInterval = POLL_INTERVAL }: CohereDashboardPanelProps = {}) {
  const [health, setHealth] = useState<GovernanceHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPollAt, setLastPollAt] = useState<Date | null>(null);

  const poll = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${serverUrl}/api/governance/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GovernanceHealth = await res.json();
      setHealth(data);
      setError(null);
    } catch (e) {
      clearTimeout(timeoutId);
      setError(e instanceof Error ? e.message : 'Fetch failed');
      setHealth(null);
    }
    setLastPollAt(new Date());
  }, [serverUrl]);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, pollInterval);
    return () => clearInterval(timer);
  }, [poll, pollInterval]);

  const statusColor = health?.status === 'ok' ? '#00e5a0' : health?.status === 'degraded' ? '#ffaa00' : '#ff4466';

  return (
    <div style={{
      height: '100%', background: '#0c0c1e', border: '1px solid #2a2a4a',
      borderRadius: 6, padding: 12, overflow: 'auto', fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 'bold', color: '#c0c0e0', letterSpacing: 1, textTransform: 'uppercase' }}>
          Cohere Governance
        </span>
        {lastPollAt && (
          <span style={{ fontSize: 9, color: '#555' }}>
            polled {lastPollAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && !health && (
        <div style={{ padding: '10px 12px', background: '#200a10', border: '1px solid #ff446633', borderRadius: 4, color: '#ff8899', fontSize: 11, marginBottom: 12 }}>
          <StatusDot ok={false} />
          Server offline — {error}
          <div style={{ fontSize: 9, color: '#666', marginTop: 6 }}>
            Start server: <code style={{ color: '#888' }}>node core/apps/server/dist/index.js</code>
          </div>
        </div>
      )}

      {health && (
        <>
          {/* Status row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, padding: '8px 10px', background: '#10101f', border: `1px solid ${statusColor}33`, borderRadius: 4, minWidth: 100 }}>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StatusDot ok={health.status === 'ok'} />
                <span style={{ fontSize: 12, color: statusColor, textTransform: 'uppercase', fontWeight: 'bold' }}>
                  {health.status}
                </span>
              </div>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', background: '#10101f', border: '1px solid #2a2a4a', borderRadius: 4, minWidth: 100 }}>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>COHERE API</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <StatusDot ok={health.cohereAvailable} />
                <span style={{ fontSize: 12, color: health.cohereAvailable ? '#00e5a0' : '#ff4466' }}>
                  {health.cohereAvailable ? 'LIVE' : 'UNAVAILABLE'}
                </span>
              </div>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', background: '#10101f', border: '1px solid #2a2a4a', borderRadius: 4, minWidth: 80 }}>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>AUDIT RECORDS</div>
              <span style={{ fontSize: 14, color: '#00c8ff', fontWeight: 'bold' }}>{health.auditRecordCount}</span>
            </div>
            <div style={{ flex: 1, padding: '8px 10px', background: '#10101f', border: '1px solid #2a2a4a', borderRadius: 4, minWidth: 80 }}>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>UPTIME</div>
              <span style={{ fontSize: 12, color: '#c0c0e0' }}>{formatUptime(health.uptimeMs)}</span>
            </div>
          </div>

          {/* Policy violations */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Policy Violations</div>
            <div style={{
              padding: '6px 10px', borderRadius: 4,
              background: health.policyViolations === 0 ? '#091a12' : '#200a10',
              border: `1px solid ${health.policyViolations === 0 ? '#00e5a033' : '#ff446633'}`,
              color: health.policyViolations === 0 ? '#00e5a0' : '#ff8899',
              fontSize: 12,
            }}>
              {health.policyViolations === 0 ? '✓ No violations' : `✗ ${health.policyViolations} violation(s) detected`}
            </div>
          </div>

          {/* Last anomaly */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Last Anomaly Escalation</div>
            <div style={{ fontSize: 11, color: health.lastAnomalyAt ? '#ffaa00' : '#555', padding: '6px 10px', background: '#10101f', borderRadius: 4, border: '1px solid #2a2a4a' }}>
              {health.lastAnomalyAt ? new Date(health.lastAnomalyAt).toLocaleString() : 'None recorded'}
            </div>
          </div>

          {/* Budget bars */}
          {health.budget.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Budget by Category</div>
              {health.budget.map(cat => <BudgetBar key={cat.category} cat={cat} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
