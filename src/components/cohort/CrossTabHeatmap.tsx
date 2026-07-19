// Year × Residency wellbeing heatmap. Cells with N<10 render as hatched
// "hidden" tiles. Hover shows N and the wellbeing index; click drills
// into the corresponding row + col filter.
import { crossTab, phq9ToWellbeing, YEARS, RESIDENCY, type Filters } from "@/lib/cohort-cube";
import { isSuppressed } from "@/lib/cohort-selectors";
import { HatchedCell } from "@/components/primitives/HatchedCell";

export function CrossTabHeatmap({
  filters,
  onDrill,
}: {
  filters: Filters;
  onDrill: (patch: Partial<Filters>) => void;
}) {
  const rows = [...YEARS];
  const cols = [...RESIDENCY];
  const cells = crossTab("year", "residency", filters);
  const byKey = new Map(cells.map((c) => [`${c.rowKey}|${c.colKey}`, c]));

  return (
    <div
      role="group"
      aria-label="Year by residency wellbeing heatmap. Higher is better. Cells with fewer than ten students are hidden."
    >
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `84px repeat(${cols.length}, minmax(0, 1fr))`,
        }}
      >
        <div />
        {cols.map((c) => (
          <div
            key={c}
            className="text-[10.5px] uppercase text-center"
            style={{ letterSpacing: "0.14em", color: "var(--pc-muted)" }}
          >
            {c}
          </div>
        ))}
        {rows.map((r) => (
          <div key={r} style={{ display: "contents" }}>
            <div
              className="text-[11px] flex items-center"
              style={{ color: "var(--pc-ink-2)" }}
            >
              {r}
            </div>
            {cols.map((c) => {
              const cell = byKey.get(`${r}|${c}`);
              if (!cell) return <div key={`${r}-${c}-empty`} />;
              if (isSuppressed(cell.index)) {
                return <HatchedCell key={`${r}-${c}`} style={{ height: 44 }} />;
              }
              const idx = cell.index as number;
              const shade = 0.14 + (idx / 100) * 0.5;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => onDrill({ year: r, res: c })}
                  title={`${r} · ${c} — index ${idx} · n=${cell.n}`}
                  className="rounded-md text-[11px] flex flex-col items-center justify-center transition-transform hover:scale-[1.02]"
                  style={{
                    height: 44,
                    background: `color-mix(in oklab, var(--pc-accent) ${Math.round(shade * 100)}%, var(--pc-surface))`,
                    border: "1px solid var(--pc-border)",
                    color: "var(--pc-ink)",
                  }}
                >
                  <span className="font-semibold">{idx}</span>
                  <span className="text-[10px]" style={{ color: "var(--pc-muted)" }}>
                    n={cell.n}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-[10.5px] mt-3" style={{ color: "var(--pc-muted)" }}>
        Cell = wellbeing index derived from PHQ-9 (baseline {phq9ToWellbeing(7.5)}). Hatched = hidden, fewer than 10 students.
      </p>
    </div>
  );
}
