// Bottleneck matrix — where students drop out of the routing funnel by
// tier. Cells below k=10 render hatched via <HatchedCell>. Colour is
// paired with a printed % so it never signals meaning alone.
import { getBottlenecks, K_MIN, type EwWindowKey } from "@/lib/early-warning-selectors";
import { HatchedCell } from "@/components/primitives/HatchedCell";
import { RISK_TIER_LABEL } from "@/lib/clinical-scales";

const STEP_LABEL: Record<string, string> = {
  detected: "Detect",
  nudged: "Nudge",
  resource: "Resource",
  offered: "Offer",
  accepted: "Accept",
  completed: "Complete",
};

export function BottleneckMatrix({ window }: { window: EwWindowKey }) {
  const { matrix, tiers, steps } = getBottlenecks(window);
  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <div className="text-[10px] uppercase" style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}>
          Where students leak
        </div>
        <div className="font-serif text-[18px] leading-tight" style={{ color: "var(--pc-ink)" }}>
          Drop-off % · tier × step
        </div>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div
          className="grid text-[11px] gap-[3px]"
          style={{ gridTemplateColumns: `140px repeat(${steps.length}, minmax(64px, 1fr))` }}
        >
          <div />
          {steps.map((s) => (
            <div
              key={s}
              className="text-center py-1"
              style={{ color: "var(--pc-muted)" }}
            >
              {STEP_LABEL[s]}
            </div>
          ))}
          {tiers.map((tier) => (
            <RowFragment key={tier} tier={tier} steps={steps} matrix={matrix} />
          ))}
        </div>
      </div>
      <div className="mt-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>
        Cells with fewer than {K_MIN} students are suppressed. Darker = larger drop-off.
      </div>
    </div>
  );
}

function RowFragment({
  tier,
  steps,
  matrix,
}: {
  tier: "elevated" | "high" | "item9" | "overdue";
  steps: string[];
  matrix: ReturnType<typeof getBottlenecks>["matrix"];
}) {
  return (
    <>
      <div
        className="py-2 pr-2 text-right truncate"
        style={{ color: "var(--pc-ink-2)", fontFamily: "var(--font-serif)" }}
        title={RISK_TIER_LABEL[tier]}
      >
        {RISK_TIER_LABEL[tier]}
      </div>
      {steps.map((step) => {
        const cell = matrix.find((c) => c.tier === tier && c.step === step);
        if (!cell) return <div key={step} />;
        if (cell.n < K_MIN) {
          return (
            <div key={step} className="min-h-[36px]">
              <HatchedCell title="k<10" />
            </div>
          );
        }
        const intensity = Math.min(1, cell.dropPct / 60);
        return (
          <div
            key={step}
            className="min-h-[36px] rounded-md grid place-items-center tabular-nums"
            style={{
              background: `color-mix(in oklab, var(--pc-warn) ${Math.round(intensity * 55)}%, var(--pc-surface-2))`,
              color: intensity > 0.55 ? "var(--pc-surface)" : "var(--pc-ink)",
              border: "1px solid var(--pc-border)",
            }}
            aria-label={`${RISK_TIER_LABEL[tier]} · ${step} · drop ${cell.dropPct}% · n=${cell.n}`}
          >
            {cell.dropPct}%
          </div>
        );
      })}
    </>
  );
}
