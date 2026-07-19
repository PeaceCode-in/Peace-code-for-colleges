import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Wind, ClipboardList, PenLine, Heart } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { newConv, upsertConv, type ConvType } from "@/lib/peacebot-store";

export const Route = createFileRoute("/peacebot/mental")({
  head: () => ({ meta: [{ title: "Peace Bot · mental health tools" }] }),
  component: MentalPage,
});
const { surface, border, ink, muted, soft } = palette;

const TOOLS: { type: ConvType; title: string; hint: string; also?: { label: string; to: string } }[] = [
  { type: "anxious", title: "ai anxiety coach", hint: "settle the body, name the fear", also: { label: "try 4-7-8 breath", to: "/breathe" } },
  { type: "cbt", title: "cbt conversation", hint: "one thought, examined gently" },
  { type: "overthinking", title: "thought challenging", hint: "slow the loop, test the story" },
  { type: "overthinking", title: "overthinking assistant", hint: "sort loud from true" },
  { type: "anxious", title: "panic companion", hint: "grounding, right now", also: { label: "grounding room", to: "/breathe" } },
  { type: "grounding", title: "grounding 5-4-3-2-1", hint: "return to the room" },
  { type: "compassion", title: "self-compassion", hint: "speak to yourself like a friend" },
  { type: "regulation", title: "emotional regulation", hint: "name it to tame it" },
  { type: "reflection", title: "mood reflection", hint: "read your day with softness", also: { label: "write in journal", to: "/journal" } },
  { type: "mindful", title: "mindfulness coach", hint: "one breath, one moment" },
  { type: "sleep", title: "sleep coach", hint: "wind down without pressure" },
  { type: "burnout", title: "burnout recovery", hint: "when sleep isn't enough", also: { label: "take a screening", to: "/screening" } },
];

function MentalPage() {
  const nav = useNavigate();
  const start = (type: ConvType, title: string) => {
    const c = newConv(type); c.title = title; upsertConv(c);
    nav({ to: "/peacebot/c/$id", params: { id: c.id } });
  };
  return (
    <AppShell>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase opacity-50">peace bot</div>
            <h1 className="font-serif text-[36px] leading-tight">mental health tools</h1>
            <p className="text-[13px] mt-1" style={{ color: muted }}>gentle, structured spaces — not diagnoses.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map((t) => (
            <div key={t.title} className="p-5 rounded-2xl flex flex-col" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="flex-1">
                <div className="text-[15px] font-medium" style={{ color: ink }}>{t.title}</div>
                <div className="mt-1 text-[12px]" style={{ color: muted }}>{t.hint}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => start(t.type, t.title)} className="px-4 h-9 rounded-full text-[12px]" style={{ background: ink, color: "var(--pc-bg)" }}>start</button>
                {t.also && <Link to={t.also.to} className="px-4 h-9 rounded-full text-[12px] flex items-center" style={{ background: soft, color: ink }}>{t.also.label}</Link>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { icon: Wind, to: "/breathe", label: "breathe" },
            { icon: ClipboardList, to: "/screening", label: "screening" },
            { icon: PenLine, to: "/journal", label: "journal" },
            { icon: Heart, to: "/gratitude", label: "gratitude" },
          ].map((c) => {
            const I = c.icon;
            return (
              <Link key={c.to} to={c.to} className="p-4 rounded-2xl text-center transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
                <I className="w-4 h-4 mx-auto mb-2 opacity-70"/>
                <div className="text-[12px]" style={{ color: ink }}>{c.label}</div>
              </Link>
            );
          })}
        </div>

        <div className="rounded-2xl p-5 text-[12px]" style={{ background: soft, color: ink }}>
          if things feel unsafe or urgent, please reach out to iCall (India) 9152987821, or a trusted human near you. peace stays with you either way.
        </div>
      </main>
    </AppShell>
  );
}
