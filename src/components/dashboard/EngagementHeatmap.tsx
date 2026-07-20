// Weekly engagement heatmap. 7 rows × 12 columns (2-hour buckets starting
// at 6am). Cell opacity scales with session count; tooltip shows the
// human-readable day and bucket.
import { Fragment } from "react";
import { BentoTile } from "./BentoTile";
import type { ExecutiveSnapshot, HeatCell } from "@/lib/dashboard-mock";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOUR_LABEL = (bucket: number) => {
  const startHour = (6 + bucket * 2) % 24;
  const endHour = (startHour + 2) % 24;
  const fmt = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
  return `${fmt(startHour)}–${fmt(endHour)}`;
};

export function EngagementHeatmap({ snap, className = "", onExpand }: { snap: ExecutiveSnapshot; className?: string; onExpand?: () => void }) {
  const max = Math.max(1, ...snap.engagement.map((c) => c.n));
  // Build a fast lookup so we render in row/col order.
  const map = new Map<string, HeatCell>();
  for (const c of snap.engagement) map.set(`${c.day}-${c.hour}`, c);

  return (
    <BentoTile
      title="Engagement heatmap"
      eyebrow="Day × 2-hour bucket"
      className={className}
      footer="Warmer cells = more sessions. All cohorts above the anonymity floor."
      onExpand={onExpand}
      expandLabel="Open heatmap breakdown"
    >
      <div
        role="img"
        aria-label={`Engagement heatmap across 7 days and 12 two-hour buckets. Peak activity in weekday evenings.`}
        className="grid gap-1"
        style={{ gridTemplateColumns: "auto repeat(12, minmax(0, 1fr))" }}
      >
        <div />
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={`h${i}`}
            className="text-[9px] text-center"
            style={{ color: "var(--pc-muted)" }}
          >
            {i % 3 === 0 ? HOUR_LABEL(i).split("–")[0] : ""}
          </div>
        ))}
        {DAYS.map((d, day) => (
          <>
            <div
              key={`d${day}`}
              className="text-[10px] pr-1 self-center"
              style={{ color: "var(--pc-muted)" }}
            >
              {d}
            </div>
            {Array.from({ length: 12 }, (_, hour) => {
              const cell = map.get(`${day}-${hour}`);
              const n = cell?.n ?? 0;
              const intensity = n / max;
              return (
                <div
                  key={`c${day}-${hour}`}
                  title={`${d} ${HOUR_LABEL(hour)} · ${n} sessions`}
                  className="aspect-square rounded-[3px]"
                  style={{
                    background: `color-mix(in oklab, var(--pc-accent) ${Math.round(intensity * 78) + 8}%, var(--pc-surface2))`,
                    border: "1px solid color-mix(in oklab, var(--pc-border) 60%, transparent)",
                  }}
                />
              );
            })}
          </>
        ))}
      </div>
    </BentoTile>
  );
}
