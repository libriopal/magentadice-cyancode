import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { DropDownList, type DropDownListChangeEvent } from '@progress/kendo-react-dropdowns';
import { NumericTextBox } from '@progress/kendo-react-inputs';
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs';
import { Badge, BadgeContainer } from '@progress/kendo-react-indicators';
import type { SimConfig, GameMode, PlayerModel } from '../types/sandbox';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ParameterEditorPanelProps {
  config: SimConfig;
  undoDepth: number;
  redoDepth: number;
  isRunning: boolean;
  onConfigChange: (delta: Partial<SimConfig>) => void;
  onRunSim: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onCheckpoint: () => void;
}

// ─── Static option lists ──────────────────────────────────────────────────────

const GAME_MODES: GameMode[] = [
  'SOLO_FREE', 'SOLO_CASINO', 'VS_FREE', 'VS_CASINO', 'RALLY_FREE', 'RALLY_CASINO',
];

const PLAYER_MODELS: PlayerModel[] = ['OPTIMAL', 'AVERAGE', 'WEAK'];

// ─── Shared label style ───────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#888',
  marginBottom: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

// ─── Unsaved indicator ────────────────────────────────────────────────────────

function UnsavedDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      title="Unsaved — differs from last run"
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#f59e0b',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Field row wrapper ────────────────────────────────────────────────────────

function FieldRow({ label, unsaved, children }: {
  label: string;
  unsaved: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={labelStyle}>
        {label}
        <UnsavedDot show={unsaved} />
      </div>
      {children}
    </div>
  );
}

// ─── ParameterEditorPanel ─────────────────────────────────────────────────────

