import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, X, ArrowRight, Sparkles, Clock, Star, Bookmark, Share2,
  Mic, MicOff, ChevronDown, ChevronRight, History, Pin,
  Command, CornerDownLeft, TrendingUp, Home as HomeIcon,
  PenLine, Heart, Bot, UserCheck, CalendarCheck, BookOpen, Brain,
  Wind, Target, ClipboardList, Users, Settings, Trophy, Sparkle,
  Activity, Flame, User, Palette, Bell, Lock, AlertTriangle, Loader2,
} from "lucide-react";
import { palette } from "@/components/AppShell";
import {
  searchAll, landingRails, suggest, TRENDING_QUERIES,
  type SearchItem, type SearchFilter,
} from "@/lib/search-index";
import {
  loadRecents, pushRecent, removeRecent, clearRecents,
  loadPinned, togglePinned, loadSaved, saveSearch, loadPrefs,
  savePrefs, type SearchPrefs,
} from "@/lib/search-store";

// ─── icon registry ─────────────────────────────────────────────────────
const ICONS: Record<string, any> = {
  Home: HomeIcon, PenLine, Heart, Bot, UserCheck, CalendarCheck,
  BookOpen, Brain, Wind, Target, ClipboardList, Users, Settings,
  Trophy, Sparkles, Sparkle, Activity, Flame, User, Palette, Bell,
  Lock, AlertTriangle, Search,
};

const FILTERS: { key: SearchFilter; label: string }[] = [
  { key: "everything", label: "Everything" },
  { key: "actions", label: "Actions" },
  { key: "journal", label: "Journal" },
  { key: "gratitude", label: "Gratitude" },
  { key: "peacebot", label: "PeaceBot" },
  { key: "people", label: "People" },
  { key: "resources", label: "Resources" },
  { key: "videos", label: "Videos" },
  { key: "audio", label: "Audio" },
  { key: "worksheets", label: "Worksheets" },
  { key: "exercises", label: "Exercises" },
  { key: "assessments", label: "Assessments" },
];

// ─── minimal Gemini call for AI-mode; falls back gracefully ────────────
async function aiRecommend(query: string, items: SearchItem[]): Promise<string> {
  try {
    const catalog = items.slice(0, 40).map((i) => `- [${i.module}] ${i.title}${i.description ? ` — ${i.description.slice(0, 100)}` : ""} (${i.to ?? "no-link"})`).join("\n");
    const res = await fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, catalog }),
    });
    if (!res.ok) throw new Error("no ai");
    const j = await res.json();
    return j.text ?? "";
  } catch {
    // Local fallback: gentle rule-based suggestion.
    const q = query.toLowerCase();
    if (/anx|panic|nervous/.test(q)) return "Anxiety often eases with slow breathing. Try Box Breathing in the Breathe tool, or open PeaceBot for a quick reframe.";
    if (/sleep|insom|tired/.test(q)) return "For sleep, try a wind-down: 4-7-8 breathing, a short journal reflection, or a sleep story from Resources.";
    if (/exam|study|focus/.test(q)) return "For exam focus, start a Pomodoro in the Focus room and pair it with a 3-minute breathing reset between sessions.";
    if (/sad|depress|low|heavy/.test(q)) return "When things feel heavy, small anchors help. Log one gratitude, or open PeaceBot for a grounding check-in.";
    return "Try a short breathing session, journal a single line about how you feel, or open PeaceBot to talk it through.";
  }
}

export const Route = createFileRoute("/search/")({
  component: SearchCenter,
});

