import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, GlassCard, StatTile } from "@/components/college/primitives";
import { SessionCadence } from "@/components/signals/SessionCadence";
import { TodHeatmap } from "@/components/signals/TodHeatmap";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { getCadence, getTod, getAssessmentCompletion, rangeLabel, type RangeKey } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";

export const Route = createFileRoute("/_authenticated/signals/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — PeaceCode for Colleges" },
      { name: "description", content: "Counselling session cadence, duration, timing and completion." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionsPage,
});

const RANGES: RangeKey[] = ["4w", "12w", "26w", "52w", "ay"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SessionsPage() {
  const [range, setRange] = useState<RangeKey>("26w");
  const cadence = useMemo(() => getCadence(range), [range]);
  const tod = useMemo(() => getTod(), []);
  const completion = useMemo(() => getAssessmentCompletion(range), [range]);

  const stats = useMemo(() => {
    if (isSuppressed(cadence)) return null;
    const data = cadence.data;
    const total = data.reduce((s, d) => s + d.starts, 0);
    const last = data[data.length - 1]?.starts ?? 0;
    const prev = data[data.length - 2]?.starts ?? 0;
    const wow = prev > 0 ? Math.round(((last - prev) / prev) * 1000) / 10 : 0;
    const avg = Math.round(total / Math.max(1, data.length));
    const peak = data.reduce((a, b) => (b.starts > a.starts ? b : a), data[0]);
    const medMinutes = Math.round(
      data.reduce((s, d) => s + d.medianMinutes, 0) / Math.max(1, data.length),
    );
    const last4 = data.slice(-4).reduce((s, d) => s + d.starts, 0);
    return { total, last, prev, wow, avg, peak, medMinutes, last4 };
  }, [cadence]);

  const dayTotals = useMemo(() => {
    if (isSuppressed(tod)) return null;
    return tod.grid.map((row) => row.reduce((s, v) => s + v, 0));
  }, [tod]);

  const hourTotals = useMemo(() => {
    if (isSuppressed(tod)) return null;
    const out = new Array(24).fill(0);
    for (const row of tod.grid) row.forEach((v, h) => (out[h] += v));
    return out as number[];
  }, [tod]);

  const busiest = useMemo(() => {
    if (!dayTotals || !hourTotals) return null;
    const dayIdx = dayTotals.indexOf(Math.max(...dayTotals));
    const hourIdx = hourTotals.indexOf(Math.max(...hourTotals));
    const totalTod = dayTotals.reduce((s, v) => s + v, 0);
    const weekendShare = totalTod > 0
      ? Math.round(((dayTotals[0] + dayTotals[6]) / totalTod) * 100)
      : 0;
    const eveningShare = totalTod > 0
      ? Math.round((hourTotals.slice(18, 23).reduce((s, v) => s + v, 0) / totalTod) * 100)
      : 0;
    return { dayIdx, hourIdx, weekendShare, eveningShare };
  }, [dayTotals, hourTotals]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wellbeing signals"
        title="Sessions"
        subtitle="Counselling cadence, session length and timing across the reporting window. Aggregates only — no individual student identifiable."
        actions={<RangePicker value={range} onChange={setRange} />}
      />

      {/* KPI strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile
          label="This week"
          value={stats ? stats.last.toLocaleString() : "—"}
          delta={stats ? `${stats.wow > 0 ? "+" : ""}${stats.wow}% WoW` : undefined}
          trend={stats ? (stats.wow > 0 ? "up" : stats.wow < 0 ? "down" : "flat") : undefined}
        />
        <StatTile label="Last 4 weeks" value={stats ? stats.last4.toLocaleString() : "—"} />
        <StatTile
          label={`${rangeLabel(range)} total`}
          value={stats ? stats.total.toLocaleString() : "—"}
        />
        <StatTile label="Weekly average" value={stats ? stats.avg.toLocaleString() : "—"} />
        <StatTile
          label="Median length"
          value={stats ? `${stats.medMinutes} min` : "—"}
        />
        <StatTile
          label="Peak week"
          value={stats ? stats.peak.starts.toLocaleString() : "—"}
          delta={stats ? stats.peak.week : undefined}
        />
      </div>

      {/* Cadence: bars + median line ───────────────────────── */}
      <GlassCard className="p-5">
        <SectionHeader
          title="Weekly cadence"
          hint="Bars: sessions started per week. Line: median session length in minutes. Drag the brush to focus a range."
        />
        <SessionCadence range={range} />
      </GlassCard>

      {/* Two-up: Completion gauge + Duration distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5">
          <SectionHeader
            title="Assessment completion"
            hint="Share of active students who completed a follow-up assessment inside the window."
          />
          {isSuppressed(completion) ? (
            <SuppressedTile label="Not enough activity to compute completion." />
          ) : (
            <div className="flex items-center gap-6">
              <CompletionRing pct={completion.pct} />
              <div className="flex-1">
                <MiniStat label="Reassessments completed" value={completion.completed.toLocaleString()} />
                <MiniStat label="Active students" value={completion.active.toLocaleString()} />
                <MiniStat label="Completion rate" value={`${completion.pct}%`} accent />
                <p className="mt-3 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                  Completing a follow-up is the strongest predictor of sustained improvement in the
                  routing funnel. Aim for &gt; 60% within {rangeLabel(range)}.
                </p>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader
            title="Session length"
            hint="Distribution of median session length across the window."
          />
          {stats ? (
            <DurationHistogram data={(cadence as { data: { medianMinutes: number }[] }).data.map((d) => d.medianMinutes)} />
          ) : (
            <SuppressedTile label="Not enough sessions to profile duration." />
          )}
        </GlassCard>
      </div>

      {/* Time-of-day heatmap + summaries ───────────────────── */}
      <GlassCard className="p-5">
        <SectionHeader
          title="When students engage"
          hint="7 × 24 heatmap of session start times. Warmer cells = more sessions in that hour."
        />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6">
          <TodHeatmap />
          <div className="space-y-3">
            {busiest && (
              <>
                <PillStat
                  label="Busiest day"
                  value={DAYS[busiest.dayIdx]}
                  sub={`${dayTotals?.[busiest.dayIdx].toLocaleString()} sessions`}
                />
                <PillStat
                  label="Peak hour"
                  value={`${busiest.hourIdx}:00`}
                  sub={`${hourTotals?.[busiest.hourIdx].toLocaleString()} starts`}
                />
                <PillStat label="Weekend share" value={`${busiest.weekendShare}%`} sub="Sat + Sun" />
                <PillStat label="Evening share" value={`${busiest.eveningShare}%`} sub="6pm – 11pm" />
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Day-of-week bars ─────────────────────────────────── */}
      {dayTotals && (
        <GlassCard className="p-5">
          <SectionHeader title="Day-of-week volume" hint="Total session starts, aggregated across the window." />
          <DayBars totals={dayTotals} />
        </GlassCard>
      )}

      <p className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
        Methodology · counts reflect completed session starts; cells with fewer than the
        anonymity threshold are automatically suppressed. Medians resist outliers created by
        rescheduled or extra-long crisis sessions.
      </p>
    </div>
  );
}

// ── Local UI helpers ─────────────────────────────────────────────

function RangePicker({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div
      className="inline-flex rounded-full p-1 text-[11.5px]"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
    >
      {RANGES.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className="px-3 py-1 rounded-full transition-colors"
            style={{
              background: active ? "var(--pc-accent)" : "transparent",
              color: active ? "var(--pc-on-accent, white)" : "var(--pc-ink-2)",
              fontWeight: active ? 600 : 500,
            }}
          >
            {r === "ay" ? "Acad. yr" : r.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-serif text-[16px]" style={{ color: "var(--pc-ink)" }}>{title}</h3>
      {hint && <p className="mt-1 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>{hint}</p>}
    </div>
  );
}

function CompletionRing({ pct }: { pct: number }) {
  const size = 132;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pc-surface2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--pc-accent)" strokeWidth={stroke}
          strokeDasharray={`${(c * p) / 100} ${c}`} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-serif text-[26px] leading-none" style={{ color: "var(--pc-ink)" }}>{p}%</div>
          <div className="text-[10px] mt-1" style={{ color: "var(--pc-muted)" }}>completed</div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5" style={{ borderBottom: "1px dashed var(--pc-border)" }}>
      <span className="text-[11.5px]" style={{ color: "var(--pc-muted)" }}>{label}</span>
      <span
        className="font-mono tabular-nums text-[13px]"
        style={{ color: accent ? "var(--pc-accent)" : "var(--pc-ink)", fontWeight: accent ? 600 : 400 }}
      >
        {value}
      </span>
    </div>
  );
}

function PillStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
    >
      <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--pc-muted)" }}>{label}</div>
      <div className="font-serif text-[20px] leading-tight mt-1" style={{ color: "var(--pc-ink)" }}>{value}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: "var(--pc-ink-2)" }}>{sub}</div>}
    </div>
  );
}

