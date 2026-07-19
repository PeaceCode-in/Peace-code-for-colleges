import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { TrendingUp, TrendingDown, CalendarDays } from "lucide-react";

import { PageHeader, GlassCard } from "@/components/college/primitives";
import { FlowCard } from "@/components/motion/FlowCard";
import { StaggerGrid } from "@/components/motion/StaggerGrid";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Heatmap } from "@/components/viz/Heatmap";
import { TrendArea } from "@/components/viz/TrendArea";
import { Donut } from "@/components/viz/Donut";
import { EmptyState } from "@/components/primitives/EmptyState";

import { N_MIN } from "@/lib/anonymity";
import { SEED_DEPARTMENTS, cohortMatrix } from "@/lib/data/seed";
import { mulberry32, SEED_ROOT } from "@/lib/data/seed/rng";

// ── URL state ───────────────────────────────────────────────────
const METRICS = ["composite", "mood", "engagement", "risk"] as const;
type MetricKey = (typeof METRICS)[number];
const METRIC_LABEL: Record<MetricKey, string> = {
  composite: "Composite wellbeing",
  mood: "Mood",
  engagement: "Engagement",
  risk: "Risk (inverted)",
};

const WINDOWS = ["term", "90d", "180d"] as const;
type WindowKey = (typeof WINDOWS)[number];
const WINDOW_WEEKS: Record<WindowKey, number> = { "90d": 13, term: 16, "180d": 26 };
const WINDOW_LABEL: Record<WindowKey, string> = { "90d": "90 days", term: "Term", "180d": "180 days" };

