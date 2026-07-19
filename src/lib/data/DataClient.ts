/**
 * DataClient — the ONLY interface UI code depends on.
 *
 * Rule: no React component, route, or store may import { supabase }
 * or `createServerFn` directly. Every read goes through `dataClient`
 * (see `./index.ts`). To swap Supabase → Spring Boot later, flip the
 * env flag in `./index.ts`; no page code changes.
 */
import type {
  AuditPage,
  CohortFilters,
  CohortSlice,
  DateRange,
  DepartmentRow,
  EarlyWarningQueue,
  MemberRow,
  ReportPacket,
  ReportTemplate,
  SliceDims,
  WellbeingSignals,
  WellnessPulse,
} from "./contracts";

export interface DataClient {
  // Executive dashboard
  getWellnessPulse(range: DateRange): Promise<WellnessPulse>;

  // Departments deep-dive
  getDepartments(filters: CohortFilters): Promise<DepartmentRow[]>;

  // Cohort / demographics slicer
  getCohortSlice(dims: SliceDims): Promise<CohortSlice>;

  // Wellbeing signals command center
  getWellbeingSignals(range: DateRange): Promise<WellbeingSignals>;

  // Early warning & care routing
  getEarlyWarningQueue(windowKey?: string): Promise<EarlyWarningQueue>;

  // Reporting
  generateReport(
    template: ReportTemplate,
    range: DateRange,
    filters?: CohortFilters,
  ): Promise<ReportPacket>;

  // Admin
  listMembers(): Promise<MemberRow[]>;
  listAuditLog(cursor?: string): Promise<AuditPage>;
}
