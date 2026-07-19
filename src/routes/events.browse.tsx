import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, X, SlidersHorizontal, CalendarDays, Grid3x3, List } from "lucide-react";
import { palette } from "@/components/AppShell";
import {
  Page, PageTitle, Card, Chip, EventCard, GhostBtn, EmptyState, SectionHead,
} from "@/components/events/primitives";
import {
  events, CATEGORIES, applyFilters, defaultFilters,
  uniqueColleges, uniqueLanguages, type EventCategory, type FilterState,
} from "@/lib/events-store";

const { border, muted, ink, surface2, primary, soft, surface } = palette;

type SearchParams = {
  category?: string;
  when?: string;
  q?: string;
};

function Browse() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/events/browse" });
  const [f, setF] = useState<FilterState>(() => ({
    ...defaultFilters(),
    q: search.q ?? "",
    category: (search.category as EventCategory | undefined) ?? undefined,
    when: (["any", "today", "tomorrow", "week", "month"].includes(search.when ?? "") ? (search.when as FilterState["when"]) : "any"),
  }));
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openFilters, setOpenFilters] = useState(false);

  useEffect(() => {
    navigate({
      search: {
        q: f.q || undefined,
        category: f.category,
        when: f.when === "any" ? undefined : f.when,
      },
      replace: true,
    });
  }, [f.q, f.category, f.when, navigate]);

  const list = useMemo(() => applyFilters(events, f), [f]);

  const clearAll = () => setF(defaultFilters());

  const activeCount =
    (f.q ? 1 : 0) + (f.category ? 1 : 0) + (f.when !== "any" ? 1 : 0) +
    (f.mode !== "any" ? 1 : 0) + (f.free !== "any" ? 1 : 0) + (f.college ? 1 : 0) + (f.language ? 1 : 0);

  return (
    <Page wide>
      <PageTitle
        eyebrow="Browse"
        title="Every event, quietly organized."
        sub="Filter by category, when, format, or campus. Everything below reacts as you refine."
      />

      {/* Search bar */}
      <Card className="mb-6" tone="surface2">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 shrink-0" style={{ color: muted }} />
          <input
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
            placeholder="Event, organizer, speaker, college, city…"
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: ink }}
          />
          {f.q && <button onClick={() => setF({ ...f, q: "" })} className="text-[11px]" style={{ color: muted }}>Clear</button>}
        </div>
      </Card>

      {/* When strip */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["any", "today", "tomorrow", "week", "month"] as const).map((w) => (
          <Chip key={w} active={f.when === w} onClick={() => setF({ ...f, when: w })}>
            {w === "any" ? "Any time" : w === "week" ? "This week" : w === "month" ? "This month" : w[0].toUpperCase() + w.slice(1)}
          </Chip>
        ))}
        <span className="mx-1" style={{ color: border }}>|</span>
        {(["any", "online", "offline"] as const).map((m) => (
          <Chip key={m} active={f.mode === m} onClick={() => setF({ ...f, mode: m })}>
            {m === "any" ? "Any mode" : m[0].toUpperCase() + m.slice(1)}
          </Chip>
        ))}
        <span className="mx-1" style={{ color: border }}>|</span>
        {(["any", "free", "paid"] as const).map((c) => (
          <Chip key={c} active={f.free === c} onClick={() => setF({ ...f, free: c })}>
            {c === "any" ? "Any price" : c[0].toUpperCase() + c.slice(1)}
          </Chip>
        ))}
      </div>

      {/* Categories row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-2 px-2 pc-no-scrollbar">
        <Chip active={!f.category} onClick={() => setF({ ...f, category: undefined })}>All</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.key} active={f.category === c.key} onClick={() => setF({ ...f, category: c.key })}>
            <span className="w-2 h-2 rounded-full mr-1" style={{ background: c.hue }}/>{c.key}
          </Chip>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px]" style={{ color: muted }}>
          {list.length} {list.length === 1 ? "event" : "events"} · sorted by{" "}
          <select
            value={f.sort}
            onChange={(e) => setF({ ...f, sort: e.target.value as FilterState["sort"] })}
            className="bg-transparent underline underline-offset-2 outline-none"
            style={{ color: primary }}
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="popularity">Popularity</option>
            <option value="recommended">Recommended</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-[11.5px] rounded-full h-9 px-3 inline-flex items-center gap-1.5"
              style={{ background: surface2, border: `1px solid ${border}`, color: muted }}>
              <X className="w-3.5 h-3.5"/> Clear {activeCount}
            </button>
          )}
          <button onClick={() => setOpenFilters(!openFilters)} className="text-[11.5px] rounded-full h-9 px-3 inline-flex items-center gap-1.5"
            style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
            <SlidersHorizontal className="w-3.5 h-3.5"/> More filters
          </button>
          <div className="hidden sm:flex rounded-full overflow-hidden" style={{ border: `1px solid ${border}` }}>
            <button onClick={() => setView("grid")} className="h-9 w-9 flex items-center justify-center"
              style={{ background: view === "grid" ? soft : surface, color: view === "grid" ? primary : muted }} aria-label="Grid view">
              <Grid3x3 className="w-3.5 h-3.5"/>
            </button>
            <button onClick={() => setView("list")} className="h-9 w-9 flex items-center justify-center"
              style={{ background: view === "list" ? soft : surface, color: view === "list" ? primary : muted }} aria-label="List view">
              <List className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>

      {openFilters && (
        <Card className="mb-6">
          <SectionHead title="More filters" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>College</div>
              <select value={f.college ?? ""} onChange={(e) => setF({ ...f, college: e.target.value || undefined })}
                className="w-full h-11 rounded-2xl px-4 text-[13px] outline-none"
                style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
                <option value="">Any</option>
                {uniqueColleges().map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>Language</div>
              <select value={f.language ?? ""} onChange={(e) => setF({ ...f, language: e.target.value || undefined })}
                className="w-full h-11 rounded-2xl px-4 text-[13px] outline-none"
                style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
                <option value="">Any</option>
                {uniqueLanguages().map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>Sort</div>
              <select value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value as FilterState["sort"] })}
                className="w-full h-11 rounded-2xl px-4 text-[13px] outline-none"
                style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="popularity">Popularity</option>
                <option value="recommended">Recommended</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {list.length === 0 ? (
        <EmptyState
          title="Nothing matches — yet."
          sub="Try loosening a filter, or explore a nearby category."
          cta={<Link to="/events" onClick={clearAll}><GhostBtn>Reset filters</GhostBtn></Link>}
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <EventCard key={e.id} e={e} layout="grid" />)}
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((e) => <EventCard key={e.id} e={e} layout="row" />)}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between text-[12px]" style={{ color: muted }}>
        <Link to="/events" style={{ color: primary }}>← Back to events home</Link>
        <Link to="/events/calendar" className="inline-flex items-center gap-1.5" style={{ color: primary }}>
          <CalendarDays className="w-3.5 h-3.5"/> Open calendar
        </Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/browse")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    when: typeof s.when === "string" ? s.when : undefined,
  }),
  component: Browse,
});
