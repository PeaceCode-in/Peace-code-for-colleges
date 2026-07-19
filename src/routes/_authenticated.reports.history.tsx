import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/college/primitives";
import { seedReportHistory } from "@/lib/data/seed";

export const Route = createFileRoute("/_authenticated/reports/history")({
  head: () => ({
    meta: [
      { title: "Report history — PeaceCode for Colleges" },
      { name: "description", content: "Previously generated institutional reports." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportHistoryPage,
});

function ReportHistoryPage() {
  const rows = seedReportHistory();
  return (
    <div className="space-y-6">
      <PageHeader title="Report history" subtitle="Aggregate reports generated for this institution." />
      <GlassCard>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ color: "var(--pc-muted)" }}>
              <th className="text-left font-normal py-2">Template</th>
              <th className="text-left font-normal">Window</th>
              <th className="text-right font-normal">Rows</th>
              <th className="text-right font-normal">Suppressed</th>
              <th className="text-left font-normal">Format</th>
              <th className="text-left font-normal">Generated</th>
              <th className="text-left font-normal">By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--pc-border)" }}>
                <td className="py-2" style={{ color: "var(--pc-ink)" }}>{r.template}</td>
                <td>{r.windowFrom} → {r.windowTo}</td>
                <td className="text-right tabular-nums">{r.rowCount}</td>
                <td className="text-right tabular-nums">{r.suppressedRows}</td>
                <td className="uppercase text-[11px]">{r.format}</td>
                <td>{new Date(r.generatedAtISO).toISOString().slice(0, 10)}</td>
                <td>{r.author}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
