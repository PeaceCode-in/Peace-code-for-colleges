import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles, Wind, Cloud, Moon, Sun } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, palette } from "@/components/AppShell";
import { loadEntries, computeTree, computeStreak, STAGES } from "@/lib/gratitude-store";
import { gratitudeAI } from "@/lib/gratitude-ai.functions";

export const Route = createFileRoute("/gratitude/tree")({
  head: () => ({ meta: [{ title: "Your Tree — Gratitude" }] }),
  component: TreePage,
});

type Season = "spring" | "summer" | "autumn" | "night";

function TreePage() {
  const { ink, muted, border, primary, surface, surface2 } = palette;
  const [entries, setEntries] = useState(() => loadEntries());
  const [season, setSeason] = useState<Season>("spring");
  const [rain, setRain] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const aiFn = useServerFn(gratitudeAI);
  useEffect(() => { setEntries(loadEntries()); }, []);

  const tree = useMemo(() => computeTree(entries), [entries]);
  const { current, longest } = useMemo(() => computeStreak(entries), [entries]);

  async function summarize() {
    setLoadingAi(true);
    try {
      const status = `stage:${tree.stage.label}, entries:${entries.length}, streak:${current}, bloom:${Math.round(tree.bloom * 100)}%`;
      const r = await aiFn({ data: { kind: "tree_summary", text: status } });
      setAiSummary(r.text);
    } finally { setLoadingAi(false); }
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link to="/gratitude" className="text-[11px] tracking-[0.24em] uppercase inline-flex items-center gap-1.5 opacity-70 hover:opacity-100 mb-6" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3" /> back
        </Link>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          {/* garden */}
          <div className="relative overflow-hidden rounded-[32px] aspect-[5/4]"
               style={{ background: seasonBackground(season), border: `1px solid ${border}` }}>
            <Garden stage={tree.stageIdx} season={season} rain={rain} />
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.24em] uppercase" style={{ color: "rgba(29,42,68,0.7)" }}>
              <span>your garden</span><span>{tree.stage.label}</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
              <SeasonBtn active={season === "spring"} onClick={() => setSeason("spring")} icon={<Sun className="w-3 h-3" />} label="spring" />
              <SeasonBtn active={season === "summer"} onClick={() => setSeason("summer")} icon={<Sun className="w-3 h-3" />} label="summer" />
              <SeasonBtn active={season === "autumn"} onClick={() => setSeason("autumn")} icon={<Wind className="w-3 h-3" />} label="autumn" />
              <SeasonBtn active={season === "night"} onClick={() => setSeason("night")} icon={<Moon className="w-3 h-3" />} label="night" />
              <SeasonBtn active={rain} onClick={() => setRain((v) => !v)} icon={<Cloud className="w-3 h-3" />} label={rain ? "rain on" : "rain off"} />
            </div>
          </div>

          {/* stats */}
          <div className="rounded-[32px] p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>current stage</div>
            <div className="mt-1 font-serif italic text-4xl leading-tight" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{tree.stage.label}</div>
            <div className="mt-3 h-2 rounded-full" style={{ background: surface2 }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${tree.bloom * 100}%`, background: primary }} />
            </div>
            <div className="mt-1 text-[11px]" style={{ color: muted }}>{Math.round(tree.bloom * 100)}% bloom · {tree.next ? `next: ${tree.next.label}` : "peace forest reached"}</div>

            <div className="grid grid-cols-2 gap-2.5 mt-6">
              <MiniStat label="leaves"  value={tree.leaves} />
              <MiniStat label="flowers" value={tree.flowers} />
              <MiniStat label="fruits"  value={tree.fruits} />
              <MiniStat label="birds"   value={tree.birds} />
              <MiniStat label="streak"  value={current} />
              <MiniStat label="entries" value={entries.length} />
            </div>

            <div className="mt-6 rounded-2xl p-4" style={{ background: surface2 }}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] tracking-[0.28em] uppercase" style={{ color: muted }}>peace's read</div>
                <button onClick={summarize} disabled={loadingAi} className="text-[11px] inline-flex items-center gap-1 opacity-80 hover:opacity-100" style={{ color: primary }}>
                  <Sparkles className="w-3 h-3" /> {loadingAi ? "…" : "reflect"}
                </button>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed font-serif italic" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>
                {aiSummary || "tap reflect to hear a soft word about your growth."}
              </p>
            </div>
          </div>
        </div>

        {/* stage timeline */}
        <div className="mt-6 rounded-[32px] p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color: muted }}>growth timeline</div>
          <ol className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            {STAGES.map((s, i) => {
              const reached = i <= tree.stageIdx;
              return (
                <li key={s.key} className="rounded-2xl p-3 text-center transition"
                    style={{ background: reached ? surface2 : "transparent", border: `1px solid ${i === tree.stageIdx ? primary : border}`, opacity: reached ? 1 : 0.45 }}>
                  <div className="text-xl">{s.emoji}</div>
                  <div className="mt-1 text-[10px] tracking-[0.16em] uppercase" style={{ color: muted }}>{s.label}</div>
                  <div className="text-[10px] opacity-60" style={{ color: muted }}>{s.min}+</div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}

function seasonBackground(s: Season) {
  switch (s) {
    case "summer": return "linear-gradient(180deg,#FFF7E6 0%,#F8ECC7 100%)";
    case "autumn": return "linear-gradient(180deg,#FCEBD8 0%,#E8C79A 100%)";
    case "night":  return "linear-gradient(180deg,#1D2A44 0%,#2C3B62 100%)";
    default:       return "linear-gradient(180deg,#EAF3FF 0%,#D5E5FA 100%)";
  }
}

function SeasonBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
            className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full backdrop-blur transition"
            style={{ background: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)", color: "#1D2A44", border: "1px solid rgba(29,42,68,0.15)" }}>
      {icon}{label}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  const { ink, muted, border } = palette;
  return (
    <div className="rounded-2xl p-3" style={{ border: `1px solid ${border}` }}>
      <div className="text-[10px] tracking-[0.24em] uppercase" style={{ color: muted }}>{label}</div>
      <div className="font-serif italic text-2xl mt-0.5" style={{ color: ink, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </div>
  );
}

// ─── SVG garden ───
function Garden({ stage, season, rain }: { stage: number; season: Season; rain: boolean }) {
  const trunk = season === "night" ? "#3D2E1F" : "#5A3B22";
  const leaf =
    season === "autumn" ? ["#E8A05A","#D4813F","#C8621F"]
    : season === "summer" ? ["#7BB56A","#5FA050","#3E8236"]
    : season === "night" ? ["#4A5F82","#3B4E6B","#2A3A54"]
    : ["#9BC98F","#7BB56A","#5FA050"];
  const size = 40 + stage * 22; // canopy radius

  const birds = Array.from({ length: Math.min(3, Math.max(0, stage - 2)) });
  const flowers = Array.from({ length: Math.min(10, Math.max(0, stage - 3) * 2) });
  const fireflies = season === "night" ? Array.from({ length: 12 }) : [];

  return (
    <svg viewBox="0 0 500 400" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      {/* ground */}
      <ellipse cx="250" cy="360" rx="260" ry="30" fill={season === "night" ? "#152036" : "#C7DBAF"} opacity="0.7" />
      {/* trunk */}
      <path d={`M245 360 Q 240 300 250 ${360 - stage * 12 - 60} Q 260 300 255 360 Z`} fill={trunk} />
      {/* canopy */}
      {stage >= 1 && <circle cx="250" cy={360 - stage * 12 - 70} r={size * 0.7} fill={leaf[2]} opacity="0.9" />}
      {stage >= 2 && <circle cx={250 - size * 0.4} cy={360 - stage * 12 - 60} r={size * 0.55} fill={leaf[1]} opacity="0.9" />}
      {stage >= 3 && <circle cx={250 + size * 0.4} cy={360 - stage * 12 - 60} r={size * 0.55} fill={leaf[1]} opacity="0.9" />}
      {stage >= 4 && <circle cx="250" cy={360 - stage * 12 - 90} r={size * 0.5} fill={leaf[0]} opacity="0.95" />}
      {/* flowers */}
      {flowers.map((_, i) => (
        <circle key={i} cx={200 + (i * 30) % 200 + Math.sin(i) * 6}
                cy={360 - stage * 12 - 70 - Math.cos(i * 2) * 30}
                r="4" fill={stage >= 6 ? "#EFC050" : "#F5B7C7"} opacity="0.9" />
      ))}
      {/* birds */}
      {birds.map((_, i) => (
        <path key={i} d={`M ${120 + i * 90} ${80 + i * 20} q 8 -6 16 0 q 8 -6 16 0`} stroke={season === "night" ? "#C7D8F5" : "#2A3A54"} strokeWidth="2" fill="none" opacity="0.7"/>
      ))}
      {/* fireflies */}
      {fireflies.map((_, i) => (
        <circle key={i} cx={80 + (i * 37) % 360} cy={80 + (i * 53) % 220} r="1.6" fill="#FFE79A" opacity="0.9">
          <animate attributeName="opacity" values="0.2;1;0.2" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* rain */}
      {rain && Array.from({ length: 40 }).map((_, i) => (
        <line key={i} x1={i * 13} y1={-10} x2={i * 13 - 6} y2={30} stroke="#8FB1E8" strokeWidth="1" opacity="0.6">
          <animateTransform attributeName="transform" type="translate" from="0 0" to="0 420" dur={`${1 + (i % 5) * 0.2}s`} repeatCount="indefinite" />
        </line>
      ))}
    </svg>
  );
}
