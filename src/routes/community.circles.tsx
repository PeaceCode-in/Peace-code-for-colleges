import { createFileRoute, Link } from "@tanstack/react-router";
import { Hash, ChevronRight, Users, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cmy } from "@/lib/community-theme";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/community/circles")({ component: CirclesPage });

function CirclesPage() {
  const { circles, joinedCircles } = useCommunity();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "joined" | "live">("all");

  const list = useMemo(() => {
    let list = circles;
    if (filter === "joined") list = list.filter((c) => joinedCircles.includes(c.slug));
    if (filter === "live") list = list.filter((c) => c.live > 20);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((c) => (c.name + c.description + c.tag).toLowerCase().includes(s));
    }
    return list;
  }, [circles, joinedCircles, q, filter]);

  return (
    <main className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-24">
      <header className="mb-6 lg:mb-10">
        <div className="text-[9px] tracking-[0.32em] uppercase mb-3" style={{ color: cmy.muted }}>the circle · circles</div>
        <h1 className="font-serif text-[clamp(1.6rem,5vw,2.6rem)] tracking-tight leading-[1.05]">rooms for the same feeling.</h1>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 h-11 rounded-full px-4 flex-1"
             style={{ background: cmy.surface, border: `1px solid ${cmy.border}` }}>
          <Search className="w-4 h-4" strokeWidth={1.5} style={{ color: cmy.muted }}/>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="a circle for a feeling…"
                 className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: cmy.ink }}/>
        </div>
        <div className="flex items-center gap-1.5">
          {(["all","joined","live"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
                    className="h-11 px-4 rounded-full text-[12px] tracking-wide transition"
                    style={{
                      background: filter === k ? cmy.ink : cmy.surface,
                      color: filter === k ? "#F7FAFF" : cmy.ink,
                      border: `1px solid ${filter === k ? cmy.ink : cmy.border}`,
                    }}>{k}</button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-[22px] p-8 text-center text-[13px]" style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, color: cmy.muted }}>
          no circle for that word yet.
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((c, i) => {
          const joined = joinedCircles.includes(c.slug);
          return (
            <Link key={c.slug} to={`/community/circles/${c.slug}`}
                  className="group relative overflow-hidden rounded-[28px] p-6 transition duration-300 hover:-translate-y-1"
                  style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, boxShadow: "0 1px 2px rgba(29,42,68,0.03)" }}>
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                   style={{ background: `radial-gradient(circle, ${c.accent}, transparent 70%)` }}/>
              <div className="absolute right-5 bottom-3 font-serif italic text-[80px] leading-none opacity-[0.06]" style={{ color: cmy.ink }}>
                0{i + 1}
              </div>
              <div className="relative flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-6" style={{ color: cmy.muted }}>
                <Hash className="w-3 h-3" strokeWidth={1.6}/> {c.tag}
                {joined && <span className="ml-2 rounded-full px-2 py-0.5 text-[9px]" style={{ background: cmy.mint, color: cmy.ink }}>joined</span>}
              </div>
              <h3 className="relative font-serif text-[24px] leading-tight tracking-tight max-w-[220px]">{c.name}</h3>
              <p className="relative mt-3 text-[12.5px] leading-relaxed line-clamp-2" style={{ color: cmy.muted }}>{c.description}</p>
              <div className="relative mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11.5px]" style={{ color: cmy.muted }}>
                  <Users className="w-3.5 h-3.5" strokeWidth={1.6}/> {c.members} kin · <span style={{ color: cmy.ink }}>{c.live} here now</span>
                </div>
                <span className="flex items-center gap-1 text-[12px] transition group-hover:translate-x-1" style={{ color: cmy.ink }}>
                  enter <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.6}/>
                </span>
              </div>
            </Link>
          );
        })}
      </div>)}
    </main>
  );
}
