// Executive dashboard mock data. This is the SINGLE seam between the UI
// and the (eventual) Spring Boot backend. Every number rendered by the
// dashboard flows through getExecutiveSnapshot(). Swap the body of this
// function for a fetch() call and the UI does not need to change.
//
// No student names, no emails, no IDs live here — only rolled-up counts.
import { suppressIfSmall, type Suppressed } from "./anonymity";

// ─── Enumerations ──────────────────────────────────────────────
export const CONCERN_TAGS = [
  "Academic stress",
  "Sleep",
  "Relationships",
  "Financial",
  "Career anxiety",
  "Loneliness",
  "Family",
  "Substance",
  "Body image",
  "Identity",
] as const;
export type ConcernTag = (typeof CONCERN_TAGS)[number];

// ─── Types ─────────────────────────────────────────────────────
export type TrendPoint = { week: string; overall: number; firstYear: number; finalYear: number };
export type DeptRow = { slug: string; name: string; participationPct: number; n: number };
export type FunnelStage = { key: string; label: string; n: number | Suppressed };
export type ConcernRow = { tag: ConcernTag; n: number | Suppressed };
export type HeatCell = { day: number; hour: number; n: number };
export type SeverityBucket = { key: "low" | "medium" | "high"; label: string; n: number | Suppressed };

export interface ExecutiveSnapshot {
  asOf: string;
  enrolledTotal: number;
  wellnessIndex: {
    current: number;
    deltaVsLastWeek: number;
    checkInsThisWeek: number;
    sparkline: number[]; // last 12 weeks, 0–100
  };
  activeStudents: {
    n: number;
    ofTotal: number;
    trendDeltaPct: number;
  };
  crisisSignals: {
    total: number;
    severity: SeverityBucket[];
    highActive: boolean;
  };
  sessionsThisWeek: {
    n: number;
    deltaPct: number;
    lastSevenDays: number[];
  };
  avgMood: {
    score: number; // 0–10
    responses: number;
    deltaPts: number;
  };
  departments: DeptRow[];
  wellnessTrend: TrendPoint[];
  riskFunnel: FunnelStage[];
  concerns: ConcernRow[];
  engagement: HeatCell[]; // day 0..6, hour 0..11 (2-hour buckets)
}

// ─── Deterministic PRNG so previews are stable ─────────────────
function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0x50656143); // "PeaC"
function around(base: number, spread: number) { return base + (rand() - 0.5) * spread; }
function nRound(v: number) { return Math.max(0, Math.round(v)); }

