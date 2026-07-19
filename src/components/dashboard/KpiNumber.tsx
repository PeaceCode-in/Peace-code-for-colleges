// The oversized KPI number used across the dashboard. Font size scales
// with the root font-size (Text size setting in Appearance), so it grows
// and shrinks with the rest of the UI automatically.
import { type ReactNode } from "react";

export function KpiNumber({
  value,
  suffix,
  hint,
  size = "lg",
}: {
  value: ReactNode;
  suffix?: string;
  hint?: string;
  size?: "md" | "lg" | "xl";
}) {
  const scale = size === "xl" ? "clamp(2.4rem, 6vw, 4rem)" : size === "lg" ? "clamp(1.9rem, 4vw, 2.6rem)" : "clamp(1.4rem, 3vw, 1.9rem)";
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2 min-w-0">
        <span
          className="font-serif leading-none truncate"
          style={{ fontSize: scale, color: "var(--pc-ink)" }}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[12px]" style={{ color: "var(--pc-muted)" }}>{suffix}</span>
        )}
      </div>
      {hint && (
        <div className="mt-1 text-[11px]" style={{ color: "var(--pc-muted)" }}>{hint}</div>
      )}
    </div>
  );
}
