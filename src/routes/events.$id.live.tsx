import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Video, MessageCircle, HelpCircle, BookOpen, PenLine, Check, Circle } from "lucide-react";
import { palette } from "@/components/AppShell";
import { Page, BackBar, PageTitle, Card, Chip, PrimaryBtn, GhostBtn, SectionHead, TextArea, EmptyState } from "@/components/events/primitives";
import { eventById, statusOf, checkIn, attendanceFor, noteFor, saveNote } from "@/lib/events-store";

const { border, muted, ink, surface2, primary, soft } = palette;

function useCountdown(dateISO: string, durationMin: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const start = new Date(dateISO).getTime();
  const end = start + durationMin * 60_000;
  const before = start - now;
  const during = now - start;
  return { before, during, isLive: now >= start && now <= end, isDone: now > end, total: end - start };
}

function Live() {
  const { id } = Route.useParams();
  const e = eventById(id);
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState(false);
  useEffect(() => { if (e) { setNote(noteFor(id)); setChecked(!!attendanceFor(id)); } }, [id, e]);

  if (!e) return <Page><BackBar/><EmptyState title="Event not found" /></Page>;

  const { before, during, isLive, isDone, total } = useCountdown(e.date, e.durationMin);
  const pct = isLive ? Math.min(100, (during / total) * 100) : (isDone ? 100 : 0);

  const fmt = (ms: number) => {
    const abs = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    return `${h > 0 ? h + "h " : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };
  const status = statusOf(e);

  return (
    <Page wide>
      <BackBar to={`/events/${id}`} label={`Back to ${e.title}`} />
      <PageTitle
        eyebrow={isLive ? "Live now" : isDone ? "Session ended" : "Not started yet"}
        title={e.title}
        sub={e.tagline}
        right={<Chip tone={isLive ? "primary" : "outline"}>
          <Circle className="w-2.5 h-2.5" fill={isLive ? "#fff" : muted} strokeWidth={0}/> {status === "live" ? "Live" : status}
        </Chip>}
      />

      {/* Countdown / progress */}
      <Card className="mb-6">
        {!isLive && !isDone ? (
          <div className="text-center py-6">
            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Starts in</div>
            <div className="font-serif text-[42px] mt-1 tabular-nums" style={{ color: ink }}>{fmt(before)}</div>
            <p className="text-[12.5px] mt-2" style={{ color: muted }}>The live room opens 10 minutes before start.</p>
          </div>
        ) : isLive ? (
          <div className="text-center py-4">
            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Time remaining</div>
            <div className="font-serif text-[38px] mt-1 tabular-nums" style={{ color: ink }}>{fmt(total - during)}</div>
            <div className="h-1.5 rounded-full mt-4 max-w-md mx-auto overflow-hidden" style={{ background: border }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: primary }}/>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Session complete</div>
            <div className="font-serif text-[26px] mt-1" style={{ color: ink }}>Thanks for being here.</div>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/events/$id/feedback" params={{ id }}><PrimaryBtn>Leave feedback</PrimaryBtn></Link>
              <Link to="/events/$id/certificate" params={{ id }}><GhostBtn>Certificate</GhostBtn></Link>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        {/* Video placeholder + agenda */}
        <div className="space-y-6">
          <Card padded={false} className="overflow-hidden">
            <div className="relative aspect-video" style={{ background: soft }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                       style={{ background: "rgba(255,255,255,0.7)", color: primary, backdropFilter: "blur(8px)" }}>
                    <Video className="w-7 h-7"/>
                  </div>
                  <div className="mt-3 font-serif text-[16px]" style={{ color: ink }}>
                    {e.mode === "online" ? "Live stream placeholder" : "In-person session"}
                  </div>
                  <div className="text-[12px]" style={{ color: muted }}>{e.location}</div>
                </div>
              </div>
              {isLive && (
                <div className="absolute top-3 left-3 rounded-full px-3 h-7 text-[10.5px] flex items-center gap-1.5 text-white"
                     style={{ background: "rgba(217,72,72,0.85)" }}>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"/> LIVE
                </div>
              )}
              <div className="absolute bottom-3 right-3 rounded-full px-3 h-7 text-[11px] flex items-center gap-1.5"
                   style={{ background: "rgba(255,255,255,0.85)", color: ink, backdropFilter: "blur(8px)" }}>
                <Users className="w-3 h-3"/> {e.registered} in room
              </div>
            </div>
          </Card>

          <Card>
            <SectionHead title="Now playing" sub="Follow along with the flow." />
            <ol className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px" style={{ background: border }}/>
              {e.agenda.map((a, i) => {
                const done = isLive && i === 0;
                return (
                  <li key={i} className="relative mb-4">
                    <span className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full"
                          style={{ background: done ? primary : soft, border: `2px solid ${primary}` }}/>
                    <div className="text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>{a.time}</div>
                    <div className="font-serif text-[15px] mt-0.5" style={{ color: ink }}>{a.title}</div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <SectionHead title="Attendance" />
            {checked ? (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: soft }}>
                <Check className="w-4 h-4" style={{ color: primary }}/>
                <div className="text-[12.5px]" style={{ color: ink }}>Checked in.</div>
              </div>
            ) : (
              <PrimaryBtn onClick={() => { checkIn(id); setChecked(true); }}>
                <Check className="w-3.5 h-3.5"/> Mark me present
              </PrimaryBtn>
            )}
            <div className="text-[11.5px] mt-2" style={{ color: muted }}>
              Or open <Link to="/events/$id/attendance" params={{ id }} style={{ color: primary }}>attendance page</Link> for QR check-in.
            </div>
          </Card>

          <Card>
            <SectionHead title="Live notes" sub="Just for you — synced across your device." />
            <TextArea value={note} onChange={(ev) => setNote(ev.target.value)} rows={5} placeholder="One line — what stood out?" />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px]" style={{ color: muted }}>{note.length} chars</div>
              <GhostBtn onClick={() => saveNote(id, note)}>
                <PenLine className="w-3.5 h-3.5"/> Save note
              </GhostBtn>
            </div>
          </Card>

          <Card padded={false}>
            <div className="p-4 pb-2 text-[10.5px] uppercase tracking-wide" style={{ color: muted }}>Live tools</div>
            {[
              { to: "/events/$id/chat" as const, label: "Community chat", icon: MessageCircle },
              { to: "/resources" as const,       label: "Shared resources", icon: BookOpen },
              { to: "/peacebot" as const,        label: "PeaceBot side-chat", icon: HelpCircle },
            ].map((l) => {
              const props = l.to.includes("$id") ? { to: l.to, params: { id } } : { to: l.to };
              return (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Link key={l.to} {...(props as any)}
                      className="flex items-center gap-3 px-4 py-3 border-t transition hover:translate-x-[2px]"
                      style={{ borderColor: border, color: ink }}>
                  <l.icon className="w-3.5 h-3.5" style={{ color: muted }}/>
                  <span className="text-[13px]">{l.label}</span>
                </Link>
              );
            })}
          </Card>
        </div>
      </div>
    </Page>
  );
}

export const Route = createFileRoute("/events/$id/live")({ component: Live });
