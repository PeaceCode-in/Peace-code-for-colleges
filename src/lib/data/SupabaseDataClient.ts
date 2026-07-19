/**
 * SupabaseDataClient — today's adapter.
 *
 * This is the ONLY file allowed to import from `@/integrations/supabase/*`
 * or `@tanstack/react-start` (`createServerFn`, `requireSupabaseAuth`).
 *
 * Right now the dashboard runs on deterministic mock aggregates. This
 * adapter treats those sources as opaque and validates every payload
 * against the Zod contract before returning, so the wire boundary
 * behaves identically to a real Supabase view. When Supabase aggregate
 * views land, only the handler bodies change — every route and
 * component keeps working untouched.
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

const g = (o: any, ...keys: string[]): any => {
  for (const k of keys) if (o && o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
};

export class SupabaseDataClient implements DataClient {
  async getWellnessPulse(_range: DateRange): Promise<WellnessPulse> {
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
  }

  async getDepartments(_filters: CohortFilters): Promise<DepartmentRow[]> {
    const rows: any[] = getDepartmentInsights() as any[];
    return rows
      .map((r) => ({
        id: String(g(r, "id", "code")),
        name: String(g(r, "name", "label")),
        school: g(r, "school"),
        wellbeingIndex: Number(g(r, "wellbeingIndex", "wellbeing", "index") ?? 0),
        engagementRate: Number(g(r, "engagementRate", "engagement") ?? 0),
        highRiskPct: Number(g(r, "highRiskPct", "riskPct", "highRisk") ?? 0),
        cohortSize: Number(g(r, "cohortSize", "n", "size") ?? 0),
      }))
      .filter((r) => r.cohortSize >= N_MIN)
      .map((r) => DepartmentRowSchema.parse(r));
  }

  async getCohortSlice(dims: SliceDims): Promise<CohortSlice> {
    // The mock cube uses single-value filter fields; the wire contract is
    // multi-select. Pass the defaults through so this compiles today; a real
    // Supabase RPC will accept the array shape directly.
    const agg: any = sliceCube(DEFAULT_FILTERS as any);
    void dims;
    return CohortSliceSchema.parse({
      n: Number(g(agg, "n") ?? 0),
      wellbeingIndex: Number(g(agg, "wellbeingIndex", "wellbeing") ?? 0),
      engagementRate: Number(g(agg, "engagementRate", "engagement") ?? 0),
      highRiskPct: Number(g(agg, "highRiskPct", "highRisk") ?? 0),
      distribution: Array.isArray(agg?.distribution) ? agg.distribution : [],
    });
  }

  async getWellbeingSignals(_range: DateRange): Promise<WellbeingSignals> {
    const s: any = getSignalsSnapshot();
    const emptyPhq = { minimal: 0, mild: 0, moderate: 0, moderatelySevere: 0, severe: 0 };
    const emptyGad = { minimal: 0, mild: 0, moderate: 0, severe: 0 };
    return WellbeingSignalsSchema.parse({
      phq9: g(s, "phq9", "phq") ?? emptyPhq,
      gad7: g(s, "gad7", "gad") ?? emptyGad,
      sessionCadence: Array.isArray(s?.sessionCadence) ? s.sessionCadence : [],
      alerts: Array.isArray(s?.alerts) ? s.alerts : [],
    });
  }

  async getEarlyWarningQueue(windowKey = "term"): Promise<EarlyWarningQueue> {
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
      tiers: tiers.map((t) => ({
        tier: t.tier,
        n: Number(g(t, "n", "count") ?? 0),
      })),
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
  }

  async generateReport(
    template: ReportTemplate,
    range: DateRange,
    filters: CohortFilters = {},
  ): Promise<ReportPacket> {
    // Reporting stays client-side today (see report-export.ts). This adapter
    // returns an empty scaffold; a future Supabase RPC will populate it.
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
    // The mock admin store is React-scoped (useSyncExternalStore). The
    // adapter returns an empty list today; the /admin surface still reads
    // its state directly for the UI-only demo. When Supabase lands, this
    // hits the members view.
    return [MemberRowSchema].map(() => null as never).filter(Boolean) as MemberRow[];
  }

  async listAuditLog(_cursor?: string): Promise<AuditPage> {
    return AuditPageSchema.parse({ entries: [], nextCursor: null });
  }
}
