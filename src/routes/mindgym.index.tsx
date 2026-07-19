// Mind Gym — home dashboard.
// Composition: greeting, brain score ring, today's training, streak card,
// continue-training, recommended exercise, weekly progress, featured challenge.
// Everything else opens as its own route.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import {
  Flame, Sparkles, Trophy, Compass, ChevronRight, Dumbbell, Wind,
  TrendingUp, Brain, Zap, Star, Target, ArrowRight,
} from "lucide-react";
import {
  useMindGym, ensureBootstrapped, EXERCISES, PATHS, CHALLENGES,
  weeklyStats, brainOverall, recommendNext, xpForLevel,
} from "@/lib/mindgym-store";

export const Route = createFileRoute("/mindgym/")({
  component: MindGymHome,
});

function MindGymHome() {
  const s = useMindGym();
  useEffect(() => { ensureBootstrapped(); }, []);
  const overall = brainOverall(s.brain);
  const week = useMemo(() => weeklyStats(), [s.sessions.length]);
  const next = useMemo(() => recommendNext(), [s.sessions.length]);
  const last = s.sessions[0];
  const continueEx = last ? EXERCISES.find(e => e.id === last.exerciseId) : null;
  const featured = CHALLENGES[0];
  const nextLevelXp = xpForLevel(s.level + 1);
  const curLevelXp = xpForLevel(s.level);
  const levelProgress = Math.max(0, Math.min(1, (s.xp - curLevelXp) / (nextLevelXp - curLevelXp)));

  const hour = new Date().getHours();
  const greet = hour < 5 ? "still up" : hour < 12 ? "good morning" : hour < 17 ? "good afternoon" : "good evening";

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      {/* Hero */}
      <section className="mb-10">
        <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Mind Gym</div>
        <h1 className="font-serif text-[34px] sm:text-[48px] leading-[1.05]" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
          {greet}, this is your gym for the mind.
        </h1>
        <p className="mt-2 text-[14px] max-w-[560px]" style={{ color: "var(--pc-muted)" }}>
          Short reps. Real skills. Focus, calm, memory, confidence — trained the way you'd train a muscle.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link to="/mindgym/paths" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition hover:opacity-90"
            style={{ background: "var(--pc-primary)", color: "white" }}>
            <Compass className="w-4 h-4"/> Choose a training path
          </Link>
          <Link to="/mindgym/library" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] transition hover:bg-[var(--pc-surface2)]"
            style={{ border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
            <Dumbbell className="w-4 h-4"/> Exercise library
          </Link>
          <Link to="/mindgym/challenges" className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] transition hover:bg-[var(--pc-surface2)]"
            style={{ border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
            <Trophy className="w-4 h-4"/> Challenges
          </Link>
        </div>
      </section>

      {/* Row: Brain Score + Streak + Level + Today */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Brain score ring */}
        <Link to="/mindgym/brain-dna" className="rounded-3xl p-5 relative overflow-hidden group transition hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg,var(--pc-soft) 0%,var(--pc-surface) 100%)", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>Brain Fitness</div>
              <div className="font-serif text-[28px] mt-1" style={{ color: "var(--pc-ink)" }}>{overall}<span className="text-[16px] opacity-60">/100</span></div>
            </div>
            <Brain className="w-5 h-5 opacity-60"/>
          </div>
          <BrainRing value={overall}/>
          <div className="mt-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>Tap for Brain DNA →</div>
        </Link>

        {/* Streak */}
        <Link to="/mindgym/streak" className="rounded-3xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5"
          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>
            <Flame className="w-3.5 h-3.5"/> Streak
          </div>
          <div className="font-serif text-[44px] leading-none" style={{ color: "var(--pc-ink)" }}>{s.streak.current}</div>
          <div className="text-[12px]" style={{ color: "var(--pc-muted)" }}>days · longest {s.streak.longest}</div>
        </Link>

        {/* Level / XP */}
        <Link to="/mindgym/profile" className="rounded-3xl p-5 flex flex-col justify-between transition hover:-translate-y-0.5"
          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>
            <Star className="w-3.5 h-3.5"/> Level {s.level}
          </div>
          <div className="font-serif text-[24px]" style={{ color: "var(--pc-ink)" }}>{s.title}</div>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(levelProgress*100)}%`, background: "var(--pc-primary)" }}/>
          </div>
          <div className="text-[10px] mt-1" style={{ color: "var(--pc-muted)" }}>{s.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</div>
        </Link>

        {/* Today's training */}
        <div className="rounded-3xl p-5 flex flex-col justify-between"
          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-center gap-2 text-[9px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>
            <Target className="w-3.5 h-3.5"/> Today
          </div>
          <div>
            <div className="font-serif text-[16px]" style={{ color: "var(--pc-ink)" }}>{s.dailyMissions.filter(m=>m.done>=m.goal).length}/{s.dailyMissions.length} missions</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.dailyMissions.slice(0,5).map(m => (
                <span key={m.id} className="w-6 h-1.5 rounded-full" style={{ background: m.done>=m.goal ? "var(--pc-primary)" : "var(--pc-surface2)" }}/>
              ))}
            </div>
          </div>
          <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>Tap a mission below ↓</div>
        </div>
      </section>

      {/* Continue training */}
      {continueEx && (
        <section className="mb-8">
          <Link to="/mindgym/exercise/$id" params={{ id: continueEx.id }}
            className="block rounded-3xl p-6 relative overflow-hidden transition hover:-translate-y-0.5"
            style={{ background: "linear-gradient(120deg,var(--pc-surface) 0%,var(--pc-soft) 100%)", border: "1px solid var(--pc-border)" }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="min-w-0">
                <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color: "var(--pc-primary)" }}>Continue training</div>
                <h3 className="font-serif text-[24px]" style={{ color: "var(--pc-ink)" }}>{continueEx.name}</h3>
                <div className="text-[12px] mt-1" style={{ color: "var(--pc-muted)" }}>{continueEx.minutes} min · {continueEx.difficulty} · last score {last?.score}</div>
              </div>
              <ArrowRight className="w-5 h-5"/>
            </div>
          </Link>
        </section>
      )}

      {/* Recommended + Weekly + Featured */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
        {/* Recommended */}
        <Link to="/mindgym/exercise/$id" params={{ id: next.id }}
          className="rounded-3xl p-6 flex flex-col justify-between min-h-[220px] transition hover:-translate-y-0.5 relative overflow-hidden group"
          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-primary)" }}>
              <Sparkles className="w-3.5 h-3.5"/> Recommended for you
            </div>
            <h3 className="font-serif text-[22px] mt-2" style={{ color: "var(--pc-ink)" }}>{next.name}</h3>
            <p className="text-[12px] mt-1" style={{ color: "var(--pc-muted)" }}>{next.purpose}</p>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{next.minutes} min · {next.difficulty}</div>
            <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: "var(--pc-primary)" }}>
              Start <ChevronRight className="w-3.5 h-3.5"/>
            </span>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-40 blur-2xl"
            style={{ background: "radial-gradient(circle,var(--pc-primary),transparent 70%)" }}/>
        </Link>

        {/* Weekly progress */}
        <Link to="/mindgym/replay" className="rounded-3xl p-6 min-h-[220px] transition hover:-translate-y-0.5"
          style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>
            <TrendingUp className="w-3.5 h-3.5"/> This week
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Reps"    value={String(week.count)}/>
            <Stat label="Minutes" value={String(week.minutes)}/>
            <Stat label="XP"      value={week.xp.toLocaleString()}/>
          </div>
          <div className="text-[12px]" style={{ color: "var(--pc-muted)" }}>Top skill: <span style={{ color: "var(--pc-ink)" }}>{week.top}</span></div>
          <div className="mt-3 text-[11px] flex items-center gap-1" style={{ color: "var(--pc-primary)" }}>
            Open weekly replay <ChevronRight className="w-3 h-3"/>
          </div>
        </Link>

        {/* Featured challenge */}
        <Link to="/mindgym/challenges" className="rounded-3xl p-6 min-h-[220px] relative overflow-hidden transition hover:-translate-y-0.5"
          style={{ background: `linear-gradient(135deg,${featured.color}33 0%,var(--pc-surface) 60%)`, border: "1px solid var(--pc-border)" }}>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-muted)" }}>
            <Trophy className="w-3.5 h-3.5"/> Featured challenge
          </div>
          <div className="text-[40px] mt-3">{featured.emoji}</div>
          <h3 className="font-serif text-[22px] mt-1" style={{ color: "var(--pc-ink)" }}>{featured.name}</h3>
          <p className="text-[12px] mt-1" style={{ color: "var(--pc-muted)" }}>{featured.description}</p>
          <div className="mt-3 text-[11px] flex items-center gap-1" style={{ color: "var(--pc-primary)" }}>
            Join challenge <ChevronRight className="w-3 h-3"/>
          </div>
        </Link>
      </section>

      {/* Daily missions */}
      <section className="mb-10">
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-serif text-[22px] sm:text-[26px]" style={{ color: "var(--pc-ink)" }}>Today's missions</h2>
          <Link to="/mindgym/library" className="text-[11px] tracking-[0.18em] uppercase hover:opacity-70" style={{ color: "var(--pc-muted)" }}>
            Library →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {s.dailyMissions.map(m => {
            const done = m.done >= m.goal;
            return (
              <Link key={m.id} to="/mindgym/library" search={{ mission: m.type } as any}
                className="rounded-2xl p-4 transition hover:-translate-y-0.5"
                style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", opacity: done ? 0.6 : 1 }}>
                <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase" style={{ color: done ? "var(--pc-primary)" : "var(--pc-muted)" }}>
                  {done ? "Complete" : "In progress"}
                </div>
                <div className="font-serif text-[15px] mt-1 leading-tight" style={{ color: "var(--pc-ink)" }}>{m.label}</div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(m.done/m.goal*100)}%`, background: "var(--pc-primary)" }}/>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Training paths preview */}
      <section className="mb-14">
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-serif text-[22px] sm:text-[26px]" style={{ color: "var(--pc-ink)" }}>Training paths</h2>
          <Link to="/mindgym/paths" className="text-[11px] tracking-[0.18em] uppercase hover:opacity-70" style={{ color: "var(--pc-muted)" }}>
            See all 16 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PATHS.slice(0, 6).map(p => (
            <Link key={p.slug} to="/mindgym/path/$slug" params={{ slug: p.slug }}
              className="rounded-2xl p-4 transition hover:-translate-y-0.5"
              style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2"
                style={{ background: p.color + "33" }}>{p.emoji}</div>
              <div className="font-serif text-[14px]" style={{ color: "var(--pc-ink)" }}>{p.name}</div>
              <div className="text-[10px]" style={{ color: "var(--pc-muted)" }}>{p.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore rail */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
        <ExploreTile to="/mindgym/achievements" icon={Trophy} label="Achievements"/>
        <ExploreTile to="/mindgym/streak" icon={Flame} label="Streak"/>
        <ExploreTile to="/mindgym/leaderboard" icon={TrendingUp} label="Leaderboard"/>
        <ExploreTile to="/mindgym/passport" icon={Compass} label="Passport"/>
        <ExploreTile to="/mindgym/coach" icon={Zap} label="AI Coach"/>
        <ExploreTile to="/mindgym/settings" icon={Wind} label="Settings"/>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--pc-surface2)" }}>
      <div className="font-serif text-[22px]" style={{ color: "var(--pc-ink)" }}>{value}</div>
      <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "var(--pc-muted)" }}>{label}</div>
    </div>
  );
}

function ExploreTile({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="rounded-2xl p-4 flex flex-col items-start gap-2 transition hover:-translate-y-0.5"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
      <Icon className="w-4 h-4 opacity-70"/>
      <div className="font-serif text-[13px]" style={{ color: "var(--pc-ink)" }}>{label}</div>
    </Link>
  );
}

function BrainRing({ value }: { value: number }) {
  const r = 34, c = 2 * Math.PI * r;
  const dash = c * (value / 100);
  return (
    <svg viewBox="0 0 90 90" className="w-20 h-20">
      <circle cx="45" cy="45" r={r} stroke="var(--pc-border)" strokeWidth="6" fill="none"/>
      <circle cx="45" cy="45" r={r} stroke="var(--pc-primary)" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`} transform="rotate(-90 45 45)"/>
    </svg>
  );
}
