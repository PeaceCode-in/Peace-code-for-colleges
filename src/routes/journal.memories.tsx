import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Mic, Search, Filter, Calendar, ChevronRight, X } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { loadEntries, collectMedia, isUnlocked, type MediaItem } from "@/lib/journal-store";

export const Route = createFileRoute("/journal/memories")({ component: MemoryGallery });

const { surface, surface2, border, ink, muted, primary } = palette;
type Filter = "all" | "photos" | "voice";

function MemoryGallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<MediaItem | null>(null);

  useEffect(() => {
    const entries = loadEntries().filter((e) => !e.secret || isUnlocked());
    setItems(collectMedia(entries));
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((m) => {
      if (filter === "photos" && m.kind !== "photo") return false;
      if (filter === "voice" && m.kind !== "voice") return false;
      if (!query) return true;
      const t = m.title.toLowerCase();
      const extra = m.kind === "voice" ? (m.voice.transcript ?? "").toLowerCase() : "";
      return t.includes(query) || extra.includes(query);
    });
  }, [items, filter, q]);

  const grouped = useMemo(() => {
    const groups = new Map<string, MediaItem[]>();
    for (const m of filtered) {
      const iso = m.kind === "photo" ? m.createdAt : m.voice.createdAt;
      const d = new Date(iso);
      const key = d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
      const arr = groups.get(key) ?? [];
      arr.push(m);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const counts = useMemo(() => ({
    all: items.length,
    photos: items.filter((i) => i.kind === "photo").length,
    voice: items.filter((i) => i.kind === "voice").length,
  }), [items]);

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 lg:pt-10 pb-24 font-['DM_Sans',sans-serif]" style={{ color: ink }}>
        <div className="flex items-center gap-2 text-[11px] opacity-60 mb-3">
          <Link to="/journal" className="hover:opacity-100">journal</Link>
          <ChevronRight className="w-3 h-3" />
          <span>memory gallery</span>
        </div>

        <header className="mb-8">
          <div className="text-[10px] tracking-[0.4em] uppercase opacity-50">a soft archive</div>
          <h1 className="font-['Fraunces',serif] text-[40px] sm:text-[52px] font-light mt-2 leading-none">
            memory <span className="italic" style={{ color: primary }}>gallery</span>
          </h1>
          <p className="mt-3 text-[14px] opacity-70 max-w-xl">
            every photo and voice note you've kept, gathered by month. tap any card to open it in the entry it belongs to.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          {([
            { k: "all",    label: "all",    n: counts.all },
            { k: "photos", label: "photos", n: counts.photos },
            { k: "voice",  label: "voice",  n: counts.voice },
          ] as { k: Filter; label: string; n: number }[]).map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className="h-9 px-4 rounded-full text-[12px] inline-flex items-center gap-2 transition"
              style={{
                background: filter === f.k ? ink : surface,
                color: filter === f.k ? "#fff" : ink,
                border: `1px solid ${border}`,
              }}>
              <Filter className="w-3 h-3 opacity-70" /> {f.label}
              <span className="opacity-60">{f.n}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 rounded-full px-3 h-9" style={{ background: surface, border: `1px solid ${border}` }}>
            <Search className="w-3.5 h-3.5 opacity-50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search memories…"
              className="bg-transparent outline-none text-[12px] w-40 sm:w-56 placeholder:opacity-40" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl p-14 text-center" style={{ background: surface, border: `1px dashed ${border}` }}>
            <ImageIcon className="w-6 h-6 mx-auto opacity-40" />
            <p className="mt-3 font-['Fraunces',serif] italic text-[17px]">nothing to remember yet.</p>
            <p className="text-[12px] opacity-60 mt-1">add a photo or record a voice note inside any entry.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([label, list]) => (
              <section key={label}>
                <div className="flex items-baseline justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 opacity-50" />
                    <h2 className="font-['Fraunces',serif] text-[22px] font-light">{label}</h2>
                  </div>
                  <span className="text-[11px] opacity-60">{list.length} {list.length === 1 ? "memory" : "memories"}</span>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((m, i) => (
                    <MediaTile key={i} m={m} onOpen={() => setPreview(m)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {preview && <MediaLightbox m={preview} onClose={() => setPreview(null)} />}
    </AppShell>
  );
}

function MediaTile({ m, onOpen }: { m: MediaItem; onOpen: () => void }) {
  const iso = m.kind === "photo" ? m.createdAt : m.voice.createdAt;
  const date = new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (m.kind === "photo") {
    return (
      <button onClick={onOpen}
        className="group relative aspect-square rounded-2xl overflow-hidden transition hover:-translate-y-0.5"
        style={{ background: surface2, border: `1px solid ${border}` }}>
        <img src={m.url} alt="" className="w-full h-full object-cover transition group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 text-left"
          style={{ background: "linear-gradient(to top, rgba(29,42,68,0.7), transparent)" }}>
          <div className="text-[10px] text-white/80">{date}</div>
          <div className="text-[11px] text-white line-clamp-1">{m.title}</div>
        </div>
      </button>
    );
  }
  return (
    <button onClick={onOpen}
      className="group relative aspect-square rounded-2xl p-4 flex flex-col justify-between text-left transition hover:-translate-y-0.5"
      style={{ background: "linear-gradient(135deg, rgba(213,201,247,0.35), rgba(175,201,245,0.25))", border: `1px solid ${border}` }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface }}>
        <Mic className="w-4 h-4" style={{ color: primary }} />
      </div>
      <VoiceWave />
      <div>
        <div className="text-[10px] opacity-60">{date} · {Math.round(m.voice.duration)}s</div>
        <div className="text-[12px] font-['Fraunces',serif] italic line-clamp-2 mt-1">
          {m.voice.transcript ? m.voice.transcript.slice(0, 60) + (m.voice.transcript.length > 60 ? "…" : "") : "voice note"}
        </div>
      </div>
    </button>
  );
}

function VoiceWave() {
  const bars = Array.from({ length: 22 }, (_, i) => 6 + Math.abs(Math.sin(i * 0.9)) * 24);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {bars.map((h, i) => (
        <div key={i} className="w-[3px] rounded-full" style={{ height: `${h}px`, background: primary, opacity: 0.4 + (i % 5) * 0.1 }} />
      ))}
    </div>
  );
}

function MediaLightbox({ m, onClose }: { m: MediaItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(15,20,35,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{ background: surface, border: `1px solid ${border}` }}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: surface2 }} aria-label="close">
          <X className="w-4 h-4" />
        </button>
        {m.kind === "photo" ? (
          <img src={m.url} alt="" className="w-full max-h-[70vh] object-contain" style={{ background: "#000" }} />
        ) : (
          <div className="p-8">
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-2">voice note</div>
            <div className="font-['Fraunces',serif] text-[24px] font-light mb-4 italic">{m.title}</div>
            <audio controls src={m.voice.dataUrl} className="w-full" />
            {m.voice.transcript && (
              <div className="mt-5 p-4 rounded-2xl text-[13.5px] leading-relaxed"
                style={{ background: surface2, border: `1px solid ${border}` }}>
                {m.voice.transcript}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${border}` }}>
          <div>
            <div className="text-[10px] opacity-60">{new Date(m.kind === "photo" ? m.createdAt : m.voice.createdAt).toLocaleString()}</div>
            <div className="text-[13px] mt-0.5">{m.title}</div>
          </div>
          <Link to="/journal/$id" params={{ id: m.entryId }}
            className="h-9 px-4 rounded-full text-[12px] inline-flex items-center gap-2"
            style={{ background: ink, color: "#fff" }}>
            open entry <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
