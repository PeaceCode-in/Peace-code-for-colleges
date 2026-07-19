import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Pin, Star, Trash2, Plus, Folder, X } from "lucide-react";
import { palette } from "@/components/AppShell";
import {
  loadRecents, removeRecent, clearRecents,
  loadPinned, togglePinned,
  loadSaved, deleteSaved,
  loadCollections, createCollection, deleteCollection,
  loadFreq, type SavedSearch, type SearchCollection,
} from "@/lib/search-store";

export const Route = createFileRoute("/search/history")({
  component: SearchHistory,
});

function SearchHistory() {
  const { surface, surface2, border, ink, muted, soft, primary } = palette;
  const [recents, setRecents] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [collections, setCollections] = useState<SearchCollection[]>([]);
  const [freq, setFreq] = useState<Record<string, number>>({});
  const [newColName, setNewColName] = useState("");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    setRecents(loadRecents());
    setPinned(loadPinned());
    setSaved(loadSaved());
    setCollections(loadCollections());
    setFreq(loadFreq());
  }, []);

  const topSearched = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="min-h-screen w-full pb-24 pt-6 lg:pt-10" style={{ color: ink }}>
      <div className="max-w-5xl mx-auto px-5 lg:px-8">
        <Link to="/search" className="inline-flex items-center gap-2 text-[11px] opacity-60 hover:opacity-100 mb-5">
          <ArrowLeft className="w-3 h-3"/> Back to Search
        </Link>
        <div className="text-[9px] tracking-[0.4em] uppercase opacity-50">Search history</div>
        <h1 className="font-serif text-[28px] lg:text-[34px] leading-tight mt-2 mb-8">Your search memory.</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent */}
          <section className="rounded-3xl p-5 lg:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Recent</div>
              {recents.length > 0 && (
                <button onClick={() => { clearRecents(); setRecents([]); }} className="text-[10.5px] flex items-center gap-1 opacity-70 hover:opacity-100"><Trash2 className="w-3 h-3"/> Clear all</button>
              )}
            </div>
            {recents.length === 0 ? <Empty text="No recent searches yet."/> : (
              <div className="flex flex-col gap-1">
                {recents.map((r) => (
                  <div key={r} className="group flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: surface2 }}>
                    <Clock className="w-3 h-3 opacity-50"/>
                    <Link to="/search" search={{ q: r } as any} className="flex-1 text-[12.5px] truncate">{r}</Link>
                    <button onClick={() => { togglePinned(r); setPinned(loadPinned()); }} className="opacity-70 hover:opacity-100" aria-label="Pin">
                      <Pin className="w-3 h-3" style={{ color: pinned.includes(r) ? primary : undefined }}/>
                    </button>
                    <button onClick={() => { removeRecent(r); setRecents(loadRecents()); }} className="opacity-0 group-hover:opacity-100" aria-label="Remove">
                      <X className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pinned */}
          <section className="rounded-3xl p-5 lg:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: muted }}>Pinned</div>
            {pinned.length === 0 ? <Empty text="Pin searches or results to keep them close."/> : (
              <div className="flex flex-wrap gap-2">
                {pinned.map((p) => (
                  <div key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px]" style={{ background: soft, color: primary }}>
                    <Pin className="w-3 h-3"/> <span className="truncate max-w-[160px]">{p}</span>
                    <button onClick={() => { togglePinned(p); setPinned(loadPinned()); }} aria-label="Unpin"><X className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved */}
          <section className="rounded-3xl p-5 lg:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: muted }}>Saved searches</div>
            {saved.length === 0 ? <Empty text="Save frequent queries to reuse them later."/> : (
              <div className="flex flex-col gap-2">
                {saved.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: surface2 }}>
                    <Star className="w-3.5 h-3.5" style={{ color: primary }}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] truncate">{s.label ?? s.query}</div>
                      <div className="text-[9.5px] opacity-50">{new Date(s.ts).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => { deleteSaved(s.id); setSaved(loadSaved()); }} aria-label="Delete" className="opacity-60 hover:opacity-100">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Collections */}
          <section className="rounded-3xl p-5 lg:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>Collections</div>
              <button onClick={() => setShowNew((v) => !v)} className="text-[10.5px] flex items-center gap-1 opacity-70 hover:opacity-100"><Plus className="w-3 h-3"/> New</button>
            </div>
            {showNew && (
              <div className="mb-3 flex items-center gap-2">
                <input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="Collection name" className="flex-1 bg-transparent outline-none px-3 py-2 rounded-xl text-[12px]" style={{ background: surface2, border: `1px solid ${border}` }}/>
                <button onClick={() => { if (!newColName.trim()) return; createCollection(newColName.trim()); setCollections(loadCollections()); setNewColName(""); setShowNew(false); }} className="px-3 py-2 rounded-xl text-[11.5px]" style={{ background: ink, color: surface }}>Create</button>
              </div>
            )}
            {collections.length === 0 ? <Empty text="Create folders like Exam Resources, Sleep, Read Later."/> : (
              <div className="flex flex-col gap-2">
                {collections.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: surface2 }}>
                    <Folder className="w-3.5 h-3.5" style={{ color: primary }}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] truncate">{c.name}</div>
                      <div className="text-[9.5px] opacity-50">{c.itemIds.length} items</div>
                    </div>
                    <button onClick={() => { deleteCollection(c.id); setCollections(loadCollections()); }} aria-label="Delete" className="opacity-60 hover:opacity-100">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Analytics */}
          <section className="rounded-3xl p-5 lg:p-6 lg:col-span-2" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: muted }}>Most searched</div>
            {topSearched.length === 0 ? <Empty text="Search a few things to see your top topics."/> : (
              <div className="flex flex-wrap gap-2">
                {topSearched.map(([q, n]) => (
                  <Link key={q} to="/search" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                    {q} <span className="opacity-50">· {n}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-[12px] opacity-60 py-3">{text}</div>;
}
