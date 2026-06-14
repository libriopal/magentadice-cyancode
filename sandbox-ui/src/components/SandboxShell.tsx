import { useState, useRef, useEffect, useCallback, type CSSProperties, type KeyboardEvent } from 'react';
import { Splitter, TabStrip, TabStripTab } from '@progress/kendo-react-layout';
import { Badge } from '@progress/kendo-react-indicators';
import { Button } from '@progress/kendo-react-buttons';
import { TextArea } from '@progress/kendo-react-inputs';

import { GateStatusPanel } from './GateStatusPanel';
import { RTPBreakdownPanel } from './RTPBreakdownPanel';
import { ParameterEditorPanel } from './ParameterEditorPanel';
import { SimulationProgressPanel } from './SimulationProgressPanel';
import { AIAdvisorPanel } from './AIAdvisorPanel';
import { CommandHistoryPanel } from './CommandHistoryPanel';
import { CoveragePanel } from './CoveragePanel';
import { CohereDashboardPanel } from './CohereDashboardPanel';

import type { SandboxSessionState, ChatMessage, AIAgent, MonteCarloResultV2 } from '../types/sandbox';
import type { DispatchAction } from '../hooks/useSandboxSession';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PaneConfig = {
  size?: string;
  min?: string;
  max?: string;
  resizable?: boolean;
  scrollable?: boolean;
};

function computeRTP(r: MonteCarloResultV2): number {
  return r.baseChainRTP + r.multiplierContributionRTP + r.bombStandardRTP
       + r.bombRainbowRTP + r.orbContributionRTP + r.doublerContributionRTP
       + r.archivistContributionRTP;
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

interface TopBarProps {
  isConnected: boolean;
  sessionId: string;
  seed: number;
  activeAgent: AIAgent;
  onAgentChange: (agent: AIAgent) => void;
}

function TopBar({ isConnected, sessionId, seed, activeAgent, onAgentChange }: TopBarProps) {
  const agentPillStyle = (agent: AIAgent): CSSProperties => ({
    padding: '3px 10px',
    borderRadius: 999,
    border: activeAgent === agent ? '2px solid #00e5ff' : '2px solid #444',
    background: activeAgent === agent ? '#0d2b33' : 'transparent',
    color: activeAgent === agent ? '#00e5ff' : '#aaa',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'monospace',
    marginLeft: 4,
    userSelect: 'none',
  });

  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      background: '#12122a',
      borderBottom: '1px solid #2a2a4a',
      flexShrink: 0,
      gap: 16,
      overflow: 'hidden',
    }}>
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 13, color: '#c0c0e0', whiteSpace: 'nowrap' }}>
        🎲 FARKLE FRENZY — RTP CALIBRATION SANDBOX
      </span>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <Badge themeColor={isConnected ? 'success' : 'error'} rounded="full" size="large">
          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>
          session: <span style={{ color: '#c0c0e0' }}>{sessionId.slice(-8)}</span>
        </span>
        <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>
          seed: <span style={{ color: '#c0c0e0' }}>{seed}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
          <button style={agentPillStyle('kendo')} onClick={() => onAgentChange('kendo')}>🔒 KENDO AI</button>
          <button style={agentPillStyle('claude')} onClick={() => onAgentChange('claude')}>🔒 CLAUDE</button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

interface AIChatPanelProps {
  activeAgent: AIAgent;
  onAgentChange: (agent: AIAgent) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isChatLoading: boolean;
}

