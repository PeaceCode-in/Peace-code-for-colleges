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

// ─────────────────────────────────────────────────────────────
// Early Warning & Care Routing — aggregate mock data
// ─────────────────────────────────────────────────────────────
// System-level counts only. Never a per-student row, never a per-student
// risk score. All numbers are deterministic given a fixed seed so the
// preview is stable across renders. This whole block is aggregate, not
// case data — see clinical-scales.RISK_RULES for the tier definitions.
export type EwWindowKey = "7d" | "30d" | "90d" | "term";
export type EwSegment = "inst" | "school" | "year";

export const EW_WINDOWS: { key: EwWindowKey; label: string; weeks: number; days: number }[] = [
  { key: "7d",   label: "Last 7 days",  weeks: 1,  days: 7 },
  { key: "30d",  label: "Last 30 days", weeks: 4,  days: 30 },
  { key: "90d",  label: "Last 90 days", weeks: 13, days: 90 },
  { key: "term", label: "This term",    weeks: 16, days: 112 },
];

// Institution active-cohort baseline for percentage math.
const EW_ACTIVE_BASE = 8320;

export type RiskTierWeekly = {
  week: string; // "W-12".."W-1"
  elevated: number;
  high: number;
  item9: number;
  overdue: number;
};

export type RoutingFunnelStep = {
  key: "detected" | "nudged" | "resource" | "offered" | "accepted" | "completed";
  label: string;
  note: string;
  n: number;
};

export type TimeToContactBucket = {
  key: string;
  label: string; // "0–1h" etc
  n: number;
};

export type ChannelWeekly = {
  week: string;
  inApp: number;
  email: number;
  peer: number;
  counselor: number;
};

export type BottleneckCell = {
  tier: "elevated" | "high" | "item9" | "overdue";
  step: RoutingFunnelStep["key"];
  dropPct: number; // 0..100 — share of prior step that DID NOT progress
  n: number;       // sample size at prior step for this tier
};

export type SchoolResponseRow = {
  schoolId: string;
  schoolName: string;
  n: number;
  medianHours: number;
};

export type EarlyWarningAlert = {
  id: string;
  severity: "info" | "attention" | "watch";
  headline: string;
  sub: string;
  sparkline: number[];
};

export interface EarlyWarningSnapshot {
  asOf: string;
  window: EwWindowKey;
  activeCohort: number;
  // Institution + per-school + per-year risk-tier population 12-week series.
  riskTierSeries: {
    inst: RiskTierWeekly[];
    school: Record<string, RiskTierWeekly[]>;
    year: Record<string, RiskTierWeekly[]>;
  };
  // Care-routing funnel counts for the selected window.
  routingFunnel: RoutingFunnelStep[];
  // Time-to-first-contact histogram + benchmarks.
  timeToContact: {
    buckets: TimeToContactBucket[];
    medianHours: number;
    p90Hours: number;
    peerMedianHours: number;
  };
  // Weekly routing channel breakdown for the selected window.
  channelBreakdown: ChannelWeekly[];
  // Bottleneck matrix — tier × step drop-off %.
  bottleneckMatrix: BottleneckCell[];
  // Per-school response times (only n≥10).
  schoolResponseTimes: SchoolResponseRow[];
  // Reassessment adherence for elevated/high tier.
  reassessmentAdherence: {
    within28d: number;
    total: number;
    priorPct: number;
  };
  // System health chips.
  sla24h: { withinPct: number; n: number };
  coverageGap: { hourFrom: number; hourTo: number; responseRate: number };
  // Alerts feed.
  alerts: EarlyWarningAlert[];
}

const EW_SCHOOLS: { id: string; name: string; weight: number; medianHoursBase: number }[] = [
  { id: "eng", name: "Engineering",                 weight: 0.34, medianHoursBase: 18.6 },
  { id: "hss", name: "Humanities & Social Sciences", weight: 0.22, medianHoursBase: 12.4 },
  { id: "mgt", name: "Management",                  weight: 0.18, medianHoursBase: 22.1 },
  { id: "nsc", name: "Natural Sciences",            weight: 0.16, medianHoursBase: 15.3 },
  { id: "des", name: "Design",                      weight: 0.10, medianHoursBase: 10.8 },
];

const EW_YEARS: { id: string; weight: number; tilt: number }[] = [
  { id: "Y1", weight: 0.24, tilt:  1.10 },
  { id: "Y2", weight: 0.23, tilt:  1.04 },
  { id: "Y3", weight: 0.20, tilt:  0.96 },
  { id: "Y4", weight: 0.19, tilt:  1.12 },
  { id: "PG", weight: 0.14, tilt:  0.92 },
];

// Deterministic PRNG dedicated to the early-warning surface so its numbers
// never drift when other tiles are edited.
const ewRand = mulberry32(0x45574e21); // "EWN!"
function ewR(base: number, spread: number) { return base + (ewRand() - 0.5) * spread; }
function ewInt(v: number) { return Math.max(0, Math.round(v)); }

