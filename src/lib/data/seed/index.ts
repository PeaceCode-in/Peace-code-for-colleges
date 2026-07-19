/**
 * Seed facade — returns contract-shape payloads. Every value is deterministic.
 * Dev-only: validates against Zod contracts on module load.
 */
import { mulberry32, SEED_ROOT } from "./rng";
import { SEED_DEPARTMENTS, SEED_YEARS, cohortMatrix, deptTotal } from "./institution";
import {
  seedPulseTrend, seedSessionCadence, seedPhq9, seedGad7, seedAvgMood, todayISO,
} from "./timeseries";
import { seedTiers, seedFunnel, seedTimeToContactHours, seedChannels } from "./risk";
import { summariseCube } from "./cohort-cube";
import { seedAlerts } from "./alerts";
import { seedAudit } from "./audit";
import { seedReportHistory } from "./reports";
import { seedMembers } from "./members";
import {
  AuditPageSchema,
  CohortSliceSchema,
  DepartmentRowSchema,
  EarlyWarningQueueSchema,
  MemberRowSchema,
  WellbeingSignalsSchema,
  WellnessPulseSchema,
  type AuditPage,
  type CohortSlice,
  type DepartmentRow,
  type EarlyWarningQueue,
  type MemberRow,
  type WellbeingSignals,
  type WellnessPulse,
} from "../contracts";

export function seedWellnessPulse(): WellnessPulse {
  const trend = seedPulseTrend();
  const latest = trend[trend.length - 1]?.value ?? 0;
  const rand = mulberry32(SEED_ROOT ^ 0x91);
  return {
    wellbeingIndex: latest,
    activeStudents: 4231 + Math.floor(rand() * 200),
    crisisSignals: 12 + Math.floor(rand() * 6),
    avgMood: seedAvgMood(),
    sessionsCompleted: 348 + Math.floor(rand() * 40),
    trend,
    asOfISO: todayISO(),
  };
}

export function seedDepartments(): DepartmentRow[] {
  const rand = mulberry32(SEED_ROOT ^ 0xD1);
  return SEED_DEPARTMENTS.map((d) => ({
    id: d.id,
    name: d.name,
    school: d.school,
    wellbeingIndex: Math.round((64 + rand() * 14) * 10) / 10,
    engagementRate: Math.round((0.42 + rand() * 0.28) * 100) / 100,
    highRiskPct:    Math.round((0.04 + rand() * 0.08) * 100) / 100,
    cohortSize:     deptTotal(d.id),
  }));
}

export function seedCohortSlice(): CohortSlice {
  return summariseCube();
}

export function seedWellbeingSignals(): WellbeingSignals {
  return {
    phq9: seedPhq9(),
    gad7: seedGad7(),
    sessionCadence: seedSessionCadence(),
    alerts: seedAlerts().slice(0, 6),
  };
}

export function seedEarlyWarningQueue(windowKey = "term"): EarlyWarningQueue {
  return {
    windowKey,
    tiers: seedTiers(),
    funnel: seedFunnel(),
    timeToContactHours: seedTimeToContactHours(),
    channels: seedChannels(),
    asOfISO: todayISO(),
  };
}

export function seedMembersList(): MemberRow[] {
  return seedMembers();
}

export function seedAuditPage(): AuditPage {
  return { entries: seedAudit(), nextCursor: null };
}

// Also expose these for /qa/data and route pages that want the extras.
export { SEED_DEPARTMENTS, SEED_YEARS, cohortMatrix } from "./institution";
export { seedAlerts } from "./alerts";
export { seedReportHistory } from "./reports";

// ─── Dev-only contract validation ──────────────────────────────
if (import.meta.env.DEV) {
  try {
    WellnessPulseSchema.parse(seedWellnessPulse());
    DepartmentRowSchema.array().parse(seedDepartments());
    CohortSliceSchema.parse(seedCohortSlice());
    WellbeingSignalsSchema.parse(seedWellbeingSignals());
    EarlyWarningQueueSchema.parse(seedEarlyWarningQueue());
    MemberRowSchema.array().parse(seedMembersList());
    AuditPageSchema.parse(seedAuditPage());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[seed] contract validation failed:", err);
    throw err;
  }
}
