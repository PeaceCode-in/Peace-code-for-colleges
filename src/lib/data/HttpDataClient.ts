/**
 * HttpDataClient — future Spring Boot adapter. Compiles today, not wired.
 *
 * Migration day:
 *   1. Deploy Spring Boot per BACKEND_CONTRACT.md.
 *   2. Set VITE_USE_HTTP_API=true and VITE_API_BASE_URL=https://your-api.
 *   3. Delete SupabaseDataClient.ts, supabase/ folder, migrations.
 *   4. No component or route edits.
 */
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
import { z } from "zod";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** Bearer token accessor — replace with your auth store hook when wiring. */
function token(): string {
  try {
    return localStorage.getItem("pc.jwt") ?? "";
  } catch {
    return "";
  }
}

async function get<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  query?: Record<string, string | number | undefined>,
): Promise<z.infer<T>> {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token()}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return schema.parse(await res.json());
}

async function post<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  body: unknown,
): Promise<z.infer<T>> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return schema.parse(await res.json());
}

export class HttpDataClient implements DataClient {
  getWellnessPulse(range: DateRange): Promise<WellnessPulse> {
    return get("/api/v1/metrics/wellness-pulse", WellnessPulseSchema, {
      from: range.from,
      to: range.to,
    });
  }

  async getDepartments(filters: CohortFilters): Promise<DepartmentRow[]> {
    return get(
      "/api/v1/departments",
      z.array(DepartmentRowSchema),
      { filters: JSON.stringify(filters) },
    );
  }

  getCohortSlice(dims: SliceDims): Promise<CohortSlice> {
    return post("/api/v1/cohorts/slice", CohortSliceSchema, dims);
  }

  getWellbeingSignals(range: DateRange): Promise<WellbeingSignals> {
    return get("/api/v1/signals/wellbeing", WellbeingSignalsSchema, {
      from: range.from,
      to: range.to,
    });
  }

  getEarlyWarningQueue(windowKey = "term"): Promise<EarlyWarningQueue> {
    return get("/api/v1/care/risk-queue", EarlyWarningQueueSchema, {
      window: windowKey,
    });
  }

  generateReport(
    template: ReportTemplate,
    range: DateRange,
    filters: CohortFilters = {},
  ): Promise<ReportPacket> {
    return post("/api/v1/reports/generate", ReportPacketSchema, {
      template,
      range,
      filters,
    });
  }

  listMembers(): Promise<MemberRow[]> {
    return get("/api/v1/admin/members", z.array(MemberRowSchema));
  }

  listAuditLog(cursor?: string): Promise<AuditPage> {
    return get("/api/v1/admin/audit", AuditPageSchema, { cursor });
  }
}
