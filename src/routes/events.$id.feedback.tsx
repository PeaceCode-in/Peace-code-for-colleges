import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Star, Heart, Sparkles, Send, Check } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Field, TextArea, PrimaryBtn, GhostBtn, EmptyState, Chip } from "@/components/events/primitives";
import { eventById, feedbackFor, saveFeedback } from "@/lib/events-store";

const { border, muted, ink, soft, primary, surface2 } = palette;

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <div className="text-[10.5px] tracking-[0.22em] uppercase mb-1.5" style={{ color: muted }}>{label}</div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} aria-label={`${n} stars`}
            className="w-10 h-10 rounded-2xl inline-flex items-center justify-center transition hover:-translate-y-[1px]"
            style={{ background: n <= value ? soft : surface2, border: `1px solid ${n <= value ? primary : border}`, color: n <= value ? primary : muted }}>
            <Star className="w-4 h-4" fill={n <= value ? primary : "none"} strokeWidth={1.5}/>
          </button>
        ))}
      </div>
    </div>
  );
}

function Feedback() {
  const { id } = Route.useParams();
  const e = eventById(id);
  const existing = eventById(id) ? feedbackFor(id) : undefined;

  const [event, setEvent] = useState(existing?.event ?? 0);
  const [speaker, setSpeaker] = useState(existing?.speaker ?? 0);
  const [venue, setVenue] = useState(existing?.venue ?? 0);
  const [again, setAgain] = useState(existing?.again ?? true);
  const [moment, setMoment] = useState(existing?.moment ?? "");
  const [suggestion, setSuggestion] = useState(existing?.suggestion ?? "");
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(false); }, [event, speaker, venue, again, moment, suggestion]);

  if (!e) return <Page><BackBar/><EmptyState title="Event not found" /></Page>;

  const submit = () => {
    saveFeedback({ eventId: id, event, speaker, venue, again, moment, suggestion, at: Date.now() });
    setSaved(true);
  };

  if (saved) {
    return (
      <Page>
        <BackBar to={`/events/${id}`} label={`Back to ${e.title}`} />
        <Card className="text-center max-w-lg mx-auto py-10">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: soft, color: primary }}>
            <Check className="w-6 h-6"/>
          </div>
          <h2 className="font-serif text-[24px] mt-5" style={{ color: ink }}>Thank you — we read every line.</h2>
          <p className="text-[12.5px] mt-2" style={{ color: muted }}>Your feedback quietly shapes the next event.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to="/events/$id/certificate" params={{ id }}><PrimaryBtn><Sparkles className="w-3.5 h-3.5"/>See certificate</PrimaryBtn></Link>
            <Link to="/events"><GhostBtn>Discover more events</GhostBtn></Link>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <BackBar to={`/events/${id}`} label={`Back to ${e.title}`} />
      <PageTitle eyebrow="Feedback" title="How did it land?" sub="Short is fine. Only you and the organizer see this." />

      <Card>
        <div className="grid gap-5 sm:grid-cols-3">
          <Stars value={event}   onChange={setEvent}   label="The event" />
          <Stars value={speaker} onChange={setSpeaker} label="Speaker" />
          <Stars value={venue}   onChange={setVenue}   label="Venue / format" />
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Favourite moment">
            <TextArea rows={3} value={moment} onChange={(e) => setMoment(e.target.value)} placeholder="One line — a moment that stayed with you." />
          </Field>
          <Field label="Suggestion for next time">
            <TextArea rows={3} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} placeholder="Anything the organizer should try differently." />
          </Field>
        </div>

        <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: ink }}>
            <input type="checkbox" checked={again} onChange={(e) => setAgain(e.target.checked)}
              className="w-4 h-4 rounded" style={{ accentColor: primary as string }}/>
            <Heart className="w-3.5 h-3.5" style={{ color: primary }}/> I'd attend again.
          </label>
          <div className="flex gap-2">
            <Link to="/events/$id" params={{ id }}><GhostBtn>Skip</GhostBtn></Link>
            <PrimaryBtn onClick={submit}><Send className="w-3.5 h-3.5"/> Submit feedback</PrimaryBtn>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex items-center gap-2 text-[11.5px]" style={{ color: muted }}>
        <Chip tone="outline">Anonymous to peers</Chip>
        <Chip tone="outline">Rate is optional</Chip>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/feedback")({ component: Feedback });
