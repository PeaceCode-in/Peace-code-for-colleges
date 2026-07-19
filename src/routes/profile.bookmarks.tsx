import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, BookOpen, Play, Feather, MessageCircle, Trash2 } from "lucide-react";
import { loadProfile, saveProfile, type Bookmark } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, soft, Panel, Toasts, pushToast } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/bookmarks")({
  head: () => ({ meta: [{ title: "Saved resources · PeaceCode" }] }),
  component: BookmarksPage,
});

const ICONS: Record<Bookmark["kind"], React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  article: BookOpen, video: Play, meditation: Feather, exercise: Feather, post: MessageCircle,
};

function BookmarksPage() {
  const [p, setP] = useState(loadProfile());
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | Bookmark["kind"]>("all");

  const list = useMemo(() => p.bookmarks.filter((b) =>
    (kind === "all" || b.kind === kind) && (q === "" || b.title.toLowerCase().includes(q.toLowerCase()))
  ), [p, kind, q]);

  const remove = (id: string) => {
    const next = { ...p, bookmarks: p.bookmarks.filter((b) => b.id !== id) };
    setP(next); saveProfile(next); pushToast("Removed");
  };

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-4xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Saved shelf</h1>
      <p className="text-[13px] mb-6" style={{ color: muted }}>Everything you've quietly bookmarked.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full flex-1" style={{ background: surface2, border: `1px solid ${border}` }}>
          <Search className="w-3.5 h-3.5 opacity-50"/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shelf…"
            className="bg-transparent outline-none text-[12.5px] flex-1"/>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["all", "article", "video", "meditation", "exercise", "post"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)}
              className="px-3 py-1.5 rounded-full text-[11.5px] capitalize whitespace-nowrap"
              style={{ background: kind === k ? ink : surface2, color: kind === k ? "var(--pc-bg)" : ink }}>{k}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl p-10 text-center" style={{ background: surface, border: `1px dashed ${border}` }}>
          <div className="font-serif text-[18px]" style={{ color: ink }}>Nothing saved yet.</div>
          <Link to="/resources" className="mt-3 inline-block text-[12px]" style={{ color: primary }}>Browse resources →</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((b) => {
            const Icon = ICONS[b.kind];
            return (
              <Panel key={b.id} className="!p-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl grid place-items-center shrink-0" style={{ background: soft }}>
                    <Icon className="w-4 h-4" style={{ color: primary }}/>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>{b.kind}</div>
                    <div className="font-serif text-[15px] leading-tight mt-1" style={{ color: ink }}>{b.title}</div>
                    <div className="text-[11px] mt-1" style={{ color: muted }}>{b.source}</div>
                  </div>
                  <button onClick={() => remove(b.id)} className="w-7 h-7 rounded-full grid place-items-center shrink-0"
                          style={{ background: surface2, color: muted }} aria-label="remove"><Trash2 className="w-3 h-3"/></button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Toasts/>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none } .no-scrollbar { scrollbar-width: none }`}</style>
    </div>
  );
}
