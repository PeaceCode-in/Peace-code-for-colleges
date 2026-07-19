import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Play, Pause, RotateCcw, SkipForward, Wind, Zap, Heart,
  Volume2, VolumeX, Mic, MicOff, Flame, Sparkles, Target, Star,
  Cloud, Waves, Trees, Sun, Bird, Radio, Flame as Fire, Accessibility,
  Trash2, ChevronRight, X, Award, Timer, Settings2, TrendingUp, BarChart3,
  Keyboard, Contrast, Type, Maximize2, Minimize2,
} from "lucide-react";
import logo from "@/assets/peacecode-logo.png";
import {
  loadSessions, saveSession, deleteSession, loadPrefs, savePrefs,
  computeStreak, weekSummary, dayKey,
  type BreathSession, type BreathTechniqueKey, type BreathPattern, type BreathPrefs,
} from "@/lib/breathe-store";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/breathe/")({ component: BreathePage });

// ── palette (matches focus/index) ─────────────────────────────────
const bg = "#F7FAFF", surface = "#FFFFFF", surface2 = "#EAF3FF", border = "#DCE3EF";
const ink = "#1D2A44", muted = "#7587A6", primary = "#4B6CB7";
const lavender = "#D5C9F7", sky = "#AFC9F5", moss = "#CDEBD9", peach = "#F8CADA";

// ── techniques library ────────────────────────────────────────────
type Phase = "inhale" | "hold1" | "exhale" | "hold2";
interface Technique {
  key: BreathTechniqueKey;
  name: string;
  tag: string;
  desc: string;
  pattern: BreathPattern;
  benefit: string;
  color: string;
  tips: string[];
}
const techniques: Technique[] = [
  {
    key: "box", name: "Box Breathing", tag: "4·4·4·4",
    desc: "A steady square. Used by Navy SEALs and calm minds everywhere.",
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 }, benefit: "sharpens focus, steadies nerves",
    color: primary,
    tips: ["Trace a square with your eyes as you go.", "Great before an exam or difficult call.", "Aim for 5 minutes to feel the shift."],
  },
  {
    key: "478", name: "4-7-8 Breathing", tag: "4·7·8",
    desc: "Dr. Weil's relaxing breath — a natural tranquilizer for the nervous system.",
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 }, benefit: "eases anxiety, invites sleep",
    color: lavender,
    tips: ["Exhale through the mouth with a soft 'whoosh'.", "Only 4 cycles is enough at first.", "Perfect right before bed."],
  },
  {
    key: "cyclic", name: "Cyclic Sighing", tag: "double inhale · long exhale",
    desc: "Stanford's research favorite — two inhales through the nose, one long exhale through the mouth.",
    pattern: { inhale: 2, hold1: 1, exhale: 6, hold2: 0 }, benefit: "fastest known stress relief",
    color: peach,
    tips: ["Second inhale is small — a top-up.", "Let the exhale sigh out audibly.", "5 minutes daily > longer once weekly."],
  },
  {
    key: "resonance", name: "Resonance Breathing", tag: "5·5",
    desc: "Equal, slow breaths at ~6 per minute — brings the heart and breath into coherence.",
    pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 }, benefit: "heart rate variability, balance",
    color: moss,
    tips: ["Breathe softly through the nose.", "10 minutes a day changes baseline stress.", "Works well with a hand on the chest."],
  },
  {
    key: "nostril", name: "Alternate Nostril", tag: "nadi shodhana",
    desc: "Yogic breath. Close one nostril at a time — balances both hemispheres.",
    pattern: { inhale: 4, hold1: 2, exhale: 4, hold2: 2 }, benefit: "clarity, calm alertness",
    color: sky,
    tips: ["Use right thumb + ring finger.", "Inhale left, exhale right, inhale right, exhale left.", "Keep the shoulders soft."],
  },
  {
    key: "triangle", name: "Triangle Breathing", tag: "3·3·3",
    desc: "Simple three-count triangle — gentler than the box, ideal for beginners.",
    pattern: { inhale: 3, hold1: 3, exhale: 3, hold2: 0 }, benefit: "gentle entry, quick reset",
    color: lavender,
    tips: ["Try before difficult conversations.", "Count softly in your head.", "Three minutes is a full reset."],
  },
];

const soundscapes = [
  { key: "silence", label: "silence", icon: VolumeX },
  { key: "rain", label: "rain", icon: Cloud },
  { key: "ocean", label: "ocean", icon: Waves },
  { key: "forest", label: "forest", icon: Trees },
  { key: "wind", label: "wind", icon: Wind },
  { key: "fire", label: "fireplace", icon: Fire },
  { key: "birds", label: "birds", icon: Bird },
  { key: "white", label: "white noise", icon: Radio },
];

const themes = [
  { key: "clouds", label: "clouds",       from: "#EAF3FF", to: "#FFFFFF" },
  { key: "aurora", label: "aurora",       from: "#D5C9F7", to: "#CDEBD9" },
  { key: "ocean",  label: "ocean waves",  from: "#AFC9F5", to: "#EAF3FF" },
  { key: "leaves", label: "floating leaves", from: "#CDEBD9", to: "#F7FAFF" },
  { key: "galaxy", label: "galaxy",       from: "#1D2A44", to: "#4B6CB7" },
  { key: "lotus",  label: "lotus",        from: "#F8CADA", to: "#EAF3FF" },
];

