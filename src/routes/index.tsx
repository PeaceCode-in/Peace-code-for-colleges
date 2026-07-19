// PeaceCode — Dashboard.
// Editorial, product-grade wellness overview. One unified surface, not a card grid.
// Inspired by Apple Health, Linear, Notion Calendar, Arc, Things 3.

import { createFileRoute, Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { currentDisplayName, loadSession } from "@/lib/auth-store";

import * as journal from "@/lib/journal-store";
import * as gratitude from "@/lib/gratitude-store";
import * as breathe from "@/lib/breathe-store";
import * as focus from "@/lib/focus-store";
import * as counselling from "@/lib/counselling-store";
import * as screening from "@/lib/screening-store";
import { useMindGym, ensureBootstrapped, brainOverall, weeklyStats } from "@/lib/mindgym-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PeaceCode" },
      { name: "description", content: "A calm, editorial overview of your mind, day and next step." },
      { property: "og:title", content: "Dashboard — PeaceCode" },
      { property: "og:description", content: "Your wellness, told softly from top to bottom." },
    ],
  }),
  component: () => (<AuthGate><AppShell><DashboardInner /></AppShell></AuthGate>),
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const session = loadSession();
    const guest = typeof window !== "undefined" && localStorage.getItem("pc.auth.guest") === "1";
    if (!session && !guest) { nav({ to: "/auth" }); return; }
    setOk(true);
  }, [nav]);
  if (!ok) return null;
  return <>{children}</>;
}

// ─── data ────────────────────────────────────────────────────────────
function useData() {
  const [d, setD] = useState<any>({ ready: false });
  useEffect(() => {
    try {
      const j = journal.loadEntries();
      const g = gratitude.loadEntries();
      const b = breathe.loadSessions();
      const f = focus.loadSessions();
      const scr = screening.loadSessions();
      const appts = counselling.listAppointments().sort((a,b) => a.scheduledFor - b.scheduledFor);
      setD({
        ready: true,
        journalStreak: journal.computeStreak(j).current,
        journalWeek: j.filter((e:any)=>e.status==="saved" && Date.now()-new Date(e.updatedAt||e.createdAt).getTime()<7*864e5).length,
        moodTrend: journal.weekMoodTrend(j),
        gratitudeStreak: gratitude.computeStreak(g).current,
        gratitudeToday: gratitude.todayCount(g),
        breatheStreak: breathe.computeStreak(b).current,
        breatheToday: b.filter((s:any)=>breathe.dayKey(s.completedAt)===breathe.dayKey(new Date())).length,
        focusWeekMin: Math.round(f.filter((s:any)=>Date.now()-new Date(s.completedAt).getTime()<7*864e5).reduce((a:number,s:any)=>a+(s.planned||0)/60,0)),
        focusStreak: focus.computeStreaks(f).current,
        nextAppt: appts.find(a=>a.status!=="cancelled" && a.scheduledFor>Date.now()),
        wellness: screening.overallWellness(scr),
      });
    } catch { setD({ ready: true }); }
  }, []);
  return d;
}

