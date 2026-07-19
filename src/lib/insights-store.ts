// PeaceCode for Colleges — Insights store.
// Deterministic, seed-based mock generator. Ready to swap for the Spring Boot
// backend later without touching any tile component. Every selector returns
// { data, sampleSize, isSuppressed } so tiles never need to know how data
// arrived — they only render.
//
// Privacy guardrail: any bucket that would resolve to fewer than K_ANON
// students is returned as isSuppressed, so tiles render the "Sample too small"
// state instead of a number.
import { useSyncExternalStore } from "react";

export const K_ANON = 10;

// ─── Filter state ──────────────────────────────────────────────
export type Timeframe = "week" | "month" | "term" | "custom";
export type CompareMode = "previous" | "baseline" | "national";

export const DEPARTMENTS = [
  "Computer Sci",
  "Electrical Eng",
  "Mechanical Eng",
  "Civil Eng",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Humanities",
  "Management",
  "Design",
];

export const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Postgrad"];

export const PROGRAMS = [
  "Exam Stress Circle",
  "Sleep Reset",
  "Peer Listening",
  "Mindful Mornings",
  "Career Compass",
];

export type Filters = {
  timeframe: Timeframe;
  departments: string[]; // empty = all
  years: string[];
  programs: string[];
  compare: CompareMode;
};

const DEFAULT_FILTERS: Filters = {
  timeframe: "week",
  departments: [],
  years: [],
  programs: [],
  compare: "previous",
};

// ─── Tiny reactive store (no zustand) ──────────────────────────
let state: Filters = DEFAULT_FILTERS;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
function getSnapshot() { return state; }

export function useDashboardFilters() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    filters: value,
    setTimeframe: (t: Timeframe) => { state = { ...state, timeframe: t }; emit(); },
    toggleDepartment: (d: string) => { state = { ...state, departments: toggle(state.departments, d) }; emit(); },
    toggleYear: (y: string) => { state = { ...state, years: toggle(state.years, y) }; emit(); },
    toggleProgram: (p: string) => { state = { ...state, programs: toggle(state.programs, p) }; emit(); },
    setCompare: (c: CompareMode) => { state = { ...state, compare: c }; emit(); },
    reset: () => { state = DEFAULT_FILTERS; emit(); },
  };
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

// ─── Deterministic PRNG ────────────────────────────────────────
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFor(filters: Filters, salt: string): () => number {
  const key = [
    salt,
    filters.timeframe,
    filters.compare,
    filters.departments.slice().sort().join(","),
    filters.years.slice().sort().join(","),
    filters.programs.slice().sort().join(","),
  ].join("|");
  return mulberry32(hashString(key));
}

// ─── Population math ───────────────────────────────────────────
// Base institution: 4,800 enrolled. Filters narrow the eligible cohort.
const TOTAL_ENROLLED = 4800;

function narrowFactor(filters: Filters): number {
  let f = 1;
  if (filters.departments.length > 0) f *= filters.departments.length / DEPARTMENTS.length;
  if (filters.years.length > 0) f *= filters.years.length / YEARS.length;
  if (filters.programs.length > 0) f *= 0.55 + (filters.programs.length / PROGRAMS.length) * 0.35;
  return Math.max(f, 0.01);
}

export function eligibleCount(filters: Filters): number {
  return Math.round(TOTAL_ENROLLED * narrowFactor(filters));
}

// ─── Selectors ─────────────────────────────────────────────────
export type Selector<T> = { data: T | null; sampleSize: number; isSuppressed: boolean };

function suppressed<T>(n: number): Selector<T> {
  return { data: null, sampleSize: n, isSuppressed: true };
}

