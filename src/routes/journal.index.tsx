import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  PenLine, Sparkles, Search, Plus, Mic, Camera, Bot, RefreshCw,
  BookOpen, Archive, Lock, ChevronRight, BarChart3, Tag, Palette, X, Check, Image as ImageIcon,
} from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import {
  loadEntries, newEntry, upsertEntry, computeStreak, weekMoodTrend,
  loadPrefs, savePrefs, hashPassword, isUnlocked, setUnlocked,
  buildHeatmap, topEmotions, topWords, monthMoodTrend,
  THEME_META, type ThemeName, type JournalEntry, type Mood, type JournalPrefs,
} from "@/lib/journal-store";
import { journalAI } from "@/lib/journal-ai.functions";
import { monthlyReflection } from "@/lib/journal-voice.functions";

export const Route = createFileRoute("/journal/")({ component: JournalHome });

const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;

const MOOD_META: Record<Mood, { label: string; emoji: string; color: string }> = {
  radiant: { label: "radiant", emoji: "☀️", color: "#F5C97A" },
  calm:    { label: "calm",    emoji: "🌿", color: "#9FC7A8" },
  okay:    { label: "okay",    emoji: "🌤", color: "#AFC9F5" },
  low:     { label: "low",     emoji: "🌧", color: "#B7BFD9" },
  heavy:   { label: "heavy",   emoji: "🌫", color: "#8A93B0" },
};

type ModalKind = null | "insights" | "themes" | "privacy";

