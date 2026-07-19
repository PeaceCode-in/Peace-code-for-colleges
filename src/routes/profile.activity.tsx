import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, PenLine, Wind, Brain, BookOpen, Users, UserCheck, ClipboardList, Heart } from "lucide-react";
import { loadProfile, formatWhen } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, Panel, SectionLabel } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/activity")({
  head: () => ({ meta: [{ title: "Activity · PeaceCode" }] }),
  component: ActivityPage,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  journal: PenLine, breathing: Wind, mindgym: Brain, resource: BookOpen,
  community: Users, buddy: UserCheck, screening: ClipboardList, gratitude: Heart,
};

function ActivityPage() {
  const p = loadProfile();
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400e3).toDateString();

  const buckets: Record<string, typeof p.activity> = { Today: [], Yesterday: [], "This week": [], Earlier: [] };
  for (const a of p.activity) {
    const d = new Date(a.ts);
    const key = d.toDateString() === today ? "Today"
              : d.toDateString() === yesterday ? "Yesterday"
              : Date.now() - d.getTime() < 7 * 86400e3 ? "This week"
              : "Earlier";
    buckets[key].push(a);
  }

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-3xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Activity</h1>
      <p className="text-[13px] mb-8" style={{ color: muted }}>Only you can see this feed.</p>

      {(["Today", "Yesterday", "This week", "Earlier"] as const).map((label) => (
        buckets[label].length > 0 && (
          <div key={label} className="mb-6">
            <SectionLabel>{label}</SectionLabel>
            <Panel className="!p-0 overflow-hidden">
              {buckets[label].map((a, i) => {
                const Icon = ICONS[a.kind] ?? PenLine;
                const content = (
                  <>
                    <span className="w-9 h-9 rounded-full grid place-items-center shrink-0" style={{ background: surface2, color: primary }}>
                      <Icon className="w-4 h-4"/>
                    </span>
                    <span className="flex-1 min-w-0">
                      <div className="text-[13px] truncate" style={{ color: ink }}>{a.title}</div>
                      {a.meta && <div className="text-[11px]" style={{ color: muted }}>{a.meta}</div>}
                    </span>
                    <span className="text-[10.5px] shrink-0" style={{ color: muted }}>{formatWhen(a.ts)}</span>
                  </>
                );
                const cls = `flex items-center gap-3 px-4 py-3 transition hover:opacity-90 ${i > 0 ? "border-t" : ""}`;
                return a.href ? (
                  <Link key={a.id} to={a.href} className={cls} style={{ borderColor: border }}>{content}</Link>
                ) : (
                  <div key={a.id} className={cls} style={{ borderColor: border }}>{content}</div>
                );
              })}
            </Panel>
          </div>
        )
      ))}
    </div>
  );
}
