import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Page, BackBar, PageTitle, Card } from "@/components/emergency/primitives";
import { palette } from "@/components/AppShell";
import { logEvent } from "@/lib/emergency-store";
import { Pause, Play, RotateCcw, Check } from "lucide-react";

const { border, muted, ink, primary, soft, surface2 } = palette;

// 4-4-4-4 box breathing for 60s → 4 cycles of 16s = 64s (~60s felt).
const PHASES = [
  { key: "in",   label: "Breathe in",   secs: 4 },
  { key: "hold", label: "Hold",         secs: 4 },
  { key: "out",  label: "Breathe out",  secs: 4 },
  { key: "rest", label: "Rest",         secs: 4 },
] as const;

function Breathe() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<number | null>(null);
  const TOTAL = 60;

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= TOTAL) {
          setRunning(false);
          setDone(true);
          try { logEvent({ actions: ["60-second breathing"], contactsCalled: [], outcome: "supported" }); } catch {}
          return TOTAL;
        }
        return e + 1;
      });
    }, 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);

  const phaseIndex = Math.floor((elapsed % 16) / 4);
  const phase = PHASES[phaseIndex];
  const phaseProgress = (elapsed % 4) / 4;
  const scale = phase.key === "in" ? 0.55 + phaseProgress * 0.4
              : phase.key === "hold" ? 0.95
              : phase.key === "out" ? 0.95 - phaseProgress * 0.4
              : 0.55;

  const reset = () => { setRunning(false); setElapsed(0); setDone(false); };

  return (
    <Page>
      <BackBar to="/emergency/calm" label="Back to calm" />
      <PageTitle eyebrow="60-second breath" title="Follow the circle." sub="In through the nose, out through the mouth. If your mind wanders, that's okay — softly return." />

      <Card className="flex flex-col items-center py-10">
        <div className="relative w-[260px] h-[260px] flex items-center justify-center">
          <div
            className="absolute rounded-full transition-transform duration-1000 ease-in-out"
            style={{
              width: 240, height: 240,
              background: `radial-gradient(circle, ${soft}, transparent 70%)`,
              transform: `scale(${scale})`,
            }}
          />
          <div
            className="w-40 h-40 rounded-full flex items-center justify-center transition-transform duration-1000 ease-in-out"
            style={{
              background: "var(--pc-surface)",
              border: `1px solid ${border}`,
              transform: `scale(${scale})`,
              color: ink,
            }}
          >
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>{done ? "well done" : phase.label}</div>
              <div className="font-serif text-[26px] mt-1">{done ? "🌿" : `${Math.max(0, phase.secs - Math.floor(phaseProgress * phase.secs))}`}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-[12px]" style={{ color: muted }}>{elapsed}s / 60s</div>

        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {!done ? (
            <>
              <button onClick={() => setRunning((r) => !r)} className="inline-flex items-center gap-2 rounded-full h-11 px-6 text-[12.5px]" style={{ background: ink, color: "var(--pc-bg)" }}>
                {running ? <><Pause className="w-3.5 h-3.5"/> Pause</> : <><Play className="w-3.5 h-3.5"/> {elapsed ? "Resume" : "Begin"}</>}
              </button>
              <button onClick={reset} className="inline-flex items-center gap-2 rounded-full h-11 px-5 text-[12.5px]" style={{ background: surface2, border: `1px solid ${border}` }}>
                <RotateCcw className="w-3.5 h-3.5"/> Restart
              </button>
            </>
          ) : (
            <>
              <button onClick={reset} className="inline-flex items-center gap-2 rounded-full h-11 px-5 text-[12.5px]" style={{ background: surface2, border: `1px solid ${border}` }}>
                <RotateCcw className="w-3.5 h-3.5"/> Once more
              </button>
              <button onClick={() => navigate({ to: "/emergency/confirm", search: { from: "breathe" } })} className="inline-flex items-center gap-2 rounded-full h-11 px-5 text-[12.5px]" style={{ background: ink, color: "var(--pc-bg)" }}>
                <Check className="w-3.5 h-3.5"/> I feel a little better
              </button>
            </>
          )}
        </div>
      </Card>

      <div className="mt-6 text-center text-[12.5px]" style={{ color: muted }}>
        Want a longer session? <Link to="/breathe" style={{ color: primary }}>Open the breathing library</Link>.
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/emergency/breathe")({ component: Breathe });
