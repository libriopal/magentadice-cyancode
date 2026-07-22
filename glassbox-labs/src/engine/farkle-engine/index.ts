// Ported farkle-engine surface used by GLASSBOX Labs experiments.
// Provenance + parity contract: see PORTED.md in this directory.
// Only the files the One-Roll experiment needs are ported (minimal footprint,
// Constitution C10). gridUtils / monteCarlo / rtpConfig are intentionally NOT
// ported yet — add them behavior-identical from FAR_NZY when an experiment needs them.
export * from './types';
export * from './chainIndex';
export * from './farkleScorer';
export * from './csprng';
