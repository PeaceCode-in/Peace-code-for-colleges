// Small colored chip showing a week-over-week delta. Uses --pc-good /
// --pc-danger — those tokens flip with dark mode and background presets.
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function DeltaChip({
  delta,
  unit = "",
  invertPositive = false,
}: {
  delta: number;
  unit?: string;
  invertPositive?: boolean;
}) {
  const eps = 0.05;
  const dir = delta > eps ? "up" : delta < -eps ? "down" : "flat";
  // For metrics like "wait time", up is bad — set invertPositive=true.
  const good =
    dir === "flat" ? false : (dir === "up") !== invertPositive;
  const color =
    dir === "flat"
      ? "var(--pc-muted)"
      : good
        ? "var(--pc-good)"
        : "var(--pc-danger)";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  const sign = delta > 0 ? "+" : "";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 12%, var(--pc-surface2))`,
        border: `1px solid color-mix(in oklab, ${color} 26%, var(--pc-border))`,
      }}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {sign}{delta}{unit}
    </span>
  );
}
