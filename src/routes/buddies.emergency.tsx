import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { ArrowLeft, Phone, Wind, Bot, Stethoscope, Users, ShieldAlert, MapPin, UserRound } from "lucide-react";

export const Route = createFileRoute("/buddies/emergency")({
  head: () => ({ meta: [{ title: "Emergency support" }, { name: "robots", content: "noindex" }] }),
  component: Emergency,
});

function Emergency() {
  const { surface, surface2, border, ink, muted, primary } = palette;

  const contacts = [
    { name: "iCall (TISS)", number: "9152987821", desc: "9am–9pm · English, Hindi + more" },
    { name: "KIRAN National Helpline", number: "1800-599-0019", desc: "24/7 · toll-free · 13 languages" },
    { name: "Vandrevala Foundation", number: "1860-2662-345", desc: "24/7 · free · confidential" },
    { name: "AASRA", number: "9820466726", desc: "24/7 · suicide prevention" },
  ];

  return (
    <AppShell>
      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <div className="rounded-3xl p-6 mb-6" style={{ background: "linear-gradient(135deg, #fecaca, #fef3c7)", border: `1px solid ${border}` }}>
          <div className="flex items-start gap-3 mb-3">
            <ShieldAlert className="w-6 h-6" style={{ color: "#e63946" }}/>
            <div>
              <h1 className="font-serif text-[26px] leading-tight" style={{ color: ink }}>You&apos;re not alone right now.</h1>
              <p className="text-[13px] mt-1" style={{ color: ink, opacity: 0.75 }}>
                A peer buddy isn&apos;t the right first step if you&apos;re in crisis. These people are trained for exactly this moment.
              </p>
            </div>
          </div>
        </div>

        <h2 className="font-serif text-[19px] mb-3" style={{ color: ink }}>Call someone now</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          {contacts.map((c) => (
            <a key={c.name} href={`tel:${c.number.replace(/[^\d+]/g,"")}`}
              className="rounded-2xl p-4 flex items-start gap-3 transition hover:-translate-y-0.5"
              style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#fee2e2" }}>
                <Phone className="w-4 h-4" style={{ color: "#e63946" }}/>
              </div>
              <div className="min-w-0">
                <div className="font-serif text-[14px]" style={{ color: ink }}>{c.name}</div>
                <div className="text-[13px] mt-0.5" style={{ color: primary, fontVariantNumeric: "tabular-nums" }}>{c.number}</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: muted }}>{c.desc}</div>
              </div>
            </a>
          ))}
        </div>

        <h2 className="font-serif text-[19px] mb-3" style={{ color: ink }}>Or reach for someone close</h2>
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <a href="tel:100" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <Phone className="w-4 h-4" style={{ color: "#e63946" }}/>
            <div><div className="font-serif text-[13.5px]" style={{ color: ink }}>Police (100)</div>
              <div className="text-[10.5px]" style={{ color: muted }}>immediate danger</div></div>
          </a>
          <a href="tel:102" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <MapPin className="w-4 h-4" style={{ color: "#e63946" }}/>
            <div><div className="font-serif text-[13.5px]" style={{ color: ink }}>Ambulance (102)</div>
              <div className="text-[10.5px]" style={{ color: muted }}>medical emergency</div></div>
          </a>
          <button onClick={()=>alert("Add trusted contact from Settings → Emergency contacts")} className="text-left rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <UserRound className="w-4 h-4"/>
            <div><div className="font-serif text-[13.5px]" style={{ color: ink }}>Trusted contact</div>
              <div className="text-[10.5px]" style={{ color: muted }}>set one up in settings</div></div>
          </button>
          <Link to="/buddies/psychologists" className="rounded-2xl p-4 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
            <Stethoscope className="w-4 h-4" style={{ color: primary }}/>
            <div><div className="font-serif text-[13.5px]" style={{ color: ink }}>Find a psychologist</div>
              <div className="text-[10.5px]" style={{ color: muted }}>professional care</div></div>
          </Link>
        </div>

        <h2 className="font-serif text-[19px] mb-3" style={{ color: ink }}>In the meantime</h2>
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <Link to="/breathe" className="rounded-2xl p-4 flex flex-col items-start gap-2" style={{ background: surface, border: `1px solid ${border}` }}>
            <Wind className="w-4 h-4" style={{ color: primary }}/>
            <div className="font-serif text-[13.5px]" style={{ color: ink }}>Breathing exercise</div>
            <div className="text-[10.5px]" style={{ color: muted }}>4-7-8 · 2 minutes</div>
          </Link>
          <button onClick={()=>alert("Grounding: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste.")}
            className="text-left rounded-2xl p-4 flex flex-col items-start gap-2" style={{ background: surface, border: `1px solid ${border}` }}>
            <Users className="w-4 h-4" style={{ color: primary }}/>
            <div className="font-serif text-[13.5px]" style={{ color: ink }}>5-4-3-2-1 grounding</div>
            <div className="text-[10.5px]" style={{ color: muted }}>anchor yourself</div>
          </button>
          <Link to="/peacebot" className="rounded-2xl p-4 flex flex-col items-start gap-2" style={{ background: surface, border: `1px solid ${border}` }}>
            <Bot className="w-4 h-4" style={{ color: primary }}/>
            <div className="font-serif text-[13.5px]" style={{ color: ink }}>Talk to Peace Bot</div>
            <div className="text-[10.5px]" style={{ color: muted }}>always awake, gentle</div>
          </Link>
        </div>

        <div className="rounded-3xl p-6 text-center" style={{ background: surface2 }}>
          <p className="text-[13px] italic" style={{ color: ink }}>
            &ldquo;Reaching out is not weakness. It&apos;s the most human thing you&apos;ll do this year.&rdquo;
          </p>
        </div>
      </main>
    </AppShell>
  );
}
