import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles, ArrowRight, Heart, Users, TreePine, LineChart, Lock,
  Shield, Trophy, Bell, BellOff, Plus, Send, Flame, Bookmark, Quote, RefreshCw,
} from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import {
  loadEntries, upsertEntry, newId, computeStreak, computeTree, todayCount,
  loadPrefs, savePrefs, computeAchievements, loadCommunity, computeForest,
  MOODS, CATEGORIES, STAGES,
  type GratitudeEntry, type Prefs, type Category, type GratitudePrivacy,
} from "@/lib/gratitude-store";
import { gratitudeAI } from "@/lib/gratitude-ai.functions";
import { getPermission, requestPermission, startReminderLoop, type NotifyPermission } from "@/lib/gratitude-notify";

export const Route = createFileRoute("/gratitude/")({
  head: () => ({
    meta: [
      { title: "Gratitude — PeaceCode" },
      { name: "description", content: "Plant a seed of gratitude every day. Grow a quiet tree over time." },
      { property: "og:title", content: "Gratitude — PeaceCode" },
      { property: "og:description", content: "A tender ecosystem for daily gratitude." },
    ],
  }),
  component: GratitudePage,
});

const QUOTES = [
  "gratitude turns what we have into enough.",
  "the softest practice, repeated, becomes the strongest root.",
  "small mercies stack. that is a life.",
  "notice the ordinary. it is holding you.",
  "what you water, grows.",
];

