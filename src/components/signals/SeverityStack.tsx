// 100% stacked area of severity bands over the selected window.
// Clicking a band applies the band filter to the whole page.
import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { bandsFor, type BandKey, type ScaleId } from "@/lib/clinical-scales";
import { getBands, type RangeKey } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

export function SeverityStack({
  scale, range, band, onSelectBand,
}: {
  scale: ScaleId;
  range: RangeKey;
  band: BandKey | "all";
  onSelectBand: (b: BandKey | "all") => void;
}) {
  const result = useMemo(() => getBands(scale, range, "all"), [scale, range]);
  const bands = bandsFor(scale);

  if (isSuppressed(result)) return <SuppressedTile label="Not enough students in this window to show a distribution." />;

  const dataForBand = band === "all"
    ? result.data
    : result.data.map((row) => {
        const r = { week: row.week } as { week: string } & Record<BandKey, number>;
        (["minimal","mild","moderate","modsevere","severe"] as BandKey[]).forEach((k) => {
          r[k] = k === band ? row[k] : 0;
        });
        return r;
      });

  const first = result.data[0];
  const last = result.data[result.data.length - 1];
  const modFirst = (first?.moderate ?? 0) + (first?.modsevere ?? 0) + (first?.severe ?? 0);
  const modLast = (last?.moderate ?? 0) + (last?.modsevere ?? 0) + (last?.severe ?? 0);
  const ariaSummary =
    `${scale === "phq9" ? "PHQ-9" : "GAD-7"} severity distribution over ${result.data.length} weeks. ` +
    `Moderate+ share moved from ${modFirst.toFixed(1)}% to ${modLast.toFixed(1)}%.`;

  return (
    <div
      className="h-64"
      role="img"
      aria-label={ariaSummary}
      onClick={(e) => {
        // Recharts sets data-recharts-cursor; we rely on legend clicks and
        // legend keyboard instead for band selection.
        e.stopPropagation();
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dataForBand} margin={{ top: 6, right: 10, left: -14, bottom: 0 }} stackOffset="expand">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--pc-border)" vertical={false} />
          <XAxis dataKey="week" stroke="var(--pc-muted)" fontSize={10} interval={Math.max(0, Math.floor(result.data.length / 8))} />
          <YAxis stroke="var(--pc-muted)" fontSize={10} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} />
          <Tooltip
            contentStyle={{
              background: "var(--pc-surface)", border: "1px solid var(--pc-border)",
              color: "var(--pc-ink)", borderRadius: 8, fontSize: 12,
            }}
            formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "var(--pc-muted)", cursor: "pointer" }}
            onClick={(entry) => {
              const key = entry.dataKey as BandKey;
              onSelectBand(band === key ? "all" : key);
            }}
          />
          {bands.map((b) => (
            <Area
              key={b.key}
              type="monotone"
              dataKey={b.key}
              name={b.label}
              stackId="sev"
              stroke={b.color}
              fill={b.color}
              fillOpacity={0.85}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
