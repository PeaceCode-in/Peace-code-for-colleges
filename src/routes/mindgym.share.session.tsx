// Mind Gym — Share Card (session).
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Download } from "lucide-react";
import { useMindGym, EXERCISES } from "@/lib/mindgym-store";

const search = z.object({ sid: z.string().optional() });

export const Route = createFileRoute("/mindgym/share/session")({
  validateSearch: (s) => search.parse(s),
  component: ShareSession,
});

function ShareSession() {
  const { sid } = Route.useSearch();
  const s = useMindGym();
  const session = s.sessions.find(x => x.id === sid) ?? s.sessions[0];
  const ex = session ? EXERCISES.find(e => e.id === session.exerciseId) : null;
  if (!session || !ex) return (
    <main className="max-w-[720px] mx-auto px-6 py-20 text-center">
      <h1 className="font-serif text-[28px]">Nothing to share yet.</h1>
      <Link to="/mindgym" className="text-[13px] mt-3 inline-block" style={{ color: "var(--pc-primary)" }}>← Back</Link>
    </main>
  );

  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
      <div className="text-[10px] tracking-[0.32em] uppercase" style={{ color: "var(--pc-primary)" }}>Shareable</div>
      <h1 className="font-serif text-[36px] sm:text-[44px] leading-none mt-1" style={{ color: "var(--pc-ink)", letterSpacing: "-0.02em" }}>Your rep, on paper.</h1>

      <div className="mt-6 aspect-[4/5] rounded-[28px] p-8 sm:p-10 relative overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(135deg,var(--pc-soft) 0%,var(--pc-surface) 100%)", border: "1px solid var(--pc-border)" }}>
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle,var(--pc-aurora-a),transparent 70%)" }}/>
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle,var(--pc-aurora-b),transparent 70%)" }}/>
        </div>
        <div className="relative flex-1 flex flex-col justify-between">
          <div>
            <div className="text-[10px] tracking-[0.32em] uppercase" style={{ color: "var(--pc-primary)" }}>PeaceCode · Mind Gym</div>
            <div className="mt-1 font-serif text-[16px]" style={{ color: "var(--pc-muted)" }}>{ex.name}</div>
          </div>
          <div>
            <div className="font-serif text-[92px] sm:text-[128px] leading-none" style={{ color: "var(--pc-ink)", letterSpacing: "-0.03em" }}>
              {session.score}
              <span className="text-[36px] opacity-50">/100</span>
            </div>
            <div className="mt-2 text-[13px]" style={{ color: "var(--pc-muted)" }}>
              +{session.xp} XP · {session.accuracy}% accuracy · {session.streak}× streak
            </div>
          </div>
          <div className="text-[11px]" style={{ color: "var(--pc-muted)" }}>peacecode.app</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px]"
          style={{ background: "var(--pc-primary)", color: "white" }}>
          <Download className="w-4 h-4"/> Save / print card
        </button>
        <Link to="/mindgym" className="rounded-full px-4 py-2.5 text-[13px]"
          style={{ border: "1px solid var(--pc-border)", color: "var(--pc-ink)" }}>Back to Mind Gym</Link>
      </div>
    </main>
  );
}
