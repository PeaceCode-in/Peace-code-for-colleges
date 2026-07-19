import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { loadProfile } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, soft, Panel, SectionLabel, StatTile, Toasts, pushToast } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/stats")({
  head: () => ({ meta: [{ title: "Statistics · PeaceCode" }] }),
  component: StatsPage,
});

function StatsPage() {
  const p = loadProfile();
  const s = p.stats;

  const exportReport = () => {
    const blob = new Blob([JSON.stringify({ user: p.username, generatedAt: new Date().toISOString(), stats: s, streaks: p.streaks, peaceScore: p.peaceScore }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "peacecode-report.json"; a.click();
    pushToast("Wellness report downloaded");
  };

  const max = Math.max(...s.moodTrend, 100);
  const points = s.moodTrend.map((v, i) => `${(i / (s.moodTrend.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ");

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-5xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Statistics</h1>
        <button onClick={exportReport} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11.5px]" style={{ background: ink, color: "var(--pc-bg)" }}>
          <Download className="w-3.5 h-3.5"/> Export report
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatTile label="Peace Score" value={p.peaceScore} hint="rolling"/>
        <StatTile label="Breathing" value={s.breathingSessions} hint="sessions"/>
        <StatTile label="Avg sleep" value={`${s.avgSleep}h`} hint="last 30d"/>
        <StatTile label="Mind Gym XP" value={s.xp} hint={`level ${p.garden.level}`}/>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Panel>
          <SectionLabel>Peace score · this month</SectionLabel>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32">
            <polyline points={points} fill="none" stroke={primary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points={points + " 100,100 0,100"} fill={soft} opacity="0.6"/>
          </svg>
          <div className="text-[11.5px] mt-1" style={{ color: muted }}>Highest {Math.max(...s.moodTrend)} · lowest {Math.min(...s.moodTrend)}</div>
        </Panel>

        <Panel>
          <SectionLabel>Journal heatmap · last 9 weeks</SectionLabel>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px] auto-cols-fr">
            {s.journalHeatmap.map((v, i) => (
              <div key={i} className="w-full aspect-square rounded-[3px]"
                   style={{ background: v === 0 ? surface2 : v === 1 ? "#DDE9F5" : v === 2 ? "#9AC0E5" : primary }}/>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[10px]" style={{ color: muted }}>
            <span>less</span>
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: surface2 }}/>
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "#DDE9F5" }}/>
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "#9AC0E5" }}/>
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: primary }}/>
            <span>more</span>
          </div>
        </Panel>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <StatTile label="Resources" value={s.resources} hint="consumed"/>
        <StatTile label="Contributions" value={s.contributions} hint="helpful replies"/>
        <StatTile label="Counselling" value={s.counselling} hint="sessions"/>
      </div>

      <Toasts/>
    </div>
  );
}
