interface Props {
  values: number[];
  width?: number;
  height?: number;
  ariaLabel?: string;
  color?: string; // css value
}

/** Sparkbar — tiny inline bar chart for list rows. */
export function Sparkbar({ values, width = 88, height = 18, ariaLabel, color = "var(--pc-primary)" }: Props) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const gap = 1;
  const bw = (width - gap * (values.length - 1)) / values.length;
  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel ?? `Trend of ${values.length} points`}
      className="overflow-visible"
    >
      {values.map((v, i) => {
        const h = Math.max(1.5, (v / max) * height);
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={height - h}
            width={bw}
            height={h}
            rx={1}
            fill={color}
            opacity={0.35 + 0.65 * (v / max)}
          />
        );
      })}
    </svg>
  );
}
