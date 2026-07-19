// Sticky glass filter bar for /cohorts/demographics. Every chip toggle
// updates URL search params (via the parent's onChange) — the URL is the
// source of truth for the whole page.
import { RotateCcw } from "lucide-react";
import { FilterChipGroup } from "@/components/primitives/FilterChipGroup";
import { AnonymityBadge } from "@/components/college/primitives";
import {
  YEARS, GENDERS, RESIDENCY, GEN1, AID,
  type Filters,
} from "@/lib/cohort-cube";

export function DemographicFilters({
  value,
  onChange,
  onReset,
  activeN,
}: {
  value: Filters;
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
  activeN: number;
}) {
  return (
    <div
      className="sticky top-0 z-20 backdrop-blur-md"
      style={{
        background: "color-mix(in oklab, var(--pc-surface) 82%, transparent)",
        borderBottom: "1px solid var(--pc-border)",
        padding: "14px 18px",
      }}
    >
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-end">
        <FilterChipGroup
          label="Academic year"
          value={value.year}
          onChange={(v) => onChange({ year: v as Filters["year"] })}
          options={[{ value: "all", label: "All" }, ...YEARS.map((y) => ({ value: y, label: y }))]}
        />
        <FilterChipGroup
          label="Gender"
          value={value.gender}
          onChange={(v) => onChange({ gender: v as Filters["gender"] })}
          options={[{ value: "all", label: "All" }, ...GENDERS.map((g) => ({ value: g, label: g }))]}
        />
        <FilterChipGroup
          label="Residency"
          value={value.res}
          onChange={(v) => onChange({ res: v as Filters["res"] })}
          options={[{ value: "all", label: "All" }, ...RESIDENCY.map((r) => ({ value: r, label: r }))]}
        />
        <FilterChipGroup
          label="First-gen"
          value={value.gen1}
          onChange={(v) => onChange({ gen1: v as Filters["gen1"] })}
          options={[{ value: "all", label: "All" }, ...GEN1.map((g) => ({ value: g, label: g }))]}
        />
        <FilterChipGroup
          label="Aid tier"
          value={value.aid}
          onChange={(v) => onChange({ aid: v as Filters["aid"] })}
          options={[{ value: "all", label: "All" }, ...AID.map((a) => ({ value: a, label: a }))]}
        />
      </div>
      <div className="flex items-center justify-between gap-4 mt-3">
        <AnonymityBadge n={activeN} k={10} />
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors"
          style={{ color: "var(--pc-muted)", border: "1px solid var(--pc-border)" }}
        >
          <RotateCcw className="h-3 w-3" aria-hidden /> Reset filters
        </button>
      </div>
    </div>
  );
}
