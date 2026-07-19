import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { AlertTriangle, TrendingDown, TrendingUp, Waves as WavesIcon, ArrowRight } from "lucide-react";
import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Heatmap } from "@/components/viz/Heatmap";
import { RidgeChart } from "@/components/viz/RidgeChart";
import { Sparkbar } from "@/components/viz/Sparkbar";
import { EmptyState } from "@/components/primitives/EmptyState";

import { N_MIN } from "@/lib/anonymity";
import { SEED_DEPARTMENTS, cohortMatrix } from "@/lib/data/seed";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ─── URL state ──────────────────────────────────────────────────
const WINDOWS = ["30d", "90d", "term"] as const;
type WindowKey = (typeof WINDOWS)[number];
const WINDOW_LABEL: Record<WindowKey, string> = { "30d": "30 days", "90d": "90 days", term: "Term" };
const WINDOW_DAYS: Record<WindowKey, number> = { "30d": 30, "90d": 90, term: 120 };

const search = z.object({
  window: fallback(z.string(), "90d").default("90d"),
  dept:   fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/signals/mood")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Mood trends — PeaceCode for Colleges" },
      { name: "description", content: "Daily aggregate mood with 7-day rolling band, weekly ridges, dip heatmap and anomaly feed. Aggregate-only, k=10 enforced." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MoodTrendsPage,
});

// ─── Deterministic mood series ──────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function dailyMood(deptKey: string, days: number) {
  const rand = mulberry32(SEED_ROOT ^ hash(`${deptKey}:mood`));
  const out: { x: string; mean: number; band: [number, number] }[] = [];
  const today = new Date();
  let base = 6.4 + rand() * 0.8;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const day = d.getDay();
    const weekend = day === 0 || day === 6;
    const drift = Math.sin(i / 9) * 0.25 + (rand() - 0.5) * 0.35;
    const weekPenalty = day === 0 ? -0.35 : day === 1 ? -0.15 : 0;
    const mean = Math.round((base + drift + weekPenalty + (weekend ? -0.1 : 0.05)) * 100) / 100;
    const spread = 0.55 + rand() * 0.35;
    base += (rand() - 0.5) * 0.06;
    base = Math.max(5.4, Math.min(7.8, base));
    out.push({
      x: d.toISOString().slice(5, 10),
      mean: clamp(mean, 3, 9),
      band: [clamp(mean - spread, 3, 9), clamp(mean + spread, 3, 9)],
    });
  }
  return out;
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function rolling7(points: { mean: number }[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - 6);
    const slice = points.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b.mean, 0) / slice.length;
    out.push(Math.round(avg * 100) / 100);
  }
  return out;
}

function weeklyDensity(points: { mean: number }[], weeks: number) {
  // group into `weeks` buckets, produce 20-point density curve per bucket
  const bucketSize = Math.max(1, Math.floor(points.length / weeks));
  const rows: { label: string; values: number[] }[] = [];
  for (let w = 0; w < weeks; w++) {
    const slice = points.slice(w * bucketSize, (w + 1) * bucketSize);
    if (!slice.length) continue;
    const mean = slice.reduce((a, b) => a + b.mean, 0) / slice.length;
    const sd   = 0.55 + Math.abs(6 - mean) * 0.05;
    const curve: number[] = [];
    for (let i = 0; i < 24; i++) {
      const x = 3 + (i / 23) * 6; // 3..9
      curve.push(Math.exp(-((x - mean) ** 2) / (2 * sd * sd)));
    }
    rows.push({ label: `Wk ${w + 1}`, values: curve });
  }
  return rows;
}

function dayHourHeat(deptKey: string) {
  // returns rows=days (Mon..Sun) × cols=hours (0..23), value = mood dip (0..1, 1 = worst)
  const rand = mulberry32(SEED_ROOT ^ hash(`${deptKey}:heat`));
  const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = rows.map((_, ri) =>
    Array.from({ length: 24 }, (_, ci) => {
      // late night + Sun evenings dip
      const nightBoost = ci >= 22 || ci <= 3 ? 0.35 : 0;
      const sundayEve  = ri === 6 && ci >= 17 && ci <= 22 ? 0.45 : 0;
      const midWeekBoost = (ri === 2 || ri === 3) && ci >= 14 && ci <= 17 ? 0.15 : 0;
      const noise = rand() * 0.22;
      const v = Math.min(1, nightBoost + sundayEve + midWeekBoost + noise);
      return { value: Math.round(v * 100) / 100, label: `${rows[ri]} ${String(ci).padStart(2, "0")}:00 — dip ${(v * 100).toFixed(0)}%` };
    }),
  );
  return { rows, cols: Array.from({ length: 24 }, (_, i) => (i % 3 === 0 ? String(i) : "")), data };
}

