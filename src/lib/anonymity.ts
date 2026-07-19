// Anonymity threshold — the single source of truth. No other file in the
// codebase may hardcode this value; import N_MIN or call suppressIfSmall
// instead. Every count, percentage, or cohort read by the dashboard passes
// through this helper before it reaches a component.
export const N_MIN = 5;

export type Suppressed = { suppressed: true; reason: "cohort_too_small" };

export function suppressIfSmall<T>(n: number, value: T): T | Suppressed {
  if (n < N_MIN) return { suppressed: true, reason: "cohort_too_small" };
  return value;
}

export function isSuppressed<T>(v: T | Suppressed): v is Suppressed {
  return typeof v === "object" && v !== null && (v as Suppressed).suppressed === true;
}
