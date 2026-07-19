import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { palette } from "@/components/AppShell";
import { Card, Chip, rupee } from "./counselling";
import {
  EXPERTS, SPECIALIZATIONS, THERAPY_TYPES, LANGS, photoFor, nextAvailable, favorites, toggleFavorite,
} from "@/lib/counselling-store";
import { Search, ShieldCheck, Star, Heart, SlidersHorizontal, X, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/counselling/experts")({
  component: FindExperts,
});

type Sort = "recommended" | "rating" | "price-low" | "price-high" | "soonest";

function FindExperts() {
  const { ink, muted, primary, surface, surface2, border } = palette;
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState<string[]>([]);
  const [therapy, setTherapy] = useState<string[]>([]);
  const [lang, setLang] = useState<string[]>([]);
  const [gender, setGender] = useState<string[]>([]);
  const [mode, setMode] = useState<string[]>([]);
  const [collegeOnly, setCollegeOnly] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [maxFee, setMaxFee] = useState(2500);
  const [sort, setSort] = useState<Sort>("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [favs, setFavs] = useState<string[]>(favorites());

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const clear = () => {
    setQ(""); setSpec([]); setTherapy([]); setLang([]); setGender([]); setMode([]);
    setCollegeOnly(false); setEmergencyOnly(false); setMaxFee(2500); setSort("recommended");
  };

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = EXPERTS.filter(e => {
      if (query && !`${e.name} ${e.title} ${e.specializations.join(" ")} ${e.therapyTypes.join(" ")} ${e.languages.join(" ")}`.toLowerCase().includes(query)) return false;
      if (spec.length && !spec.some(s => e.specializations.includes(s))) return false;
      if (therapy.length && !therapy.some(t => e.therapyTypes.includes(t))) return false;
      if (lang.length && !lang.some(l => e.languages.includes(l))) return false;
      if (gender.length && !gender.includes(e.gender)) return false;
      if (mode.length && !mode.some(m => (e.modes as string[]).includes(m))) return false;
      if (collegeOnly && !e.collegePartner) return false;
      if (emergencyOnly && !e.emergency) return false;
      if (e.fees > maxFee) return false;
      return true;
    });
    if (sort === "rating") list = [...list].sort((a,b) => b.rating - a.rating);
    else if (sort === "price-low") list = [...list].sort((a,b) => a.fees - b.fees);
    else if (sort === "price-high") list = [...list].sort((a,b) => b.fees - a.fees);
    else if (sort === "soonest") list = [...list].sort((a,b) => (nextAvailable(a.id)?.ts ?? Infinity) - (nextAvailable(b.id)?.ts ?? Infinity));
    else list = [...list].sort((a,b) => (b.rating * 20 + b.experienceYears) - (a.rating * 20 + a.experienceYears));
    return list;
  }, [q, spec, therapy, lang, gender, mode, collegeOnly, emergencyOnly, maxFee, sort]);

  const activeFilterCount = spec.length + therapy.length + lang.length + gender.length + mode.length + (collegeOnly?1:0) + (emergencyOnly?1:0) + (maxFee < 2500 ? 1 : 0);

  return (
    <>
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: muted }}>Find experts</div>
        <h1 className="font-serif text-[30px] sm:text-[34px] leading-tight" style={{ color: ink }}>Meet a psychologist who fits.</h1>
        <p className="mt-1 text-[14px]" style={{ color: muted }}>{results.length} verified counsellors · Filter by concern, language, gender, therapy style.</p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 min-w-0 flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: surface, border: `1px solid ${border}` }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: muted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, issue, therapy type…" className="flex-1 bg-transparent outline-none text-[14px]" style={{ color: ink }} />
          {q && <button onClick={() => setQ("")}><X className="w-4 h-4" style={{ color: muted }} /></button>}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="min-w-0 rounded-full px-3 sm:px-4 py-2.5 text-[13px]" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
            <option value="recommended">Recommended</option>
            <option value="rating">Highest rated</option>
            <option value="soonest">Soonest available</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
          <button onClick={() => setShowFilters(v => !v)} className="justify-center rounded-full px-3 sm:px-4 py-2.5 text-[13px] inline-flex items-center gap-2" style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
            <SlidersHorizontal className="w-4 h-4" /> Filters {activeFilterCount > 0 && <span className="rounded-full px-1.5 text-[11px]" style={{ background: ink, color: "#fff" }}>{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      <div className={showFilters ? "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]" : "grid grid-cols-1 gap-4"}>
        {showFilters && (
          <Card className="self-start lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-serif text-[16px]" style={{ color: ink }}>Filters</div>
              {activeFilterCount > 0 && <button onClick={clear} className="text-[11.5px]" style={{ color: muted }}>Clear all</button>}
            </div>

            <FilterGroup title="Concern">
              <div className="flex flex-wrap gap-1.5">
                {SPECIALIZATIONS.map(s => <Chip key={s} active={spec.includes(s)} onClick={() => toggle(spec, s, setSpec)}>{s}</Chip>)}
              </div>
            </FilterGroup>
            <FilterGroup title="Therapy type">
              <div className="flex flex-wrap gap-1.5">
                {THERAPY_TYPES.map(t => <Chip key={t} active={therapy.includes(t)} onClick={() => toggle(therapy, t, setTherapy)}>{t}</Chip>)}
              </div>
            </FilterGroup>
            <FilterGroup title="Language">
              <div className="flex flex-wrap gap-1.5">
                {LANGS.map(l => <Chip key={l} active={lang.includes(l)} onClick={() => toggle(lang, l, setLang)}>{l}</Chip>)}
              </div>
            </FilterGroup>
            <FilterGroup title="Counsellor gender">
              <div className="flex flex-wrap gap-1.5">
                {["she/her","he/him","they/them"].map(g => <Chip key={g} active={gender.includes(g)} onClick={() => toggle(gender, g, setGender)}>{g}</Chip>)}
              </div>
            </FilterGroup>
            <FilterGroup title="Mode">
              <div className="flex flex-wrap gap-1.5">
                {["video","audio","chat"].map(m => <Chip key={m} active={mode.includes(m)} onClick={() => toggle(mode, m, setMode)}>{m}</Chip>)}
              </div>
            </FilterGroup>
            <FilterGroup title="Availability">
              <label className="flex items-center gap-2 text-[13px]" style={{ color: ink }}>
                <input type="checkbox" checked={collegeOnly} onChange={e => setCollegeOnly(e.target.checked)} /> College partner only
              </label>
              <label className="flex items-center gap-2 text-[13px] mt-1.5" style={{ color: ink }}>
                <input type="checkbox" checked={emergencyOnly} onChange={e => setEmergencyOnly(e.target.checked)} /> Emergency availability
              </label>
            </FilterGroup>
            <FilterGroup title={`Max fee · ${rupee(maxFee)}`}>
              <input type="range" min={500} max={2500} step={100} value={maxFee} onChange={e => setMaxFee(parseInt(e.target.value))} className="w-full" />
            </FilterGroup>
          </Card>
        )}

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3 min-w-0">
          {results.map(e => {
            const next = nextAvailable(e.id);
            const isFav = favs.includes(e.id);
            return (
              <Card key={e.id} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <img src={photoFor(e.id)} alt="" className="w-14 h-14 rounded-2xl flex-none" style={{ background: surface2 }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="font-serif text-[17px] truncate" style={{ color: ink }}>{e.name}</div>
                      {e.verified && <ShieldCheck className="w-3.5 h-3.5 flex-none" style={{ color: primary }} />}
                    </div>
                    <div className="text-[12px] truncate" style={{ color: muted }}>{e.title} · {e.experienceYears} yrs</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]" style={{ color: muted }}>
                      <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3" style={{ color: "#c99a2a" }} /> {e.rating.toFixed(1)} · {e.reviewsCount}</span>
                      <span>· {e.sessions} sessions</span>
                    </div>

                  </div>
                  <button onClick={() => { toggleFavorite(e.id); setFavs(favorites()); }} className="p-1.5 rounded-full" aria-label="favourite">
                    <Heart className="w-4 h-4" style={{ color: isFav ? "#c14a5a" : muted, fill: isFav ? "#c14a5a" : "transparent" }} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.specializations.slice(0, 3).map(s => <Chip key={s}>{s}</Chip>)}
                </div>
                <div className="mt-2 text-[12px]" style={{ color: muted }}>
                  {e.languages.slice(0,3).join(" · ")} · {e.gender}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11.5px]" style={{ color: muted }}>
                  {e.modes.map(m => <span key={m} className="rounded-full px-2 py-0.5" style={{ background: surface2 }}>{m}</span>)}
                  {e.collegePartner && <span className="rounded-full px-2 py-0.5" style={{ background: "#eaf6ea", color: "#2f6a37" }}>College partner</span>}
                  {e.emergency && <span className="rounded-full px-2 py-0.5" style={{ background: "#fff1f0", color: "#9a1c1c" }}>Emergency</span>}
                </div>

                <div className="mt-auto pt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
                  <div className="min-w-0">
                    <div className="font-serif text-[19px]" style={{ color: ink }}>{rupee(e.fees)}<span className="text-[12px]" style={{ color: muted }}> /session</span></div>
                    {next && <div className="text-[11.5px] inline-flex items-center gap-1" style={{ color: muted }}><CalendarClock className="w-3 h-3" /> {next.label} · {next.slot}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Link to="/counselling/expert/$id" params={{ id: e.id }} className="rounded-full px-3 py-1.5 text-[12px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>View</Link>
                    <Link to="/counselling/book/$id" params={{ id: e.id }} className="rounded-full px-3 py-1.5 text-[12px]" style={{ background: ink, color: "#fff" }}>Book</Link>
                  </div>
                </div>
              </Card>
            );
          })}

          {results.length === 0 && (
            <Card className="sm:col-span-2 xl:col-span-3 text-center py-16">
              <div className="font-serif text-[20px] mb-1" style={{ color: ink }}>No counsellors match those filters.</div>
              <p className="text-[13.5px] mb-4" style={{ color: muted }}>Try widening a couple of options — most students find someone great within 2–3 filters.</p>
              <button onClick={clear} className="rounded-full px-4 py-2 text-[13px]" style={{ background: ink, color: "#fff" }}>Clear filters</button>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { muted, border } = palette;
  return (
    <div className="py-3" style={{ borderTop: `1px solid ${border}` }}>
      <div className="text-[10.5px] uppercase tracking-[0.18em] mb-2" style={{ color: muted }}>{title}</div>
      {children}
    </div>
  );
}