// ─── Generator ─────────────────────────────────────────────────
export function getExecutiveSnapshot(): ExecutiveSnapshot {
  const enrolledTotal = 12480;

  // 12-week wellness index sparkline: gentle noise around 70.
  const sparkline = Array.from({ length: 12 }, (_, i) => Math.round(around(66 + i * 0.3, 6)));
  const current = sparkline[sparkline.length - 1];
  const prev = sparkline[sparkline.length - 2];
  const checkInsThisWeek = nRound(around(7420, 400));

  const activeN = nRound(around(8320, 220));
  const sessions = nRound(around(1180, 120));
  const lastSevenDays = Array.from({ length: 7 }, () => nRound(around(sessions / 7, sessions / 20)));

  // Crisis severity: keep buckets healthy so they don't collide with the
  // anonymity floor, then hand each through suppressIfSmall so a real
  // pipeline that happens to return a tiny bucket is still safe.
  const low = nRound(around(72, 12));
  const medium = nRound(around(24, 8));
  const high = nRound(around(8, 6));
  const crisisTotal = low + medium + high;
  const severity: SeverityBucket[] = [
    { key: "low",    label: "Low",    n: suppressIfSmall(low, low) },
    { key: "medium", label: "Medium", n: suppressIfSmall(medium, medium) },
    { key: "high",   label: "High",   n: suppressIfSmall(high, high) },
  ];

  const deptDefs: [string, string][] = [
    ["cs", "Computer Sci"],
    ["ee", "Electrical Eng"],
    ["me", "Mechanical Eng"],
    ["hu", "Humanities"],
    ["mg", "Management"],
    ["ds", "Design"],
    ["ph", "Physics"],
    ["ma", "Mathematics"],
  ];
  const departments: DeptRow[] = deptDefs.map(([slug, name]) => {
    const n = nRound(around(1180, 260));
    return { slug, name, n, participationPct: Math.round(around(64, 22)) };
  }).sort((a, b) => b.participationPct - a.participationPct);

  const wellnessTrend: TrendPoint[] = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    overall:   Math.round(around(68 + i * 0.35, 4)),
    firstYear: Math.round(around(62 + i * 0.28, 6)),
    finalYear: Math.round(around(72 + i * 0.2,  4)),
  }));

  const funnelN = [
    nRound(around(8320, 220)), // checked in
    nRound(around(1620, 120)), // flagged
    nRound(around(640, 80)),   // referred
    nRound(around(310, 40)),   // in care
  ];
  const funnelLabels = ["Checked in", "Flagged", "Referred", "In active care"];
  const riskFunnel: FunnelStage[] = funnelN.map((n, i) => ({
    key: funnelLabels[i].toLowerCase().replace(/\s+/g, "_"),
    label: funnelLabels[i],
    n: suppressIfSmall(n, n),
  }));

  const concerns: ConcernRow[] = CONCERN_TAGS.map((tag) => {
    const n = nRound(around(560, 620));
    return { tag, n: suppressIfSmall(n, n) };
  }).sort((a, b) => {
    const av = typeof a.n === "number" ? a.n : -1;
    const bv = typeof b.n === "number" ? b.n : -1;
    return bv - av;
  });

  // Engagement heatmap: 7 days × 12 two-hour buckets, peaks in the evening.
  const engagement: HeatCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 12; hour++) {
      // hour bucket index 0 = 6–8am, 11 = 2–4am. Peak around index 7–9 (8pm–2am).
      const peak = Math.exp(-((hour - 8) ** 2) / 8);
      const weekend = day === 5 || day === 6 ? 1.15 : 1;
      const n = nRound(around(80 * peak * weekend + 12, 22));
      engagement.push({ day, hour, n });
    }
  }

  return {
    asOf: new Date().toISOString(),
    enrolledTotal,
    wellnessIndex: {
      current,
      deltaVsLastWeek: Math.round((current - prev) * 10) / 10,
      checkInsThisWeek,
      sparkline,
    },
    activeStudents: {
      n: activeN,
      ofTotal: enrolledTotal,
      trendDeltaPct: Math.round(around(2.1, 2) * 10) / 10,
    },
    crisisSignals: {
      total: crisisTotal,
      severity,
      highActive: high > 0,
    },
    sessionsThisWeek: {
      n: sessions,
      deltaPct: Math.round(around(4.6, 3) * 10) / 10,
      lastSevenDays,
    },
    avgMood: {
      score: Math.round(around(6.8, 0.6) * 10) / 10,
      responses: nRound(around(4820, 200)),
      deltaPts: Math.round(around(0.2, 0.4) * 10) / 10,
    },
    departments,
    wellnessTrend,
    riskFunnel,
    concerns,
    engagement,
  };
}

// ─── Demographics cube ────────────────────────────────────────
// A precomputed 5-dim aggregate over year × gender × residency ×
// first-gen × aid-tier. Every cell carries a small realistic sample
// size — some intersections are deliberately below k=10 so the
// suppression path is visible in the demo. No student names or IDs
// live here; only rolled-up counts and averages.
export type DemoYear = "Y1" | "Y2" | "Y3" | "Y4" | "PG";
export type DemoGender = "Woman" | "Man" | "Non-binary" | "Prefer not to say";
export type DemoResidency = "On-campus" | "Off-campus" | "Commuter";
export type DemoGen1 = "Yes" | "No" | "Unknown";
export type DemoAid = "Full" | "Partial" | "None";

