import { createFileRoute } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card } from "./counselling";
import { addMed, listMeds, removeMed, upsertMed } from "@/lib/counselling-store";
import { useState } from "react";
import { Pill, Bell, X, Info } from "lucide-react";

export const Route = createFileRoute("/counselling/medication")({
  component: Medication,
});

function Medication() {
  const { ink, muted, primary, surface, surface2, border, soft } = palette;
  const [tick, setTick] = useState(0);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [freq, setFreq] = useState("Once daily");
  const [time, setTime] = useState("08:00");
  const [notes, setNotes] = useState("");

  const list = listMeds();

  const add = () => {
    if (!name.trim()) return;
    addMed({ name, dosage, frequency: freq, reminderAt: time, notes });
    setName(""); setDosage(""); setNotes(""); setTick(x=>x+1);
  };

  return (
    <>
      <div className="mb-4">
        <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Medication</div>
        <h1 className="font-serif text-[26px]" style={{ color: ink }}>Your medication tracker</h1>
      </div>

      <Card className="mb-4" style={{ background: soft }}>
        <div className="flex items-start gap-2 text-[12.5px]" style={{ color: ink }}>
          <Info className="w-4 h-4 mt-0.5 flex-none" />
          <p>PeaceCode does not prescribe medication. This is for tracking only. Discuss any changes with a qualified medical professional.</p>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="font-serif text-[17px] mb-3" style={{ color: ink }}>Add medication</div>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Sertraline)" className="rounded-2xl px-3 py-2.5 text-[13.5px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
          <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Dosage (e.g. 50 mg)" className="rounded-2xl px-3 py-2.5 text-[13.5px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
          <select value={freq} onChange={e => setFreq(e.target.value)} className="rounded-2xl px-3 py-2.5 text-[13.5px]" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
            {["Once daily","Twice daily","As needed","Every other day","Weekly"].map(f => <option key={f}>{f}</option>)}
          </select>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="rounded-2xl px-3 py-2.5 text-[13.5px]" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes (optional)" className="sm:col-span-2 rounded-2xl px-3 py-2.5 text-[13.5px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
        </div>
        <button onClick={add} className="mt-3 rounded-full px-4 py-2 text-[13px]" style={{ background: ink, color: "#fff" }}>Add</button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map(m => (
          <Card key={m.id}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: soft, color: primary }}><Pill className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-[17px]" style={{ color: ink }}>{m.name}</div>
                <div className="text-[12.5px]" style={{ color: muted }}>{m.dosage || "—"} · {m.frequency}</div>
                <div className="mt-1 flex items-center gap-1 text-[11.5px]" style={{ color: muted }}>
                  <Bell className="w-3 h-3" /> Reminder {m.reminderAt}
                </div>
                {m.notes && <p className="mt-1 text-[12.5px]" style={{ color: muted }}>{m.notes}</p>}
              </div>
              <button onClick={() => { removeMed(m.id); setTick(x=>x+1); }} className="p-1"><X className="w-4 h-4" style={{ color: muted }} /></button>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { upsertMed({ ...m, active: !m.active }); setTick(x=>x+1); }} className="rounded-full px-3 py-1.5 text-[12px]" style={{ background: m.active ? surface2 : ink, color: m.active ? ink : "#fff", border: m.active ? `1px solid ${border}` : "none" }}>
                {m.active ? "Pause" : "Resume"}
              </button>
            </div>
          </Card>
        ))}
        {list.length === 0 && <p className="text-[13px]" style={{ color: muted }}>No medications tracked yet.</p>}
      </div>
      {tick}
    </>
  );
}
