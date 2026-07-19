// Wellbeing Signals · Overview. Aggregate-only PHQ-9 / GAD-7 command
// center. k-anonymity ≥ 10 on every series, every window, every band.
// URL is the source of truth via validateSearch + zodValidator (fallback).
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { PageHeader, GlassCard, AnonymityBadge } from "@/components/college/primitives";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { FilterChipGroup } from "@/components/primitives/FilterChipGroup";
import { ScaleLegend } from "@/components/primitives/ScaleLegend";
import { SeverityStack } from "@/components/signals/SeverityStack";
import { RidgelineDistribution } from "@/components/signals/RidgelineDistribution";
import { ImprovementFunnel } from "@/components/signals/ImprovementFunnel";
import { SessionCadence } from "@/components/signals/SessionCadence";
import { TodHeatmap } from "@/components/signals/TodHeatmap";
import { CorrelationStrip } from "@/components/signals/CorrelationStrip";
import { SignalAlertsFeed } from "@/components/signals/SignalAlertsFeed";
import {
  getHeadlineStats, getSeries, getAssessmentCompletion, RANGE_WEEKS, rangeLabel,
  type RangeKey,
} from "@/lib/signals-selectors";
import { isSuppressed, K_MIN } from "@/lib/cohort-selectors";
import { SCALE_LABEL, type BandKey, type ScaleId } from "@/lib/clinical-scales";
import { getSignalsSnapshot, type Segment } from "@/lib/dashboard-mock.signals";
import { deriveAccentScale } from "@/lib/accent-derive";

// ─── Search schema ────────────────────────────────────────────
const signalsSearch = z.object({
  range: fallback(z.string(), "12w").default("12w"),
  scale: fallback(z.string(), "phq9").default("phq9"),
  seg:   fallback(z.string(), "inst").default("inst"),
  band:  fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/_authenticated/signals/wellbeing")({
  head: () => ({
    meta: [
      { title: "Wellbeing Signals — PeaceCode for Colleges" },
      { name: "description", content: "Aggregate-only PHQ-9 / GAD-7 signals across the institution." },
    ],
  }),
  validateSearch: zodValidator(signalsSearch),
  component: WellbeingSignalsPage,
});

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "4w",  label: "4 weeks" },
  { value: "12w", label: "12 weeks" },
  { value: "26w", label: "26 weeks" },
  { value: "52w", label: "52 weeks" },
  { value: "ay",  label: "Academic year" },
];

const SCALE_OPTIONS: { value: ScaleId; label: string }[] = [
  { value: "phq9", label: "PHQ-9" },
  { value: "gad7", label: "GAD-7" },
];

const SEG_OPTIONS: { value: Segment; label: string }[] = [
  { value: "inst",   label: "Institution" },
  { value: "school", label: "By school" },
  { value: "year",   label: "By year" },
];

const BAND_KEYS: readonly BandKey[] = ["minimal", "mild", "moderate", "modsevere", "severe"];

function clampRange(v: string): RangeKey {
  return (RANGE_OPTIONS.find((o) => o.value === v)?.value ?? "12w") as RangeKey;
}
function clampScale(v: string): ScaleId {
  return v === "gad7" ? "gad7" : "phq9";
}
function clampSeg(v: string): Segment {
  return (SEG_OPTIONS.find((o) => o.value === v)?.value ?? "inst") as Segment;
}
function clampBand(v: string): BandKey | "all" {
  return BAND_KEYS.includes(v as BandKey) ? (v as BandKey) : "all";
}

