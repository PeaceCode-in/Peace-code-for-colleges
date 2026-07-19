// Cohort Insights → Year & Demographics. Multi-dim slicer with strict
// k-anonymity (k>=10) at every intersection. URL is the source of truth
// via validateSearch + zodValidator (fallback, never .catch()).
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ErrorBar, LineChart, Line, Legend, ReferenceLine,
} from "recharts";
import { ChevronRight } from "lucide-react";
import { PageHeader, GlassCard, AnonymityBadge } from "@/components/college/primitives";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { SuppressedView } from "@/components/primitives/SuppressedView";
import { DemographicFilters } from "@/components/cohort/DemographicFilters";
import { CrossTabHeatmap } from "@/components/cohort/CrossTabHeatmap";
import { DistributionViolins } from "@/components/cohort/DistributionViolins";
import {
  DEFAULT_FILTERS, YEARS, GENDERS, RESIDENCY, GEN1, AID,
  sliceCube, marginalize, institutionTotal, phq9ToWellbeing,
  type Filters,
} from "@/lib/cohort-cube";
import { K_MIN } from "@/lib/cohort-selectors";

// ── Search params ──────────────────────────────────────────────
const demoSearch = z.object({
  year:   fallback(z.string(), "all").default("all"),
  gender: fallback(z.string(), "all").default("all"),
  res:    fallback(z.string(), "all").default("all"),
  gen1:   fallback(z.string(), "all").default("all"),
  aid:    fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/cohorts/demographics")({
  head: () => ({ meta: [{ title: "Year & Demographics — PeaceCode for Colleges" }] }),
  validateSearch: zodValidator(demoSearch),
  component: DemographicsPage,
});

// ── Validators (component-side, per project convention) ───────
function pickFrom<T extends string>(values: readonly T[], v: string): T | "all" {
  return (values as readonly string[]).includes(v) ? (v as T) : "all";
}

