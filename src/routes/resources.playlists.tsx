import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useResourceStore, store, byId } from "@/lib/resources-store";
import { ListMusic, Plus, Trash2, Edit3 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/resources/playlists")({
  head: () => ({ meta: [{ title: "Playlists — Resources" }] }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const snap = useResourceStore();
  const [name, setName] = useState("");
  return (
    <AppShell>
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Yours</div>
            <h1 className="font-serif text-[34px] sm:text-[42px]" style={{ color: "var(--pc-ink)" }}>Playlists.</h1>
          </div>
          <div className="flex items-center gap-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name your playlist"
              className="px-4 py-2 rounded-full text-[13px] outline-none"
              style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}/>
            <button onClick={() => { if (name.trim()) { store.createPlaylist(name.trim()); setName(""); } }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px]"
              style={{ background: "var(--pc-primary)", color: "#fff" }}>
              <Plus className="w-3.5 h-3.5"/> New
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {snap.playlists.map(p => (
            <Link key={p.id} to="/resources/playlist/$id" params={{ id: p.id }}
              className="rounded-3xl p-5 relative overflow-hidden transition hover:-translate-y-0.5"
              style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
              <ListMusic className="w-5 h-5 mb-3" style={{ color: "var(--pc-primary)" }}/>
              <div className="font-serif text-[18px]" style={{ color: "var(--pc-ink)" }}>{p.name}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--pc-muted)" }}>{p.resourceIds.length} items</div>
              <div className="mt-4 flex -space-x-1">
                {p.resourceIds.slice(0, 4).map(rid => {
                  const r = byId(rid); if (!r) return null;
                  return <div key={rid} className="w-7 h-7 rounded-full flex items-center justify-center text-[12px]"
                    style={{ background: "var(--pc-soft)", border: "2px solid var(--pc-surface)" }}>{r.emoji}</div>;
                })}
              </div>
              <button onClick={(e) => { e.preventDefault(); if (confirm(`Delete ${p.name}?`)) store.deletePlaylist(p.id); }}
                className="absolute top-4 right-4 opacity-40 hover:opacity-100" aria-label="Delete">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
