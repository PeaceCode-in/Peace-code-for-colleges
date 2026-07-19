import { useState } from "react";
import { ChevronDown, Check, Lock, RotateCcw } from "lucide-react";
import {
  useDashboardFilters,
  DEPARTMENTS,
  YEARS,
  PROGRAMS,
  eligibleCount,
  wouldBreachAnonymity,
  type Filters,
  type Timeframe,
  type CompareMode,
} from "@/lib/insights-store";

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "term", label: "This term" },
  { key: "custom", label: "Custom range" },
];

const COMPARES: { key: CompareMode; label: string }[] = [
  { key: "previous", label: "Previous period" },
  { key: "baseline", label: "Institution baseline" },
  { key: "national", label: "National benchmark" },
];

export function FilterBar() {
  const { filters, setTimeframe, setCompare, reset } = useDashboardFilters();
  const eligible = eligibleCount(filters);
  return (
    <div
      className="sticky z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6"
      style={{
        top: "56px",
        background: "var(--pc-header)",
        borderBottom: "1px solid var(--pc-border)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <Segmented
          value={filters.timeframe}
          options={TIMEFRAMES}
          onChange={(k) => setTimeframe(k as Timeframe)}
        />
        <Divider />
        <MultiPopover
          label="Department"
          options={DEPARTMENTS}
          selected={filters.departments}
          getFilterAfterToggle={(v) => ({ ...filters, departments: toggleArr(filters.departments, v) })}
          onToggle="department"
        />
        <MultiPopover
          label="Year"
          options={YEARS}
          selected={filters.years}
          getFilterAfterToggle={(v) => ({ ...filters, years: toggleArr(filters.years, v) })}
          onToggle="year"
        />
        <MultiPopover
          label="Program"
          options={PROGRAMS}
          selected={filters.programs}
          getFilterAfterToggle={(v) => ({ ...filters, programs: toggleArr(filters.programs, v) })}
          onToggle="program"
        />
        <Divider />
        <Segmented
          value={filters.compare}
          options={COMPARES}
          onChange={(k) => setCompare(k as CompareMode)}
        />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
            Cohort n ≈ <span style={{ color: "var(--pc-ink)" }}>{eligible.toLocaleString()}</span>
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-[11.5px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              color: "var(--pc-ink-2)",
              background: "var(--pc-surface2)",
              border: "1px solid var(--pc-border)",
            }}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function toggleArr<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Divider() {
  return <span className="h-5 w-px" style={{ background: "var(--pc-border)" }} />;
}

function Segmented<K extends string>({
  value,
  options,
  onChange,
}: {
  value: K;
  options: { key: K; label: string }[];
  onChange: (k: K) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full p-0.5"
      style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className="text-[11.5px] px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{
              color: active ? "var(--pc-ink)" : "var(--pc-muted)",
              background: active ? "var(--pc-surface)" : "transparent",
              border: active ? "1px solid var(--pc-border)" : "1px solid transparent",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiPopover({
  label,
  options,
  selected,
  getFilterAfterToggle,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  getFilterAfterToggle: (v: string) => Filters;
  onToggle: "department" | "year" | "program";
}) {
  const [open, setOpen] = useState(false);
  const store = useDashboardFilters();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-full"
        style={{
          background: "var(--pc-surface2)",
          border: "1px solid var(--pc-border)",
          color: "var(--pc-ink-2)",
        }}
      >
        {label}
        {selected.length > 0 && (
          <span
            className="text-[10px] px-1.5 rounded-full"
            style={{ background: "var(--pc-primary)", color: "#fff" }}
          >
            {selected.length}
          </span>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 mt-1.5 w-56 rounded-xl p-1 z-40"
            style={{
              background: "var(--pc-surface)",
              border: "1px solid var(--pc-border)",
              boxShadow: "0 16px 40px -18px color-mix(in oklab, var(--pc-ink) 35%, transparent)",
            }}
          >
            {options.map((opt) => {
              const active = selected.includes(opt);
              const trial = getFilterAfterToggle(opt);
              const wouldLock = !active && wouldBreachAnonymity(trial);
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={wouldLock}
                  title={
                    wouldLock
                      ? "This combination would identify individuals — locked to protect anonymity."
                      : undefined
                  }
                  onClick={() => {
                    if (wouldLock) return;
                    if (onToggle === "department") store.toggleDepartment(opt);
                    if (onToggle === "year") store.toggleYear(opt);
                    if (onToggle === "program") store.toggleProgram(opt);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12.5px] text-left"
                  style={{
                    background: active ? "var(--pc-surface2)" : "transparent",
                    color: wouldLock ? "var(--pc-muted)" : "var(--pc-ink)",
                    opacity: wouldLock ? 0.55 : 1,
                    cursor: wouldLock ? "not-allowed" : "pointer",
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded grid place-items-center"
                    style={{
                      background: active ? "var(--pc-primary)" : "transparent",
                      border: `1px solid ${active ? "var(--pc-primary)" : "var(--pc-border)"}`,
                    }}
                  >
                    {active && <Check className="h-2.5 w-2.5" color="#fff" />}
                  </span>
                  <span className="flex-1 truncate">{opt}</span>
                  {wouldLock && <Lock className="h-3 w-3" style={{ color: "var(--pc-warn)" }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