export interface DemoDims {
  year: DemoYear;
  gender: DemoGender;
  residency: DemoResidency;
  gen1: DemoGen1;
  aid: DemoAid;
}

export interface DemoCell {
  dims: DemoDims;
  n: number;
  phq9: number;               // 0-27, higher = worse
  gad7: number;               // 0-21, higher = worse
  engagement: number;         // 0-1, fraction 30-day active
  improvement6w: number;      // signed PHQ-9 delta (negative = better)
  themes: { tag: string; weight: number }[];
  phq9Series: number[];       // 26-week
  gad7Series: number[];
  phq9Dist: number[];         // 6 bins across 0-27 → fractions summing ~1
}

const DEMO_YEARS: DemoYear[] = ["Y1", "Y2", "Y3", "Y4", "PG"];
const DEMO_GENDERS: DemoGender[] = ["Woman", "Man", "Non-binary", "Prefer not to say"];
const DEMO_RES: DemoResidency[] = ["On-campus", "Off-campus", "Commuter"];
const DEMO_GEN1: DemoGen1[] = ["Yes", "No", "Unknown"];
const DEMO_AID: DemoAid[] = ["Full", "Partial", "None"];

const DEMO_THEMES = [
  "Academic stress", "Sleep", "Relationships", "Financial",
  "Career anxiety", "Loneliness", "Family", "Identity",
] as const;

// Realistic marginal weights so the cube adds up to ~12,480.
const YEAR_W:   Record<DemoYear, number>     = { Y1: 0.24, Y2: 0.23, Y3: 0.20, Y4: 0.19, PG: 0.14 };
const GENDER_W: Record<DemoGender, number>   = { Woman: 0.44, Man: 0.48, "Non-binary": 0.03, "Prefer not to say": 0.05 };
const RES_W:    Record<DemoResidency, number>= { "On-campus": 0.52, "Off-campus": 0.32, Commuter: 0.16 };
const GEN1_W:   Record<DemoGen1, number>     = { Yes: 0.22, No: 0.66, Unknown: 0.12 };
const AID_W:    Record<DemoAid, number>      = { Full: 0.18, Partial: 0.34, None: 0.48 };

// Signed offsets applied to a base PHQ-9 of ~7.5 (mild).
const YEAR_PHQ_OFFSET:  Record<DemoYear, number>     = { Y1: 1.4, Y2: 0.6, Y3: -0.2, Y4: 1.8, PG: -0.4 };
const GEN1_PHQ_OFFSET:  Record<DemoGen1, number>     = { Yes: 0.9, No: -0.2, Unknown: 0.4 };
const AID_PHQ_OFFSET:   Record<DemoAid, number>      = { Full: -0.3, Partial: 0.5, None: 0.1 };
const RES_PHQ_OFFSET:   Record<DemoResidency, number>= { "On-campus": 0.0, "Off-campus": 0.3, Commuter: 0.8 };
const GENDER_PHQ_OFFSET:Record<DemoGender, number>   = { Woman: 0.6, Man: -0.4, "Non-binary": 1.3, "Prefer not to say": 0.9 };

