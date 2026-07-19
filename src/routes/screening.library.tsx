import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowLeft, Search, Bookmark, ArrowRight, Filter } from "lucide-react";
import { TESTS, loadPrefs, savePrefs, type Category, type Difficulty } from "@/lib/screening-store";

export const Route = createFileRoute("/screening/library")({
  head: () => ({ meta: [{ title: "Available Assessments — PeaceCode Screening" }] }),
  component: Library,
});

const { surface, surface2, border, ink, muted, primary } = palette;

const CATS: (Category | "All")[] = ["All", "Depression", "Anxiety", "Stress", "Wellbeing", "Sleep", "Self", "Social", "Academic", "Mindfulness"];
const DIFF: (Difficulty | "Any")[] = ["Any", "Light", "Moderate", "Reflective"];
const DURS = ["Any", "≤ 3 min", "4–5 min", "6+ min"] as const;

function Library() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [diff, setDiff] = useState<Difficulty | "Any">("Any");
  const [dur, setDur] = useState<(typeof DURS)[number]>("Any");
  const [sort, setSort] = useState<"recommended" | "shortest" | "az">("recommended");
  const [prefs, setPrefs] = useState(() => loadPrefs());

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  const toggleBookmark = (id: string) => {
    const b = prefs.bookmarks.includes(id) ? prefs.bookmarks.filter((x) => x !== id) : [...prefs.bookmarks, id];
    const next = { ...prefs, bookmarks: b };
    setPrefs(next); savePrefs(next);
  };

  const list = useMemo(() => {
    let l = TESTS.filter((t) =>
      (cat === "All" || t.category === cat) &&
      (diff === "Any" || t.difficulty === diff) &&
      (dur === "Any" || (dur === "≤ 3 min" ? t.minutes <= 3 : dur === "4–5 min" ? t.minutes >= 4 && t.minutes <= 5 : t.minutes >= 6)) &&
      (!q.trim() || (t.name + t.code + t.short + t.measures).toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "shortest") l = [...l].sort((a, b) => a.minutes - b.minutes);
    else if (sort === "az") l = [...l].sort((a, b) => a.name.localeCompare(b.name));
    else l = [...l].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return l;
  }, [q, cat, diff, dur, sort]);

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-5 flex items-center gap-2" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link>
          <span>·</span><span style={{ color: ink }}>All assessments</span>
        </nav>
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl leading-tight">Twelve gentle mirrors.</h1>
            <p className="text-[13px] mt-2 max-w-xl" style={{ color: muted }}>Each one is validated, brief, and quiet. Choose whichever feels closest to what you're noticing.</p>
          </div>
          <Link to="/screening" className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: muted }}>
            <ArrowLeft className="w-3.5 h-3.5" /> back
          </Link>
        </div>

        {/* filters */}
        <div className="rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 py-2 rounded-full" style={{ background: surface2 }}>
            <Search className="w-3.5 h-3.5 opacity-50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, code, or feeling…" className="bg-transparent outline-none text-[13px] w-full" />
          </div>
          <Pills value={cat} onChange={setCat} options={CATS} />
          <Pills value={diff} onChange={setDiff} options={DIFF} />
          <Pills value={dur} onChange={setDur as (v: string) => void} options={DURS as unknown as string[]} />
          <select value={sort} onChange={(e) => setSort(e.target.value as never)} className="text-[12px] px-3 py-2 rounded-full outline-none" style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
            <option value="recommended">Recommended</option>
            <option value="shortest">Shortest</option>
            <option value="az">A–Z</option>
          </select>
        </div>

        <div className="text-[11px] tracking-[0.2em] uppercase mb-3" style={{ color: muted }}>{list.length} results</div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((t) => {
            const saved = prefs.bookmarks.includes(t.id);
            return (
              <div key={t.id} className="group rounded-[22px] p-5 flex flex-col transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] tracking-[0.25em] uppercase px-2 py-1 rounded-full" style={{ background: surface2, color: primary }}>{t.code}</span>
                  <button onClick={() => toggleBookmark(t.id)} aria-label={saved ? "Remove bookmark" : "Bookmark"} className="w-8 h-8 rounded-full flex items-center justify-center transition" style={{ background: saved ? surface2 : "transparent", color: saved ? primary : muted }}>
                    <Bookmark className="w-3.5 h-3.5" fill={saved ? primary : "none"} />
                  </button>
                </div>
                <h3 className="font-serif text-lg mb-1">{t.name}</h3>
                <p className="text-[12.5px] leading-relaxed line-clamp-3" style={{ color: muted }}>{t.short}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: muted }}>
                  <span>{t.category}</span><span>·</span><span>{t.minutes} min</span><span>·</span><span>{t.questions.length} q</span><span>·</span><span>{t.difficulty}</span>
                </div>
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <Link to="/screening/test/$id" params={{ id: t.id }} className="flex-1 text-[12px] px-3 py-2 rounded-full inline-flex items-center justify-center gap-1.5" style={{ background: ink, color: "white" }}>
                    View details <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link to="/screening/instructions/$id" params={{ id: t.id }} className="text-[12px] px-3 py-2 rounded-full" style={{ background: surface2, color: ink }}>
                    Start
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {list.length === 0 && (
          <div className="text-center py-12 text-[13px]" style={{ color: muted }}>
            Nothing matches. Try clearing a filter.
            <div className="mt-3"><button onClick={() => { setQ(""); setCat("All"); setDiff("Any"); setDur("Any"); }} className="text-[12px] px-4 py-2 rounded-full" style={{ background: surface2 }}>Clear filters</button></div>
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Pills<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: readonly T[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className="text-[11px] px-2.5 py-1.5 rounded-full transition" style={{ background: o === value ? ink : surface2, color: o === value ? "white" : muted }}>
          {o}
        </button>
      ))}
    </div>
  );
}
