// Care-routing funnel. Detected → Nudged → Resource → Offered →
// Accepted → Completed. Bars are proportional to the top step. Steps
// with n<10 render as a hatched suppressed row.
import { getFunnel, isSuppressed, type EwWindowKey } from "@/lib/early-warning-selectors";

export function RoutingFunnel({ window }: { window: EwWindowKey }) {
  const bundle = getFunnel(window);
  if (isSuppressed(bundle)) {
    return (
      <div className="text-[12px]" style={{ color: "var(--pc-muted)" }}>
        Sample too small to display — routing funnel suppressed.
      </div>
    );
  }
  const top = bundle.steps[0]?.n || 1;
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
          Care-routing funnel
        </div>
        <div className="font-serif text-[18px] leading-tight" style={{ color: "var(--pc-ink)" }}>
          Detected → Completed
        </div>
      </div>
      <ol className="space-y-2 flex-1">
        {bundle.steps.map((s, i) => {
          const width = Math.max(4, (s.n / top) * 100);
          return (
            <li key={s.key} className="text-[12px]">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <span style={{ color: "var(--pc-ink)" }}>{s.label}</span>
                  <span className="ml-2 text-[11px]" style={{ color: "var(--pc-muted)" }}>{s.note}</span>
                </div>
                <div className="text-[11.5px] tabular-nums shrink-0" style={{ color: "var(--pc-ink-2)" }}>
                  {s.suppressed ? "—" : s.n.toLocaleString()}
                  {s.conversionFromPrev !== null && !s.suppressed && (
                    <span className="ml-2" style={{ color: "var(--pc-muted)" }}>
                      · {Math.round(s.conversionFromPrev)}% from prior
                    </span>
                  )}
                </div>
              </div>
              <div
                className="mt-1 h-2.5 rounded-full overflow-hidden"
                style={{ background: "var(--pc-surface-2)", border: "1px solid var(--pc-border)" }}
                aria-hidden
              >
                {s.suppressed ? (
                  <div
                    className="h-full"
                    style={{
                      width: "100%",
                      backgroundImage:
                        "repeating-linear-gradient(45deg, var(--pc-border) 0 4px, transparent 4px 8px)",
                    }}
                  />
                ) : (
                  <div
                    className="h-full"
                    style={{
                      width: `${width}%`,
                      background: i === 0
                        ? "var(--pc-accent)"
                        : `color-mix(in oklab, var(--pc-accent) ${Math.max(30, 100 - i * 12)}%, var(--pc-surface-2))`,
                    }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
