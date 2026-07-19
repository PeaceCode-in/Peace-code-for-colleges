// Weekly 100% stacked bar of routing channels. In-app / email / peer /
// counselor. Colours come from the derived accent scale so a theme
// change instantly re-tints the bars.
import { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { getChannelBreakdown, isSuppressed, type EwWindowKey } from "@/lib/early-warning-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { deriveAccentScale } from "@/lib/accent-derive";
import { loadSettings, ACCENTS } from "@/lib/settings-store";

const CHANNELS: { key: "inApp" | "email" | "peer" | "counselor"; label: string; token: "a1" | "a2" | "a3" | "soft" }[] = [
  { key: "inApp",     label: "In-app nudge",      token: "a1" },
  { key: "email",     label: "Email",             token: "a2" },
  { key: "peer",      label: "Peer support",      token: "a3" },
  { key: "counselor", label: "Counselor outreach",token: "soft" },
];

export function ChannelBreakdown({ window }: { window: EwWindowKey }) {
  const bundle = getChannelBreakdown(window);
  const scale = useMemo(() => {
    const s = typeof window !== "undefined" ? loadSettings() : null;
    const hex = s ? ACCENTS[s.appearance.accent].primary : "#3F6B4E";
    return deriveAccentScale(hex);
  }, []);
  if (isSuppressed(bundle)) {
    return <SuppressedTile title="Routing channel mix" reason="k<10" />;
  }
  // Normalise to 100% per week.
  const data = bundle.map((row) => {
    const total = row.inApp + row.email + row.peer + row.counselor || 1;
    return {
      week: row.week,
      inApp: (row.inApp / total) * 100,
      email: (row.email / total) * 100,
      peer:  (row.peer / total) * 100,
      counselor: (row.counselor / total) * 100,
    };
  });
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
          Routing channel mix
        </div>
        <div className="font-serif text-[18px] leading-tight" style={{ color: "var(--pc-ink)" }}>
          Share of outreach per week
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }} stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--pc-border) 60%, transparent)" />
            <XAxis dataKey="week" stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }} />
            <YAxis stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }}
              tickFormatter={(v) => `${Math.round((v as number) * 100)}%`} />
            <Tooltip
              contentStyle={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", borderRadius: 8, color: "var(--pc-ink)", fontSize: 12 }}
              formatter={(v) => `${(v as number).toFixed(0)}%`}
              cursor={{ fill: "color-mix(in oklab, var(--pc-accent) 8%, transparent)" }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--pc-muted)" }} />
            {CHANNELS.map((c) => (
              <Bar key={c.key} dataKey={c.key} name={c.label} stackId="1" fill={scale[c.token]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
