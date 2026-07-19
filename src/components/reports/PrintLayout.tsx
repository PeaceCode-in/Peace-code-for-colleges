import type { ReportModel } from "@/lib/report-export";
import { labelForWindow, TEMPLATES } from "@/lib/report-export";
import { COLUMN_LABELS } from "@/lib/report-schema";

export function PrintLayout({ model }: { model: ReportModel }) {
  const templateLabel = TEMPLATES.find((t) => t.key === model.config.template)?.label ?? model.config.template;
  return (
    <article className="print-root">
      {model.sections.map((s) => {
        if (s.id === "cover") {
          return (
            <section key={s.id} className="section section-cover">
              <div className="muted" style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>
                {templateLabel}
              </div>
              <h1 style={{ marginTop: "8pt" }}>{model.config.institutionName}</h1>
              <h2 style={{ marginTop: "2pt", color: "#333" }}>
                Institutional wellbeing report · {labelForWindow(model.config.window)}
              </h2>
              <div className="cover-meta">
                <div><strong>Generated:</strong> {new Date(model.generatedAt).toLocaleString()}</div>
                <div><strong>Institution ID:</strong> {model.config.institutionId}</div>
                <div><strong>k-anonymity threshold:</strong> 10 (rows below suppressed)</div>
                <div><strong>Rows suppressed:</strong> {model.suppressedRows} of {model.totalRows + model.suppressedRows}</div>
                <div><strong>Segments:</strong> {model.config.segments.join(", ") || "Institution-wide"}</div>
              </div>
            </section>
          );
        }
        if (s.id === "executive" && s.narrative) {
          return (
            <section key={s.id} className="section">
              <h2>{s.title}</h2>
              <div className="kpi-grid">
                <div className="kpi"><div className="label">Active students</div><div className="value">{model.headline.activeStudents.toLocaleString()}</div></div>
                <div className="kpi"><div className="label">Wellbeing index</div><div className="value">{model.headline.wellnessIndex.toFixed(1)}</div></div>
                <div className="kpi"><div className="label">% Moderate+</div><div className="value">{model.headline.moderatePlusPct.toFixed(1)}%</div></div>
                <div className="kpi"><div className="label">% Improved</div><div className="value">{model.headline.improvementPct.toFixed(1)}%</div></div>
              </div>
              <div style={{ marginTop: "8pt" }}>
                {s.narrative.map((n, i) => <p key={i} style={{ margin: "3pt 0" }}>{n}</p>)}
              </div>
            </section>
          );
        }
        return (
          <section key={s.id} className="section">
            <h2>{s.title}</h2>
            {s.table && (
              <>
                <table>
                  <thead>
                    <tr>{s.table.columns.map((c) => <th key={c} scope="col">{COLUMN_LABELS[c] ?? c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((r, i) => (
                      <tr key={i}>{s.table!.columns.map((c) => <td key={c}>{String(r[c] ?? "—")}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
                {s.table.suppressedRows > 0 && (
                  <div className="muted" style={{ marginTop: "4pt" }}>
                    {s.table.suppressedRows} row{s.table.suppressedRows === 1 ? "" : "s"} omitted (k&lt;10)
                  </div>
                )}
              </>
            )}
            {s.chartSummary && <div className="chart-summary">{s.chartSummary}</div>}
          </section>
        );
      })}
    </article>
  );
}
