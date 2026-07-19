import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { PageHeader, GlassCard } from "@/components/college/primitives";
import { EthicsFooter } from "@/components/early-warning/EthicsFooter";
import { ReportBuilder, type BuilderState } from "@/components/reports/ReportBuilder";
import { ReportPreview } from "@/components/reports/ReportPreview";
import {
  buildReportModel, exportXlsx, exportCsv, exportPdf,
  appendAudit, readAudit, TEMPLATES, WINDOWS,
  labelForWindow,
  type ReportConfig, type TemplateKey, type WindowKey, type SegmentKey, type FormatKey,
  type AuditRecord,
} from "@/lib/report-export";
import { useCollegeContext } from "@/lib/college-context";
import type { SectionId } from "@/lib/report-schema";
import { RefreshCw } from "lucide-react";

const searchSchema = z.object({
  tpl:   fallback(z.string(), "board").default("board"),
  win:   fallback(z.string(), "term").default("term"),
  segs:  fallback(z.string().array(), []).default([]),
  secs:  fallback(z.string().array(), []).default([]),
  fmt:   fallback(z.string(), "pdf").default("pdf"),
  bench: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({ meta: [{ title: "Reports — PeaceCode for Colleges" }] }),
  validateSearch: zodValidator(searchSchema),
  component: ReportsPage,
});

function clampTemplate(v: string): TemplateKey {
  const keys = TEMPLATES.map((t) => t.key);
  return (keys.includes(v as TemplateKey) ? v : "board") as TemplateKey;
}
function clampWindow(v: string): WindowKey {
  const keys = WINDOWS.map((w) => w.key);
  return (keys.includes(v as WindowKey) ? v : "term") as WindowKey;
}
function clampFormat(v: string): FormatKey {
  return (v === "xlsx" || v === "csv" ? v : "pdf") as FormatKey;
}
const ALL_SEGMENTS: SegmentKey[] = ["inst", "school", "year", "residency"];
const VALID_SECTIONS: SectionId[] = ["executive", "engagement", "wellbeing", "care", "earlyWarning"];

function ReportsPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const college = useCollegeContext();

  const initialTpl = clampTemplate(search.tpl);
  const tplDef = TEMPLATES.find((t) => t.key === initialTpl)!;

  const [state, setState] = useState<BuilderState>({
    template: initialTpl,
    window: clampWindow(search.win),
    segments: (search.segs.filter((s: string) => (ALL_SEGMENTS as string[]).includes(s)) as SegmentKey[]),
    sections: (search.secs.filter((s: string) => (VALID_SECTIONS as string[]).includes(s)) as SectionId[]).length
      ? (search.secs as SectionId[])
      : (tplDef.sections.filter((s) => (VALID_SECTIONS as string[]).includes(s)) as SectionId[]),
    format: clampFormat(search.fmt),
    benchmark: search.bench || (tplDef.bench ?? false),
  });

  // reflect state → URL
  useEffect(() => {
    nav({
      to: "/reports",
      search: {
        tpl: state.template,
        win: state.window,
        segs: state.segments,
        secs: state.sections,
        fmt: state.format,
        bench: state.benchmark,
      },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const config: ReportConfig = useMemo(() => ({
    template: state.template,
    window: state.window,
    segments: state.segments,
    sections: state.sections,
    format: state.format,
    benchmark: state.benchmark,
    institutionName: college?.name ?? "Your institution",
    institutionId: college?.id ?? "unknown-institution",
  }), [state, college]);

  const model = useMemo(() => buildReportModel(config), [config]);
  const isEmpty = model.sections.every((s) => !s.table || s.table.rows.length === 0);

  const [audit, setAudit] = useState<AuditRecord[]>(() => readAudit());
  const refreshAudit = () => setAudit(readAudit());

  const generate = () => {
    if (isEmpty) return;
    const m = buildReportModel(config);
    if (config.format === "xlsx") exportXlsx(m);
    else if (config.format === "csv") exportCsv(m);
    else exportPdf(m);
    appendAudit(m);
    refreshAudit();
  };

  const rerun = (rec: AuditRecord) => {
    setState({
      template: rec.template,
      window: rec.window,
      segments: rec.segments,
      sections: rec.sections.filter((s) => (VALID_SECTIONS as string[]).includes(s)) as SectionId[],
      format: rec.format,
      benchmark: rec.sections.includes("benchmark"),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Institutional reporting"
        title="Reports"
        subtitle="Generate aggregate, anonymized reports for your board and student-affairs office. Every export enforces k ≥ 10."
      />

      <div className="grid gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="min-w-0">
          <ReportBuilder
            state={state}
            onChange={setState}
            onGenerate={generate}
            disabled={isEmpty}
            disabledReason={isEmpty ? "Current filters leave no cohorts at k ≥ 10. Broaden the window or segment." : undefined}
          />
        </div>

        <div className="min-w-0">
          <div
            className="text-[10.5px] uppercase mb-2"
            style={{ letterSpacing: "0.14em", color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
          >
            Live preview · {labelForWindow(state.window)}
          </div>
          <div className="max-h-[78vh] overflow-y-auto pr-1">
            <ReportPreview model={model} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>Recent exports</h2>
            <button
              onClick={refreshAudit}
              className="flex items-center gap-1 text-[11.5px]"
              style={{ color: "var(--pc-muted)" }}
              aria-label="Refresh"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {audit.length === 0 ? (
            <p className="text-[12.5px]" style={{ color: "var(--pc-muted)" }}>
              No exports yet. Generated reports will appear here with a re-run action.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "var(--pc-muted)" }}>
                    <th className="text-left px-2 py-1.5 font-medium">When</th>
                    <th className="text-left px-2 py-1.5 font-medium">Template</th>
                    <th className="text-left px-2 py-1.5 font-medium">Window</th>
                    <th className="text-left px-2 py-1.5 font-medium">Format</th>
                    <th className="text-left px-2 py-1.5 font-medium">Rows</th>
                    <th className="text-left px-2 py-1.5 font-medium">Suppressed</th>
                    <th className="text-right px-2 py-1.5 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {audit.slice(0, 10).map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--pc-border)", color: "var(--pc-ink-2)" }}>
                      <td className="px-2 py-1.5">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="px-2 py-1.5">{TEMPLATES.find((t) => t.key === r.template)?.label ?? r.template}</td>
                      <td className="px-2 py-1.5">{labelForWindow(r.window)}</td>
                      <td className="px-2 py-1.5 uppercase">{r.format}</td>
                      <td className="px-2 py-1.5">{r.rowCount}</td>
                      <td className="px-2 py-1.5">{r.suppressedRows}</td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => rerun(r)}
                          className="px-2 py-0.5 rounded-full text-[11px]"
                          style={{ background: "var(--pc-surface2)", border: "1px solid var(--pc-border)", color: "var(--pc-ink-2)" }}
                        >
                          Re-run
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      <div className="mt-6">
        <EthicsFooter />
      </div>
    </>
  );
}
