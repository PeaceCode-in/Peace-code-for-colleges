import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card } from "./counselling";
import { Phone, MapPin, MessageSquare, Wind, LifeBuoy } from "lucide-react";
import { EXPERTS, photoFor } from "@/lib/counselling-store";

export const Route = createFileRoute("/counselling/emergency")({
  component: Emergency,
});

const HELPLINES = [
  { name: "iCall (TISS)", desc: "Free psychosocial support · Mon–Sat, 8am–10pm", phone: "9152987821" },
  { name: "AASRA", desc: "24×7 crisis helpline", phone: "9820466726" },
  { name: "Vandrevala Foundation", desc: "24×7, free & confidential", phone: "18602662345" },
  { name: "NIMHANS", desc: "National toll-free helpline", phone: "08046110007" },
];

function Emergency() {
  const { ink, muted, surface, surface2, border } = palette;
  const emergencyExperts = EXPERTS.filter(e => e.emergency);

  return (
    <>
      <div className="mb-4">
        <div className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: "#9a1c1c" }}>You are not alone</div>
        <h1 className="font-serif text-[30px] leading-tight" style={{ color: ink }}>If it feels like too much right now.</h1>
        <p className="text-[14px] mt-1 max-w-xl" style={{ color: muted }}>These lines are free, confidential, and answered by trained humans. You don't have to know what to say.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        {HELPLINES.map(h => (
          <Card key={h.name} style={{ background: "#fff1f0", borderColor: "#f6c9c4" }}>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-none" style={{ background: "#f6d5d1", color: "#9a1c1c" }}><Phone className="w-4 h-4" /></div>
              <div className="flex-1">
                <div className="font-serif text-[17px]" style={{ color: "#7f1616" }}>{h.name}</div>
                <p className="text-[12.5px]" style={{ color: "#9a1c1c" }}>{h.desc}</p>
              </div>
            </div>
            <a href={`tel:${h.phone}`} className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]" style={{ background: "#9a1c1c", color: "#fff" }}>
              <Phone className="w-4 h-4" /> Call {h.phone.replace(/(\d{3,4})(?=\d)/g, "$1 ")}
            </a>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <Link to="/breathe" className="block">
          <Card className="text-center h-full">
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: surface2 }}><Wind className="w-5 h-5" style={{ color: ink }} /></div>
            <div className="mt-3 font-serif text-[16px]" style={{ color: ink }}>Emergency breathing</div>
            <p className="text-[12.5px]" style={{ color: muted }}>Two minutes to bring your body back.</p>
          </Card>
        </Link>
        <Link to="/peacebot" className="block">
          <Card className="text-center h-full">
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: surface2 }}><MessageSquare className="w-5 h-5" style={{ color: ink }} /></div>
            <div className="mt-3 font-serif text-[16px]" style={{ color: ink }}>Talk to Peace Bot</div>
            <p className="text-[12.5px]" style={{ color: muted }}>Someone to listen, right now.</p>
          </Card>
        </Link>
        <a href="https://www.google.com/maps/search/hospital+near+me/" target="_blank" rel="noreferrer" className="block">
          <Card className="text-center h-full">
            <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: surface2 }}><MapPin className="w-5 h-5" style={{ color: ink }} /></div>
            <div className="mt-3 font-serif text-[16px]" style={{ color: ink }}>Nearest hospital</div>
            <p className="text-[12.5px]" style={{ color: muted }}>Open in maps.</p>
          </Card>
        </a>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <LifeBuoy className="w-4 h-4" style={{ color: "#9a1c1c" }} />
          <div className="font-serif text-[17px]" style={{ color: ink }}>Counsellors accepting emergency sessions</div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {emergencyExperts.map(e => (
            <div key={e.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: surface, border: `1px solid ${border}` }}>
              <img src={photoFor(e.id)} alt="" className="w-11 h-11 rounded-2xl" style={{ background: surface2 }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px]" style={{ color: ink }}>{e.name}</div>
                <div className="text-[12px]" style={{ color: muted }}>Responds in ~{e.responseMin} min · {e.languages.slice(0,2).join(", ")}</div>
              </div>
              <Link to="/counselling/book/$id" params={{ id: e.id }} className="rounded-full px-3 py-1.5 text-[12.5px]" style={{ background: ink, color: "#fff" }}>Book</Link>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
