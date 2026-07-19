// Mind Gym — Immersive fullscreen training screen.
// Hides shell chrome, renders one of several playable mini-games based on the
// exercise type, tracks score/accuracy/streak/seconds, then routes to results.

import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Pause, Play, RotateCcw, Heart } from "lucide-react";
import { EXERCISES, completeSession, useMindGym, type Exercise } from "@/lib/mindgym-store";

export const Route = createFileRoute("/mindgym/train/$id")({
  component: TrainPage,
});

function TrainPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const ex = EXERCISES.find(e => e.id === id);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Timer
  useEffect(() => {
    if (paused || finished) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [paused, finished]);

  useEffect(() => { setBestStreak(s => Math.max(s, streak)); }, [streak]);

  // Add score helper
  const bump = (delta: number, ok: boolean) => {
    setScore(s => s + delta);
    setAttempts(a => a + 1);
    if (ok) { setCorrect(c => c + 1); setStreak(s => s + 1); }
    else    { setStreak(0); setLives(l => Math.max(0, l - 1)); }
  };

  // Finish
  const finish = () => {
    if (!ex || finished) return;
    setFinished(true);
    const acc = attempts ? Math.round(correct / attempts * 100) : 100;
    const finalScore = Math.max(0, Math.min(100, Math.round((score / Math.max(1, maxScore)) * 100)));
    const session = completeSession(ex.id, { score: finalScore, accuracy: acc, streak: bestStreak, seconds });
    if (session) router.navigate({ to: "/mindgym/results/$sid", params: { sid: session.id } });
  };

  // Auto-finish if lives depleted or exercise time reached
  useEffect(() => {
    if (!ex) return;
    if (lives <= 0 || seconds >= ex.minutes * 60) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives, seconds, ex]);

  if (!ex) return (
    <main className="max-w-[720px] mx-auto px-6 py-20 text-center">
      <h1 className="font-serif text-[28px]">Exercise not found.</h1>
      <Link to="/mindgym" className="text-[13px] mt-4 inline-block" style={{ color: "var(--pc-primary)" }}>Back</Link>
    </main>
  );

  const total = ex.minutes * 60;
  const progress = Math.min(1, seconds / total);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: "var(--pc-bg)" }}>
      {/* Immersive backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle,var(--pc-aurora-a),transparent 70%)" }}/>
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle,var(--pc-aurora-b),transparent 70%)" }}/>
      </div>

      {/* HUD */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
        <button onClick={() => router.navigate({ to: "/mindgym" })}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pc-surface2)]"
          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}
          aria-label="Exit">
          <X className="w-4 h-4"/>
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <HUDStat label="Score" value={String(score)}/>
          <HUDStat label="Streak" value={`${streak}×`}/>
          <HUDStat label="Lives" value={"♥".repeat(lives) || "—"}/>
          <HUDStat label="Time" value={formatT(seconds)}/>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setPaused(p=>!p)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pc-surface2)]"
            style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }} aria-label="Pause">
            {paused ? <Play className="w-4 h-4"/> : <Pause className="w-4 h-4"/>}
          </button>
          <button onClick={()=>{ setScore(0); setStreak(0); setLives(3); setSeconds(0); setCorrect(0); setAttempts(0); }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--pc-surface2)]"
            style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }} aria-label="Restart">
            <RotateCcw className="w-4 h-4"/>
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-4 sm:px-8">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
          <div className="h-full transition-all" style={{ width: `${progress*100}%`, background: "var(--pc-primary)" }}/>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-6 relative z-10">
        {paused ? (
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>Paused</div>
            <div className="font-serif text-[36px] mt-2" style={{ color: "var(--pc-ink)" }}>Breathe.</div>
            <button onClick={()=>setPaused(false)} className="mt-6 rounded-full px-5 py-2.5 text-[13px]"
              style={{ background: "var(--pc-primary)", color: "white" }}>Resume</button>
          </div>
        ) : (
          <Player ex={ex} bump={bump} onEnd={finish} setMaxScore={setMaxScore}/>
        )}
      </div>

      {/* Footer exercise name */}
      <footer className="relative z-10 text-center pb-4">
        <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>{ex.difficulty} · {ex.path}</div>
        <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>{ex.name}</div>
        <button onClick={finish} className="mt-2 text-[11px] tracking-[0.2em] uppercase hover:opacity-70" style={{ color: "var(--pc-muted)" }}>
          Finish rep →
        </button>
      </footer>
    </div>
  );
}

function HUDStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl px-3 py-1.5 min-w-[54px]" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
      <div className="text-[8px] tracking-[0.2em] uppercase" style={{ color: "var(--pc-muted)" }}>{label}</div>
      <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>{value}</div>
    </div>
  );
}
function formatT(s: number) { const m = Math.floor(s/60), r = s%60; return `${m}:${String(r).padStart(2,"0")}`; }

