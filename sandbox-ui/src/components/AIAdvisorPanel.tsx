import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardBody, ExpansionPanel, ExpansionPanelContent } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Loader } from '@progress/kendo-react-indicators';
import { Notification, NotificationGroup } from '@progress/kendo-react-notification';
import type { Recommendation, Severity, AIAgent } from '../types/sandbox';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AIAdvisorPanelProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  activeAgent: AIAgent;
  onApply: (rec: Recommendation) => void;
  onDismiss: (id: string) => void;
  onExplainMore: (id: string) => void;
  advisorUpdates?: Record<string, string>;
}

// ─── Severity config ──────────────────────────────────────────────────────────

const SEV_ICON: Record<Severity, string>  = { FAIL: '🔴', WARN: '⚠️', INFO: 'ℹ️' };
const SEV_COLOR: Record<Severity, string> = { FAIL: '#f87171', WARN: '#fbbf24', INFO: '#67e8f9' };

// ─── Time-ago helper ──────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  const diffS = Math.floor((Date.now() - ms) / 1000);
  if (diffS < 60)  return 'just now';
  if (diffS < 3600) return `${Math.floor(diffS / 60)} min ago`;
  return `${Math.floor(diffS / 3600)} hr ago`;
}

// ─── Param formatter ──────────────────────────────────────────────────────────

function formatParam(key: string, val: number): string {
  const isPct = /rtp|rate|prob/i.test(key);
  return isPct ? (val * 100).toFixed(2) + '%' : String(val);
}

// ─── Suggested param chip ─────────────────────────────────────────────────────

function SuggestedParamChip({ param }: { param: NonNullable<Recommendation['suggestedParam']> }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'monospace',
      fontSize: 10,
      background: '#1a1a2e',
      border: '1px solid #2a2a4a',
      borderRadius: 999,
      padding: '2px 10px',
      color: '#9ca3af',
      whiteSpace: 'nowrap',
    }}>
      Suggest: <strong style={{ color: '#c0c0e0' }}>{param.key}</strong>
      {'  '}
      <span style={{ color: '#f87171' }}>{formatParam(param.key, param.from)}</span>
      {' → '}
      <span style={{ color: '#4ade80' }}>{formatParam(param.key, param.to)}</span>
    </span>
  );
}

// ─── Recommendation card ──────────────────────────────────────────────────────

interface RecCardProps {
  rec: Recommendation;
  expanded: boolean;
  expandedContent: string | undefined;
  onToggleExpand: (id: string) => void;
  onApply: (rec: Recommendation) => void;
  onDismiss: (id: string) => void;
  onExplainMore: (id: string) => void;
  onApplySuccess: (title: string) => void;
}

