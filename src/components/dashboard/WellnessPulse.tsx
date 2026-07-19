// Hero tile: Institutional Wellness Pulse. Big current index + delta chip
// + inline sparkline of the last twelve weeks + subtitle with the
// aggregate check-in count. All numbers arrive from getExecutiveSnapshot().
import { BentoTile } from "./BentoTile";
import { KpiNumber } from "./KpiNumber";
import { DeltaChip } from "./DeltaChip";
import { Sparkline } from "./Sparkline";
import type { ExecutiveSnapshot } from "@/lib/dashboard-mock";

export function WellnessPulse({ snap, className = "" }: { snap: ExecutiveSnapshot; className?: string }) {
  const w = snap.wellnessIndex;
  return (
    <BentoTile
      title="Institutional wellness pulse"
      eyebrow="Composite index · this week"
      className={className}
      hoverable
    >
      <div className="flex flex-col justify-between h-full gap-6">
        <div className="flex items-end gap-4 flex-wrap">
          <KpiNumber value={w.current} suffix="of 100" size="xl" />
          <DeltaChip delta={w.deltaVsLastWeek} unit=" pts" />
        </div>
        <div>
          <div className="mb-2 text-[11px]" style={{ color: "var(--pc-muted)" }}>
            Last 12 weeks
          </div>
          <Sparkline
            values={w.sparkline}
            width={640}
            height={72}
            ariaLabel={`Wellness index over 12 weeks, from ${w.sparkline[0]} to ${w.sparkline[w.sparkline.length - 1]}.`}
          />
        </div>
        <p className="text-[12px]" style={{ color: "var(--pc-ink-2)" }}>
          Based on <span style={{ color: "var(--pc-ink)" }}>{w.checkInsThisWeek.toLocaleString()}</span> anonymized check-ins this week.
        </p>
      </div>
    </BentoTile>
  );
}
