// Improvement funnel: Screened → Elevated → Engaged → Reassessed → Improved.
// Full-width rows with a proportional inner fill so labels never wrap ugly.
// Fully interactive: hover reveals conversion math and drop-off counts.
import { useMemo, useRef, useState } from "react";
import { useTouchAsHover } from "@/components/viz/ChartTooltip";
import { getFunnel, type RangeKey } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

export function ImprovementFunnel({ range }: { range: RangeKey }) {
  const res = useMemo(() => getFunnel(range), [range]);
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useTouchAsHover(wrapRef);
  if (isSuppressed(res)) return <SuppressedTile label="Too few screenings in this window to draw a funnel." />;
  const { steps } = res;
  const max = steps[0].n || 1;

  return (
    <div ref={wrapRef} className="flex flex-col gap-1.5" onMouseLeave={() => setHover(null)}>
      {steps.map((s, i) => {
        const pct = Math.round((s.n / max) * 1000) / 10;
        const prev = i > 0 ? steps[i - 1].n : null;
        const conv = prev && prev > 0 ? Math.round((s.n / prev) * 1000) / 10 : null;
        const dropped = prev !== null ? Math.max(0, prev - s.n) : 0;
        const isHover = hover === i;
        const isPicked = picked === i;
        const focus = hover ?? picked;
        const isFocus = focus === i;

        return (
          <div key={s.key}>
            {conv !== null && (
              <div
                className="text-[10px] italic pl-1 mb-0.5 flex items-center gap-1.5"
                style={{ color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
              >
                <span>↓ {conv}% carried forward</span>
                <span className="opacity-60">· {dropped.toLocaleString()} dropped off</span>
              </div>
            )}
            <button
              type="button"
              key={isPicked ? `p-${pulseKey}` : "u"}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => { setPicked((p) => (p === i ? null : i)); setPulseKey((k) => k + 1); }}
              className={`relative w-full text-left rounded-md overflow-hidden transition-transform duration-150 focus:outline-none ${isPicked ? "pc-tap-pulse" : ""}`}
              style={{
                background: "var(--pc-surface2)",
                border: `1px solid ${isFocus ? "var(--pc-accent)" : "var(--pc-border)"}`,
                borderWidth: isPicked ? "1.5px" : "1px",
                transform: isFocus ? "translateY(-1px)" : "none",
                boxShadow: isFocus ? "0 6px 18px -10px color-mix(in oklab, var(--pc-accent) 60%, transparent)" : "none",
                opacity: focus !== null && !isFocus ? 0.7 : 1,
              }}
              title={`${s.label} — ${s.n.toLocaleString()} students (${pct}% of screened)${conv !== null ? ` · ${conv}% carry-forward` : ""}${isPicked ? " · Selected" : ""}`}
            >
              {/* proportional fill */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.max(6, pct)}%`,
                  background: "color-mix(in oklab, var(--pc-accent) 22%, transparent)",
                }}
              />
              <div className="relative flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium truncate" style={{ color: "var(--pc-ink)" }}>
                    {s.label}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "var(--pc-muted)" }}>
                    {s.note}
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <div className="text-[13px] font-serif tabular-nums" style={{ color: "var(--pc-ink)" }}>
                    {s.n.toLocaleString()}
                  </div>
                  <div className="text-[10px] tabular-nums" style={{ color: "var(--pc-muted)" }}>
                    {pct}%
                  </div>
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
