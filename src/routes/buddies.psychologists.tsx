import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { PSYCHOLOGISTS, avatarFor } from "@/lib/buddies-store";
import { ArrowLeft, Sparkles, Star, Clock, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/buddies/psychologists")({
  head: () => ({ meta: [{ title: "Find a psychologist — Professional referral" }] }),
  component: Psychologists,
});

function Psychologists() {
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <div className="rounded-3xl p-6 mb-8" style={{ background: `linear-gradient(120deg, ${soft}, ${lavender})`, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color: muted }}>professional care</div>
          <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight mb-2" style={{ color: ink }}>Find a psychologist</h1>
          <p className="text-[13.5px] max-w-2xl" style={{ color: ink, opacity: 0.75 }}>
            When peer support isn&apos;t enough — and it&apos;s okay when it isn&apos;t — these licensed professionals can help.
            Booking is separate from Peace Buddies to keep the two roles clear.
          </p>
        </div>

        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: "#fef2f2", border: `1px solid ${border}` }}>
          <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "#e63946" }}/>
          <p className="text-[12px]" style={{ color: ink }}>
            In immediate crisis? <Link to="/buddies/emergency" className="underline font-medium">Get emergency help</Link> instead of booking an appointment.
          </p>
        </div>

        <div className="space-y-4">
          {PSYCHOLOGISTS.map((p) => (
            <div key={p.id} className="rounded-3xl p-5 flex flex-col sm:flex-row items-start gap-5" style={{ background: surface, border: `1px solid ${border}` }}>
              <img src={avatarFor(p.id)} className="w-20 h-20 rounded-3xl" style={{ background: surface2 }} alt=""/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif text-[18px]" style={{ color: ink }}>{p.name}</span>
                  {p.verified && <span className="text-[9.5px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: soft, color: primary }}>
                    <Sparkles className="w-2.5 h-2.5"/> verified</span>}
                </div>
                <div className="text-[12px]" style={{ color: muted }}>{p.title}</div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {p.specializations.map((s) => (
                    <span key={s} className="text-[10.5px] px-2.5 py-0.5 rounded-full" style={{ background: surface2, color: ink }}>{s}</span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 mt-3 text-[11px]" style={{ color: muted }}>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" fill="currentColor" style={{ color: primary }}/> {p.rating} · {p.sessions.toLocaleString()} sessions</span>
                  <span>Languages: {p.languages.join(", ")}</span>
                  <span>Mode: {p.mode.join(" / ")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> next: {p.next}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-[11px]" style={{ color: muted }}>from</div>
                <div className="font-serif text-[19px]" style={{ color: ink }}>₹{p.fee}</div>
                <div className="flex gap-2">
                  <button onClick={()=>alert(`Emergency consultation with ${p.name} — connecting…`)} className="px-3 py-2 rounded-full text-[11px]" style={{ background: "#fee2e2", color: "#e63946" }}>Urgent</button>
                  <button onClick={()=>alert(`Booked ${p.name} — details sent to your PeaceCode inbox.`)} className="px-4 py-2 rounded-full text-[11px]" style={{ background: ink, color: surface }}>Book appointment</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