function tierBaseFor(activeN: number, tier: "elevated" | "high" | "item9" | "overdue", tilt = 1): number {
  // Rough institutional shares of the active cohort per tier.
  const share =
    tier === "elevated" ? 0.088 :
    tier === "high"     ? 0.032 :
    tier === "item9"    ? 0.014 :
    /* overdue */         0.061;
  return activeN * share * tilt;
}

function makeRiskWeekly(activeN: number, tilt = 1): RiskTierWeekly[] {
  return Array.from({ length: 12 }, (_, i) => {
    const drift = 1 + (i - 6) * 0.012; // gentle rise
    return {
      week: `W-${12 - i}`,
      elevated: ewInt(ewR(tierBaseFor(activeN, "elevated", tilt) * drift, tierBaseFor(activeN, "elevated", tilt) * 0.12)),
      high:     ewInt(ewR(tierBaseFor(activeN, "high",     tilt) * drift, tierBaseFor(activeN, "high",     tilt) * 0.16)),
      item9:    ewInt(ewR(tierBaseFor(activeN, "item9",    tilt) * drift, tierBaseFor(activeN, "item9",    tilt) * 0.28)),
      overdue:  ewInt(ewR(tierBaseFor(activeN, "overdue",  tilt) * drift, tierBaseFor(activeN, "overdue",  tilt) * 0.10)),
    };
  });
}

function makeChannels(weeks: number): ChannelWeekly[] {
  return Array.from({ length: weeks }, (_, i) => {
    const base = EW_ACTIVE_BASE * 0.06; // ~roughly interventions/week
    return {
      week: `W-${weeks - i}`,
      inApp:     ewInt(ewR(base * 0.52, base * 0.10)),
      email:     ewInt(ewR(base * 0.22, base * 0.08)),
      peer:      ewInt(ewR(base * 0.14, base * 0.06)),
      counselor: ewInt(ewR(base * 0.12, base * 0.05)),
    };
  });
}

function windowDays(w: EwWindowKey): number {
  return EW_WINDOWS.find((x) => x.key === w)!.days;
}
function windowWeeks(w: EwWindowKey): number {
  return EW_WINDOWS.find((x) => x.key === w)!.weeks;
}

function makeFunnel(w: EwWindowKey): RoutingFunnelStep[] {
  const days = windowDays(w);
  const detected = ewInt(ewR(days * 12.6, days * 1.8));           // ~aggregate detections per day
  const nudged   = ewInt(detected * ewR(0.86, 0.05));
  const resource = ewInt(nudged   * ewR(0.62, 0.06));
  const offered  = ewInt(resource * ewR(0.58, 0.07));
  const accepted = ewInt(offered  * ewR(0.66, 0.06));
  const completed= ewInt(accepted * ewR(0.71, 0.05));
  return [
    { key: "detected",  label: "Detected",            note: "Aggregate rule match",          n: detected },
    { key: "nudged",    label: "In-app nudge sent",   note: "Auto-generated by the app",     n: nudged },
    { key: "resource",  label: "Resource opened",     note: "Self-serve module engaged",     n: resource },
    { key: "offered",   label: "Counselor slot offered", note: "Slot proposed in-app",      n: offered },
    { key: "accepted",  label: "Slot accepted",       note: "Student confirmed",             n: accepted },
    { key: "completed", label: "Session completed",   note: "Attended first session",        n: completed },
  ];
}

function makeTimeToContact() {
  // Bucket counts favour 4–24h.
  const buckets: TimeToContactBucket[] = [
    { key: "0-1",   label: "0–1h",  n: ewInt(ewR( 34, 6)) },
    { key: "1-4",   label: "1–4h",  n: ewInt(ewR( 92, 10)) },
    { key: "4-12",  label: "4–12h", n: ewInt(ewR(148, 12)) },
    { key: "12-24", label: "12–24h",n: ewInt(ewR(112, 10)) },
    { key: "24-48", label: "24–48h",n: ewInt(ewR( 68, 8)) },
    { key: "48+",   label: "48h+",  n: ewInt(ewR( 41, 6)) },
  ];
  return {
    buckets,
    medianHours: 8.6,
    p90Hours: 34.4,
    peerMedianHours: 12.2,
  };
}

