import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { Copy, Plus, RotateCcw, X, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { RadarSmall } from "@/components/viz/RadarSmall";
import { Donut } from "@/components/viz/Donut";
import { EmptyState } from "@/components/primitives/EmptyState";
import { N_MIN } from "@/lib/anonymity";
import { SEED_DEPARTMENTS, SEED_YEARS, cohortMatrix } from "@/lib/data/seed";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ─── Cohort model ────────────────────────────────────────────────
// key form: "inst:all" | "year:Y2" | "dept:eng" | "dept:eng:Y2"
type Cohort = {
  key: string;
  label: string;
  n: number;
};

const MAX = 4;
const COLORS = [
  "var(--pc-accent, var(--pc-primary))",
  "var(--pc-primary)",
  "var(--pc-good, var(--pc-primary))",
  "var(--pc-warn, var(--pc-accent-2))",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function cohortSize(key: string, matrix: Record<string, Record<string, number>>): number {
  if (key === "inst:all") {
    let sum = 0;
    for (const d of Object.keys(matrix)) for (const y of Object.keys(matrix[d] ?? {})) sum += matrix[d]![y] ?? 0;
    return sum;
  }
  const [kind, a, b] = key.split(":");
  if (kind === "year") {
    let sum = 0;
    for (const d of Object.keys(matrix)) sum += matrix[d]?.[a!] ?? 0;
    return sum;
  }
  if (kind === "dept") {
    if (b) return matrix[a!]?.[b] ?? 0;
    return Object.values(matrix[a!] ?? {}).reduce((a2, b2) => a2 + b2, 0);
  }
  return 0;
}

function cohortLabel(key: string): string {
  if (key === "inst:all") return "All institution";
  const [kind, a, b] = key.split(":");
  if (kind === "year") return `${a} · all programs`;
  if (kind === "dept") {
    const d = SEED_DEPARTMENTS.find((x) => x.id === a);
    return b ? `${d?.name ?? a} · ${b}` : d?.name ?? a;
  }
  return key;
}

// Deterministic metrics for a cohort
function cohortMetrics(key: string) {
  const rand = mulberry32(SEED_ROOT ^ hash(key));
  return {
    wellbeing:  Math.round((60 + rand() * 22) * 10) / 10,
    engagement: Math.round((44 + rand() * 34) * 10) / 10,
    retention:  Math.round((72 + rand() * 20) * 10) / 10,
    screening:  Math.round((55 + rand() * 32) * 10) / 10,
    peer:       Math.round((45 + rand() * 38) * 10) / 10,
    care:       Math.round((50 + rand() * 30) * 10) / 10,
    highRisk:   Math.round((3 + rand() * 9) * 10) / 10,
    mood:       Math.round((5.5 + rand() * 2.5) * 10) / 10,
    sessions:   Math.round(220 + rand() * 320),
    completion: Math.round((60 + rand() * 30) * 10) / 10,
  };
}
type Metrics = ReturnType<typeof cohortMetrics>;

function trendFor(key: string): { x: string; y: number }[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:trend`));
  const out: { x: string; y: number }[] = [];
  let v = 62 + rand() * 12;
  for (let w = 0; w < 26; w++) {
    v += (rand() - 0.5) * 2.2;
    v = Math.max(50, Math.min(88, v));
    out.push({ x: `W${w + 1}`, y: Math.round(v * 10) / 10 });
  }
  return out;
}

function severitySlices(key: string, color: string) {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:sev`));
  const minimal  = 30 + Math.round(rand() * 20);
  const mild     = 20 + Math.round(rand() * 14);
  const moderate = 14 + Math.round(rand() * 10);
  const severe   = Math.max(2, 8 + Math.round(rand() * 6));
  return [
    { label: "Minimal",  value: minimal,  color: `color-mix(in oklab, ${color} 22%, var(--pc-surface2))` },
    { label: "Mild",     value: mild,     color: `color-mix(in oklab, ${color} 45%, var(--pc-surface2))` },
    { label: "Moderate", value: moderate, color: `color-mix(in oklab, ${color} 72%, transparent)` },
    { label: "Severe",   value: severe,   color },
  ];
}

// ─── URL state ───────────────────────────────────────────────────
const search = z.object({
  keys: fallback(z.array(z.string()), []).default([]),
});

