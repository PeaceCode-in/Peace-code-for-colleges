import { useState } from "react";
import { ChartTooltip, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel?: string;
  color?: string;
  labels?: string[];
  unit?: string;
}

/** Sparkbar — hoverable inline bars, tooltip on each bar. */
export function Sparkbar({ values, width = 88, height = 18, ariaLabel, color = "var(--pc-primary)", labels, unit = "" }: Props) {
  const tip = useChartTooltip();
  const [hover, setHover] = useState<number | null>(null);
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const gap = 1;
  const bw = (width - gap * (values.length - 1)) / values.length;
  return (
    <div
      ref={tip.wrapperRef}
      className="relative inline-block"
      onMouseMove={tip.onMove}
      onMouseLeave={() => { tip.hide(); setHover(null); }}
    >
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel ?? `Trend of ${values.length} points`}
        className="overflow-visible"
      >
        {values.map((v, i) => {
          const h = Math.max(1.5, (v / max) * height);
          const isHover = hover === i;
          return (
            <rect
              key={i}
              x={i * (bw + gap)}
              y={height - h}
              width={bw}
              height={h}
              rx={1}
              fill={color}
              opacity={isHover ? 1 : 0.35 + 0.65 * (v / max)}
              style={{ transition: "opacity 120ms ease-out", cursor: "crosshair" }}
              onMouseEnter={(e) => {
                setHover(i);
                tip.show(
                  <>
                    <TooltipTitle sub={labels?.[i] ?? `Point ${i + 1}`}>Sparkbar</TooltipTitle>
                    <TooltipRow dot={color} label="Value" value={`${v}${unit ? ` ${unit}` : ""}`} />
                    <TooltipRow label="vs peak" value={`${((v / max) * 100).toFixed(0)}%`} />
                  </>,
                  e,
                );
              }}
            />
          );
        })}
      </svg>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
