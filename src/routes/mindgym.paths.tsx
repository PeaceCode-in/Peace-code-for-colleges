// Mind Gym — Training Paths grid.
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PATHS, EXERCISES, useMindGym } from "@/lib/mindgym-store";

export const Route = createFileRoute("/mindgym/paths")({
  component: PathsPage,
});

function PathsPage() {
  const s = useMindGym();
  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      <Link to="/mindgym" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase mb-4 hover:opacity-70" style={{ color: "var(--pc-muted)" }}>
        <ArrowLeft className="w-3 h-3"/> Mind Gym
      </Link>
      <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Training Paths</div>
      <h1 className="font-serif text-[34px] sm:text-[44px] leading-[1.05] max-w-[720px]" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
        Sixteen paths. Pick the one your mind is asking for.
      </h1>
      <p className="mt-2 text-[14px] max-w-[560px]" style={{ color: "var(--pc-muted)" }}>
        Each path holds beginner → master levels. You don't need to finish. Just show up.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {PATHS.map(p => {
          const count = EXERCISES.filter(e => e.path === p.slug).length;
          const done = s.sessions.filter(x => EXERCISES.find(e => e.id === x.exerciseId)?.path === p.slug).length;
          return (
            <Link key={p.slug} to="/mindgym/path/$slug" params={{ slug: p.slug }}
              className="group rounded-3xl p-5 flex flex-col justify-between min-h-[180px] transition hover:-translate-y-0.5 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg,${p.color}22 0%,var(--pc-surface) 55%)`, border: "1px solid var(--pc-border)" }}>
              <div>
                <div className="text-[26px] mb-2">{p.emoji}</div>
                <div className="font-serif text-[18px]" style={{ color: "var(--pc-ink)" }}>{p.name}</div>
                <p className="text-[12px] mt-1" style={{ color: "var(--pc-muted)" }}>{p.blurb}</p>
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: "var(--pc-muted)" }}>
                <span>{count} exercises</span>
                <span>{done} done</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
