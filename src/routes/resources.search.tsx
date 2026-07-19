import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { LanguageToggle } from "@/components/resources/LanguageToggle";
import {
  FORMAT_LABELS, CATEGORIES, DIFFICULTIES, useResourceStore,
  recentSearches, pushSearch, TRENDING_SEARCHES,
  type ResourceFormat, type CategorySlug, type Difficulty,
} from "@/lib/resources-store";
import {
  useLang, UI, CATEGORY_HI, FORMAT_HI, DIFFICULTY_HI, SORT_LABELS,
  TRENDING_HI, searchLocalized, normalizeQuery,
} from "@/lib/resources-i18n";
import { Search as SearchIcon, Mic, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/resources/search")({
  head: () => ({ meta: [{ title: "Search — Resources" }] }),
  component: SearchPage,
});

const SORT_KEYS = ["recommended", "trending", "newest", "views", "likes", "rating", "shortest", "longest", "az"];
const FORMATS: ResourceFormat[] = Object.keys(FORMAT_LABELS) as ResourceFormat[];

function SearchPage() {
  const [lang] = useLang();
  const t = UI[lang];
  const snap = useResourceStore();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [format, setFormat] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [sort, setSort] = useState<string>("recommended");
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initQ = params.get("q") || "";
    if (initQ) { setQ(initQ); submit(initQ); }
    const initCat = params.get("category"); if (initCat) setCategory(initCat);
     
  }, []);

  const results = useMemo(() => searchLocalized(submitted, lang, {
    category: category as CategorySlug | "all",
    format: format as ResourceFormat | "all",
    difficulty: difficulty as Difficulty | "all",
    saved, completed,
    sort,
  }, { bookmarks: snap.bookmarks, completed: snap.completed }),
  [submitted, lang, category, format, difficulty, saved, completed, sort, snap.bookmarks, snap.completed]);

  async function submit(query: string) {
    pushSearch(query);
    // Normalize query into the active language so search hits translated content.
    const norm = await normalizeQuery(query, lang);
    setSubmitted(norm);
  }

  function startVoice() {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert(lang === "hi" ? "इस डिवाइस पर वॉइस सर्च नहीं है — कृपया टाइप करें।" : "Voice search isn't supported on this device — try typing."); return; }
    const rec = new SR(); rec.lang = lang === "hi" ? "hi-IN" : "en-IN"; rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => { const txt = e.results[0][0].transcript; setQ(txt); submit(txt); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }

  const recents = recentSearches();

  const catOpt = [{ v: "all", l: t.all }, ...CATEGORIES.map(c => ({ v: c.slug, l: lang === "hi" ? CATEGORY_HI[c.slug] : c.name }))];
  const fmtOpt = [{ v: "all", l: t.all }, ...FORMATS.map(f => ({ v: f, l: lang === "hi" ? FORMAT_HI[f] : FORMAT_LABELS[f] }))];
  const diffOpt = [{ v: "all", l: t.any }, ...DIFFICULTIES.map(d => ({ v: d, l: lang === "hi" ? DIFFICULTY_HI[d] : d }))];
  const sortOpt = SORT_KEYS.map(k => ({ v: k, l: SORT_LABELS[lang][k] }));

  const trendingList = lang === "hi"
    ? TRENDING_SEARCHES.map(x => ({ display: TRENDING_HI[x] || x, submit: TRENDING_HI[x] || x }))
    : TRENDING_SEARCHES.map(x => ({ display: x, submit: x }));

  return (
    <AppShell>
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10"
        style={lang === "hi" ? { fontFamily: '"Noto Sans Devanagari", "DM Sans", sans-serif' } : undefined}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>
            {lang === "hi" ? "खोज" : "Search"}
          </div>
          <LanguageToggle />
        </div>

        <div className="rounded-3xl p-4 sm:p-5 flex items-center gap-3">
          <SearchIcon className="w-5 h-5 opacity-60" style={{ color: "var(--pc-ink)" }}/>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(q); }}
            placeholder={t.searchPh}
            className="no-glass flex-1 bg-transparent border-0 outline-none shadow-none text-[15px] placeholder:opacity-50"
            style={{ background: "transparent", color: "var(--pc-ink)", border: 0, boxShadow: "none" }} aria-label={t.searchPh}/>
          {q && <button onClick={() => { setQ(""); setSubmitted(""); }} aria-label="Clear" className="no-glass" style={{ background: "transparent", border: 0, boxShadow: "none" }}><X className="w-4 h-4" style={{ color: "var(--pc-ink)", opacity: 0.7 }}/></button>}
          <button onClick={startVoice} aria-label="Voice search"
            className="w-10 h-10 rounded-full flex items-center justify-center transition"
            style={{ background: listening ? "var(--pc-primary)" : "rgba(255,255,255,0.22)", color: listening ? "#fff" : "var(--pc-ink)" }}>
            <Mic className="w-4 h-4"/>
          </button>
        </div>


        {!submitted && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>{t.recent}</div>
              <div className="flex flex-wrap gap-2">
                {recents.length === 0 && <span className="text-[12px]" style={{ color: "var(--pc-muted)" }}>
                  {lang === "hi" ? "अभी कोई हाल की खोज नहीं।" : "No recent searches yet."}
                </span>}
                {recents.map(s => (
                  <button key={s} onClick={() => { setQ(s); submit(s); }} className="text-[12px] px-3 py-1.5 rounded-full"
                    style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>{t.trending}</div>
              <div className="flex flex-wrap gap-2">
                {trendingList.map(s => (
                  <button key={s.display} onClick={() => { setQ(s.display); submit(s.submit); }} className="text-[12px] px-3 py-1.5 rounded-full"
                    style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>{s.display}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Pill label={t.category} value={category} options={catOpt} onChange={setCategory}/>
          <Pill label={t.format} value={format} options={fmtOpt} onChange={setFormat}/>
          <Pill label={t.difficulty} value={difficulty} options={diffOpt} onChange={setDifficulty}/>
          <Pill label={t.sort} value={sort} options={sortOpt} onChange={setSort}/>
          <Toggle label={t.saved} active={saved} onChange={setSaved}/>
          <Toggle label={t.completed} active={completed} onChange={setCompleted}/>
        </div>

        <div className="mt-6 flex items-center justify-between mb-4">
          <div className="text-[13px]" style={{ color: "var(--pc-muted)" }}>
            {t.results(results.length, submitted)}
          </div>
        </div>

        {results.length === 0 ? (
          <div className="rounded-3xl p-10 text-center" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-4xl mb-3">🍃</div>
            <div className="font-serif text-[20px]" style={{ color: "var(--pc-ink)" }}>{t.noResults}</div>
            <p className="text-[13px] mt-2" style={{ color: "var(--pc-muted)" }}>
              {t.softerWord} <Link to="/resources/categories" className="underline">{t.browseCategories}</Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map(r => <ResourceCard key={r.id} r={r}/>)}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function Pill({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="relative flex items-center rounded-full px-3 py-1.5 gap-2 text-[12px]"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
      <span style={{ color: "var(--pc-muted)" }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-transparent outline-none pr-1">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
function Toggle({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!active)} className="px-3 py-1.5 rounded-full text-[12px] transition"
      style={{ background: active ? "var(--pc-soft)" : "var(--pc-surface)", border: "1px solid var(--pc-border)", color: active ? "var(--pc-primary)" : "var(--pc-muted)" }}>
      {label}
    </button>
  );
}
