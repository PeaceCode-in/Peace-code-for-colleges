import { useState } from "react";
import { ChartTooltip, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel?: string;
  color?: string;
  fill?: boolean;
  labels?: string[];
  unit?: string;
}

/** Sparkline — hoverable inline line chart with focused dot + tooltip. */
export function VizSparkline({
  values, width = 96, height = 22, ariaLabel, color = "var(--pc-primary)", fill = true, labels, unit = "",
}: Props) {
  const tip = useChartTooltip();
  const [hover, setHover] = useState<number | null>(null);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return { x, y, v };
  });
  const line = "M" + pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const delta = values[values.length - 1] - values[0];

  return (
    <div
      ref={tip.wrapperRef}
      className="relative inline-block"
      onMouseMove={(e) => {
        tip.onMove(e);
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const rx = e.clientX - rect.left;
        const idx = Math.max(0, Math.min(values.length - 1, Math.round(rx / step)));
        if (idx !== hover) {
          setHover(idx);
          tip.show(
            <>
              <TooltipTitle sub={labels?.[idx] ?? `Point ${idx + 1}`}>Trend</TooltipTitle>
              <TooltipRow dot={color} label="Value" value={`${values[idx]}${unit ? ` ${unit}` : ""}`} />
              <TooltipRow label="Range" value={`${min}${unit ? ` ${unit}` : ""} → ${max}${unit ? ` ${unit}` : ""}`} />
              <TooltipRow label="Δ overall" value={`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`} />
            </>,
            e,
          );
        }
      }}
      onMouseLeave={() => { tip.hide(); setHover(null); }}
    >
      <svg width={width} height={height} role="img" aria-label={ariaLabel ?? "Trend"} className="overflow-visible">
        {fill && <path d={area} fill={color} opacity={0.14} />}
        <path d={line} stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && pts[hover] && (
          <>
            <line x1={pts[hover].x} x2={pts[hover].x} y1={0} y2={height} stroke="var(--pc-ink)" strokeWidth={0.6} opacity={0.35} strokeDasharray="2 3" />
            <circle cx={pts[hover].x} cy={pts[hover].y} r={2.6} fill={color} stroke="var(--pc-surface)" strokeWidth={1.2} />
          </>
        )}
      </svg>
      <ChartTooltip state={tip.state} />
    </div>
  );
}

export { VizSparkline as Sparkline };
