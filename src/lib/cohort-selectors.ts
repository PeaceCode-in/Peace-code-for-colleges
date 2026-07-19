// Pure selectors over the departments mock. Every selector that could
// return a below-threshold slice yields { suppressed: true, reason } so
// the UI never has to remember the k-anonymity rule.
import { getDepartmentInsights, type DepartmentInsight } from "./dashboard-mock.departments";

export const K_MIN = 10;

export type Suppressed = { suppressed: true; reason: "k<10" };
export type Result<T> = T | Suppressed;

export function isSuppressed<T>(v: Result<T>): v is Suppressed {
  return typeof v === "object" && v !== null && (v as Suppressed).suppressed === true;
}

export function applyKAnonymity<T>(n: number, value: T, k: number = K_MIN): Result<T> {
  return n < k ? { suppressed: true, reason: "k<10" } : value;
}

let cache: DepartmentInsight[] | null = null;
function all(): DepartmentInsight[] {
  if (!cache) cache = getDepartmentInsights();
  return cache;
}

export function listDepartments(): DepartmentInsight[] {
  return all();
}

export function getDepartment(id: string): DepartmentInsight | null {
  return all().find((d) => d.id === id) ?? null;
}

export function compareDepartments(ids: string[]): DepartmentInsight[] {
  const set = new Set(ids);
  return all().filter((d) => set.has(d.id));
}

// Sort helpers for the rail.
export type RailSort = "size" | "phq9" | "engagement" | "risk";
export function sortDepartments(list: DepartmentInsight[], by: RailSort): DepartmentInsight[] {
  const arr = [...list];
  switch (by) {
    case "size":
      return arr.sort((a, b) => b.n - a.n);
    case "phq9":
      return arr.sort((a, b) => avg(b.phq9Series) - avg(a.phq9Series));
    case "engagement":
      return arr.sort((a, b) => engagementPct(b) - engagementPct(a));
    case "risk":
      return arr.sort((a, b) => b.riskPct - a.riskPct);
  }
}

export function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

export function engagementPct(d: DepartmentInsight): number {
  return d.invited > 0 ? d.funnel.active_30d / d.invited : 0;
}

// 7-day PHQ-9 delta (positive = getting worse, negative = improving).
export function phq9WeekDelta(d: DepartmentInsight): number {
  const s = d.phq9Series;
  if (s.length < 2) return 0;
  return s[s.length - 1] - s[s.length - 2];
}

// Top movers: 3 departments with the largest absolute 7-day PHQ-9 delta.
export function topMovers(limit = 3): DepartmentInsight[] {
  return [...all()]
    .filter((d) => d.n >= K_MIN)
    .sort((a, b) => Math.abs(phq9WeekDelta(b)) - Math.abs(phq9WeekDelta(a)))
    .slice(0, limit);
}
