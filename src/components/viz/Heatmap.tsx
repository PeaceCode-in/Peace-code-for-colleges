import { useState } from "react";
import { ChartTooltip, TooltipHint, TooltipRow, TooltipTitle, useChartTooltip } from "./ChartTooltip";

interface Cell {
  value: number | null;
  label?: string;
}

interface Props {
  rows: string[];
  cols: string[];
  data: Cell[][];
  ariaLabel?: string;
  min?: number;
  max?: number;
  cellSize?: number;
  unit?: string;
  /** Column-then-row description ("Week × Department", "Hour × Weekday", …). */
  axisLabel?: [string, string];
}

/** Heatmap — hoverable cells with rich per-cell tooltip and cross-hair highlight. */
export function Heatmap({
  rows, cols, data, ariaLabel, min, max, cellSize = 26, unit = "",
  axisLabel = ["Column", "Row"],
}: Props) {
  const flat = data.flat().map((c) => c.value).filter((v): v is number => typeof v === "number");
  const lo = min ?? Math.min(...flat, 0);
  const hi = max ?? Math.max(...flat, 1);
  const range = hi - lo || 1;
  const tip = useChartTooltip();
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);

  return (
    <div
      ref={tip.wrapperRef}
      role="img"
      aria-label={ariaLabel ?? "Heatmap"}
      className="relative inline-block"
      onMouseMove={tip.onMove}
      onMouseLeave={() => { tip.hide(); setHover(null); }}
    >
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
            fill={hover?.c === i ? "var(--pc-ink)" : "var(--pc-muted)"}
            style={{ transition: "fill 120ms ease-out" }}
          >
            {c}
          </text>
        ))}
        {rows.map((r, ri) => (
          <g key={r}>
            <text
              x={64}
              y={24 + ri * cellSize + cellSize / 2 + 3}
              textAnchor="end"
              className="text-[10px]"
              fill={hover?.r === ri ? "var(--pc-ink)" : "var(--pc-muted)"}
              style={{ transition: "fill 120ms ease-out" }}
            >
              {r}
            </text>
            {cols.map((_, ci) => {
              const cell = data[ri]?.[ci];
              const x = 72 + ci * cellSize;
              const y = 24 + ri * cellSize;
              const isHover = hover?.r === ri && hover?.c === ci;
              const suppressed = !cell || cell.value === null;
              return (
                <g
                  key={ci}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    setHover({ r: ri, c: ci });
                    tip.show(
                      <>
                        <TooltipTitle sub={`${cols[ci]} × ${rows[ri]}`}>{`${axisLabel[0]} × ${axisLabel[1]}`}</TooltipTitle>
                        {suppressed ? (
                          <TooltipHint>Suppressed — cohort below the k=10 privacy threshold.</TooltipHint>
                        ) : (
                          <>
                            <TooltipRow label="Value" value={`${cell.label ?? cell.value}${unit ? ` ${unit}` : ""}`} />
                            <TooltipRow label="Intensity" value={`${(((cell.value! - lo) / range) * 100).toFixed(0)}%`} />
                            <TooltipRow label="Scale" value={`${lo}${unit ? ` ${unit}` : ""} → ${hi}${unit ? ` ${unit}` : ""}`} />
                          </>
                        )}
                      </>,
                      e,
                    );
                  }}
                >
                  {suppressed ? (
                    <>
                      <rect x={x + 1} y={y + 1} width={cellSize - 2} height={cellSize - 2} rx={3} fill="var(--pc-surface2)" />
                      <rect x={x + 1} y={y + 1} width={cellSize - 2} height={cellSize - 2} rx={3} fill="url(#pc-hatch)" />
                    </>
                  ) : (
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      rx={3}
                      fill="var(--pc-primary)"
                      opacity={0.12 + 0.75 * ((cell.value! - lo) / range)}
                    />
                  )}
                  {isHover && (
                    <rect
                      x={x + 0.5}
                      y={y + 0.5}
                      width={cellSize - 1}
                      height={cellSize - 1}
                      rx={3.5}
                      fill="none"
                      stroke="var(--pc-ink)"
                      strokeWidth={1.5}
                    />
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <ChartTooltip state={tip.state} />
    </div>
  );
}