function deptStreak(deptId: string): number[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${deptId}:streak`));
  return Array.from({ length: 14 }, () => 3 + Math.round(rand() * 6));
}

type Anomaly = {
  id: string;
  title: string;
  detail: string;
  dept?: string;
  severity: "watch" | "elevated" | "critical";
  delta: number;
};
function buildAnomalies(dept: string): Anomaly[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${dept}:anom`));
  const pool: Anomaly[] = [
    { id: "a1", title: "Mood dipped on Sun evenings", detail: "3 weeks running, 17:00–21:00 average is 0.6 pts below baseline.", severity: "elevated", delta: -0.6 },
    { id: "a2", title: "Post-midterm recovery",       detail: "Aggregate mood climbed from 6.1 → 6.7 over 8 days after mid-terms.", severity: "watch", delta: +0.6 },
    { id: "a3", title: "Late-night check-ins rising", detail: "Check-ins between 23:00–02:00 up 22% vs prior 4 weeks.", severity: "watch", delta: +0.22 },
    { id: "a4", title: "Engineering Y2 signal",       detail: "Dept mood 0.4 pts below institutional mean for 11 days.", dept: "Engineering", severity: "elevated", delta: -0.4 },
    { id: "a5", title: "Festival-week uplift",        detail: "Mood peaked at 7.1 on and after cultural festival weekend.", severity: "watch", delta: +0.5 },
    { id: "a6", title: "Health Sciences early warning", detail: "Aggregate mood below 6.0 for 5 consecutive days.", dept: "Health Sciences", severity: "critical", delta: -0.9 },
  ];
  // shuffle deterministically
  return pool
    .map((a) => ({ a, k: rand() }))
    .sort((x, y) => x.k - y.k)
    .map(({ a }) => a);
}