export const Route = createFileRoute("/_authenticated/cohorts/compare")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Compare cohorts — PeaceCode for Colleges" },
      { name: "description", content: "Overlay up to four cohorts across wellbeing, engagement, retention, screening, peer bridge and care uptake." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/cohorts/compare" });
  const [pickerOpen, setPickerOpen] = useState(false);

  const matrix = useMemo(() => cohortMatrix(), []);

  // Default seed selection when empty
  const rawKeys = s.keys.length ? s.keys : ["dept:eng", "dept:med", "year:Y2"];
  const keys = Array.from(new Set(rawKeys)).slice(0, MAX);

  const cohorts: Cohort[] = keys.map((k) => ({
    key: k,
    label: cohortLabel(k),
    n: cohortSize(k, matrix),
  }));

  const suppressed = cohorts.filter((c) => c.n < N_MIN);
  const visible = cohorts.filter((c) => c.n >= N_MIN);

  const metrics = new Map<string, Metrics>();
  visible.forEach((c) => metrics.set(c.key, cohortMetrics(c.key)));

  // Overlay trend data (merged by week index)
  const trendData = useMemo(() => {
    if (!visible.length) return [];
    const series = visible.map((c) => trendFor(c.key));
    const len = series[0]?.length ?? 0;
    const rows: Record<string, number | string>[] = [];
    for (let i = 0; i < len; i++) {
      const row: Record<string, number | string> = { x: series[0]![i]!.x };
      visible.forEach((c, si) => { row[c.key] = series[si]![i]!.y; });
      rows.push(row);
    }
    return rows;
  }, [visible.map((c) => c.key).join("|")]);

  const RADAR_AXES = ["Wellbeing", "Engagement", "Retention", "Screening", "Peer bridge", "Care uptake"];
  const radarSeries = visible.map((c, i) => {
    const m = metrics.get(c.key)!;
    return {
      label: c.label,
      color: COLORS[i % COLORS.length]!,
      values: [m.wellbeing, m.engagement, m.retention, m.screening, m.peer, m.care],
    };
  });

  // Delta table — vs first cohort as reference
  const ref = visible[0] ? metrics.get(visible[0].key)! : null;

  function addCohort(key: string) {
    const next = Array.from(new Set([...keys, key])).slice(0, MAX);
    nav({ search: { keys: next } });
    setPickerOpen(false);
  }
  function removeCohort(key: string) {
    nav({ search: { keys: keys.filter((k) => k !== key) } });
  }
  function reset() {
    nav({ search: { keys: [] } });
  }
  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success("Link copied"),
      () => toast.error("Copy failed"),
    );
  }

  // Options in picker: institution, all year cohorts, all departments (dept-only and dept×year)
  const pickerGroups: { label: string; options: { key: string; label: string; n: number }[] }[] = [
    {
      label: "Institution",
      options: [{ key: "inst:all", label: "All institution", n: cohortSize("inst:all", matrix) }],
    },
    {
      label: "By year",
      options: SEED_YEARS.map((y) => ({ key: `year:${y}`, label: `${y} · all programs`, n: cohortSize(`year:${y}`, matrix) })),
    },
    {
      label: "By program",
      options: SEED_DEPARTMENTS.map((d) => ({ key: `dept:${d.id}`, label: d.name, n: cohortSize(`dept:${d.id}`, matrix) })),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Cohort insights"
        title="Compare cohorts"
        subtitle="Overlay up to four cohorts and see how wellbeing, engagement and care uptake move relative to each other. Every metric enforces k ≥ 10."
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyLink} className="text-[12px] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5"
              style={{ border: "1px solid var(--pc-border)", background: "var(--pc-surface)", color: "var(--pc-ink-2)" }}>
              <Copy className="h-3.5 w-3.5" /> Copy link
            </button>
            <button type="button" onClick={reset} className="text-[12px] px-3 py-1.5 rounded-md inline-flex items-center gap-1.5"
              style={{ border: "1px solid var(--pc-border)", background: "var(--pc-surface)", color: "var(--pc-ink-2)" }}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        }
      />

      {/* ─── Cohort chips + picker ─── */}
      <GlassCard className="mb-5 p-4">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="text-[10px] uppercase pt-2 mr-1" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
            Cohorts
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {cohorts.length === 0 && (
              <span className="text-[12px]" style={{ color: "var(--pc-muted)" }}>Add up to {MAX} cohorts to compare.</span>
            )}
            {cohorts.map((c, i) => {
              const dim = c.n < N_MIN;
              return (
                <span key={c.key} className="inline-flex items-center gap-2 text-[12px] px-2.5 py-1.5 rounded-full"
                  style={{
                    background: "color-mix(in oklab, " + COLORS[i % COLORS.length] + " 12%, var(--pc-surface2))",
                    color: dim ? "var(--pc-muted)" : "var(--pc-ink)",
                    border: "1px solid color-mix(in oklab, " + COLORS[i % COLORS.length] + " 45%, var(--pc-border))",
                  }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {c.label}
                  <span className="font-mono text-[10.5px]" style={{ color: "var(--pc-muted)" }}>n={c.n.toLocaleString()}</span>
                  <button type="button" onClick={() => removeCohort(c.key)} aria-label={`Remove ${c.label}`} className="hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}

            {keys.length < MAX && (
              <div className="relative">
                <button type="button" onClick={() => setPickerOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
                  style={{ border: "1px dashed var(--pc-border)", background: "var(--pc-surface)", color: "var(--pc-ink-2)" }}>
                  <Plus className="h-3 w-3" /> Add cohort
                </button>
                {pickerOpen && (
                  <>
                    <button type="button" aria-hidden onClick={() => setPickerOpen(false)}
                      className="fixed inset-0 z-10 cursor-default" style={{ background: "transparent" }} />
                    <div className="absolute z-20 mt-2 w-[320px] max-h-[380px] overflow-auto rounded-xl p-2 animate-scale-in"
                      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}>
                      {pickerGroups.map((g) => (
                        <div key={g.label} className="mb-2 last:mb-0">
                          <div className="text-[10px] uppercase px-2 py-1" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
                            {g.label}
                          </div>
                          <ul>
                            {g.options.map((o) => {
                              const already = keys.includes(o.key);
                              return (
                                <li key={o.key}>
                                  <button type="button" disabled={already} onClick={() => addCohort(o.key)}
                                    className="w-full text-left flex items-center justify-between gap-3 px-2 py-1.5 rounded-md text-[12.5px]"
                                    style={{ color: already ? "var(--pc-muted)" : "var(--pc-ink)", background: "transparent" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--pc-surface2)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                    <span className="truncate">{o.label}</span>
                                    <span className="font-mono text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                                      {already ? "added" : `n=${o.n.toLocaleString()}`}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {suppressed.length > 0 && (
        <div className="mb-4 text-[11.5px] rounded-lg px-3 py-2"
          style={{ background: "var(--pc-surface2)", border: "1px dashed var(--pc-border)", color: "var(--pc-muted)" }}>
          Hidden to protect anonymity ({suppressed.length}): {suppressed.map((c) => c.label).join(", ")} — cohort size below k=10.
        </div>
      )}

      {visible.length === 0 ? (
        <GlassCard className="p-10">
          <EmptyState kind="filtered" title="Add at least one cohort with n ≥ 10" subtitle="Use the picker above to overlay cohorts." />
        </GlassCard>
      ) : (
        <StaggerGrid className="grid grid-cols-12 gap-4">
          {/* Trend overlay */}
          <FlowCard className="col-span-12 lg:col-span-8 p-5">
            <SectionTitle title="Wellbeing trend · 26 weeks" subtitle="Series are token-tinted per cohort. Hover for weekly values." />
            <div className="mt-3" style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    {visible.map((c, i) => (
                      <linearGradient key={c.key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={COLORS[i % COLORS.length]} stopOpacity={0.30} />
                        <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke="var(--pc-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="x" tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[50, 90]} width={28} />
                  <Tooltip
                    contentStyle={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", borderRadius: 8, fontSize: 11, color: "var(--pc-ink)" }}
                    formatter={(v: number | string, name: string) => [v, cohortLabel(String(name))]}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, color: "var(--pc-ink-2)" }}
                    formatter={(v) => cohortLabel(String(v))}
                  />
                  {visible.map((c, i) => (
                    <Area key={c.key} type="monotone" dataKey={c.key} stroke={COLORS[i % COLORS.length]}
                      strokeWidth={1.6} fill={`url(#grad-${i})`} isAnimationActive animationDuration={700} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </FlowCard>

          {/* Radar comparison */}
          <FlowCard className="col-span-12 lg:col-span-4 p-5">
            <SectionTitle title="Six-dimension radar" subtitle="Each cohort's shape across the core wellbeing dimensions." />
            <div className="mt-2 flex justify-center">
              <RadarSmall axes={RADAR_AXES} series={radarSeries} size={240} max={100} ariaLabel="Cohort radar comparison" />
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
              {radarSeries.map((r) => (
                <li key={r.label} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--pc-ink-2)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                  {r.label}
                </li>
              ))}
            </ul>
          </FlowCard>

          {/* Severity donuts */}
          <FlowCard className="col-span-12 p-5">
            <SectionTitle title="PHQ-9 severity mix" subtitle="Distribution of severity bands per cohort." />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {visible.map((c, i) => {
                const slices = severitySlices(c.key, COLORS[i % COLORS.length]!);
                return (
                  <div key={c.key} className="flex flex-col items-center text-center gap-1">
                    <Donut slices={slices} size={132} stroke={13}
                      centerLabel={`${slices[0]!.value + slices[1]!.value}%`}
                      centerSub="Minimal + Mild"
                      ariaLabel={`${c.label} severity mix`} />
                    <div className="text-[12px] mt-1 truncate max-w-[160px]" style={{ color: "var(--pc-ink)" }}>{c.label}</div>
                    <div className="text-[10.5px] font-mono" style={{ color: "var(--pc-muted)" }}>n={c.n.toLocaleString()}</div>
                  </div>
                );
              })}
            </div>
          </FlowCard>

          {/* Delta table */}
          <FlowCard className="col-span-12 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <SectionTitle
                title="Metric matrix"
                subtitle={ref ? `Reference cohort: ${visible[0]!.label}. Deltas shown vs. reference.` : undefined}
              />
              <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{visible.length} of {cohorts.length} shown</span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ color: "var(--pc-muted)" }} className="text-left">
                    <th className="py-2 pr-3 font-normal text-[10px] uppercase" style={{ letterSpacing: "0.12em" }}>Metric</th>
                    {visible.map((c, i) => (
                      <th key={c.key} className="py-2 px-3 font-normal">
                        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--pc-ink)" }}>
                          <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          {c.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["Wellbeing index",   "wellbeing",  "higher",  ""],
                      ["Engagement rate",   "engagement", "higher",  "%"],
                      ["Retention",         "retention",  "higher",  "%"],
                      ["Screening uptake",  "screening",  "higher",  "%"],
                      ["Peer bridge",       "peer",       "higher",  "%"],
                      ["Care uptake",       "care",       "higher",  "%"],
                      ["High-risk share",   "highRisk",   "lower",   "%"],
                      ["Avg mood",          "mood",       "higher",  "/10"],
                      ["Sessions completed","sessions",   "higher",  ""],
                      ["Session completion","completion", "higher",  "%"],
                    ] as const
                  ).map(([label, key, dir, unit], rowI) => (
                    <tr key={key} style={{ borderTop: rowI === 0 ? undefined : "1px solid var(--pc-border)" }}>
                      <td className="py-2 pr-3" style={{ color: "var(--pc-ink-2)" }}>{label}</td>
                      {visible.map((c) => {
                        const m = metrics.get(c.key)!;
                        const v = m[key];
                        const refV = ref ? ref[key] : null;
                        const isRef = ref && c.key === visible[0]!.key;
                        const delta = refV != null ? v - refV : 0;
                        const good = dir === "higher" ? delta > 0 : delta < 0;
                        const bad  = dir === "higher" ? delta < 0 : delta > 0;
                        const tone = isRef ? "flat" : Math.abs(delta) < 0.05 ? "flat" : good ? "good" : bad ? "bad" : "flat";
                        return (
                          <td key={c.key} className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono" style={{ color: "var(--pc-ink)" }}>
                                <CountUp value={v} decimals={key === "sessions" ? 0 : 1} suffix={unit} />
                              </span>
                              {!isRef && (
                                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-mono px-1.5 py-0.5 rounded"
                                  style={{
                                    color:
                                      tone === "good" ? "var(--pc-good, var(--pc-primary))"
                                      : tone === "bad" ? "var(--pc-warn, var(--pc-accent-2))"
                                      : "var(--pc-muted)",
                                    background: "var(--pc-surface2)",
                                    border: "1px solid var(--pc-border)",
                                  }}>
                                  {tone === "flat" ? <Minus className="h-2.5 w-2.5" />
                                    : delta > 0 ? <ArrowUp className="h-2.5 w-2.5" />
                                    : <ArrowDown className="h-2.5 w-2.5" />}
                                  {(delta > 0 ? "+" : "") + delta.toFixed(key === "sessions" ? 0 : 1)}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FlowCard>
        </StaggerGrid>
      )}

      <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
        Aggregate only. Comparisons never expose individuals — k=10 enforced across every cohort, every metric.
      </Reveal>
    </>
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
