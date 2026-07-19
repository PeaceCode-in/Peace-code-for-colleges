import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, MessageCircle, Bookmark, ChevronRight, Sparkles, Flame, Circle, Search } from "lucide-react";
import { cmy } from "@/lib/community-theme";
import { community, useCommunity, timeAgo } from "@/lib/community-store";

export const Route = createFileRoute("/community/threads")({ component: ThreadsPage });

type Sort = "soft" | "warm" | "new";

function ThreadsPage() {
  const { threads, circles, savedThreadIds } = useCommunity();
  const [sort, setSort] = useState<Sort>("soft");
  const [query, setQuery] = useState("");
  const [circleFilter, setCircleFilter] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    let list = [...threads];
    if (circleFilter !== "all") list = list.filter((t) => t.circleSlug === circleFilter);
    if (query.trim()) {
      const s = query.toLowerCase();
      list = list.filter((t) => (t.title + t.body).toLowerCase().includes(s));
    }
    if (sort === "warm") list.sort((a, b) => b.votes - a.votes);
    else if (sort === "new") list.sort((a, b) => b.createdAt - a.createdAt);
    else list.sort((a, b) => b.votes * 0.6 + (Date.now() - b.createdAt) * -1e-9 - (a.votes * 0.6 + (Date.now() - a.createdAt) * -1e-9));
    return list;
  }, [threads, sort, query, circleFilter]);

  return (
    <main className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-24">
      <header className="mb-6 lg:mb-10">
        <div className="text-[9px] tracking-[0.32em] uppercase mb-3" style={{ color: cmy.muted }}>the circle · threads</div>
        <h1 className="font-serif text-[clamp(1.6rem,5vw,2.6rem)] tracking-tight leading-[1.05]">quiet letters, left open.</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          {/* controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex items-center gap-2 h-11 rounded-full px-4 flex-1"
                 style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
              <Search className="w-4 h-4" style={{ color: cmy.muted }}/>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search a feeling…"
                     className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: cmy.ink }}/>
            </div>
            <select value={circleFilter} onChange={(e) => setCircleFilter(e.target.value)}
                    className="h-11 px-4 rounded-full text-[13px] outline-none"
                    style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.ink }}>
              <option value="all">all circles</option>
              {circles.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 mb-5 overflow-x-auto scrollbar-none">
            {([
              { k: "soft" as const, label: "softly ordered", icon: Sparkles },
              { k: "warm" as const, label: "warmest",        icon: Flame },
              { k: "new"  as const, label: "newest first",   icon: Circle },
            ]).map((s) => {
              const active = sort === s.k;
              const Icon = s.icon;
              return (
                <button key={s.k} onClick={() => setSort(s.k)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[11.5px] tracking-wide transition"
                        style={{
                          background: active ? cmy.surface2 : "transparent",
                          color: active ? cmy.ink : cmy.muted,
                          border: `1px solid ${active ? cmy.border : "transparent"}`,
                        }}>
                  <Icon className="w-3 h-3" strokeWidth={1.6}/> {s.label}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[22px] p-8 text-center text-[13px]" style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.muted }}>
              no threads match. try a softer word — or offer the first.
            </div>
          ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((t) => {
              const circle = circles.find((c) => c.slug === t.circleSlug);
              const isSaved = savedThreadIds.includes(t.id);
              return (
                <article key={t.id}
                         className="group relative flex gap-3 sm:gap-5 p-4 sm:p-6 rounded-[22px] sm:rounded-[24px] transition hover:-translate-y-0.5"
                         style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
                  <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <button onClick={() => community.voteThread(t.id, 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-[--h]"
                            style={{ ["--h" as any]: cmy.surface2, color: cmy.muted }}>
                      <ArrowUp className="w-4 h-4" strokeWidth={1.8}/>
                    </button>
                    <span className="font-serif text-[15px]" style={{ color: cmy.ink }}>{t.votes}</span>
                    <button onClick={() => community.voteThread(t.id, -1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-[--h]"
                            style={{ ["--h" as any]: cmy.surface2, color: cmy.muted }}>
                      <ArrowDown className="w-4 h-4" strokeWidth={1.8}/>
                    </button>
                  </div>

                  <Link to={`/community/threads/${t.id}`} className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-[10.5px] tracking-[0.2em] sm:tracking-[0.24em] uppercase" style={{ color: cmy.muted }}>
                      <span className="rounded-full px-2 py-0.5" style={{ background: cmy.surface2, color: cmy.ink }}>{circle?.name ?? t.circleSlug}</span>
                      <span>·</span><span>{t.author}</span><span>·</span><span>{timeAgo(t.createdAt)}</span>
                    </div>
                    <h3 className="mt-3 font-serif text-[20px] sm:text-[22px] leading-[1.2] tracking-tight">{t.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed line-clamp-2" style={{ color: cmy.muted }}>{t.body}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-5 text-[12px]" style={{ color: cmy.muted }}>
                      <span className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" strokeWidth={1.6}/> {community.commentsFor(t.id).length} held it</span>
                      <button onClick={(e) => { e.preventDefault(); community.toggleSave(t.id); }}
                              className="flex items-center gap-1.5 transition"
                              style={{ color: isSaved ? cmy.primary : cmy.muted }}>
                        <Bookmark className="w-3.5 h-3.5" strokeWidth={1.6} fill={isSaved ? cmy.primary : "transparent"}/>
                        {isSaved ? "kept" : "keep"}
                      </button>
                      <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition" style={{ color: cmy.ink }}>
                        open <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6}/>
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>)}
        </div>

        {/* right rail */}
        <aside className="hidden lg:flex flex-col gap-5">
          <div className="rounded-[24px] p-6" style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
            <div className="text-[9.5px] tracking-[0.32em] uppercase mb-4" style={{ color: cmy.muted }}>softly rising</div>
            <div className="flex flex-col gap-3">
              {[...threads].sort((a,b) => b.votes - a.votes).slice(0, 5).map((t) => (
                <Link key={t.id} to={`/community/threads/${t.id}`} className="flex items-center justify-between text-[13px] gap-3">
                  <span className="font-serif truncate" style={{ color: cmy.ink }}>{t.title}</span>
                  <span className="text-[10.5px] shrink-0" style={{ color: cmy.muted }}>{t.votes}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] p-6" style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
            <div className="text-[9.5px] tracking-[0.32em] uppercase mb-3" style={{ color: cmy.muted }}>your kept threads</div>
            {savedThreadIds.length === 0 ? (
              <div className="text-[12.5px]" style={{ color: cmy.muted }}>nothing kept yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {savedThreadIds.slice(0, 5).map((id) => {
                  const t = threads.find((x) => x.id === id); if (!t) return null;
                  return <Link key={id} to={`/community/threads/${id}`} className="text-[12.5px] font-serif truncate" style={{ color: cmy.ink }}>{t.title}</Link>;
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
