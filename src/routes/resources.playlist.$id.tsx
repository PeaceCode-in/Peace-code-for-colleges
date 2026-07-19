import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { useResourceStore, byId, store, RESOURCES } from "@/lib/resources-store";
import { useState } from "react";
import { Plus, Edit3 } from "lucide-react";

export const Route = createFileRoute("/resources/playlist/$id")({
  head: () => ({ meta: [{ title: "Playlist — Resources" }] }),
  component: PlaylistPage,
  notFoundComponent: () => <AppShell><main className="p-10 text-center">Playlist not found</main></AppShell>,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const snap = useResourceStore();
  const pl = snap.playlists.find(p => p.id === id);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pl?.name || "");

  if (!pl) return (
    <AppShell><main className="p-10 text-center">
      <div className="font-serif text-2xl mb-2">Playlist not found</div>
      <Link to="/resources/playlists" className="underline text-sm">Back to playlists</Link>
    </main></AppShell>
  );

  const items = pl.resourceIds.map(rid => byId(rid)).filter(Boolean) as any[];

  return (
    <AppShell>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link to="/resources/playlists" className="text-[12px]" style={{ color: "var(--pc-muted)" }}>← Playlists</Link>
        <div className="mt-4 mb-8 flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Playlist</div>
            {editing ? (
              <input value={name} onChange={e => setName(e.target.value)}
                onBlur={() => { store.renamePlaylist(pl.id, name); setEditing(false); }}
                className="font-serif text-[36px] bg-transparent outline-none border-b" style={{ color: "var(--pc-ink)" }}/>
            ) : (
              <h1 className="font-serif text-[34px] sm:text-[42px] flex items-center gap-3" style={{ color: "var(--pc-ink)" }}>
                {pl.name}
                <button onClick={() => setEditing(true)} className="opacity-40 hover:opacity-100"><Edit3 className="w-4 h-4"/></button>
              </h1>
            )}
            <p className="text-[13px] mt-2" style={{ color: "var(--pc-muted)" }}>{items.length} pieces</p>
          </div>
          <button onClick={() => setAdding(a => !a)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px]"
            style={{ background: "var(--pc-primary)", color: "#fff" }}>
            <Plus className="w-3.5 h-3.5"/> Add resources
          </button>
        </div>

        {adding && (
          <div className="rounded-3xl p-4 mb-8 max-h-[400px] overflow-y-auto"
            style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RESOURCES.map(r => {
                const inPl = pl.resourceIds.includes(r.id);
                return (
                  <button key={r.id} onClick={() => store.togglePlaylist(pl.id, r.id)}
                    className="flex items-center gap-3 p-2 rounded-xl text-left transition"
                    style={{ background: inPl ? "var(--pc-soft)" : "transparent", color: "var(--pc-ink)" }}>
                    <span className="text-xl">{r.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] truncate">{r.title}</span>
                      <span className="block text-[10px]" style={{ color: "var(--pc-muted)" }}>{r.minutes}m</span>
                    </span>
                    <span className="text-[10px]" style={{ color: inPl ? "var(--pc-primary)" : "var(--pc-muted)" }}>{inPl ? "Added" : "Add"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-3xl p-10 text-center" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-4xl mb-3">🎵</div>
            <div className="text-[13px]" style={{ color: "var(--pc-muted)" }}>Empty playlist. Tap "Add resources" to start.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(r => (
              <div key={r.id} className="relative">
                <ResourceCard r={r}/>
                <button onClick={() => store.togglePlaylist(pl.id, r.id)}
                  className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-full"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
