/**
 * SupabaseDataClient — today's adapter.
 *
 * This is the ONLY file allowed to import from `@/integrations/supabase/*`
 * or `@tanstack/react-start` (`createServerFn`, `requireSupabaseAuth`).
 *
 * Right now the dashboard runs on deterministic mock aggregates — this
 * adapter wraps those selectors and validates every payload against the
 * Zod contract, so the boundary behaves identically to a real Supabase
 * view. When Supabase aggregate views land, only the bodies below change;
 * every route and component keeps working untouched.
 */
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
import { readAdminState } from "@/lib/admin-mock";
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

function mask(email: string): string {
  const [u, d] = email.split("@");
  if (!u || !d) return "•••@•••";
  const head = u.slice(0, 2);
  return `${head}${"•".repeat(Math.max(1, u.length - 2))}@${d}`;
}

export class SupabaseDataClient implements DataClient {
  async getWellnessPulse(_range: DateRange): Promise<WellnessPulse> {
    const snap = getExecutiveSnapshot();
    return WellnessPulseSchema.parse({
      wellbeingIndex: snap.wellbeingIndex ?? 0,
      activeStudents: snap.activeStudents ?? 0,
      crisisSignals: snap.crisisSignals ?? 0,
      avgMood: snap.avgMood ?? 0,
      sessionsCompleted: snap.sessionsCompleted ?? 0,
      trend: (snap.trend ?? []).map((p: { date: string; value: number }) => ({
        date: p.date,
        value: p.value,
      })),
      asOfISO: snap.asOfISO ?? new Date().toISOString(),
    });
  }

  async getDepartments(_filters: CohortFilters): Promise<DepartmentRow[]> {
    const rows = getDepartmentInsights();
    return rows
      .filter((r) => (r.cohortSize ?? 0) >= N_MIN)
      .map((r) =>
        DepartmentRowSchema.parse({
          id: r.id,
          name: r.name,
          school: r.school,
          wellbeingIndex: r.wellbeingIndex,
          engagementRate: r.engagementRate,
          highRiskPct: r.highRiskPct,
          cohortSize: r.cohortSize,
        }),
      );
  }

  async getCohortSlice(dims: SliceDims): Promise<CohortSlice> {
    const agg = sliceCube({ ...DEFAULT_FILTERS, ...dims });
    return CohortSliceSchema.parse({
      n: agg.n ?? 0,
      wellbeingIndex: agg.wellbeingIndex ?? 0,
      engagementRate: agg.engagementRate ?? 0,
      highRiskPct: agg.highRiskPct ?? 0,
      distribution: agg.distribution ?? [],
    });
  }

  async getWellbeingSignals(_range: DateRange): Promise<WellbeingSignals> {
    const s = getSignalsSnapshot();
    return WellbeingSignalsSchema.parse({
      phq9: s.phq9,
      gad7: s.gad7,
      sessionCadence: s.sessionCadence ?? [],
      alerts: s.alerts ?? [],
    });
  }

  async getEarlyWarningQueue(windowKey = "term"): Promise<EarlyWarningQueue> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = windowKey as any;
    const tiers = getTierPopulation(w);
    const funnel = getFunnel(w);
    const ttc = getTimeToContact(w);
    const channels = getChannelBreakdown(w);
    return EarlyWarningQueueSchema.parse({
      windowKey,
      tiers: tiers.map((t) => ({ tier: t.tier, n: t.n })),
      funnel: "suppressed" in funnel ? [] : funnel.data.steps,
      timeToContactHours: ttc?.buckets?.map((b: { hours: number }) => b.hours) ?? [],
      channels: channels?.map((c) => ({ channel: c.channel, pct: c.pct })) ?? [],
      asOfISO: snapshotAsOf(w),
    });
  }

  async generateReport(
    template: ReportTemplate,
    range: DateRange,
    filters: CohortFilters = {},
  ): Promise<ReportPacket> {
    // Reporting stays client-side today (see report-export.ts). This adapter
    // returns an empty scaffold so a future Supabase RPC can slot in.
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
    const state = readAdminState();
    return state.members.map((m) =>
      MemberRowSchema.parse({
        id: m.id,
        maskedEmail: mask(m.email),
        role: m.role,
        status: m.status,
        lastActiveISO: m.lastActiveISO ?? null,
      }),
    );
  }

  async listAuditLog(_cursor?: string): Promise<AuditPage> {
    const state = readAdminState();
    return AuditPageSchema.parse({
      entries: state.audit.map((e) => ({
        id: e.id,
        timestampISO: e.timestampISO,
        actorRole: e.actorRole,
        actorEmail: mask(e.actorEmail),
        action: e.action,
        target: e.target,
        ipHash: e.ipHash,
        meta: e.meta,
      })),
      nextCursor: null,
    });
  }
}
