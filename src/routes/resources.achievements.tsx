import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ACHIEVEMENTS, useResourceStore, computeStreak, RESOURCES } from "@/lib/resources-store";
import { Trophy, Flame, Clock, CheckCircle2, Target } from "lucide-react";

export const Route = createFileRoute("/resources/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Resources" }] }),
  component: () => {
    const snap = useResourceStore();
    const streak = computeStreak(snap.learnMinutes);
    const totalMin = Object.values(snap.learnMinutes).reduce((a, b) => a + b, 0);
    const daysLearned = Object.keys(snap.learnMinutes).filter(k => snap.learnMinutes[k] > 0).length;
    const weekly = 60, monthly = 240;
    const weeklyDone = Object.entries(snap.learnMinutes)
      .filter(([k]) => { const d = new Date(k); return Date.now() - d.getTime() < 7*86400000; })
      .reduce((a, [, v]) => a + v, 0);

    return (
      <AppShell>
        <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.32em] uppercase mb-2" style={{ color: "var(--pc-muted)" }}>Small wins</div>
            <h1 className="font-serif text-[34px] sm:text-[42px]" style={{ color: "var(--pc-ink)" }}>Your learning streak.</h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard icon={Flame} value={streak} label="Day streak"/>
            <StatCard icon={Clock} value={`${totalMin}m`} label="Total learned"/>
            <StatCard icon={CheckCircle2} value={snap.completed.length} label="Completed"/>
            <StatCard icon={Target} value={daysLearned} label="Active days"/>
          </div>

          <div className="rounded-3xl p-6 mb-10" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: "var(--pc-muted)" }}>Goals</div>
            <GoalBar label="Weekly goal" done={weeklyDone} target={weekly}/>
            <GoalBar label="Monthly goal" done={Object.values(snap.learnMinutes).reduce((a,b)=>a+b,0)} target={monthly}/>
          </div>

          <h2 className="font-serif text-[22px] mb-4" style={{ color: "var(--pc-ink)" }}>Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map(a => {
              const unlocked = snap.achievements.includes(a.id);
              return (
                <div key={a.id} className="rounded-2xl p-5 text-center transition"
                  style={{ background: unlocked ? "var(--pc-soft)" : "var(--pc-surface)", border: "1px solid var(--pc-border)", opacity: unlocked ? 1 : 0.55 }}>
                  <div className="text-4xl mb-2" style={{ filter: unlocked ? "none" : "grayscale(1)" }}>{a.emoji}</div>
                  <div className="font-serif text-[15px]" style={{ color: "var(--pc-ink)" }}>{a.name}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--pc-muted)" }}>{a.hint}</div>
                  <div className="text-[9px] tracking-[0.2em] uppercase mt-3" style={{ color: unlocked ? "var(--pc-primary)" : "var(--pc-muted)" }}>
                    {unlocked ? "Unlocked" : "Locked"}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center text-[12px]" style={{ color: "var(--pc-muted)" }}>
            Keep exploring — <Link to="/resources" className="underline">back to library</Link>.
          </div>
        </main>
      </AppShell>
    );
  },
});

function StatCard({ icon: Icon, value, label }: any) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--pc-surface)", border: "1px solid var(--pc-border)" }}>
      <Icon className="w-4 h-4 mb-2" style={{ color: "var(--pc-primary)" }}/>
      <div className="font-serif text-[26px]" style={{ color: "var(--pc-ink)" }}>{value}</div>
      <div className="text-[10px] tracking-[0.22em] uppercase" style={{ color: "var(--pc-muted)" }}>{label}</div>
    </div>
  );
}
function GoalBar({ label, done, target }: { label: string; done: number; target: number }) {
  const pct = Math.min(100, (done / target) * 100);
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-[12px] mb-1.5" style={{ color: "var(--pc-muted)" }}>
        <span>{label}</span><span>{done} / {target} min</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--pc-surface2)" }}>
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: "var(--pc-primary)" }}/>
      </div>
    </div>
  );
}
