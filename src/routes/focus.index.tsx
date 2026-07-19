import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft, Play, Pause, RotateCcw, SkipForward, Plus, Check,
  CloudRain, Coffee, Waves, Wind, VolumeX, Volume2, Timer, Target,
  TrendingUp, Flame, Sparkles, Zap, Trash2, Calendar as CalendarIcon,
  Filter, ChevronLeft, ChevronRight, History, X, Maximize2, Minimize2,
} from "lucide-react";
import logo from "@/assets/peacecode-logo.png";
import {
  loadSessions, saveSession, deleteSession,
  aggregateByDay, computeStreaks, dayKey, shiftDays, weekdayIndex,
  type FocusMode, type FocusSession,
} from "@/lib/focus-store";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/focus/")({ component: FocusPage });

// ── palette ───────────────────────────────────────────────────────
const bg="#F7FAFF", surface="#FFFFFF", surface2="#EAF3FF", border="#DCE3EF";
const ink="#1D2A44", muted="#7587A6", primary="#4B6CB7";
const lavender="#D5C9F7", sky="#AFC9F5", moss="#CDEBD9", peach="#F8CADA";

const modes = [
  { key: "focus",  label: "deep focus", mins: 25, color: primary },
  { key: "short",  label: "short break", mins: 5,  color: moss },
  { key: "long",   label: "long break",  mins: 15, color: lavender },
  { key: "flow",   label: "flow state",  mins: 50, color: peach },
] as const;

const modeMeta: Record<FocusMode, { label: string; color: string }> = {
  focus: { label: "deep focus", color: primary },
  flow:  { label: "flow state", color: peach },
  short: { label: "short break", color: moss },
  long:  { label: "long break", color: lavender },
};

const soundscapes = [
  { key: "silence", label: "silence",  icon: VolumeX },
  { key: "rain",    label: "rain",     icon: CloudRain },
  { key: "cafe",    label: "café",     icon: Coffee },
  { key: "waves",   label: "waves",    icon: Waves },
  { key: "wind",    label: "wind",     icon: Wind },
];

