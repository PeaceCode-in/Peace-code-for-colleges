import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Trophy, Flame, Crown, Compass, Handshake, Heart, Leaf, Bookmark, Check, Mic, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, PageTitle, Card, Chip, StatPill, GhostBtn } from "@/components/events/primitives";
import { achievements as loadAch, loadRsvps, bookmarks } from "@/lib/events-store";

const { border, muted, ink, soft, primary, surface2 } = palette;

const ICONS: Record<string, React.ElementType> = {
  sparkle: Sparkles, flame: Flame, crown: Crown, compass: Compass, handshake: Handshake,
  heart: Heart, leaf: Leaf, bookmark: Bookmark, check: Check, mic: Mic,
};

function Achievements() {
  const [ach, setAch] = useState(loadAch());
  useEffect(() => {
    const on = () => setAch(loadAch());
    window.addEventListener("peacecode-events-changed", on);
    return () => window.removeEventListener("peacecode-events-changed", on);
  }, []);

  const unlocked = ach.filter((a) => a.unlocked).length;
  const pct = Math.round((unlocked / ach.length) * 100);

  return (
    <Page>
      <PageTitle
        eyebrow="Achievements"
        title="Small badges for showing up."
        sub="Every RSVP, feedback, and attendance quietly counts."
        right={<Link to="/events"><GhostBtn>Back to events</GhostBtn></Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatPill icon={<Trophy className="w-3.5 h-3.5"/>}     label="Unlocked"   value={`${unlocked}/${ach.length}`} />
        <StatPill icon={<Sparkles className="w-3.5 h-3.5"/>}   label="Progress"   value={`${pct}%`} />
        <StatPill icon={<Check className="w-3.5 h-3.5"/>}      label="RSVPs"      value={Object.keys(loadRsvps()).length} />
        <StatPill icon={<Bookmark className="w-3.5 h-3.5"/>}   label="Bookmarks"  value={bookmarks().length} />
      </div>

      <Card>
        <div className="h-2 rounded-full overflow-hidden mb-6" style={{ background: border }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: primary }}/>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ach.map((a) => {
            const Icon = ICONS[a.icon] ?? Sparkles;
            return (
              <div key={a.key} className="rounded-[22px] p-5"
                style={{
                  background: a.unlocked ? soft : surface2,
                  border: `1px solid ${a.unlocked ? primary : border}`,
                  opacity: a.unlocked ? 1 : 0.75,
                }}>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                       style={{ background: "var(--pc-surface)", color: a.unlocked ? primary : muted, border: `1px solid ${border}` }}>
                    <Icon className="w-5 h-5" strokeWidth={1.6}/>
                  </div>
                  {a.unlocked ? <Chip tone="warm">Unlocked</Chip> : <Chip tone="outline">Locked</Chip>}
                </div>
                <div className="font-serif text-[16.5px] mt-3" style={{ color: ink }}>{a.title}</div>
                <div className="text-[12px] mt-1" style={{ color: muted }}>{a.sub}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="mt-6 flex justify-center">
        <Link to="/events/browse"><GhostBtn>Find your next event →</GhostBtn></Link>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/achievements")({ component: Achievements });
