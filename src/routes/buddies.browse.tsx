import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { BUDDIES, ALL_TOPICS, favorites, toggleFavorite, avatarFor, type Buddy } from "@/lib/buddies-store";
import { ArrowLeft, Search, Star, Sparkles, Heart, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/buddies/browse")({
  head: () => ({ meta: [{ title: "Browse Peace Buddies" }] }),
  component: Browse,
});

type Filters = {
  q: string;
  onlineOnly: boolean;
  topic: string;
  language: string;
  college: string;
  gender: string;
  responseTime: "any" | "fast" | "instant";
  sort: "rated" | "recent" | "sessions";
};

function Browse() {
  const { surface, surface2, border, ink, muted, primary } = palette;
  const [f, setF] = useState<Filters>({ q: "", onlineOnly: false, topic: "", language: "", college: "", gender: "", responseTime: "any", sort: "rated" });
  const [favs, setFavs] = useState<string[]>(favorites());
  const [showFilters, setShowFilters] = useState(false);

  const langs = Array.from(new Set(BUDDIES.flatMap((b) => b.languages))).sort();
  const colleges = Array.from(new Set(BUDDIES.map((b) => b.college))).sort();

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    let list: Buddy[] = BUDDIES.filter((b) => {
      if (f.onlineOnly && !b.online) return false;
      if (f.topic && !b.topics.includes(f.topic)) return false;
      if (f.language && !b.languages.includes(f.language)) return false;
      if (f.college && b.college !== f.college) return false;
      if (f.gender && b.gender !== f.gender) return false;
      if (f.responseTime === "fast" && b.responseMin > 10) return false;
      if (f.responseTime === "instant" && b.responseMin > 5) return false;
      if (q) {
        const hay = `${b.name} ${b.course} ${b.college} ${b.languages.join(" ")} ${b.interests.join(" ")} ${b.topics.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (f.sort === "rated") list = list.sort((a, b) => b.rating - a.rating);
    else if (f.sort === "sessions") list = list.sort((a, b) => b.sessions - a.sessions);
    else list = list.sort((a, b) => (a.online === b.online ? 0 : a.online ? -1 : 1));
    return list;
  }, [f]);

  const toggleFav = (id: string) => { toggleFavorite(id); setFavs(favorites()); };

  const Chip = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick} className="text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap transition"
      style={{ background: active ? ink : surface, color: active ? surface : muted, border: `1px solid ${border}` }}>{children}</button>
  );

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight mb-1" style={{ color: ink }}>Find your buddy</h1>
        <p className="text-[13px] mb-6" style={{ color: muted }}>{filtered.length} of {BUDDIES.length} verified peer listeners</p>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-full px-4 py-2.5 mb-4" style={{ background: surface, border: `1px solid ${border}` }}>
          <Search className="w-4 h-4 opacity-40"/>
          <input value={f.q} onChange={(e)=>setF({...f, q: e.target.value})}
            placeholder="name, language, interest, topic, college…"
            className="bg-transparent outline-none text-[13px] flex-1" style={{ color: ink }}/>
          {f.q && <button onClick={()=>setF({...f, q:""})}><X className="w-3 h-3 opacity-50"/></button>}
          <button onClick={()=>setShowFilters(!showFilters)} className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: surface2 }}>
            <SlidersHorizontal className="w-3 h-3"/> filters
          </button>
        </div>

        {/* Quick chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
          <Chip active={f.onlineOnly} onClick={()=>setF({...f, onlineOnly: !f.onlineOnly})}>Available now</Chip>
          <Chip active={f.responseTime==="instant"} onClick={()=>setF({...f, responseTime: f.responseTime==="instant" ? "any":"instant"})}>Instant reply</Chip>
          <Chip active={f.sort==="rated"} onClick={()=>setF({...f, sort:"rated"})}>Highly rated</Chip>
          <Chip active={f.sort==="sessions"} onClick={()=>setF({...f, sort:"sessions"})}>Most experienced</Chip>
          <Chip active={f.sort==="recent"} onClick={()=>setF({...f, sort:"recent"})}>Recently active</Chip>
        </div>

        {showFilters && (
          <div className="rounded-2xl p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <FilterSelect label="Topic" value={f.topic} onChange={(v)=>setF({...f, topic:v})} options={["", ...ALL_TOPICS]}/>
            <FilterSelect label="Language" value={f.language} onChange={(v)=>setF({...f, language:v})} options={["", ...langs]}/>
            <FilterSelect label="College" value={f.college} onChange={(v)=>setF({...f, college:v})} options={["", ...colleges]}/>
            <FilterSelect label="Gender" value={f.gender} onChange={(v)=>setF({...f, gender:v})} options={["", "she/her","he/him","they/them"]}/>
          </div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="flex items-start gap-3">
                <div className="relative"><img src={avatarFor(b.id)} className="w-14 h-14 rounded-2xl" style={{ background: surface2 }} alt=""/>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2" style={{ background: b.online ? "#22c55e" : "#a1a1aa", borderColor: surface }}/></div>
                <div className="flex-1 min-w-0">
                  <Link to="/buddies/$id" params={{ id: b.id }} className="flex items-center gap-1">
                    <span className="font-serif text-[15px] truncate" style={{ color: ink }}>{b.name}</span>
                    {b.verified && <Sparkles className="w-3 h-3" style={{ color: primary }}/>}
                  </Link>
                  <div className="text-[11px] truncate" style={{ color: muted }}>{b.course} · {b.year}</div>
                  <div className="text-[10.5px] mt-0.5" style={{ color: muted }}>{b.college}</div>
                </div>
                <button onClick={()=>toggleFav(b.id)} aria-label="favorite">
                  <Heart className="w-4 h-4" style={{ color: favs.includes(b.id) ? primary : muted }} fill={favs.includes(b.id) ? "currentColor" : "none"}/>
                </button>
              </div>

              <p className="text-[12px] italic line-clamp-2" style={{ color: ink, opacity: 0.7 }}>&ldquo;{b.bio}&rdquo;</p>

              <div className="flex flex-wrap gap-1">
                {b.specializations.slice(0,3).map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: surface2, color: muted }}>{s}</span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] pt-2" style={{ borderTop: `1px solid ${border}` }}>
                <Stat label="rating" val={<><Star className="w-2.5 h-2.5 inline mr-0.5" fill="currentColor"/> {b.rating}</>}/>
                <Stat label="reply" val={`~${b.responseMin}m`}/>
                <Stat label="sessions" val={b.sessions}/>
              </div>

              <div className="flex gap-2 mt-1">
                <Link to="/buddies/$id" params={{ id: b.id }} className="flex-1 py-2 rounded-full text-[11px] text-center" style={{ background: surface2, color: ink }}>view</Link>
                <Link to="/buddies/guidelines/$id" params={{ id: b.id }} className="flex-1 py-2 rounded-full text-[11px] text-center" style={{ background: ink, color: surface }}>chat</Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: muted }}>
            <p className="font-serif text-[16px] mb-2">no buddies match those filters</p>
            <button onClick={()=>setF({ q:"", onlineOnly:false, topic:"", language:"", college:"", gender:"", responseTime:"any", sort:"rated" })} className="text-[11px] underline">clear filters</button>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const { muted, ink, border } = palette;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: muted }}>{label}</span>
      <select value={value} onChange={(e)=>onChange(e.target.value)} className="text-[12px] px-3 py-2 rounded-xl bg-transparent outline-none" style={{ border: `1px solid ${border}`, color: ink }}>
        {options.map((o) => <option key={o} value={o}>{o || "any"}</option>)}
      </select>
    </label>
  );
}

function Stat({ label, val }: { label: string; val: React.ReactNode }) {
  const { muted, ink } = palette;
  return <div><div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: muted }}>{label}</div><div className="text-[11px]" style={{ color: ink }}>{val}</div></div>;
}
