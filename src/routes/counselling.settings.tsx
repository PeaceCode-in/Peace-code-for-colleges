import { createFileRoute } from "@tanstack/react-router";
import { palette } from "@/components/AppShell";
import { Card, Chip } from "./counselling";
import { getPrefs, setPrefs, type Prefs } from "@/lib/counselling-store";
import { useEffect, useState } from "react";
import { Plus, X, Download, Trash2 } from "lucide-react";

export const Route = createFileRoute("/counselling/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { ink, muted, surface, surface2, border } = palette;
  const [p, setP] = useState<Prefs>(getPrefs());
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cRel, setCRel] = useState("");

  useEffect(() => setPrefs(p), [p]);

  const addContact = () => {
    if (!cName.trim() || !cPhone.trim()) return;
    setP({ ...p, emergencyContacts: [...p.emergencyContacts, { name: cName, phone: cPhone, relation: cRel }] });
    setCName(""); setCPhone(""); setCRel("");
  };

  const removeContact = (i: number) => setP({ ...p, emergencyContacts: p.emergencyContacts.filter((_, x) => x !== i) });

  return (
    <>
      <div className="mb-4">
        <div className="text-[10.5px] uppercase tracking-[0.18em]" style={{ color: muted }}>Settings</div>
        <h1 className="font-serif text-[26px]" style={{ color: ink }}>How you'd like your care</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="font-serif text-[17px] mb-3" style={{ color: ink }}>Notifications</div>
          {(["appointment","homework","assessment","messages","exercises","followUp"] as const).map(k => (
            <label key={k} className="flex items-center justify-between py-2 text-[13.5px]" style={{ color: ink, borderBottom: `1px solid ${border}` }}>
              <span className="capitalize">{k}</span>
              <input type="checkbox" checked={p.notifications[k]} onChange={e => setP({ ...p, notifications: { ...p.notifications, [k]: e.target.checked } })} />
            </label>
          ))}
        </Card>

        <Card>
          <div className="font-serif text-[17px] mb-3" style={{ color: ink }}>Privacy</div>
          {[
            { k: "shareAssessments" as const, l: "Share assessment scores with counsellor" },
            { k: "shareJournal" as const, l: "Share journal entries with counsellor" },
            { k: "anonymized" as const, l: "Use anonymised name in group settings" },
          ].map(o => (
            <label key={o.k} className="flex items-center justify-between py-2 text-[13.5px]" style={{ color: ink, borderBottom: `1px solid ${border}` }}>
              <span>{o.l}</span>
              <input type="checkbox" checked={p.privacy[o.k]} onChange={e => setP({ ...p, privacy: { ...p.privacy, [o.k]: e.target.checked } })} />
            </label>
          ))}
        </Card>

        <Card>
          <div className="font-serif text-[17px] mb-2" style={{ color: ink }}>Language</div>
          <div className="flex flex-wrap gap-1.5">
            {["English","Hindi","Tamil","Bengali","Kannada","Malayalam","Marathi"].map(l => (
              <Chip key={l} active={p.language === l} onClick={() => setP({ ...p, language: l })}>{l}</Chip>
            ))}
          </div>

          <div className="font-serif text-[17px] mt-4 mb-2" style={{ color: ink }}>Theme</div>
          <div className="flex gap-1.5">
            {(["system","light","dark"] as const).map(t => (
              <Chip key={t} active={p.theme === t} onClick={() => setP({ ...p, theme: t })}>{t}</Chip>
            ))}
          </div>

          <div className="font-serif text-[17px] mt-4 mb-2" style={{ color: ink }}>Accessibility</div>
          <label className="flex items-center justify-between py-2 text-[13.5px]" style={{ color: ink }}>
            <span>Font scale · {(p.accessibility.fontScale * 100).toFixed(0)}%</span>
            <input type="range" min={0.85} max={1.3} step={0.05} value={p.accessibility.fontScale} onChange={e => setP({ ...p, accessibility: { ...p.accessibility, fontScale: parseFloat(e.target.value) } })} />
          </label>
          <label className="flex items-center justify-between py-2 text-[13.5px]" style={{ color: ink, borderTop: `1px solid ${border}` }}>
            <span>Reduce motion</span>
            <input type="checkbox" checked={p.accessibility.reducedMotion} onChange={e => setP({ ...p, accessibility: { ...p.accessibility, reducedMotion: e.target.checked } })} />
          </label>
        </Card>

        <Card>
          <div className="font-serif text-[17px] mb-3" style={{ color: ink }}>Emergency contacts</div>
          <div className="space-y-2 mb-3">
            {p.emergencyContacts.map((c, i) => (
              <div key={i} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: surface2, border: `1px solid ${border}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px]" style={{ color: ink }}>{c.name} <span style={{ color: muted }}>· {c.relation}</span></div>
                  <div className="text-[12px]" style={{ color: muted }}>{c.phone}</div>
                </div>
                <button onClick={() => removeContact(i)}><X className="w-4 h-4" style={{ color: muted }} /></button>
              </div>
            ))}
            {p.emergencyContacts.length === 0 && <p className="text-[13px]" style={{ color: muted }}>No contacts added.</p>}
          </div>
          <div className="grid sm:grid-cols-3 gap-2">
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Name" className="rounded-2xl px-3 py-2 text-[13px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
            <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="Phone" className="rounded-2xl px-3 py-2 text-[13px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
            <input value={cRel} onChange={e => setCRel(e.target.value)} placeholder="Relation" className="rounded-2xl px-3 py-2 text-[13px] outline-none" style={{ background: surface, color: ink, border: `1px solid ${border}` }} />
          </div>
          <button onClick={addContact} className="mt-3 rounded-full px-3 py-1.5 text-[12.5px] inline-flex items-center gap-1" style={{ background: ink, color: "#fff" }}><Plus className="w-3.5 h-3.5" /> Add contact</button>
        </Card>

        <Card className="lg:col-span-2">
          <div className="font-serif text-[17px] mb-2" style={{ color: ink }}>Your data</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => {
              const data = JSON.stringify({ ...getPrefs() }, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "peacecode-counselling-export.json"; a.click(); URL.revokeObjectURL(url);
            }} className="rounded-full px-4 py-2 text-[12.5px] inline-flex items-center gap-1.5" style={{ background: surface, color: ink, border: `1px solid ${border}` }}>
              <Download className="w-3.5 h-3.5" /> Export data
            </button>
            <button onClick={() => { if (confirm("This clears all counselling data on this device. Continue?")) { Object.keys(localStorage).filter(k => k.startsWith("peacecode.counsel.")).forEach(k => localStorage.removeItem(k)); window.location.reload(); } }} className="rounded-full px-4 py-2 text-[12.5px] inline-flex items-center gap-1.5" style={{ background: "#fff1f0", color: "#9a1c1c", border: "1px solid #f6c9c4" }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete counselling data
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
