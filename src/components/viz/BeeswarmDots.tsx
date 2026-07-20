import { useState } from "react";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Props {
  values: number[];
  n: number;
  width?: number;
  height?: number;
  domain?: [number, number];
  ariaLabel?: string;
  color?: string;
  /** Optional label describing what a single dot represents, e.g. "Cohort mean". */
  unitLabel?: string;
  /** Optional formatter for hover value display. */
  format?: (v: number) => string;
}

/** BeeswarmDots — jittered dots, fully hoverable with tooltip. */
export function BeeswarmDots({
  values,
  n,
  width = 320,
  height = 90,
  domain,
  ariaLabel,
  color = "var(--pc-primary)",
  unitLabel = "Value",
  format,
}: Props) {
  const suppressed = n < 10;
  const lo = domain?.[0] ?? Math.min(...values, 0);
  const hi = domain?.[1] ?? Math.max(...values, 1);
  const span = hi - lo || 1;
  const jitter = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1) * (height - 20);
  const tip = useChartTooltip();
  const [hover, setHover] = useState<number | null>(null);
  const fmt = format ?? ((v: number) => v.toFixed(2));

  return (
    <div
      ref={tip.wrapperRef}
      role="img"
      aria-label={ariaLabel ?? `Distribution across ${n} respondents`}
      className="relative"
      onMouseMove={tip.onMove}
      onMouseLeave={() => { tip.hide(); setHover(null); }}
    >
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" preserveAspectRatio="none">
        <line x1={0} y1={height - 8} x2={width} y2={height - 8} stroke="var(--pc-border)" />
        {!suppressed &&
          values.map((v, i) => {
            const x = ((v - lo) / span) * width;
            const y = 8 + Math.abs(jitter(i));
            const active = hover === i;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={active ? 4.2 : 2.4}
                fill={color}
                opacity={active ? 0.95 : 0.55}
                style={{ transition: "r 120ms ease-out, opacity 120ms ease-out", cursor: "crosshair" }}
                onMouseEnter={(e) => {
                  setHover(i);
                  const pct = ((v - lo) / span) * 100;
                  tip.show(
                    <>
                      <TooltipTitle sub={fmt(v)}>{unitLabel}</TooltipTitle>
                      <TooltipRow label="Percentile" value={`${pct.toFixed(0)}%`} />
                      <TooltipRow label="Range" value={`${fmt(lo)} → ${fmt(hi)}`} />
                      <TooltipHint>One dot = one aggregate bin, never a student.</TooltipHint>
                    </>,
                    e,
                  );
                }}
              />
            );
          })}
        {suppressed && (
          <g>
            <rect x={0} y={0} width={width} height={height} fill="var(--pc-surface2)" opacity={0.6} />
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-[11px]" fill="var(--pc-muted)">
              Sample too small — suppressed (k=10)
            </text>
          </g>
        )}
      </svg>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
