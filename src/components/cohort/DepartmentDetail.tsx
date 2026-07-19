// Right-pane detail view for a single department. Composes the six data
// tiles required by the spec into a 12-column bento. Every tile that
// consumes a slice runs its N through applyKAnonymity and renders a
// <SuppressedTile /> when the guardrail trips.
import { useMemo, Fragment } from "react";
import {
  LineChart, Line, Area, AreaChart, XAxis, YAxis, Tooltip, ReferenceArea,
  Brush, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import { AnonymityBadge, GlassCard } from "@/components/college/primitives";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { applyKAnonymity, isSuppressed, K_MIN } from "@/lib/cohort-selectors";
import type { DepartmentInsight, YearBand, RiskBand, FunnelKey, RadarAxis } from "@/lib/dashboard-mock.departments";

const YEAR_BANDS: YearBand[] = ["All", "Y1", "Y2", "Y3", "Y4", "PG"];

const RISK_LABEL: Record<RiskBand, string> = {
  minimal: "Minimal", mild: "Mild", moderate: "Moderate", severe: "Severe",
};
const RISK_TOKEN: Record<RiskBand, string> = {
  minimal: "var(--pc-good)",
  mild: "var(--pc-accent)",
  moderate: "var(--pc-accent-2)",
  severe: "var(--pc-danger)",
};

const FUNNEL_LABEL: Record<FunnelKey, string> = {
  invited: "Invited",
  signed_up: "Signed up",
  active_7d: "Active 7d",
  active_30d: "Active 30d",
  sustained: "Sustained (≥3)",
};

const RADAR_AXES: { key: RadarAxis; label: string }[] = [
  { key: "engagement",        label: "Engagement" },
  { key: "sustainedUse",      label: "Sustained use" },
  { key: "phq9Improvement",   label: "PHQ-9 improvement" },
  { key: "gad7Improvement",   label: "GAD-7 improvement" },
  { key: "sessionCompletion", label: "Session completion" },
];

export function DepartmentDetail({
  dept,
  year,
  onYearChange,
  riskFilter,
  onRiskFilter,
}: {
  dept: DepartmentInsight;
  year: YearBand;
  onYearChange: (y: YearBand) => void;
  riskFilter: RiskBand | null;
  onRiskFilter: (b: RiskBand | null) => void;
}) {
  // Year filter narrows the cohort proportionally. This is a mock — a real
  // pipeline would return a per-year slice. We derive a factor and re-apply
  // suppression so a narrow slice can still trip k<10.
  const factor = year === "All" ? 1 : 0.19 + (YEAR_BANDS.indexOf(year) % 5) * 0.01;
  const scaledN = Math.round(dept.n * factor);
  const scaled = useMemo(() => scale(dept, factor), [dept, factor]);

  return (
    <section className="flex-1 min-w-0 flex flex-col gap-4">
      {/* Header strip ─────────────────────────────────────────── */}
      <GlassCard className="p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase" style={{ color: "var(--pc-muted)", letterSpacing: "0.14em", fontFamily: "var(--font-serif)" }}>
              {dept.school}
            </div>
            <h2 className="font-serif text-[22px] leading-tight mt-1 tracking-tight" style={{ color: "var(--pc-ink)" }}>
              {dept.name}
            </h2>
            <div className="mt-2">
              <AnonymityBadge n={scaledN} k={K_MIN} />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <YearFilter value={year} onChange={onYearChange} />
          </div>
        </div>
      </GlassCard>

      {/* Bento grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-12 gap-4">
        <Tile title="Wellbeing index" subtitle="PHQ-9 and GAD-7, last 26 weeks" className="xl:col-span-8 lg:col-span-6" n={scaledN}>
          {scaled ? <WellbeingChart dept={scaled} /> : <SuppressedTile />}
        </Tile>

        <Tile title="Engagement funnel" subtitle="Invited → Sustained" className="xl:col-span-4 lg:col-span-6" n={scaledN}>
          {scaled ? <EngagementFunnel dept={scaled} /> : <SuppressedTile />}
        </Tile>

        <Tile title="Risk distribution" subtitle="Screening severity · click to filter chart" className="xl:col-span-6 lg:col-span-6" n={scaledN}>
          {scaled
            ? <RiskDistribution dept={scaled} active={riskFilter} onToggle={onRiskFilter} />
            : <SuppressedTile />}
        </Tile>

        <Tile title="Top presenting themes" subtitle={`Below n=${K_MIN} is suppressed`} className="xl:col-span-6 lg:col-span-6" n={scaledN}>
          {scaled ? <ThemesBar dept={scaled} /> : <SuppressedTile />}
        </Tile>

        <Tile title="Session cadence" subtitle="Day × hour · session starts" className="xl:col-span-8 lg:col-span-6" n={scaledN}>
          {scaled ? <CadenceHeatmap dept={scaled} /> : <SuppressedTile />}
        </Tile>

        <Tile title="Peer benchmark" subtitle="Department · institution · national" className="xl:col-span-4 lg:col-span-6" n={scaledN}>
          {scaled ? <BenchmarkRadar dept={scaled} /> : <SuppressedTile />}
        </Tile>
      </div>
    </section>
  );
}

// ─── Tile wrapper ─────────────────────────────────────────────
function Tile({
  title, subtitle, className = "", children, n,
}: { title: string; subtitle?: string; className?: string; children: React.ReactNode; n: number }) {
  const suppressed = n < K_MIN;
  return (
    <GlassCard className={`p-4 flex flex-col min-w-0 ${className}`}>
      <header className="mb-3">
        <h3 className="text-[13px] font-medium" style={{ color: "var(--pc-ink)" }}>{title}</h3>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "var(--pc-muted)" }}>{subtitle}</p>}
      </header>
      <div className="flex-1 min-h-0">
        {suppressed ? <SuppressedTile /> : children}
      </div>
      <footer className="mt-3 pt-2 flex items-center justify-between text-[10.5px]" style={{ color: "var(--pc-muted)", borderTop: "1px solid var(--pc-border)" }}>
        <span>Anonymized · n = {suppressed ? "hidden" : n.toLocaleString()}</span>
        <span>k ≥ {K_MIN}</span>
      </footer>
    </GlassCard>
  );
}

// ─── Header year filter ───────────────────────────────────────
function YearFilter({ value, onChange }: { value: YearBand; onChange: (y: YearBand) => void }) {
  return (
    <div role="tablist" aria-label="Academic year" className="inline-flex rounded-full p-0.5" style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}>
      {YEAR_BANDS.map((y) => {
        const active = y === value;
        return (
          <button
            key={y}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(y)}
            className="px-3 py-1 text-[11.5px] rounded-full outline-none focus-visible:ring-2 transition-colors"
            style={{
              background: active ? "var(--pc-accent)" : "transparent",
              color: active ? "var(--pc-on-accent, #fff)" : "var(--pc-ink-2)",
              // @ts-expect-error focus ring var
              "--tw-ring-color": "var(--pc-accent)",
            }}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
}

// ─── Wellbeing chart ──────────────────────────────────────────
function WellbeingChart({ dept }: { dept: DepartmentInsight }) {
  const data = dept.phq9Series.map((v, i) => ({
    week: `W${i + 1}`,
    phq9: v,
    gad7: dept.gad7Series[i],
  }));
  return (
    <div className="h-[260px]" role="img" aria-label={`Weekly PHQ-9 and GAD-7 for ${dept.name} over 26 weeks`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
          <CartesianGrid stroke="var(--pc-border)" strokeDasharray="2 4" />
          <XAxis dataKey="week" stroke="var(--pc-muted)" tick={{ fontSize: 10 }} interval={3} />
          <YAxis stroke="var(--pc-muted)" tick={{ fontSize: 10 }} width={28} />
          <Tooltip content={<CustomTooltip unit="" />} />
          <ReferenceArea y1={0} y2={4} fill="var(--pc-good)" fillOpacity={0.08} ifOverflow="hidden" />
          <Line type="monotone" dataKey="phq9" stroke="var(--pc-accent)" strokeWidth={2} dot={false} name="PHQ-9" />
          <Line type="monotone" dataKey="gad7" stroke="var(--pc-accent-2)" strokeWidth={2} dot={false} name="GAD-7" />
          <Brush dataKey="week" height={20} stroke="var(--pc-border)" fill="var(--pc-surface2)" travellerWidth={8} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CustomTooltip({ active, payload, label, unit = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md px-2.5 py-1.5 text-[11px] shadow-sm" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
      <div className="mb-0.5" style={{ color: "var(--pc-muted)" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} aria-hidden />
          <span style={{ color: "var(--pc-ink-2)" }}>{p.name}</span>
          <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Engagement funnel ────────────────────────────────────────
function EngagementFunnel({ dept }: { dept: DepartmentInsight }) {
  const rows = (Object.keys(dept.funnel) as FunnelKey[]).map((k) => ({
    key: k,
    label: FUNNEL_LABEL[k],
    n: dept.funnel[k],
    // Recharts Funnel expects `value` and `name`.
    value: dept.funnel[k],
    name: FUNNEL_LABEL[k],
    fill: "color-mix(in oklab, var(--pc-accent) 88%, var(--pc-ink))",
  }));
  const invited = dept.funnel.invited || 1;

  return (
    <div className="flex gap-3 h-[260px]" role="group" aria-label="Engagement funnel">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip content={<CustomTooltip />} />
            <Funnel data={rows} dataKey="value" isAnimationActive={false}>
              {rows.map((_, i) => (
                <Cell key={i} fill={`color-mix(in oklab, var(--pc-accent) ${88 - i * 12}%, var(--pc-surface2))`} />
              ))}
              <LabelList position="right" fill="var(--pc-ink-2)" stroke="none" fontSize={10} dataKey="name" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-1/2 flex flex-col justify-center gap-2 text-[11.5px]">
        {rows.map((r, i) => {
          const pct = Math.round((r.n / invited) * 100);
          const supp = isSuppressed(applyKAnonymity(r.n, r.n));
          return (
            <li key={r.key} className="flex items-baseline justify-between gap-2">
              <span style={{ color: "var(--pc-ink-2)" }}>{i + 1}. {r.label}</span>
              <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>
                {supp ? "—" : r.n.toLocaleString()} <span style={{ color: "var(--pc-muted)" }}>· {supp ? "hidden" : `${pct}%`}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Risk distribution ────────────────────────────────────────
function RiskDistribution({
  dept, active, onToggle,
}: { dept: DepartmentInsight; active: RiskBand | null; onToggle: (b: RiskBand | null) => void }) {
  const bands: RiskBand[] = ["minimal", "mild", "moderate", "severe"];
  const total = bands.reduce((s, b) => s + dept.riskDist[b], 0) || 1;
  return (
    <div className="flex flex-col gap-3" role="group" aria-label="Risk severity distribution">
      <div
        className="w-full h-8 rounded-full overflow-hidden flex"
        style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
      >
        {bands.map((b) => {
          const n = dept.riskDist[b];
          const supp = isSuppressed(applyKAnonymity(n, n));
          const pct = (n / total) * 100;
          const isActive = active === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => onToggle(active === b ? null : b)}
              className="h-full outline-none focus-visible:ring-2 transition-opacity"
              style={{
                width: `${pct}%`,
                background: RISK_TOKEN[b],
                opacity: active && !isActive ? 0.45 : 1,
                // @ts-expect-error focus ring var
                "--tw-ring-color": "var(--pc-accent)",
              }}
              aria-label={`${RISK_LABEL[b]}: ${supp ? "hidden" : n} students, ${pct.toFixed(1)}%`}
              aria-pressed={isActive}
              title={`${RISK_LABEL[b]} — ${supp ? "hidden" : n.toLocaleString()} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <ul className="grid grid-cols-2 gap-2 text-[11.5px]">
        {bands.map((b) => {
          const n = dept.riskDist[b];
          const supp = isSuppressed(applyKAnonymity(n, n));
          const isActive = active === b;
          return (
            <li key={b}>
              <button
                type="button"
                onClick={() => onToggle(active === b ? null : b)}
                aria-pressed={isActive}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md outline-none focus-visible:ring-2"
                style={{
                  background: isActive ? "color-mix(in oklab, var(--pc-accent) 10%, transparent)" : "transparent",
                  border: `1px solid ${isActive ? "color-mix(in oklab, var(--pc-accent) 40%, var(--pc-border))" : "var(--pc-border)"}`,
                  // @ts-expect-error focus ring
                  "--tw-ring-color": "var(--pc-accent)",
                }}
              >
                <span aria-hidden className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_TOKEN[b] }} />
                <span className="flex-1 text-left" style={{ color: "var(--pc-ink-2)" }}>{RISK_LABEL[b]}</span>
                <span className="tabular-nums" style={{ color: "var(--pc-ink)" }}>
                  {supp ? "—" : n.toLocaleString()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Themes bar ───────────────────────────────────────────────
function ThemesBar({ dept }: { dept: DepartmentInsight }) {
  const rows = dept.themes.map((t) => {
    const supp = isSuppressed(applyKAnonymity(t.n, t.n));
    return { name: t.tag, value: supp ? 0 : t.n, suppressed: supp };
  });
  return (
    <div className="h-[240px]" role="img" aria-label={`Top presenting themes for ${dept.name}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 32, left: 0, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="var(--pc-border)" strokeDasharray="2 4" />
          <XAxis type="number" stroke="var(--pc-muted)" tick={{ fontSize: 10 }} />
          <YAxis type="category" dataKey="name" stroke="var(--pc-muted)" tick={{ fontSize: 10 }} width={110} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={4}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.suppressed ? "var(--pc-surface2)" : "var(--pc-accent)"} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              fontSize={10}
              fill="var(--pc-ink-2)"
              formatter={(v: number) => (v === 0 ? "hidden" : v.toLocaleString())}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Cadence heatmap (7 × 24) ─────────────────────────────────
function CadenceHeatmap({ dept }: { dept: DepartmentInsight }) {
  const flat = dept.heatmap.flat();
  const max = Math.max(1, ...flat);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div role="img" aria-label={`Session start heatmap for ${dept.name} across 7 days and 24 hours`} className="text-[10px]" style={{ color: "var(--pc-muted)" }}>
      <div className="grid" style={{ gridTemplateColumns: "28px repeat(24, minmax(0, 1fr))" }}>
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="text-center pb-1">{h % 3 === 0 ? h : ""}</div>
        ))}
        {dept.heatmap.map((row, day) => (
          <Fragment key={`row-${day}`}>
            <div className="pr-1 py-0.5 text-right tabular-nums">{days[day]}</div>
            {row.map((v, h) => {
              const t = v / max;
              return (
                <div
                  key={`${day}-${h}`}
                  className="aspect-square rounded-[3px] m-[1px]"
                  style={{
                    background: `color-mix(in oklab, var(--pc-accent) ${Math.round(t * 90)}%, var(--pc-surface2))`,
                    outline: "1px solid transparent",
                  }}
                  title={`${days[day]} ${h}:00 — ${v} session starts`}
                  aria-label={`${days[day]} ${h}:00, ${v} session starts`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Peer benchmark radar ─────────────────────────────────────
function BenchmarkRadar({ dept }: { dept: DepartmentInsight }) {
  const data = RADAR_AXES.map((a) => ({
    axis: a.label,
    Department: dept.radar.department[a.key],
    Institution: dept.radar.institution[a.key],
    National: dept.radar.national[a.key],
  }));
  return (
    <div className="h-[260px]" role="img" aria-label={`Peer benchmark radar for ${dept.name}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--pc-border)" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "var(--pc-muted)" }} />
          <PolarRadiusAxis tick={{ fontSize: 9, fill: "var(--pc-muted)" }} angle={30} />
          <Radar name="Department" dataKey="Department" stroke="var(--pc-accent)" fill="var(--pc-accent)" fillOpacity={0.28} />
          <Radar name="Institution" dataKey="Institution" stroke="var(--pc-accent-2)" fill="var(--pc-accent-2)" fillOpacity={0.14} />
          <Radar name="National" dataKey="National" stroke="var(--pc-muted)" fill="var(--pc-muted)" fillOpacity={0.08} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, color: "var(--pc-ink-2)" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────
// Scale a department's counts by a year-filter factor. Returns null if
// the scaled cohort would breach the anonymity floor.
function scale(d: DepartmentInsight, factor: number): DepartmentInsight | null {
  const n = Math.round(d.n * factor);
  if (n < K_MIN) return null;
  const scaleObj = <T extends Record<string, number>>(o: T): T => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(o)) out[k] = Math.round(v * factor);
    return out as T;
  };
  return {
    ...d,
    n,
    invited: Math.round(d.invited * factor),
    funnel: scaleObj(d.funnel),
    riskDist: scaleObj(d.riskDist),
    themes: d.themes.map((t) => ({ ...t, n: Math.round(t.n * factor) })),
    heatmap: d.heatmap.map((row) => row.map((v) => Math.round(v * factor))),
  };
}
