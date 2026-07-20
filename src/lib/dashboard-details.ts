// Rich drill-down data for each executive-dashboard tile. Every field is
// deterministic (mulberry32) so previews stay stable, aggregate-only
// (never a per-student row), and respects the k=5 anonymity floor
// applied by src/lib/anonymity.ts on the display side.
//
// The dashboard tiles read the executive snapshot for headline numbers;
// the detail sheets read this module for the extra context that appears
// once a card is expanded (30-day series, distributions, cohort splits,
// benchmarks, methodology notes, etc.).
import { getExecutiveSnapshot, type ExecutiveSnapshot } from "./dashboard-mock";

function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x44544c53); // "DTLS"
const r = (base: number, spread: number) => base + (rnd() - 0.5) * spread;
const ri = (base: number, spread: number) => Math.max(0, Math.round(r(base, spread)));

export type PulseDetail = {
  sparkline26w: number[];
  cohorts: { key: string; label: string; current: number; delta: number }[];
  drivers: { label: string; direction: "up" | "down"; weightPct: number; note: string }[];
  methodology: string;
};

export type ActiveDetail = {
  daily30: { day: string; n: number }[];
  activationBySchool: { school: string; activePct: number; n: number }[];
  activationByYear: { year: string; activePct: number }[];
  medianSessionsPerActive: number;
  cohortMovement: { newThisWeek: number; returning: number; churned: number };
};

export type CrisisDetail = {
  weekly12: { week: string; low: number; medium: number; high: number }[];
  responseHours: { severity: "low" | "medium" | "high"; medianH: number; p90H: number }[];
  channelSplit: { channel: string; n: number }[];
  escalationRate: number;
  aggregateNote: string;
};

export type SessionsDetail = {
  daily30: { day: string; n: number }[];
  modality: { key: string; label: string; n: number }[];
  avgLengthMin: number;
  medianLengthMin: number;
  noShowPct: number;
  reschedulePct: number;
  utilizationPct: number;
};

export type MoodDetail = {
  distribution: { bucket: string; n: number }[]; // 1-10
  weekly12: { week: string; mean: number; p25: number; p75: number }[];
  perDay: { day: string; mean: number }[];
  topContributors: { label: string; direction: "up" | "down"; pts: number }[];
};

export type DeptDetail = {
  rows: {
    slug: string;
    name: string;
    n: number;
    participationPct: number;
    wellnessIndex: number;
    riskFlagPct: number;
    sessionsWk: number;
    deltaVsPrior: number;
  }[];
};

export type TrendDetail = {
  extended26w: { week: string; overall: number; firstYear: number; finalYear: number }[];
  academicMarkers: { week: string; label: string }[];
  benchmarkPeer: number;
};

export type FunnelDetail = {
  stages: { key: string; label: string; n: number; conversion: number | null; median: string; benchmark: number | null; note: string }[];
  bottleneckKey: string;
  bottleneckNote: string;
};

export type ConcernsDetail = {
  perTag: {
    tag: string;
    n: number;
    deltaPct: number;
    trend12w: number[];
    topSchools: { school: string; sharePct: number }[];
  }[];
};

export type HeatmapDetail = {
  perDayTotals: { day: string; n: number }[];
  perHourTotals: { hour: string; n: number }[];
  peak: { day: string; hour: string; n: number };
  quiet: { day: string; hour: string; n: number };
  weekdayVsWeekendPct: { weekday: number; weekend: number };
};

