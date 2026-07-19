// Mind Gym — Streak calendar.
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { useMindGym } from "@/lib/mindgym-store";

export const Route = createFileRoute("/mindgym/streak")({ component: StreakPage });

function StreakPage() {
  const s = useMindGym();
  const today = new Date();
  const days: { d: Date; on: boolean; xp: number }[] = [];
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const sess = s.sessions.filter(x => new Date(x.at).toISOString().slice(0,10) === key);
    days.push({ d, on: sess.length > 0, xp: sess.reduce((a,b)=>a+b.xp,0) });
  }
  return (
    <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      <div className="text-[10px] tracking-[0.32em] uppercase" style={{ color: "var(--pc-primary)" }}>Consistency</div>
      <h1 className="font-serif text-[36px] sm:text-[48px] leading-none mt-1" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>
        {s.streak.current}-day streak
      </h1>
      <div className="text-[13px] mt-2" style={{ color: "var(--pc-muted)" }}>Best: {s.streak.longest} days</div>

      <section className="mt-8 rounded-3xl p-6" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => (
            <div key={i} title={`${d.d.toDateString()} · ${d.xp} XP`}
              className="aspect-square rounded-lg flex items-center justify-center text-[10px]"
              style={{
                background: d.on ? "linear-gradient(135deg,var(--pc-primary),var(--pc-accent))" : "var(--pc-surface2)",
                color: d.on ? "white" : "var(--pc-muted)",
                border: "1px solid var(--pc-border)",
              }}>
              {d.d.getDate()}
            </div>
          ))}
        </div>
        <div className="mt-4 text-[11px] flex items-center gap-2" style={{ color: "var(--pc-muted)" }}>
          <Flame className="w-3.5 h-3.5" style={{ color: "var(--pc-primary)" }}/> Every session counts as a check-in.
        </div>
      </section>

      <div className="mt-6">
        <Link to="/mindgym" className="text-[13px]" style={{ color: "var(--pc-primary)" }}>← Back to Mind Gym</Link>
      </div>
    </main>
  );
}