// ── page ──────────────────────────────────────────────────────────
function FocusPage() {
  // ─ sessions (persisted) ─
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  useEffect(() => { setSessions(loadSessions()); }, []);

  const record = (s: Omit<FocusSession, "id">) => {
    const saved = saveSession(s);
    setSessions((prev) => [saved, ...prev]);
  };
  const remove = (id: string) => {
    deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  // ─ derived: today, week, streaks ─
  const todayKey = dayKey(new Date());
  const todaySessions = useMemo(
    () => sessions.filter((s) => dayKey(s.completedAt) === todayKey),
    [sessions, todayKey],
  );
  const completedToday = todaySessions.filter((s) => s.mode === "focus" || s.mode === "flow").length;
  const totalMinsToday = todaySessions.reduce((a, s) => a + s.minutes, 0);
  const weekAgg = useMemo(() => aggregateByDay(sessions, 7), [sessions]);
  const streaks = useMemo(() => computeStreaks(sessions), [sessions]);

  // ─ timer state ─
  const [mode, setMode] = useState<FocusMode>("focus");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [taskLabel, setTaskLabel] = useState("");
  const currentMode = modes.find(m => m.key === mode)!;

  useEffect(() => { setRemaining(currentMode.mins * 60); setRunning(false); }, [mode, currentMode.mins]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          record({
            mode,
            minutes: currentMode.mins,
            planned: currentMode.mins,
            completedAt: new Date().toISOString(),
            fullyCompleted: true,
            taskLabel: taskLabel.trim() || undefined,
          });
          return currentMode.mins * 60;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode, currentMode.mins, taskLabel]);

  const skip = () => {
    const held = Math.max(0, currentMode.mins * 60 - remaining);
    if (held >= 60) {
      record({
        mode,
        minutes: Math.round(held / 60),
        planned: currentMode.mins,
        completedAt: new Date().toISOString(),
        fullyCompleted: false,
        taskLabel: taskLabel.trim() || undefined,
      });
    }
    setRunning(false);
    setRemaining(currentMode.mins * 60);
  };

  const totalSecs = currentMode.mins * 60;
  const progress = 1 - remaining / totalSecs;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  // ─ tasks (session-scoped, ephemeral) ─
  const [tasks, setTasks] = useState([
    { id: 1, text: "finish DBMS assignment section 3", done: false, poms: 2 },
    { id: 2, text: "reread linear algebra ch. 4", done: true, poms: 1 },
    { id: 3, text: "outline internship application", done: false, poms: 1 },
  ]);
  const [newTask, setNewTask] = useState("");
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now(), text: newTask.trim(), done: false, poms: 1 }, ...tasks]);
    setNewTask("");
  };

  // ─ soundscape / breath ─
  const [sound, setSound] = useState("silence");
  const [volume, setVolume] = useState(60);
  const [breathPhase, setBreathPhase] = useState<"in"|"hold1"|"out"|"hold2">("in");
  const [breathOn, setBreathOn] = useState(false);
  useEffect(() => {
    if (!breathOn) return;
    const seq: ("in"|"hold1"|"out"|"hold2")[] = ["in","hold1","out","hold2"];
    let i = 0;
    const t = setInterval(() => { i = (i+1) % 4; setBreathPhase(seq[i]); }, 4000);
    return () => clearInterval(t);
  }, [breathOn]);

  // ─ cinema (fullscreen) mode ─
  const [cinema, setCinema] = useState(false);
  useEffect(() => {
    if (!cinema) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCinema(false);
      if (e.key === " ") { e.preventDefault(); setRunning(r => !r); }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [cinema]);

  return (
    <AppShell>
      <div className="w-full font-sans relative" style={{ color: ink }}>


      {/* header */}
      <header className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-10 pt-6 lg:pt-8 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-3 text-[12.5px]" style={{ color: muted }}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center transition group-hover:-translate-x-0.5"
                style={{ background: surface, border: `1px solid ${border}` }}>
            <ArrowLeft className="w-4 h-4" strokeWidth={1.6}/>
          </span>
          <span className="tracking-[0.28em] uppercase">back to today</span>
        </Link>
        <div className="hidden md:flex items-center gap-3">
          <img src={logo} alt="" className="w-7 h-7 opacity-80"/>
          <div className="text-right">
            <div className="font-serif text-[15px] leading-none">the focus room</div>
            <div className="text-[8.5px] tracking-[0.32em] uppercase opacity-50 mt-1">deep · quiet · alive</div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-24">
        {/* hero */}
        <section className="mb-6 lg:mb-12">
          <div className="text-[8px] sm:text-[9px] tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-3 sm:mb-4" style={{ color: muted }}>
            focus room · {new Date().toLocaleDateString(undefined, { weekday: "long" }).toLowerCase()} · {totalMinsToday}m so far
          </div>
          <h1 className="font-serif font-medium tracking-tight leading-[1.01] sm:leading-[0.98] text-[clamp(1.85rem,8.8vw,4.2rem)] max-w-[820px]">
            one thing, <span style={{ color: primary, fontStyle: "italic" }}>softly done.</span>
          </h1>
          <p className="mt-4 sm:mt-5 max-w-[560px] text-[13px] sm:text-[14px] leading-relaxed" style={{ color: muted }}>
            pick a rhythm. name what you're working on. every completed round is quietly saved — even after you close the tab.
          </p>
        </section>

        {/* MAIN GRID: timer + right column */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 mb-8">
          {/* Timer card */}
          <div className="no-glass relative overflow-hidden rounded-[26px] sm:rounded-[32px] p-4 sm:p-8 lg:p-12"
               style={{ background: `linear-gradient(160deg, ${surface} 0%, ${surface2} 100%)`, border: `1px solid ${border}` }}>
            <div className="no-glass absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-60 pointer-events-none"
                 style={{ background: `radial-gradient(circle, ${currentMode.color}, transparent 70%)` }}/>

            <div className="relative grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-4 sm:mb-6 items-center">
              {modes.map(m => {
                const active = mode === m.key;
                return (
                  <button key={m.key} onClick={() => setMode(m.key)}
                          className="h-8 sm:h-9 px-2.5 sm:px-4 rounded-full text-[11px] sm:text-[12px] tracking-wide transition"
                          style={{
                            background: active ? ink : surface,
                            color: active ? "#F7FAFF" : ink,
                            border: `1px solid ${active ? ink : border}`,
                          }}>
                    {m.label} · {m.mins}m
                  </button>
                );
              })}
              <button onClick={() => setCinema(true)}
                      title="enter cinema mode (fullscreen)"
                       className="sm:ml-auto inline-flex items-center justify-center gap-2 h-8 sm:h-9 px-4 rounded-full text-[11.5px] tracking-wide transition hover:-translate-y-0.5"
                      style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
                <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.6}/> cinema
              </button>
            </div>

            {/* task label input */}
            <div className="relative mb-5 sm:mb-8">
              <input value={taskLabel} onChange={(e) => setTaskLabel(e.target.value)}
                     placeholder="what are you holding? (optional, saved with the session)"
                     className="w-full h-11 px-4 rounded-full outline-none text-[13px]"
                     style={{ background: surface, color: ink, border: `1px solid ${border}` }}/>
            </div>

            {/* dial */}
            <div className="relative flex flex-col items-center">
              <div className="relative w-full max-w-[220px] h-[220px] sm:max-w-none sm:w-[340px] sm:h-[340px]">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={currentMode.color}/>
                      <stop offset="100%" stopColor={primary}/>
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="88" fill="none" stroke={border} strokeWidth="1.5"/>
                  <circle cx="100" cy="100" r="88" fill="none"
                          stroke="url(#ring)" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 88}
                          strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
                          style={{ transition: "stroke-dashoffset 1s linear" }}/>
                  {Array.from({length: 60}).map((_, i) => (
                    <line key={i} x1="100" y1="8" x2="100" y2={i % 5 === 0 ? 14 : 11}
                          stroke={ink} strokeWidth={i % 5 === 0 ? 0.8 : 0.4}
                          opacity={i % 5 === 0 ? 0.35 : 0.15}
                          transform={`rotate(${i*6} 100 100)`}/>
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[8.5px] sm:text-[9.5px] tracking-[0.34em] sm:tracking-[0.4em] uppercase" style={{ color: muted }}>{currentMode.label}</div>
                  <div className="font-serif text-[48px] sm:text-[84px] leading-none tabular-nums mt-2" style={{ color: ink }}>
                    {mm}<span style={{ color: muted }}>:</span>{ss}
                  </div>
                  <div className="text-[10px] sm:text-[11px] mt-2 sm:mt-3 tracking-[0.24em] sm:tracking-[0.28em] uppercase" style={{ color: muted }}>
                    {running ? "in flow" : remaining === totalSecs ? "ready when you are" : "paused"}
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-10 flex items-center gap-3">
                <button onClick={() => setRemaining(currentMode.mins * 60)}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                        style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
                  <RotateCcw className="w-4 h-4" strokeWidth={1.6}/>
                </button>
                <button onClick={() => setRunning(r => !r)}
                        className="h-[52px] sm:h-14 px-7 sm:px-8 rounded-full flex items-center gap-3 text-[13px] sm:text-[13.5px] tracking-wide transition hover:-translate-y-0.5"
                        style={{ background: ink, color: "#F7FAFF", boxShadow: "0 16px 32px -14px rgba(29,42,68,0.55)" }}>
                  {running ? <Pause className="w-4 h-4" strokeWidth={1.8}/> : <Play className="w-4 h-4" strokeWidth={1.8}/>}
                  {running ? "pause" : remaining === totalSecs ? "begin" : "resume"}
                </button>
                <button onClick={skip} title="end early — save what you held"
                        className="w-12 h-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                        style={{ background: surface, border: `1px solid ${border}`, color: ink }}>
                  <SkipForward className="w-4 h-4" strokeWidth={1.6}/>
                </button>
              </div>
            </div>

            {/* today stats */}
            <div className="relative mt-6 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {[
                { label: "sessions today", value: completedToday, icon: Target },
                { label: "minutes held",   value: totalMinsToday, icon: Timer },
                { label: "current streak", value: `${streaks.current}d`, icon: Flame },
                { label: "longest ever",   value: `${streaks.longest}d`, icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="rounded-[16px] p-3 sm:p-3.5"
                     style={{ background: surface, border: `1px solid ${border}` }}>
                  <div className="flex min-w-0 items-center gap-1.5 text-[8.5px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.24em] uppercase" style={{ color: muted }}>
                    <s.icon className="w-3 h-3" strokeWidth={1.6}/> {s.label}
                  </div>
                  <div className="font-serif text-[24px] leading-none mt-2" style={{ color: ink }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: sound + breath */}
          <div className="flex flex-col gap-6">
            <div className="rounded-[28px] p-6" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: muted }}>soundscape</div>
                  <div className="font-serif text-[20px] mt-1">the room's air</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0,1,2,3,4].map(i => (
                    <span key={i} className="w-[3px] rounded-full"
                          style={{
                            height: sound !== "silence" && i < Math.floor(volume/20) ? "18px" : "6px",
                            background: sound !== "silence" && i < Math.floor(volume/20) ? primary : border,
                            transition: "height 200ms ease",
                            animation: sound !== "silence" && i < Math.floor(volume/20) ? `sndbar 1.${i}s ease-in-out infinite` : undefined,
                          }}/>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-5">
                {soundscapes.map(s => {
                  const active = sound === s.key;
                  const Icon = s.icon;
                  return (
                    <button key={s.key} onClick={() => setSound(s.key)}
                            className="flex flex-col items-center gap-1.5 py-3 rounded-[14px] transition hover:-translate-y-0.5"
                            style={{
                              background: active ? surface2 : "transparent",
                              border: `1px solid ${active ? primary : border}`,
                              color: active ? ink : muted,
                            }}>
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.5}/>
                      <span className="text-[10px] tracking-wide">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="w-3.5 h-3.5" strokeWidth={1.6} style={{ color: muted }}/>
                <input type="range" min={0} max={100} value={volume}
                       onChange={(e) => setVolume(Number(e.target.value))}
                       className="flex-1 accent-[--p]" style={{ ["--p" as any]: primary }}/>
                <span className="text-[11px] tabular-nums w-8 text-right" style={{ color: muted }}>{volume}</span>
              </div>
              <style>{`@keyframes sndbar { 0%,100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }`}</style>
            </div>

            <div className="relative overflow-hidden rounded-[28px] p-6" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="text-[9.5px] tracking-[0.3em] uppercase mb-4" style={{ color: muted }}>quick reset · 4·4·4·4</div>
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-2xl transition-all duration-[3800ms] ease-in-out"
                       style={{
                         background: `linear-gradient(135deg, ${lavender}, ${sky})`,
                         transform: breathOn ? (breathPhase === "in" ? "scale(1)" : breathPhase === "out" ? "scale(0.55)" : "scale(0.78)") : "scale(0.78)",
                       }}/>
                  <div className="absolute inset-0 flex items-center justify-center font-serif text-[13px]" style={{ color: ink }}>
                    {breathOn ? (breathPhase === "in" ? "in" : breathPhase === "out" ? "out" : "hold") : "rest"}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-serif text-[18px] leading-tight">a small reset between rounds.</div>
                  <p className="text-[11.5px] mt-1.5" style={{ color: muted }}>box breath. four counts each side.</p>
                  <button onClick={() => setBreathOn(!breathOn)}
                          className="mt-3 h-9 px-4 rounded-full text-[11.5px] tracking-wide"
                          style={{ background: breathOn ? ink : surface2, color: breathOn ? "#F7FAFF" : ink, border: `1px solid ${breathOn ? ink : border}` }}>
                    {breathOn ? "stop" : "begin breath"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Streak calendar + tasks */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 mb-8">
          <StreakCalendar sessions={sessions} streaks={streaks}/>
          <TasksCard tasks={tasks} setTasks={setTasks} newTask={newTask} setNewTask={setNewTask} addTask={addTask}/>
        </section>

        {/* Week chart */}
        <section className="mb-8">
          <FocusChart data={weekAgg}/>
        </section>

        {/* History panel */}
        <section className="mb-8">
          <HistoryPanel sessions={sessions} onDelete={remove}/>
        </section>

        {/* insights row */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const total = weekAgg.reduce((a,b)=>a+b.minutes,0);
            const avg = Math.round(total / 7);
            const prevWeek = aggregateByDay(sessions, 7, shiftDays(new Date(), -7));
            const prevTotal = prevWeek.reduce((a,b)=>a+b.minutes,0);
            const delta = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0;
            const bestHour = bestHourFrom(sessions);
            const skips = sessions.slice(0, 10).filter((s) => !s.fullyCompleted).length;
            return [
              { icon: TrendingUp, label: "weekly avg", value: `${avg}m`, sub: `${delta >= 0 ? "up" : "down"} ${Math.abs(delta)}% from last week`, tone: moss },
              { icon: Sparkles,   label: "best hour",  value: bestHour,   sub: "you focus deepest here", tone: lavender },
              { icon: Zap,        label: "distraction score", value: skips <= 1 ? "low" : skips <= 3 ? "medium" : "high", sub: `${skips} skips in last 10 sessions`, tone: sky },
            ].map((c) => (
              <div key={c.label} className="relative overflow-hidden rounded-[22px] p-5"
                   style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-70"
                     style={{ background: `radial-gradient(circle, ${c.tone}, transparent 70%)` }}/>
                <div className="relative flex items-center gap-2 text-[9.5px] tracking-[0.28em] uppercase" style={{ color: muted }}>
                  <c.icon className="w-3 h-3" strokeWidth={1.6}/> {c.label}
                </div>
                <div className="relative font-serif text-[28px] mt-2 leading-none" style={{ color: ink }}>{c.value}</div>
                <div className="relative text-[11.5px] mt-2" style={{ color: muted }}>{c.sub}</div>
              </div>
            ));
          })()}
        </section>
      </main>
      </div>

      {/* ── CINEMA MODE (portaled to body to escape `main` glass scope) ── */}
      {cinema && typeof document !== "undefined" && createPortal(
        <div className="no-glass fixed inset-0 z-[100] font-sans" style={{ color: "#F7FAFF" }} role="dialog" aria-modal="true">
          {/* backdrop */}
          <div className="absolute inset-0" style={{
            background: `radial-gradient(1200px 600px at 50% 0%, ${currentMode.color}22, transparent 60%), radial-gradient(900px 500px at 50% 100%, ${primary}22, transparent 60%), #0B1226`,
          }}/>
          {/* aurora blobs */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-40 pointer-events-none"
               style={{ background: `radial-gradient(circle, ${currentMode.color}, transparent 60%)` }}/>
          <div className="absolute bottom-[-200px] left-[10%] w-[500px] h-[500px] rounded-full blur-3xl opacity-30 pointer-events-none"
               style={{ background: `radial-gradient(circle, ${lavender}, transparent 60%)` }}/>
          <div className="absolute top-1/3 right-[8%] w-[400px] h-[400px] rounded-full blur-3xl opacity-25 pointer-events-none"
               style={{ background: `radial-gradient(circle, ${sky}, transparent 60%)` }}/>

          {/* top bar */}
          <div className="relative z-10 flex items-center justify-between px-8 pt-7">
            <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase opacity-70">
              <img src={logo} alt="" className="w-6 h-6 opacity-90"/>
              cinema · {currentMode.label} · press space
            </div>
            <button onClick={() => setCinema(false)}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[11px] tracking-wide transition hover:-translate-y-0.5"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <Minimize2 className="w-3.5 h-3.5"/> exit
            </button>
          </div>

          {/* stage */}
          <div className="relative z-10 h-[calc(100vh-88px)] flex flex-col items-center justify-center px-6">
            {taskLabel && (
              <div className="mb-8 text-[13px] tracking-[0.28em] uppercase opacity-60">holding · {taskLabel}</div>
            )}
            <div className="relative w-[min(78vmin,640px)] h-[min(78vmin,640px)]">
              {/* soft breathing halo */}
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                   style={{
                     background: `radial-gradient(circle, ${currentMode.color}, transparent 60%)`,
                     transform: running ? "scale(1.05)" : "scale(0.92)",
                     transition: "transform 4s ease-in-out",
                     animation: running ? "cinemaPulse 8s ease-in-out infinite" : undefined,
                   }}/>
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="cinemaRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={currentMode.color}/>
                    <stop offset="100%" stopColor="#F7FAFF"/>
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
                <circle cx="100" cy="100" r="88" fill="none"
                        stroke="url(#cinemaRing)" strokeWidth="2.2" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 88}
                        strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
                        style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 12px ${currentMode.color})` }}/>
                {Array.from({length: 60}).map((_, i) => (
                  <line key={i} x1="100" y1="6" x2="100" y2={i % 5 === 0 ? 14 : 10}
                        stroke="#F7FAFF" strokeWidth={i % 5 === 0 ? 0.7 : 0.3}
                        opacity={i % 5 === 0 ? 0.35 : 0.12}
                        transform={`rotate(${i*6} 100 100)`}/>
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] tracking-[0.5em] uppercase opacity-60">{currentMode.label}</div>
                <div className="font-serif font-light leading-none tabular-nums mt-4"
                     style={{ fontSize: "clamp(84px, 14vmin, 168px)" }}>
                  {mm}<span className="opacity-40">:</span>{ss}
                </div>
                <div className="text-[11px] tracking-[0.4em] uppercase opacity-50 mt-5">
                  {running ? "in flow" : remaining === totalSecs ? "ready when you are" : "paused"}
                </div>
              </div>
            </div>

            {/* controls */}
            <div className="mt-14 flex items-center gap-4">
              <button onClick={() => setRemaining(currentMode.mins * 60)}
                      className="w-12 h-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}>
                <RotateCcw className="w-4 h-4" strokeWidth={1.6}/>
              </button>
              <button onClick={() => setRunning(r => !r)}
                      className="h-14 px-10 rounded-full flex items-center gap-3 text-[13px] tracking-[0.2em] uppercase transition hover:-translate-y-0.5"
                      style={{ background: "#F7FAFF", color: "#0B1226", boxShadow: `0 20px 60px -20px ${currentMode.color}` }}>
                {running ? <Pause className="w-4 h-4" strokeWidth={2}/> : <Play className="w-4 h-4" strokeWidth={2}/>}
                {running ? "pause" : remaining === totalSecs ? "begin" : "resume"}
              </button>
              <button onClick={skip}
                      className="w-12 h-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}>
                <SkipForward className="w-4 h-4" strokeWidth={1.6}/>
              </button>
            </div>

            {/* mode switcher pills */}
            <div className="mt-10 flex items-center gap-2 flex-wrap justify-center">
              {modes.map(m => {
                const active = mode === m.key;
                return (
                  <button key={m.key} onClick={() => setMode(m.key)}
                          className="h-8 px-3.5 rounded-full text-[11px] tracking-wide transition"
                          style={{
                            background: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.06)",
                            color: active ? "#0B1226" : "#F7FAFF",
                            border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.14)"}`,
                          }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <style>{`@keyframes cinemaPulse { 0%,100% { transform: scale(0.95); opacity: 0.35 } 50% { transform: scale(1.08); opacity: 0.55 } }`}</style>
        </div>,
        document.body
      )}
    </AppShell>
  );
}


function bestHourFrom(sessions: FocusSession[]): string {
  if (!sessions.length) return "—";
  const buckets: Record<number, number> = {};
  for (const s of sessions) {
    if (s.mode !== "focus" && s.mode !== "flow") continue;
    const h = new Date(s.completedAt).getHours();
    buckets[h] = (buckets[h] ?? 0) + s.minutes;
  }
  const entries = Object.entries(buckets);
  if (!entries.length) return "—";
  const [hour] = entries.sort((a, b) => b[1] - a[1])[0];
  const h = Number(hour);
  const next = (h + 1) % 24;
  const fmt = (n: number) => `${((n + 11) % 12) + 1}${n < 12 ? "am" : "pm"}`;
  return `${fmt(h)}–${fmt(next)}`;
}

// ── tasks card ────────────────────────────────────────────────────
function TasksCard({ tasks, setTasks, newTask, setNewTask, addTask }: any) {
  return (
    <div className="rounded-[28px] p-7" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: muted }}>this session</div>
          <div className="font-serif text-[22px] mt-1">what are we holding?</div>
        </div>
        <div className="text-[11px]" style={{ color: muted }}>
          {tasks.filter((t: any) => t.done).length}/{tasks.length}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex items-center gap-2 mb-5">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
               placeholder="one small thing…"
               className="flex-1 h-11 px-4 rounded-full outline-none text-[13px]"
               style={{ background: surface2, color: ink }}/>
        <button type="submit" className="w-11 h-11 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                style={{ background: ink, color: "#F7FAFF" }}>
          <Plus className="w-4 h-4" strokeWidth={1.8}/>
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {tasks.map((t: any) => (
          <div key={t.id} className="group flex items-center gap-3 p-3 rounded-[16px] transition"
               style={{ background: t.done ? surface2 : "transparent", border: `1px solid ${t.done ? "transparent" : border}` }}>
            <button onClick={() => setTasks(tasks.map((x: any) => x.id === t.id ? { ...x, done: !x.done } : x))}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition shrink-0"
                    style={{ background: t.done ? primary : "transparent", border: `1.5px solid ${t.done ? primary : muted}`, color: "#F7FAFF" }}>
              {t.done && <Check className="w-3.5 h-3.5" strokeWidth={2.4}/>}
            </button>
            <span className="flex-1 text-[13.5px]"
                  style={{ color: t.done ? muted : ink, textDecoration: t.done ? "line-through" : "none" }}>
              {t.text}
            </span>
            <span className="text-[10px] tracking-[0.22em] uppercase" style={{ color: muted }}>{t.poms}× pom</span>
            <button onClick={() => setTasks(tasks.filter((x: any) => x.id !== t.id))}
                    className="opacity-0 group-hover:opacity-100 transition p-1" style={{ color: muted }}>
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6}/>
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-[12.5px] text-center py-6" style={{ color: muted }}>a quiet page. add one small thing to begin.</div>
        )}
      </div>
    </div>
  );
}

