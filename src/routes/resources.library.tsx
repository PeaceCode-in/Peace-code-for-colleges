import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { useResourceStore, byId, continueLearning } from "@/lib/resources-store";
import { useMemo, useState } from "react";
import { Bookmark, CheckCircle2, Download, History as HistoryIcon, StickyNote, Highlighter, PlayCircle } from "lucide-react";

const TABS = ["Saved","Completed","Continue","Downloads","Notes","Highlights"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/resources/library")({
  head: () => ({ meta: [{ title: "My Library — PeaceCode" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const snap = useResourceStore();
  const [tab, setTab] = useState<Tab>("Saved");
  const cont = useMemo(() => continueLearning(), [snap]);

  const saved = snap.bookmarks.map(id => byId(id)).filter(Boolean) as any[];
  const done = snap.completed.map(id => byId(id)).filter(Boolean) as any[];
  const downloads = snap.downloads.map(id => byId(id)).filter(Boolean) as any[];
  const notesList = Object.entries(snap.notes).flatMap(([rid, arr]) => arr.map(n => ({ ...n, rid })));
  const highlightList = Object.entries(snap.highlights).flatMap(([rid, arr]) => arr.map(h => ({ h, rid })));

  return (
    <AppShell>
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-8">
          <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Personal</div>
          <h1 className="font-serif text-[34px] sm:text-[42px]" style={{ color: "var(--pc-ink)" }}>My library</h1>
          <p className="text-[14px] mt-2 max-w-[560px]" style={{ color: "var(--pc-muted)" }}>Everything you've saved, finished, downloaded, or written a note on.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <Stat icon={Bookmark} n={saved.length} label="Saved"/>
          <Stat icon={CheckCircle2} n={done.length} label="Completed"/>
          <Stat icon={PlayCircle} n={cont.length} label="Continue"/>
          <Stat icon={Download} n={downloads.length} label="Downloads"/>
          <Stat icon={StickyNote} n={notesList.length} label="Notes"/>
          <Stat icon={Highlighter} n={highlightList.length} label="Highlights"/>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-full text-[12px] transition"
              style={{ background: tab === t ? "var(--pc-soft)" : "var(--pc-surface)", border: "1px solid var(--pc-border)", color: tab === t ? "var(--pc-primary)" : "var(--pc-muted)" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Saved" && <Grid items={saved} empty="Nothing saved yet — tap the bookmark on any resource."/>}
        {tab === "Completed" && <Grid items={done} empty="You'll see finished pieces here."/>}
        {tab === "Continue" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cont.length === 0 && <Empty text="Nothing paused. Start reading something today."/>}
            {cont.map(({ resource, progress }) => (
              <div key={resource.id}>
                <ResourceCard r={resource}/>
                <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: "var(--pc-muted)" }}>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "var(--pc-surface2)" }}>
                    <div className="h-full rounded-full" style={{ width: `${progress*100}%`, background: "var(--pc-primary)" }}/>
                  </div>
                  <span>{Math.round(progress*100)}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "Downloads" && (
          <>
            <p className="text-[12px] mb-4" style={{ color: "var(--pc-muted)" }}>Marked for offline. Video downloads are placeholders on the web.</p>
            <Grid items={downloads} empty="No downloads yet."/>
          </>
        )}
        {tab === "Notes" && (
          <div className="space-y-3">
            {notesList.length === 0 && <Empty text="You haven't written any notes yet."/>}
            {notesList.map((n, i) => {
              const r = byId(n.rid); if (!r) return null;
              return (
                <Link key={i} to="/resources/r/$id" params={{ id: n.rid }} className="block rounded-2xl p-4"
                  style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
                  <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "var(--pc-muted)" }}>{r.title}</div>
                  {n.quote && <div className="text-[12px] italic mb-1" style={{ color: "var(--pc-muted)" }}>"{n.quote}"</div>}
                  <div className="text-[14px]" style={{ color: "var(--pc-ink)" }}>{n.body}</div>
                </Link>
              );
            })}
          </div>
        )}
        {tab === "Highlights" && (
          <div className="space-y-3">
            {highlightList.length === 0 && <Empty text="No highlights yet — select text while reading to save it."/>}
            {highlightList.map((h, i) => {
              const r = byId(h.rid); if (!r) return null;
              return (
                <Link key={i} to="/resources/r/$id" params={{ id: h.rid }} className="block rounded-2xl p-4"
                  style={{ background: "var(--pc-surface)", borderLeft: "3px solid var(--pc-primary)", border: "1px solid var(--pc-border)" }}>
                  <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "var(--pc-muted)" }}>{r.title}</div>
                  <div className="text-[14px]" style={{ color: "var(--pc-ink)" }}>"{h.h}"</div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Stat({ icon: Icon, n, label }: { icon: any; n: number; label: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
      <Icon className="w-4 h-4 mb-2" style={{ color: "var(--pc-primary)" }}/>
      <div className="font-serif text-[22px]" style={{ color: "var(--pc-ink)" }}>{n}</div>
      <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "var(--pc-muted)" }}>{label}</div>
    </div>
  );
}
function Grid({ items, empty }: { items: any[]; empty: string }) {
  if (items.length === 0) return <Empty text={empty}/>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{items.map(r => <ResourceCard key={r.id} r={r}/>)}</div>;
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl p-10 text-center" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
      <div className="text-4xl mb-3">🕯️</div>
      <div className="text-[13px]" style={{ color: "var(--pc-muted)" }}>{text}</div>
      <Link to="/resources" className="inline-block mt-4 text-[12px] px-4 py-2 rounded-full" style={{ background: "var(--pc-primary)", color: "#fff" }}>Explore library</Link>
    </div>
  );
}
