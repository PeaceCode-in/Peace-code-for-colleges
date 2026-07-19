import { useEffect, useState } from "react";
import { useMotionIntensity } from "@/lib/use-motion";

interface Step {
  label: string;
  value: number;
}

interface Props {
  steps: Step[];
  color?: string;
  ariaLabel?: string;
}

/** FunnelBars — animated horizontal funnel; each bar draws width on mount. */
export function FunnelBars({ steps, color = "var(--pc-primary)", ariaLabel }: Props) {
  const [on, setOn] = useState(false);
  const intensity = useMotionIntensity();
  useEffect(() => {
    if (intensity === "reduced") {
      setOn(true);
      return;
    }
    const t = window.setTimeout(() => setOn(true), 40);
    return () => clearTimeout(t);
  }, [intensity]);
  const top = Math.max(...steps.map((s) => s.value), 1);
  return (
    <ol role="list" aria-label={ariaLabel ?? "Funnel"} className="space-y-1.5">
      {steps.map((s, i) => {
        const pct = (s.value / top) * 100;
        const conv = i === 0 ? 100 : (s.value / (steps[i - 1]?.value || 1)) * 100;
        return (
          <li key={s.label} className="flex items-center gap-3 text-[11px]">
            <span className="w-28 truncate" style={{ color: "var(--pc-muted)" }}>
              {s.label}
            </span>
            <div className="flex-1 h-5 rounded-md relative overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
              <div
                className="h-full rounded-md flex items-center justify-end px-2 font-mono text-[10px]"
                style={{
                  width: on ? `${pct}%` : "0%",
                  background: `linear-gradient(90deg, color-mix(in oklab, ${color} 60%, transparent), ${color})`,
                  color: "var(--pc-primary-ink, #fff)",
                  transition: intensity === "reduced" ? "none" : `width 700ms cubic-bezier(0.2,0.7,0.2,1) ${i * 60}ms`,
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
  );
}
