import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Slice {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerSub?: string;
  ariaLabel?: string;
  unit?: string;
}

const FALLBACK = [
  "var(--pc-primary)",
  "color-mix(in oklab, var(--pc-primary) 60%, var(--pc-ink) 15%)",
  "color-mix(in oklab, var(--pc-primary) 40%, var(--pc-surface2))",
  "color-mix(in oklab, var(--pc-primary) 20%, var(--pc-muted))",
  "var(--pc-muted)",
];

/** Donut — animated donut with hoverable slices and center-swap on hover. */
export function Donut({ slices, size = 140, stroke = 14, centerLabel, centerSub, ariaLabel, unit = "" }: Props) {
  const intensity = useMotionIntensity();
  const [on, setOn] = useState(intensity === "reduced");
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const tip = useChartTooltip();

  useEffect(() => {
    if (intensity === "reduced") return;
    const t = window.setTimeout(() => setOn(true), 40);
    return () => clearTimeout(t);
  }, [intensity]);

  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  const focus = hover ?? picked;
  const active = focus !== null ? slices[focus] : null;
  const activeColor = active ? (active.color ?? FALLBACK[focus! % FALLBACK.length]) : null;
  const displayLabel = active ? active.label : centerLabel;
  const displaySub = active
    ? `${((active.value / total) * 100).toFixed(1)}%${unit ? ` · ${unit}` : ""}`
    : centerSub;

  return (
    <div
      ref={tip.wrapperRef}
      className="relative inline-block"
      role="img"
      aria-label={ariaLabel ?? centerLabel ?? "Donut"}
      onMouseMove={tip.onMove}
      onMouseLeave={() => { tip.hide(); setHover(null); }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--pc-surface2)" strokeWidth={stroke} fill="none" />
        {slices.map((s, i) => {
          const frac = s.value / total;
          const len = frac * c;
          const off = c - (on ? len : 0);
          const dashOffset = -acc;
          acc += on ? len : 0;
          const color = s.color ?? FALLBACK[i % FALLBACK.length];
          const isHover = hover === i;
          const dim = hover !== null && !isHover;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={color}
              strokeWidth={isHover ? stroke + 3 : stroke}
              fill="none"
              strokeDasharray={`${on ? len : 0} ${c}`}
              strokeDashoffset={dashOffset}
              opacity={dim ? 0.35 : 1}
              style={{
                transition: `stroke-dasharray 700ms cubic-bezier(0.2,0.7,0.2,1) ${i * 80}ms, opacity 160ms ease-out, stroke-width 160ms ease-out`,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                setHover(i);
                tip.show(
                  <>
                    <TooltipTitle sub={s.label}>Segment</TooltipTitle>
                    <TooltipRow dot={color} label="Value" value={`${s.value.toLocaleString()}${unit ? ` ${unit}` : ""}`} />
                    <TooltipRow label="Share" value={`${((s.value / total) * 100).toFixed(1)}%`} />
                    <TooltipRow label="Total" value={total.toLocaleString()} />
                  </>,
                  e,
                );
              }}
            />
          );
        })}
      </svg>
      {(displayLabel || displaySub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none">
          {displayLabel && (
            <div
              className="text-[15px] font-semibold leading-tight"
              style={{ color: activeColor ?? "var(--pc-ink)", transition: "color 160ms ease-out" }}
            >
              {displayLabel}
            </div>
          )}
          {displaySub && <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--pc-muted)" }}>{displaySub}</div>}
        </div>
      )}
      <ChartTooltip state={tip.state} />
    </div>
  );
}
