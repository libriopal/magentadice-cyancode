// Experiment registry — loaded from config/experiments.registry.json (read-only at
// runtime; new rows are a non-gated P3 edit to the JSON). The app renders its library
// from this list; adding an experiment = adding a row + an implementation module.
import registry from '../../config/experiments.registry.json';
import type { ExperimentRecord } from '../evidence/schema';

export interface RegistryRow {
  id: string;
  name: string;
  hypothesis: string;
  status: string;
  phase: string;
}

export const EXPERIMENTS: readonly RegistryRow[] = registry.experiments as RegistryRow[];

export function getExperiment(id: string): RegistryRow | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}

/** Materialize registry rows into ExperimentRecord shape for the evidence store. */
export function toExperimentRecords(now: string = new Date().toISOString()): ExperimentRecord[] {
  return EXPERIMENTS.map((e) => ({
    id: e.id,
    name: e.name,
    hypothesis: e.hypothesis,
    status: e.status,
    created_at: now,
  }));
}
