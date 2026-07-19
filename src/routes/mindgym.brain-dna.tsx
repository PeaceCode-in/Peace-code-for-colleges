// Mind Gym — Brain DNA (poetic breakdown of skill mix).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useMindGym, brainOverall } from "@/lib/mindgym-store";
import { useServerFn } from "@tanstack/react-start";
import { coachDna } from "@/lib/mindgym-ai.functions";

export const Route = createFileRoute("/mindgym/brain-dna")({ component: DnaPage });

function DnaPage() {
  const s = useMindGym();
  const overall = brainOverall(s.brain);
  const entries = Object.entries(s.brain);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const call = useServerFn(coachDna);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    call({ data: { brain: s.brain, level: s.title, streak: s.streak.current } })
      .then(r => { if (!cancelled) setText(r.text); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      <div className="text-[10px] tracking-[0.32em] uppercase" style={{ color: "var(--pc-primary)" }}>Brain DNA</div>
      <h1 className="font-serif text-[36px] sm:text-[52px] leading-[1.02] mt-1" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
        The shape of your mind, today.
      </h1>
      <div className="text-[13px] mt-2" style={{ color: "var(--pc-muted)" }}>Overall fitness · {overall}/100</div>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl p-6" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
          <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>Skill mix</div>
          <div className="space-y-3">
            {entries.map(([k, v]) => (
              <div key={k}>
                <div className="flex items-center justify-between text-[12px] mb-1" style={{ color: "var(--pc-ink)" }}>
                  <span className="capitalize">{k}</span>
                  <span style={{ color: "var(--pc-muted)" }}>{v}/100</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--pc-surface2)" }}>
                  <div className="h-full transition-all" style={{ width: `${v}%`, background: "linear-gradient(90deg,var(--pc-primary),var(--pc-accent))" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "linear-gradient(135deg,var(--pc-soft),var(--pc-surface))", border: "1px solid var(--pc-border)" }}>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase" style={{ color: "var(--pc-primary)" }}>
            <Sparkles className="w-3.5 h-3.5"/> Peace, your coach
          </div>
          <p className="mt-4 font-serif text-[18px] leading-[1.5] whitespace-pre-line" style={{ color: "var(--pc-ink)" }}>
            {loading && !text ? <span className="opacity-60 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> reading your DNA…</span> : text || "Your mind is a garden: attention is the soil, calm is the water, memory is the seed. Tend one this week."}
          </p>
        </div>
      </section>

      <div className="mt-8">
        <Link to="/mindgym" className="text-[13px]" style={{ color: "var(--pc-primary)" }}>← Back to Mind Gym</Link>
      </div>
    </main>
  );
}
