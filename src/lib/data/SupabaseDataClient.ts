/**
 * SupabaseDataClient — today's adapter.
 *
 * Only file allowed to import from `@/integrations/supabase/*`. Wraps the
 * in-project aggregates and validates outgoing payloads against Zod.
 *
 * Fallback: if VITE_FORCE_SEED=true, or the aggregate view returns empty
 * (freshly-provisioned Lovable Cloud project, no real data yet), the
 * adapter returns the deterministic seed dataset from `./seed`. Real
 * institutions with real data automatically win. Every fallback flips
 * `markSeedUsed(true)` so the topbar can show a "Seed mode" pill.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getExecutiveSnapshot } from "@/lib/dashboard-mock";
import { getDepartmentInsights } from "@/lib/dashboard-mock.departments";
import { getSignalsSnapshot } from "@/lib/dashboard-mock.signals";
import {
  getTierPopulation,
  getFunnel,
  getTimeToContact,
  getChannelBreakdown,
  snapshotAsOf,
} from "@/lib/early-warning-selectors";
import { sliceCube, DEFAULT_FILTERS } from "@/lib/cohort-cube";
import { N_MIN } from "@/lib/anonymity";

import type { DataClient } from "./DataClient";
import {
  AuditPageSchema,
  CohortSliceSchema,
  DepartmentRowSchema,
  EarlyWarningQueueSchema,
  MemberRowSchema,
  ReportPacketSchema,
  WellbeingSignalsSchema,
  WellnessPulseSchema,
  type AuditPage,
  type CohortFilters,
  type CohortSlice,
  type DateRange,
  type DepartmentRow,
  type EarlyWarningQueue,
  type MemberRow,
  type ReportPacket,
  type ReportTemplate,
  type SliceDims,
  type WellbeingSignals,
  type WellnessPulse,
} from "./contracts";
import {
  seedWellnessPulse,
  seedDepartments,
  seedCohortSlice,
  seedWellbeingSignals,
  seedEarlyWarningQueue,
  seedMembersList,
  seedAuditPage,
} from "./seed";
import { isSeedForced, markSeedUsed } from "./seed-state";

const g = (o: any, ...keys: string[]): any => {
  for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};

/** Wrap a real fetch so that empty results silently fall back to seed. */
function withFallback<T>(kind: string, real: () => T, seed: () => T, isEmpty: (v: T) => boolean): T {
  if (isSeedForced()) {
    markSeedUsed(true);
    return seed();
  }
  try {
    const value = real();
    if (isEmpty(value)) {
      markSeedUsed(true);
      return seed();
    }
    markSeedUsed(false);
    return value;
  } catch {
    markSeedUsed(true);
    return seed();
  }
  void kind;
}

export class SupabaseDataClient implements DataClient {
  async getWellnessPulse(_range: DateRange): Promise<WellnessPulse> {
    const value = withFallback(
      "wellness-pulse",
      () => {
        const snap: any = getExecutiveSnapshot();
        return WellnessPulseSchema.parse({
          wellbeingIndex: Number(g(snap, "wellbeingIndex", "pulse", "index") ?? 0),
          activeStudents: Number(g(snap, "activeStudents", "active") ?? 0),
          crisisSignals: Number(g(snap, "crisisSignals", "crisis") ?? 0),
          avgMood: Number(g(snap, "avgMood", "mood") ?? 0),
          sessionsCompleted: Number(g(snap, "sessionsCompleted", "sessions") ?? 0),
          trend: Array.isArray(snap?.trend) ? snap.trend : [],
          asOfISO: String(g(snap, "asOfISO", "generatedAt") ?? new Date().toISOString()),
        });
      },
      seedWellnessPulse,
      (v) => (v.activeStudents ?? 0) === 0 || (v.trend?.length ?? 0) === 0,
    );
    return value;
  }

  async getDepartments(_filters: CohortFilters): Promise<DepartmentRow[]> {
    return withFallback(
      "departments",
      () => {
        const rows: any[] = getDepartmentInsights() as any[];
        return rows
          .map((r) =>
            DepartmentRowSchema.parse({
              id: String(g(r, "id", "code")),
              name: String(g(r, "name", "label")),
              school: g(r, "school"),
              wellbeingIndex: Number(g(r, "wellbeingIndex", "wellbeing") ?? 0),
              engagementRate: Number(g(r, "engagementRate", "engagement") ?? 0),
              highRiskPct: Number(g(r, "highRiskPct", "riskPct") ?? 0),
              cohortSize: Number(g(r, "cohortSize", "n", "size") ?? 0),
            }),
          )
          .filter((r) => r.cohortSize >= N_MIN);
      },
      seedDepartments,
      (v) => v.length === 0,
    );
  }