function DemographicsPage() {
  const search = Route.useSearch();
  const nav = useNavigate({ from: Route.fullPath });
  const filterHistoryRef = useRef<(keyof Filters)[]>([]);

  const filters: Filters = useMemo(() => ({
    year:   pickFrom(YEARS, search.year),
    gender: pickFrom(GENDERS, search.gender),
    res:    pickFrom(RESIDENCY, search.res),
    gen1:   pickFrom(GEN1, search.gen1),
    aid:    pickFrom(AID, search.aid),
  }), [search]);

  const patch = useCallback((next: Partial<Filters>) => {
    // Track which filter keys were just applied to power Esc-to-undo.
    for (const k of Object.keys(next) as (keyof Filters)[]) {
      if (next[k] && next[k] !== "all") filterHistoryRef.current.push(k);
    }
    nav({
      search: (prev: Record<string, string>) => {
        const merged: Record<string, string> = { ...prev, ...next };
        Object.keys(merged).forEach((k) => {
          if (!merged[k] || merged[k] === "all") delete merged[k];
        });
        return merged;
      },
    });
  }, [nav]);

  const reset = useCallback(() => {
    filterHistoryRef.current = [];
    nav({ search: {} });
  }, [nav]);

  // Esc clears the last-applied filter.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      const last = filterHistoryRef.current.pop();
      if (last) patch({ [last]: "all" } as Partial<Filters>);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [patch]);

  const slice = useMemo(() => sliceCube(filters), [filters]);
  const total = useMemo(() => institutionTotal(), []);
  const pctOfInstitution = total > 0 ? Math.round((slice.n / total) * 1000) / 10 : 0;

  return (
    <div data-noexport onCopy={(e) => e.preventDefault()}>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1">
            <Link to="/departments" className="hover:underline">Cohort insights</Link>
            <ChevronRight className="h-3 w-3 inline" aria-hidden />
            Year &amp; Demographics
          </span> as unknown as string
        }
        title="Year &amp; Demographics"
        subtitle="Aggregate-only slices across academic year, gender, residency, first-generation status, and aid tier. Every intersection enforces k ≥ 10."
      />

      <DemographicFilters
        value={filters}
        onChange={patch}
        onReset={reset}
        activeN={slice.n}
      />

      {slice.n < K_MIN ? (
        <div className="mt-8">
          <SuppressedView n={slice.n} onReset={reset} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          {/* 1. Slice size card */}
          <GlassCard className="p-5 lg:col-span-4">
            <div
              className="text-[10.5px] uppercase"
              style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}
            >
              Current slice
            </div>
            <div className="font-serif text-[44px] leading-none mt-2" style={{ color: "var(--pc-ink)" }}>
              {slice.n.toLocaleString()}
            </div>
            <div className="mt-2 text-[12px]" style={{ color: "var(--pc-ink-2)" }}>
              students match these filters
            </div>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  background: "color-mix(in oklab, var(--pc-accent) 12%, var(--pc-surface-2))",
                  color: "var(--pc-accent)",
                  border: "1px solid color-mix(in oklab, var(--pc-accent) 30%, var(--pc-border))",
                }}
              >
                {pctOfInstitution}% of institution
              </span>
              <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
                Δ vs unfiltered: {(slice.n - total).toLocaleString()}
              </span>
            </div>
            <div className="mt-4 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
              Wellbeing index: <strong style={{ color: "var(--pc-ink)" }}>{phq9ToWellbeing(slice.phq9)}</strong>
              {" · "}PHQ-9: <strong style={{ color: "var(--pc-ink)" }}>{slice.phq9}</strong>
              {" · "}GAD-7: <strong style={{ color: "var(--pc-ink)" }}>{slice.gad7}</strong>
            </div>
          </GlassCard>

          {/* 2. Year x Wellbeing grouped bar with CIs */}
          <GlassCard className="p-5 lg:col-span-8">
            <TileHeader title="Year × Wellbeing" n={slice.n} />
            <div className="h-56">
              <YearWellbeingChart filters={filters} onDrill={(y) => patch({ year: y })} />
            </div>
          </GlassCard>

          {/* 3. Distribution violins */}
          <GlassCard className="p-5 lg:col-span-6">
            <TileHeader title="PHQ-9 distribution by year" n={slice.n} />
            <DistributionViolins filters={filters} />
          </GlassCard>

          {/* 4. Cross-tab heatmap */}
          <GlassCard className="p-5 lg:col-span-6">
            <TileHeader title="Year × Residency" n={slice.n} />
            <CrossTabHeatmap filters={filters} onDrill={patch} />
          </GlassCard>

          {/* 5. First-gen split trend */}
          <GlassCard className="p-5 lg:col-span-6">
            <TileHeader title="First-gen vs non first-gen (26 weeks)" n={slice.n} />
            <FirstGenSplit filters={filters} />
          </GlassCard>

          {/* 6. Aid-tier funnel small-multiples */}
          <GlassCard className="p-5 lg:col-span-6">
            <TileHeader title="Engagement funnel by aid tier" n={slice.n} />
            <AidTierFunnels filters={filters} />
          </GlassCard>

          {/* 7. Themes by year (stacked 100%) */}
          <GlassCard className="p-5 lg:col-span-8">
            <TileHeader title="Presenting themes by year" n={slice.n} />
            <ThemesByYear filters={filters} />
          </GlassCard>

          {/* 8. Progress delta */}
          <GlassCard className="p-5 lg:col-span-4">
            <TileHeader title="6-week PHQ-9 delta vs baseline" n={slice.n} />
            <ProgressDelta filters={filters} slicePhq9={slice.phq9} />
          </GlassCard>
        </div>
      )}
    </div>
  );
}

// ── Tile header ────────────────────────────────────────────────
function TileHeader({ title, n }: { title: string; n: number }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <h3 className="font-serif text-[16px] tracking-tight" style={{ color: "var(--pc-ink)" }}>
        {title}
      </h3>
      <AnonymityBadge n={n} k={K_MIN} />
    </div>
  );
}

