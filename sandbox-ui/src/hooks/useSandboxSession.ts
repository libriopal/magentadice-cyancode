import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AIAgent,
  ConfigCommand,
  GateId,
  GateResult,
  LogEntry,
  MonteCarloResultV2,
  Recommendation,
  SandboxSessionState,
  SimConfig,
  SimProgress,
  WSMessage,
} from '../types/sandbox';

// ─── Action types ─────────────────────────────────────────────────────────────

export type DispatchAction =
  | { type: 'RunSim' }
  | { type: 'Undo' }
  | { type: 'Redo' }
  | { type: 'Reset' }
  | { type: 'Checkpoint'; name?: string }
  | { type: 'ApplyRecommendation'; rec: Recommendation }
  | { type: 'ConfigChange'; delta: Partial<SimConfig> }
  | { type: 'AdvisorExplain'; id: string; action?: 'explain' | 'dismiss' }
  | { type: 'SetAgent'; payload: AIAgent }
  | { type: 'SendChat'; payload: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const WS_URL = 'ws://localhost:3001/sandbox-ws';
const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_ATTEMPTS = 3;

// ─── Gate metadata ────────────────────────────────────────────────────────────

const GATE_LABELS: Record<GateId, string> = {
  Gate1: 'Gate 1 — Convergence',
  Gate2: 'Gate 2 — RTP Band',
  Gate3: 'Gate 3 — Skill Influence',
  Gate4: 'Gate 4 — Bonus Limits',
  Gate5: 'Gate 5 — Reproducibility',
  Gate6: 'Gate 6 — Role Balance',
};

const GATE_THRESHOLDS: Record<GateId, string> = {
  Gate1: '±0.5% between 50k–100k sessions',
  Gate2: 'Mode-specific RTP band',
  Gate3: 'OPTIMAL − WEAK ≥ 5%',
  Gate4: 'No single bonus > 30% RTP',
  Gate5: 'Same seed → identical output',
  Gate6: 'No role > 25% team RTP',
};

// ─── Initial state ────────────────────────────────────────────────────────────

function makeInitialGates(): GateResult[] {
  return (['Gate1', 'Gate2', 'Gate3', 'Gate4', 'Gate5', 'Gate6'] as GateId[]).map(id => ({
    id,
    label: GATE_LABELS[id],
    status: 'PENDING' as const,
    metric: '—',
    threshold: GATE_THRESHOLDS[id],
    delta: null,
  }));
}

function makeInitialState(): SandboxSessionState {
  return {
    sessionId: `session-${Date.now()}`,
    currentConfig: {
      mode: 'SOLO_CASINO',
      sessions: 10_000,
      maxTurns: 30,
      playerModel: 'AVERAGE',
      blockerDensity: 'MEDIUM',
      playerCount: 1,
      rolesActive: false,
      seed: Date.now() & 0x7fffffff,
      targetRTP: 0.92,
      bombSpawnRate: 0.07,
      orbSpawnProbability: 0.03,
      doublerSpawnEvery: 3,
    },
    undoDepth: 0,
    redoDepth: 0,
    checkpoints: [],
    lastResult: null,
    gates: makeInitialGates(),
    recommendations: [],
    isRunning: false,
    progress: null,
    log: [],
    chatMessages: [],
    activeAgent: 'kendo',
    isChatLoading: false,
    undoStack: [],
    advisorUpdates: {},
  };
}

// ─── State helpers ────────────────────────────────────────────────────────────

function appendLog(
  s: SandboxSessionState,
  message: string,
  level: LogEntry['level'],
): SandboxSessionState {
  const entry: LogEntry = { timestamp: Date.now(), message, level };
  return { ...s, log: [entry, ...s.log].slice(0, 500) };
}

function mergeWSMessage(
  state: SandboxSessionState,
  msg: WSMessage,
): SandboxSessionState {
  switch (msg.type) {
    case 'SIM_START':
      return appendLog(
        { ...state, isRunning: true, progress: null },
        'Simulation started.',
        'INFO',
      );

    case 'SIM_PROGRESS':
      return { ...state, progress: msg.payload as SimProgress };

    case 'SIM_COMPLETE': {
      const result = msg.payload as MonteCarloResultV2;
      return appendLog(
        { ...state, isRunning: false, progress: null, lastResult: result },
        `Simulation complete — ${result.sessionsRun.toLocaleString()} sessions, avg score ${result.averageScore.toLocaleString()}.`,
        'INFO',
      );
    }

    case 'SIM_ERROR': {
      const err = (msg.payload as { message?: string } | null)?.message ?? 'Unknown error';
      return appendLog(
        { ...state, isRunning: false, progress: null },
        `Simulation error: ${err}`,
        'ERROR',
      );
    }

    case 'UNDO_APPLIED': {
      const p = msg.payload as { undoDepth: number; redoDepth: number; config: SimConfig; history?: ConfigCommand[] };
      return appendLog(
        {
          ...state,
          undoDepth: p.undoDepth,
          redoDepth: p.redoDepth,
          currentConfig: p.config,
          // TODO: server must send history array on UNDO_APPLIED for undoStack to populate
          ...(p.history ? { undoStack: p.history } : {}),
        },
        'Undo applied.',
        'INFO',
      );
    }

    case 'REDO_APPLIED': {
      const p = msg.payload as { undoDepth: number; redoDepth: number; config: SimConfig; history?: ConfigCommand[] };
      return appendLog(
        {
          ...state,
          undoDepth: p.undoDepth,
          redoDepth: p.redoDepth,
          currentConfig: p.config,
          ...(p.history ? { undoStack: p.history } : {}),
        },
        'Redo applied.',
        'INFO',
      );
    }

    case 'CONFIG_CHANGED': {
      const delta = msg.payload as Partial<SimConfig> & { history?: ConfigCommand[] };
      return appendLog(
        {
          ...state,
          currentConfig: { ...state.currentConfig, ...delta },
          ...(delta.history ? { undoStack: delta.history } : {}),
        },
        `Config updated: ${Object.keys(delta).filter(k => k !== 'history').join(', ')}.`,
        'INFO',
      );
    }

    case 'CHECKPOINT_SAVED': {
      const cp = msg.payload as { name: string; timestamp: number };
      return appendLog(
        { ...state, checkpoints: [...state.checkpoints, cp] },
        `Checkpoint saved: "${cp.name}".`,
        'INFO',
      );
    }

    case 'SESSION_RESET':
      return appendLog(makeInitialState(), 'Session reset.', 'WARN');

    case 'ADVISOR_UPDATE': {
      const p = msg.payload;
      if (Array.isArray(p)) {
        const recs = p as Recommendation[];
        return appendLog(
          { ...state, recommendations: recs },
          `Advisor: ${recs.length} recommendation(s).`,
          'INFO',
        );
      }
      // Extended explanation update: { id: string; content: string }
      const update = p as { id?: string; content?: string };
      if (update.id && update.content) {
        return {
          ...state,
          advisorUpdates: { ...state.advisorUpdates, [update.id]: update.content },
        };
      }
      return state;
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSandboxSession(): {
  state: SandboxSessionState;
  dispatch: (action: DispatchAction) => void;
  isConnected: boolean;
} {
  const [state, setState] = useState<SandboxSessionState>(makeInitialState);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // stateRef lets dispatch closures read fresh state without re-creating the callback
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const send = useCallback((payload: object): void => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  // Defined inside useEffect so it can reference itself in setTimeout without
  // a stale closure — no useCallback wrapper needed.
  useEffect(() => {
    function connect(): void {
      // Clean up any previous socket before opening a new one
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        setState(s => appendLog(s, `Connected to ${WS_URL}.`, 'INFO'));
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as WSMessage;
          setState(s => mergeWSMessage(s, msg));
        } catch {
          setState(s => appendLog(s, 'Received malformed WS message.', 'WARN'));
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const attempt = reconnectAttemptsRef.current;
          setState(s =>
            appendLog(
              s,
              `Disconnected. Reconnecting (${attempt}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_DELAY_MS / 1000}s…`,
              'WARN',
            ),
          );
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        } else {
          setState(s =>
            appendLog(
              s,
              `Disconnected. Max reconnect attempts reached (${MAX_RECONNECT_ATTEMPTS}).`,
              'ERROR',
            ),
          );
        }
      };

      ws.onerror = () => {
        setState(s => appendLog(s, 'WebSocket error.', 'ERROR'));
      };
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  // Intentionally empty — connect runs once on mount; refs carry all mutable state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback((action: DispatchAction): void => {
    switch (action.type) {
      case 'RunSim':
        send({ type: 'RUN_SIM', config: stateRef.current.currentConfig });
        setState(s => appendLog(s, 'Run simulation requested.', 'INFO'));
        break;

      case 'Undo':
        send({ type: 'UNDO' });
        break;

      case 'Redo':
        send({ type: 'REDO' });
        break;

      case 'Reset':
        send({ type: 'RESET' });
        break;

      case 'Checkpoint':
        send({ type: 'CHECKPOINT', name: action.name ?? `checkpoint-${Date.now()}` });
        break;

      case 'ApplyRecommendation':
        send({ type: 'APPLY_RECOMMENDATION', rec: action.rec });
        setState(s => appendLog(s, `Applying recommendation: "${action.rec.title}".`, 'INFO'));
        break;

      case 'ConfigChange':
        // Optimistic local update; server confirms with CONFIG_CHANGED broadcast
        setState(s => ({ ...s, currentConfig: { ...s.currentConfig, ...action.delta } }));
        send({ type: 'CONFIG_CHANGE', delta: action.delta });
        break;

      case 'AdvisorExplain':
        send({ type: 'ADVISOR_EXPLAIN', id: action.id, action: action.action ?? 'explain' });
        break;

      case 'SetAgent':
        setState(s => ({ ...s, activeAgent: action.payload }));
        send({ type: 'SET_AGENT', payload: action.payload });
        break;

      case 'SendChat':
        send({ type: 'CHAT_MESSAGE', payload: { text: action.payload, agent: stateRef.current.activeAgent } });
        break;
    }
  }, [send]);

  return { state, dispatch, isConnected };
}