// Institutional wellbeing index (0–100) + 12-week sparkline + delta vs prev week.
export function useInstitutionalIndex(filters: Filters): Selector<{
  index: number;
  delta: number;
  spark: number[];
}> {
  const eligible = eligibleCount(filters);
  const engaged = Math.round(eligible * 0.62);
  if (engaged < K_ANON) return suppressed(engaged);
  const rand = seedFor(filters, "index");
  const base = 62 + rand() * 18; // 62–80
  const spark = Array.from({ length: 12 }, (_, i) => {
    const r = rand();
    return Math.round((base + Math.sin(i * 0.6) * 4 + (r - 0.5) * 6) * 10) / 10;
  });
  const index = spark[spark.length - 1];
  const delta = Math.round((index - spark[spark.length - 2]) * 10) / 10;
  return { data: { index, delta, spark }, sampleSize: engaged, isSuppressed: false };
}

// Active engagement: % of enrolled who logged in + stacked bar segments.
export function useActiveEngagement(filters: Filters): Selector<{
  activePct: number;
  segments: { label: string; pct: number }[];
}> {
  const eligible = eligibleCount(filters);
  if (eligible < K_ANON) return suppressed(eligible);
  const rand = seedFor(filters, "engagement");
  const active = 55 + rand() * 20;
  const occ = 15 + rand() * 10;
  const dormant = 100 - active - occ;
  return {
    data: {
      activePct: Math.round(active),
      segments: [
        { label: "Active", pct: Math.round(active) },
        { label: "Occasional", pct: Math.round(occ) },
        { label: "Dormant", pct: Math.round(dormant) },
      ],
    },
    sampleSize: eligible,
    isSuppressed: false,
  };
}

// Safety pulse — traffic light distribution.
export function useSafetyPulse(filters: Filters): Selector<{
  level: "green" | "amber" | "red";
  elevatedPct: number;
  engaged: number;
}> {
  const eligible = eligibleCount(filters);
  const engaged = Math.round(eligible * 0.62);
  if (engaged < K_ANON) return suppressed(engaged);
  const rand = seedFor(filters, "safety");
  const elevated = Math.round(7 + rand() * 12); // 7–19%
  const level: "green" | "amber" | "red" =
    elevated < 10 ? "green" : elevated < 15 ? "amber" : "red";
  return { data: { level, elevatedPct: elevated, engaged }, sampleSize: engaged, isSuppressed: false };
}

// Mood trend — 90 days of aggregate mood scores across 4 series.
export type MoodPoint = { day: string; Calm: number; Stressed: number; Low: number; Anxious: number };
export function useMoodTrend(filters: Filters): Selector<MoodPoint[]> {
  const eligible = eligibleCount(filters);
  const engaged = Math.round(eligible * 0.62);
  if (engaged < K_ANON) return suppressed(engaged);
  const rand = seedFor(filters, "mood");
  const today = new Date();
  const data: MoodPoint[] = [];
  let calm = 55, stressed = 35, low = 22, anxious = 28;
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    calm += (rand() - 0.5) * 3;
    stressed += (rand() - 0.5) * 3;
    low += (rand() - 0.5) * 2;
    anxious += (rand() - 0.5) * 3;
    calm = Math.max(30, Math.min(75, calm));
    stressed = Math.max(15, Math.min(55, stressed));
    low = Math.max(8, Math.min(38, low));
    anxious = Math.max(10, Math.min(45, anxious));
    data.push({
      day: `${d.getMonth() + 1}/${d.getDate()}`,
      Calm: Math.round(calm),
      Stressed: Math.round(stressed),
      Low: Math.round(low),
      Anxious: Math.round(anxious),
    });
  }
  return { data, sampleSize: engaged, isSuppressed: false };
}

// Top concerns — bubble data (anonymized session theme tags).
export type ConcernBubble = { theme: string; count: number; delta: number };
export function useTopConcerns(filters: Filters): Selector<ConcernBubble[]> {
  const eligible = eligibleCount(filters);
  const engaged = Math.round(eligible * 0.62);
  if (engaged < K_ANON) return suppressed(engaged);
  const rand = seedFor(filters, "concerns");
  const themes = ["Academic", "Relationships", "Sleep", "Family", "Career", "Identity"];
  const data = themes.map((theme) => ({
    theme,
    count: Math.round(engaged * (0.08 + rand() * 0.22)),
    delta: Math.round((rand() - 0.45) * 30),
  }));
  return { data, sampleSize: engaged, isSuppressed: false };
}

