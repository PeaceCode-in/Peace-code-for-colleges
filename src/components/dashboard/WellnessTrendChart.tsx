// 12-week wellness trend. Three series (Overall, First-year, Final-year)
// drawn with the accent scale derived from the active accent. Legend
// chips toggle series; tooltip shows week + all visible series.
import { useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { BentoTile } from "./BentoTile";
import type { ExecutiveSnapshot } from "@/lib/dashboard-mock";
import { deriveAccentScale } from "@/lib/accent-derive";
import { loadSettings, ACCENTS } from "@/lib/settings-store";

type SeriesKey = "overall" | "firstYear" | "finalYear";
const SERIES: { key: SeriesKey; label: string; token: "a1" | "a2" | "a3" }[] = [
  { key: "overall",   label: "Overall",    token: "a1" },
  { key: "firstYear", label: "First-year", token: "a2" },
  { key: "finalYear", label: "Final-year", token: "a3" },
];

export function WellnessTrendChart({ snap, className = "", onExpand }: { snap: ExecutiveSnapshot; className?: string; onExpand?: () => void }) {
  const [on, setOn] = useState<Record<SeriesKey, boolean>>({
    overall: true, firstYear: true, finalYear: true,
  });
  const scale = useMemo(() => {
    const s = typeof window !== "undefined" ? loadSettings() : null;
    const hex = s ? ACCENTS[s.appearance.accent].primary : "#3F6B4E";
    return deriveAccentScale(hex);
  }, [snap.asOf]);

  // chart-style attribute → area curve style + gridline dimming
  const style = typeof document !== "undefined"
    ? document.documentElement.getAttribute("data-chart-style") ?? "smooth"
    : "smooth";
  const curveType = style === "sharp" ? "linear" : "monotone";
  const gridStroke = style === "dotted" ? "color-mix(in oklab, var(--pc-border) 40%, transparent)" : "var(--pc-border)";

  const first = snap.wellnessTrend[0]?.overall ?? 0;
  const last = snap.wellnessTrend[snap.wellnessTrend.length - 1]?.overall ?? 0;

  return (
    <BentoTile
      title="Wellness trend"
      eyebrow="Last 12 weeks"
      className={className}
      footer={<>Series recolor with the active accent · tap a chip to toggle · expand for 26-week view</>}
      onExpand={onExpand}
      expandLabel="Open 26-week trend"
    >
      <div className="flex items-center justify-end gap-2 flex-wrap mb-2">
        {SERIES.map((s) => {
          const active = on[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setOn((o) => ({ ...o, [s.key]: !o[s.key] }))}
              aria-pressed={active}
              className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: active ? "var(--pc-surface2)" : "transparent",
                border: "1px solid var(--pc-border)",
                color: active ? "var(--pc-ink)" : "var(--pc-muted)",
                opacity: active ? 1 : 0.6,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: scale[s.token] }} />
              {s.label}
            </button>
          );
        })}
      </div>
      <div
        className="h-[240px]"
        role="img"
        aria-label={`Wellness trend over 12 weeks. Overall index moves from ${first} to ${last}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={snap.wellnessTrend} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`wt-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={scale[s.token]} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={scale[s.token]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="week" stroke="var(--pc-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--pc-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[40, 100]} />
            <Tooltip content={<TrendTip />} />
            {SERIES.filter((s) => on[s.key]).map((s) => (
              <Area
                key={s.key}
                type={curveType}
                dataKey={s.key}
                stroke={scale[s.token]}
                strokeWidth={1.6}
                fill={`url(#wt-${s.key})`}
                isAnimationActive
                animationDuration={280}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </BentoTile>
  );
}

function TrendTip({ active, payload, label }: any) {
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
      <div style={{ color: "var(--pc-muted)" }}>Week {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "var(--pc-ink)" }}>{p.dataKey} · {p.value}</span>
        </div>
      ))}
    </div>
  );
}
