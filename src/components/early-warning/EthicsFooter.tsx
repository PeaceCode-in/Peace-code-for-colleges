// Bottom-of-page disclosure. Renders on every Early Warning surface.
// This is not decorative — it establishes the aggregate-only contract in
// plain language, next to the numbers a reader might act on.
import { GlassCard } from "@/components/college/primitives";
import { ShieldCheck } from "lucide-react";

export function EthicsFooter() {
  return (
    <GlassCard tone="outlined" className="p-5 mt-8" data-noexport>
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full grid place-items-center shrink-0"
          style={{
            background: "color-mix(in oklab, var(--pc-good) 12%, var(--pc-surface-2))",
            color: "var(--pc-good)",
          }}
        >
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-serif text-[13px]"
            style={{ color: "var(--pc-ink)" }}
          >
            Aggregate signals, not case files.
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "var(--pc-ink-2)" }}>
            Every tier here is a system-level rule over completed assessments — never a
            per-student risk score. Cohorts with fewer than 10 students are suppressed by
            design. Nothing on this surface identifies a student, and no cell can be
            exported at a resolution that would. If you need to reach a specific student,
            use your institution's care pathway — not this dashboard.
          </p>
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--pc-muted)" }}>
            DPDP-compliant · k-anonymity ≥ 10 · Reviewed with your ethics office
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
