import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import printCss from "@/styles/print.css?url";
import { PrintLayout } from "@/components/reports/PrintLayout";
import type { ReportModel } from "@/lib/report-export";

export const Route = createFileRoute("/reports/print")({
  head: () => ({
    meta: [
      { title: "Report preview — PeaceCode for Colleges" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: printCss }],
  }),
  component: PrintPage,
});

function PrintPage() {
  const [model, setModel] = useState<ReportModel | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pc.reports.pending.v1");
      if (raw) setModel(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!model) return;
    const t = window.setTimeout(() => window.print(), 300);
    const onAfter = () => window.close();
    window.addEventListener("afterprint", onAfter);
    return () => { window.clearTimeout(t); window.removeEventListener("afterprint", onAfter); };
  }, [model]);

  if (!model) {
    return (
      <div style={{ padding: "24px", fontFamily: "system-ui" }}>
        No report queued. Open a report from the Reports page and click Generate.
      </div>
    );
  }
  return <PrintLayout model={model} />;
}
