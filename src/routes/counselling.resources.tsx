import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { RESOURCES, type Resource } from "@/lib/counselling-store";
import { useMemo, useState } from "react";
import { Play, FileText, Download, Search, Headphones, Video, X, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/counselling/resources")({
  component: Resources,
});

const KINDS: Resource["kind"][] = ["article","video","worksheet","meditation","podcast","download"];

function Resources() {
  const { ink, muted, primary, surface, surface2, border, soft } = palette;
  const [q, setQ] = useState("");
  const [kinds, setKinds] = useState<Resource["kind"][]>([]);
  const [open, setOpen] = useState<Resource | null>(null);

  const list = useMemo(() => RESOURCES.filter(r => {
    if (kinds.length && !kinds.includes(r.kind)) return false;
    if (q && !`${r.title} ${r.topic} ${r.blurb}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, kinds]);

  const iconFor = (k: Resource["kind"]) => k === "video" ? Video : k === "podcast" ? Headphones : k === "download" ? Download : k === "worksheet" ? FileText : Play;

  const toggle = (k: Resource["kind"]) => setKinds(kinds.includes(k) ? kinds.filter(x => x !== k) : [...kinds, k]);

  return (
    <>
      <div className="mb-6">
        <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Resources</div>
        <h1 className="font-serif text-[28px]" style={{ color: ink }}>Short, honest, useful.</h1>
        <p className="text-[13.5px] mt-1" style={{ color: muted }}>Reads and practices your counsellor might send you.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: surface, border: `1px solid ${border}` }}>
          <Search className="w-4 h-4" style={{ color: muted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search resources…" className="flex-1 bg-transparent outline-none text-[14px]" style={{ color: ink }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {KINDS.map(k => <Chip key={k} active={kinds.includes(k)} onClick={() => toggle(k)}>{k}</Chip>)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(r => {
          const Icon = iconFor(r.kind);
          return (
            <Card key={r.id}>
              <div className="aspect-[16/9] rounded-2xl mb-3 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${soft}, ${surface2})` }}>
                <Icon className="w-6 h-6" style={{ color: "rgba(0,0,0,0.4)" }} />
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>{r.kind} · {r.minutes ? `${r.minutes} min` : "PDF"}</div>
              <div className="font-serif text-[17px] mt-0.5" style={{ color: ink }}>{r.title}</div>
              <p className="text-[13px] mt-1" style={{ color: muted }}>{r.blurb}</p>
              <div className="mt-3 flex items-center justify-between">
                <Chip>{r.topic}</Chip>
                <button onClick={() => setOpen(r)} className="text-[12.5px] underline underline-offset-2" style={{ color: ink }}>Open</button>
              </div>
            </Card>
          );
        })}
        {list.length === 0 && <p className="text-[13px]" style={{ color: muted }}>Nothing matches those filters.</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,20,30,0.35)" }} onClick={() => setOpen(null)}>
          <div className="w-full max-w-lg rounded-3xl p-6" style={{ background: surface, border: `1px solid ${border}` }} onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>{open.kind} · {open.topic} · {open.minutes ? `${open.minutes} min` : "PDF"}</div>
                <div className="font-serif text-[22px] mt-1" style={{ color: ink }}>{open.title}</div>
              </div>
              <button onClick={() => setOpen(null)} className="p-1"><X className="w-4 h-4" style={{ color: muted }} /></button>
            </div>
            <div className="aspect-[16/9] rounded-2xl mt-3 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${soft}, ${surface2})` }}>
              {(() => { const I = iconFor(open.kind); return <I className="w-8 h-8" style={{ color: primary }} />; })()}
            </div>
            <p className="mt-3 text-[13.5px]" style={{ color: ink }}>{open.blurb}</p>
            <p className="mt-2 text-[12.5px]" style={{ color: muted }}>
              This preview is curated for your session context. The full library has hundreds more like it, translated in English and Hindi.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <button onClick={() => setOpen(null)} className="rounded-full px-3.5 py-1.5 text-[12.5px]" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>Close</button>
              <Link to="/resources/library" className="rounded-full px-3.5 py-1.5 text-[12.5px] inline-flex items-center gap-1" style={{ background: ink, color: "#fff" }}>
                Open in library <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
