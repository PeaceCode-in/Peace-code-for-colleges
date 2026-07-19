// 7 × 24 session-start heatmap for the selected window. Colour scale
// derives from --pc-accent; cell values are session counts.
import { useMemo } from "react";
import { getTod } from "@/lib/signals-selectors";
import { isSuppressed } from "@/lib/cohort-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function TodHeatmap() {
  const res = useMemo(() => getTod(), []);
  if (isSuppressed(res)) return <SuppressedTile label="Not enough sessions to draw a heatmap." />;
  const { grid } = res;
  const flat = grid.flat();
  const max = Math.max(...flat) || 1;

  return (
    <div
      className="w-full overflow-x-auto"
      role="img"
      aria-label="Seven-day by 24-hour heatmap of session starts. Evenings and Sunday nights are the most active."
    >
      <div className="inline-flex flex-col gap-0.5">
        <div className="flex gap-0.5 pl-9">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="w-4 text-center text-[9px]" style={{ color: "var(--pc-muted)" }}>
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
        </div>
        {grid.map((row, day) => (
          <div key={day} className="flex items-center gap-0.5">
            <div className="w-8 text-[10px] pr-1 text-right" style={{ color: "var(--pc-muted)" }}>{DAYS[day]}</div>
            {row.map((v, hour) => {
              const t = v / max;
              return (
                <div
                  key={hour}
                  title={`${DAYS[day]} · ${hour}:00 — ${v} session${v === 1 ? "" : "s"}`}
                  className="w-4 h-4 rounded-sm"
                  style={{
                    background: v === 0
                      ? "var(--pc-surface2)"
                      : `color-mix(in oklab, var(--pc-accent) ${Math.round(12 + t * 78)}%, var(--pc-surface))`,
                    border: "1px solid color-mix(in oklab, var(--pc-border) 60%, transparent)",
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
    </div>
  );
}
