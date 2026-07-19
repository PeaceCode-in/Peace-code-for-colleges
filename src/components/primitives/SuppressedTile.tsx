// Full-tile suppression state. Used whenever a slice falls below the
// k-anonymity floor. Never renders a number — only the guardrail message.
import { Lock } from "lucide-react";
import { K_MIN } from "@/lib/cohort-selectors";

export function SuppressedTile({
  reason = "k<10",
  label,
  compact = false,
}: {
  reason?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label={`Suppressed — cohort below k=${K_MIN}`}
      className={`w-full flex flex-col items-center justify-center text-center gap-2 ${compact ? "py-4" : "py-10"}`}
      style={{
        color: "var(--pc-muted)",
        background:
          "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--pc-border) 60%, transparent) 6px 7px)",
        borderRadius: "var(--pc-radius-scale, 12px)",
        border: "1px dashed var(--pc-border)",
      }}
    >
      <Lock aria-hidden className="h-4 w-4" style={{ color: "var(--pc-muted)" }} />
      <div className="text-[12px]" style={{ color: "var(--pc-ink-2)" }}>
        {label ?? "Sample too small to display"}
      </div>
      <div className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
        Anonymity floor · {reason}
      </div>
    </div>
  );
}
