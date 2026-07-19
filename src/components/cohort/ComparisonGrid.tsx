// Small-multiples comparison grid. Activates when 2–4 departments are
// selected. Each cell is a mini PHQ-9 line with a shared Y-domain and
// synchronized hover (Recharts `syncId`).
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from "recharts";
import { GlassCard } from "@/components/college/primitives";
import { SuppressedTile } from "@/components/primitives/SuppressedTile";
import { K_MIN } from "@/lib/cohort-selectors";
import type { DepartmentInsight } from "@/lib/dashboard-mock.departments";

export function ComparisonGrid({ depts }: { depts: DepartmentInsight[] }) {
  if (depts.length < 2) return null;

  // Shared Y-domain across all visible depts for honest comparison.
  const all = depts.flatMap((d) => d.phq9Series);
  const lo = Math.max(0, Math.floor(Math.min(...all) - 1));
  const hi = Math.ceil(Math.max(...all) + 1);

  return (
    <GlassCard className="p-4 md:p-5">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[10.5px] uppercase" style={{ color: "var(--pc-muted)", letterSpacing: "0.14em", fontFamily: "var(--font-serif)" }}>
            Comparison mode
          </div>
          <h3 className="font-serif text-[18px] mt-0.5" style={{ color: "var(--pc-ink)" }}>
            PHQ-9 across {depts.length} departments
          </h3>
        </div>
        <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>
          Shared scale · synchronized hover · 26 weeks
        </div>
      </header>
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(depts.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {depts.map((d) => (
          <Cell key={d.id} d={d} lo={lo} hi={hi} />
        ))}
      </div>
    </GlassCard>
  );
}

function Cell({ d, lo, hi }: { d: DepartmentInsight; lo: number; hi: number }) {
  const suppressed = d.n < K_MIN;
  const data = d.phq9Series.map((v, i) => ({ i, week: `W${i + 1}`, phq9: v }));
  return (
    <div className="min-w-0 flex flex-col gap-1.5" role="group" aria-label={`${d.name} PHQ-9 trend`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] font-medium truncate" style={{ color: "var(--pc-ink)" }}>{d.name}</div>
          <div className="text-[10px] truncate" style={{ color: "var(--pc-muted)" }}>{d.school}</div>
        </div>
        <div className="text-[10.5px] tabular-nums shrink-0" style={{ color: "var(--pc-muted)" }}>
          {suppressed ? `n<${K_MIN}` : `n=${d.n}`}
        </div>
      </div>
      <div
        className="h-[130px] rounded-md"
        style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)" }}
      >
        {suppressed ? (
          <SuppressedTile compact />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} syncId="cohort-compare">
              <CartesianGrid stroke="var(--pc-border)" strokeDasharray="2 4" />
              <XAxis dataKey="week" hide />
              <YAxis domain={[lo, hi]} tick={{ fontSize: 9, fill: "var(--pc-muted)" }} width={24} />
              <ReferenceArea y1={0} y2={4} fill="var(--pc-good)" fillOpacity={0.08} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-md px-2 py-1 text-[10.5px]" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
                      <div style={{ color: "var(--pc-muted)" }}>{label}</div>
                      <div className="tabular-nums">PHQ-9 {Number(payload[0].value).toFixed(1)}</div>
                    </div>
                  );
                }}
              />
              <Line type="monotone" dataKey="phq9" stroke="var(--pc-accent)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
