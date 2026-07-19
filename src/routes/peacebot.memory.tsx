import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Pin, Trash2, Edit3, Plus, Search } from "lucide-react";
import { AppShell, palette } from "@/components/AppShell";
import { loadMems, addMem, patchMem, removeMem, type Memory } from "@/lib/peacebot-store";

export const Route = createFileRoute("/peacebot/memory")({
  head: () => ({ meta: [{ title: "Peace Bot · memory" }] }),
  component: MemoryPage,
});
const { surface, surface2, border, ink, muted, primary, soft } = palette;

const CATS: { id: Memory["category"]; label: string }[] = [
  { id: "goal", label: "goals" }, { id: "dream", label: "dreams" },
  { id: "exam", label: "exams" }, { id: "friend", label: "friends" },
  { id: "preference", label: "preferences" }, { id: "habit", label: "habits" },
  { id: "note", label: "notes" },
];

function MemoryPage() {
  const [mems, setMems] = useState(() => loadMems());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Memory["category"] | "all">("all");
  const [draft, setDraft] = useState("");
  const [draftCat, setDraftCat] = useState<Memory["category"]>("note");

  const refresh = () => setMems(loadMems());

  const filtered = useMemo(() => mems.filter((m) => {
    if (cat !== "all" && m.category !== cat) return false;
    if (q && !m.text.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt - a.createdAt), [mems, cat, q]);

  const add = () => { if (!draft.trim()) return; addMem(draft.trim(), draftCat); setDraft(""); refresh(); };

  return (
    <AppShell>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <Link to="/peacebot" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: surface, border: `1px solid ${border}` }}><ArrowLeft className="w-4 h-4"/></Link>
          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase opacity-50">peace bot</div>
            <h1 className="font-serif text-[36px] leading-tight">memory</h1>
            <p className="text-[13px] mt-1" style={{ color: muted }}>what peace remembers about you — you're in control.</p>
          </div>
        </div>

        {/* composer */}
        <div className="p-5 rounded-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-3">teach peace something</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="e.g. i'm preparing for gate next feb" className="flex-1 rounded-xl px-4 h-11 bg-transparent outline-none text-[14px]" style={{ background: surface2, border: `1px solid ${border}` }}/>
            <select value={draftCat} onChange={(e) => setDraftCat(e.target.value as Memory["category"])} className="rounded-xl px-3 h-11 bg-transparent text-[13px]" style={{ background: surface2, border: `1px solid ${border}`, color: ink }}>
              {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button onClick={add} className="h-11 px-5 rounded-xl flex items-center gap-2 text-[13px]" style={{ background: ink, color: "var(--pc-bg)" }}><Plus className="w-4 h-4"/> remember</button>
          </div>
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 rounded-full h-9 flex-1 min-w-[200px]" style={{ background: surface, border: `1px solid ${border}` }}>
            <Search className="w-3.5 h-3.5 opacity-50"/>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search memories…" className="flex-1 bg-transparent outline-none text-[12px]"/>
          </div>
          <button onClick={() => setCat("all")} className="px-3 h-9 rounded-full text-[11px]" style={{ background: cat === "all" ? ink : surface, color: cat === "all" ? "var(--pc-bg)" : ink, border: `1px solid ${border}` }}>all</button>
          {CATS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className="px-3 h-9 rounded-full text-[11px] capitalize" style={{ background: cat === c.id ? ink : surface, color: cat === c.id ? "var(--pc-bg)" : ink, border: `1px solid ${border}` }}>{c.label}</button>
          ))}
        </div>

        {/* list */}
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((m) => (
            <div key={m.id} className="p-4 rounded-2xl group relative" style={{ background: surface, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] tracking-[0.3em] uppercase opacity-50">{m.category}</span>
                <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition">
                  <button onClick={() => { patchMem(m.id, { pinned: !m.pinned }); refresh(); }} aria-label="pin"><Pin className="w-3.5 h-3.5" style={{ color: m.pinned ? primary : muted }}/></button>
                  <button onClick={() => { const t = prompt("edit memory", m.text); if (t) { patchMem(m.id, { text: t }); refresh(); } }} aria-label="edit"><Edit3 className="w-3.5 h-3.5"/></button>
                  <button onClick={() => { if (confirm("forget this?")) { removeMem(m.id); refresh(); } }} aria-label="forget"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <div className="text-[14px]" style={{ color: ink }}>{m.text}</div>
              <div className="mt-2 text-[10px]" style={{ color: muted }}>saved {new Date(m.createdAt).toLocaleDateString()}</div>
              {m.pinned && <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full" style={{ background: primary }}/>}
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-2 p-8 text-center text-[13px] rounded-2xl" style={{ background: surface, border: `1px solid ${border}`, color: muted }}>no memories match — try another filter or add one above.</div>}
        </div>

        <div className="rounded-2xl p-5 text-[12px]" style={{ background: soft, color: ink }}>
          peace weaves pinned memories quietly into every reply. you can forget any of them at any time — it's your story to shape.
        </div>
      </main>
    </AppShell>
  );
}
