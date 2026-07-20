// Small-multiples scatter of department-level aggregates. Each point is a
// department (N ≥ 10), never a student. Trend line + Pearson r shown per
// mini-chart.
import { useMemo } from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { getCorrelations, pearson } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import type { CorrelationPoint } from "@/lib/dashboard-mock.signals";

type Facet = {
  key: string;
  title: string;
  xKey: keyof CorrelationPoint;
  yKey: keyof CorrelationPoint;
  xLabel: string;
  yLabel: string;
};

const FACETS: Facet[] = [
  { key: "phq9-engagement", title: "PHQ-9 avg vs engagement",  xKey: "phq9Avg",  yKey: "engagementPct",  xLabel: "PHQ-9 avg", yLabel: "Engagement %" },
  { key: "gad7-freq",       title: "GAD-7 avg vs session freq", xKey: "gad7Avg",  yKey: "sessionFreq",    xLabel: "GAD-7 avg", yLabel: "Sessions / wk" },
  { key: "phq9d-sustained", title: "PHQ-9 delta vs sustained %", xKey: "phq9Delta", yKey: "sustainedPct",  xLabel: "Δ PHQ-9",   yLabel: "Sustained %" },
];

export function CorrelationStrip() {
  const res = useMemo(() => getCorrelations(), []);
  if (isSuppressed(res)) return <SuppressedTile label="No departments meet the anonymity floor for correlation." />;
  const { points } = res;
  if (points.length < 3) return <SuppressedTile label="Fewer than three departments meet the anonymity floor." />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {FACETS.map((f) => (
        <FacetChart key={f.key} facet={f} points={points} />
      ))}
    </div>
  );
}

function FacetChart({ facet, points }: { facet: Facet; points: CorrelationPoint[] }) {
  const xs = points.map((p) => Number(p[facet.xKey]));
  const ys = points.map((p) => Number(p[facet.yKey]));
  const r = pearson(xs, ys);
  const data = points.map((p) => ({
    x: Number(p[facet.xKey]),
    y: Number(p[facet.yKey]),
    dept: p.deptName,
    n: p.n,
  }));

  // Linear regression for the trend line: y = a + b*x.
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const b = den === 0 ? 0 : num / den;
  const a = my - b * mx;
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const trend = [
    { x: xMin, y: a + b * xMin },
    { x: xMax, y: a + b * xMax },
  ];

  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[11.5px]" style={{ color: "var(--pc-ink)" }}>{facet.title}</div>
        <div
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            background: "color-mix(in oklab, var(--pc-accent) 12%, var(--pc-surface))",
            color: "var(--pc-ink-2)",
            border: "1px solid var(--pc-border)",
            fontFamily: "var(--font-mono, ui-monospace)",
          }}
          title="Pearson correlation coefficient across departments"
        >
          r = {r.toFixed(2)}
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--pc-border)" />
            <XAxis type="number" dataKey="x" stroke="var(--pc-muted)" fontSize={10} name={facet.xLabel} />
            <YAxis type="number" dataKey="y" stroke="var(--pc-muted)" fontSize={10} name={facet.yLabel} />
            <Tooltip
              cursor={{ stroke: "var(--pc-accent)", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "var(--pc-surface)", border: "1px solid var(--pc-border)",
                color: "var(--pc-ink)", borderRadius: 8, fontSize: 12,
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { dept?: string; n?: number; x: number; y: number };
                if (!p.dept) return null;
                return (
                  <div className="rounded-md px-2.5 py-1.5" style={{
                    background: "var(--pc-surface)", border: "1px solid var(--pc-border)",
                    color: "var(--pc-ink)", fontSize: 12, minWidth: 160,
                  }}>
                    <div className="font-medium">{p.dept}</div>
                    <div style={{ color: "var(--pc-muted)" }}>{facet.xLabel}: {p.x}</div>
                    <div style={{ color: "var(--pc-muted)" }}>{facet.yLabel}: {p.y}</div>
                    <div style={{ color: "var(--pc-muted)" }}>n = {p.n?.toLocaleString?.() ?? p.n}</div>
                  </div>
                );
              }}
            />
            <Scatter
              data={data}
              fill="var(--pc-accent)"
              isAnimationActive={false}
              style={{ cursor: "pointer" }}
            />
            <Scatter
              data={trend}
              line={{ stroke: "var(--pc-ink-2)", strokeWidth: 1, strokeDasharray: "4 3" }}
              shape={() => <g />}
              legendType="none"
              isAnimationActive={false}
            />
            <ReferenceLine y={0} stroke="transparent" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-[10px]" style={{ color: "var(--pc-muted)" }}>
        {facet.xLabel} → {facet.yLabel} · {points.length} departments · aggregate only
      </div>
    </div>
  );
}
