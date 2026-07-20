// Session cadence — dual-axis: weekly session starts (bars) + median
// session length in minutes (line). Includes brush selector.
import { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Brush,
} from "recharts";
import { getCadence, type RangeKey } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

export function SessionCadence({ range }: { range: RangeKey }) {
  const res = useMemo(() => getCadence(range), [range]);
  if (isSuppressed(res)) return <SuppressedTile label="Not enough session activity in this window." />;
  const { data } = res;
  const summary =
    `Weekly session starts across ${data.length} weeks, ` +
    `median session length in minutes overlaid.`;
  return (
    <div className="h-64" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--pc-border)" vertical={false} />
          <XAxis dataKey="week" stroke="var(--pc-muted)" fontSize={10} interval={Math.max(0, Math.floor(data.length / 8))} />
          <YAxis yAxisId="left" stroke="var(--pc-muted)" fontSize={10} />
          <YAxis yAxisId="right" orientation="right" stroke="var(--pc-muted)" fontSize={10} tickFormatter={(v) => `${v}m`} />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--pc-accent) 8%, transparent)" }}
            contentStyle={{
              background: "var(--pc-surface)", border: "1px solid var(--pc-border)",
              color: "var(--pc-ink)", borderRadius: 8, fontSize: 12,
            }}
            labelStyle={{ color: "var(--pc-ink)", fontWeight: 600, marginBottom: 2 }}
            formatter={(v: number, name: string) =>
              name === "Median minutes"
                ? [`${v} min`, name]
                : [v.toLocaleString(), name]
            }
            labelFormatter={(l) => `Week of ${l}`}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "var(--pc-muted)" }} />
          <Bar yAxisId="left" dataKey="starts" name="Sessions started" fill="var(--pc-accent)" radius={[3, 3, 0, 0]} style={{ cursor: "pointer" }} />
          <Line yAxisId="right" type="monotone" dataKey="medianMinutes" name="Median minutes" stroke="var(--pc-accent-2)" strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--pc-surface)", strokeWidth: 1.5 }} isAnimationActive={false} />
          {data.length > 8 && (
            <Brush dataKey="week" height={18} stroke="var(--pc-border)" travellerWidth={8} y={230} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
