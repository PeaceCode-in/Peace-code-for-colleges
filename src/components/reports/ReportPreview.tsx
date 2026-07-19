import { GlassCard } from "@/components/college/primitives";
import { SectionTable } from "./SectionTable";
import type { ReportModel } from "@/lib/report-export";
import { labelForWindow, TEMPLATES } from "@/lib/report-export";

export function ReportPreview({ model }: { model: ReportModel }) {
  const templateLabel = TEMPLATES.find((t) => t.key === model.config.template)?.label ?? model.config.template;
  return (
    <div className="space-y-4">
      {model.sections.map((s) => {
        if (s.id === "cover") {
          return (
            <GlassCard key={s.id} className="p-6" tone="raised">
              <div
                className="text-[10.5px] uppercase mb-2"
                style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
              >
                {templateLabel}
              </div>
              <h2
                className="font-serif text-[26px] leading-tight"
                style={{ color: "var(--pc-ink)" }}
              >
                {model.config.institutionName}
              </h2>
              <div className="mt-1 text-[13px]" style={{ color: "var(--pc-ink-2)" }}>
                Institutional wellbeing report · {labelForWindow(model.config.window)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11.5px]" style={{ color: "var(--pc-muted)" }}>
                <div>Generated: {new Date(model.generatedAt).toLocaleString()}</div>
                <div>Institution ID: {model.config.institutionId}</div>
                <div>k-threshold: 10</div>
                <div>Suppressed rows: {model.suppressedRows}</div>
              </div>
            </GlassCard>
          );
        }
        return (
          <GlassCard key={s.id} className="p-5">
            <h3
              className="font-serif text-[15px] mb-3"
              style={{ color: "var(--pc-ink)" }}
            >
              {s.title}
            </h3>
            {s.narrative && (
              <div className="mb-3 space-y-1.5 text-[12.5px]" style={{ color: "var(--pc-ink-2)" }}>
                {s.narrative.map((n, i) => <p key={i}>{n}</p>)}
              </div>
            )}
            {s.table && <SectionTable table={s.table} />}
            {s.chartSummary && (
              <p className="mt-2 text-[11.5px] italic" style={{ color: "var(--pc-muted)" }}>
                {s.chartSummary}
              </p>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
