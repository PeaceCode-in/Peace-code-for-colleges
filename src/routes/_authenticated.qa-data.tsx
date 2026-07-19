import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dataClient } from "@/lib/data";
import { PageHeader, GlassCard } from "@/components/college/primitives";
import { useCurrentRole } from "@/lib/admin-mock";
import { isSeedActive } from "@/lib/data/seed-state";

export const Route = createFileRoute("/_authenticated/qa-data")({
  head: () => ({
    meta: [
      { title: "QA data dump — PeaceCode for Colleges" },
      { name: "description", content: "Live dataClient payload inspector (admin-only)." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: QaDataPage,
});

function QaDataPage() {
  const role = useCurrentRole();
  const [dump, setDump] = useState<Record<string, unknown>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "admin") return;
    const now = new Date().toISOString().slice(0, 10);
    (async () => {
      try {
        const out = {
          wellnessPulse:    await dataClient.getWellnessPulse({ from: now, to: now }),
          departments:      await dataClient.getDepartments({}),
          cohortSlice:      await dataClient.getCohortSlice({}),
          wellbeingSignals: await dataClient.getWellbeingSignals({ from: now, to: now }),
          earlyWarning:     await dataClient.getEarlyWarningQueue("term"),
          members:          await dataClient.listMembers(),
          audit:            await dataClient.listAuditLog(),
        };
        setDump(out);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [role]);

  if (role !== "admin") {
    return (
      <div className="space-y-6">
        <PageHeader title="QA data dump" subtitle="Admin-only." />
        <GlassCard><p className="text-[12.5px]" style={{ color: "var(--pc-muted)" }}>Requires the admin role.</p></GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QA data dump"
        subtitle={`Live dataClient payloads. Seed mode: ${isSeedActive() ? "ON" : "OFF"}.`}
      />
      {err && (
        <GlassCard><p className="text-[12.5px]" style={{ color: "var(--pc-danger, #b45)" }}>Error: {err}</p></GlassCard>
      )}
      {Object.entries(dump).map(([k, v]) => (
        <GlassCard key={k}>
          <div className="text-[12px] font-mono mb-2" style={{ color: "var(--pc-ink)" }}>{k}</div>
          <pre
            className="text-[11px] leading-snug overflow-auto max-h-[360px] p-3 rounded"
            style={{ background: "var(--pc-surface2)", color: "var(--pc-ink-2)" }}
          >{JSON.stringify(v, null, 2)}</pre>
        </GlassCard>
      ))}
    </div>
  );
}