// ─── Component ──────────────────────────────────────────────────
function MoodTrendsPage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/signals/mood" });
  const windowKey: WindowKey = (WINDOWS as readonly string[]).includes(s.window) ? (s.window as WindowKey) : "90d";
  const dept = s.dept;

  const matrix = useMemo(() => cohortMatrix(), []);
  const deptOptions = [
    { id: "all", name: "All institution", n: Object.values(matrix).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0) },
    ...SEED_DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, n: Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0) })),
  ];
  const selectedDeptRow = deptOptions.find((d) => d.id === dept) ?? deptOptions[0]!;
  const suppressed = selectedDeptRow.n < N_MIN;

  const days = WINDOW_DAYS[windowKey];
  const series = useMemo(() => dailyMood(`${dept}:${windowKey}`, days), [dept, windowKey, days]);
  const roll = useMemo(() => rolling7(series), [series]);
  const chartData = series.map((p, i) => ({
    x: p.x,
    mean: p.mean,
    lo: p.band[0],
    hi: p.band[1],
    span: p.band[1] - p.band[0],
    rolling: roll[i],
  }));

  const currentMean = series.length ? series[series.length - 1]!.mean : 0;
  const priorMean   = series.length > 7 ? series[series.length - 8]!.mean : currentMean;
  const weekDelta   = Math.round((currentMean - priorMean) * 100) / 100;

  const density = useMemo(() => weeklyDensity(series, 8), [series]);
  const heat = useMemo(() => dayHourHeat(`${dept}:${windowKey}`), [dept, windowKey]);
  const anomalies = useMemo(() => buildAnomalies(`${dept}:${windowKey}`), [dept, windowKey]);

  function setWindow(k: WindowKey) { nav({ search: { ...s, window: k } }); }
  function setDept(id: string) { nav({ search: { ...s, dept: id } }); }

  return (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Mood trends"
        subtitle="Daily aggregate mood with a 7-day rolling band, weekly ridge distributions, day-hour dip map and an anomaly feed. Every slice is aggregate-only and enforces k ≥ 10."
      />

      {/* Slicer bar */}
      <GlassCard className="mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-start">
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <Eyebrow>Window</Eyebrow>
            <div className="flex gap-1.5">
              {WINDOWS.map((k) => {
                const active = k === windowKey;
                return (
                  <button key={k} type="button" onClick={() => setWindow(k)}
                    aria-pressed={active}
                    className="text-[12px] px-2.5 py-1 rounded-full"
                    style={{
                      background: active ? "color-mix(in oklab, var(--pc-accent) 16%, var(--pc-surface2))" : "var(--pc-surface)",
                      color: active ? "var(--pc-accent, var(--pc-primary))" : "var(--pc-ink-2)",
                      border: active ? "1px solid color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))" : "1px solid var(--pc-border)",
                    }}>
                    {WINDOW_LABEL[k]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <Eyebrow>Segment</Eyebrow>
            <div className="flex flex-wrap gap-1.5">
              {deptOptions.map((d) => {
                const active = d.id === dept;
                const dim = d.n < N_MIN;
                return (
                  <button key={d.id} type="button" onClick={() => setDept(d.id)}
                    aria-pressed={active} disabled={dim && !active}
                    className="text-[12px] px-2.5 py-1 rounded-full"
                    style={{
                      background: active ? "color-mix(in oklab, var(--pc-accent) 16%, var(--pc-surface2))" : "var(--pc-surface)",
                      color: dim ? "var(--pc-muted)" : active ? "var(--pc-accent, var(--pc-primary))" : "var(--pc-ink-2)",
                      border: active ? "1px solid color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))" : "1px solid var(--pc-border)",
                    }}>
                    {d.name} {dim && "· hidden"}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px] text-right">
            <Eyebrow>Cohort</Eyebrow>
            <div className="text-[12px] font-mono" style={{ color: "var(--pc-ink-2)" }}>
              n={selectedDeptRow.n.toLocaleString()}
            </div>
          </div>
        </div>
      </GlassCard>

      {suppressed ? (
        <GlassCard className="p-10">
          <EmptyState kind="suppressed" title="Hidden to protect anonymity" subtitle={`${selectedDeptRow.name} cohort is below k=10.`} />
        </GlassCard>
      ) : (
        <>
          <StaggerGrid className="grid grid-cols-12 gap-4">
            {/* Hero KPI */}
            <FlowCard className="col-span-12 md:col-span-4 lg:col-span-3 p-5">
              <Eyebrow>Current mood · 7-day avg</Eyebrow>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", color: "var(--pc-ink)" }}>
                  <CountUp value={roll[roll.length - 1] ?? currentMean} decimals={2} />
                </span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>/ 10</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--pc-surface2)",
                  border: "1px solid var(--pc-border)",
                  color: weekDelta > 0 ? "var(--pc-good, var(--pc-primary))" : weekDelta < 0 ? "var(--pc-warn, var(--pc-accent-2))" : "var(--pc-muted)",
                }}>
                {weekDelta > 0 ? <TrendingUp className="h-3 w-3" /> : weekDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <WavesIcon className="h-3 w-3" />}
                {(weekDelta > 0 ? "+" : "") + weekDelta.toFixed(2)} vs. 7 days ago
              </div>
              <div className="mt-4 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                Window: <span style={{ color: "var(--pc-ink-2)" }}>{WINDOW_LABEL[windowKey]}</span> · Segment: <span style={{ color: "var(--pc-ink-2)" }}>{selectedDeptRow.name}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                <span aria-label="k-anonymity threshold" className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>k=10</span>
                <span>Every cell aggregates 10+ students.</span>
              </div>
            </FlowCard>

            {/* Trend + rolling band */}
            <FlowCard className="col-span-12 md:col-span-8 lg:col-span-9 p-5">
              <SectionTitle title="Daily mood · with rolling 7-day mean" subtitle="Shaded band = intra-day spread. Line = 7-day rolling mean." />
              <div className="mt-3" style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="mood-band" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="var(--pc-accent, var(--pc-primary))" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--pc-accent, var(--pc-primary))" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--pc-border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="x" tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.max(1, Math.floor(days / 12))} />
                    <YAxis tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[4.5, 8.5]} width={28} />
                    <Tooltip
                      contentStyle={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", borderRadius: 8, fontSize: 11, color: "var(--pc-ink)" }}
                      formatter={(v: number | string, name: string) => {
                        if (name === "lo" || name === "hi" || name === "span") return [undefined, undefined] as any;
                        return [typeof v === "number" ? v.toFixed(2) : v, name === "rolling" ? "Rolling (7d)" : "Daily mean"];
                      }}
                    />
                    <ReferenceLine y={6.5} stroke="var(--pc-border)" strokeDasharray="4 4" />
                    {/* band: lo baseline invisible, span stacked area */}
                    <Area type="monotone" dataKey="lo" stackId="band" stroke="transparent" fill="transparent" isAnimationActive={false} />
                    <Area type="monotone" dataKey="span" stackId="band" stroke="transparent" fill="url(#mood-band)" isAnimationActive animationDuration={600} />
                    <Line type="monotone" dataKey="mean" stroke="var(--pc-accent, var(--pc-primary))" strokeWidth={1.2} dot={false} strokeOpacity={0.55} isAnimationActive animationDuration={600} />
                    <Line type="monotone" dataKey="rolling" stroke="var(--pc-primary)" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </FlowCard>

            {/* Weekly ridge */}
            <FlowCard className="col-span-12 lg:col-span-7 p-5">
              <SectionTitle title="Weekly mood distribution" subtitle="Density curves per week (3.0 → 9.0). Ridges shift right when the cohort feels better." />
              <div className="mt-3 flex justify-center overflow-x-auto">
                <RidgeChart series={density} width={560} height={Math.max(140, density.length * 32)} color="var(--pc-accent, var(--pc-primary))" ariaLabel="Weekly mood density ridges" />
              </div>
            </FlowCard>

            {/* Day × Hour dip heatmap */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="When mood dips" subtitle="Day of week × hour. Darker = greater dip from baseline." />
              <div className="mt-3 overflow-x-auto">
                <Heatmap rows={heat.rows} cols={heat.cols} data={heat.data} min={0} max={1} cellSize={22} ariaLabel="Mood dip heatmap by day and hour" />
              </div>
            </FlowCard>

            {/* Streaks per dept */}
            <FlowCard className="col-span-12 lg:col-span-7 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <SectionTitle title="Positive-mood streaks · by program" subtitle="Consecutive days each program held mood above its baseline (last 14 days)." />
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{SEED_DEPARTMENTS.length} programs</span>
              </div>
              <ul className="mt-3">
                {SEED_DEPARTMENTS.map((d, i) => {
                  const n = Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0);
                  const dim = n < N_MIN;
                  const bars = deptStreak(d.id);
                  const best = Math.max(...bars);
                  return (
                    <li key={d.id} className="flex items-center gap-3 py-2"
                      style={i === 0 ? undefined : { borderTop: "1px solid var(--pc-border)" }}>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px]" style={{ color: "var(--pc-ink)" }}>{d.name}</div>
                        <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{d.school} · n={n.toLocaleString()}</div>
                      </div>
                      {dim ? (
                        <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", color: "var(--pc-muted)", border: "1px solid var(--pc-border)" }}>hidden</span>
                      ) : (
                        <>
                          <Sparkbar values={bars} width={140} height={22} color="var(--pc-primary)" ariaLabel={`${d.name} streak bars`} />
                          <span className="w-16 text-right text-[12px] font-mono" style={{ color: "var(--pc-ink-2)" }}>
                            {best}<span className="text-[10px]" style={{ color: "var(--pc-muted)" }}> days</span>
                          </span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </FlowCard>

            {/* Anomalies */}
            <FlowCard className="col-span-12 lg:col-span-5 p-5">
              <SectionTitle title="Anomaly feed" subtitle="Aggregate patterns worth attention — never individually identifying." />
              <ul className="mt-3 space-y-2">
                {anomalies.slice(0, 6).map((a) => (
                  <li key={a.id} className="rounded-lg p-3 flex gap-3 items-start"
                    style={{
                      background: "var(--pc-surface2)",
                      border: "1px solid var(--pc-border)",
                    }}>
                    <div className="h-6 w-6 rounded-md inline-flex items-center justify-center shrink-0"
                      style={{
                        background: a.severity === "critical" ? "color-mix(in oklab, var(--pc-warn, var(--pc-accent-2)) 22%, transparent)"
                          : a.severity === "elevated" ? "color-mix(in oklab, var(--pc-accent, var(--pc-primary)) 20%, transparent)"
                          : "var(--pc-surface)",
                        color: a.severity === "critical" ? "var(--pc-warn, var(--pc-accent-2))" : "var(--pc-accent, var(--pc-primary))",
                        border: "1px solid var(--pc-border)",
                      }}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12.5px]" style={{ color: "var(--pc-ink)" }}>{a.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded"
                          style={{
                            letterSpacing: "0.08em",
                            color: a.severity === "critical" ? "var(--pc-warn, var(--pc-accent-2))" : "var(--pc-muted)",
                            background: "var(--pc-surface)",
                            border: "1px solid var(--pc-border)",
                          }}>
                          {a.severity}
                        </span>
                      </div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: "var(--pc-muted)" }}>{a.detail}</div>
                      {a.dept && (
                        <div className="mt-1 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                          Program: <span style={{ color: "var(--pc-ink-2)" }}>{a.dept}</span>
                        </div>
                      )}
                    </div>
                    <a href="/care/risk" className="text-[11px] inline-flex items-center gap-1 shrink-0 hover:underline"
                      style={{ color: "var(--pc-accent, var(--pc-primary))" }}>
                      Route <ArrowRight className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </FlowCard>
          </StaggerGrid>

          <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
            Aggregate only. Anomalies describe patterns across ≥10 students — no individual is identifiable.
          </Reveal>
        </>
      )}
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
      {children}
    </div>
  );
}
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-w-0">
      <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>{title}</div>
      {subtitle && <div className="text-[11.5px] mt-0.5" style={{ color: "var(--pc-muted)" }}>{subtitle}</div>}
    </div>
  );
}
