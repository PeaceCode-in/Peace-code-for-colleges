import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ClipboardList, PlayCircle, Users, Award, Sparkles, Check } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, EmptyState, PrimaryBtn } from "@/components/events/primitives";
import { eventById, statusOf, formatDateParts, attendanceFor, feedbackFor, rsvpFor } from "@/lib/events-store";

const { border, muted, ink, soft, primary, surface2 } = palette;

function Timeline() {
  const { id } = Route.useParams();
  const e = eventById(id);
  if (!e) return <Page><BackBar/><EmptyState title="Event not found" /></Page>;

  const status = statusOf(e);
  const rsvp = rsvpFor(id);
  const att = attendanceFor(id);
  const fb = feedbackFor(id);
  const { weekday, month, day, time } = formatDateParts(e.date);

  type Stage = { key: string; icon: React.ElementType; title: string; sub: string; done: boolean; active?: boolean };
  const steps: Stage[] = [
    { key: "reg",    icon: ClipboardList, title: "Registration open", sub: `${e.registered} of ${e.capacity} spots filled`, done: true },
    { key: "rsvp",   icon: Check,         title: rsvp ? "You RSVP'd" : "RSVP", sub: rsvp ? `Status: ${rsvp.status}` : "You haven't RSVP'd yet.", done: !!rsvp },
    { key: "remind", icon: Bell,          title: "Reminders", sub: "Reminders 24h and 1h before start.", done: status !== "upcoming" || Date.now() > new Date(e.date).getTime() - 24 * 3600_000 },
    { key: "start",  icon: PlayCircle,    title: "Event starts", sub: `${weekday}, ${month} ${day} · ${time}`, done: status !== "upcoming", active: status === "live" },
    { key: "live",   icon: Users,         title: "Live event", sub: `${e.durationMin} minutes of shared time`, done: status === "completed", active: status === "live" },
    { key: "att",    icon: Check,         title: "Attendance", sub: att ? `Marked ${att.status}` : "Not marked yet", done: !!att },
    { key: "fb",     icon: Sparkles,      title: "Feedback", sub: fb ? "You've left feedback." : "Share a line if you attended.", done: !!fb },
    { key: "cert",   icon: Award,         title: "Certificate (placeholder)", sub: "Available after completion.", done: status === "completed" && !!att },
  ];

  return (
    <Page>
      <BackBar to={`/events/${id}`} label={`Back to ${e.title}`} />
      <PageTitle eyebrow="Event timeline" title="Everything that happens, in order." sub="A quiet map from RSVP through certificate." />

      <Card>
        <ol className="relative pl-8">
          <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: border }}/>
          {steps.map((s) => (
            <li key={s.key} className="relative mb-6 last:mb-0">
              <span className="absolute -left-[26px] top-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: s.done ? primary : (s.active ? soft : surface2),
                      color: s.done ? "#fff" : primary,
                      border: `2px solid ${s.done || s.active ? primary : border}`,
                    }}>
                <s.icon className="w-3 h-3"/>
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-serif text-[16px]" style={{ color: ink }}>{s.title}</div>
                {s.active && <Chip tone="warm">Now</Chip>}
                {s.done && <Chip tone="outline">Done</Chip>}
              </div>
              <div className="text-[12.5px] mt-1" style={{ color: muted }}>{s.sub}</div>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap gap-2">
          {status === "live" && <Link to="/events/$id/live" params={{ id }}><PrimaryBtn>Join live room →</PrimaryBtn></Link>}
          {status === "completed" && <Link to="/events/$id/feedback" params={{ id }}><PrimaryBtn>Leave feedback →</PrimaryBtn></Link>}
          <Link to="/events/$id" params={{ id }}
            className="text-[12px] rounded-full h-11 px-4 inline-flex items-center gap-1.5"
            style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
            Back to event
          </Link>
        </div>
      </Card>
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/timeline")({ component: Timeline });
