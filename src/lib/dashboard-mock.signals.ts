// Wellbeing signals mock data. Follows the sibling pattern established by
// dashboard-mock.departments.ts — keeps the executive snapshot untouched
// while providing everything /signals/wellbeing needs. Same seam contract:
// replace `getSignalsSnapshot()` with a fetch when the backend lands.
//
// No student names, no IDs — only weekly aggregates, distributions,
// and rolled-up counts.
import { PHQ9_BANDS, GAD7_BANDS, type ScaleId, type BandKey } from "./clinical-scales";
import { getDepartmentInsights } from "./dashboard-mock.departments";

export type Segment = "inst" | "school" | "year";

// A weekly series row: one label + N named numeric series.
export type SeriesRow = { week: string } & Record<string, number | string>;

export type SeriesBundle = {
  data: SeriesRow[];
  keys: string[]; // e.g. ["Institution"] or ["Y1","Y2",...]
  n: number;      // active students represented
};

export type BandsPoint = { week: string } & Record<BandKey, number>;
export type BandsBundle = { data: BandsPoint[]; n: number };

export type FunnelStep = { key: string; label: string; n: number; note: string };
export type FunnelBundle = { steps: FunnelStep[]; n: number };

export type CadencePoint = { week: string; starts: number; medianMinutes: number };
export type CadenceBundle = { data: CadencePoint[]; n: number };

export type TodBundle = { grid: number[][]; n: number }; // [7][24]

export type CorrelationPoint = {
  deptId: string;
  deptName: string;
  n: number;
  phq9Avg: number;
  gad7Avg: number;
  engagementPct: number;
  sessionFreq: number;   // sessions per active student per week
  sustainedPct: number;
  phq9Delta: number;     // 6-week delta (negative = improvement)
};

export type SignalAlert = {
  id: string;
  severity: "info" | "attention" | "watch";
  headline: string;
  sub: string;
  sparkline: number[];
  linkSearch: { range?: string; scale?: string; seg?: string; band?: string };
};

export interface SignalsSnapshot {
  asOf: string;
  weeks: number;                                    // 52
  weekLabels: string[];                             // W1..W52
  // Institution / per-school / per-year 52-week weekly means.
  phq9Series: {
    inst: number[];
    school: Record<string, number[]>;
    year:   Record<string, number[]>;
  };
  gad7Series: {
    inst: number[];
    school: Record<string, number[]>;
    year:   Record<string, number[]>;
  };
  // 52-week counts per PHQ-9 severity band.
  severityBandsPhq9: Record<BandKey, number[]>;
  severityBandsGad7: Record<BandKey, number[]>;
  // Weekly denominator so counts translate to shares safely.
  activeByWeek: number[];
  sessionCadence: CadencePoint[];                   // 52 rows
  todHeatmap: number[][];                           // [7][24]
  // Improvement funnel is windowed → computed per-range in the selector.
  screenedByWeek: number[];
  elevatedByWeek: number[];
  engagedByWeek: number[];
  reassessedByWeek: number[];
  improvedByWeek: number[];
  deptCorrelationPoints: CorrelationPoint[];        // n >= 10 only
  signalAlerts: SignalAlert[];
}

const SCHOOLS = ["Engineering", "Humanities & Sciences", "Management"] as const;
const YEARS = ["Y1", "Y2", "Y3", "Y4", "PG"] as const;

// ─── Deterministic PRNG ────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0x5369676e); // "Sign"
const r = (base: number, spread: number) => base + (rand() - 0.5) * spread;
const round1 = (v: number) => Math.round(v * 10) / 10;
const nRound = (v: number) => Math.max(0, Math.round(v));

// ─── Series builders ───────────────────────────────────────────
function buildScaleSeries(base: number, drift: number, weeks: number, jitter: number): number[] {
  // Smooth downward-drifting series with mild seasonality (exam weeks).
  return Array.from({ length: weeks }, (_, i) => {
    const season = Math.sin((i / weeks) * Math.PI * 2) * 0.8;         // annual wave
    const midterm = i % 13 === 12 ? 1.2 : 0;                          // exam bump
    const v = base + drift * i + season + midterm + (rand() - 0.5) * jitter;
    return round1(Math.max(0, v));
  });
}

