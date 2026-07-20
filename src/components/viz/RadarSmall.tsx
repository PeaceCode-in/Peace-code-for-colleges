import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

export type RadarSeries = { label: string; color: string; values: number[] };

interface Props {
  axes: string[];
  series: RadarSeries[];
  size?: number;
  max?: number;
  ariaLabel?: string;
}

/** RadarSmall — hoverable axis vertices; tooltip shows all series at that axis. */
export function RadarSmall({ axes, series, size = 240, max, ariaLabel }: Props) {
  const intensity = useMotionIntensity();
  const [on, setOn] = useState(false);
  const [hoverAxis, setHoverAxis] = useState<number | null>(null);
  const [hoverSeries, setHoverSeries] = useState<string | null>(null);
  const tip = useChartTooltip();

  useEffect(() => {
    if (intensity === "reduced") { setOn(true); return; }
    const t = window.setTimeout(() => setOn(true), 50);
    return () => window.clearTimeout(t);
  }, [intensity]);

  const N = axes.length;
  if (N < 3 || series.length === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 26;
  const hi = max ?? Math.max(1, ...series.flatMap((s) => s.values));

  const pointAt = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div
      ref={tip.wrapperRef}
      className="relative inline-block"
      onMouseMove={tip.onMove}
      onMouseLeave={() => { tip.hide(); setHoverAxis(null); setHoverSeries(null); }}
    >
      <svg width={size} height={size} role="img" aria-label={ariaLabel ?? "Radar comparison"} className="overflow-visible">
        {rings.map((r) => (
          <polygon
            key={r}
            points={axes.map((_, i) => pointAt(i, R * r).join(",")).join(" ")}
            fill="none"
            stroke="var(--pc-border)"
            strokeWidth={0.8}
            opacity={r === 1 ? 1 : 0.6}
          />
        ))}
        {axes.map((_, i) => {
          const [x, y] = pointAt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--pc-border)" strokeWidth={0.6} />;
        })}
        {axes.map((label, i) => {
          const [x, y] = pointAt(i, R + 12);
          const anchor = Math.abs(x - cx) < 4 ? "middle" : x < cx ? "end" : "start";
          const isHover = hoverAxis === i;
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="text-[10px]"
              fill={isHover ? "var(--pc-ink)" : "var(--pc-muted)"}
              style={{ fontWeight: isHover ? 600 : 400, transition: "fill 120ms ease-out" }}
            >
              {label}
            </text>
          );
        })}
        {/* Series polygons */}
        {series.map((s) => {
          const scale = on ? 1 : 0.001;
          const pts = s.values.map((v, i) => pointAt(i, R * (Math.min(v, hi) / hi) * scale).join(",")).join(" ");
          const dim = hoverSeries !== null && hoverSeries !== s.label;
          return (
            <g
              key={s.label}
              style={{ opacity: dim ? 0.25 : 1, transition: "opacity 160ms ease-out" }}
              onMouseEnter={() => setHoverSeries(s.label)}
              onMouseLeave={() => setHoverSeries(null)}
            >
              <polygon
                points={pts}
                fill={s.color}
                fillOpacity={hoverSeries === s.label ? 0.28 : 0.16}
                stroke={s.color}
                strokeWidth={hoverSeries === s.label ? 2 : 1.5}
                style={{ transition: "all 600ms cubic-bezier(0.2,0.7,0.2,1)" }}
              />
              {s.values.map((v, i) => {
                const [x, y] = pointAt(i, R * (Math.min(v, hi) / hi) * scale);
                return <circle key={i} cx={x} cy={y} r={2.4} fill={s.color} style={{ transition: "all 600ms cubic-bezier(0.2,0.7,0.2,1)" }} />;
              })}
            </g>
          );
        })}
        {/* Axis hover targets — invisible larger hit zones at each vertex */}
        {axes.map((_, i) => {
          const [x, y] = pointAt(i, R);
          return (
            <circle
              key={`hit-${i}`}
              cx={x}
              cy={y}
              r={16}
              fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseEnter={(e) => {
                setHoverAxis(i);
                tip.show(
                  <>
                    <TooltipTitle sub={axes[i]}>Axis</TooltipTitle>
                    {series.map((s) => (
                      <TooltipRow
                        key={s.label}
                        dot={s.color}
                        label={s.label}
                        value={`${s.values[i]?.toFixed(1) ?? "–"} / ${hi}`}
                      />
                    ))}
                    <TooltipHint>Hover a shape to isolate a single series.</TooltipHint>
                  </>,
                  e,
                );
              }}
              onMouseLeave={() => setHoverAxis(null)}
            />
          );
        })}
      </svg>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
