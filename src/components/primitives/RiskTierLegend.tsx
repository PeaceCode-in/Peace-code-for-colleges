// Risk-tier legend + inline rule tooltips. Used across the Early Warning
// surface so the AGGREGATE definitions are always one hover away.
import { useState } from "react";
import { RISK_RULES, RISK_TIER_COLOR, RISK_TIER_LABEL, type RiskTier } from "@/lib/clinical-scales";

export type LegendTier = RiskTier;

export function RiskTierLegend({
  active,
  onToggle,
}: {
  active?: RiskTier | "all";
  onToggle?: (tier: RiskTier | "all") => void;
}) {
  const tiers: RiskTier[] = ["elevated", "high", "item9", "overdue"];
  const items: (RiskTier | "all")[] = ["all", ...tiers];
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Risk-tier filter">
      {items.map((t) => (
        <TierChip
          key={t}
          tier={t}
          selected={active === t}
          onClick={() => onToggle?.(t)}
        />
      ))}
    </div>
  );
}

function TierChip({
  tier,
  selected,
  onClick,
}: {
  tier: RiskTier | "all";
  selected: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const label = tier === "all" ? "All tiers" : RISK_TIER_LABEL[tier];
  const swatch = tier === "all" ? "var(--pc-ink-2)" : RISK_TIER_COLOR[tier];
  const rule = tier === "all"
    ? "Union of the four aggregate rule tiers below. Never a per-student score."
    : RISK_RULES[tier];
  return (
    <div className="relative">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-full transition-colors"
        style={{
          background: selected
            ? "color-mix(in oklab, var(--pc-accent) 14%, var(--pc-surface-2))"
            : "var(--pc-surface)",
          color: selected ? "var(--pc-accent)" : "var(--pc-ink-2)",
          border: selected
            ? "1px solid color-mix(in oklab, var(--pc-accent) 40%, var(--pc-border))"
            : "1px solid var(--pc-border)",
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: swatch,
            border: tier === "item9" ? "1px solid var(--pc-ink)" : "none",
          }}
          aria-hidden
        />
        <span>{label}</span>
      </button>
      {hover && (
        <div
          role="tooltip"
          className="absolute z-30 top-full mt-1 left-0 min-w-[220px] max-w-[280px] p-2 rounded-md text-[11px] leading-snug"
          style={{
            background: "var(--pc-surface)",
            color: "var(--pc-ink-2)",
            border: "1px solid var(--pc-border)",
            boxShadow: "0 10px 24px -14px color-mix(in oklab, var(--pc-ink) 30%, transparent)",
          }}
        >
          <div className="font-medium mb-0.5" style={{ color: "var(--pc-ink)" }}>{label}</div>
          <div>{rule}</div>
        </div>
      )}
    </div>
  );
}
