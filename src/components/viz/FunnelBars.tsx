import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Step {
  label: string;
  value: number;
  hint?: string;
}

interface Props {
  steps: Step[];
  color?: string;
  ariaLabel?: string;
  unit?: string;
}

/** FunnelBars — hover-highlighted bars with drop-off breakdowns in tooltip. */
export function FunnelBars({ steps, color = "var(--pc-primary)", ariaLabel, unit = "records" }: Props) {
  const [on, setOn] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const intensity = useMotionIntensity();
  const tip = useChartTooltip();

  useEffect(() => {
    if (intensity === "reduced") { setOn(true); return; }
    const t = window.setTimeout(() => setOn(true), 40);
    return () => clearTimeout(t);
  }, [intensity]);

  const top = Math.max(...steps.map((s) => s.value), 1);
  const totalIn = steps[0]?.value ?? 1;

  return (
    <div ref={tip.wrapperRef} className="relative" onMouseMove={tip.onMove} onMouseLeave={() => { tip.hide(); setHover(null); }}>
      <ol role="list" aria-label={ariaLabel ?? "Funnel"} className="space-y-1.5">
        {steps.map((s, i) => {
          const pct = (s.value / top) * 100;
          const conv = i === 0 ? 100 : (s.value / (steps[i - 1]?.value || 1)) * 100;
          const drop = i === 0 ? 0 : (steps[i - 1]?.value || 0) - s.value;
          const overall = (s.value / totalIn) * 100;
          const isHover = hover === i;
          const isPicked = picked === i;
          const focus = hover ?? picked;
          const dim = focus !== null && focus !== i;
          return (
            <li
              key={`${s.label}-${isPicked ? pulseKey : "u"}`}
              className={`flex items-center gap-3 text-[11px] rounded-md ${isPicked ? "pc-tap-pulse" : ""}`}
              style={{
                opacity: dim ? 0.55 : 1,
                transition: "opacity 140ms ease-out, transform 140ms ease-out",
                cursor: "pointer",
                transform: isHover || isPicked ? "translateX(2px)" : "none",
                outline: isPicked ? "1.5px solid var(--pc-accent)" : "none",
                outlineOffset: "2px",
              }}
              onClick={() => { setPicked((p) => (p === i ? null : i)); setPulseKey((k) => k + 1); }}
              onMouseEnter={(e) => {
                setHover(i);
                tip.show(
                  <>
                    <TooltipTitle sub={s.label}>Funnel step {i + 1}</TooltipTitle>
                    <TooltipRow dot={color} label={unit} value={s.value.toLocaleString()} />
                    <TooltipRow label="Step conversion" value={`${conv.toFixed(1)}%`} />
                    <TooltipRow label="Overall retention" value={`${overall.toFixed(1)}%`} />
                    {drop > 0 && <TooltipRow label="Drop-off" value={`−${drop.toLocaleString()}`} />}
                    {s.hint && <TooltipHint>{s.hint}</TooltipHint>}
                  </>,
                  e,
                );
              }}
            >
              <span className="w-28 truncate" style={{ color: "var(--pc-muted)" }}>{s.label}</span>
              <div className="flex-1 h-5 rounded-md relative overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                <div
                  className="h-full rounded-md flex items-center justify-end px-2 font-mono text-[10px]"
                  style={{
                    width: on ? `${pct}%` : "0%",
                    background: `linear-gradient(90deg, color-mix(in oklab, ${color} 60%, transparent), ${color})`,
                    color: "var(--pc-primary-ink, #fff)",
                    transition: intensity === "reduced"
                      ? "none"
                      : `width 700ms cubic-bezier(0.2,0.7,0.2,1) ${i * 60}ms, filter 160ms ease-out`,
                    filter: isHover ? "brightness(1.08)" : "none",
                  }}
                >
                  {s.value.toLocaleString()}
                </div>
              </div>
              <span className="w-12 text-right font-mono" style={{ color: "var(--pc-muted)" }}>
                {conv.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ol>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
