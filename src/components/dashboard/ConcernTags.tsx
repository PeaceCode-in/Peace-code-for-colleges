// Anonymized concern tags. Rectangular chips sized (font + padding) by
// mention frequency. Suppressed rows render a dashed chip instead of a
// number so admins can visibly count them and audit the guardrail.
import { BentoTile } from "./BentoTile";
import { SuppressedChip } from "./SuppressedChip";
import { isSuppressed } from "@/lib/anonymity";
import type { ExecutiveSnapshot } from "@/lib/dashboard-mock";

export function ConcernTags({ snap, className = "", onExpand }: { snap: ExecutiveSnapshot; className?: string; onExpand?: () => void }) {
  const rows = snap.concerns;
  const shownMax = Math.max(
    1,
    ...rows.map((r) => (isSuppressed(r.n) ? 0 : (r.n as number))),
  );
  return (
    <BentoTile
      title="Top concerns"
      eyebrow="Anonymized tags"
      className={className}
      footer="Tags come from a fixed enum — no free-text ever leaves the pipeline."
      onExpand={onExpand}
      expandLabel="Open per-tag breakdown"
    >
      <ul className="flex flex-wrap gap-2" role="list">
        {rows.map((r) => {
          if (isSuppressed(r.n)) {
            return (
              <li key={r.tag}>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full text-[11px] px-2.5 py-1"
                  style={{
                    background: "var(--pc-surface2)",
                    border: "1px dashed var(--pc-border)",
                    color: "var(--pc-muted)",
                  }}
                >
                  {r.tag} · <SuppressedChip compact />
                </span>
              </li>
            );
          }
          const weight = (r.n as number) / shownMax;
          const size = 11 + weight * 3;
          const bg = `color-mix(in oklab, var(--pc-accent) ${8 + weight * 22}%, var(--pc-surface2))`;
          return (
            <li key={r.tag}>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: bg,
                  border: "1px solid var(--pc-border)",
                  color: "var(--pc-ink)",
                  fontSize: `${size}px`,
                }}
              >
                {r.tag}
                <span
                  className="text-[10.5px]"
                  style={{ color: "var(--pc-muted)" }}
                >
                  {(r.n as number).toLocaleString()}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </BentoTile>
  );
}