// ─── Player dispatcher ─────────────────────────────────────────
function Player({ ex, bump, onEnd, setMaxScore }: { ex: Exercise; bump: (d: number, ok: boolean) => void; onEnd: () => void; setMaxScore: (n: number) => void }) {
  const key = ex.type;
  if (key === "reaction")           return <ReactionGame bump={bump} setMax={setMaxScore}/>;
  if (key === "memory")             return <SequenceGame bump={bump} setMax={setMaxScore}/>;
  if (key === "attention")          return <OddOneOut bump={bump} setMax={setMaxScore}/>;
  if (key === "pattern")            return <OddOneOut bump={bump} setMax={setMaxScore}/>;
  if (key === "logic")              return <ChoiceGame bump={bump} setMax={setMaxScore}/>;
  if (key === "decision")           return <ChoiceGame bump={bump} setMax={setMaxScore}/>;
  if (key === "emotion-recognition")return <ChoiceGame bump={bump} setMax={setMaxScore}/>;
  if (key === "rapid-recall")       return <RapidRecall bump={bump} setMax={setMaxScore}/>;
  if (key === "breathing")          return <BreathingGame bump={bump} setMax={setMaxScore}/>;
  if (key === "visual-focus")       return <BreathingGame bump={bump} setMax={setMaxScore}/>;
  if (key === "mindfulness")        return <BreathingGame bump={bump} setMax={setMaxScore}/>;
  if (key === "stress-recovery")    return <BreathingGame bump={bump} setMax={setMaxScore}/>;
  if (key === "visualization")      return <BreathingGame bump={bump} setMax={setMaxScore}/>;
  return <ReflectionGame bump={bump} setMax={setMaxScore} ex={ex}/>;
}

// ─── Reaction: click when green ─────────────────────────────────
function ReactionGame({ bump, setMax }: { bump: (d: number, ok: boolean) => void; setMax: (n: number) => void }) {
  const [phase, setPhase] = useState<"wait" | "green" | "red">("wait");
  const [rounds, setRounds] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [startAt, setStartAt] = useState<number>(0);
  useEffect(() => { setMax(1000); }, [setMax]);
  useEffect(() => {
    if (rounds >= 10) return;
    const delay = 900 + Math.random() * 1800;
    const isFake = Math.random() < 0.2;
    const t = setTimeout(() => {
      setPhase(isFake ? "red" : "green");
      setStartAt(Date.now());
    }, delay);
    return () => clearTimeout(t);
  }, [rounds]);
  const tap = () => {
    if (phase === "green") {
      const rt = Date.now() - startAt;
      const points = Math.max(20, 220 - Math.round(rt / 4));
      bump(points, true);
      setBest(b => (b === null ? rt : Math.min(b, rt)));
      setPhase("wait"); setRounds(r => r + 1);
    } else if (phase === "red") {
      bump(-30, false); setPhase("wait"); setRounds(r => r + 1);
    } else {
      bump(-10, false);
    }
  };
  return (
    <div className="w-full max-w-[520px] text-center">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Round {Math.min(rounds+1, 10)}/10 · Best {best ? best + "ms" : "—"}</div>
      <button onClick={tap}
        className="w-full aspect-square rounded-3xl transition-all duration-150 flex items-center justify-center"
        style={{
          background: phase === "green" ? "linear-gradient(135deg,#68d391,#38a169)"
                     : phase === "red"   ? "linear-gradient(135deg,#fca5a5,#e11d48)"
                                         : "var(--pc-surface)",
          border: "1px solid var(--pc-border)",
        }}>
        <div className="font-serif text-[28px] sm:text-[36px]" style={{ color: phase === "wait" ? "var(--pc-muted)" : "white" }}>
          {phase === "green" ? "TAP" : phase === "red" ? "wait" : "get ready"}
        </div>
      </button>
      <div className="mt-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>Tap on green only. Red = wait.</div>
    </div>
  );
}

