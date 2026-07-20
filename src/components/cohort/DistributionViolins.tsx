// Horizontal "violin" strips per selected year: PHQ-9 distribution rendered
// as a mirrored Recharts area chart. We use Recharts AreaChart (per the
// prompt) rather than a raw violin library.
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { marginalize, YEARS, type Filters } from "@/lib/cohort-cube";
import { HatchedCell } from "@/components/primitives/HatchedCell";
import { K_MIN } from "@/lib/cohort-selectors";

const BIN_LABELS = ["0-4", "5-9", "10-14", "15-19", "20-24", "25-27"];

export function DistributionViolins({ filters }: { filters: Filters }) {
  const perYear = marginalize("year", filters);

  return (
    <div
      className="flex flex-col gap-3"
      role="group"
      aria-label="PHQ-9 score distributions per academic year, mirrored area charts."
    >
      {perYear.map(({ key, agg }) => {
        const suppressed = agg.n < K_MIN;
        return (
          <div key={key} className="flex items-center gap-3">
            <div
              className="w-14 shrink-0 text-[11px]"
              style={{ color: "var(--pc-ink-2)" }}
            >
              {key}
              <div className="text-[10px]" style={{ color: "var(--pc-muted)" }}>
                {suppressed ? "hidden" : `n=${agg.n}`}
              </div>
            </div>
            <div className="flex-1 h-14">
              {suppressed ? (
                <HatchedCell style={{ height: "100%" }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={BIN_LABELS.map((label, i) => ({
                      label,
                      up: agg.phq9Dist[i] ?? 0,
                      down: -(agg.phq9Dist[i] ?? 0),
                    }))}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="label" hide />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      cursor={{ stroke: "var(--pc-accent)", strokeOpacity: 0.4, strokeDasharray: "2 4" }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const count = Math.abs(Number(payload[0].value));
                        const pct = agg.n ? ((count / agg.n) * 100).toFixed(1) : "0";
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
                              PHQ-9 · {key} · bin {label}
                            </div>
                            <div className="flex justify-between gap-4">
                              <span style={{ color: "var(--pc-muted)" }}>Members in bin</span>
                              <span className="font-mono">{count}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span style={{ color: "var(--pc-muted)" }}>Share of cohort</span>
                              <span className="font-mono">{pct}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span style={{ color: "var(--pc-muted)" }}>Cohort size</span>
                              <span className="font-mono">{agg.n}</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="up"
                      stroke="var(--pc-accent)"
                      fill="color-mix(in oklab, var(--pc-accent) 40%, transparent)"
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="down"
                      stroke="var(--pc-accent)"
                      fill="color-mix(in oklab, var(--pc-accent) 40%, transparent)"
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        );
      })}
      <div
        className="flex justify-between text-[10px] pl-[68px]"
        style={{ color: "var(--pc-muted)" }}
      >
        {BIN_LABELS.map((b) => (<span key={b}>{b}</span>))}
      </div>
      <p className="text-[10.5px]" style={{ color: "var(--pc-muted)" }}>
        Bins across PHQ-9 range 0–27 (mirrored). Years covered: {YEARS.length}.
      </p>
    </div>
  );
}