const paces = [
  { key: "beginner", label: "beginner", mult: 0.75 },
  { key: "normal",   label: "normal",   mult: 1 },
  { key: "advanced", label: "advanced", mult: 1.35 },
  { key: "custom",   label: "custom",   mult: 1 },
] as const;

const durations = [1, 3, 5, 10, 15, 20];
const moods = ["cloudy", "restless", "tender", "gentle", "grounded", "flowing"];

const badges = [
  { name: "First Breath", need: 1,  icon: Sparkles },
  { name: "Steady Seven", need: 7,  icon: Heart },
  { name: "Grove of 30",  need: 30, icon: Trees },
  { name: "Century",      need: 100,icon: Award },
];

// ── page ──────────────────────────────────────────────────────────
function BreathePage() {
  const [sessions, setSessions] = useState<BreathSession[]>([]);
  const [prefs, setPrefs] = useState<BreathPrefs>(loadPrefs());
  useEffect(() => { setSessions(loadSessions()); }, []);

  const updatePrefs = (p: Partial<BreathPrefs>) => {
    const next = { ...prefs, ...p };
    setPrefs(next); savePrefs(next);
  };

  const [techniqueKey, setTechniqueKey] = useState<BreathTechniqueKey>("box");
  const [duration, setDuration] = useState(5); // minutes
  const [moodBefore, setMoodBefore] = useState<string | undefined>();
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showA11y, setShowA11y] = useState(false);
  const [showCompletion, setShowCompletion] = useState<null | { mins: number; cycles: number }>(null);
  const [announce, setAnnounce] = useState("");

  const currentTech = techniques.find((t) => t.key === techniqueKey) ?? techniques[0];
  const activePattern: BreathPattern = techniqueKey === "custom" ? prefs.customPattern : currentTech.pattern;
  const currentTheme = themes.find((t) => t.key === prefs.theme) ?? themes[0];

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const week = useMemo(() => weekSummary(sessions), [sessions]);
  const todayMins = useMemo(() => {
    const k = dayKey(new Date());
    return sessions.filter((s) => dayKey(s.completedAt) === k).reduce((a, s) => a + s.minutes, 0);
  }, [sessions]);
  const goalPct = Math.min(100, Math.round((todayMins / prefs.dailyGoalMinutes) * 100));

  // ── engine ─────────────────────────────────────────────────────
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0); // seconds
  const [cycles, setCycles] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTick = useRef<number>(0);

  const paceMult = paces.find((p) => p.key === prefs.pace)?.mult ?? 1;
  const scaledPattern = useMemo<BreathPattern>(() => ({
    inhale: activePattern.inhale / paceMult,
    hold1:  activePattern.hold1  / paceMult,
    exhale: activePattern.exhale / paceMult,
    hold2:  activePattern.hold2  / paceMult,
  }), [activePattern, paceMult]);

  const cycleLen = scaledPattern.inhale + scaledPattern.hold1 + scaledPattern.exhale + scaledPattern.hold2;
  const totalSecs = duration * 60;
  const remaining = Math.max(0, totalSecs - totalElapsed);

  const phaseDur = (p: Phase) => scaledPattern[p];

  useEffect(() => {
    if (!running) return;
    lastTick.current = performance.now();
    const tick = (t: number) => {
      const dt = (t - lastTick.current) / 1000;
      lastTick.current = t;
      setPhaseElapsed((pe) => {
        let np = pe + dt;
        let curPhase = phase;
        // advance through phases if needed
        while (np >= phaseDur(curPhase) && phaseDur(curPhase) > 0) {
          np -= phaseDur(curPhase);
          const order: Phase[] = ["inhale", "hold1", "exhale", "hold2"];
          const idx = order.indexOf(curPhase);
          curPhase = order[(idx + 1) % 4];
          // skip zero-length phases
          let guard = 0;
          while (phaseDur(curPhase) === 0 && guard < 4) {
            const j = order.indexOf(curPhase);
            curPhase = order[(j + 1) % 4];
            guard++;
          }
          if (curPhase === "inhale") setCycles((c) => c + 1);
        }
        if (curPhase !== phase) setPhase(curPhase);
        return np;
      });
      setTotalElapsed((e) => {
        const ne = e + dt;
        if (ne >= totalSecs) {
          setRunning(false);
          finish(true, ne);
          return totalSecs;
        }
        return ne;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, scaledPattern, totalSecs]);

  const start = () => {
    setPhase("inhale");
    setPhaseElapsed(0);
    setTotalElapsed(0);
    setCycles(0);
    setRunning(true);
  };
  const reset = () => {
    setRunning(false);
    setPhase("inhale"); setPhaseElapsed(0); setTotalElapsed(0); setCycles(0);
  };

  const finish = (full: boolean, elapsed: number) => {
    const mins = Math.max(1, Math.round(elapsed / 60));
    const saved = saveSession({
      technique: techniqueKey,
      minutes: mins,
      planned: duration,
      cycles,
      completedAt: new Date().toISOString(),
      moodBefore, moodAfter: undefined,
      fullyCompleted: full,
    });
    setSessions((prev) => [saved, ...prev]);
    setShowCompletion({ mins, cycles });
  };
  const stop = () => {
    setRunning(false);
    if (totalElapsed > 20) finish(false, totalElapsed);
    else reset();
  };

  // phase progress 0-1
  const phaseProgress = Math.min(1, phaseElapsed / Math.max(0.01, phaseDur(phase)));

  // orb scale — collapses to a static 0.85 when reduced motion is enabled
  const scale = (() => {
    if (prefs.reducedMotion) return 0.85;
    if (phase === "inhale") return 0.55 + 0.45 * phaseProgress;
    if (phase === "hold1")  return 1;
    if (phase === "exhale") return 1 - 0.45 * phaseProgress;
    return 0.55;
  })();

  const phaseLabel: Record<Phase, string> = {
    inhale: "breathe in", hold1: "hold", exhale: "breathe out", hold2: "hold",
  };

  // announce phase changes for screen readers
  useEffect(() => {
    if (!running) return;
    setAnnounce(`${phaseLabel[phase]} — ${Math.round(phaseDur(phase))} seconds`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running]);

  // keyboard shortcuts: Space = play/pause, R = reset, S = skip, 1-6 = technique
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (running) setRunning(false);
        else if (totalElapsed > 0) setRunning(true);
        else start();
      } else if (e.key === "r" || e.key === "R") { reset(); }
      else if (e.key === "s" || e.key === "S") { stop(); }
      else if (e.key >= "1" && e.key <= "6") {
        const idx = Number(e.key) - 1;
        if (techniques[idx]) { setTechniqueKey(techniques[idx].key); reset(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, totalElapsed]);

  const toggleFavorite = (k: BreathTechniqueKey) => {
    const fav = prefs.favorites.includes(k)
      ? prefs.favorites.filter((f) => f !== k)
      : [...prefs.favorites, k];
    updatePrefs({ favorites: fav });
  };

  // ── AI suggestion (deterministic) ─────────────────────────────
  const aiSuggest = useMemo<Technique>(() => {
    const h = new Date().getHours();
    if (h < 8) return techniques.find((t) => t.key === "resonance")!;
    if (h < 12) return techniques.find((t) => t.key === "box")!;
    if (h < 17) return techniques.find((t) => t.key === "cyclic")!;
    if (h < 21) return techniques.find((t) => t.key === "triangle")!;
    return techniques.find((t) => t.key === "478")!;
  }, []);

  const quickCalm = () => {
    setTechniqueKey("cyclic");
    setDuration(1);
    setTimeout(() => start(), 50);
  };

  // ─ cinema (fullscreen) mode ─
  const [cinema, setCinema] = useState(false);
  useEffect(() => {
    if (!cinema) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCinema(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [cinema]);

  const hc = prefs.highContrast;
  const themeStyle = {
    background: hc ? "#FFFFFF" : bg,
    color: hc ? "#000000" : ink,
    fontSize: `${prefs.fontScale * 100}%`,
  };
  const cardBorder = hc ? "#000000" : border;

  return (
    <AppShell>
    <div className="font-['DM_Sans',sans-serif]" style={{ ...themeStyle, background: "transparent" }}>
      {/* live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{announce}</div>


      {/* header */}
      <header className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <ArrowLeft size={18} className="opacity-60 group-hover:-translate-x-0.5 transition-transform" />
          <img src={logo} alt="" className="w-7 h-7 opacity-90" />
          <span className="text-[11px] tracking-[0.3em] uppercase opacity-60">peacecode · breathe</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={quickCalm}
            className="hidden sm:inline-flex items-center gap-2 px-4 h-10 rounded-full text-[12px] tracking-wide transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: peach, color: ink }}
          >
            <Zap size={14} aria-hidden="true" /> quick calm · 60s
          </button>
          <Link
            to="/breathe/stats"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
            style={{ background: surface, border: `1px solid ${cardBorder}` }}
            aria-label="technique stats"
          >
            <BarChart3 size={16} />
          </Link>
          <button
            onClick={() => setShowA11y(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
            style={{ background: surface, border: `1px solid ${cardBorder}` }}
            aria-label="accessibility settings"
          >
            <Accessibility size={16} />
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
            style={{ background: surface, border: `1px solid ${cardBorder}` }}
            aria-label="session history"
          >
            <Timer size={16} />
          </button>
          <button
            onClick={() => setCinema(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2"
            style={{ background: ink, color: surface }}
            aria-label="cinema mode"
            title="cinema mode"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </header>

      {/* hero + orb */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-center mb-8">
          <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-3">the still hour</div>
          <h1 className="font-['Fraunces',serif] text-4xl sm:text-5xl md:text-6xl font-light leading-[1.05]">
            let your breath{" "}
            <span className="italic" style={{ color: primary }}>lead you home.</span>
          </h1>
          <p className="mt-4 text-sm sm:text-[15px] opacity-70 max-w-lg mx-auto">
            {currentTech.name.toLowerCase()} · {currentTech.tag} · {currentTech.benefit}
          </p>
        </div>

        {/* main breathing stage */}
        <div
          className="rounded-[32px] p-6 sm:p-10 relative overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${currentTheme.from}, ${currentTheme.to})`,
            border: `1px solid ${border}`,
          }}
        >
          {/* ambient theme layer */}
          <ThemeBackdrop theme={prefs.theme} />

          <div className="relative z-10 flex flex-col items-center">
            {/* orb */}
            <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] flex items-center justify-center my-6">
              {/* rings */}
              <div
                className="absolute inset-0 rounded-full transition-transform duration-[300ms] ease-out"
                style={{
                  transform: `scale(${scale})`,
                  background: `radial-gradient(circle at 30% 30%, ${surface}, ${currentTech.color}55 60%, transparent 75%)`,
                  boxShadow: `0 0 80px ${currentTech.color}44`,
                }}
              />
              <div
                className="absolute rounded-full transition-transform duration-[300ms] ease-out"
                style={{
                  width: "80%", height: "80%",
                  transform: `scale(${scale})`,
                  background: `radial-gradient(circle, ${surface}dd, ${currentTech.color}22)`,
                  border: `1px solid ${border}`,
                }}
              />
              {/* progress ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="47" fill="none" stroke={border} strokeWidth="0.6" />
                <circle
                  cx="50" cy="50" r="47" fill="none"
                  stroke={currentTech.color} strokeWidth="0.8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 47}`}
                  strokeDashoffset={`${2 * Math.PI * 47 * (1 - totalElapsed / Math.max(1, totalSecs))}`}
                  style={{ transition: "stroke-dashoffset 0.3s linear" }}
                />
              </svg>
              {/* center text */}
              <div className="relative z-10 text-center">
                <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-2">
                  {running ? phaseLabel[phase] : "ready"}
                </div>
                <div className="font-['Fraunces',serif] text-5xl sm:text-6xl font-light">
                  {formatTime(remaining)}
                </div>
                <div className="text-[11px] opacity-60 mt-2">
                  {cycles} cycles · {duration}m session
                </div>
              </div>
            </div>

            {/* controls */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={reset}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5"
                style={{ background: surface, border: `1px solid ${border}` }}
                aria-label="reset"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => (running ? setRunning(false) : totalElapsed > 0 ? setRunning(true) : start())}
                className="h-14 px-8 rounded-full flex items-center gap-3 text-[13px] tracking-wide transition-transform hover:-translate-y-0.5"
                style={{ background: ink, color: surface }}
              >
                {running ? <><Pause size={16} /> pause</> : totalElapsed > 0 ? <><Play size={16} /> resume</> : <><Play size={16} /> begin</>}
              </button>
              <button
                onClick={stop}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5"
                style={{ background: surface, border: `1px solid ${border}` }}
                aria-label="stop"
              >
                <SkipForward size={15} />
              </button>
            </div>

            {/* duration pills */}
            <div className="flex items-center gap-2 mt-8 flex-wrap justify-center">
              {durations.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDuration(d); reset(); }}
                  className="h-9 px-4 rounded-full text-[12px] transition-all"
                  style={{
                    background: duration === d ? ink : surface,
                    color: duration === d ? surface : ink,
                    border: `1px solid ${duration === d ? ink : border}`,
                  }}
                >
                  {d}m
                </button>
              ))}
            </div>

            {/* keyboard hints */}
            {prefs.keyboardHints && (
              <div className="mt-6 text-[10px] tracking-[0.2em] uppercase opacity-50 flex flex-wrap gap-x-4 gap-y-1 justify-center">
                <span><kbd className="font-sans not-italic">space</kbd> play · pause</span>
                <span><kbd className="font-sans not-italic">r</kbd> reset</span>
                <span><kbd className="font-sans not-italic">s</kbd> stop</span>
                <span><kbd className="font-sans not-italic">1–6</kbd> technique</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI suggestion + quick calm + focus shortcut */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Kicker>peace ai · for right now</Kicker>
          <div className="font-['Fraunces',serif] text-2xl leading-tight mt-2">{aiSuggest.name}</div>
          <p className="text-[13px] opacity-70 mt-2">{aiSuggest.desc}</p>
          <button
            onClick={() => { setTechniqueKey(aiSuggest.key); reset(); }}
            className="mt-4 inline-flex items-center gap-2 text-[12px] tracking-wide"
            style={{ color: primary }}
          >
            try this <ChevronRight size={14} />
          </button>
        </Card>
        <Card accent={peach}>
          <Kicker>emergency</Kicker>
          <div className="font-['Fraunces',serif] text-2xl leading-tight mt-2">quick calm</div>
          <p className="text-[13px] opacity-70 mt-2">A 60-second cyclic sigh. Fastest way to steady a racing mind.</p>
          <button
            onClick={quickCalm}
            className="mt-4 inline-flex items-center gap-2 text-[12px] tracking-wide"
            style={{ color: ink }}
          >
            launch now <Zap size={14} />
          </button>
        </Card>
        <Card accent={moss}>
          <Kicker>bridge to focus</Kicker>
          <div className="font-['Fraunces',serif] text-2xl leading-tight mt-2">breathe → work</div>
          <p className="text-[13px] opacity-70 mt-2">Steady with 3 minutes of box breath, then a 25-minute focus block.</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => { setTechniqueKey("box"); setDuration(3); reset(); }}
              className="text-[12px]" style={{ color: primary }}
            >prep breath</button>
            <Link to="/focus" className="text-[12px] opacity-70 hover:opacity-100 inline-flex items-center gap-1">
              open focus <ChevronRight size={12} />
            </Link>
          </div>
        </Card>
      </section>

      {/* techniques */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-12">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-50">library</div>
            <h2 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-light mt-1">Six ways to arrive.</h2>
          </div>
          <button
            onClick={() => setShowCustom(true)}
            className="text-[12px] tracking-wide opacity-70 hover:opacity-100 inline-flex items-center gap-1"
          >
            <Settings2 size={12} /> custom pattern
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {techniques.map((t) => {
            const active = t.key === techniqueKey;
            const fav = prefs.favorites.includes(t.key);
            return (
              <button
                key={t.key}
                onClick={() => { setTechniqueKey(t.key); reset(); }}
                className="text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 relative group"
                style={{
                  background: active ? surface2 : surface,
                  border: `1px solid ${active ? t.color : border}`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] tracking-[0.3em] uppercase opacity-50">{t.tag}</div>
                    <div className="font-['Fraunces',serif] text-xl mt-1">{t.name}</div>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(t.key); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ background: fav ? peach : "transparent", color: fav ? ink : muted }}
                  >
                    <Star size={13} fill={fav ? ink : "none"} />
                  </span>
                </div>
                <p className="text-[13px] opacity-70 mt-3">{t.desc}</p>
                <div className="text-[11px] mt-3 opacity-60 italic">{t.benefit}</div>
                <ul className="mt-4 space-y-1.5">
                  {t.tips.map((tip, i) => (
                    <li key={i} className="text-[12px] opacity-70 pl-3 relative">
                      <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full" style={{ background: t.color }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      {/* preferences: pace + sound + theme + voice */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-12 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <Kicker>pace</Kicker>
          <div className="mt-3 flex flex-wrap gap-2">
            {paces.map((p) => (
              <button
                key={p.key}
                onClick={() => updatePrefs({ pace: p.key })}
                className="h-9 px-4 rounded-full text-[12px] transition-all"
                style={{
                  background: prefs.pace === p.key ? ink : surface,
                  color: prefs.pace === p.key ? surface : ink,
                  border: `1px solid ${prefs.pace === p.key ? ink : border}`,
                }}
              >{p.label}</button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${border}` }}>
            <div>
              <Kicker>voice guidance</Kicker>
              <div className="text-[13px] opacity-70 mt-1">soft cues at each phase</div>
            </div>
            <button
              onClick={() => updatePrefs({ voice: !prefs.voice })}
              className="w-14 h-8 rounded-full relative transition-colors"
              style={{ background: prefs.voice ? primary : border }}
              aria-label="voice"
            >
              <span
                className="absolute top-1 w-6 h-6 rounded-full transition-all"
                style={{ background: surface, left: prefs.voice ? "28px" : "4px" }}
              />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3 opacity-70 text-[12px]">
            {prefs.voice ? <Mic size={13} /> : <MicOff size={13} />}
            {prefs.voice ? "guidance on" : "silent session"}
          </div>
        </Card>

        <Card>
          <Kicker>soundscape</Kicker>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {soundscapes.map((s) => {
              const active = prefs.soundscape === s.key;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => updatePrefs({ soundscape: s.key })}
                  className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                  style={{
                    background: active ? surface2 : surface,
                    border: `1px solid ${active ? primary : border}`,
                    color: active ? primary : ink,
                  }}
                >
                  <Icon size={15} />
                  <span className="text-[11px]">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${border}` }}>
            <Kicker>background theme</Kicker>
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {themes.map((th) => {
                const active = prefs.theme === th.key;
                return (
                  <button
                    key={th.key}
                    onClick={() => updatePrefs({ theme: th.key })}
                    className="h-14 rounded-xl relative overflow-hidden transition-all"
                    style={{
                      background: `linear-gradient(160deg, ${th.from}, ${th.to})`,
                      border: `2px solid ${active ? ink : border}`,
                    }}
                    aria-label={th.label}
                  >
                    <span className="absolute bottom-1 left-1 right-1 text-[9px] text-center opacity-80">{th.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* mood check */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Kicker>before you begin</Kicker>
              <div className="font-['Fraunces',serif] text-xl mt-1">how are you arriving?</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => {
                const active = moodBefore === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMoodBefore(active ? undefined : m)}
                    className="h-9 px-4 rounded-full text-[12px] transition-all"
                    style={{
                      background: active ? lavender : surface,
                      color: ink,
                      border: `1px solid ${active ? lavender : border}`,
                    }}
                  >{m}</button>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* stats: streak · goal · week */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Kicker>today's goal</Kicker>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-['Fraunces',serif] text-4xl">{todayMins}</span>
            <span className="opacity-60 text-[13px] pb-1">/ {prefs.dailyGoalMinutes} min</span>
          </div>
          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: surface2 }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${goalPct}%`, background: primary }} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] opacity-70">
            adjust:
            {[3, 5, 10, 15].map((g) => (
              <button
                key={g} onClick={() => updatePrefs({ dailyGoalMinutes: g })}
                className="px-2 h-6 rounded-full"
                style={{ background: prefs.dailyGoalMinutes === g ? ink : "transparent", color: prefs.dailyGoalMinutes === g ? surface : ink, border: `1px solid ${border}` }}
              >{g}m</button>
            ))}
          </div>
        </Card>
        <Card accent={peach}>
          <Kicker>streak</Kicker>
          <div className="mt-3 flex items-center gap-3">
            <Flame size={26} style={{ color: primary }} />
            <div>
              <div className="font-['Fraunces',serif] text-3xl leading-none">{streak.current}</div>
              <div className="text-[11px] opacity-60 mt-1">consecutive days</div>
            </div>
          </div>
          <div className="mt-4 text-[12px] opacity-70 flex gap-4">
            <span>longest · {streak.longest}</span>
            <span>total · {streak.totalDays} days</span>
          </div>
        </Card>
        <Card>
          <Kicker>this week</Kicker>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="minutes" value={week.minutes} />
            <Stat label="sessions" value={week.sessions} />
            <Stat label="cycles" value={week.cycles} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] opacity-70">
            <TrendingUp size={12} /> gentle progress is progress
          </div>
        </Card>
      </section>

      {/* achievements */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
        <Card>
          <Kicker>badges · milestones</Kicker>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((b) => {
              const unlocked = streak.totalDays >= b.need;
              const Icon = b.icon;
              return (
                <div
                  key={b.name}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{
                    background: unlocked ? surface2 : surface,
                    border: `1px solid ${border}`,
                    opacity: unlocked ? 1 : 0.55,
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: unlocked ? lavender : surface2 }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-[13px]">{b.name}</div>
                    <div className="text-[10px] opacity-60">{b.need} days</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* recent + favorites row */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 mb-16 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <Kicker>recent sessions</Kicker>
            <button onClick={() => setShowHistory(true)} className="text-[11px] opacity-70 hover:opacity-100 inline-flex items-center gap-1">
              all <ChevronRight size={12} />
            </button>
          </div>
          <ul className="mt-3 divide-y" style={{ borderColor: border }}>
            {sessions.slice(0, 5).map((s) => {
              const t = techniques.find((tt) => tt.key === s.technique);
              return (
                <li key={s.id} className="py-3 flex items-center justify-between text-[13px]">
                  <div>
                    <div>{t?.name ?? s.technique}</div>
                    <div className="text-[11px] opacity-60">
                      {new Date(s.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })} · {s.minutes}m · {s.cycles} cycles
                    </div>
                  </div>
                  <span className="text-[11px] opacity-60 italic">{s.moodBefore ?? "—"}</span>
                </li>
              );
            })}
            {sessions.length === 0 && <li className="py-6 text-[13px] opacity-60 text-center">your first breath awaits.</li>}
          </ul>
        </Card>
        <Card>
          <Kicker>favorites</Kicker>
          <div className="mt-3 space-y-2">
            {prefs.favorites.length === 0 && <div className="text-[13px] opacity-60 py-6 text-center">tap the star on any technique to save it here.</div>}
            {prefs.favorites.map((k) => {
              const t = techniques.find((tt) => tt.key === k);
              if (!t) return null;
              return (
                <button
                  key={k}
                  onClick={() => { setTechniqueKey(k); reset(); }}
                  className="w-full flex items-center justify-between text-left p-3 rounded-xl transition-all hover:-translate-y-0.5"
                  style={{ background: surface, border: `1px solid ${border}` }}
                >
                  <div>
                    <div className="text-[13px]">{t.name}</div>
                    <div className="text-[11px] opacity-60">{t.tag}</div>
                  </div>
                  <Play size={13} style={{ color: primary }} />
                </button>
              );
            })}
          </div>
        </Card>
      </section>

      {/* modals */}
      {showHistory && <HistoryModal sessions={sessions} onClose={() => setShowHistory(false)} onDelete={(id) => { deleteSession(id); setSessions((p) => p.filter((s) => s.id !== id)); }} />}
      {showCustom && <CustomPatternModal pattern={prefs.customPattern} onSave={(p) => { updatePrefs({ customPattern: p }); setTechniqueKey("custom"); setShowCustom(false); }} onClose={() => setShowCustom(false)} />}
      {showCompletion && <CompletionModal mins={showCompletion.mins} cycles={showCompletion.cycles} onClose={(mood) => {
        if (mood) {
          const list = loadSessions();
          if (list[0]) {
            list[0].moodAfter = mood;
            window.localStorage.setItem("peacecode.breathe.sessions.v1", JSON.stringify(list));
            setSessions(list.sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
          }
        }
        setShowCompletion(null);
        reset();
      }} />}
      {showA11y && <A11yModal prefs={prefs} onChange={updatePrefs} onClose={() => setShowA11y(false)} />}
    </div>

    {/* ── CINEMA MODE ─────────────────────────────────── */}
    {cinema && (
      <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" style={{ color: "#F7FAFF" }}>
        <div className="absolute inset-0" style={{
          background: `radial-gradient(1000px 600px at 50% 0%, ${currentTech.color}33, transparent 60%), radial-gradient(800px 500px at 50% 100%, ${primary}22, transparent 60%), #0B1226`,
        }}/>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-40 pointer-events-none"
             style={{ background: `radial-gradient(circle, ${currentTech.color}, transparent 60%)` }}/>
        <div className="absolute bottom-[-200px] right-[-100px] w-[520px] h-[520px] rounded-full blur-3xl opacity-25 pointer-events-none"
             style={{ background: `radial-gradient(circle, ${lavender}, transparent 60%)` }}/>

        <div className="relative z-10 flex items-center justify-between px-8 pt-7">
          <div className="flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase opacity-70">
            <img src={logo} alt="" className="w-6 h-6 opacity-90"/>
            cinema · {currentTech.name.toLowerCase()} · esc to exit
          </div>
          <button onClick={() => setCinema(false)}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[11px] tracking-wide transition hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
            <Minimize2 className="w-3.5 h-3.5"/> exit
          </button>
        </div>

        <div className="relative z-10 h-[calc(100vh-88px)] flex flex-col items-center justify-center px-6">
          <div className="mb-6 text-[11px] tracking-[0.5em] uppercase opacity-70">
            {running ? phaseLabel[phase] : "ready"}
          </div>
          <div className="relative w-[min(78vmin,640px)] h-[min(78vmin,640px)] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full transition-transform duration-[300ms] ease-out"
                 style={{
                   transform: `scale(${scale})`,
                   background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), ${currentTech.color}66 60%, transparent 78%)`,
                   filter: `drop-shadow(0 0 40px ${currentTech.color})`,
                 }}/>
            <div className="absolute rounded-full transition-transform duration-[300ms] ease-out"
                 style={{
                   width: "72%", height: "72%",
                   transform: `scale(${scale})`,
                   background: `radial-gradient(circle, rgba(255,255,255,0.15), ${currentTech.color}22)`,
                   border: "1px solid rgba(255,255,255,0.16)",
                 }}/>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.4" />
              <circle cx="50" cy="50" r="47" fill="none"
                stroke="#F7FAFF" strokeWidth="0.6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 47}`}
                strokeDashoffset={`${2 * Math.PI * 47 * (1 - totalElapsed / Math.max(1, totalSecs))}`}
                style={{ transition: "stroke-dashoffset 0.3s linear" }}/>
            </svg>
            <div className="relative z-10 text-center">
              <div className="font-['Fraunces',serif] font-light" style={{ fontSize: "clamp(72px, 12vmin, 148px)" }}>
                {formatTime(remaining)}
              </div>
              <div className="text-[11px] tracking-[0.4em] uppercase opacity-60 mt-3">
                cycle {cycles} · {duration}m
              </div>
            </div>
          </div>

          <div className="mt-14 flex items-center gap-4">
            <button onClick={reset}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}>
              <RotateCcw size={15}/>
            </button>
            <button onClick={() => (running ? setRunning(false) : totalElapsed > 0 ? setRunning(true) : start())}
                    className="h-14 px-10 rounded-full flex items-center gap-3 text-[13px] tracking-[0.2em] uppercase transition hover:-translate-y-0.5"
                    style={{ background: "#F7FAFF", color: "#0B1226", boxShadow: `0 20px 60px -20px ${currentTech.color}` }}>
              {running ? <><Pause size={16}/> pause</> : totalElapsed > 0 ? <><Play size={16}/> resume</> : <><Play size={16}/> begin</>}
            </button>
            <button onClick={stop}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition hover:-translate-y-0.5"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}>
              <SkipForward size={15}/>
            </button>
          </div>
        </div>
      </div>
    )}
    </AppShell>
  );
}


// ── helpers ───────────────────────────────────────────────────────
function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
      style={{
        background: surface,
        border: `1px solid ${border}`,
        boxShadow: accent ? `inset 0 0 0 3px ${accent}22` : undefined,
      }}
    >
      {children}
    </div>
  );
}
function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] tracking-[0.35em] uppercase opacity-55">{children}</div>;
}
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: surface2 }}>
      <div className="font-['Fraunces',serif] text-2xl leading-none">{value}</div>
      <div className="text-[10px] opacity-60 mt-1">{label}</div>
    </div>
  );
}
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// theme backdrops — CSS-only, no external assets
function ThemeBackdrop({ theme }: { theme: string }) {
  if (theme === "galaxy") {
    return (
      <>
        <div className="absolute inset-0 opacity-40" style={{
          background: "radial-gradient(1px 1px at 20% 30%, #fff 100%, transparent), radial-gradient(1px 1px at 70% 60%, #fff 100%, transparent), radial-gradient(1px 1px at 40% 80%, #fff 100%, transparent), radial-gradient(1px 1px at 85% 20%, #fff 100%, transparent)",
        }} />
      </>
    );
  }
  if (theme === "ocean") {
    return (
      <svg className="absolute inset-x-0 bottom-0 w-full opacity-30" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0,60 Q100,30 200,60 T400,60 L400,100 L0,100 Z" fill={primary} />
      </svg>
    );
  }
  if (theme === "leaves") {
    return (
      <>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute w-4 h-4 rounded-full opacity-40 animate-pulse"
            style={{ background: moss, top: `${15 + i * 12}%`, left: `${(i * 17) % 90}%` }} />
        ))}
      </>
    );
  }
  return null;
}

