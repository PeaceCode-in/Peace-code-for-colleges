// Mind Gym — Exercise Library with search, filters, sort.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Clock, Zap, Filter, X } from "lucide-react";
import { EXERCISES, PATHS, useMindGym, type Difficulty } from "@/lib/mindgym-store";

export const Route = createFileRoute("/mindgym/library")({
  component: LibraryPage,
});

const DURATIONS = [
  { key: "any", label: "Any duration", test: () => true },
  { key: "u3",  label: "Under 3 min", test: (m: number) => m < 3 },
  { key: "35",  label: "3–5 min", test: (m: number) => m >= 3 && m <= 5 },
  { key: "5p",  label: "5+ min", test: (m: number) => m > 5 },
];

function LibraryPage() {
  const s = useMindGym();
  const [q, setQ] = useState("");
  const [path, setPath] = useState<string>("any");
  const [diff, setDiff] = useState<Difficulty | "any">("any");
  const [mood, setMood] = useState<string>("any");
  const [dur, setDur] = useState<string>("any");
  const [sort, setSort] = useState<"recommended" | "newest" | "popular" | "short">("recommended");

  const filtered = useMemo(() => {
    const durFn = DURATIONS.find(d => d.key === dur)?.test ?? (() => true);
    let list = EXERCISES.filter(e =>
      (path === "any" || e.path === path) &&
      (diff === "any" || e.difficulty === diff) &&
      (mood === "any" || e.mood === mood) &&
      durFn(e.minutes) &&
      (q.trim() === "" || (e.name + e.purpose + e.type).toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "short")   list = list.slice().sort((a, b) => a.minutes - b.minutes);
    if (sort === "newest")  list = list.slice().reverse();
    if (sort === "popular") list = list.slice().sort((a, b) => b.xp - a.xp);
    if (sort === "recommended") {
      const weakest = Object.entries(s.brain).sort((a,b)=>a[1]-b[1])[0]?.[0];
      list = list.slice().sort((a, b) => (b.skills.includes(weakest as any) ? 1 : 0) - (a.skills.includes(weakest as any) ? 1 : 0));
    }
    return list;
  }, [q, path, diff, mood, dur, sort, s.brain]);

  const hasFilters = path !== "any" || diff !== "any" || mood !== "any" || dur !== "any" || q !== "";

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      <Link to="/mindgym" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase mb-4 hover:opacity-70" style={{ color: "var(--pc-muted)" }}>
        <ArrowLeft className="w-3 h-3"/> Mind Gym
      </Link>
      <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Exercise Library</div>
      <h1 className="font-serif text-[34px] sm:text-[42px] leading-[1.05] max-w-[720px]" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
        Every rep in one place.
      </h1>

      {/* Search */}
      <div className="mt-6 flex items-center gap-3 rounded-full px-5 py-3 max-w-[640px]"
        style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
        <Search className="w-4 h-4 opacity-60"/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search focus, memory, breathing…"
          className="bg-transparent outline-none flex-1 text-[14px]" style={{ color: "var(--pc-ink)" }}/>
        {q && <button onClick={()=>setQ("")}><X className="w-4 h-4 opacity-60"/></button>}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <Filter className="w-3.5 h-3.5 opacity-60"/>
        <FilterSelect value={path} onChange={setPath} options={[{ v: "any", l: "All paths" }, ...PATHS.map(p => ({ v: p.slug, l: p.name }))]}/>
        <FilterSelect value={diff} onChange={v=>setDiff(v as any)} options={[{ v: "any", l: "All levels" }, ...(["Beginner","Intermediate","Advanced","Master"].map(x=>({ v: x, l: x })))]}/>
        <FilterSelect value={mood} onChange={setMood} options={[{ v: "any", l: "Any mood" }, { v: "calm", l: "Calm" }, { v: "energised", l: "Energised" }, { v: "focused", l: "Focused" }, { v: "reflective", l: "Reflective" }, { v: "playful", l: "Playful" }]}/>
        <FilterSelect value={dur} onChange={setDur} options={DURATIONS.map(d=>({ v: d.key, l: d.label }))}/>
        <FilterSelect value={sort} onChange={v=>setSort(v as any)} options={[{ v: "recommended", l: "Recommended" }, { v: "short", l: "Shortest first" }, { v: "popular", l: "Most XP" }, { v: "newest", l: "Newest" }]}/>
        {hasFilters && (
          <button onClick={()=>{setQ("");setPath("any");setDiff("any");setMood("any");setDur("any");}}
            className="text-[11px] tracking-[0.2em] uppercase hover:opacity-70" style={{ color: "var(--pc-muted)" }}>Reset</button>
        )}
      </div>

      <div className="mt-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>{filtered.length} exercises</div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filtered.map(e => {
          const p = PATHS.find(x => x.slug === e.path)!;
          return (
            <Link key={e.id} to="/mindgym/exercise/$id" params={{ id: e.id }}
              className="rounded-2xl p-5 transition hover:-translate-y-0.5"
              style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
              <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase" style={{ color: "var(--pc-muted)" }}>
                <span>{p.emoji}</span><span>{p.name}</span>
              </div>
              <div className="font-serif text-[18px] mt-1" style={{ color: "var(--pc-ink)" }}>{e.name}</div>
              <p className="text-[12px] mt-1 line-clamp-2" style={{ color: "var(--pc-muted)" }}>{e.purpose}</p>
              <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: "var(--pc-muted)" }}>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3"/>{e.minutes} min</span>
                <span>{e.difficulty}</span>
                <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3"/>+{e.xp}</span>
              </div>
            </Link>
          );
        })}
        {!filtered.length && (
          <div className="col-span-full rounded-2xl p-10 text-center" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-[13px]" style={{ color: "var(--pc-muted)" }}>Nothing matches. Try clearing filters.</div>
          </div>
        )}
      </div>
    </main>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="rounded-full px-3 py-1.5 text-[11px] outline-none"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
