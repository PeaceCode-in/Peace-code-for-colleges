import { useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Lock, ArrowUpRight, ArrowDownRight, Minus, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/college/primitives";
import {
  useInstitutionalIndex,
  useActiveEngagement,
  useSafetyPulse,
  useMoodTrend,
  useTopConcerns,
  useDepartmentHeatmap,
  useSessionsDelivered,
  useAverageWait,
  usePrograms,
  useDashboardFilters,
  K_ANON,
} from "@/lib/insights-store";

// ─── Shared tile chrome ────────────────────────────────────────
export function Tile({
  title,
  eyebrow,
  className = "",
  children,
  footer,
  sampleSize,
  isSuppressed,
}: {
  title: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
  sampleSize: number;
  isSuppressed: boolean;
}) {
  return (
    <GlassCard className={`p-5 flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <div
              className="text-[10px] uppercase mb-1"
              style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
            >
              {eyebrow}
            </div>
          )}
          <h3
            className="font-serif text-[16px] leading-[1.15] truncate"
            style={{ color: "var(--pc-ink)" }}
          >
            {title}
          </h3>
        </div>
      </div>
      <div className="flex-1 mt-4 min-h-0">
        {isSuppressed ? <SampleTooSmall n={sampleSize} /> : children}
      </div>
      <div
        className="mt-4 pt-3 flex items-center justify-between gap-2 text-[10.5px]"
        style={{ borderTop: "1px solid var(--pc-border)", color: "var(--pc-muted)" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Anonymized · n = {sampleSize.toLocaleString()}
        </span>
        {footer && <span>{footer}</span>}
      </div>
    </GlassCard>
  );
}

export function SampleTooSmall({ n }: { n: number }) {
  return (
    <div
      className="h-full min-h-[140px] rounded-xl flex flex-col items-center justify-center text-center p-4"
      style={{
        background:
          "repeating-linear-gradient(45deg, var(--pc-surface2), var(--pc-surface2) 6px, transparent 6px, transparent 12px)",
        border: "1px dashed var(--pc-border)",
      }}
    >
      <Lock className="h-4 w-4 mb-2" style={{ color: "var(--pc-muted)" }} />
      <div className="text-[12px]" style={{ color: "var(--pc-ink-2)" }}>
        Sample too small to display
      </div>
      <div className="text-[10.5px] mt-1" style={{ color: "var(--pc-muted)" }}>
        Protecting anonymity · n = {n} &lt; k = {K_ANON}
      </div>
    </div>
  );
}

function DeltaChip({ delta, unit = "" }: { delta: number; unit?: string }) {
  const dir = delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat";
  const color = dir === "up" ? "var(--pc-good)" : dir === "down" ? "var(--pc-warn)" : "var(--pc-muted)";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 12%, var(--pc-surface2))`,
        border: `1px solid color-mix(in oklab, ${color} 24%, var(--pc-border))`,
      }}
    >
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}{delta}{unit}
    </span>
  );
}

// ─── Row 1: Institutional Wellbeing Index ──────────────────────
export function InstitutionalWellbeingIndex() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useInstitutionalIndex(filters);
  return (
    <Tile
      title="Institutional Wellbeing Index"
      eyebrow="Composite this week"
      className="lg:col-span-6"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
      footer="12-week trailing"
    >
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] items-center gap-6">
          <RadialGauge value={data.index} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <span
                className="font-serif text-[44px] leading-none"
                style={{ color: "var(--pc-ink)" }}
              >
                {data.index}
              </span>
              <DeltaChip delta={data.delta} />
            </div>
            <p className="mt-2 text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
              A weighted read of mood balance, help-seeking, and program follow-through across the engaged cohort.
            </p>
            <div className="mt-4 h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.spark.map((v, i) => ({ x: i, v }))}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="var(--pc-primary)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                  />
                  <Tooltip content={<TinyTip suffix="" />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Tile>
  );
}

