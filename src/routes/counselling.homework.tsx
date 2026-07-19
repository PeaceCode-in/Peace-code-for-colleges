import { createFileRoute } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { listHomework, toggleHomework, addHomework, getExpert } from "@/lib/counselling-store";
import { useState } from "react";
import { Wind, Feather, BookOpen, Target, ClipboardList, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/counselling/homework")({
  component: Homework,
});

function Homework() {
  const { ink, muted, primary, surface, surface2, border, soft } = palette;
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");
  const [title, setTitle] = useState("");

  const list = listHomework().filter(h => filter === "all" ? true : filter === "open" ? !h.done : h.done);
  const stats = { total: listHomework().length, done: listHomework().filter(h => h.done).length };

  const iconFor = (k: string) => k === "breathing" ? Wind : k === "reflection" ? Feather : k === "reading" ? BookOpen : k === "worksheet" ? ClipboardList : Target;

  const add = () => {
    if (!title.trim()) return;
    addHomework({ expertId: "self", title: title.trim(), kind: "habit", detail: "Personal task", due: Date.now() + 7 * 86400_000 });
    setTitle(""); setTick(x => x + 1);
  };

  return (
    <>
      <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Homework</div>
          <h1 className="font-serif text-[26px]" style={{ color: ink }}>The work between sessions</h1>
          <p className="text-[13px] mt-0.5" style={{ color: muted }}>{stats.done} of {stats.total} done</p>
        </div>
        <div className="flex gap-1.5">
          {(["open","done","all"] as const).map(f => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </div>
      </div>

      <Card className="mb-4">
        <div className="flex gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add your own task…" className="flex-1 rounded-full px-4 py-2 text-[13.5px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
          <button onClick={add} className="rounded-full px-3 py-2 text-[12.5px] inline-flex items-center gap-1" style={{ background: ink, color: "#fff" }}><Plus className="w-4 h-4" />Add</button>
        </div>
      </Card>

      {list.length === 0 && (
        <Card className="text-center py-14">
          <div className="font-serif text-[20px]" style={{ color: ink }}>Nothing here.</div>
          <p className="text-[13px]" style={{ color: muted }}>Your counsellor may add tasks after your next session.</p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map(h => {
          const Icon = iconFor(h.kind);
          const e = getExpert(h.expertId);
          return (
            <Card key={h.id}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: h.done ? "#eaf6ea" : soft, color: h.done ? "#2f6a37" : primary }}>
                  {h.done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[16px]" style={{ color: ink, textDecoration: h.done ? "line-through" : "none" }}>{h.title}</div>
                  <p className="text-[13px]" style={{ color: muted }}>{h.detail}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Chip>{h.kind}</Chip>
                    {e && h.expertId !== "self" && <Chip>from {e.name.split(" ").slice(-1)[0]}</Chip>}
                    {h.due && <Chip>by {new Date(h.due).toLocaleDateString([], { day:"numeric", month:"short"})}</Chip>}
                  </div>
                </div>
                <button onClick={() => { toggleHomework(h.id); setTick(x => x + 1); }} className="rounded-full px-3 py-1.5 text-[12px]" style={{ background: h.done ? surface2 : ink, color: h.done ? ink : "#fff", border: h.done ? `1px solid ${border}` : "none" }}>
                  {h.done ? "Undo" : "Mark done"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
      {tick}
    </>
  );
}
