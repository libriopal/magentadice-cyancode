// Forbidden-field strip (Constitution C7 / ANTI_CIRCULARITY).
// The canonical list lives in config/forbidden_evidence_fields.json so it stays
// human-owned and single-sourced. `stripForbidden` recursively removes those keys
// from any value before it leaves the system (admin export). It is deep + defensive:
// even if a forbidden field is ever introduced upstream by mistake, export cannot leak it.
import forbiddenConfig from '../../config/forbidden_evidence_fields.json';

export const FORBIDDEN_FIELDS: readonly string[] = forbiddenConfig.forbidden;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deeply remove every forbidden key from a value (arrays and nested objects included). */
export function stripForbidden<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripForbidden(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_FIELDS.includes(k)) continue; // drop forbidden key entirely
      out[k] = stripForbidden(v);
    }
    return out as T;
  }
  return value;
}

/** True if a forbidden field appears anywhere in the value (used by tests / guards). */
export function containsForbidden(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbidden);
  if (isPlainObject(value)) {
    return Object.entries(value).some(
      ([k, v]) => FORBIDDEN_FIELDS.includes(k) || containsForbidden(v)
    );
  }
  return false;
}
