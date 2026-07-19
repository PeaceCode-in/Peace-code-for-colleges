interface Props {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel?: string;
  color?: string;
  fill?: boolean;
}

/** Sparkline — inline line chart for list rows. */
export function VizSparkline({ values, width = 96, height = 22, ariaLabel, color = "var(--pc-primary)", fill = true }: Props) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / span) * (height - 2) - 1;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = "M" + pts.join(" L");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} role="img" aria-label={ariaLabel ?? "Trend"} className="overflow-visible">
      {fill && <path d={area} fill={color} opacity={0.14} />}
      <path d={line} stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Backward-compatible named export
export { VizSparkline as Sparkline };
