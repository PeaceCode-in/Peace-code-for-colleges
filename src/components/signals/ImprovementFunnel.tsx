// Improvement funnel: Screened → Elevated → Engaged → Reassessed → Improved.
// Each step is a trapezoid; conversion rates float between steps.
import { useMemo } from "react";
import { getFunnel, type RangeKey } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

export function ImprovementFunnel({ range }: { range: RangeKey }) {
  const res = useMemo(() => getFunnel(range), [range]);
  if (isSuppressed(res)) return <SuppressedTile label="Too few screenings in this window to draw a funnel." />;
  const { steps } = res;
  const max = steps[0].n || 1;
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((s, i) => {
        const pct = Math.round((s.n / max) * 1000) / 10;
        const conv =
          i > 0 && steps[i - 1].n > 0
            ? Math.round((s.n / steps[i - 1].n) * 1000) / 10
            : null;
        return (
          <div key={s.key}>
            {conv !== null && (
              <div
                className="text-[10px] italic pl-1 mb-0.5"
                style={{ color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
              >
                ↓ {conv}% carried forward
              </div>
            )}
            <div
              className="flex items-center justify-between rounded-md px-3 py-2"
              style={{
                background: "color-mix(in oklab, var(--pc-accent) 12%, var(--pc-surface2))",
                border: "1px solid var(--pc-border)",
                width: `${Math.max(28, pct)}%`,
                marginLeft: `${(100 - Math.max(28, pct)) / 2}%`,
              }}
            >
              <div className="min-w-0">
                <div className="text-[12px]" style={{ color: "var(--pc-ink)" }}>{s.label}</div>
                <div className="text-[10px]" style={{ color: "var(--pc-muted)" }}>{s.note}</div>
              </div>
              <div className="text-[13px] font-serif tabular-nums" style={{ color: "var(--pc-ink)" }}>
                {s.n.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
