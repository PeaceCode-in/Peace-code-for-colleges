import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Share2, Lock } from "lucide-react";
import { loadProfile, type Achievement } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, soft, Panel, Sheet, Toasts, pushToast } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/achievements")({
  head: () => ({ meta: [{ title: "Achievements · PeaceCode" }] }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const p = loadProfile();
  const [open, setOpen] = useState<Achievement | null>(null);
  const [cat, setCat] = useState<string>("All");
  const cats = ["All", ...Array.from(new Set(p.achievements.map((a) => a.category)))];
  const list = cat === "All" ? p.achievements : p.achievements.filter((a) => a.category === cat);
  const earned = list.filter((a) => a.earnedAt);
  const inProgress = list.filter((a) => !a.earnedAt);

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-5xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <div className="flex flex-wrap items-baseline gap-3 mb-6">
        <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Achievement cabinet</h1>
        <span className="text-[12px]" style={{ color: muted }}>{earned.length} earned · {inProgress.length} in progress</span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-6">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className="px-3 py-1.5 rounded-full text-[11.5px] whitespace-nowrap transition"
            style={{ background: cat === c ? ink : surface2, color: cat === c ? "var(--pc-bg)" : ink }}>{c}</button>
        ))}
      </div>

      <h2 className="text-[10px] tracking-[0.32em] uppercase mb-3" style={{ color: muted }}>Earned</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {earned.map((a) => <BadgeCard key={a.id} a={a} onOpen={() => setOpen(a)}/>)}
      </div>

      <h2 className="text-[10px] tracking-[0.32em] uppercase mt-8 mb-3" style={{ color: muted }}>In progress</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {inProgress.map((a) => <BadgeCard key={a.id} a={a} onOpen={() => setOpen(a)} locked/>)}
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && <AchievementDetail a={open}/>}
      </Sheet>

      <Toasts/>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none } .no-scrollbar { scrollbar-width: none }`}</style>
    </div>
  );
}

function BadgeCard({ a, onOpen, locked }: { a: Achievement; onOpen: () => void; locked?: boolean }) {
  const pct = Math.min(100, Math.round((a.progress / a.total) * 100));
  return (
    <button onClick={onOpen}
      className="text-left rounded-3xl p-4 transition hover:-translate-y-0.5"
      style={{ background: surface, border: `1px solid ${border}`, opacity: locked ? 0.72 : 1 }}>
      <div className="w-12 h-12 rounded-2xl grid place-items-center text-[22px] mb-3"
           style={{ background: locked ? surface2 : soft }}>
        {locked ? <Lock className="w-4 h-4" style={{ color: muted }}/> : a.icon}
      </div>
      <div className="font-serif text-[15px] leading-tight" style={{ color: ink }}>{a.title}</div>
      <div className="text-[11px] mt-1" style={{ color: muted }}>{a.category}</div>
      {locked ? (
        <>
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: surface2 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: primary }}/>
          </div>
          <div className="text-[10.5px] mt-1" style={{ color: muted }}>{a.progress} / {a.total}</div>
        </>
      ) : (
        <div className="text-[10.5px] mt-2" style={{ color: primary }}>Earned {new Date(a.earnedAt!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
      )}
    </button>
  );
}

function AchievementDetail({ a }: { a: Achievement }) {
  const share = () => { pushToast("Badge share card copied to clipboard"); navigator.clipboard?.writeText(`I just earned "${a.title}" on PeaceCode 🌱`); };
  const pct = Math.min(100, Math.round((a.progress / a.total) * 100));
  return (
    <div>
      <div className="w-20 h-20 rounded-3xl grid place-items-center text-[36px] mx-auto mb-4" style={{ background: soft }}>{a.icon}</div>
      <div className="text-center">
        <div className="font-serif text-[24px]" style={{ color: ink }}>{a.title}</div>
        <div className="text-[12px] mt-1" style={{ color: muted }}>{a.description}</div>
      </div>
      <div className="mt-6 p-4 rounded-2xl" style={{ background: surface2 }}>
        <div className="flex justify-between text-[11px] mb-2"><span style={{ color: muted }}>Progress</span><span style={{ color: ink }}>{a.progress}/{a.total}</span></div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: surface }}>
          <div style={{ width: `${pct}%`, height: "100%", background: primary }}/>
        </div>
      </div>
      {a.earnedAt && <div className="text-center text-[12px] mt-4" style={{ color: muted }}>Earned {new Date(a.earnedAt).toLocaleDateString()}</div>}
      <button onClick={share} className="w-full mt-6 py-3 rounded-2xl text-[13px] flex items-center justify-center gap-2"
              style={{ background: ink, color: "var(--pc-bg)" }}>
        <Share2 className="w-4 h-4"/> Share this badge
      </button>
    </div>
  );
}
