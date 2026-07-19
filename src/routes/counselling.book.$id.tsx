import { createFileRoute, Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip, rupee, fmtDay, fmtTime } from "./counselling";
import { getExpert, photoFor, upcomingSlots, createAppointment, updateAppointment, addInvoice, type Mode, type Questionnaire } from "@/lib/counselling-store";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CalendarClock, Video, Phone, MessageSquare, CreditCard, Wallet, ShieldCheck } from "lucide-react";
import { z } from "zod";

const search = z.object({ ts: z.number().optional() });

export const Route = createFileRoute("/counselling/book/$id")({
  validateSearch: (s) => search.parse(s),
  component: BookFlow,
});

type Step = 1 | 2 | 3 | 4 | 5 | 6;

function BookFlow() {
  const { id } = useParams({ from: "/counselling/book/$id" });
  const { ts } = useSearch({ from: "/counselling/book/$id" });
  const e = getExpert(id);
  const navigate = useNavigate();
  const { ink, muted, primary, surface, surface2, border, soft } = palette;

  const [step, setStep] = useState<Step>(1);
  const [selectedTs, setSelectedTs] = useState<number | undefined>(ts);
  const [mode, setMode] = useState<Mode>("video");
  const [duration, setDuration] = useState<45 | 60>(45);
  const [language, setLanguage] = useState(e?.languages[0] ?? "English");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [q, setQ] = useState<Questionnaire>({
    primaryConcern: "", currentMood: "okay", stress: 5, sleep: 7, appetite: "okay",
    medications: "None", previousTherapy: false, goals: "", pronouns: "he/him",
    emergencyContact: "", anythingElse: "",
  });
  const [consent, setConsent] = useState({ privacy: false, recording: false, emergency: false, cancellation: false, digital: false });
  const [payment, setPayment] = useState<"upi" | "card" | "netbanking" | "wallet">("upi");
  const [apptId, setApptId] = useState<string | null>(null);

  const slots = useMemo(() => e ? upcomingSlots(e.id, 14, 80) : [], [e]);
  const byDay = useMemo(() => {
    const g: Record<string, { slot: string; ts: number }[]> = {};
    slots.forEach(s => { (g[s.label] ??= []).push({ slot: s.slot, ts: s.ts }); });
    return g;
  }, [slots]);

  if (!e) {
    return <Card><div className="font-serif text-[20px]" style={{ color: ink }}>Counsellor not found.</div></Card>;
  }

  const fee = duration === 60 ? Math.round(e.fees * 1.3) : e.fees;

  const canAdvance = () => {
    if (step === 1) return !!selectedTs;
    if (step === 2) return !!reason.trim();
    if (step === 3) return q.primaryConcern.trim() && q.goals.trim() && q.emergencyContact.trim();
    if (step === 4) return consent.privacy && consent.emergency && consent.cancellation && consent.digital;
    if (step === 5) return true; // payment placeholder
    return false;
  };

  const confirmBooking = () => {
    if (!selectedTs) return;
    const a = createAppointment({
      expertId: e.id, scheduledFor: selectedTs, mode, language, reason, duration, fee,
      questionnaire: q, notes,
      consent: { ...consent, signedAt: Date.now() },
    });
    updateAppointment(a.id, { status: "confirmed", paid: true, paymentMethod: payment });
    addInvoice({ apptId: a.id, expertId: e.id, amount: fee, status: "paid", method: payment, when: Date.now() });
    setApptId(a.id);
    setStep(6);
  };

  const StepDot = ({ n, label }: { n: number; label: string }) => {
    const done = step > n; const active = step === n;
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: done ? primary : active ? ink : surface2, color: done || active ? "#fff" : muted, border: `1px solid ${done ? primary : active ? ink : border}` }}>
          {done ? <Check className="w-3.5 h-3.5" /> : n}
        </div>
        <div className="text-[11.5px] hidden sm:block" style={{ color: active ? ink : muted }}>{label}</div>
      </div>
    );
  };

  return (
    <>
      <Link to="/counselling/expert/$id" params={{ id: e.id }} className="inline-flex items-center gap-1.5 text-[12.5px] mb-3" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
      </Link>

      {/* Header */}
      <Card className="mb-4">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex">
          <img src={photoFor(e.id)} alt="" className="w-12 h-12 shrink-0 rounded-2xl" style={{ background: surface2 }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Booking</div>
            <div className="font-serif text-[20px]" style={{ color: ink }}>{e.name}</div>
          </div>
          <div className="hidden sm:flex shrink-0 items-center gap-3">
            <StepDot n={1} label="Slot" />
            <div className="w-6 h-px" style={{ background: border }} />
            <StepDot n={2} label="Details" />
            <div className="w-6 h-px" style={{ background: border }} />
            <StepDot n={3} label="Intake" />
            <div className="w-6 h-px" style={{ background: border }} />
            <StepDot n={4} label="Consent" />
            <div className="w-6 h-px" style={{ background: border }} />
            <StepDot n={5} label="Pay" />
          </div>
        </div>
      </Card>

      {/* Step content */}
      {step === 1 && (
        <Card>
          <div className="font-serif text-[20px] sm:text-[22px] mb-1" style={{ color: ink }}>Choose a time that works for you.</div>
          <p className="text-[13.5px] mb-4" style={{ color: muted }}>All slots shown are open in the next two weeks. You can reschedule up to 4 hours before.</p>

          <div className="grid sm:grid-cols-3 gap-2 mb-4">
            {([{ v: "video", i: Video, l: "Video" }, { v: "audio", i: Phone, l: "Audio" }, { v: "chat", i: MessageSquare, l: "Chat" }] as const)
              .filter(m => e.modes.includes(m.v as Mode))
              .map(m => (
                <button key={m.v} onClick={() => setMode(m.v as Mode)} className="rounded-2xl p-3 text-left flex items-center gap-3" style={{ background: mode === m.v ? ink : surface, color: mode === m.v ? "#fff" : ink, border: `1px solid ${mode === m.v ? ink : border}` }}>
                  <m.i className="w-4 h-4" />
                  <div>
                    <div className="text-[13.5px]">{m.l}</div>
                    <div className="text-[11px] opacity-80">{m.v === "video" ? "Face to face" : m.v === "audio" ? "Voice only" : "Text-based"}</div>
                  </div>
                </button>
              ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 mb-4">
            {([45, 60] as const).map(d => (
              <button key={d} onClick={() => setDuration(d)} className="rounded-2xl p-3 text-left" style={{ background: duration === d ? ink : surface, color: duration === d ? "#fff" : ink, border: `1px solid ${duration === d ? ink : border}` }}>
                <div className="text-[13.5px]">{d} minutes</div>
                <div className="text-[11px] opacity-80">{d === 45 ? "Standard session" : "Extended session"} · {rupee(d === 60 ? Math.round(e.fees * 1.3) : e.fees)}</div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl p-3 sm:p-4" style={{ border: `1px solid ${border}` }}>
            <div className="text-[10.5px] uppercase tracking-[0.18em] mb-3" style={{ color: muted }}>Pick a slot</div>
            <div className="space-y-4 max-h-none overflow-visible pr-0 sm:max-h-[380px] sm:overflow-y-auto sm:pr-1">
              {Object.entries(byDay).map(([day, arr]) => (
                <div key={day}>
                  <div className="flex items-center gap-1.5 text-[12.5px] mb-1.5" style={{ color: ink }}>
                    <CalendarClock className="w-3.5 h-3.5" style={{ color: primary }} /> {day}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {arr.map(s => {
                      const active = selectedTs === s.ts;
                      return (
                        <button key={s.ts} onClick={() => setSelectedTs(s.ts)} className="rounded-full px-3 py-1.5 text-[12px]" style={{ background: active ? ink : surface2, color: active ? "#fff" : ink, border: `1px solid ${active ? ink : border}` }}>
                          {s.slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
              <div className="font-serif text-[20px] sm:text-[22px] mb-1" style={{ color: ink }}>A few quick details.</div>
          <p className="text-[13.5px] mb-4" style={{ color: muted }}>These help your counsellor prepare for your first session.</p>

          <Field label="Language for the session">
            <div className="flex flex-wrap gap-1.5">
              {e.languages.map(l => <Chip key={l} active={language === l} onClick={() => setLanguage(l)}>{l}</Chip>)}
            </div>
          </Field>

          <Field label="What brings you here?">
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} placeholder="A few sentences is more than enough." className="w-full rounded-2xl p-3 text-[14px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
          </Field>

          <Field label="Anything you want your counsellor to know? (optional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full rounded-2xl p-3 text-[14px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
          </Field>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <div className="font-serif text-[20px] sm:text-[22px] mb-1" style={{ color: ink }}>Pre-session intake.</div>
          <p className="text-[13.5px] mb-4" style={{ color: muted }}>You can answer briefly. Nothing here is shared beyond your counsellor.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Primary concern">
              <input value={q.primaryConcern} onChange={e => setQ({ ...q, primaryConcern: e.target.value })} className="w-full rounded-2xl p-3 text-[14px] outline-none" style={{ background: surface, border: `1px solid ${border}`, color: ink }} placeholder="e.g. exam anxiety, sleep, relationships" />
            </Field>
            <Field label="How's your mood right now?">
              <div className="flex flex-wrap gap-1.5">
                {(["low","okay","good","great"] as const).map(m => <Chip key={m} active={q.currentMood === m} onClick={() => setQ({ ...q, currentMood: m })}>{m}</Chip>)}
              </div>
            </Field>
            <Field label={`Stress level · ${q.stress}/10`}>
              <input type="range" min={0} max={10} value={q.stress} onChange={e => setQ({ ...q, stress: parseInt(e.target.value) })} className="w-full" />
            </Field>
            <Field label={`Average sleep · ${q.sleep}h`}>
              <input type="range" min={0} max={12} value={q.sleep} onChange={e => setQ({ ...q, sleep: parseInt(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Appetite">
              <div className="flex gap-1.5">
                {(["good","okay","poor"] as const).map(a => <Chip key={a} active={q.appetite === a} onClick={() => setQ({ ...q, appetite: a })}>{a}</Chip>)}
              </div>
            </Field>
            <Field label="Any medications">
              <input value={q.medications} onChange={e => setQ({ ...q, medications: e.target.value })} className="w-full rounded-2xl p-3 text-[14px] outline-none" style={{ background: surface, border: `1px solid ${border}`, color: ink }} />
            </Field>
            <Field label="Previous therapy">
              <div className="flex gap-1.5">
                <Chip active={q.previousTherapy} onClick={() => setQ({ ...q, previousTherapy: true })}>Yes</Chip>
                <Chip active={!q.previousTherapy} onClick={() => setQ({ ...q, previousTherapy: false })}>No</Chip>
              </div>
            </Field>
            <Field label="Preferred pronouns">
              <div className="flex flex-wrap gap-1.5">
                {["she/her","he/him","they/them"].map(p => <Chip key={p} active={q.pronouns === p} onClick={() => setQ({ ...q, pronouns: p })}>{p}</Chip>)}
              </div>
            </Field>
            <Field label="Goals for this work">
              <textarea value={q.goals} onChange={e => setQ({ ...q, goals: e.target.value })} rows={2} className="w-full rounded-2xl p-3 text-[14px] outline-none" style={{ background: surface, border: `1px solid ${border}`, color: ink }} placeholder="Even a rough one is fine." />
            </Field>
            <Field label="Emergency contact (name & number)">
              <input value={q.emergencyContact} onChange={e => setQ({ ...q, emergencyContact: e.target.value })} className="w-full rounded-2xl p-3 text-[14px] outline-none" style={{ background: surface, border: `1px solid ${border}`, color: ink }} placeholder="Someone we can reach in crisis." />
            </Field>
          </div>
          <Field label="Anything else you'd like us to know?">
            <textarea value={q.anythingElse ?? ""} onChange={e => setQ({ ...q, anythingElse: e.target.value })} rows={2} className="w-full rounded-2xl p-3 text-[14px] outline-none" style={{ background: surface, border: `1px solid ${border}`, color: ink }} />
          </Field>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <div className="font-serif text-[20px] sm:text-[22px] mb-1" style={{ color: ink }}>Your privacy and consent.</div>
          <p className="text-[13.5px] mb-4" style={{ color: muted }}>Please read and confirm.</p>
          <div className="space-y-2">
            {[
              { k: "privacy" as const, t: "Privacy policy", d: "Your notes are encrypted at rest and never shared without your permission." },
              { k: "recording" as const, t: "Session recording (optional)", d: "We do not record sessions by default. If we ever do, we'll ask first." },
              { k: "emergency" as const, t: "Emergency policy", d: "If you're at immediate risk, your counsellor may share the minimum information needed to keep you safe." },
              { k: "cancellation" as const, t: "Cancellation policy", d: e.cancellationPolicy },
              { k: "digital" as const, t: "Digital consent", d: "By continuing, I consent to receive care through PeaceCode." },
            ].map(item => (
              <label key={item.k} className="flex items-start gap-3 rounded-2xl p-3 cursor-pointer" style={{ border: `1px solid ${border}`, background: consent[item.k] ? soft : surface }}>
                <input type="checkbox" checked={consent[item.k]} onChange={ev => setConsent({ ...consent, [item.k]: ev.target.checked })} className="mt-1" />
                <div>
                  <div className="font-serif text-[15.5px]" style={{ color: ink }}>{item.t}</div>
                  <p className="text-[13px]" style={{ color: muted }}>{item.d}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <div className="font-serif text-[20px] sm:text-[22px] mb-1" style={{ color: ink }}>Confirm and pay.</div>
          <p className="text-[13.5px] mb-4" style={{ color: muted }}>This is a demo — no real payment is processed.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] mb-2" style={{ color: muted }}>Order summary</div>
              <div className="rounded-2xl p-4 space-y-2" style={{ border: `1px solid ${border}`, background: surface }}>
                <Row label="Counsellor" value={e.name} />
                <Row label="When" value={`${fmtDay(selectedTs!)} · ${fmtTime(selectedTs!)}`} />
                <Row label="Mode" value={mode} />
                <Row label="Duration" value={`${duration} min`} />
                <Row label="Language" value={language} />
                <div className="pt-2 mt-2 flex justify-between text-[14px] font-medium" style={{ borderTop: `1px solid ${border}`, color: ink }}>
                  <span>Total</span><span>{rupee(fee)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] mb-2" style={{ color: muted }}>Payment method</div>
              <div className="space-y-1.5">
                {([
                  { k: "upi", i: Wallet, l: "UPI · GPay / PhonePe" },
                  { k: "card", i: CreditCard, l: "Credit / Debit card" },
                  { k: "netbanking", i: ShieldCheck, l: "Net banking" },
                  { k: "wallet", i: Wallet, l: "Wallet" },
                ] as const).map(o => (
                  <button key={o.k} onClick={() => setPayment(o.k)} className="w-full flex items-center gap-3 rounded-2xl p-3 text-left" style={{ background: payment === o.k ? ink : surface, color: payment === o.k ? "#fff" : ink, border: `1px solid ${payment === o.k ? ink : border}` }}>
                    <o.i className="w-4 h-4" />
                    <span className="text-[13.5px]">{o.l}</span>
                  </button>
                ))}
              </div>
              <button onClick={confirmBooking} className="mt-4 w-full rounded-full py-2.5 text-[13.5px]" style={{ background: ink, color: "#fff" }}>Pay {rupee(fee)} and confirm</button>
              <p className="mt-2 text-[11.5px] text-center" style={{ color: muted }}>Secure demo payment · no card charged</p>
            </div>
          </div>
        </Card>
      )}

      {step === 6 && apptId && (
        <Card style={{ background: `linear-gradient(180deg, ${soft} 0%, ${surface} 100%)` }}>
          <div className="text-center py-4">
            <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: primary, color: "#fff" }}>
              <Check className="w-6 h-6" />
            </div>
            <div className="font-serif text-[26px] mb-1" style={{ color: ink }}>Your session is confirmed.</div>
            <p className="text-[14px] mb-4" style={{ color: muted }}>{fmtDay(selectedTs!)} at {fmtTime(selectedTs!)} with {e.name}.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/counselling/appt/$aid" params={{ aid: apptId }} className="rounded-full px-4 py-2 text-[13px]" style={{ background: ink, color: "#fff" }}>Open session dashboard</Link>
              <Link to="/counselling" className="rounded-full px-4 py-2 text-[13px]" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>Back to home</Link>
            </div>
          </div>
        </Card>
      )}

      {/* Footer nav */}
      {step < 6 && (
        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <button disabled={step === 1} onClick={() => setStep((step - 1) as Step)} className="rounded-full px-3 sm:px-4 py-2 text-[13px] disabled:opacity-40" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
          </button>
          <div className="text-center text-[12px]" style={{ color: muted }}>Step {step} of 5</div>
          {step < 5 ? (
            <button disabled={!canAdvance()} onClick={() => setStep((step + 1) as Step)} className="rounded-full px-3 sm:px-4 py-2 text-[13px] disabled:opacity-40" style={{ background: ink, color: "#fff" }}>
              Continue <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <div />
          )}
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { muted } = palette;
  return (
    <div className="mb-4">
      <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1.5" style={{ color: muted }}>{label}</div>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  const { ink, muted } = palette;
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-[13px]"><span className="min-w-0" style={{ color: muted }}>{label}</span><span className="min-w-0 text-right" style={{ color: ink }}>{value}</span></div>;
}
