import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";

interface Props {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  track?: string;
}

/** RadialProgress — animated ring using stroke-dashoffset. */
export function RadialProgress({
  value,
  size = 96,
  stroke = 8,
  label,
  sublabel,
  color = "var(--pc-primary)",
  track = "var(--pc-surface2)",
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const intensity = useMotionIntensity();
  const [display, setDisplay] = useState(intensity === "reduced" ? clamped : 0);
  useEffect(() => {
    if (intensity === "reduced") {
      setDisplay(clamped);
      return;
    }
    const t = window.setTimeout(() => setDisplay(clamped), 40);
    return () => clearTimeout(t);
  }, [clamped, intensity]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (display / 100) * c;
  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={label ?? `${clamped}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: intensity === "reduced" ? "none" : "stroke-dashoffset 700ms cubic-bezier(0.2,0.7,0.2,1)" }}
        />
      </svg>
      <div className="-mt-[calc(50%+8px)] text-center" style={{ transform: `translateY(${size / 2 - 8}px)` }}>
        <div className="text-lg font-semibold" style={{ color: "var(--pc-ink)" }}>
          {Math.round(display)}%
        </div>
        {sublabel && <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--pc-muted)" }}>{sublabel}</div>}
      </div>
    </div>
  );
}
