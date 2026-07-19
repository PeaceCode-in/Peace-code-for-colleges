import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, palette } from "@/components/AppShell";
import { getSession, getBuddy, avatarFor, upsertSession } from "@/lib/buddies-store";
import { ArrowLeft, Star, Heart } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/buddies/feedback/$id")({
  component: Feedback,
});

const moods = ["🌤 lighter","🙂 okay","😌 calmer","💭 thinking","😔 still heavy"];

function Feedback() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const session = getSession(id);
  const b = session ? getBuddy(session.buddyId) : null;
  const { surface, surface2, border, ink, muted, primary, soft, lavender } = palette;

  const [moodAfter, setMoodAfter] = useState("");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [again, setAgain] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState("");

  if (!session || !b) return <AppShell><main className="p-10 text-center">Session not found.</main></AppShell>;

  const submit = () => {
    session.moodAfter = moodAfter; session.rating = rating; session.feedback = feedback; session.wouldTalkAgain = again ?? undefined;
    upsertSession(session);
    navigate({ to: "/buddies/history" });
  };

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
        <Link to="/buddies" className="text-[11px] flex items-center gap-1 mb-5" style={{ color: muted }}>
          <ArrowLeft className="w-3 h-3"/> back
        </Link>

        <div className="rounded-3xl p-6 mb-6 flex items-center gap-4" style={{ background: `linear-gradient(120deg, ${soft}, ${lavender})`, border: `1px solid ${border}` }}>
          <img src={avatarFor(b.id)} className="w-16 h-16 rounded-2xl" style={{ background: surface }} alt=""/>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase" style={{ color: muted }}>you just talked with</div>
            <div className="font-serif text-[20px]" style={{ color: ink }}>{b.name}</div>
            <div className="text-[11px]" style={{ color: muted }}>{session.messages.length} messages</div>
          </div>
        </div>

        <h1 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] leading-tight mb-2" style={{ color: ink }}>How was your conversation?</h1>
        <p className="text-[13px] mb-8" style={{ color: muted }}>A tiny check-in — takes 30 seconds.</p>

        <Section label="Your mood now">
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => (
              <button key={m} onClick={()=>setMoodAfter(m)} className="text-[13px] px-3 py-2 rounded-full transition"
                style={{ background: moodAfter===m ? ink : surface, color: moodAfter===m ? surface : ink, border: `1px solid ${border}` }}>{m}</button>
            ))}
          </div>
        </Section>

        <Section label={`Rate ${b.name.split(" ")[0]}`}>
          <div className="flex gap-1">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={()=>setRating(n)} aria-label={`${n} stars`}>
                <Star className="w-8 h-8" fill={n<=rating ? "currentColor" : "none"} style={{ color: n<=rating ? primary : muted }}/>
              </button>
            ))}
          </div>
        </Section>

        <Section label="Would you talk to them again?">
          <div className="flex gap-2">
            <button onClick={()=>setAgain(true)} className="flex-1 py-3 rounded-2xl text-[12.5px]"
              style={{ background: again===true ? ink : surface, color: again===true ? surface : ink, border: `1px solid ${border}` }}>💛 yes, definitely</button>
            <button onClick={()=>setAgain(false)} className="flex-1 py-3 rounded-2xl text-[12.5px]"
              style={{ background: again===false ? ink : surface, color: again===false ? surface : ink, border: `1px solid ${border}` }}>maybe not</button>
          </div>
        </Section>

        <Section label="Anything you'd like to share? (optional)">
          <textarea rows={3} value={feedback} onChange={(e)=>setFeedback(e.target.value)}
            placeholder="what helped, what didn't, what you appreciated…"
            className="w-full rounded-2xl p-4 text-[13px] outline-none resize-none"
            style={{ background: surface, border: `1px solid ${border}`, color: ink }}/>
        </Section>

        <Section label="Suggestions for the platform (optional)">
          <input value={suggestion} onChange={(e)=>setSuggestion(e.target.value)}
            placeholder="one thing that would make peace buddies better…"
            className="w-full rounded-2xl p-4 text-[13px] outline-none"
            style={{ background: surface, border: `1px solid ${border}`, color: ink }}/>
        </Section>

        <div className="flex gap-2 mt-8">
          <button onClick={()=>navigate({ to: "/buddies" })} className="px-5 py-3 rounded-full text-[12px]" style={{ background: surface2, color: ink }}>Skip</button>
          <button onClick={submit} className="flex-1 px-5 py-3 rounded-full text-[12px] flex items-center justify-center gap-1.5" style={{ background: ink, color: surface }}>
            <Heart className="w-3.5 h-3.5"/> Submit & finish
          </button>
        </div>
      </main>
    </AppShell>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { muted } = palette;
  return <div className="mb-6"><div className="text-[10px] tracking-[0.3em] uppercase mb-2.5" style={{ color: muted }}>{label}</div>{children}</div>;
}
