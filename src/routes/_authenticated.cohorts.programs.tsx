import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dataClient } from "@/lib/data";
import { PageHeader, GlassCard } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/cohorts/programs")({
  head: () => ({
    meta: [
      { title: "Programs — PeaceCode for Colleges" },
      { name: "description", content: "Wellbeing signal by academic program cohort." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProgramsPage,
});

function ProgramsPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof dataClient.getDepartments>>>([]);
  useEffect(() => { void dataClient.getDepartments({}).then(setRows); }, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Programs" subtitle="Wellbeing signal by academic program cohort. Aggregate, k≥10." />
      <GlassCard>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ color: "var(--pc-muted)" }}>
              <th className="text-left font-normal py-2">Program</th>
              <th className="text-right font-normal">Cohort n</th>
              <th className="text-right font-normal">Wellbeing</th>
              <th className="text-right font-normal">Engagement</th>
              <th className="text-right font-normal">High-risk %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--pc-border)" }}>
                <td className="py-2" style={{ color: "var(--pc-ink)" }}>{r.name}</td>
                <td className="text-right tabular-nums">{r.cohortSize}</td>
                <td className="text-right tabular-nums">{r.wellbeingIndex.toFixed(1)}</td>
                <td className="text-right tabular-nums">{(r.engagementRate * 100).toFixed(0)}%</td>
                <td className="text-right tabular-nums">{(r.highRiskPct * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