// Department × wellbeing heatmap. Cells with n<K_ANON are locked.
export type HeatCell = { dept: string; band: string; n: number; locked: boolean; intensity: number };
export function useDepartmentHeatmap(filters: Filters): Selector<{
  cells: HeatCell[];
  bands: string[];
  depts: string[];
}> {
  const eligible = eligibleCount(filters);
  if (eligible < K_ANON) return suppressed(eligible);
  const rand = seedFor(filters, "heatmap");
  const bands = ["Thriving", "Steady", "Stretched", "Struggling"];
  const depts = filters.departments.length > 0 ? filters.departments : DEPARTMENTS;
  const perDept = Math.round(eligible / depts.length);
  const cells: HeatCell[] = [];
  for (const dept of depts) {
    const raw = bands.map(() => rand());
    const sum = raw.reduce((a, b) => a + b, 0);
    bands.forEach((band, i) => {
      const share = raw[i] / sum;
      const n = Math.round(perDept * share);
      cells.push({
        dept,
        band,
        n,
        locked: n < K_ANON,
        intensity: share,
      });
    });
  }
  return { data: { cells, bands, depts }, sampleSize: eligible, isSuppressed: false };
}

// Sessions delivered this week + 7-day bar chart split.
export type SessionBar = { day: string; Individual: number; Group: number; Self: number };
export function useSessionsDelivered(filters: Filters): Selector<{
  total: number;
  bars: SessionBar[];
}> {
  const eligible = eligibleCount(filters);
  const engaged = Math.round(eligible * 0.62);
  if (engaged < K_ANON) return suppressed(engaged);
  const rand = seedFor(filters, "sessions");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const bars = days.map((day) => ({
    day,
    Individual: Math.round(6 + rand() * 14),
    Group: Math.round(2 + rand() * 6),
    Self: Math.round(18 + rand() * 24),
  }));
  const total = bars.reduce((a, b) => a + b.Individual + b.Group + b.Self, 0);
  return { data: { total, bars }, sampleSize: engaged, isSuppressed: false };
}

// Average wait — median hours from request to first session.
export function useAverageWait(filters: Filters): Selector<{ hours: number; delta: number }> {
  const eligible = eligibleCount(filters);
  const engaged = Math.round(eligible * 0.62);
  if (engaged < K_ANON) return suppressed(engaged);
  const rand = seedFor(filters, "wait");
  const hours = Math.round((14 + rand() * 22) * 10) / 10; // 14–36h
  const delta = Math.round((rand() - 0.5) * 8 * 10) / 10;
  return { data: { hours, delta }, sampleSize: engaged, isSuppressed: false };
}

// Program impact strip.
export type ProgramImpact = {
  name: string;
  enrolledPct: number;
  completedPct: number;
  moodDelta: number;
  cohort: number;
};
export function usePrograms(filters: Filters): Selector<ProgramImpact[]> {
  const eligible = eligibleCount(filters);
  if (eligible < K_ANON) return suppressed(eligible);
  const rand = seedFor(filters, "programs");
  const active = filters.programs.length > 0 ? filters.programs : PROGRAMS;
  const data = active.map((name) => {
    const cohort = Math.round(eligible * (0.05 + rand() * 0.12));
    return {
      name,
      enrolledPct: Math.round(4 + rand() * 12),
      completedPct: Math.round(40 + rand() * 45),
      moodDelta: Math.round((rand() * 14 - 2) * 10) / 10,
      cohort,
    };
  });
  return { data, sampleSize: eligible, isSuppressed: false };
}

// ─── Combination guard ─────────────────────────────────────────
// True when the current filter combination would resolve to <K students.
// The FilterBar uses this to disable dangerous toggles before they commit.
export function wouldBreachAnonymity(f: Filters): boolean {
  return eligibleCount(f) < K_ANON;
}