// ── Year × Wellbeing grouped bar ───────────────────────────────
function YearWellbeingChart({
  filters,
  onDrill,
}: {
  filters: Filters;
  onDrill: (y: Filters["year"]) => void;
}) {
  const perYear = marginalize("year", filters);
  const data = perYear.map(({ key, agg }) => ({
    year: key,
    phq9: agg.n >= K_MIN ? agg.phq9 : null,
    gad7: agg.n >= K_MIN ? agg.gad7 : null,
    // 90% CI ≈ 1.645 * (SD / sqrt(n)). SD approximated as 3 for PHQ-9, 2.4 for GAD-7.
    phq9Err: agg.n >= K_MIN ? +(1.645 * (3 / Math.sqrt(Math.max(1, agg.n)))).toFixed(2) : 0,
    gad7Err: agg.n >= K_MIN ? +(1.645 * (2.4 / Math.sqrt(Math.max(1, agg.n)))).toFixed(2) : 0,
    n: agg.n,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 6, right: 6, left: -18, bottom: 0 }}
        onClick={(e) => {
          const p = e?.activePayload?.[0]?.payload;
          if (p?.year) onDrill(p.year as Filters["year"]);
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--pc-border)" vertical={false} />
        <XAxis dataKey="year" stroke="var(--pc-muted)" fontSize={11} />
        <YAxis stroke="var(--pc-muted)" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: "var(--pc-surface)",
            border: "1px solid var(--pc-border)",
            color: "var(--pc-ink)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--pc-muted)" }} />
        <Bar dataKey="phq9" name="PHQ-9" fill="var(--pc-accent)" radius={[4, 4, 0, 0]}>
          <ErrorBar dataKey="phq9Err" width={4} stroke="var(--pc-ink-2)" />
        </Bar>
        <Bar dataKey="gad7" name="GAD-7" fill="var(--pc-accent-2)" radius={[4, 4, 0, 0]}>
          <ErrorBar dataKey="gad7Err" width={4} stroke="var(--pc-ink-2)" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── First-gen split trend ──────────────────────────────────────
function FirstGenSplit({ filters }: { filters: Filters }) {
  const yes = sliceCube({ ...filters, gen1: "Yes" });
  const no  = sliceCube({ ...filters, gen1: "No" });
  if (yes.n < K_MIN || no.n < K_MIN) {
    return <SuppressedTile label="One or both groups fall below k=10" />;
  }
  const weeks = yes.phq9Series.length;
  const data = Array.from({ length: weeks }, (_, i) => ({
    week: `W${i + 1}`,
    firstGen: yes.phq9Series[i],
    nonFirstGen: no.phq9Series[i],
  }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--pc-border)" vertical={false} />
          <XAxis dataKey="week" stroke="var(--pc-muted)" fontSize={10} interval={3} />
          <YAxis stroke="var(--pc-muted)" fontSize={11} domain={[0, "dataMax + 2"]} />
          <Tooltip
            contentStyle={{
              background: "var(--pc-surface)",
              border: "1px solid var(--pc-border)",
              color: "var(--pc-ink)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--pc-muted)" }} />
          <Line type="monotone" dataKey="firstGen" name={`First-gen (n=${yes.n})`} stroke="var(--pc-accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="nonFirstGen" name={`Non first-gen (n=${no.n})`} stroke="var(--pc-accent-2)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Aid-tier funnel small-multiples ────────────────────────────
function AidTierFunnels({ filters }: { filters: Filters }) {
  const perTier = marginalize("aid", filters);
  return (
    <div className="grid grid-cols-3 gap-3">
      {perTier.map(({ key, agg }) => {
        if (agg.n < K_MIN) {
          return (
            <div key={key}>
              <div className="text-[11px] mb-1" style={{ color: "var(--pc-ink-2)" }}>{key}</div>
              <SuppressedTile compact label="Hidden" />
            </div>
          );
        }
        const invited = agg.n;
        const active = Math.round(agg.n * agg.engagement);
        const sustained = Math.round(active * 0.62);
        const stages: [string, number][] = [
          ["Invited", invited],
          ["Active 30d", active],
          ["Sustained", sustained],
        ];
        const max = invited;
        return (
          <div key={key}>
            <div className="text-[11px] mb-1" style={{ color: "var(--pc-ink-2)" }}>
              {key} <span style={{ color: "var(--pc-muted)" }}>· n={invited}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {stages.map(([label, n]) => (
                <div key={label} className="flex items-center gap-2 text-[11px]">
                  <div className="w-16 shrink-0" style={{ color: "var(--pc-muted)" }}>{label}</div>
                  <div className="flex-1 relative h-4 rounded" style={{ background: "var(--pc-surface-2)" }}>
                    <div
                      className="absolute inset-y-0 left-0 rounded"
                      style={{
                        width: `${Math.round((n / max) * 100)}%`,
                        background: "color-mix(in oklab, var(--pc-accent) 65%, transparent)",
                      }}
                    />
                  </div>
                  <div className="w-12 text-right" style={{ color: "var(--pc-ink-2)" }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Themes by year (stacked 100%) ──────────────────────────────
function ThemesByYear({ filters }: { filters: Filters }) {
  const perYear = marginalize("year", filters);
  const rows = perYear.filter((p) => p.agg.n >= K_MIN);
  if (rows.length === 0) return <SuppressedTile label="No year meets k=10 with current filters" />;

  // Collect the union of top themes, cap to 5.
  const tagSet = new Set<string>();
  for (const r of rows) for (const t of r.agg.themes) tagSet.add(t.tag);
  const tags = [...tagSet].slice(0, 5);
  const palette = ["var(--pc-accent)", "var(--pc-accent-2)", "var(--pc-good)", "var(--pc-warn)", "var(--pc-ink-2)"];

  const data = rows.map(({ key, agg }) => {
    const row: Record<string, number | string> = { year: key };
    let total = 0;
    for (const t of tags) {
      const w = agg.themes.find((x) => x.tag === t)?.weight ?? 0;
      total += w;
    }
    for (const t of tags) {
      const w = agg.themes.find((x) => x.tag === t)?.weight ?? 0;
      row[t] = total > 0 ? Math.round((w / total) * 100) : 0;
    }
    return row;
  });

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 6, left: -12, bottom: 0 }} stackOffset="expand">
          <CartesianGrid horizontal={false} stroke="var(--pc-border)" />
          <XAxis type="number" tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} stroke="var(--pc-muted)" fontSize={11} />
          <YAxis type="category" dataKey="year" stroke="var(--pc-muted)" fontSize={11} width={32} />
          <Tooltip
            contentStyle={{
              background: "var(--pc-surface)",
              border: "1px solid var(--pc-border)",
              color: "var(--pc-ink)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => `${v}%`}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: "var(--pc-muted)" }} />
          {tags.map((t, i) => (
            <Bar key={t} dataKey={t} stackId="themes" fill={palette[i % palette.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Progress delta ─────────────────────────────────────────────
function ProgressDelta({ filters, slicePhq9 }: { filters: Filters; slicePhq9: number }) {
  const overall = sliceCube(DEFAULT_FILTERS);
  const baseline = overall.phq9;
  const s = sliceCube(filters);
  const sixWeeksAgo = s.phq9Series[s.phq9Series.length - 7] ?? slicePhq9;
  const nowVs6w = +(slicePhq9 - sixWeeksAgo).toFixed(2);
  const vsBaseline = +(slicePhq9 - baseline).toFixed(2);

  const bars = [
    { key: "6w", label: "vs 6 weeks ago", value: nowVs6w },
    { key: "base", label: "vs institution", value: vsBaseline },
  ];

  const max = Math.max(1.5, ...bars.map((b) => Math.abs(b.value)));

  return (
    <div className="flex flex-col gap-3 mt-1">
      <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
        Negative = better (lower PHQ-9). Positive = worse.
      </div>
      <div className="flex flex-col gap-3">
        {bars.map((b) => {
          const pct = Math.abs(b.value) / max;
          const better = b.value <= 0;
          return (
            <div key={b.key}>
              <div className="text-[11px] flex justify-between" style={{ color: "var(--pc-ink-2)" }}>
                <span>{b.label}</span>
                <span style={{ color: better ? "var(--pc-good)" : "var(--pc-warn)" }}>
                  {b.value > 0 ? "+" : ""}{b.value}
                </span>
              </div>
              <div
                className="relative h-3 rounded mt-1"
                style={{ background: "var(--pc-surface-2)", border: "1px solid var(--pc-border)" }}
              >
                <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: "var(--pc-border)" }} />
                <div
                  className="absolute inset-y-0 rounded"
                  style={{
                    left: better ? `${50 - pct * 50}%` : "50%",
                    width: `${pct * 50}%`,
                    background: better ? "var(--pc-good)" : "var(--pc-warn)",
                    opacity: 0.75,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-[10.5px] mt-2" style={{ color: "var(--pc-muted)" }}>
        Institution baseline PHQ-9: {baseline}
      </div>
    </div>
  );
}
