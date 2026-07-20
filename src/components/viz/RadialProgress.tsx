import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Props {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  track?: string;
  /** Optional context in tooltip — e.g. "Utilisation across 8 counsellors". */
  hint?: string;
  target?: number; // draws a small tick on the ring
}

/** RadialProgress — hoverable ring with rich tooltip. */
export function RadialProgress({
  value, size = 96, stroke = 8, label, sublabel,
  color = "var(--pc-primary)", track = "var(--pc-surface2)", hint, target,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const intensity = useMotionIntensity();
  const [display, setDisplay] = useState(intensity === "reduced" ? clamped : 0);
  const [hover, setHover] = useState(false);
  const tip = useChartTooltip();

  useEffect(() => {
    if (intensity === "reduced") { setDisplay(clamped); return; }
    const t = window.setTimeout(() => setDisplay(clamped), 40);
    return () => clearTimeout(t);
  }, [clamped, intensity]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (display / 100) * c;

  return (
    <div
      ref={tip.wrapperRef}
      className="relative inline-flex flex-col items-center"
      role="img"
      aria-label={label ?? `${clamped}%`}
      onMouseMove={tip.onMove}
      onMouseEnter={(e) => {
        setHover(true);
        tip.show(
          <>
            <TooltipTitle sub={label ?? "Progress"}>{sublabel ?? "Metric"}</TooltipTitle>
            <TooltipRow dot={color} label="Current" value={`${clamped.toFixed(1)}%`} />
            {typeof target === "number" && (
              <>
                <TooltipRow label="Target" value={`${target}%`} />
                <TooltipRow label="Gap" value={`${(clamped - target).toFixed(1)}pp`} />
              </>
            )}
            {hint && <TooltipHint>{hint}</TooltipHint>}
          </>,
          e,
        );
      }}
      onMouseLeave={() => { setHover(false); tip.hide(); }}
    >
      <svg width={size} height={size} className="-rotate-90" style={{ cursor: "help" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={hover ? stroke + 1.5 : stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: intensity === "reduced" ? "none" : "stroke-dashoffset 700ms cubic-bezier(0.2,0.7,0.2,1), stroke-width 140ms ease-out" }}
        />
        {typeof target === "number" && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--pc-ink)"
            strokeWidth={2}
            fill="none"
            strokeDasharray={`2 ${c - 2}`}
            strokeDashoffset={-((target / 100) * c) + 1}
            opacity={0.55}
          />
        )}
      </svg>
      <div className="-mt-[calc(50%+8px)] text-center pointer-events-none" style={{ transform: `translateY(${size / 2 - 8}px)` }}>
        <div className="text-lg font-semibold" style={{ color: "var(--pc-ink)" }}>
          {Math.round(display)}%
        </div>
        {sublabel && <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--pc-muted)" }}>{sublabel}</div>}
      </div>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
