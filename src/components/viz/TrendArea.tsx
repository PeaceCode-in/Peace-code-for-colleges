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
  unit?: string;
  seriesLabel?: string;
}

/** TrendArea — recharts area with custom tooltip content (label · value · delta · %). */
export function TrendArea({
  data, height = 160, color = "var(--pc-primary)", ariaLabel,
  yDomain = ["auto", "auto"], unit = "", seriesLabel = "Value",
}: Props) {
  const gid = `pc-trend-${Math.random().toString(36).slice(2, 8)}`;
  const first = data[0]?.y ?? 0;
  const max = Math.max(...data.map((d) => d.y), 1);

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
            cursor={{ stroke: color, strokeOpacity: 0.45, strokeDasharray: "2 4" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const v = Number(payload[0].value);
              const delta = v - first;
              return (
                <div
                  className="rounded-md px-3 py-2 text-[11.5px] shadow-lg animate-fade-in"
                  style={{
                    background: "var(--pc-surface)",
                    border: "1px solid var(--pc-border)",
                    color: "var(--pc-ink)",
                    backdropFilter: "blur(12px) saturate(140%)",
                  }}
                >
                  <div className="text-[10.5px] uppercase tracking-wider mb-1" style={{ color: "var(--pc-muted)", letterSpacing: "0.12em" }}>
                    {label}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-1.5" style={{ color: "var(--pc-muted)" }}>
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {seriesLabel}
                    </span>
                    <span className="font-mono tabular-nums" style={{ color: "var(--pc-ink)" }}>
                      {v.toLocaleString()}{unit ? ` ${unit}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: "var(--pc-muted)" }}>Δ vs start</span>
                    <span className="font-mono tabular-nums" style={{ color: delta >= 0 ? "var(--pc-primary)" : "var(--pc-muted)" }}>
                      {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: "var(--pc-muted)" }}>vs peak</span>
                    <span className="font-mono tabular-nums" style={{ color: "var(--pc-ink)" }}>{((v / max) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.6}
            fill={`url(#${gid})`}
            isAnimationActive
            animationDuration={600}
            activeDot={{ r: 4, stroke: "var(--pc-surface)", strokeWidth: 1.5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
