import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Page, BackBar, PageTitle, Card, Chip, Field, TextInput, TextArea, PrimaryBtn, GhostBtn } from "@/components/emergency/primitives";
import { loadHope, addHope, removeHope, type HopeBoxItem } from "@/lib/emergency-store";
import { palette } from "@/components/AppShell";
import { Plus, X, Trash2, Image as ImageIcon, Music, MessageSquare, Heart, Trophy, Target, Smile, Quote, Star, Film } from "lucide-react";

const { border, muted, ink, surface2, primary, soft } = palette;

const KINDS: { k: HopeBoxItem["kind"]; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { k: "photo",       label: "Photo",       icon: ImageIcon },
  { k: "voice",       label: "Voice note",  icon: MessageSquare },
  { k: "letter",      label: "Letter",      icon: MessageSquare },
  { k: "memory",      label: "Memory",      icon: Heart },
  { k: "quote",       label: "Quote",       icon: Quote },
  { k: "achievement", label: "Achievement", icon: Trophy },
  { k: "goal",        label: "Goal",        icon: Target },
  { k: "smile",       label: "Smile",       icon: Smile },
  { k: "dream",       label: "Dream",       icon: Star },
  { k: "video",       label: "Video",       icon: Film },
  { k: "music",       label: "Music",       icon: Music },
];

function HopeBox() {
  const [items, setItems] = useState<HopeBoxItem[]>([]);
  const [filter, setFilter] = useState<HopeBoxItem["kind"] | "all">("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<HopeBoxItem>({ id: "", kind: "memory", title: "", body: "", createdAt: 0 });

  useEffect(() => setItems(loadHope()), []);
  const list = useMemo(() => items.filter((i) => filter === "all" || i.kind === filter), [items, filter]);

  const submit = () => {
    if (!draft.title.trim()) return;
    const item: HopeBoxItem = { ...draft, id: crypto.randomUUID(), createdAt: Date.now() };
    addHope(item);
    setItems(loadHope());
    setOpen(false);
    setDraft({ id: "", kind: "memory", title: "", body: "", createdAt: 0 });
  };

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, media: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <Page>
      <BackBar />
      <PageTitle eyebrow="Hope Box" title="A private, digital comfort box." sub="Keep small things that remind you of light — photos, voice notes, letters to yourself, songs, wins." />

      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <button onClick={() => setFilter("all")} className="rounded-full h-9 px-3.5 text-[11.5px]" style={{ background: filter === "all" ? ink : surface2, color: filter === "all" ? "var(--pc-bg)" : muted, border: `1px solid ${filter === "all" ? ink : border}` }}>All</button>
        {KINDS.map(({ k, label }) => (
          <button key={k} onClick={() => setFilter(k)} className="rounded-full h-9 px-3.5 text-[11.5px]" style={{ background: filter === k ? ink : surface2, color: filter === k ? "var(--pc-bg)" : muted, border: `1px solid ${filter === k ? ink : border}` }}>{label}</button>
        ))}
        <div className="ml-auto"><PrimaryBtn onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5"/> Add to box</PrimaryBtn></div>
      </div>

      {list.length === 0 ? (
        <Card><div className="text-[13px]" style={{ color: muted }}>Nothing here yet. Add a photo, a memory, or a kind sentence to yourself.</div></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((h) => {
            const K = KINDS.find((k) => k.k === h.kind);
            const Icon = K?.icon ?? Heart;
            return (
              <Card key={h.id} padded={false}>
                {h.media && h.kind === "photo" && (
                  <img src={h.media} alt="" className="w-full aspect-[4/3] object-cover rounded-t-[24px]" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5 opacity-60" strokeWidth={1.6} />
                    <Chip>{K?.label ?? h.kind}</Chip>
                    <span className="text-[10.5px] ml-auto" style={{ color: muted }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="font-serif text-[16px] leading-tight">{h.title}</div>
                  {h.body && <p className="text-[12.5px] mt-2 whitespace-pre-wrap" style={{ color: muted }}>{h.body}</p>}
                  <div className="flex justify-end mt-3">
                    <button onClick={() => { removeHope(h.id); setItems(loadHope()); }} className="text-[11px] inline-flex items-center gap-1" style={{ color: "#c14545" }}>
                      <Trash2 className="w-3 h-3"/> Remove
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: "var(--pc-scrim)" }} onClick={() => setOpen(false)}/>
          <div className="relative w-full max-w-lg rounded-3xl p-5 sm:p-6" style={{ background: "var(--pc-surface)", border: `1px solid ${border}`, color: ink }}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-[18px]">Add to your Hope Box</div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: surface2 }} aria-label="close"><X className="w-4 h-4"/></button>
            </div>

            <div className="grid gap-3">
              <Field label="Kind">
                <div className="flex flex-wrap gap-1.5">
                  {KINDS.map(({ k, label }) => (
                    <button key={k} onClick={() => setDraft({ ...draft, kind: k })} className="rounded-full h-9 px-3 text-[11.5px]"
                      style={{ background: draft.kind === k ? soft : surface2, color: draft.kind === k ? primary : muted, border: `1px solid ${draft.kind === k ? primary : border}` }}>{label}</button>
                  ))}
                </div>
              </Field>
              <Field label="Title"><TextInput value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What is this?" /></Field>
              <Field label="Notes (optional)"><TextArea rows={3} value={draft.body ?? ""} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Anything you want to remember…" /></Field>
              {draft.kind === "photo" && (
                <Field label="Photo">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="text-[12px]" />
                  {draft.media && <img src={draft.media} alt="" className="w-full aspect-[4/3] object-cover rounded-2xl mt-2" />}
                </Field>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <GhostBtn onClick={() => setOpen(false)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={submit}>Save</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export const Route = createFileRoute("/emergency/hope-box")({ component: HopeBox });
