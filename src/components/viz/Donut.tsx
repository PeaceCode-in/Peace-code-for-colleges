import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";

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
}

const FALLBACK = [
  "var(--pc-primary)",
  "color-mix(in oklab, var(--pc-primary) 60%, var(--pc-ink) 15%)",
  "color-mix(in oklab, var(--pc-primary) 40%, var(--pc-surface2))",
  "color-mix(in oklab, var(--pc-primary) 20%, var(--pc-muted))",
  "var(--pc-muted)",
];

/** Donut — animated donut with center label; arcs draw in on mount. */
export function Donut({ slices, size = 140, stroke = 14, centerLabel, centerSub, ariaLabel }: Props) {
  const intensity = useMotionIntensity();
  const [on, setOn] = useState(intensity === "reduced");
  useEffect(() => {
    if (intensity === "reduced") return;
    const t = window.setTimeout(() => setOn(true), 40);
    return () => clearTimeout(t);
  }, [intensity]);
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-block" role="img" aria-label={ariaLabel ?? centerLabel ?? "Donut"}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--pc-surface2)" strokeWidth={stroke} fill="none" />
        {slices.map((s, i) => {
          const frac = s.value / total;
          const len = frac * c;
          const off = c - (on ? len : 0);
          const dashOffset = -acc;
          acc += on ? len : 0;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color ?? FALLBACK[i % FALLBACK.length]}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${on ? len : 0} ${c}`}
              strokeDashoffset={dashOffset}
              style={{ transition: intensity === "reduced" ? "none" : `stroke-dasharray 700ms cubic-bezier(0.2,0.7,0.2,1) ${i * 80}ms` }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerSub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && <div className="text-lg font-semibold" style={{ color: "var(--pc-ink)" }}>{centerLabel}</div>}
          {centerSub && <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--pc-muted)" }}>{centerSub}</div>}
        </div>
      )}
    </div>
  );
}
