// Mind Gym — Path detail page (levels + exercise list).
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Play, Clock, Zap } from "lucide-react";
import { PATHS, EXERCISES, useMindGym, type Difficulty } from "@/lib/mindgym-store";

export const Route = createFileRoute("/mindgym/path/$slug")({
  component: PathDetail,
});

const LEVELS: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "Master"];

function PathDetail() {
  const { slug } = Route.useParams();
  const s = useMindGym();
  const path = PATHS.find(p => p.slug === slug);
  if (!path) return <NotFound/>;
  const exs = EXERCISES.filter(e => e.path === slug);

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      <Link to="/mindgym/paths" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase mb-4 hover:opacity-70" style={{ color: "var(--pc-muted)" }}>
        <ArrowLeft className="w-3 h-3"/> All paths
      </Link>

      {/* Hero */}
      <section className="rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${path.color}44 0%,var(--pc-surface) 60%)`, border: "1px solid var(--pc-border)" }}>
        <div className="text-[40px] mb-2">{path.emoji}</div>
        <div className="text-[10px] tracking-[0.32em] uppercase mb-1" style={{ color: "var(--pc-muted)" }}>Training path</div>
        <h1 className="font-serif text-[34px] sm:text-[46px] leading-[1.05]" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
          {path.name}
        </h1>
        <p className="mt-2 text-[15px] max-w-[520px]" style={{ color: "var(--pc-muted)" }}>{path.blurb}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "var(--pc-muted)" }}>
          <span>{exs.length} exercises</span>
          <span>·</span>
          <span>4 levels</span>
          <span>·</span>
          <span>Skill trained: {path.skill}</span>
        </div>
      </section>

      {/* Levels */}
      {LEVELS.map(level => {
        const items = exs.filter(e => e.difficulty === level);
        if (!items.length) return null;
        return (
          <section key={level} className="mb-10">
            <div className="flex items-end justify-between mb-3">
              <h2 className="font-serif text-[22px]" style={{ color: "var(--pc-ink)" }}>{level}</h2>
              <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>{items.length} reps</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(e => {
                const doneCount = s.sessions.filter(x => x.exerciseId === e.id).length;
                return (
                  <Link key={e.id} to="/mindgym/exercise/$id" params={{ id: e.id }}
                    className="group rounded-2xl p-5 transition hover:-translate-y-0.5"
                    style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
                    <div className="flex items-center gap-2 text-[10px] tracking-[0.25em] uppercase" style={{ color: "var(--pc-primary)" }}>
                      {e.type}
                    </div>
                    <div className="font-serif text-[17px] mt-1" style={{ color: "var(--pc-ink)" }}>{e.name}</div>
                    <p className="text-[12px] mt-1 line-clamp-2" style={{ color: "var(--pc-muted)" }}>{e.purpose}</p>
                    <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: "var(--pc-muted)" }}>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3"/>{e.minutes} min</span>
                      <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3"/>+{e.xp} XP</span>
                      <span>{doneCount ? `${doneCount}×` : "New"}</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: "var(--pc-primary)" }}>
                      <Play className="w-3 h-3"/> Start rep
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}

function NotFound() {
  return (
    <main className="max-w-[720px] mx-auto px-6 py-20 text-center">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Not found</div>
      <h1 className="font-serif text-[28px]" style={{ color: "var(--pc-ink)" }}>This path is not on the map yet.</h1>
      <Link to="/mindgym/paths" className="inline-block mt-6 text-[13px]" style={{ color: "var(--pc-primary)" }}>← Back to paths</Link>
    </main>
  );
}
