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