function WellbeingSignalsPage() {
  const raw = Route.useSearch();
  const nav = useNavigate({ from: Route.fullPath });
  const bandHistory = useRef<(BandKey | "all")[]>([]);

  const range = clampRange(raw.range);
  const scale = clampScale(raw.scale);
  const seg = clampSeg(raw.seg);
  const band = clampBand(raw.band);

  const patch = useCallback((next: Partial<{ range: string; scale: string; seg: string; band: string }>) => {
    if (next.band && next.band !== band) bandHistory.current.push(band);
    nav({
      search: (prev: Record<string, string>) => {
        const merged: Record<string, string> = { ...prev, ...next };
        Object.keys(merged).forEach((k) => {
          if (!merged[k] || merged[k] === "all" || merged[k] === "inst" || (k === "range" && merged[k] === "12w") || (k === "scale" && merged[k] === "phq9")) delete merged[k];
        });
        return merged;
      },
    });
  }, [nav, band]);

  // Esc clears the current band filter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      if (band !== "all") patch({ band: "all" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [band, patch]);

  const stats = useMemo(() => getHeadlineStats(range), [range]);
  const series = useMemo(() => getSeries(scale, range, seg), [scale, range, seg]);
  const completion = useMemo(() => getAssessmentCompletion(range), [range]);
  const snap = getSignalsSnapshot();
  const asOf = new Date(snap.asOf);
  const asOfLabel = asOf.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div>
      <PageHeader
        eyebrow="Wellbeing signals → Overview"
        title="Wellbeing signals"
        subtitle="PHQ-9 and GAD-7 trends, session cadence, and reassessment outcomes across the institution. Every number is an aggregate; nothing here identifies an individual student."
      />

      {/* ── Sticky filter bar ──────────────────────────────── */}
      <div
        className="sticky top-14 z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 mb-5"
        style={{
          background: "color-mix(in oklab, var(--pc-surface) 88%, transparent)",
          borderBottom: "1px solid var(--pc-border)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <FilterChipGroup
            label="Time range"
            options={RANGE_OPTIONS}
            value={range}
            onChange={(v) => patch({ range: v })}
          />
          <FilterChipGroup
            label="Scale"
            options={SCALE_OPTIONS}
            value={scale}
            onChange={(v) => patch({ scale: v })}
          />
          <FilterChipGroup
            label="Segment"
            options={SEG_OPTIONS}
            value={seg}
            onChange={(v) => patch({ seg: v })}
          />
          <div className="flex items-center gap-2 ml-auto">
            <AnonymityBadge n={stats.nActive} k={K_MIN} />
            <span
              className="text-[11px] px-2 py-1 rounded-full"
              style={{
                background: "var(--pc-surface2)",
                border: "1px solid var(--pc-border)",
                color: "var(--pc-muted)",
              }}
              title="Snapshot generated at this time"
            >
              Updated {asOfLabel}
            </span>
          </div>
        </div>
        {band !== "all" && (
          <div className="mt-2 text-[11.5px] flex items-center gap-2" style={{ color: "var(--pc-ink-2)" }}>
            Filtered to <strong>{band}</strong> band ·
            <button
              type="button"
              onClick={() => patch({ band: "all" })}
              className="underline decoration-dotted"
              style={{ color: "var(--pc-accent)" }}
            >
              Clear (Esc)
            </button>
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 1. Headline stats strip */}
        <HeadlineStrip stats={stats} scale={scale} range={range} />

        {/* 2. Severity band stacked area (span 8) */}
        <GlassCard className="p-5 lg:col-span-8">
          <TileHeader
            title={`${SCALE_LABEL[scale]} severity mix`}
            sub={`Share of active students by severity · ${rangeLabel(range)}`}
            n={stats.nActive}
          />
          <div className="mb-2">
            <ScaleLegend scale={scale} activeBand={band} onSelect={(k) => patch({ band: k })} />
          </div>
          <SeverityStack scale={scale} range={range} band={band} onSelectBand={(k) => patch({ band: k })} />
        </GlassCard>

        {/* 9. Signal alerts feed (span 4) */}
        <GlassCard className="p-5 lg:col-span-4">
          <TileHeader title="Signal alerts" sub="Aggregate anomalies worth a look" n={stats.nActive} />
          <SignalAlertsFeed
            onOpen={(a) => {
              const next: Record<string, string> = {};
              if (a.linkSearch.range) next.range = a.linkSearch.range;
              if (a.linkSearch.scale) next.scale = a.linkSearch.scale;
              if (a.linkSearch.seg)   next.seg = a.linkSearch.seg;
              if (a.linkSearch.band)  next.band = a.linkSearch.band;
              patch(next);
            }}
          />
        </GlassCard>

        {/* 3. Ridgeline distribution (span 6) */}
        <GlassCard className="p-5 lg:col-span-6">
          <TileHeader
            title={`${SCALE_LABEL[scale]} score distributions`}
            sub={`One curve per month · median tick per row`}
            n={stats.nActive}
          />
          <RidgelineDistribution scale={scale} range={range} />
        </GlassCard>

        {/* 4. Improvement funnel (span 3) */}
        <GlassCard className="p-5 lg:col-span-3">
          <TileHeader title="Improvement funnel" sub={rangeLabel(range)} n={stats.nActive} />
          <ImprovementFunnel range={range} />
        </GlassCard>

        {/* 7. Assessment completion donut (span 3) */}
        <GlassCard className="p-5 lg:col-span-3">
          <TileHeader title="Reassessment completion" sub={rangeLabel(range)} n={stats.nActive} />
          <CompletionDonut range={range} />
        </GlassCard>

        {/* Segmented trend (span 8) */}
        <GlassCard className="p-5 lg:col-span-8">
          <TileHeader
            title={`${SCALE_LABEL[scale]} trend — ${SEG_OPTIONS.find((s) => s.value === seg)?.label}`}
            sub={`Weekly averages across ${RANGE_WEEKS[range]} weeks`}
            n={stats.nActive}
          />
          <TrendChart series={series} scale={scale} />
        </GlassCard>

        {/* 5. Session cadence (span 4) */}
        <GlassCard className="p-5 lg:col-span-4">
          <TileHeader title="Session cadence" sub="Weekly starts · median minutes" n={stats.nActive} />
          <SessionCadence range={range} />
        </GlassCard>

        {/* 6. Time-of-day heatmap (span 6) */}
        <GlassCard className="p-5 lg:col-span-6">
          <TileHeader title="Time-of-day engagement" sub="When students actually show up" n={stats.nActive} />
          <TodHeatmap />
        </GlassCard>

        {/* 8. Correlation strip (span 6) */}
        <GlassCard className="p-5 lg:col-span-6">
          <TileHeader
            title="Department-level correlations"
            sub="Aggregate points only · N ≥ 10 per department"
            n={stats.nActive}
          />
          <CorrelationStrip />
          <p className="mt-2 text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
            Each dot is one department's rolled-up average, not a student. Trend line is ordinary least squares.
          </p>
        </GlassCard>

        {/* Assessment completion footer note */}
        <div className="lg:col-span-12 text-[11px]" style={{ color: "var(--pc-muted)" }}>
          Completion figure this window:{" "}
          {isSuppressed(completion)
            ? "hidden — sample too small."
            : `${completion.completed.toLocaleString()} of ${completion.active.toLocaleString()} active students (${completion.pct}%).`}
        </div>
      </div>
    </div>
  );
}

// ─── Tile header ─────────────────────────────────────────────
function TileHeader({ title, sub, n }: { title: string; sub?: string; n: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h3 className="font-serif text-[16px] tracking-tight truncate" style={{ color: "var(--pc-ink)" }}>
          {title}
        </h3>
        {sub && (
          <div className="text-[11px] truncate" style={{ color: "var(--pc-muted)" }}>{sub}</div>
        )}
      </div>
      <AnonymityBadge n={n} k={K_MIN} />
    </div>
  );
}

// ─── Headline stats strip ────────────────────────────────────
function HeadlineStrip({
  stats, scale, range,
}: {
  stats: ReturnType<typeof getHeadlineStats>;
  scale: ScaleId;
  range: RangeKey;
}) {
  const items = [
    {
      label: `Mean ${scale === "phq9" ? "PHQ-9" : "GAD-7"}`,
      value: scale === "phq9" ? stats.meanPhq9.value : stats.meanGad7.value,
      delta: scale === "phq9" ? stats.meanPhq9.delta : stats.meanGad7.delta,
      unit: "",
      hint: "Lower is better",
      suppressed: (scale === "phq9" ? stats.meanPhq9 : stats.meanGad7).suppressed,
      badTrend: "up" as const,
    },
    {
      label: `Mean ${scale === "phq9" ? "GAD-7" : "PHQ-9"}`,
      value: scale === "phq9" ? stats.meanGad7.value : stats.meanPhq9.value,
      delta: scale === "phq9" ? stats.meanGad7.delta : stats.meanPhq9.delta,
      unit: "",
      hint: "Lower is better",
      suppressed: (scale === "phq9" ? stats.meanGad7 : stats.meanPhq9).suppressed,
      badTrend: "up" as const,
    },
    {
      label: "% in Moderate+ band",
      value: stats.moderatePlusPct.value,
      delta: null,
      unit: "%",
      hint: "PHQ-9 ≥ 10",
      suppressed: stats.moderatePlusPct.suppressed,
      badTrend: "up" as const,
    },
    {
      label: "% showing improvement",
      value: stats.improvedPct.value,
      delta: null,
      unit: "%",
      hint: "≥ 5-point drop over 6 weeks",
      suppressed: stats.improvedPct.suppressed,
      badTrend: "down" as const,
    },
  ];
  return (
    <div className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((it) => (
        <GlassCard key={it.label} className="p-4">
          <div
            className="text-[10.5px] uppercase"
            style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}
          >
            {it.label}
          </div>
          {it.suppressed || it.value == null ? (
            <div className="mt-2 text-[13px]" style={{ color: "var(--pc-muted)" }}>
              Sample too small in a {rangeLabel(range)} window
            </div>
          ) : (
            <>
              <div className="font-serif text-[30px] leading-none mt-2" style={{ color: "var(--pc-ink)" }}>
                {it.value}{it.unit}
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {it.delta !== null && (
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--pc-surface2)",
                      border: "1px solid var(--pc-border)",
                      color:
                        (it.badTrend === "up" && it.delta > 0) ||
                        (it.badTrend === "down" && it.delta < 0)
                          ? "var(--pc-warn)"
                          : "var(--pc-good)",
                    }}
                  >
                    {it.delta > 0 ? "▲" : it.delta < 0 ? "▼" : "→"} {Math.abs(it.delta)}{it.unit || " pts"}
                  </span>
                )}
                <span className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>{it.hint}</span>
              </div>
            </>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

// ─── Segmented trend ────────────────────────────────────────
function TrendChart({
  series, scale,
}: {
  series: ReturnType<typeof getSeries>;
  scale: ScaleId;
}) {
  if (isSuppressed(series)) return <SuppressedTile label="Not enough activity to plot a segmented trend." />;
  const palette = deriveAccentScale("var(--pc-accent)", Math.max(3, series.keys.length));
  return (
    <div className="h-64" role="img" aria-label={`${SCALE_LABEL[scale]} trend across ${series.keys.length} series.`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series.data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--pc-border)" vertical={false} />
          <XAxis dataKey="week" stroke="var(--pc-muted)" fontSize={10} interval={Math.max(0, Math.floor(series.data.length / 8))} />
          <YAxis stroke="var(--pc-muted)" fontSize={10} domain={[0, "dataMax + 2"]} />
          <Tooltip
            contentStyle={{
              background: "var(--pc-surface)", border: "1px solid var(--pc-border)",
              color: "var(--pc-ink)", borderRadius: 8, fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--pc-muted)" }} />
          {series.keys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              name={k}
              stroke={palette[i % palette.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Assessment completion donut ─────────────────────────────
function CompletionDonut({ range }: { range: RangeKey }) {
  const res = useMemo(() => getAssessmentCompletion(range), [range]);
  if (isSuppressed(res)) return <SuppressedTile label="Sample too small to compute a completion rate." />;
  const pct = res.pct;
  const data = [
    { key: "done", value: pct },
    { key: "gap",  value: Math.max(0, 100 - pct) },
  ];
  const colors = ["var(--pc-accent)", "var(--pc-surface2)"];
  return (
    <div className="h-40 relative" role="img" aria-label={`Reassessment completion ${pct}% of active students in the window.`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="66%"
            outerRadius="92%"
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="var(--pc-border)"
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <Cell key={d.key} fill={colors[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="font-serif text-[26px] leading-none" style={{ color: "var(--pc-ink)" }}>
          {pct}%
        </div>
        <div className="text-[10.5px] mt-1" style={{ color: "var(--pc-muted)" }}>
          of {res.active.toLocaleString()} active
        </div>
      </div>
    </div>
  );
}
