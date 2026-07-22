// G3 SEAM — persistence. Built UP TO the gate: a clean adapter interface with the current localStorage
// implementation, plus a real-DB implementation that REFUSES to connect until a human grants G3 (secrets +
// scoped credentials). The app runs entirely on LocalStoragePersistence today; a real DB is a G3 step.
// This module makes the boundary executable — swapping to the remote adapter cannot happen without a token.
import { requireGate } from '../governance/gates';

export interface PersistenceAdapter {
  readonly kind: string;
  load(key: string): string | null;
  save(key: string, value: string): void;
  remove(key: string): void;
}

/** Current, sandbox-safe persistence. No secrets, no network. */
export class LocalStoragePersistence implements PersistenceAdapter {
  readonly kind = 'localStorage';
  private ls(): Storage | undefined { return (globalThis as { localStorage?: Storage }).localStorage; }
  load(key: string): string | null { return this.ls()?.getItem(key) ?? null; }
  save(key: string, value: string): void { this.ls()?.setItem(key, value); }
  remove(key: string): void { this.ls()?.removeItem(key); }
}

/**
 * Real database adapter — INERT until G3. connect() calls requireGate('G3_SECRETS') and throws without a
 * token + credentials, so no code path can write to a real DB in the sandbox. When a human grants G3 and
 * provides DATABASE_URL, a concrete client wires in here (not before).
 */
export class RemoteDbPersistence implements PersistenceAdapter {
  readonly kind = 'remote-db';
  private connected = false;
  connect(): void {
    requireGate('G3_SECRETS'); // throws — HALT until human grants G3 + credentials
    this.connected = true; // unreachable today
  }
  private assert(): void { if (!this.connected) throw new Error('RemoteDbPersistence not connected (G3 not granted)'); }
  load(key: string): string | null { this.assert(); void key; return null; }
  save(key: string, value: string): void { this.assert(); void key; void value; }
  remove(key: string): void { this.assert(); void key; }
}

/** The app always selects local persistence. Selecting the remote adapter is a G3 human decision. */
export function selectPersistence(): PersistenceAdapter {
  return new LocalStoragePersistence();
}
