import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Droplet, Leaf, Flower2, Bird } from "lucide-react";
import { loadProfile, THEMES } from "@/lib/profile-store";
import { surface, surface2, border, ink, muted, primary, soft, Panel, StatTile } from "@/components/profile/primitives";

export const Route = createFileRoute("/profile/garden")({
  head: () => ({ meta: [{ title: "Mind Garden · PeaceCode" }] }),
  component: GardenPage,
});

function GardenPage() {
  const p = loadProfile();
  const g = p.garden;
  const t = THEMES[p.theme];

  return (
    <div className="px-4 lg:pl-32 lg:pr-10 py-8 pb-32 lg:pb-16 max-w-5xl">
      <Link to="/profile" className="inline-flex items-center gap-2 text-[12px] mb-4" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5"/> Back to profile
      </Link>
      <h1 className="font-serif text-[32px] leading-tight" style={{ color: ink }}>Mind Garden</h1>
      <p className="text-[13px] mb-8" style={{ color: muted }}>Grows softly with every kind minute you spend on yourself.</p>

      <Panel className="!p-0 overflow-hidden mb-4">
        <div className="relative h-[300px] sm:h-[380px]"
             style={{ background: `linear-gradient(180deg, ${t.from}, ${t.to} 70%, #F6EEDF 100%)` }}>
          <TreeSVG level={g.level} leaves={g.leaves} flowers={g.flowers} birds={g.birds}/>
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] backdrop-blur-md flex items-center gap-2"
               style={{ background: "rgba(255,255,255,0.5)", color: t.ink }}>
            <Leaf className="w-3 h-3"/> Season · {g.season}
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: t.ink, opacity: .6 }}>Growth</div>
              <div className="font-serif text-[26px]" style={{ color: t.ink }}>{g.growthPct}%</div>
            </div>
            <div className="text-[11.5px] text-right max-w-[220px]" style={{ color: t.ink }}>
              {g.nextMilestone}
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatTile label="Level" value={g.level} hint="tree stage"/>
        <StatTile label="Leaves" value={g.leaves} hint="each kind day"/>
        <StatTile label="Flowers" value={g.flowers} hint="each milestone"/>
        <StatTile label="Birds" value={g.birds} hint="community wins"/>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Droplet className="w-3.5 h-3.5" style={{ color: primary }}/>
            <div className="text-[11px] tracking-[0.24em] uppercase" style={{ color: muted }}>Water</div>
          </div>
          <div className="text-[12px] mb-2" style={{ color: ink }}>Journal or breathe to water your garden today.</div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: surface2 }}>
            <div style={{ width: `${g.water}%`, height: "100%", background: "linear-gradient(90deg, #7CB4E8, #B7DAF3)" }}/>
          </div>
          <div className="text-[11px] mt-1" style={{ color: muted }}>{g.water}% today</div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Flower2 className="w-3.5 h-3.5" style={{ color: primary }}/>
            <div className="text-[11px] tracking-[0.24em] uppercase" style={{ color: muted }}>Weekly growth</div>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {g.history.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md" style={{ background: soft, height: `${w.growth}%` }}/>
                <div className="text-[9px]" style={{ color: muted }}>{w.week}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <Bird className="w-3.5 h-3.5" style={{ color: primary }}/>
          <div className="text-[11px] tracking-[0.24em] uppercase" style={{ color: muted }}>Plant history</div>
        </div>
        <div className="space-y-2 text-[13px]">
          {[
            "First seed planted · Aug 14, 2025",
            "Sprouted after 4 days · Aug 18",
            "First flower cluster · Sep 12",
            "First bird nested · Oct 03",
            "Second flowering · Nov 22",
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2" style={{ color: ink }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: primary }}/>{s}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function TreeSVG({ level, leaves, flowers, birds }: { level: number; leaves: number; flowers: number; birds: number }) {
  const canopySize = 40 + level * 6;
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
      <ellipse cx="200" cy="280" rx="140" ry="10" fill="rgba(0,0,0,0.06)"/>
      <path d="M198,280 L198,180 Q195,150 200,120" stroke="#6a4a2b" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M198,200 Q160,180 130,170" stroke="#6a4a2b" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M198,190 Q240,175 270,168" stroke="#6a4a2b" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <circle cx="200" cy="115" r={canopySize} fill="#8FBF8B" opacity="0.95"/>
      <circle cx="160" cy="130" r={canopySize * 0.75} fill="#A8CFA0" opacity="0.9"/>
      <circle cx="240" cy="130" r={canopySize * 0.75} fill="#7EB380" opacity="0.9"/>
      <circle cx="200" cy="90" r={canopySize * 0.6} fill="#B8D9B0" opacity="0.9"/>

      {/* leaves */}
      {Array.from({ length: Math.min(24, Math.round(leaves / 8)) }).map((_, i) => (
        <ellipse key={`l${i}`} cx={140 + (i * 37) % 130} cy={80 + (i * 23) % 90} rx="4" ry="7"
                 fill="#6EA870" transform={`rotate(${(i * 47) % 90} ${140 + (i * 37) % 130} ${80 + (i * 23) % 90})`} opacity="0.85"/>
      ))}
      {/* flowers */}
      {Array.from({ length: flowers }).map((_, i) => (
        <g key={`f${i}`} transform={`translate(${150 + (i * 29) % 110}, ${95 + (i * 17) % 60})`}>
          <circle r="3.5" fill="#F3B7C9"/><circle r="1.5" fill="#F5D14A"/>
        </g>
      ))}
      {/* birds */}
      {Array.from({ length: birds }).map((_, i) => (
        <path key={`b${i}`} d={`M${60 + i * 90},${40 + i * 12} q6,-6 12,0 q6,-6 12,0`} stroke="#3F3F55" strokeWidth="1.5" fill="none"/>
      ))}
    </svg>
  );
}