function DurationHistogram({ data }: { data: number[] }) {
  const buckets = [
    { label: "< 30m", lo: 0, hi: 30 },
    { label: "30–40m", lo: 30, hi: 40 },
    { label: "40–50m", lo: 40, hi: 50 },
    { label: "50–60m", lo: 50, hi: 60 },
    { label: "60m+", lo: 60, hi: Infinity },
  ];
  const counts = buckets.map((b) => data.filter((v) => v >= b.lo && v < b.hi).length);
  const max = Math.max(1, ...counts);
  const total = counts.reduce((s, v) => s + v, 0) || 1;
  return (
    <div className="flex flex-col gap-2">
      {buckets.map((b, i) => {
        const pct = Math.round((counts[i] / total) * 100);
        return (
          <div key={b.label} className="grid grid-cols-[56px_1fr_44px] items-center gap-3">
            <span className="text-[11.5px]" style={{ color: "var(--pc-muted)" }}>{b.label}</span>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
              <div
                style={{
                  width: `${(counts[i] / max) * 100}%`,
                  height: "100%",
                  background: "color-mix(in oklab, var(--pc-accent) 78%, transparent)",
                  transition: "width 260ms ease",
                }}
              />
            </div>
            <span className="text-[11.5px] font-mono tabular-nums text-right" style={{ color: "var(--pc-ink)" }}>
              {counts[i]} · {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DayBars({ totals }: { totals: number[] }) {
  const max = Math.max(1, ...totals);
  return (
    <div className="flex items-end gap-3 h-40 pt-4">
      {totals.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <span className="text-[11px] font-mono tabular-nums opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--pc-ink)" }}>
            {v.toLocaleString()}
          </span>
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${(v / max) * 100}%`,
              background: `color-mix(in oklab, var(--pc-accent) ${40 + Math.round((v / max) * 50)}%, var(--pc-surface))`,
              border: "1px solid var(--pc-border)",
            }}
            title={`${DAYS[i]}: ${v} sessions`}
          />
          <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{DAYS[i]}</span>
        </div>
      ))}
    </div>
  );
}
