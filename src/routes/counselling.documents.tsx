import { createFileRoute } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { listDocs, addDoc, removeDoc, myCounsellors, shareDoc, type Doc, getExpert } from "@/lib/counselling-store";
import { useState } from "react";
import { Upload, FileText, Image as ImageIcon, Mic, X, Share2 } from "lucide-react";

export const Route = createFileRoute("/counselling/documents")({
  component: Documents,
});

const KINDS: Doc["kind"][] = ["medical","prescription","journal","assessment","image","voice","pdf","other"];

function Documents() {
  const { ink, muted, surface, surface2, border, soft } = palette;
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<Doc["kind"] | "all">("all");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const experts = myCounsellors();
  const docs = listDocs().filter(d => filter === "all" ? true : d.kind === filter);

  const fakeUpload = (kind: Doc["kind"]) => {
    const name = `${kind}-${new Date().toISOString().slice(0,10)}.${kind === "image" ? "jpg" : kind === "voice" ? "m4a" : "pdf"}`;
    addDoc({ name, kind, size: 200_000 + Math.floor(Math.random()*900_000) });
    setTick(x => x + 1);
  };

  const iconFor = (k: Doc["kind"]) => k === "image" ? ImageIcon : k === "voice" ? Mic : FileText;

  return (
    <>
      <div className="mb-6">
        <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Documents</div>
        <h1 className="font-serif text-[26px]" style={{ color: ink }}>Everything you've shared</h1>
        <p className="text-[13.5px] mt-1" style={{ color: muted }}>Reports, prescriptions, journals, voice notes — all in one place.</p>
      </div>

      <Card className="mb-4">
        <div className="text-[10.5px] uppercase tracking-[0.18em] mb-2" style={{ color: muted }}>Upload</div>
        <div className="flex flex-wrap gap-2">
          {(["medical","prescription","journal","assessment","image","voice","pdf"] as Doc["kind"][]).map(k => (
            <button key={k} onClick={() => fakeUpload(k)} className="rounded-full px-3 py-1.5 text-[12.5px] inline-flex items-center gap-1.5" style={{ background: surface2, color: ink, border: `1px solid ${border}` }}>
              <Upload className="w-3.5 h-3.5" /> {k}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>all</Chip>
        {KINDS.map(k => <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{k}</Chip>)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map(d => {
          const Icon = iconFor(d.kind);
          const sharedNames = (d.sharedWith ?? []).map(id => getExpert(id)?.name).filter(Boolean);
          return (
            <Card key={d.id}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: soft }}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] truncate" style={{ color: ink }}>{d.name}</div>
                  <div className="text-[11.5px]" style={{ color: muted }}>{d.kind} · {(d.size/1024).toFixed(0)} KB · {new Date(d.uploadedAt).toLocaleDateString()}</div>
                  {sharedNames.length > 0 && <div className="mt-1 text-[11px]" style={{ color: muted }}>Shared with {sharedNames.join(", ")}</div>}
                </div>
                <button onClick={() => { removeDoc(d.id); setTick(x => x + 1); }} className="p-1"><X className="w-4 h-4" style={{ color: muted }} /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => setPickerFor(d.id)} className="rounded-full px-3 py-1 text-[12px] inline-flex items-center gap-1" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
                  <Share2 className="w-3 h-3" /> Share
                </button>
              </div>
              {pickerFor === d.id && (
                <div className="mt-2 rounded-2xl p-2 flex flex-wrap gap-1.5" style={{ background: surface2, border: `1px solid ${border}` }}>
                  {experts.length === 0 && <div className="text-[12px] p-1" style={{ color: muted }}>Book a session to share documents.</div>}
                  {experts.map(e => (
                    <button key={e.id} onClick={() => { shareDoc(d.id, e.id); setPickerFor(null); setTick(x=>x+1); }} className="rounded-full px-2.5 py-1 text-[11.5px]" style={{ background: ink, color: "#fff" }}>{e.name.split(" ").slice(-1)}</button>
                  ))}
                  <button onClick={() => setPickerFor(null)} className="rounded-full px-2.5 py-1 text-[11.5px]" style={{ background: surface, color: muted, border: `1px solid ${border}` }}>Cancel</button>
                </div>
              )}
            </Card>
          );
        })}
        {docs.length === 0 && <p className="text-[13px]" style={{ color: muted }}>No documents yet. Upload something above.</p>}
      </div>
    </>
  );
}
