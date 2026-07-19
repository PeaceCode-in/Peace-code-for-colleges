import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Ban, CalendarPlus, Users, Clock, MapPin, Video, Sparkles, ChevronRight } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, PrimaryBtn, GhostBtn, EmptyState } from "@/components/events/primitives";
import { eventById, rsvpFor, setRsvp, clearRsvp, formatDateParts, organizerById } from "@/lib/events-store";

const { border, muted, ink, surface2, primary, soft } = palette;

const OPTIONS = [
  { key: "attend",         label: "Attend",          hint: "I'll be there.",                  tone: "primary" as const },
  { key: "maybe",          label: "Maybe",           hint: "I'll try — don't count on me.",   tone: "soft"    as const },
  { key: "waitlist",       label: "Join waitlist",   hint: "Full, but keep me in queue.",     tone: "soft"    as const },
  { key: "not_interested", label: "Not this time",   hint: "Not for me right now.",           tone: "quiet"   as const },
] as const;

function Rsvp() {
  const { id } = Route.useParams();
  const e = eventById(id);
  const [current, setCurrent] = useState<"attend" | "maybe" | "not_interested" | "waitlist" | undefined>(() => rsvpFor(id)?.status);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { setCurrent(rsvpFor(id)?.status); }, [id]);

  if (!e) {
    return (
      <Page><BackBar />
        <EmptyState title="Event not found" cta={<Link to="/events/browse"><PrimaryBtn>Browse all events</PrimaryBtn></Link>}/>
      </Page>
    );
  }

  const org = organizerById(e.organizerId);
  const { weekday, month, day, time } = formatDateParts(e.date);

  const commit = () => {
    if (!current) return;
    setRsvp(id, current);
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <Page>
        <BackBar to={`/events/${id}`} label="Back to event" />
        <Card className="text-center max-w-xl mx-auto py-10">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: soft, opacity: 0.6 }}/>
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                 style={{ background: soft, color: primary }}>
              <Check className="w-8 h-8" strokeWidth={1.8}/>
            </div>
          </div>
          <h2 className="font-serif text-[26px] mt-6" style={{ color: ink }}>
            {current === "attend" ? "You're going." :
             current === "maybe"  ? "Marked as maybe." :
             current === "waitlist" ? "Added to the waitlist." :
             "Marked not interested."}
          </h2>
          <p className="text-[13px] mt-2" style={{ color: muted }}>{e.title} · {weekday}, {month} {day} at {time}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/events/$id" params={{ id }}><GhostBtn>Back to event</GhostBtn></Link>
            <Link to="/events/$id/timeline" params={{ id }}><GhostBtn><Clock className="w-3.5 h-3.5"/> View timeline</GhostBtn></Link>
            <Link to="/events/my"><PrimaryBtn><CalendarPlus className="w-3.5 h-3.5"/> My events</PrimaryBtn></Link>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <BackBar to={`/events/${id}`} label="Back to event" />
      <PageTitle eyebrow="RSVP" title="Pick what fits — you can change anytime." />

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Chip tone="outline">{e.category}</Chip>
            <Chip tone="outline">{e.language}</Chip>
          </div>
          <h2 className="font-serif text-[22px]" style={{ color: ink }}>{e.title}</h2>
          <p className="text-[12.5px] mt-2" style={{ color: muted }}>{e.tagline}</p>
          <div className="mt-4 grid gap-2 text-[12.5px]" style={{ color: muted }}>
            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5"/>{weekday}, {month} {day} · {time}</div>
            <div className="flex items-center gap-2">{e.mode === "online" ? <Video className="w-3.5 h-3.5"/> : <MapPin className="w-3.5 h-3.5"/>}{e.location}</div>
            <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5"/>{e.registered} / {e.capacity} joined</div>
            {org && <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5"/>Hosted by {org.name}</div>}
          </div>
        </Card>

        <div>
          <div className="grid gap-3">
            {OPTIONS.map((o) => {
              const active = current === o.key;
              return (
                <button key={o.key} onClick={() => setCurrent(o.key)}
                  className="text-left rounded-[22px] p-5 transition hover:-translate-y-[1px]"
                  style={{
                    background: active ? soft : surface2,
                    border: `1px solid ${active ? primary : border}`,
                    color: ink,
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="font-serif text-[17px]">{o.label}</div>
                    {active && <Check className="w-4 h-4" style={{ color: primary }}/>}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: muted }}>{o.hint}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <PrimaryBtn onClick={commit} disabled={!current}>
              Confirm RSVP <ChevronRight className="w-3.5 h-3.5"/>
            </PrimaryBtn>
            {rsvpFor(id) && (
              <button onClick={() => { clearRsvp(id); setCurrent(undefined); }}
                className="text-[12px] rounded-full h-11 px-4 inline-flex items-center gap-1.5"
                style={{ background: "transparent", color: "#c14545", border: `1px solid ${border}` }}>
                <Ban className="w-3.5 h-3.5"/> Cancel existing RSVP
              </button>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/rsvp")({ component: Rsvp });
