// Reassessment adherence KPI. Shows share of elevated/high-tier students
// who had a follow-up assessment within 28 days, versus the prior period.
import { getAdherence, isSuppressed, type EwWindowKey } from "@/lib/early-warning-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

export function ReassessmentAdherence({ window }: { window: EwWindowKey }) {
  const a = getAdherence(window);
  if (isSuppressed(a)) return <SuppressedTile title="Reassessment adherence" reason="k<10" />;
  const pct = a.pct;
  const size = 128;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const delta = a.delta;
  const trendColor = delta >= 0 ? "var(--pc-good)" : "var(--pc-warn)";
  const glyph = delta >= 0 ? "▲" : "▼";
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
          Reassessment adherence
        </div>
        <div className="font-serif text-[18px] leading-tight" style={{ color: "var(--pc-ink)" }}>
          Elevated / High tier · within 28 days
        </div>
      </div>
      <div className="flex-1 flex items-center gap-5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--pc-surface-2)" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="var(--pc-accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
          <text
            x={size/2} y={size/2 + 6}
            textAnchor="middle"
            fontSize={24}
            fontFamily="var(--font-serif)"
            fill="var(--pc-ink)"
          >
            {pct.toFixed(0)}%
          </text>
        </svg>
        <div className="min-w-0">
          <div className="text-[12px]" style={{ color: "var(--pc-ink)" }}>
            {a.within28d.toLocaleString()} of {a.total.toLocaleString()} students reassessed
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: trendColor }}>
            <span aria-hidden>{glyph}</span>
            <span>{Math.abs(delta).toFixed(1)}pt vs prior period</span>
          </div>
          <div className="mt-1 text-[11px]" style={{ color: "var(--pc-muted)" }}>
            Prior period: {a.priorPct}%
          </div>
        </div>
      </div>
    </div>
  );
}
