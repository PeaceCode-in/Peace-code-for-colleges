import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, HandHeart, Bookmark, Share2, Flag, Filter } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import {
  loadCommunity, loadEntries, loadReactions, saveReactions, loadBookmarks, saveBookmarks,
  loadHidden, saveHidden, userAsCommunity, loadPrefs, CATEGORIES,
  type CommunityEntry, type Category,
} from "@/lib/gratitude-store";

export const Route = createFileRoute("/gratitude/wall")({
  head: () => ({ meta: [{ title: "Community Wall — Gratitude" }, { name: "description", content: "Anonymous gratitude from students across India." }] }),
  component: WallPage,
});

type Sort = "recent" | "trending" | "anonymous";

function WallPage() {
  const { ink, muted, border, primary, surface, surface2 } = palette;
  const [feed, setFeed] = useState<CommunityEntry[]>([]);
  const [reactions, setReactions] = useState<ReturnType<typeof loadReactions>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("trending");
  const [cat, setCat] = useState<Category | "all">("all");
  const [college, setCollege] = useState<string>("all");

  useEffect(() => {
    const prefs = loadPrefs();
    const userPublic = loadEntries()
      .filter((e) => e.privacy !== "private")
      .map((e) => userAsCommunity(e, prefs.hideIdentity));
    const community = loadCommunity();
    setFeed([...userPublic, ...community]);
    setReactions(loadReactions());
    setBookmarks(loadBookmarks());
    setHidden(loadHidden());
  }, []);

  const colleges = useMemo(() => {
    const s = new Set<string>();
    feed.forEach((f) => f.college && s.add(f.college));
    return ["all", ...s];
  }, [feed]);

  const filtered = useMemo(() => {
    let list = feed.filter((f) => !hidden.includes(f.id));
    if (cat !== "all") list = list.filter((f) => f.category === cat);
    if (college !== "all") list = list.filter((f) => f.college === college);
    if (sort === "anonymous") list = list.filter((f) => f.anonymous);
    if (sort === "recent") list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "trending") list = [...list].sort((a, b) => (b.hearts + b.likes + b.supports * 2) - (a.hearts + a.likes + a.supports * 2));
    return list;
  }, [feed, hidden, cat, college, sort]);

  function toggleReaction(id: string, key: "liked" | "hearted" | "supported") {
    const next = { ...reactions, [id]: { ...reactions[id], [key]: !reactions[id]?.[key] } };
    setReactions(next); saveReactions(next);
    // reflect on feed counter for instant feedback
    setFeed((f) => f.map((c) => {
      if (c.id !== id) return c;
      const delta = next[id]?.[key] ? 1 : -1;
      if (key === "liked") return { ...c, likes: Math.max(0, c.likes + delta) };
      if (key === "hearted") return { ...c, hearts: Math.max(0, c.hearts + delta) };
      return { ...c, supports: Math.max(0, c.supports + delta) };
    }));
  }
  function toggleBookmark(id: string) {
    const next = bookmarks.includes(id) ? bookmarks.filter((x) => x !== id) : [...bookmarks, id];
    setBookmarks(next); saveBookmarks(next);
  }
  function report(id: string) {
    if (!confirm("Report this and hide from your wall?")) return;
    const next = [...hidden, id]; setHidden(next); saveHidden(next);
  }
  function share(c: CommunityEntry) {
    const text = c.body + "\n\nshared from peacecode gratitude wall";
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else { navigator.clipboard.writeText(text); alert("copied to clipboard"); }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/gratitude" className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 mb-6" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3" /> back to gratitude
        </Link>
        <h1 className="font-serif italic text-4xl sm:text-5xl leading-[1.05]" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
          the wall
        </h1>
        <p className="mt-3 max-w-lg text-sm" style={{ color: muted }}>quiet notes from students across the country. send a heart when something lands.</p>

        {/* filter bar */}
        <div className="mt-8 flex flex-wrap gap-2 items-center">
          <div className="inline-flex text-[11px] rounded-full p-0.5" style={{ border: `1px solid ${border}` }}>
            {(["trending", "recent", "anonymous"] as Sort[]).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                      className="px-3 py-1.5 rounded-full transition"
                      style={{ background: sort === s ? primary : "transparent", color: sort === s ? "white" : muted }}>{s}</button>
            ))}
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value as Category | "all")}
                  className="text-[11px] rounded-full px-3 py-1.5 bg-transparent" style={{ border: `1px solid ${border}`, color: muted }}>
            <option value="all">all categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={college} onChange={(e) => setCollege(e.target.value)}
                  className="text-[11px] rounded-full px-3 py-1.5 bg-transparent" style={{ border: `1px solid ${border}`, color: muted }}>
            {colleges.map((c) => <option key={c} value={c}>{c === "all" ? "all colleges" : c}</option>)}
          </select>
          <div className="ml-auto text-[10px] tracking-[0.24em] uppercase opacity-60" style={{ color: muted }}>
            {filtered.length} notes
          </div>
        </div>

        {/* feed */}
        <ul className="mt-6 space-y-3">
          {filtered.map((c) => {
            const r = reactions[c.id] ?? {};
            const bm = bookmarks.includes(c.id);
            return (
              <li key={c.id} className="rounded-3xl p-5 transition" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 text-[11px] mb-2" style={{ color: muted }}>
                  <span>{c.anonymous ? "anonymous" : c.authorName ?? "someone"}</span>
                  {c.college && <><span>·</span><span>{c.college}</span></>}
                  <span>·</span><span>{c.category}</span>
                  <span className="ml-auto">{new Date(c.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                </div>
                <p className="text-[15px] leading-relaxed" style={{ color: ink }}>{c.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <ActionBtn active={!!r.liked} onClick={() => toggleReaction(c.id, "liked")} icon={<Heart className="w-3.5 h-3.5" fill={r.liked ? "currentColor" : "none"} />} count={c.likes} />
                  <ActionBtn active={!!r.hearted} onClick={() => toggleReaction(c.id, "hearted")} icon={<span>💛</span>} count={c.hearts} label="heart" />
                  <ActionBtn active={!!r.supported} onClick={() => toggleReaction(c.id, "supported")} icon={<HandHeart className="w-3.5 h-3.5" />} count={c.supports} label="support" />
                  <button onClick={() => toggleBookmark(c.id)} className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full transition hover:opacity-100 opacity-70"
                          style={{ color: bm ? primary : muted }}>
                    <Bookmark className="w-3.5 h-3.5" fill={bm ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => share(c)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full opacity-70 hover:opacity-100" style={{ color: muted }}>
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => report(c.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full opacity-40 hover:opacity-80" style={{ color: muted }}>
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="text-sm opacity-60 py-10 text-center" style={{ color: muted }}>nothing matches. try a different filter.</li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}

function ActionBtn({ active, onClick, icon, count, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; count: number; label?: string }) {
  const { border, muted, primary } = palette;
  return (
    <button onClick={onClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition"
            style={{ border: `1px solid ${border}`, color: active ? primary : muted, background: active ? "rgba(75,108,183,0.08)" : "transparent" }}>
      {icon}<span className="tabular-nums">{count}</span>{label && <span className="opacity-70">{label}</span>}
    </button>
  );
}
