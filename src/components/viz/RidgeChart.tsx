interface Series {
  label: string;
  values: number[]; // density values, same length
}

interface Props {
  series: Series[];
  width?: number;
  height?: number; // total
  color?: string;
  ariaLabel?: string;
}

/** RidgeChart — stacked density ridges. */
export function RidgeChart({ series, width = 320, height = 160, color = "var(--pc-primary)", ariaLabel }: Props) {
  if (!series.length) return null;
  const rowH = height / series.length;
  const maxV = Math.max(...series.flatMap((s) => s.values), 1);
  return (
    <svg width={width} height={height + 12} role="img" aria-label={ariaLabel ?? "Distribution ridges"} className="overflow-visible">
      {series.map((s, i) => {
        const n = s.values.length;
        const step = width / (n - 1 || 1);
        const baseY = (i + 1) * rowH;
        const pts = s.values.map((v, j) => {
          const x = j * step;
          const y = baseY - (v / maxV) * rowH * 0.9;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        const line = "M" + pts.join(" L");
        const area = `${line} L${width},${baseY} L0,${baseY} Z`;
        return (
          <g key={s.label} style={{ animation: `pc-ridge-in 600ms ease-out ${i * 60}ms both` }}>
            <path d={area} fill={color} opacity={0.16} />
            <path d={line} stroke={color} strokeWidth={1.2} fill="none" />
            <text x={2} y={baseY - rowH * 0.9 - 2} className="text-[10px]" fill="var(--pc-muted)">
              {s.label}
            </text>
          </g>
        );
      })}
      <style>{`@keyframes pc-ridge-in { from { opacity: 0; transform: translateY(4px);} to {opacity:1; transform: translateY(0);} }`}</style>
    </svg>
  );
}
