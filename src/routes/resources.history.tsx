import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { useResourceStore, byId } from "@/lib/resources-store";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/resources/history")({
  head: () => ({ meta: [{ title: "History — Resources" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const snap = useResourceStore();
  const [view, setView] = useState<"timeline" | "calendar">("timeline");

  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; at: string }[]>();
    snap.history.forEach(h => {
      const day = new Date(h.at).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(h);
    });
    return Array.from(map.entries());
  }, [snap.history]);

  return (
    <AppShell>
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Trail</div>
          <h1 className="font-serif text-[34px] sm:text-[42px]" style={{ color: "var(--pc-ink)" }}>Where you've been.</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(["timeline","calendar"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className="px-4 py-2 rounded-full text-[12px] capitalize"
              style={{ background: view === v ? "var(--pc-soft)" : "var(--pc-surface)", border: "1px solid var(--pc-border)", color: view === v ? "var(--pc-primary)" : "var(--pc-muted)" }}>
              {v}
            </button>
          ))}
        </div>

        {snap.history.length === 0 && (
          <div className="rounded-3xl p-10 text-center" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-4xl mb-3">🍃</div>
            <div className="text-[13px]" style={{ color: "var(--pc-muted)" }}>No trail yet. Open a piece and it'll show up here.</div>
            <Link to="/resources" className="inline-block mt-4 text-[12px] px-4 py-2 rounded-full" style={{ background: "var(--pc-primary)", color: "#fff" }}>Explore</Link>
          </div>
        )}

        {view === "timeline" && (
          <div className="space-y-10">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <div className="text-[11px] tracking-[0.24em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>{day}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(h => {
                    const r = byId(h.id); if (!r) return null;
                    return <ResourceCard key={h.at + h.id} r={r}/>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "calendar" && (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (34 - i));
              const key = d.toISOString().slice(0, 10);
              const min = snap.learnMinutes[key] || 0;
              const level = min === 0 ? 0 : Math.min(4, Math.ceil(min / 15));
              return (
                <div key={i} className="aspect-square rounded-lg flex items-end justify-end p-1 text-[9px]"
                  style={{ background: ["var(--pc-surface2)","#DDE7F1","#B7CEE8","#7FAFDB","#4A8BC9"][level], color: level > 2 ? "#fff" : "var(--pc-muted)" }}
                  title={`${key} · ${min}m`}>
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
