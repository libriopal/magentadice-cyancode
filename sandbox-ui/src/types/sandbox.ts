// ─── Shared with server via MonteCarloResultV2 ───────────────────────────────

export type GameMode =
  | 'SOLO_FREE' | 'SOLO_CASINO'
  | 'VS_FREE'   | 'VS_CASINO'
  | 'RALLY_FREE'| 'RALLY_CASINO';

export type PlayerModel = 'OPTIMAL' | 'AVERAGE' | 'WEAK';
export type AIAgent = 'kendo' | 'claude';
export type GateId = 'Gate1' | 'Gate2' | 'Gate3' | 'Gate4' | 'Gate5' | 'Gate6';
export type GateStatus = 'PASS' | 'FAIL' | 'WARN' | 'PENDING' | 'RUNNING';
export type Severity = 'FAIL' | 'WARN' | 'INFO';

export interface MonteCarloResultV2 {
  averageScore: number;
  farkleRate: number;
  normalizer: number;
  sessionsRun: number;
  p95Score: number;
  p5Score: number;
  variance: number;
  stdDev: number;
  baseChainRTP: number;
  multiplierContributionRTP: number;
  orbContributionRTP: number;
  doublerContributionRTP: number;
  archivistContributionRTP: number;
  bombStandardRTP: number;
  bombRainbowRTP: number;
  milestonePayout: number;
  bombStandardRate: number;
  bombRainbowRate: number;
  orbActivationRate: number;
  doublerTriggerRate: number;
  deadBoardRecoveryRate: number;
  multiplierStepDistribution: Record<0|1|2|3|4|5, number>;
  roleContribution: Partial<Record<string, number>>;
  milestoneHitRate: Partial<Record<1|2|3|4, number>>;
  voteOutcomeDistribution: { continue: number; bank: number; pass: number };
  playerModel: PlayerModel;
  seed: number;
  config: string;
}

// ─── Gate result ─────────────────────────────────────────────────────────────

export interface GateResult {
  id: GateId;
  label: string;
  status: GateStatus;
  metric: string;
  threshold: string;
  delta: number | null;
}

// ─── RTP violation (for AI advisor) ─────────────────────────────────────────

export interface RTPViolation {
  gate: GateId;
  severity: Severity;
  mode: GameMode;
  playerModel?: PlayerModel;
  metric: string;
  delta: number;
}

export interface Recommendation {
  id: string;
  severity: Severity;
  title: string;
  body: string;
  suggestedParam?: { key: string; from: number; to: number };
  appliedAt?: number;
}

// ─── Undo/redo ───────────────────────────────────────────────────────────────

export interface ConfigCommand {
  id: string;
  timestamp: number;
  description: string;
  before: Partial<SimConfig>;
  after: Partial<SimConfig>;
  simulationResultBefore: MonteCarloResultV2 | null;
  simulationResultAfter: MonteCarloResultV2 | null;
}

export interface SimConfig {
  mode: GameMode;
  sessions: number;
  maxTurns: number;
  playerModel: PlayerModel;
  blockerDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  playerCount: 1 | 2 | 3 | 4;
  rolesActive: boolean;
  seed: number;
  targetRTP: number;
  bombSpawnRate: number;
  orbSpawnProbability: number;
  doublerSpawnEvery: number;
}

// ─── WebSocket message types ─────────────────────────────────────────────────

export type WSMessageType =
  | 'SIM_START'
  | 'SIM_PROGRESS'
  | 'SIM_COMPLETE'
  | 'SIM_ERROR'
  | 'CONFIG_CHANGED'
  | 'UNDO_APPLIED'
  | 'REDO_APPLIED'
  | 'CHECKPOINT_SAVED'
  | 'SESSION_RESET'
  | 'ADVISOR_UPDATE';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
}

export interface SimProgress {
  sessionsComplete: number;
  totalSessions: number;
  percentComplete: number;
  elapsedMs: number;
}

// ─── Sandbox session state (mirrored from server) ────────────────────────────

export interface SandboxSessionState {
  sessionId: string;
  currentConfig: SimConfig;
  undoDepth: number;
  redoDepth: number;
  checkpoints: { name: string; timestamp: number }[];
  lastResult: MonteCarloResultV2 | null;
  gates: GateResult[];
  recommendations: Recommendation[];
  isRunning: boolean;
  progress: SimProgress | null;
  log: LogEntry[];
  chatMessages: ChatMessage[];
  activeAgent: AIAgent;
  isChatLoading: boolean;
  undoStack: ConfigCommand[];
  advisorUpdates: Record<string, string>;
}

export interface LogEntry {
  timestamp: number;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR';
}

// ─── Coverage checklist ───────────────────────────────────────────────────────

export interface CoverageItem {
  category: string;
  label: string;
  checked: boolean;
  lineRef: string | null;
}

export interface CoverageReport {
  total: number;
  checked: number;
  unchecked: number;
  percentComplete: number;
  items: CoverageItem[];
}

// ─── AI chat ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  agent: AIAgent;
  text: string;
  timestamp: number;
}
