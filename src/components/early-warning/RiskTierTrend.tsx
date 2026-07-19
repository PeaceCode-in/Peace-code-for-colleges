// 12-week stacked area of aggregate risk-tier populations. Segment
// toggle (institution / school-blend / year-blend) reshapes the input;
// tier legend toggles isolate a single band. Never a per-student chart.
import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { getRiskTrend, isSuppressed, type EwSegment, type EwWindowKey } from "@/lib/early-warning-selectors";
import { RISK_TIER_COLOR, RISK_TIER_LABEL, type RiskTier } from "@/lib/clinical-scales";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

const TIERS: RiskTier[] = ["elevated", "high", "item9", "overdue"];

export function RiskTierTrend({
  window,
  seg,
  focus,
}: {
  window: EwWindowKey;
  seg: EwSegment;
  focus: RiskTier | "all";
}) {
  const bundle = getRiskTrend(window, seg);
  const chartStyle = typeof document !== "undefined"
    ? document.documentElement.getAttribute("data-chart-style") ?? "smooth"
    : "smooth";
  const curve = chartStyle === "sharp" ? "linear" : "monotone";

  const visible: RiskTier[] = focus === "all" ? TIERS : [focus];
  const data = useMemo(() => {
    if (isSuppressed(bundle)) return [];
    return bundle.data.map((row) => {
      const out: Record<string, number | string> = { week: row.week };
      for (const t of visible) out[t] = row[t];
      return out;
    });
  }, [bundle, visible.join("|")]);

  if (isSuppressed(bundle)) {
    return <SuppressedTile label="Risk-tier population" reason="k<10" />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
            Aggregate risk-tier population · {bundle.label}
          </div>
          <div className="font-serif text-[18px] leading-tight" style={{ color: "var(--pc-ink)" }}>
            Last 12 weeks
          </div>
        </div>
        <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>n = {bundle.n} in latest week</span>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--pc-border) 60%, transparent)" />
            <XAxis dataKey="week" stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }} />
            <YAxis stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }} />
            <Tooltip
              contentStyle={{
                background: "var(--pc-surface)",
                border: "1px solid var(--pc-border)",
                borderRadius: 8,
                color: "var(--pc-ink)",
                fontSize: 12,
              }}
              cursor={{ stroke: "var(--pc-border)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--pc-muted)" }} />
            {visible.map((t) => (
              <Area
                key={t}
                type={curve}
                dataKey={t}
                name={RISK_TIER_LABEL[t]}
                stackId="1"
                stroke={RISK_TIER_COLOR[t]}
                fill={RISK_TIER_COLOR[t]}
                fillOpacity={0.24}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
