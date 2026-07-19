import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowLeft, Phone, HeartHandshake, ShieldCheck, BookOpen, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/screening/resources")({
  head: () => ({ meta: [{ title: "Resources & help — PeaceCode Screening" }] }),
  component: Resources,
});

const { surface, surface2, border, ink, muted, primary } = palette;

const HOTLINES = [
  { name: "iCall (TISS)", number: "9152987821", note: "Mon–Sat, 8am–10pm · English, Hindi + regional" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", note: "24/7 · free · confidential" },
  { name: "AASRA", number: "9820466726", note: "24/7 suicide prevention support" },
  { name: "NIMHANS Helpline", number: "080-46110007", note: "24/7 mental health helpline" },
];

const FAQ = [
  ["Is this a diagnosis?", "No. These are screening tools. Only a qualified professional can diagnose."],
  ["Who sees my responses?", "Only you. Nothing leaves this device unless you export or share it yourself."],
  ["Can I delete my data?", "Yes — from Screening → History → Delete, or Export first if you'd like a copy."],
  ["How often should I retake?", "Most screens are meaningful every 2–4 weeks. Once a month is a healthy rhythm."],
  ["What if a score worries me?", "Read it gently. Then talk to someone: a friend, counsellor, or one of the numbers above."],
];

function Resources() {
  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-8 lg:py-12">
        <nav className="text-[11px] tracking-[0.2em] uppercase mb-6 flex items-center gap-2" style={{ color: muted }}>
          <Link to="/screening" className="hover:underline">Screening</Link><span>·</span><span style={{ color: ink }}>Resources</span>
        </nav>

        <h1 className="font-serif text-4xl leading-tight">If today feels heavy.</h1>
        <p className="text-[14px] mt-3 max-w-xl" style={{ color: muted }}>You don't have to carry it alone. These are real, trained humans, ready to listen.</p>

        <section className="mt-8">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: primary }}>Emergency & helplines (India)</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {HOTLINES.map((h) => (
              <a key={h.name} href={`tel:${h.number.replace(/[^0-9]/g, "")}`} className="rounded-2xl p-5 transition hover:-translate-y-0.5" style={{ background: surface, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-2 mb-1"><Phone className="w-4 h-4" style={{ color: primary }} /><div className="text-[13px]">{h.name}</div></div>
                <div className="font-serif text-2xl">{h.number}</div>
                <div className="text-[11px] mt-1" style={{ color: muted }}>{h.note}</div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="text-[10px] tracking-[0.3em] uppercase mb-3" style={{ color: primary }}>Frequently asked</div>
          <div className="rounded-2xl divide-y" style={{ background: surface, border: `1px solid ${border}`, borderColor: border }}>
            {FAQ.map(([q, a]) => (
              <div key={q} className="px-5 py-4">
                <div className="text-[13.5px]">{q}</div>
                <div className="text-[12.5px] mt-1 leading-relaxed" style={{ color: muted }}>{a}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid sm:grid-cols-3 gap-3">
          <Link to="/screening/settings" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <ShieldCheck className="w-4 h-4" style={{ color: primary }} />
            <div><div className="text-[13px]">Privacy & data</div><div className="text-[11px]" style={{ color: muted }}>Delete · export · reminders</div></div>
          </Link>
          <Link to="/community" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <HeartHandshake className="w-4 h-4" style={{ color: primary }} />
            <div><div className="text-[13px]">Community</div><div className="text-[11px]" style={{ color: muted }}>Anonymous, kind, on your side</div></div>
          </Link>
          <Link to="/breathe" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <LifeBuoy className="w-4 h-4" style={{ color: primary }} />
            <div><div className="text-[13px]">Breathe now</div><div className="text-[11px]" style={{ color: muted }}>A 4-minute reset</div></div>
          </Link>
        </section>

        <div className="mt-10">
          <Link to="/screening" className="text-[12px] inline-flex items-center gap-1.5" style={{ color: muted }}><ArrowLeft className="w-3.5 h-3.5" /> Back to Screening</Link>
        </div>
      </main>
    </AppShell>
  );
}
