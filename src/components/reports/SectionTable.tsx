import type { ReportTable } from "@/lib/report-export";
import { COLUMN_LABELS } from "@/lib/report-schema";

export function SectionTable({ table }: { table: ReportTable }) {
  return (
    <div>
      <table className="w-full text-[12.5px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="text-left px-3 py-2 font-medium"
                style={{
                  background: "var(--pc-surface2)",
                  borderBottom: "1px solid var(--pc-border)",
                  color: "var(--pc-ink-2)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {COLUMN_LABELS[c] ?? c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <tr key={i}>
              {table.columns.map((c) => (
                <td
                  key={c}
                  className="px-3 py-2"
                  style={{ borderBottom: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}
                >
                  {String(r[c] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.suppressedRows > 0 && (
        <div
          className="mt-2 text-[11px]"
          style={{ color: "var(--pc-muted)", fontFamily: "var(--font-serif)" }}
        >
          {table.suppressedRows} row{table.suppressedRows === 1 ? "" : "s"} omitted (k&lt;10)
        </div>
      )}
    </div>
  );
}