function RadialGauge({ value }: { value: number }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const dash = `${c * pct} ${c}`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--pc-surface2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--pc-primary)"
          strokeWidth={stroke}
          strokeDasharray={dash}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 400ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>
            Index
          </div>
          <div className="font-serif text-[28px] leading-none mt-1" style={{ color: "var(--pc-ink)" }}>
            {Math.round(value)}
          </div>
          <div className="text-[10.5px] mt-1" style={{ color: "var(--pc-muted)" }}>
            of 100
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Row 1: Active engagement ──────────────────────────────────
export function ActiveEngagementTile() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useActiveEngagement(filters);
  return (
    <Tile
      title="Active engagement"
      eyebrow="Logged in this week"
      className="lg:col-span-3"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
    >
      {data && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[40px] leading-none" style={{ color: "var(--pc-ink)" }}>
              {data.activePct}%
            </span>
            <span className="text-[12px]" style={{ color: "var(--pc-muted)" }}>of enrolled</span>
          </div>
          <div className="mt-4">
            <div
              className="h-3 w-full rounded-full overflow-hidden flex"
              style={{ background: "var(--pc-surface2)" }}
            >
              {data.segments.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    width: `${s.pct}%`,
                    background:
                      i === 0
                        ? "var(--pc-primary)"
                        : i === 1
                          ? "var(--pc-accent-2)"
                          : "color-mix(in oklab, var(--pc-muted) 60%, var(--pc-surface2))",
                    transition: "width 300ms ease-out",
                  }}
                  title={`${s.label} · ${s.pct}%`}
                />
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
              {data.segments.map((s) => (
                <span key={s.label}>{s.label} {s.pct}%</span>
              ))}
            </div>
          </div>
        </>
      )}
    </Tile>
  );
}

// ─── Row 1: Safety pulse ───────────────────────────────────────
export function SafetyPulseTile() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useSafetyPulse(filters);
  const dotColor = data
    ? data.level === "green"
      ? "var(--pc-good)"
      : data.level === "amber"
        ? "var(--pc-accent-2)"
        : "var(--pc-warn)"
    : "var(--pc-muted)";
  const label = data
    ? data.level === "green"
      ? "Steady"
      : data.level === "amber"
        ? "Watchful"
        : "Elevated"
    : "";
  return (
    <Tile
      title="Safety pulse"
      eyebrow="Aggregate risk"
      className="lg:col-span-3"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
    >
      {data && (
        <>
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full"
              style={{ background: dotColor, boxShadow: `0 0 0 6px color-mix(in oklab, ${dotColor} 18%, transparent)` }}
            />
            <span className="font-serif text-[22px]" style={{ color: "var(--pc-ink)" }}>
              {label}
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed" style={{ color: "var(--pc-ink-2)" }}>
            <span style={{ color: "var(--pc-ink)", fontWeight: 500 }}>{data.elevatedPct}%</span> of engaged users in the elevated bracket this week
            <span style={{ color: "var(--pc-muted)" }}> (n = {data.engaged.toLocaleString()})</span>.
          </p>
          <p className="mt-2 text-[11px]" style={{ color: "var(--pc-muted)" }}>
            No individual flags are shown here — this is a rolled-up read only.
          </p>
        </>
      )}
    </Tile>
  );
}

// ─── Row 2: Mood trend ─────────────────────────────────────────
const MOOD_SERIES: { key: "Calm" | "Stressed" | "Low" | "Anxious"; color: string }[] = [
  { key: "Calm", color: "var(--pc-good)" },
  { key: "Stressed", color: "var(--pc-accent-2)" },
  { key: "Low", color: "var(--pc-muted)" },
  { key: "Anxious", color: "var(--pc-warn)" },
];

