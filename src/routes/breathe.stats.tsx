import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, TrendingUp, Award, Clock, Target, Sparkles } from "lucide-react";
import logo from "@/assets/peacecode-logo.png";
import { AppShell } from "@/components/AppShell";
import { loadSessions, type BreathSession, type BreathTechniqueKey } from "@/lib/breathe-store";

export const Route = createFileRoute("/breathe/stats")({ component: BreatheStatsPage });

const bg = "#F7FAFF", surface = "#FFFFFF", surface2 = "#EAF3FF", border = "#DCE3EF";
const ink = "#1D2A44", muted = "#7587A6", primary = "#4B6CB7";
const lavender = "#D5C9F7", moss = "#CDEBD9", peach = "#F8CADA", sky = "#AFC9F5";

const techMeta: Record<BreathTechniqueKey, { name: string; tag: string; color: string; note: string }> = {
  box:       { name: "Box Breathing",     tag: "4·4·4·4",   color: primary,  note: "square rhythm" },
  "478":     { name: "4-7-8 Breathing",   tag: "4·7·8",     color: lavender, note: "relaxing exhale" },
  cyclic:    { name: "Cyclic Sighing",    tag: "double sigh",color: peach,   note: "fastest reset" },
  resonance: { name: "Resonance",         tag: "5·5",       color: moss,     note: "heart coherence" },
  nostril:   { name: "Alternate Nostril", tag: "nadi",      color: sky,      note: "balance" },
  triangle:  { name: "Triangle",          tag: "3·3·3",     color: lavender, note: "gentle entry" },
  custom:    { name: "Custom",            tag: "your own",  color: muted,    note: "tuned to you" },
};

