// Time-to-first-contact histogram. Bars are aggregate counts per
// bucket, with reference lines for our median, p90, and the peer
// benchmark median. Never a per-student list.
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from "recharts";
import { getTimeToContact, isSuppressed, type EwWindowKey } from "@/lib/early-warning-selectors";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { SlaChip } from "@/components/primitives/SlaChip";

export function TimeToContact({ window }: { window: EwWindowKey }) {
  const bundle = getTimeToContact(window);
  if (isSuppressed(bundle)) {
    return <SuppressedTile label="Time to first contact" reason="k<10" />;
  }
  const total = bundle.buckets.reduce((s, b) => s + b.n, 0);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
            Time to first contact
          </div>
          <div className="font-serif text-[18px] leading-tight" style={{ color: "var(--pc-ink)" }}>
            Median {bundle.medianHours}h · p90 {bundle.p90Hours}h
          </div>
        </div>
        <SlaChip
          status={bundle.medianHours <= 24 ? "on" : bundle.medianHours <= 36 ? "warn" : "breach"}
          text={`SLA 24h · ${bundle.medianHours <= 24 ? "within" : "over"}`}
        />
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bundle.buckets} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--pc-border) 60%, transparent)" />
            <XAxis dataKey="label" stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }} />
            <YAxis stroke="var(--pc-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: "var(--pc-border)" }} />
            <Tooltip
              contentStyle={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", borderRadius: 8, color: "var(--pc-ink)", fontSize: 12 }}
              cursor={{ fill: "color-mix(in oklab, var(--pc-accent) 10%, transparent)" }}
            />
            <ReferenceLine
              x={pickBucketLabel(bundle.buckets, bundle.medianHours)}
              stroke="var(--pc-accent)"
              strokeDasharray="4 3"
              label={{ value: "median", position: "top", fill: "var(--pc-accent)", fontSize: 10 }}
            />
            <Bar dataKey="n" radius={[4, 4, 0, 0]}>
              {bundle.buckets.map((_, i) => (
                <Cell key={i} fill="var(--pc-accent)" fillOpacity={0.65} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-[11px]" style={{ color: "var(--pc-muted)" }}>
        Peer benchmark median: {bundle.peerMedianHours}h · n = {total.toLocaleString()} contacts
      </div>
    </div>
  );
}

function pickBucketLabel(buckets: { key: string; label: string }[], hours: number): string {
  // Map an hour count to the nearest bucket label.
  if (hours <= 1) return buckets[0].label;
  if (hours <= 4) return buckets[1].label;
  if (hours <= 12) return buckets[2].label;
  if (hours <= 24) return buckets[3].label;
  if (hours <= 48) return buckets[4].label;
  return buckets[5].label;
}