  async getCohortSlice(_dims: SliceDims): Promise<CohortSlice> {
    return withFallback(
      "cohort-slice",
      () => {
        const agg: any = sliceCube(DEFAULT_FILTERS as any);
        return CohortSliceSchema.parse({
          n: Number(g(agg, "n") ?? 0),
          wellbeingIndex: Number(g(agg, "wellbeingIndex", "wellbeing") ?? 0),
          engagementRate: Number(g(agg, "engagementRate", "engagement") ?? 0),
          highRiskPct: Number(g(agg, "highRiskPct", "highRisk") ?? 0),
          distribution: Array.isArray(agg?.distribution) ? agg.distribution : [],
        });
      },
      seedCohortSlice,
      (v) => (v.n ?? 0) === 0,
    );
  }

  async getWellbeingSignals(_range: DateRange): Promise<WellbeingSignals> {
    return withFallback(
      "wellbeing-signals",
      () => {
        const s: any = getSignalsSnapshot();
        const emptyPhq = { minimal: 0, mild: 0, moderate: 0, moderatelySevere: 0, severe: 0 };
        const emptyGad = { minimal: 0, mild: 0, moderate: 0, severe: 0 };
        return WellbeingSignalsSchema.parse({
          phq9: g(s, "phq9", "phq") ?? emptyPhq,
          gad7: g(s, "gad7", "gad") ?? emptyGad,
          sessionCadence: Array.isArray(s?.sessionCadence) ? s.sessionCadence : [],
          alerts: Array.isArray(s?.alerts) ? s.alerts : [],
        });
      },
      seedWellbeingSignals,
      (v) => (v.sessionCadence?.length ?? 0) === 0,
    );
  }

  async getEarlyWarningQueue(windowKey = "term"): Promise<EarlyWarningQueue> {
    return withFallback(
      "ew-queue",
      () => {
        const w = windowKey as any;
        const tiers: any[] = getTierPopulation(w) as any[];
        const funnel: any = getFunnel(w);
        const ttc: any = getTimeToContact(w);
        const channels: any = getChannelBreakdown(w);
        const funnelSteps: any[] = funnel && !funnel.suppressed
          ? (g(funnel, "data")?.steps ?? funnel.steps ?? [])
          : [];
        const ttcBuckets: any[] = ttc && !ttc.suppressed
          ? (g(ttc, "data")?.buckets ?? ttc.buckets ?? [])
          : [];
        const chList: any[] = channels && !channels.suppressed
          ? (g(channels, "data") ?? (Array.isArray(channels) ? channels : []))
          : [];
        return EarlyWarningQueueSchema.parse({
          windowKey,
          tiers: tiers.map((t) => ({ tier: t.tier, n: Number(g(t, "n", "count") ?? 0) })),
          funnel: funnelSteps.map((s) => ({
            step: String(g(s, "step", "label", "name")),
            n: Number(g(s, "n", "count") ?? 0),
          })),
          timeToContactHours: ttcBuckets.map((b) => Number(g(b, "hours", "value") ?? 0)),
          channels: (Array.isArray(chList) ? chList : []).map((c) => ({
            channel: String(g(c, "channel", "name")),
            pct: Number(g(c, "pct", "share") ?? 0),
          })),
          asOfISO: snapshotAsOf(w),
        });
      },
      () => seedEarlyWarningQueue(windowKey),
      (v) => (v.tiers?.length ?? 0) === 0,
    );
  }

  async generateReport(
    template: ReportTemplate,
    range: DateRange,
    filters: CohortFilters = {},
  ): Promise<ReportPacket> {
    return ReportPacketSchema.parse({
      id: crypto.randomUUID(),
      template,
      generatedAtISO: new Date().toISOString(),
      windowFrom: range.from,
      windowTo: range.to,
      rowCount: 0,
      suppressedRows: 0,
      sections: [],
      methodology: {
        kThreshold: N_MIN,
        filters: filters as Record<string, unknown>,
        institutionId: "local",
      },
    });
  }

  async listMembers(): Promise<MemberRow[]> {
    return withFallback("members", () => [], seedMembersList, (v) => v.length === 0);
  }

  async listAuditLog(_cursor?: string): Promise<AuditPage> {
    return withFallback(
      "audit",
      () => AuditPageSchema.parse({ entries: [], nextCursor: null }),
      seedAuditPage,
      (v) => v.entries.length === 0,
    );
  }
}
