import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dataClient } from "@/lib/data";
import { PageHeader, GlassCard } from "@/components/college/primitives";

export const Route = createFileRoute("/_authenticated/care/routing")({
  head: () => ({
    meta: [
      { title: "Care Routing — PeaceCode for Colleges" },
      { name: "description", content: "Early-warning routing funnel and channel breakdown." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RoutingPage,
});

function RoutingPage() {
  const [q, setQ] = useState<Awaited<ReturnType<typeof dataClient.getEarlyWarningQueue>> | null>(null);
  useEffect(() => { void dataClient.getEarlyWarningQueue("term").then(setQ); }, []);
  if (!q) return null;
  const maxFunnel = Math.max(1, ...q.funnel.map((f) => f.n));
  const maxCh = Math.max(1, ...q.channels.map((c) => c.pct));

  return (
    <div className="space-y-6">
      <PageHeader title="Care Routing" subtitle="Detected → outreach → contact → intake → completed. Aggregate, k≥10." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="text-[13px] mb-3" style={{ color: "var(--pc-ink)" }}>Routing funnel</h3>
          <div className="space-y-2">
            {q.funnel.map((f) => (
              <div key={f.step} className="flex items-center gap-3">
                <div className="w-24 text-[12px]" style={{ color: "var(--pc-muted)" }}>{f.step}</div>
                <div className="flex-1 h-4 rounded" style={{ background: "var(--pc-surface2)" }}>
                  <div
                    className="h-full rounded"
                    style={{ width: `${(f.n / maxFunnel) * 100}%`, background: "var(--pc-primary)" }}
                  />
                </div>
                <div className="w-14 text-right text-[12px] tabular-nums">{f.n}</div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="text-[13px] mb-3" style={{ color: "var(--pc-ink)" }}>Channel breakdown</h3>
          <div className="space-y-2">
            {q.channels.map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <div className="w-32 text-[12px]" style={{ color: "var(--pc-muted)" }}>{c.channel}</div>
                <div className="flex-1 h-4 rounded" style={{ background: "var(--pc-surface2)" }}>
                  <div
                    className="h-full rounded"
                    style={{ width: `${(c.pct / maxCh) * 100}%`, background: "color-mix(in oklab, var(--pc-primary) 65%, transparent)" }}
                  />
                </div>
                <div className="w-12 text-right text-[12px] tabular-nums">{c.pct}%</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
