// Per-school median time-to-contact, benchmarked against the peer median.
// Any school with n<10 is filtered upstream and never rendered here.
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { getSchoolResponseTimes, getTimeToContact, isSuppressed, type EwWindowKey } from "@/lib/early-warning-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";

export function SchoolResponseTimes({ window }: { window: EwWindowKey }) {
  const rows = getSchoolResponseTimes(window);
  const ttc = getTimeToContact(window);
  if (isSuppressed(rows) || isSuppressed(ttc)) {
    return <SuppressedTile label="School response times" reason="k<10" />;
  }
  const peer = ttc.peerMedianHours;
  const inst = ttc.medianHours;
  const sorted = [...rows].sort((a, b) => a.medianHours - b.medianHours);
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
          Response time by school
        </div>
        <div className="font-serif text-[18px] leading-tight" style={{ color: "var(--pc-ink)" }}>
          Median hours to first contact
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--pc-border) 60%, transparent)" horizontal={false} />
            <XAxis type="number" stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }} unit="h" />
            <YAxis type="category" dataKey="schoolName" width={140} stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }} />
            <Tooltip
              contentStyle={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", borderRadius: 8, color: "var(--pc-ink)", fontSize: 12 }}
              formatter={(v) => `${v}h`}
              cursor={{ fill: "color-mix(in oklab, var(--pc-accent) 10%, transparent)" }}
            />
            <ReferenceLine x={inst} stroke="var(--pc-accent)" strokeDasharray="4 3"
              label={{ value: "inst median", position: "insideTopRight", fill: "var(--pc-accent)", fontSize: 10 }} />
            <ReferenceLine x={peer} stroke="var(--pc-muted)" strokeDasharray="2 4"
              label={{ value: "peer median", position: "insideBottomRight", fill: "var(--pc-muted)", fontSize: 10 }} />
            <Bar dataKey="medianHours" radius={[0, 4, 4, 0]}>
              {sorted.map((row, i) => (
                <Cell key={i} fill={row.medianHours > peer ? "var(--pc-warn)" : "var(--pc-accent)"} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
