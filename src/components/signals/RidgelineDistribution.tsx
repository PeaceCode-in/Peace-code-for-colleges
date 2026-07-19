// Ridgeline of monthly score-distributions for the selected scale.
// One horizontal density curve per ~4-week month with a median tick.
import { useMemo } from "react";
import { getRidgeline, type RangeKey } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { SCALE_MAX, type ScaleId } from "@/lib/clinical-scales";

export function RidgelineDistribution({
  scale, range,
}: {
  scale: ScaleId;
  range: RangeKey;
}) {
  const res = useMemo(() => getRidgeline(scale, range), [scale, range]);
  if (isSuppressed(res)) return <SuppressedTile label="Not enough completed assessments in this window to show a trend. Broaden the range to 26 weeks." />;
  const { rows } = res;
  if (rows.length === 0) return <SuppressedTile label="No month in this window meets the anonymity floor." />;

  const max = SCALE_MAX[scale];
  const rowH = 44;
  const chartW = 460;
  const padL = 48;
  const padR = 12;
  const innerW = chartW - padL - padR;
  const totalH = rows.length * rowH + 24;

  const maxDensity = Math.max(...rows.flatMap((r) => r.bins.map((b) => b.density))) || 1;

  return (
    <div
      role="img"
      aria-label={`${scale === "phq9" ? "PHQ-9" : "GAD-7"} score distributions per ${rows.length} months. Higher score = more severe.`}
      className="w-full overflow-x-auto"
    >
      <svg
        width={chartW}
        height={totalH}
        viewBox={`0 0 ${chartW} ${totalH}`}
        style={{ display: "block" }}
      >
        {/* baseline scale ticks along the bottom */}
        {[0, Math.floor(max / 4), Math.floor(max / 2), Math.floor((3 * max) / 4), max].map((t, i) => {
          const x = padL + (t / max) * innerW;
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={0} y2={rows.length * rowH} stroke="var(--pc-border)" strokeDasharray="2 3" />
              <text x={x} y={totalH - 6} fontSize={10} fill="var(--pc-muted)" textAnchor="middle">{t}</text>
            </g>
          );
        })}
        {rows.map((row, ri) => {
          const y0 = ri * rowH + 4;
          const yBase = y0 + rowH - 8;
          const amp = rowH - 12;
          const pts = row.bins.map((b) => {
            const x = padL + (b.score / max) * innerW;
            const y = yBase - (b.density / maxDensity) * amp;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(" ");
          const areaPts = `${padL},${yBase} ${pts} ${padL + innerW},${yBase}`;
          const medianX = padL + (row.median / max) * innerW;
          return (
            <g key={row.monthLabel}>
              <text x={4} y={yBase - amp / 2 + 4} fontSize={10} fill="var(--pc-muted)">{row.monthLabel}</text>
              <polygon
                points={areaPts}
                fill="color-mix(in oklab, var(--pc-accent) 24%, transparent)"
                stroke="var(--pc-accent)"
                strokeWidth={1.2}
              />
              <line
                x1={medianX} x2={medianX}
                y1={yBase - amp} y2={yBase + 2}
                stroke="var(--pc-ink-2)"
                strokeWidth={1.4}
              />
              <text x={medianX + 4} y={yBase - amp + 10} fontSize={9} fill="var(--pc-ink-2)">
                med {row.median}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
