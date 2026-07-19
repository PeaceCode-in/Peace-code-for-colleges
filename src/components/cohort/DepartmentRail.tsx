// Left-rail department list. Searchable, sortable, multi-select (up to 4).
// URL is the source of truth via the parent — this component is a
// controlled view over the `selected` set.
import { useMemo, useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Search, TrendingUp, TrendingDown, Minus, Lock, ChevronsUpDown } from "lucide-react";
import {
  listDepartments,
  sortDepartments,
  engagementPct,
  phq9WeekDelta,
  avg,
  K_MIN,
  type RailSort,
} from "@/lib/cohort-selectors";
import type { DepartmentInsight } from "@/lib/dashboard-mock.departments";

export const MAX_COMPARE = 4;

const SORT_LABELS: Record<RailSort, string> = {
  size: "Cohort size",
  phq9: "PHQ-9 avg",
  engagement: "Engagement",
  risk: "Risk %",
};

export function DepartmentRail({
  selected,
  onToggle,
  onSelectOnly,
}: {
  selected: string[];
  onToggle: (id: string) => void;      // add / remove (multi)
  onSelectOnly: (id: string) => void;  // replace selection with just this id
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<RailSort>("size");
  const [focusIdx, setFocusIdx] = useState<number>(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  const rows = useMemo(() => {
    const filtered = listDepartments().filter((d) => {
      if (!q.trim()) return true;
      const needle = q.trim().toLowerCase();
      return d.name.toLowerCase().includes(needle) || d.school.toLowerCase().includes(needle);
    });
    return sortDepartments(filtered, sort);
  }, [q, sort]);

  // Keep focused index in range when the list changes.
  useEffect(() => {
    if (focusIdx >= rows.length) setFocusIdx(Math.max(0, rows.length - 1));
  }, [rows.length, focusIdx]);

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx((i) => Math.min(rows.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[focusIdx];
      if (!row) return;
      if (e.shiftKey) onToggle(row.id);
      else onSelectOnly(row.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      // Signal upstream to clear via selecting nothing.
      selected.forEach((id) => onToggle(id));
    }
  };

  return (
    <aside
      aria-label="Departments"
      className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-[calc(3.5rem+16px)] lg:self-start"
    >
      <div
        className="rounded-[var(--pc-radius-scale,16px)] border p-3 flex flex-col"
        style={{
          background: "var(--pc-surface)",
          borderColor: "var(--pc-border)",
          maxHeight: "calc(100dvh - 8rem)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <label className="relative flex-1">
            <span className="sr-only">Search departments</span>
            <Search aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--pc-muted)" }} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-2 py-1.5 text-[12.5px] rounded-md outline-none focus-visible:ring-2"
              style={{
                background: "var(--pc-surface2)",
                border: "1px solid var(--pc-border)",
                color: "var(--pc-ink)",
                // @ts-expect-error CSS var passthrough for focus ring color
                "--tw-ring-color": "var(--pc-accent)",
              }}
            />
          </label>
          <label className="relative">
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as RailSort)}
              className="appearance-none text-[11.5px] pl-2 pr-6 py-1.5 rounded-md outline-none focus-visible:ring-2"
              style={{
                background: "var(--pc-surface2)",
                border: "1px solid var(--pc-border)",
                color: "var(--pc-ink-2)",
                // @ts-expect-error CSS var passthrough
                "--tw-ring-color": "var(--pc-accent)",
              }}
              aria-label="Sort departments"
            >
              {(Object.keys(SORT_LABELS) as RailSort[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
            <ChevronsUpDown aria-hidden className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: "var(--pc-muted)" }} />
          </label>
        </div>

        <div className="text-[10.5px] px-1 mb-1.5 flex items-center justify-between" style={{ color: "var(--pc-muted)", letterSpacing: "0.06em" }}>
          <span>{rows.length} department{rows.length === 1 ? "" : "s"}</span>
          <span>{selected.length}/{MAX_COMPARE} selected</span>
        </div>

        <ul
          ref={listRef}
          role="listbox"
          aria-multiselectable
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="flex-1 overflow-y-auto flex flex-col gap-1 outline-none focus-visible:ring-2 rounded-md"
          style={{
            // @ts-expect-error CSS var passthrough
            "--tw-ring-color": "var(--pc-accent)",
          }}
        >
          {rows.map((d, i) => (
            <DeptRow
              key={d.id}
              d={d}
              active={selected.includes(d.id)}
              focused={i === focusIdx}
              onClick={(shift) => (shift ? onToggle(d.id) : onSelectOnly(d.id))}
              onMouseEnter={() => setFocusIdx(i)}
              disabled={!selected.includes(d.id) && selected.length >= MAX_COMPARE}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}

function DeptRow({
  d,
  active,
  focused,
  disabled,
  onClick,
  onMouseEnter,
}: {
  d: DepartmentInsight;
  active: boolean;
  focused: boolean;
  disabled: boolean;
  onClick: (shift: boolean) => void;
  onMouseEnter: () => void;
}) {
  const suppressed = d.n < K_MIN;
  const delta = phq9WeekDelta(d);
  const Trend = delta > 0.15 ? TrendingUp : delta < -0.15 ? TrendingDown : Minus;
  // On PHQ-9, up is bad (more distress). Colour accordingly.
  const trendColor = delta > 0.15 ? "var(--pc-danger)" : delta < -0.15 ? "var(--pc-good)" : "var(--pc-muted)";
  const trendLabel = delta > 0.15 ? "worsening" : delta < -0.15 ? "improving" : "stable";
  const eng = Math.round(engagementPct(d) * 100);

  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={(e) => onClick(e.shiftKey)}
        onMouseEnter={onMouseEnter}
        disabled={disabled}
        className="w-full grid grid-cols-[1fr_auto] items-center gap-2 rounded-md px-2 py-2 text-left outline-none focus-visible:ring-2 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
        style={{
          background: active
            ? "color-mix(in oklab, var(--pc-accent) 12%, transparent)"
            : focused ? "var(--pc-surface2)" : "transparent",
          border: `1px solid ${active ? "color-mix(in oklab, var(--pc-accent) 45%, var(--pc-border))" : "transparent"}`,
          color: "var(--pc-ink)",
          // @ts-expect-error CSS var passthrough
          "--tw-ring-color": "var(--pc-accent)",
        }}
        aria-label={`${d.name}${suppressed ? " — cohort hidden below k=" + K_MIN : `, ${d.n} students, PHQ-9 ${trendLabel}, engagement ${eng}%`}`}
      >
        <div className="min-w-0">
          <div className="text-[12.5px] truncate font-medium" style={{ color: "var(--pc-ink)" }}>
            {d.name}
          </div>
          <div className="text-[10.5px] truncate" style={{ color: "var(--pc-muted)" }}>
            {d.school}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MiniSpark values={d.phq9Series.slice(-12)} suppressed={suppressed} />
          <div className="text-right">
            {suppressed ? (
              <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--pc-muted)" }}>
                <Lock className="h-3 w-3" aria-hidden /> N&lt;{K_MIN}
              </span>
            ) : (
              <>
                <div className="text-[11px] tabular-nums" style={{ color: "var(--pc-ink-2)" }}>
                  n={d.n}
                </div>
                <div className="text-[10px] inline-flex items-center gap-0.5" style={{ color: trendColor }}>
                  <Trend aria-hidden className="h-3 w-3" />
                  {Math.abs(delta).toFixed(1)}
                </div>
              </>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function MiniSpark({ values, suppressed }: { values: number[]; suppressed: boolean }) {
  if (suppressed || values.length < 2) {
    return <div className="w-14 h-6" aria-hidden />;
  }
  const w = 56, h = 22, pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.5, max - min);
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (v - min) / span);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = avg(values.slice(-3));
  const first = avg(values.slice(0, 3));
  const worsening = last > first;
  return (
    <svg width={w} height={h} role="img" aria-label={`12-week PHQ-9 sparkline, trend ${worsening ? "worsening" : "improving"}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={worsening ? "var(--pc-danger)" : "var(--pc-good)"}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