// ─── Dashboard ───────────────────────────────────────────────────────
function DashboardInner() {
  const data = useData();
  const mg = useMindGym();
  useEffect(() => { ensureBootstrapped(); }, []);
  const [who, setWho] = useState(() => ({ full: "Guest Student", first: "Guest", isGuest: true }));
  useEffect(() => { setWho(currentDisplayName()); }, []);

  const hydrated = useHydrated();
  const now = hydrated ? new Date() : null;
  const hour = now ? now.getHours() : -1;
  const greet = !now ? "Welcome" : hour < 5 ? "Still awake" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Quiet night";
  const dateLine = now ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "\u00a0";

  const overall = brainOverall(mg.brain);
  const week = weeklyStats();

  const peace = useMemo(() => {
    const base = overall;
    const streakBoost = Math.min(12, ((mg.streak.current||0) + (data.breatheStreak||0)));
    const act = Math.min(10, ((data.journalWeek||0) + (data.breatheToday||0)) * 2);
    return Math.round(Math.min(100, base * 0.7 + streakBoost + act)) || 50;
  }, [overall, mg.streak.current, data.breatheStreak, data.journalWeek, data.breatheToday]);

  const focusMin = data.focusWeekMin || 0;
  const journalStreak = data.journalStreak || 0;
  const breatheStreak = data.breatheStreak || 0;
  const mindStreak = mg.streak.current || 0;
  const emoStability = Math.round(50 + (peace - 50) * 0.6);

  // Narrative status one-liner
  const status = useMemo(() => {
    if (peace >= 75) return "Steady mind. Keep the rhythm — a soft walk before evening will hold it.";
    if (peace >= 55) return "You're finding balance. One small ritual today will lock it in.";
    if (peace >= 40) return "A quieter day. Give yourself three breaths before the next task.";
    return "Tender day. Nothing to fix — just meet yourself where you are.";
  }, [peace]);

  const trend = useMemo(() => makeTrend(peace), [peace]);

  return (
    <div className="relative z-10 w-full max-w-[1240px] px-5 sm:px-8 lg:px-10 lg:pr-24">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <section className="pt-4 sm:pt-6 lg:pt-8 pb-8 sm:pb-12">

        <div className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end gap-6">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.36em] uppercase" style={{ color: "var(--pc-muted)" }}>
              {dateLine}
            </div>
            <h1 className="mt-4 font-serif text-[38px] sm:text-[52px] lg:text-[64px] leading-[0.98]"
              style={{ color: "var(--pc-ink)", letterSpacing: "-0.03em" }}>
              {greet},<br/>
              <span className="italic" style={{ color: "var(--pc-primary)" }}>{who.first}.</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[14.5px] sm:text-[17px] leading-[1.55]"
              style={{ color: "var(--pc-ink)", opacity: 0.72 }}>
              {status}
            </p>
          </div>
          <Link to="/focus"
            className="hidden sm:inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase pb-2 border-b transition hover:gap-3"
            style={{ color: "var(--pc-ink)", borderColor: "var(--pc-ink)" }}>
            Begin a session <ArrowUpRight className="w-3.5 h-3.5"/>
          </Link>
        </div>
      </section>

      {/* ── Peace Score — full-bleed editorial hero ──────────────── */}
      <Divider label="I · The Score"/>
      <section className="py-10 sm:py-14 grid grid-cols-12 gap-y-8 gap-x-6">
        <div className="col-span-12 md:col-span-5">
          <div className="text-[11px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>Peace Score</div>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-serif text-[88px] sm:text-[120px] lg:text-[148px] leading-[0.85] tracking-tight"
              style={{ color: "var(--pc-ink)", letterSpacing: "-0.05em" }}>{peace}</span>
            <span className="font-serif text-[22px] sm:text-[28px]" style={{ color: "var(--pc-muted)" }}>/100</span>
          </div>
          <div className="mt-4 text-[13px] leading-[1.6] max-w-[380px]" style={{ color: "var(--pc-muted)" }}>
            A composite of your mind fitness, mood trend and daily rituals — updated each hour, kept private.
          </div>
        </div>
        <div className="col-span-12 md:col-span-7 md:pl-8 md:border-l" style={{ borderColor: "var(--pc-border)" }}>
          <Sparkline data={trend} accent="peace" />
          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6">
            <Metric label="Emotional stability" value={`${emoStability}%`} to="/screening"/>
            <Metric label="Mind fitness" value={`${overall}`} to="/mindgym/brain-dna"/>
            <Metric label="This week" value={`${week.count || 0} sessions`} to="/mindgym"/>
          </div>
        </div>
      </section>

      {/* ── Today's rhythm ───────────────────────────────────────── */}
      <Divider label="II · Today's Rhythm"/>
      <section className="py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-y-0">
          <RhythmCell label="Journal" value={journalStreak} unit="day streak" to="/journal"
            hint={data.journalWeek ? `${data.journalWeek} entries this week` : "Nothing written yet"}/>
          <RhythmCell label="Breath" value={breatheStreak} unit="day streak" to="/breathe"
            hint={data.breatheToday ? `${data.breatheToday} today` : "One round waits"}/>
          <RhythmCell label="Focus" value={focusMin} unit="min this week" to="/focus"
            hint={data.focusStreak ? `${data.focusStreak}d streak` : "Start a soft 25"}/>
          <RhythmCell label="Gratitude" value={data.gratitudeToday || 0} unit={data.gratitudeToday === 1 ? "note today" : "notes today"} to="/gratitude"
            hint={data.gratitudeStreak ? `${data.gratitudeStreak}d streak` : "One small thanks"}/>
        </div>
      </section>

      {/* ── Mind — brain fitness & streak, integrated ────────────── */}
      <Divider label="III · Mind"/>
      <section className="py-10 sm:py-14 grid grid-cols-12 gap-y-10 gap-x-6">
        <div className="col-span-12 md:col-span-7">
          <div className="text-[11px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>Brain fitness</div>
          <h2 className="mt-4 font-serif text-[30px] sm:text-[40px] leading-[1.05] max-w-[520px]"
            style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
            Your mind is holding <span style={{ color: "var(--pc-primary)" }}>{tone(overall)}</span> this week.
          </h2>
          <div className="mt-8 space-y-4">
            {Object.entries(mg.brain).slice(0,5).map(([k, v]) => (
              <SkillBar key={k} label={k} value={v as number}/>
            ))}
          </div>
          <Link to="/mindgym/brain-dna"
            className="mt-8 inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase pb-1 border-b transition hover:gap-3"
            style={{ color: "var(--pc-ink)", borderColor: "var(--pc-border)" }}>
            Read the full DNA <ArrowUpRight className="w-3 h-3"/>
          </Link>
        </div>
        <div className="col-span-12 md:col-span-5 md:pl-8 md:border-l" style={{ borderColor: "var(--pc-border)" }}>
          <div className="text-[11px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>Consistency</div>
          <div className="mt-5 font-serif text-[72px] leading-none" style={{ color: "var(--pc-ink)", letterSpacing: "-0.03em" }}>
            {mindStreak}<span className="text-[24px]" style={{ color: "var(--pc-muted)" }}> days</span>
          </div>
          <div className="mt-2 text-[13px]" style={{ color: "var(--pc-muted)" }}>current streak · best {mg.streak.longest || mindStreak}</div>
          <StreakGrid streak={mindStreak}/>
        </div>
      </section>

      {/* ── Modules directory ────────────────────────────────────── */}
      <Divider label="IV · Modules"/>
      <section className="py-8 sm:py-10">
        <ModuleRow to="/peacebot" title="Peace Bot" desc="Your AI companion" meta="Available now"/>
        <ModuleRow to="/counselling" title="Counselling" desc="Licensed practitioners, private sessions"
          meta={data.nextAppt ? formatWhen(data.nextAppt.scheduledFor) : "No upcoming"}/>
        <ModuleRow to="/buddies" title="Peace Buddies" desc="Peer support & live rooms" meta="12 online"/>
        <ModuleRow to="/screening" title="Screenings" desc="Validated self-assessments" meta={`${data.wellness ?? "—"} wellness`}/>
        <ModuleRow to="/resources" title="Resource Library" desc="Reads, meditations, podcasts" meta="200+ pieces"/>
        <ModuleRow to="/community" title="Community" desc="Threads, circles, live stages" meta="Open"/>
        <ModuleRow to="/mindgym" title="Mind Gym" desc="Training your attention" meta={`${mindStreak}d streak`} last/>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t py-8 mt-4 flex flex-wrap items-center justify-between gap-3 text-[10.5px] sm:text-[11px] tracking-[0.18em] uppercase"
        style={{ borderColor: "var(--pc-border)", color: "var(--pc-muted)" }}>
        <span>Softly — that's how growth happens.</span>
        <span>PeaceCode · 2026</span>
      </footer>
    </div>
  );
}

