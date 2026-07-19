import { createFileRoute, Link } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { listGoals, addGoal, bumpGoal, removeGoal, listHomework, seedIfEmpty } from "@/lib/counselling-store";
import { useEffect, useState } from "react";
import { Plus, Check, X, Sparkles } from "lucide-react";

export const Route = createFileRoute("/counselling/wellness")({
  component: Wellness,
});

function Wellness() {
  const { ink, muted, primary, surface, surface2, border, soft } = palette;
  const [tick, setTick] = useState(0);
  const [newGoal, setNewGoal] = useState("");
  const [cadence, setCadence] = useState<"daily" | "weekly">("daily");

  useEffect(() => { seedIfEmpty(); }, []);
  const goals = listGoals();
  const daily = goals.filter(g => g.cadence === "daily");
  const weekly = goals.filter(g => g.cadence === "weekly");
  const homework = listHomework().filter(h => !h.done).slice(0, 5);

  const add = () => { if (!newGoal.trim()) return; addGoal(newGoal.trim(), cadence); setNewGoal(""); setTick(x => x + 1); };

  return (
    <>
      <div className="mb-6">
        <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Wellness plan</div>
        <h1 className="font-serif text-[28px]" style={{ color: ink }}>Small things, repeated.</h1>
        <p className="text-[13.5px] mt-1" style={{ color: muted }}>Built with your counsellor. Update as you go — nothing has to be perfect.</p>
      </div>

      <Card className="mb-4" style={{ background: `linear-gradient(180deg, ${soft} 0%, ${surface} 100%)` }}>
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] mb-1" style={{ color: muted }}>
          <Sparkles className="w-3.5 h-3.5" /> This week
        </div>
        <p className="font-serif text-[18px] leading-snug" style={{ color: ink }}>
          {(() => {
            const focus = [...daily, ...weekly].filter(g => g.progress < 100).slice(0, 3);
            if (focus.length === 0) return "Add one small habit below and we'll build the week around it.";
            const parts = focus.map(g => g.title.replace(/\.$/, ""));
            return parts.join(". ") + ".";
          })()}
        </p>
        {[...daily, ...weekly].length > 0 && (
          <div className="mt-2 text-[12px]" style={{ color: muted }}>
            Overall progress · {Math.round([...daily, ...weekly].reduce((s, g) => s + g.progress, 0) / [...daily, ...weekly].length)}%
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="font-serif text-[17px]" style={{ color: ink }}>Daily</div>
            <span className="text-[11.5px]" style={{ color: muted }}>{daily.length} habits</span>
          </div>
          <GoalList list={daily} onBump={(id) => { bumpGoal(id); setTick(x => x + 1); }} onRemove={(id) => { removeGoal(id); setTick(x => x + 1); }} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="font-serif text-[17px]" style={{ color: ink }}>Weekly</div>
            <span className="text-[11.5px]" style={{ color: muted }}>{weekly.length} goals</span>
          </div>
          <GoalList list={weekly} onBump={(id) => { bumpGoal(id); setTick(x => x + 1); }} onRemove={(id) => { removeGoal(id); setTick(x => x + 1); }} />
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={newGoal} onChange={e => setNewGoal(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add a new habit or weekly goal…" className="flex-1 rounded-full px-4 py-2.5 text-[13.5px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
            <div className="flex gap-1.5">
              <Chip active={cadence === "daily"} onClick={() => setCadence("daily")}>Daily</Chip>
              <Chip active={cadence === "weekly"} onClick={() => setCadence("weekly")}>Weekly</Chip>
              <button onClick={add} className="rounded-full px-3 py-1.5 text-[12.5px] inline-flex items-center gap-1" style={{ background: ink, color: "#fff" }}><Plus className="w-4 h-4" /> Add</button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="font-serif text-[17px]" style={{ color: ink }}>Homework from your counsellor</div>
            <Link to="/counselling/homework" className="text-[12.5px]" style={{ color: muted }}>Open all</Link>
          </div>
          {homework.length === 0 ? (
            <p className="text-[13.5px]" style={{ color: muted }}>Nothing outstanding. Nice.</p>
          ) : (
            <ul className="space-y-2">
              {homework.map(h => (
                <li key={h.id} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: surface2, border: `1px solid ${border}` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-none" style={{ background: soft, color: primary }}><Check className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] truncate" style={{ color: ink }}>{h.title}</div>
                    <div className="text-[12px]" style={{ color: muted }}>{h.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function GoalList({ list, onBump, onRemove }: { list: ReturnType<typeof listGoals>; onBump: (id: string) => void; onRemove: (id: string) => void }) {
  const { ink, muted, primary, surface2 } = palette;
  if (list.length === 0) return <p className="text-[13px]" style={{ color: muted }}>Nothing here yet — add something small.</p>;
  return (
    <div className="space-y-3">
      {list.map(g => (
        <div key={g.id} className="rounded-2xl p-3" style={{ background: surface2 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex-1 text-[13.5px]" style={{ color: ink }}>{g.title}</div>
            <button onClick={() => onBump(g.id)} className="rounded-full px-2 py-1 text-[11.5px]" style={{ background: primary, color: "#fff" }}>+20%</button>
            <button onClick={() => onRemove(g.id)} className="rounded-full p-1"><X className="w-3.5 h-3.5" style={{ color: muted }} /></button>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
            <div style={{ width: `${g.progress}%`, height: "100%", background: primary, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
