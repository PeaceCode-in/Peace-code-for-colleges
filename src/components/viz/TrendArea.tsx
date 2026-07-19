import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  x: string;
  y: number;
}

interface Props {
  data: Point[];
  height?: number;
  color?: string;
  ariaLabel?: string;
  yDomain?: [number | "auto", number | "auto"];
}

/** TrendArea — recharts area chart wired to design tokens. */
export function TrendArea({ data, height = 160, color = "var(--pc-primary)", ariaLabel, yDomain = ["auto", "auto"] }: Props) {
  const gid = `pc-trend-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div role="img" aria-label={ariaLabel ?? "Trend"} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--pc-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="x" tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--pc-muted)", fontSize: 10 }} axisLine={false} tickLine={false} domain={yDomain} width={28} />
          <Tooltip
            contentStyle={{
              background: "var(--pc-surface)",
              border: "1px solid var(--pc-border)",
              borderRadius: 8,
              fontSize: 11,
              color: "var(--pc-ink)",
            }}
            cursor={{ stroke: color, strokeOpacity: 0.35, strokeDasharray: "2 4" }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.6}
            fill={`url(#${gid})`}
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