function cellRand(dims: DemoDims): () => number {
  // Deterministic per-cell PRNG so previews are stable.
  const seed =
    hashStr(dims.year) * 31 +
    hashStr(dims.gender) * 37 +
    hashStr(dims.residency) * 41 +
    hashStr(dims.gen1) * 43 +
    hashStr(dims.aid) * 47;
  let s = (seed | 0) + 0x9e3779b9;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

let cubeCache: DemoCell[] | null = null;
export function getDemographicsCube(): DemoCell[] {
  if (cubeCache) return cubeCache;
  const totalEnrolled = 12480;
  const cells: DemoCell[] = [];

  for (const year of DEMO_YEARS)
  for (const gender of DEMO_GENDERS)
  for (const residency of DEMO_RES)
  for (const gen1 of DEMO_GEN1)
  for (const aid of DEMO_AID) {
    const dims: DemoDims = { year, gender, residency, gen1, aid };
    const rnd = cellRand(dims);
    const marginal =
      YEAR_W[year] * GENDER_W[gender] * RES_W[residency] * GEN1_W[gen1] * AID_W[aid];
    // Jitter ±25% so the cube isn't perfectly separable.
    const jitter = 0.75 + rnd() * 0.5;
    let n = Math.round(totalEnrolled * marginal * jitter);

    // Push a few thin intersections below the anonymity floor on purpose.
    const isThin =
      (gender === "Non-binary" && (residency === "Commuter" || aid === "Full")) ||
      (gender === "Prefer not to say" && year === "PG") ||
      (gen1 === "Unknown" && gender === "Non-binary");
    if (isThin) n = Math.max(1, Math.round(n * 0.18));

    const basePhq9 = clamp(
      7.5 +
        YEAR_PHQ_OFFSET[year] +
        GENDER_PHQ_OFFSET[gender] +
        RES_PHQ_OFFSET[residency] +
        GEN1_PHQ_OFFSET[gen1] +
        AID_PHQ_OFFSET[aid] +
        (rnd() - 0.5) * 1.4,
      1.5,
      18,
    );
    const baseGad7 = clamp(basePhq9 * 0.72 + (rnd() - 0.5) * 1.2, 1, 15);
    const engagement = clamp(0.44 + (rnd() - 0.5) * 0.28 - (aid === "None" ? 0.03 : 0), 0.1, 0.86);
    const improvement6w = clamp((rnd() - 0.6) * 1.6, -1.6, 1.2); // mostly slight improvement

    const phq9Series = Array.from({ length: 26 }, (_, i) => {
      const trend = -0.04 * i; // slight downward trend (improvement) over 26 weeks
      return round1(clamp(basePhq9 + trend + (rnd() - 0.5) * 0.9, 0, 24));
    });
    const gad7Series = Array.from({ length: 26 }, (_, i) => {
      const trend = -0.03 * i;
      return round1(clamp(baseGad7 + trend + (rnd() - 0.5) * 0.7, 0, 20));
    });

    // 6-bin histogram: 0-4, 5-9, 10-14, 15-19, 20-24, 25-27
    const dist = Array.from({ length: 6 }, (_, i) => {
      const centre = [2, 7, 12, 17, 22, 26][i];
      const w = Math.exp(-((centre - basePhq9) ** 2) / 22);
      return w;
    });
    const distSum = dist.reduce((a, b) => a + b, 0) || 1;
    const phq9Dist = dist.map((v) => Math.round((v / distSum) * 1000) / 1000);

    // Themes: pick 4-5 with weights tilted by year/gen1.
    const themes = DEMO_THEMES.map((tag) => {
      let w = 0.2 + rnd() * 0.6;
      if (tag === "Academic stress" && (year === "Y1" || year === "Y4")) w += 0.5;
      if (tag === "Financial" && aid !== "None") w += 0.35;
      if (tag === "Loneliness" && residency === "Commuter") w += 0.3;
      if (tag === "Career anxiety" && (year === "Y4" || year === "PG")) w += 0.4;
      if (tag === "Family" && gen1 === "Yes") w += 0.25;
      return { tag, weight: w };
    })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
    const tw = themes.reduce((s, t) => s + t.weight, 0) || 1;
    const normThemes = themes.map((t) => ({ tag: t.tag, weight: Math.round((t.weight / tw) * 1000) / 1000 }));

    cells.push({
      dims,
      n,
      phq9: round1(basePhq9),
      gad7: round1(baseGad7),
      engagement: Math.round(engagement * 100) / 100,
      improvement6w: round1(improvement6w),
      themes: normThemes,
      phq9Series,
      gad7Series,
      phq9Dist,
    });
  }

  cubeCache = cells;
  return cells;
}

function round1(v: number) { return Math.round(v * 10) / 10; }
