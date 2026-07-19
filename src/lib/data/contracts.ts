/**
 * Data contracts — the wire shape every DataClient adapter must return.
 *
 * These schemas are the single source of truth shared by:
 *  - SupabaseDataClient (today: wraps mock aggregates; tomorrow: Supabase views)
 *  - HttpDataClient     (future: Spring Boot REST endpoints)
 *
 * Adding a new field? Change it here first, then update every adapter.
 *
 * Every schema is aggregate-only. Nothing here is per-student. Rows below
 * the k-anonymity threshold (k >= 10) MUST be replaced with a suppressed
 * marker by the adapter before returning — never leaked to the UI.
 */
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────

export const DateRangeSchema = z.object({
  from: z.string(), // ISO date, inclusive
  to: z.string(),   // ISO date, inclusive
});
export type DateRange = z.infer<typeof DateRangeSchema>;

export const SuppressedSchema = z.object({
  suppressed: z.literal(true),
  reason: z.literal("k<N"),
  k: z.number().int().nonnegative(),
});
export type Suppressed = z.infer<typeof SuppressedSchema>;

/** Any tile-level payload can be a Suppressed marker OR a real value. */
export const OrSuppressed = <T extends z.ZodTypeAny>(inner: T) =>
  z.union([SuppressedSchema, inner]);

export const CohortFiltersSchema = z
  .object({
    years: z.array(z.string()).optional(),
    genders: z.array(z.string()).optional(),
    residency: z.array(z.string()).optional(),
    firstGen: z.array(z.string()).optional(),
    aid: z.array(z.string()).optional(),
    schools: z.array(z.string()).optional(),
  })
  .passthrough();
export type CohortFilters = z.infer<typeof CohortFiltersSchema>;

export const SliceDimsSchema = z
  .object({
    years: z.array(z.string()).optional(),
    genders: z.array(z.string()).optional(),
    residency: z.array(z.string()).optional(),
    firstGen: z.array(z.string()).optional(),
    aid: z.array(z.string()).optional(),
  })
  .passthrough();
export type SliceDims = z.infer<typeof SliceDimsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard payloads
// ─────────────────────────────────────────────────────────────────────────────

export const TrendPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const WellnessPulseSchema = z.object({
  wellbeingIndex: z.number(),
  activeStudents: z.number().int().nonnegative(),
  crisisSignals: z.number().int().nonnegative(),
  avgMood: z.number(),
  sessionsCompleted: z.number().int().nonnegative(),
  trend: z.array(TrendPointSchema),
  asOfISO: z.string(),
});
export type WellnessPulse = z.infer<typeof WellnessPulseSchema>;

export const DepartmentRowSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    school: z.string().optional(),
    wellbeingIndex: z.number(),
    engagementRate: z.number(),
    highRiskPct: z.number(),
    cohortSize: z.number().int().nonnegative(),
  })
  .passthrough();
export type DepartmentRow = z.infer<typeof DepartmentRowSchema>;

export const CohortSliceSchema = z
  .object({
    n: z.number().int().nonnegative(),
    wellbeingIndex: z.number(),
    engagementRate: z.number(),
    highRiskPct: z.number(),
    distribution: z.array(z.object({ bucket: z.string(), value: z.number() })),
  })
  .passthrough();
export type CohortSlice = z.infer<typeof CohortSliceSchema>;

export const WellbeingSignalsSchema = z
  .object({
    phq9: z.object({
      minimal: z.number(),
      mild: z.number(),
      moderate: z.number(),
      moderatelySevere: z.number(),
      severe: z.number(),
    }),
    gad7: z.object({
      minimal: z.number(),
      mild: z.number(),
      moderate: z.number(),
      severe: z.number(),
    }),
    sessionCadence: z.array(TrendPointSchema),
    alerts: z.array(
      z.object({
        id: z.string(),
        severity: z.enum(["info", "warn", "critical"]),
        title: z.string(),
        detail: z.string(),
        firedAtISO: z.string(),
      }),
    ),
  })
  .passthrough();
export type WellbeingSignals = z.infer<typeof WellbeingSignalsSchema>;

export const EarlyWarningQueueSchema = z
  .object({
    windowKey: z.string(),
    tiers: z.array(
      z.object({
        tier: z.enum(["Elevated", "High", "Item9", "Overdue"]),
        n: z.number().int().nonnegative(),
      }),
    ),
    funnel: z.array(
      z.object({ step: z.string(), n: z.number().int().nonnegative() }),
    ),
    timeToContactHours: z.array(z.number()),
    channels: z.array(
      z.object({ channel: z.string(), pct: z.number() }),
    ),
    asOfISO: z.string(),
  })
  .passthrough();
export type EarlyWarningQueue = z.infer<typeof EarlyWarningQueueSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Reporting
// ─────────────────────────────────────────────────────────────────────────────

export const ReportTemplateSchema = z.enum([
  "board-quarterly",
  "wellbeing-monthly",
  "risk-weekly",
  "benchmark-annual",
  "custom",
]);
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;

export const ReportPacketSchema = z.object({
  id: z.string(),
  template: ReportTemplateSchema,
  generatedAtISO: z.string(),
  windowFrom: z.string(),
  windowTo: z.string(),
  rowCount: z.number().int().nonnegative(),
  suppressedRows: z.number().int().nonnegative(),
  sections: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
    }),
  ),
  methodology: z.object({
    kThreshold: z.number().int().min(10),
    filters: z.record(z.string(), z.unknown()),
    institutionId: z.string(),
  }),
});
export type ReportPacket = z.infer<typeof ReportPacketSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

export const MemberRowSchema = z.object({
  id: z.string(),
  maskedEmail: z.string(),
  role: z.enum(["admin", "viewer"]),
  status: z.enum(["active", "invited", "disabled"]),
  lastActiveISO: z.string().nullable(),
});
export type MemberRow = z.infer<typeof MemberRowSchema>;

export const AuditEntrySchema = z.object({
  id: z.string(),
  timestampISO: z.string(),
  actorRole: z.enum(["admin", "viewer"]),
  actorEmail: z.string(), // masked
  action: z.string(),
  target: z.string().optional(),
  ipHash: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const AuditPageSchema = z.object({
  entries: z.array(AuditEntrySchema),
  nextCursor: z.string().nullable(),
});
export type AuditPage = z.infer<typeof AuditPageSchema>;