function JournalHome() {
  const navigate = useNavigate();
  const askAI = useServerFn(journalAI);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prefs, setPrefs] = useState<JournalPrefs | null>(null);
  const [unlocked, setUnlockedState] = useState(false);
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("what is one small thing that steadied you today?");
  const [promptLoading, setPromptLoading] = useState(false);
  const [reflection, setReflection] = useState<string>("");
  const [reflectLoading, setReflectLoading] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
    setPrefs(loadPrefs());
    setUnlockedState(isUnlocked());
  }, []);

  const visibleEntries = useMemo(
    () => entries.filter((e) => !e.secret || unlocked),
    [entries, unlocked],
  );

  const streak = useMemo(() => computeStreak(visibleEntries), [visibleEntries]);
  const trend = useMemo(() => weekMoodTrend(visibleEntries), [visibleEntries]);
  const draft = useMemo(() => visibleEntries.find((e) => e.status === "draft"), [visibleEntries]);
  const saved = useMemo(() => visibleEntries.filter((e) => e.status === "saved" && !e.archived), [visibleEntries]);
  const recent = useMemo(() => {
    const q = query.trim().toLowerCase();
    const src = saved;
    if (!q) return src.slice(0, 6);
    return src.filter((e) =>
      (e.title + " " + e.body + " " + e.tags.join(" ")).toLowerCase().includes(q)
    ).slice(0, 12);
  }, [saved, query]);

  const todayMood = useMemo(() => {
    const today = new Date().toDateString();
    return visibleEntries.find((e) => new Date(e.createdAt).toDateString() === today)?.mood ?? null;
  }, [visibleEntries]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 5 ? "still up" : hour < 12 ? "good morning" : hour < 17 ? "good afternoon" : hour < 21 ? "good evening" : "quiet night";

  async function refreshPrompt() {
    setPromptLoading(true);
    try {
      const res = await askAI({ data: { kind: "prompt", mood: todayMood ?? "" } });
      if (res.text) setPrompt(res.text.replace(/^["'\s]+|["'\s]+$/g, ""));
    } catch { /* keep last */ }
    finally { setPromptLoading(false); }
  }

  async function generateReflection() {
    if (!saved.length) return;
    setReflectLoading(true);
    try {
      const seed = saved.slice(0, 3).map((e) => e.body).join("\n\n---\n\n").slice(0, 4000);
      const res = await askAI({ data: { kind: "reflect", text: seed } });
      setReflection(res.text || "");
    } catch { setReflection("peace bot is resting. try again in a moment."); }
    finally { setReflectLoading(false); }
  }

  function createEntry(kind: "quick" | "guided") {
    const e = newEntry(kind, kind === "guided" ? { title: prompt } : {});
    upsertEntry(e);
    navigate({ to: "/journal/$id", params: { id: e.id } });
  }

  function persistPrefs(next: JournalPrefs) {
    setPrefs(next);
    savePrefs(next);
  }

  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 lg:pt-10 pb-24 font-['DM_Sans',sans-serif]" style={{ color: ink }}>

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[32px] p-6 sm:p-10 mb-8"
          style={{ background: `linear-gradient(135deg, ${surface} 0%, ${surface2} 100%)`, border: `1px solid ${border}` }}>
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40" style={{ background: lavender }} />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: soft }} />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] items-end">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase opacity-50">
                {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <h1 className="font-['Fraunces',serif] text-[38px] sm:text-[54px] leading-[1.02] font-light mt-2">
                {greeting}, <span className="italic" style={{ color: primary }}>keya.</span>
              </h1>
              <p className="mt-4 text-[15px] max-w-xl opacity-80">
                a quiet page is waiting. write a line, or let peace ask you something soft.
              </p>

              <div className="mt-6 flex items-start gap-3 p-5 rounded-2xl backdrop-blur-md"
                style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${border}` }}>
                <Sparkles className="w-4 h-4 mt-1 shrink-0" style={{ color: primary }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] tracking-[0.3em] uppercase opacity-50 mb-1">today's prompt</div>
                  <div className="font-['Fraunces',serif] text-[19px] italic leading-snug">{prompt}</div>
                </div>
                <button onClick={refreshPrompt} disabled={promptLoading}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: surface, border: `1px solid ${border}` }} aria-label="new prompt">
                  <RefreshCw className={`w-3.5 h-3.5 ${promptLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => createEntry("quick")}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] transition hover:-translate-y-0.5"
                  style={{ background: ink, color: "#fff" }}>
                  <Plus className="w-4 h-4" /> new entry
                </button>
                <button onClick={() => createEntry("guided")}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] transition hover:-translate-y-0.5"
                  style={{ background: surface, border: `1px solid ${border}` }}>
                  <Bot className="w-4 h-4" /> ai guided
                </button>
                {draft && (
                  <Link to="/journal/$id" params={{ id: draft.id }}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px] transition hover:-translate-y-0.5"
                    style={{ background: surface2, color: primary }}>
                    <PenLine className="w-4 h-4" /> continue writing
                  </Link>
                )}
              </div>
            </div>

            <div className="relative aspect-square rounded-3xl p-6 flex flex-col items-center justify-center"
              style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${border}` }}>
              <StreakRing current={streak.current} longest={streak.longest} total={streak.totalDays} />
            </div>
          </div>
        </section>

        {/* ── MOOD + REFLECTION ───────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mb-8">
          <Card>
            <CardHeader icon={<BarChart3 className="w-4 h-4" />} kicker="mood timeline" title="this week" />
            <div className="flex items-end justify-between gap-2 h-32 mt-4 mb-2">
              {trend.map((d, i) => {
                const h = d.value ? (d.value / 5) * 100 : 6;
                const color = d.mood ? MOOD_META[d.mood].color : border;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full rounded-full transition-all" style={{ height: `${h}%`, background: color, opacity: d.value ? 0.9 : 0.5 }} />
                    <div className="text-[10px] opacity-60">{d.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(Object.keys(MOOD_META) as Mood[]).map((m) => (
                <button key={m}
                  onClick={() => {
                    const today = new Date().toDateString();
                    const list = loadEntries();
                    let target = list.find((e) => new Date(e.createdAt).toDateString() === today);
                    if (!target) target = newEntry("quick");
                    target.mood = m;
                    target.status = target.body.trim() ? "saved" : target.status;
                    upsertEntry(target);
                    setEntries(loadEntries());
                  }}
                  className="text-[11px] px-2.5 h-7 rounded-full inline-flex items-center gap-1.5 transition hover:-translate-y-0.5"
                  style={{
                    background: todayMood === m ? MOOD_META[m].color : surface2,
                    color: todayMood === m ? "#fff" : ink,
                    border: `1px solid ${border}`,
                  }}>
                  <span>{MOOD_META[m].emoji}</span>{MOOD_META[m].label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader icon={<Sparkles className="w-4 h-4" />} kicker="ai reflection" title="what peace notices"
              action={
                <button onClick={generateReflection} disabled={reflectLoading || !saved.length}
                  className="text-[11px] px-3 h-7 rounded-full inline-flex items-center gap-1.5 disabled:opacity-40"
                  style={{ background: surface2, color: primary }}>
                  <RefreshCw className={`w-3 h-3 ${reflectLoading ? "animate-spin" : ""}`} /> reflect
                </button>
              } />
            <div className="mt-3">
              {reflection ? (
                <div className="space-y-2 font-['Fraunces',serif]">
                  {reflection.split("\n").filter(Boolean).slice(0, 3).map((line, i) => (
                    <p key={i} className="text-[15px] italic leading-snug opacity-90">— {line.replace(/^[-•]\s*/, "")}</p>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] opacity-60 italic">
                  {saved.length ? "tap reflect to hear a soft summary of your recent entries." : "write your first entry — peace will listen."}
                </p>
              )}
            </div>
          </Card>
        </section>

        {/* ── RECENT ──────────────────────────────────────── */}
        <section className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase opacity-50">recent</div>
              <h2 className="font-['Fraunces',serif] text-[28px] font-light mt-1">your quiet pages</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full px-3 h-9" style={{ background: surface, border: `1px solid ${border}` }}>
              <Search className="w-3.5 h-3.5 opacity-50" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search entries…"
                className="bg-transparent outline-none text-[12px] w-40 sm:w-56 placeholder:opacity-40" />
            </div>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-3xl p-10 text-center" style={{ background: surface, border: `1px dashed ${border}` }}>
              <BookOpen className="w-6 h-6 mx-auto opacity-40" />
              <p className="mt-3 font-['Fraunces',serif] italic text-[17px]">no pages yet.</p>
              <p className="text-[12px] opacity-60 mt-1">your first entry begins here.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((e) => <EntryCard key={e.id} entry={e} />)}
            </div>
          )}
        </section>

        {/* ── COLLECTIONS + TAGS ──────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader icon={<BookOpen className="w-4 h-4" />} kicker="collections" title="find a room" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {["All", "Favorites", "College", "Personal", "Gratitude", "Dreams", "Secret"].map((c) => {
                const count =
                  c === "All" ? saved.length
                  : c === "Favorites" ? saved.filter((x) => x.favorite).length
                  : c === "Secret" ? saved.filter((x) => x.secret).length
                  : saved.filter((x) => x.collection === c).length;
                const isSecret = c === "Secret";
                return (
                  <button key={c}
                    onClick={() => { if (isSecret && !unlocked && prefs?.lockEnabled) setModal("privacy"); }}
                    className="flex flex-col items-start p-3 rounded-2xl text-left transition hover:-translate-y-0.5"
                    style={{ background: isSecret ? "rgba(75,108,183,0.08)" : surface2, border: `1px solid ${border}` }}>
                    <span className="text-[12px] flex items-center gap-1.5">
                      {isSecret && <Lock className="w-3 h-3" style={{ color: primary }} />}
                      {c}
                    </span>
                    <span className="text-[10px] opacity-60 mt-1">
                      {isSecret && !unlocked && prefs?.lockEnabled ? "locked" : `${count} ${count === 1 ? "page" : "pages"}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader icon={<Tag className="w-4 h-4" />} kicker="tags" title="soft threads" />
            <div className="flex flex-wrap gap-2 mt-4">
              {["exam", "friends", "family", "anxiety", "motivation", "hostel", "classes", "placement", "health", "random"].map((t) => (
                <span key={t} className="text-[11px] px-3 h-7 rounded-full inline-flex items-center"
                  style={{ background: surface2, color: muted, border: `1px solid ${border}` }}>#{t}</span>
              ))}
            </div>
          </Card>
        </section>

        {/* ── UTILITY ROW ─────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-24">
          {[
            { icon: BarChart3, label: "insights", onClick: () => setModal("insights") },
            { icon: Palette,   label: "themes", onClick: () => setModal("themes") },
            { icon: Lock,      label: "privacy", onClick: () => setModal("privacy") },
            { icon: ImageIcon, label: "memories", to: "/journal/memories" as const },
            { icon: Mic,       label: "voice", to: "/journal/voice" as const },
            { icon: Archive,   label: "archived" },
          ].slice(0, 4).map((t) => (
            <button key={t.label} onClick={t.onClick ? t.onClick : (t.to ? () => navigate({ to: t.to! }) : undefined)}
              className="flex items-center gap-3 h-14 px-4 rounded-2xl transition hover:-translate-y-0.5"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <t.icon className="w-4 h-4 opacity-70" />
              <span className="text-[12px]">{t.label}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
            </button>
          ))}
        </section>

        {/* extra utility row: memories + voice + archived */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-24 -mt-16">
          <Link to="/journal/memories" className="flex items-center gap-3 h-14 px-4 rounded-2xl transition hover:-translate-y-0.5"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <ImageIcon className="w-4 h-4 opacity-70" />
            <span className="text-[12px]">memory gallery</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
          </Link>
          <Link to="/journal/voice" className="flex items-center gap-3 h-14 px-4 rounded-2xl transition hover:-translate-y-0.5"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <Mic className="w-4 h-4 opacity-70" />
            <span className="text-[12px]">voice journal</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
          </Link>
          <button onClick={() => setShowArchived(true)}
            className="flex items-center gap-3 h-14 px-4 rounded-2xl transition hover:-translate-y-0.5"
            style={{ background: surface, border: `1px solid ${border}` }}>
            <Archive className="w-4 h-4 opacity-70" />
            <span className="text-[12px]">archived ({visibleEntries.filter(e => e.archived).length})</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
          </button>
        </section>

        {showArchived && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(29,42,68,0.35)" }} onClick={() => setShowArchived(false)}>
            <div className="w-full max-w-lg rounded-[24px] p-6 max-h-[80vh] overflow-y-auto" style={{ background: surface, border: `1px solid ${border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-['Fraunces',serif] text-[22px]">archived entries</div>
                <button onClick={() => setShowArchived(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2, color: ink }}>
                  <X className="w-4 h-4"/>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {visibleEntries.filter(e => e.archived).map(e => (
                  <button key={e.id} onClick={() => { setShowArchived(false); navigate({ to: "/journal/$id", params: { id: e.id } }); }}
                          className="text-left p-3 rounded-xl transition hover:-translate-y-0.5"
                          style={{ background: surface2, border: `1px solid ${border}` }}>
                    <div className="text-[13px] font-medium truncate">{e.title || "untitled"}</div>
                    <div className="text-[11px] opacity-60 mt-1">{new Date(e.createdAt).toLocaleDateString()}</div>
                  </button>
                ))}
                {visibleEntries.filter(e => e.archived).length === 0 && (
                  <div className="text-[13px] opacity-60 py-8 text-center">no archived entries yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* floating quick actions */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
        <Link to="/journal/voice" title="voice"
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition hover:-translate-y-0.5"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <Mic className="w-4 h-4 opacity-70" />
        </Link>
        <Link to="/journal/memories" title="memories"
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition hover:-translate-y-0.5"
          style={{ background: surface, border: `1px solid ${border}` }}>
          <Camera className="w-4 h-4 opacity-70" />
        </Link>
        <button onClick={() => createEntry("quick")} aria-label="new entry"
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition hover:-translate-y-0.5"
          style={{ background: ink, color: "#fff" }}>
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* modals */}
      {modal === "insights" && (
        <InsightsModal entries={visibleEntries} onClose={() => setModal(null)} />
      )}
      {modal === "themes" && prefs && (
        <ThemesModal prefs={prefs} onChange={persistPrefs} onClose={() => setModal(null)} />
      )}
      {modal === "privacy" && prefs && (
        <PrivacyModal
          prefs={prefs}
          unlocked={unlocked}
          onChange={persistPrefs}
          onUnlock={() => { setUnlocked(true); setUnlockedState(true); }}
          onLock={() => { setUnlocked(false); setUnlockedState(false); }}
          onClose={() => setModal(null)}
        />
      )}
    </AppShell>
  );
}

// ── components ───────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-5 sm:p-6 backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${border}` }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, kicker, title, action }: { icon: React.ReactNode; kicker: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 opacity-60">
          {icon}
          <span className="text-[9px] tracking-[0.32em] uppercase">{kicker}</span>
        </div>
        <h3 className="font-['Fraunces',serif] text-[22px] font-light mt-1">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function StreakRing({ current, longest, total }: { current: number; longest: number; total: number }) {
  const size = 180, stroke = 10, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const goal = Math.max(7, longest || 7);
  const pct = Math.min(1, current / goal);
  return (
    <div className="relative">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={surface2} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={primary} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] tracking-[0.3em] uppercase opacity-50">streak</div>
        <div className="font-['Fraunces',serif] text-[42px] leading-none mt-1">{current}</div>
        <div className="text-[11px] opacity-60 mt-1">{longest} longest · {total} total</div>
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  const preview = (entry.body || "an empty page.").split("\n").filter(Boolean).slice(0, 3).join(" · ").slice(0, 180);
  const date = new Date(entry.createdAt);
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const moodColor = entry.mood ? MOOD_META[entry.mood].color : border;
  return (
    <Link to="/journal/$id" params={{ id: entry.id }}
      className="group block rounded-3xl p-5 backdrop-blur-md transition hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.72)", border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-[0.3em] uppercase opacity-50">{label}</div>
        <div className="w-2 h-2 rounded-full" style={{ background: moodColor }} />
      </div>
      <div className="font-['Fraunces',serif] text-[19px] leading-tight mb-2 line-clamp-2">
        {entry.title || "untitled page"}
      </div>
      <p className="text-[12.5px] opacity-70 line-clamp-3 leading-relaxed">{preview}</p>
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {entry.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-[10px] opacity-60">#{t}</span>
        ))}
        {entry.secret && <Lock className="w-3 h-3 ml-auto opacity-50" />}
      </div>
    </Link>
  );
}

// ── modals ────────────────────────────────────────────────────
function ModalShell({ title, kicker, onClose, children, wide }: { title: string; kicker: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(29,42,68,0.4)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-3xl overflow-hidden max-h-[90vh] flex flex-col`}
        style={{ background: surface, border: `1px solid ${border}`, boxShadow: "0 40px 80px -20px rgba(29,42,68,0.35)" }}>
        <div className="flex items-start justify-between p-5 sm:p-7 pb-3">
          <div>
            <div className="text-[9px] tracking-[0.32em] uppercase opacity-50">{kicker}</div>
            <h3 className="font-['Fraunces',serif] text-[26px] font-light mt-1">{title}</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
            style={{ background: surface2 }} aria-label="close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 sm:px-7 pb-6 sm:pb-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ThemesModal({ prefs, onChange, onClose }: { prefs: JournalPrefs; onChange: (p: JournalPrefs) => void; onClose: () => void }) {
  const themes = Object.keys(THEME_META) as ThemeName[];
  return (
    <ModalShell kicker="themes" title="dress your journal" onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2 mt-2">
        {themes.map((t) => {
          const m = THEME_META[t];
          const active = prefs.theme === t;
          return (
            <button key={t} onClick={() => onChange({ ...prefs, theme: t })}
              className="text-left rounded-2xl overflow-hidden transition hover:-translate-y-0.5"
              style={{ border: `1.5px solid ${active ? primary : border}` }}>
              <div className="h-24 relative" style={{ background: m.bg }}>
                <div className="absolute inset-3 rounded-xl flex items-center px-4 font-['Fraunces',serif] text-[16px]"
                  style={{ background: m.surface, color: m.ink, border: `1px solid ${m.accent}22` }}>
                  a soft page.
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: surface }}>
                <div>
                  <div className="text-[13px]">{m.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{m.note}</div>
                </div>
                {active && <Check className="w-4 h-4" style={{ color: primary }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${border}` }}>
        <div className="text-[10px] tracking-[0.32em] uppercase opacity-60 mb-3">reading size</div>
        <div className="flex gap-2">
          {[1, 1.1, 1.25].map((f) => (
            <button key={f} onClick={() => onChange({ ...prefs, fontScale: f as 1 | 1.1 | 1.25 })}
              className="flex-1 h-11 rounded-full transition"
              style={{
                background: prefs.fontScale === f ? ink : surface2,
                color: prefs.fontScale === f ? "#fff" : ink,
                fontSize: `${13 * f}px`,
              }}>Aa</button>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

function PrivacyModal({
  prefs, unlocked, onChange, onUnlock, onLock, onClose,
}: {
  prefs: JournalPrefs; unlocked: boolean;
  onChange: (p: JournalPrefs) => void;
  onUnlock: () => void; onLock: () => void; onClose: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "set" | "unlock">(prefs.lockEnabled ? "unlock" : "idle");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canWebAuthn = typeof window !== "undefined" && !!(window as any).PublicKeyCredential;

  async function enableLock() {
    if (pw.length < 4) return setErr("use at least 4 characters.");
    if (pw !== pw2) return setErr("passwords do not match.");
    setBusy(true);
    try {
      const hash = await hashPassword(pw);
      onChange({ ...prefs, lockEnabled: true, passwordHash: hash });
      onUnlock();
      setPw(""); setPw2(""); setErr(null); setMode("idle");
    } finally { setBusy(false); }
  }
  async function tryUnlock() {
    setBusy(true);
    try {
      const hash = await hashPassword(pw);
      if (hash === prefs.passwordHash) { onUnlock(); setPw(""); setErr(null); onClose(); }
      else setErr("that key doesn't fit.");
    } finally { setBusy(false); }
  }
  function disableLock() {
    onChange({ ...prefs, lockEnabled: false, passwordHash: undefined, biometricEnabled: false, webauthnCredId: undefined });
    onLock();
    setMode("idle");
  }
  async function enableBiometric() {
    if (!canWebAuthn) return;
    try {
      const cred = await (navigator.credentials as any).create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "PeaceCode Journal" },
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: "keya@peacecode.app",
            displayName: "Keya",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { userVerification: "required" },
          timeout: 60000,
        },
      });
      if (cred?.id) {
        onChange({ ...prefs, biometricEnabled: true, webauthnCredId: cred.id });
      }
    } catch { /* user cancelled */ }
  }
  async function tryBiometric() {
    if (!canWebAuthn || !prefs.webauthnCredId) return;
    try {
      await (navigator.credentials as any).get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          userVerification: "required",
          allowCredentials: [{ type: "public-key", id: base64ToBytes(prefs.webauthnCredId) }],
          timeout: 60000,
        },
      });
      onUnlock(); onClose();
    } catch { setErr("biometric didn't verify."); }
  }

  return (
    <ModalShell kicker="privacy" title="a lock on the door" onClose={onClose}>
      {!prefs.lockEnabled && mode !== "set" && (
        <div>
          <p className="text-[13px] opacity-70 leading-relaxed">
            when locked, your journal — and the <em>secret</em> folder — stays hidden until you unlock it. everything lives only on this device.
          </p>
          <button onClick={() => setMode("set")}
            className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13px]"
            style={{ background: ink, color: "#fff" }}>
            <Lock className="w-4 h-4" /> set a password
          </button>
        </div>
      )}

      {mode === "set" && (
        <div className="space-y-3 mt-2">
          <PwInput placeholder="choose a password" value={pw} onChange={setPw} />
          <PwInput placeholder="confirm password" value={pw2} onChange={setPw2} />
          {err && <div className="text-[12px]" style={{ color: "#B7625C" }}>{err}</div>}
          <div className="flex gap-2 pt-2">
            <button onClick={enableLock} disabled={busy}
              className="h-11 px-5 rounded-full text-[13px] disabled:opacity-50"
              style={{ background: ink, color: "#fff" }}>enable lock</button>
            <button onClick={() => { setMode(prefs.lockEnabled ? "unlock" : "idle"); setErr(null); }}
              className="h-11 px-4 rounded-full text-[13px]"
              style={{ background: surface2 }}>cancel</button>
          </div>
        </div>
      )}

      {prefs.lockEnabled && mode !== "set" && (
        <div className="space-y-4">
          {!unlocked ? (
            <>
              <PwInput placeholder="password" value={pw} onChange={setPw} />
              {err && <div className="text-[12px]" style={{ color: "#B7625C" }}>{err}</div>}
              <div className="flex gap-2">
                <button onClick={tryUnlock} disabled={busy}
                  className="h-11 px-5 rounded-full text-[13px] disabled:opacity-50"
                  style={{ background: ink, color: "#fff" }}>unlock</button>
                {prefs.biometricEnabled && (
                  <button onClick={tryBiometric}
                    className="h-11 px-5 rounded-full text-[13px]"
                    style={{ background: surface2 }}>use face id / touch id</button>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 rounded-2xl text-[13px] flex items-center gap-2"
              style={{ background: "rgba(159,199,168,0.18)", border: `1px solid ${border}` }}>
              <Check className="w-4 h-4" style={{ color: "#5A8F6B" }} /> unlocked for this session.
            </div>
          )}
          <div className="pt-4" style={{ borderTop: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-2">biometric</div>
            {canWebAuthn ? (
              prefs.biometricEnabled ? (
                <div className="text-[12px] opacity-70">face id / touch id is on for this device.</div>
              ) : (
                <button onClick={enableBiometric}
                  className="h-10 px-4 rounded-full text-[12px]"
                  style={{ background: surface2, border: `1px solid ${border}` }}>enable face id / touch id</button>
              )
            ) : (
              <div className="text-[12px] opacity-60">this device does not offer biometric unlock.</div>
            )}
          </div>
          <div className="pt-4 flex justify-between items-center" style={{ borderTop: `1px solid ${border}` }}>
            <button onClick={() => setMode("set")} className="text-[12px] opacity-70 hover:opacity-100">change password</button>
            <button onClick={disableLock} className="text-[12px]" style={{ color: "#B7625C" }}>disable lock</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function PwInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input type="password" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full h-11 px-4 rounded-full text-[13px] outline-none"
      style={{ background: surface2, border: `1px solid ${border}` }} />
  );
}

function base64ToBytes(b64: string): Uint8Array {
  // WebAuthn credential IDs are base64url; normalize
  const s = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? s + "=".repeat(4 - (s.length % 4)) : s;
  try {
    const bin = atob(pad);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  } catch { return new Uint8Array(); }
}

function InsightsModal({ entries, onClose }: { entries: JournalEntry[]; onClose: () => void }) {
  const askMonthly = useServerFn(monthlyReflection);
  const saved = entries.filter((e) => e.status === "saved");
  const heat = useMemo(() => buildHeatmap(saved, 14), [saved]);
  const emotions = useMemo(() => topEmotions(saved), [saved]);
  const words = useMemo(() => topWords(saved), [saved]);
  const month = useMemo(() => monthMoodTrend(saved), [saved]);
  const totalEmotions = emotions.reduce((a, [, n]) => a + n, 0) || 1;
  const maxWord = words[0]?.[1] ?? 1;
  const maxHeat = Math.max(1, ...heat.map((c) => c.count));

  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  async function generate() {
    setBusy(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const seed = saved
        .filter((e) => new Date(e.createdAt) >= monthStart)
        .slice(0, 8)
        .map((e) => `${new Date(e.createdAt).toDateString()}: ${e.body}`)
        .join("\n\n---\n\n").slice(0, 6000);
      if (!seed) { setSummary("no entries yet this month — start with a single line and peace will listen."); return; }
      const res = await askMonthly({ data: { text: seed } });
      setSummary(res.text || "");
    } catch { setSummary("peace is resting. try again in a moment."); }
    finally { setBusy(false); }
  }

  return (
    <ModalShell kicker="insights" title="the shape of your month" onClose={onClose} wide>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* heatmap */}
        <div className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">writing heatmap · 14 weeks</div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] auto-cols-fr">
            {heat.map((c) => {
              const intensity = c.count === 0 ? 0 : Math.min(1, c.count / maxHeat);
              const isFuture = c.date > new Date();
              return (
                <div key={c.key} title={`${c.key} · ${c.count} ${c.count === 1 ? "entry" : "entries"}`}
                  className="w-full aspect-square rounded-[3px] transition-all"
                  style={{
                    background: isFuture ? "transparent" : c.count === 0
                      ? "rgba(75,108,183,0.08)"
                      : `rgba(75,108,183,${0.2 + intensity * 0.7})`,
                    border: isFuture ? `1px dashed ${border}` : "none",
                  }} />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] opacity-60">
            <span>less</span>
            <div className="flex gap-0.5">
              {[0.15, 0.35, 0.55, 0.75, 0.95].map((a, i) => (
                <div key={i} className="w-3 h-3 rounded-[2px]" style={{ background: `rgba(75,108,183,${a})` }} />
              ))}
            </div>
            <span>more</span>
          </div>
        </div>

        {/* emotions */}
        <div className="rounded-2xl p-4" style={{ background: surface2, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">most common emotions</div>
          <div className="space-y-2">
            {emotions.length === 0 && <div className="text-[12px] opacity-60 italic">tag your mood to see this fill in.</div>}
            {emotions.map(([m, n]) => (
              <div key={m}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2"><span>{MOOD_META[m].emoji}</span>{MOOD_META[m].label}</span>
                  <span className="opacity-60">{n} · {Math.round((n / totalEmotions) * 100)}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(n / totalEmotions) * 100}%`, background: MOOD_META[m].color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* month trend */}
        <div className="rounded-2xl p-4 lg:col-span-2" style={{ background: surface2, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">mood trend · last 30 days</div>
          <svg viewBox="0 0 300 80" className="w-full h-24">
            <defs>
              <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity="0.35" />
                <stop offset="100%" stopColor={primary} stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const pts = month.map((d, i) => ({
                x: (i / (month.length - 1)) * 300,
                y: d.value == null ? null : 70 - ((d.value - 1) / 4) * 60,
              }));
              const filled = pts.filter((p) => p.y != null) as { x: number; y: number }[];
              if (filled.length < 2) return <text x="150" y="45" textAnchor="middle" fontSize="11" fill={muted}>not enough days yet.</text>;
              const line = filled.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
              const area = `${line} L${filled[filled.length - 1].x},80 L${filled[0].x},80 Z`;
              return (
                <>
                  <path d={area} fill="url(#trendFill)" />
                  <path d={line} fill="none" stroke={primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  {filled.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="1.8" fill={primary} />
                  ))}
                </>
              );
            })()}
          </svg>
        </div>

        {/* words */}
        <div className="rounded-2xl p-4 lg:col-span-2" style={{ background: surface2, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">most used words</div>
          {words.length === 0 ? (
            <div className="text-[12px] opacity-60 italic">a few pages and we'll notice your words.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {words.map(([w, n]) => {
                const s = 11 + (n / maxWord) * 16;
                return (
                  <span key={w}
                    className="font-['Fraunces',serif] leading-none"
                    style={{ fontSize: `${s}px`, color: ink, opacity: 0.55 + (n / maxWord) * 0.45 }}>
                    {w}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* monthly reflection */}
        <div className="rounded-2xl p-4 lg:col-span-2" style={{ background: "rgba(213,201,247,0.35)", border: `1px solid ${border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">monthly reflection</div>
            <button onClick={generate} disabled={busy}
              className="text-[11px] px-3 h-7 rounded-full inline-flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: surface }}>
              <RefreshCw className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} /> {summary ? "regenerate" : "generate"}
            </button>
          </div>
          {summary ? (
            <p className="font-['Fraunces',serif] italic text-[16px] leading-relaxed whitespace-pre-line">{summary}</p>
          ) : (
            <p className="text-[12.5px] opacity-70 italic">
              tap generate — peace will read this month's pages and write a small reflection back to you.
            </p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
