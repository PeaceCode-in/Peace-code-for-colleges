// Early Warning & Care Routing selectors.
//
// Every function here funnels through the k-anonymity floor (K_MIN = 10).
// The route never touches the mock file directly — it asks a selector,
// and the selector either returns a slice or a `Suppressed` value. That
// is the ONLY seam the UI needs to understand.
//
// No selector returns a per-student row. There is no per-student row to
// return.
import {
  getEarlyWarningSnapshot,
  type EarlyWarningSnapshot,
  type EwSegment,
  type EwWindowKey,
  type RiskTierWeekly,
  type RoutingFunnelStep,
  type BottleneckCell,
  EW_SCHOOL_META,
  EW_YEAR_META,
} from "./dashboard-mock";
import { K_MIN, applyKAnonymity, type Result, isSuppressed } from "./cohort-selectors";
import type { RiskTier } from "./clinical-scales";

export { K_MIN, isSuppressed };

// ─── Population summary ──────────────────────────────────────
export type TierPopulation = {
  tier: RiskTier;
  count: number;
  pctOfActive: number;
  deltaWoW: number; // absolute count change week-over-week
  suppressed: boolean;
};

export function getTierPopulation(window: EwWindowKey): TierPopulation[] {
  const snap = getEarlyWarningSnapshot(window);
  const inst = snap.riskTierSeries.inst;
  const last = inst[inst.length - 1];
  const prev = inst[inst.length - 2];
  const tiers: RiskTier[] = ["elevated", "high", "item9", "overdue"];
  return tiers.map((t) => {
    const count = last[t];
    const prevCount = prev[t];
    return {
      tier: t,
      count,
      pctOfActive: snap.activeCohort > 0 ? (count / snap.activeCohort) * 100 : 0,
      deltaWoW: count - prevCount,
      suppressed: count < K_MIN,
    };
  });
}

// ─── Risk-tier trend (12 weeks) ──────────────────────────────
export type RiskTrendBundle = { data: RiskTierWeekly[]; n: number; label: string };

export function getRiskTrend(
  window: EwWindowKey,
  seg: EwSegment,
): Result<RiskTrendBundle> {
  const snap = getEarlyWarningSnapshot(window);
  let series: RiskTierWeekly[];
  let label: string;
  if (seg === "school") {
    // Blend all school series (institution == sum(schools) approximately).
    const schools = Object.values(snap.riskTierSeries.school);
    series = blendSeries(schools);
    label = "Aggregated across schools";
  } else if (seg === "year") {
    const years = Object.values(snap.riskTierSeries.year);
    series = blendSeries(years);
    label = "Aggregated across years";
  } else {
    series = snap.riskTierSeries.inst;
    label = "Institution";
  }
  const last = series[series.length - 1];
  const n = (last?.elevated ?? 0) + (last?.high ?? 0) + (last?.item9 ?? 0) + (last?.overdue ?? 0);
  return applyKAnonymity(n, { data: series, n, label });
}

function blendSeries(list: RiskTierWeekly[][]): RiskTierWeekly[] {
  if (list.length === 0) return [];
  const weeks = list[0].length;
  return Array.from({ length: weeks }, (_, i) => {
    const acc = { week: list[0][i].week, elevated: 0, high: 0, item9: 0, overdue: 0 };
    for (const s of list) {
      acc.elevated += s[i].elevated;
      acc.high     += s[i].high;
      acc.item9    += s[i].item9;
      acc.overdue  += s[i].overdue;
    }
    return acc;
  });
}

// ─── Routing funnel ──────────────────────────────────────────
export type FunnelBundle = {
  steps: (RoutingFunnelStep & { conversionFromPrev: number | null; suppressed: boolean })[];
  n: number;
};

export function getFunnel(window: EwWindowKey): Result<FunnelBundle> {
  const snap = getEarlyWarningSnapshot(window);
  const raw = snap.routingFunnel;
  const steps = raw.map((s, i) => ({
    ...s,
    conversionFromPrev: i === 0 ? null : raw[i - 1].n > 0 ? (s.n / raw[i - 1].n) * 100 : 0,
    suppressed: s.n < K_MIN,
  }));
  return applyKAnonymity(raw[0]?.n ?? 0, { steps, n: raw[0]?.n ?? 0 });
}

// ─── Time-to-contact ────────────────────────────────────────
export function getTimeToContact(window: EwWindowKey) {
  const snap = getEarlyWarningSnapshot(window);
  const total = snap.timeToContact.buckets.reduce((s, b) => s + b.n, 0);
  return applyKAnonymity(total, snap.timeToContact);
}

// ─── Channel breakdown ──────────────────────────────────────
export function getChannelBreakdown(window: EwWindowKey) {
  const snap = getEarlyWarningSnapshot(window);
  const total = snap.channelBreakdown.reduce(
    (s, w) => s + w.inApp + w.email + w.peer + w.counselor,
    0,
  );
  return applyKAnonymity(total, snap.channelBreakdown);
}

// ─── Bottleneck matrix ──────────────────────────────────────
export function getBottlenecks(window: EwWindowKey): {
  matrix: BottleneckCell[];
  tiers: RiskTier[];
  steps: RoutingFunnelStep["key"][];
} {
  const snap = getEarlyWarningSnapshot(window);
  const tiers: RiskTier[] = ["elevated", "high", "item9", "overdue"];
  const steps: RoutingFunnelStep["key"][] =
    ["detected", "nudged", "resource", "offered", "accepted", "completed"];
  return { matrix: snap.bottleneckMatrix, tiers, steps };
}

// ─── School response times ──────────────────────────────────
export function getSchoolResponseTimes(window: EwWindowKey) {
  const snap = getEarlyWarningSnapshot(window);
  // Already filtered to n ≥ 10 in the generator; guard again for safety.
  const rows = snap.schoolResponseTimes.filter((r) => r.n >= K_MIN);
  return applyKAnonymity(rows.reduce((s, r) => s + r.n, 0), rows);
}

// ─── Reassessment adherence ─────────────────────────────────
export function getAdherence(window: EwWindowKey) {
  const snap = getEarlyWarningSnapshot(window);
  const { within28d, total, priorPct } = snap.reassessmentAdherence;
  const pct = total > 0 ? (within28d / total) * 100 : 0;
  return applyKAnonymity(total, {
    within28d,
    total,
    pct: Math.round(pct * 10) / 10,
    priorPct,
    delta: Math.round((pct - priorPct) * 10) / 10,
  });
}

// ─── System health strip ────────────────────────────────────
export function getSystemHealth(window: EwWindowKey) {
  const snap = getEarlyWarningSnapshot(window);
  return {
    sla24h: snap.sla24h,
    coverageGap: snap.coverageGap,
    alerts: snap.alerts,
  };
}

export function activeCohortFor(window: EwWindowKey): number {
  return getEarlyWarningSnapshot(window).activeCohort;
}

export function snapshotAsOf(window: EwWindowKey): string {
  return getEarlyWarningSnapshot(window).asOf;
}

export function windowLabel(window: EwWindowKey): string {
  return (
    { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", term: "This term" } as const
  )[window];
}

export { EW_SCHOOL_META, EW_YEAR_META };
export type { EwWindowKey, EwSegment, RiskTierWeekly, RoutingFunnelStep, BottleneckCell, EarlyWarningSnapshot };
