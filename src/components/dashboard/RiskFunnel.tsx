// 4-stage risk funnel: Checked in → Flagged → Referred → In active care.
// Bars are ranked to the widest stage; each stage prints its conversion
// against the previous. Suppressed stages render a chip in place of the
// number.
import { BentoTile } from "./BentoTile";
import { SuppressedChip } from "./SuppressedChip";
import { isSuppressed } from "@/lib/anonymity";
import type { ExecutiveSnapshot } from "@/lib/dashboard-mock";

export function RiskFunnel({ snap, className = "" }: { snap: ExecutiveSnapshot; className?: string }) {
  const stages = snap.riskFunnel;
  const first = stages[0];
  const base = !isSuppressed(first.n) ? first.n : 0;
  return (
    <BentoTile title="Risk funnel" eyebrow="This week" className={className}>
      <ul className="flex flex-col gap-2.5" role="list">
        {stages.map((stage, i) => {
          const shown = !isSuppressed(stage.n);
          const n = shown ? (stage.n as number) : 0;
          const width = base > 0 ? Math.max(8, (n / base) * 100) : 8;
          const prev = i > 0 ? stages[i - 1] : null;
          const prevN = prev && !isSuppressed(prev.n) ? (prev.n as number) : null;
          const conv = prevN && prevN > 0 && shown ? Math.round((n / prevN) * 100) : null;
          return (
            <li key={stage.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11.5px]" style={{ color: "var(--pc-ink-2)" }}>{stage.label}</span>
                <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
                  {conv !== null && <span className="mr-2">{conv}%</span>}
                  {shown ? (
                    <span style={{ color: "var(--pc-ink)" }}>{n.toLocaleString()}</span>
                  ) : (
                    <SuppressedChip compact />
                  )}
                </span>
              </div>
              <div
                className="h-2 mt-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--pc-surface2)" }}
              >
                <div
                  style={{
                    width: `${shown ? width : 8}%`,
                    height: "100%",
                    background: shown ? "var(--pc-accent)" : "var(--pc-border)",
                    opacity: shown ? 1 - i * 0.14 : 0.6,
                    transition: "width 260ms ease",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </BentoTile>
  );
}
