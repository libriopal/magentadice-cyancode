// Budget guard — isolated per-category spend with warn/restrict/shutdown, no cross-category borrowing.
// Sandbox-local (in-memory). A category at/over its ceiling HARD-STOPS: the proposer degrades to the
// deterministic path rather than spending beyond budget (governance stays operational without Cohere).
import { BUDGET_CEILINGS_USD, THRESHOLDS, type SpendCategory } from './config';

export type BudgetStatus = 'ok' | 'warn' | 'restrict' | 'shutdown';

export class BudgetError extends Error {
  constructor(category: SpendCategory, reason: string) {
    super(`BudgetError[${category}]: ${reason}`);
  }
}

export class SpendTracker {
  private spent = new Map<SpendCategory, number>();

  spentIn(category: SpendCategory): number {
    return this.spent.get(category) ?? 0;
  }

  fraction(category: SpendCategory): number {
    return this.spentIn(category) / BUDGET_CEILINGS_USD[category];
  }

  status(category: SpendCategory): BudgetStatus {
    const f = this.fraction(category);
    if (f >= THRESHOLDS.shutdown) return 'shutdown';
    if (f >= THRESHOLDS.restrict) return 'restrict';
    if (f >= THRESHOLDS.warn) return 'warn';
    return 'ok';
  }

  /** True if an estimated spend of `estUsd` may proceed WITHOUT crossing this category's shutdown
   *  ceiling. Isolated: only this category's budget is consulted — never another's. */
  canSpend(category: SpendCategory, estUsd: number): boolean {
    return this.spentIn(category) + estUsd <= BUDGET_CEILINGS_USD[category];
  }

  /** Record a real spend against a category. Throws if it would cross the shutdown ceiling — callers
   *  should check canSpend first and degrade to the deterministic path instead of spending over. */
  record(category: SpendCategory, usd: number): void {
    if (usd < 0) throw new BudgetError(category, 'negative spend');
    if (!this.canSpend(category, usd)) {
      throw new BudgetError(category, `would exceed ceiling $${BUDGET_CEILINGS_USD[category]}`);
    }
    this.spent.set(category, this.spentIn(category) + usd);
  }

  summary(): Record<SpendCategory, { spent: number; ceiling: number; status: BudgetStatus }> {
    const out = {} as Record<SpendCategory, { spent: number; ceiling: number; status: BudgetStatus }>;
    for (const category of Object.keys(BUDGET_CEILINGS_USD) as SpendCategory[]) {
      out[category] = { spent: this.spentIn(category), ceiling: BUDGET_CEILINGS_USD[category], status: this.status(category) };
    }
    return out;
  }
}
