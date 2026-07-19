// Mind Gym — Session Results + Victory Moment + Share cards.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Sparkles, ArrowRight, Loader2, Share2, RotateCcw } from "lucide-react";
import { useMindGym, EXERCISES, recommendNext, brainOverall } from "@/lib/mindgym-store";
import { coachPost } from "@/lib/mindgym-ai.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/mindgym/results/$sid")({
  component: Results,
});

function Results() {
  const { sid } = Route.useParams();
  const s = useMindGym();
  const session = s.sessions.find(x => x.id === sid) ?? s.sessions[0];
  const ex = session ? EXERCISES.find(e => e.id === session.exerciseId) : null;
  const next = recommendNext();
  const overall = brainOverall(s.brain);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const callPost = useServerFn(coachPost);

  useEffect(() => {
    if (!session || !ex) return;
    let cancelled = false;
    setLoading(true);
    const weakest = Object.entries(s.brain).sort((a,b)=>a[1]-b[1])[0]?.[0] ?? "focus";
    callPost({ data: { exerciseName: ex.name, score: session.score, accuracy: session.accuracy, seconds: session.seconds, weakestSkill: weakest } })
      .then(r => { if (!cancelled) setFeedback(r.text); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  if (!session || !ex) return (
    <main className="max-w-[720px] mx-auto px-6 py-20 text-center">
      <h1 className="font-serif text-[28px]">No session to show yet.</h1>
      <Link to="/mindgym" className="text-[13px] inline-block mt-4" style={{ color: "var(--pc-primary)" }}>← Back to Mind Gym</Link>
    </main>
  );

  const isVictory = session.score >= 75;

  return (
    <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      {/* Victory hero */}
      <section className="rounded-3xl p-8 sm:p-12 mb-8 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,var(--pc-soft) 0%,var(--pc-surface) 100%)", border: "1px solid var(--pc-border)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle,var(--pc-aurora-a),transparent 70%)" }}/>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle,var(--pc-aurora-b),transparent 70%)" }}/>
        </div>
        <div className="relative">
          <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-primary)" }}>
            {isVictory ? "Victory Moment" : "Rep complete"}
          </div>
          <h1 className="font-serif text-[44px] sm:text-[64px] leading-none" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
            {session.score}
            <span className="text-[24px] sm:text-[32px] opacity-60">/100</span>
          </h1>
          <div className="mt-2 text-[14px]" style={{ color: "var(--pc-muted)" }}>{ex.name}</div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[640px] mx-auto">
            <MiniStat label="XP" value={`+${session.xp}`}/>
            <MiniStat label="Coins" value={`+${session.coins}`}/>
            <MiniStat label="Accuracy" value={`${session.accuracy}%`}/>
            <MiniStat label="Best streak" value={`${session.streak}×`}/>
          </div>
        </div>
      </section>

      {/* Coach feedback */}
      <section className="rounded-3xl p-6 mb-6"
        style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-primary)" }}>
          <Sparkles className="w-3.5 h-3.5"/> Peace, your coach
        </div>
        <div className="mt-3 font-serif text-[18px] leading-[1.4]" style={{ color: "var(--pc-ink)" }}>
          {loading && !feedback ? <span className="opacity-60 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> reading your rep…</span> : feedback || "Steady rep. Pair this with one calm breath cycle to lock it in."}
        </div>
      </section>

      {/* Skill gains */}
      <section className="rounded-3xl p-6 mb-6" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
        <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>Skill gains</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(session.skillGains).map(([k, v]) => (
            <span key={k} className="rounded-full px-3 py-1 text-[11px]" style={{ background: "var(--pc-soft)", color: "var(--pc-primary)" }}>
              {k} +{v}
            </span>
          ))}
        </div>
        <div className="mt-4 text-[11px]" style={{ color: "var(--pc-muted)" }}>Overall brain fitness now <span style={{ color: "var(--pc-ink)" }}>{overall}/100</span></div>
      </section>

      {/* CTA */}
      <section className="flex flex-wrap items-center gap-3 mb-8">
        <Link to="/mindgym/train/$id" params={{ id: ex.id }}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px]"
          style={{ border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
          <RotateCcw className="w-4 h-4"/> Replay
        </Link>
        <Link to="/mindgym/exercise/$id" params={{ id: next.id }}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium"
          style={{ background: "var(--pc-primary)", color: "white" }}>
          Next: {next.name} <ArrowRight className="w-4 h-4"/>
        </Link>
        <Link to="/mindgym/share/session" search={{ sid } as any}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px]"
          style={{ border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
          <Share2 className="w-4 h-4"/> Share card
        </Link>
      </section>

      {/* Cross-app links */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <XLink to="/breathe" label="Add a breath rep"/>
        <XLink to="/journal" label="Reflect on this"/>
        <XLink to="/gratitude" label="Gratitude entry"/>
        <XLink to="/peacebot" label="Talk to Peace Bot"/>
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3 backdrop-blur-sm" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
      <div className="font-serif text-[22px]" style={{ color: "var(--pc-ink)" }}>{value}</div>
      <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "var(--pc-muted)" }}>{label}</div>
    </div>
  );
}
function XLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="rounded-2xl p-4 text-[13px] transition hover:-translate-y-0.5"
      style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>
      {label} →
    </Link>
  );
}
