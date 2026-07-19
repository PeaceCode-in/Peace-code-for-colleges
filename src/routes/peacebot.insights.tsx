import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, TrendingUp, MessageCircle, Sparkles } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { loadConvs, STUDENT_CONTEXT } from "@/lib/peacebot-store";

export const Route = createFileRoute("/peacebot/insights")({
  head: () => ({ meta: [{ title: "Peace Bot · insights" }] }),
  component: InsightsPage,
});
const { surface, surface2, border, ink, muted, primary, soft } = palette;

function InsightsPage() {
  const convs = loadConvs();

  const stats = useMemo(() => {
    const week = Date.now() - 86_400_000 * 7;
    const recent = convs.filter((c) => c.updatedAt > week);
    const msgs = recent.flatMap((c) => c.messages);
    const words: Record<string, number> = {};
    const keys = ["anxious", "focus", "exam", "sleep", "study", "friend", "career", "grateful", "tired", "family"];
    for (const m of msgs) {
      if (m.from !== "me") continue;
      const t = m.text.toLowerCase();
      for (const k of keys) if (t.includes(k)) words[k] = (words[k] ?? 0) + 1;
    }
    const top = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const byType: Record<string, number> = {};
    for (const c of recent) byType[c.type] = (byType[c.type] ?? 0) + 1;
    return {
      chats: recent.length,
      messages: msgs.length,
      top,
      byType: Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [convs]);

  const spark = new Array(14).fill(0).map((_, i) => {
    const start = Date.now() - (13 - i) * 86_400_000;
    return convs.filter((c) => c.updatedAt >= start && c.updatedAt < start + 86_400_000).length;
  });
  const max = Math.max(1, ...spark);

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase opacity-50">peace bot</div>
            <h1 className="font-serif text-[36px] leading-tight">ai insights</h1>
            <p className="text-[13px] mt-1" style={{ color: muted }}>a quiet look at your week with peace.</p>
          </div>
        </div>

        <section className="grid sm:grid-cols-3 gap-3">
          <Stat label="conversations · 7d" value={stats.chats}/>
          <Stat label="messages · 7d" value={stats.messages}/>
          <Stat label="streak" value={`day ${STUDENT_CONTEXT.streak}`}/>
        </section>

        <section className="p-6 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-4 flex items-center gap-2"><TrendingUp className="w-3 h-3"/> conversation rhythm · 14 days</div>
          <div className="flex items-end gap-1.5 h-24">
            {spark.map((v, i) => (
              <div key={i} className="flex-1 rounded-t-md transition" style={{ height: `${(v / max) * 100}%`, background: v ? primary : surface2, minHeight: 4 }}/>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-3">
          <div className="p-6 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">most discussed topics</div>
            {stats.top.length === 0 && <div className="text-[13px]" style={{ color: muted }}>chat more with peace to see themes emerge.</div>}
            <div className="flex flex-col gap-2.5">
              {stats.top.map(([k, n]) => (
                <div key={k} className="flex items-center gap-3">
                  <div className="w-20 text-[12px] capitalize" style={{ color: ink }}>{k}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: surface2 }}>
                    <div className="h-full rounded-full" style={{ width: `${(n / stats.top[0][1]) * 100}%`, background: primary }}/>
                  </div>
                  <div className="text-[11px] w-6 text-right" style={{ color: muted }}>{n}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">conversation types</div>
            {stats.byType.length === 0 && <div className="text-[13px]" style={{ color: muted }}>no chats yet this week.</div>}
            <div className="flex flex-wrap gap-2">
              {stats.byType.map(([k, n]) => (
                <span key={k} className="px-3 h-8 rounded-full text-[11px] flex items-center gap-2" style={{ background: soft, color: ink }}>
                  {k} <span className="opacity-60">×{n}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="p-6 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3"/> growth summary</div>
          <p className="text-[15px] leading-relaxed" style={{ color: ink }}>
            you leaned into peace on {stats.chats} occasions this week. themes around
            {stats.top.slice(0, 2).map(([k]) => ` ${k}`).join(" and ") || " your everyday"} came up most. your sleep is holding steady near {STUDENT_CONTEXT.sleepHours}h, and your streak is at day {STUDENT_CONTEXT.streak}. that's not small.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link to="/peacebot/memory" className="px-4 h-10 rounded-full text-[12px] flex items-center gap-2" style={{ background: surface, border: `1px solid ${border}` }}><MessageCircle className="w-3 h-3"/> memory</Link>
          <Link to="/screening/history" className="px-4 h-10 rounded-full text-[12px] flex items-center gap-2" style={{ background: surface, border: `1px solid ${border}` }}>screening history</Link>
          <Link to="/focus" className="px-4 h-10 rounded-full text-[12px] flex items-center gap-2" style={{ background: surface, border: `1px solid ${border}` }}>focus stats</Link>
        </div>
      </main>
    </AppShell>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
      <div className="text-[10px] tracking-[0.3em] uppercase opacity-60">{label}</div>
      <div className="mt-2 font-serif text-[32px] leading-none" style={{ color: ink }}>{value}</div>
    </div>
  );
}
