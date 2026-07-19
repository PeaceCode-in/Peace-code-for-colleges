// Accessible radiogroup rendered as chips. Values are strings so we can
// wire it directly to URL search params.
import { useId } from "react";

export type ChipOption = { value: string; label: string; disabled?: boolean };

export function FilterChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  const groupId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div
        id={`${groupId}-label`}
        className="text-[10px] uppercase"
        style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
      >
        {label}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        className="flex flex-wrap gap-1.5"
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={opt.disabled}
              onClick={() => onChange(opt.value)}
              className="text-[12px] px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: selected
                  ? "color-mix(in oklab, var(--pc-accent) 16%, var(--pc-surface-2))"
                  : "var(--pc-surface)",
                color: selected ? "var(--pc-accent)" : "var(--pc-ink-2)",
                border: selected
                  ? "1px solid color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))"
                  : "1px solid var(--pc-border)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
