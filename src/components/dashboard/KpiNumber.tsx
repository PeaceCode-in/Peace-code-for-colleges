// The oversized KPI number used across the dashboard. When `value` is a raw
// number, it animates from 0 → target with <CountUp>. Otherwise renders the
// node as-is (already-formatted strings, suppressed labels, etc.).
import { type ReactNode } from "react";
import { CountUp } from "@/components/motion/CountUp";

export function KpiNumber({
  value,
  suffix,
  hint,
  size = "lg",
  decimals,
  format,
}: {
  value: ReactNode;
  suffix?: string;
  hint?: string;
  size?: "md" | "lg" | "xl";
  decimals?: number;
  format?: (n: number) => string;
}) {
  const scale = size === "xl" ? "clamp(2.4rem, 6vw, 4rem)" : size === "lg" ? "clamp(1.9rem, 4vw, 2.6rem)" : "clamp(1.4rem, 3vw, 1.9rem)";
  const rendered =
    typeof value === "number" ? (
      <CountUp value={value} decimals={decimals ?? 0} format={format} />
    ) : (
      value
    );
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2 min-w-0">
        <span
          className="font-serif leading-none truncate"
          style={{ fontSize: scale, color: "var(--pc-ink)" }}
        >
          {rendered}
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

