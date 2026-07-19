// Mind Gym — Exercise Details.
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Clock, Zap, Heart, Sparkles, Loader2 } from "lucide-react";
import { EXERCISES, PATHS, useMindGym, toggleFavourite } from "@/lib/mindgym-store";
import { coachPre } from "@/lib/mindgym-ai.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/mindgym/exercise/$id")({
  component: ExerciseDetail,
  notFoundComponent: NotFound,
});

function ExerciseDetail() {
  const { id } = Route.useParams();
  const s = useMindGym();
  const ex = EXERCISES.find(e => e.id === id);
  const [nudge, setNudge] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const callPre = useServerFn(coachPre);

  useEffect(() => {
    if (!ex) return;
    let cancelled = false;
    setLoading(true);
    const weakest = Object.entries(s.brain).sort((a,b)=>a[1]-b[1])[0]?.[0] ?? "focus";
    callPre({ data: { exerciseName: ex.name, path: ex.path, weakestSkill: weakest, streak: s.streak.current } })
      .then(r => { if (!cancelled) setNudge(r.text); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!ex) return <NotFound/>;
  const p = PATHS.find(x => x.slug === ex.path)!;
  const fav = s.favouriteExercises.includes(ex.id);
  const doneCount = s.sessions.filter(x => x.exerciseId === ex.id).length;

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      <Link to="/mindgym/library" className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase mb-4 hover:opacity-70" style={{ color: "var(--pc-muted)" }}>
        <ArrowLeft className="w-3 h-3"/> Library
      </Link>

      {/* Hero */}
      <section className="rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg,${p.color}44 0%,var(--pc-surface) 60%)`, border: "1px solid var(--pc-border)" }}>
        <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>{p.emoji} {p.name} · {ex.difficulty}</div>
        <h1 className="font-serif text-[34px] sm:text-[46px] leading-[1.05] max-w-[640px]" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
          {ex.name}
        </h1>
        <p className="mt-2 text-[15px] max-w-[560px]" style={{ color: "var(--pc-muted)" }}>{ex.purpose}</p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link to="/mindgym/train/$id" params={{ id: ex.id }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium transition hover:opacity-90"
            style={{ background: "var(--pc-primary)", color: "white" }}>
            <Play className="w-4 h-4"/> Start rep
          </Link>
          <button onClick={()=>toggleFavourite(ex.id)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] transition hover:bg-[var(--pc-surface2)]"
            style={{ border: "1px solid var(--pc-border)", color: fav ? "#e11d48" : "var(--pc-ink)" }}>
            <Heart className="w-4 h-4" fill={fav ? "#e11d48" : "none"}/> {fav ? "Favourited" : "Favourite"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coach nudge */}
        <div className="lg:col-span-2 rounded-3xl p-6"
          style={{ background: "linear-gradient(135deg,var(--pc-soft) 0%,var(--pc-surface) 100%)", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-primary)" }}>
            <Sparkles className="w-3.5 h-3.5"/> Peace, your coach
          </div>
          <div className="mt-3 font-serif text-[19px] leading-[1.35]" style={{ color: "var(--pc-ink)" }}>
            {loading && !nudge ? <span className="opacity-60 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> reading your day…</span> : nudge || "Bring your attention here — that's already the first win."}
          </div>
        </div>

        {/* Meta */}
        <div className="rounded-3xl p-5 grid grid-cols-2 gap-3" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <Meta label="Time" value={`${ex.minutes} min`} icon={Clock}/>
          <Meta label="XP" value={`+${ex.xp}`} icon={Zap}/>
          <Meta label="Coins" value={`+${ex.coins}`}/>
          <Meta label="Done" value={`${doneCount}×`}/>
        </div>
      </div>

      {/* Details */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        <div className="rounded-3xl p-6" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <h3 className="font-serif text-[18px] mb-3" style={{ color: "var(--pc-ink)" }}>Benefits</h3>
          <ul className="space-y-2">
            {ex.benefits.map(b => (
              <li key={b} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--pc-muted)" }}>
                <span className="mt-1.5 w-1 h-1 rounded-full" style={{ background: "var(--pc-primary)" }}/>{b}
              </li>
            ))}
          </ul>
          <h3 className="font-serif text-[18px] mt-6 mb-3" style={{ color: "var(--pc-ink)" }}>Skills trained</h3>
          <div className="flex flex-wrap gap-2">
            {ex.skills.map(sk => (
              <span key={sk} className="rounded-full px-3 py-1 text-[11px]" style={{ background: "var(--pc-surface2)", color: "var(--pc-ink)" }}>{sk}</span>
            ))}
          </div>
        </div>
        <div className="rounded-3xl p-6" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <h3 className="font-serif text-[18px] mb-3" style={{ color: "var(--pc-ink)" }}>How the rep goes</h3>
          <ol className="space-y-2">
            {ex.instructions.map((i, idx) => (
              <li key={idx} className="flex items-start gap-3 text-[13px]" style={{ color: "var(--pc-muted)" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0" style={{ background: "var(--pc-soft)", color: "var(--pc-primary)" }}>{idx+1}</span>
                <span>{i}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

function Meta({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--pc-surface2)" }}>
      <div className="text-[9px] tracking-[0.2em] uppercase flex items-center gap-1" style={{ color: "var(--pc-muted)" }}>
        {Icon && <Icon className="w-3 h-3"/>}{label}
      </div>
      <div className="font-serif text-[18px] mt-0.5" style={{ color: "var(--pc-ink)" }}>{value}</div>
    </div>
  );
}

function NotFound() {
  return (
    <main className="max-w-[720px] mx-auto px-6 py-20 text-center">
      <h1 className="font-serif text-[28px]" style={{ color: "var(--pc-ink)" }}>Exercise not found.</h1>
      <Link to="/mindgym/library" className="inline-block mt-6 text-[13px]" style={{ color: "var(--pc-primary)" }}>← Back to library</Link>
    </main>
  );
}
