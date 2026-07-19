import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, rupee, fmtDay, fmtTime } from "./counselling";
import { getAppointment, getExpert, photoFor, updateAppointment, cancelAppointment, addDoc, listDocs } from "@/lib/counselling-store";
import { useEffect, useState } from "react";
import { ArrowLeft, Video, Phone, MessageSquare, Upload, MessageCircle, CalendarClock, X, Check, FileText } from "lucide-react";

export const Route = createFileRoute("/counselling/appt/$aid")({
  component: AppointmentDashboard,
});

function AppointmentDashboard() {
  const { aid } = useParams({ from: "/counselling/appt/$aid" });
  const navigate = useNavigate();
  const { ink, muted, primary, surface, surface2, border, soft } = palette;
  const [tick, setTick] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);

  const a = getAppointment(aid);
  const e = a ? getExpert(a.expertId) : null;
  if (!a || !e) return <Card><div className="font-serif text-[20px]" style={{ color: ink }}>Session not found.</div></Card>;

  const ms = a.scheduledFor - Date.now();
  const canJoin = ms < 10 * 60_000 && ms > -60 * 60_000;
  const d = Math.abs(ms);
  const day = Math.floor(d / 86_400_000);
  const hr = Math.floor((d % 86_400_000) / 3_600_000);
  const min = Math.floor((d % 3_600_000) / 60_000);
  const sec = Math.floor((d % 60_000) / 1000);
  void tick;

  const ModeIcon = a.mode === "video" ? Video : a.mode === "audio" ? Phone : MessageSquare;

  const onFilePicked = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]; if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const kind = ["png","jpg","jpeg","webp","gif"].includes(ext) ? "image" as const
      : ext === "pdf" ? "pdf" as const
      : ext.match(/^(docx?|txt|md)$/) ? "medical" as const
      : "medical" as const;
    const d = addDoc({ name: f.name, kind, size: f.size, sharedWith: [e.id] });
    updateAppointment(a.id, {});
    setUploadNote(`Shared “${d.name}” with ${e.name}. Only they can open it.`);
    ev.target.value = "";
  };

  return (
    <>
      <Link to="/counselling/upcoming" className="inline-flex items-center gap-1.5 text-[12.5px] mb-3" style={{ color: muted }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to upcoming
      </Link>

      <Card className="mb-4" style={{ background: `linear-gradient(180deg, ${soft} 0%, ${surface} 100%)` }}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <img src={photoFor(e.id)} alt="" className="w-16 h-16 rounded-2xl" style={{ background: surface2 }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Session with</div>
            <div className="font-serif text-[24px]" style={{ color: ink }}>{e.name}</div>
            <div className="text-[13px]" style={{ color: muted }}>{fmtDay(a.scheduledFor)} · {fmtTime(a.scheduledFor)} · {a.duration} min · {a.mode}</div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>{ms > 0 ? "Starts in" : "Started"}</div>
            <div className="font-serif text-[26px] tabular-nums" style={{ color: ink }}>
              {day > 0 && `${day}d `}{String(hr).padStart(2, "0")}:{String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            disabled={!canJoin || a.status === "cancelled" || a.status === "completed"}
            onClick={() => navigate({ to: "/counselling/session/$aid", params: { aid: a.id } })}
            className="rounded-full px-5 py-2.5 text-[13.5px] inline-flex items-center gap-2 disabled:opacity-40"
            style={{ background: ink, color: "#fff" }}>
            <ModeIcon className="w-4 h-4" /> Join session
          </button>
          <Link to="/counselling/messages" className="rounded-full px-4 py-2.5 text-[13px] inline-flex items-center gap-2" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
            <MessageCircle className="w-4 h-4" /> Message
          </Link>
          <label className="rounded-full px-4 py-2.5 text-[13px] inline-flex items-center gap-2 cursor-pointer" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
            <Upload className="w-4 h-4" /> Upload document
            <input type="file" className="hidden" onChange={onFilePicked} />
          </label>
          <Link to="/counselling/experts" className="rounded-full px-4 py-2.5 text-[13px] inline-flex items-center gap-2" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
            <CalendarClock className="w-4 h-4" /> Reschedule
          </Link>
          <button onClick={() => setConfirmCancel(true)} className="rounded-full px-4 py-2.5 text-[13px] inline-flex items-center gap-2" style={{ background: "#fff1f0", color: "#9a1c1c", border: "1px solid #f6c9c4" }}>
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
        {!canJoin && ms > 0 && <p className="mt-3 text-[12px]" style={{ color: muted }}>Join opens 10 minutes before your session.</p>}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="font-serif text-[18px] mb-3" style={{ color: ink }}>Pre-session checklist</div>
          <ul className="space-y-2 text-[13.5px]">
            {[
              "Find a quiet room where you won't be interrupted.",
              "Test your camera and mic if it's a video session.",
              "Have water, tissues, and a notebook nearby.",
              "Review your intake responses if you'd like.",
              "It's okay to arrive with nothing to say. That's often the beginning.",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: ink }}>
                <Check className="w-4 h-4 mt-0.5 flex-none" style={{ color: primary }} />{t}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="font-serif text-[18px] mb-3" style={{ color: ink }}>Session details</div>
          <div className="space-y-1.5 text-[13.5px]">
            <Row label="Reason" value={a.reason || "—"} />
            <Row label="Language" value={a.language} />
            <Row label="Mode" value={a.mode} />
            <Row label="Duration" value={`${a.duration} min`} />
            <Row label="Fee" value={rupee(a.fee)} />
            <Row label="Status" value={a.status} />
          </div>
          {a.notes && (
            <div className="mt-3 rounded-2xl p-3" style={{ background: surface2 }}>
              <div className="text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>Your notes</div>
              <p className="text-[13.5px]" style={{ color: ink }}>{a.notes}</p>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="font-serif text-[18px]" style={{ color: ink }}>Shared documents</div>
            <label className="text-[12.5px] inline-flex items-center gap-1.5 cursor-pointer" style={{ color: muted }}>
              <Upload className="w-3.5 h-3.5" /> Upload
              <input type="file" className="hidden" onChange={onFilePicked} />
            </label>
          </div>
          {uploadNote && <div className="mb-2 rounded-2xl px-3 py-2 text-[12.5px]" style={{ background: soft, color: ink }}>{uploadNote}</div>}
          <SharedDocs expertId={e.id} />
        </Card>
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,20,30,0.35)" }} onClick={() => setConfirmCancel(false)}>
          <div className="w-full max-w-md rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }} onClick={(ev) => ev.stopPropagation()}>
            <div className="font-serif text-[20px] mb-1" style={{ color: ink }}>Cancel this session?</div>
            <p className="text-[13.5px] mb-4" style={{ color: muted }}>{e.cancellationPolicy}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmCancel(false)} className="rounded-full px-4 py-2 text-[13px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Keep session</button>
              <button onClick={() => { cancelAppointment(a.id); setConfirmCancel(false); navigate({ to: "/counselling/history" }); }} className="rounded-full px-4 py-2 text-[13px]" style={{ background: "#9a1c1c", color: "#fff" }}>Cancel session</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SharedDocs({ expertId }: { expertId: string }) {
  const { ink, muted, border, surface2 } = palette;
  const [tick, setTick] = useState(0);
  useEffect(() => { const h = () => setTick(x => x + 1); window.addEventListener("storage", h); return () => window.removeEventListener("storage", h); }, []);
  void tick;
  const docs = listDocs().filter(d => (d.sharedWith ?? []).includes(expertId));
  if (docs.length === 0) return <p className="text-[13.5px]" style={{ color: muted }}>No documents shared with this counsellor yet.</p>;
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {docs.map(d => (
        <div key={d.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: surface2, border: `1px solid ${border}` }}>
          <FileText className="w-4 h-4" style={{ color: muted }} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] truncate" style={{ color: ink }}>{d.name}</div>
            <div className="text-[11px]" style={{ color: muted }}>{d.kind} · {(d.size/1024).toFixed(0)} KB</div>
          </div>
        </div>
      ))}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  const { ink, muted } = palette;
  return <div className="flex justify-between"><span style={{ color: muted }}>{label}</span><span className="capitalize" style={{ color: ink }}>{value}</span></div>;
}
