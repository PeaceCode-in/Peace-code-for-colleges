import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Page, BackBar, PageTitle, Card, TextArea } from "@/components/emergency/primitives";
import { logEvent } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { ArrowRight, Check } from "lucide-react";

const { border, muted, ink, primary, soft, surface2 } = palette;

const STEPS = [
  { n: 5, sense: "things you can see", hint: "colours, edges, the window frame…" },
  { n: 4, sense: "things you can touch", hint: "your sleeve, the floor, the chair…" },
  { n: 3, sense: "things you can hear", hint: "traffic, a fan, your own breath…" },
  { n: 2, sense: "things you can smell", hint: "or two smells you'd love right now" },
  { n: 1, sense: "thing you can taste", hint: "or one you enjoyed today" },
];

function Grounding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState<string[]>(Array(STEPS.length).fill(""));
  const cur = STEPS[step];

  const done = step >= STEPS.length;

  const next = () => {
    if (step + 1 >= STEPS.length) {
      try { logEvent({ actions: ["5-4-3-2-1 grounding"], contactsCalled: [], outcome: "supported" }); } catch {}
    }
    setStep((s) => s + 1);
  };

  return (
    <Page>
      <BackBar to="/emergency/calm" label="Back to calm" />
      <PageTitle eyebrow="5-4-3-2-1" title="Return to the room, gently." sub="One sense at a time. You don't have to name them out loud — a whisper or a thought is enough." />

      {!done ? (
        <Card>
          <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>Step {step + 1} of {STEPS.length}</div>
          <div className="font-serif text-[28px] mt-2 leading-tight">Name <span style={{ color: primary }}>{cur.n}</span> {cur.sense}.</div>
          <div className="text-[12.5px] mt-2" style={{ color: muted }}>{cur.hint}</div>

          <div className="mt-5">
            <TextArea
              rows={3}
              value={notes[step]}
              onChange={(e) => {
                const next = [...notes];
                next[step] = e.target.value;
                setNotes(next);
              }}
              placeholder="Optional — soft notes to yourself…"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="text-[12px] disabled:opacity-40"
              style={{ color: muted }}
            >
              Back
            </button>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i <= step ? primary : border }} />
              ))}
            </div>
            <button onClick={next} className="rounded-full h-11 px-5 text-[12.5px] flex items-center gap-2" style={{ background: ink, color: "var(--pc-bg)" }}>
              {step + 1 === STEPS.length ? "Finish" : "Next"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: muted }}>Well done</div>
          <div className="font-serif text-[26px] mt-1">You returned to the room.</div>
          <p className="text-[13px] mt-2" style={{ color: muted }}>That took steadiness. If it helps, do it once more, or move to a soft next step.</p>

          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => { setStep(0); setNotes(Array(STEPS.length).fill("")); }} className="rounded-full h-11 px-5 text-[12.5px]" style={{ background: surface2, border: `1px solid ${border}` }}>Do it again</button>
            <Link to="/emergency/breathe" className="rounded-full h-11 px-5 text-[12.5px] flex items-center" style={{ background: surface2, border: `1px solid ${border}` }}>Try a 60-sec breath</Link>
            <button onClick={() => navigate({ to: "/emergency/confirm", search: { from: "grounding" } })} className="rounded-full h-11 px-5 text-[12.5px] flex items-center gap-2" style={{ background: ink, color: "var(--pc-bg)" }}>
              <Check className="w-3.5 h-3.5"/> I feel steadier
            </button>
          </div>
          {notes.some(Boolean) && (
            <div className="mt-6 rounded-2xl p-4" style={{ background: soft }}>
              <div className="text-[10.5px] tracking-[0.22em] uppercase mb-2" style={{ color: muted }}>Your notes</div>
              <ul className="space-y-1 text-[12.5px]">
                {notes.map((n, i) => n ? <li key={i}><span className="opacity-60">{STEPS[i].n} — </span>{n}</li> : null)}
              </ul>
            </div>
          )}
        </Card>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/emergency/grounding")({ component: Grounding });
