// Ridgeline of monthly score-distributions for the selected scale.
// One horizontal density curve per ~4-week month with a median tick.
// Interactive: hover any row to spotlight it and inspect the score bin
// under the cursor via a floating tooltip.
import { useMemo, useRef, useState } from "react";
import { useTouchAsHover } from "@/components/viz/ChartTooltip";
import { getRidgeline, type RangeKey } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { SCALE_MAX, bandsFor, type ScaleId } from "@/lib/clinical-scales";

type HoverState = {
  rowIndex: number;
  score: number;
  density: number;
  monthLabel: string;
  median: number;
  x: number;
  y: number;
};

export function RidgelineDistribution({
  scale, range,
}: {
  scale: ScaleId;
  range: RangeKey;
}) {
  const res = useMemo(() => getRidgeline(scale, range), [scale, range]);
  const [hover, setHover] = useState<HoverState | null>(null);

  if (isSuppressed(res)) return <SuppressedTile label="Not enough completed assessments in this window to show a trend. Broaden the range to 26 weeks." />;
  const { rows } = res;
  if (rows.length === 0) return <SuppressedTile label="No month in this window meets the anonymity floor." />;

  const max = SCALE_MAX[scale];
  const bands = bandsFor(scale);
  const rowH = 44;
  const chartW = 460;
  const padL = 48;
  const padR = 12;
  const innerW = chartW - padL - padR;
  const totalH = rows.length * rowH + 24;
  const maxDensity = Math.max(...rows.flatMap((r) => r.bins.map((b) => b.density))) || 1;

  const bandFor = (score: number) =>
    bands.find((b) => score >= b.min && score <= b.max);

  return (
    <div
      role="img"
      aria-label={`${scale === "phq9" ? "PHQ-9" : "GAD-7"} score distributions per ${rows.length} months. Higher score = more severe.`}
      className="w-full overflow-x-auto relative"
    >
      <svg
        width={chartW}
        height={totalH}
        viewBox={`0 0 ${chartW} ${totalH}`}
        style={{ display: "block" }}
        onMouseLeave={() => setHover(null)}
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
          const dim = hover !== null && hover.rowIndex !== ri;

          return (
            <g key={row.monthLabel} style={{ opacity: dim ? 0.35 : 1, transition: "opacity 120ms" }}>
              <text x={4} y={yBase - amp / 2 + 4} fontSize={10} fill="var(--pc-muted)">{row.monthLabel}</text>
              <polygon
                points={areaPts}
                fill="color-mix(in oklab, var(--pc-accent) 24%, transparent)"
                stroke="var(--pc-accent)"
                strokeWidth={hover?.rowIndex === ri ? 1.8 : 1.2}
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

              {/* hover hit rect (per row) — captures pointer and touch */}
              <rect
                x={padL}
                y={y0}
                width={innerW}
                height={rowH - 4}
                fill="transparent"
                onMouseMove={(e) => {
                  const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
                  const rel = e.clientX - rect.left;
                  const score = Math.max(0, Math.min(max, Math.round((rel / innerW) * max)));
                  const bin = row.bins.reduce((prev, cur) =>
                    Math.abs(cur.score - score) < Math.abs(prev.score - score) ? cur : prev
                  );
                  setHover({
                    rowIndex: ri,
                    score: bin.score,
                    density: bin.density,
                    monthLabel: row.monthLabel,
                    median: row.median,
                    x: padL + (bin.score / max) * innerW,
                    y: yBase - (bin.density / maxDensity) * amp,
                  });
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
                  const rel = touch.clientX - rect.left;
                  const score = Math.max(0, Math.min(max, Math.round((rel / innerW) * max)));
                  const bin = row.bins.reduce((prev, cur) =>
                    Math.abs(cur.score - score) < Math.abs(prev.score - score) ? cur : prev
                  );
                  setHover({
                    rowIndex: ri, score: bin.score, density: bin.density,
                    monthLabel: row.monthLabel, median: row.median,
                    x: padL + (bin.score / max) * innerW,
                    y: yBase - (bin.density / maxDensity) * amp,
                  });
                }}
              />

              {hover?.rowIndex === ri && (
                <>
                  <line
                    x1={hover.x} x2={hover.x}
                    y1={y0} y2={yBase}
                    stroke="var(--pc-accent)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    pointerEvents="none"
                  />
                  <circle
                    cx={hover.x} cy={hover.y} r={3.5}
                    fill="var(--pc-accent)"
                    stroke="var(--pc-surface)"
                    strokeWidth={1.5}
                    pointerEvents="none"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md px-2.5 py-1.5 text-[11px] shadow-lg"
          style={{
            left: `min(${hover.x + 12}px, calc(100% - 180px))`,
            top: `${hover.y - 8}px`,
            background: "var(--pc-surface)",
            border: "1px solid var(--pc-border)",
            color: "var(--pc-ink)",
            minWidth: 150,
          }}
        >
          <div className="font-medium">{hover.monthLabel}</div>
          <div style={{ color: "var(--pc-muted)" }}>
            Score {hover.score} · {bandFor(hover.score)?.label ?? "—"}
          </div>
          <div style={{ color: "var(--pc-muted)" }}>
            {(hover.density * 100).toFixed(1)}% of cohort · median {hover.median}
          </div>
        </div>
      )}
    </div>
  );
}