// ── streak calendar (heatmap of last 12 weeks) ───────────────────
function StreakCalendar({ sessions, streaks }: { sessions: FocusSession[]; streaks: { current: number; longest: number; totalDays: number } }) {
  const weeks = 12;
  const days = aggregateByDay(sessions, weeks * 7);
  // group into columns by week — align last column to today
  const cols: (typeof days)[] = [];
  const todayIdx = weekdayIndex(new Date());
  // pad start so the grid aligns cleanly
  const padded = [
    ...Array(6 - todayIdx).fill(null).map((_, i) => ({ key: `pad-${i}`, date: shiftDays(new Date(), i + 1), minutes: 0, sessions: 0, qualifies: false, __pad: true } as any)),
  ];
  const all = [...days, ...padded];
  for (let i = 0; i < all.length; i += 7) cols.push(all.slice(i, i + 7));

  const max = Math.max(...days.map(d => d.minutes), 1);
  const shade = (mins: number) => {
    if (mins === 0) return surface2;
    const t = Math.min(1, mins / max);
    // interpolate between surface2 and primary
    const r1 = 234, g1 = 243, b1 = 255; // surface2
    const r2 = 75,  g2 = 108, b2 = 183; // primary
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  };

  const [hover, setHover] = useState<{ x: number; y: number; d: any } | null>(null);

  return (
    <div className="rounded-[28px] p-7 relative" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: muted }}>the last twelve weeks</div>
          <div className="font-serif text-[22px] mt-1">the shape of your streak</div>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="font-serif text-[26px] leading-none flex items-center gap-1.5" style={{ color: ink }}>
              <Flame className="w-4 h-4" strokeWidth={1.6} style={{ color: "#EF6B6B" }}/>{streaks.current}
            </div>
            <div className="text-[9.5px] tracking-[0.28em] uppercase mt-1" style={{ color: muted }}>current</div>
          </div>
          <div>
            <div className="font-serif text-[26px] leading-none" style={{ color: ink }}>{streaks.longest}</div>
            <div className="text-[9.5px] tracking-[0.28em] uppercase mt-1" style={{ color: muted }}>longest</div>
          </div>
          <div>
            <div className="font-serif text-[26px] leading-none" style={{ color: ink }}>{streaks.totalDays}</div>
            <div className="text-[9.5px] tracking-[0.28em] uppercase mt-1" style={{ color: muted }}>total days</div>
          </div>
        </div>
      </div>

      <div className="relative flex gap-[6px] pt-2" onMouseLeave={() => setHover(null)}>
        {/* weekday labels */}
        <div className="flex flex-col justify-between text-[9px] pr-1" style={{ color: muted }}>
          {["Mon","","Wed","","Fri","","Sun"].map((d,i) => (
            <span key={i} className="h-[18px] flex items-center">{d}</span>
          ))}
        </div>
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: 6 }}>
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[6px]">
              {col.map((d, ri) => {
                const isPad = (d as any).__pad;
                const today = !isPad && dayKey(d.date) === dayKey(new Date());
                return (
                  <button
                    key={ri}
                    onMouseEnter={(e) => !isPad && setHover({ x: e.currentTarget.offsetLeft, y: e.currentTarget.offsetTop, d })}
                    className="h-[18px] rounded-[5px] transition"
                    style={{
                      background: isPad ? "transparent" : shade(d.minutes),
                      border: today ? `1.5px solid ${ink}` : `1px solid ${isPad ? "transparent" : (d.minutes > 0 ? "transparent" : border)}`,
                      opacity: isPad ? 0 : 1,
                    }}/>
                );
              })}
            </div>
          ))}
        </div>

        {hover && !hover.d.__pad && (
          <div className="absolute pointer-events-none rounded-[10px] px-3 py-2 text-[11px] shadow-lg z-20"
               style={{
                 background: ink, color: "#F7FAFF",
                 left: `min(${hover.x + 24}px, calc(100% - 180px))`,
                 top: Math.max(0, hover.y - 44),
                 minWidth: 160,
               }}>
            <div className="font-serif text-[13px]">
              {new Date(hover.d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <div className="opacity-80 mt-0.5">
              {hover.d.minutes}m · {hover.d.sessions} session{hover.d.sessions === 1 ? "" : "s"}
            </div>
          </div>
        )}
      </div>

      {/* legend */}
      <div className="mt-5 flex items-center justify-end gap-2 text-[10px]" style={{ color: muted }}>
        <span>less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <span key={i} className="w-[14px] h-[14px] rounded-[4px]" style={{ background: shade(t * max) }}/>
        ))}
        <span>more</span>
      </div>
    </div>
  );
}

