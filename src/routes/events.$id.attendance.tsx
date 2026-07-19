import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { QrCode, Check, Clock, Ban, Sparkles } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, PrimaryBtn, EmptyState } from "@/components/events/primitives";
import { eventById, attendanceFor, markAttendance, formatDateParts, statusOf } from "@/lib/events-store";

const { border, muted, ink, soft, primary, surface2 } = palette;

const OPTIONS = [
  { k: "completed", label: "Completed",  desc: "You stayed the whole time.", icon: Check,    tone: "primary" as const },
  { k: "late",      label: "Late",       desc: "You joined after start.",     icon: Clock,   tone: "warm"    as const },
  { k: "missed",    label: "Missed",     desc: "You couldn't make it.",        icon: Ban,     tone: "quiet"   as const },
] as const;

function Attendance() {
  const { id } = Route.useParams();
  const e = eventById(id);
  const [current, setCurrent] = useState<string | undefined>();
  useEffect(() => { setCurrent(attendanceFor(id)?.status); }, [id]);

  if (!e) return <Page><BackBar/><EmptyState title="Event not found" /></Page>;
  const { weekday, month, day, time } = formatDateParts(e.date);
  const status = statusOf(e);

  return (
    <Page>
      <BackBar to={`/events/${id}`} label={`Back to ${e.title}`} />
      <PageTitle eyebrow="Attendance" title="Two ways in — a code or a tap." sub="No penalty either way. Attendance just helps us learn what times work." />

      <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <Card className="text-center">
          <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>QR check-in (placeholder)</div>
          <div className="mx-auto mt-4 w-48 h-48 rounded-3xl flex items-center justify-center"
               style={{ background: soft, border: `1px solid ${border}` }}>
            <svg viewBox="0 0 100 100" width="140" height="140" aria-hidden>
              <rect width="100" height="100" rx="12" fill="white"/>
              {[...Array(10)].map((_, y) => [...Array(10)].map((_, x) => (
                <rect key={`${x}-${y}`} x={x * 9 + 5} y={y * 9 + 5} width="8" height="8"
                      fill={(x + y * 3) % 3 === 0 || (x * y) % 5 === 0 ? "#22323e" : "transparent"}/>
              )))}
              <rect x="6" y="6" width="24" height="24" rx="4" fill="white" stroke="#22323e" strokeWidth="3"/>
              <rect x="12" y="12" width="12" height="12" fill="#22323e"/>
              <rect x="70" y="6" width="24" height="24" rx="4" fill="white" stroke="#22323e" strokeWidth="3"/>
              <rect x="76" y="12" width="12" height="12" fill="#22323e"/>
            </svg>
          </div>
          <div className="text-[12px] mt-4" style={{ color: muted }}>
            Show this to the organizer, or point a phone at the code on the wall.
          </div>
          <div className="mt-4 flex justify-center">
            <Chip tone="outline"><QrCode className="w-3 h-3"/> Placeholder — not a real code</Chip>
          </div>
        </Card>

        <div>
          <Card className="mb-4">
            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Event</div>
            <div className="font-serif text-[18px] mt-0.5" style={{ color: ink }}>{e.title}</div>
            <div className="text-[12px]" style={{ color: muted }}>{weekday}, {month} {day} · {time} · {status}</div>
          </Card>

          <Card>
            <div className="text-[10.5px] uppercase tracking-wide mb-3" style={{ color: muted }}>Manual check-in</div>
            <div className="grid gap-3">
              {OPTIONS.map((o) => {
                const active = current === o.k;
                return (
                  <button key={o.k} onClick={() => { markAttendance(id, o.k as "completed" | "late" | "missed"); setCurrent(o.k); }}
                    className="text-left rounded-[22px] p-4 flex items-center gap-3 transition"
                    style={{ background: active ? soft : surface2, border: `1px solid ${active ? primary : border}`, color: ink }}>
                    <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ background: "var(--pc-surface)", color: primary }}>
                      <o.icon className="w-4 h-4"/>
                    </span>
                    <div>
                      <div className="font-serif text-[15.5px]">{o.label}</div>
                      <div className="text-[11.5px]" style={{ color: muted }}>{o.desc}</div>
                    </div>
                    {active && <Check className="w-4 h-4 ml-auto" style={{ color: primary }}/>}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/events/$id/feedback" params={{ id }}><PrimaryBtn><Sparkles className="w-3.5 h-3.5"/>Leave feedback →</PrimaryBtn></Link>
              <Link to="/events/$id" params={{ id }} className="text-[12px] rounded-full h-11 px-4 inline-flex items-center"
                    style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>Back to event</Link>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/attendance")({ component: Attendance });