// ─── Editorial primitives ────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <div className="text-[10px] tracking-[0.36em] uppercase shrink-0" style={{ color: "var(--pc-muted)" }}>{label}</div>
      <div className="flex-1 h-px" style={{ background: "var(--pc-border)" }}/>
    </div>
  );
}

function Metric({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link to={to} className="group block">
      <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: "var(--pc-muted)" }}>{label}</div>
      <div className="mt-2 font-serif text-[22px] leading-none flex items-center gap-1.5" style={{ color: "var(--pc-ink)" }}>
        {value}
        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition group-hover:opacity-60 group-hover:translate-x-0" style={{ color: "var(--pc-muted)" }}/>
      </div>
    </Link>
  );
}

function RhythmCell({ label, value, unit, hint, to }: { label: string; value: number; unit: string; hint: string; to: string }) {
  return (
    <Link to={to} className="group block md:border-r md:last:border-r-0 md:pr-6" style={{ borderColor: "var(--pc-border)" }}>
      <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>{label}</div>
      <div className="mt-3 font-serif text-[46px] leading-none tabular-nums transition group-hover:translate-x-0.5"
        style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div className="mt-1 text-[12px]" style={{ color: "var(--pc-muted)" }}>{unit}</div>
      <div className="mt-3 text-[11px]" style={{ color: "var(--pc-ink)", opacity: 0.55 }}>{hint}</div>
    </Link>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px]">
        <span className="capitalize" style={{ color: "var(--pc-ink)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--pc-muted)" }}>{value}</span>
      </div>
      <div className="mt-1.5 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
        <div className="h-full transition-all duration-700"
          style={{ width: `${value}%`, background: "linear-gradient(90deg,var(--pc-primary),var(--pc-lavender))" }}/>
      </div>
    </div>
  );
}

