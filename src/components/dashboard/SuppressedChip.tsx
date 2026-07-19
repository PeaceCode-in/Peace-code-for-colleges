// Rendered whenever a value passes through suppressIfSmall() and comes
// back as { suppressed: true }. Shows an em dash + info icon with a
// tooltip explaining the anonymity floor.
import { Info } from "lucide-react";
import { N_MIN } from "@/lib/anonymity";

export function SuppressedChip({ compact = false }: { compact?: boolean }) {
  const label = `Suppressed — cohort too small (n < ${N_MIN})`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[10.5px] px-2 py-0.5"
      style={{
        color: "var(--pc-muted)",
        background: "var(--pc-surface2)",
        border: "1px dashed var(--pc-border)",
      }}
      role="note"
      aria-label={label}
      title={label}
    >
      <span aria-hidden style={{ color: "var(--pc-ink-2)" }}>—</span>
      {!compact && <span>Suppressed</span>}
      <Info className="h-3 w-3" aria-hidden />
    </span>
  );
}
