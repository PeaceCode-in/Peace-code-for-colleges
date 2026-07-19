interface Props {
  values: number[]; // aggregate value axis — DO NOT pass raw student rows
  n: number; // cohort size (for k-anonymity gate)
  width?: number;
  height?: number;
  domain?: [number, number];
  ariaLabel?: string;
  color?: string;
}

/**
 * BeeswarmDots — jittered dots representing an aggregate distribution shape.
 * When N<10 the swarm is fully blurred + hatched — never leaks individual dots.
 */
export function BeeswarmDots({ values, n, width = 320, height = 90, domain, ariaLabel, color = "var(--pc-primary)" }: Props) {
  const suppressed = n < 10;
  const lo = domain?.[0] ?? Math.min(...values, 0);
  const hi = domain?.[1] ?? Math.max(...values, 1);
  const span = hi - lo || 1;
  // Deterministic jitter — index-based, no Math.random per render.
  const jitter = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1) * (height - 20);
  return (
    <div role="img" aria-label={ariaLabel ?? `Distribution across ${n} respondents`} className="relative">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" preserveAspectRatio="none">
        <line x1={0} y1={height - 8} x2={width} y2={height - 8} stroke="var(--pc-border)" />
        {!suppressed &&
          values.map((v, i) => {
            const x = ((v - lo) / span) * width;
            const y = 8 + Math.abs(jitter(i));
            return <circle key={i} cx={x} cy={y} r={2.4} fill={color} opacity={0.55} />;
          })}
        {suppressed && (
          <g>
            <rect x={0} y={0} width={width} height={height} fill="var(--pc-surface2)" opacity={0.6} />
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-[11px]" fill="var(--pc-muted)">
              Sample too small — suppressed (k=10)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