export function ParameterEditorPanel({
  config,
  undoDepth,
  redoDepth,
  isRunning,
  onConfigChange,
  onRunSim,
  onUndo,
  onRedo,
  onReset,
  onCheckpoint,
}: ParameterEditorPanelProps) {

  // Track config at last run to derive "unsaved" state
  const [lastRunConfig, setLastRunConfig] = useState<SimConfig>(config);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Local numeric state — prevents onConfigChange on every keystroke
  const [localTargetRTP, setLocalTargetRTP] = useState(config.targetRTP);
  const [localBombSpawnRate, setLocalBombSpawnRate] = useState(config.bombSpawnRate);
  const [localOrbProb, setLocalOrbProb] = useState(config.orbSpawnProbability);
  const [localSessions, setLocalSessions] = useState(config.sessions);

  // Sync local state when config changes externally (undo/redo/server update)
  useEffect(() => {
    setLocalTargetRTP(config.targetRTP);
    setLocalBombSpawnRate(config.bombSpawnRate);
    setLocalOrbProb(config.orbSpawnProbability);
    setLocalSessions(config.sessions);
  }, [config.targetRTP, config.bombSpawnRate, config.orbSpawnProbability, config.sessions]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const isUnsaved = useCallback(
    (key: keyof SimConfig) => config[key] !== lastRunConfig[key],
    [config, lastRunConfig],
  );

  const handleRunSim = useCallback(() => {
    setLastRunConfig({ ...config });
    onRunSim();
  }, [config, onRunSim]);

  const handleConfirmReset = useCallback(() => {
    setShowResetDialog(false);
    onReset();
  }, [onReset]);

  // ── Seed randomise: Math.random() is permitted here per directive §CONSTRAINTS 1
  const handleRandomiseSeed = useCallback(() => {
    // eslint-disable-next-line no-restricted-globals
    const newSeed = Math.floor(Math.random() * 2 ** 31);
    onConfigChange({ seed: newSeed });
  }, [onConfigChange]);

  // ── DropDownList handlers ────────────────────────────────────────────────────

  const handleModeChange = useCallback((e: DropDownListChangeEvent) => {
    onConfigChange({ mode: e.value as GameMode });
  }, [onConfigChange]);

  const handleModelChange = useCallback((e: DropDownListChangeEvent) => {
    onConfigChange({ playerModel: e.value as PlayerModel });
  }, [onConfigChange]);

  // ── NumericTextBox blur handlers ─────────────────────────────────────────────

  const handleTargetRTPBlur = useCallback(() => {
    onConfigChange({ targetRTP: localTargetRTP });
  }, [localTargetRTP, onConfigChange]);

  const handleBombSpawnBlur = useCallback(() => {
    onConfigChange({ bombSpawnRate: localBombSpawnRate });
  }, [localBombSpawnRate, onConfigChange]);

  const handleOrbProbBlur = useCallback(() => {
    onConfigChange({ orbSpawnProbability: localOrbProb });
  }, [localOrbProb, onConfigChange]);

  const handleSessionsBlur = useCallback(() => {
    onConfigChange({ sessions: localSessions ?? config.sessions });
  }, [localSessions, config.sessions, onConfigChange]);

  // ── Common input style ───────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = { width: '100%' };

  return (
    <Card style={{
      height: '100%',
      background: '#1a1a2e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <CardHeader style={{ padding: '8px 12px', flexShrink: 0, borderBottom: '1px solid #2a2a4a' }}>
        <CardTitle style={{ fontFamily: 'monospace', fontSize: 12, color: '#c0c0e0', margin: 0 }}>
          PARAMETER EDITOR
        </CardTitle>
      </CardHeader>

      <CardBody style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>

        {/* Mode selector */}
        <FieldRow label="Mode" unsaved={isUnsaved('mode')}>
          <DropDownList
            data={GAME_MODES}
            value={config.mode}
            onChange={handleModeChange}
            style={inputStyle}
            disabled={isRunning}
          />
        </FieldRow>

        {/* Player model selector */}
        <FieldRow label="Model" unsaved={isUnsaved('playerModel')}>
          <DropDownList
            data={PLAYER_MODELS}
            value={config.playerModel}
            onChange={handleModelChange}
            style={inputStyle}
            disabled={isRunning}
          />
        </FieldRow>

        {/* Target RTP */}
        <FieldRow label="Target RTP" unsaved={isUnsaved('targetRTP')}>
          <NumericTextBox
            value={localTargetRTP}
            min={0.50}
            max={1.10}
            step={0.01}
            format="p2"
            onChange={e => setLocalTargetRTP(e.value ?? localTargetRTP)}
            onBlur={handleTargetRTPBlur}
            style={inputStyle}
            disabled={isRunning}
          />
        </FieldRow>

        {/* Bomb spawn rate */}
        <FieldRow label="Bomb Spawn Rate" unsaved={isUnsaved('bombSpawnRate')}>
          <NumericTextBox
            value={localBombSpawnRate}
            min={0}
            max={0.20}
            step={0.001}
            format="p3"
            onChange={e => setLocalBombSpawnRate(e.value ?? localBombSpawnRate)}
            onBlur={handleBombSpawnBlur}
            style={inputStyle}
            disabled={isRunning}
          />
        </FieldRow>

        {/* Orb probability */}
        <FieldRow label="Orb Probability" unsaved={isUnsaved('orbSpawnProbability')}>
          <NumericTextBox
            value={localOrbProb}
            min={0}
            max={0.50}
            step={0.01}
            format="p2"
            onChange={e => setLocalOrbProb(e.value ?? localOrbProb)}
            onBlur={handleOrbProbBlur}
            style={inputStyle}
            disabled={isRunning}
          />
        </FieldRow>

        {/* Sessions */}
        <FieldRow label="Sessions" unsaved={isUnsaved('sessions')}>
          <NumericTextBox
            value={localSessions}
            min={1000}
            max={500000}
            step={1000}
            format="n0"
            onChange={e => setLocalSessions(e.value ?? localSessions)}
            onBlur={handleSessionsBlur}
            style={inputStyle}
            disabled={isRunning}
          />
        </FieldRow>

        {/* Seed (read-only + randomise) */}
        <div style={{ marginBottom: 10 }}>
          <div style={labelStyle}>Seed</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <NumericTextBox
              value={config.seed}
              format="n0"
              disabled
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleRandomiseSeed}
              disabled={isRunning}
              style={{ flexShrink: 0, fontSize: 12 }}
            >
              🎲 RANDOMISE
            </Button>
          </div>
        </div>

        {/* Button row */}
        <div style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid #2a2a4a',
        }}>

          {/* RUN SIM */}
          <Button
            themeColor="primary"
            onClick={handleRunSim}
            disabled={isRunning}
            style={{ flex: '1 0 auto' }}
          >
            ▶ RUN SIM
          </Button>

          {/* UNDO with badge */}
          <BadgeContainer style={{ flex: '0 0 auto' }}>
            <Button onClick={onUndo} disabled={undoDepth === 0}>
              ↩ UNDO
            </Button>
            {undoDepth > 0 && (
              <Badge themeColor="warning" rounded="full" size="small">
                {undoDepth}
              </Badge>
            )}
          </BadgeContainer>

          {/* REDO with badge */}
          <BadgeContainer style={{ flex: '0 0 auto' }}>
            <Button onClick={onRedo} disabled={redoDepth === 0}>
              ↪ REDO
            </Button>
            {redoDepth > 0 && (
              <Badge themeColor="info" rounded="full" size="small">
                {redoDepth}
              </Badge>
            )}
          </BadgeContainer>

          {/* CHECKPOINT */}
          <Button
            fillMode="flat"
            onClick={onCheckpoint}
            disabled={isRunning}
            style={{ flex: '0 0 auto' }}
          >
            ⚑ CHECKPOINT
          </Button>

          {/* RESET */}
          <Button
            themeColor="error"
            fillMode="flat"
            onClick={() => setShowResetDialog(true)}
            disabled={isRunning}
            style={{ flex: '0 0 auto' }}
          >
            🔄 RESET
          </Button>

        </div>
      </CardBody>

      {/* Reset confirmation dialog */}
      {showResetDialog && (
        <Dialog
          title="Confirm Reset"
          onClose={() => setShowResetDialog(false)}
        >
          <p style={{ fontFamily: 'monospace', fontSize: 12, margin: '8px 0' }}>
            Reset all parameters and clear session history?
            <br />
            This cannot be undone.
          </p>
          <DialogActionsBar>
            <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button themeColor="error" onClick={handleConfirmReset}>Reset</Button>
          </DialogActionsBar>
        </Dialog>
      )}
    </Card>
  );
}