// ─── Snapshot ──────────────────────────────────────────────────
let snapshotCache: SignalsSnapshot | null = null;
export function getSignalsSnapshot(): SignalsSnapshot {
  if (snapshotCache) return snapshotCache;
  const weeks = 52;
  const weekLabels = Array.from({ length: weeks }, (_, i) => `W${i + 1}`);

  const phq9Inst = buildScaleSeries(8.4, -0.02, weeks, 1.2);
  const gad7Inst = buildScaleSeries(6.9, -0.015, weeks, 1.0);

  const phq9School: Record<string, number[]> = {};
  const gad7School: Record<string, number[]> = {};
  const schoolBase: Record<string, [number, number]> = {
    "Engineering":            [9.1, 7.4],
    "Humanities & Sciences":  [7.8, 6.3],
    "Management":             [8.0, 6.7],
  };
  for (const s of SCHOOLS) {
    phq9School[s] = buildScaleSeries(schoolBase[s][0], -0.02, weeks, 1.4);
    gad7School[s] = buildScaleSeries(schoolBase[s][1], -0.015, weeks, 1.1);
  }

  const phq9Year: Record<string, number[]> = {};
  const gad7Year: Record<string, number[]> = {};
  const yearBase: Record<string, [number, number]> = {
    Y1: [9.2, 7.6],
    Y2: [8.6, 7.1],
    Y3: [8.1, 6.7],
    Y4: [9.0, 7.5],
    PG: [7.5, 6.2],
  };
  for (const y of YEARS) {
    phq9Year[y] = buildScaleSeries(yearBase[y][0], -0.02, weeks, 1.4);
    gad7Year[y] = buildScaleSeries(yearBase[y][1], -0.015, weeks, 1.1);
  }

  // Weekly active-student denominator, gently growing over the year.
  const activeByWeek = Array.from({ length: weeks }, (_, i) =>
    nRound(r(7900 + i * 6, 260)),
  );

  // Severity band counts per week. Sum ≈ activeByWeek[i]. Bands shift a
  // little worse mid-year, then improve toward the end. Same shape reused
  // for GAD-7 but with 4 bands (severe absorbs modsevere).
  const severityBandsPhq9: Record<BandKey, number[]> = {
    minimal:   [], mild: [], moderate: [], modsevere: [], severe: [],
  };
  const severityBandsGad7: Record<BandKey, number[]> = {
    minimal:   [], mild: [], moderate: [], modsevere: [], severe: [],
  };
  for (let i = 0; i < weeks; i++) {
    const total = activeByWeek[i];
    const stress = Math.sin((i / weeks) * Math.PI * 2) * 0.06;         // ±6% shift
    const midterm = i % 13 === 12 ? 0.03 : 0;
    const shares = {
      minimal:   Math.max(0.28, 0.48 - stress - midterm + (rand() - 0.5) * 0.02),
      mild:      Math.max(0.18, 0.24 + (rand() - 0.5) * 0.02),
      moderate:  Math.max(0.10, 0.15 + stress + midterm * 0.5 + (rand() - 0.5) * 0.02),
      modsevere: Math.max(0.03, 0.09 + stress * 0.7 + midterm * 0.3 + (rand() - 0.5) * 0.015),
      severe:    Math.max(0.01, 0.04 + stress * 0.4 + (rand() - 0.5) * 0.01),
    } as Record<BandKey, number>;
    const sum = shares.minimal + shares.mild + shares.moderate + shares.modsevere + shares.severe;
    for (const b of PHQ9_BANDS) {
      severityBandsPhq9[b.key].push(nRound((shares[b.key] / sum) * total));
    }
    // GAD-7: collapse modsevere into severe.
    const gadShares = {
      minimal: shares.minimal + 0.03,
      mild: shares.mild - 0.01,
      moderate: shares.moderate,
      modsevere: 0,
      severe: shares.modsevere + shares.severe - 0.02,
    } as Record<BandKey, number>;
    const gsum = gadShares.minimal + gadShares.mild + gadShares.moderate + gadShares.severe;
    for (const b of GAD7_BANDS) {
      severityBandsGad7[b.key].push(nRound((gadShares[b.key] / gsum) * total));
    }
    severityBandsGad7.modsevere.push(0); // keep parallel shape for typing
  }

  // Weekly session cadence. Sessions rise around midterms and finals.
  const sessionCadence: CadencePoint[] = Array.from({ length: weeks }, (_, i) => {
    const finals = i % 13 === 12 ? 1.32 : 1;
    const startsBase = 980 * finals;
    return {
      week: weekLabels[i],
      starts: nRound(r(startsBase, 140)),
      medianMinutes: nRound(r(38 - (i % 13 === 12 ? 3 : 0), 4)),
    };
  });

  // Time-of-day heatmap over the last 12 weeks (7 × 24). Evenings + Sunday
  // late-night peaks; near-zero 2–6 AM.
  const todHeatmap: number[][] = [];
  for (let day = 0; day < 7; day++) {
    const row: number[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const evening = Math.exp(-((hour - 21) ** 2) / 20);
      const lunch = Math.exp(-((hour - 13) ** 2) / 6) * 0.35;
      const dead = hour >= 2 && hour <= 6 ? 0.06 : 1;
      const weekendBoost = day === 0 || day === 6 ? 1.25 : 1;
      const sundayNight = day === 0 && hour >= 20 ? 1.2 : 1;
      const v = (evening + lunch) * weekendBoost * sundayNight * dead * 160;
      row.push(nRound(r(v, v * 0.35)));
    }
    todHeatmap.push(row);
  }

  // Improvement funnel weekly counts. Screened → Elevated → Engaged →
  // Reassessed → Improved. Selector will sum over a window.
  const screenedByWeek: number[] = [];
  const elevatedByWeek: number[] = [];
  const engagedByWeek: number[] = [];
  const reassessedByWeek: number[] = [];
  const improvedByWeek: number[] = [];
  for (let i = 0; i < weeks; i++) {
    const screened = nRound(r(720, 90));
    const elevated = nRound(screened * (0.28 + (rand() - 0.5) * 0.04));
    const engaged = nRound(elevated * (0.62 + (rand() - 0.5) * 0.06));
    const reassessed = nRound(engaged * (0.71 + (rand() - 0.5) * 0.06));
    const improved = nRound(reassessed * (0.48 + (rand() - 0.5) * 0.06));
    screenedByWeek.push(screened);
    elevatedByWeek.push(elevated);
    engagedByWeek.push(engaged);
    reassessedByWeek.push(reassessed);
    improvedByWeek.push(improved);
  }

  // Correlation points — one per department, aggregate only, N≥10.
  const depts = getDepartmentInsights().filter((d) => d.n >= 10);
  const deptCorrelationPoints: CorrelationPoint[] = depts.map((d) => {
    const phq9Avg = round1(
      d.phq9Series.slice(-12).reduce((s, v) => s + v, 0) / 12,
    );
    const gad7Avg = round1(
      d.gad7Series.slice(-12).reduce((s, v) => s + v, 0) / 12,
    );
    const engagementPct = Math.round((d.funnel.active_30d / Math.max(1, d.invited)) * 1000) / 10;
    const sessionFreq = round1((d.n * 0.42 + (rand() - 0.5) * 0.4) / d.n * 4); // ~sessions/wk per active
    const sustainedPct = Math.round((d.funnel.sustained / Math.max(1, d.funnel.active_30d)) * 1000) / 10;
    const phq9Delta = round1(d.phq9Series[d.phq9Series.length - 1] - d.phq9Series[d.phq9Series.length - 7]);
    return {
      deptId: d.id, deptName: d.name, n: d.n,
      phq9Avg, gad7Avg, engagementPct, sessionFreq,
      sustainedPct, phq9Delta,
    };
  });

  const signalAlerts: SignalAlert[] = [
    {
      id: "y2-jump",
      severity: "attention",
      headline: "Y2 PHQ-9 rose 1.8 points over the last 2 weeks",
      sub: "N = 142 · likely mid-semester load. Consider a check-in prompt on the Y2 cohort.",
      sparkline: [7.9, 8.0, 8.2, 8.4, 8.6, 9.1, 9.7],
      linkSearch: { range: "4w", scale: "phq9", seg: "year" },
    },
    {
      id: "eng-engagement-drop",
      severity: "watch",
      headline: "Engineering engagement fell 12% over 12 weeks",
      sub: "Sustained-use share dropped from 38% to 26%. Review notification frequency and session slots.",
      sparkline: [38, 36, 34, 32, 30, 28, 26],
      linkSearch: { range: "12w", seg: "school" },
    },
    {
      id: "moderate-share-up",
      severity: "attention",
      headline: "Moderate+ PHQ-9 share climbed from 22% to 27%",
      sub: "8-week trend. Sleep and academic stress dominate the concurrent theme mix.",
      sparkline: [22, 22, 23, 24, 25, 26, 27],
      linkSearch: { range: "12w", scale: "phq9", band: "moderate" },
    },
    {
      id: "reassessment-low",
      severity: "watch",
      headline: "Reassessment completion trailing at 41%",
      sub: "Below the 55% target. Y3 residents are the largest gap — a nudge campaign is a reasonable next step.",
      sparkline: [48, 47, 46, 44, 43, 42, 41],
      linkSearch: { range: "12w" },
    },
    {
      id: "y4-improvement",
      severity: "info",
      headline: "Y4 PHQ-9 median improved by 3 points post-break",
      sub: "N = 612 · sustained across four weeks of reassessments. Worth studying what worked.",
      sparkline: [10.6, 10.2, 9.6, 9.1, 8.5, 8.0, 7.6],
      linkSearch: { range: "12w", scale: "phq9", seg: "year" },
    },
    {
      id: "sunday-night-spike",
      severity: "info",
      headline: "Sunday 9–11 PM sessions doubled in the last 4 weeks",
      sub: "Consistent with pre-week anxiety patterns. Evening on-call capacity may need review.",
      sparkline: [120, 140, 160, 190, 220, 240, 260],
      linkSearch: { range: "4w" },
    },
  ];

  snapshotCache = {
    asOf: new Date().toISOString(),
    weeks, weekLabels,
    phq9Series: { inst: phq9Inst, school: phq9School, year: phq9Year },
    gad7Series: { inst: gad7Inst, school: gad7School, year: gad7Year },
    severityBandsPhq9, severityBandsGad7,
    activeByWeek,
    sessionCadence,
    todHeatmap,
    screenedByWeek, elevatedByWeek, engagedByWeek, reassessedByWeek, improvedByWeek,
    deptCorrelationPoints,
    signalAlerts,
  };
  return snapshotCache;
}
