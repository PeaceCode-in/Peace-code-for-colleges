import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { useResourceStore, byId } from "@/lib/resources-store";
import { Download } from "lucide-react";

export const Route = createFileRoute("/resources/downloads")({
  head: () => ({ meta: [{ title: "Downloads — Resources" }] }),
  component: () => {
    const snap = useResourceStore();
    const items = snap.downloads.map(id => byId(id)).filter(Boolean) as any[];
    const grouped: Record<string, any[]> = {};
    items.forEach(r => { const k = r.format; (grouped[k] = grouped[k] || []).push(r); });
    return (
      <AppShell>
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Offline</div>
            <h1 className="font-serif text-[34px] sm:text-[42px]" style={{ color: "var(--pc-ink)" }}>Downloads.</h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--pc-muted)" }}>Kept for offline reading and listening. Video downloads are placeholders on the web.</p>
          </div>
          {items.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
              <Download className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--pc-primary)" }}/>
              <div className="text-[13px]" style={{ color: "var(--pc-muted)" }}>Nothing downloaded yet.</div>
              <Link to="/resources" className="inline-block mt-4 text-[12px] px-4 py-2 rounded-full" style={{ background: "var(--pc-primary)", color: "#fff" }}>Explore library</Link>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(grouped).map(([fmt, arr]) => (
                <div key={fmt}>
                  <div className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>{fmt}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {arr.map(r => <ResourceCard key={r.id} r={r}/>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </AppShell>
    );
  },
});