export interface ExecutiveDetails {
  pulse: PulseDetail;
  active: ActiveDetail;
  crisis: CrisisDetail;
  sessions: SessionsDetail;
  mood: MoodDetail;
  departments: DeptDetail;
  trend: TrendDetail;
  funnel: FunnelDetail;
  concerns: ConcernsDetail;
  heatmap: HeatmapDetail;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABEL = (bucket: number) => {
  const startHour = (6 + bucket * 2) % 24;
  const fmt = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
  const endHour = (startHour + 2) % 24;
  return `${fmt(startHour)}–${fmt(endHour)}`;
};

let cache: ExecutiveDetails | null = null;

export function getExecutiveDetails(snap: ExecutiveSnapshot = getExecutiveSnapshot()): ExecutiveDetails {
  if (cache) return cache;

  // ─── Pulse ────────────────────────────────────────────────
  const sparkline26w = Array.from({ length: 26 }, (_, i) => Math.round(r(64 + i * 0.25, 6)));
  const pulse: PulseDetail = {
    sparkline26w,
    cohorts: [
      { key: "y1", label: "First-year", current: ri(66, 4), delta: +1.2 },
      { key: "y2", label: "Second-year", current: ri(70, 4), delta: +0.4 },
      { key: "y3", label: "Third-year", current: ri(72, 4), delta: -0.6 },
      { key: "y4", label: "Final-year", current: ri(69, 4), delta: -1.1 },
      { key: "pg", label: "Post-graduate", current: ri(74, 4), delta: +0.8 },
    ],
    drivers: [
      { label: "Sleep quality up in Y3–Y4", direction: "up", weightPct: 28, note: "3.4pt lift in reported hours WoW" },
      { label: "Financial stress cluster in aid-Full", direction: "down", weightPct: 22, note: "Term-fee window opens next week" },
      { label: "Session completions rose", direction: "up", weightPct: 19, note: "+8.4% vs prior week" },
      { label: "Academic stress in Y1 rising", direction: "down", weightPct: 17, note: "Mid-sem load correlated" },
      { label: "Peer connection metric flat", direction: "up", weightPct: 14, note: "Held vs prior 4-week mean" },
    ],
    methodology:
      "Composite of PHQ-9 improvement (35%), engagement recency (25%), self-report mood (20%), peer connection (10%), and inverse crisis flags (10%). Only cohorts with n ≥ 5 contribute.",
  };

  // ─── Active students ──────────────────────────────────────
  const activeBase = snap.activeStudents.n;
  const daily30: ActiveDetail["daily30"] = Array.from({ length: 30 }, (_, i) => {
    const dow = (i + 6) % 7;
    const weekend = dow === 5 || dow === 6 ? 0.85 : 1.0;
    const n = ri((activeBase / 7) * weekend, activeBase / 40);
    return { day: `D-${30 - i}`, n };
  });
  const active: ActiveDetail = {
    daily30,
    activationBySchool: [
      { school: "Engineering", activePct: ri(72, 4), n: ri(2860, 40) },
      { school: "Humanities & Social Sciences", activePct: ri(66, 4), n: ri(1820, 40) },
      { school: "Management", activePct: ri(63, 4), n: ri(1520, 40) },
      { school: "Natural Sciences", activePct: ri(70, 4), n: ri(1340, 40) },
      { school: "Design", activePct: ri(76, 4), n: ri(840, 30) },
    ],
    activationByYear: [
      { year: "Y1", activePct: ri(78, 4) },
      { year: "Y2", activePct: ri(71, 4) },
      { year: "Y3", activePct: ri(64, 4) },
      { year: "Y4", activePct: ri(68, 4) },
      { year: "PG", activePct: ri(72, 4) },
    ],
    medianSessionsPerActive: 2.4,
    cohortMovement: { newThisWeek: ri(412, 30), returning: ri(7280, 60), churned: ri(628, 40) },
  };

  // ─── Crisis ───────────────────────────────────────────────
  const weekly12: CrisisDetail["weekly12"] = Array.from({ length: 12 }, (_, i) => ({
    week: `W-${12 - i}`,
    low: ri(68 + i * 0.4, 12),
    medium: ri(22 + i * 0.2, 6),
    high: ri(7 + i * 0.1, 3),
  }));
  const crisis: CrisisDetail = {
    weekly12,
    responseHours: [
      { severity: "high", medianH: 0.6, p90H: 2.1 },
      { severity: "medium", medianH: 4.2, p90H: 12.4 },
      { severity: "low", medianH: 18.6, p90H: 42.2 },
    ],
    channelSplit: [
      { channel: "In-app crisis flow", n: ri(48, 6) },
      { channel: "Counselor escalation", n: ri(28, 4) },
      { channel: "Peer supporter", n: ri(16, 4) },
      { channel: "External hotline referral", n: ri(12, 3) },
    ],
    escalationRate: 0.34,
    aggregateNote:
      "Aggregate counts only — individual crisis records live in the clinical system. Times reflect first response from any staff channel.",
  };

  // ─── Sessions ─────────────────────────────────────────────
  const sessionsBase = snap.sessionsThisWeek.n;
  const sdaily30: SessionsDetail["daily30"] = Array.from({ length: 30 }, (_, i) => {
    const dow = (i + 6) % 7;
    const weekend = dow === 5 || dow === 6 ? 0.55 : 1.0;
    return { day: `D-${30 - i}`, n: ri((sessionsBase / 7) * weekend, sessionsBase / 30) };
  });
  const sessions: SessionsDetail = {
    daily30: sdaily30,
    modality: [
      { key: "1on1", label: "1-on-1 counselor", n: ri(sessionsBase * 0.44, 20) },
      { key: "group", label: "Group session", n: ri(sessionsBase * 0.18, 12) },
      { key: "self", label: "Self-guided module", n: ri(sessionsBase * 0.24, 14) },
      { key: "peer", label: "Peer supporter", n: ri(sessionsBase * 0.14, 10) },
    ],
    avgLengthMin: 42,
    medianLengthMin: 38,
    noShowPct: 8.4,
    reschedulePct: 12.1,
    utilizationPct: 74.2,
  };

  // ─── Mood ─────────────────────────────────────────────────
  const distribution: MoodDetail["distribution"] = Array.from({ length: 10 }, (_, i) => {
    const bucket = String(i + 1);
    const centre = 6.8;
    const weight = Math.exp(-((i + 1 - centre) ** 2) / 3.8);
    return { bucket, n: ri(snap.avgMood.responses * weight * 0.16, 30) };
  });
  const weekly12mood: MoodDetail["weekly12"] = Array.from({ length: 12 }, (_, i) => ({
    week: `W-${12 - i}`,
    mean: Math.round(r(6.7 + i * 0.02, 0.3) * 10) / 10,
    p25: Math.round(r(5.4, 0.3) * 10) / 10,
    p75: Math.round(r(8.1, 0.3) * 10) / 10,
  }));
  const mood: MoodDetail = {
    distribution,
    weekly12: weekly12mood,
    perDay: DAY_LABELS.map((d, i) => ({
      day: d,
      mean: Math.round(r(6.4 + (i >= 5 ? 0.6 : 0.1), 0.4) * 10) / 10,
    })),
    topContributors: [
      { label: "Sleep hours ≥ 7", direction: "up", pts: 0.42 },
      { label: "Session completed this week", direction: "up", pts: 0.31 },
      { label: "Academic-stress tag", direction: "down", pts: -0.28 },
      { label: "Financial-stress tag", direction: "down", pts: -0.19 },
      { label: "Peer-support activity", direction: "up", pts: 0.14 },
    ],
  };

  // ─── Departments ──────────────────────────────────────────
  const departments: DeptDetail = {
    rows: snap.departments.map((d) => ({
      slug: d.slug,
      name: d.name,
      n: d.n,
      participationPct: d.participationPct,
      wellnessIndex: ri(66 + rnd() * 10, 4),
      riskFlagPct: Math.round(r(3.2, 1.6) * 10) / 10,
      sessionsWk: ri(140 + rnd() * 80, 20),
      deltaVsPrior: Math.round(r(0, 6) * 10) / 10,
    })),
  };

  // ─── Trend (extended) ─────────────────────────────────────
  const extended26w = Array.from({ length: 26 }, (_, i) => ({
    week: `W${i + 1}`,
    overall: Math.round(r(66 + i * 0.28, 4)),
    firstYear: Math.round(r(60 + i * 0.22, 5)),
    finalYear: Math.round(r(70 + i * 0.18, 4)),
  }));
  const trend: TrendDetail = {
    extended26w,
    academicMarkers: [
      { week: "W4", label: "Term begins" },
      { week: "W9", label: "Mid-sem exams" },
      { week: "W16", label: "Placement week" },
      { week: "W22", label: "Finals" },
    ],
    benchmarkPeer: 68,
  };

  // ─── Risk funnel details ──────────────────────────────────
  const rf = snap.riskFunnel;
  const stagesMeta: { key: string; median: string; benchmark: number | null; note: string }[] = [
    { key: "checked_in", median: "—", benchmark: null, note: "Any check-in from the last 7 days." },
    { key: "flagged", median: "6.2h to review", benchmark: 20, note: "Aggregate rule + PHQ/GAD threshold match." },
    { key: "referred", median: "1.4d to accept", benchmark: 42, note: "Slot offered by counselor team." },
    { key: "in_active_care", median: "3 sessions / month", benchmark: 48, note: "≥ 1 completed session in last 30 days." },
  ];
  const funnelStages: FunnelDetail["stages"] = rf.map((s, i) => {
    const prev = i > 0 ? rf[i - 1] : null;
    const prevN = prev && typeof prev.n === "number" ? prev.n : null;
    const n = typeof s.n === "number" ? s.n : 0;
    const conv = prevN && prevN > 0 && typeof s.n === "number" ? Math.round((n / prevN) * 100) : null;
    const meta = stagesMeta[i];
    return {
      key: s.key,
      label: s.label,
      n,
      conversion: conv,
      median: meta.median,
      benchmark: meta.benchmark,
      note: meta.note,
    };
  });
  // Bottleneck = worst conversion vs benchmark
  let worst = { key: funnelStages[0].key, gap: 0 };
  for (const s of funnelStages) {
    if (s.conversion !== null && s.benchmark !== null) {
      const gap = s.benchmark - s.conversion;
      if (gap > worst.gap) worst = { key: s.key, gap };
    }
  }
  const funnel: FunnelDetail = {
    stages: funnelStages,
    bottleneckKey: worst.key,
    bottleneckNote: worst.gap > 0
      ? `${worst.key.replace(/_/g, " ")} converts ${worst.gap}pt below peer benchmark — the tightest stage.`
      : "All stages are at or above peer benchmark this week.",
  };

  // ─── Concerns per-tag ────────────────────────────────────
  const concerns: ConcernsDetail = {
    perTag: snap.concerns.map((c) => ({
      tag: c.tag,
      n: typeof c.n === "number" ? c.n : 0,
      deltaPct: Math.round(r(0, 30) * 10) / 10,
      trend12w: Array.from({ length: 12 }, () => ri(typeof c.n === "number" ? c.n / 12 : 40, 20)),
      topSchools: [
        { school: "Engineering", sharePct: ri(34, 6) },
        { school: "Humanities", sharePct: ri(22, 6) },
        { school: "Management", sharePct: ri(18, 4) },
      ],
    })),
  };

  // ─── Heatmap ─────────────────────────────────────────────
  const perDayTotals: HeatmapDetail["perDayTotals"] = DAY_LABELS.map((d, day) => ({
    day: d,
    n: snap.engagement.filter((c) => c.day === day).reduce((s, c) => s + c.n, 0),
  }));
  const perHourTotals: HeatmapDetail["perHourTotals"] = Array.from({ length: 12 }, (_, hour) => ({
    hour: HOUR_LABEL(hour),
    n: snap.engagement.filter((c) => c.hour === hour).reduce((s, c) => s + c.n, 0),
  }));
  const peakCell = snap.engagement.reduce((a, b) => (b.n > a.n ? b : a), snap.engagement[0]);
  const quietCell = snap.engagement.reduce((a, b) => (b.n < a.n ? b : a), snap.engagement[0]);
  const weekdayTotal = snap.engagement.filter((c) => c.day < 5).reduce((s, c) => s + c.n, 0);
  const weekendTotal = snap.engagement.filter((c) => c.day >= 5).reduce((s, c) => s + c.n, 0);
  const totalHeat = weekdayTotal + weekendTotal || 1;
  const heatmap: HeatmapDetail = {
    perDayTotals,
    perHourTotals,
    peak: { day: DAY_LABELS[peakCell.day], hour: HOUR_LABEL(peakCell.hour), n: peakCell.n },
    quiet: { day: DAY_LABELS[quietCell.day], hour: HOUR_LABEL(quietCell.hour), n: quietCell.n },
    weekdayVsWeekendPct: {
      weekday: Math.round((weekdayTotal / totalHeat) * 100),
      weekend: Math.round((weekendTotal / totalHeat) * 100),
    },
  };

  cache = { pulse, active, crisis, sessions, mood, departments, trend, funnel, concerns, heatmap };
  return cache;
}
