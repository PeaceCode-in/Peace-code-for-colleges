import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { getBuddy, avatarFor, createSession, upcomingSlots, isBuddyAvailable } from "@/lib/buddies-store";
import { ArrowLeft, ArrowRight, ShieldAlert, Clock } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/buddies/safety/$id")({
  component: Safety,
});

const moods = ["😊 okay","😐 flat","😔 low","😰 anxious","😢 heavy","😴 tired","😤 frustrated"];
const energies = ["low","medium","high"];
const reasons = ["Academic Stress","Exam Anxiety","Homesickness","Loneliness","Relationships","Career Confusion","Burnout","Motivation","Placement Stress","Hostel Life","Self Confidence","Adjustment Issues","Just want to talk"];
const goals = ["I just want to be heard","I want advice","I want distraction","I want a plan","I don't know yet"];
const urgencies = [
  { label: "Just curious", value: "low" },
  { label: "It's been a hard week", value: "medium" },
  { label: "I'm really struggling", value: "high" },
];

const CRISIS = ["Suicidal thoughts", "Self harm", "Immediate danger", "Abuse", "Medical emergency"];

function Safety() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const b = getBuddy(id);
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;

  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState("");
  const [reason, setReason] = useState("");
  const [goal, setGoal] = useState("");
  const [urgency, setUrgency] = useState("");
  const [slotTs, setSlotTs] = useState<number | null>(null);
  const [crisisChecked, setCrisisChecked] = useState<string[]>([]);

  const slots = useMemo(() => (b ? upcomingSlots(b.id, 7, 8) : []), [b]);
  const available = b ? isBuddyAvailable(b.id) : false;

  if (!b) return <AppShell><main className="p-10 text-center">Buddy not found.</main></AppShell>;

  const isCrisis = crisisChecked.length > 0;
  const ready = mood && energy && reason && goal && urgency && slotTs && !isCrisis && available;

  const proceed = () => {
    const chosen = slots.find(s => s.ts === slotTs);
    const s = createSession({
      buddyId: id, moodBefore: mood, topic: reason, goal, urgency,
      scheduledFor: chosen?.ts, slotLabel: chosen ? `${chosen.label} · ${chosen.slot}` : undefined,
    });
    navigate({ to: "/buddies/request/$id", params: { id: s.id } });
  };


  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies/guidelines/$id" params={{ id }} className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <img src={avatarFor(b.id)} className="w-12 h-12 rounded-2xl" alt=""/>
          <div><div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>starting with</div>
            <div className="font-serif text-[18px]" style={{ color: ink }}>{b.name}</div></div>
        </div>

        <h1 className="font-serif text-[clamp(1.7rem,3.5vw,2.3rem)] leading-tight mb-2" style={{ color: ink }}>Quick check-in</h1>
        <p className="text-[13px] mb-6" style={{ color: muted }}>Helps your buddy show up the right way.</p>

        <Group label="How are you feeling right now?">
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => <Chip key={m} active={mood===m} onClick={()=>setMood(m)}>{m}</Chip>)}
          </div>
        </Group>

        <Group label="Energy level">
          <div className="flex gap-2">
            {energies.map((e) => <Chip key={e} active={energy===e} onClick={()=>setEnergy(e)}>{e}</Chip>)}
          </div>
        </Group>

        <Group label="What&apos;s this about?">
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => <Chip key={r} active={reason===r} onClick={()=>setReason(r)}>{r}</Chip>)}
          </div>
        </Group>

        <Group label="What do you want from this conversation?">
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => <Chip key={g} active={goal===g} onClick={()=>setGoal(g)}>{g}</Chip>)}
          </div>
        </Group>

        <Group label="How urgent does this feel?">
          <div className="grid sm:grid-cols-3 gap-2">
            {urgencies.map((u) => (
              <button key={u.value} onClick={()=>setUrgency(u.value)}
                className="p-3 rounded-2xl text-[12px] text-left transition"
                style={{ background: urgency===u.value ? ink : surface, color: urgency===u.value ? surface : ink, border: `1px solid ${border}` }}>
                {u.label}
              </button>
            ))}
          </div>
        </Group>

        <Group label="Pick a time that works">
          {!available ? (
            <div className="rounded-2xl p-4 text-[12.5px]" style={{ background: surface, border: `1px solid ${border}`, color: muted }}>
              {b.name.split(" ")[0]} has no open slots this week. <Link to="/buddies/browse" className="underline" style={{ color: ink }}>Try another buddy →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {slots.map((s) => {
                const active = slotTs === s.ts;
                return (
                  <button key={s.ts} onClick={()=>setSlotTs(s.ts)}
                    className="rounded-2xl p-3 text-left transition"
                    style={{ background: active ? ink : surface, color: active ? surface : ink, border: `1px solid ${border}` }}>
                    <div className="text-[9px] uppercase tracking-[0.2em] opacity-70 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5"/> {s.label}
                    </div>
                    <div className="font-serif text-[14px] mt-0.5">{s.slot}</div>
                    {s.isSoon && <div className="text-[9px] mt-1 opacity-70">soon</div>}
                  </button>
                );
              })}
            </div>
          )}
        </Group>



        {/* crisis screen */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: `linear-gradient(120deg, ${soft}, ${lavender})`, border: `1px solid ${border}` }}>
          <div className="flex items-start gap-3 mb-3">
            <ShieldAlert className="w-4 h-4 mt-0.5" style={{ color: primary }}/>
            <div><div className="font-serif text-[14px]" style={{ color: ink }}>Are any of these true right now?</div>
              <div className="text-[11px]" style={{ color: muted }}>Tick anything that applies — you&apos;ll get the right kind of help.</div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CRISIS.map((c) => {
              const on = crisisChecked.includes(c);
              return <button key={c} onClick={()=>setCrisisChecked(on ? crisisChecked.filter(x=>x!==c) : [...crisisChecked, c])}
                className="text-[11px] px-3 py-1.5 rounded-full" style={{ background: on ? primary : surface, color: on ? surface : ink, border: `1px solid ${border}` }}>{c}</button>;
            })}
          </div>
          {isCrisis && (
            <div className="mt-4 rounded-2xl p-4" style={{ background: surface }}>
              <p className="text-[13px] mb-3" style={{ color: ink }}>
                A peer buddy isn&apos;t the right first step here — but you&apos;re not alone. We&apos;ll take you to emergency help now.
              </p>
              <Link to="/buddies/emergency" className="inline-block px-5 py-2.5 rounded-full text-[12px]" style={{ background: primary, color: surface }}>
                Get emergency help →
              </Link>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link to="/buddies/guidelines/$id" params={{ id }} className="px-5 py-3 rounded-full text-[12px]" style={{ background: surface2, color: ink }}>Back</Link>
          <button disabled={!ready} onClick={proceed}
            className="flex-1 px-5 py-3 rounded-full text-[12px] flex items-center justify-center gap-1.5"
            style={{ background: ready ? ink : surface2, color: ready ? surface : muted, opacity: ready ? 1 : 0.6 }}>
            Send request to {b.name.split(" ")[0]} <ArrowRight className="w-3.5 h-3.5"/>
          </button>
        </div>
      </main>
    </AppShell>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const { muted } = palette;
  return <div className="mb-6"><div className="text-[10px] tracking-[0.3em] uppercase mb-2.5" style={{ color: muted }}>{label}</div>{children}</div>;
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  const { surface, ink, border } = palette;
  return <button onClick={onClick} className="text-[12px] px-3 py-1.5 rounded-full transition"
    style={{ background: active ? ink : surface, color: active ? surface : ink, border: `1px solid ${border}` }}>{children}</button>;
}
