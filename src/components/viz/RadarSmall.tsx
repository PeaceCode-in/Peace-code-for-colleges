import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";

export type RadarSeries = { label: string; color: string; values: number[] };

interface Props {
  axes: string[];
  series: RadarSeries[];
  size?: number;
  max?: number;
  ariaLabel?: string;
}

/** RadarSmall — SVG radar with animated polygon draw-in. Token-driven. */
export function RadarSmall({ axes, series, size = 240, max, ariaLabel }: Props) {
  const intensity = useMotionIntensity();
  const [on, setOn] = useState(false);
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
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel ?? "Radar comparison"}
      className="overflow-visible"
    >
      {/* Grid rings */}
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
      {/* Axes */}
      {axes.map((_, i) => {
        const [x, y] = pointAt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--pc-border)" strokeWidth={0.6} />;
      })}
      {/* Axis labels */}
      {axes.map((label, i) => {
        const [x, y] = pointAt(i, R + 12);
        const anchor = Math.abs(x - cx) < 4 ? "middle" : x < cx ? "end" : "start";
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="text-[10px]"
            fill="var(--pc-muted)"
          >
            {label}
          </text>
        );
      })}
      {/* Series polygons */}
      {series.map((s) => {
        const scale = on ? 1 : 0.001;
        const pts = s.values.map((v, i) => pointAt(i, R * (Math.min(v, hi) / hi) * scale).join(",")).join(" ");
        return (
          <g key={s.label} style={{ transition: "opacity 500ms ease-out" }}>
            <polygon
              points={pts}
              fill={s.color}
              fillOpacity={0.16}
              stroke={s.color}
              strokeWidth={1.5}
              style={{ transition: "all 600ms cubic-bezier(0.2,0.7,0.2,1)" }}
            />
            {s.values.map((v, i) => {
              const [x, y] = pointAt(i, R * (Math.min(v, hi) / hi) * scale);
              return <circle key={i} cx={x} cy={y} r={2.4} fill={s.color} style={{ transition: "all 600ms cubic-bezier(0.2,0.7,0.2,1)" }} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