// ─── Sequence memory ──────────────────────────────────────────
function SequenceGame({ bump, setMax }: { bump: (d: number, ok: boolean) => void; setMax: (n: number) => void }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  useEffect(() => { setMax(600); }, [setMax]);
  useEffect(() => {
    const next = [...seq, Math.floor(Math.random() * 4)];
    setSeq(next); setInput([]); setPlaying(true);
    (async () => {
      for (const n of next) {
        setActive(n); await sleep(500);
        setActive(null); await sleep(180);
      }
      setPlaying(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const tap = (i: number) => {
    if (playing) return;
    const nextInput = [...input, i];
    setInput(nextInput);
    const idx = nextInput.length - 1;
    if (seq[idx] !== i) { bump(-30, false); setRound(r => r + 1); setSeq([]); return; }
    if (nextInput.length === seq.length) {
      bump(40 + seq.length * 10, true);
      setRound(r => r + 1);
    }
  };
  const colors = ["#7EA8FF", "#F5B36B", "#8FD3D0", "#F49FBF"];
  return (
    <div className="w-full max-w-[420px] text-center">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>{playing ? "Watch" : "Repeat"} · Length {seq.length}</div>
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => (
          <button key={i} onClick={()=>tap(i)}
            className="aspect-square rounded-2xl transition-all duration-150"
            style={{
              background: active === i ? colors[i] : `${colors[i]}55`,
              transform: active === i ? "scale(0.96)" : "scale(1)",
              border: "1px solid var(--pc-border)",
            }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Odd one out ──────────────────────────────────────────────
function OddOneOut({ bump, setMax }: { bump: (d: number, ok: boolean) => void; setMax: (n: number) => void }) {
  const [round, setRound] = useState(0);
  const [grid, setGrid] = useState<{ odd: number; base: string; alt: string; n: number }>({ odd: 0, base: "#7EA8FF", alt: "#7EA8FF", n: 9 });
  useEffect(() => { setMax(500); }, [setMax]);
  useEffect(() => {
    const size = Math.min(25, 9 + round);
    const hue = 200 + Math.random() * 120;
    const light = 55 + Math.random() * 15;
    const base = `hsl(${hue},60%,${light}%)`;
    const delta = Math.max(4, 20 - round * 1.5);
    const alt = `hsl(${hue},60%,${light - delta}%)`;
    setGrid({ odd: Math.floor(Math.random() * size), base, alt, n: size });
  }, [round]);
  const cols = grid.n <= 9 ? 3 : grid.n <= 16 ? 4 : 5;
  return (
    <div className="w-full max-w-[420px] text-center">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Round {round + 1} · Find the odd tile</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: grid.n }).map((_, i) => (
          <button key={i} onClick={()=>{ if (i === grid.odd) { bump(60, true); } else { bump(-20, false); } setRound(r=>r+1); }}
            className="aspect-square rounded-xl transition-all"
            style={{ background: i === grid.odd ? grid.alt : grid.base, border: "1px solid var(--pc-border)" }}/>
        ))}
      </div>
    </div>
  );
}

// ─── Choice game (decision, logic, emotion) ──────────────────
const CHOICES = [
  { q: "You froze in a lecture. First move?", opts: ["Grab a breath", "Beat yourself up"], right: 0 },
  { q: "Assignment due, brain foggy. Try:", opts: ["Two-minute start", "Doom-scroll first"], right: 0 },
  { q: "A friend vents for 20 min. You:",     opts: ["Reflect back", "Fix immediately"], right: 0 },
  { q: "Anxious before exam. Best:",            opts: ["Box breath 4·4·4·4", "Read one more chapter fast"], right: 0 },
  { q: "Which is a hidden assumption?",         opts: ["'People must approve of me.'", "'I like walking.'"], right: 0 },
  { q: "Face reads: brows up, mouth tight.",   opts: ["Worried", "Angry"], right: 0 },
  { q: "Stuck on a task 25 min. Best:",         opts: ["Break, walk 3 min", "Push through 2 more hours"], right: 0 },
  { q: "Group chat drama. You:",                opts: ["Sleep on it", "Fire back tonight"], right: 0 },
];
function ChoiceGame({ bump, setMax }: { bump: (d: number, ok: boolean) => void; setMax: (n: number) => void }) {
  const [round, setRound] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const q = CHOICES[round % CHOICES.length];
  useEffect(() => { setMax(CHOICES.length * 80); }, [setMax]);
  useEffect(() => { setCountdown(5); const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000); return () => clearInterval(t); }, [round]);
  useEffect(() => { if (countdown === 0) { bump(-20, false); setRound(r=>r+1); } }, [countdown]);
  const pick = (i: number) => { if (i === q.right) bump(80, true); else bump(-20, false); setRound(r=>r+1); };
  return (
    <div className="w-full max-w-[560px] text-center">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Question {round+1} · {countdown}s</div>
      <div className="font-serif text-[24px] sm:text-[30px] leading-[1.2] mb-6" style={{ color: "var(--pc-ink)" }}>{q.q}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.opts.map((o, i) => (
          <button key={i} onClick={()=>pick(i)}
            className="rounded-2xl p-4 text-[14px] transition hover:-translate-y-0.5"
            style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Rapid recall ────────────────────────────────────────────
const NAMES = ["Aarav", "Meera", "Kabir", "Isha", "Reyansh", "Priya", "Diya", "Advait", "Sara", "Rohan"];
function RapidRecall({ bump, setMax }: { bump: (d: number, ok: boolean) => void; setMax: (n: number) => void }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"show" | "guess">("show");
  const [name, setName] = useState<string>(NAMES[0]);
  const [choices, setChoices] = useState<string[]>([]);
  useEffect(() => { setMax(1000); }, [setMax]);
  useEffect(() => {
    const n = NAMES[Math.floor(Math.random()*NAMES.length)];
    setName(n); setPhase("show");
    const others = NAMES.filter(x => x !== n).sort(()=>Math.random()-0.5).slice(0,3);
    setChoices([n, ...others].sort(()=>Math.random()-0.5));
    const t = setTimeout(() => setPhase("guess"), 1500);
    return () => clearTimeout(t);
  }, [round]);
  return (
    <div className="w-full max-w-[520px] text-center">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Round {round+1}/10</div>
      {phase === "show" ? (
        <div className="rounded-3xl p-10" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div className="w-24 h-24 rounded-full mx-auto mb-4" style={{ background: `hsl(${(name.charCodeAt(0)*7)%360},55%,72%)` }}/>
          <div className="font-serif text-[30px]" style={{ color: "var(--pc-ink)" }}>{name}</div>
        </div>
      ) : (
        <>
          <div className="rounded-3xl p-6 mb-4" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="w-24 h-24 rounded-full mx-auto" style={{ background: `hsl(${(name.charCodeAt(0)*7)%360},55%,72%)` }}/>
            <div className="text-[13px] mt-3" style={{ color: "var(--pc-muted)" }}>Who was this?</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {choices.map(c => (
              <button key={c} onClick={()=>{ if (c === name) bump(100, true); else bump(-25, false); setRound(r=>r+1); }}
                className="rounded-xl p-3 text-[14px] transition hover:-translate-y-0.5"
                style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Breathing / mindful / focus ─────────────────────────────
function BreathingGame({ bump, setMax }: { bump: (d: number, ok: boolean) => void; setMax: (n: number) => void }) {
  const PHASES = [
    { name: "Inhale",  d: 4000 },
    { name: "Hold",    d: 4000 },
    { name: "Exhale",  d: 4000 },
    { name: "Hold",    d: 4000 },
  ];
  const [idx, setIdx] = useState(0);
  const [round, setRound] = useState(0);
  useEffect(() => { setMax(600); }, [setMax]);
  useEffect(() => {
    const t = setTimeout(() => {
      setIdx(i => {
        const next = (i + 1) % PHASES.length;
        if (next === 0) { setRound(r => r + 1); bump(60, true); }
        return next;
      });
    }, PHASES[idx].d);
    return () => clearTimeout(t);
  }, [idx]);
  const scale = idx === 0 ? 1.4 : idx === 2 ? 0.8 : 1.1;
  return (
    <div className="w-full max-w-[520px] text-center">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-6" style={{ color: "var(--pc-muted)" }}>Round {round + 1} · {PHASES[idx].name}</div>
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto">
        <div className="absolute inset-0 rounded-full transition-transform duration-[4000ms] ease-in-out"
          style={{ transform: `scale(${scale})`, background: "radial-gradient(circle,var(--pc-primary) 0%,transparent 70%)", opacity: 0.5 }}/>
        <div className="absolute inset-6 rounded-full transition-transform duration-[4000ms] ease-in-out flex items-center justify-center"
          style={{ transform: `scale(${scale})`, background: "linear-gradient(135deg,var(--pc-soft),var(--pc-surface))", border: "1px solid var(--pc-border)" }}>
          <div className="font-serif text-[28px]" style={{ color: "var(--pc-ink)" }}>{PHASES[idx].name}</div>
        </div>
      </div>
      <div className="mt-6 text-[12px]" style={{ color: "var(--pc-muted)" }}>Follow the orb. Let your body catch up.</div>
    </div>
  );
}

// ─── Reflection / journaling / positive thinking ────────────
function ReflectionGame({ bump, setMax, ex }: { bump: (d: number, ok: boolean) => void; setMax: (n: number) => void; ex: Exercise }) {
  const [text, setText] = useState("");
  useEffect(() => { setMax(400); }, [setMax]);
  const submit = () => {
    if (text.trim().length < 8) return;
    const pts = Math.min(200, 60 + text.trim().length);
    bump(pts, true); setText("");
  };
  return (
    <div className="w-full max-w-[620px]">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2 text-center" style={{ color: "var(--pc-muted)" }}>Write · min 8 characters</div>
      <div className="font-serif text-[22px] sm:text-[28px] leading-[1.25] mb-4 text-center" style={{ color: "var(--pc-ink)" }}>{ex.instructions[0]}</div>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} placeholder="Type freely…"
        className="w-full rounded-2xl p-4 text-[14px] outline-none resize-none"
        style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}/>
      <div className="text-center mt-3">
        <button onClick={submit} className="rounded-full px-5 py-2.5 text-[13px] font-medium"
          style={{ background: "var(--pc-primary)", color: "white" }}>Log rep</button>
      </div>
    </div>
  );
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
