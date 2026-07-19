import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Flag, Award, Wind, PenLine, UserCheck, CalendarCheck, Brain, Flame } from "lucide-react";
import { loadProfile } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, Panel, SectionLabel } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/journey")({
  head: () => ({ meta: [{ title: "Wellness journey · PeaceCode" }] }),
  component: JourneyPage,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  start: Flag, first: Sparkles, streak: Flame, milestone: Award, gift: Award,
};

function JourneyPage() {
  const p = loadProfile();
  const items = [...p.milestones].sort((a, b) => a.date.localeCompare(b.date));

  const iconFor = (title: string) => {
    if (title.toLowerCase().includes("journal")) return PenLine;
    if (title.toLowerCase().includes("breath")) return Wind;
    if (title.toLowerCase().includes("buddy")) return UserCheck;
    if (title.toLowerCase().includes("counsell")) return CalendarCheck;
    if (title.toLowerCase().includes("mind gym")) return Brain;
    return null;
  };

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-3xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <h1 className="font-serif text-[32px] leading-tight mb-2" style={{ color: ink }}>Your wellness journey</h1>
      <p className="text-[13px] mb-8" style={{ color: muted }}>Every soft step, in order.</p>

      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-px" style={{ background: border }}/>
        <div className="space-y-3">
          {items.map((m, i) => {
            const Kind = ICONS[m.kind] ?? Flag;
            const Extra = iconFor(m.title);
            return (
              <div key={m.id} className="relative pl-12">
                <div className="absolute left-0 top-2 w-9 h-9 rounded-full flex items-center justify-center"
                     style={{ background: i === items.length - 1 ? primary : surface2, color: i === items.length - 1 ? "#fff" : ink, border: `1px solid ${border}` }}>
                  <Kind className="w-3.5 h-3.5"/>
                </div>
                <Panel className="!p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-[0.28em] uppercase mb-1" style={{ color: muted }}>
                        {new Date(m.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div className="font-serif text-[17px]" style={{ color: ink }}>{m.title}</div>
                      <div className="text-[12.5px] mt-1" style={{ color: muted }}>{m.note}</div>
                    </div>
                    {Extra && (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                           style={{ background: surface2 }}>
                        <Extra className="w-4 h-4" style={{ color: primary }}/>
                      </div>
                    )}
                  </div>
                </Panel>
              </div>
            );
          })}
        </div>
      </div>

      <Panel className="mt-8">
        <SectionLabel>Coming up</SectionLabel>
        <div className="text-[13px]" style={{ color: ink }}>Next milestone · <span style={{ color: primary }}>{p.garden.nextMilestone}</span></div>
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: surface2 }}>
          <div style={{ width: `${p.garden.growthPct}%`, height: "100%", background: primary }}/>
        </div>
      </Panel>
    </div>
  );
}