const search = z.object({
  metric: fallback(z.string(), "composite").default("composite"),
  window: fallback(z.string(), "term").default("term"),
  dept:   fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/signals/heatmap")({
  validateSearch: zodValidator(search),
  head: () => ({
    meta: [
      { title: "Wellness heatmap — PeaceCode for Colleges" },
      { name: "description", content: "Institution-wide wellbeing calendar heatmap with academic annotations. Aggregate-only, k=10 enforced." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HeatmapPage,
});

// ── Helpers ─────────────────────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function fmtISO(d: Date) { return d.toISOString().slice(5, 10); }

const DAY_ROWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Term event annotations (week index in window)
type Annotation = { week: number; label: string; kind: "exam" | "break" | "festival" };
function annotations(weeks: number): Annotation[] {
  const midterm = Math.floor(weeks * 0.35);
  const festival = Math.floor(weeks * 0.55);
  const brk = Math.floor(weeks * 0.7);
  const finals = weeks - 3;
  return [
    { week: midterm, label: "Mid-terms",       kind: "exam" },
    { week: festival, label: "Cultural fest",  kind: "festival" },
    { week: brk, label: "Break",               kind: "break" },
    { week: finals, label: "Finals",           kind: "exam" },
  ];
}

// Calendar cells: rows = day of week, cols = week
function calendarGrid(key: string, metric: MetricKey, weeks: number) {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:${metric}:cal`));
  const anns = annotations(weeks);
  const examWeeks = new Set(anns.filter((a) => a.kind === "exam").map((a) => a.week));
  const festWeeks = new Set(anns.filter((a) => a.kind === "festival").map((a) => a.week));
  const brkWeeks  = new Set(anns.filter((a) => a.kind === "break").map((a) => a.week));

  // baseline by metric (0..1, higher = better)
  const base = metric === "risk" ? 0.72 : metric === "mood" ? 0.66 : metric === "engagement" ? 0.58 : 0.65;

  const data: { value: number | null; label?: string }[][] = DAY_ROWS.map((day, di) =>
    Array.from({ length: weeks }, (_, wi) => {
      let v = base;
      v += Math.sin(wi / 3) * 0.06;
      if (examWeeks.has(wi)) v -= 0.14;
      if (festWeeks.has(wi)) v += 0.10;
      if (brkWeeks.has(wi))  v += 0.05;
      if (di === 6) v -= 0.05; // Sunday dip
      if (di === 4 || di === 5) v += 0.03;
      v += (rand() - 0.5) * 0.08;
      v = Math.max(0.15, Math.min(0.95, v));
      return {
        value: Math.round(v * 1000) / 1000,
        label: `${day} · Wk ${wi + 1} — ${(v * 100).toFixed(0)}`,
      };
    }),
  );
  const cols = Array.from({ length: weeks }, (_, i) => (i % 2 === 0 ? `W${i + 1}` : ""));
  return { rows: DAY_ROWS, cols, data, annotations: anns };
}

// Weekly trend for the metric
function weeklyTrend(key: string, metric: MetricKey, weeks: number): { x: string; y: number }[] {
  const rand = mulberry32(SEED_ROOT ^ hash(`${key}:${metric}:trend`));
  const anns = annotations(weeks);
  const examWeeks = new Set(anns.filter((a) => a.kind === "exam").map((a) => a.week));
  const festWeeks = new Set(anns.filter((a) => a.kind === "festival").map((a) => a.week));
  const base = metric === "engagement" ? 58 : metric === "risk" ? 72 : metric === "mood" ? 66 : 65;
  const today = new Date();
  return Array.from({ length: weeks }, (_, i) => {
    const wi = i;
    const d = new Date(today);
    d.setDate(today.getDate() - (weeks - 1 - i) * 7);
    let v = base + Math.sin(wi / 3) * 4 + (rand() - 0.5) * 3;
    if (examWeeks.has(wi)) v -= 8;
    if (festWeeks.has(wi)) v += 6;
    return { x: fmtISO(d), y: Math.round(Math.max(30, Math.min(90, v))) };
  });
}

// Dept × week aggregate (small multiples style shown as second heatmap)
function deptWeeklyGrid(key: string, metric: MetricKey, weeks: number, deptList: typeof SEED_DEPARTMENTS, matrix: Record<string, Record<string, number>>) {
  const cols = Array.from({ length: weeks }, (_, i) => (i % 2 === 0 ? `W${i + 1}` : ""));
  const rows = deptList.map((d) => d.name);
  const anns = annotations(weeks);
  const examWeeks = new Set(anns.filter((a) => a.kind === "exam").map((a) => a.week));
  const data = deptList.map((d) => {
    const n = Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0);
    if (n < N_MIN) return Array.from({ length: weeks }, () => ({ value: null }));
    const rand = mulberry32(SEED_ROOT ^ hash(`${key}:${metric}:${d.id}`));
    const base = 0.55 + rand() * 0.18;
    return Array.from({ length: weeks }, (_, wi) => {
      let v = base + Math.sin(wi / 3) * 0.05 + (rand() - 0.5) * 0.08;
      if (examWeeks.has(wi)) v -= 0.12;
      v = Math.max(0.2, Math.min(0.9, v));
      return { value: Math.round(v * 100) / 100, label: `${d.name} · Wk ${wi + 1} — ${(v * 100).toFixed(0)}` };
    });
  });
  return { rows, cols, data };
}

function bandBreakdown(cells: { value: number | null }[][]) {
  const buckets = { thriving: 0, steady: 0, watch: 0, elevated: 0 };
  for (const row of cells) {
    for (const c of row) {
      if (c.value === null) continue;
      if (c.value >= 0.75) buckets.thriving++;
      else if (c.value >= 0.6) buckets.steady++;
      else if (c.value >= 0.45) buckets.watch++;
      else buckets.elevated++;
    }
  }
  return buckets;
}

function HeatmapPage() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/signals/heatmap" });
  const metric: MetricKey = (METRICS as readonly string[]).includes(s.metric) ? (s.metric as MetricKey) : "composite";
  const windowKey: WindowKey = (WINDOWS as readonly string[]).includes(s.window) ? (s.window as WindowKey) : "term";
  const dept = s.dept;

  const matrix = useMemo(() => cohortMatrix(), []);
  const deptOptions = [
    { id: "all", name: "All institution", n: Object.values(matrix).reduce((a, r) => a + Object.values(r).reduce((x, y) => x + y, 0), 0) },
    ...SEED_DEPARTMENTS.map((d) => ({ id: d.id, name: d.name, n: Object.values(matrix[d.id] ?? {}).reduce((a, b) => a + b, 0) })),
  ];
  const selectedDept = deptOptions.find((d) => d.id === dept) ?? deptOptions[0]!;
  const suppressed = selectedDept.n < N_MIN;

  const weeks = WINDOW_WEEKS[windowKey];
  const cal = useMemo(() => calendarGrid(`${dept}:${windowKey}`, metric, weeks), [dept, windowKey, metric, weeks]);
  const trend = useMemo(() => weeklyTrend(`${dept}:${windowKey}`, metric, weeks), [dept, windowKey, metric, weeks]);
  const deptGrid = useMemo(() => deptWeeklyGrid(`inst:${windowKey}`, metric, weeks, SEED_DEPARTMENTS, matrix), [windowKey, metric, weeks, matrix]);

  const currentIdx = Math.round((trend[trend.length - 1]?.y ?? 65));
  const priorIdx   = Math.round((trend[trend.length - 5]?.y ?? currentIdx));
  const delta      = currentIdx - priorIdx;

  const bands = bandBreakdown(cal.data);
  const bandSlices = [
    { label: "Thriving (75+)",   value: bands.thriving, color: "var(--pc-primary)" },
    { label: "Steady (60-74)",   value: bands.steady,   color: "color-mix(in oklab, var(--pc-primary) 55%, var(--pc-surface2))" },
    { label: "Watch (45-59)",    value: bands.watch,    color: "color-mix(in oklab, var(--pc-accent-2, #b8563b) 55%, var(--pc-primary))" },
    { label: "Elevated (<45)",   value: bands.elevated, color: "var(--pc-warn, var(--pc-accent-2, #b8563b))" },
  ];
  const totalCells = bandSlices.reduce((a, b) => a + b.value, 0);

  // Best / worst days
  const flat: { di: number; wi: number; v: number }[] = [];
  cal.data.forEach((row, di) => row.forEach((c, wi) => { if (c.value !== null) flat.push({ di, wi, v: c.value }); }));
  flat.sort((a, b) => b.v - a.v);
  const best = flat.slice(0, 3);
  const worst = flat.slice(-3).reverse();

  function setMetric(m: MetricKey) { nav({ search: { ...s, metric: m } }); }
  function setWindow(w: WindowKey) { nav({ search: { ...s, window: w } }); }
  function setDept(id: string) { nav({ search: { ...s, dept: id } }); }

  return (
    <>
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Wellness heatmap"
        subtitle="Calendar view of the institution's wellbeing index, annotated with academic milestones. Aggregate-only, k ≥ 10 enforced across every cell."
      />

      <GlassCard className="mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-[auto_auto_1fr_auto] md:items-start">
          <Group label="Metric">
            {METRICS.map((k) => (
              <Chip key={k} active={k === metric} onClick={() => setMetric(k)}>{METRIC_LABEL[k]}</Chip>
            ))}
          </Group>
          <Group label="Window">
            {WINDOWS.map((k) => (
              <Chip key={k} active={k === windowKey} onClick={() => setWindow(k)}>{WINDOW_LABEL[k]}</Chip>
            ))}
          </Group>
          <Group label="Segment">
            {deptOptions.map((d) => {
              const dim = d.n < N_MIN;
              return (
                <Chip key={d.id} active={d.id === dept} disabled={dim && d.id !== dept} onClick={() => setDept(d.id)}>
                  {d.name}{dim && " · hidden"}
                </Chip>
              );
            })}
          </Group>
          <div className="flex flex-col gap-1.5 min-w-[120px] text-right">
            <Eyebrow>Cohort</Eyebrow>
            <div className="text-[12px] font-mono" style={{ color: "var(--pc-ink-2)" }}>
              n={selectedDept.n.toLocaleString()}
            </div>
          </div>
        </div>
      </GlassCard>

      {suppressed ? (
        <GlassCard className="p-10">
          <EmptyState kind="suppressed" title="Hidden to protect anonymity" subtitle={`${selectedDept.name} cohort is below k=10.`} />
        </GlassCard>
      ) : (
        <>
          <StaggerGrid className="grid grid-cols-12 gap-4">
            {/* Hero */}
            <FlowCard className="col-span-12 md:col-span-4 lg:col-span-3 p-5">
              <Eyebrow>{METRIC_LABEL[metric]}</Eyebrow>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-serif leading-none" style={{ fontSize: "clamp(2.2rem, 5vw, 3rem)", color: "var(--pc-ink)" }}>
                  <CountUp value={currentIdx} decimals={0} />
                </span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>/ 100</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--pc-surface2)",
                  border: "1px solid var(--pc-border)",
                  color: delta > 0 ? "var(--pc-good, var(--pc-primary))" : delta < 0 ? "var(--pc-warn, var(--pc-accent-2))" : "var(--pc-muted)",
                }}>
                {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(delta > 0 ? "+" : "") + delta.toFixed(0)} vs. 4 wks ago
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Weeks</div>
                  <div className="mt-0.5 font-mono" style={{ color: "var(--pc-ink)" }}>{weeks}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em" }}>Cells</div>
                  <div className="mt-0.5 font-mono" style={{ color: "var(--pc-ink)" }}>{totalCells.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>k=10</span>
                <span>Every cell aggregates 10+ students.</span>
              </div>
            </FlowCard>

            {/* Weekly trend */}
            <FlowCard className="col-span-12 md:col-span-8 lg:col-span-9 p-5">
              <SectionTitle title={`Weekly ${METRIC_LABEL[metric].toLowerCase()} · rolling`} subtitle="Weekly aggregate score over the selected window." />
              <div className="mt-3">
                <TrendArea data={trend} height={200} color="var(--pc-primary)" ariaLabel="Weekly wellness trend" yDomain={[30, 90]} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
                {cal.annotations.map((a) => (
                  <span key={a.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--pc-surface2)",
                      border: "1px solid var(--pc-border)",
                      color: a.kind === "exam" ? "var(--pc-warn, var(--pc-accent-2))" : a.kind === "festival" ? "var(--pc-good, var(--pc-primary))" : "var(--pc-ink-2)",
                    }}>
                    <CalendarDays className="h-3 w-3" /> Wk {a.week + 1} · {a.label}
                  </span>
                ))}
              </div>
            </FlowCard>

            {/* Calendar heatmap */}
            <FlowCard className="col-span-12 lg:col-span-8 p-5">
              <SectionTitle title="Day-by-day calendar" subtitle="Rows are days of the week; columns are weeks. Darker = higher score." />
              <div className="mt-3 overflow-x-auto">
                <Heatmap rows={cal.rows} cols={cal.cols} data={cal.data} min={0.15} max={0.95} cellSize={22} ariaLabel="Weekly wellness calendar heatmap" />
              </div>
            </FlowCard>

            {/* Band breakdown */}
            <FlowCard className="col-span-12 lg:col-span-4 p-5">
              <SectionTitle title="Band breakdown" subtitle="How the cohort's days distribute across wellbeing bands." />
              <div className="mt-3 flex items-center gap-4">
                <Donut slices={bandSlices} size={148} stroke={16} centerLabel={`${totalCells}`} centerSub="days" ariaLabel="Wellbeing band donut" />
                <ul className="flex-1 min-w-0 space-y-1.5">
                  {bandSlices.map((b) => (
                    <li key={b.label} className="flex items-center gap-2 text-[11.5px]">
                      <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: b.color }} />
                      <span className="truncate" style={{ color: "var(--pc-ink-2)" }}>{b.label}</span>
                      <span className="ml-auto font-mono" style={{ color: "var(--pc-muted)" }}>
                        {totalCells ? ((b.value / totalCells) * 100).toFixed(0) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FlowCard>

            {/* Dept × week */}
            <FlowCard className="col-span-12 lg:col-span-8 p-5">
              <SectionTitle title="Program × week" subtitle="Institution-wide small-multiples view. Hidden rows fall below k=10." />
              <div className="mt-3 overflow-x-auto">
                <Heatmap rows={deptGrid.rows} cols={deptGrid.cols} data={deptGrid.data} min={0.2} max={0.9} cellSize={20} ariaLabel="Program by week wellness matrix" />
              </div>
            </FlowCard>

            {/* Best / worst */}
            <FlowCard className="col-span-12 lg:col-span-4 p-5">
              <SectionTitle title="Highest / lowest days" subtitle="Top and bottom cells in the current window." />
              <div className="mt-3 grid gap-3">
                <BestList title="Highest" items={best} tone="good" />
                <BestList title="Lowest" items={worst} tone="warn" />
              </div>
            </FlowCard>
          </StaggerGrid>

          <Reveal className="mt-6 text-[11px] text-center" style={{ color: "var(--pc-muted)" }}>
            Aggregate only. Cells with fewer than 10 students are suppressed and shown with a hatched pattern.
          </Reveal>
        </>
      )}
    </>
  );
}

// ── UI atoms ────────────────────────────────────────────────────
function BestList({ title, items, tone }: { title: string; items: { di: number; wi: number; v: number }[]; tone: "good" | "warn" }) {
  return (
    <div>
      <Eyebrow>{title}</Eyebrow>
      <ul className="mt-1.5 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 text-[11.5px]">
            <span className="font-mono w-16" style={{ color: "var(--pc-muted)" }}>{DAY_ROWS[it.di]} · Wk {it.wi + 1}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
              <div className="h-full" style={{ width: `${it.v * 100}%`, background: tone === "good" ? "var(--pc-primary)" : "var(--pc-warn, var(--pc-accent-2))" }} />
            </div>
            <span className="font-mono w-9 text-right" style={{ color: "var(--pc-ink)" }}>{(it.v * 100).toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </div>
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
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <Eyebrow>{label}</Eyebrow>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
function Chip({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="text-[12px] px-2.5 py-1 rounded-full disabled:opacity-60"
      style={{
        background: active ? "color-mix(in oklab, var(--pc-accent) 16%, var(--pc-surface2))" : "var(--pc-surface)",
        color: active ? "var(--pc-accent, var(--pc-primary))" : "var(--pc-ink-2)",
        border: active ? "1px solid color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))" : "1px solid var(--pc-border)",
      }}
    >
      {children}
    </button>
  );
}
