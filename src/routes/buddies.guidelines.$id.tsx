import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { getBuddy, avatarFor } from "@/lib/buddies-store";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/buddies/guidelines/$id")({
  component: Guidelines,
});

const rules = [
  { title: "Peers, not therapists", body: "Peace Buddies are trained students, not licensed mental health professionals." },
  { title: "Be kind", body: "Speak to your buddy the way you'd want to be spoken to on a hard day." },
  { title: "Confidentiality", body: "What you share here stays here — unless someone's safety is at risk." },
  { title: "Personal information", body: "You never have to share more than you're comfortable with. First names are fine." },
  { title: "Community respect", body: "No harassment, no shaming, no discrimination — of any kind." },
  { title: "In immediate danger?", body: "Call emergency services or use the always-visible emergency help." },
];

function Guidelines() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const b = getBuddy(id);
  const { surface, surface2, border, ink, muted, primary, soft } = palette;
  const [agreed, setAgreed] = useState(false);

  if (!b) return <AppShell><main className="p-10 text-center">Buddy not found. <Link to="/buddies/browse" className="underline">browse</Link></main></AppShell>;

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies/$id" params={{ id }} className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back to profile
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <img src={avatarFor(b.id)} className="w-12 h-12 rounded-2xl" alt=""/>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>you&apos;re about to talk to</div>
            <div className="font-serif text-[18px]" style={{ color: ink }}>{b.name}</div>
          </div>
        </div>

        <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight mb-2" style={{ color: ink }}>Before we begin</h1>
        <p className="text-[13px] mb-6" style={{ color: muted }}>A few small things — so this stays safe for both of you.</p>

        <div className="space-y-3 mb-8">
          {rules.map((r, i) => (
            <div key={r.title} className="rounded-2xl p-4 flex gap-4" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-[13px] shrink-0" style={{ background: soft, color: primary }}>{i+1}</div>
              <div><div className="font-serif text-[14px]" style={{ color: ink }}>{r.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: muted }}>{r.body}</div></div>
            </div>
          ))}
        </div>

        <label className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer mb-4" style={{ background: surface2, border: `1px solid ${border}` }}>
          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: agreed ? ink : surface, border: `1px solid ${border}` }}>
            {agreed && <Check className="w-3 h-3" style={{ color: surface }}/>}
          </div>
          <input type="checkbox" checked={agreed} onChange={(e)=>setAgreed(e.target.checked)} className="sr-only"/>
          <div className="text-[13px]" style={{ color: ink }}>
            I understand — my buddy is a peer, not a therapist. I&apos;ll be kind, and I&apos;ll reach for emergency help if I need it.
          </div>
        </label>

        <div className="flex gap-2">
          <Link to="/buddies/$id" params={{ id }} className="px-5 py-3 rounded-full text-[12px]" style={{ background: surface2, color: ink }}>Cancel</Link>
          <button disabled={!agreed}
            onClick={()=>navigate({ to: "/buddies/safety/$id", params: { id } })}
            className="flex-1 px-5 py-3 rounded-full text-[12px] flex items-center justify-center gap-1.5 transition"
            style={{ background: agreed ? ink : surface2, color: agreed ? surface : muted, opacity: agreed ? 1 : 0.6 }}>
            Continue <ArrowRight className="w-3.5 h-3.5"/>
          </button>
        </div>
      </main>
    </AppShell>
  );
}