function StreakGrid({ streak }: { streak: number }) {
  const cells = 35;
  return (
    <div className="mt-8 grid grid-cols-7 gap-1.5">
      {Array.from({ length: cells }).map((_, i) => {
        const on = i >= cells - streak;
        return (
          <div key={i} className="aspect-square rounded-[3px]"
            style={{
              background: on
                ? "linear-gradient(135deg,var(--pc-primary),var(--pc-lavender))"
                : "var(--pc-surface2)",
              opacity: on ? 0.4 + (i / cells) * 0.6 : 1,
            }}/>
        );
      })}
    </div>
  );
}

function Sparkline({ data, accent = "peace" }: { data: number[]; accent?: string }) {
  const w = 640, h = 140;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${pts[0]} L ${pts.slice(1).join(" L ")}`;
  const area = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px] sm:h-[150px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`spark-${accent}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--pc-primary)" stopOpacity="0.18"/>
            <stop offset="1" stopColor="var(--pc-primary)" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id={`stroke-${accent}`} x1="0" x2="1">
            <stop offset="0" stopColor="var(--pc-primary)"/>
            <stop offset="1" stopColor="var(--pc-lavender)"/>
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#spark-${accent})`}/>
        <path d={path} fill="none" stroke={`url(#stroke-${accent})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="flex items-center justify-between text-[10px] tracking-[0.24em] uppercase pt-2" style={{ color: "var(--pc-muted)" }}>
        <span>4 weeks ago</span>
        <span>today</span>
      </div>
    </div>
  );
}

function ModuleRow({ to, title, desc, meta, last }: { to: string; title: string; desc: string; meta: string; last?: boolean }) {
  return (
    <Link to={to}
      className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:gap-6 py-5 sm:py-6 ${last ? "" : "border-b"} transition`}
      style={{ borderColor: "var(--pc-border)" }}>
      <div className="min-w-0 sm:grid sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:gap-6 sm:items-baseline">
        <div className="font-serif text-[20px] sm:text-[26px] leading-none truncate transition group-hover:translate-x-1"
          style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
          {title}
        </div>
        <div className="text-[13px] hidden sm:block truncate" style={{ color: "var(--pc-muted)" }}>{desc}</div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <span className="text-[11px] sm:text-[12px] tabular-nums truncate max-w-[110px] sm:max-w-none" style={{ color: "var(--pc-ink)", opacity: 0.6 }}>{meta}</span>
        <ChevronRight className="w-4 h-4 transition group-hover:translate-x-0.5" style={{ color: "var(--pc-muted)" }}/>
      </div>
    </Link>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────

function tone(overall: number) {
  if (overall >= 75) return "steady";
  if (overall >= 55) return "softly";
  if (overall >= 40) return "gently";
  return "quietly";
}

function formatWhen(ts: number) {
  const d = new Date(ts);
  const diff = ts - Date.now();
  if (diff < 24*36e5) return "Today · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diff < 48*36e5) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function makeTrend(seed: number) {
  const out: number[] = [];
  for (let i = 0; i < 28; i++) {
    const t = i / 28;
    const base = 45 + Math.sin(i * 0.5 + seed * 0.04) * 14 + Math.cos(i * 0.3 + seed * 0.02) * 8;
    out.push(Math.max(20, Math.min(100, base + t * (seed - 50) * 0.35)));
  }
  out[out.length - 1] = seed;
  return out;
}
