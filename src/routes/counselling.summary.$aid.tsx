import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip, fmtDay, fmtTime } from "./counselling";
import { getAppointment, getExpert, photoFor, updateAppointment, addHomework, listHomework } from "@/lib/counselling-store";
import { useMemo, useState } from "react";
import { Check, ArrowRight, Wind, Feather, BookOpen, Target } from "lucide-react";

export const Route = createFileRoute("/counselling/summary/$aid")({
  component: SessionSummary,
});

function SessionSummary() {
  const { aid } = useParams({ from: "/counselling/summary/$aid" });
  const a = getAppointment(aid);
  const e = a ? getExpert(a.expertId) : null;
  const { ink, muted, primary, surface, surface2, border, soft, lavender } = palette;
  const [mood, setMood] = useState<string | null>(a?.moodAfter ?? null);
  const [homeworkAdded, setHomeworkAdded] = useState(listHomework().some(h => h.apptId === aid));

  const suggestions = useMemo(() => e && a ? [
    { title: "Journal for 3 minutes tonight", kind: "reflection" as const, detail: `Write about what surprised you in today's session with ${e.name.split(" ").slice(-1)[0]}.` },
    { title: "Box breathing before you study", kind: "breathing" as const, detail: "5 minutes, twice this week." },
    { title: "One walk without your phone", kind: "habit" as const, detail: "20 minutes, any time this week." },
  ] : [], [e, a]);

  if (!a || !e) return <Card><div className="font-serif text-[20px]" style={{ color: ink }}>Session not found.</div></Card>;

  const setMoodAfter = (m: string) => { setMood(m); updateAppointment(a.id, { moodAfter: m }); };

  const addAll = () => {
    suggestions.forEach(s => addHomework({ apptId: a.id, expertId: e.id, title: s.title, kind: s.kind, detail: s.detail, due: Date.now() + 7 * 86400_000 }));
    setHomeworkAdded(true);
  };

  const iconFor = (k: string) => k === "breathing" ? Wind : k === "reflection" ? Feather : k === "reading" ? BookOpen : Target;

  return (
    <>
      <Card className="mb-4" style={{ background: `linear-gradient(180deg, ${lavender} 0%, ${surface} 60%)` }}>
        <div className="flex items-center gap-3">
          <img src={photoFor(e.id)} alt="" className="w-14 h-14 rounded-2xl" style={{ background: surface2 }} />
          <div className="flex-1">
            <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Session complete</div>
            <div className="font-serif text-[24px]" style={{ color: ink }}>Thank you for showing up.</div>
            <div className="text-[13px]" style={{ color: muted }}>{fmtDay(a.scheduledFor)} · {fmtTime(a.scheduledFor)} · with {e.name}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="font-serif text-[19px] mb-2" style={{ color: ink }}>What we noticed together</div>
          <ul className="space-y-2 text-[14px]" style={{ color: ink }}>
            {(() => {
              const q = a.questionnaire;
              const notes: string[] = [];
              notes.push(`You came in for ${q?.primaryConcern?.toLowerCase() || "what you're carrying right now"} and stayed with it.`);
              if (q && q.stress >= 7) notes.push("Stress was running high before we met — noticing it is already part of the work.");
              else if (q && q.stress <= 3) notes.push("You arrived steadier than you gave yourself credit for.");
              if (q && q.sleep < 6) notes.push("Sleep, not effort, looks like the current bottleneck.");
              else if (q && q.sleep >= 7) notes.push("Your sleep is holding — a quiet base to build on.");
              if (q?.appetite === "poor") notes.push("Appetite is low too. Small, regular meals help more than perfect ones.");
              if (q?.goals) notes.push(`Your goal — “${q.goals}” — will guide the next few sessions.`);
              return notes.slice(0, 4).map((t, i) => (
                <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 flex-none" style={{ color: primary }} />{t}</li>
              ));
            })()}
          </ul>
          <div className="mt-4 rounded-2xl p-3" style={{ background: surface2 }}>
            <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Counsellor's note</div>
            <p className="text-[13.5px]" style={{ color: ink }}>
              {a.questionnaire?.sleep !== undefined && a.questionnaire.sleep < 6
                ? "Small steps this week. If sleep isn't better by Wednesday, message me."
                : a.questionnaire && a.questionnaire.stress >= 7
                ? "Try the breathing homework twice this week. Message me if anything spikes."
                : "You're doing the work. Message me if anything shifts between sessions."}
            </p>
          </div>
        </Card>

        <Card>
          <div className="font-serif text-[19px] mb-2" style={{ color: ink }}>How are you feeling now?</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {["lighter","tender","tired but seen","reflective","unsure","hopeful"].map(m => (
              <Chip key={m} active={mood === m} onClick={() => setMoodAfter(m)}>{m}</Chip>
            ))}
          </div>
          <div className="font-serif text-[16px] mb-2" style={{ color: ink }}>Suggested homework</div>
          <div className="space-y-2">
            {suggestions.map((s, i) => {
              const Icon = iconFor(s.kind);
              return (
                <div key={i} className="rounded-2xl p-3 flex items-start gap-3" style={{ border: `1px solid ${border}` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: soft }}>
                    <Icon className="w-4 h-4" style={{ color: primary }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px]" style={{ color: ink }}>{s.title}</div>
                    <div className="text-[12px]" style={{ color: muted }}>{s.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {!homeworkAdded ? (
            <button onClick={addAll} className="mt-4 w-full rounded-full py-2.5 text-[13.5px]" style={{ background: ink, color: "#fff" }}>Add to my homework</button>
          ) : (
            <div className="mt-4 rounded-2xl p-3 text-center text-[13px]" style={{ background: "#eaf6ea", color: "#2f6a37" }}>Added to your homework · <Link to="/counselling/homework" className="underline">open</Link></div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="font-serif text-[17px] mb-1" style={{ color: ink }}>Book a follow-up</div>
          <p className="text-[13px] mb-3" style={{ color: muted }}>Momentum matters. Most students see the biggest change between session two and four.</p>
          <Link to="/counselling/book/$id" params={{ id: e.id }} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]" style={{ background: ink, color: "#fff" }}>
            Book next session <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
        <Card>
          <div className="font-serif text-[17px] mb-1" style={{ color: ink }}>Recommended resources</div>
          <p className="text-[13px] mb-3" style={{ color: muted }}>A short read your counsellor thought might land.</p>
          <Link to="/counselling/resources" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
            Open resources <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      </div>
    </>
  );
}
