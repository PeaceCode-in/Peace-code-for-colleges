// Inline sparkline. Reads the active chart-style attribute the applier
// sets on <html> (smooth / sharp / dotted) and swaps the path
// interpolation and dash accordingly. No fills, no dots — this is meant
// to sit inside a KPI tile.
import { useMemo } from "react";

function catmullRom(pts: [number, number][]) {
  if (pts.length < 2) return "";
  const d: string[] = [`M ${pts[0][0]},${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`);
  }
  return d.join(" ");
}

export function Sparkline({
  values,
  width = 160,
  height = 42,
  ariaLabel,
}: {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel: string;
}) {
  const pathD = useMemo(() => {
    if (!values.length) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = values.length > 1 ? width / (values.length - 1) : 0;
    const pts = values.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return [x, y] as [number, number];
    });
    const tension = typeof document !== "undefined"
      ? getComputedStyle(document.documentElement).getPropertyValue("--pc-chart-tension").trim()
      : "";
    // sharp = 0, smooth ≈ 0.55 → route to a linear path when tension is 0.
    if (tension === "0") return "M " + pts.map((p) => `${p[0]},${p[1]}`).join(" L ");
    return catmullRom(pts);
  }, [values, width, height]);

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="block"
    >
      <title>{ariaLabel}</title>
      <desc>{ariaLabel}</desc>
      <path
        className="pc-chart-line"
        d={pathD}
        fill="none"
        stroke="var(--pc-primary)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