// ── week chart ────────────────────────────────────────────────────
function FocusChart({ data }: { data: { key: string; date: Date; minutes: number; sessions: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = 220, PAD = 32;
  const max = Math.max(...data.map(d => d.minutes), 60);
  const pts = data.map((d, i) => ({
    x: PAD + (i * (W - PAD*2)) / (data.length - 1),
    y: H - PAD - ((d.minutes / max) * (H - PAD*2)),
    ...d,
  }));

  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i-1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    return `C ${cx1} ${prev.y}, ${cx2} ${p.y}, ${p.x} ${p.y}`;
  }).join(" ");
  const area = `${path} L ${pts[pts.length-1].x} ${H-PAD} L ${pts[0].x} ${H-PAD} Z`;

  const total = data.reduce((a,b) => a+b.minutes, 0);
  const bestDay = data.reduce((a,b) => b.minutes > a.minutes ? b : a);
  const dayShort = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short" });

  return (
    <div className="rounded-[28px] p-7 relative overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: muted }}>last seven days</div>
          <div className="font-serif text-[22px] mt-1">the shape of your week</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-[26px] leading-none" style={{ color: ink }}>{total}<span className="text-[13px]" style={{ color: muted }}>m</span></div>
          <div className="text-[10px] tracking-[0.24em] uppercase mt-1" style={{ color: muted }}>held</div>
        </div>
      </div>
      <p className="text-[12px] mb-4" style={{ color: muted }}>
        deepest on <span style={{ color: ink }}>{dayShort(bestDay.date)}</span> · {bestDay.minutes}m across {bestDay.sessions} sessions
      </p>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={primary} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0,1,2,3].map(i => {
          const y = PAD + (i * (H - PAD*2))/3;
          return <line key={i} x1={PAD} x2={W-PAD} y1={y} y2={y} stroke={border} strokeDasharray="2 4"/>;
        })}
        <path d={area} fill="url(#areaG)"/>
        <path d={path} fill="none" stroke={primary} strokeWidth="2.2" strokeLinecap="round"/>
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: "pointer" }}>
            <rect x={p.x - 24} y={0} width={48} height={H} fill="transparent"/>
            <circle cx={p.x} cy={p.y} r={hover === i ? 6 : 4} fill={surface} stroke={primary} strokeWidth="2" style={{ transition: "r 200ms" }}/>
            <text x={p.x} y={H-8} textAnchor="middle" fontSize="10" fill={hover === i ? ink : muted}
                  style={{ fontFamily: "DM Sans", letterSpacing: "0.14em" }}>
              {dayShort(p.date).toUpperCase()}
            </text>
            {hover === i && (
              <g>
                <rect x={p.x - 36} y={p.y - 42} width="72" height="30" rx="8" fill={ink}/>
                <text x={p.x} y={p.y - 23} textAnchor="middle" fontSize="11" fill="#F7FAFF" fontFamily="DM Sans">
                  {p.minutes}m · {p.sessions}×
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── history panel with filters ───────────────────────────────────
type ModeFilter = "all" | FocusMode;
type RangeFilter = "today" | "7d" | "30d" | "all";

function HistoryPanel({ sessions, onDelete }: { sessions: FocusSession[]; onDelete: (id: string) => void }) {
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("7d");
  const [detail, setDetail] = useState<FocusSession | null>(null);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = rangeFilter === "today" ? new Date().setHours(0,0,0,0)
                 : rangeFilter === "7d"    ? now - 7  * 86400000
                 : rangeFilter === "30d"   ? now - 30 * 86400000
                 : 0;
    return sessions.filter((s) => {
      if (modeFilter !== "all" && s.mode !== modeFilter) return false;
      if (new Date(s.completedAt).getTime() < cutoff) return false;
      return true;
    });
  }, [sessions, modeFilter, rangeFilter]);

  const totalMins = filtered.reduce((a, s) => a + s.minutes, 0);
  const totalCount = filtered.length;

  return (
    <div className="rounded-[28px] p-7" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="text-[9.5px] tracking-[0.3em] uppercase flex items-center gap-1.5" style={{ color: muted }}>
            <History className="w-3 h-3" strokeWidth={1.6}/> session history
          </div>
          <div className="font-serif text-[22px] mt-1">every quiet round you kept</div>
        </div>
        <div className="text-right text-[12px]" style={{ color: muted }}>
          <span style={{ color: ink }}>{totalCount}</span> sessions · <span style={{ color: ink }}>{totalMins}m</span> held
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" strokeWidth={1.6} style={{ color: muted }}/>
          <span className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>mode</span>
        </div>
        <div className="flex gap-1.5">
          {(["all","focus","flow","short","long"] as ModeFilter[]).map((m) => {
            const active = modeFilter === m;
            const label = m === "all" ? "all" : modeMeta[m].label;
            return (
              <button key={m} onClick={() => setModeFilter(m)}
                      className="h-8 px-3 rounded-full text-[11.5px] transition"
                      style={{
                        background: active ? ink : surface2,
                        color: active ? "#F7FAFF" : ink,
                      }}>
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 ml-2">
          <CalendarIcon className="w-3.5 h-3.5" strokeWidth={1.6} style={{ color: muted }}/>
          <span className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>when</span>
        </div>
        <div className="flex gap-1.5">
          {(["today","7d","30d","all"] as RangeFilter[]).map((r) => {
            const active = rangeFilter === r;
            const label = r === "today" ? "today" : r === "7d" ? "7 days" : r === "30d" ? "30 days" : "all time";
            return (
              <button key={r} onClick={() => setRangeFilter(r)}
                      className="h-8 px-3 rounded-full text-[11.5px] transition"
                      style={{
                        background: active ? ink : surface2,
                        color: active ? "#F7FAFF" : ink,
                      }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px]" style={{ color: muted }}>
          nothing in this window yet. finish a round and it'll appear here — softly saved.
        </div>
      ) : (
        <div className="flex flex-col divide-y" style={{ borderColor: border }}>
          {filtered.slice(0, 40).map((s) => {
            const meta = modeMeta[s.mode];
            const date = new Date(s.completedAt);
            return (
              <div key={s.id} className="group flex items-center gap-4 py-3.5 first:pt-0 last:pb-0" style={{ borderColor: border }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[13px]" style={{ color: ink }}>{meta.label}</span>
                    <span className="text-[11.5px]" style={{ color: muted }}>
                      · {s.minutes}m {s.fullyCompleted ? "" : "(ended early)"}
                    </span>
                  </div>
                  {s.taskLabel && (
                    <div className="text-[12px] italic mt-0.5 truncate" style={{ color: muted }}>"{s.taskLabel}"</div>
                  )}
                </div>
                <div className="text-right text-[11px] shrink-0" style={{ color: muted }}>
                  <div>{date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  <div>{date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</div>
                </div>
                <button onClick={() => setDetail(s)}
                        className="opacity-0 group-hover:opacity-100 h-8 px-3 rounded-full text-[11px] transition"
                        style={{ background: surface2, color: ink }}>
                  review
                </button>
                <button onClick={() => onDelete(s.id)}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full flex items-center justify-center transition"
                        style={{ color: muted }} title="remove">
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6}/>
                </button>
              </div>
            );
          })}
          {filtered.length > 40 && (
            <div className="pt-4 text-[11px] text-center" style={{ color: muted }}>
              showing 40 most recent of {filtered.length}
            </div>
          )}
        </div>
      )}

      {/* detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-8"
             style={{ background: "rgba(29,42,68,0.35)", backdropFilter: "blur(8px)" }}
             onClick={() => setDetail(null)}>
          <div className="relative w-full max-w-md rounded-[24px] p-7" onClick={(e) => e.stopPropagation()}
               style={{ background: surface, border: `1px solid ${border}` }}>
            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: surface2, color: ink }}>
              <X className="w-4 h-4" strokeWidth={1.6}/>
            </button>
            <div className="text-[9.5px] tracking-[0.3em] uppercase" style={{ color: muted }}>{modeMeta[detail.mode].label}</div>
            <div className="font-serif text-[36px] leading-none mt-2" style={{ color: ink }}>
              {detail.minutes}<span className="text-[18px]" style={{ color: muted }}>m</span>
            </div>
            <div className="text-[12px] mt-2" style={{ color: muted }}>
              {new Date(detail.completedAt).toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[14px] p-3" style={{ background: surface2 }}>
                <div className="text-[9px] tracking-[0.28em] uppercase" style={{ color: muted }}>planned</div>
                <div className="font-serif text-[18px] mt-1" style={{ color: ink }}>{detail.planned}m</div>
              </div>
              <div className="rounded-[14px] p-3" style={{ background: surface2 }}>
                <div className="text-[9px] tracking-[0.28em] uppercase" style={{ color: muted }}>completion</div>
                <div className="font-serif text-[18px] mt-1" style={{ color: ink }}>
                  {Math.round((detail.minutes / detail.planned) * 100)}%
                </div>
              </div>
            </div>
            {detail.taskLabel && (
              <div className="mt-4 rounded-[14px] p-4" style={{ background: surface2 }}>
                <div className="text-[9px] tracking-[0.28em] uppercase mb-1.5" style={{ color: muted }}>what you were holding</div>
                <div className="font-serif italic text-[15px]" style={{ color: ink }}>"{detail.taskLabel}"</div>
              </div>
            )}
            <div className="mt-6 flex items-center gap-2">
              <button onClick={() => { onDelete(detail.id); setDetail(null); }}
                      className="h-10 px-4 rounded-full text-[12px] flex items-center gap-1.5 transition hover:-translate-y-0.5"
                      style={{ background: surface2, color: ink }}>
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.6}/> remove from history
              </button>
              <button onClick={() => setDetail(null)}
                      className="ml-auto h-10 px-5 rounded-full text-[12px] transition hover:-translate-y-0.5"
                      style={{ background: ink, color: "#F7FAFF" }}>
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