function BreatheStatsPage() {
  const [sessions, setSessions] = useState<BreathSession[]>([]);
  useEffect(() => { setSessions(loadSessions()); }, []);

  const overview = useMemo(() => {
    const total = sessions.length;
    const mins = sessions.reduce((a, s) => a + s.minutes, 0);
    const cycles = sessions.reduce((a, s) => a + s.cycles, 0);
    const longest = sessions.reduce((a, s) => Math.max(a, s.minutes), 0);
    const avgCompletion = total === 0 ? 0
      : Math.round(sessions.reduce((a, s) => a + Math.min(1, s.minutes / Math.max(1, s.planned)), 0) / total * 100);
    return { total, mins, cycles, longest, avgCompletion };
  }, [sessions]);

  const byTech = useMemo(() => {
    const keys = Object.keys(techMeta) as BreathTechniqueKey[];
    return keys.map((k) => {
      const list = sessions.filter((s) => s.technique === k);
      if (list.length === 0) return null;
      const mins = list.reduce((a, s) => a + s.minutes, 0);
      const best = list.reduce((a, s) => Math.max(a, s.minutes), 0);
      const avgMins = mins / list.length;
      const avgCycles = list.reduce((a, s) => a + s.cycles, 0) / list.length;
      const completion = list.reduce((a, s) => a + Math.min(1, s.minutes / Math.max(1, s.planned)), 0) / list.length;
      // mood response: how often mood improved (rough score 0-1)
      const moodOrder = ["cloudy", "restless", "tender", "gentle", "grounded", "flowing"];
      const rated = list.filter((s) => s.moodBefore && s.moodAfter);
      let improved = 0;
      rated.forEach((s) => {
        const b = moodOrder.indexOf(s.moodBefore!);
        const a = moodOrder.indexOf(s.moodAfter!);
        if (b >= 0 && a > b) improved++;
      });
      const response = rated.length === 0 ? null : improved / rated.length;
      const lastAt = list[0]?.completedAt;
      return { key: k, meta: techMeta[k], count: list.length, mins, best, avgMins, avgCycles, completion, response, lastAt };
    }).filter(Boolean) as Array<{
      key: BreathTechniqueKey; meta: typeof techMeta[BreathTechniqueKey];
      count: number; mins: number; best: number; avgMins: number; avgCycles: number;
      completion: number; response: number | null; lastAt: string;
    }>;
  }, [sessions]);

  const mostUsed = byTech.slice().sort((a, b) => b.count - a.count)[0];
  const mostResponsive = byTech.filter(t => t.response !== null).sort((a, b) => (b.response ?? 0) - (a.response ?? 0))[0];
  const longestSingle = sessions.slice().sort((a, b) => b.minutes - a.minutes)[0];

  // best hour of day
  const hourBuckets = useMemo(() => {
    const arr = new Array(24).fill(0);
    sessions.forEach((s) => { arr[new Date(s.completedAt).getHours()] += 1; });
    const max = Math.max(...arr);
    const bestHour = arr.indexOf(max);
    return { arr, bestHour: max === 0 ? null : bestHour, max };
  }, [sessions]);

  return (
    <AppShell>
    <div className="font-['DM_Sans',sans-serif]" style={{ color: ink }}>
      <header className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-6 flex items-center justify-between">
        <Link to="/breathe" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 rounded-full">
          <ArrowLeft size={18} className="opacity-60 group-hover:-translate-x-0.5 transition-transform" />
          <img src={logo} alt="" className="w-7 h-7 opacity-90" />
          <span className="text-[11px] tracking-[0.3em] uppercase opacity-60">peacecode · breathe · stats</span>
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-8">
        <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-3">library stats</div>
        <h1 className="font-['Fraunces',serif] text-4xl sm:text-5xl font-light leading-[1.05]">
          how you <span className="italic" style={{ color: primary }}>respond to breath.</span>
        </h1>
        <p className="mt-4 text-[14px] opacity-70 max-w-lg">
          A quiet mirror of your practice. Which techniques you return to, how long you stay, and how your mood shifts after.
        </p>
      </section>

      {/* overview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Big label="sessions"       value={overview.total} />
        <Big label="total minutes"  value={overview.mins} />
        <Big label="cycles held"    value={overview.cycles} />
        <Big label="avg completion" value={`${overview.avgCompletion}%`} />
      </section>

      {/* highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Highlight
          icon={Award}
          label="most used"
          title={mostUsed ? mostUsed.meta.name : "not yet"}
          detail={mostUsed ? `${mostUsed.count} sessions · ${Math.round(mostUsed.mins)} min` : "your first breath is waiting"}
          accent={mostUsed?.meta.color ?? border}
        />
        <Highlight
          icon={Sparkles}
          label="most calming"
          title={mostResponsive ? mostResponsive.meta.name : "waiting for reflections"}
          detail={mostResponsive ? `${Math.round((mostResponsive.response ?? 0) * 100)}% moods lifted after` : "add a post-session mood to see this"}
          accent={mostResponsive?.meta.color ?? border}
        />
        <Highlight
          icon={Clock}
          label="longest single session"
          title={longestSingle ? `${longestSingle.minutes} minutes` : "—"}
          detail={longestSingle ? `${techMeta[longestSingle.technique].name} · ${new Date(longestSingle.completedAt).toLocaleDateString([], { month: "short", day: "numeric" })}` : "sit with one for a while"}
          accent={longestSingle ? techMeta[longestSingle.technique].color : border}
        />
      </section>

      {/* per-technique table */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-10">
        <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-3">by technique</div>
        <div className="rounded-2xl overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] tracking-[0.2em] uppercase opacity-60" style={{ background: surface2 }}>
            <div className="col-span-4">technique</div>
            <div className="col-span-1 text-right">runs</div>
            <div className="col-span-2 text-right">best · min</div>
            <div className="col-span-2 text-right">avg · min</div>
            <div className="col-span-3">completion · response</div>
          </div>
          {byTech.length === 0 && (
            <div className="px-5 py-10 text-center text-[13px] opacity-60">
              No sessions yet. Complete one on the <Link to="/breathe" className="underline">breathe page</Link> and this fills in.
            </div>
          )}
          <ul className="divide-y" style={{ borderColor: border }}>
            {byTech.sort((a, b) => b.count - a.count).map((t) => (
              <li key={t.key} className="grid grid-cols-12 gap-2 px-5 py-4 items-center">
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.meta.color }} />
                    <span className="text-[14px] truncate">{t.meta.name}</span>
                  </div>
                  <div className="text-[10px] opacity-60 mt-0.5">{t.meta.tag} · {t.meta.note}</div>
                </div>
                <div className="col-span-1 text-right font-['Fraunces',serif] text-lg">{t.count}</div>
                <div className="col-span-2 text-right">
                  <div className="font-['Fraunces',serif] text-lg">{t.best}</div>
                  <div className="text-[9px] opacity-50">personal best</div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="font-['Fraunces',serif] text-lg">{t.avgMins.toFixed(1)}</div>
                  <div className="text-[9px] opacity-50">{t.avgCycles.toFixed(0)} cycles avg</div>
                </div>
                <div className="col-span-3">
                  <Bar label="completion" value={t.completion} color={t.meta.color} />
                  <div className="mt-2">
                    {t.response === null
                      ? <div className="text-[10px] opacity-50 italic">no mood data yet</div>
                      : <Bar label="mood lift" value={t.response} color={peach} />
                    }
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* hour of day */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 mt-10 mb-16">
        <div className="text-[10px] tracking-[0.4em] uppercase opacity-50 mb-3">when you breathe</div>
        <div className="rounded-2xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="font-['Fraunces',serif] text-2xl">
                {hourBuckets.bestHour === null ? "your rhythm is forming"
                  : `you breathe best around ${formatHour(hourBuckets.bestHour)}`}
              </div>
              <div className="text-[12px] opacity-60 mt-1">Distribution across 24 hours.</div>
            </div>
            <TrendingUp size={16} className="opacity-40" aria-hidden="true" />
          </div>
          <div className="flex items-end gap-1 h-24" role="img" aria-label="Breathing sessions by hour of day">
            {hourBuckets.arr.map((v, i) => {
              const h = hourBuckets.max === 0 ? 4 : Math.max(3, (v / hourBuckets.max) * 100);
              const isBest = i === hourBuckets.bestHour && v > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{ height: `${h}%`, background: isBest ? primary : surface2, border: `1px solid ${border}` }}
                    title={`${v} sessions at ${formatHour(i)}`}
                  />
                  {i % 4 === 0 && <div className="text-[9px] opacity-40">{i}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
    </AppShell>
  );
}


function Big({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="text-[10px] tracking-[0.3em] uppercase opacity-55">{label}</div>
      <div className="font-['Fraunces',serif] text-3xl mt-2">{value}</div>
    </div>
  );
}

function Highlight({ icon: Icon, label, title, detail, accent }: { icon: typeof Award; label: string; title: string; detail: string; accent: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="absolute top-0 left-0 h-full w-1" style={{ background: accent }} />
      <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase opacity-55">
        <Icon size={12} aria-hidden="true" /> {label}
      </div>
      <div className="font-['Fraunces',serif] text-xl mt-2">{title}</div>
      <div className="text-[12px] opacity-70 mt-1">{detail}</div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] opacity-60">
        <span>{label}</span><span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: surface2 }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function formatHour(h: number) {
  const ampm = h < 12 ? "am" : "pm";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}${ampm}`;
}