export function MoodTrendChart() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useMoodTrend(filters);
  const [active, setActive] = useState<Record<string, boolean>>({
    Calm: true, Stressed: true, Low: true, Anxious: true,
  });
  return (
    <Tile
      title="Mood trend — 90 days"
      eyebrow="Aggregate self-reports"
      className="lg:col-span-8"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
      footer="Tap a series to toggle"
    >
      {data && (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {MOOD_SERIES.map((s) => {
              const on = active[s.key];
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive((a) => ({ ...a, [s.key]: !a[s.key] }))}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full"
                  style={{
                    background: on ? "var(--pc-surface2)" : "transparent",
                    border: "1px solid var(--pc-border)",
                    color: on ? "var(--pc-ink)" : "var(--pc-muted)",
                    opacity: on ? 1 : 0.55,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.key}
                </button>
              );
            })}
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  {MOOD_SERIES.map((s) => (
                    <linearGradient id={`g-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="var(--pc-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="var(--pc-muted)"
                  tick={{ fontSize: 10 }}
                  interval={14}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="var(--pc-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip suffix="" />} />
                {MOOD_SERIES.filter((s) => active[s.key]).map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={1.75}
                    fill={`url(#g-${s.key})`}
                    isAnimationActive
                    animationDuration={280}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Tile>
  );
}

// ─── Row 2: Top concerns bubble ────────────────────────────────
export function TopConcernsCloud() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useTopConcerns(filters);
  const maxCount = data ? Math.max(...data.map((d) => d.count)) : 1;
  return (
    <Tile
      title="Top concerns"
      eyebrow="Session themes"
      className="lg:col-span-4"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
      footer="Bubble size = frequency"
    >
      {data && (
        <div className="flex flex-wrap gap-3 items-center justify-center min-h-[240px]">
          {data.map((b) => {
            const size = 44 + (b.count / maxCount) * 78;
            const up = b.delta > 0;
            const bg = up
              ? "color-mix(in oklab, var(--pc-warn) 18%, var(--pc-surface2))"
              : "color-mix(in oklab, var(--pc-good) 18%, var(--pc-surface2))";
            const border = up
              ? "color-mix(in oklab, var(--pc-warn) 40%, var(--pc-border))"
              : "color-mix(in oklab, var(--pc-good) 40%, var(--pc-border))";
            return (
              <div
                key={b.theme}
                className="rounded-full grid place-items-center text-center px-2"
                style={{
                  width: size,
                  height: size,
                  background: bg,
                  border: `1px solid ${border}`,
                  transition: "transform 200ms ease",
                }}
                title={`${b.theme} · ${b.count} mentions · ${b.delta > 0 ? "+" : ""}${b.delta}% vs last period`}
              >
                <div>
                  <div className="text-[11px] font-medium" style={{ color: "var(--pc-ink)" }}>
                    {b.theme}
                  </div>
                  <div className="text-[10px]" style={{ color: up ? "var(--pc-warn)" : "var(--pc-good)" }}>
                    {b.delta > 0 ? "+" : ""}{b.delta}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Tile>
  );
}

// ─── Row 3: Department heatmap ─────────────────────────────────
export function DepartmentHeatmap() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useDepartmentHeatmap(filters);
  const grid = useMemo(() => {
    if (!data) return null;
    const map = new Map<string, Map<string, typeof data.cells[number]>>();
    for (const c of data.cells) {
      if (!map.has(c.dept)) map.set(c.dept, new Map());
      map.get(c.dept)!.set(c.band, c);
    }
    return map;
  }, [data]);
  return (
    <Tile
      title="Department heatmap"
      eyebrow="Wellbeing bands"
      className="lg:col-span-6"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
      footer="Hatched = below k=10, hidden"
    >
      {data && grid && (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-[11px]" style={{ borderCollapse: "separate", borderSpacing: 4 }}>
            <thead>
              <tr>
                <th className="text-left font-normal" style={{ color: "var(--pc-muted)" }}></th>
                {data.bands.map((b) => (
                  <th
                    key={b}
                    className="text-left font-normal py-1"
                    style={{ color: "var(--pc-muted)" }}
                  >
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.depts.map((dept) => (
                <tr key={dept}>
                  <td
                    className="pr-3 whitespace-nowrap"
                    style={{ color: "var(--pc-ink-2)", fontSize: 11 }}
                  >
                    {dept}
                  </td>
                  {data.bands.map((band) => {
                    const cell = grid.get(dept)?.get(band);
                    if (!cell) return <td key={band} />;
                    if (cell.locked) {
                      return (
                        <td key={band}>
                          <div
                            className="h-9 rounded-md grid place-items-center"
                            title="Sample too small — hidden to protect anonymity"
                            style={{
                              background:
                                "repeating-linear-gradient(45deg, var(--pc-surface2), var(--pc-surface2) 4px, transparent 4px, transparent 8px)",
                              border: "1px dashed var(--pc-border)",
                            }}
                          >
                            <Lock className="h-3 w-3" style={{ color: "var(--pc-muted)" }} />
                          </div>
                        </td>
                      );
                    }
                    const bandColor =
                      band === "Thriving"
                        ? "var(--pc-good)"
                        : band === "Steady"
                          ? "var(--pc-primary)"
                          : band === "Stretched"
                            ? "var(--pc-accent-2)"
                            : "var(--pc-warn)";
                    return (
                      <td key={band}>
                        <div
                          className="h-9 rounded-md grid place-items-center text-[10.5px]"
                          title={`${dept} · ${band} · n = ${cell.n}`}
                          style={{
                            background: `color-mix(in oklab, ${bandColor} ${8 + cell.intensity * 55}%, var(--pc-surface2))`,
                            color: "var(--pc-ink)",
                            border: "1px solid var(--pc-border)",
                            transition: "background 220ms ease",
                          }}
                        >
                          {cell.n}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Tile>
  );
}

// ─── Row 3: Sessions delivered ─────────────────────────────────
export function SessionsDeliveredTile() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useSessionsDelivered(filters);
  return (
    <Tile
      title="Sessions delivered"
      eyebrow="Last 7 days"
      className="lg:col-span-3"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
    >
      {data && (
        <>
          <div className="font-serif text-[36px] leading-none" style={{ color: "var(--pc-ink)" }}>
            {data.total}
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--pc-muted)" }}>
            Individual · Group · Self-guided
          </div>
          <div className="h-[120px] mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bars} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--pc-border)" strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="day" stroke="var(--pc-muted)" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--pc-muted)" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip suffix="" />} />
                <Bar dataKey="Individual" stackId="s" fill="var(--pc-primary)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Group" stackId="s" fill="var(--pc-accent-2)" />
                <Bar dataKey="Self" stackId="s" fill="color-mix(in oklab, var(--pc-muted) 60%, var(--pc-surface2))" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 9, color: "var(--pc-muted)" }} iconSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Tile>
  );
}

// ─── Row 3: Average wait ───────────────────────────────────────
export function AverageWaitTile() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = useAverageWait(filters);
  return (
    <Tile
      title="Median wait time"
      eyebrow="Request → first session"
      className="lg:col-span-3"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
    >
      {data && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-[40px] leading-none" style={{ color: "var(--pc-ink)" }}>
              {data.hours}
            </span>
            <span className="text-[12px]" style={{ color: "var(--pc-muted)" }}>hours</span>
          </div>
          <div className="mt-3">
            <DeltaChip delta={-data.delta} unit="h" />
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed" style={{ color: "var(--pc-muted)" }}>
            A shorter wait means students are being reached earlier — this is the guardrail metric for counsellor capacity.
          </p>
        </>
      )}
    </Tile>
  );
}

// ─── Row 4: Program impact strip ───────────────────────────────
export function ProgramImpactStrip() {
  const { filters } = useDashboardFilters();
  const { data, sampleSize, isSuppressed } = usePrograms(filters);
  return (
    <Tile
      title="Program impact"
      eyebrow="Active this term"
      className="lg:col-span-12"
      sampleSize={sampleSize}
      isSuppressed={isSuppressed}
    >
      {data && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {data.map((p) => (
            <div
              key={p.name}
              className="snap-start shrink-0 rounded-2xl p-4 w-[240px]"
              style={{
                background: "var(--pc-surface2)",
                border: "1px solid var(--pc-border)",
              }}
            >
              <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>
                {p.name}
              </div>
              <div className="text-[10.5px] mt-1" style={{ color: "var(--pc-muted)" }}>
                Cohort n = {p.cohort.toLocaleString()}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
                <MiniStat label="Enrolled" value={`${p.enrolledPct}%`} />
                <MiniStat label="Completed" value={`${p.completedPct}%`} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10.5px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}>
                  Mood Δ pre → post
                </span>
                <DeltaChip delta={p.moodDelta} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Tile>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase" style={{ letterSpacing: "0.12em", color: "var(--pc-muted)" }}>
        {label}
      </div>
      <div className="font-serif text-[20px] leading-none mt-1" style={{ color: "var(--pc-ink)" }}>
        {value}
      </div>
    </div>
  );
}

// ─── Chart tooltips ────────────────────────────────────────────
function ChartTooltip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-[11px]"
      style={{
        background: "var(--pc-surface)",
        border: "1px solid var(--pc-border)",
        boxShadow: "0 8px 24px -10px color-mix(in oklab, var(--pc-ink) 30%, transparent)",
      }}
    >
      <div style={{ color: "var(--pc-muted)" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--pc-ink)" }}>
            {p.dataKey} · {p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
function TinyTip({ active, payload, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md px-2 py-1 text-[10.5px]"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}
    >
      {payload[0].value}{suffix}
    </div>
  );
}
