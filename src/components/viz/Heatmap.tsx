interface Cell {
  value: number | null; // null = suppressed
  label?: string;
}

interface Props {
  rows: string[];
  cols: string[];
  data: Cell[][]; // rows x cols
  ariaLabel?: string;
  min?: number;
  max?: number;
  cellSize?: number;
}

/** Heatmap — token-driven color scale; hatched cells for suppressed values. */
export function Heatmap({ rows, cols, data, ariaLabel, min, max, cellSize = 26 }: Props) {
  const flat = data.flat().map((c) => c.value).filter((v): v is number => typeof v === "number");
  const lo = min ?? Math.min(...flat, 0);
  const hi = max ?? Math.max(...flat, 1);
  const range = hi - lo || 1;
  return (
    <div role="img" aria-label={ariaLabel ?? "Heatmap"} className="inline-block">
      <svg
        width={cols.length * cellSize + 72}
        height={rows.length * cellSize + 24}
        className="overflow-visible"
      >
        <defs>
          <pattern id="pc-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--pc-muted)" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        {cols.map((c, i) => (
          <text
            key={c}
            x={72 + i * cellSize + cellSize / 2}
            y={12}
            textAnchor="middle"
            className="text-[10px]"
            fill="var(--pc-muted)"
          >
            {c}
          </text>
        ))}
        {rows.map((r, ri) => (
          <g key={r}>
            <text x={64} y={24 + ri * cellSize + cellSize / 2 + 3} textAnchor="end" className="text-[10px]" fill="var(--pc-muted)">
              {r}
            </text>
            {cols.map((_, ci) => {
              const cell = data[ri]?.[ci];
              const x = 72 + ci * cellSize;
              const y = 24 + ri * cellSize;
              if (!cell || cell.value === null) {
                return (
                  <g key={ci}>
                    <rect x={x + 1} y={y + 1} width={cellSize - 2} height={cellSize - 2} rx={3} fill="var(--pc-surface2)" />
                    <rect x={x + 1} y={y + 1} width={cellSize - 2} height={cellSize - 2} rx={3} fill="url(#pc-hatch)" />
                    <title>Suppressed — sample below k=10</title>
                  </g>
                );
              }
              const t = Math.max(0, Math.min(1, (cell.value - lo) / range));
              return (
                <g key={ci}>
                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={cellSize - 2}
                    height={cellSize - 2}
                    rx={3}
                    fill="var(--pc-primary)"
                    opacity={0.12 + 0.75 * t}
                  />
                  <title>{cell.label ?? cell.value}</title>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
