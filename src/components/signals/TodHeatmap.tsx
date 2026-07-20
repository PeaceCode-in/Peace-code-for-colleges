// 7 × 24 session-start heatmap for the selected window. Colour scale
// derives from --pc-accent; cell values are session counts.
// Interactive: hover/tap a cell for a rich tooltip and axis highlight.
import { useMemo, useRef, useState } from "react";
import { useTouchAsHover } from "@/components/viz/ChartTooltip";
import { getTod } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function hourLabel(h: number) {
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12} ${suffix}`;
}

export function TodHeatmap() {
  const res = useMemo(() => getTod(), []);
  const [hover, setHover] = useState<{ day: number; hour: number; v: number } | null>(null);

  if (isSuppressed(res)) return <SuppressedTile label="Not enough sessions to draw a heatmap." />;
  const { grid } = res;
  const flat = grid.flat();
  const max = Math.max(...flat) || 1;
  const total = flat.reduce((a, b) => a + b, 0);

  return (
    <div
      className="w-full overflow-x-auto relative"
      role="img"
      aria-label="Seven-day by 24-hour heatmap of session starts. Evenings and Sunday nights are the most active."
    >
      <div className="inline-flex flex-col gap-0.5">
        <div className="flex gap-0.5 pl-9">
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="w-4 text-center text-[9px] transition-colors"
              style={{
                color: hover?.hour === h ? "var(--pc-accent)" : "var(--pc-muted)",
                fontWeight: hover?.hour === h ? 600 : 400,
              }}
            >
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {grid.map((row, day) => (
          <div key={day} className="flex items-center gap-0.5">
            <div
              className="w-8 text-[10px] pr-1 text-right transition-colors"
              style={{
                color: hover?.day === day ? "var(--pc-accent)" : "var(--pc-muted)",
                fontWeight: hover?.day === day ? 600 : 400,
              }}
            >
              {DAYS[day]}
            </div>
            {row.map((v, hour) => {
              const t = v / max;
              const isHover = hover?.day === day && hover?.hour === hour;
              const dim = hover && !isHover && hover.day !== day && hover.hour !== hour;
              return (
                <div
                  key={hour}
                  onMouseEnter={() => setHover({ day, hour, v })}
                  onMouseLeave={() => setHover((h) => (h?.day === day && h?.hour === hour ? null : h))}
                  onTouchStart={() => setHover({ day, hour, v })}
                  className="w-4 h-4 rounded-sm cursor-pointer transition-all duration-150"
                  style={{
                    background: v === 0
                      ? "var(--pc-surface2)"
                      : `color-mix(in oklab, var(--pc-accent) ${Math.round(12 + t * 78)}%, var(--pc-surface))`,
                    border: isHover
                      ? "1px solid var(--pc-accent)"
                      : "1px solid color-mix(in oklab, var(--pc-border) 60%, transparent)",
                    opacity: dim ? 0.35 : 1,
                    transform: isHover ? "scale(1.35)" : "scale(1)",
                    boxShadow: isHover
                      ? "0 4px 12px -4px color-mix(in oklab, var(--pc-accent) 70%, transparent)"
                      : "none",
                    zIndex: isHover ? 5 : 1,
                    position: "relative",
                  }}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-1.5 pl-9 mt-1">
          <span className="text-[10px]" style={{ color: "var(--pc-muted)" }}>less</span>
          {[0.05, 0.25, 0.5, 0.75, 0.95].map((t, i) => (
            <div key={i} className="w-4 h-2 rounded-sm" style={{
              background: `color-mix(in oklab, var(--pc-accent) ${Math.round(12 + t * 78)}%, var(--pc-surface))`,
              border: "1px solid var(--pc-border)",
            }} />
          ))}
          <span className="text-[10px]" style={{ color: "var(--pc-muted)" }}>more</span>
        </div>
      </div>

      {hover && (
        <div
          className="mt-2 inline-block rounded-md px-2.5 py-1.5 text-[11px]"
          style={{
            background: "var(--pc-surface)",
            border: "1px solid var(--pc-border)",
            color: "var(--pc-ink)",
          }}
        >
          <span className="font-medium">{DAYS[hover.day]} · {hourLabel(hover.hour)}</span>
          <span className="mx-2" style={{ color: "var(--pc-border)" }}>·</span>
          <span>{hover.v.toLocaleString()} session{hover.v === 1 ? "" : "s"}</span>
          <span className="mx-2" style={{ color: "var(--pc-border)" }}>·</span>
          <span style={{ color: "var(--pc-muted)" }}>
            {total > 0 ? ((hover.v / total) * 100).toFixed(1) : "0.0"}% of week
          </span>
        </div>
      )}
    </div>
  );
}