function AIChatPanel({ activeAgent, onAgentChange, chatMessages, onSendMessage, isChatLoading }: AIChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isChatLoading) return;
    onSendMessage(trimmed);
    setInputText('');
  }, [inputText, isChatLoading, onSendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const agentPillStyle = (agent: AIAgent): CSSProperties => ({
    padding: '2px 8px', borderRadius: 999,
    border: activeAgent === agent ? '1px solid #00e5ff' : '1px solid #444',
    background: activeAgent === agent ? '#0d2b33' : 'transparent',
    color: activeAgent === agent ? '#00e5ff' : '#888',
    cursor: 'pointer', fontSize: 10, fontFamily: 'monospace', marginLeft: 4, userSelect: 'none',
  });

  const agentLabel = activeAgent === 'kendo' ? 'Kendo AI' : 'Claude';

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ height: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#0e0e20', borderTop: '1px solid #2a2a4a' }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid #1e1e3a', flexShrink: 0 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold', color: '#c0c0e0', flex: 1 }}>AI ASSISTANT</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button style={agentPillStyle('kendo')} onClick={() => onAgentChange('kendo')}>🔒 KENDO AI</button>
          <button style={agentPillStyle('claude')} onClick={() => onAgentChange('claude')}>🔒 CLAUDE</button>
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {chatMessages.length === 0 && (
          <span style={{ color: '#555', fontSize: 11, fontStyle: 'italic', alignSelf: 'center', marginTop: 8 }}>
            No messages yet. Ask {agentLabel} about your RTP configuration.
          </span>
        )}
        {chatMessages.map(msg => {
          const isUser = msg.role === 'user';
          const senderLabel = isUser ? 'You' : (msg.agent === 'kendo' ? 'Kendo AI' : 'Claude');
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: 9, color: '#666', marginBottom: 2, fontFamily: 'monospace' }}>
                {senderLabel} · {formatTime(msg.timestamp)}
              </span>
              <div style={{
                maxWidth: '80%', padding: '6px 10px', lineHeight: 1.4,
                borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: isUser ? '#00414f' : '#1a1a30',
                border: isUser ? '1px solid #00e5ff44' : '1px solid #2a2a4a',
                color: '#d0d0e8', fontSize: 12,
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {isChatLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ padding: '6px 10px', borderRadius: '12px 12px 12px 2px', background: '#1a1a30', border: '1px solid #2a2a4a', color: '#666', fontSize: 12, fontStyle: 'italic' }}>
              {agentLabel} is thinking…
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '6px 12px', borderTop: '1px solid #1e1e3a', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <TextArea
            value={inputText}
            onChange={e => setInputText(e.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={2000}
            placeholder={`Ask ${agentLabel}…`}
            style={{ width: '100%', resize: 'none', background: '#12122a', color: '#d0d0e8', border: '1px solid #2a2a4a', borderRadius: 4, fontSize: 12 }}
          />
        </div>
        <Button themeColor="primary" onClick={handleSend} disabled={!inputText.trim() || isChatLoading} style={{ flexShrink: 0, height: 32 }}>
          SEND
        </Button>
      </div>

      <div style={{ padding: '2px 12px 4px', fontSize: 10, color: '#555', fontFamily: 'monospace', flexShrink: 0 }}>
        {activeAgent === 'kendo' ? 'Kendo AI — auto-recommendations active' : 'Claude — complex analysis mode'}
      </div>
    </div>
  );
}

// ─── SandboxShell ─────────────────────────────────────────────────────────────

export interface SandboxShellProps {
  state: SandboxSessionState;
  dispatch: (action: DispatchAction) => void;
  isConnected: boolean;
}

export function SandboxShell({ state, dispatch, isConnected }: SandboxShellProps) {
  const [panes, setPanes] = useState<PaneConfig[]>([
    { size: '280px', min: '280px', max: '280px', resizable: false },
    {},
  ]);
  const [activeTab, setActiveTab] = useState(0);

  // ── Derived RTP values ──────────────────────────────────────────────────────
  const optimalRTP: number | null = (() => {
    if (!state.lastResult || state.lastResult.playerModel !== 'OPTIMAL') return null;
    return computeRTP(state.lastResult);
  })();

  const weakRTP: number | null = (() => {
    if (!state.lastResult || state.lastResult.playerModel !== 'WEAK') return null;
    return computeRTP(state.lastResult);
  })();

  const rtpSummary = state.lastResult ? {
    optimal: optimalRTP,
    average: state.lastResult.playerModel === 'AVERAGE' ? computeRTP(state.lastResult) : null,
    weak:    weakRTP,
    skillGap: optimalRTP !== null && weakRTP !== null ? optimalRTP - weakRTP : null,
  } : null;

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!state.lastResult) return;
    const blob = new Blob([JSON.stringify(state.lastResult, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `rtp_audit_${Date.now()}_${state.lastResult.seed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.lastResult]);

  // ── Agent handlers ──────────────────────────────────────────────────────────
  const handleAgentChange = useCallback((agent: AIAgent) => {
    dispatch({ type: 'SetAgent', payload: agent });
  }, [dispatch]);

  const handleSendMessage = useCallback((text: string) => {
    dispatch({ type: 'SendChat', payload: text });
  }, [dispatch]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0a0a1a', color: '#d0d0e8' }}>
      <TopBar
        isConnected={isConnected}
        sessionId={state.sessionId}
        seed={state.currentConfig.seed}
        activeAgent={state.activeAgent}
        onAgentChange={handleAgentChange}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Splitter
          panes={panes}
          onChange={e => setPanes(e.newState as PaneConfig[])}
          style={{ height: '100%' }}
        >
          {/* Left sidebar */}
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0c0c1e', overflow: 'hidden' }}>
            <div style={{ flex: '0 0 40%', overflow: 'hidden', padding: 8 }}>
              <GateStatusPanel
                gates={state.gates}
                rtpSummary={rtpSummary}
                activeAgent={state.activeAgent}
              />
            </div>
            <div style={{ flex: '1 1 0', overflow: 'auto', padding: 8 }}>
              <CommandHistoryPanel
                history={state.undoStack}
                undoDepth={state.undoDepth}
                activeAgent={state.activeAgent}
              />
            </div>
          </div>

          {/* Main content */}
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tab strip above 2×2 grid */}
            <TabStrip
              selected={activeTab}
              onSelect={e => setActiveTab(e.selected)}
              style={{ flexShrink: 0 }}
            >
              <TabStripTab title="DASHBOARD">
                <div style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '1fr 1fr',
                  gap: 8,
                  padding: 8,
                  height: 'calc(100vh - 48px - 220px - 80px)',
                  minHeight: 0,
                  boxSizing: 'border-box',
                }}>
                  <RTPBreakdownPanel
                    result={state.lastResult}
                    isRunning={state.isRunning}
                    activeAgent={state.activeAgent}
                  />
                  <ParameterEditorPanel
                    config={state.currentConfig}
                    undoDepth={state.undoDepth}
                    redoDepth={state.redoDepth}
                    isRunning={state.isRunning}
                    onConfigChange={delta => dispatch({ type: 'ConfigChange', delta })}
                    onRunSim={() => dispatch({ type: 'RunSim' })}
                    onUndo={() => dispatch({ type: 'Undo' })}
                    onRedo={() => dispatch({ type: 'Redo' })}
                    onReset={() => dispatch({ type: 'Reset' })}
                    onCheckpoint={() => dispatch({ type: 'Checkpoint' })}
                  />
                  <SimulationProgressPanel
                    isRunning={state.isRunning}
                    progress={state.progress}
                    log={state.log}
                    lastResult={state.lastResult}
                    gates={state.gates}
                    optimalRTP={optimalRTP}
                    weakRTP={weakRTP}
                    activeAgent={state.activeAgent}
                    onExport={handleExport}
                  />
                  <AIAdvisorPanel
                    recommendations={state.recommendations}
                    isLoading={state.isChatLoading}
                    activeAgent={state.activeAgent}
                    advisorUpdates={state.advisorUpdates}
                    onApply={rec => dispatch({ type: 'ApplyRecommendation', rec })}
                    onDismiss={id => dispatch({ type: 'AdvisorExplain', id, action: 'dismiss' })}
                    onExplainMore={id => dispatch({ type: 'AdvisorExplain', id, action: 'explain' })}
                  />
                </div>
              </TabStripTab>

              <TabStripTab title="COVERAGE">
                <div style={{ padding: 8, height: 'calc(100vh - 48px - 220px - 80px)', boxSizing: 'border-box' }}>
                  <CoveragePanel />
                </div>
              </TabStripTab>

              <TabStripTab title="GOVERNANCE">
                <div style={{ padding: 8, height: 'calc(100vh - 48px - 220px - 80px)', boxSizing: 'border-box' }}>
                  <CohereDashboardPanel />
                </div>
              </TabStripTab>
            </TabStrip>

            {/* AI Chat Panel — always visible below tabs */}
            <AIChatPanel
              activeAgent={state.activeAgent}
              onAgentChange={handleAgentChange}
              chatMessages={state.chatMessages}
              onSendMessage={handleSendMessage}
              isChatLoading={state.isChatLoading}
            />
          </div>
        </Splitter>
      </div>
    </div>
  );
}