// ── history modal ─────────────────────────────────────────────────
function HistoryModal({ sessions, onClose, onDelete }: { sessions: BreathSession[]; onClose: () => void; onDelete: (id: string) => void }) {
  const [filter, setFilter] = useState<BreathTechniqueKey | "all">("all");
  const filtered = sessions.filter((s) => filter === "all" || s.technique === filter);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#1D2A4488" }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl p-6 overflow-hidden flex flex-col" style={{ background: surface, border: `1px solid ${border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Kicker>full history</Kicker>
            <h3 className="font-['Fraunces',serif] text-2xl mt-1">Every breath you've kept.</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface2 }}><X size={15} /></button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(["all", ...techniques.map((t) => t.key)] as const).map((k) => (
            <button
              key={k} onClick={() => setFilter(k as BreathTechniqueKey | "all")}
              className="h-8 px-3 rounded-full text-[11px]"
              style={{
                background: filter === k ? ink : surface,
                color: filter === k ? surface : ink,
                border: `1px solid ${filter === k ? ink : border}`,
              }}
            >{k === "all" ? "all" : techniques.find((t) => t.key === k)?.name.toLowerCase() ?? k}</button>
          ))}
        </div>
        <div className="overflow-y-auto -mx-2 px-2">
          <ul className="divide-y" style={{ borderColor: border }}>
            {filtered.map((s) => {
              const t = techniques.find((tt) => tt.key === s.technique);
              return (
                <li key={s.id} className="py-3 flex items-center justify-between text-[13px]">
                  <div>
                    <div>{t?.name ?? s.technique}</div>
                    <div className="text-[11px] opacity-60">
                      {new Date(s.completedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {s.minutes}m · {s.cycles} cycles
                    </div>
                    {(s.moodBefore || s.moodAfter) && (
                      <div className="text-[11px] italic opacity-60 mt-0.5">
                        {s.moodBefore ?? "—"} → {s.moodAfter ?? "—"}
                      </div>
                    )}
                  </div>
                  <button onClick={() => onDelete(s.id)} className="opacity-40 hover:opacity-100"><Trash2 size={14} /></button>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="py-8 text-center opacity-60 text-[13px]">nothing here yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── custom pattern modal ──────────────────────────────────────────
function CustomPatternModal({ pattern, onSave, onClose }: { pattern: BreathPattern; onSave: (p: BreathPattern) => void; onClose: () => void }) {
  const [p, setP] = useState(pattern);
  const fields: { key: keyof BreathPattern; label: string }[] = [
    { key: "inhale", label: "inhale" }, { key: "hold1", label: "hold" },
    { key: "exhale", label: "exhale" }, { key: "hold2", label: "hold" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#1D2A4488" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <Kicker>custom pattern</Kicker>
            <h3 className="font-['Fraunces',serif] text-2xl mt-1">Tune your own rhythm.</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface2 }}><X size={15} /></button>
        </div>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <div className="flex items-center justify-between text-[12px] opacity-70 mb-1">
                <span>{f.label}</span><span>{p[f.key]}s</span>
              </div>
              <input
                type="range" min={0} max={12} step={1} value={p[f.key]}
                onChange={(e) => setP({ ...p, [f.key]: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => onSave(p)}
          className="w-full mt-6 h-11 rounded-full text-[13px]"
          style={{ background: ink, color: surface }}
        >save & use</button>
      </div>
    </div>
  );
}

// ── completion modal ──────────────────────────────────────────────
function CompletionModal({ mins, cycles, onClose }: { mins: number; cycles: number; onClose: (mood?: string) => void }) {
  const [mood, setMood] = useState<string | undefined>();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#1D2A44CC" }}>
      <div className="w-full max-w-md rounded-3xl p-8 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: `radial-gradient(circle, ${lavender}, ${surface2})` }}>
          <Sparkles size={26} style={{ color: primary }} />
        </div>
        <div className="text-[10px] tracking-[0.4em] uppercase opacity-50">complete</div>
        <h3 className="font-['Fraunces',serif] text-3xl mt-2">You arrived.</h3>
        <p className="text-[13px] opacity-70 mt-2">{mins} minutes · {cycles} full cycles</p>
        <div className="mt-6">
          <Kicker>how do you feel?</Kicker>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {moods.map((m) => (
              <button
                key={m} onClick={() => setMood(m)}
                className="h-8 px-3 rounded-full text-[11px]"
                style={{
                  background: mood === m ? lavender : surface,
                  color: ink, border: `1px solid ${mood === m ? lavender : border}`,
                }}
              >{m}</button>
            ))}
          </div>
        </div>
        <button
          onClick={() => onClose(mood)}
          className="mt-6 w-full h-11 rounded-full text-[13px]"
          style={{ background: ink, color: surface }}
        >close · saved</button>
      </div>
    </div>
  );
}

// ── a11y modal ────────────────────────────────────────────────────
function A11yModal({ prefs, onChange, onClose }: { prefs: BreathPrefs; onChange: (p: Partial<BreathPrefs>) => void; onClose: () => void }) {
  const scales = [
    { v: 1,    label: "normal" },
    { v: 1.15, label: "large" },
    { v: 1.3,  label: "larger" },
    { v: 1.5,  label: "largest" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#1D2A4488" }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Accessibility settings">
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <Kicker>accessibility</Kicker>
            <h3 className="font-['Fraunces',serif] text-2xl mt-1">Tune it to fit you.</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2" style={{ background: surface2 }} aria-label="close"><X size={15} /></button>
        </div>

        <Toggle icon={Sparkles} label="Reduced motion" hint="Freezes the orb — steady visual guide only." value={prefs.reducedMotion} onToggle={() => onChange({ reducedMotion: !prefs.reducedMotion })} />
        <Toggle icon={Contrast} label="High contrast" hint="Black on white, thicker borders." value={prefs.highContrast} onToggle={() => onChange({ highContrast: !prefs.highContrast })} />
        <Toggle icon={Keyboard} label="Show keyboard hints" hint="Space · play/pause  ·  R · reset  ·  S · stop  ·  1–6 · technique" value={prefs.keyboardHints} onToggle={() => onChange({ keyboardHints: !prefs.keyboardHints })} />

        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex items-center gap-2 mb-2">
            <Type size={13} />
            <span className="text-[12px]">text size</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {scales.map((s) => (
              <button
                key={s.v}
                onClick={() => onChange({ fontScale: s.v })}
                className="h-10 rounded-xl text-[11px] focus:outline-none focus-visible:ring-2"
                style={{
                  background: prefs.fontScale === s.v ? ink : surface,
                  color: prefs.fontScale === s.v ? surface : ink,
                  border: `1px solid ${prefs.fontScale === s.v ? ink : border}`,
                }}
              >{s.label}</button>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-6 h-11 rounded-full text-[13px]" style={{ background: ink, color: surface }}>done</button>
      </div>
    </div>
  );
}

function Toggle({ icon: Icon, label, hint, value, onToggle }: { icon: typeof Sparkles; label: string; hint: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <Icon size={15} className="mt-0.5 opacity-70" aria-hidden="true" />
        <div>
          <div className="text-[13px]">{label}</div>
          <div className="text-[11px] opacity-60 mt-0.5">{hint}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={value}
        aria-label={label}
        className="shrink-0 w-14 h-8 rounded-full relative transition-colors focus:outline-none focus-visible:ring-2"
        style={{ background: value ? primary : border }}
      >
        <span className="absolute top-1 w-6 h-6 rounded-full transition-all" style={{ background: surface, left: value ? "28px" : "4px" }} />
      </button>
    </div>
  );
}