function RecCard({
  rec, expanded, expandedContent,
  onToggleExpand, onApply, onDismiss, onExplainMore, onApplySuccess,
}: RecCardProps) {
  const handleApply = useCallback(() => {
    onApply(rec);
    onApplySuccess(rec.title);
  }, [rec, onApply, onApplySuccess]);

  const handleExplain = useCallback(() => onExplainMore(rec.id), [rec.id, onExplainMore]);
  const handleDismiss = useCallback(() => onDismiss(rec.id), [rec.id, onDismiss]);
  const handleToggle = useCallback(() => onToggleExpand(rec.id), [rec.id, onToggleExpand]);

  const isApplied = rec.appliedAt !== undefined;
  const canApply  = !!rec.suggestedParam && !isApplied;

  return (
    <div style={{
      border: '1px solid #2a2a4a',
      borderRadius: 6,
      padding: '10px 12px',
      marginBottom: 8,
      background: '#12122a',
    }}>
      {/* Row 1 — severity + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{SEV_ICON[rec.severity]}</span>
        <span style={{
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 'bold',
          color: SEV_COLOR[rec.severity],
        }}>
          {rec.title}
        </span>
      </div>

      {/* Row 2 — truncated body */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#9ca3af',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        marginBottom: 6,
        lineHeight: 1.5,
      }}>
        {rec.body}
      </div>

      {/* Expansion panel for full analysis */}
      <ExpansionPanel
        title="▶ Show full analysis"
        expanded={expanded}
        onAction={handleToggle}
        style={{ background: 'transparent', border: 'none', marginBottom: 6 }}
      >
        <ExpansionPanelContent>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: '#9ca3af',
            lineHeight: 1.5,
            padding: '6px 0',
            whiteSpace: 'pre-wrap',
          }}>
            {expandedContent ?? rec.body}
          </div>
        </ExpansionPanelContent>
      </ExpansionPanel>

      {/* Row 3 — suggested param chip */}
      {rec.suggestedParam && (
        <div style={{ marginBottom: 8 }}>
          <SuggestedParamChip param={rec.suggestedParam} />
        </div>
      )}

      {/* Row 4 — action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {isApplied ? (
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#555' }}>
            ✓ Applied {timeAgo(rec.appliedAt!)}
          </span>
        ) : (
          <Button
            themeColor="primary"
            size="small"
            disabled={!canApply}
            onClick={handleApply}
          >
            APPLY SUGGESTION
          </Button>
        )}
        <Button
          fillMode="flat"
          themeColor="base"
          size="small"
          onClick={handleExplain}
        >
          EXPLAIN MORE
        </Button>
        <Button
          fillMode="flat"
          themeColor="error"
          size="small"
          onClick={handleDismiss}
        >
          IGNORE
        </Button>
      </div>
    </div>
  );
}

// ─── Toast item ───────────────────────────────────────────────────────────────

interface Toast { id: string; title: string }

const TOAST_DURATION_MS = 3000;

// ─── AIAdvisorPanel ───────────────────────────────────────────────────────────

export function AIAdvisorPanel({
  recommendations,
  isLoading,
  activeAgent,
  onApply,
  onDismiss,
  onExplainMore,
  advisorUpdates = {},
}: AIAdvisorPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

  const cardBorderLeft = activeAgent === 'claude' ? '2px solid #00e5ff' : undefined;
  const agentSubtitle  = activeAgent === 'kendo'
    ? 'Kendo AI 🔒 — auto mode'
    : 'Claude 🔒 — complex analysis';

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleApplySuccess = useCallback((title: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, title }]);
  }, []);

  return (
    <>
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
            AI ADVISOR
          </CardTitle>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', marginTop: 2 }}>
            {agentSubtitle}
          </div>
        </CardHeader>

        <CardBody style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>

          {/* State 1 — empty */}
          {!isLoading && recommendations.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 80,
              gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#555', fontStyle: 'italic' }}>
                No issues detected — all gates passing.
              </span>
            </div>
          )}

          {/* State 2 — loading */}
          {isLoading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 80,
              gap: 10,
            }}>
              <Loader size="medium" themeColor="info" />
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#555', fontStyle: 'italic' }}>
                Analysing simulation results…
              </span>
            </div>
          )}

          {/* State 3 — recommendations */}
          {!isLoading && recommendations.length > 0 && (
            <div>
              {recommendations.map(rec => (
                <RecCard
                  key={rec.id}
                  rec={rec}
                  expanded={expandedIds.has(rec.id)}
                  expandedContent={advisorUpdates[rec.id]}
                  onToggleExpand={handleToggleExpand}
                  onApply={onApply}
                  onDismiss={onDismiss}
                  onExplainMore={onExplainMore}
                  onApplySuccess={handleApplySuccess}
                />
              ))}
            </div>
          )}

        </CardBody>
      </Card>

      {/* Toast group — bottom-right */}
      <NotificationGroup style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-end',
      }}>
        {toasts.map(toast => (
          <Notification
            key={toast.id}
            type={{ style: 'success', icon: true }}
            closable
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
              Applied: {toast.title}
            </span>
          </Notification>
        ))}
      </NotificationGroup>
    </>
  );
}
