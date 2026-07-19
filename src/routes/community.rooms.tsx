import { createFileRoute, Link } from "@tanstack/react-router";
import { Volume2 } from "lucide-react";
import { cmy } from "@/lib/community-theme";
import { useCommunity } from "@/lib/community-store";

export const Route = createFileRoute("/community/rooms")({ component: RoomsPage });

function RoomsPage() {
  const { rooms } = useCommunity();

  return (
    <main className="relative z-10 max-w-[1280px] mx-auto px-5 lg:px-10 pt-6 lg:pt-10 pb-24">
      <header className="mb-6 lg:mb-10">
        <div className="text-[9px] tracking-[0.32em] uppercase mb-3" style={{ color: cmy.muted }}>the circle · live rooms</div>
        <h1 className="font-serif text-[clamp(1.6rem,5vw,2.6rem)] tracking-tight leading-[1.05]">voices, held together — in real time.</h1>
        <p className="mt-3 max-w-[560px] text-[13px] leading-relaxed" style={{ color: cmy.muted }}>
          rooms are for presence, not performance. arrive quietly. raise a hand if you want to speak.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {rooms.map((r) => (
          <Link key={r.id} to={`/community/rooms/${r.id}`}
                className="group relative text-left overflow-hidden rounded-[28px] p-7 transition duration-300 hover:-translate-y-1"
                style={{ background: cmy.surface, border: `1px solid ${cmy.border}`, boxShadow: "0 1px 2px rgba(29,42,68,0.03)" }}>
            <div className="absolute right-5 top-5 flex items-end gap-[3px] h-9">
              {[0.4,0.7,0.55,0.9,0.6,0.85,0.5,0.75,0.4].map((h, i) => (
                <span key={i} className="w-[3px] rounded-full"
                      style={{ height: `${h*100}%`, background: cmy.primary, opacity: 0.7, animation: `wf 1.4s ease-in-out ${i*0.12}s infinite` }}/>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-5">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#EF6B6B", opacity: 0.6 }}/>
                <span className="relative rounded-full w-2 h-2" style={{ background: "#EF6B6B" }}/>
              </span>
              <span className="text-[10px] tracking-[0.32em] uppercase" style={{ color: cmy.muted }}>live · {r.tag}</span>
            </div>

            <h3 className="font-serif text-[26px] leading-[1.05] tracking-tight max-w-[380px]">{r.name}</h3>
            <p className="mt-3 text-[13.5px] leading-relaxed max-w-[420px]" style={{ color: cmy.muted }}>{r.topic}</p>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[cmy.sky, cmy.lavender, cmy.mint].map((c, i) => (
                    <span key={i} className="w-8 h-8 rounded-full border-2" style={{ background: c, borderColor: cmy.surface }}/>
                  ))}
                </div>
                <div className="text-[11.5px]" style={{ color: cmy.muted }}>
                  <div style={{ color: cmy.ink }}>{r.host}</div>
                  <div>{r.listeners} listening · started {r.started}</div>
                </div>
              </div>
              <span className="rounded-full h-10 px-4 flex items-center gap-2 text-[12px] tracking-wide transition group-hover:translate-x-0.5"
                    style={{ background: cmy.ink, color: "#F7FAFF" }}>
                <Volume2 className="w-3.5 h-3.5" strokeWidth={1.6}/> tune in
              </span>
            </div>
          </Link>
        ))}
        <style>{`@keyframes wf { 0%,100% { transform: scaleY(0.5); } 50% { transform: scaleY(1); } }`}</style>
      </div>
    </main>
  );
}