function SearchCenter() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<SearchFilter>("everything");
  const [sort, setSort] = useState<"relevance" | "newest" | "oldest">("relevance");
  const [aiMode, setAiMode] = useState<boolean>(() => { try { return loadPrefs().aiMode; } catch { return false; } });
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [preview, setPreview] = useState<SearchItem | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [voice, setVoice] = useState<{ listening: boolean; err?: string }>({ listening: false });
  const [recents, setRecents] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [saved, setSaved] = useState(() => { try { return loadSaved(); } catch { return []; } });
  const [rails] = useState(() => { try { return landingRails(); } catch { return { recent: [], trending: [], continueRail: [], quickAccess: [], suggested: [] }; } });

  const { bg, surface, surface2, border, ink, muted, primary, soft } = palette;

  useEffect(() => {
    setRecents(loadRecents());
    setPinned(loadPinned());
    // Auto-focus input
    inputRef.current?.focus();
  }, []);

  const { groups, flat, total } = useMemo(() => {
    return searchAll(q, { filter, sort, limit: 200 });
  }, [q, filter, sort]);

  // ── keyboard nav across flat list ──
  useEffect(() => { setActiveIdx(0); }, [q, filter, sort]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { if (preview) setPreview(null); else setQ(""); return; }
      if (!flat.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flat.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && q.trim()) {
        const target = flat[activeIdx];
        if (target?.to) {
          pushRecent(q);
          navigate({ to: target.to });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flat, activeIdx, q, preview, navigate]);

  // ── voice search ──
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoice({ listening: false, err: "Voice not supported in this browser." }); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = "en-US";
    setVoice({ listening: true });
    rec.onresult = (ev: any) => {
      const transcript = Array.from(ev.results).map((r: any) => r[0].transcript).join(" ");
      setQ(transcript);
    };
    rec.onerror = () => setVoice({ listening: false, err: "Couldn't hear that." });
    rec.onend = () => setVoice({ listening: false });
    rec.start();
  }

  // ── ai search ──
  async function runAi() {
    if (!q.trim() || !aiMode) return;
    setAiLoading(true);
    const text = await aiRecommend(q, flat);
    setAiText(text);
    setAiLoading(false);
  }
  useEffect(() => {
    if (!aiMode || !q.trim()) { setAiText(""); return; }
    const t = setTimeout(runAi, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, aiMode]);

  function applyPrefs(patch: Partial<SearchPrefs>) {
    const p = loadPrefs();
    const next = { ...p, ...patch };
    savePrefs(next);
    setAiMode(next.aiMode);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    pushRecent(q);
    setRecents(loadRecents());
    const first = flat[0];
    if (first?.to) navigate({ to: first.to });
  }

  const suggestions = useMemo(() => suggest(q), [q]);
  const showLanding = !q.trim();

  // ─── UI atoms ────────────────────────────────────────────────────────
  const Chip = ({ label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[12px] tracking-wide transition whitespace-nowrap"
      style={{
        background: active ? ink : surface,
        color: active ? surface : muted,
        border: `1px solid ${active ? ink : border}`,
      }}
    >{label}</button>
  );

  const ResultCard = ({ item, active }: { item: SearchItem; active?: boolean }) => {
    const Icon = ICONS[item.icon ?? "Search"] ?? Search;
    const isPinned = pinned.includes(item.id);
    return (
      <div
        onMouseEnter={() => setPreview(item)}
        className="group flex items-center gap-3 px-4 py-3 rounded-2xl transition cursor-pointer"
        style={{ background: active ? surface2 : "transparent", border: `1px solid ${active ? border : "transparent"}` }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: soft, color: primary }}>
          <Icon className="w-4 h-4" strokeWidth={1.5}/>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="font-serif text-[15px] truncate" style={{ color: ink }}>{item.title}</div>
            <span className="text-[9px] tracking-[0.25em] uppercase opacity-50 shrink-0">{item.module}</span>
          </div>
          {item.subtitle && <div className="text-[11.5px] mt-0.5 truncate" style={{ color: muted }}>{item.subtitle}</div>}
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => { e.stopPropagation(); togglePinned(item.id); setPinned(loadPinned()); }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: isPinned ? soft : surface, color: isPinned ? primary : muted, border: `1px solid ${border}` }}
            aria-label="Pin"
          ><Pin className="w-3.5 h-3.5" strokeWidth={1.5}/></button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.share && item.to) navigator.share({ title: item.title, url: window.location.origin + item.to }).catch(() => {});
              else if (item.to) navigator.clipboard?.writeText(window.location.origin + item.to).catch(() => {});
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: surface, color: muted, border: `1px solid ${border}` }}
            aria-label="Share"
          ><Share2 className="w-3.5 h-3.5" strokeWidth={1.5}/></button>
          {item.to && (
            <Link
              to={item.to}
              onClick={() => pushRecent(q)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: ink, color: surface }}
              aria-label="Open"
            ><ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5}/></Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full pb-24 pt-6 lg:pt-10" style={{ background: "transparent", color: ink }}>
      <div className="max-w-6xl mx-auto px-5 lg:px-8">

        {/* header */}
        <div className="flex items-center justify-between mb-6 lg:mb-10">
          <div>
            <div className="text-[9px] tracking-[0.4em] uppercase opacity-50">Search Center</div>
            <h1 className="font-serif text-[28px] lg:text-[36px] leading-[1.05] mt-2">Find anything, calmly.</h1>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Link to="/search/history" className="px-3 py-2 rounded-full text-[12px] flex items-center gap-2" style={{ background: surface, color: muted, border: `1px solid ${border}` }}>
              <History className="w-3.5 h-3.5"/> History
            </Link>
            <Link to="/search/settings" className="px-3 py-2 rounded-full text-[12px] flex items-center gap-2" style={{ background: surface, color: muted, border: `1px solid ${border}` }}>
              <Lock className="w-3.5 h-3.5"/> Privacy
            </Link>
          </div>
        </div>

        {/* search input */}
        <form onSubmit={onSubmit} className="rounded-3xl p-3 lg:p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}`, boxShadow: "0 20px 40px -30px rgba(0,0,0,0.35)" }}>
          <Search className="w-5 h-5 shrink-0" style={{ color: muted }} strokeWidth={1.5}/>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={aiMode ? "Ask something — 'I can't sleep', 'exam stress'…" : "Search journal, resources, buddies, actions…"}
            className="flex-1 bg-transparent outline-none text-[16px] placeholder:opacity-40"
            aria-label="Search"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2, color: muted }} aria-label="Clear">
              <X className="w-3.5 h-3.5"/>
            </button>
          )}
          <button
            type="button"
            onClick={startVoice}
            className="w-9 h-9 rounded-full flex items-center justify-center transition"
            style={{ background: voice.listening ? primary : surface2, color: voice.listening ? surface : muted, border: `1px solid ${border}` }}
            aria-label={voice.listening ? "Listening…" : "Voice search"}
          >
            {voice.listening ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4" strokeWidth={1.5}/>}
          </button>
          <button
            type="button"
            onClick={() => applyPrefs({ aiMode: !aiMode })}
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full text-[11.5px] transition"
            style={{ background: aiMode ? ink : surface2, color: aiMode ? surface : muted, border: `1px solid ${border}` }}
            aria-label="Toggle AI search"
          >
            <Sparkles className="w-3.5 h-3.5"/> AI
          </button>
          <div className="hidden lg:flex items-center gap-1 pl-3 ml-1 text-[10px] tracking-widest uppercase" style={{ color: muted, borderLeft: `1px solid ${border}` }}>
            <Command className="w-3 h-3"/> K
          </div>
        </form>

        {/* autocomplete row */}
        {q && suggestions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setQ(s)} className="px-3 py-1 rounded-full text-[11.5px]" style={{ background: surface2, color: muted, border: `1px solid ${border}` }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {voice.err && <div className="mt-2 text-[11px]" style={{ color: primary }}>{voice.err}</div>}

        {/* filter bar */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} active={filter === f.key} onClick={() => setFilter(f.key)} />
          ))}
          <div className="ml-auto shrink-0 flex items-center gap-1.5 pl-3" style={{ borderLeft: `1px solid ${border}` }}>
            <span className="text-[10px] uppercase tracking-[0.25em] opacity-50 hidden sm:block">Sort</span>
            {(["relevance","newest","oldest"] as const).map((s) => (
              <button key={s} onClick={() => setSort(s)} className="px-2.5 py-1 rounded-full text-[11px] capitalize" style={{ background: sort === s ? ink : "transparent", color: sort === s ? surface : muted, border: `1px solid ${sort === s ? ink : border}` }}>{s}</button>
            ))}
          </div>
        </div>

        {/* AI response */}
        {aiMode && q.trim() && (
          <div className="mt-5 rounded-3xl p-5 lg:p-6 flex gap-4" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: soft, color: primary }}>
              <Sparkles className="w-4 h-4"/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-[0.3em] uppercase opacity-50 mb-1.5">Peace AI</div>
              <div className="font-serif text-[15px] leading-relaxed" style={{ color: ink }}>
                {aiLoading ? <span className="inline-flex items-center gap-2 opacity-60"><Loader2 className="w-3.5 h-3.5 animate-spin"/> Thinking…</span> : (aiText || "Ask a natural question — I'll suggest resources.")}
              </div>
            </div>
          </div>
        )}

        {/* ── LANDING ── */}
        {showLanding && (
          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {rails.continueRail.length > 0 && (
                <Section title="Continue where you left off">
                  {rails.continueRail.map((i) => <ResultCard key={i.id} item={i}/>)}
                </Section>
              )}
              <Section title="Trending in PeaceCode" icon={<TrendingUp className="w-3.5 h-3.5"/>}>
                {rails.trending.map((i) => <ResultCard key={i.id} item={i}/>)}
              </Section>
              <Section title="Recently opened">
                {rails.recent.length ? rails.recent.map((i) => <ResultCard key={i.id} item={i}/>) : <Empty text="Nothing yet — start exploring."/>}
              </Section>
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="text-[10px] tracking-[0.3em] uppercase opacity-50 mb-3">Quick access</div>
                <div className="grid grid-cols-2 gap-2">
                  {rails.quickAccess.slice(0, 8).map((i) => {
                    const Icon = ICONS[i.icon ?? "Search"] ?? Search;
                    return (
                      <Link key={i.id} to={i.to!} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-[12px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={1.5}/> {i.title.replace("Open ","")}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] tracking-[0.3em] uppercase opacity-50">Recent searches</div>
                  {recents.length > 0 && <button onClick={() => { clearRecents(); setRecents([]); }} className="text-[10px] opacity-60 hover:opacity-100">Clear</button>}
                </div>
                {recents.length === 0 ? (
                  <div className="text-[12px] opacity-50">No recent searches.</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {recents.slice(0, 8).map((r) => (
                      <div key={r} className="flex items-center gap-2 group">
                        <button onClick={() => setQ(r)} className="flex-1 text-left flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]" style={{ background: surface2, color: ink }}>
                          <Clock className="w-3 h-3 opacity-50"/> {r}
                        </button>
                        <button onClick={() => { removeRecent(r); setRecents(loadRecents()); }} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="Remove">
                          <X className="w-3 h-3"/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="text-[10px] tracking-[0.3em] uppercase opacity-50 mb-3">Trending topics</div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_QUERIES.map((t) => (
                    <button key={t} onClick={() => setQ(t)} className="px-3 py-1 rounded-full text-[11.5px]" style={{ background: surface2, color: muted, border: `1px solid ${border}` }}>{t}</button>
                  ))}
                </div>
              </div>

              {saved.length > 0 && (
                <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="text-[10px] tracking-[0.3em] uppercase opacity-50 mb-3">Saved searches</div>
                  <div className="flex flex-col gap-1">
                    {saved.slice(0, 6).map((s: any) => (
                      <button key={s.id} onClick={() => setQ(s.query)} className="text-left flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]" style={{ background: surface2, color: ink }}>
                        <Star className="w-3 h-3 opacity-60"/> {s.label ?? s.query}
                      </button>
                    ))}
                    <Link to="/search/history" className="mt-1 text-[11px] opacity-60 hover:opacity-100 flex items-center gap-1">All saved <ChevronRight className="w-3 h-3"/></Link>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* ── LIVE RESULTS ── */}
        {!showLanding && (
          <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px]" style={{ color: muted }}>
                  {total > 0 ? `${total} result${total === 1 ? "" : "s"}` : "No matches — try another word."}
                </div>
                {q.trim() && (
                  <button
                    onClick={() => { const s = saveSearch(q); setSaved([s, ...saved]); }}
                    className="text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: surface2, color: muted, border: `1px solid ${border}` }}
                  ><Bookmark className="w-3 h-3"/> Save search</button>
                )}
              </div>

              {groups.length === 0 && (
                <div className="rounded-3xl p-8 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
                  <Sparkles className="w-6 h-6 mx-auto mb-3 opacity-40"/>
                  <div className="font-serif text-[17px] mb-1">Nothing found for "{q}"</div>
                  <div className="text-[12px] opacity-60 mb-4">Try one of these instead:</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {TRENDING_QUERIES.slice(0, 6).map((t) => (
                      <button key={t} onClick={() => setQ(t)} className="px-3 py-1.5 rounded-full text-[11.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>{t}</button>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-center gap-2">
                    <Link to="/peacebot" className="px-4 py-2 rounded-full text-[12px]" style={{ background: ink, color: surface }}>Ask PeaceBot</Link>
                    <Link to="/resources" className="px-4 py-2 rounded-full text-[12px]" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>Browse resources</Link>
                  </div>
                </div>
              )}

              {groups.map((g) => (
                <div key={g.kind} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-[9.5px] tracking-[0.35em] uppercase" style={{ color: muted }}>{g.label}</div>
                    <div className="flex-1 h-px" style={{ background: border }}/>
                    <div className="text-[10px] opacity-50">{g.items.length}</div>
                  </div>
                  <div className="flex flex-col">
                    {g.items.slice(0, 12).map((i) => {
                      const idx = flat.indexOf(i);
                      return <ResultCard key={i.id} item={i} active={idx === activeIdx} />;
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* preview */}
            <aside className="hidden lg:block">
              <div className="sticky top-6 rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}`, minHeight: 320 }}>
                {preview ? (
                  <PreviewPanel item={preview} onClose={() => setPreview(null)} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                    <Search className="w-6 h-6 mb-2"/>
                    <div className="text-[12px]">Hover a result to preview it here.</div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* keyboard hints */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-[10px] opacity-50">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded" style={{ background: surface2, border: `1px solid ${border}` }}>↑</kbd><kbd className="px-1.5 py-0.5 rounded" style={{ background: surface2, border: `1px solid ${border}` }}>↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded" style={{ background: surface2, border: `1px solid ${border}` }}><CornerDownLeft className="w-2.5 h-2.5"/></kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded" style={{ background: surface2, border: `1px solid ${border}` }}>Esc</kbd> clear</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded" style={{ background: surface2, border: `1px solid ${border}` }}>⌘K</kbd> focus</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const { border, muted } = palette;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-[9.5px] tracking-[0.35em] uppercase flex items-center gap-1.5" style={{ color: muted }}>
          {icon}{title}
        </div>
        <div className="flex-1 h-px" style={{ background: border }}/>
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  const { muted } = palette;
  return <div className="text-[12px] opacity-60 px-3 py-6" style={{ color: muted }}>{text}</div>;
}

function PreviewPanel({ item, onClose }: { item: SearchItem; onClose: () => void }) {
  const { border, muted, ink, surface, surface2, soft, primary } = palette;
  const Icon = ICONS[item.icon ?? "Search"] ?? Search;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] tracking-[0.35em] uppercase" style={{ color: muted }}>{item.module}</div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="Close preview"><X className="w-3 h-3"/></button>
      </div>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: soft, color: primary }}>
          <Icon className="w-5 h-5" strokeWidth={1.4}/>
        </div>
        <div className="min-w-0">
          <div className="font-serif text-[17px] leading-tight" style={{ color: ink }}>{item.title}</div>
          {item.subtitle && <div className="text-[11.5px] mt-1" style={{ color: muted }}>{item.subtitle}</div>}
        </div>
      </div>
      {item.description && <p className="text-[13px] leading-relaxed mb-4" style={{ color: muted }}>{item.description.slice(0, 260)}{item.description.length > 260 ? "…" : ""}</p>}
      {(item.tags?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {item.tags!.slice(0, 6).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: surface2, color: muted, border: `1px solid ${border}` }}>{t}</span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {item.to && (
          <Link to={item.to} className="w-full py-2.5 rounded-2xl text-[12.5px] text-center flex items-center justify-center gap-2" style={{ background: ink, color: surface }}>
            <ArrowRight className="w-3.5 h-3.5"/> Open
          </Link>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { togglePinned(item.id); }}
            className="py-2 rounded-xl text-[11.5px] flex items-center justify-center gap-1.5"
            style={{ background: surface2, color: ink, border: `1px solid ${border}` }}
          ><Pin className="w-3 h-3"/> Pin</button>
          <button
            onClick={() => {
              if (item.to) navigator.clipboard?.writeText(window.location.origin + item.to).catch(() => {});
            }}
            className="py-2 rounded-xl text-[11.5px] flex items-center justify-center gap-1.5"
            style={{ background: surface2, color: ink, border: `1px solid ${border}` }}
          ><Share2 className="w-3 h-3"/> Copy link</button>
        </div>
      </div>
    </div>
  );
}
