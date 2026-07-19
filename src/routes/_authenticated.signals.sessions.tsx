import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dataClient } from "@/lib/data";
import { PageHeader, GlassCard, StatTile } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/signals/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — PeaceCode for Colleges" },
      { name: "description", content: "Weekly session cadence and completion aggregates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const [sig, setSig] = useState<Awaited<ReturnType<typeof dataClient.getWellbeingSignals>> | null>(null);
  const [pulse, setPulse] = useState<Awaited<ReturnType<typeof dataClient.getWellnessPulse>> | null>(null);
  useEffect(() => {
    const now = new Date().toISOString().slice(0, 10);
    void dataClient.getWellbeingSignals({ from: now, to: now }).then(setSig);
    void dataClient.getWellnessPulse({ from: now, to: now }).then(setPulse);
  }, []);
  const cadence = sig?.sessionCadence ?? [];
  const totalSessions = cadence.reduce((a, b) => a + b.value, 0);
  const last4 = cadence.slice(-4).reduce((a, b) => a + b.value, 0);
  const max = Math.max(1, ...cadence.map((c) => c.value));

  return (
    <div className="space-y-6">
      <PageHeader title="Sessions" subtitle="Counselling session cadence across the reporting window." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Sessions this week" value={pulse?.sessionsCompleted?.toLocaleString() ?? "—"} />
        <StatTile label="Last 4 weeks" value={last4.toLocaleString()} />
        <StatTile label="26-week total" value={totalSessions.toLocaleString()} />
      </div>
      <GlassCard>
        <div className="flex items-end gap-1 h-40">
          {cadence.map((c) => (
            <div
              key={c.date}
              className="flex-1 rounded-t"
              style={{
                height: `${(c.value / max) * 100}%`,
                background: "color-mix(in oklab, var(--pc-primary) 60%, transparent)",
              }}
              title={`${c.date}: ${c.value}`}
            />
          ))}
        </div>
        <p className="text-[11px] mt-3" style={{ color: "var(--pc-muted)" }}>
          Weekly sessions completed, oldest → newest. Aggregate; no individual student identifiable.
        </p>
      </GlassCard>
    </div>
  );
}