function makeBottlenecks(): BottleneckCell[] {
  const tiers: ("elevated" | "high" | "item9" | "overdue")[] = ["elevated", "high", "item9", "overdue"];
  const steps: RoutingFunnelStep["key"][] = ["detected", "nudged", "resource", "offered", "accepted", "completed"];
  const out: BottleneckCell[] = [];
  for (const tier of tiers) {
    let prev = ewInt(ewR(tierBaseFor(EW_ACTIVE_BASE, tier) * 4, tierBaseFor(EW_ACTIVE_BASE, tier)));
    for (const step of steps) {
      const dropBase =
        step === "detected" ? 0 :
        step === "nudged"   ? 8 :
        step === "resource" ? 34 :
        step === "offered"  ? 40 :
        step === "accepted" ? 30 :
        22;
      // Slight tier tilt — item9 has better routing, overdue has worst reassessment.
      const tilt = tier === "item9" ? -6 : tier === "overdue" ? 6 : tier === "high" ? -2 : 0;
      const dropPct = Math.max(0, Math.min(80, dropBase + tilt + ewR(0, 6)));
      // Force a demo-visible suppressed cell.
      const n = (tier === "item9" && step === "completed") ? 6 : prev;
      out.push({ tier, step, dropPct: Math.round(dropPct * 10) / 10, n });
      prev = ewInt(prev * (1 - dropPct / 100));
    }
  }
  return out;
}

function makeSchoolResponseTimes(): SchoolResponseRow[] {
  return EW_SCHOOLS.map((s) => {
    const n = ewInt(EW_ACTIVE_BASE * s.weight * 0.045);
    const jitter = ewR(0, 3);
    return {
      schoolId: s.id,
      schoolName: s.name,
      n,
      medianHours: Math.round((s.medianHoursBase + jitter) * 10) / 10,
    };
  }).filter((r) => r.n >= 10);
}

function makeAlerts(): EarlyWarningAlert[] {
  const spark = (base: number, spread: number) =>
    Array.from({ length: 12 }, (_, i) => Math.round(ewR(base + i * 0.1, spread) * 10) / 10);
  return [
    { id: "a1", severity: "attention", headline: "Item-9 flag rate rose to 3.1% in Y2 (N=142)", sub: "Up 0.7pt WoW · aggregate only, no individuals surfaced", sparkline: spark(2.4, 0.4) },
    { id: "a2", severity: "watch",     headline: "Counselor-slot acceptance dropped 14% in Engineering", sub: "Prior 4w median 61% → 47% (N=318 offers)", sparkline: spark(60, 6) },
    { id: "a3", severity: "info",      headline: "In-app nudges converted 6pt higher than email in Y1", sub: "26% vs 20% resource-open rate, N=1,240 nudges", sparkline: spark(24, 2) },
    { id: "a4", severity: "attention", headline: "Overdue-reassessment tier grew to 507 students", sub: "Up 42 WoW · Humanities & Design lead the increase", sparkline: spark(460, 20) },
    { id: "a5", severity: "watch",     headline: "Median time-to-first-contact climbed to 8.6h", sub: "Peer benchmark: 12.2h · still under SLA, trend upward", sparkline: spark(7, 1) },
    { id: "a6", severity: "info",      headline: "Reassessment completion holding at 71% within 28d", sub: "Elevated/High tier · aggregate only", sparkline: spark(70, 2) },
  ];
}

let ewSnapshotCache: Record<EwWindowKey, EarlyWarningSnapshot> = {} as Record<EwWindowKey, EarlyWarningSnapshot>;

export function getEarlyWarningSnapshot(window: EwWindowKey): EarlyWarningSnapshot {
  if (ewSnapshotCache[window]) return ewSnapshotCache[window];

  const instSeries = makeRiskWeekly(EW_ACTIVE_BASE);
  const schoolSeries: Record<string, RiskTierWeekly[]> = {};
  for (const s of EW_SCHOOLS) {
    schoolSeries[s.id] = makeRiskWeekly(EW_ACTIVE_BASE * s.weight);
  }
  const yearSeries: Record<string, RiskTierWeekly[]> = {};
  for (const y of EW_YEARS) {
    yearSeries[y.id] = makeRiskWeekly(EW_ACTIVE_BASE * y.weight, y.tilt);
  }

  const funnel = makeFunnel(window);
  const channelBreakdown = makeChannels(windowWeeks(window));
  const bottlenecks = makeBottlenecks();
  const responseTimes = makeSchoolResponseTimes();

  const within28d = ewInt(EW_ACTIVE_BASE * 0.072);
  const total = ewInt(within28d / 0.71);

  const snap: EarlyWarningSnapshot = {
    asOf: new Date().toISOString(),
    window,
    activeCohort: EW_ACTIVE_BASE,
    riskTierSeries: {
      inst: instSeries,
      school: schoolSeries,
      year: yearSeries,
    },
    routingFunnel: funnel,
    timeToContact: makeTimeToContact(),
    channelBreakdown,
    bottleneckMatrix: bottlenecks,
    schoolResponseTimes: responseTimes,
    reassessmentAdherence: {
      within28d,
      total,
      priorPct: 68.4,
    },
    sla24h:      { withinPct: 82.4, n: ewInt(EW_ACTIVE_BASE * 0.032) },
    coverageGap: { hourFrom: 2, hourTo: 6, responseRate: 0.31 },
    alerts: makeAlerts(),
  };

  ewSnapshotCache = { ...ewSnapshotCache, [window]: snap };
  return snap;
}

export const EW_SCHOOL_META = EW_SCHOOLS;
export const EW_YEAR_META = EW_YEARS;

