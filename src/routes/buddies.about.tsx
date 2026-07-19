import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowLeft, Check, X, Heart, GraduationCap, Stethoscope, Pill, Phone } from "lucide-react";

export const Route = createFileRoute("/buddies/about")({
  head: () => ({ meta: [{ title: "What is Peace Buddies?" }] }),
  component: About,
});

function About() {
  const { surface, surface2, border, ink, muted, primary } = palette;

  const roles = [
    { icon: Heart, title: "Peace Buddy", who: "trained student peer", can: "listen, share experience, walk beside you", cant: "diagnose, prescribe, treat", color: primary },
    { icon: GraduationCap, title: "Counsellor", who: "campus counsellor (Masters)", can: "structured guidance, coping tools", cant: "medication, deep clinical work", color: "#7c86ff" },
    { icon: Stethoscope, title: "Psychologist", who: "licensed (M.Phil / PhD, RCI)", can: "therapy, clinical assessment", cant: "prescribe medication", color: "#8b7cff" },
    { icon: Pill, title: "Psychiatrist", who: "medical doctor (MD)", can: "diagnose, prescribe, treat clinically", cant: "long talk therapy (usually)", color: "#a179ff" },
    { icon: Phone, title: "Emergency", who: "iCall / KIRAN / Vandrevala", can: "immediate crisis response 24/7", cant: "ongoing care by themselves", color: "#e63946" },
  ];

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-6" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back to peace buddies
        </Link>

        <div className="mb-10">
          <div className="text-[10px] tracking-[0.35em] uppercase" style={{ color: muted }}>what is this</div>
          <h1 className="font-serif text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.1] tracking-tight mt-1" style={{ color: ink }}>
            Peers helping peers. <em className="italic opacity-80">Nothing more, nothing less.</em>
          </h1>
        </div>

        <section className="rounded-3xl p-6 lg:p-8 mb-6" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="font-serif text-[20px] mb-3" style={{ color: ink }}>Who Peace Buddies are</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: ink, opacity: 0.8 }}>
            Peace Buddies are current students — nominated by campus counsellors, trained across 40+ hours in active listening,
            boundaries, crisis recognition, and confidentiality. They are not licensed mental health professionals. Their role
            is to make you feel heard, gently reduce loneliness, and — when needed — guide you toward the right kind of help.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#22c55e" }}>
              <Check className="w-3 h-3"/> peace buddies can
            </div>
            <ul className="space-y-2 text-[13px]" style={{ color: ink, opacity: 0.85 }}>
              {["Listen without judgement","Share personal experience","Sit with you in hard moments","Suggest coping ideas","Guide you to professional help","Help with homesickness, hostel life, exam anxiety"].map((t)=>
                <li key={t} className="flex gap-2"><span className="opacity-40">·</span> {t}</li>)}
            </ul>
          </div>
          <div className="rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#e63946" }}>
              <X className="w-3 h-3"/> peace buddies cannot
            </div>
            <ul className="space-y-2 text-[13px]" style={{ color: ink, opacity: 0.85 }}>
              {["Diagnose mental health conditions","Prescribe medication","Provide clinical therapy","Handle immediate crisis alone","Replace professional care","Break confidentiality — except in safety emergencies"].map((t)=>
                <li key={t} className="flex gap-2"><span className="opacity-40">·</span> {t}</li>)}
            </ul>
          </div>
        </section>

        <h2 className="font-serif text-[22px] mb-4 mt-8" style={{ color: ink }}>Peer support vs professional care</h2>
        <div className="space-y-3 mb-10">
          {roles.map(({ icon: Icon, title, who, can, cant, color }) => (
            <div key={title} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: surface2 }}>
                <Icon className="w-5 h-5" style={{ color }}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-serif text-[16px]" style={{ color: ink }}>{title}</span>
                  <span className="text-[10px] opacity-60">{who}</span></div>
                <div className="text-[12px] mt-1" style={{ color: muted }}>
                  <span className="opacity-80">can:</span> {can}
                </div>
                <div className="text-[12px]" style={{ color: muted }}>
                  <span className="opacity-80">cannot:</span> {cant}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl p-6 text-center" style={{ background: surface, border: `1px solid ${border}` }}>
          <p className="text-[13px] mb-4" style={{ color: muted }}>Ready to talk to a real student who&apos;s been there?</p>
          <Link to="/buddies/browse" className="inline-block px-6 py-2.5 rounded-full text-[12px]" style={{ background: ink, color: surface }}>
            Browse Peace Buddies
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
