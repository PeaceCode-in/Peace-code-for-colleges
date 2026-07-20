import { useState } from "react";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Series {
  label: string;
  values: number[];
}

interface Props {
  series: Series[];
  width?: number;
  height?: number;
  color?: string;
  ariaLabel?: string;
  /** Optional bin labels shown when hovering (e.g. score buckets). */
  binLabels?: string[];
  unit?: string;
}

/** RidgeChart — stacked density ridges, hoverable per row with peak highlight. */
export function RidgeChart({ series, width = 320, height = 160, color = "var(--pc-primary)", ariaLabel, binLabels, unit = "" }: Props) {
  const tip = useChartTooltip();
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  if (!series.length) return null;
  const rowH = height / series.length;
  const maxV = Math.max(...series.flatMap((s) => s.values), 1);

  return (
    <div
      ref={tip.wrapperRef}
      className="relative inline-block"
      onMouseMove={tip.onMove}
      onMouseLeave={() => { tip.hide(); setHoverRow(null); setHoverBin(null); }}
    >
      <svg width={width} height={height + 12} role="img" aria-label={ariaLabel ?? "Distribution ridges"} className="overflow-visible">
        {series.map((s, i) => {
          const n = s.values.length;
          const step = width / (n - 1 || 1);
          const baseY = (i + 1) * rowH;
          const pts = s.values.map((v, j) => {
            const x = j * step;
            const y = baseY - (v / maxV) * rowH * 0.9;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          const line = "M" + pts.join(" L");
          const area = `${line} L${width},${baseY} L0,${baseY} Z`;
          const isHoverRow = hoverRow === i;
          const dim = hoverRow !== null && !isHoverRow;
          const peakIdx = s.values.reduce((m, v, j, arr) => (v > arr[m] ? j : m), 0);
          return (
            <g
              key={s.label}
              style={{ animation: `pc-ridge-in 600ms ease-out ${i * 60}ms both`, opacity: dim ? 0.35 : 1, transition: "opacity 160ms ease-out" }}
            >
              <path d={area} fill={color} opacity={isHoverRow ? 0.28 : 0.16} style={{ transition: "opacity 160ms ease-out" }} />
              <path d={line} stroke={color} strokeWidth={isHoverRow ? 1.8 : 1.2} fill="none" style={{ transition: "stroke-width 160ms ease-out" }} />
              <text x={2} y={baseY - rowH * 0.9 - 2} className="text-[10px]"
                fill={isHoverRow ? "var(--pc-ink)" : "var(--pc-muted)"}
                style={{ transition: "fill 120ms ease-out", fontWeight: isHoverRow ? 600 : 400 }}
              >
                {s.label}
              </text>
              {/* Hover hit-strip covering the row */}
              <rect
                x={0}
                y={baseY - rowH * 0.95}
                width={width}
                height={rowH}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseMove={(e) => {
                  const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
                  const rx = e.clientX - rect.left;
                  const bin = Math.max(0, Math.min(n - 1, Math.round(rx / step)));
                  setHoverRow(i);
                  setHoverBin(bin);
                  const label = binLabels?.[bin] ?? `Bin ${bin + 1}`;
                  tip.show(
                    <>
                      <TooltipTitle sub={s.label}>Distribution</TooltipTitle>
                      <TooltipRow dot={color} label={label} value={`${s.values[bin]?.toFixed(2) ?? "–"}${unit ? ` ${unit}` : ""}`} />
                      <TooltipRow label="Peak" value={`${binLabels?.[peakIdx] ?? `bin ${peakIdx + 1}`} · ${s.values[peakIdx].toFixed(2)}`} />
                      <TooltipRow label="Mass" value={s.values.reduce((a, v) => a + v, 0).toFixed(1)} />
                      <TooltipHint>Density estimate — taller ridge = more members concentrated here.</TooltipHint>
                    </>,
                    e,
                  );
                }}
                onMouseLeave={() => { setHoverBin(null); }}
              />
              {isHoverRow && hoverBin !== null && (
                <>
                  <line
                    x1={hoverBin * step}
                    x2={hoverBin * step}
                    y1={baseY - rowH * 0.95}
                    y2={baseY}
                    stroke="var(--pc-ink)"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    opacity={0.55}
                  />
                  <circle
                    cx={hoverBin * step}
                    cy={baseY - (s.values[hoverBin] / maxV) * rowH * 0.9}
                    r={3.2}
                    fill={color}
                    stroke="var(--pc-surface)"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
      <style>{`@keyframes pc-ridge-in { from { opacity: 0; transform: translateY(4px);} to {opacity:1; transform: translateY(0);} }`}</style>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