function GratitudePage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [prompt, setPrompt] = useState<string>("");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [composer, setComposer] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [privacy, setPrivacy] = useState<GratitudePrivacy>("private");
  const [category, setCategory] = useState<Category | null>(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAch, setShowAch] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [reflection, setReflection] = useState<string>("");
  const [loadingReflection, setLoadingReflection] = useState(false);
  const [monthlyReflection, setMonthlyReflection] = useState<string>("");
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotifyPermission>("default");
  const promptFn = useServerFn(gratitudeAI);
  const reflectFn = useServerFn(gratitudeAI);

  useEffect(() => { setEntries(loadEntries()); }, []);
  useEffect(() => { setPrivacy(prefs.defaultPrivacy); }, [prefs.defaultPrivacy]);

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const tree = useMemo(() => computeTree(entries), [entries]);
  const today = useMemo(() => todayCount(entries), [entries]);
  const forest = useMemo(() => computeForest(entries), [entries]);
  const community = useMemo(() => loadCommunity().slice(0, 3), []);
  const recent = entries.slice(0, 3);
  const lastDraft = entries.find((e) => e.status === "draft") ?? null;
  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);
  const achievements = useMemo(() => computeAchievements(entries), [entries]);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  async function refreshPrompt() {
    setLoadingPrompt(true);
    try {
      const r = await promptFn({ data: { kind: "prompt", context: `streak:${streak.current}, today:${today}` } });
      setPrompt(r.text);
    } finally { setLoadingPrompt(false); }
  }
  useEffect(() => { if (!prompt) void refreshPrompt(); /* eslint-disable-next-line */ }, []);

  // Kick off notification loop when prefs change or on mount.
  useEffect(() => {
    setNotifPerm(getPermission());
    const stop = startReminderLoop(() => loadPrefs());
    return stop;
  }, [prefs]);

  async function enableNotifications() {
    const r = await requestPermission();
    setNotifPerm(r);
  }

  async function generateReflection(kind: "reflect_week" | "reflect_month") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (kind === "reflect_week" ? 7 : 30));
    const relevant = entries.filter((e) => new Date(e.createdAt) >= cutoff);
    if (relevant.length === 0) {
      const empty = kind === "reflect_week"
        ? "no entries this week yet. one small note starts the pattern."
        : "the month is quiet. plant a seed to begin.";
      if (kind === "reflect_week") setReflection(empty);
      else setMonthlyReflection(empty);
      return;
    }
    const text = relevant.map((e) => `- ${e.body}`).join("\n").slice(0, 4000);
    if (kind === "reflect_week") setLoadingReflection(true); else setLoadingMonthly(true);
    try {
      const r = await reflectFn({ data: { kind, text } });
      if (kind === "reflect_week") setReflection(r.text);
      else setMonthlyReflection(r.text);
    } finally {
      if (kind === "reflect_week") setLoadingReflection(false); else setLoadingMonthly(false);
    }
  }

  function plantSeed() {
    if (!composer.trim()) return;
    const now = new Date().toISOString();
    const entry: GratitudeEntry = {
      id: newId(),
      createdAt: now,
      updatedAt: now,
      title: "",
      body: composer.trim(),
      mood: "grateful",
      emoji: "🌱",
      tags: [],
      category,
      privacy,
      status: "saved",
    };
    upsertEntry(entry);
    setEntries(loadEntries());
    setComposer("");
    setComposerOpen(false);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1400);
  }

  const { ink, muted, border, primary, surface, surface2 } = palette;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden rounded-[32px] p-6 sm:p-10 lg:p-14"
                 style={{ background: `linear-gradient(160deg, ${surface} 0%, ${surface2} 100%)`, border: `1px solid ${border}` }}>
          <BackgroundLeaves />
          <div className="relative flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase mb-4" style={{ color: primary }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
                today's gratitude
              </div>
              <h1 className="font-serif italic leading-[1.02] tracking-tight text-[42px] sm:text-[58px] lg:text-[68px]" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
                one small<br/>mercy, noted.
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: muted }}>
                {loadingPrompt ? "peace is thinking of a prompt…" : prompt || "what small thing softened your day today?"}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs" style={{ color: muted }}>
                <button onClick={refreshPrompt} disabled={loadingPrompt} className="inline-flex items-center gap-1.5 opacity-80 hover:opacity-100 transition">
                  <Sparkles className="w-3.5 h-3.5" /> new prompt
                </button>
                <span className="opacity-40">·</span>
                <span>{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span>
              </div>

              {/* composer */}
              <div className="mt-8 rounded-3xl p-5 sm:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
                {!composerOpen ? (
                  <button onClick={() => setComposerOpen(true)}
                          className="w-full text-left flex items-center gap-3 text-[15px] transition hover:opacity-80" style={{ color: muted }}>
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl" style={{ background: surface2 }}>
                      <Plus className="w-4 h-4" style={{ color: primary }} />
                    </span>
                    plant a small mercy…
                  </button>
                ) : (
                  <>
                    <textarea
                      autoFocus
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      placeholder="today i noticed…"
                      rows={3}
                      className="w-full resize-none bg-transparent outline-none text-[15px] leading-relaxed placeholder:opacity-40"
                      style={{ color: ink }}
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <PrivacyPill value={privacy} onChange={setPrivacy} />
                      <CategoryPill value={category} onChange={setCategory} />
                      <div className="ml-auto flex items-center gap-2">
                        <button onClick={() => { setComposer(""); setComposerOpen(false); }} className="text-xs opacity-60 hover:opacity-90 px-3 py-2">cancel</button>
                        <button onClick={plantSeed} disabled={!composer.trim()}
                                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full transition disabled:opacity-40 hover:opacity-90"
                                style={{ background: primary, color: "white" }}>
                          <Send className="w-3.5 h-3.5" /> plant seed
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {saveFlash && (
                  <div className="mt-3 text-[11px] tracking-[0.2em] uppercase" style={{ color: primary }}>
                    seed planted · your tree stirred.
                  </div>
                )}
              </div>

              {lastDraft && !composerOpen && (
                <button onClick={() => { setComposer(lastDraft.body); setComposerOpen(true); }}
                        className="mt-4 text-xs inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 transition" style={{ color: muted }}>
                  <ArrowRight className="w-3.5 h-3.5" /> continue your last gratitude
                </button>
              )}
            </div>

            {/* tree summary */}
            <Link to="/gratitude/tree" className="w-full lg:w-[280px] shrink-0 rounded-3xl p-6 transition hover:-translate-y-0.5"
                  style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="text-[10px] tracking-[0.28em] uppercase mb-3" style={{ color: muted }}>your tree</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl">{tree.stage.emoji}</div>
                <div>
                  <div className="font-serif italic text-2xl leading-tight" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{tree.stage.label}</div>
                  <div className="text-[11px] opacity-60" style={{ color: muted }}>{tree.score} growth points</div>
                </div>
              </div>
              <BloomRing bloom={tree.bloom} primary={primary} border={border} className="mt-4" />
              <div className="mt-3 text-[11px] leading-relaxed" style={{ color: muted }}>
                {tree.next ? <>next: <span style={{ color: ink }}>{tree.next.label}</span></> : "you have reached the peace forest."}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] tracking-[0.24em] uppercase" style={{ color: primary }}>
                <span>enter garden</span><ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </section>

        {/* ─── COUNTS STRIP ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="today" value={String(today)} caption={today === 0 ? "plant one" : today === 1 ? "one so far" : `${today} today`} />
          <StatTile label="streak" value={String(streak.current)} caption={`longest ${streak.longest}`} icon={<Flame className="w-4 h-4" />} />
          <StatTile label="entries" value={String(entries.length)} caption="lifetime" />
          <StatTile label="community" value={forest.totalEntries.toLocaleString()} caption={`${forest.totalTrees.toLocaleString()} trees`} link="/gratitude/forest" />
        </section>

        {/* ─── PREVIEW ROW: recent + wall ─── */}
        <section className="grid lg:grid-cols-[1.15fr_1fr] gap-4">
          <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>recent</div>
                <h3 className="font-serif italic text-xl mt-1" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>your last three</h3>
              </div>
              <Link to="/gratitude/history" className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 opacity-80 hover:opacity-100" style={{ color: primary }}>
                all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="text-sm opacity-60 py-6" style={{ color: muted }}>
                nothing yet. plant your first seed above.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: border }}>
                {recent.map((e) => (
                  <li key={e.id} className="py-3 flex items-start gap-3">
                    <span className="mt-1 text-lg">{MOODS.find((m) => m.key === e.mood)?.emoji ?? "🕊️"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] leading-relaxed line-clamp-2" style={{ color: ink }}>{e.body}</div>
                      <div className="text-[11px] mt-1 opacity-60" style={{ color: muted }}>
                        {new Date(e.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        {e.category ? ` · ${e.category}` : ""}
                        {e.privacy !== "private" ? ` · ${e.privacy}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>community</div>
                <h3 className="font-serif italic text-xl mt-1" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>quiet gratitude, elsewhere</h3>
              </div>
              <Link to="/gratitude/wall" className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 opacity-80 hover:opacity-100" style={{ color: primary }}>
                wall <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <ul className="space-y-3">
              {community.map((c) => (
                <li key={c.id} className="rounded-2xl p-3.5" style={{ background: surface2 }}>
                  <div className="text-[13px] leading-relaxed" style={{ color: ink }}>{c.body}</div>
                  <div className="text-[11px] mt-1.5 opacity-60 flex items-center gap-2" style={{ color: muted }}>
                    <span>{c.anonymous ? "anonymous" : c.authorName}</span><span>·</span><span>{c.category}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── AI REFLECTIONS ─── */}
        <section className="grid lg:grid-cols-2 gap-3">
          <ReflectionCard
            label="this week"
            title="a soft read of the last seven days"
            text={reflection}
            loading={loadingReflection}
            onGenerate={() => generateReflection("reflect_week")}
            entriesInRange={entries.filter((e) => (Date.now() - new Date(e.createdAt).getTime()) < 7 * 86400000).length}
          />
          <ReflectionCard
            label="this month"
            title="what shifted, quietly"
            text={monthlyReflection}
            loading={loadingMonthly}
            onGenerate={() => generateReflection("reflect_month")}
            entriesInRange={entries.filter((e) => (Date.now() - new Date(e.createdAt).getTime()) < 30 * 86400000).length}
          />
        </section>

        {/* ─── DEEPER: reveal-on-click tiles ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <RevealTile to="/gratitude/tree"    icon={<TreePine className="w-4 h-4" />}   title="Tree & Garden" hint="watch it bloom" />
          <RevealTile to="/gratitude/history" icon={<LineChart className="w-4 h-4" />}  title="History & Analytics" hint="calendar, trends" />
          <RevealTile to="/gratitude/wall"    icon={<Users className="w-4 h-4" />}      title="Community Wall" hint="hearts & support" />
          <RevealTile to="/gratitude/forest"  icon={<Sparkles className="w-4 h-4" />}   title="Peace Forest" hint="every tree, together" />
        </section>

        {/* ─── modal openers ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => setShowAch(true)} className="rounded-3xl p-5 text-left transition hover:-translate-y-0.5"
                  style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>
              <Trophy className="w-3.5 h-3.5" /> achievements
            </div>
            <div className="mt-2 font-serif italic text-lg" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{unlocked} of {achievements.length}</div>
            <div className="text-[11px] opacity-60 mt-0.5" style={{ color: muted }}>unlocked so far</div>
          </button>

          <button onClick={() => setShowChallenges(true)} className="rounded-3xl p-5 text-left transition hover:-translate-y-0.5"
                  style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>
              <Flame className="w-3.5 h-3.5" /> challenges
            </div>
            <div className="mt-2 font-serif italic text-lg" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
              {prefs.activeChallenge ? `${prefs.activeChallenge}-day` : "start one"}
            </div>
            <div className="text-[11px] opacity-60 mt-0.5" style={{ color: muted }}>7 · 21 · 30 days</div>
          </button>

          <button onClick={() => setShowPrivacy(true)} className="rounded-3xl p-5 text-left transition hover:-translate-y-0.5"
                  style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>
              <Shield className="w-3.5 h-3.5" /> privacy
            </div>
            <div className="mt-2 font-serif italic text-lg" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{prefs.defaultPrivacy}</div>
            <div className="text-[11px] opacity-60 mt-0.5" style={{ color: muted }}>defaults & identity</div>
          </button>

          <button onClick={enableNotifications}
                  disabled={notifPerm === "unsupported" || notifPerm === "denied"}
                  className="rounded-3xl p-5 text-left transition hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>
              {notifPerm === "granted" ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />} notifications
            </div>
            <div className="mt-2 font-serif italic text-lg" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
              {notifPerm === "granted"
                ? `${[prefs.notifyDaily, prefs.notifyStreak, prefs.notifyBloom, prefs.notifyWeekly].filter(Boolean).length}/4 on`
                : notifPerm === "denied" ? "blocked"
                : notifPerm === "unsupported" ? "not available"
                : "enable"}
            </div>
            <div className="text-[11px] opacity-60 mt-0.5" style={{ color: muted }}>
              {notifPerm === "granted" ? "gentle reminders" : notifPerm === "denied" ? "allow in browser settings" : "tap to allow"}
            </div>
          </button>
        </section>

        {/* ─── quote ─── */}
        <section className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
                 style={{ background: surface, border: `1px solid ${border}` }}>
          <Quote className="w-6 h-6 mx-auto opacity-30" style={{ color: primary }} />
          <p className="mt-4 font-serif italic text-2xl sm:text-3xl leading-relaxed max-w-xl mx-auto" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
            {quote}
          </p>
        </section>

        <div className="text-center text-[11px] tracking-[0.24em] uppercase pt-4 pb-8 opacity-50" style={{ color: muted }}>
          peacecode · a soft place to notice
        </div>
      </div>

      {/* ─── modals ─── */}
      {showAch && (
        <Modal onClose={() => setShowAch(false)} title="Achievements">
          <div className="grid sm:grid-cols-2 gap-2.5">
            {achievements.map((a) => (
              <div key={a.key} className="rounded-2xl p-4" style={{ background: a.unlocked ? surface2 : surface, border: `1px solid ${border}`, opacity: a.unlocked ? 1 : 0.55 }}>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" style={{ color: a.unlocked ? primary : muted }} />
                  <div className="font-serif italic text-lg" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{a.label}</div>
                </div>
                <div className="text-[12px] mt-1" style={{ color: muted }}>{a.hint}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showChallenges && (
        <Modal onClose={() => setShowChallenges(false)} title="Challenges">
          <ChallengesPanel prefs={prefs} onChange={(p) => { setPrefs(p); savePrefs(p); }} />
        </Modal>
      )}

      {showPrivacy && (
        <Modal onClose={() => setShowPrivacy(false)} title="Privacy">
          <PrivacyPanel prefs={prefs} onChange={(p) => { setPrefs(p); savePrefs(p); }} onDeleteAll={() => {
            if (confirm("Delete all gratitude entries? This cannot be undone.")) {
              localStorage.removeItem("peacecode.gratitude.entries.v1");
              setEntries([]);
            }
          }} />
        </Modal>
      )}
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────
// small pieces
// ────────────────────────────────────────────────────────

function ReflectionCard({ label, title, text, loading, onGenerate, entriesInRange }: {
  label: string; title: string; text: string; loading: boolean; onGenerate: () => void; entriesInRange: number;
}) {
  const { ink, muted, border, primary, surface, surface2 } = palette;
  return (
    <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>peace's reflection · {label}</div>
          <h3 className="font-serif italic text-xl mt-1" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{title}</h3>
        </div>
        <button onClick={onGenerate} disabled={loading}
                className="text-[11px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition hover:opacity-90 disabled:opacity-50"
                style={{ background: surface2, color: primary }}>
          <Sparkles className="w-3 h-3" /> {loading ? "reading…" : text ? "again" : "reflect"}
        </button>
      </div>
      {text ? (
        <p className="font-serif italic text-[15px] leading-relaxed whitespace-pre-line" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{text}</p>
      ) : (
        <p className="text-sm" style={{ color: muted }}>
          {entriesInRange === 0
            ? "no entries yet in this window. plant one, then reflect."
            : `${entriesInRange} ${entriesInRange === 1 ? "entry" : "entries"} waiting. tap reflect for a soft summary.`}
        </p>
      )}
    </div>
  );
}

function BackgroundLeaves() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="leafG" x1="0" x2="1">
          <stop offset="0" stopColor="#AFC9F5" stopOpacity="0.18"/>
          <stop offset="1" stopColor="#D5C9F7" stopOpacity="0.12"/>
        </linearGradient>
      </defs>
      <path d="M-40 340 C 120 260, 260 380, 420 300 S 720 260, 860 320" fill="none" stroke="url(#leafG)" strokeWidth="60"/>
      <path d="M0 60 C 140 20, 320 120, 500 60 S 780 40, 900 100" fill="none" stroke="url(#leafG)" strokeWidth="30"/>
    </svg>
  );
}

function BloomRing({ bloom, primary, border, className = "" }: { bloom: number; primary: string; border: string; className?: string }) {
  const R = 26, C = 2 * Math.PI * R;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={R} fill="none" stroke={border} strokeWidth="4" />
        <circle cx="32" cy="32" r={R} fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - bloom)} transform="rotate(-90 32 32)"
                style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.4,0,.2,1)" }}/>
      </svg>
      <div>
        <div className="font-serif italic text-xl leading-none" style={{ fontFamily: "'Fraunces', serif" }}>{Math.round(bloom * 100)}%</div>
        <div className="text-[10px] tracking-[0.24em] uppercase opacity-60 mt-1">bloom</div>
      </div>
    </div>
  );
}

function StatTile({ label, value, caption, icon, link }: { label: string; value: string; caption: string; icon?: React.ReactNode; link?: string }) {
  const { ink, muted, border, primary, surface } = palette;
  const inner = (
    <div className="rounded-3xl p-5 h-full transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>
        {icon}<span>{label}</span>
      </div>
      <div className="mt-1 font-serif italic text-3xl" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{value}</div>
      <div className="text-[11px] opacity-60 mt-0.5" style={{ color: muted }}>{caption}</div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : inner;
}

function RevealTile({ to, icon, title, hint }: { to: string; icon: React.ReactNode; title: string; hint: string }) {
  const { ink, muted, border, primary, surface } = palette;
  return (
    <Link to={to} className="rounded-3xl p-5 transition hover:-translate-y-0.5 group" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase" style={{ color: primary }}>
        {icon}<span>{title}</span>
      </div>
      <div className="mt-3 font-serif italic text-lg" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{hint}</div>
      <div className="mt-2 text-[11px] inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition" style={{ color: muted }}>
        open <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function PrivacyPill({ value, onChange }: { value: GratitudePrivacy; onChange: (v: GratitudePrivacy) => void }) {
  const { border, muted, primary } = palette;
  const opts: { v: GratitudePrivacy; label: string }[] = [
    { v: "private", label: "private" },
    { v: "public", label: "public" },
    { v: "anonymous", label: "anonymous" },
  ];
  return (
    <div className="inline-flex rounded-full p-0.5 text-[11px]" style={{ border: `1px solid ${border}` }}>
      {opts.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)}
                className="px-3 py-1.5 rounded-full transition"
                style={{ background: value === o.v ? primary : "transparent", color: value === o.v ? "white" : muted }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CategoryPill({ value, onChange }: { value: Category | null; onChange: (v: Category | null) => void }) {
  const { border, muted } = palette;
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
              className="text-[11px] px-3 py-1.5 rounded-full transition hover:opacity-90"
              style={{ border: `1px solid ${border}`, color: value ? palette.ink : muted }}>
        {value ?? "category"}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 rounded-2xl p-2 grid grid-cols-2 gap-1 w-[280px] shadow-lg"
             style={{ background: palette.surface, border: `1px solid ${border}` }}>
          <button onClick={() => { onChange(null); setOpen(false); }}
                  className="text-[11px] text-left px-2 py-1.5 rounded-lg hover:bg-black/5" style={{ color: muted }}>none</button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                    className="text-[11px] text-left px-2 py-1.5 rounded-lg hover:bg-black/5" style={{ color: palette.ink }}>{c}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  const { ink, muted, border, surface } = palette;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-auto rounded-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4"
           style={{ background: surface, border: `1px solid ${border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif italic text-2xl" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{title}</h3>
          <button onClick={onClose} className="text-xs opacity-60 hover:opacity-100" style={{ color: muted }}>close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ChallengesPanel({ prefs, onChange }: { prefs: Prefs; onChange: (p: Prefs) => void }) {
  const { ink, muted, border, primary, surface2 } = palette;
  const options: { key: NonNullable<Prefs["activeChallenge"]>; label: string; hint: string }[] = [
    { key: "7", label: "7-Day Gratitude", hint: "a gentle week" },
    { key: "21", label: "21-Day Gratitude", hint: "habit forming" },
    { key: "30", label: "30-Day Gratitude", hint: "a full moon" },
    { key: "college", label: "College Circle", hint: "with your campus" },
    { key: "friends", label: "Friends Circle", hint: "invite close ones" },
  ];
  return (
    <div className="space-y-2.5">
      {options.map((o) => {
        const active = prefs.activeChallenge === o.key;
        return (
          <button key={o.key}
                  onClick={() => onChange({ ...prefs, activeChallenge: active ? undefined : o.key, challengeStartedAt: active ? undefined : new Date().toISOString() })}
                  className="w-full text-left rounded-2xl p-4 transition hover:-translate-y-0.5"
                  style={{ background: active ? surface2 : "transparent", border: `1px solid ${active ? primary : border}` }}>
            <div className="font-serif italic text-lg" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{o.label}</div>
            <div className="text-[12px]" style={{ color: muted }}>{o.hint} {active && "· active"}</div>
          </button>
        );
      })}
    </div>
  );
}

function PrivacyPanel({ prefs, onChange, onDeleteAll }: { prefs: Prefs; onChange: (p: Prefs) => void; onDeleteAll: () => void }) {
  const { ink, muted, border } = palette;
  const Row = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-3 border-b" style={{ borderColor: border }}>
      <span className="text-sm" style={{ color: ink }}>{label}</span>
      <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: value ? palette.primary : muted }}>{value ? "on" : "off"}</span>
    </button>
  );
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] tracking-[0.28em] uppercase mb-2" style={{ color: muted }}>default privacy</div>
        <PrivacyPill value={prefs.defaultPrivacy} onChange={(v) => onChange({ ...prefs, defaultPrivacy: v })} />
      </div>
      <div className="rounded-2xl px-2" style={{ border: `1px solid ${border}` }}>
        <Row label="anonymous mode by default" value={prefs.anonymousMode} onToggle={() => onChange({ ...prefs, anonymousMode: !prefs.anonymousMode })} />
        <Row label="hide identity on public wall" value={prefs.hideIdentity} onToggle={() => onChange({ ...prefs, hideIdentity: !prefs.hideIdentity })} />
        <Row label="daily gratitude reminder" value={prefs.notifyDaily} onToggle={() => onChange({ ...prefs, notifyDaily: !prefs.notifyDaily })} />
        <Row label="streak reminder" value={prefs.notifyStreak} onToggle={() => onChange({ ...prefs, notifyStreak: !prefs.notifyStreak })} />
        <Row label="tree bloom notification" value={prefs.notifyBloom} onToggle={() => onChange({ ...prefs, notifyBloom: !prefs.notifyBloom })} />
        <Row label="weekly reflection" value={prefs.notifyWeekly} onToggle={() => onChange({ ...prefs, notifyWeekly: !prefs.notifyWeekly })} />
      </div>
      <button onClick={onDeleteAll} className="text-[11px] tracking-[0.24em] uppercase opacity-70 hover:opacity-100 hover:text-red-500 transition" style={{ color: muted }}>
        delete all gratitude entries
      </button>
    </div>
  );
}
